import {
  aipdObrigatoriaEfetiva,
  nivelPlEfetivo,
  obterRegulatorySnapshotProduto,
  plAltoRisco,
  ripdNecessarioEfetivo
} from './regulatorioSnapshot.js';
import { listarCiclosProduto } from './regulatorioCiclo.js';

const DIAS_CICLO_PARADO = 30;
const DIAS_AIPD_ALERTA = 14;

function diasDesde(data) {
  if (!data) return null;
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function notif(codigo, severidade, titulo, mensagem, extra = {}) {
  return { codigo, severidade, titulo, mensagem, ...extra };
}

async function obterVersaoAbertaProjetoId(prisma, projetoId) {
  const rows = await prisma.$queryRaw`
    SELECT "id", "titulo", "numero", "status"
    FROM "ProjetoVersao"
    WHERE "projetoId" = ${projetoId} AND "status" = 'aberta'
    ORDER BY "numero" DESC
    LIMIT 1
  `;
  return rows[0] ? { id: Number(rows[0].id), titulo: rows[0].titulo, numero: Number(rows[0].numero) } : null;
}

export async function listarNotificacoesRegulatorias(prisma, filtros = {}) {
  const notificacoes = [];
  const projetoId = filtros.projetoId ? parseInt(filtros.projetoId, 10) : null;
  const produtoIdFiltro = filtros.produtoId ? parseInt(filtros.produtoId, 10) : null;

  const whereProduto = { status: { not: 'cancelado' } };
  if (produtoIdFiltro) whereProduto.id = produtoIdFiltro;
  if (projetoId) whereProduto.projetoId = projetoId;

  const produtos = await prisma.produto.findMany({
    where: whereProduto,
    include: { projeto: { select: { id: true, nome: true } } },
    orderBy: { nome: 'asc' }
  });

  const versaoAbertaPorProjeto = new Map();

  for (const produto of produtos) {
    const snapshot = await obterRegulatorySnapshotProduto(prisma, produto.id);
    if (!snapshot) {
      notificacoes.push(
        notif(
          'SEM_SNAPSHOT',
          'MEDIO',
          `IA-First pendente — ${produto.nome}`,
          'Finalize a avaliação IA-First para habilitar o controle regulatório.',
          { produtoId: produto.id, produtoNome: produto.nome, projetoId: produto.projetoId }
        )
      );
      continue;
    }

    const pl = nivelPlEfetivo(snapshot);

    if (!snapshot.validadoConsultor) {
      notificacoes.push(
        notif(
          'VALIDACAO_PENDENTE',
          plAltoRisco(pl) ? 'ALTO' : 'MEDIO',
          `Validação consultor — ${produto.nome}`,
          'Classificação automática aguardando revisão do consultor.',
          { produtoId: produto.id, produtoNome: produto.nome, projetoId: produto.projetoId }
        )
      );
    }

    if (aipdObrigatoriaEfetiva(snapshot) && !['em_andamento', 'concluida'].includes(snapshot.aipdStatus)) {
      notificacoes.push(
        notif(
          'AIPD_PENDENTE',
          'CRITICO',
          `AIPD pendente — ${produto.nome}`,
          'Alto risco PL sem AIPD em andamento ou concluída.',
          { produtoId: produto.id, produtoNome: produto.nome, projetoId: produto.projetoId }
        )
      );
    }

    if (ripdNecessarioEfetivo(snapshot) && !snapshot.lgpdBaseLegal?.trim()) {
      notificacoes.push(
        notif(
          'LGPD_BASE_LEGAL',
          'ALTO',
          `Base legal LGPD — ${produto.nome}`,
          'RIPD provável — registrar base legal com apoio jurídico.',
          { produtoId: produto.id, produtoNome: produto.nome, projetoId: produto.projetoId }
        )
      );
    }

    let ciclosInfo = null;
    try {
      ciclosInfo = await listarCiclosProduto(prisma, produto.id);
    } catch {
      /* ignore */
    }

    const ciclo = ciclosInfo?.cicloAtual;
    if (ciclo) {
      const dias = diasDesde(ciclo.iniciadaEm);
      if (dias != null && dias >= DIAS_CICLO_PARADO) {
        notificacoes.push(
          notif(
            'CICLO_PARADO',
            'MEDIO',
            `Ciclo regulatório parado — ${produto.nome}`,
            `${ciclo.titulo} aberto há ${dias} dias sem fechamento.`,
            { produtoId: produto.id, cicloId: ciclo.id, diasAberto: dias, projetoId: produto.projetoId }
          )
        );
      }

      const pendentes = (ciclo.mitigacoes || []).filter((m) => m.status !== 'concluida');
      for (const m of pendentes) {
        const diasPrazo = diasDesde(m.prazo ? new Date(m.prazo).getTime() - Date.now() : null);
        if (m.prazo && new Date(m.prazo) < new Date()) {
          notificacoes.push(
            notif(
              'MITIGACAO_VENCIDA',
              'ALTO',
              `Mitigação vencida — ${produto.nome}`,
              `"${m.titulo}" passou do prazo.`,
              { produtoId: produto.id, mitigacaoId: m.id, cicloId: ciclo.id, projetoId: produto.projetoId }
            )
          );
        } else if (m.prazo) {
          const diasAte = Math.ceil((new Date(m.prazo) - Date.now()) / (1000 * 60 * 60 * 24));
          if (diasAte <= DIAS_AIPD_ALERTA && diasAte >= 0) {
            notificacoes.push(
              notif(
                'MITIGACAO_PRAZO_PROXIMO',
                'MEDIO',
                `Prazo próximo — ${produto.nome}`,
                `"${m.titulo}" vence em ${diasAte} dia(s).`,
                { produtoId: produto.id, mitigacaoId: m.id, cicloId: ciclo.id, projetoId: produto.projetoId }
              )
            );
          }
        }
      }

      if (ciclo.projetoVersaoId && produto.projetoId) {
        if (!versaoAbertaPorProjeto.has(produto.projetoId)) {
          const va = await obterVersaoAbertaProjetoId(prisma, produto.projetoId);
          versaoAbertaPorProjeto.set(produto.projetoId, va);
        }
        const versaoAberta = versaoAbertaPorProjeto.get(produto.projetoId);
        if (versaoAberta && versaoAberta.id !== ciclo.projetoVersaoId) {
          notificacoes.push(
            notif(
              'CICLO_VERSAO_DESATUALIZADA',
              'MEDIO',
              `Ciclo desalinhado da versão — ${produto.nome}`,
              `O ciclo aberto não está vinculado à versão atual do projeto (${versaoAberta.titulo}).`,
              {
                produtoId: produto.id,
                cicloId: ciclo.id,
                projetoVersaoAtualId: versaoAberta.id,
                projetoId: produto.projetoId
              }
            )
          );
        }
      }
    } else if (ciclosInfo?.ciclos?.some((c) => c.status === 'fechada')) {
      notificacoes.push(
        notif(
          'SEM_CICLO_ABERTO',
          'MEDIO',
          `Abrir novo ciclo — ${produto.nome}`,
          'Último ciclo regulatório foi fechado; abra o próximo para continuar mitigações.',
          { produtoId: produto.id, projetoId: produto.projetoId }
        )
      );
    }
  }

  const ordem = { CRITICO: 0, ALTO: 1, MEDIO: 2, BAIXO: 3 };
  notificacoes.sort((a, b) => (ordem[a.severidade] ?? 9) - (ordem[b.severidade] ?? 9));

  return {
    total: notificacoes.length,
    notificacoes,
    resumo: {
      criticas: notificacoes.filter((n) => n.severidade === 'CRITICO').length,
      altas: notificacoes.filter((n) => n.severidade === 'ALTO').length
    }
  };
}

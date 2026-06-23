import {
  DISCLAIMER_REGULATORIO,
  resumoRegulatorioProjeto
} from './regulatorioCrosswalk.js';
import {
  nivelPlEfetivo,
  obterRegulatorySnapshotProduto,
  plAltoRisco,
  aipdObrigatoriaEfetiva,
  ripdNecessarioEfetivo
} from './regulatorioSnapshot.js';
import { listarCiclosProduto } from './regulatorioCiclo.js';
import { listarNotificacoesRegulatorias } from './regulatorioNotificacoes.js';

import { ordenarAreasPorFramework } from './ordemDimensoesFramework.js';
import { calcularScoresConsolidadoMaturidade } from './scoresConsolidadoProjetoMaturidade.js';

const PL_LABELS = {
  INACEITAVEL: 'Inaceitável',
  ALTO: 'Alto risco',
  BAIXO: 'Risco moderado',
  MINIMO: 'Risco mínimo'
};

async function carregarScoresProjeto(prisma, projetoId, versaoId = null) {
  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    include: {
      avaliacoes: {
        where: { status: 'finalizada' },
        include: {
          usuario: true,
          respostas: { include: { pergunta: { include: { area: true } } } }
        }
      }
    }
  });
  if (!projeto) return [];

  const areas = ordenarAreasPorFramework(
    await prisma.area.findMany({
      include: { perguntas: { orderBy: { numero: 'asc' } } },
      orderBy: { ordem: 'asc' }
    })
  );

  let avaliacoes = projeto.avaliacoes;
  if (versaoId) {
    const links = await prisma.$queryRaw`
      SELECT "avaliacaoId" FROM "ProjetoVersaoAvaliacao" WHERE "projetoVersaoId" = ${versaoId}
    `;
    const ids = new Set(links.map((r) => Number(r.avaliacaoId)));
    avaliacoes = avaliacoes.filter((a) => ids.has(a.id));
  }

  const { scoresPorArea } = calcularScoresConsolidadoMaturidade(avaliacoes, areas);
  return scoresPorArea || [];
}

function diasAte(data) {
  if (!data) return null;
  const alvo = new Date(data);
  if (Number.isNaN(alvo.getTime())) return null;
  return Math.ceil((alvo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function classificarHorizonte(item) {
  const dias = diasAte(item.prazo);
  if (dias != null) {
    if (dias <= 30) return '30';
    if (dias <= 60) return '60';
    return '90';
  }
  const crit = item.criticidade || item.prioridade || 'media';
  if (crit === 'critica' || item.tipo === 'alerta') return '30';
  if (crit === 'alta') return '60';
  return '90';
}

export function gerarPlanoRegulatorio30_60_90(itens = []) {
  const plano = { dias30: [], dias60: [], dias90: [] };
  for (const item of itens) {
    const h = classificarHorizonte(item);
    const bucket = h === '30' ? 'dias30' : h === '60' ? 'dias60' : 'dias90';
    plano[bucket].push({ ...item, horizonte: h });
  }
  const ordenar = (a, b) => {
    const pa = { critica: 0, alta: 1, media: 2, baixa: 3 }[a.criticidade || a.prioridade] ?? 2;
    const pb = { critica: 0, alta: 1, media: 2, baixa: 3 }[b.criticidade || b.prioridade] ?? 2;
    return pa - pb;
  };
  plano.dias30.sort(ordenar);
  plano.dias60.sort(ordenar);
  plano.dias90.sort(ordenar);
  return plano;
}

function resumirProdutoRegulatorio(produto, snapshot, ciclosInfo) {
  if (!snapshot) {
    return {
      produtoId: produto.id,
      produtoNome: produto.nome,
      status: produto.status,
      temSnapshot: false,
      alertas: [{ codigo: 'SEM_SNAPSHOT', titulo: 'Sem avaliação IA-First finalizada' }]
    };
  }

  const plEfetivo = nivelPlEfetivo(snapshot);
  const alertas = snapshot.alertas || [];
  const cicloAtual = ciclosInfo?.cicloAtual;

  return {
    produtoId: produto.id,
    produtoNome: produto.nome,
    status: produto.status,
    temSnapshot: true,
    plRiscoNivel: snapshot.plRiscoNivel,
    plRiscoNivelEfetivo: plEfetivo,
    plLabel: PL_LABELS[plEfetivo] || plEfetivo,
    isoScoreEstimado: snapshot.isoScoreEstimado,
    lgpdRipd: ripdNecessarioEfetivo(snapshot),
    aipdObrigatoria: aipdObrigatoriaEfetiva(snapshot),
    aipdStatus: snapshot.aipdStatus,
    validadoConsultor: snapshot.validadoConsultor,
    alertas,
    cicloAtual: cicloAtual
      ? {
          id: cicloAtual.id,
          titulo: cicloAtual.titulo,
          numero: cicloAtual.numero,
          metaPlRisco: cicloAtual.metaPlRisco,
          mitigacoesAbertas: (cicloAtual.mitigacoes || []).filter((m) => m.status !== 'concluida').length,
          mitigacoesTotal: (cicloAtual.mitigacoes || []).length
        }
      : null
  };
}

function coletarItensPlano(dashboard) {
  const itens = [];

  for (const p of dashboard.produtos || []) {
    if (!p.temSnapshot) {
      itens.push({
        tipo: 'produto',
        produtoId: p.produtoId,
        produtoNome: p.produtoNome,
        titulo: `Finalizar avaliação IA-First — ${p.produtoNome}`,
        descricao: 'Necessário para gerar snapshot regulatório PL 2338 / ISO 42001 / LGPD.',
        criticidade: 'alta',
        responsavel: 'Product owner + consultor SysMap'
      });
      continue;
    }

    if (!p.validadoConsultor) {
      itens.push({
        tipo: 'validacao',
        produtoId: p.produtoId,
        produtoNome: p.produtoNome,
        titulo: `Validação consultor — ${p.produtoNome}`,
        descricao: 'Revisar classificação automática PL/LGPD/AIPD.',
        criticidade: plAltoRisco(p.plRiscoNivelEfetivo) ? 'critica' : 'alta',
        responsavel: 'Consultor SysMap / Compliance'
      });
    }

    if (p.aipdObrigatoria && !['em_andamento', 'concluida'].includes(p.aipdStatus)) {
      itens.push({
        tipo: 'aipd',
        produtoId: p.produtoId,
        produtoNome: p.produtoNome,
        titulo: `Iniciar ou concluir AIPD — ${p.produtoNome}`,
        descricao: 'Alto risco PL 2338 — documentar avaliação de impacto antes de produção.',
        criticidade: 'critica',
        responsavel: 'Jurídico + DPO + Product owner'
      });
    }

    if (p.lgpdRipd) {
      itens.push({
        tipo: 'lgpd',
        produtoId: p.produtoId,
        produtoNome: p.produtoNome,
        titulo: `Confirmar base legal LGPD / RIPD — ${p.produtoNome}`,
        descricao: 'Tratamento de dados pessoais com decisão automatizada.',
        criticidade: 'alta',
        responsavel: 'DPO + Jurídico'
      });
    }

    const ciclo = dashboard.ciclosPorProduto?.[p.produtoId]?.cicloAtual;
    if (ciclo?.mitigacoes) {
      for (const m of ciclo.mitigacoes) {
        if (m.status === 'concluida') continue;
        itens.push({
          tipo: 'mitigacao',
          produtoId: p.produtoId,
          produtoNome: p.produtoNome,
          mitigacaoId: m.id,
          titulo: m.titulo,
          descricao: m.descricao,
          prazo: m.prazo,
          status: m.status,
          criticidade: plAltoRisco(p.plRiscoNivelEfetivo) ? 'alta' : 'media',
          responsavel: m.responsavel || 'A definir'
        });
      }
    }
  }

  for (const gap of dashboard.resumoProjeto?.dimensoesEmGap || []) {
    if (gap.nivelRisco !== 'CRITICO' && gap.nivelRisco !== 'ALTO') continue;
    itens.push({
      tipo: 'gap_dimensao',
      titulo: `Gap regulatório — ${gap.nome}`,
      descricao: `Dimensão ${gap.codigo} com score ${gap.score} em gap de conformidade.`,
      criticidade: gap.nivelRisco === 'CRITICO' ? 'critica' : 'alta',
      responsavel: 'Sponsor + dono da dimensão'
    });
  }

  return itens;
}

export async function montarDashboardRegulatorioProjeto(prisma, projetoId, opts = {}) {
  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    include: {
      empresa: true,
      produtos: {
        where: { status: { not: 'cancelado' } },
        orderBy: { nome: 'asc' }
      }
    }
  });

  if (!projeto) {
    const err = new Error('Projeto não encontrado');
    err.status = 404;
    throw err;
  }

  let scoresPorArea = [];
  if (opts.scoresPorArea?.length) {
    scoresPorArea = opts.scoresPorArea;
  } else {
    scoresPorArea = await carregarScoresProjeto(prisma, projetoId, opts.versaoId || null);
  }

  const resumoProjeto = resumoRegulatorioProjeto(scoresPorArea);
  const ciclosPorProduto = {};
  const produtosResumo = [];

  for (const produto of projeto.produtos) {
    const snapshot = await obterRegulatorySnapshotProduto(prisma, produto.id);
    let ciclosInfo = null;
    if (snapshot) {
      try {
        ciclosInfo = await listarCiclosProduto(prisma, produto.id);
        ciclosPorProduto[produto.id] = ciclosInfo;
      } catch {
        /* opcional */
      }
    }
    produtosResumo.push(resumirProdutoRegulatorio(produto, snapshot, ciclosInfo));
  }

  const comSnapshot = produtosResumo.filter((p) => p.temSnapshot);
  const altoRisco = comSnapshot.filter((p) => plAltoRisco(p.plRiscoNivelEfetivo));
  const aipdPendente = comSnapshot.filter((p) => p.aipdObrigatoria && !['em_andamento', 'concluida'].includes(p.aipdStatus));
  const validacaoPendente = comSnapshot.filter((p) => !p.validadoConsultor);
  const ripdNecessario = comSnapshot.filter((p) => p.lgpdRipd);

  const dashboard = {
    projeto: {
      id: projeto.id,
      nome: projeto.nome,
      empresa: projeto.empresa?.nome
    },
    resumoProjeto,
    kpis: {
      totalProdutos: produtosResumo.length,
      comSnapshot: comSnapshot.length,
      altoRiscoPl: altoRisco.length,
      aipdPendente: aipdPendente.length,
      validacaoPendente: validacaoPendente.length,
      ripdNecessario: ripdNecessario.length,
      dimensoesEmGap: resumoProjeto.totalGaps,
      dimensoesCriticas: resumoProjeto.totalCriticos
    },
    produtos: produtosResumo,
    produtosAltoRisco: altoRisco,
    ciclosPorProduto,
    disclaimer: DISCLAIMER_REGULATORIO
  };

  const itensPlano = coletarItensPlano(dashboard);
  dashboard.plano30_60_90 = gerarPlanoRegulatorio30_60_90(itensPlano);

  try {
    dashboard.notificacoes = await listarNotificacoesRegulatorias(prisma, { projetoId });
  } catch {
    dashboard.notificacoes = { total: 0, notificacoes: [], resumo: { criticas: 0, altas: 0 } };
  }

  return dashboard;
}

export function gerarSecao14RegulatorioBookMarkdown(dashboard) {
  if (!dashboard) return '';

  const { projeto, kpis, produtos, plano30_60_90: plano, resumoProjeto } = dashboard;
  const linhas = [];

  linhas.push('# 14. CONFORMIDADE REGULATÓRIA (PL 2338 / ISO 42001 / LGPD)');
  linhas.push('');
  linhas.push(
    '> Estimativa orientativa com base no assessment BluePrint e avaliações IA-First dos produtos. **Não constitui parecer jurídico nem certificação.**'
  );
  linhas.push('');
  linhas.push('## 14.1 Panorama do projeto');
  linhas.push('');
  linhas.push(`| Indicador | Valor |`);
  linhas.push(`|-----------|-------|`);
  linhas.push(`| Produtos mapeados | ${kpis.comSnapshot} / ${kpis.totalProdutos} |`);
  linhas.push(`| Alto risco PL 2338 | ${kpis.altoRiscoPl} |`);
  linhas.push(`| AIPD pendente | ${kpis.aipdPendente} |`);
  linhas.push(`| Validação consultor pendente | ${kpis.validacaoPendente} |`);
  linhas.push(`| RIPD LGPD provável | ${kpis.ripdNecessario} |`);
  linhas.push(`| Dimensões do projeto em gap regulatório | ${kpis.dimensoesEmGap} (${kpis.dimensoesCriticas} críticas) |`);
  linhas.push('');

  if (produtos.length > 0) {
    linhas.push('## 14.2 Status por produto');
    linhas.push('');
    linhas.push('| Produto | PL 2338 | ISO est. | LGPD | Validado | Ciclo |');
    linhas.push('|---------|---------|----------|------|----------|-------|');
    for (const p of produtos) {
      const pl = p.temSnapshot ? p.plLabel || p.plRiscoNivelEfetivo : '—';
      const iso = p.temSnapshot && p.isoScoreEstimado != null ? `${p.isoScoreEstimado}%` : '—';
      const lgpd = p.temSnapshot ? (p.lgpdRipd ? 'RIPD' : 'OK') : '—';
      const val = p.temSnapshot ? (p.validadoConsultor ? 'Sim' : 'Pendente') : '—';
      const ciclo = p.cicloAtual ? p.cicloAtual.titulo : '—';
      linhas.push(`| ${p.produtoNome} | ${pl} | ${iso} | ${lgpd} | ${val} | ${ciclo} |`);
    }
    linhas.push('');
  }

  if (resumoProjeto?.dimensoesEmGap?.length > 0) {
    linhas.push('## 14.3 Gaps regulatórios por dimensão (projeto)');
    linhas.push('');
    for (const g of resumoProjeto.dimensoesEmGap.slice(0, 8)) {
      linhas.push(`- **${g.nome}** (${g.codigo}) — score ${g.score}, risco ${g.nivelRisco}`);
    }
    linhas.push('');
  }

  const renderPlano = (titulo, itens, dias) => {
    linhas.push(`### ${titulo}`);
    linhas.push('');
    if (!itens?.length) {
      linhas.push(`_Nenhuma ação prioritária identificada para ${dias} dias._`);
      linhas.push('');
      return;
    }
    itens.forEach((item, i) => {
      linhas.push(`${i + 1}. **${item.titulo}**`);
      if (item.produtoNome) linhas.push(`   - Produto: ${item.produtoNome}`);
      if (item.descricao) linhas.push(`   - ${item.descricao}`);
      linhas.push(`   - Responsável: ${item.responsavel || 'A definir'}`);
      if (item.prazo) {
        linhas.push(`   - Prazo: ${new Date(item.prazo).toLocaleDateString('pt-BR')}`);
      }
      linhas.push('');
    });
  };

  linhas.push('## 14.4 Plano de ação regulatório 30 / 60 / 90 dias');
  linhas.push('');
  renderPlano('14.4.1 Primeiros 30 dias (urgente)', plano.dias30, 30);
  renderPlano('14.4.2 31–60 dias', plano.dias60, 60);
  renderPlano('14.4.3 61–90 dias', plano.dias90, 90);

  linhas.push('## 14.5 Próximos passos recomendados');
  linhas.push('');
  linhas.push('1. Validar classificações PL com consultor/jurídico para produtos em alto risco.');
  linhas.push('2. Executar mitigações do ciclo regulatório aberto em cada produto.');
  linhas.push('3. Documentar AIPD e base legal LGPD antes de deploy em produção.');
  linhas.push('4. Fechar ciclo regulatório e abrir novo após implementar controles.');
  linhas.push('');
  linhas.push(`_Projeto: ${projeto.nome} · ${projeto.empresa || ''}_`);

  return linhas.join('\n');
}

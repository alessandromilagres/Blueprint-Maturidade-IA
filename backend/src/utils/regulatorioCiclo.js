import {
  aipdObrigatoriaEfetiva,
  nivelPlEfetivo,
  obterRegulatorySnapshotProduto,
  plAltoRisco,
  ripdNecessarioEfetivo,
  calculateRegulatorySnapshot
} from './regulatorioSnapshot.js';
import { DISCLAIMER_REGULATORIO } from './regulatorioCrosswalk.js';

export const MITIGACAO_STATUS = ['planejada', 'em_andamento', 'concluida'];

export function formatarCiclo(ciclo, extras = {}) {
  if (!ciclo) return null;
  return {
    id: ciclo.id,
    produtoId: ciclo.produtoId,
    numero: ciclo.numero,
    titulo: ciclo.titulo,
    status: ciclo.status,
    metaPlRisco: ciclo.metaPlRisco,
    consultorNotas: ciclo.consultorNotas,
    snapshotAbertura: ciclo.snapshotAbertura,
    snapshotFechamento: ciclo.snapshotFechamento,
    checklistFechamento: ciclo.checklistFechamento,
    iniciadaEm: ciclo.iniciadaEm,
    fechadaEm: ciclo.fechadaEm,
    fechadaPorUsuarioId: ciclo.fechadaPorUsuarioId,
    projetoVersaoId: ciclo.projetoVersaoId,
    mitigacoes: extras.mitigacoes || [],
    ...extras
  };
}

export function formatarMitigacao(m) {
  return {
    id: m.id,
    cicloId: m.cicloId,
    codigoMotivo: m.codigoMotivo,
    titulo: m.titulo,
    descricao: m.descricao,
    responsavel: m.responsavel,
    prazo: m.prazo,
    status: m.status,
    evidenciaUrl: m.evidenciaUrl,
    evidencias: Array.isArray(m.evidencias) ? m.evidencias : [],
    createdAt: m.createdAt,
    updatedAt: m.updatedAt
  };
}

export function montarChecklistFechamento(snapshot, mitigacoes = []) {
  const pendencias = [];
  if (!snapshot) {
    pendencias.push({ codigo: 'SNAPSHOT', mensagem: 'Snapshot regulatório indisponível' });
    return { ok: false, pendencias };
  }

  const plEfetivo = nivelPlEfetivo(snapshot);

  if (!snapshot.validadoConsultor) {
    pendencias.push({
      codigo: 'VALIDACAO',
      mensagem: 'Validação do consultor pendente neste ciclo'
    });
  }

  if (aipdObrigatoriaEfetiva(snapshot) && !['em_andamento', 'concluida'].includes(snapshot.aipdStatus)) {
    pendencias.push({
      codigo: 'AIPD',
      mensagem: 'Alto risco PL sem AIPD em andamento ou concluída'
    });
  }

  if (ripdNecessarioEfetivo(snapshot) && !snapshot.lgpdBaseLegal?.trim()) {
    pendencias.push({
      codigo: 'LGPD',
      mensagem: 'RIPD provável — registrar base legal LGPD'
    });
  }

  const mitigacoesAbertas = (mitigacoes || []).filter((m) => m.status !== 'concluida');
  if (plAltoRisco(plEfetivo) && mitigacoesAbertas.length > 0) {
    pendencias.push({
      codigo: 'MITIGACOES',
      mensagem: `${mitigacoesAbertas.length} mitigação(ões) ainda não concluída(s)`
    });
  }

  return { ok: pendencias.length === 0, pendencias };
}

async function listarMitigacoesCiclo(prisma, cicloId) {
  const rows = await prisma.produtoRegulatorioMitigacao.findMany({
    where: { cicloId },
    orderBy: [{ status: 'asc' }, { id: 'asc' }]
  });
  return rows.map(formatarMitigacao);
}

export async function seedMitigacoesDoSnapshot(prisma, cicloId, snapshot) {
  const motivos = snapshot?.plDetalhes?.motivos || [];
  const gaps = snapshot?.isoDetalhes?.gapsProduto || [];
  const existentes = await prisma.produtoRegulatorioMitigacao.findMany({ where: { cicloId } });
  const codigos = new Set(existentes.map((e) => e.codigoMotivo).filter(Boolean));

  const criar = [];
  for (const m of motivos) {
    if (!m?.codigo || codigos.has(m.codigo)) continue;
    criar.push({
      cicloId,
      codigoMotivo: m.codigo,
      titulo: m.titulo || m.codigo,
      descricao: m.descricao || null,
      status: 'planejada'
    });
    codigos.add(m.codigo);
  }
  for (const g of gaps.slice(0, 3)) {
    const codigo = g.codigo || `GAP_${g.descricao?.slice(0, 20)}`;
    if (codigos.has(codigo)) continue;
    criar.push({
      cicloId,
      codigoMotivo: codigo,
      titulo: g.descricao || 'Gap ISO identificado',
      descricao: 'Mitigar gap de conformidade ISO 42001',
      status: 'planejada'
    });
  }

  if (criar.length > 0) {
    await prisma.produtoRegulatorioMitigacao.createMany({ data: criar });
  }
}

async function obterVersaoAbertaProjetoId(prisma, projetoId) {
  const rows = await prisma.$queryRaw`
    SELECT "id", "titulo", "numero"
    FROM "ProjetoVersao"
    WHERE "projetoId" = ${projetoId} AND "status" = 'aberta'
    ORDER BY "numero" DESC
    LIMIT 1
  `;
  if (!rows.length) return null;
  return { id: Number(rows[0].id), titulo: rows[0].titulo, numero: Number(rows[0].numero) };
}

export async function compararCiclosRegulatorios(prisma, produtoId) {
  const ciclos = await prisma.produtoRegulatorioCiclo.findMany({
    where: { produtoId, status: 'fechada' },
    orderBy: { numero: 'asc' },
    include: { mitigacoes: true }
  });

  const aberto = await prisma.produtoRegulatorioCiclo.findFirst({
    where: { produtoId, status: 'aberta' },
    orderBy: { numero: 'desc' },
    include: { mitigacoes: true }
  });

  const snapshotAtual = await obterRegulatorySnapshotProduto(prisma, produtoId);

  const extrairMetricas = (snap) => {
    if (!snap) return null;
    return {
      pl: snap.plRiscoNivelEfetivo || snap.plRiscoNivel,
      iso: snap.isoScoreEstimado,
      lgpdRipd: ripdNecessarioEfetivo(snap),
      aipdStatus: snap.aipdStatus,
      validado: snap.validadoConsultor
    };
  };

  const pares = [];
  const todos = [...ciclos, ...(aberto ? [aberto] : [])];
  for (let i = 1; i < todos.length; i++) {
    const anterior = todos[i - 1];
    const atual = todos[i];
    const snapAnt = anterior.snapshotFechamento || anterior.snapshotAbertura;
    const snapAtu =
      atual.status === 'fechada'
        ? atual.snapshotFechamento || atual.snapshotAbertura
        : snapshotAtual;
    const mAnt = anterior.mitigacoes?.length || 0;
    const mAtu = atual.mitigacoes?.length || 0;
    const mConcAnt = anterior.mitigacoes?.filter((x) => x.status === 'concluida').length || 0;
    const mConcAtu = atual.mitigacoes?.filter((x) => x.status === 'concluida').length || 0;
    pares.push({
      de: { numero: anterior.numero, titulo: anterior.titulo, metricas: extrairMetricas(snapAnt) },
      para: {
        numero: atual.numero,
        titulo: atual.titulo,
        status: atual.status,
        metricas: extrairMetricas(snapAtu)
      },
      delta: {
        plMelhorou: extrairNivelPlOrdem(snapAtu) < extrairNivelPlOrdem(snapAnt),
        isoDelta:
          (extrairMetricas(snapAtu)?.iso ?? 0) - (extrairMetricas(snapAnt)?.iso ?? 0),
        mitigacoesConcluidasDelta: mConcAtu - mConcAnt,
        mitigacoesTotalDelta: mAtu - mAnt
      }
    });
  }

  return {
    produtoId,
    ciclos: todos.map((c) =>
      formatarCiclo(c, {
        mitigacoes: (c.mitigacoes || []).map(formatarMitigacao),
        metricas: extrairMetricas(
          c.status === 'fechada' ? c.snapshotFechamento : c.id === aberto?.id ? snapshotAtual : c.snapshotAbertura
        )
      })
    ),
    comparacoes: pares,
    disclaimer: DISCLAIMER_REGULATORIO
  };
}

function extrairNivelPlOrdem(snap) {
  const n = typeof snap === 'object' && snap?.plRiscoNivelEfetivo
    ? snap.plRiscoNivelEfetivo
    : snap?.plRiscoNivel;
  const ordem = { MINIMO: 0, BAIXO: 1, ALTO: 2, INACEITAVEL: 3 };
  return ordem[n] ?? 1;
}

export async function garantirCicloRegulatorioAberto(prisma, produtoId, snapshotJson = null) {
  const aberto = await prisma.produtoRegulatorioCiclo.findFirst({
    where: { produtoId, status: 'aberta' },
    orderBy: { numero: 'desc' }
  });
  if (aberto) {
    if (!aberto.snapshotAbertura && snapshotJson) {
      await prisma.produtoRegulatorioCiclo.update({
        where: { id: aberto.id },
        data: { snapshotAbertura: snapshotJson }
      });
    }
    const snap = snapshotJson || (await obterRegulatorySnapshotProduto(prisma, produtoId));
    if (snap) await seedMitigacoesDoSnapshot(prisma, aberto.id, snap);
    return aberto;
  }

  const count = await prisma.produtoRegulatorioCiclo.count({ where: { produtoId } });
  const numero = count + 1;
  const produto = await prisma.produto.findUnique({ where: { id: produtoId }, select: { projetoId: true } });
  const versaoAberta = produto?.projetoId
    ? await obterVersaoAbertaProjetoId(prisma, produto.projetoId)
    : null;

  const ciclo = await prisma.produtoRegulatorioCiclo.create({
    data: {
      produtoId,
      numero,
      titulo: `Ciclo regulatório ${numero}`,
      status: 'aberta',
      snapshotAbertura: snapshotJson || null,
      projetoVersaoId: versaoAberta?.id || null
    }
  });

  const snap = snapshotJson || (await obterRegulatorySnapshotProduto(prisma, produtoId));
  if (snap) await seedMitigacoesDoSnapshot(prisma, ciclo.id, snap);
  return ciclo;
}

export async function obterCicloAbertoProduto(prisma, produtoId) {
  const ciclo = await prisma.produtoRegulatorioCiclo.findFirst({
    where: { produtoId, status: 'aberta' },
    orderBy: { numero: 'desc' }
  });
  if (!ciclo) return null;
  const mitigacoes = await listarMitigacoesCiclo(prisma, ciclo.id);
  const snapshot = await obterRegulatorySnapshotProduto(prisma, produtoId);
  const checklistFechamento = montarChecklistFechamento(snapshot, mitigacoes);
  return formatarCiclo(ciclo, { mitigacoes, checklistFechamento, snapshotAtual: snapshot });
}

export async function listarCiclosProduto(prisma, produtoId) {
  let ciclos = await prisma.produtoRegulatorioCiclo.findMany({
    where: { produtoId },
    orderBy: { numero: 'desc' }
  });

  if (ciclos.length === 0) {
    const snap = await obterRegulatorySnapshotProduto(prisma, produtoId);
    if (snap) {
      await garantirCicloRegulatorioAberto(prisma, produtoId, snap);
      ciclos = await prisma.produtoRegulatorioCiclo.findMany({
        where: { produtoId },
        orderBy: { numero: 'desc' }
      });
    }
  }

  const aberto = ciclos.find((c) => c.status === 'aberta') || null;
  return {
    cicloAtual: aberto ? await obterCicloAbertoProduto(prisma, produtoId) : null,
    ciclos: ciclos.map((c) => formatarCiclo(c)),
    disclaimer: DISCLAIMER_REGULATORIO
  };
}

export async function criarProximoCicloRegulatorio(prisma, produtoId, body = {}) {
  const aberto = await prisma.produtoRegulatorioCiclo.findFirst({
    where: { produtoId, status: 'aberta' }
  });
  if (aberto) {
    const err = new Error('Feche o ciclo regulatório atual antes de abrir o próximo');
    err.status = 409;
    err.versaoAtual = formatarCiclo(aberto);
    throw err;
  }

  let snapshot = null;
  if (body.recalcularSnapshot !== false) {
    try {
      snapshot = await calculateRegulatorySnapshot(prisma, produtoId);
    } catch {
      snapshot = await obterRegulatorySnapshotProduto(prisma, produtoId);
    }
  } else {
    snapshot = await obterRegulatorySnapshotProduto(prisma, produtoId);
  }

  const max = await prisma.produtoRegulatorioCiclo.aggregate({
    where: { produtoId },
    _max: { numero: true }
  });
  const numero = (max._max.numero || 0) + 1;
  const titulo = String(body.titulo || `Ciclo regulatório ${numero}`).trim().slice(0, 120);
  const produto = await prisma.produto.findUnique({ where: { id: produtoId }, select: { projetoId: true } });
  const versaoAberta = produto?.projetoId
    ? await obterVersaoAbertaProjetoId(prisma, produto.projetoId)
    : null;

  const ciclo = await prisma.produtoRegulatorioCiclo.create({
    data: {
      produtoId,
      numero,
      titulo,
      status: 'aberta',
      metaPlRisco: body.metaPlRisco || null,
      consultorNotas: body.consultorNotas || null,
      snapshotAbertura: snapshot || null,
      projetoVersaoId: body.projetoVersaoId || versaoAberta?.id || null
    }
  });

  if (body.herdarMitigacoesPendentes !== false) {
    const ultimoFechado = await prisma.produtoRegulatorioCiclo.findFirst({
      where: { produtoId, status: 'fechada' },
      orderBy: { numero: 'desc' }
    });
    if (ultimoFechado) {
      const pendentes = await prisma.produtoRegulatorioMitigacao.findMany({
        where: { cicloId: ultimoFechado.id, status: { not: 'concluida' } }
      });
      if (pendentes.length > 0) {
        await prisma.produtoRegulatorioMitigacao.createMany({
          data: pendentes.map((m) => ({
            cicloId: ciclo.id,
            codigoMotivo: m.codigoMotivo,
            titulo: m.titulo,
            descricao: m.descricao,
            responsavel: m.responsavel,
            prazo: m.prazo,
            status: m.status,
            evidenciaUrl: m.evidenciaUrl
          }))
        });
      }
    }
  }

  if (snapshot) await seedMitigacoesDoSnapshot(prisma, ciclo.id, snapshot);
  return obterCicloAbertoProduto(prisma, produtoId);
}

export async function fecharCicloRegulatorio(prisma, produtoId, cicloId, usuarioId, body = {}) {
  const ciclo = await prisma.produtoRegulatorioCiclo.findFirst({
    where: { id: cicloId, produtoId }
  });
  if (!ciclo) {
    const err = new Error('Ciclo regulatório não encontrado');
    err.status = 404;
    throw err;
  }
  if (ciclo.status === 'fechada') {
    const err = new Error('Este ciclo já está fechado');
    err.status = 409;
    throw err;
  }

  const mitigacoes = await listarMitigacoesCiclo(prisma, cicloId);
  const snapshot = await obterRegulatorySnapshotProduto(prisma, produtoId);
  const checklist = montarChecklistFechamento(snapshot, mitigacoes);

  if (!checklist.ok && !body.forcar) {
    const err = new Error('Checklist de fechamento com pendências');
    err.status = 422;
    err.checklistFechamento = checklist;
    throw err;
  }

  const fechado = await prisma.produtoRegulatorioCiclo.update({
    where: { id: cicloId },
    data: {
      status: 'fechada',
      fechadaEm: new Date(),
      fechadaPorUsuarioId: usuarioId || null,
      snapshotFechamento: snapshot || null,
      checklistFechamento: {
        ...checklist,
        forcado: body.forcar === true,
        motivoForca: body.motivo || null
      },
      consultorNotas: body.consultorNotas != null ? String(body.consultorNotas).trim() || null : ciclo.consultorNotas,
      metaPlRisco: body.metaPlRisco ?? ciclo.metaPlRisco
    }
  });

  return formatarCiclo(fechado, { mitigacoes, checklistFechamento: checklist, snapshotFechamento: snapshot });
}

export async function criarMitigacao(prisma, produtoId, cicloId, body) {
  const ciclo = await prisma.produtoRegulatorioCiclo.findFirst({
    where: { id: cicloId, produtoId, status: 'aberta' }
  });
  if (!ciclo) {
    const err = new Error('Ciclo aberto não encontrado para este produto');
    err.status = 404;
    throw err;
  }

  const titulo = String(body.titulo || '').trim();
  if (!titulo) {
    const err = new Error('Título da mitigação é obrigatório');
    err.status = 400;
    throw err;
  }

  const status = body.status || 'planejada';
  if (!MITIGACAO_STATUS.includes(status)) {
    const err = new Error(`Status inválido. Use: ${MITIGACAO_STATUS.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const row = await prisma.produtoRegulatorioMitigacao.create({
    data: {
      cicloId,
      codigoMotivo: body.codigoMotivo || null,
      titulo,
      descricao: body.descricao ? String(body.descricao).trim() : null,
      responsavel: body.responsavel ? String(body.responsavel).trim() : null,
      prazo: body.prazo ? new Date(body.prazo) : null,
      status,
      evidenciaUrl: body.evidenciaUrl ? String(body.evidenciaUrl).trim() : null,
      ...(body.evidencias !== undefined ? { evidencias: body.evidencias } : {})
    }
  });

  return formatarMitigacao(row);
}

export async function atualizarMitigacao(prisma, produtoId, cicloId, mitigacaoId, body) {
  const ciclo = await prisma.produtoRegulatorioCiclo.findFirst({
    where: { id: cicloId, produtoId, status: 'aberta' }
  });
  if (!ciclo) {
    const err = new Error('Ciclo aberto não encontrado');
    err.status = 404;
    throw err;
  }

  const existente = await prisma.produtoRegulatorioMitigacao.findFirst({
    where: { id: mitigacaoId, cicloId }
  });
  if (!existente) {
    const err = new Error('Mitigação não encontrada');
    err.status = 404;
    throw err;
  }

  const data = {};
  if (body.titulo != null) data.titulo = String(body.titulo).trim();
  if (body.descricao !== undefined) data.descricao = body.descricao ? String(body.descricao).trim() : null;
  if (body.responsavel !== undefined) data.responsavel = body.responsavel ? String(body.responsavel).trim() : null;
  if (body.prazo !== undefined) data.prazo = body.prazo ? new Date(body.prazo) : null;
  if (body.evidenciaUrl !== undefined) data.evidenciaUrl = body.evidenciaUrl ? String(body.evidenciaUrl).trim() : null;
  if (body.evidencias !== undefined) data.evidencias = body.evidencias;
  if (body.status != null) {
    if (!MITIGACAO_STATUS.includes(body.status)) {
      const err = new Error(`Status inválido. Use: ${MITIGACAO_STATUS.join(', ')}`);
      err.status = 400;
      throw err;
    }
    data.status = body.status;
  }

  const row = await prisma.produtoRegulatorioMitigacao.update({
    where: { id: mitigacaoId },
    data
  });
  return formatarMitigacao(row);
}

export async function atualizarCicloAberto(prisma, produtoId, body) {
  const ciclo = await prisma.produtoRegulatorioCiclo.findFirst({
    where: { produtoId, status: 'aberta' },
    orderBy: { numero: 'desc' }
  });
  if (!ciclo) {
    const err = new Error('Nenhum ciclo regulatório aberto');
    err.status = 404;
    throw err;
  }

  const data = {};
  if (body.metaPlRisco !== undefined) data.metaPlRisco = body.metaPlRisco || null;
  if (body.consultorNotas !== undefined) data.consultorNotas = body.consultorNotas ? String(body.consultorNotas).trim() : null;
  if (body.titulo != null) data.titulo = String(body.titulo).trim().slice(0, 120);

  await prisma.produtoRegulatorioCiclo.update({ where: { id: ciclo.id }, data });
  return obterCicloAbertoProduto(prisma, produtoId);
}

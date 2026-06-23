import { CROSSWALK_DIMENSOES } from '../data/regulatorio/crosswalk.js';
import {
  detectarDominiosAltoRisco,
  produtoTrataDadosPessoais,
  textoProdutoParaAnalise,
  verticalIndicaAltoRisco
} from '../data/regulatorio/sinaisProduto.js';
import {
  DISCLAIMER_REGULATORIO,
  avaliarImplicacaoRegulatoriaDimensao
} from './regulatorioCrosswalk.js';
import { calcularScoresConsolidadoMaturidade } from './scoresConsolidadoProjetoMaturidade.js';
import { ordenarAreasPorFramework } from './ordemDimensoesFramework.js';

export const AIPD_STATUS_OPCOES = ['nao_iniciada', 'em_andamento', 'concluida'];

export const AIPD_STATUS_LABELS = {
  nao_iniciada: 'Não iniciada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída'
};

export const PL_NIVEIS_VALIDOS = ['MINIMO', 'BAIXO', 'ALTO', 'INACEITAVEL'];

export function podeValidarRegulatorio(role) {
  const r = String(role || '').trim().toLowerCase();
  return ['admin', 'gestor', 'sysmap', 'negocios', 'ti', 'executivo'].includes(r);
}

export function nivelPlEfetivo(snapshot) {
  if (!snapshot) return null;
  if (snapshot.pl2338Confirmado && snapshot.plRiscoNivelConfirmado) {
    return snapshot.plRiscoNivelConfirmado;
  }
  return snapshot.plRiscoNivel;
}

export function plAltoRisco(nivel) {
  return nivel === 'ALTO' || nivel === 'INACEITAVEL';
}

export function aipdObrigatoriaEfetiva(snapshot) {
  if (!snapshot) return false;
  return plAltoRisco(nivelPlEfetivo(snapshot));
}

export function ripdNecessarioEfetivo(snapshot) {
  if (!snapshot) return false;
  if (snapshot.lgpdRipdConfirmado && snapshot.lgpdRipdOverride != null) {
    return snapshot.lgpdRipdOverride === true;
  }
  return snapshot.lgpdDetalhes?.ripdNecessario === true;
}

export function avaliarAlertasRegulatorios(snapshot) {
  if (!snapshot) return { alertas: [] };

  const alertas = [];
  const plEfetivo = nivelPlEfetivo(snapshot);
  const aipdStatus = snapshot.aipdStatus || 'nao_iniciada';
  const altoRisco = plEfetivo === 'ALTO' || plEfetivo === 'INACEITAVEL';
  const aipdPendente = altoRisco && !['em_andamento', 'concluida'].includes(aipdStatus);

  if (aipdPendente) {
    alertas.push({
      codigo: 'AIPD_PENDENTE',
      severidade: 'CRITICO',
      titulo: 'AIPD pendente',
      mensagem:
        'Produto classificado como alto risco PL 2338 sem AIPD em andamento ou concluída. Não recomendado deploy em produção até mitigação documentada.'
    });
  }

  if (!snapshot.validadoConsultor) {
    alertas.push({
      codigo: 'VALIDACAO_PENDENTE',
      severidade: 'MEDIO',
      titulo: 'Validação do consultor pendente',
      mensagem: 'Classificação automática — aguardando revisão de consultor SysMap.'
    });
  }

  if (ripdNecessarioEfetivo(snapshot) && !snapshot.lgpdBaseLegal?.trim()) {
    alertas.push({
      codigo: 'LGPD_BASE_LEGAL',
      severidade: 'ALTO',
      titulo: 'Base legal LGPD não confirmada',
      mensagem: 'RIPD provável — registrar base legal com apoio jurídico.'
    });
  }

  return { alertas, aipdPendente, validacaoPendente: !snapshot.validadoConsultor };
}

const NIVEL_PL_ORDEM = { MINIMO: 0, BAIXO: 1, ALTO: 2, INACEITAVEL: 3 };

function scorePorNumeroPergunta(scoresPorPergunta, numero) {
  const item = (scoresPorPergunta || []).find((p) => p.numero === numero);
  return item?.score > 0 ? Number(item.score) : null;
}

function maxNivelPl(a, b) {
  return (NIVEL_PL_ORDEM[a] ?? 0) >= (NIVEL_PL_ORDEM[b] ?? 0) ? a : b;
}

function calcularIsoDoProjeto(scoresPorArea) {
  const enriquecidos = (scoresPorArea || [])
    .filter((s) => s.score > 0)
    .map((s) => ({
      ...s,
      regulatorio: avaliarImplicacaoRegulatoriaDimensao({
        nomeDimensao: s.area,
        score: s.score
      })
    }))
    .filter((s) => s.regulatorio?.disponivel);

  if (enriquecidos.length === 0) {
    return {
      isoScoreEstimado: null,
      isoGapCount: null,
      isoDetalhes: {
        conformidadePct: null,
        gaps: [],
        clausulasEmRisco: [],
        mensagem: 'Sem scores de maturidade do projeto para estimar ISO 42001.'
      }
    };
  }

  const gaps = enriquecidos.filter((s) => s.regulatorio.emGap);
  const clausulasEmRisco = [
    ...new Set(
      gaps.flatMap((s) => s.regulatorio.iso?.clausulas || [])
    )
  ];

  const conformidadePct = parseFloat(
    (((enriquecidos.length - gaps.length) / enriquecidos.length) * 100).toFixed(1)
  );

  const gapsDetalhados = gaps.map((s) => ({
    codigo: s.regulatorio.codigoDimensao,
    dimensao: s.regulatorio.nomeDimensao,
    score: s.regulatorio.score,
    nivelRisco: s.regulatorio.nivelRisco,
    clausulas: s.regulatorio.iso?.clausulas || []
  }));

  const totalClausulasRef = [
    ...new Set(CROSSWALK_DIMENSOES.flatMap((d) => d.isoClausulas || []))
  ].length;

  return {
    isoScoreEstimado: conformidadePct,
    isoGapCount: gaps.length,
    isoDetalhes: {
      conformidadePct,
      dimensoesMapeadas: enriquecidos.length,
      dimensoesEmGap: gaps.length,
      clausulasEmRisco,
      totalClausulasReferencia: totalClausulasRef,
      gaps: gapsDetalhados,
      maioresGaps: gapsDetalhados
        .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
        .slice(0, 5)
    }
  };
}

function calcularPl2338({ scoresPorPergunta, produto, textoAnalise, dominiosDetectados }) {
  const p1 = scorePorNumeroPergunta(scoresPorPergunta, 1);
  const p6 = scorePorNumeroPergunta(scoresPorPergunta, 6);
  const motivos = [];
  let nivel = 'MINIMO';
  let confianca = 0.45;

  if (p1 != null) confianca += 0.15;
  if (p6 != null) confianca += 0.1;

  if (p1 != null && p1 >= 4) {
    motivos.push({
      codigo: 'AUTONOMIA_ALTA',
      titulo: 'Alta autonomia do agente (P1)',
      descricao: 'Score elevado em autonomia — candidato a alto risco PL 2338 Art. 7º (supervisão humana).',
      artigos: ['Art. 7º', 'Art. 3º']
    });
    nivel = maxNivelPl(nivel, 'ALTO');
  } else if (p1 != null && p1 >= 3 && p6 != null && p6 <= 2.5) {
    motivos.push({
      codigo: 'AUTONOMIA_SEM_GOVERNANCA',
      titulo: 'Autonomia moderada sem governança adequada (P1 + P6)',
      descricao: 'Autonomia com governança/logging insuficientes — risco elevado de não conformidade.',
      artigos: ['Art. 7º', 'Art. 13º']
    });
    nivel = maxNivelPl(nivel, 'ALTO');
  }

  if (p6 != null && p6 <= 2) {
    motivos.push({
      codigo: 'GOVERNANCA_FRACA',
      titulo: 'Governança e logging insuficientes (P6)',
      descricao: 'Gap em auditoria, explicabilidade e conformidade — ISO 8.5/8.6 e PL Art. 13º.',
      artigos: ['Art. 13º', 'Art. 9º']
    });
    if (p1 != null && p1 >= 3) nivel = maxNivelPl(nivel, 'ALTO');
    else nivel = maxNivelPl(nivel, 'BAIXO');
  }

  for (const dom of dominiosDetectados) {
    motivos.push({
      codigo: `DOMINIO_${dom.id.toUpperCase()}`,
      titulo: dom.label,
      descricao: 'Domínio de alto impacto identificado no escopo do produto (PL 2338 Art. 3º).',
      artigos: ['Art. 3º']
    });
    nivel = maxNivelPl(nivel, 'ALTO');
    confianca += 0.08;
  }

  if (verticalIndicaAltoRisco(produto?.vertical?.nome)) {
    motivos.push({
      codigo: 'VERTICAL_SENSIVEL',
      titulo: `Vertical sensível: ${produto.vertical.nome}`,
      descricao: 'Setor com regulação reforçada para sistemas de IA.',
      artigos: ['Art. 3º']
    });
    nivel = maxNivelPl(nivel, 'ALTO');
    confianca += 0.05;
  }

  if (p1 != null && p1 >= 4.5 && p6 != null && p6 <= 1.5) {
    nivel = 'INACEITAVEL';
    motivos.push({
      codigo: 'INACEITAVEL_AUTONOMIA',
      titulo: 'Autonomia elevada sem controles mínimos',
      descricao: 'Combinação crítica: autonomia muito alta e governança muito baixa.',
      artigos: ['Art. 7º', 'Art. 13º', 'Art. 3º']
    });
  }

  if (motivos.length === 0 && p1 != null && p1 <= 2.5 && (p6 == null || p6 >= 3.5)) {
    nivel = 'MINIMO';
  } else if (motivos.length === 0) {
    nivel = 'BAIXO';
  }

  const aipdObrigatoria = nivel === 'ALTO' || nivel === 'INACEITAVEL';

  return {
    plRiscoNivel: nivel,
    plDetalhes: {
      nivel,
      confianca: Math.min(0.95, parseFloat(confianca.toFixed(2))),
      motivos,
      aipdObrigatoria,
      aipdMensagem: aipdObrigatoria
        ? 'AIPD (Avaliação de Impacto de IA) recomendada antes do deploy em produção.'
        : null,
      artigosReferencia: [...new Set(motivos.flatMap((m) => m.artigos || []))]
    }
  };
}

function calcularLgpd({ plRiscoNivel, plDetalhes, p1, trataDadosPessoais, dominiosDetectados }) {
  const decisaoAutomatizada = p1 != null && p1 >= 3;
  const ripdNecessario =
    plRiscoNivel === 'ALTO' ||
    plRiscoNivel === 'INACEITAVEL' ||
    (decisaoAutomatizada && trataDadosPessoais) ||
    dominiosDetectados.some((d) => ['saude', 'credito', 'emprego'].includes(d.id));

  let lgpdRiscoNivel = 'BAIXO';
  if (ripdNecessario && (plRiscoNivel === 'ALTO' || plRiscoNivel === 'INACEITAVEL')) {
    lgpdRiscoNivel = 'ALTO';
  } else if (ripdNecessario) {
    lgpdRiscoNivel = 'MEDIO';
  } else if (trataDadosPessoais && decisaoAutomatizada) {
    lgpdRiscoNivel = 'MEDIO';
  }

  const artigos = [];
  if (ripdNecessario) artigos.push('Art. 38 (RIPD)');
  if (decisaoAutomatizada) artigos.push('Art. 20 (decisão automatizada)');

  return {
    lgpdRiscoNivel,
    lgpdDetalhes: {
      nivel: lgpdRiscoNivel,
      ripdNecessario,
      decisaoAutomatizada,
      trataDadosPessoais,
      baseLegalConfirmada: false,
      artigos,
      mensagem: ripdNecessario
        ? 'RIPD provavelmente necessário — validar base legal e finalidade com consultor/jurídico.'
        : decisaoAutomatizada
          ? 'Decisão automatizada identificada — revisar transparência ao titular (Art. 20).'
          : 'Sem sinais fortes de tratamento de alto impacto LGPD com base apenas no questionário.'
    }
  };
}

/**
 * Calcula snapshot regulatório a partir de dados já carregados (sem I/O).
 */
export function calcularRegulatorySnapshotFromContext({
  produto,
  projetoId,
  scoresPorPerguntaObrigatoria,
  scoresPorAreaProjeto
}) {
  const textoAnalise = textoProdutoParaAnalise(produto);
  const dominiosDetectados = detectarDominiosAltoRisco(textoAnalise);
  const trataDadosPessoais = produtoTrataDadosPessoais(textoAnalise);

  const p1 = scorePorNumeroPergunta(scoresPorPerguntaObrigatoria, 1);

  const iso = calcularIsoDoProjeto(scoresPorAreaProjeto);
  const pl = calcularPl2338({
    scoresPorPergunta: scoresPorPerguntaObrigatoria,
    produto,
    textoAnalise,
    dominiosDetectados
  });
  const lgpd = calcularLgpd({
    plRiscoNivel: pl.plRiscoNivel,
    plDetalhes: pl.plDetalhes,
    p1,
    trataDadosPessoais,
    dominiosDetectados
  });

  const gapsProduto = [];
  if (p1 != null && p1 >= 3 && scorePorNumeroPergunta(scoresPorPerguntaObrigatoria, 6) <= 2.5) {
    gapsProduto.push({ codigo: 'ISO_8_5', descricao: 'Supervisão humana e logging (ISO 8.5 / 8.6)' });
  }
  if (p1 != null && p1 >= 3) {
    gapsProduto.push({ codigo: 'EXPLICABILIDADE', descricao: 'Explicabilidade de decisões ao usuário (ISO 8.1 / PL Art. 9º)' });
  }

  return {
    produtoId: produto.id,
    projetoId,
    isoScoreEstimado: iso.isoScoreEstimado,
    isoGapCount: iso.isoGapCount,
    plRiscoNivel: pl.plRiscoNivel,
    lgpdRiscoNivel: lgpd.lgpdRiscoNivel,
    isoDetalhes: { ...iso.isoDetalhes, gapsProduto },
    plDetalhes: pl.plDetalhes,
    lgpdDetalhes: lgpd.lgpdDetalhes,
    disclaimer: DISCLAIMER_REGULATORIO,
    calculadoEm: new Date().toISOString(),
    fontes: {
      avaliacaoIaFirst: (scoresPorPerguntaObrigatoria || []).length > 0,
      maturidadeProjeto: (scoresPorAreaProjeto || []).some((s) => s.score > 0)
    }
  };
}

export async function carregarScoresProjetoParaRegulatorio(prisma, projetoId) {
  const areas = ordenarAreasPorFramework(
    await prisma.area.findMany({
      include: { perguntas: { orderBy: { numero: 'asc' } } },
      orderBy: { ordem: 'asc' }
    })
  );

  const avaliacoes = await prisma.avaliacao.findMany({
    where: { projetoId, status: 'finalizada' },
    include: {
      respostas: { include: { pergunta: { include: { area: true } } } }
    }
  });

  if (avaliacoes.length === 0) return [];

  const { scoresPorArea } = calcularScoresConsolidadoMaturidade(avaliacoes, areas);
  return scoresPorArea;
}

export async function carregarScoresPerguntasObrigatoriasProduto(prisma, produtoId) {
  const perguntas = await prisma.perguntaObrigatoriaProduto.findMany({ orderBy: { ordem: 'asc' } });
  const avaliacoes = await prisma.avaliacaoProduto.findMany({
    where: { produtoId, status: 'finalizada' },
    include: { respostasObrigatorias: true }
  });

  return perguntas.map((pergunta) => {
    let soma = 0;
    let count = 0;
    avaliacoes.forEach((av) => {
      const r = av.respostasObrigatorias.find(
        (x) => x.perguntaObrigatoriaId === pergunta.id && x.pontuacao != null
      );
      if (r) {
        soma += r.pontuacao;
        count++;
      }
    });
    return {
      perguntaId: pergunta.id,
      numero: pergunta.numero,
      categoria: pergunta.categoria,
      texto: pergunta.texto,
      score: count > 0 ? parseFloat((soma / count).toFixed(2)) : 0,
      respostas: count
    };
  });
}

export async function calculateRegulatorySnapshot(prisma, produtoId, opts = {}) {
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    include: {
      vertical: true,
      projeto: true,
      avaliacoes: { where: { status: 'finalizada' }, take: 1 }
    }
  });

  if (!produto) {
    const err = new Error('Produto não encontrado');
    err.status = 404;
    throw err;
  }

  if (produto.avaliacoes.length === 0) {
    const err = new Error('Produto sem avaliação IA-First finalizada — snapshot indisponível');
    err.status = 409;
    throw err;
  }

  const scoresPorPerguntaObrigatoria = await carregarScoresPerguntasObrigatoriasProduto(prisma, produtoId);
  const scoresPorAreaProjeto = await carregarScoresProjetoParaRegulatorio(prisma, produto.projetoId);

  const calculado = calcularRegulatorySnapshotFromContext({
    produto,
    projetoId: produto.projetoId,
    scoresPorPerguntaObrigatoria,
    scoresPorAreaProjeto
  });

  const existente = await prisma.regulatorySnapshot.findUnique({ where: { produtoId } });
  const preservarConsultor =
    existente?.validadoConsultor === true && opts.preservarValidacao !== false;

  const updateBase = {
    projetoId: produto.projetoId,
    isoScoreEstimado: calculado.isoScoreEstimado,
    isoGapCount: calculado.isoGapCount,
    plRiscoNivel: calculado.plRiscoNivel,
    lgpdRiscoNivel: calculado.lgpdRiscoNivel,
    isoDetalhes: calculado.isoDetalhes,
    plDetalhes: calculado.plDetalhes,
    lgpdDetalhes: calculado.lgpdDetalhes
  };

  if (!preservarConsultor) {
    Object.assign(updateBase, {
      validadoConsultor: false,
      validadoEm: null,
      validadoPorUsuarioId: null,
      pl2338Confirmado: false,
      plRiscoNivelConfirmado: null,
      lgpdBaseLegal: null,
      lgpdRipdConfirmado: false,
      lgpdRipdOverride: null,
      aipdStatus: 'nao_iniciada',
      isoOverride: null,
      consultorNotas: null
    });
  }

  const salvo = await prisma.regulatorySnapshot.upsert({
    where: { produtoId },
    create: {
      produtoId,
      projetoId: produto.projetoId,
      isoScoreEstimado: calculado.isoScoreEstimado,
      isoGapCount: calculado.isoGapCount,
      plRiscoNivel: calculado.plRiscoNivel,
      lgpdRiscoNivel: calculado.lgpdRiscoNivel,
      isoDetalhes: calculado.isoDetalhes,
      plDetalhes: calculado.plDetalhes,
      lgpdDetalhes: calculado.lgpdDetalhes
    },
    update: updateBase
  });

  const formatted = formatarSnapshotResposta(salvo, calculado);
  try {
    const { garantirCicloRegulatorioAberto } = await import('./regulatorioCiclo.js');
    await garantirCicloRegulatorioAberto(prisma, produtoId, formatted);
  } catch (e) {
    console.warn('[regulatorio] Ciclo não sincronizado:', e?.message || e);
  }
  return formatted;
}

export function formatarSnapshotResposta(registroDb, calculadoExtra = null, validador = null) {
  const base = calculadoExtra || {};
  const plRiscoNivelEfetivo = registroDb.pl2338Confirmado && registroDb.plRiscoNivelConfirmado
    ? registroDb.plRiscoNivelConfirmado
    : registroDb.plRiscoNivel;
  const aipdObrigatoria = plAltoRisco(plRiscoNivelEfetivo);

  const snapshot = {
    id: registroDb.id,
    produtoId: registroDb.produtoId,
    projetoId: registroDb.projetoId,
    isoScoreEstimado: registroDb.isoScoreEstimado,
    isoGapCount: registroDb.isoGapCount,
    plRiscoNivel: registroDb.plRiscoNivel,
    plRiscoNivelEfetivo,
    aipdObrigatoria,
    plReclassificadoConsultor:
      registroDb.pl2338Confirmado &&
      registroDb.plRiscoNivelConfirmado &&
      registroDb.plRiscoNivelConfirmado !== registroDb.plRiscoNivel,
    lgpdRiscoNivel: registroDb.lgpdRiscoNivel,
    lgpdRipdConfirmado: registroDb.lgpdRipdConfirmado,
    lgpdRipdOverride: registroDb.lgpdRipdOverride,
    lgpdRipdEfetivo: ripdNecessarioEfetivo(registroDb),
    lgpdReclassificadoConsultor:
      registroDb.lgpdRipdConfirmado &&
      registroDb.lgpdRipdOverride != null &&
      registroDb.lgpdRipdOverride !== (registroDb.lgpdDetalhes?.ripdNecessario === true),
    isoDetalhes: registroDb.isoDetalhes,
    plDetalhes: registroDb.plDetalhes,
    lgpdDetalhes: registroDb.lgpdDetalhes,
    validadoConsultor: registroDb.validadoConsultor,
    validadoEm: registroDb.validadoEm,
    validadoPorUsuarioId: registroDb.validadoPorUsuarioId,
    validadoPorUsuario: validador
      ? { id: validador.id, nome: validador.nome, email: validador.email }
      : null,
    pl2338Confirmado: registroDb.pl2338Confirmado,
    plRiscoNivelConfirmado: registroDb.plRiscoNivelConfirmado,
    lgpdBaseLegal: registroDb.lgpdBaseLegal,
    aipdStatus: registroDb.aipdStatus || 'nao_iniciada',
    isoOverride: registroDb.isoOverride,
    consultorNotas: registroDb.consultorNotas,
    disclaimer: DISCLAIMER_REGULATORIO,
    calculadoEm: registroDb.updatedAt,
    fontes: base.fontes,
    resumo: {
      plLabel: plRiscoNivelEfetivo,
      isoConformidadePct: registroDb.isoScoreEstimado,
      lgpdRipd: ripdNecessarioEfetivo(registroDb),
      aipdObrigatoria
    }
  };

  return { ...snapshot, ...avaliarAlertasRegulatorios(snapshot) };
}

export async function confirmarSnapshotConsultor(prisma, produtoId, usuarioId, body = {}) {
  const existente = await prisma.regulatorySnapshot.findUnique({ where: { produtoId } });
  if (!existente) {
    const err = new Error('Snapshot regulatório não encontrado para este produto');
    err.status = 404;
    throw err;
  }

  const plConfirmado = body.pl2338Confirmado !== false;
  let plRiscoNivelConfirmado =
    body.plRiscoNivelConfirmado ??
    (plConfirmado ? existente.plRiscoNivelConfirmado || existente.plRiscoNivel : null);
  if (plRiscoNivelConfirmado != null && plRiscoNivelConfirmado !== '') {
    const nivel = String(plRiscoNivelConfirmado).trim().toUpperCase();
    if (!PL_NIVEIS_VALIDOS.includes(nivel)) {
      const err = new Error(`plRiscoNivelConfirmado inválido. Use: ${PL_NIVEIS_VALIDOS.join(', ')}`);
      err.status = 400;
      throw err;
    }
    plRiscoNivelConfirmado = nivel;
  } else {
    plRiscoNivelConfirmado = null;
  }

  let aipdStatus = body.aipdStatus ?? existente.aipdStatus ?? 'nao_iniciada';
  if (aipdStatus && !AIPD_STATUS_OPCOES.includes(aipdStatus)) {
    const err = new Error(`aipdStatus inválido. Use: ${AIPD_STATUS_OPCOES.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const lgpdRipdConfirmado = body.lgpdRipdConfirmado === true;
  let lgpdRipdOverride = existente.lgpdRipdOverride;
  if (body.lgpdRipdOverride !== undefined) {
    if (body.lgpdRipdOverride === null || body.lgpdRipdOverride === '') {
      lgpdRipdOverride = null;
    } else {
      lgpdRipdOverride = body.lgpdRipdOverride === true || body.lgpdRipdOverride === 'true';
    }
  } else if (lgpdRipdConfirmado && body.lgpdRipdNecessario !== undefined) {
    lgpdRipdOverride = body.lgpdRipdNecessario === true || body.lgpdRipdNecessario === 'true';
  }

  const marcarValidado = body.validadoConsultor !== false;

  const atualizado = await prisma.regulatorySnapshot.update({
    where: { produtoId },
    data: {
      pl2338Confirmado: plConfirmado,
      plRiscoNivelConfirmado: plConfirmado ? plRiscoNivelConfirmado : null,
      lgpdBaseLegal: body.lgpdBaseLegal != null ? String(body.lgpdBaseLegal).trim() || null : existente.lgpdBaseLegal,
      lgpdRipdConfirmado: lgpdRipdConfirmado,
      lgpdRipdOverride: lgpdRipdConfirmado ? lgpdRipdOverride : null,
      aipdStatus,
      isoOverride: body.isoOverride !== undefined ? body.isoOverride : existente.isoOverride,
      consultorNotas: body.consultorNotas != null ? String(body.consultorNotas).trim() || null : existente.consultorNotas,
      validadoConsultor: marcarValidado,
      validadoEm: marcarValidado ? new Date() : null,
      validadoPorUsuarioId: marcarValidado ? usuarioId : null
    }
  });

  const validador = marcarValidado
    ? await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { id: true, nome: true, email: true }
      })
    : null;

  return formatarSnapshotResposta(atualizado, null, validador);
}

export async function obterRegulatorySnapshotProduto(prisma, produtoId) {
  const snap = await prisma.regulatorySnapshot.findUnique({ where: { produtoId } });
  if (!snap) return null;

  let validador = null;
  if (snap.validadoPorUsuarioId) {
    validador = await prisma.usuario.findUnique({
      where: { id: snap.validadoPorUsuarioId },
      select: { id: true, nome: true, email: true }
    });
  }

  return formatarSnapshotResposta(snap, null, validador);
}

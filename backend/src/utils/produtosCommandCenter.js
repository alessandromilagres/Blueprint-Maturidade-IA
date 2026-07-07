/**
 * Command Center de Produtos IA-First — agrega numa só resposta:
 * scores (relevância, transformação agêntica, verticais, prioridade estratégica),
 * economia de construção (tradicional × agêntica via EspecificacaoProduto),
 * risco regulatório (PL 2338 / ISO 42001 / LGPD / AIPD),
 * ROI/payback e iniciativas do roadmap vinculadas (lente produto).
 *
 * Reusa os motores existentes; não recalcula nem altera avaliações.
 */
import { obterRegulatorySnapshotsProdutosEmLote } from './regulatorioSnapshot.js';

export const PL_RISCO_PESO = { MINIMO: 1, BAIXO: 2, ALTO: 3, INACEITAVEL: 4 };

function farolTransformacao(score) {
  if (!score || score === 0) return { cor: 'gray', nivel: 'Não Avaliado', emoji: '⚪' };
  if (score < 2.0) return { cor: 'red', nivel: 'Crítico', emoji: '🔴' };
  if (score < 3.0) return { cor: 'orange', nivel: 'Atenção', emoji: '🟠' };
  if (score < 4.0) return { cor: 'yellow', nivel: 'Moderado', emoji: '🟡' };
  if (score < 4.5) return { cor: 'green', nivel: 'Bom', emoji: '🟢' };
  return { cor: 'emerald', nivel: 'Excelente', emoji: '💚' };
}

function farolUrgencia(scoreRelevancia, totalAv) {
  if (!scoreRelevancia || scoreRelevancia === 0) return { cor: 'gray', nivel: 'Aguardando', emoji: '⏳', prioridade: 0 };
  if (scoreRelevancia >= 4.0 && totalAv >= 2) return { cor: 'emerald', nivel: 'Pronto p/ Deploy', emoji: '🎯', prioridade: 5 };
  if (scoreRelevancia >= 3.5 && totalAv >= 2) return { cor: 'green', nivel: 'Prioridade Alta', emoji: '🔥', prioridade: 4 };
  if (scoreRelevancia >= 3.0) return { cor: 'yellow', nivel: 'Em Análise', emoji: '🔍', prioridade: 3 };
  if (scoreRelevancia >= 2.0) return { cor: 'orange', nivel: 'Requer Ajustes', emoji: '⚠️', prioridade: 2 };
  return { cor: 'red', nivel: 'Revisar Escopo', emoji: '❌', prioridade: 1 };
}

function scoreObrigatorioPonderado(avaliacoes, perguntasObrigatorias) {
  const porPergunta = perguntasObrigatorias.map((pergunta) => {
    let soma = 0;
    let count = 0;
    for (const av of avaliacoes) {
      const r = av.respostasObrigatorias?.find(
        (x) => x.perguntaObrigatoriaId === pergunta.id && x.pontuacao !== null
      );
      if (r) { soma += r.pontuacao; count++; }
    }
    return {
      perguntaId: pergunta.id,
      numero: pergunta.numero,
      categoria: pergunta.categoria,
      texto: pergunta.texto,
      peso: pergunta.peso,
      score: count > 0 ? parseFloat((soma / count).toFixed(2)) : 0
    };
  });

  let score = 0;
  let pesoTotal = 0;
  for (const p of porPergunta) {
    if (p.score > 0) { score += p.score * p.peso; pesoTotal += p.peso; }
  }
  return {
    scoreObrigatorio: pesoTotal > 0 ? parseFloat((score / pesoTotal).toFixed(2)) : 0,
    porPergunta
  };
}

function scoresVerticais(avaliacoes, verticais) {
  const porVertical = verticais.map((vertical) => {
    let soma = 0;
    let count = 0;
    for (const av of avaliacoes) {
      for (const pergunta of vertical.perguntas) {
        const r = av.respostasVerticais?.find(
          (x) => x.perguntaProdutoId === pergunta.id && x.pontuacao !== null
        );
        if (r) { soma += r.pontuacao; count++; }
      }
    }
    return {
      verticalId: vertical.id,
      nome: vertical.nome,
      icone: vertical.icone,
      foco: vertical.foco,
      score: count > 0 ? parseFloat((soma / count).toFixed(2)) : 0
    };
  });
  const comScore = porVertical.filter((v) => v.score > 0);
  const media = comScore.length > 0
    ? parseFloat((comScore.reduce((a, v) => a + v.score, 0) / comScore.length).toFixed(2))
    : 0;
  return { scoreVerticais: media, porVertical };
}

function economiaDeEspecificacao(espec) {
  if (!espec) return null;
  const custoTrad = espec.custoTradicional || 0;
  const custoAg = espec.custoAgentica || 0;
  const economiaValor = custoTrad > 0 && custoAg > 0 ? custoTrad - custoAg : null;
  const economiaPct = custoTrad > 0 && custoAg > 0
    ? parseFloat((((custoTrad - custoAg) / custoTrad) * 100).toFixed(1))
    : null;
  return {
    especificacaoId: espec.id,
    versao: espec.versao,
    storyPoints: espec.storyPointsTotais,
    tradicional: {
      custo: custoTrad,
      prazoSemanas: espec.prazoTradicional,
      equipe: espec.equipeTradicional,
      horas: espec.horasTradicional
    },
    agentica: {
      custo: custoAg,
      prazoSemanas: espec.prazoAgentica,
      equipe: espec.equipeAgentica,
      horas: espec.horasAgentica
    },
    economiaValor,
    economiaPct
  };
}

export async function montarProdutosCommandCenter(prisma, projetoId, opts = {}) {
  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    include: {
      empresa: true,
      produtos: {
        include: {
          vertical: true,
          avaliacoes: {
            where: { status: 'finalizada' },
            include: {
              usuario: true,
              respostasObrigatorias: { include: { perguntaObrigatoria: true } },
              respostasVerticais: { include: { perguntaProduto: { include: { vertical: true } } } }
            }
          },
          especificacoes: {
            where: { status: { in: ['concluido', 'aprovado', 'revisando'] } },
            orderBy: { versao: 'desc' },
            take: 1
          }
        },
        orderBy: [{ classificacao: 'asc' }, { scoreRelevancia: 'desc' }]
      }
    }
  });

  if (!projeto) {
    const err = new Error('Projeto não encontrado');
    err.status = 404;
    throw err;
  }

  const [perguntasObrigatorias, verticais, iniciativasProduto] = await Promise.all([
    prisma.perguntaObrigatoriaProduto.findMany({ orderBy: { ordem: 'asc' } }),
    prisma.verticalProduto.findMany({
      include: { perguntas: { orderBy: { numero: 'asc' } } },
      orderBy: { ordem: 'asc' }
    }),
    prisma.iniciativa.findMany({
      where: { projetoId, contextoTipo: 'produto' },
      orderBy: [{ prioridade: 'asc' }, { createdAt: 'asc' }]
    })
  ]);

  const iniciativasPorProduto = new Map();
  for (const ini of iniciativasProduto) {
    const chave = String(ini.contextoId);
    if (!iniciativasPorProduto.has(chave)) iniciativasPorProduto.set(chave, []);
    iniciativasPorProduto.get(chave).push(ini);
  }

  const snapshotsPorProduto = await obterRegulatorySnapshotsProdutosEmLote(
    prisma,
    projeto.produtos.map((p) => p.id)
  );

  const produtos = [];
  for (const produto of projeto.produtos) {
    const avaliacoes = produto.avaliacoes || [];
    const totalAvaliacoes = avaliacoes.length;

    const { scoreObrigatorio, porPergunta } = scoreObrigatorioPonderado(avaliacoes, perguntasObrigatorias);
    const { scoreVerticais: scoreVert, porVertical } = scoresVerticais(avaliacoes, verticais);

    const custoEstimado = produto.custoEstimado || 0;
    const retornoAnual = produto.retornoAnualEsperado || 0;
    const roiIndividual = custoEstimado > 0 ? parseFloat(((retornoAnual / custoEstimado) * 100).toFixed(1)) : 0;
    const paybackMeses = retornoAnual > 0 ? Math.ceil(custoEstimado / (retornoAnual / 12)) : null;

    // Regulatório (sem recalcular: só lê snapshot existente, carregado em lote)
    let regulatorio = null;
    try {
      const fmt = snapshotsPorProduto.get(produto.id);
      if (fmt) {
        regulatorio = {
          plRiscoNivel: fmt.plRiscoNivelEfetivo,
          plRiscoPeso: PL_RISCO_PESO[fmt.plRiscoNivelEfetivo] || 0,
          isoConformidadePct: fmt.isoScoreEstimado,
          isoGapCount: fmt.isoGapCount,
          lgpdRiscoNivel: fmt.lgpdRiscoNivel,
          lgpdRipd: fmt.lgpdRipdEfetivo,
          aipdObrigatoria: fmt.aipdObrigatoria,
          aipdStatus: fmt.aipdStatus,
          validadoConsultor: fmt.validadoConsultor,
          alertas: fmt.alertas || []
        };
      }
    } catch {
      /* snapshot opcional */
    }

    const espec = economiaDeEspecificacao((produto.especificacoes || [])[0]);
    const iniciativas = iniciativasPorProduto.get(String(produto.id)) || [];

    const prioridadeEstrategica = produto.scorePrioridadeEstrategica || 0;
    const scoreRelevancia = produto.scoreRelevancia || 0;

    produtos.push({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      status: produto.status,
      faseAtual: produto.faseAtual,
      complexidade: produto.complexidade,
      statusConstrucao: produto.statusConstrucao || 'planejado',
      vertical: produto.vertical ? { id: produto.vertical.id, nome: produto.vertical.nome, icone: produto.vertical.icone } : null,
      classificacao: produto.classificacao,
      totalAvaliacoes,

      scoreRelevancia: parseFloat(scoreRelevancia.toFixed(2)),
      scoreObrigatorio,
      scoreVerticais: scoreVert,
      scoreBlueprint: produto.scoreBlueprint || 0,
      scorePrioridadeEstrategica: parseFloat(prioridadeEstrategica.toFixed(2)),

      // métricas brutas para a matriz configurável no frontend
      metricas: {
        relevancia: parseFloat(scoreRelevancia.toFixed(2)),
        prontidaoAgentica: scoreObrigatorio,
        potencialVertical: scoreVert,
        prioridadeEstrategica: parseFloat(prioridadeEstrategica.toFixed(2)),
        roi: roiIndividual,
        custoAgentico: espec?.agentica?.custo ?? custoEstimado,
        prazoAgentico: espec?.agentica?.prazoSemanas ?? null,
        riscoRegulatorioPeso: regulatorio?.plRiscoPeso ?? 0,
        economiaPct: espec?.economiaPct ?? null
      },

      financeiro: {
        custoEstimado,
        retornoAnualEsperado: retornoAnual,
        roiIndividual,
        paybackMeses
      },
      cronograma: {
        dataInicioConstrucao: produto.dataInicioConstrucao,
        dataFimConstrucao: produto.dataFimConstrucao,
        dataAtivacaoProducao: produto.dataAtivacaoProducao,
        observacoesCronograma: produto.observacoesCronograma
      },
      especificacao: espec,
      regulatorio,
      farois: {
        transformacao: farolTransformacao(scoreObrigatorio),
        urgencia: farolUrgencia(scoreRelevancia, totalAvaliacoes)
      },
      scoresPorPerguntaObrigatoria: porPergunta,
      scoresPorVertical: porVertical,
      iniciativas: iniciativas.map((i) => ({
        id: i.id,
        titulo: i.titulo,
        status: i.status,
        prioridade: i.prioridade,
        progresso: i.progresso,
        dataFimPrevista: i.dataFimPrevista
      })),
      avaliadores: avaliacoes.map((a) => ({
        id: a.usuario.id,
        nome: a.usuario.nome,
        email: a.usuario.email,
        scoreRelevancia: a.scoreRelevancia,
        scoreObrigatorio: a.scoreObrigatorio,
        scoreVerticais: a.scoreVerticais,
        dataAvaliacao: a.updatedAt
      }))
    });
  }

  // KPIs do portfólio
  const avaliados = produtos.filter((p) => p.scoreRelevancia > 0);
  const scoreMedio = avaliados.length > 0
    ? parseFloat((avaliados.reduce((a, p) => a + p.scoreRelevancia, 0) / avaliados.length).toFixed(2))
    : 0;
  const custoTotalAgentico = produtos.reduce((a, p) => a + (p.metricas.custoAgentico || 0), 0);
  const retornoTotal = produtos.reduce((a, p) => a + (p.financeiro.retornoAnualEsperado || 0), 0);
  const custoTotalEstimado = produtos.reduce((a, p) => a + (p.financeiro.custoEstimado || 0), 0);
  const roiAgregado = custoTotalEstimado > 0
    ? parseFloat(((retornoTotal / custoTotalEstimado) * 100).toFixed(1))
    : 0;
  const economiaTotal = produtos.reduce((a, p) => {
    const e = p.especificacao?.economiaValor;
    return a + (e && e > 0 ? e : 0);
  }, 0);
  const altoRiscoRegulatorio = produtos.filter((p) => (p.regulatorio?.plRiscoPeso || 0) >= 3).length;
  const validacaoPendente = produtos.filter((p) => p.regulatorio && !p.regulatorio.validadoConsultor).length;
  const aipdPendente = produtos.filter(
    (p) => p.regulatorio?.aipdObrigatoria && p.regulatorio?.aipdStatus !== 'concluida'
  ).length;

  return {
    projeto: { id: projeto.id, nome: projeto.nome, descricao: projeto.descricao, vertical: projeto.vertical },
    empresa: projeto.empresa,
    kpis: {
      totalProdutos: produtos.length,
      produtosAvaliados: avaliados.length,
      scoreMedioRelevancia: scoreMedio,
      roiAgregado,
      custoTotalAgentico,
      economiaTotalAgentica: economiaTotal,
      altoRiscoRegulatorio,
      validacaoPendente,
      aipdPendente
    },
    catalogo: {
      perguntasObrigatorias,
      verticais: verticais.map((v) => ({ id: v.id, nome: v.nome, icone: v.icone, foco: v.foco }))
    },
    produtos
  };
}

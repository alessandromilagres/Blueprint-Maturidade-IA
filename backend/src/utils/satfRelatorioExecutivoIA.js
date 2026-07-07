/**
 * Relatório executivo IA — projetos SATF TI v3.
 */
import { prisma } from '../lib/prisma.js';
import { salvarRelatorioIA } from '../routes/relatorios-ia.js';
import { callAIWithContinuation, getProvider, loadPersistedAIConfig } from '../services/ai-provider.js';
import { SYSTEM_PROMPT_PERSONA_BOOK_SATF } from '../constants/consultorRelatorioIA.js';
import { FRAMEWORK_SATF_TI_V3 } from '../constants/frameworkMaturidadePolicy.js';
import { listarAreasDoProjeto } from './areaFrameworkCatalog.js';
import { mapaApresentacaoDimensoes } from './projetoDimensoesConfig.js';
import { calcularScoresConsolidadoMaturidade, nivelNumericoDeScore } from './scoresConsolidadoProjetoMaturidade.js';
import { enriquecerScoresDashboardSatf } from './projetoDimensaoCertificacao.js';
import {
  ordenarAreasPorFramework,
  blocoOrdemDimensoesFrameworkMarkdown,
  TOTAL_DIMENSOES_SATF
} from './ordemDimensoesFramework.js';
import { montarComparativoVersoesProjeto, blocoEvolucaoVersoesMarkdown, blocoLogicaMaturidadeMarkdown } from './evolucaoVersoesProjeto.js';
import {
  blocoContextoProjetoMarkdown,
  projetoTemContextoCadastrado,
  blocoInstrucoesSistemaExecutivoComContexto
} from './projetoContexto.js';
import {
  blocoAvaliadoresConsolidadoMarkdown,
  filtroNivelRelatorioIACompativel,
  parseFiltroNivelPrioridadeMapeamentoMaturidadeMax,
  prependCapaNivelAvaliadoresAoRelatorio,
  usuarioIncluidoNoFiltroNivelMapeamentoMaturidade
} from './nivelPrioridadeMapeamentoMaturidade.js';
import { resolverLogoEmpresa } from './empresaLogo.js';
import { NOMES_NIVEL_BLUEPRINT } from './nivelMaturidadeRubrica.js';
import { metodologiaScoreFramework } from './frameworkScoringPolicy.js';
import {
  blocoDesejosIaResumoExecutivo,
  projetoTemDesejosIaCadastrados,
  blocoInstrucoesDesejosIaSistemaExecutivo
} from './blocoDesejosIaBook.js';
import { desejosIaTemRespostasGuardadas } from './desejosIaAvaliacaoMaturidade.js';
import {
  blocoTaxonomiaObrigatoriaSatfMarkdown,
  blocoRegrasTaxonomiaSatfPrompt,
  capaConfidencialBookSatfMarkdown,
  validarTaxonomiaBookSatf
} from './satfBookTaxonomia.js';
import { carregarFrameworkProjeto } from './projetoFramework.js';

function mediaSetorTiBenchmark(setor) {
  const s = String(setor || '').toLowerCase();
  const mapa = {
    fintech: 3.0,
    financeiro: 3.0,
    banco: 3.0,
    saude: 2.5,
    health: 2.5,
    tecnologia: 3.3,
    tech: 3.3,
    varejo: 2.8,
    ecommerce: 2.8,
    industria: 2.3,
    manufatura: 2.3
  };
  return mapa[s] ?? 2.9;
}

const SYSTEM_PROMPT_EXECUTIVO_SATF = `${SYSTEM_PROMPT_PERSONA_BOOK_SATF}

Você redige um **Relatório Executivo SATF TI v3** para **CTO, VP Engenharia e heads de plataforma/delivery** — não C-Level genérico enterprise.

DIRETRIZES:
1. Tom direto, foco em engenharia, plataforma, SDLC agêntico, legado, governança técnica e conformidade de IA em TI.
2. Use **score oficial** SATF (certificado/teto por evidência); explique gap vs declarado quando existir.
3. **Somente** dimensões SATF D1–D11 — proibido Blueprint 16, MIT CISR como metodologia ou taxonomias genéricas.
4. Conecte gaps a risco operacional (delivery, qualidade, custo de inferência, compliance técnico).
5. Markdown; tabelas quando útil; 5 seções conforme estrutura pedida.`;

function montarPromptExecutivoSatf({
  projeto,
  projetoVersao,
  avaliacoesFiltradas,
  filtroNivelMax,
  dimensoesRelatorio,
  dimensoesForaEscopo,
  scoreGeral,
  scoreGeralDeclarado,
  certificacaoSatf,
  nivel,
  setor,
  porte,
  mediaSetor,
  top3,
  bottom3,
  blocoContexto,
  blocoDesejosIa,
  blocoEvolucao,
  blocoLogicaMaturidade,
  metodologiaScore,
  temContexto,
  temDesejosIa
}) {
  const nomesNivel = NOMES_NIVEL_BLUEPRINT;
  const blocoCert = certificacaoSatf
    ? `- Certificação consultor: **${certificacaoSatf.statusGeral}** (pendentes ${certificacaoSatf.pendentes}, certificadas ${certificacaoSatf.certificadas})`
    : '';

  return `${blocoRegrasTaxonomiaSatfPrompt()}

Analise os dados e gere o **Relatório Executivo SATF TI v3** em Markdown.

ESTRUTURA OBRIGATÓRIA (5 seções):

# Seção 1: Executive Summary (TI / Engenharia)
- Situação atual: score **oficial**, nível, gap vs declarado (se houver), status de certificação.
- Posição vs benchmark TI/setor (${mediaSetor.toFixed(1)}).
- 3 insights ancorados em dimensões SATF e contexto do projeto (entregáveis A–H se cadastrados).

# Seção 2: Diagnóstico Estratégico de Engenharia
- 2 forças e 2 gaps críticos entre dimensões SATF com score > 0.
- Cite dimensões como **Dn — Nome oficial SATF**.

# Seção 3: Riscos de Inércia vs. Ganho de Maturidade TI
- Tabela: cenário atual vs. evolução 1 nível (capacidades de engenharia/plataforma, não ROI enterprise genérico).
- Sem MIT CISR como framework; pode citar benchmark de mercado em 1 frase se pertinente.

# Seção 4: Roadmap 30-60-90 (Engenharia & Plataforma)
- 3 horizontes com ações concretas ligadas a dimensões SATF (D4, D5, D7, D8, D10, D11 conforme gaps).
- Owners sugeridos: CTO, Head Plataforma, Eng Manager, etc.

# Seção 5: Decisões Imediatas para Liderança de TI
- 3 decisões com prazo, entregável e dimensão SATF relacionada.

${temContexto ? blocoInstrucoesSistemaExecutivoComContexto() : ''}
${temDesejosIa ? blocoInstrucoesDesejosIaSistemaExecutivo() : ''}

DADOS DO ASSESSMENT SATF:
- Empresa: ${projeto.empresa.nome}
- Projeto: ${projeto.nome}
- Versão: ${projetoVersao.titulo} (${projetoVersao.status})
- Setor: ${setor} · Porte: ${porte}
- Score oficial: ${scoreGeral.toFixed(2)} (Nível ${nivel} — ${nomesNivel[nivel - 1]})
${scoreGeralDeclarado != null && scoreGeralDeclarado !== scoreGeral ? `- Score declarado: ${scoreGeralDeclarado.toFixed(2)}` : ''}
${blocoCert}
- Média referência TI: ${mediaSetor.toFixed(1)}
- Avaliadores (filtro): ${avaliacoesFiltradas.length}

Top 3 forças:
${top3.map((a) => `- ${a.area}: ${a.score.toFixed(2)}`).join('\n')}

Top 3 gaps:
${bottom3.map((a) => `- ${a.area}: ${a.score.toFixed(2)}`).join('\n')}

${blocoOrdemDimensoesFrameworkMarkdown(FRAMEWORK_SATF_TI_V3)}

Dimensões (${dimensoesRelatorio.length}):
${dimensoesRelatorio
  .map((a) => {
    const gap =
      a.scoreDeclarado != null && a.score != null && Math.abs(a.scoreDeclarado - a.score) > 0.05
        ? ` · decl ${a.scoreDeclarado.toFixed(2)}`
        : '';
    const cert = a.certificacao?.status ? ` · cert ${a.certificacao.status}` : '';
    return `- ${a.area}: oficial ${a.score.toFixed(2)}${gap}${cert}${a.foraDeEscopo ? ' · fora escopo' : ''}${a.foraDaMediaGeral ? ' · fora média (D10)' : ''}`;
  })
  .join('\n')}
${(dimensoesForaEscopo || []).length ? `\nFora de escopo:\n${dimensoesForaEscopo.map((a) => `- ${a.area}`).join('\n')}` : ''}

${blocoAvaliadoresConsolidadoMarkdown(avaliacoesFiltradas, filtroNivelMax)}

${blocoTaxonomiaObrigatoriaSatfMarkdown(dimensoesRelatorio)}

${blocoContexto ? `\n${blocoContexto}\n` : ''}
${blocoDesejosIa ? `\n${blocoDesejosIa}\n` : ''}

${blocoLogicaMaturidade}

Metodologia score:
${metodologiaScore?.descricaoScore || ''}

${blocoEvolucao}

Gere o relatório completo. Metodologia = **SATF TI v3** exclusivamente.`;
}

export async function executarGeracaoRelatorioExecutivoSatf(req, res, deps) {
  const { obterVersaoSelecionadaProjeto, idsAvaliacoesDaVersao } = deps;

  const projetoId = parseInt(req.params.id, 10);
  const reuse = req.query.reuse !== 'false';
  const filtroNivelMax = parseFiltroNivelPrioridadeMapeamentoMaturidadeMax(req);
  const projetoVersao = await obterVersaoSelecionadaProjeto(req, projetoId);

  if (reuse) {
    const ultimoSalvo = await prisma.relatorioIA.findFirst({
      where: { projetoId, tipo: 'executivo' },
      orderBy: { createdAt: 'desc' }
    });
    if (ultimoSalvo) {
      const dadosSnap = ultimoSalvo.dadosSnapshot ? JSON.parse(ultimoSalvo.dadosSnapshot) : null;
      const taxonomia = validarTaxonomiaBookSatf(ultimoSalvo.conteudoMd || '');
      if (
        filtroNivelRelatorioIACompativel(dadosSnap, filtroNivelMax) &&
        Number(dadosSnap?.projetoVersao?.id || 0) === Number(projetoVersao?.id || 0) &&
        dadosSnap?.frameworkMaturidade === FRAMEWORK_SATF_TI_V3 &&
        taxonomia.ok
      ) {
        const empresaAtual = await prisma.projeto.findUnique({
          where: { id: projetoId },
          select: { empresa: { select: { id: true, logoPath: true } } }
        });
        const logoMeta = await resolverLogoEmpresa(empresaAtual?.empresa);
        return res.json({
          relatorio: ultimoSalvo.conteudoMd,
          provider: ultimoSalvo.provider,
          model: ultimoSalvo.modelo,
          tokens: { entrada: ultimoSalvo.tokensEntrada, saida: ultimoSalvo.tokensSaida },
          tempoResposta: ultimoSalvo.tempoGeracaoMs,
          dadosUsados: { ...dadosSnap, ...logoMeta },
          relatorioSalvoId: ultimoSalvo.id,
          versao: ultimoSalvo.versao,
          dataGeracao: ultimoSalvo.createdAt,
          fromCache: true,
          frameworkMaturidade: FRAMEWORK_SATF_TI_V3,
          tipoRelatorio: 'executivo',
          filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
          projetoVersao
        });
      }
    }
  }

  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    include: {
      empresa: true,
      avaliacoes: {
        where: { status: 'finalizada' },
        include: {
          usuario: true,
          desejosIADados: true,
          respostas: { include: { pergunta: { include: { area: true } } } }
        }
      }
    }
  });
  if (!projeto) return res.status(404).json({ error: 'Projeto não encontrado' });

  const idsAval = await idsAvaliacoesDaVersao(projetoId, projetoVersao.id);
  const avaliacoesFiltradas = projeto.avaliacoes.filter(
    (av) =>
      idsAval.has(Number(av.id)) &&
      usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(av.usuario, filtroNivelMax)
  );
  if (!avaliacoesFiltradas.length) {
    return res.status(400).json({
      error: 'Não há avaliações finalizadas para gerar o relatório SATF',
      projetoVersao
    });
  }

  const areas = ordenarAreasPorFramework(await listarAreasDoProjeto(prisma, projeto.id));
  const { porAreaId: dimensoesConfig, setorRegulado } = await mapaApresentacaoDimensoes(prisma, projetoId);
  const { frameworkMaturidade } = await carregarFrameworkProjeto(prisma, projetoId);
  const metodologiaScore = metodologiaScoreFramework(frameworkMaturidade, { setorRegulado });

  const consolidado = calcularScoresConsolidadoMaturidade(avaliacoesFiltradas, areas, {
    dimensoesConfig
  });
  let dimensoesRelatorio = consolidado.todasDimensoes;
  let scoreGeral = consolidado.scoreGeral;
  let scoreGeralDeclarado = scoreGeral;
  let certificacaoSatf = null;

  const todasComScore = [
    ...consolidado.scoresPorArea,
    ...(consolidado.dimensoesEspecializadas || []),
    ...(consolidado.dimensoesForaEscopo || [])
  ];
  const satf = await enriquecerScoresDashboardSatf(
    prisma,
    projetoId,
    avaliacoesFiltradas,
    todasComScore,
    dimensoesConfig
  );
  if (satf) {
    scoreGeralDeclarado = consolidado.scoreGeral;
    scoreGeral = satf.scoreGeralOficial;
    certificacaoSatf = satf.certificacaoResumo;
    const porId = new Map(satf.scoresPorArea.map((a) => [a.areaId, a]));
    dimensoesRelatorio = dimensoesRelatorio.map((d) =>
      d.areaId != null ? { ...d, ...porId.get(d.areaId) } : d
    );
  }

  const nivel = nivelNumericoDeScore(scoreGeral);
  const ordenados = [...consolidado.scoresPorArea].sort((a, b) => b.score - a.score);
  const top3 = ordenados.slice(0, 3);
  const bottom3 = ordenados.slice(-3).reverse();
  const setor = projeto.vertical || projeto.empresa.setor || 'Tecnologia';
  const porte = projeto.empresa.porte || 'Não informado';
  const mediaSetor = mediaSetorTiBenchmark(setor);

  const blocoContexto = await blocoContextoProjetoMarkdown(prisma, projetoId);
  const temContexto = projetoTemContextoCadastrado(blocoContexto);
  const blocoDesejosIa = blocoDesejosIaResumoExecutivo(avaliacoesFiltradas);
  const temDesejosIa = projetoTemDesejosIaCadastrados(avaliacoesFiltradas);

  const comparativoVersoes = await montarComparativoVersoesProjeto(prisma, {
    projetoId,
    versaoAtualId: projetoVersao.id,
    avaliacoesFinalizadas: projeto.avaliacoes,
    areas,
    filtroNivelMax,
    usuarioIncluidoNoFiltro: usuarioIncluidoNoFiltroNivelMapeamentoMaturidade
  });
  const blocoEvolucao = blocoEvolucaoVersoesMarkdown(comparativoVersoes);
  const blocoLogicaMaturidade = blocoLogicaMaturidadeMarkdown({
    scoreGeral,
    nomesNivel: NOMES_NIVEL_BLUEPRINT,
    nivel,
    ponderacao: {
      ponderado: true,
      dimensoesForaEscopo: consolidado.dimensoesForaEscopo || []
    }
  });

  const userPrompt = montarPromptExecutivoSatf({
    projeto,
    projetoVersao,
    avaliacoesFiltradas,
    filtroNivelMax,
    dimensoesRelatorio,
    dimensoesForaEscopo: consolidado.dimensoesForaEscopo,
    scoreGeral,
    scoreGeralDeclarado,
    certificacaoSatf,
    nivel,
    setor,
    porte,
    mediaSetor,
    top3,
    bottom3,
    blocoContexto,
    blocoDesejosIa,
    blocoEvolucao,
    blocoLogicaMaturidade,
    metodologiaScore,
    temContexto,
    temDesejosIa
  });

  await loadPersistedAIConfig();
  console.log(`[Relatório IA SATF] Gerando executivo projeto ${projetoId} · ${getProvider().name}`);

  const resultado = await callAIWithContinuation(userPrompt, SYSTEM_PROMPT_EXECUTIVO_SATF, {
    temperature: 0.55,
    maxTokens: 8000
  }, { maxContinuations: 2, minContentTail: 800 });

  const validacaoTaxonomia = validarTaxonomiaBookSatf(resultado.content);
  if (!validacaoTaxonomia.ok) {
    console.warn(
      `[Relatório IA SATF] Contaminação taxonômica: ${validacaoTaxonomia.total}`,
      validacaoTaxonomia.ocorrencias.map((o) => o.nome).join('; ')
    );
  }

  const logoMeta = await resolverLogoEmpresa(projeto.empresa);
  const dadosUsados = {
    empresa: projeto.empresa.nome,
    projeto: projeto.nome,
    frameworkMaturidade: FRAMEWORK_SATF_TI_V3,
    ...logoMeta,
    setor,
    porte,
    scoreGeral,
    scoreGeralDeclarado,
    certificacaoSatf,
    nivel,
    mediaSetor,
    top3,
    bottom3,
    scoresPorArea: dimensoesRelatorio.map((a) => ({
      area: a.area,
      score: a.score,
      scoreDeclarado: a.scoreDeclarado,
      nivel: a.nivel,
      semDadosConsolidados: a.score === 0
    })),
    totalDimensoesFramework: TOTAL_DIMENSOES_SATF,
    totalAvaliadores: avaliacoesFiltradas.length,
    filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
    projetoVersao,
    comparativoVersoes,
    temDesejosIa,
    totalAvaliadoresComDesejosIa: temDesejosIa
      ? avaliacoesFiltradas.filter((av) =>
          desejosIaTemRespostasGuardadas(av.desejosIADados?.payload ?? av.desejosIA)
        ).length
      : 0
  };

  const corpo = `${capaConfidencialBookSatfMarkdown(projeto.empresa.nome, projeto.nome)}${resultado.content.trim()}`;
  const conteudoExecutivo = prependCapaNivelAvaliadoresAoRelatorio(corpo, {
    filtroMax: filtroNivelMax,
    avaliacoesFiltradas,
    empresaNome: projeto.empresa.nome,
    projetoNome: projeto.nome
  });

  let salvo = null;
  try {
    salvo = await salvarRelatorioIA({
      projetoId,
      tipo: 'executivo',
      titulo: `Relatório Executivo SATF TI — ${projeto.empresa.nome}`,
      conteudoMd: conteudoExecutivo,
      provider: resultado.provider,
      modelo: resultado.model,
      tokensEntrada: resultado.tokensEntrada,
      tokensSaida: resultado.tokensSaida,
      tempoGeracaoMs: resultado.tempoResposta,
      dadosUsados,
      geradoPorId: req.user?.id || null
    });
  } catch (e) {
    console.error('[Relatório IA SATF] Erro ao salvar:', e.message);
  }

  return res.json({
    relatorio: conteudoExecutivo,
    provider: resultado.provider,
    model: resultado.model,
    tokens: { entrada: resultado.tokensEntrada, saida: resultado.tokensSaida },
    tempoResposta: resultado.tempoResposta,
    dadosUsados,
    relatorioSalvoId: salvo?.id,
    versao: salvo?.versao,
    dataGeracao: salvo?.createdAt,
    fromCache: false,
    frameworkMaturidade: FRAMEWORK_SATF_TI_V3,
    tipoRelatorio: 'executivo',
    filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
    projetoVersao,
    validacaoTaxonomia,
    avisoTaxonomia: validacaoTaxonomia.ok
      ? null
      : `Relatório gerado com ${validacaoTaxonomia.total} possível(is) referência(s) a outra taxonomia — regenere antes de entregar.`
  });
}

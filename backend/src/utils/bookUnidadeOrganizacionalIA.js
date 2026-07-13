/**
 * Book de Trabalho por unidade organizacional — SysMap Blueprint IA (16 dimensões).
 * Outline: 1 Metodologia · 2 Sumário · 3 Diagnóstico 3.N (foco) · 4 Roadmap · 5 Próximos · Apêndices.
 */
import { prisma } from '../lib/prisma.js';
import { deveReutilizarRelatorioIASalvo } from './reutilizarRelatorioIA.js';
import { salvarRelatorioIA } from '../routes/relatorios-ia.js';
import { callAIWithContinuation, getProvider, loadPersistedAIConfig } from '../services/ai-provider.js';
import {
  SYSTEM_PROMPT_PERSONA_BOOK,
  SYSTEM_PROMPT_PERSONA_BOOK_RAPIDO
} from '../constants/consultorRelatorioIA.js';
import { FRAMEWORK_BLUEPRINT_16 } from '../constants/frameworkMaturidadePolicy.js';
import { listarAreasDoProjeto } from './areaFrameworkCatalog.js';
import { mapaApresentacaoDimensoes } from './projetoDimensoesConfig.js';
import {
  calcularScoresConsolidadoMaturidade,
  nivelNumericoDeScore
} from './scoresConsolidadoProjetoMaturidade.js';
import { dimensaoComScoreZero } from './bookModoRapidoMarkdown.js';
import { ordenarAreasPorFramework } from './ordemDimensoesFramework.js';
import {
  parseFiltroNivelPrioridadeMapeamentoMaturidadeMax,
  prependCapaNivelAvaliadoresAoRelatorio,
  blocoAvaliadoresConsolidadoMarkdown
} from './nivelPrioridadeMapeamentoMaturidade.js';
import { resolverLogoEmpresa } from './empresaLogo.js';
import { NOMES_NIVEL_BLUEPRINT } from './nivelMaturidadeRubrica.js';
import {
  blocoContextoProjetoMarkdown,
  projetoTemContextoCadastrado,
  carregarRegrasFatosContextoProjeto
} from './projetoContexto.js';
import { posicionarApendicesMetodologicosComoUltimaSecao } from './bookApendicesMetodologicos.js';
import { adicionarIndiceAoBookMarkdown } from './bookMarkdownIndice.js';
import { capaConfidencialBookSatfMarkdown } from './satfBookTaxonomia.js';
import {
  blocoDesejosIaMarkdown,
  projetoTemDesejosIaCadastrados
} from './blocoDesejosIaBook.js';
import {
  filtrarAvaliacoesRelatorioProjeto,
  metadadosUnidadeDadosUsados,
  prependCapaUnidadeAoRelatorio,
  relatorioUnidadeCacheCompativel,
  resolverContextoUnidadeRelatorioObrigatorio
} from './relatorioUnidadeIA.js';
import { garantirUnidadeGeralEmpresa } from './empresaUnidade.js';
import {
  gerarPlanoAcaoPorDimensao,
  instrucoesSistemaBookUnidade,
  montarBlocoPlanoAcaoDimensaoPrompt,
  planoAcaoPorNomeDimensao
} from './bookUnidadeContexto.js';
import {
  filtrarDimensoesFocoUnidade,
  dimensoesSecao3BookUnidade,
  montarBlocoDadosDimensaoUnica,
  montarCabecalhoDadosUnidade,
  montarResumoScoresDimensoes
} from './bookDadosDimensao.js';

function tipoRelatorioBookUnidadeBlueprint(modoRapido) {
  return modoRapido ? 'book_unidade_rapido' : 'book_unidade';
}

export async function executarGeracaoBookUnidadeBlueprint(req, res, deps) {
  const { obterVersaoSelecionadaProjeto, idsAvaliacoesDaVersao, atualizarProgressoJobBook } = deps;
  const projetoId = parseInt(req.params.id, 10);
  const reuse = deveReutilizarRelatorioIASalvo(req);
  const modoRapido = req.query.mode === 'rapido' || req.query.modo === 'rapido';
  const tipoRelatorio = tipoRelatorioBookUnidadeBlueprint(modoRapido);
  const filtroNivelMax = parseFiltroNivelPrioridadeMapeamentoMaturidadeMax(req);
  const projetoVersao = await obterVersaoSelecionadaProjeto(req, projetoId);

  const projetoEmp = await prisma.projeto.findUnique({
    where: { id: projetoId },
    select: { empresaId: true }
  });
  if (!projetoEmp) return res.status(404).json({ error: 'Projeto não encontrado' });

  const ctx = await resolverContextoUnidadeRelatorioObrigatorio(req, projetoEmp.empresaId);
  if (!ctx.ok) return res.status(ctx.status).json({ error: ctx.error });
  const { filtroUnidadeId, unidadeMeta, unidadeGeral } = ctx;

  if (reuse) {
    const ultimoSalvo = await prisma.relatorioIA.findFirst({
      where: { projetoId, tipo: tipoRelatorio },
      orderBy: { createdAt: 'desc' }
    });
    if (ultimoSalvo) {
      const dadosSnap = ultimoSalvo.dadosSnapshot ? JSON.parse(ultimoSalvo.dadosSnapshot) : null;
      if (
        relatorioUnidadeCacheCompativel(dadosSnap, {
          filtroNivelMax,
          filtroUnidadeId,
          projetoVersaoId: projetoVersao?.id
        }) &&
        dadosSnap?.escopoRelatorio === 'unidade_organizacional'
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
          chunksGerados: ultimoSalvo.chunksGerados,
          totalChunks: ultimoSalvo.totalChunks,
          dadosUsados: { ...dadosSnap, ...logoMeta },
          relatorioSalvoId: ultimoSalvo.id,
          versao: ultimoSalvo.versao,
          dataGeracao: ultimoSalvo.createdAt,
          fromCache: true,
          frameworkMaturidade: FRAMEWORK_BLUEPRINT_16,
          tipoRelatorio,
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

  const unidadeGeralEfetiva = unidadeGeral || (await garantirUnidadeGeralEmpresa(projeto.empresaId));
  const idsAval = await idsAvaliacoesDaVersao(projetoId, projetoVersao.id);
  const avaliacoesFiltradas = filtrarAvaliacoesRelatorioProjeto(projeto.avaliacoes, {
    idsVersao: idsAval,
    filtroNivelMax,
    filtroUnidadeId,
    unidadeGeralId: unidadeGeralEfetiva?.id
  });

  if (!avaliacoesFiltradas.length) {
    return res.status(400).json({
      error: 'Não há avaliações finalizadas de avaliadores desta unidade para gerar o book',
      projetoVersao,
      filtroEmpresaUnidade: unidadeMeta
    });
  }

  const areas = ordenarAreasPorFramework(await listarAreasDoProjeto(prisma, projeto.id));
  const { porAreaId: dimensoesConfig } = await mapaApresentacaoDimensoes(prisma, projetoId);
  const { scoresPorArea, todasDimensoes, scoreGeral } = calcularScoresConsolidadoMaturidade(
    avaliacoesFiltradas,
    areas,
    { dimensoesConfig }
  );
  const dimensoesDiagnostico = todasDimensoes;
  const nivel = nivelNumericoDeScore(scoreGeral);
  const nomesNivel = NOMES_NIVEL_BLUEPRINT;
  const setor = projeto.vertical || projeto.empresa.setor || 'Geral';
  const porte = projeto.empresa.porte || 'Não informado';
  const blocoContexto = await blocoContextoProjetoMarkdown(prisma, projetoId);
  const regrasFatos = await carregarRegrasFatosContextoProjeto(prisma, projetoId);
  const temContexto = projetoTemContextoCadastrado(blocoContexto);
  const blocoDesejosIa = blocoDesejosIaMarkdown(avaliacoesFiltradas);
  const temDesejosIa = projetoTemDesejosIaCadastrados(avaliacoesFiltradas);

  const dimensoesRelevantes = filtrarDimensoesFocoUnidade(dimensoesDiagnostico, unidadeMeta, 'mit');
  const dimsParaChunks = dimensoesSecao3BookUnidade(dimensoesDiagnostico, unidadeMeta, 'mit');
  const planoAcaoRelevante = gerarPlanoAcaoPorDimensao(
    dimensoesRelevantes.filter((d) => !dimensaoComScoreZero(d))
  );

  const instrucoesUnidade = instrucoesSistemaBookUnidade({
    unidadeMeta,
    frameworkMaturidade: FRAMEWORK_BLUEPRINT_16
  });

  const dadosResumoBase = `${montarCabecalhoDadosUnidade({
    empresa: projeto.empresa.nome,
    projeto: projeto.nome,
    unidadeNome: unidadeMeta.nome,
    setor,
    porte,
    scoreGeral,
    nivel,
    avaliadoresCount: avaliacoesFiltradas.length,
    frameworkLabel: 'SysMap Blueprint IA (16 dimensões)'
  })}
${blocoAvaliadoresConsolidadoMarkdown(avaliacoesFiltradas, filtroNivelMax)}

${montarResumoScoresDimensoes(dimensoesRelevantes)}

${blocoContexto ? `${blocoContexto}\n` : ''}${blocoDesejosIa ? `${blocoDesejosIa}\n` : ''}`;

  let markdown;
  await loadPersistedAIConfig();
  const systemBase = modoRapido ? SYSTEM_PROMPT_PERSONA_BOOK_RAPIDO : SYSTEM_PROMPT_PERSONA_BOOK;
  const systemPrompt = `${systemBase}
${instrucoesUnidade}
Gere SOMENTE o conteúdo solicitado em Markdown. Não duplique capas de avaliadores/unidade.`;

  const startTime = Date.now();
  let totalTokensEntrada = 0;
  let totalTokensSaida = 0;
  let providerUsado = getProvider().name;
  let modelUsado = getProvider().defaultModel;
  const partesMetodologia = [];
  const partesSumario = [];
  const partesDimensoes = [];
  const dimsComDadosLoop = dimsParaChunks.length ? dimsParaChunks : dimensoesRelevantes;
  const totalChunks = dimsComDadosLoop.length + 4;

  let relatorioJobId = null;
  const jobIdParam = req.query.jobId;
  if (jobIdParam != null && jobIdParam !== '') {
    const jid = parseInt(String(jobIdParam), 10);
    if (!Number.isNaN(jid) && jid > 0) {
      const jobRow = await prisma.relatorioIAJob.findFirst({
        where: { id: jid, projetoId, tipo: tipoRelatorio }
      });
      if (jobRow) relatorioJobId = jid;
    }
  }

  async function reportarProgresso(chunkAtual, mensagem) {
    if (!relatorioJobId || !atualizarProgressoJobBook) return;
    const pct = Math.min(
      95,
      12 + Math.round((chunkAtual / Math.max(totalChunks, 1)) * 78)
    );
    await atualizarProgressoJobBook(relatorioJobId, {
      progresso: pct,
      etapa: mensagem,
      metadata: JSON.stringify({
        fase: 'geracao',
        chunkAtual,
        totalChunks,
        mensagem
      })
    });
  }

  async function chamarIa(userPrompt, maxTokens) {
    const resultado = await callAIWithContinuation(
      userPrompt,
      systemPrompt,
      { temperature: 0.55, maxTokens },
      { maxContinuations: modoRapido ? 1 : 2, minContentTail: 600 }
    );
    totalTokensEntrada += resultado.tokensEntrada || 0;
    totalTokensSaida += resultado.tokensSaida || 0;
    providerUsado = resultado.provider || providerUsado;
    modelUsado = resultado.model || modelUsado;
    return resultado.content || '';
  }

  try {
  await reportarProgresso(0, 'Metodologia MIT da unidade');
  partesMetodologia.push(
    await chamarIa(
      `${dadosResumoBase}

Gere SOMENTE:

# 1. METODOLOGIA APLICADA (SysMap Blueprint IA)

## 1.1 Instrumento
Framework SysMap Blueprint IA com **16 dimensões** (referência metodológica MIT CISR), escala N1–N5 e leitura de score consolidado **desta unidade** (${unidadeMeta.nome}).

## 1.2 Como ler o diagnóstico
Score consolidado, nível de maturidade e escopo por dimensão em foco. **Não** crie "# 2." nem "# 3.".

${temContexto ? 'Use o contexto do cliente quando disponível.' : ''}`,
      modoRapido ? 2200 : 3500
    )
  );

  await reportarProgresso(1, 'Sumário executivo da unidade');
  partesSumario.push(
    await chamarIa(
      `${dadosResumoBase}

Gere SOMENTE:

# 2. SUMÁRIO EXECUTIVO

## 2.1 Panorama da unidade
1 parágrafo sobre a maturidade de IA **desta unidade** (${unidadeMeta.nome}), citando score ${scoreGeral.toFixed(2)} e contexto setorial.

## 2.2 Tabela consolidada
| Métrica | Valor |
|---------|:-----:|
| Score da unidade | ${scoreGeral.toFixed(2)} |
| Nível | ${nomesNivel[nivel - 1]} |
| Avaliadores | ${avaliacoesFiltradas.length} |

## 2.3 Cinco prioridades imediatas
Bullets numerados — o que a unidade deve fazer nos próximos 30 dias (específico). **PARE** antes de "# 3.".`,
      modoRapido ? 2200 : 3500
    )
  );

  for (let i = 0; i < dimsComDadosLoop.length; i++) {
    const dim = dimsComDadosLoop[i];
    const num = i + 1;
    await reportarProgresso(
      i + 2,
      `Dimensão ${num}/${dimsComDadosLoop.length}: ${dim.area}`
    );
    const planoDim = planoAcaoPorNomeDimensao(planoAcaoRelevante, dim.area);
    const blocoDim = montarBlocoDadosDimensaoUnica(dim, {
      scoreGeral,
      unidadeNome: unidadeMeta.nome
    });

    partesDimensoes.push(
      await chamarIa(
        `${dadosResumoBase}

${blocoDim}

Gere SOMENTE a subseção da dimensão **${dim.area}**:

## 3.${num} Dimensão — ${dim.area}

### 3.${num}.1 Análise Diagnóstica
2–3 parágrafos: score ${Number(dim.score).toFixed(2)}, nível N${dim.nivel || nivel}, cite perguntas [Qn] quando relevante; o que o score revela para a unidade ${unidadeMeta.nome}.

### 3.${num}.2 Evidências Críticas
- Fatores que elevaram o score (bullets com [Qn])
- Fatores que puxaram o score (bullets com [Qn])
- Lacunas de evidência

### 3.${num}.3 Risco de Negócio
1 parágrafo — consequências de manter este nível nesta unidade.

### 3.${num}.4 Benchmark Setorial
1 parágrafo — posição relativa vs expectativa de mercado/setorial para esta capacidade.

### 3.${num}.5 Recomendações Específicas
3–4 ações numeradas R1–Rn: owner, entregável, prazo 30/60/90.
${montarBlocoPlanoAcaoDimensaoPrompt(planoDim)}

### 3.${num}.6 KPIs de Acompanhamento
Tabela: KPI | Baseline | Meta 90d | Meta 12m (mínimo 3 linhas).
${dimensaoComScoreZero(dim) ? `\n> **Score individual 0 nesta rodada:** use score geral da unidade (${scoreGeral.toFixed(2)}) e contexto. **Obrigatório** preencher 3.${num}.1–3.${num}.6.` : ''}

${temDesejosIa ? 'Ancore ≥1 recomendação em Desejos IA quando pertinente.' : ''}`,
        modoRapido ? 2200 : 3600
      )
    );
  }

  const secao3 = `# 3. DIAGNÓSTICO POR DIMENSÃO — UNIDADE ${unidadeMeta.nome}\n\n${partesDimensoes.join('\n\n')}`;

  await reportarProgresso(totalChunks - 2, 'Roadmap 30-60-90 da unidade');
  const secao4 = await chamarIa(
    `${dadosResumoBase}

Plano rule-based prioritário (dimensões em foco):
${planoAcaoRelevante.map((p) => `- ${p.area} (${p.score}): ${p.acoes30Dias[0]}`).join('\n') || '—'}

Gere SOMENTE:

# 4. ROADMAP ENGENHARIA 30-60-90 DIAS DA UNIDADE

## 4.1 Visão integrada
Parágrafo conectando gaps da unidade ${unidadeMeta.nome} ao plano 30/60/90.

## 4.2 Cronograma
Tabela: Horizonte (30/60/90) | Iniciativa | Dimensão | Owner | Entregável | Status

## 4.3 Rituais de governança
Bullets: cadência de acompanhamento, métricas de revisão, critério de sucesso da unidade.`,
    modoRapido ? 2200 : 3500
  );

  await reportarProgresso(totalChunks - 1, 'Próximos passos da unidade');
  const secao5 = await chamarIa(
    `${dadosResumoBase}

Gere SOMENTE:

# 5. Próximos Passos e Encerramento

## 5.1 Ações prioritárias (30 dias)
7–10 ações numeradas com responsável, entregável e prazo — exclusivas da unidade ${unidadeMeta.nome}.

## 5.2 Critérios de sucesso
Bullets objetivos para a próxima rodada de avaliação.

## 5.3 Encerramento
1 parágrafo de fechamento executivo.`,
    modoRapido ? 2000 : 3200
  );

  markdown = `${partesMetodologia.join('\n\n')}\n\n${partesSumario.join('\n\n')}\n\n${secao3}\n\n${secao4}\n\n${secao5}`;
  await reportarProgresso(totalChunks, 'Finalizando book da unidade');
  } catch (iaErr) {
    console.error('[Book Unidade Blueprint] Falha na geração IA:', iaErr);
    return res.status(503).json({
      error: iaErr?.message?.includes('provedor de IA')
        ? 'Nenhum provedor de IA configurado no backend (.env).'
        : 'Erro ao gerar book por unidade com IA',
      details: iaErr?.message
    });
  }

  markdown = prependCapaUnidadeAoRelatorio(markdown, unidadeMeta);
  const relatorioComCapas = prependCapaNivelAvaliadoresAoRelatorio(markdown, {
    filtroMax: filtroNivelMax,
    avaliacoesFiltradas,
    empresaNome: projeto.empresa.nome,
    projetoNome: projeto.nome
  });
  let relatorioFinal = !modoRapido
    ? posicionarApendicesMetodologicosComoUltimaSecao(relatorioComCapas, {
        framework: 'blueprint',
        glossarioProjeto: regrasFatos.glossario
      })
    : relatorioComCapas;

  const comIndice = adicionarIndiceAoBookMarkdown(relatorioFinal, { modo: 'completo' });
  relatorioFinal = `${capaConfidencialBookSatfMarkdown(projeto.empresa.nome, projeto.nome)}${comIndice}`;

  const tempoTotal = Date.now() - startTime;
  const logoMeta = await resolverLogoEmpresa(projeto.empresa);
  const dadosUsados = {
    empresa: projeto.empresa.nome,
    projeto: projeto.nome,
    frameworkMaturidade: FRAMEWORK_BLUEPRINT_16,
    ...logoMeta,
    setor,
    porte,
    scoreGeral,
    nivel,
    scoresPorArea: dimensoesRelevantes.map((a) => ({
      area: a.area,
      score: a.score,
      nivel: a.nivel,
      semDadosConsolidados: dimensaoComScoreZero(a)
    })),
    totalDimensoesFramework: dimensoesRelevantes.length,
    totalAvaliadores: avaliacoesFiltradas.length,
    filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
    planoAcaoUnidade: planoAcaoRelevante,
    ...metadadosUnidadeDadosUsados(unidadeMeta, filtroUnidadeId),
    projetoVersao,
    modoGeracao: modoRapido ? 'book_unidade_rapido' : 'book_unidade',
    temDesejosIa
  };

  let salvo = null;
  try {
    salvo = await salvarRelatorioIA({
      projetoId,
      tipo: tipoRelatorio,
      titulo: modoRapido
        ? `Book por unidade (rápido) — ${unidadeMeta.nome} — ${projeto.empresa.nome}`
        : `Book por unidade — ${unidadeMeta.nome} — ${projeto.empresa.nome}`,
      conteudoMd: relatorioFinal,
      provider: providerUsado,
      modelo: modelUsado,
      tokensEntrada: totalTokensEntrada,
      tokensSaida: totalTokensSaida,
      tempoGeracaoMs: tempoTotal,
      chunksGerados: totalChunks,
      totalChunks,
      dadosUsados,
      geradoPorId: req.usuario?.id || null
    });
  } catch (e) {
    console.error('[Book Unidade Blueprint] Erro ao salvar:', e.message);
  }

  return res.json({
    relatorio: relatorioFinal,
    provider: providerUsado,
    model: modelUsado,
    tokens: { entrada: totalTokensEntrada, saida: totalTokensSaida },
    tempoResposta: tempoTotal,
    chunksGerados: totalChunks,
    totalChunks,
    dadosUsados,
    relatorioSalvoId: salvo?.id,
    versao: salvo?.versao,
    dataGeracao: salvo?.createdAt,
    fromCache: false,
    frameworkMaturidade: FRAMEWORK_BLUEPRINT_16,
    tipoRelatorio,
    filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
    projetoVersao
  });
}

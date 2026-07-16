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
import { blocoBenchmarkDimensaoPrompt } from './bibliotecaBenchmarksMercado.js';
import { montarPreliminaresBookSatfOrdemCanonica } from './bookMarkdownIndice.js';
import {
  sanitizarChunkDimensaoBookUnidadeBlueprint,
  sanitizarChunkSecaoPrincipalBookUnidade,
  normalizarSecoesBookUnidadeBlueprint
} from './bookUnidadeBlueprintNormalizar.js';
import {
  blocoDesejosIaMarkdown,
  projetoTemDesejosIaCadastrados
} from './blocoDesejosIaBook.js';
import {
  filtrarAvaliacoesRelatorioProjeto,
  metadadosUnidadeDadosUsados,
  relatorioUnidadeCacheCompativel,
  resolverContextoUnidadeRelatorioObrigatorio
} from './relatorioUnidadeIA.js';
import { garantirUnidadeGeralEmpresa } from './empresaUnidade.js';
import {
  resolverPapelDimensaoUnidade,
  blocoInstrucaoPapelDimensaoPrompt,
  labelPapelDimensaoUnidade,
  PAPEIS_DIMENSAO_UNIDADE
} from './empresaUnidade.js';
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
import {
  PROMPT_CONTEXTO_DIMENSAO_SAFE_CHARS,
  limitarBlocoMarkdown,
  shrinkPromptToCharBudget,
  softAiFailureMessageForBook
} from './aiPromptBudget.js';

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
  const blocoContextoBase = await blocoContextoProjetoMarkdown(prisma, projetoId);
  const regrasFatos = await carregarRegrasFatosContextoProjeto(prisma, projetoId, {
    unidadeMeta
  });
  const blocoContexto = regrasFatos.blocoFatosUnidade
    ? blocoContextoBase
      ? `${blocoContextoBase}\n\n${regrasFatos.blocoFatosUnidade}`
      : regrasFatos.blocoFatosUnidade
    : blocoContextoBase;
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

  /** Soft-fail: não aborta o book nem grava JSON bruto do provedor no markdown. */
  async function chamarIaComEsqueleto(userPrompt, maxTokens, { label, esqueleto }) {
    try {
      return await chamarIa(userPrompt, maxTokens);
    } catch (err) {
      console.error(`[Book Unidade Blueprint] Erro em ${label}:`, err?.message || err);
      return esqueleto(softAiFailureMessageForBook(err));
    }
  }

  try {
  await reportarProgresso(0, 'Metodologia MIT da unidade');
  partesMetodologia.push(
    sanitizarChunkSecaoPrincipalBookUnidade(
      await chamarIaComEsqueleto(
        `${dadosResumoBase}

Gere SOMENTE o corpo das subseções abaixo (o sistema já insere "# 1. …"). **Proibido** criar "# 2.", "# 3.", "# 4.", outras seções, títulos BP12/BPN como heading, ou outline enterprise.

## 1.1 Instrumento
Framework SysMap Blueprint IA com **16 dimensões** (referência metodológica MIT CISR), escala N1–N5 e leitura de score consolidado **desta unidade** (${unidadeMeta.nome}).

## 1.2 Como ler o diagnóstico
Score consolidado, nível de maturidade e escopo por dimensão em foco.

${temContexto ? 'Use o contexto do cliente quando disponível.' : ''}`,
        modoRapido ? 2200 : 3500,
        {
          label: 'metodologia',
          esqueleto: (msg) => `## 1.1 Instrumento

> ⚠️ ${msg}

Framework SysMap Blueprint IA (16 dimensões) — unidade **${unidadeMeta.nome}**.

## 1.2 Como ler o diagnóstico

Score consolidado da unidade: **${scoreGeral.toFixed(2)}** (Nível ${nomesNivel[nivel - 1]}).`
        }
      ),
      { num: 1, tituloPreferido: 'METODOLOGIA' }
    )
  );

  await reportarProgresso(1, 'Sumário executivo da unidade');
  partesSumario.push(
    sanitizarChunkSecaoPrincipalBookUnidade(
      await chamarIaComEsqueleto(
        `${dadosResumoBase}

Gere SOMENTE o corpo das subseções (o sistema insere "# 2. SUMÁRIO EXECUTIVO"). **Proibido** "# 3.", "# 4.", seções enterprise ou códigos BP como número de seção.

## 2.1 Panorama da unidade
1 parágrafo sobre a maturidade de IA **desta unidade** (${unidadeMeta.nome}), citando score ${scoreGeral.toFixed(2)} e contexto setorial.

## 2.2 Tabela consolidada
| Métrica | Valor |
|---------|:-----:|
| Score da unidade | ${scoreGeral.toFixed(2)} |
| Nível | ${nomesNivel[nivel - 1]} |
| Avaliadores | ${avaliacoesFiltradas.length} |

## 2.3 Cinco prioridades imediatas
Bullets numerados — o que a unidade deve fazer nos próximos 30 dias (específico).`,
        modoRapido ? 2200 : 3500,
        {
          label: 'sumário',
          esqueleto: (msg) => `## 2.1 Panorama da unidade

> ⚠️ ${msg}

Unidade **${unidadeMeta.nome}** — score **${scoreGeral.toFixed(2)}**.

## 2.2 Tabela consolidada
| Métrica | Valor |
|---------|:-----:|
| Score da unidade | ${scoreGeral.toFixed(2)} |
| Nível | ${nomesNivel[nivel - 1]} |
| Avaliadores | ${avaliacoesFiltradas.length} |

## 2.3 Cinco prioridades imediatas
1. Revisar dimensões com menor score desta unidade.
2. Definir owners e entregáveis em 30 dias.
3. Regenerar esta seção quando a IA estiver disponível.`
        }
      ),
      { num: 2, tituloPreferido: 'SUMÁRIO' }
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
    const papelUnidade = resolverPapelDimensaoUnidade(unidadeMeta, dim, 'mit');
    const blocoPapel = blocoInstrucaoPapelDimensaoPrompt({
      papel: papelUnidade,
      unidadeNome: unidadeMeta.nome,
      nomeDimensao: dim.area
    });
    const blocoDim = montarBlocoDadosDimensaoUnica(dim, {
      scoreGeral,
      unidadeNome: unidadeMeta.nome
    });
    const papelLabel =
      papelUnidade !== PAPEIS_DIMENSAO_UNIDADE.NAO_SE_APLICA
        ? labelPapelDimensaoUnidade(papelUnidade)
        : '';
    const dadosResumoDim = limitarBlocoMarkdown(
      dadosResumoBase,
      PROMPT_CONTEXTO_DIMENSAO_SAFE_CHARS + 4_000,
      'Dados resumo (prompt dimensão)'
    );

    try {
      const blocoBenchmarkMercado = blocoBenchmarkDimensaoPrompt('blueprint_mit', {
        ...dim,
        ordem: num
      });
      const promptDim = shrinkPromptToCharBudget(
        `${dadosResumoDim}

${blocoDim}
${blocoPapel}
${blocoBenchmarkMercado}

Gere SOMENTE as subseções ### 3.${num}.1–3.${num}.6 da dimensão **${dim.area}**.
O sistema já inserirá o heading "## 3.${num} Dimensão — ${dim.area}".
**Proibido:** qualquer "# …", "## …", "BP${num}" como número de seção, "# 4.", "# 5.", "Consolidação Estratégica", "SEÇÃO 3", roadmap ou outras dimensões.

### 3.${num}.1 Análise Diagnóstica
2–3 parágrafos: score ${Number(dim.score).toFixed(2)}, nível N${dim.nivel || nivel}, cite perguntas [Qn] quando relevante; o que o score revela para a unidade ${unidadeMeta.nome}.

### 3.${num}.2 Evidências Críticas
- Fatores que elevaram o score (bullets com [Qn])
- Fatores que puxaram o score (bullets com [Qn])
- Lacunas de evidência

### 3.${num}.3 Risco de Negócio
1 parágrafo — consequências de manter este nível nesta unidade.

### 3.${num}.4 Benchmark Setorial
1 parágrafo — usar **somente** o BENCHMARK DE MERCADO DESTA DIMENSÃO (frase + fonte/ano); **proibido** reutilizar texto/números de outra dimensão ou média setorial genérica.

### 3.${num}.5 Recomendações Específicas
3–4 ações numeradas R1–Rn: owner, entregável, prazo 30/60/90.
${montarBlocoPlanoAcaoDimensaoPrompt(planoDim)}

### 3.${num}.6 KPIs de Acompanhamento
Tabela: KPI | Baseline | Meta 90d | Meta 12m (mínimo 3 linhas).
${dimensaoComScoreZero(dim) ? `\n> **Score individual 0 nesta rodada:** use score geral da unidade (${scoreGeral.toFixed(2)}) e contexto. **Obrigatório** preencher 3.${num}.1–3.${num}.6.` : ''}

${temDesejosIa ? 'Ancore ≥1 recomendação em Desejos IA quando pertinente.' : ''}`,
        22_000
      ).prompt;
      const bruto = await chamarIa(promptDim, modoRapido ? 2200 : 3600);
      partesDimensoes.push(
        sanitizarChunkDimensaoBookUnidadeBlueprint(bruto, {
          num,
          nomeDimensao: dim.area,
          papelLabel
        })
      );
    } catch (dimErr) {
      console.error(
        `[Book Unidade Blueprint] Erro na dimensão ${dim.area} (${num}/${dimsComDadosLoop.length}):`,
        dimErr?.message || dimErr
      );
      const msgUsuario = softAiFailureMessageForBook(dimErr);
      const score = Number(dim.score ?? 0).toFixed(2);
      partesDimensoes.push(
        sanitizarChunkDimensaoBookUnidadeBlueprint(
          `### 3.${num}.1 Análise Diagnóstica

> ⚠️ ${msgUsuario}

Score oficial: **${score}**.

### 3.${num}.2 Evidências Críticas
- Revisar respostas [Qn] na tabela consolidada do projeto.

### 3.${num}.3 Risco de Negócio
> Manter este nível pode atrasar iniciativas da unidade ${unidadeMeta.nome} nesta dimensão.

### 3.${num}.4 Benchmark Setorial
> Benchmark narrativo não gerado nesta montagem.

### 3.${num}.5 Recomendações Específicas
1. Revisar evidências e owners em até 30 dias.
2. Definir entregável da dimensão.
3. Acompanhar evolução do score oficial.

### 3.${num}.6 KPIs de Acompanhamento
| KPI | Baseline | Meta 90d | Meta 12m |
|-----|----------|----------|----------|
| Score ${dim.area} | ${score} | — | — |`,
          { num, nomeDimensao: dim.area, papelLabel }
        )
      );
    }
  }

  const secao3 = `# 3. DIAGNÓSTICO POR DIMENSÃO — UNIDADE ${unidadeMeta.nome}\n\n${partesDimensoes.join('\n\n')}`;

  await reportarProgresso(totalChunks - 2, 'Roadmap 30-60-90 da unidade');
  const secao4 = sanitizarChunkSecaoPrincipalBookUnidade(
    await chamarIaComEsqueleto(
      `${dadosResumoBase}

Plano rule-based prioritário (dimensões em foco):
${planoAcaoRelevante.map((p) => `- ${p.area} (${p.score}): ${p.acoes30Dias[0]}`).join('\n') || '—'}

Gere SOMENTE o roadmap da unidade (heading "# 4. ROADMAP ENGENHARIA 30-60-90 DIAS DA UNIDADE" + ## 4.1–4.3).
**Proibido:** "Consolidação Estratégica", radar, mapa de calor, "# 5.", "## 3.N", benchmarks setoriais enterprise, seções 6+.

# 4. ROADMAP ENGENHARIA 30-60-90 DIAS DA UNIDADE

## 4.1 Visão integrada
Parágrafo conectando gaps da unidade ${unidadeMeta.nome} ao plano 30/60/90.

## 4.2 Cronograma
Tabela: Horizonte (30/60/90) | Iniciativa | Dimensão | Owner | Entregável | Status

## 4.3 Rituais de governança
Bullets: cadência de acompanhamento, métricas de revisão, critério de sucesso da unidade.`,
      modoRapido ? 2200 : 3500,
      {
        label: 'roadmap',
        esqueleto: (msg) => `# 4. ROADMAP ENGENHARIA 30-60-90 DIAS DA UNIDADE

## 4.1 Visão integrada

> ⚠️ ${msg}

## 4.2 Cronograma
| Horizonte | Iniciativa | Dimensão | Owner | Entregável | Status |
|-----------|------------|----------|-------|------------|--------|
| 30 dias | Revisar gaps prioritários | — | Unidade | Plano revisado | Pendente |

## 4.3 Rituais de governança
- Cadência semanal de acompanhamento dos scores da unidade.`
      }
    ),
    { num: 4, tituloPreferido: 'ROADMAP' }
  );

  await reportarProgresso(totalChunks - 1, 'Próximos passos da unidade');
  const secao5 = sanitizarChunkSecaoPrincipalBookUnidade(
    await chamarIaComEsqueleto(
      `${dadosResumoBase}

Gere SOMENTE "# 5. Próximos Passos e Encerramento" + ## 5.1–5.3.
**Proibido:** outras seções numeradas, "## 3.N", benchmarks, consolidação estratégica.

# 5. Próximos Passos e Encerramento

## 5.1 Ações prioritárias (30 dias)
7–10 ações numeradas com responsável, entregável e prazo — exclusivas da unidade ${unidadeMeta.nome}.

## 5.2 Critérios de sucesso
Bullets objetivos para a próxima rodada de avaliação.

## 5.3 Encerramento
1 parágrafo de fechamento executivo.`,
      modoRapido ? 2000 : 3200,
      {
        label: 'próximos passos',
        esqueleto: (msg) => `# 5. Próximos Passos e Encerramento

## 5.1 Ações prioritárias (30 dias)

> ⚠️ ${msg}

1. Regenerar este book quando a fila de IA estiver disponível.
2. Revisar scores oficiais da unidade com o time.

## 5.2 Critérios de sucesso
- Book regenerado com análise completa por dimensão.

## 5.3 Encerramento
Documento parcial da unidade **${unidadeMeta.nome}** — scores oficiais preservados.`
      }
    ),
    { num: 5, tituloPreferido: 'Próximos' }
  );

  markdown = normalizarSecoesBookUnidadeBlueprint(
    `${partesMetodologia.join('\n\n')}\n\n${partesSumario.join('\n\n')}\n\n${secao3}\n\n${secao4}\n\n${secao5}`
  );
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

  markdown = normalizarSecoesBookUnidadeBlueprint(markdown);

  let relatorioComCorpo = !modoRapido
    ? posicionarApendicesMetodologicosComoUltimaSecao(markdown, {
        framework: 'blueprint',
        glossarioProjeto: regrasFatos.glossario
      })
    : markdown;

  relatorioComCorpo = normalizarSecoesBookUnidadeBlueprint(relatorioComCorpo);

  const relatorioFinal = montarPreliminaresBookSatfOrdemCanonica({
    corpoMarkdown: relatorioComCorpo,
    empresaNome: projeto.empresa.nome,
    projetoNome: projeto.nome,
    avaliacoesFiltradas,
    filtroNivelMax,
    unidadeMeta,
    exigeUnidade: true,
    modoIndice: 'unidade'
  });

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

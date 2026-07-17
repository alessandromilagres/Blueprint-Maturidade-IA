/**
 * Book IA — template SATF TI v3 (~18 chunks).
 * Score oficial = certificado ou teto por evidência; declarado visível para auditoria.
 */
import { prisma } from '../lib/prisma.js';
import { deveReutilizarRelatorioIASalvo } from './reutilizarRelatorioIA.js';
import { salvarRelatorioIA } from '../routes/relatorios-ia.js';
import { callAIWithContinuation, getProvider, loadPersistedAIConfig } from '../services/ai-provider.js';
import {
  buildFallbackSuccessAviso,
  buildChunkFailureAviso,
  formatProviderAttemptsLogLine,
  formatProviderFailureForMarkdown,
  formatEtapaFallbackSucesso,
  formatEtapaFalhaTotalChunk,
  metadataFalhasProvedorChunk
} from './aiProviderAttempts.js';
import { SYSTEM_PROMPT_PERSONA_BOOK_SATF } from '../constants/consultorRelatorioIA.js';
import { FRAMEWORK_SATF_TI_V3 } from '../constants/frameworkMaturidadePolicy.js';
import { carregarFrameworkProjeto } from './projetoFramework.js';
import {
  filtrarAvaliacoesRelatorioProjeto,
  metadadosUnidadeDadosUsados,
  relatorioUnidadeCacheCompativel,
  resolverContextoUnidadeRelatorioObrigatorio,
  blocoDescricaoUnidadeMarkdown
} from './relatorioUnidadeIA.js';
import {
  garantirUnidadeGeralEmpresa,
  parseDimensoesFocoSatfJson,
  formatarDimensoesFocoSatfDisplay,
  resolverPapelDimensaoUnidade,
  blocoInstrucaoPapelDimensaoPrompt,
  labelPapelDimensaoUnidade,
  PAPEIS_DIMENSAO_UNIDADE,
  resolverModeloOperacionalUnidade,
  labelModeloOperacional
} from './empresaUnidade.js';
import {
  filtrarDimensoesPorModeloOperacional,
  blocoTraducaoDimensaoModeloPrompt
} from './bibliotecaTraducaoDimensoes.js';
import { blocoBenchmarkDimensaoPrompt } from './bibliotecaBenchmarksMercado.js';
import {
  gerarPlanoAcaoPorDimensao,
  instrucoesSistemaBookUnidade,
  montarBlocoPlanoAcaoDimensaoPrompt,
  montarBlocoPlanoAcaoUnidadeMarkdown,
  planoAcaoPorNomeDimensao
} from './bookUnidadeContexto.js';
import { listarAreasDoProjeto } from './areaFrameworkCatalog.js';
import { mapaApresentacaoDimensoes } from './projetoDimensoesConfig.js';
import { calcularScoresConsolidadoMaturidade, nivelNumericoDeScore } from './scoresConsolidadoProjetoMaturidade.js';
import { enriquecerScoresDashboardSatf } from './projetoDimensaoCertificacao.js';
import { ordenarAreasPorFramework, blocoOrdemDimensoesFrameworkMarkdown, TOTAL_DIMENSOES_SATF, garantirTodasDimensoesFramework } from './ordemDimensoesFramework.js';
import { montarComparativoVersoesProjeto, blocoEvolucaoVersoesMarkdown } from './evolucaoVersoesProjeto.js';
import {
  blocoContextoProjetoMarkdown,
  projetoTemContextoCadastrado,
  carregarInventarioDocumentosContexto,
  blocoInventarioDocumentosMarkdown,
  blocoInstrucoesEntregaveisDimensaoSatf,
  blocoInstrucoesPromptSecao3Dimensao,
  blocoInstrucoesSistemaSecao3ComContexto,
  blocoInstrucoesPrioridadeGlossario,
  carregarRegrasFatosContextoProjeto,
  inventarioDocumentosContextoFromMarkdown,
  complementarSecao3EntregaveisEscopo,
  normalizarRotulosEntregaveisEscopo,
  blocoRegrasNomenclaturaEntregaveisMarkdown
} from './projetoContexto.js';
import {
  blocoAvaliadoresConsolidadoMarkdown,
  filtroNivelRelatorioIACompativel,
  parseFiltroNivelPrioridadeMapeamentoMaturidadeMax,
  usuarioIncluidoNoFiltroNivelMapeamentoMaturidade
} from './nivelPrioridadeMapeamentoMaturidade.js';
import { resolverLogoEmpresa } from './empresaLogo.js';
import { NOMES_NIVEL_BLUEPRINT } from './nivelMaturidadeRubrica.js';
import { metodologiaScoreFramework } from './frameworkScoringPolicy.js';
import { montarPreliminaresBookSatfOrdemCanonica } from './bookMarkdownIndice.js';
import {
  tabelaPerguntasDimensaoMarkdown,
  dimensaoComScoreZero,
  instrucaoPromptSecao3SemCabecalhos,
  relatorioBookSecao3Completo,
  limparConteudoIaSecao3Dimensao,
  contarDimensoesSecao3Book
} from './bookModoRapidoMarkdown.js';
import { blocoGuiaProgressaoDimensaoSatf } from './guiasProgressaoFramework.js';
import {
  blocoDesejosIaMarkdown,
  projetoTemDesejosIaCadastrados,
  blocoInstrucoesDesejosIaSecao3Dimensao
} from './blocoDesejosIaBook.js';
import { desejosIaTemRespostasGuardadas } from './desejosIaAvaliacaoMaturidade.js';
import {
  blocoTaxonomiaObrigatoriaSatfMarkdown,
  blocoRegrasTaxonomiaSatfPrompt,
  blocoDadosExtrasBookRapidoSatf,
  blocoDimensaoScoreZeroSecao3Satf,
  introducaoSecao3SatfBookMarkdown,
  validarTaxonomiaBookSatf,
  recortarConteudoChunkBookSatf,
  deduplicarSecoesFinaisBookSatf,
  normalizarSecoesBookSatf,
  corrigirScoresOficiaisTabelaEvolucaoRoadmapSatf,
  validarSecoesDuplicadasBookSatf,
  garantirSecoesD11BookSatf,
  encontrarDimensaoD11Satf,
  NOME_DIMENSAO_D11_SATF,
  construirMapaRenumeracaoSecoesPrincipaisSatfUnidade,
  numeroSecaoPrincipalSatfUnidade,
  renumerarSecoesPrincipaisBookSatfUnidade
} from './satfBookTaxonomia.js';
import { validarFatosCanonicosBook } from './projetoContextoFatos.js';
import { posicionarApendicesMetodologicosComoUltimaSecao } from './bookApendicesMetodologicos.js';
import {
  dimensaoCorrespondeFocoUnidade,
  dimensoesSecao3BookUnidade,
  filtrarDimensoesFocoUnidade,
  filtrarDimensoesFocoUnidadeComDados,
  parseFocoUnidadePorFramework,
  unidadeTemDimensoesFoco,
  montarBlocoDadosDimensaoUnica,
  montarInstrucaoDadosSomenteDimensao,
  montarResumoScoresDimensoes,
  codigoEfetivoDimensaoFramework
} from './bookDadosDimensao.js';
import {
  PROMPT_CONTEXTO_DIMENSAO_SAFE_CHARS,
  softAiFailureMessageForBook,
  shrinkPromptToCharBudget
} from './aiPromptBudget.js';
import {
  montarPromptPolirDescricaoUnidade,
  montarPromptTabelaResumoRoadmap,
  instrucaoOrcamentoTabelaResumo,
  instrucaoOrcamentoProximosPassos,
  normalizarDescricaoUnidadeOrcamento,
  gerarComValidacaoQualidade
} from './bookSecaoQualidade.js';

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

function detalhePerguntasDimensaoMarkdown(dim) {
  return (dim.perguntas || [])
    .map(
      (p) =>
        `- [Q${p.numero}] ${p.texto.substring(0, 160)} → ${
          p.totalRespostas > 0 ? `Score ${p.score}` : 'Score 0'
        }`
    )
    .join('\n');
}

function rotuloScoreDimensaoSatf(dim) {
  if (dimensaoComScoreZero(dim)) return '0';
  const oficial = Number(dim.score ?? dim.scoreOficial ?? 0).toFixed(2);
  const decl =
    dim.scoreDeclarado != null && Math.abs(dim.scoreDeclarado - dim.score) > 0.05
      ? ` · declarado ${Number(dim.scoreDeclarado).toFixed(2)}`
      : '';
  const cert = dim.certificacao?.status ? ` · cert: ${dim.certificacao.status}` : '';
  return `${oficial}${decl}${cert}`;
}

function montarPromptSecao3DimensaoSatf({
  numSecao,
  dim,
  isFirst,
  modoRapido,
  projeto,
  setor,
  porte,
  scoreGeral,
  nivel,
  mediaSetor,
  temContexto,
  temDesejosIa,
  blocoContextoClienteBook,
  inventarioDocumentos,
  dadosDimensao,
  tabelaDim,
  exigeUnidade = false,
  unidadeMeta = null,
  planoDim = null
}) {
  const detalheDim = detalhePerguntasDimensaoMarkdown(dim);
  const instrucoesContexto = blocoInstrucoesPromptSecao3Dimensao(dim.area, blocoContextoClienteBook);
  const instrucoesDesejos = blocoInstrucoesDesejosIaSecao3Dimensao(dim.area, temDesejosIa);
  const instrucoesEntregaveis = blocoInstrucoesEntregaveisDimensaoSatf(dim.area, inventarioDocumentos);
  const regrasNomenclatura = blocoRegrasNomenclaturaEntregaveisMarkdown(inventarioDocumentos);
  const guia = limitarBlocoMarkdown(
    blocoGuiaProgressaoDimensaoSatf(dim.area, dim.nivel || dim.score),
    PROMPT_GUIA_DIMENSAO_MAX_CHARS,
    'Guia de progressão (prompt)'
  );
  const blocoContextoPrompt = truncarBlocoMarkdownParaPrompt(
    blocoContextoClienteBook,
    PROMPT_CONTEXTO_DIMENSAO_MAX_CHARS
  );
  const papelUnidade = exigeUnidade
    ? resolverPapelDimensaoUnidade(unidadeMeta, dim, 'satf')
    : PAPEIS_DIMENSAO_UNIDADE.NAO_SE_APLICA;
  const blocoPapel = exigeUnidade
    ? blocoInstrucaoPapelDimensaoPrompt({
        papel: papelUnidade,
        unidadeNome: unidadeMeta?.nome,
        nomeDimensao: dim.area
      })
    : '';
  const blocoTraducaoModelo = exigeUnidade
    ? blocoTraducaoDimensaoModeloPrompt(unidadeMeta, dim)
    : '';
  const blocoBenchmarkMercado = blocoBenchmarkDimensaoPrompt('satf', dim);

  const regrasEntregaveis =
    inventarioDocumentos?.entregaveis?.length > 0
      ? `- **Entregáveis do escopo (A–H):** cadastrados: ${inventarioDocumentos.entregaveis.join(', ')}. Cite os pertinentes a **${dim.area}** com **rótulos canônicos** (E = Roteiro de Pilotos; H = Diagnóstico de Clientes — não renomeie).`
      : '';

  const regrasAntiGenericidade = `
OBRIGATÓRIO — EVITE REPETIÇÃO, GENERICIDADE E CONTAMINAÇÃO DE TAXONOMIA:
- Use **somente** dimensões SATF TI v3 (D1–D11) com nomes oficiais do bloco DADOS — **proibido** dimensões Blueprint ou genéricas.
- A **Análise Diagnóstica** deve abordar **${dim.area}** de forma explícita: referencie [Qn] e o padrão de respostas (não use parágrafo genérico de "maturidade de IA em TI").
- **Evidências Críticas:** separe fatores que elevaram vs puxaram o score; cite [Qn] e documentos do contexto (Entregáveis A–H) quando existirem.
- **Risco:** específico desta dimensão — **proibido** repetir a mesma frase entre dimensões.
- **Benchmark Setorial:** use **exclusivamente** o bloco BENCHMARK DE MERCADO DESTA DIMENSÃO abaixo (frase + fonte + ano). **Proibido** média setorial genérica (ex.: ${mediaSetor.toFixed(1)}, 3,3, 35%) e **proibido** reutilizar texto/números de outra dimensão.
- **Recomendações:** cada ação com título, descrição, entregável/sistema do projeto (A–H), owner sugerido e prazo (30/45/60/90 dias).${temDesejosIa ? ' **≥1 ação** deve citar Desejos IA dos DADOS quando pertinente.' : ''}
${exigeUnidade && dimensaoComScoreZero(dim) ? `- **Score individual 0 nesta rodada:** use score geral da unidade, contexto do projeto e perguntas [Qn] para diagnóstico. **Obrigatório** incluir Recomendações Específicas (R1–R3) e tabela de KPIs — não omita por falta de score discriminado.` : ''}
${exigeUnidade && formatarDimensoesFocoSatfDisplay(parseDimensoesFocoSatfJson(unidadeMeta)) ? `- **Dimensões em foco desta unidade (SATF):** ${formatarDimensoesFocoSatfDisplay(parseDimensoesFocoSatfJson(unidadeMeta))} — **proibido** mencionar dimensões SATF fora desta lista.` : ''}
${exigeUnidade ? `- **Unidade organizacional:** recomendações **exclusivas** para "${unidadeMeta?.nome || 'esta unidade'}".` : ''}
${exigeUnidade && papelUnidade !== PAPEIS_DIMENSAO_UNIDADE.NAO_SE_APLICA ? `- **Papel da unidade nesta dimensão:** ${labelPapelDimensaoUnidade(papelUnidade)} — aplicar a lente correspondente em análise, recomendações e KPIs.` : ''}
${exigeUnidade && resolverModeloOperacionalUnidade(unidadeMeta) ? `- **Modelo operacional:** ${labelModeloOperacional(resolverModeloOperacionalUnidade(unidadeMeta))} — métricas e léxico desta dimensão devem seguir a tradução do modelo (não copiar Delivery↔Sustentação).` : ''}
${exigeUnidade && planoDim ? `\n${montarBlocoPlanoAcaoDimensaoPrompt(planoDim)}` : ''}
${blocoTraducaoModelo}
${blocoBenchmarkMercado}
${regrasEntregaveis}
${temContexto ? '- **Contexto cadastrado:** cite ≥2 elementos concretos do bloco "Contexto do cliente" em Análise, Risco e Recomendações. **Proibido** "empresa de tecnologia de médio porte" como narrativa principal.' : `- Contextualize ao setor **${setor}** e porte **${porte}** com exemplos de engenharia/plataforma reais.`}
- Numere **exatamente** as subseções pedidas com ### (três #). **Não** gere "## ${numSecao}" nem "# 3.".
`;

  const contextoDim = `
CONTEXTO:
- Empresa: ${projeto.empresa.nome} (${setor}, porte ${porte})
- Score geral oficial: ${scoreGeral.toFixed(2)} (Nível ${nivel})
- Média TI/setor (apenas contexto geral — **não** usar no Benchmark Setorial desta dimensão): ${mediaSetor.toFixed(1)}
- Score desta dimensão (**${dim.area}**): ${rotuloScoreDimensaoSatf(dim)} (Nível ${dim.nivel || nivelNumericoDeScore(dim.score)})
${exigeUnidade && papelUnidade !== PAPEIS_DIMENSAO_UNIDADE.NAO_SE_APLICA ? `- Papel da unidade: **${labelPapelDimensaoUnidade(papelUnidade)}**` : ''}

DETALHE DESTA DIMENSÃO (perguntas consolidadas):
${detalheDim || '- Nenhuma resposta consolidada nesta rodada.'}
`;

  // Book por unidade (SATF/MIT): sempre o template canônico 3.x.1–3.x.6.
  const usarTemplateUnidadeOuCompleto = exigeUnidade || !modoRapido;

  let promptOut;
  if (!usarTemplateUnidadeOuCompleto) {
    promptOut = `${instrucaoPromptSecao3SemCabecalhos(numSecao, isFirst)}Gere SOMENTE as subseções ### ${numSecao}.1 a ### ${numSecao}.7 em Markdown.

### ${numSecao}.1 Diagnóstico (1 parágrafo denso: cite [Qn], score oficial, gap declarado→oficial se houver, e ≥1 fato do contexto do projeto)
### ${numSecao}.2 Tabela de scores por pergunta
Reproduza **integralmente** a tabela abaixo (incluindo a **última linha** "Score geral da dimensão").
### ${numSecao}.3 Evidências Críticas (até 4 bullets com [Qn]; inclua qualidade de evidências e status de certificação consultor)
### ${numSecao}.4 Risco (1 parágrafo — mecanismo de risco desta dimensão para a operação documentada, não genérico)
### ${numSecao}.5 Benchmark (1 parágrafo: use o BENCHMARK DE MERCADO DESTA DIMENSÃO — cite fonte/ano; compare com o score de ${dim.area}; **proibido** média TI genérica)
### ${numSecao}.6 Recomendações Específicas (3 ações numeradas R1–R3${temDesejosIa ? '; ≥1 ancorada em Desejos IA' : ''}: entregável A–H do contexto, sistema, owner, prazo)
### ${numSecao}.7 KPIs de Acompanhamento (tabela: KPI | Baseline | Meta 12m — mínimo 3 linhas)

${regrasAntiGenericidade}
${blocoPapel}
${blocoTraducaoModelo}
${contextoDim}

${guia}

${instrucoesEntregaveis}

${regrasNomenclatura}

${instrucoesContexto}

${instrucoesDesejos}

${blocoContextoPrompt ? `${blocoContextoPrompt}\n\n` : ''}${dadosDimensao || montarBlocoDadosDimensaoUnica(dim, { scoreGeral, mediaSetor, unidadeNome: unidadeMeta?.nome })}

TABELA OBRIGATÓRIA (copie integralmente em ${numSecao}.2):
${tabelaDim}`;
  } else {
    promptOut = `${instrucaoPromptSecao3SemCabecalhos(numSecao, isFirst)}Gere SOMENTE as subseções ### ${numSecao}.1 a ### ${numSecao}.6 em Markdown.

### ${numSecao}.1 Análise Diagnóstica (2–3 parágrafos profundos: cite [Qn] com scores; explique o que o score oficial revela; gap declarado→oficial; ligue a entregáveis e pilotos do contexto)
### ${numSecao}.2 Evidências Críticas
- **Fatores que elevaram o score** (bullets com [Qn] e justificativa)
- **Fatores que puxaram o score para baixo** (bullets com [Qn])
- **Evidências documentadas** e status de certificação consultor (qualidade, lacunas)
### ${numSecao}.3 Risco de Negócio (1 parágrafo — consequências se mantiver este nível; específico de ${dim.area} e da operação do cliente)
### ${numSecao}.4 Benchmark Setorial (1 parágrafo — usar o BENCHMARK DE MERCADO DESTA DIMENSÃO: frase + fonte/ano; posicionar o score de ${dim.area}; **proibido** média TI genérica ou texto de outra dimensão)
### ${numSecao}.5 Recomendações Específicas (3–4 ações numeradas${temDesejosIa ? '; ≥1 ancorada em Desejos IA dos DADOS' : ''}: título + parágrafo com entregável, sistema, squad, prazo; ancoradas no escopo e documentação do projeto)
### ${numSecao}.6 KPIs de Acompanhamento (tabela: KPI | Baseline | Meta 6m | Meta 12m — mínimo 4 linhas; inclua score SATF da dimensão como KPI de evolução)

${regrasAntiGenericidade}
${blocoPapel}
${blocoTraducaoModelo}
${contextoDim}

${guia}

${instrucoesEntregaveis}

${regrasNomenclatura}

${instrucoesContexto}

${instrucoesDesejos}

${blocoContextoPrompt ? `${blocoContextoPrompt}\n\n` : ''}${dadosDimensao || montarBlocoDadosDimensaoUnica(dim, { scoreGeral, mediaSetor, unidadeNome: unidadeMeta?.nome })}`;
  }

  const capped = shrinkPromptToCharBudget(promptOut, PROMPT_SECAO3_DIMENSAO_MAX_CHARS);
  return capped.prompt;
}

function rotuloDimensaoSatfBookMarkdown(dim, numSecao) {
  const nome = String(dim.area || '').trim();
  if (dimensaoComScoreZero(dim)) {
    return `## ${numSecao} Dimensão — ${nome} — Score 0 · Não analisada`;
  }
  const decl = dim.scoreDeclarado != null ? `decl. ${Number(dim.scoreDeclarado).toFixed(2)}` : '';
  const oficial = `oficial ${Number(dim.score ?? dim.scoreOficial ?? 0).toFixed(2)}`;
  const cert = dim.certificacao?.status === 'certificado' ? ' · certificada' : '';
  return `## ${numSecao} Dimensão — ${nome} — ${oficial}${decl ? ` (${decl})` : ''}${cert} · Nível ${dim.nivel}`;
}

function montarBlocoSecao3DimensaoSatf({
  numSecao,
  dim,
  conteudoIa,
  isFirst,
  totalDimensoes,
  ordemNomes,
  modoRapido,
  inventarioDocumentos,
  numPai = 3,
  exigeUnidade = false
}) {
  let md = '';
  if (isFirst) {
    md += `${introducaoSecao3SatfBookMarkdown(totalDimensoes, ordemNomes, { numPai })}\n\n`;
  }
  md += `${rotuloDimensaoSatfBookMarkdown(dim, numSecao)}\n\n`;
  // Book por unidade: limpeza no modo completo para preservar ### 3.x.1–6.
  const bookCompleto = exigeUnidade ? true : !modoRapido;
  let corpo = limparConteudoIaSecao3Dimensao(conteudoIa, numSecao, { bookCompleto });
  if (corpo && inventarioDocumentos?.entregaveis?.length) {
    corpo = complementarSecao3EntregaveisEscopo(corpo, dim.area, inventarioDocumentos, numSecao, {
      modoRapido: exigeUnidade ? false : modoRapido
    });
    corpo = normalizarRotulosEntregaveisEscopo(corpo, inventarioDocumentos);
  }
  if (corpo) md += corpo;
  return md;
}

function esqueletoAnaliseDimensaoSatf(numSecao, dim, motivo = '') {
  const aviso = motivo
    ? `> ⚠️ ${motivo}\n\n`
    : '';
  const scoreTxt = rotuloScoreDimensaoSatf(dim);
  const perguntasCriticas = (dim.perguntas || [])
    .filter((p) => p.totalRespostas > 0)
    .sort((a, b) => Number(a.score || 0) - Number(b.score || 0))
    .slice(0, 4)
    .map((p) => `- [Q${p.numero}] score ${p.score} — ${String(p.texto || '').substring(0, 120)}`);
  const evidencias =
    perguntasCriticas.length > 0
      ? perguntasCriticas.join('\n')
      : '- Sem respostas consolidadas discriminadas nesta montagem.';

  return `${aviso}### ${numSecao}.1 Análise Diagnóstica

Score oficial **${scoreTxt}** na dimensão **${dim.area}**. Análise narrativa da IA indisponível nesta rodada; use a tabela de perguntas e as evidências abaixo para calibração imediata com o time.

### ${numSecao}.2 Evidências Críticas

**Perguntas com menor score (amostra automática):**
${evidencias}

### ${numSecao}.3 Risco de Negócio

Manter este nível nesta dimensão pode atrasar iniciativas de engenharia/plataforma dependentes de **${dim.area}** — priorizar revisão de evidências e owners nos próximos 30 dias.

### ${numSecao}.4 Benchmark Setorial

Posição relativa não calibrada por IA nesta montagem; comparar o score **${scoreTxt}** com a meta interna da unidade/projeto.

### ${numSecao}.5 Recomendações Específicas

1. Revisar evidências e prioridades desta dimensão com a unidade (foco nas [Qn] de menor score).
2. Definir entregável e owner em até 30 dias.
3. Incluir KPI de evolução do score oficial no ritual de acompanhamento.

### ${numSecao}.6 KPIs de Acompanhamento

| KPI | Baseline | Meta 6m | Meta 12m |
|-----|----------|---------|----------|
| Score oficial ${dim.area} | ${Number(dim.score ?? 0).toFixed(2)} | — | — |

${tabelaPerguntasDimensaoMarkdown(dim)}`;
}

function unidadeComFocoDefinido(unidadeMeta) {
  return unidadeTemDimensoesFoco(unidadeMeta, 'satf');
}

function dimensaoNoFocoUnidade(unidadeMeta, dimOuCodigo) {
  if (!unidadeComFocoDefinido(unidadeMeta)) return true;
  const foco = parseFocoUnidadePorFramework(unidadeMeta, 'satf');
  if (typeof dimOuCodigo === 'string') {
    return dimensaoCorrespondeFocoUnidade({ codigoFramework: dimOuCodigo }, foco);
  }
  return dimensaoCorrespondeFocoUnidade(dimOuCodigo, foco);
}

function blocoEscopoFocoUnidadeSatf(unidadeMeta) {
  if (!unidadeComFocoDefinido(unidadeMeta)) return '';
  const foco = formatarDimensoesFocoSatfDisplay(parseDimensoesFocoSatfJson(unidadeMeta));
  return `\n> **Escopo de dimensões SATF (unidade):** analise e mencione **somente** ${foco}. **Proibido** referenciar dimensões SATF fora deste foco.\n`;
}

function numSecaoDiagnosticoBook(exigeUnidade, unidadeMeta, idxRelativo, idxCanonico) {
  // Book por unidade e enterprise: diagnóstico sempre sob a Seção 3.
  if (exigeUnidade && unidadeComFocoDefinido(unidadeMeta)) {
    return `3.${idxRelativo + 1}`;
  }
  return `3.${idxCanonico + 1}`;
}

const DADOS_BLOCK_CONTEXTO_MAX_CHARS = 48_000;
const DADOS_BLOCK_DESEJOS_MAX_CHARS = 16_000;
const DADOS_BLOCK_INVENTARIO_MAX_CHARS = 24_000;
/** Contexto cliente injetado em cada chunk 3.x — alinhado ao orçamento Groq TPM. */
const PROMPT_CONTEXTO_DIMENSAO_MAX_CHARS = PROMPT_CONTEXTO_DIMENSAO_SAFE_CHARS;
/** Guia de progressão injetado no prompt de dimensão (chars). */
const PROMPT_GUIA_DIMENSAO_MAX_CHARS = 4_000;
/** Teto preventivo do prompt completo de dimensão antes da chamada IA. */
const PROMPT_SECAO3_DIMENSAO_MAX_CHARS = 22_000;

function limitarBlocoMarkdown(bloco, maxChars, rotulo) {
  if (!bloco || bloco.length <= maxChars) return bloco;
  return `${bloco.slice(0, maxChars)}\n\n> *[${rotulo} truncado na preparação do book — ${bloco.length} caracteres no cadastro]*\n`;
}

function truncarBlocoMarkdownParaPrompt(bloco, maxChars = PROMPT_CONTEXTO_DIMENSAO_MAX_CHARS) {
  return limitarBlocoMarkdown(bloco, maxChars, 'Contexto do cliente (prompt)');
}

function yieldEventLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

function montarDadosBlockSatf({
  projeto,
  projetoVersao,
  avaliacoesFiltradas,
  filtroNivelMax,
  dimensoesDiagnostico,
  dimensoesForaEscopo,
  scoreGeral,
  scoreGeralDeclarado,
  certificacaoSatf,
  setor,
  porte,
  blocoContexto,
  blocoInventario,
  blocoDesejosIa,
  blocoEvolucao,
  metodologiaScore,
  top5,
  bottom5,
  exigeUnidade = false,
  unidadeMeta = null,
  planoAcao = null,
  dimensoesEscopo = null
}) {
  const ctx = limitarBlocoMarkdown(blocoContexto, DADOS_BLOCK_CONTEXTO_MAX_CHARS, 'Contexto do cliente');
  const desejos = limitarBlocoMarkdown(blocoDesejosIa, DADOS_BLOCK_DESEJOS_MAX_CHARS, 'Desejos IA');
  const inventario = limitarBlocoMarkdown(blocoInventario, DADOS_BLOCK_INVENTARIO_MAX_CHARS, 'Inventário');
  const evolucao = limitarBlocoMarkdown(blocoEvolucao, 12_000, 'Evolução entre versões');
  const dimsLista = dimensoesEscopo || dimensoesDiagnostico;
  const nivel = nivelNumericoDeScore(scoreGeral);
  const nomesNivel = NOMES_NIVEL_BLUEPRINT;
  const detalhePerguntasTxt = exigeUnidade
    ? montarResumoScoresDimensoes(dimsLista, {
        titulo: 'Scores por dimensão (resumo — detalhe [Qn] em cada subseção 3.N)'
      }) || '—'
    : dimsLista
        .map(
          (a) =>
            `\n### ${a.area} (Oficial: ${dimensaoComScoreZero(a) ? '0' : (a.score ?? 0).toFixed(2)}${
              a.scoreDeclarado != null && a.scoreDeclarado !== a.score
                ? ` · Declarado: ${a.scoreDeclarado.toFixed(2)}`
                : ''
            })\n${(a.perguntas || [])
              .map(
                (p) =>
                  `- [Q${p.numero}] ${p.texto.substring(0, 160)}${p.texto.length > 160 ? '…' : ''} → ${
                    p.totalRespostas > 0 ? p.score : '0'
                  }`
              )
              .join('\n')}`
        )
        .join('\n');

  const blocoCert = certificacaoSatf
    ? `## Certificação consultor
- Status geral: **${certificacaoSatf.statusGeral}**
- Dimensões pendentes: **${certificacaoSatf.pendentes}**
- Certificadas: **${certificacaoSatf.certificadas}**
- Rebaixadas: **${certificacaoSatf.rebaixadas}**
- Score geral declarado: **${scoreGeralDeclarado?.toFixed(2) ?? '—'}**
- Score geral **oficial** (usar no diagnóstico): **${scoreGeral.toFixed(2)}**`
    : '';

  const blocoEscopoFoco = exigeUnidade ? blocoEscopoFocoUnidadeSatf(unidadeMeta) : '';

  return `# DADOS DO ASSESSMENT — SATF TI v3

## Identificação
- **Empresa:** ${projeto.empresa.nome}
- **Projeto:** ${projeto.nome}
- **Framework:** SATF TI v3 (IA Maturidade TI)
- **Versão da pesquisa:** ${projetoVersao.titulo} (${projetoVersao.status})
- **Setor / vertical:** ${setor}
- **Porte:** ${porte}
- **Avaliadores (filtro):** ${avaliacoesFiltradas.length}
- **Filtro prioridade:** ${filtroNivelMax == null ? 'Todos' : `Até nível ${filtroNivelMax}`}
${blocoEscopoFoco}
${blocoAvaliadoresConsolidadoMarkdown(avaliacoesFiltradas, filtroNivelMax)}

${ctx ? `${ctx}\n\n` : ''}

${inventario ? `${inventario}\n\n` : ''}

${desejos ? `${desejos}\n\n` : ''}

${blocoCert}

${blocoTaxonomiaObrigatoriaSatfMarkdown(dimsLista)}

${evolucao}

## Metodologia de score SATF
${metodologiaScore?.descricaoScore || 'Média ponderada das dimensões núcleo; D10 fora da média geral; evidência obrigatória para notas ≥ 4.'}

## Resultado geral
- **Score oficial:** ${scoreGeral.toFixed(2)} (Nível ${nivel} — ${nomesNivel[nivel - 1]})
${scoreGeralDeclarado != null && scoreGeralDeclarado !== scoreGeral ? `- **Score declarado (autoavaliação):** ${scoreGeralDeclarado.toFixed(2)}` : ''}

${blocoOrdemDimensoesFrameworkMarkdown(FRAMEWORK_SATF_TI_V3)}

## Scores por dimensão (${dimsLista.length})
${dimsLista
  .map((a) => {
    const zero = dimensaoComScoreZero(a);
    const gap =
      a.scoreDeclarado != null && a.score != null && Math.abs(a.scoreDeclarado - a.score) > 0.05
        ? ` · gap decl→oficial ${(a.scoreDeclarado - a.score).toFixed(2)}`
        : '';
    const cert = a.certificacao?.status ? ` · cert: ${a.certificacao.status}` : '';
    return `- **${a.area}**${
      zero
        ? ' — score 0'
        : ` — oficial ${a.score.toFixed(2)} (N${a.nivel})${a.scoreDeclarado != null ? ` · decl ${a.scoreDeclarado.toFixed(2)}` : ''}${gap}${cert}`
    }${a.peso != null ? ` · peso ${a.peso}%` : ''}${a.foraDaMediaGeral ? ' · *fora da média geral*' : ''}${a.foraDeEscopo ? ' · *fora de escopo*' : ''}`;
  })
  .join('\n')}

${(dimensoesForaEscopo || []).length > 0 ? `\n## Fora de escopo\n${dimensoesForaEscopo.map((a) => `- ${a.area}`).join('\n')}\n` : ''}

## Top 5 forças
${top5.map((a, i) => `${i + 1}. **${a.area}**: ${a.score.toFixed(2)}`).join('\n')}

## Top 5 gaps
${bottom5.map((a, i) => `${i + 1}. **${a.area}**: ${a.score.toFixed(2)}`).join('\n')}

## Detalhamento por pergunta
${detalhePerguntasTxt}
${exigeUnidade && unidadeMeta ? `\n## Escopo unidade organizacional\n- **Unidade:** ${unidadeMeta.nome}${blocoEscopoFocoUnidadeSatf(unidadeMeta)}\n\n${blocoDescricaoUnidadeMarkdown(unidadeMeta.descricao)}\n\n${montarBlocoPlanoAcaoUnidadeMarkdown(planoAcao)}` : ''}`;
}

/** Monta o pacote de dados em etapas com yield — evita bloquear o event loop (job em background). */
async function montarDadosBlockSatfAsync(params, relatorioJobId, atualizarProgressoJobBook) {
  const reportar = async (subpasso, etapa) => {
    if (relatorioJobId && atualizarProgressoJobBook) {
      await tickJobProgress(relatorioJobId, atualizarProgressoJobBook, 35, etapa, {
        fase: 'preparacao_dados_block',
        subpasso
      });
    }
    await yieldEventLoop();
  };

  await reportar('inicio', 'Montando pacote de dados da unidade…');

  const {
    projeto,
    projetoVersao,
    avaliacoesFiltradas,
    filtroNivelMax,
    scoreGeral,
    scoreGeralDeclarado,
    certificacaoSatf,
    setor,
    porte,
    metodologiaScore,
    top5,
    bottom5,
    exigeUnidade,
    unidadeMeta,
    planoAcao,
    dimensoesEscopo,
    dimensoesDiagnostico,
    dimensoesForaEscopo,
    blocoContexto,
    blocoInventario,
    blocoDesejosIa,
    blocoEvolucao
  } = params;

  const ctx = limitarBlocoMarkdown(blocoContexto, DADOS_BLOCK_CONTEXTO_MAX_CHARS, 'Contexto do cliente');
  const desejos = limitarBlocoMarkdown(blocoDesejosIa, DADOS_BLOCK_DESEJOS_MAX_CHARS, 'Desejos IA');
  const inventario = limitarBlocoMarkdown(blocoInventario, DADOS_BLOCK_INVENTARIO_MAX_CHARS, 'Inventário');
  const evolucao = limitarBlocoMarkdown(blocoEvolucao, 12_000, 'Evolução entre versões');
  const dimsLista = dimensoesEscopo || dimensoesDiagnostico;
  const nivel = nivelNumericoDeScore(scoreGeral);
  const nomesNivel = NOMES_NIVEL_BLUEPRINT;
  const blocoEscopoFoco = exigeUnidade ? blocoEscopoFocoUnidadeSatf(unidadeMeta) : '';

  await reportar('identificacao', 'Pacote de dados — identificação e avaliadores…');

  const partes = [
    '# DADOS DO ASSESSMENT — SATF TI v3',
    `## Identificação
- **Empresa:** ${projeto.empresa.nome}
- **Projeto:** ${projeto.nome}
- **Framework:** SATF TI v3 (IA Maturidade TI)
- **Versão da pesquisa:** ${projetoVersao.titulo} (${projetoVersao.status})
- **Setor / vertical:** ${setor}
- **Porte:** ${porte}
- **Avaliadores (filtro):** ${avaliacoesFiltradas.length}
- **Filtro prioridade:** ${filtroNivelMax == null ? 'Todos' : `Até nível ${filtroNivelMax}`}
${blocoEscopoFoco}
${blocoAvaliadoresConsolidadoMarkdown(avaliacoesFiltradas, filtroNivelMax)}`
  ];

  await reportar('contexto', 'Pacote de dados — contexto e anexos…');
  if (ctx) partes.push(ctx);
  if (inventario) partes.push(inventario);
  if (desejos) partes.push(desejos);

  if (certificacaoSatf) {
    partes.push(`## Certificação consultor
- Status geral: **${certificacaoSatf.statusGeral}**
- Dimensões pendentes: **${certificacaoSatf.pendentes}**
- Certificadas: **${certificacaoSatf.certificadas}**
- Rebaixadas: **${certificacaoSatf.rebaixadas}**
- Score geral declarado: **${scoreGeralDeclarado?.toFixed(2) ?? '—'}**
- Score geral **oficial** (usar no diagnóstico): **${scoreGeral.toFixed(2)}**`);
  }

  await reportar('taxonomia', 'Pacote de dados — taxonomia e scores…');
  partes.push(blocoTaxonomiaObrigatoriaSatfMarkdown(dimsLista));
  if (evolucao) partes.push(evolucao);

  partes.push(`## Metodologia de score SATF
${metodologiaScore?.descricaoScore || 'Média ponderada das dimensões núcleo; D10 fora da média geral; evidência obrigatória para notas ≥ 4.'}`);

  partes.push(`## Resultado geral
- **Score oficial:** ${scoreGeral.toFixed(2)} (Nível ${nivel} — ${nomesNivel[nivel - 1]})
${scoreGeralDeclarado != null && scoreGeralDeclarado !== scoreGeral ? `- **Score declarado (autoavaliação):** ${scoreGeralDeclarado.toFixed(2)}` : ''}`);

  partes.push(blocoOrdemDimensoesFrameworkMarkdown(FRAMEWORK_SATF_TI_V3));

  const linhasScores = dimsLista.map((a) => {
    const zero = dimensaoComScoreZero(a);
    const gap =
      a.scoreDeclarado != null && a.score != null && Math.abs(a.scoreDeclarado - a.score) > 0.05
        ? ` · gap decl→oficial ${(a.scoreDeclarado - a.score).toFixed(2)}`
        : '';
    const cert = a.certificacao?.status ? ` · cert: ${a.certificacao.status}` : '';
    return `- **${a.area}**${
      zero
        ? ' — score 0'
        : ` — oficial ${a.score.toFixed(2)} (N${a.nivel})${a.scoreDeclarado != null ? ` · decl ${a.scoreDeclarado.toFixed(2)}` : ''}${gap}${cert}`
    }${a.peso != null ? ` · peso ${a.peso}%` : ''}${a.foraDaMediaGeral ? ' · *fora da média geral*' : ''}${a.foraDeEscopo ? ' · *fora de escopo*' : ''}`;
  });
  partes.push(`## Scores por dimensão (${dimsLista.length})\n${linhasScores.join('\n')}`);

  if ((dimensoesForaEscopo || []).length > 0) {
    partes.push(`## Fora de escopo\n${dimensoesForaEscopo.map((a) => `- ${a.area}`).join('\n')}`);
  }

  await reportar('ranking', 'Pacote de dados — ranking e plano da unidade…');

  partes.push(`## Top 5 forças\n${top5.map((a, i) => `${i + 1}. **${a.area}**: ${a.score.toFixed(2)}`).join('\n')}`);
  partes.push(`## Top 5 gaps\n${bottom5.map((a, i) => `${i + 1}. **${a.area}**: ${a.score.toFixed(2)}`).join('\n')}`);

  const detalhePerguntasTxt = exigeUnidade
    ? montarResumoScoresDimensoes(dimsLista, {
        titulo: 'Scores por dimensão (resumo — detalhe [Qn] em cada subseção 3.N)'
      }) || '—'
    : dimsLista
        .map(
          (a) =>
            `\n### ${a.area} (Oficial: ${dimensaoComScoreZero(a) ? '0' : (a.score ?? 0).toFixed(2)}${
              a.scoreDeclarado != null && a.scoreDeclarado !== a.score
                ? ` · Declarado: ${a.scoreDeclarado.toFixed(2)}`
                : ''
            })\n${(a.perguntas || [])
              .map(
                (p) =>
                  `- [Q${p.numero}] ${p.texto.substring(0, 160)}${p.texto.length > 160 ? '…' : ''} → ${
                    p.totalRespostas > 0 ? p.score : '0'
                  }`
              )
              .join('\n')}`
        )
        .join('\n');
  partes.push(`## Detalhamento por pergunta\n${detalhePerguntasTxt}`);

  if (exigeUnidade && unidadeMeta) {
    partes.push(`## Escopo unidade organizacional
- **Unidade:** ${unidadeMeta.nome}${blocoEscopoFocoUnidadeSatf(unidadeMeta)}

${blocoDescricaoUnidadeMarkdown(unidadeMeta.descricao)}

${montarBlocoPlanoAcaoUnidadeMarkdown(planoAcao)}`);
  }

  await reportar('final', 'Pacote de dados — finalizando…');
  return partes.filter(Boolean).join('\n\n');
}

async function montarChunksSatf({
  dimensoesDiagnostico,
  dadosBlock,
  dadosBlockRapido,
  projeto,
  setor,
  porte,
  scoreGeral,
  nivel,
  temContexto,
  temDesejosIa,
  blocoContextoClienteBook,
  inventarioDocumentos,
  mediaSetor,
  ordemNomes,
  modoRapido,
  exigeUnidade = false,
  unidadeMeta = null,
  planoAcao = null,
  mapaRenumeracaoSecoes = null,
  onChunkPrepared = null
}) {
  const reportarChunkPreparado = async (label) => {
    if (!onChunkPrepared) return;
    await onChunkPrepared(chunks.length + 1, label);
  };
  const chunks = [];
  const dados = modoRapido ? dadosBlockRapido : dadosBlock;
  const regrasTaxonomia = blocoRegrasTaxonomiaSatfPrompt();

  const dimsParaSecao3Base = exigeUnidade
    ? filtrarDimensoesFocoUnidade(dimensoesDiagnostico, unidadeMeta, 'satf')
    : dimensoesDiagnostico;
  const dimsParaSecao3Foco =
    exigeUnidade && unidadeComFocoDefinido(unidadeMeta)
      ? dimensoesSecao3BookUnidade(dimensoesDiagnostico, unidadeMeta, 'satf')
      : dimsParaSecao3Base;
  const dimsParaSecao3 = exigeUnidade
    ? filtrarDimensoesPorModeloOperacional(dimsParaSecao3Foco, unidadeMeta)
    : dimsParaSecao3Foco;
  const focoDisplay = formatarDimensoesFocoSatfDisplay(parseDimensoesFocoSatfJson(unidadeMeta));
  const focoUnidadeTxt =
    exigeUnidade && focoDisplay
      ? `\n**Escopo:** analise e mencione **somente** ${focoDisplay}. **Proibido** referenciar dimensões SATF fora do foco — especialmente dimensões explicitamente excluídas no cadastro da unidade.\n`
      : '';
  const ordemNomesSecao3 = dimsParaSecao3.map((d) => d.area);

  const numPaiDiagnostico = 3;

  if (exigeUnidade) {
    await yieldEventLoop();
    await reportarChunkPreparado('Metodologia SATF');
    chunks.push({
      id: 'sec_1',
      label: 'Metodologia SATF',
      prompt: `${regrasTaxonomia}
Gere SOMENTE a Seção 1 do book SATF TI v3 por unidade, em Markdown condensado:

# 1. METODOLOGIA SATF TI v3
- Instrumento SysMap **SATF TI v3 — IA Maturidade TI** para maturidade de IA em **TI e engenharia** (11 dimensões D1–D11, escala N1–N5)
- Três camadas: coleta Likert → evidência obrigatória (nota ≥4) → certificação consultor
- Como interpretar score **oficial** vs declarado
- **Não** apresente MIT CISR, SysMap Blueprint IA ou 16 dimensões como metodologia deste documento

Público: CTO / engenharia. Metodologia = **SATF TI v3** exclusivamente.
Este book é **exclusivo da unidade "${unidadeMeta?.nome}"** — score e recomendações refletem somente avaliadores desta unidade.
**Não** crie "# 2." (Sumário) nem "# 3." (Diagnóstico) — há chunks dedicados.

DADOS:
${dados}

Comece com "# 1. METODOLOGIA SATF TI v3". **PARE** antes de qualquer "# 2.".`,
      maxTokens: modoRapido ? 2800 : 4000
    });

    await yieldEventLoop();
    await reportarChunkPreparado('Sumário executivo');
    chunks.push({
      id: 'sec_2',
      label: 'Sumário executivo',
      prompt: `${regrasTaxonomia}
Gere SOMENTE a Seção 2 do book SATF por unidade:

# 2. SUMÁRIO EXECUTIVO
- 1 parágrafo diagnóstico da unidade "${unidadeMeta?.nome || 'esta unidade'}" (situação atual)${focoUnidadeTxt}
- Tabela: Score oficial | Nível | Gap vs declarado (se houver) | Certificação pendente? | Avaliadores
- 5 insights em bullet (foco engenharia/plataforma/SDLC; **somente** dimensões SATF em escopo nos DADOS)
- Subseção **Evolução entre rodadas** se dados disponíveis

**PARE** antes de "# 3." — o Diagnóstico vem em chunk dedicado.

DADOS:
${dados}

Comece com "# 2. SUMÁRIO EXECUTIVO".`,
      maxTokens: modoRapido ? 2800 : 4200
    });
  } else {
    await yieldEventLoop();
    await reportarChunkPreparado('Metodologia SATF + Sumário');
    chunks.push({
      id: 'sec_1_2',
      label: 'Metodologia SATF + Sumário',
      prompt: `${regrasTaxonomia}
Gere SOMENTE as Seções 1 e 2 do book SATF TI v3, em Markdown condensado:

# 1. METODOLOGIA SATF TI v3
- Instrumento SysMap **SATF TI v3 — IA Maturidade TI** para maturidade de IA em **TI e engenharia** (11 dimensões D1–D11, escala N1–N5)
- Três camadas: coleta Likert → evidência obrigatória (nota ≥4) → certificação consultor
- Como interpretar score **oficial** vs declarado
- **Não** apresente MIT CISR, SysMap Blueprint IA ou 16 dimensões como metodologia deste documento

# 2. SUMÁRIO EXECUTIVO
- 1 parágrafo diagnóstico TI (situação atual) — cite Entregáveis A–H do inventário com **rótulos canônicos** (E = Roteiro de Pilotos; H = Diagnóstico de Clientes)
- Tabela: Score oficial | Nível | Gap vs declarado (se houver) | Certificação pendente?
- 5 insights em bullet (foco engenharia/plataforma/SDLC; referencie dimensões SATF D1–D11; inclua pilotos e entregáveis E–H se cadastrados)
- Subseção **Evolução entre rodadas** se dados disponíveis

Público: CTO / engenharia. Metodologia = **SATF TI v3** exclusivamente.

DADOS:
${dados}

Comece com "# 1. METODOLOGIA SATF TI v3".`,
      maxTokens: modoRapido ? 3200 : 5000
    });
  }

  for (let idxRel = 0; idxRel < dimsParaSecao3.length; idxRel++) {
    const dim = dimsParaSecao3[idxRel];
    const idxOriginal = dimensoesDiagnostico.findIndex(
      (d) =>
        (d.areaId != null && dim.areaId != null && d.areaId === dim.areaId) ||
        (d.area && dim.area && d.area === dim.area) ||
        (codigoEfetivoDimensaoFramework(d, 'satf') &&
          codigoEfetivoDimensaoFramework(d, 'satf') === codigoEfetivoDimensaoFramework(dim, 'satf'))
    );
    const idx = idxOriginal >= 0 ? idxOriginal : dimensoesDiagnostico.indexOf(dim);
    if (idx < 0) {
      console.warn(`[Book SATF] Dimensão sem índice canônico ignorada no chunk: ${dim?.area}`);
      continue;
    }
    const isFirst = idxRel === 0;
    const numSecao = numSecaoDiagnosticoBook(exigeUnidade, unidadeMeta, idxRel, idx);
    const dadosDimensao = montarBlocoDadosDimensaoUnica(dim, {
      scoreGeral,
      mediaSetor,
      unidadeNome: exigeUnidade ? unidadeMeta?.nome : null
    });
    if (dimensaoComScoreZero(dim)) {
      if (exigeUnidade && unidadeComFocoDefinido(unidadeMeta)) {
        // Book por unidade: gera análise completa mesmo sem score individual discriminado.
      } else {
        chunks.push({
          id: `sec_3_${idx + 1}`,
          label: `Registro — ${dim.area}`,
          staticContent: (() => {
            let md = '';
            if (isFirst) {
              md += `${introducaoSecao3SatfBookMarkdown(dimsParaSecao3.length, ordemNomesSecao3, {
                numPai: numPaiDiagnostico
              })}\n\n`;
            }
            md += blocoDimensaoScoreZeroSecao3Satf(numSecao, dim, {
              isFirst: false,
              totalDimensoes: dimsParaSecao3.length,
              ordemNomes: ordemNomesSecao3,
              modoRapido,
              numPai: numPaiDiagnostico
            });
            return md;
          })()
        });
        await reportarChunkPreparado(`Registro — ${dim.area}`);
        continue;
      }
    }

    await yieldEventLoop();
    await reportarChunkPreparado(`Diagnóstico — ${dim.area}`);
    chunks.push({
      id: `sec_3_${idx + 1}`,
      label: `Diagnóstico — ${dim.area}`,
      prompt: montarPromptSecao3DimensaoSatf({
        numSecao,
        dim,
        isFirst,
        modoRapido,
        projeto,
        setor,
        porte,
        scoreGeral,
        nivel,
        mediaSetor,
        temContexto,
        temDesejosIa,
        blocoContextoClienteBook,
        inventarioDocumentos,
        dadosDimensao,
        tabelaDim: tabelaPerguntasDimensaoMarkdown(dim),
        exigeUnidade,
        unidadeMeta,
        planoDim: exigeUnidade ? planoAcaoPorNomeDimensao(planoAcao, dim.area) : null
      }),
      maxTokens: modoRapido ? 3600 : 6000
    });
  }

  if (exigeUnidade) {
    const nRoadmap = numeroSecaoPrincipalSatfUnidade(4, mapaRenumeracaoSecoes);
    const nProximos = numeroSecaoPrincipalSatfUnidade(8, mapaRenumeracaoSecoes);
    const dimsTabela = dimsParaSecao3;

    chunks.push({
      id: 'sec_4',
      label: 'Roadmap engenharia 30-60-90',
      prompt: `${regrasTaxonomia}
# ${nRoadmap}. ROADMAP ENGENHARIA & PLATAFORMA (30-60-90 dias)

Gere **SOMENTE** a Seção ${nRoadmap} em Markdown — subseções ${nRoadmap}.1 a ${nRoadmap}.4.
**PARE** antes de "### ${nRoadmap}.5" e antes de "# ${nProximos}." — a Tabela Resumo e os Próximos Passos vêm em chunks dedicados.

Estrutura **obrigatória e única** (não renumerar nem repetir):
### ${nRoadmap}.1 Visão Geral do Horizonte
### ${nRoadmap}.2 Horizonte 30 dias
### ${nRoadmap}.3 Horizonte 60 dias
### ${nRoadmap}.4 Horizonte 90 dias

**PROIBIDO:** gerar \`### ${nRoadmap}.5 Tabela Resumo\` neste chunk.
**PROIBIDO:** inventar "Score atual (oficial)" — se houver tabela de evolução, copie **exatamente** os scores oficiais do bloco DADOS (nunca use meta 90d como score atual).
Ao referenciar gaps e iniciativas, use dimensões SATF com nomes oficiais do bloco DADOS.${focoUnidadeTxt}
**PROIBIDO** citar D1/D2 (ou outras fora do foco) mesmo como "referência cruzada".

DADOS:\n${dados}`,
      maxTokens: 3200
    });
    await reportarChunkPreparado('Roadmap engenharia 30-60-90');

    chunks.push({
      id: 'sec_4_tabela',
      label: 'Tabela resumo do roadmap',
      qualidadeTipo: 'tabela_resumo',
      qualidadeOpts: { tipo: 'tabela_resumo', linhasTabelaEsperadas: Math.max(1, dimsTabela.length) },
      prompt: montarPromptTabelaResumoRoadmap({
        regrasTaxonomia,
        nRoadmap,
        nProximos,
        dimensoesEscopo: dimsTabela,
        focoUnidadeTxt,
        dados
      }),
      maxTokens: 2200
    });
    await reportarChunkPreparado('Tabela resumo do roadmap');

    chunks.push({
      id: 'sec_5',
      label: 'Próximos passos 30 dias',
      qualidadeTipo: 'proximos',
      qualidadeOpts: { tipo: 'proximos', maxItensProximos: 4 },
      prompt: `${regrasTaxonomia}
# ${nProximos}. Próximos Passos e Encerramento

Gere **SOMENTE** a Seção ${nProximos} (subseções ${nProximos}.1–${nProximos}.4). **Não** gere seção 6+ nem Apêndice numerado como seção principal.

${instrucaoOrcamentoProximosPassos({ maxItens: 4 })}
Foco TI e unidade "${unidadeMeta?.nome || 'esta unidade'}".
Cada ação deve indicar dimensão SATF relacionada (Dn — nome oficial).${focoUnidadeTxt}
**PROIBIDO** atribuir ações a dimensões fora do foco (inclui D1/D2 se excluídas), mesmo como "referência cruzada".

DADOS:\n${dados}`,
      maxTokens: 2800
    });
    await reportarChunkPreparado('Próximos passos 30 dias');

    return chunks;
  }

  const n4 = 4;
  const n5 = 5;
  const n6 = 6;
  const n7 = 7;
  const n8 = 8;

  chunks.push({
    id: 'sec_4',
    label: 'Roadmap engenharia 30-60-90',
    prompt: `${regrasTaxonomia}
# ${n4}. ROADMAP ENGENHARIA & PLATAFORMA (30-60-90 dias)

Gere **SOMENTE** a Seção ${n4} em Markdown. **PARE** antes de "# ${n4 + 1}." — não gere Fábrica Agêntica, Conformidade, Capacitação nem Próximos Passos aqui (há chunks dedicados).

Estrutura **obrigatória e única** (não renumerar nem repetir):
### ${n4}.1 Visão Geral do Horizonte
### ${n4}.2 Horizonte 30 dias
### ${n4}.3 Horizonte 60 dias
### ${n4}.4 Horizonte 90 dias
### ${n4}.5 Tabela Resumo do Roadmap

${instrucaoOrcamentoTabelaResumo(dimensoesDiagnostico, { nRoadmap: n4 })}

**PROIBIDO:** segunda sequência ${n4}.2/${n4}.3/${n4}.4 após ${n4}.5.
**PROIBIDO:** inventar "Score atual (oficial)" — copie scores oficiais do bloco DADOS.
Ao referenciar gaps e iniciativas, use **somente** dimensões SATF D1–D11 com nomes oficiais do bloco DADOS.

DADOS:\n${dados}`,
    maxTokens: 4000
  });
  await reportarChunkPreparado('Roadmap engenharia 30-60-90');

  chunks.push({
    id: 'sec_5',
    label: 'Fábrica Agêntica (D10)',
    prompt: `${regrasTaxonomia}
# ${n5}. Fábrica Agêntica de Software (D10)

Gere **SOMENTE** a Seção ${n5} (subseções ${n5}.1–${n5}.5). **PARE** antes de "# ${n5 + 1}." — não antecipe Conformidade Regulatória.

Se D10 estiver nos dados com score > 0, analise maturidade de fábrica agêntica. Senão, nota curta "fora de escopo ou sem dados".
Ao citar entregáveis do escopo use **rótulos canônicos**: E = Roteiro de Pilotos; H = Diagnóstico de Clientes; G = Capacitação e Gestão de Mudança.
**Não** introduza outras dimensões além das SATF D1–D11.

DADOS:\n${dados}`,
    maxTokens: 3500
  });
  await reportarChunkPreparado('Fábrica Agêntica (D10)');

  chunks.push({
    id: 'sec_6',
    label: 'Conformidade TI (D11)',
    prompt: `${regrasTaxonomia}
# ${n6}. Conformidade Regulatória de IA (D11)

Gere **SOMENTE** a Seção ${n6} (subseções ${n6}.1–${n6}.4). **PARE** antes de "# ${n6 + 1}." — não antecipe Capacitação nem Próximos Passos.

**Obrigatório:** esta seção **sempre** deve existir no book SATF completo — mesmo se D11 estiver desativada ou sem score consolidado.
${(() => {
  const d11 = encontrarDimensaoD11Satf(dimensoesDiagnostico);
  if (d11?.foraDeEscopo) {
    return '\n> D11 está **fora do escopo** da configuração do projeto — documente como registro regulatório e próximos passos, sem omitir a seção.';
  }
  if (d11 && dimensaoComScoreZero(d11)) {
    return '\n> D11 sem avaliações consolidadas nesta rodada — registre o status e recomende passos de conformidade (ISO 42001, LGPD, PL IA).';
  }
  return '\n> Use scores e perguntas de **D11 — Conformidade Regulatória de IA** dos DADOS.';
})()}

Governança de IA em TI, LGPD técnico, auditoria de modelos, SGAI e NIST AI RMF.
Referencie **D11** e, se pertinente, **D2 Governança, Risco & Conformidade** — nomes SATF oficiais.

DADOS:\n${dados}`,
    maxTokens: 3500
  });
  await reportarChunkPreparado('Conformidade TI (D11)');

  chunks.push({
    id: 'sec_7',
    label: 'Capacitação e governança',
    prompt: `${regrasTaxonomia}
# ${n7}. Capacitação, Papéis e Governança de Times

Gere **SOMENTE** a Seção ${n7} (subseções ${n7}.1–${n7}.5). **PARE** antes de "# ${n8}." — não antecipe Próximos Passos.

Skills, chapter leads, guildas de IA, operating model de engenharia.
Ancorar em **D3 Pessoas, Cultura & Capacitação** e **D2 Governança, Risco & Conformidade** (SATF) — não use taxonomia Blueprint.

DADOS:\n${dados}`,
    maxTokens: 3500
  });
  await reportarChunkPreparado('Capacitação e governança');

  chunks.push({
    id: 'sec_8',
    label: 'Próximos passos 30 dias',
    qualidadeTipo: 'proximos',
    qualidadeOpts: { tipo: 'proximos', maxItensProximos: 4 },
    prompt: `${regrasTaxonomia}
# ${n8}. Próximos Passos e Encerramento

Gere **SOMENTE** a Seção ${n8} (subseções ${n8}.1–${n8}.4). **Não** gere seção 9+ nem Apêndice numerado como seção principal.

${instrucaoOrcamentoProximosPassos({ maxItens: 4 })}
Foco TI.
Cada ação deve indicar dimensão SATF relacionada (Dn — nome oficial).

DADOS:\n${dados}`,
    maxTokens: 3200
  });
  await reportarChunkPreparado('Próximos passos 30 dias');

  return chunks;
}

async function tickJobProgress(relatorioJobId, atualizarProgressoJobBook, progresso, etapa, meta = {}) {
  if (!relatorioJobId || !atualizarProgressoJobBook) return;
  await atualizarProgressoJobBook(relatorioJobId, {
    progresso,
    etapa,
    metadata: JSON.stringify(meta)
  });
}

async function resolverRelatorioJobIdBook(req, projetoId, tipoRelatorio) {
  const jobIdParam = req.query.jobId;
  if (!jobIdParam) return null;
  const jid = parseInt(String(jobIdParam), 10);
  if (Number.isNaN(jid) || jid <= 0) return null;

  const jobRow = await prisma.relatorioIAJob.findFirst({
    where: { id: jid, projetoId }
  });
  if (jobRow) {
    if (jobRow.tipo !== tipoRelatorio) {
      console.warn(
        `[Book SATF] jobId ${jid} tipo ${jobRow.tipo} ≠ esperado ${tipoRelatorio} — progresso mesmo assim`
      );
    }
    return jid;
  }

  console.warn(
    `[Book SATF] jobId ${jid} não encontrado no projeto ${projetoId} — vinculando pela query para reportar progresso`
  );
  return jid;
}

async function reportarProgressoChunkJob(
  relatorioJobId,
  atualizarProgressoJobBook,
  { indice, total, chunk, fase = 'geracao_ia' }
) {
  if (!relatorioJobId || !atualizarProgressoJobBook) return;
  const pct = Math.min(94, 6 + Math.round(((indice + 1) / Math.max(total, 1)) * 88));
  await atualizarProgressoJobBook(relatorioJobId, {
    progresso: Math.max(36, pct),
    etapa: `SATF ${indice + 1}/${total}: ${chunk.label}${fase === 'geracao_ia' ? '…' : ''}`,
    metadata: JSON.stringify({
      fase,
      chunkAtual: indice + 1,
      totalChunks: total,
      chunkLabel: chunk.label,
      chunkId: chunk.id
    })
  });
}

async function executarChunksLoop({
  chunks,
  dimensoesDiagnostico,
  ordemNomes,
  modoRapido,
  temContexto,
  inventarioDocumentos,
  relatorioJobId,
  bookClienteDesconectou,
  atualizarProgressoJobBook,
  instrucoesUnidadeExtra = '',
  temGlossarioFatos = false,
  indicesSecao3Ativos = null,
  ordemNomesSecao3Ativos = null,
  numPaiDiagnostico = 3,
  exigeUnidade = false
}) {
  const paiDiag = Number(numPaiDiagnostico) === 2 ? 2 : 3;
  const partesPreSec3 = [];
  const blocosSec3PorIndice = Array(dimensoesDiagnostico.length).fill(null);
  const partesPosSec3 = [];
  let totalTokensEntrada = 0;
  let totalTokensSaida = 0;
  let providerUsado = null;
  let modelUsado = null;
  const avisosProvedor = [];
  const avisosQualidade = [];
  const chunksStopMeta = [];

  const systemPrompt = `${SYSTEM_PROMPT_PERSONA_BOOK_SATF}
${blocoRegrasTaxonomiaSatfPrompt()}
${instrucoesUnidadeExtra}
${modoRapido ? '\nMODO RÁPIDO: textos mais curtos, mas mantenha especificidade por dimensão, [Qn], contexto do projeto e recomendações acionáveis (não resuma em bullets genéricos).' : ''}
${temContexto ? blocoInstrucoesSistemaSecao3ComContexto() : ''}
${temGlossarioFatos ? blocoInstrucoesPrioridadeGlossario() : ''}
Gere SOMENTE as seções pedidas. Markdown com # ## ###.`;

  /** Ordem fixa: pré (§1–2) · diagnóstico (§3.N) · pós (§4+). Não depende de “chegouSec3”. */
  const registrar = (chunk, conteudo) => {
    const texto = recortarConteudoChunkBookSatf(conteudo, chunk.id);
    if (!texto) return;
    const id = String(chunk.id || '');
    const m = id.match(/^sec_3_(\d+)$/);
    if (m) {
      const slot = parseInt(m[1], 10) - 1;
      if (slot >= 0 && slot < blocosSec3PorIndice.length) {
        blocosSec3PorIndice[slot] = texto;
      }
      return;
    }
    if (/^sec_[4-8]$/.test(id) || id === 'sec_4_tabela' || id === 'sec_4b') {
      partesPosSec3.push(texto);
      return;
    }
    partesPreSec3.push(texto);
  };

  for (let i = 0; i < chunks.length; i++) {
    if (bookClienteDesconectou()) {
      const err = new Error('BOOK_IA_CANCELADO');
      err.code = 'BOOK_IA_CANCELADO';
      throw err;
    }
    if (relatorioJobId) {
      const job = await prisma.relatorioIAJob.findUnique({
        where: { id: relatorioJobId },
        select: { status: true }
      });
      if (job?.status === 'cancelled') {
        const err = new Error('BOOK_IA_CANCELADO');
        err.code = 'BOOK_IA_CANCELADO';
        throw err;
      }
    }

    const chunk = chunks[i];
    await reportarProgressoChunkJob(relatorioJobId, atualizarProgressoJobBook, {
      indice: i,
      total: chunks.length,
      chunk,
      fase: chunk.staticContent ? 'chunk_estatico' : 'geracao_ia'
    });

    if (chunk.staticContent) {
      registrar(chunk, chunk.staticContent);
      continue;
    }

    try {
      const gerarFn = async (prompt, maxTok) => {
        const resultado = await callAIWithContinuation(prompt, systemPrompt, {
          temperature: chunk.id.startsWith('sec_3_') ? 0.45 : 0.5,
          maxTokens: maxTok || chunk.maxTokens || 4000
        });
        return resultado;
      };

      let resultado;
      if (chunk.qualidadeTipo) {
        resultado = await gerarComValidacaoQualidade({
          prompt: chunk.prompt,
          maxTokens: chunk.maxTokens || 4000,
          gerarFn,
          qualidadeOpts: chunk.qualidadeOpts || { tipo: chunk.qualidadeTipo },
          chunkId: chunk.id,
          chunkLabel: chunk.label
        });
        if (resultado.warning) avisosQualidade.push(resultado.warning);
        if (resultado.meta) chunksStopMeta.push(resultado.meta);
      } else {
        resultado = await gerarFn(chunk.prompt, chunk.maxTokens || 4000);
        chunksStopMeta.push({
          chunkId: chunk.id,
          chunkLabel: chunk.label,
          stopReason: resultado.stopReason || null,
          truncated: Boolean(resultado.truncated),
          qualidadeOk: true,
          qualidadeRetry: false
        });
      }

      const m = String(chunk.id || '').match(/^sec_3_(\d+)$/);
      if (m) {
        const dimIdx = parseInt(m[1], 10) - 1;
        const dim = dimensoesDiagnostico[dimIdx];
        const indicesOrdenados =
          indicesSecao3Ativos && indicesSecao3Ativos.size
            ? [...indicesSecao3Ativos].sort((a, b) => a - b)
            : null;
        const idxRel = indicesOrdenados ? indicesOrdenados.indexOf(dimIdx) : dimIdx;
        const numSecao =
          indicesOrdenados && idxRel >= 0 ? `${paiDiag}.${idxRel + 1}` : `${paiDiag}.${dimIdx + 1}`;
        const primeiroIdxAtivo = indicesOrdenados ? indicesOrdenados[0] : 0;
        const totalDimsSec3 = indicesOrdenados ? indicesOrdenados.length : dimensoesDiagnostico.length;
        const nomesSecao3 = ordemNomesSecao3Ativos || ordemNomes;
        registrar(
          chunk,
          montarBlocoSecao3DimensaoSatf({
            numSecao,
            dim,
            conteudoIa: resultado.content,
            isFirst: dimIdx === primeiroIdxAtivo,
            totalDimensoes: totalDimsSec3,
            ordemNomes: nomesSecao3,
            modoRapido,
            inventarioDocumentos,
            numPai: paiDiag,
            exigeUnidade
          })
        );
      } else {
        registrar(chunk, resultado.content);
      }
      totalTokensEntrada += resultado.tokensEntrada || 0;
      totalTokensSaida += resultado.tokensSaida || 0;
      if (!providerUsado) providerUsado = resultado.provider;
      if (!modelUsado) modelUsado = resultado.model;

      const avisoFallback = buildFallbackSuccessAviso(resultado, chunk);
      const etapaBloco = `SATF ${i + 1}/${chunks.length}: ${chunk.label}`;
      if (avisoFallback) {
        avisosProvedor.push(avisoFallback);
        console.warn(
          `[Book SATF] Fallback no bloco ${chunk.id}: ${avisoFallback.configuredProviderName} → ${avisoFallback.providerUsadoName}`
        );
      }

      await atualizarProgressoJobBook?.(relatorioJobId, {
        progresso: 6 + Math.round(((i + 1) / chunks.length) * 88),
        etapa: avisoFallback
          ? formatEtapaFallbackSucesso(avisoFallback, chunk.label) || etapaBloco
          : etapaBloco,
        metadata: JSON.stringify({
          fase: 'geracao_ia',
          chunkAtual: i + 1,
          totalChunks: chunks.length,
          chunkLabel: chunk.label,
          chunkId: chunk.id,
          stopReason: resultado.stopReason || null,
          truncated: Boolean(resultado.truncated),
          qualidadeOk: resultado.meta?.qualidadeOk ?? true,
          qualidadeRetry: Boolean(resultado.meta?.qualidadeRetry),
          ...(resultado.warning ? { avisoQualidade: resultado.warning } : {}),
          ...(avisosQualidade.length ? { avisosQualidade: avisosQualidade.slice(-5) } : {}),
          chunksStopMeta: chunksStopMeta.slice(-8),
          ...(avisoFallback
            ? { ultimoFallback: avisoFallback, avisosProvedor: avisosProvedor.slice(-5) }
            : {})
        })
      });
    } catch (err) {
      const logFalhas = formatProviderAttemptsLogLine(err.providerAttempts, {
        configuredProvider: err.configuredProvider
      });
      if (logFalhas) console.error(`[Book SATF] ${logFalhas}`);
      console.error(`[Book SATF] Erro no chunk ${chunk.id}:`, err.message);

      const avisoFalha = buildChunkFailureAviso(err, chunk);
      avisosProvedor.push(avisoFalha);

      await atualizarProgressoJobBook?.(relatorioJobId, {
        etapa:
          formatEtapaFalhaTotalChunk(avisoFalha, chunk.label) ||
          `Erro SATF ${i + 1}/${chunks.length}: ${chunk.label} (continuando…)`,
        metadata: JSON.stringify({
          fase: 'erro_chunk',
          chunkAtual: i + 1,
          totalChunks: chunks.length,
          chunkLabel: chunk.label,
          avisosProvedor: avisosProvedor.slice(-5),
          ...metadataFalhasProvedorChunk(err, chunk)
        })
      });

      // Detalhe técnico só em log/job; markdown do book usa mensagem amigável.
      console.error(`[Book SATF] Detalhe falha chunk ${chunk.id}:`, formatProviderFailureForMarkdown(err));
      const msgUsuario = softAiFailureMessageForBook(err);
      const m = String(chunk.id || '').match(/^sec_3_(\d+)$/);
      if (m) {
        const dimIdx = parseInt(m[1], 10) - 1;
        const dim = dimensoesDiagnostico[dimIdx];
        const indicesOrdenados =
          indicesSecao3Ativos && indicesSecao3Ativos.size
            ? [...indicesSecao3Ativos].sort((a, b) => a - b)
            : null;
        const idxRel = indicesOrdenados ? indicesOrdenados.indexOf(dimIdx) : dimIdx;
        const numSecao =
          indicesOrdenados && idxRel >= 0 ? `${paiDiag}.${idxRel + 1}` : `${paiDiag}.${dimIdx + 1}`;
        const primeiroIdxAtivo = indicesOrdenados ? indicesOrdenados[0] : 0;
        const totalDimsSec3 = indicesOrdenados ? indicesOrdenados.length : dimensoesDiagnostico.length;
        const nomesSecao3 = ordemNomesSecao3Ativos || ordemNomes;
        const usarEsqueletoAnalise =
          exigeUnidade || !dimensaoComScoreZero(dim);
        registrar(
          chunk,
          montarBlocoSecao3DimensaoSatf({
            numSecao,
            dim,
            conteudoIa: usarEsqueletoAnalise
              ? esqueletoAnaliseDimensaoSatf(numSecao, dim, msgUsuario)
              : `### ${numSecao}.1 Status da dimensão\n\n> ⚠️ ${msgUsuario}\n\n### ${numSecao}.2 Registro de scores por pergunta\n\n${tabelaPerguntasDimensaoMarkdown(dim)}`,
            isFirst: dimIdx === primeiroIdxAtivo,
            totalDimensoes: totalDimsSec3,
            ordemNomes: nomesSecao3,
            modoRapido,
            inventarioDocumentos,
            numPai: paiDiag,
            exigeUnidade
          })
        );
      } else {
        registrar(
          chunk,
          `> ⚠️ **Nota:** Esta seção (${chunk.label}) não pôde ser gerada automaticamente. ${msgUsuario}`
        );
      }
    }
  }

  const indicesOrdenadosFallback =
    indicesSecao3Ativos && indicesSecao3Ativos.size
      ? [...indicesSecao3Ativos].sort((a, b) => a - b)
      : null;
  const blocosSec3 = blocosSec3PorIndice
    .map((bloco, idx) => {
      if (indicesSecao3Ativos && !indicesSecao3Ativos.has(idx)) return null;
      if (bloco) return bloco;
      const dim = dimensoesDiagnostico[idx];
      const idxRel = indicesOrdenadosFallback ? indicesOrdenadosFallback.indexOf(idx) : idx;
      const numSecao =
        indicesOrdenadosFallback && idxRel >= 0
          ? `${paiDiag}.${idxRel + 1}`
          : `${paiDiag}.${idx + 1}`;
      if (dimensaoComScoreZero(dim) && !exigeUnidade) {
        let md = '';
        const primeiroIdxAtivo = indicesOrdenadosFallback ? indicesOrdenadosFallback[0] : 0;
        if (idx === primeiroIdxAtivo) {
          const totalAtivas = indicesOrdenadosFallback
            ? indicesOrdenadosFallback.length
            : dimensoesDiagnostico.length;
          const nomesAtivos = ordemNomesSecao3Ativos || ordemNomes;
          md += `${introducaoSecao3SatfBookMarkdown(totalAtivas, nomesAtivos, {
            numPai: paiDiag
          })}\n\n`;
        }
        md += blocoDimensaoScoreZeroSecao3Satf(numSecao, dim, {
          isFirst: false,
          totalDimensoes: indicesOrdenadosFallback
            ? indicesOrdenadosFallback.length
            : dimensoesDiagnostico.length,
          ordemNomes: ordemNomesSecao3Ativos || ordemNomes,
          modoRapido,
          numPai: paiDiag
        });
        return md;
      }
      return montarBlocoSecao3DimensaoSatf({
        numSecao,
        dim,
        conteudoIa: esqueletoAnaliseDimensaoSatf(
          numSecao,
          dim,
          'Bloco ausente na montagem — conteúdo de análise 3.x.1–3.x.6 reconstruído automaticamente.'
        ),
        isFirst: idx === (indicesOrdenadosFallback ? indicesOrdenadosFallback[0] : 0),
        totalDimensoes: indicesOrdenadosFallback
          ? indicesOrdenadosFallback.length
          : dimensoesDiagnostico.length,
        ordemNomes: ordemNomesSecao3Ativos || ordemNomes,
        modoRapido,
        inventarioDocumentos,
        numPai: paiDiag,
        exigeUnidade
      });
    })
    .filter(Boolean);

  function stripIntroSecao3Duplicada(bloco) {
    return String(bloco || '').replace(
      new RegExp(`^#\\s+${paiDiag}\\.\\s+DIAGNÓSTICO[\\s\\S]*?\\n\\n(?=##\\s+${paiDiag}\\.)`, 'i'),
      ''
    );
  }

  const blocosLimpos = blocosSec3.map(stripIntroSecao3Duplicada);
  let secao3Completa = '';
  if (blocosLimpos.length) {
    const totalAtivas = blocosLimpos.length;
    const nomesAtivos = ordemNomesSecao3Ativos || ordemNomes;
    secao3Completa = `${introducaoSecao3SatfBookMarkdown(totalAtivas, nomesAtivos, {
      numPai: paiDiag
    })}\n\n${blocosLimpos.join('\n\n')}`;
  }

  return {
    markdown: normalizarSecoesBookSatf(
      [...partesPreSec3, secao3Completa, ...partesPosSec3].filter(Boolean).join('\n\n')
    ),
    totalTokensEntrada,
    totalTokensSaida,
    providerUsado,
    modelUsado,
    avisosProvedor,
    avisosQualidade,
    chunksStopMeta
  };
}

/**
 * Handler completo do POST relatorio-ia-completo para projetos SATF.
 */
export async function executarGeracaoBookSatf(req, res, deps, opts = {}) {
  const {
    atualizarProgressoJobBook,
    obterVersaoSelecionadaProjeto,
    idsAvaliacoesDaVersao
  } = deps;

  const exigeUnidade = opts.exigeUnidade === true;
  const projetoId = parseInt(req.params.id, 10);
  const reuse = deveReutilizarRelatorioIASalvo(req);
  const modoRapido = req.query.mode === 'rapido' || req.query.modo === 'rapido';
  const tipoRelatorio = exigeUnidade
    ? modoRapido
      ? 'book_unidade_satf_rapido'
      : 'book_unidade_satf'
    : modoRapido
      ? 'completo_satf_rapido'
      : 'completo_satf';
  const filtroNivelMax = parseFiltroNivelPrioridadeMapeamentoMaturidadeMax(req);
  const projetoVersao = await obterVersaoSelecionadaProjeto(req, projetoId);

  let relatorioJobId = await resolverRelatorioJobIdBook(req, projetoId, tipoRelatorio);
  if (relatorioJobId) {
    await atualizarProgressoJobBook(relatorioJobId, {
      progresso: 31,
      etapa: 'Iniciando book SATF (vinculado ao job em background)',
      metadata: JSON.stringify({ fase: 'inicio_rota', tipo: tipoRelatorio })
    });
  }

  let filtroUnidadeId = null;
  let unidadeMeta = null;
  let unidadeGeral = null;

  if (exigeUnidade) {
    const projetoEmp = await prisma.projeto.findUnique({
      where: { id: projetoId },
      select: { empresaId: true }
    });
    if (!projetoEmp) return res.status(404).json({ error: 'Projeto não encontrado' });
    const ctx = await resolverContextoUnidadeRelatorioObrigatorio(req, projetoEmp.empresaId);
    if (!ctx.ok) return res.status(ctx.status).json({ error: ctx.error });
    filtroUnidadeId = ctx.filtroUnidadeId;
    unidadeMeta = ctx.unidadeMeta;
    unidadeGeral = ctx.unidadeGeral;
  }

  let bookClienteDesconectou = false;
  req.on('close', () => {
    if (!relatorioJobId) bookClienteDesconectou = true;
  });

  if (reuse) {
    const ultimoSalvo = await prisma.relatorioIA.findFirst({
      where: { projetoId, tipo: tipoRelatorio },
      orderBy: { createdAt: 'desc' }
    });
    if (ultimoSalvo) {
      const dadosSnap = ultimoSalvo.dadosSnapshot ? JSON.parse(ultimoSalvo.dadosSnapshot) : null;
      const sec3 = relatorioBookSecao3Completo(ultimoSalvo.conteudoMd || '', TOTAL_DIMENSOES_SATF);
      const taxonomia = validarTaxonomiaBookSatf(ultimoSalvo.conteudoMd || '');
      const secoesDup = validarSecoesDuplicadasBookSatf(ultimoSalvo.conteudoMd || '');
      const cacheOk = exigeUnidade
        ? relatorioUnidadeCacheCompativel(dadosSnap, {
            filtroNivelMax,
            filtroUnidadeId,
            projetoVersaoId: projetoVersao?.id
          })
        : filtroNivelRelatorioIACompativel(dadosSnap, filtroNivelMax) &&
          Number(dadosSnap?.projetoVersao?.id || 0) === Number(projetoVersao?.id || 0);
      if (
        cacheOk &&
        dadosSnap?.frameworkMaturidade === FRAMEWORK_SATF_TI_V3 &&
        sec3.ok &&
        taxonomia.ok &&
        secoesDup.ok
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
          frameworkMaturidade: FRAMEWORK_SATF_TI_V3,
          tipoRelatorio,
          modoGeracao: modoRapido ? 'rapido' : 'completo_satf',
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

  if (exigeUnidade && !unidadeGeral) {
    unidadeGeral = await garantirUnidadeGeralEmpresa(projeto.empresaId);
  }

  const idsAval = await idsAvaliacoesDaVersao(projetoId, projetoVersao.id);
  const avaliacoesFiltradas = exigeUnidade
    ? filtrarAvaliacoesRelatorioProjeto(projeto.avaliacoes, {
        idsVersao: idsAval,
        filtroNivelMax,
        filtroUnidadeId,
        unidadeGeralId: unidadeGeral?.id
      })
    : projeto.avaliacoes.filter(
        (av) =>
          idsAval.has(Number(av.id)) &&
          usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(av.usuario, filtroNivelMax)
      );
  if (!avaliacoesFiltradas.length) {
    return res.status(400).json({
      error: exigeUnidade
        ? 'Não há avaliações finalizadas de avaliadores desta unidade para gerar o book SATF'
        : 'Não há avaliações finalizadas para gerar o book SATF',
      projetoVersao,
      filtroEmpresaUnidade: unidadeMeta
    });
  }

  if (relatorioJobId) {
    await atualizarProgressoJobBook(relatorioJobId, {
      progresso: 32,
      etapa: exigeUnidade
        ? `Consolidando book SATF — unidade ${unidadeMeta?.nome || '—'}`
        : 'Consolidando dados do book SATF',
      metadata: JSON.stringify({
        fase: 'preparacao',
        tipo: tipoRelatorio,
        empresaUnidadeId: filtroUnidadeId ?? null
      })
    });
  }

  const areas = ordenarAreasPorFramework(await listarAreasDoProjeto(prisma, projeto.id));
  await tickJobProgress(relatorioJobId, atualizarProgressoJobBook, 33, 'Carregando dimensões e scores da unidade…', {
    fase: 'preparacao_dimensoes'
  });

  const { porAreaId: dimensoesConfig, setorRegulado } = await mapaApresentacaoDimensoes(prisma, projetoId);
  const { frameworkMaturidade } = await carregarFrameworkProjeto(prisma, projetoId);
  const metodologiaScore = metodologiaScoreFramework(frameworkMaturidade, { setorRegulado });

  const consolidado = calcularScoresConsolidadoMaturidade(avaliacoesFiltradas, areas, {
    dimensoesConfig
  });
  let dimensoesDiagnostico = consolidado.todasDimensoes;
  if (dimensoesDiagnostico.length !== TOTAL_DIMENSOES_SATF) {
    console.warn(
      `[Book SATF] Esperadas ${TOTAL_DIMENSOES_SATF} dimensões na Seção 3; recebidas ${dimensoesDiagnostico.length}. Recompondo ordem canônica.`
    );
    dimensoesDiagnostico = garantirTodasDimensoesFramework(
      areas,
      dimensoesDiagnostico,
      FRAMEWORK_SATF_TI_V3
    ).map((d) => ({
      ...d,
      peso: d.areaId != null ? dimensoesConfig.get(d.areaId)?.peso ?? d.peso : d.peso,
      foraDeEscopo:
        d.areaId != null ? dimensoesConfig.get(d.areaId)?.foraDeEscopo === true : d.foraDeEscopo === true
    }));
  }
  const d11NoDiagnostico = encontrarDimensaoD11Satf(dimensoesDiagnostico);
  if (!d11NoDiagnostico) {
    console.warn(`[Book SATF] D11 (${NOME_DIMENSAO_D11_SATF}) ausente após recomposição — verifique seed SATF.`);
  }
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
  await tickJobProgress(relatorioJobId, atualizarProgressoJobBook, 34, 'Scores SATF e certificação consolidados', {
    fase: 'preparacao_scores'
  });
  if (satf) {
    scoreGeralDeclarado = consolidado.scoreGeral;
    scoreGeral = satf.scoreGeralOficial;
    certificacaoSatf = satf.certificacaoResumo;
    const porId = new Map(satf.scoresPorArea.map((a) => [a.areaId, a]));
    dimensoesDiagnostico = dimensoesDiagnostico.map((d) =>
      d.areaId != null ? { ...d, ...porId.get(d.areaId) } : d
    );
  }

  const nivel = nivelNumericoDeScore(scoreGeral);
  const dimsRelevantesUnidade = exigeUnidade
    ? filtrarDimensoesFocoUnidade(dimensoesDiagnostico, unidadeMeta, 'satf')
    : dimensoesDiagnostico;
  const dimsParaDados =
    exigeUnidade && unidadeComFocoDefinido(unidadeMeta) ? dimsRelevantesUnidade : dimensoesDiagnostico;
  const scoresParaRanking =
    exigeUnidade && unidadeComFocoDefinido(unidadeMeta)
      ? dimsRelevantesUnidade.filter((d) => !dimensaoComScoreZero(d))
      : consolidado.scoresPorArea;
  const ordenados = [...scoresParaRanking].sort((a, b) => b.score - a.score);
  const top5 = ordenados.slice(0, 5);
  const bottom5 = ordenados.slice(-5).reverse();
  const planoAcaoUnidade = exigeUnidade
    ? gerarPlanoAcaoPorDimensao(dimsRelevantesUnidade.filter((d) => !dimensaoComScoreZero(d)))
    : null;
  const secaoDashboardUnidade = null;
  const instrucoesUnidadeExtra = exigeUnidade
    ? instrucoesSistemaBookUnidade({ unidadeMeta, frameworkMaturidade: FRAMEWORK_SATF_TI_V3 })
    : '';
  const setor = projeto.vertical || projeto.empresa.setor || 'Tecnologia';
  const porte = projeto.empresa.porte || 'Não informado';
  let blocoContexto = await blocoContextoProjetoMarkdown(prisma, projetoId);
  await tickJobProgress(relatorioJobId, atualizarProgressoJobBook, 34, 'Contexto do projeto carregado', {
    fase: 'preparacao_contexto'
  });
  const regrasFatos = await carregarRegrasFatosContextoProjeto(prisma, projetoId, {
    unidadeMeta: exigeUnidade ? unidadeMeta : null
  });
  if (regrasFatos.blocoFatosUnidade) {
    blocoContexto = blocoContexto
      ? `${blocoContexto}\n\n${regrasFatos.blocoFatosUnidade}`
      : regrasFatos.blocoFatosUnidade;
  }
  let inventarioDocumentos = await carregarInventarioDocumentosContexto(prisma, projetoId);
  if (!inventarioDocumentos.entregaveis.length && blocoContexto) {
    inventarioDocumentos = inventarioDocumentosContextoFromMarkdown(blocoContexto);
  }
  const blocoInventario = blocoInventarioDocumentosMarkdown(inventarioDocumentos);
  const temContexto = projetoTemContextoCadastrado(blocoContexto) || Boolean(blocoInventario);
  const blocoDesejosIa = blocoDesejosIaMarkdown(avaliacoesFiltradas);
  const temDesejosIa = projetoTemDesejosIaCadastrados(avaliacoesFiltradas);
  if (inventarioDocumentos.entregaveis.length) {
    console.log(
      `[Book SATF] Inventário entregáveis projeto ${projetoId}: ${inventarioDocumentos.entregaveis.join(', ')}`
    );
  }
  const mediaSetor = mediaSetorTiBenchmark(setor);
  const comparativoVersoes = exigeUnidade
    ? {
        disponivel: false,
        mensagem:
          'Comparativo entre versões da pesquisa (enterprise) omitido no book por unidade — foco exclusivo na unidade.'
      }
    : await montarComparativoVersoesProjeto(prisma, {
        projetoId,
        versaoAtualId: projetoVersao.id,
        avaliacoesFinalizadas: projeto.avaliacoes,
        areas,
        filtroNivelMax,
        usuarioIncluidoNoFiltro: usuarioIncluidoNoFiltroNivelMapeamentoMaturidade
      });
  await tickJobProgress(
    relatorioJobId,
    atualizarProgressoJobBook,
    34,
    exigeUnidade ? 'Montando blocos do book por unidade…' : 'Comparativo de versões processado',
    { fase: 'preparacao_blocos' }
  );
  const blocoEvolucao = blocoEvolucaoVersoesMarkdown(comparativoVersoes);
  const ordemNomes = dimsParaDados.map((d) => d.area);

  await tickJobProgress(
    relatorioJobId,
    atualizarProgressoJobBook,
    35,
    exigeUnidade ? 'Montando pacote de dados da unidade…' : 'Montando pacote de dados do book…',
    { fase: 'preparacao_dados_block' }
  );

  let dadosBlock;
  try {
    dadosBlock = await montarDadosBlockSatfAsync(
      {
        projeto,
        projetoVersao,
        avaliacoesFiltradas,
        filtroNivelMax,
        dimensoesDiagnostico,
        dimensoesEscopo: dimsParaDados,
        dimensoesForaEscopo: consolidado.dimensoesForaEscopo,
        scoreGeral,
        scoreGeralDeclarado,
        certificacaoSatf,
        setor,
        porte,
        blocoContexto,
        blocoInventario,
        blocoDesejosIa,
        blocoEvolucao,
        metodologiaScore,
        top5,
        bottom5,
        exigeUnidade,
        unidadeMeta,
        planoAcao: planoAcaoUnidade
      },
      relatorioJobId,
      atualizarProgressoJobBook
    );
  } catch (errPrep) {
    console.error('[Book SATF] Falha ao montar pacote de dados:', errPrep);
    if (relatorioJobId) {
      await atualizarProgressoJobBook(relatorioJobId, {
        progresso: 35,
        etapa: `Erro ao montar pacote de dados: ${errPrep.message || 'falha na preparação'}`,
        metadata: JSON.stringify({ fase: 'erro_preparacao_dados', erro: String(errPrep.message || errPrep) })
      });
    }
    throw errPrep;
  }

  await tickJobProgress(relatorioJobId, atualizarProgressoJobBook, 36, 'Pacote de dados montado', {
    fase: 'preparacao_dados_ok',
    bytesDados: dadosBlock.length
  });
  await yieldEventLoop();

  const dadosBlockRapido = `${dadosBlock}\n\n${blocoDadosExtrasBookRapidoSatf({
    scoresPorArea: dimsParaDados,
    scoreGeral,
    nivel,
    nomesNivel: NOMES_NIVEL_BLUEPRINT
  })}`;

  const mapaRenumeracaoSecoes = construirMapaRenumeracaoSecoesPrincipaisSatfUnidade(
    exigeUnidade,
    unidadeMeta,
    { dimensaoNoFoco: (cod) => dimensaoNoFocoUnidade(unidadeMeta, cod) }
  );

  const blocoContextoPrompt = truncarBlocoMarkdownParaPrompt(blocoContexto);
  const chunks = await montarChunksSatf({
    dimensoesDiagnostico,
    dadosBlock,
    dadosBlockRapido,
    projeto,
    setor,
    porte,
    scoreGeral,
    nivel,
    temContexto,
    temDesejosIa,
    blocoContextoClienteBook: blocoContextoPrompt,
    inventarioDocumentos,
    mediaSetor,
    ordemNomes,
    modoRapido,
    exigeUnidade,
    unidadeMeta,
    planoAcao: planoAcaoUnidade,
    mapaRenumeracaoSecoes,
    onChunkPrepared: relatorioJobId
      ? async (atual, label) => {
          await tickJobProgress(
            relatorioJobId,
            atualizarProgressoJobBook,
            36,
            `Preparando blocos IA (${atual}) — ${label}`,
            {
              fase: 'preparacao_chunks_montagem',
              chunkPrepAtual: atual,
              chunkPrepLabel: label
            }
          );
          await yieldEventLoop();
        }
      : null
  });

  await tickJobProgress(relatorioJobId, atualizarProgressoJobBook, 37, `${chunks.length} blocos IA preparados`, {
    fase: 'preparacao_chunks',
    totalChunks: chunks.length
  });

  const dimsParaSecao3Foco =
    exigeUnidade && unidadeComFocoDefinido(unidadeMeta)
      ? dimensoesSecao3BookUnidade(dimensoesDiagnostico, unidadeMeta, 'satf')
      : exigeUnidade
        ? filtrarDimensoesFocoUnidade(dimensoesDiagnostico, unidadeMeta, 'satf')
        : dimensoesDiagnostico;
  const dimsParaSecao3 = exigeUnidade
    ? filtrarDimensoesPorModeloOperacional(dimsParaSecao3Foco, unidadeMeta)
    : dimsParaSecao3Foco;
  const indicesSecao3AtivosRaw =
    exigeUnidade && unidadeComFocoDefinido(unidadeMeta)
      ? new Set(
          dimsParaSecao3
            .map((dim) =>
              dimensoesDiagnostico.findIndex(
                (d) =>
                  (d.areaId != null && dim.areaId != null && d.areaId === dim.areaId) ||
                  (d.area && dim.area && d.area === dim.area) ||
                  (d.codigoFramework &&
                    dim.codigoFramework &&
                    String(d.codigoFramework).toUpperCase() ===
                      String(dim.codigoFramework).toUpperCase())
              )
            )
            .filter((i) => i >= 0)
        )
      : null;
  // Set vazio é truthy em JS e fazia o merge descartar TODAS as dimensões (§3 sumia).
  const indicesSecao3Ativos =
    indicesSecao3AtivosRaw && indicesSecao3AtivosRaw.size > 0 ? indicesSecao3AtivosRaw : null;
  const ordemNomesSecao3Ativos = dimsParaSecao3.map((d) => d.area);

  await loadPersistedAIConfig();
  await tickJobProgress(relatorioJobId, atualizarProgressoJobBook, 38, `Conectando IA (${getProvider().name})…`, {
    fase: 'preparacao_ia',
    provider: getProvider().name,
    totalChunks: chunks.length
  });
  console.log(
    `[Book SATF] Projeto ${projetoId} — ${chunks.length} chunks · ${getProvider().name}`
  );

  if (relatorioJobId) {
    await atualizarProgressoJobBook(relatorioJobId, {
      progresso: 39,
      etapa: `Gerando bloco 1/${chunks.length} — 1º chunk pode levar alguns minutos`,
      metadata: JSON.stringify({
        fase: 'inicio_chunks',
        totalChunks: chunks.length,
        chunkAtual: 0,
        provider: getProvider().name
      })
    });
  }

  const startTime = Date.now();
  const {
    markdown: markdownBruto,
    totalTokensEntrada: tokensChunksIn,
    totalTokensSaida: tokensChunksOut,
    providerUsado,
    modelUsado,
    avisosProvedor,
    avisosQualidade = [],
    chunksStopMeta = []
  } = await executarChunksLoop({
      chunks,
      dimensoesDiagnostico,
      ordemNomes,
      modoRapido,
      temContexto,
      inventarioDocumentos,
      relatorioJobId,
      bookClienteDesconectou: () => bookClienteDesconectou,
      atualizarProgressoJobBook,
      instrucoesUnidadeExtra,
      temGlossarioFatos: regrasFatos.temGlossario,
      indicesSecao3Ativos,
      ordemNomesSecao3Ativos: indicesSecao3Ativos ? ordemNomesSecao3Ativos : null,
      numPaiDiagnostico: 3,
      exigeUnidade
    });

  let totalTokensEntrada = tokensChunksIn;
  let totalTokensSaida = tokensChunksOut;
  let unidadeMetaParaCapa = unidadeMeta;

  if (exigeUnidade && unidadeMeta) {
    const descCadastro = String(unidadeMeta.descricao || '').trim();
    let descPolida = normalizarDescricaoUnidadeOrcamento(descCadastro);
    if (descCadastro && descCadastro !== '—') {
      try {
        const polimento = await gerarComValidacaoQualidade({
          prompt: montarPromptPolirDescricaoUnidade(descCadastro),
          maxTokens: 400,
          gerarFn: async (prompt, maxTok) =>
            callAIWithContinuation(prompt, SYSTEM_PROMPT_PERSONA_BOOK_SATF, {
              temperature: 0.3,
              maxTokens: maxTok || 400
            }),
          qualidadeOpts: { tipo: 'descricao', maxPalavrasDescricao: 140 },
          chunkId: 'desc_unidade',
          chunkLabel: 'Descrição da unidade'
        });
        totalTokensEntrada += polimento.tokensEntrada || 0;
        totalTokensSaida += polimento.tokensSaida || 0;
        const texto = String(polimento.content || '')
          .replace(/^#+\s*.*$/gm, '')
          .replace(/\*\*Descrição\*\*/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (texto && texto !== '—') {
          descPolida = normalizarDescricaoUnidadeOrcamento(texto);
        }
        if (polimento.warning) avisosQualidade.push(polimento.warning);
        chunksStopMeta.push(polimento.meta);
        if (relatorioJobId && atualizarProgressoJobBook) {
          await atualizarProgressoJobBook(relatorioJobId, {
            etapa: 'Polindo descrição da unidade…',
            metadata: JSON.stringify({
              fase: 'descricao_unidade',
              stopReason: polimento.stopReason || null,
              truncated: Boolean(polimento.truncated),
              qualidadeOk: polimento.meta?.qualidadeOk,
              ...(polimento.warning ? { avisoQualidade: polimento.warning } : {}),
              chunksStopMeta: chunksStopMeta.slice(-8)
            })
          });
        }
      } catch (descErr) {
        console.warn('[Book SATF] Polimento descrição falhou — usando normalização local:', descErr?.message);
        descPolida = normalizarDescricaoUnidadeOrcamento(descCadastro);
      }
    }
    unidadeMetaParaCapa = { ...unidadeMeta, descricao: descPolida };
  }

  const markdownBrutoRenumerado = mapaRenumeracaoSecoes
    ? renumerarSecoesPrincipaisBookSatfUnidade(markdownBruto, mapaRenumeracaoSecoes)
    : markdownBruto;

  const dimsScoresOficiaisRoadmap =
    exigeUnidade && dimsParaSecao3?.length ? dimsParaSecao3 : dimensoesDiagnostico;
  const markdownComScoresCorrigidos = corrigirScoresOficiaisTabelaEvolucaoRoadmapSatf(
    markdownBrutoRenumerado,
    dimsScoresOficiaisRoadmap
  );

  const markdown =
    exigeUnidade && unidadeComFocoDefinido(unidadeMeta)
      ? markdownComScoresCorrigidos
      : garantirSecoesD11BookSatf(markdownComScoresCorrigidos, dimensoesDiagnostico, {
          exigeUnidade,
          unidadeComFocoSatf: unidadeComFocoDefinido(unidadeMeta)
        });

  const totalDimsEsperadoSec3 =
    exigeUnidade && unidadeComFocoDefinido(unidadeMeta)
      ? dimsParaSecao3.length
      : TOTAL_DIMENSOES_SATF;
  const validacao =
    exigeUnidade && unidadeComFocoDefinido(unidadeMeta) && indicesSecao3Ativos
      ? (() => {
          const encontrados = contarDimensoesSecao3Book(markdown);
          const esperados = Array.from({ length: dimsParaSecao3.length }, (_, i) => i + 1);
          const faltando = esperados.filter((i) => !encontrados.has(i));
          return { ok: faltando.length === 0, faltando, total: encontrados.size };
        })()
      : relatorioBookSecao3Completo(markdown, totalDimsEsperadoSec3);
  if (!validacao.ok) {
    console.warn(`[Book SATF] Seção 3 incompleta: ${validacao.total}/${TOTAL_DIMENSOES_SATF}`);
  }

  const validacaoTaxonomia = validarTaxonomiaBookSatf(markdown);
  if (!validacaoTaxonomia.ok) {
    console.warn(
      `[Book SATF] Contaminação taxonômica detectada: ${validacaoTaxonomia.total} ocorrência(s)`,
      validacaoTaxonomia.ocorrencias.map((o) => `${o.nome} (${o.count})`).join('; ')
    );
  }

  const validacaoSecoes = validarSecoesDuplicadasBookSatf(markdown);
  if (!validacaoSecoes.ok) {
    console.warn(
      `[Book SATF] Seções duplicadas: ${validacaoSecoes.duplicadas.map((d) => `${d.secao}×${d.count}`).join(', ')}`
    );
  }

  const markdownFinal =
    inventarioDocumentos.entregaveis.length > 0
      ? normalizarRotulosEntregaveisEscopo(markdown, inventarioDocumentos)
      : markdown;

  const relatorioComCapas = montarPreliminaresBookSatfOrdemCanonica({
    corpoMarkdown: markdownFinal,
    empresaNome: projeto.empresa.nome,
    projetoNome: projeto.nome,
    avaliacoesFiltradas,
    filtroNivelMax,
    unidadeMeta: exigeUnidade ? unidadeMetaParaCapa : null,
    secaoDashboard: exigeUnidade ? secaoDashboardUnidade : null,
    exigeUnidade
  });
  const relatorioFinal = !modoRapido
    ? posicionarApendicesMetodologicosComoUltimaSecao(relatorioComCapas, {
        framework: 'satf',
        glossarioProjeto: regrasFatos.glossario
      })
    : relatorioComCapas;

  const validacaoFatos = validarFatosCanonicosBook(relatorioFinal, {
    termosProibidos: regrasFatos.termosProibidos,
    glossario: regrasFatos.glossario
  });
  if (!validacaoFatos.ok) {
    console.warn(
      `[Book SATF] Termos proibidos detectados: ${validacaoFatos.total} ocorrência(s)`,
      validacaoFatos.ocorrencias.map((o) => `${o.termo} (${o.count})`).join('; ')
    );
  }

  const tempoTotal = Date.now() - startTime;
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
    scoresPorArea: dimensoesDiagnostico.map((a) => ({
      area: a.area,
      score: a.score,
      scoreDeclarado: a.scoreDeclarado,
      nivel: a.nivel,
      semDadosConsolidados: dimensaoComScoreZero(a)
    })),
    totalDimensoesFramework: TOTAL_DIMENSOES_SATF,
    totalAvaliadores: avaliacoesFiltradas.length,
    filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
    ...(exigeUnidade
      ? {
          ...metadadosUnidadeDadosUsados(unidadeMeta, filtroUnidadeId),
          planoAcaoUnidade: planoAcaoUnidade
        }
      : {}),
    projetoVersao,
    comparativoVersoes,
    modoGeracao: exigeUnidade
      ? modoRapido
        ? 'book_unidade_satf_rapido'
        : 'book_unidade_satf'
      : modoRapido
        ? 'rapido'
        : 'completo_satf',
    temDesejosIa,
    totalAvaliadoresComDesejosIa: temDesejosIa
      ? avaliacoesFiltradas.filter((av) =>
          desejosIaTemRespostasGuardadas(av.desejosIADados?.payload ?? av.desejosIA)
        ).length
      : 0,
    avisosProvedor: avisosProvedor.length ? avisosProvedor : undefined,
    avisosQualidade: avisosQualidade.length ? avisosQualidade : undefined,
    chunksStopMeta: chunksStopMeta.length ? chunksStopMeta : undefined,
    temGlossarioFatos: regrasFatos.temGlossario,
    contextoFatosHash: regrasFatos.hash,
    validacaoFatos
  };

  const tituloUnidade = unidadeMeta ? ` — ${unidadeMeta.nome}` : '';
  let salvo = null;
  try {
    salvo = await salvarRelatorioIA({
      projetoId,
      tipo: tipoRelatorio,
      titulo: exigeUnidade
        ? modoRapido
          ? `Book SATF por unidade (rápido)${tituloUnidade} — ${projeto.empresa.nome}`
          : `Book SATF por unidade${tituloUnidade} — ${projeto.empresa.nome}`
        : modoRapido
          ? `Book SATF TI (rápido) — ${projeto.empresa.nome}`
          : `Book SATF TI v3 — ${projeto.empresa.nome}`,
      conteudoMd: relatorioFinal,
      provider: providerUsado,
      modelo: modelUsado,
      tokensEntrada: totalTokensEntrada,
      tokensSaida: totalTokensSaida,
      tempoGeracaoMs: tempoTotal,
      chunksGerados: chunks.length,
      totalChunks: chunks.length,
      dadosUsados,
      geradoPorId: req.usuario?.id || null
    });
  } catch (e) {
    console.error('[Book SATF] Erro ao salvar:', e.message);
  }

  return res.json({
    relatorio: relatorioFinal,
    provider: providerUsado,
    model: modelUsado,
    avisosProvedor: avisosProvedor.length ? avisosProvedor : undefined,
    avisosQualidade: avisosQualidade.length ? avisosQualidade : undefined,
    tokens: { entrada: totalTokensEntrada, saida: totalTokensSaida },
    tempoResposta: tempoTotal,
    chunksGerados: chunks.length,
    totalChunks: chunks.length,
    dadosUsados: await (async () => {
      const enriched = { ...dadosUsados, ...logoMeta };
      return enriched;
    })(),
    relatorioSalvoId: salvo?.id,
    versao: salvo?.versao,
    dataGeracao: salvo?.createdAt || new Date(),
    fromCache: false,
    frameworkMaturidade: FRAMEWORK_SATF_TI_V3,
    tipoRelatorio,
    modoGeracao: modoRapido ? 'rapido' : 'completo_satf',
    filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
    projetoVersao,
    validacaoTaxonomia,
    avisoTaxonomia: validacaoTaxonomia.ok
      ? null
      : `Book gerado com ${validacaoTaxonomia.total} possível(is) referência(s) a outra taxonomia — regenere uma nova versão antes de entregar.`,
    validacaoSecoes,
    avisoSecoesDuplicadas: validacaoSecoes.ok
      ? null
      : `Seções ${validacaoSecoes.duplicadas.map((d) => d.secao).join(', ')} aparecem duplicadas no documento — regenere uma nova versão.`,
    validacaoFatos,
    avisoFatosCanonicos: validacaoFatos.aviso
  });
}

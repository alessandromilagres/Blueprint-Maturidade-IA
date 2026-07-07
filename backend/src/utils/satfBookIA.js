/**
 * Book IA — template SATF TI v3 (~18 chunks).
 * Score oficial = certificado ou teto por evidência; declarado visível para auditoria.
 */
import { prisma } from '../lib/prisma.js';
import { salvarRelatorioIA } from '../routes/relatorios-ia.js';
import { callAIWithContinuation, getProvider, loadPersistedAIConfig } from '../services/ai-provider.js';
import { SYSTEM_PROMPT_PERSONA_BOOK_SATF } from '../constants/consultorRelatorioIA.js';
import { FRAMEWORK_SATF_TI_V3 } from '../constants/frameworkMaturidadePolicy.js';
import { carregarFrameworkProjeto } from './projetoFramework.js';
import { listarAreasDoProjeto } from './areaFrameworkCatalog.js';
import { mapaApresentacaoDimensoes } from './projetoDimensoesConfig.js';
import { calcularScoresConsolidadoMaturidade, nivelNumericoDeScore } from './scoresConsolidadoProjetoMaturidade.js';
import { enriquecerScoresDashboardSatf } from './projetoDimensaoCertificacao.js';
import { ordenarAreasPorFramework, blocoOrdemDimensoesFrameworkMarkdown, TOTAL_DIMENSOES_SATF } from './ordemDimensoesFramework.js';
import { montarComparativoVersoesProjeto, blocoEvolucaoVersoesMarkdown } from './evolucaoVersoesProjeto.js';
import {
  blocoContextoProjetoMarkdown,
  projetoTemContextoCadastrado,
  carregarInventarioDocumentosContexto,
  blocoInventarioDocumentosMarkdown,
  blocoInstrucoesEntregaveisDimensaoSatf,
  blocoInstrucoesPromptSecao3Dimensao,
  blocoInstrucoesSistemaSecao3ComContexto,
  inventarioDocumentosContextoFromMarkdown,
  complementarSecao3EntregaveisEscopo,
  normalizarRotulosEntregaveisEscopo,
  blocoRegrasNomenclaturaEntregaveisMarkdown
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
import { adicionarIndiceAoBookMarkdown } from './bookMarkdownIndice.js';
import {
  tabelaPerguntasDimensaoMarkdown,
  dimensaoComScoreZero,
  blocoDimensaoScoreZeroSecao3,
  blocoFallbackErroSecao3Dimensao,
  instrucaoPromptSecao3SemCabecalhos,
  relatorioBookSecao3Completo,
  blocoDadosExtrasBookRapido,
  limparConteudoIaSecao3Dimensao
} from './bookModoRapidoMarkdown.js';
import { blocoGuiaProgressaoDimensaoSatf } from './guiasProgressaoFramework.js';
import {
  blocoDesejosIaMarkdown,
  projetoTemDesejosIaCadastrados,
  blocoInstrucoesDesejosIaSecao3Dimensao
} from './blocoDesejosIaBook.js';
import { desejosIaTemRespostasGuardadas } from './desejosIaAvaliacaoMaturidade.js';

function introducaoSecao3SatfBookMarkdown(totalDimensoes, ordemNomes) {
  const listaOrdem = ordemNomes.map((nome, idx) => `${idx + 1}. ${nome}`).join('\n');
  return `# 3. DIAGNÓSTICO POR DIMENSÃO (SATF TI v3)

Este capítulo apresenta as **${totalDimensoes} dimensões** do instrumento SATF TI v3 na ordem abaixo. Dimensões com **score 0** constam apenas para registro.

${listaOrdem}

**Numeração:** **3.N** = dimensão (##); **3.N.1**, **3.N.2**… = subseções (###).

**Scores:** use o **score oficial** (certificado ou com teto por evidência). Quando o bloco DADOS indicar gap entre declarado e oficial, mencione na análise.

**Personalização:** quando houver bloco **Contexto do cliente** nos DADOS, cada dimensão deve citar entregáveis, sistemas, pilotos e métricas reais do projeto — como no book Blueprint MIT.`;
}

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
  dados,
  tabelaDim
}) {
  const detalheDim = detalhePerguntasDimensaoMarkdown(dim);
  const instrucoesContexto = blocoInstrucoesPromptSecao3Dimensao(dim.area, blocoContextoClienteBook);
  const instrucoesDesejos = blocoInstrucoesDesejosIaSecao3Dimensao(dim.area, temDesejosIa);
  const instrucoesEntregaveis = blocoInstrucoesEntregaveisDimensaoSatf(dim.area, inventarioDocumentos);
  const regrasNomenclatura = blocoRegrasNomenclaturaEntregaveisMarkdown(inventarioDocumentos);
  const guia = blocoGuiaProgressaoDimensaoSatf(dim.area, dim.nivel || dim.score);

  const regrasEntregaveis =
    inventarioDocumentos?.entregaveis?.length > 0
      ? `- **Entregáveis do escopo (A–H):** cadastrados: ${inventarioDocumentos.entregaveis.join(', ')}. Cite os pertinentes a **${dim.area}** com **rótulos canônicos** (E = Roteiro de Pilotos; H = Diagnóstico de Clientes — não renomeie).`
      : '';

  const regrasAntiGenericidade = `
OBRIGATÓRIO — EVITE REPETIÇÃO E GENERICIDADE (como no book Blueprint MIT):
- A **Análise Diagnóstica** deve abordar **${dim.area}** de forma explícita: referencie [Qn] e o padrão de respostas (não use parágrafo genérico de "maturidade de IA em TI").
- **Evidências Críticas:** separe fatores que elevaram vs puxaram o score; cite [Qn] e documentos do contexto (Entregáveis A–H) quando existirem.
- **Risco:** específico desta dimensão — **proibido** repetir a mesma frase entre dimensões.
- **Recomendações:** cada ação com título, descrição, entregável/sistema do projeto (A–H), owner sugerido e prazo (30/45/60/90 dias).${temDesejosIa ? ' **≥1 ação** deve citar Desejos IA dos DADOS quando pertinente.' : ''}
${regrasEntregaveis}
${temContexto ? '- **Contexto cadastrado:** cite ≥2 elementos concretos do bloco "Contexto do cliente" em Análise, Risco e Recomendações. **Proibido** "empresa de tecnologia de médio porte" como narrativa principal.' : `- Contextualize ao setor **${setor}** e porte **${porte}** com exemplos de engenharia/plataforma reais.`}
- Numere **exatamente** as subseções pedidas com ### (três #). **Não** gere "## ${numSecao}" nem "# 3.".
`;

  const contextoDim = `
CONTEXTO:
- Empresa: ${projeto.empresa.nome} (${setor}, porte ${porte})
- Score geral oficial: ${scoreGeral.toFixed(2)} (Nível ${nivel})
- Média de referência TI/setor: ${mediaSetor.toFixed(1)}
- Score desta dimensão (**${dim.area}**): ${rotuloScoreDimensaoSatf(dim)} (Nível ${dim.nivel || nivelNumericoDeScore(dim.score)})

DETALHE DESTA DIMENSÃO (perguntas consolidadas):
${detalheDim || '- Nenhuma resposta consolidada nesta rodada.'}
`;

  if (modoRapido) {
    return `${instrucaoPromptSecao3SemCabecalhos(numSecao, isFirst)}Gere SOMENTE as subseções ### ${numSecao}.1 a ### ${numSecao}.7 em Markdown.

### ${numSecao}.1 Diagnóstico (1 parágrafo denso: cite [Qn], score oficial, gap declarado→oficial se houver, e ≥1 fato do contexto do projeto)
### ${numSecao}.2 Tabela de scores por pergunta
Reproduza **integralmente** a tabela abaixo (incluindo a **última linha** "Score geral da dimensão").
### ${numSecao}.3 Evidências Críticas (até 4 bullets com [Qn]; inclua qualidade de evidências e status de certificação consultor)
### ${numSecao}.4 Risco (1 parágrafo — mecanismo de risco desta dimensão para a operação documentada, não genérico)
### ${numSecao}.5 Benchmark (1 parágrafo: compare score ${dim.area} vs média TI ${mediaSetor.toFixed(1)} e estado descrito no contexto)
### ${numSecao}.6 Recomendações Específicas (3 ações numeradas R1–R3${temDesejosIa ? '; ≥1 ancorada em Desejos IA' : ''}: entregável A–H do contexto, sistema, owner, prazo)
### ${numSecao}.7 KPIs de Acompanhamento (tabela: KPI | Baseline | Meta 12m — mínimo 3 linhas)

${regrasAntiGenericidade}
${contextoDim}

${guia}

${instrucoesEntregaveis}

${regrasNomenclatura}

${instrucoesContexto}

${instrucoesDesejos}

${blocoContextoClienteBook ? `${blocoContextoClienteBook}\n\n` : ''}DADOS GERAIS:
${dados}

TABELA OBRIGATÓRIA (copie integralmente em ${numSecao}.2):
${tabelaDim}`;
  }

  return `${instrucaoPromptSecao3SemCabecalhos(numSecao, isFirst)}Gere SOMENTE as subseções ### ${numSecao}.1 a ### ${numSecao}.6 em Markdown.

### ${numSecao}.1 Análise Diagnóstica (2–3 parágrafos profundos: cite [Qn] com scores; explique o que o score oficial revela; gap declarado→oficial; ligue a entregáveis e pilotos do contexto)
### ${numSecao}.2 Evidências Críticas
- **Fatores que elevaram o score** (bullets com [Qn] e justificativa)
- **Fatores que puxaram o score para baixo** (bullets com [Qn])
- **Evidências documentadas** e status de certificação consultor (qualidade, lacunas)
### ${numSecao}.3 Risco de Negócio e Técnico (1 parágrafo — consequências se mantiver este nível; específico de ${dim.area} e da operação do cliente)
### ${numSecao}.4 Benchmark Setorial (1 parágrafo — posição vs média TI ${mediaSetor.toFixed(1)} e expectativa de clientes/mercado para esta capacidade)
### ${numSecao}.5 Recomendações Específicas (3–4 ações numeradas${temDesejosIa ? '; ≥1 ancorada em Desejos IA dos DADOS' : ''}: título + parágrafo com entregável, sistema, squad, prazo; ancoradas no escopo e documentação do projeto)
### ${numSecao}.6 KPIs de Acompanhamento (tabela: KPI | Baseline | Meta 6m | Meta 12m — mínimo 4 linhas; inclua score SATF da dimensão como KPI de evolução)

${regrasAntiGenericidade}
${contextoDim}

${guia}

${instrucoesEntregaveis}

${regrasNomenclatura}

${instrucoesContexto}

${instrucoesDesejos}

${blocoContextoClienteBook ? `${blocoContextoClienteBook}\n\n` : ''}DADOS GERAIS:
${dados}`;
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
  inventarioDocumentos
}) {
  let md = '';
  if (isFirst) {
    md += `${introducaoSecao3SatfBookMarkdown(totalDimensoes, ordemNomes)}\n\n`;
  }
  md += `${rotuloDimensaoSatfBookMarkdown(dim, numSecao)}\n\n`;
  let corpo = limparConteudoIaSecao3Dimensao(conteudoIa, numSecao, { bookCompleto: !modoRapido });
  if (corpo && inventarioDocumentos?.entregaveis?.length) {
    corpo = complementarSecao3EntregaveisEscopo(corpo, dim.area, inventarioDocumentos, numSecao, {
      modoRapido
    });
    corpo = normalizarRotulosEntregaveisEscopo(corpo, inventarioDocumentos);
  }
  if (corpo) md += corpo;
  return md;
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
  bottom5
}) {
  const nivel = nivelNumericoDeScore(scoreGeral);
  const nomesNivel = NOMES_NIVEL_BLUEPRINT;
  const detalhePerguntasTxt = dimensoesDiagnostico
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

${blocoAvaliadoresConsolidadoMarkdown(avaliacoesFiltradas, filtroNivelMax)}

${blocoContexto ? `${blocoContexto}\n\n` : ''}

${blocoInventario ? `${blocoInventario}\n\n` : ''}

${blocoDesejosIa ? `${blocoDesejosIa}\n\n` : ''}

${blocoCert}

${blocoEvolucao}

## Metodologia de score SATF
${metodologiaScore?.descricaoScore || 'Média ponderada das dimensões núcleo; D10 fora da média geral; evidência obrigatória para notas ≥ 4.'}

## Resultado geral
- **Score oficial:** ${scoreGeral.toFixed(2)} (Nível ${nivel} — ${nomesNivel[nivel - 1]})
${scoreGeralDeclarado != null && scoreGeralDeclarado !== scoreGeral ? `- **Score declarado (autoavaliação):** ${scoreGeralDeclarado.toFixed(2)}` : ''}

${blocoOrdemDimensoesFrameworkMarkdown(FRAMEWORK_SATF_TI_V3)}

## Scores por dimensão (${dimensoesDiagnostico.length})
${dimensoesDiagnostico
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
${detalhePerguntasTxt}`;
}

function montarChunksSatf({
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
  modoRapido
}) {
  const chunks = [];
  const dados = modoRapido ? dadosBlockRapido : dadosBlock;

  chunks.push({
    id: 'sec_1_2',
    label: 'Metodologia SATF + Sumário',
    prompt: `Gere SOMENTE as Seções 1 e 2 do book SATF TI v3, em Markdown condensado:

# 1. METODOLOGIA SATF TI v3
- Instrumento SysMap para maturidade de IA em **TI e engenharia** (11 dimensões, escala N1–N5)
- Três camadas: coleta Likert → evidência obrigatória (nota ≥4) → certificação consultor
- Como interpretar score **oficial** vs declarado

# 2. SUMÁRIO EXECUTIVO
- 1 parágrafo diagnóstico TI (situação atual) — cite Entregáveis A–H do inventário com **rótulos canônicos** (E = Roteiro de Pilotos; H = Diagnóstico de Clientes)
- Tabela: Score oficial | Nível | Gap vs declarado (se houver) | Certificação pendente?
- 5 insights em bullet (foco engenharia/plataforma/SDLC; inclua pilotos e entregáveis E–H se cadastrados)
- Subseção **Evolução entre rodadas** se dados disponíveis

NÃO cite MIT CISR como framework principal. Público: CTO / engenharia.

DADOS:
${dados}

Comece com "# 1. METODOLOGIA SATF TI v3".`,
    maxTokens: modoRapido ? 3200 : 5000
  });

  dimensoesDiagnostico.forEach((dim, idx) => {
    const isFirst = idx === 0;
    const numSecao = `3.${idx + 1}`;
    if (dimensaoComScoreZero(dim)) {
      chunks.push({
        id: `sec_3_${idx + 1}`,
        label: `Registro — ${dim.area}`,
        staticContent: (() => {
          let md = '';
          if (isFirst) md += `${introducaoSecao3SatfBookMarkdown(dimensoesDiagnostico.length, ordemNomes)}\n\n`;
          md += `${rotuloDimensaoSatfBookMarkdown(dim, numSecao)}\n\n`;
          md += blocoDimensaoScoreZeroSecao3(numSecao, dim, {
            isFirst: false,
            totalDimensoes: dimensoesDiagnostico.length,
            modoRapido: true
          }).replace(introducaoSecao3SatfBookMarkdown(dimensoesDiagnostico.length, ordemNomes), '');
          return md;
        })()
      });
      return;
    }

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
        dados,
        tabelaDim: tabelaPerguntasDimensaoMarkdown(dim)
      }),
      maxTokens: modoRapido ? 3600 : 6000
    });
  });

  chunks.push({
    id: 'sec_4',
    label: 'Roadmap engenharia 30-60-90',
    prompt: `# 4. ROADMAP ENGENHARIA & PLATAFORMA (30-60-90 dias)

Gere em Markdown: visão por horizonte (30/60/90), foco SDLC agêntico, plataforma, dados e governança técnica. Tabela resumo. Sem MIT CISR.

DADOS:\n${dados}`,
    maxTokens: 4000
  });

  chunks.push({
    id: 'sec_5',
    label: 'Fábrica Agêntica (D10)',
    prompt: `# 5. FÁBRICA AGÊNTICA E SDLC (dimensão D10)

Se D10 estiver nos dados com score > 0, analise maturidade de fábrica agêntica. Senão, nota curta "fora de escopo ou sem dados".
Ao citar entregáveis do escopo use **rótulos canônicos**: E = Roteiro de Pilotos (não "Mapa de Jornadas"); H = Diagnóstico de Clientes (não "Business Case"); G = Capacitação e Gestão de Mudança.

DADOS:\n${dados}`,
    maxTokens: 3500
  });

  chunks.push({
    id: 'sec_6',
    label: 'Conformidade TI (D11)',
    prompt: `# 6. CONFORMIDADE E REGULATÓRIO EM TI (D11)

Governança de IA em TI, LGPD técnico, auditoria de modelos. Se setor regulado ou D11 ativa, aprofunde.

DADOS:\n${dados}`,
    maxTokens: 3500
  });

  chunks.push({
    id: 'sec_7',
    label: 'Capacitação e governança',
    prompt: `# 7. CAPACITAÇÃO, PAPÉIS E GOVERNANÇA DE TIMES

Skills, chapter leads, guildas de IA, operating model de engenharia.

DADOS:\n${dados}`,
    maxTokens: 3500
  });

  chunks.push({
    id: 'sec_8',
    label: 'Próximos passos 30 dias',
    prompt: `# 8. PRÓXIMOS PASSOS IMEDIATOS (30 DIAS)

7–10 ações numeradas com responsável, entregável e prazo. Foco TI.

DADOS:\n${dados}`,
    maxTokens: 4000
  });

  return chunks;
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
  atualizarProgressoJobBook
}) {
  const partesPreSec3 = [];
  const blocosSec3PorIndice = Array(dimensoesDiagnostico.length).fill(null);
  const partesPosSec3 = [];
  let chegouSec3 = false;
  let totalTokensEntrada = 0;
  let totalTokensSaida = 0;
  let providerUsado = null;
  let modelUsado = null;

  const systemPrompt = `${SYSTEM_PROMPT_PERSONA_BOOK_SATF}
${modoRapido ? '\nMODO RÁPIDO: textos mais curtos, mas mantenha especificidade por dimensão, [Qn], contexto do projeto e recomendações acionáveis (não resuma em bullets genéricos).' : ''}
${temContexto ? blocoInstrucoesSistemaSecao3ComContexto() : ''}
Gere SOMENTE as seções pedidas. Markdown com # ## ###.`;

  const registrar = (chunk, conteudo) => {
    const texto = String(conteudo || '').trim();
    if (!texto) return;
    const m = String(chunk.id || '').match(/^sec_3_(\d+)$/);
    if (m) {
      chegouSec3 = true;
      blocosSec3PorIndice[parseInt(m[1], 10) - 1] = texto;
      return;
    }
    if (!chegouSec3) partesPreSec3.push(texto);
    else partesPosSec3.push(texto);
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
    if (chunk.staticContent) {
      registrar(chunk, chunk.staticContent);
      continue;
    }

    try {
      const resultado = await callAIWithContinuation(chunk.prompt, systemPrompt, {
        temperature: chunk.id.startsWith('sec_3_') ? 0.45 : 0.5,
        maxTokens: chunk.maxTokens || 4000
      });
      const m = String(chunk.id || '').match(/^sec_3_(\d+)$/);
      if (m) {
        const dimIdx = parseInt(m[1], 10) - 1;
        const dim = dimensoesDiagnostico[dimIdx];
        const numSecao = `3.${dimIdx + 1}`;
        registrar(
          chunk,
          montarBlocoSecao3DimensaoSatf({
            numSecao,
            dim,
            conteudoIa: resultado.content,
            isFirst: dimIdx === 0,
            totalDimensoes: dimensoesDiagnostico.length,
            ordemNomes,
            modoRapido,
            inventarioDocumentos
          })
        );
      } else {
        registrar(chunk, resultado.content);
      }
      totalTokensEntrada += resultado.tokensEntrada || 0;
      totalTokensSaida += resultado.tokensSaida || 0;
      if (!providerUsado) providerUsado = resultado.provider;
      if (!modelUsado) modelUsado = resultado.model;

      await atualizarProgressoJobBook?.(relatorioJobId, {
        progresso: 6 + Math.round(((i + 1) / chunks.length) * 88),
        etapa: `SATF ${i + 1}/${chunks.length}: ${chunk.label}`
      });
    } catch (err) {
      const m = String(chunk.id || '').match(/^sec_3_(\d+)$/);
      if (m) {
        const dimIdx = parseInt(m[1], 10) - 1;
        const dim = dimensoesDiagnostico[dimIdx];
        const numSecao = `3.${dimIdx + 1}`;
        registrar(
          chunk,
          dimensaoComScoreZero(dim)
            ? blocoDimensaoScoreZeroSecao3(numSecao, dim, {
                isFirst: dimIdx === 0,
                totalDimensoes: dimensoesDiagnostico.length,
                modoRapido: true
              })
            : blocoFallbackErroSecao3Dimensao(numSecao, dim, err.message, {
                isFirst: dimIdx === 0,
                totalDimensoes: dimensoesDiagnostico.length,
                modoRapido: true
              })
        );
      } else {
        registrar(chunk, `> ⚠️ Seção ${chunk.label} não gerada: ${err.message}`);
      }
    }
  }

  const blocosSec3 = blocosSec3PorIndice.map((bloco, idx) => {
    if (bloco) return bloco;
    const dim = dimensoesDiagnostico[idx];
    const numSecao = `3.${idx + 1}`;
    if (dimensaoComScoreZero(dim)) {
      let md = '';
      if (idx === 0) md += `${introducaoSecao3SatfBookMarkdown(dimensoesDiagnostico.length, ordemNomes)}\n\n`;
      md += `${rotuloDimensaoSatfBookMarkdown(dim, numSecao)}\n\n`;
      md += `### ${numSecao}.1 Status\n\nScore 0 — sem dados consolidados.\n`;
      return md;
    }
    return montarBlocoSecao3DimensaoSatf({
      numSecao,
      dim,
      conteudoIa: `### ${numSecao}.1 Status\n\n> Bloco não gerado — regenere o book.\n\n### ${numSecao}.2 Registro de scores por pergunta\n\n${tabelaPerguntasDimensaoMarkdown(dim)}`,
      isFirst: idx === 0,
      totalDimensoes: dimensoesDiagnostico.length,
      ordemNomes,
      modoRapido,
      inventarioDocumentos
    });
  });
  return {
    markdown: [...partesPreSec3, ...blocosSec3, ...partesPosSec3].join('\n\n'),
    totalTokensEntrada,
    totalTokensSaida,
    providerUsado,
    modelUsado
  };
}

/**
 * Handler completo do POST relatorio-ia-completo para projetos SATF.
 */
export async function executarGeracaoBookSatf(req, res, deps) {
  const {
    atualizarProgressoJobBook,
    obterVersaoSelecionadaProjeto,
    idsAvaliacoesDaVersao
  } = deps;

  const projetoId = parseInt(req.params.id, 10);
  const reuse = req.query.reuse !== 'false';
  const modoRapido = req.query.mode === 'rapido' || req.query.modo === 'rapido';
  const tipoRelatorio = modoRapido ? 'completo_satf_rapido' : 'completo_satf';
  const filtroNivelMax = parseFiltroNivelPrioridadeMapeamentoMaturidadeMax(req);
  const projetoVersao = await obterVersaoSelecionadaProjeto(req, projetoId);

  let bookClienteDesconectou = false;
  let relatorioJobId = null;
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
      if (
        filtroNivelRelatorioIACompativel(dadosSnap, filtroNivelMax) &&
        Number(dadosSnap?.projetoVersao?.id || 0) === Number(projetoVersao?.id || 0) &&
        dadosSnap?.frameworkMaturidade === FRAMEWORK_SATF_TI_V3 &&
        sec3.ok
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

  const idsAval = await idsAvaliacoesDaVersao(projetoId, projetoVersao.id);
  const avaliacoesFiltradas = projeto.avaliacoes.filter(
    (av) =>
      idsAval.has(Number(av.id)) &&
      usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(av.usuario, filtroNivelMax)
  );
  if (!avaliacoesFiltradas.length) {
    return res.status(400).json({
      error: 'Não há avaliações finalizadas para gerar o book SATF',
      projetoVersao
    });
  }

  const jobIdParam = req.query.jobId;
  if (jobIdParam) {
    const jid = parseInt(String(jobIdParam), 10);
    if (!Number.isNaN(jid) && jid > 0) {
      const jobRow = await prisma.relatorioIAJob.findFirst({
        where: { id: jid, projetoId, tipo: tipoRelatorio }
      });
      if (jobRow) relatorioJobId = jid;
    }
  }

  const areas = ordenarAreasPorFramework(await listarAreasDoProjeto(prisma, projeto.id));
  const { porAreaId: dimensoesConfig, setorRegulado } = await mapaApresentacaoDimensoes(prisma, projetoId);
  const { frameworkMaturidade } = await carregarFrameworkProjeto(prisma, projetoId);
  const metodologiaScore = metodologiaScoreFramework(frameworkMaturidade, { setorRegulado });

  const consolidado = calcularScoresConsolidadoMaturidade(avaliacoesFiltradas, areas, {
    dimensoesConfig
  });
  let dimensoesDiagnostico = consolidado.todasDimensoes;
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
    dimensoesDiagnostico = dimensoesDiagnostico.map((d) =>
      d.areaId != null ? { ...d, ...porId.get(d.areaId) } : d
    );
  }

  const nivel = nivelNumericoDeScore(scoreGeral);
  const ordenados = [...consolidado.scoresPorArea].sort((a, b) => b.score - a.score);
  const top5 = ordenados.slice(0, 5);
  const bottom5 = ordenados.slice(-5).reverse();
  const setor = projeto.vertical || projeto.empresa.setor || 'Tecnologia';
  const porte = projeto.empresa.porte || 'Não informado';
  const blocoContexto = await blocoContextoProjetoMarkdown(prisma, projetoId);
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
  const comparativoVersoes = await montarComparativoVersoesProjeto(prisma, {
    projetoId,
    versaoAtualId: projetoVersao.id,
    avaliacoesFinalizadas: projeto.avaliacoes,
    areas,
    filtroNivelMax,
    usuarioIncluidoNoFiltro: usuarioIncluidoNoFiltroNivelMapeamentoMaturidade
  });
  const blocoEvolucao = blocoEvolucaoVersoesMarkdown(comparativoVersoes);
  const ordemNomes = dimensoesDiagnostico.map((d) => d.area);

  const dadosBlock = montarDadosBlockSatf({
    projeto,
    projetoVersao,
    avaliacoesFiltradas,
    filtroNivelMax,
    dimensoesDiagnostico,
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
    bottom5
  });

  const dadosBlockRapido = `${dadosBlock}\n\n${blocoDadosExtrasBookRapido({
    scoresPorArea: dimensoesDiagnostico,
    scoreGeral,
    nivel,
    nomesNivel: NOMES_NIVEL_BLUEPRINT,
    faturamentoAnualProjeto: projeto.faturamentoAnualProjeto
  })}`;

  const chunks = montarChunksSatf({
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
    blocoContextoClienteBook: blocoContexto,
    inventarioDocumentos,
    mediaSetor,
    ordemNomes,
    modoRapido
  });

  await loadPersistedAIConfig();
  console.log(
    `[Book SATF] Projeto ${projetoId} — ${chunks.length} chunks · ${getProvider().name}`
  );

  const startTime = Date.now();
  const { markdown, totalTokensEntrada, totalTokensSaida, providerUsado, modelUsado } =
    await executarChunksLoop({
      chunks,
      dimensoesDiagnostico,
      ordemNomes,
      modoRapido,
      temContexto,
      inventarioDocumentos,
      relatorioJobId,
      bookClienteDesconectou: () => bookClienteDesconectou,
      atualizarProgressoJobBook
    });

  const validacao = relatorioBookSecao3Completo(markdown, TOTAL_DIMENSOES_SATF);
  if (!validacao.ok) {
    console.warn(`[Book SATF] Seção 3 incompleta: ${validacao.total}/${TOTAL_DIMENSOES_SATF}`);
  }

  const markdownFinal =
    inventarioDocumentos.entregaveis.length > 0
      ? normalizarRotulosEntregaveisEscopo(markdown, inventarioDocumentos)
      : markdown;

  const comIndice = adicionarIndiceAoBookMarkdown(markdownFinal);
  const relatorioFinal = prependCapaNivelAvaliadoresAoRelatorio(comIndice, {
    filtroMax: filtroNivelMax,
    avaliacoesFiltradas,
    empresaNome: projeto.empresa.nome,
    projetoNome: projeto.nome
  });

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
    projetoVersao,
    comparativoVersoes,
    modoGeracao: modoRapido ? 'rapido' : 'completo_satf',
    temDesejosIa,
    totalAvaliadoresComDesejosIa: temDesejosIa
      ? avaliacoesFiltradas.filter((av) =>
          desejosIaTemRespostasGuardadas(av.desejosIADados?.payload ?? av.desejosIA)
        ).length
      : 0
  };

  let salvo = null;
  try {
    salvo = await salvarRelatorioIA({
      projetoId,
      tipo: tipoRelatorio,
      titulo: modoRapido
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
    projetoVersao
  });
}

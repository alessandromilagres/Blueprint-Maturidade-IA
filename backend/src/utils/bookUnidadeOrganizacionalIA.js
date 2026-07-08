/**
 * Book de Trabalho por unidade organizacional — SysMap Blueprint IA (16 dimensões).
 * Foco: dashboard da unidade, nota consolidada e ações específicas por dimensão.
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
  projetoTemContextoCadastrado
} from './projetoContexto.js';
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
  montarSecaoDashboardUnidadeMarkdown,
  planoAcaoPorNomeDimensao,
  prependSecaoDashboardUnidadeAoRelatorio
} from './bookUnidadeContexto.js';

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
  const planoAcao = gerarPlanoAcaoPorDimensao(scoresPorArea);
  const setor = projeto.vertical || projeto.empresa.setor || 'Geral';
  const porte = projeto.empresa.porte || 'Não informado';
  const blocoContexto = await blocoContextoProjetoMarkdown(prisma, projetoId);
  const temContexto = projetoTemContextoCadastrado(blocoContexto);
  const blocoDesejosIa = blocoDesejosIaMarkdown(avaliacoesFiltradas);
  const temDesejosIa = projetoTemDesejosIaCadastrados(avaliacoesFiltradas);

  const secaoDashboard = montarSecaoDashboardUnidadeMarkdown({
    unidadeMeta,
    frameworkMaturidade: FRAMEWORK_BLUEPRINT_16,
    scoreGeral,
    scoresPorArea: dimensoesDiagnostico,
    avaliacoesFiltradas,
    planoAcao,
    filtroNivelMax
  });

  const instrucoesUnidade = instrucoesSistemaBookUnidade({
    unidadeMeta,
    frameworkMaturidade: FRAMEWORK_BLUEPRINT_16
  });

  const dadosResumo = `# DADOS — UNIDADE ${unidadeMeta.nome}

- Empresa: ${projeto.empresa.nome} | Projeto: ${projeto.nome}
- Setor: ${setor} | Porte: ${porte}
- Score unidade: **${scoreGeral.toFixed(2)}** (N${nivel} — ${nomesNivel[nivel - 1]})
- Avaliadores: ${avaliacoesFiltradas.length}

${blocoAvaliadoresConsolidadoMarkdown(avaliacoesFiltradas, filtroNivelMax)}

## Scores por dimensão
${dimensoesDiagnostico
  .map((d) => `- ${d.area}: ${dimensaoComScoreZero(d) ? '0' : Number(d.score).toFixed(2)}`)
  .join('\n')}

${blocoContexto ? `${blocoContexto}\n` : ''}${blocoDesejosIa ? `${blocoDesejosIa}\n` : ''}`;

  let markdown;
  await loadPersistedAIConfig();
  const systemBase = modoRapido ? SYSTEM_PROMPT_PERSONA_BOOK_RAPIDO : SYSTEM_PROMPT_PERSONA_BOOK;
  const systemPrompt = `${systemBase}
${instrucoesUnidade}
Gere SOMENTE o conteúdo solicitado em Markdown. A Seção 0 (Dashboard) já existe no documento — não a duplique.`;

  const startTime = Date.now();
  let totalTokensEntrada = 0;
  let totalTokensSaida = 0;
  let providerUsado = getProvider().name;
  let modelUsado = getProvider().defaultModel;
  const partesSumario = [];
  const partesDimensoes = [];
  const dimsComDados = dimensoesDiagnostico.filter((d) => !dimensaoComScoreZero(d));
  const totalChunks = dimsComDados.length + 2;

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

  // Chunk 1 — Sumário da unidade
  try {
  await reportarProgresso(0, 'Sumário executivo da unidade');
  partesSumario.push(
    await chamarIa(
      `${dadosResumo}

Gere SOMENTE:

# 1. SUMÁRIO EXECUTIVO DA UNIDADE

## 1.1 Panorama
1 parágrafo sobre a maturidade de IA **desta unidade** (${unidadeMeta.nome}), citando score ${scoreGeral.toFixed(2)} e contexto setorial.

## 1.2 Tabela consolidada
| Métrica | Valor |
|---------|:-----:|
| Score da unidade | ${scoreGeral.toFixed(2)} |
| Nível | ${nomesNivel[nivel - 1]} |
| Avaliadores | ${avaliacoesFiltradas.length} |

## 1.3 Cinco prioridades imediatas
Bullets numerados — o que a unidade deve fazer nos próximos 30 dias (específico, não genérico).

${temContexto ? 'Use o contexto do cliente quando disponível.' : ''}`,
      modoRapido ? 2500 : 4000
    )
  );

  // Chunks por dimensão — ações específicas
  for (let i = 0; i < dimsComDados.length; i++) {
    const dim = dimsComDados[i];
    const num = i + 1;
    await reportarProgresso(
      i + 1,
      `Dimensão ${num}/${dimsComDados.length}: ${dim.area}`
    );
    const planoDim = planoAcaoPorNomeDimensao(planoAcao, dim.area);
    const detalhePerg = (dim.perguntas || [])
      .slice(0, 8)
      .map((p) => `- [Q${p.numero}] ${String(p.texto || '').substring(0, 120)} → ${p.score ?? '—'}`)
      .join('\n');

    partesDimensoes.push(
      await chamarIa(
        `${dadosResumo}

Gere SOMENTE a subseção da dimensão **${dim.area}**:

## 2.${num} ${dim.area}

### 2.${num}.1 Diagnóstico da unidade
Parágrafo denso: score ${Number(dim.score).toFixed(2)}, nível N${dim.nivel || nivel}, cite perguntas [Qn] quando relevante.

### 2.${num}.2 O que a unidade deve fazer (30 dias)
3 ações numeradas A1–A3: owner sugerido, entregável concreto, prazo.

### 2.${num}.3 O que a unidade deve fazer (60–90 dias)
2 ações numeradas A4–A5: evolução estrutural para esta dimensão.

### 2.${num}.4 KPIs de acompanhamento
Tabela compacta: KPI | Baseline | Meta 90d (mínimo 2 linhas).

${montarBlocoPlanoAcaoDimensaoPrompt(planoDim)}

Perguntas consolidadas desta dimensão:
${detalhePerg || '—'}

${temDesejosIa ? 'Ancore ≥1 ação em Desejos IA quando pertinente.' : ''}`,
        modoRapido ? 1800 : 2800
      )
    );
  }

  const secao2 = `# 2. AÇÕES POR DIMENSÃO — UNIDADE ${unidadeMeta.nome}\n\n${partesDimensoes.join('\n\n')}`;

  await reportarProgresso(totalChunks - 1, 'Roadmap 90 dias da unidade');
  const secao3 = await chamarIa(
    `${dadosResumo}

Plano rule-based prioritário:
${planoAcao.map((p) => `- ${p.area} (${p.score}): ${p.acoes30Dias[0]}`).join('\n') || '—'}

Gere SOMENTE:

# 3. ROADMAP 90 DIAS DA UNIDADE

## 3.1 Visão integrada
Parágrafo conectando gaps da unidade ${unidadeMeta.nome} ao plano trimestral.

## 3.2 Cronograma
Tabela: Semana | Iniciativa | Dimensão | Owner | Entregável | Status

## 3.3 Rituais de governança
Bullets: cadência de acompanhamento, métricas de revisão, critério de sucesso da unidade.`,
    modoRapido ? 2200 : 3500
  );

  markdown = `${secaoDashboard}\n\n${partesSumario.join('\n\n')}\n\n${secao2}\n\n${secao3}`;
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
  const relatorioFinal = prependCapaNivelAvaliadoresAoRelatorio(markdown, {
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
    frameworkMaturidade: FRAMEWORK_BLUEPRINT_16,
    ...logoMeta,
    setor,
    porte,
    scoreGeral,
    nivel,
    scoresPorArea: dimensoesDiagnostico.map((a) => ({
      area: a.area,
      score: a.score,
      nivel: a.nivel,
      semDadosConsolidados: dimensaoComScoreZero(a)
    })),
    totalDimensoesFramework: dimensoesDiagnostico.length,
    totalAvaliadores: avaliacoesFiltradas.length,
    filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
    planoAcaoUnidade: planoAcao,
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

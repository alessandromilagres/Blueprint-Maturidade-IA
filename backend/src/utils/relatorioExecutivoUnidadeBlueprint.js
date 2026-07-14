/**
 * Relatório executivo IA por unidade — projetos Blueprint 16.
 * Pipeline separado (tipo executivo_unidade); não altera POST relatorio-ia.
 */
import { prisma } from '../lib/prisma.js';
import { deveReutilizarRelatorioIASalvo } from './reutilizarRelatorioIA.js';
import { salvarRelatorioIA } from '../routes/relatorios-ia.js';
import { callAIWithContinuation, getProvider, loadPersistedAIConfig } from '../services/ai-provider.js';
import { shrinkPromptToCharBudget } from './aiPromptBudget.js';
import { SYSTEM_PROMPT_PERSONA_EXECUTIVO } from '../constants/consultorRelatorioIA.js';
import { listarAreasDoProjeto } from './areaFrameworkCatalog.js';
import { mapaApresentacaoDimensoes } from './projetoDimensoesConfig.js';
import { calcularScoresConsolidadoMaturidade, nivelNumericoDeScore } from './scoresConsolidadoProjetoMaturidade.js';
import { ordenarAreasPorFramework } from './ordemDimensoesFramework.js';
import { montarComparativoVersoesProjeto, blocoEvolucaoVersoesMarkdown, blocoLogicaMaturidadeMarkdown } from './evolucaoVersoesProjeto.js';
import {
  blocoContextoProjetoMarkdown,
  projetoTemContextoCadastrado,
  blocoInstrucoesSistemaExecutivoComContexto
} from './projetoContexto.js';
import {
  parseFiltroNivelPrioridadeMapeamentoMaturidadeMax,
  prependCapaNivelAvaliadoresAoRelatorio,
  usuarioIncluidoNoFiltroNivelMapeamentoMaturidade
} from './nivelPrioridadeMapeamentoMaturidade.js';
import { resolverLogoEmpresa } from './empresaLogo.js';
import { NOMES_NIVEL_BLUEPRINT } from './nivelMaturidadeRubrica.js';
import {
  blocoDesejosIaResumoExecutivo,
  projetoTemDesejosIaCadastrados,
  blocoInstrucoesDesejosIaSistemaExecutivo
} from './blocoDesejosIaBook.js';
import { desejosIaTemRespostasGuardadas } from './desejosIaAvaliacaoMaturidade.js';
import { percentualReferenciaRoi } from './roiPorFaturamento.js';
import {
  filtrarAvaliacoesRelatorioProjeto,
  metadadosUnidadeDadosUsados,
  prependCapaUnidadeAoRelatorio,
  relatorioUnidadeCacheCompativel,
  resolverContextoUnidadeRelatorioObrigatorio
} from './relatorioUnidadeIA.js';
import { garantirUnidadeGeralEmpresa } from './empresaUnidade.js';

const TIPO = 'executivo_unidade';

export async function executarGeracaoRelatorioExecutivoUnidadeBlueprint(req, res, deps) {
  const { obterVersaoSelecionadaProjeto, idsAvaliacoesDaVersao } = deps;
  const projetoId = parseInt(req.params.id, 10);
  const reuse = deveReutilizarRelatorioIASalvo(req);
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
      where: { projetoId, tipo: TIPO },
      orderBy: { createdAt: 'desc' }
    });
    if (ultimoSalvo) {
      const dadosSnap = ultimoSalvo.dadosSnapshot ? JSON.parse(ultimoSalvo.dadosSnapshot) : null;
      if (
        relatorioUnidadeCacheCompativel(dadosSnap, {
          filtroNivelMax,
          filtroUnidadeId,
          projetoVersaoId: projetoVersao?.id
        })
      ) {
        const logoMeta = await resolverLogoEmpresa(
          (await prisma.projeto.findUnique({ where: { id: projetoId }, include: { empresa: true } }))?.empresa
        );
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
          tipoRelatorio: TIPO,
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
  const idsAvaliacaoVersao = await idsAvaliacoesDaVersao(projetoId, projetoVersao.id);
  const avaliacoesFiltradas = filtrarAvaliacoesRelatorioProjeto(projeto.avaliacoes, {
    idsVersao: idsAvaliacaoVersao,
    filtroNivelMax,
    filtroUnidadeId,
    unidadeGeralId: unidadeGeralEfetiva?.id
  });

  if (!avaliacoesFiltradas.length) {
    return res.status(400).json({
      error: 'Não há avaliações finalizadas de avaliadores desta unidade',
      projetoVersao,
      filtroEmpresaUnidade: unidadeMeta
    });
  }

  const areas = ordenarAreasPorFramework(await listarAreasDoProjeto(prisma, projeto.id));
  const { porAreaId: dimensoesConfigExec, configurado: dimensoesConfiguradoExec } =
    await mapaApresentacaoDimensoes(prisma, projetoId);
  const {
    scoresPorArea: areasComScore,
    dimensoesForaEscopo: dimensoesForaEscopoExec,
    todasDimensoes,
    scoreGeral
  } = calcularScoresConsolidadoMaturidade(avaliacoesFiltradas, areas, {
    dimensoesConfig: dimensoesConfigExec
  });
  const dimensoesRelatorio = todasDimensoes;
  const scoresPorArea = areasComScore.map((a) => ({ area: a.area, score: a.score }));
  const nivel = nivelNumericoDeScore(scoreGeral);
  const nomesNivel = NOMES_NIVEL_BLUEPRINT;
  const comparativoVersoes = await montarComparativoVersoesProjeto(prisma, {
    projetoId,
    versaoAtualId: projetoVersao.id,
    avaliacoesFinalizadas: projeto.avaliacoes,
    areas,
    filtroNivelMax,
    usuarioIncluidoNoFiltro: usuarioIncluidoNoFiltroNivelMapeamentoMaturidade
  });
  const blocoEvolucaoVersoes = blocoEvolucaoVersoesMarkdown(comparativoVersoes);
  const blocoLogicaMaturidade = blocoLogicaMaturidadeMarkdown({
    scoreGeral,
    nomesNivel,
    nivel,
    ponderacao: {
      ponderado: dimensoesConfiguradoExec === true,
      dimensoesForaEscopo: dimensoesForaEscopoExec || []
    }
  });
  const ordenados = [...scoresPorArea].sort((a, b) => b.score - a.score);
  const top3 = ordenados.slice(0, 3);
  const bottom3 = ordenados.slice(-3).reverse();
  const setor = projeto.vertical || projeto.empresa.setor || 'Geral';
  const porte = projeto.empresa.porte || 'Não informado';
  const blocoContextoCliente = await blocoContextoProjetoMarkdown(prisma, projetoId);
  const temContextoProjetoExec = projetoTemContextoCadastrado(blocoContextoCliente);
  const blocoDesejosIaExec = blocoDesejosIaResumoExecutivo(avaliacoesFiltradas);
  const temDesejosIaExec = projetoTemDesejosIaCadastrados(avaliacoesFiltradas);
  const pctRefExec = percentualReferenciaRoi(projeto.faturamentoAnualProjeto, projeto.empresa);

  const blocoUnidade = prependCapaUnidadeAoRelatorio('', unidadeMeta).trim();

  const userPrompt = `${blocoUnidade}

Analise os dados e gere o **Relatório Executivo C-Level por unidade organizacional** (${unidadeMeta.nome}) em Markdown.

Unidade: **${unidadeMeta.nome}**
Descrição da área: ${unidadeMeta.descricao || '—'}

Empresa: ${projeto.empresa.nome}
Projeto: ${projeto.nome}
Setor: ${setor} | Porte: ${porte}
Score consolidado da unidade: ${scoreGeral.toFixed(2)} (nível ${nivel})
Avaliadores na unidade: ${avaliacoesFiltradas.length}

Dimensões:
${dimensoesRelatorio.map((d) => `- ${d.area}: ${d.score}`).join('\n')}

Top 3: ${top3.map((d) => `${d.area} (${d.score})`).join('; ')}
Gaps: ${bottom3.map((d) => `${d.area} (${d.score})`).join('; ')}

${blocoContextoCliente || ''}
${blocoDesejosIaExec || ''}
${blocoEvolucaoVersoes}
${blocoLogicaMaturidade}

Recomendações devem ser específicas para a missão desta unidade organizacional.`;

  const systemPrompt = `${SYSTEM_PROMPT_PERSONA_EXECUTIVO}
${temContextoProjetoExec ? blocoInstrucoesSistemaExecutivoComContexto() : ''}
${temDesejosIaExec ? blocoInstrucoesDesejosIaSistemaExecutivo() : ''}
Escopo: relatório exclusivo da unidade "${unidadeMeta.nome}" — não generalize para toda a enterprise.`;

  await loadPersistedAIConfig();
  const promptExec = shrinkPromptToCharBudget(userPrompt, 48_000).prompt;
  const resultado = await callAIWithContinuation(promptExec, systemPrompt, {
    temperature: 0.55,
    maxTokens: 8000
  }, { maxContinuations: 2, minContentTail: 800 });

  const logoMeta = await resolverLogoEmpresa(projeto.empresa);
  const dadosUsados = {
    empresa: projeto.empresa.nome,
    projeto: projeto.nome,
    frameworkMaturidade: 'BLUEPRINT_16',
    ...logoMeta,
    setor,
    porte,
    scoreGeral,
    nivel,
    top3,
    bottom3,
    scoresPorArea: dimensoesRelatorio.map((a) => ({
      area: a.area,
      score: a.score,
      semDadosConsolidados: a.score === 0
    })),
    totalAvaliadores: avaliacoesFiltradas.length,
    filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
    ...metadadosUnidadeDadosUsados(unidadeMeta, filtroUnidadeId),
    projetoVersao,
    comparativoVersoes,
    percentualReferenciaRoi: pctRefExec,
    temDesejosIa: temDesejosIaExec
  };

  const conteudoExecutivo = prependCapaNivelAvaliadoresAoRelatorio(
    prependCapaUnidadeAoRelatorio(resultado.content, unidadeMeta),
    {
      filtroMax: filtroNivelMax,
      avaliacoesFiltradas,
      empresaNome: projeto.empresa.nome,
      projetoNome: projeto.nome
    }
  );

  let salvo = null;
  try {
    salvo = await salvarRelatorioIA({
      projetoId,
      tipo: TIPO,
      titulo: `Executivo por unidade — ${unidadeMeta.nome} — ${projeto.empresa.nome}`,
      conteudoMd: conteudoExecutivo,
      provider: resultado.provider,
      modelo: resultado.model,
      tokensEntrada: resultado.tokensEntrada,
      tokensSaida: resultado.tokensSaida,
      tempoGeracaoMs: resultado.tempoResposta,
      dadosUsados,
      geradoPorId: req.usuario?.id || null
    });
  } catch (e) {
    console.error('[Relatório IA unidade Blueprint] Erro ao salvar:', e.message);
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
    tipoRelatorio: TIPO,
    filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
    projetoVersao
  });
}

/**
 * Comparativo de maturidade entre unidades organizacionais (Fase 4).
 */
import { prisma } from '../lib/prisma.js';
import { listarAreasDoProjeto } from './areaFrameworkCatalog.js';
import { mapaApresentacaoDimensoes } from './projetoDimensoesConfig.js';
import {
  calcularScoresConsolidadoMaturidade,
  nivelNumericoDeScore
} from './scoresConsolidadoProjetoMaturidade.js';
import { ordenarAreasPorFramework } from './ordemDimensoesFramework.js';
import {
  garantirUnidadeGeralEmpresa,
  mapUnidadeEmpresaResponse
} from './empresaUnidade.js';
import { filtrarAvaliacoesRelatorioProjeto } from './relatorioUnidadeIA.js';
import {
  usuarioIncluidoNoFiltroNivelMapeamentoMaturidade
} from './nivelPrioridadeMapeamentoMaturidade.js';
import { NOMES_NIVEL_BLUEPRINT } from './nivelMaturidadeRubrica.js';

function resumirDimensoes(todasDimensoes) {
  const comScore = (todasDimensoes || []).filter((d) => Number(d.score) > 0);
  const ordenadas = [...comScore].sort((a, b) => Number(b.score) - Number(a.score));
  return {
    scoresPorArea: comScore.map((d) => ({
      area: d.area,
      score: Number(d.score),
      nivel: d.nivel ?? nivelNumericoDeScore(Number(d.score))
    })),
    gaps: [...comScore].sort((a, b) => Number(a.score) - Number(b.score)).slice(0, 3),
    fortes: ordenadas.slice(0, 3)
  };
}

function calcularSnapshotUnidade({
  avaliacoesNaVersao,
  idsAvaliacaoVersao,
  filtroNivelMax,
  filtroUnidadeId,
  unidadeGeralId,
  areas,
  dimensoesConfig
}) {
  const avaliacoesFiltradas = filtrarAvaliacoesRelatorioProjeto(avaliacoesNaVersao, {
    idsVersao: idsAvaliacaoVersao,
    filtroNivelMax,
    filtroUnidadeId,
    unidadeGeralId
  });

  if (!avaliacoesFiltradas.length) {
    return {
      totalAvaliadores: 0,
      scoreGeral: 0,
      nivel: 0,
      nivelLabel: 'Sem dados',
      scoresPorArea: [],
      gaps: [],
      fortes: [],
      todasDimensoes: []
    };
  }

  const { scoreGeral, todasDimensoes } = calcularScoresConsolidadoMaturidade(
    avaliacoesFiltradas,
    areas,
    { dimensoesConfig }
  );
  const nivel = nivelNumericoDeScore(scoreGeral);
  const resumo = resumirDimensoes(todasDimensoes);

  return {
    totalAvaliadores: avaliacoesFiltradas.length,
    scoreGeral: Number(Number(scoreGeral).toFixed(2)),
    nivel,
    nivelLabel: NOMES_NIVEL_BLUEPRINT[nivel - 1] || '—',
    ...resumo,
    todasDimensoes
  };
}

export async function montarComparativoUnidadesOrganizacionais({
  projetoId,
  projetoVersao,
  filtroNivelMax,
  idsAvaliacoesDaVersao
}) {
  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    include: {
      empresa: true,
      avaliacoes: {
        where: { status: 'finalizada' },
        include: {
          usuario: { include: { empresaUnidade: true } },
          respostas: { include: { pergunta: { include: { area: true } } } }
        }
      }
    }
  });
  if (!projeto) return { ok: false, status: 404, error: 'Projeto não encontrado' };

  const unidadeGeral = await garantirUnidadeGeralEmpresa(projeto.empresaId);
  const unidadesRows = await prisma.unidadeEmpresa.findMany({
    where: { empresaId: projeto.empresaId, ativo: true },
    orderBy: [{ ehPadrao: 'desc' }, { ordem: 'asc' }, { nome: 'asc' }]
  });
  const unidadesEmpresa = unidadesRows.map(mapUnidadeEmpresaResponse);

  const areas = ordenarAreasPorFramework(await listarAreasDoProjeto(prisma, projetoId));
  const { porAreaId: dimensoesConfig, frameworkMaturidade } = await mapaApresentacaoDimensoes(
    prisma,
    projetoId
  );

  const idsAvaliacaoVersao = await idsAvaliacoesDaVersao(projetoId, projetoVersao.id);
  const avaliacoesNaVersao = projeto.avaliacoes.filter((av) =>
    idsAvaliacaoVersao.has(Number(av.id))
  );

  const baseArgs = {
    avaliacoesNaVersao,
    idsAvaliacaoVersao,
    filtroNivelMax,
    unidadeGeralId: unidadeGeral?.id,
    areas,
    dimensoesConfig
  };

  const enterprise = calcularSnapshotUnidade({
    ...baseArgs,
    filtroUnidadeId: null
  });

  const unidadesComDados = [];
  for (const unidade of unidadesEmpresa) {
    if (unidade.ehPadrao) continue;
    const snap = calcularSnapshotUnidade({
      ...baseArgs,
      filtroUnidadeId: unidade.id
    });
    if (snap.totalAvaliadores === 0) continue;
    unidadesComDados.push({
      id: unidade.id,
      nome: unidade.nome,
      codigo: unidade.codigo,
      descricao: unidade.descricao,
      dimensoesFoco: unidade.dimensoesFoco,
      ...snap,
      deltaVsEnterprise: parseFloat((snap.scoreGeral - enterprise.scoreGeral).toFixed(2))
    });
  }

  unidadesComDados.sort((a, b) => b.scoreGeral - a.scoreGeral);
  unidadesComDados.forEach((u, idx) => {
    u.rank = idx + 1;
  });

  const nomesDimensoes = [
    ...new Set(
      unidadesComDados.flatMap((u) => (u.scoresPorArea || []).map((d) => d.area))
    )
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const matrizDimensoes = nomesDimensoes.map((area) => {
    const porUnidade = {};
    for (const u of unidadesComDados) {
      const dim = (u.scoresPorArea || []).find((d) => d.area === area);
      porUnidade[String(u.id)] = dim ? dim.score : null;
    }
    const scores = Object.values(porUnidade).filter((s) => s != null);
    const min = scores.length ? Math.min(...scores) : null;
    const max = scores.length ? Math.max(...scores) : null;
    return { area, porUnidade, spread: min != null && max != null ? parseFloat((max - min).toFixed(2)) : null };
  });

  return {
    ok: true,
    projeto: { id: projeto.id, nome: projeto.nome },
    empresa: { id: projeto.empresa.id, nome: projeto.empresa.nome },
    projetoVersao,
    frameworkMaturidade,
    filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
    totalAvaliadoresVersao: avaliacoesNaVersao.filter((av) =>
      usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(av.usuario, filtroNivelMax)
    ).length,
    enterprise,
    unidades: unidadesComDados,
    unidadesEmpresa,
    matrizDimensoes
  };
}

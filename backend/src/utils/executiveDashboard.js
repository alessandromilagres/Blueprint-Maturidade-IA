/**
 * Executive Dashboard — agrega score, radar, gaps, regulatório, ROI e roadmap.
 * Reutilizado pelo endpoint da API e pelas rotas de exportação.
 */
import { calcularScoresConsolidadoMaturidade } from './scoresConsolidadoProjetoMaturidade.js';
import { mapaApresentacaoDimensoes } from './projetoDimensoesConfig.js';
import { listarAreasDoProjeto } from './areaFrameworkCatalog.js';
import { carregarFrameworkProjeto } from './projetoFramework.js';
import { metodologiaScoreFramework } from './frameworkScoringPolicy.js';
import { ordenarAreasPorFramework } from './ordemDimensoesFramework.js';
import { montarComparativoVersoesProjeto } from './evolucaoVersoesProjeto.js';
import { montarDashboardRegulatorioProjeto } from './regulatorioDashboard.js';
import { projecaoFinanceiraRelatorio } from './roiPorFaturamento.js';
import { NOMES_NIVEL_BLUEPRINT, nivelNumericoDeScore } from './nivelMaturidadeRubrica.js';
import { resolverLogoEmpresa } from './empresaLogo.js';
import { usuarioIncluidoNoFiltroNivelMapeamentoMaturidade } from './nivelPrioridadeMapeamentoMaturidade.js';
import { FRAMEWORK_SATF_TI_V3 } from '../constants/frameworkMaturidadePolicy.js';
import { enriquecerScoresDashboardSatf } from './projetoDimensaoCertificacao.js';

function normalizarProjetoVersao(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    projetoId: Number(row.projetoId),
    numero: Number(row.numero),
    titulo: row.titulo,
    status: row.status,
    iniciadaEm: row.iniciadaEm,
    fechadaEm: row.fechadaEm,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

async function resolverVersaoProjeto(prisma, projetoId, versaoIdOpt) {
  if (versaoIdOpt != null && versaoIdOpt !== '') {
    const versaoId = parseInt(String(versaoIdOpt), 10);
    if (Number.isFinite(versaoId) && versaoId > 0) {
      const rows = await prisma.$queryRaw`
        SELECT * FROM "ProjetoVersao"
        WHERE "id" = ${versaoId} AND "projetoId" = ${projetoId}
        LIMIT 1
      `;
      if (rows.length > 0) return normalizarProjetoVersao(rows[0]);
    }
  }
  const rows = await prisma.$queryRaw`
    SELECT * FROM "ProjetoVersao"
    WHERE "projetoId" = ${projetoId}
    ORDER BY CASE WHEN "status" = 'aberta' THEN 0 ELSE 1 END, "numero" DESC
    LIMIT 1
  `;
  return rows.length > 0 ? normalizarProjetoVersao(rows[0]) : null;
}

async function idsAvaliacoesDaVersao(prisma, projetoId, projetoVersaoId) {
  if (!projetoVersaoId) return new Set();
  const rows = await prisma.$queryRaw`
    SELECT a."id"
    FROM "Avaliacao" a
    JOIN "ProjetoVersaoAvaliacao" pva ON pva."avaliacaoId" = a."id"
    WHERE a."projetoId" = ${projetoId} AND pva."projetoVersaoId" = ${projetoVersaoId}
  `;
  return new Set(rows.map((row) => Number(row.id)));
}

export async function montarExecutiveDashboard(prisma, projetoId, opts = {}) {
  const filtroNivelMax = opts.filtroNivelMax ?? null;
  const incluirLogo = opts.incluirLogo !== false;
  const projetoVersao = await resolverVersaoProjeto(prisma, projetoId, opts.projetoVersaoId ?? opts.versaoId);

  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    include: {
      empresa: true,
      avaliacoes: {
        where: { status: 'finalizada' },
        include: {
          usuario: true,
          respostas: { include: { pergunta: { include: { area: true } } } }
        }
      }
    }
  });
  if (!projeto) {
    const err = new Error('Projeto não encontrado');
    err.status = 404;
    throw err;
  }

  const areas = ordenarAreasPorFramework(await listarAreasDoProjeto(prisma, projetoId));

  const idsAvaliacaoVersao = await idsAvaliacoesDaVersao(prisma, projetoId, projetoVersao?.id);
  const avaliacoesFiltradas = projeto.avaliacoes.filter((av) =>
    (!projetoVersao?.id || idsAvaliacaoVersao.has(Number(av.id))) &&
    usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(av.usuario, filtroNivelMax)
  );

  const logoMeta = incluirLogo ? await resolverLogoEmpresa(projeto.empresa) : {};
  const scoreAlvoPadrao = 3.5;

  if (avaliacoesFiltradas.length === 0) {
    return {
      projeto: { id: projeto.id, nome: projeto.nome, descricao: projeto.descricao, vertical: projeto.vertical },
      empresa: projeto.empresa,
      projetoVersao,
      filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
      totalAvaliadores: 0,
      scoreGeral: 0,
      nivel: 0,
      nivelNome: 'Não avaliado',
      scoresPorArea: [],
      topGaps: [],
      statusRegulatorio: null,
      roi: null,
      proximosPassos: { dias30: [], dias60: [], dias90: [] },
      comparativoVersao: { disponivel: false },
      totalIniciativas: 0,
      ...logoMeta
    };
  }

  const { frameworkMaturidade, setorRegulado } = await carregarFrameworkProjeto(prisma, projetoId);
  const metodologiaScore = metodologiaScoreFramework(frameworkMaturidade, { setorRegulado });

  const { porAreaId: dimensoesConfig } = await mapaApresentacaoDimensoes(prisma, projetoId);
  let {
    scoresPorArea: areasComScore,
    dimensoesForaEscopo,
    dimensoesEspecializadas,
    todasDimensoes,
    scoreGeral
  } = calcularScoresConsolidadoMaturidade(avaliacoesFiltradas, areas, { dimensoesConfig });

  let scoreGeralDeclarado = null;
  let certificacaoSatf = null;
  if (frameworkMaturidade === FRAMEWORK_SATF_TI_V3) {
    const todasComScore = [
      ...areasComScore,
      ...(dimensoesEspecializadas || []),
      ...(dimensoesForaEscopo || [])
    ];
    const satfEnriquecido = await enriquecerScoresDashboardSatf(
      prisma,
      projetoId,
      avaliacoesFiltradas,
      todasComScore,
      dimensoesConfig
    );
    if (satfEnriquecido) {
      scoreGeralDeclarado = scoreGeral;
      scoreGeral = satfEnriquecido.scoreGeralOficial;
      certificacaoSatf = satfEnriquecido.certificacaoResumo;
      const porId = new Map(satfEnriquecido.scoresPorArea.map((a) => [a.areaId, a]));
      areasComScore = areasComScore.map((a) => porId.get(a.areaId) || a);
      dimensoesEspecializadas = (dimensoesEspecializadas || []).map((a) => porId.get(a.areaId) || a);
      dimensoesForaEscopo = (dimensoesForaEscopo || []).map((a) => porId.get(a.areaId) || a);
      todasDimensoes = (todasDimensoes || []).map((d) =>
        d.areaId != null ? { ...d, ...(porId.get(d.areaId) || {}) } : d
      );
    }
  }

  const nivel = nivelNumericoDeScore(scoreGeral);
  const nivelNome = NOMES_NIVEL_BLUEPRINT[nivel - 1] || 'Não avaliado';

  const topGaps = [...areasComScore]
    .filter((a) => Number(a.score) > 0)
    .sort((a, b) => Number(a.score) - Number(b.score))
    .slice(0, 5)
    .map((a) => ({
      areaId: a.areaId,
      area: a.area,
      score: Number(a.score),
      scoreAlvo: scoreAlvoPadrao,
      gap: parseFloat(Math.max(0, scoreAlvoPadrao - Number(a.score)).toFixed(2)),
      nivel: a.nivel
    }));

  let comparativoVersao = { disponivel: false };
  try {
    const comp = await montarComparativoVersoesProjeto(prisma, {
      projetoId,
      versaoAtualId: projetoVersao?.id,
      avaliacoesFinalizadas: projeto.avaliacoes,
      areas,
      filtroNivelMax,
      usuarioIncluidoNoFiltro: usuarioIncluidoNoFiltroNivelMapeamentoMaturidade
    });
    if (comp?.disponivel) {
      comparativoVersao = {
        disponivel: true,
        delta: comp.delta,
        tendencia: comp.tendencia,
        versaoBase: comp.versaoBase ? { numero: comp.versaoBase.numero, titulo: comp.versaoBase.titulo, score: comp.versaoBase.score } : null,
        versaoComparada: comp.versaoComparada ? { numero: comp.versaoComparada.numero, titulo: comp.versaoComparada.titulo, score: comp.versaoComparada.score } : null
      };
    } else {
      comparativoVersao = { disponivel: false, mensagem: comp?.mensagem };
    }
  } catch (e) {
    comparativoVersao = { disponivel: false, mensagem: e?.message };
  }

  let statusRegulatorio = null;
  try {
    const dashReg = await montarDashboardRegulatorioProjeto(prisma, projetoId, {
      versaoId: projetoVersao?.id,
      scoresPorArea: areasComScore
    });
    statusRegulatorio = {
      kpis: dashReg.kpis,
      resumoProjeto: dashReg.resumoProjeto,
      plano30_60_90: dashReg.plano30_60_90,
      disclaimer: dashReg.disclaimer
    };
  } catch (e) {
    statusRegulatorio = { indisponivel: true, mensagem: e?.message };
  }

  const roi = projecaoFinanceiraRelatorio({
    faturamentoAnualProjeto: projeto.faturamentoAnualProjeto,
    scoreGeral
  });

  const iniciativas = await prisma.iniciativa.findMany({
    where: {
      projetoId,
      status: { notIn: ['concluida', 'cancelada'] }
    },
    orderBy: [{ prioridade: 'asc' }, { dataFimPrevista: 'asc' }]
  });
  const proximosPassos = { dias30: [], dias60: [], dias90: [] };
  const agora = Date.now();
  for (const ini of iniciativas) {
    let bucket = 'dias90';
    if (ini.dataFimPrevista) {
      const dias = Math.ceil((new Date(ini.dataFimPrevista).getTime() - agora) / 86400000);
      bucket = dias <= 30 ? 'dias30' : dias <= 60 ? 'dias60' : 'dias90';
    } else if (ini.prioridade === 'alta') {
      bucket = 'dias30';
    } else if (ini.prioridade === 'media') {
      bucket = 'dias60';
    }
    if (proximosPassos[bucket].length < 3) {
      proximosPassos[bucket].push({
        id: ini.id,
        titulo: ini.titulo,
        contextoRotulo: ini.contextoRotulo,
        status: ini.status,
        prioridade: ini.prioridade,
        progresso: ini.progresso,
        responsavel: ini.responsavel
      });
    }
  }

  return {
    projeto: {
      id: projeto.id,
      nome: projeto.nome,
      descricao: projeto.descricao,
      vertical: projeto.vertical,
      frameworkMaturidade
    },
    frameworkMaturidade,
    metodologiaScore,
    empresa: projeto.empresa,
    projetoVersao,
    filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
    totalAvaliadores: avaliacoesFiltradas.length,
    scoreGeral: parseFloat(Number(scoreGeral).toFixed(2)),
    scoreGeralDeclarado:
      scoreGeralDeclarado != null ? parseFloat(Number(scoreGeralDeclarado).toFixed(2)) : null,
    certificacaoSatf,
    nivel,
    nivelNome,
    scoresPorArea: todasDimensoes.map((a) => ({
      areaId: a.areaId,
      area: a.area,
      score: Number(a.score) || 0,
      nivel: a.nivel,
      peso: a.peso ?? null,
      foraDeEscopo: a.foraDeEscopo === true,
      foraDaMediaGeral: a.foraDaMediaGeral === true,
      semDadosConsolidados: a.semDadosConsolidados
    })),
    dimensoesForaEscopo: (dimensoesForaEscopo || []).map((a) => ({
      areaId: a.areaId,
      area: a.area,
      score: Number(a.score) || 0,
      nivel: a.nivel,
      peso: a.peso ?? null
    })),
    dimensoesEspecializadas: (dimensoesEspecializadas || []).map((a) => ({
      areaId: a.areaId,
      area: a.area,
      score: Number(a.score) || 0,
      nivel: a.nivel,
      peso: a.peso ?? null
    })),
    topGaps,
    statusRegulatorio,
    roi,
    proximosPassos,
    totalIniciativas: iniciativas.length,
    comparativoVersao,
    ...logoMeta
  };
}

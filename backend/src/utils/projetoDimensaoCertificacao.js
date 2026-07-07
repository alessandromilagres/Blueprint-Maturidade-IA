/**
 * SATF camada 3 — certificação consultiva por dimensão do projeto.
 */
import { FRAMEWORK_SATF_TI_V3 } from '../constants/frameworkMaturidadePolicy.js';
import { carregarFrameworkProjeto } from './projetoFramework.js';
import { listarAreasDoProjeto } from './areaFrameworkCatalog.js';
import { mapaApresentacaoDimensoes } from './projetoDimensoesConfig.js';
import { areaContaParaAvaliacao } from './avaliacaoAreasRecusadas.js';
import { scoresAreaSatfDeclaradoETeto } from './satfScoreTeto.js';
import { podeValidarRegulatorio } from './regulatorioSnapshot.js';
import { nivelNumericoDeScore } from './nivelMaturidadeRubrica.js';

let schemaReady = false;

const STATUS_VALIDOS = new Set(['pendente', 'certificado', 'rebaixado']);
const CONFIANCA_VALIDAS = new Set(['alta', 'media', 'baixa']);

export function podeCertificarSatf(role) {
  return podeValidarRegulatorio(role);
}

export async function ensureProjetoDimensaoCertificacaoSchema(prisma) {
  if (schemaReady) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ProjetoDimensaoCertificacao" (
        "id" SERIAL PRIMARY KEY,
        "projetoId" INTEGER NOT NULL,
        "areaId" INTEGER NOT NULL,
        "scoreDeclarado" DOUBLE PRECISION,
        "scoreComTeto" DOUBLE PRECISION,
        "scoreCertificado" DOUBLE PRECISION,
        "status" TEXT NOT NULL DEFAULT 'pendente',
        "confianca" TEXT,
        "evidenciasResumo" TEXT,
        "observacaoConsultor" TEXT,
        "certificadoPorUsuarioId" INTEGER,
        "certificadoEm" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ProjetoDimensaoCertificacao_projeto_area_key" UNIQUE ("projetoId", "areaId")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "ProjetoDimensaoCertificacao_projetoId_idx"
      ON "ProjetoDimensaoCertificacao" ("projetoId")
    `);
    schemaReady = true;
  } catch (e) {
    console.warn('[schema] ProjetoDimensaoCertificacao:', e?.message || e);
  }
}

export async function carregarCertificacoesPorProjeto(prisma, projetoId) {
  await ensureProjetoDimensaoCertificacaoSchema(prisma);
  try {
    const rows = await prisma.$queryRaw`
      SELECT *
      FROM "ProjetoDimensaoCertificacao"
      WHERE "projetoId" = ${projetoId}
    `;
    const mapa = new Map();
    for (const row of rows) {
      mapa.set(Number(row.areaId), normalizarLinhaCertificacao(row));
    }
    return mapa;
  } catch {
    return new Map();
  }
}

function normalizarLinhaCertificacao(row) {
  return {
    id: Number(row.id),
    projetoId: Number(row.projetoId),
    areaId: Number(row.areaId),
    scoreDeclarado: row.scoreDeclarado != null ? Number(row.scoreDeclarado) : null,
    scoreComTeto: row.scoreComTeto != null ? Number(row.scoreComTeto) : null,
    scoreCertificado: row.scoreCertificado != null ? Number(row.scoreCertificado) : null,
    status: row.status || 'pendente',
    confianca: row.confianca || null,
    evidenciasResumo: row.evidenciasResumo || null,
    observacaoConsultor: row.observacaoConsultor || null,
    certificadoPorUsuarioId:
      row.certificadoPorUsuarioId != null ? Number(row.certificadoPorUsuarioId) : null,
    certificadoEm: row.certificadoEm || null
  };
}

function scoreOficialDimensao(cert, scoreComTeto, scoreDeclarado) {
  if (cert?.status === 'certificado' && cert.scoreCertificado != null) {
    return Number(cert.scoreCertificado);
  }
  if (cert?.status === 'rebaixado' && cert.scoreCertificado != null) {
    return Number(cert.scoreCertificado);
  }
  if (scoreComTeto != null) return scoreComTeto;
  return scoreDeclarado ?? 0;
}

export function aplicarCertificacaoAosScores(scoresPorArea, certMap, options = {}) {
  const enriquecidos = (scoresPorArea || []).map((item) => {
    const cert = certMap.get(item.areaId);
    const scoreDeclarado = item.scoreDeclarado ?? item.score;
    const scoreComTeto = item.scoreComTeto ?? item.score;
    const scoreOficial = scoreOficialDimensao(cert, scoreComTeto, scoreDeclarado);
    return {
      ...item,
      scoreDeclarado,
      scoreComTeto,
      score: scoreOficial,
      scoreOficial,
      certificacao: {
        status: cert?.status || 'pendente',
        confianca: cert?.confianca || null,
        scoreCertificado: cert?.scoreCertificado ?? null,
        observacaoConsultor: cert?.observacaoConsultor || null,
        certificadoEm: cert?.certificadoEm || null,
        certificadoPorUsuarioId: cert?.certificadoPorUsuarioId ?? null,
        gapDeclaradoVsOficial: parseFloat(
          Math.max(0, (scoreDeclarado || 0) - scoreOficial).toFixed(2)
        )
      }
    };
  });

  const entraNaMediaGeral = (a) => a.foraDeEscopo !== true && a.foraDaMediaGeral !== true;

  const paraMedia = enriquecidos.filter(
    (a) => entraNaMediaGeral(a) && (a.scoreOficial ?? a.score) > 0
  );
  let scoreGeralOficial = 0;
  if (paraMedia.length) {
    const comPeso = paraMedia.some((a) => Number(a.peso) > 0);
    if (comPeso) {
      let soma = 0;
      let pesos = 0;
      for (const a of paraMedia) {
        const p = Number(a.peso) || 0;
        if (p <= 0) continue;
        soma += (a.scoreOficial ?? a.score) * p;
        pesos += p;
      }
      scoreGeralOficial = pesos > 0 ? soma / pesos : 0;
    } else {
      scoreGeralOficial =
        paraMedia.reduce((acc, a) => acc + (a.scoreOficial ?? a.score), 0) / paraMedia.length;
    }
  }

  const dimsAtivas = enriquecidos.filter(
    (a) => entraNaMediaGeral(a) && !a.semDadosConsolidados && (a.scoreDeclarado ?? a.score) > 0
  );
  const pendentes = dimsAtivas.filter((a) => (a.certificacao?.status || 'pendente') === 'pendente');
  const certificadas = dimsAtivas.filter((a) => a.certificacao?.status === 'certificado');
  const rebaixadas = dimsAtivas.filter((a) => a.certificacao?.status === 'rebaixado');

  return {
    scoresPorArea: enriquecidos,
    scoreGeralOficial: parseFloat(scoreGeralOficial.toFixed(2)),
    certificacaoResumo: {
      statusGeral:
        pendentes.length === 0 && dimsAtivas.length > 0
          ? 'certificado'
          : dimsAtivas.length === 0
            ? 'sem_dados'
            : 'pendente',
      totalDimensoes: dimsAtivas.length,
      pendentes: pendentes.length,
      certificadas: certificadas.length,
      rebaixadas: rebaixadas.length,
      temGapDeclaradoVsOficial: enriquecidos.some(
        (a) => (a.certificacao?.gapDeclaradoVsOficial || 0) > 0.05
      )
    }
  };
}

export async function montarPainelCertificacaoSatf(
  prisma,
  projetoId,
  avaliacoesFinalizadas,
  options = {}
) {
  const { frameworkMaturidade } = await carregarFrameworkProjeto(prisma, projetoId);
  if (frameworkMaturidade !== FRAMEWORK_SATF_TI_V3) {
    const err = new Error('Certificação consultor disponível apenas para projetos SATF TI v3');
    err.status = 400;
    throw err;
  }

  const areas = await listarAreasDoProjeto(prisma, projetoId, { includePerguntas: false });
  const todasAreaIds = areas.map((a) => a.id);
  const { porAreaId: dimensoesConfig } = await mapaApresentacaoDimensoes(prisma, projetoId);
  const certMap = await carregarCertificacoesPorProjeto(prisma, projetoId);

  const dimensoes = areas.map((area) => {
    const cfg = dimensoesConfig.get(area.id);
    const { scoreDeclarado, scoreComTeto, avaliadoresCobriram } = scoresAreaSatfDeclaradoETeto(
      avaliacoesFinalizadas,
      area.id,
      todasAreaIds,
      areaContaParaAvaliacao
    );
    const cert = certMap.get(area.id);
    const scoreOficial = scoreOficialDimensao(cert, scoreComTeto, scoreDeclarado);
    const semDados = avaliadoresCobriram === 0;

    return {
      areaId: area.id,
      area: area.nome,
      codigoFramework: area.codigoFramework || null,
      ativa: cfg ? cfg.ativa !== false : true,
      foraDeEscopo: cfg?.foraDeEscopo === true,
      foraDaMediaGeral: cfg?.foraDaMediaGeral === true,
      peso: cfg?.peso ?? null,
      scoreDeclarado,
      scoreComTeto,
      scoreOficial,
      nivelDeclarado: nivelNumericoDeScore(scoreDeclarado),
      nivelOficial: nivelNumericoDeScore(scoreOficial),
      avaliadoresCobriram,
      semDados,
      certificacao: {
        status: cert?.status || 'pendente',
        confianca: cert?.confianca || null,
        scoreCertificado: cert?.scoreCertificado ?? null,
        evidenciasResumo: cert?.evidenciasResumo || null,
        observacaoConsultor: cert?.observacaoConsultor || null,
        certificadoEm: cert?.certificadoEm || null,
        certificadoPorUsuarioId: cert?.certificadoPorUsuarioId ?? null
      }
    };
  });

  const dimsRevisao = dimensoes.filter(
    (d) => d.ativa && !d.foraDeEscopo && !d.semDados
  );
  const pendentes = dimsRevisao.filter((d) => d.certificacao.status === 'pendente');

  return {
    projetoId,
    frameworkMaturidade,
    dimensoes,
    resumo: {
      total: dimsRevisao.length,
      pendentes: pendentes.length,
      certificadas: dimsRevisao.filter((d) => d.certificacao.status === 'certificado').length,
      rebaixadas: dimsRevisao.filter((d) => d.certificacao.status === 'rebaixado').length,
      statusGeral:
        pendentes.length === 0 && dimsRevisao.length > 0 ? 'certificado' : 'pendente'
    },
    podeEditar: options.podeEditar === true
  };
}

export async function salvarCertificacaoDimensao(prisma, projetoId, areaId, body, usuarioId) {
  await ensureProjetoDimensaoCertificacaoSchema(prisma);
  const { frameworkMaturidade } = await carregarFrameworkProjeto(prisma, projetoId);
  if (frameworkMaturidade !== FRAMEWORK_SATF_TI_V3) {
    const err = new Error('Certificação disponível apenas para projetos SATF');
    err.status = 400;
    throw err;
  }

  const status = String(body.status || 'certificado').trim().toLowerCase();
  if (!STATUS_VALIDOS.has(status)) {
    const err = new Error('Status inválido. Use: pendente, certificado ou rebaixado');
    err.status = 400;
    throw err;
  }

  const scoreCertificado =
    body.scoreCertificado != null && body.scoreCertificado !== ''
      ? Math.min(5, Math.max(1, Number(body.scoreCertificado)))
      : null;

  if ((status === 'certificado' || status === 'rebaixado') && !Number.isFinite(scoreCertificado)) {
    const err = new Error('Informe scoreCertificado (1–5) para certificar ou rebaixar');
    err.status = 400;
    throw err;
  }

  const confianca = body.confianca ? String(body.confianca).trim().toLowerCase() : null;
  if (confianca && !CONFIANCA_VALIDAS.has(confianca)) {
    const err = new Error('Confiança inválida. Use: alta, media ou baixa');
    err.status = 400;
    throw err;
  }

  const existente = await prisma.$queryRaw`
    SELECT * FROM "ProjetoDimensaoCertificacao"
    WHERE "projetoId" = ${projetoId} AND "areaId" = ${areaId}
    LIMIT 1
  `;
  const row = existente[0];
  const agora = new Date();
  const certificadoEm =
    status === 'pendente' ? null : body.certificadoEm ? new Date(body.certificadoEm) : agora;
  const certificadoPorUsuarioId = status === 'pendente' ? null : usuarioId;

  const payload = {
    scoreDeclarado: body.scoreDeclarado != null ? Number(body.scoreDeclarado) : row?.scoreDeclarado ?? null,
    scoreComTeto: body.scoreComTeto != null ? Number(body.scoreComTeto) : row?.scoreComTeto ?? null,
    scoreCertificado: status === 'pendente' ? null : scoreCertificado,
    status,
    confianca: status === 'pendente' ? null : confianca,
    evidenciasResumo: body.evidenciasResumo != null ? String(body.evidenciasResumo).trim() : null,
    observacaoConsultor:
      body.observacaoConsultor != null ? String(body.observacaoConsultor).trim() : null,
    certificadoPorUsuarioId,
    certificadoEm
  };

  if (row) {
    await prisma.$executeRaw`
      UPDATE "ProjetoDimensaoCertificacao"
      SET
        "scoreDeclarado" = ${payload.scoreDeclarado},
        "scoreComTeto" = ${payload.scoreComTeto},
        "scoreCertificado" = ${payload.scoreCertificado},
        "status" = ${payload.status},
        "confianca" = ${payload.confianca},
        "evidenciasResumo" = ${payload.evidenciasResumo},
        "observacaoConsultor" = ${payload.observacaoConsultor},
        "certificadoPorUsuarioId" = ${payload.certificadoPorUsuarioId},
        "certificadoEm" = ${payload.certificadoEm},
        "updatedAt" = ${agora}
      WHERE "projetoId" = ${projetoId} AND "areaId" = ${areaId}
    `;
  } else {
    await prisma.$executeRaw`
      INSERT INTO "ProjetoDimensaoCertificacao" (
        "projetoId", "areaId", "scoreDeclarado", "scoreComTeto", "scoreCertificado",
        "status", "confianca", "evidenciasResumo", "observacaoConsultor",
        "certificadoPorUsuarioId", "certificadoEm", "updatedAt"
      ) VALUES (
        ${projetoId}, ${areaId}, ${payload.scoreDeclarado}, ${payload.scoreComTeto},
        ${payload.scoreCertificado}, ${payload.status}, ${payload.confianca},
        ${payload.evidenciasResumo}, ${payload.observacaoConsultor},
        ${payload.certificadoPorUsuarioId}, ${payload.certificadoEm}, ${agora}
      )
    `;
  }

  const mapa = await carregarCertificacoesPorProjeto(prisma, projetoId);
  return mapa.get(areaId);
}

export async function enriquecerScoresDashboardSatf(
  prisma,
  projetoId,
  avaliacoesFinalizadas,
  scoresPorAreaTodas,
  dimensoesConfig
) {
  const { frameworkMaturidade } = await carregarFrameworkProjeto(prisma, projetoId);
  if (frameworkMaturidade !== FRAMEWORK_SATF_TI_V3) {
    return null;
  }

  const todasAreaIds = scoresPorAreaTodas.map((a) => a.areaId);
  const comSatf = scoresPorAreaTodas.map((item) => {
    const { scoreDeclarado, scoreComTeto } = scoresAreaSatfDeclaradoETeto(
      avaliacoesFinalizadas,
      item.areaId,
      todasAreaIds,
      areaContaParaAvaliacao
    );
    return {
      ...item,
      scoreDeclarado,
      scoreComTeto
    };
  });

  const certMap = await carregarCertificacoesPorProjeto(prisma, projetoId);
  return aplicarCertificacaoAosScores(comSatf, certMap);
}

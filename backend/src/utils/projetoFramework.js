/**
 * Framework de maturidade por projeto (Blueprint 16 vs SATF TI).
 * Persistência via raw SQL — mesmo padrão de ProjetoContexto / ProjetoDimensaoConfig.
 */
import {
  FRAMEWORK_BLUEPRINT_16,
  normalizarFrameworkMaturidade,
  policyFramework
} from '../constants/frameworkMaturidadePolicy.js';

let schemaReady = false;

export async function ensureProjetoFrameworkSchema(prisma) {
  if (schemaReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProjetoFramework" (
      "projetoId" INTEGER PRIMARY KEY,
      "frameworkMaturidade" TEXT NOT NULL DEFAULT 'BLUEPRINT_16',
      "frameworkTravadoEm" TIMESTAMP(3),
      "setorRegulado" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Projetos legados sem linha → Blueprint 16
  await prisma.$executeRawUnsafe(`
    INSERT INTO "ProjetoFramework" ("projetoId", "frameworkMaturidade")
    SELECT p."id", 'BLUEPRINT_16'
    FROM "Projeto" p
    WHERE NOT EXISTS (
      SELECT 1 FROM "ProjetoFramework" pf WHERE pf."projetoId" = p."id"
    )
  `);

  // Travar projetos que já têm respostas salvas
  await prisma.$executeRawUnsafe(`
    UPDATE "ProjetoFramework" pf
    SET "frameworkTravadoEm" = COALESCE(pf."frameworkTravadoEm", CURRENT_TIMESTAMP),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE pf."frameworkTravadoEm" IS NULL
      AND pf."projetoId" IN (
        SELECT DISTINCT a."projetoId"
        FROM "Avaliacao" a
        INNER JOIN "Resposta" r ON r."avaliacaoId" = a."id"
        WHERE r."pontuacao" IS NOT NULL
           OR r."semInformacao" = true
           OR (r."observacoes" IS NOT NULL AND TRIM(r."observacoes") <> '')
      )
  `);

  schemaReady = true;
}

function mapRow(row) {
  if (!row) {
    return {
      frameworkMaturidade: FRAMEWORK_BLUEPRINT_16,
      frameworkTravadoEm: null,
      frameworkTravado: false,
      setorRegulado: false
    };
  }
  return {
    frameworkMaturidade: normalizarFrameworkMaturidade(row.frameworkMaturidade),
    frameworkTravadoEm: row.frameworkTravadoEm || null,
    frameworkTravado: Boolean(row.frameworkTravadoEm),
    setorRegulado: row.setorRegulado === true
  };
}

export async function carregarFrameworkProjeto(prisma, projetoId) {
  await ensureProjetoFrameworkSchema(prisma);
  const rows = await prisma.$queryRaw`
    SELECT "projetoId", "frameworkMaturidade", "frameworkTravadoEm", "setorRegulado"
    FROM "ProjetoFramework"
    WHERE "projetoId" = ${projetoId}
  `;
  return mapRow(rows[0]);
}

export async function salvarFrameworkProjeto(
  prisma,
  projetoId,
  { frameworkMaturidade, setorRegulado } = {}
) {
  await ensureProjetoFrameworkSchema(prisma);
  const atual = await carregarFrameworkProjeto(prisma, projetoId);
  const fw = frameworkMaturidade != null
    ? normalizarFrameworkMaturidade(frameworkMaturidade)
    : atual.frameworkMaturidade;
  const regulado = setorRegulado != null ? Boolean(setorRegulado) : atual.setorRegulado;

  if (
    frameworkMaturidade != null &&
    fw !== atual.frameworkMaturidade &&
    atual.frameworkTravado
  ) {
    const err = new Error(
      'O framework de maturidade não pode ser alterado após o início das avaliações.'
    );
    err.status = 400;
    throw err;
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO "ProjetoFramework"
       ("projetoId", "frameworkMaturidade", "setorRegulado", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT ("projetoId") DO UPDATE SET
       "frameworkMaturidade" = EXCLUDED."frameworkMaturidade",
       "setorRegulado" = EXCLUDED."setorRegulado",
       "updatedAt" = CURRENT_TIMESTAMP`,
    projetoId,
    fw,
    regulado
  );

  return carregarFrameworkProjeto(prisma, projetoId);
}

export async function travarFrameworkProjeto(prisma, projetoId) {
  await ensureProjetoFrameworkSchema(prisma);
  await prisma.$executeRawUnsafe(
    `UPDATE "ProjetoFramework"
     SET "frameworkTravadoEm" = COALESCE("frameworkTravadoEm", CURRENT_TIMESTAMP),
         "updatedAt" = CURRENT_TIMESTAMP
     WHERE "projetoId" = $1`,
    projetoId
  );
}

/** Trava ao salvar a primeira resposta com conteúdo (nota, sem info ou observação). */
export async function travarFrameworkSeRespostasSalvas(prisma, projetoId, respostas = []) {
  const temConteudo = (respostas || []).some((r) => {
    if (!r) return false;
    if (r.semInformacao === true) return true;
    if (r.pontuacao != null && r.pontuacao !== '') return true;
    return String(r.observacoes || '').trim().length > 0;
  });
  if (temConteudo) {
    await travarFrameworkProjeto(prisma, projetoId);
  }
}

export function anexarFrameworkAoProjeto(projeto, frameworkRow) {
  if (!projeto) return projeto;
  const fw = mapRow(frameworkRow);
  const policy = policyFramework(fw.frameworkMaturidade);
  return {
    ...projeto,
    ...fw,
    frameworkLabel: policy.label,
    frameworkShortLabel: policy.shortLabel
  };
}

export async function enriquecerProjetoComFramework(prisma, projeto) {
  if (!projeto?.id) return projeto;
  const fw = await carregarFrameworkProjeto(prisma, projeto.id);
  return anexarFrameworkAoProjeto(projeto, fw);
}

export async function enriquecerProjetosComFramework(prisma, projetos) {
  if (!Array.isArray(projetos) || projetos.length === 0) return projetos;
  await ensureProjetoFrameworkSchema(prisma);
  const ids = projetos.map((p) => Number(p.id)).filter((id) => id > 0);
  if (ids.length === 0) return projetos;
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "projetoId", "frameworkMaturidade", "frameworkTravadoEm", "setorRegulado"
     FROM "ProjetoFramework"
     WHERE "projetoId" = ANY($1::int[])`,
    ids
  );
  const porId = new Map(rows.map((r) => [Number(r.projetoId), r]));
  return projetos.map((p) => anexarFrameworkAoProjeto(p, porId.get(p.id)));
}

export function extrairCamposFrameworkDoBody(body = {}) {
  const out = {};
  if (Object.prototype.hasOwnProperty.call(body, 'frameworkMaturidade')) {
    out.frameworkMaturidade = body.frameworkMaturidade;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'setorRegulado')) {
    out.setorRegulado = body.setorRegulado;
  }
  return out;
}

export function removerCamposFrameworkDoBody(body = {}) {
  const { frameworkMaturidade, setorRegulado, ...rest } = body;
  return rest;
}

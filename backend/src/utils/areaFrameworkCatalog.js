/**
 * Catálogo de dimensões (Area) por framework de maturidade.
 * Produção: colunas runtime em Area + seed SQL.
 * Dev/local sem ALTER: seed via Prisma e filtro por nomes canônicos.
 */
import { Prisma } from '@prisma/client';
import { SATF_FRAMEWORK_SEED, ORDEM_NOMES_SATF } from '../data/satfFrameworkSeed.js';
import {
  FRAMEWORK_BLUEPRINT_16,
  FRAMEWORK_SATF_TI_V3,
  normalizarFrameworkMaturidade
} from '../constants/frameworkMaturidadePolicy.js';
import { ORDEM_DIMENSOES_FRAMEWORK } from './ordemDimensoesFramework.js';
import { carregarFrameworkProjeto } from './projetoFramework.js';

let schemaReady = false;
let frameworkColumnDisponivelCache = null;

const NOMES_BLUEPRINT = new Set(ORDEM_DIMENSOES_FRAMEWORK);
const NOMES_SATF = new Set(ORDEM_NOMES_SATF);
const SATF_META_POR_NOME = new Map(SATF_FRAMEWORK_SEED.map((d) => [d.nome, d]));
const EVIDENCIA_ESPERADA_POR_NOME_NUMERO = new Map(
  SATF_FRAMEWORK_SEED.flatMap((dim) =>
    dim.perguntas.map((p) => [`${dim.nome}|${p.numero}`, p.evidenciaEsperada])
  )
);

function anexarEvidenciaEsperadaNasPerguntas(area, evidenciaPorId = new Map()) {
  if (!area.perguntas?.length) return area;
  return {
    ...area,
    perguntas: area.perguntas.map((p) => ({
      ...p,
      evidenciaEsperada:
        evidenciaPorId.get(p.id) ??
        EVIDENCIA_ESPERADA_POR_NOME_NUMERO.get(`${area.nome}|${p.numero}`) ??
        null
    }))
  };
}

async function carregarEvidenciaEsperadaPorPerguntaId(prisma, perguntaIds) {
  const mapa = new Map();
  if (!perguntaIds.length) return mapa;
  try {
    const rows = await prisma.$queryRaw`
      SELECT id, "evidenciaEsperada"
      FROM "Pergunta"
      WHERE id IN (${Prisma.join(perguntaIds)})
    `;
    for (const row of rows) {
      mapa.set(Number(row.id), row.evidenciaEsperada ?? null);
    }
  } catch {
    /* coluna evidenciaEsperada pode não existir */
  }
  return mapa;
}

const AREA_INCLUDE_PERGUNTAS = {
  perguntas: { orderBy: { numero: 'asc' } }
};

async function enriquecerAreasComEvidencia(prisma, areas) {
  const ids = areas.flatMap((a) => (a.perguntas || []).map((p) => p.id));
  const evidenciaPorId = await carregarEvidenciaEsperadaPorPerguntaId(prisma, ids);
  return areas.map((area) => anexarEvidenciaEsperadaNasPerguntas(area, evidenciaPorId));
}

async function listarAreasEnriquecidas(prisma, areas, framework) {
  const comMeta = areas.map((a) => anexarMetaArea(a, framework));
  return enriquecerAreasComEvidencia(prisma, comMeta);
}

async function colunaFrameworkDisponivel(prisma) {
  if (frameworkColumnDisponivelCache !== null) return frameworkColumnDisponivelCache;
  try {
    await prisma.$queryRaw`SELECT "frameworkMaturidade" FROM "Area" LIMIT 1`;
    frameworkColumnDisponivelCache = true;
  } catch {
    frameworkColumnDisponivelCache = false;
  }
  return frameworkColumnDisponivelCache;
}

function anexarMetaArea(area, framework) {
  const fw = normalizarFrameworkMaturidade(framework);
  const satf = SATF_META_POR_NOME.get(area.nome);
  return {
    ...area,
    frameworkMaturidade: fw,
    codigoFramework: satf?.codigoFramework ?? area.codigoFramework ?? null,
    tipoDimensao: satf?.tipoDimensao ?? area.tipoDimensao ?? 'nucleo'
  };
}

export async function ensureAreaFrameworkSchema(prisma) {
  if (schemaReady) return;

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Area"
        ADD COLUMN IF NOT EXISTS "frameworkMaturidade" TEXT NOT NULL DEFAULT 'BLUEPRINT_16';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Area"
        ADD COLUMN IF NOT EXISTS "codigoFramework" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Area"
        ADD COLUMN IF NOT EXISTS "tipoDimensao" TEXT NOT NULL DEFAULT 'nucleo';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Pergunta"
        ADD COLUMN IF NOT EXISTS "evidenciaEsperada" TEXT;
    `);

    await prisma.$executeRawUnsafe(`
      UPDATE "Area"
      SET "frameworkMaturidade" = 'BLUEPRINT_16',
          "tipoDimensao" = COALESCE(NULLIF("tipoDimensao", ''), 'nucleo')
      WHERE "frameworkMaturidade" IS NULL
         OR "frameworkMaturidade" = ''
         OR ("codigoFramework" IS NULL AND "frameworkMaturidade" = 'BLUEPRINT_16');
    `);

    await prisma.$executeRawUnsafe(`
      UPDATE "Area" a
      SET "codigoFramework" = 'BP' || LPAD(a.ordem::text, 2, '0')
      WHERE a."frameworkMaturidade" = 'BLUEPRINT_16'
        AND (a."codigoFramework" IS NULL OR a."codigoFramework" = '');
    `);

    schemaReady = true;
    frameworkColumnDisponivelCache = true;
  } catch (error) {
    console.warn('[schema] Area.frameworkMaturidade:', error?.message || error);
    frameworkColumnDisponivelCache = false;
  }
}

async function contarAreasSatf(prisma) {
  if (await colunaFrameworkDisponivel(prisma)) {
    try {
      const rows = await prisma.$queryRaw`
        SELECT COUNT(*)::int AS total
        FROM "Area"
        WHERE "frameworkMaturidade" = ${FRAMEWORK_SATF_TI_V3}
      `;
      return Number(rows?.[0]?.total ?? 0);
    } catch {
      /* fallback por nome */
    }
  }
  return prisma.area.count({
    where: { nome: { in: [...ORDEM_NOMES_SATF] } }
  });
}

async function seedSatfViaPrisma(prisma) {
  let areasCriadas = 0;
  let perguntasCriadas = 0;

  for (const dim of SATF_FRAMEWORK_SEED) {
    let area = await prisma.area.findUnique({ where: { nome: dim.nome } });
    if (!area) {
      area = await prisma.area.create({
        data: {
          nome: dim.nome,
          descricao: dim.descricao,
          ordem: dim.ordem,
          peso: dim.peso
        }
      });
      areasCriadas += 1;
    }

    const perguntasExistentes = await prisma.pergunta.count({ where: { areaId: area.id } });
    if (perguntasExistentes > 0) continue;

    for (const pergunta of dim.perguntas) {
      await prisma.pergunta.create({
        data: {
          texto: pergunta.texto,
          criterios: pergunta.criterios,
          numero: pergunta.numero,
          areaId: area.id
        }
      });
      perguntasCriadas += 1;
    }
  }

  return { seeded: areasCriadas > 0 || perguntasCriadas > 0, areasCriadas, perguntasCriadas, mode: 'prisma' };
}

async function seedSatfViaSql(prisma) {
  let areasCriadas = 0;
  let perguntasCriadas = 0;

  for (const dim of SATF_FRAMEWORK_SEED) {
    const areaRows = await prisma.$queryRaw`
      INSERT INTO "Area" (nome, descricao, ordem, peso, "frameworkMaturidade", "codigoFramework", "tipoDimensao")
      VALUES (
        ${dim.nome},
        ${dim.descricao},
        ${dim.ordem},
        ${dim.peso},
        ${FRAMEWORK_SATF_TI_V3},
        ${dim.codigoFramework},
        ${dim.tipoDimensao}
      )
      ON CONFLICT (nome) DO NOTHING
      RETURNING id
    `;

    let areaId = Number(areaRows?.[0]?.id);
    if (!areaId) {
      const found = await prisma.area.findUnique({ where: { nome: dim.nome }, select: { id: true } });
      areaId = found?.id;
    }
    if (!areaId) continue;
    if (areaRows?.[0]?.id) areasCriadas += 1;

    const existentes = await prisma.pergunta.count({ where: { areaId } });
    if (existentes > 0) continue;

    for (const pergunta of dim.perguntas) {
      await prisma.$executeRaw`
        INSERT INTO "Pergunta" (texto, criterios, numero, "areaId", "evidenciaEsperada")
        VALUES (
          ${pergunta.texto},
          ${pergunta.criterios},
          ${pergunta.numero},
          ${areaId},
          ${pergunta.evidenciaEsperada ?? null}
        )
      `;
      perguntasCriadas += 1;
    }
  }

  return { seeded: areasCriadas > 0 || perguntasCriadas > 0, areasCriadas, perguntasCriadas, mode: 'sql' };
}

async function syncSatfPerguntasFromSeed(prisma) {
  let atualizadas = 0;
  let inseridas = 0;

  for (const dim of SATF_FRAMEWORK_SEED) {
    const area = await prisma.area.findUnique({ where: { nome: dim.nome }, select: { id: true } });
    if (!area) continue;

    for (const pergunta of dim.perguntas) {
      const existente = await prisma.pergunta.findFirst({
        where: { areaId: area.id, numero: pergunta.numero },
        select: { id: true }
      });

      if (existente) {
        await prisma.pergunta.update({
          where: { id: existente.id },
          data: { texto: pergunta.texto, criterios: pergunta.criterios }
        });
        try {
          await prisma.$executeRaw`
            UPDATE "Pergunta"
            SET "evidenciaEsperada" = ${pergunta.evidenciaEsperada ?? null}
            WHERE id = ${existente.id}
          `;
        } catch {
          /* coluna evidenciaEsperada pode não existir */
        }
        atualizadas += 1;
        continue;
      }

      const criada = await prisma.pergunta.create({
        data: {
          texto: pergunta.texto,
          criterios: pergunta.criterios,
          numero: pergunta.numero,
          areaId: area.id
        }
      });
      try {
        await prisma.$executeRaw`
          UPDATE "Pergunta"
          SET "evidenciaEsperada" = ${pergunta.evidenciaEsperada ?? null}
          WHERE id = ${criada.id}
        `;
      } catch {
        /* coluna evidenciaEsperada pode não existir */
      }
      inseridas += 1;
    }
  }

  return { atualizadas, inseridas };
}

/** Garante as 11 dimensões canônicas SATF por nome (não só contagem no banco). */
async function alinharAreasSatfCanonicas(prisma) {
  let criadas = 0;
  let atualizadas = 0;
  const hasFrameworkCol = await colunaFrameworkDisponivel(prisma);

  for (const dim of SATF_FRAMEWORK_SEED) {
    const area = await prisma.area.findUnique({ where: { nome: dim.nome } });
    if (!area) {
      if (hasFrameworkCol) {
        const areaRows = await prisma.$queryRaw`
          INSERT INTO "Area" (nome, descricao, ordem, peso, "frameworkMaturidade", "codigoFramework", "tipoDimensao")
          VALUES (
            ${dim.nome},
            ${dim.descricao},
            ${dim.ordem},
            ${dim.peso},
            ${FRAMEWORK_SATF_TI_V3},
            ${dim.codigoFramework},
            ${dim.tipoDimensao}
          )
          ON CONFLICT (nome) DO NOTHING
          RETURNING id
        `;
        if (!areaRows?.[0]?.id) {
          await prisma.$executeRaw`
            UPDATE "Area"
            SET "frameworkMaturidade" = ${FRAMEWORK_SATF_TI_V3},
                "codigoFramework" = ${dim.codigoFramework},
                "tipoDimensao" = ${dim.tipoDimensao},
                ordem = ${dim.ordem},
                descricao = ${dim.descricao},
                peso = ${dim.peso}
            WHERE nome = ${dim.nome}
          `;
          atualizadas += 1;
        } else {
          criadas += 1;
        }
      } else {
        await prisma.area.create({
          data: {
            nome: dim.nome,
            descricao: dim.descricao,
            ordem: dim.ordem,
            peso: dim.peso
          }
        });
        criadas += 1;
      }
      continue;
    }

    if (hasFrameworkCol) {
      const precisaAtualizar =
        area.frameworkMaturidade !== FRAMEWORK_SATF_TI_V3 ||
        area.codigoFramework !== dim.codigoFramework ||
        area.tipoDimensao !== dim.tipoDimensao ||
        area.ordem !== dim.ordem;
      if (precisaAtualizar) {
        await prisma.$executeRaw`
          UPDATE "Area"
          SET "frameworkMaturidade" = ${FRAMEWORK_SATF_TI_V3},
              "codigoFramework" = ${dim.codigoFramework},
              "tipoDimensao" = ${dim.tipoDimensao},
              ordem = ${dim.ordem},
              descricao = ${dim.descricao},
              peso = ${dim.peso}
          WHERE id = ${area.id}
        `;
        atualizadas += 1;
      }
    }
  }

  const sync = await syncSatfPerguntasFromSeed(prisma);
  return { criadas, atualizadas, sync };
}

export async function ensureSatfFrameworkSeed(prisma) {
  await ensureAreaFrameworkSchema(prisma);

  const alinhamento = await alinharAreasSatfCanonicas(prisma);
  const total = await contarAreasSatf(prisma);
  if (total >= SATF_FRAMEWORK_SEED.length) {
    return {
      seeded: alinhamento.criadas > 0,
      reason: alinhamento.criadas > 0 ? 'aligned_missing' : 'already_exists',
      total,
      ...alinhamento
    };
  }

  let result;
  if (await colunaFrameworkDisponivel(prisma)) {
    try {
      result = await seedSatfViaSql(prisma);
    } catch (error) {
      console.warn('[schema] SATF seed SQL:', error?.message || error);
    }
  }

  if (!result) {
    result = await seedSatfViaPrisma(prisma);
  }

  const posAlinhamento = await alinharAreasSatfCanonicas(prisma);
  const totalFinal = await contarAreasSatf(prisma);
  return { ...result, ...posAlinhamento, total: totalFinal };
}

async function listarAreasPorNomes(prisma, nomesSet, framework, options = {}) {
  const { includePerguntas = true } = options;
  const areas = await prisma.area.findMany({
    where: { nome: { in: [...nomesSet] } },
    include: includePerguntas ? AREA_INCLUDE_PERGUNTAS : undefined,
    orderBy: { ordem: 'asc' }
  });
  if (!includePerguntas) {
    return areas.map((a) => anexarMetaArea(a, framework));
  }
  return listarAreasEnriquecidas(prisma, areas, framework);
}

export async function listarAreasPorFramework(prisma, frameworkMaturidade, options = {}) {
  await ensureAreaFrameworkSchema(prisma);

  const framework = normalizarFrameworkMaturidade(frameworkMaturidade);
  const { includePerguntas = true } = options;

  if (!(await colunaFrameworkDisponivel(prisma))) {
    const nomes = framework === FRAMEWORK_SATF_TI_V3 ? NOMES_SATF : NOMES_BLUEPRINT;
    return listarAreasPorNomes(prisma, nomes, framework, options);
  }

  let metaRows = [];
  try {
    metaRows = await prisma.$queryRaw`
      SELECT id, "frameworkMaturidade", "codigoFramework", "tipoDimensao"
      FROM "Area"
      WHERE "frameworkMaturidade" = ${framework}
      ORDER BY ordem ASC
    `;
  } catch {
    const nomes = framework === FRAMEWORK_SATF_TI_V3 ? NOMES_SATF : NOMES_BLUEPRINT;
    return listarAreasPorNomes(prisma, nomes, framework, options);
  }

  if (metaRows.length === 0 && framework === FRAMEWORK_SATF_TI_V3) {
    await ensureSatfFrameworkSeed(prisma);
    return listarAreasPorFramework(prisma, framework, options);
  }

  const ids = metaRows.map((r) => Number(r.id));
  if (ids.length === 0) return [];

  const areas = await prisma.area.findMany({
    where: { id: { in: ids } },
    include: includePerguntas ? AREA_INCLUDE_PERGUNTAS : undefined,
    orderBy: { ordem: 'asc' }
  });

  const metaMap = new Map(metaRows.map((r) => [Number(r.id), r]));
  const comMeta = areas.map((a) => ({
    ...a,
    frameworkMaturidade: metaMap.get(a.id)?.frameworkMaturidade || framework,
    codigoFramework: metaMap.get(a.id)?.codigoFramework || null,
    tipoDimensao: metaMap.get(a.id)?.tipoDimensao || 'nucleo'
  }));

  if (framework === FRAMEWORK_SATF_TI_V3) {
    const presentes = new Set(comMeta.map((a) => a.nome));
    const faltando = ORDEM_NOMES_SATF.filter((n) => !presentes.has(n));
    if (faltando.length > 0) {
      console.warn(
        `[SATF] Dimensões canônicas ausentes no catálogo (${faltando.join(', ')}) — realinhando seed.`
      );
      await ensureSatfFrameworkSeed(prisma);
      return listarAreasPorFramework(prisma, framework, options);
    }
  }

  if (!includePerguntas) return comMeta;
  return enriquecerAreasComEvidencia(prisma, comMeta);
}

export async function listarAreasDoProjeto(prisma, projetoId, options = {}) {
  const { frameworkMaturidade } = await carregarFrameworkProjeto(prisma, projetoId);
  return listarAreasPorFramework(prisma, frameworkMaturidade, options);
}

export async function idsAreasDoFramework(prisma, frameworkMaturidade) {
  const areas = await listarAreasPorFramework(prisma, frameworkMaturidade, { includePerguntas: false });
  return areas.map((a) => a.id);
}

export async function idsAreasDoProjeto(prisma, projetoId) {
  const areas = await listarAreasDoProjeto(prisma, projetoId, { includePerguntas: false });
  return areas.map((a) => a.id);
}

export function areaPertenceAoFramework(area, frameworkMaturidade) {
  const framework = normalizarFrameworkMaturidade(frameworkMaturidade);
  if (area?.frameworkMaturidade) {
    return area.frameworkMaturidade === framework;
  }
  const nome = String(area?.nome || '').trim();
  if (framework === FRAMEWORK_SATF_TI_V3) return NOMES_SATF.has(nome);
  return NOMES_BLUEPRINT.has(nome);
}

import { prisma } from '../lib/prisma.js';
import { ensureAssistenteSchema } from './assistenteSchema.js';

export const TOMS_ASSISTENTE = ['curto', 'medio', 'longo'];
export const FRAMEWORKS_FAVORITOS_ASSISTENTE = ['blueprint16', 'satf', null];

export function normalizarTomAssistente(raw) {
  const t = String(raw || 'medio')
    .trim()
    .toLowerCase();
  if (t === 'curto' || t === 'short') return 'curto';
  if (t === 'longo' || t === 'long') return 'longo';
  return 'medio';
}

export function normalizarFrameworkFavoritoAssistente(raw) {
  if (raw == null || raw === '') return null;
  const f = String(raw).trim().toLowerCase();
  if (f === 'satf' || f === 'satf_ti_v3' || f === 'satf-ti') return 'satf';
  if (
    f === 'blueprint16' ||
    f === 'blueprint_16' ||
    f === 'blueprint' ||
    f === 'mit' ||
    f === 'blueprints16'
  ) {
    return 'blueprint16';
  }
  return null;
}

function parseIdOpcional(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

function mapPreferencia(row) {
  if (!row) {
    return {
      projetoPadraoId: null,
      unidadePadraoId: null,
      frameworkFavorito: null,
      tom: 'medio'
    };
  }
  return {
    projetoPadraoId: row.projetoPadraoId != null ? Number(row.projetoPadraoId) : null,
    unidadePadraoId: row.unidadePadraoId != null ? Number(row.unidadePadraoId) : null,
    frameworkFavorito: normalizarFrameworkFavoritoAssistente(row.frameworkFavorito),
    tom: normalizarTomAssistente(row.tom)
  };
}

export async function obterPreferenciasAssistente(usuarioId) {
  await ensureAssistenteSchema();
  const uid = Number(usuarioId);
  if (!Number.isFinite(uid) || uid <= 0) {
    return mapPreferencia(null);
  }
  try {
    const row = await prisma.assistentePreferencia.findUnique({ where: { usuarioId: uid } });
    return mapPreferencia(row);
  } catch (e) {
    // Tabela pode existir só via ensure (raw); fallback SQL
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT "projetoPadraoId", "unidadePadraoId", "frameworkFavorito", "tom"
         FROM "AssistentePreferencia" WHERE "usuarioId" = $1 LIMIT 1`,
        uid
      );
      return mapPreferencia(rows?.[0] || null);
    } catch {
      console.warn('[Assistente prefs] leitura:', e.message);
      return mapPreferencia(null);
    }
  }
}

export async function salvarPreferenciasAssistente(usuarioId, data = {}) {
  await ensureAssistenteSchema();
  const uid = Number(usuarioId);
  if (!Number.isFinite(uid) || uid <= 0) {
    const err = new Error('Usuário inválido');
    err.status = 400;
    throw err;
  }

  const atual = await obterPreferenciasAssistente(uid);
  const next = {
    projetoPadraoId:
      data.projetoPadraoId !== undefined
        ? parseIdOpcional(data.projetoPadraoId)
        : atual.projetoPadraoId,
    unidadePadraoId:
      data.unidadePadraoId !== undefined
        ? parseIdOpcional(data.unidadePadraoId)
        : atual.unidadePadraoId,
    frameworkFavorito:
      data.frameworkFavorito !== undefined
        ? normalizarFrameworkFavoritoAssistente(data.frameworkFavorito)
        : atual.frameworkFavorito,
    tom: data.tom !== undefined ? normalizarTomAssistente(data.tom) : atual.tom
  };

  try {
    const row = await prisma.assistentePreferencia.upsert({
      where: { usuarioId: uid },
      create: {
        usuarioId: uid,
        projetoPadraoId: next.projetoPadraoId,
        unidadePadraoId: next.unidadePadraoId,
        frameworkFavorito: next.frameworkFavorito,
        tom: next.tom
      },
      update: {
        projetoPadraoId: next.projetoPadraoId,
        unidadePadraoId: next.unidadePadraoId,
        frameworkFavorito: next.frameworkFavorito,
        tom: next.tom
      }
    });
    return mapPreferencia(row);
  } catch (e) {
    // Fallback se o client Prisma ainda não conhece o model (antes do generate)
    await prisma.$executeRawUnsafe(
      `INSERT INTO "AssistentePreferencia"
        ("usuarioId", "projetoPadraoId", "unidadePadraoId", "frameworkFavorito", "tom", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("usuarioId") DO UPDATE SET
         "projetoPadraoId" = EXCLUDED."projetoPadraoId",
         "unidadePadraoId" = EXCLUDED."unidadePadraoId",
         "frameworkFavorito" = EXCLUDED."frameworkFavorito",
         "tom" = EXCLUDED."tom",
         "updatedAt" = CURRENT_TIMESTAMP`,
      uid,
      next.projetoPadraoId,
      next.unidadePadraoId,
      next.frameworkFavorito,
      next.tom
    );
    return next;
  }
}

export function instrucaoTomNoPrompt(tom) {
  const t = normalizarTomAssistente(tom);
  if (t === 'curto') {
    return '## Preferência de tom\nRespostas **curtas e diretas** (poucos parágrafos; bullets quando couber).';
  }
  if (t === 'longo') {
    return '## Preferência de tom\nRespostas **mais detalhadas**, com contexto, passos e exemplos quando útil.';
  }
  return '## Preferência de tom\nTom **equilibrado**: claro, completo sem prolixidade.';
}

export function instrucaoFrameworkFavoritoNoPrompt(frameworkFavorito) {
  const f = normalizarFrameworkFavoritoAssistente(frameworkFavorito);
  if (f === 'satf') {
    return '## Framework favorito do usuário\nPreferir taxonomia e exemplos **SATF TI v3 (D1–D11)** quando a pergunta for ambígua entre Blueprint 16 e SATF.';
  }
  if (f === 'blueprint16') {
    return '## Framework favorito do usuário\nPreferir taxonomia e exemplos do **Blueprint 16 (MIT CISR)** quando a pergunta for ambígua entre Blueprint e SATF.';
  }
  return '';
}

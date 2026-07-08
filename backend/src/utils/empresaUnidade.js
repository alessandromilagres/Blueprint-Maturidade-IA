/**
 * Unidades organizacionais da empresa (área de trabalho) — distinto de `Area` (dimensão do framework).
 */
import { prisma } from '../lib/prisma.js';

export const UNIDADE_GERAL_CODIGO = 'GERAL';
export const UNIDADE_GERAL_NOME = 'Geral';
export const UNIDADE_GERAL_DESCRICAO =
  'Consolidado enterprise — todos os colaboradores sem unidade específica ou vinculados explicitamente a Geral.';

/** Templates sugeridos de dimensões em foco (códigos SATF). */
export const TEMPLATES_DIMENSOES_FOCO_UNIDADE = {
  engenharia: ['D4', 'D5', 'D10'],
  plataforma: ['D5', 'D6', 'D7'],
  governanca: ['D2', 'D11'],
  pessoas: ['D3'],
  negocios: ['D1', 'D9'],
  geral: null
};

export function normalizarCodigoUnidade(codigo, nome) {
  const raw = String(codigo || nome || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 32);
  return raw || 'UNIDADE';
}

export function parseDimensoesFocoJson(valor) {
  if (valor == null || valor === '') return null;
  if (Array.isArray(valor)) {
    const arr = valor.map((x) => String(x).trim().toUpperCase()).filter(Boolean);
    return arr.length ? arr : null;
  }
  try {
    const parsed = JSON.parse(String(valor));
    if (!Array.isArray(parsed)) return null;
    const arr = parsed.map((x) => String(x).trim().toUpperCase()).filter(Boolean);
    return arr.length ? arr : null;
  } catch {
    return null;
  }
}

export function serializarDimensoesFoco(dimensoesFoco) {
  const arr = parseDimensoesFocoJson(dimensoesFoco);
  return arr ? JSON.stringify(arr) : null;
}

export function mapUnidadeEmpresaResponse(row) {
  if (!row) return null;
  const usuarioCount =
    row._count?.usuarios != null
      ? row._count.usuarios
      : row.usuarioCount != null
        ? row.usuarioCount
        : 0;
  return {
    ...row,
    dimensoesFoco: parseDimensoesFocoJson(row.dimensoesFoco),
    usuarioCount
  };
}

export async function ensureUnidadeEmpresaSchema() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UnidadeEmpresa" (
        "id" SERIAL PRIMARY KEY,
        "empresaId" INTEGER NOT NULL,
        "nome" TEXT NOT NULL,
        "codigo" TEXT NOT NULL DEFAULT '',
        "descricao" TEXT,
        "dimensoesFoco" TEXT,
        "ehPadrao" BOOLEAN NOT NULL DEFAULT false,
        "ordem" INTEGER NOT NULL DEFAULT 0,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(
      'CREATE UNIQUE INDEX IF NOT EXISTS "UnidadeEmpresa_empresaId_codigo_key" ON "UnidadeEmpresa" ("empresaId", "codigo")'
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "UnidadeEmpresa_empresaId_ativo_idx" ON "UnidadeEmpresa" ("empresaId", "ativo")'
    );
    console.log('[schema] UnidadeEmpresa tabela verificada.');
  } catch (e) {
    console.warn('[schema] UnidadeEmpresa tabela:', e?.message || e);
  }
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "empresaUnidadeId" INTEGER'
    );
    console.log('[schema] Usuario.empresaUnidadeId verificada.');
  } catch (e) {
    console.warn(
      '[schema] Usuario.empresaUnidadeId:',
      e?.message || e,
      '— use backend/scripts/fix-usuario-empresa-unidade-id.sql como owner do banco.'
    );
  }
}

/**
 * Garante unidade "Geral" para uma empresa. Idempotente.
 * @returns {Promise<object|null>}
 */
export async function garantirUnidadeGeralEmpresa(empresaId) {
  const eid = parseInt(empresaId, 10);
  if (!Number.isFinite(eid) || eid <= 0) return null;

  const existente = await prisma.unidadeEmpresa.findFirst({
    where: { empresaId: eid, ehPadrao: true }
  });
  if (existente) return existente;

  const porCodigo = await prisma.unidadeEmpresa.findFirst({
    where: { empresaId: eid, codigo: UNIDADE_GERAL_CODIGO }
  });
  if (porCodigo) {
    if (!porCodigo.ehPadrao) {
      return prisma.unidadeEmpresa.update({
        where: { id: porCodigo.id },
        data: { ehPadrao: true, nome: UNIDADE_GERAL_NOME }
      });
    }
    return porCodigo;
  }

  return prisma.unidadeEmpresa.create({
    data: {
      empresaId: eid,
      nome: UNIDADE_GERAL_NOME,
      codigo: UNIDADE_GERAL_CODIGO,
      descricao: UNIDADE_GERAL_DESCRICAO,
      dimensoesFoco: null,
      ehPadrao: true,
      ordem: 0,
      ativo: true
    }
  });
}

/** Backfill "Geral" para todas as empresas sem unidade padrão. */
export async function garantirUnidadeGeralTodasEmpresas() {
  const empresas = await prisma.empresa.findMany({ select: { id: true } });
  let criadas = 0;
  for (const emp of empresas) {
    const antes = await prisma.unidadeEmpresa.count({
      where: { empresaId: emp.id, ehPadrao: true }
    });
    if (antes === 0) {
      await garantirUnidadeGeralEmpresa(emp.id);
      criadas += 1;
    }
  }
  if (criadas > 0) {
    console.log(`[schema] UnidadeEmpresa: seed Geral em ${criadas} empresa(s).`);
  }
}

/** Resolve unidade efetiva do usuário (null → Geral da empresa). */
export async function resolverUnidadeEfetivaUsuario(usuario) {
  if (!usuario) return null;
  if (usuario.empresaUnidadeId) {
    return prisma.unidadeEmpresa.findUnique({ where: { id: usuario.empresaUnidadeId } });
  }
  return garantirUnidadeGeralEmpresa(usuario.empresaId);
}

/** Valida se unidade pertence à empresa e está ativa (exceto update de usuário existente). */
export async function validarUnidadeParaEmpresa(empresaUnidadeId, empresaId) {
  if (empresaUnidadeId == null || empresaUnidadeId === '') return { ok: true, unidade: null };
  const uid = parseInt(empresaUnidadeId, 10);
  const eid = parseInt(empresaId, 10);
  if (!Number.isFinite(uid) || uid <= 0) {
    return { ok: false, error: 'empresaUnidadeId inválido' };
  }
  const unidade = await prisma.unidadeEmpresa.findFirst({
    where: { id: uid, empresaId: eid, ativo: true }
  });
  if (!unidade) {
    return { ok: false, error: 'Unidade organizacional não encontrada ou inativa nesta empresa' };
  }
  return { ok: true, unidade };
}

/**
 * Query: empresaUnidadeId=<id> filtra consolidado aos avaliadores da unidade.
 * Ausente, vazio, 0 ou "todas" = todas as unidades (comportamento enterprise).
 */
export function parseFiltroEmpresaUnidadeId(req) {
  const raw =
    req.query?.empresaUnidadeId ??
    req.query?.unidadeId ??
    req.body?.empresaUnidadeId;
  if (raw === undefined || raw === null || raw === '') return null;
  const s = String(raw).trim().toLowerCase();
  if (s === '0' || s === 'todas' || s === 'all') return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** ID efetivo da unidade do usuário (null no cadastro → unidade Geral). */
export function resolverUnidadeEfetivaIdUsuario(usuario, unidadeGeralId) {
  if (!usuario) return null;
  const raw = usuario.empresaUnidadeId;
  if (raw != null && raw !== '') {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const g = Number(unidadeGeralId);
  return Number.isFinite(g) && g > 0 ? g : null;
}

export function usuarioIncluidoNoFiltroUnidadeEmpresa(usuario, filtroUnidadeId, unidadeGeralId) {
  if (filtroUnidadeId == null) return true;
  const alvo = Number(filtroUnidadeId);
  if (!Number.isFinite(alvo) || alvo <= 0) return true;
  const efetiva = resolverUnidadeEfetivaIdUsuario(usuario, unidadeGeralId);
  return efetiva === alvo;
}

export function filtrarAvaliacoesPorUnidadeEmpresa(avaliacoes, filtroUnidadeId, unidadeGeralId) {
  if (filtroUnidadeId == null) return avaliacoes;
  return (avaliacoes || []).filter((av) =>
    usuarioIncluidoNoFiltroUnidadeEmpresa(av.usuario, filtroUnidadeId, unidadeGeralId)
  );
}

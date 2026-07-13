/**
 * Unidades organizacionais da empresa (área de trabalho) — distinto de `Area` (dimensão do framework).
 */
import { prisma } from '../lib/prisma.js';

export const UNIDADE_GERAL_CODIGO = 'GERAL';
export const UNIDADE_GERAL_NOME = 'Geral';
export const UNIDADE_GERAL_DESCRICAO =
  'Consolidado enterprise — todos os colaboradores sem unidade específica ou vinculados explicitamente a Geral.';

/** Templates sugeridos — SATF TI v3 (D1–D11). */
export const TEMPLATES_DIMENSOES_FOCO_SATF = {
  engenharia: ['D4', 'D5', 'D10'],
  plataforma: ['D5', 'D6', 'D7'],
  governanca: ['D2', 'D11'],
  governanca_operacional: ['D1', 'D3', 'D4', 'D7'],
  pessoas: ['D3'],
  negocios: ['D1', 'D9'],
  geral: null
};

/** Templates sugeridos — MIT Blueprint (BP1–BP16). */
export const TEMPLATES_DIMENSOES_FOCO_MIT = {
  estrategia: ['BP1', 'BP2'],
  governanca_operacional: ['BP1', 'BP4', 'BP7'],
  pessoas: ['BP4'],
  engenharia: ['BP5', 'BP6'],
  geral: null
};

/** @deprecated use TEMPLATES_DIMENSOES_FOCO_SATF */
export const TEMPLATES_DIMENSOES_FOCO_UNIDADE = TEMPLATES_DIMENSOES_FOCO_SATF;

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

const REGEX_COD_DIMENSAO = /\b(D(?:10|11|[1-9])|BP(?:1[0-6]|[1-9]))\b/gi;
const REGEX_SEGMENTO_EXCLUI =
  /\b(?:N[AÃ]O|NAO)[\s,]+(?:APARECE|FAZ\s+PARTE|EST[AÁ]\s+NO\s+ESCOPO|INCLUI|APLICA|PERTENCE)\b|\bFORA[\s,]+(?:DO[\s,]+)?ESCOPO\b/i;

function ordenarCodigosDimensao(codigos) {
  return [...codigos].sort((a, b) => {
    const pa = a.startsWith('BP') ? 'BP' : 'D';
    const pb = b.startsWith('BP') ? 'BP' : 'D';
    if (pa !== pb) return pa.localeCompare(pb);
    return parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10);
  });
}

/** Extrai somente códigos D1–D11 / BP1–BP16; suporta -D8, !D8 e "D8 (... NÃO APARECE ...)". */
export function normalizarDimensoesFocoInput(valor) {
  if (valor == null || valor === '') return null;

  let texto = '';
  if (Array.isArray(valor)) {
    texto = valor.map((x) => String(x).trim()).filter(Boolean).join(', ');
  } else if (typeof valor === 'string') {
    const trimmed = valor.trim();
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        texto = parsed.map((x) => String(x).trim()).filter(Boolean).join(', ');
      } else {
        texto = trimmed;
      }
    } catch {
      texto = trimmed;
    }
  } else {
    texto = String(valor);
  }

  if (!texto.trim()) return null;

  const excluir = new Set();
  const incluir = new Set();

  for (const m of texto.matchAll(/(?:^|[,\s])(?:-|!|NOT\s+)(D(?:10|11|[1-9])|BP(?:1[0-6]|[1-9]))\b/gi)) {
    excluir.add(m[1].toUpperCase());
  }

  for (const m of texto.matchAll(REGEX_COD_DIMENSAO)) {
    const cod = m[1].toUpperCase();
    const afterCod = texto.slice(m.index + m[0].length);
    const proxCod = afterCod.search(/\b(D(?:10|11|[1-9])|BP(?:1[0-6]|[1-9]))\b/i);
    const janela = proxCod >= 0 ? afterCod.slice(0, proxCod) : afterCod.slice(0, 200);
    if (/^\s*[-!]/.test(afterCod) || REGEX_SEGMENTO_EXCLUI.test(janela)) {
      excluir.add(cod);
    } else {
      incluir.add(cod);
    }
  }

  for (const e of excluir) incluir.delete(e);

  const arr = ordenarCodigosDimensao(incluir);
  return arr.length ? arr : null;
}

export function formatarDimensoesFocoDisplay(codigos) {
  const arr = normalizarDimensoesFocoInput(codigos);
  return arr?.length ? arr.join(', ') : null;
}

function filtrarCodigosPorPrefixo(codigos, prefixo) {
  if (!codigos?.length) return null;
  const filtrados = codigos.filter((c) => String(c).toUpperCase().startsWith(prefixo));
  return filtrados.length ? filtrados : null;
}

export function normalizarDimensoesFocoSatfInput(valor) {
  return filtrarCodigosPorPrefixo(normalizarDimensoesFocoInput(valor), 'D');
}

export function normalizarDimensoesFocoMitInput(valor) {
  return filtrarCodigosPorPrefixo(normalizarDimensoesFocoInput(valor), 'BP');
}

export function formatarDimensoesFocoSatfDisplay(codigos) {
  const arr = normalizarDimensoesFocoSatfInput(codigos);
  return arr?.length ? arr.join(', ') : null;
}

export function formatarDimensoesFocoMitDisplay(codigos) {
  const arr = normalizarDimensoesFocoMitInput(codigos);
  return arr?.length ? arr.join(', ') : null;
}

function extrairCampoUnidade(rowOrValor, campo) {
  if (rowOrValor && typeof rowOrValor === 'object' && !Array.isArray(rowOrValor)) {
    return rowOrValor[campo] ?? null;
  }
  return rowOrValor;
}

function focoLegadoPorPrefixo(row, prefixo) {
  const legado = normalizarDimensoesFocoInput(extrairCampoUnidade(row, 'dimensoesFoco'));
  return filtrarCodigosPorPrefixo(legado, prefixo);
}

/** Foco SATF (D1–D11) — campo dedicado ou legado filtrado. */
export function parseDimensoesFocoSatfJson(rowOrValor) {
  const direto = normalizarDimensoesFocoSatfInput(extrairCampoUnidade(rowOrValor, 'dimensoesFocoSatf'));
  if (direto?.length) return direto;
  if (rowOrValor && typeof rowOrValor === 'object' && !Array.isArray(rowOrValor)) {
    return focoLegadoPorPrefixo(rowOrValor, 'D');
  }
  return normalizarDimensoesFocoSatfInput(rowOrValor);
}

/** Foco MIT Blueprint (BP1–BP16) — campo dedicado ou legado filtrado. */
export function parseDimensoesFocoMitJson(rowOrValor) {
  const direto = normalizarDimensoesFocoMitInput(extrairCampoUnidade(rowOrValor, 'dimensoesFocoMit'));
  if (direto?.length) return direto;
  if (rowOrValor && typeof rowOrValor === 'object' && !Array.isArray(rowOrValor)) {
    return focoLegadoPorPrefixo(rowOrValor, 'BP');
  }
  return normalizarDimensoesFocoMitInput(rowOrValor);
}

/** @deprecated use parseDimensoesFocoSatfJson / parseDimensoesFocoMitJson */
export function parseDimensoesFocoJson(valor) {
  const satf = parseDimensoesFocoSatfJson(valor);
  if (satf?.length) return satf;
  return parseDimensoesFocoMitJson(valor);
}

export function serializarDimensoesFocoSatf(dimensoesFoco) {
  const arr = parseDimensoesFocoSatfJson(dimensoesFoco);
  return arr ? JSON.stringify(arr) : null;
}

export function serializarDimensoesFocoMit(dimensoesFoco) {
  const arr = parseDimensoesFocoMitJson(dimensoesFoco);
  return arr ? JSON.stringify(arr) : null;
}

export function serializarDimensoesFoco(dimensoesFoco) {
  const arr = parseDimensoesFocoJson(dimensoesFoco);
  return arr ? JSON.stringify(arr) : null;
}

export function unidadeTemDimensoesFocoSatf(unidadeMeta) {
  return Boolean(parseDimensoesFocoSatfJson(unidadeMeta)?.length);
}

export function unidadeTemDimensoesFocoMit(unidadeMeta) {
  return Boolean(parseDimensoesFocoMitJson(unidadeMeta)?.length);
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
    dimensoesFocoSatf: parseDimensoesFocoSatfJson(row),
    dimensoesFocoMit: parseDimensoesFocoMitJson(row),
    /** @deprecated union SATF+MIT — use campos específicos por framework */
    dimensoesFoco: parseDimensoesFocoJson(row),
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
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "UnidadeEmpresa" ADD COLUMN IF NOT EXISTS "dimensoesFocoSatf" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "UnidadeEmpresa" ADD COLUMN IF NOT EXISTS "dimensoesFocoMit" TEXT'
    );
    console.log('[schema] UnidadeEmpresa dimensoesFocoSatf/Mit verificadas.');
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

function ordenarUnidadesEmpresa(unidadesEmpresa = []) {
  return [...unidadesEmpresa].sort((a, b) => {
    if (a.ehPadrao && !b.ehPadrao) return -1;
    if (!a.ehPadrao && b.ehPadrao) return 1;
    return (a.ordem ?? 0) - (b.ordem ?? 0) || String(a.nome).localeCompare(String(b.nome), 'pt-BR');
  });
}

/**
 * Agrupa itens (avaliadores, linhas de status etc.) por unidade organizacional.
 * Com `incluirUnidadesVazias`, lista todas as unidades cadastradas mesmo sem avaliadores.
 */
export function agruparItensPorUnidadeEmpresa({
  itens = [],
  unidadesEmpresa = [],
  unidadeGeralId = null,
  getUnidadeId = (item) => item?.empresaUnidadeId,
  incluirUnidadesVazias = true
} = {}) {
  const ordemUnidades = ordenarUnidadesEmpresa(unidadesEmpresa);
  const grupos = new Map();

  if (incluirUnidadesVazias) {
    for (const unidade of ordemUnidades) {
      grupos.set(unidade.id, { unidade, itens: [] });
    }
  }

  for (const item of itens) {
    const uid = getUnidadeId(item) ?? unidadeGeralId;
    if (uid == null) continue;
    if (!grupos.has(uid)) {
      const unidade =
        ordemUnidades.find((u) => u.id === uid) || {
          id: uid,
          nome: `Unidade #${uid}`,
          codigo: '',
          ehPadrao: uid === unidadeGeralId
        };
      grupos.set(uid, { unidade, itens: [] });
    }
    grupos.get(uid).itens.push(item);
  }

  const resultado = [];
  const seen = new Set();
  for (const unidade of ordemUnidades) {
    if (!grupos.has(unidade.id)) continue;
    resultado.push(grupos.get(unidade.id));
    seen.add(unidade.id);
  }
  for (const [uid, grupo] of grupos) {
    if (!seen.has(uid)) resultado.push(grupo);
  }
  return resultado;
}

/** Payload serializável para o dashboard / acompanhamento. */
export function montarAvaliadoresPorUnidade({
  avaliadores = [],
  unidadesEmpresa = [],
  unidadeGeralId = null,
  incluirUnidadesVazias = true
} = {}) {
  return agruparItensPorUnidadeEmpresa({
    itens: avaliadores,
    unidadesEmpresa,
    unidadeGeralId,
    getUnidadeId: (item) => item?.empresaUnidadeId,
    incluirUnidadesVazias
  }).map((grupo) => ({
    id: grupo.unidade.id,
    nome: grupo.unidade.nome,
    codigo: grupo.unidade.codigo || '',
    ehPadrao: Boolean(grupo.unidade.ehPadrao),
    total: grupo.itens.length,
    avaliadores: grupo.itens
  }));
}

/** Nome e ID efetivos da unidade do usuário (null → Geral). */
export function unidadeEfetivaDoUsuario(usuario, { unidadeGeral, nomesUnidadePorId } = {}) {
  const unidadeIdEfetiva = resolverUnidadeEfetivaIdUsuario(usuario, unidadeGeral?.id);
  const empresaUnidadeNome =
    usuario?.empresaUnidade?.nome ||
    (nomesUnidadePorId instanceof Map ? nomesUnidadePorId.get(unidadeIdEfetiva) : null) ||
    (unidadeIdEfetiva === unidadeGeral?.id ? unidadeGeral?.nome : null);
  return { empresaUnidadeId: unidadeIdEfetiva, empresaUnidadeNome };
}

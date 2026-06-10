import { PrismaClient } from '@prisma/client';

const _base = new PrismaClient();

/** null = ainda não sondado; após probe, true/false */
let usuarioTemColunaNivelPrioridade = null;
let probePromise = null;

async function probeUsuarioNivelColuna() {
  if (usuarioTemColunaNivelPrioridade !== null) return;
  if (!probePromise) {
    probePromise = (async () => {
      try {
        usuarioTemColunaNivelPrioridade = await colunaNivelPrioridadeExisteNoPg();
        if (!usuarioTemColunaNivelPrioridade) {
          console.warn(
            '[prisma] Coluna Usuario.nivelPrioridadeMapeamentoMaturidade ausente no banco; usando modo compatível (valor 1 em memória). Aplique a migração ou backend/scripts/fix-usuario-nivel-prioridade.sql e reinicie.'
          );
        }
      } catch (e) {
        console.warn(
          '[prisma] Falha ao sondar coluna nivelPrioridade (assumindo ausente — evita SQL com coluna inexistente):',
          e?.message || e
        );
        /** `false` força omitir `nivelPrioridadeMapeamentoMaturidade` no Prisma; `true` aqui quebrava `usuario.create` quando a coluna não existia. */
        usuarioTemColunaNivelPrioridade = false;
      }
    })();
  }
  await probePromise;
}

/**
 * Detecta se a coluna existe de forma alinhada ao que o Prisma executa no PostgreSQL.
 * O catálogo (pg_attribute) já gerou falso positivo em alguns ambientes; um SELECT mínimo
 * na tabela falha com o mesmo erro que `usuario.create()` quando a coluna não existe.
 */
async function colunaNivelPrioridadeExisteNoPg() {
  try {
    await _base.$queryRawUnsafe(
      'SELECT "nivelPrioridadeMapeamentoMaturidade" FROM "Usuario" WHERE 1 = 0'
    );
    return true;
  } catch (e) {
    const m = String(e?.message || e || '');
    const code = e?.code;
    if (
      code === '42703' ||
      /does not exist|não existe|undefined column|column.*does not exist/i.test(m) ||
      /The column `nivelPrioridadeMapeamentoMaturidade`/i.test(m)
    ) {
      return false;
    }
    throw e;
  }
}

/** Reconsulta o catálogo (ex.: migração aplicada sem reiniciar o backend). */
export async function refreshUsuarioNivelPrioridadeColumnFlag() {
  try {
    usuarioTemColunaNivelPrioridade = await colunaNivelPrioridadeExisteNoPg();
  } catch (e) {
    console.warn('[prisma] refresh coluna nivelPrioridade:', e?.message || e);
    usuarioTemColunaNivelPrioridade = false;
  }
}

export async function initPrismaUsuarioColumnProbe() {
  await probeUsuarioNivelColuna();
}

/** `true` apenas se o probe já rodou e a coluna existir no PostgreSQL (PUT/POST podem persistir o nível). */
export function isUsuarioNivelPrioridadeColumnPresentInDb() {
  return usuarioTemColunaNivelPrioridade === true;
}

const USUARIO_SELECT_BASE = {
  id: true,
  nome: true,
  email: true,
  senha: true,
  cargo: true,
  telefone: true,
  role: true,
  empresaId: true,
  ativo: true,
  createdAt: true,
  updatedAt: true
};

/** Relações no schema que apontam para `Usuario` (includes aninhados não passam pela extensão `usuario.*`). */
const USUARIO_REL_KEYS = new Set([
  'usuario',
  'usuarios',
  'avaliador',
  'geradoPor',
  'aprovadoPor',
  'solicitadoPor'
]);

function normalizeUsuarioRelForNested(v) {
  if (v === true) return { select: { ...USUARIO_SELECT_BASE } };
  if (!v || typeof v !== 'object') return v;
  if (v.select) {
    const stripped = { ...v.select };
    delete stripped.nivelPrioridadeMapeamentoMaturidade;
    const keys = Object.keys(stripped);
    return { ...v, select: keys.length > 0 ? stripped : { ...USUARIO_SELECT_BASE } };
  }
  if (v.include) {
    return { select: { ...USUARIO_SELECT_BASE, ...v.include } };
  }
  return { select: { ...USUARIO_SELECT_BASE } };
}

/** Reescreve `usuario: true` (e homólogos) em árvores include/select para não pedir coluna inexistente no SQL. */
function deepRewriteUsuarioRelsInArgs(obj, inCount = false) {
  if (obj == null || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (const item of obj) deepRewriteUsuarioRelsInArgs(item, inCount);
    return;
  }
  if (!inCount) {
    for (const k of Object.keys(obj)) {
      if (USUARIO_REL_KEYS.has(k)) {
        obj[k] = normalizeUsuarioRelForNested(obj[k]);
      }
    }
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v == null || typeof v !== 'object') continue;
    const nextInCount = inCount || k === '_count';
    deepRewriteUsuarioRelsInArgs(v, nextInCount);
  }
}

function omitNivelFromData(data) {
  if (!data || typeof data !== 'object') return data;
  if (!Object.prototype.hasOwnProperty.call(data, 'nivelPrioridadeMapeamentoMaturidade')) return data;
  const { nivelPrioridadeMapeamentoMaturidade, ...rest } = data;
  return rest;
}

function stripNivelFromSelect(sel) {
  if (!sel || typeof sel !== 'object') return sel;
  if (!Object.prototype.hasOwnProperty.call(sel, 'nivelPrioridadeMapeamentoMaturidade')) return sel;
  const { nivelPrioridadeMapeamentoMaturidade, ...rest } = sel;
  return rest;
}

const OPS_RETORNAM_USUARIO = new Set([
  'findUnique',
  'findFirst',
  'findMany',
  'findUniqueOrThrow',
  'findFirstOrThrow',
  'create',
  'createManyAndReturn',
  'update',
  'delete',
  'upsert'
]);

function aplicarArgsUsuarioSemColuna(operation, args) {
  if (usuarioTemColunaNivelPrioridade) return args;
  const a = args ? { ...args } : {};

  if (a.data) {
    if (operation === 'createManyAndReturn' && Array.isArray(a.data)) {
      a.data = a.data.map((row) =>
        row != null && typeof row === 'object' && !Array.isArray(row)
          ? omitNivelFromData({ ...row })
          : row
      );
    } else if (typeof a.data === 'object' && !Array.isArray(a.data)) {
      a.data = omitNivelFromData(a.data);
    }
  }
  if (operation === 'upsert') {
    if (a.create) a.create = omitNivelFromData(a.create);
    if (a.update) a.update = omitNivelFromData(a.update);
  }

  if (!OPS_RETORNAM_USUARIO.has(operation)) return a;

  if (a.select) {
    if (Object.prototype.hasOwnProperty.call(a.select, 'nivelPrioridadeMapeamentoMaturidade')) {
      const stripped = stripNivelFromSelect(a.select);
      const keys = Object.keys(stripped);
      a.select = keys.length > 0 ? stripped : { ...USUARIO_SELECT_BASE };
    }
  } else if (a.include) {
    a.select = { ...USUARIO_SELECT_BASE, ...a.include };
    delete a.include;
  } else {
    a.select = { ...USUARIO_SELECT_BASE };
  }

  return a;
}

function pareceUsuarioSemNivel(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  if (obj.nivelPrioridadeMapeamentoMaturidade !== undefined) return false;
  if (typeof obj.id !== 'number' || typeof obj.email !== 'string') return false;
  if (Object.prototype.hasOwnProperty.call(obj, 'token')) return false;
  if (Object.prototype.hasOwnProperty.call(obj, 'cnpj')) return false;
  return true;
}

function injetarNivelPadraoEmProfundidade(value) {
  if (usuarioTemColunaNivelPrioridade) return value;
  if (value == null) return value;
  /** Prisma devolve Date em campos DateTime; `{ ...date }` vira `{}` e quebra serialização JSON (ex.: createdAt some — no front). */
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((v) => injetarNivelPadraoEmProfundidade(v));
  if (typeof value !== 'object') return value;
  let out = pareceUsuarioSemNivel(value) ? { ...value, nivelPrioridadeMapeamentoMaturidade: 1 } : { ...value };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (v != null && (typeof v === 'object' || Array.isArray(v))) {
      out = { ...out, [k]: injetarNivelPadraoEmProfundidade(v) };
    }
  }
  return out;
}

/** Reescrita de relações `usuario` em outros modelos (include/select aninhados). */
const prismaComDeepRewrite = _base.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        await probeUsuarioNivelColuna();
        const modeloUsuario =
          model === 'Usuario' ||
          model === 'usuario' ||
          (typeof model === 'string' && model.toLowerCase() === 'usuario');
        if (modeloUsuario) {
          return query(args);
        }
        let nextArgs = args;
        if (
          !usuarioTemColunaNivelPrioridade &&
          args &&
          typeof args === 'object' &&
          !Array.isArray(args)
        ) {
          try {
            nextArgs = structuredClone(args);
            deepRewriteUsuarioRelsInArgs(nextArgs, false);
          } catch (e) {
            console.warn('[prisma] rewrite args skip:', e?.message || e);
            nextArgs = args;
          }
        }
        const result = await query(nextArgs);
        return usuarioTemColunaNivelPrioridade ? result : injetarNivelPadraoEmProfundidade(result);
      }
    }
  }
});

/**
 * Compatibilidade da coluna `Usuario.nivelPrioridadeMapeamentoMaturidade`: o hook em
 * `query.usuario` (camelCase do modelo) é o caminho suportado pela documentação do Prisma;
 * só `$allModels` não interceptava de forma confiável o `prisma.usuario.create` em alguns casos.
 */
export const prisma = prismaComDeepRewrite.$extends({
  query: {
    usuario: {
      async $allOperations(ctx) {
        const { operation, args, query } = ctx;
        await probeUsuarioNivelColuna();
        let nextArgs = args;
        if (
          !usuarioTemColunaNivelPrioridade &&
          args &&
          typeof args === 'object' &&
          !Array.isArray(args)
        ) {
          try {
            nextArgs = aplicarArgsUsuarioSemColuna(operation, args);
          } catch (e) {
            console.warn('[prisma] usuario.$allOperations rewrite:', e?.message || e);
          }
        }
        const result = await query(nextArgs);
        return usuarioTemColunaNivelPrioridade ? result : injetarNivelPadraoEmProfundidade(result);
      }
    }
  }
});

function erroIndicaColunaNivelUsuarioAusente(err) {
  const m = String(err?.message || err || '');
  const code = err?.code;
  return (
    code === 'P2022' ||
    /nivelPrioridadeMapeamentoMaturidade.*does not exist/i.test(m) ||
    /column.*nivelPrioridadeMapeamentoMaturidade.*does not exist/i.test(m) ||
    /The column `nivelPrioridadeMapeamentoMaturidade`/i.test(m)
  );
}

/** INSERT sem a coluna opcional (quando o Prisma ainda referencia o campo do schema). */
async function usuarioInsertRawSemColunaNivel(data) {
  const nome = data.nome;
  const email = data.email;
  const senha = data.senha ?? null;
  const cargo = data.cargo ?? null;
  const telefone = data.telefone ?? null;
  const role = data.role ?? 'avaliador';
  const empresaId = data.empresaId;
  const ativo = data.ativo !== false;

  const rows = await _base.$queryRaw`
    INSERT INTO "Usuario" ("nome", "email", "senha", "cargo", "telefone", "role", "empresaId", "ativo", "createdAt", "updatedAt")
    VALUES (${nome}, ${email}, ${senha}, ${cargo}, ${telefone}, ${role}, ${empresaId}, ${ativo}, NOW(), NOW())
    RETURNING "id"
  `;
  const rawId = Array.isArray(rows) && rows[0] ? rows[0].id : null;
  if (rawId == null) throw new Error('INSERT em Usuario não retornou id');
  return { id: typeof rawId === 'bigint' ? Number(rawId) : Number(rawId) };
}

/**
 * Cria usuário com suporte a banco **sem** a coluna `nivelPrioridadeMapeamentoMaturidade`.
 * Tenta `prisma.usuario.create`; se o erro for da coluna ausente, faz INSERT via SQL e relê com o client estendido.
 */
export async function usuarioCreateCompat({ data, include }) {
  await refreshUsuarioNivelPrioridadeColumnFlag();
  const dataComNivel = { ...data };
  const dataSemNivel = omitNivelFromData({ ...data });
  const payloadCreate = isUsuarioNivelPrioridadeColumnPresentInDb() ? dataComNivel : dataSemNivel;
  const includeArg =
    include && typeof include === 'object' && Object.keys(include).length > 0 ? { include } : {};

  try {
    return await prisma.usuario.create({
      data: payloadCreate,
      ...includeArg
    });
  } catch (e) {
    if (!erroIndicaColunaNivelUsuarioAusente(e)) {
      const msg = String(e?.message || '');
      if (/unique|duplicate|23505/i.test(msg) || e?.code === 'P2002' || e?.code === '23505') {
        const dup = new Error('Registro duplicado');
        dup.code = 'P2002';
        throw dup;
      }
      throw e;
    }
    console.warn(
      '[prisma] usuario.create falhou pela coluna nivelPrioridade; usando INSERT SQL sem essa coluna.'
    );
    usuarioTemColunaNivelPrioridade = false;
    const { id } = await usuarioInsertRawSemColunaNivel(omitNivelFromData({ ...data }));
    const relido = await prisma.usuario.findUnique({
      where: { id },
      ...includeArg
    });
    if (!relido) throw e;
    return relido;
  }
}

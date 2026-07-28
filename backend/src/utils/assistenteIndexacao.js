/**
 * Indexação incremental do Assistente (RAG qualidade):
 * - última versão por tipo de RelatorioIA
 * - chunks + embeddings persistidos em AssistenteChunk
 * - reindex só do relatório novo ao salvar
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ensureAssistenteSchema } from './assistenteSchema.js';
import {
  fatiarTexto,
  hashTexto,
  rotuloTipoRelatorio,
  invalidarCacheRelatoriosProjeto,
  embedOpenAIBatch
} from './assistenteRetrieval.js';
import {
  usuarioTemRestricaoUnidadesAssistente,
  usuarioPodeAcessarEscopoRelatorioAssistente,
  usuarioPodeFiltrarUnidadeAssistente
} from './empresaUnidade.js';
import {
  extrairEscopoBibliotecaRelatorio,
  filtroUnidadeRelatorioIACompativel
} from './relatorioUnidadeIA.js';

const MAX_CHARS_POR_RELATORIO = 35000;
const EMBED_BATCH = 16;
const MAX_TIPOS_RELATORIO = 8;

/** @type {Map<number, { chunks: Array, builtAt: number }>} */
const cacheMemoria = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function invalidarCacheRelatoriosLocal(projetoId) {
  const id = Number(projetoId);
  if (Number.isFinite(id)) cacheMemoria.delete(id);
  invalidarCacheRelatoriosProjeto(id);
}

/**
 * Mantém apenas a última versão de cada `tipo` (maior versao; empate = createdAt mais recente).
 */
export function selecionarUltimasVersoesPorTipo(relatorios = []) {
  const byTipo = new Map();
  for (const r of relatorios) {
    if (!r) continue;
    const tipo = String(r.tipo || 'desconhecido');
    const prev = byTipo.get(tipo);
    if (!prev) {
      byTipo.set(tipo, r);
      continue;
    }
    const vNew = Number(r.versao) || 0;
    const vOld = Number(prev.versao) || 0;
    if (vNew > vOld) {
      byTipo.set(tipo, r);
    } else if (vNew === vOld) {
      const tNew = new Date(r.createdAt || 0).getTime();
      const tOld = new Date(prev.createdAt || 0).getTime();
      if (tNew >= tOld) byTipo.set(tipo, r);
    }
  }
  return [...byTipo.values()].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
}

export function montarChunksDeRelatorioIA(relatorio, { projetoId } = {}) {
  const r = relatorio || {};
  const id = Number(r.id);
  const pid = Number(projetoId ?? r.projetoId);
  const corpo = String(r.conteudoMd || '').trim().slice(0, MAX_CHARS_POR_RELATORIO);
  if (!Number.isFinite(id) || id <= 0 || !corpo) return [];

  const tipoLabel = rotuloTipoRelatorio(r.tipo);
  const baseTitulo = `${tipoLabel}: ${r.titulo || `id ${id}`}${
    r.versao != null ? ` (v${r.versao})` : ''
  }`;
  const meta = [
    `Relatório IA id=${id}`,
    `tipo=${r.tipo}`,
    r.scoreGeral != null ? `scoreGeral=${r.scoreGeral}` : null,
    r.createdAt ? `geradoEm=${new Date(r.createdAt).toISOString().slice(0, 10)}` : null,
    'versaoMaisRecenteDoTipo=sim'
  ]
    .filter(Boolean)
    .join(' · ');

  const out = [];
  const partes = fatiarTexto(`${meta}\n\n${corpo}`, { size: 1100, overlap: 140 });
  for (const [idx, parte] of partes.entries()) {
    out.push({
      escopo: 'projeto',
      projetoId: pid,
      fonte: 'relatorio_ia',
      relatorioId: id,
      titulo: idx === 0 ? baseTitulo : `${baseTitulo} (trecho ${idx + 1})`,
      texto: parte,
      hashConteudo: hashTexto(`relatorio|${id}|${idx}|${parte.slice(0, 200)}`)
    });
  }
  return out;
}

async function apagarChunksRelatorio(relatorioId) {
  const id = Number(relatorioId);
  if (!Number.isFinite(id) || id <= 0) return;
  await prisma.$executeRaw`
    DELETE FROM "AssistenteChunk"
    WHERE "fonte" = 'relatorio_ia' AND "relatorioId" = ${id}
  `;
}

async function apagarChunksVersoesAntigasMesmoTipo(projetoId, tipo, manterRelatorioId) {
  const pid = Number(projetoId);
  const keep = Number(manterRelatorioId);
  if (!Number.isFinite(pid) || !tipo) return;
  const antigos = await prisma.relatorioIA.findMany({
    where: {
      projetoId: pid,
      tipo: String(tipo),
      ...(Number.isFinite(keep) && keep > 0 ? { id: { not: keep } } : {})
    },
    select: { id: true }
  });
  for (const a of antigos) {
    await apagarChunksRelatorio(a.id);
  }
}

async function inserirChunksComEmbedding(chunks) {
  if (!chunks.length) return { inseridos: 0, comEmbedding: 0 };

  let comEmbedding = 0;
  const textos = chunks.map((c) => `${c.titulo}\n${c.texto}`.slice(0, 2000));
  const embeddings = [];

  for (let i = 0; i < textos.length; i += EMBED_BATCH) {
    const batch = textos.slice(i, i + EMBED_BATCH);
    const emb = await embedOpenAIBatch(batch);
    if (emb && emb.length === batch.length) {
      embeddings.push(...emb);
    } else {
      embeddings.push(...batch.map(() => null));
    }
  }

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const emb = embeddings[i];
    const embJson = Array.isArray(emb) ? JSON.stringify(emb) : null;
    if (embJson) comEmbedding += 1;
    await prisma.$executeRaw`
      INSERT INTO "AssistenteChunk"
        ("escopo", "projetoId", "fonte", "titulo", "texto", "embeddingJson", "hashConteudo", "relatorioId", "updatedAt")
      VALUES (
        ${c.escopo},
        ${c.projetoId},
        ${c.fonte},
        ${c.titulo},
        ${c.texto},
        ${embJson},
        ${c.hashConteudo},
        ${c.relatorioId},
        CURRENT_TIMESTAMP
      )
    `;
  }

  return { inseridos: chunks.length, comEmbedding };
}

/**
 * Reindexa um único RelatorioIA (substitui chunks dele e remove versões antigas do mesmo tipo).
 */
export async function indexarRelatorioIAAssistente(relatorio) {
  if (!relatorio?.id) return { ok: false, motivo: 'sem_id' };
  await ensureAssistenteSchema();

  const projetoId = Number(relatorio.projetoId);
  try {
    await apagarChunksVersoesAntigasMesmoTipo(projetoId, relatorio.tipo, relatorio.id);
    await apagarChunksRelatorio(relatorio.id);

    const chunks = montarChunksDeRelatorioIA(relatorio, { projetoId });
    const result = await inserirChunksComEmbedding(chunks);
    invalidarCacheRelatoriosLocal(projetoId);

    console.log(
      `[Assistente RAG] indexado relatório #${relatorio.id} tipo=${relatorio.tipo} ` +
        `chunks=${result.inseridos} embeddings=${result.comEmbedding}`
    );
    return { ok: true, ...result, relatorioId: relatorio.id };
  } catch (e) {
    console.warn(`[Assistente RAG] falha ao indexar #${relatorio.id}:`, e.message);
    return { ok: false, erro: e.message };
  }
}

/** Disparo best-effort após salvar (não bloqueia a resposta HTTP). */
export function agendarIndexacaoRelatorioIA(relatorio) {
  if (!relatorio?.id) return;
  setImmediate(() => {
    indexarRelatorioIAAssistente(relatorio).catch((e) => {
      console.warn('[Assistente RAG] agendamento falhou:', e.message);
    });
  });
}

async function carregarChunksIndexadosPorIds(projetoId, ids) {
  const pid = Number(projetoId);
  const idList = (ids || []).map(Number).filter((n) => n > 0);
  if (!Number.isFinite(pid) || !idList.length) return { chunks: [], idsIndexados: new Set() };

  await ensureAssistenteSchema();
  try {
    const rows = await prisma.$queryRaw`
      SELECT "fonte", "titulo", "texto", "embeddingJson", "hashConteudo", "relatorioId", "projetoId"
      FROM "AssistenteChunk"
      WHERE "escopo" = 'projeto'
        AND "projetoId" = ${pid}
        AND "fonte" = 'relatorio_ia'
        AND "relatorioId" IN (${Prisma.join(idList)})
      ORDER BY "relatorioId" DESC, "id" ASC
    `;
    const idsIndexados = new Set();
    const chunks = (rows || []).map((row) => {
      if (row.relatorioId != null) idsIndexados.add(Number(row.relatorioId));
      let embedding = null;
      if (row.embeddingJson) {
        try {
          embedding = JSON.parse(row.embeddingJson);
        } catch {
          embedding = null;
        }
      }
      return {
        escopo: 'projeto',
        projetoId: pid,
        fonte: 'relatorio_ia',
        relatorioId: row.relatorioId,
        titulo: row.titulo,
        texto: row.texto,
        hashConteudo: row.hashConteudo,
        embedding: Array.isArray(embedding) ? embedding : null
      };
    });
    return { chunks, idsIndexados };
  } catch (e) {
    console.warn('[Assistente RAG] leitura de chunks indexados:', e.message);
    return { chunks: [], idsIndexados: new Set() };
  }
}

/**
 * Chunks dos relatórios do projeto: prioriza última versão por tipo + índice persistido.
 * Com usuário restrito a unidades, remove books/relatórios de outras unidades (escopo geral permanece).
 * Com empresaUnidadeId explícito (#2), prioriza books daquela unidade (exclui gerais).
 * @param {number} projetoId
 * @param {{ usuario?: object|null, empresaUnidadeId?: number|null }} [opts]
 */
export async function obterChunksRelatoriosIAProjeto(
  projetoId,
  { usuario = null, empresaUnidadeId = null } = {}
) {
  const id = parseInt(projetoId, 10);
  if (!Number.isFinite(id) || id <= 0) return [];

  const now = Date.now();
  const cached = cacheMemoria.get(id);
  let out;
  if (cached && now - cached.builtAt < CACHE_TTL_MS) {
    out = cached.chunks;
  } else {
    let todos = [];
    try {
      todos = await prisma.relatorioIA.findMany({
        where: { projetoId: id },
        orderBy: [{ versao: 'desc' }, { createdAt: 'desc' }],
        take: 40,
        select: {
          id: true,
          tipo: true,
          titulo: true,
          conteudoMd: true,
          versao: true,
          createdAt: true,
          scoreGeral: true,
          projetoId: true
        }
      });
    } catch (e) {
      console.warn('[Assistente RAG] falha ao carregar RelatorioIA:', e.message);
      return [];
    }

    const ultimas = selecionarUltimasVersoesPorTipo(todos).slice(0, MAX_TIPOS_RELATORIO);
    if (!ultimas.length) {
      cacheMemoria.set(id, { chunks: [], builtAt: now });
      return [];
    }

    const { chunks: indexados, idsIndexados } = await carregarChunksIndexadosPorIds(
      id,
      ultimas.map((r) => r.id)
    );

    out = [...indexados];
    for (const r of ultimas) {
      if (idsIndexados.has(Number(r.id))) continue;
      out.push(...montarChunksDeRelatorioIA(r, { projetoId: id }));
      // indexa em background o que faltou (best-effort)
      agendarIndexacaoRelatorioIA(r);
    }

    cacheMemoria.set(id, { chunks: out, builtAt: now });
  }

  return filtrarChunksRelatorioPorUnidadesUsuario(out, usuario, { empresaUnidadeId });
}

function parseSnapshotRelatorio(dadosSnapshot) {
  if (!dadosSnapshot) return null;
  try {
    return typeof dadosSnapshot === 'string' ? JSON.parse(dadosSnapshot) : dadosSnapshot;
  } catch {
    return null;
  }
}

/**
 * Remove chunks de RelatorioIA fora das unidades home∪governadas do usuário (#8).
 * Com empresaUnidadeId (#2), mantém só books compatíveis com a unidade (não inclui gerais).
 * Cache permanece por projeto; o filtro é aplicado por requisição.
 */
export async function filtrarChunksRelatorioPorUnidadesUsuario(
  chunks,
  usuario,
  { empresaUnidadeId = null } = {}
) {
  const list = Array.isArray(chunks) ? chunks : [];
  if (!list.length) return list;

  const filtroId =
    empresaUnidadeId != null && Number(empresaUnidadeId) > 0
      ? Math.trunc(Number(empresaUnidadeId))
      : null;

  if (filtroId != null && !usuarioPodeFiltrarUnidadeAssistente(usuario, filtroId)) {
    return [];
  }

  const precisaPermissao = usuarioTemRestricaoUnidadesAssistente(usuario);
  if (!precisaPermissao && filtroId == null) return list;

  const ids = [
    ...new Set(
      list
        .map((c) => Number(c?.relatorioId))
        .filter((n) => Number.isFinite(n) && n > 0)
    )
  ];
  if (!ids.length) return list;

  let rows = [];
  try {
    rows = await prisma.relatorioIA.findMany({
      where: { id: { in: ids } },
      select: { id: true, tipo: true, dadosSnapshot: true }
    });
  } catch (e) {
    console.warn('[Assistente RAG] falha ao filtrar por unidade:', e.message);
    return list;
  }

  const allowed = new Set();
  for (const r of rows) {
    const snap = parseSnapshotRelatorio(r.dadosSnapshot);
    const escopoMeta = extrairEscopoBibliotecaRelatorio(r.tipo, snap);

    if (precisaPermissao && !usuarioPodeAcessarEscopoRelatorioAssistente(usuario, escopoMeta, null)) {
      continue;
    }

    if (filtroId != null) {
      // Escopo explícito por unidade: só books daquela unidade (não misturar Geral)
      const compativel =
        filtroUnidadeRelatorioIACompativel(snap, filtroId) ||
        (escopoMeta.escopo === 'unidade' && Number(escopoMeta.empresaUnidadeId) === filtroId);
      if (!compativel || escopoMeta.escopo === 'geral') continue;
    }

    allowed.add(Number(r.id));
  }

  return list.filter((c) => {
    const rid = Number(c?.relatorioId);
    if (!Number.isFinite(rid) || rid <= 0) return true;
    return allowed.has(rid);
  });
}

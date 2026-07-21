import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../lib/prisma.js';
import { ensureAssistenteSchema } from './assistenteSchema.js';
import {
  carregarManualSistemaAssistente,
  carregarTeseResumoAssistente,
  catalogoDimensoesMarkdown
} from './assistenteConhecimento.js';
import { ORDEM_DIMENSOES_SATF } from './ordemDimensoesFramework.js';
import { blocoGuiaProgressaoDimensaoSatf } from './guiasProgressaoFramework.js';
import { blocoContextoProjetoMarkdown } from './projetoContexto.js';
import { loadPersistedAIConfig, isProviderConfigured } from '../services/ai-provider.js';
import {
  filtrarCandidatosPorModo,
  normalizarModoAssistente
} from './assistenteModos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GUIAS_DIR = path.join(__dirname, '../data/guiasProgressao');

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 120;
const TOP_K = 10;
const MAX_RETRIEVAL_CHARS = 9000;

/** @type {{ chunks: Array, builtAt: number } | null} */
let cacheGlobalMemoria = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

export function hashTexto(s) {
  return crypto.createHash('sha1').update(String(s || '')).digest('hex').slice(0, 24);
}

export function tokenizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9à-ú]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

export function fatiarTexto(texto, { size = CHUNK_SIZE, overlap = CHUNK_OVERLAP } = {}) {
  const t = String(texto || '').trim();
  if (!t) return [];
  if (t.length <= size) return [t];
  const parts = [];
  let i = 0;
  while (i < t.length) {
    parts.push(t.slice(i, i + size));
    i += Math.max(1, size - overlap);
  }
  return parts;
}

export function rotuloTipoRelatorio(tipo) {
  const t = String(tipo || '').toLowerCase();
  if (t.includes('executivo')) return 'Relatório executivo IA';
  if (t.includes('unidade') || t.includes('book_unidade')) return 'Book por unidade IA';
  if (t.includes('rapido')) return 'Book completo (modo rápido) IA';
  if (t.includes('completo') || t.includes('satf') || t.includes('book')) return 'Book / relatório completo IA';
  return `Relatório IA (${tipo || 'geral'})`;
}

/** Invalida caches de chunks de relatórios (no-op aqui; cache vive em assistenteIndexacao). */
export function invalidarCacheRelatoriosProjeto(_projetoId) {
  /* cache de relatórios é invalidado via invalidarCacheRelatoriosLocal */
}

function scoreKeyword(queryTokens, chunkTexto) {
  if (!queryTokens.length) return 0;
  const chunkTokens = tokenizar(chunkTexto);
  if (!chunkTokens.length) return 0;
  const freq = new Map();
  for (const tok of chunkTokens) freq.set(tok, (freq.get(tok) || 0) + 1);
  let score = 0;
  const uniq = new Set(queryTokens);
  for (const tok of uniq) {
    const c = freq.get(tok) || 0;
    if (c > 0) score += 1 + Math.log(1 + c);
  }
  const q = queryTokens.join(' ');
  for (const m of String(chunkTexto).matchAll(/\bD([1-9]|1[01])\b/gi)) {
    if (q.includes(`d${m[1]}`) || queryTokens.includes(`d${m[1]}`)) score += 2.5;
  }
  return score / Math.sqrt(uniq.size);
}

export function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = Number(a[i]) || 0;
    const y = Number(b[i]) || 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function embedOpenAIBatch(texts) {
  await loadPersistedAIConfig();
  if (!isProviderConfigured('openai') || !process.env.OPENAI_API_KEY) return null;
  const inputs = (Array.isArray(texts) ? texts : [texts]).map((t) => String(t || '').slice(0, 6000));
  if (!inputs.length) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: inputs
      })
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn('[Assistente RAG] embedding falhou:', res.status, err.slice(0, 200));
      return null;
    }
    const data = await res.json();
    return (data.data || []).map((d) => d.embedding);
  } catch (e) {
    console.warn('[Assistente RAG] embedding erro:', e.message);
    return null;
  }
}

export function parseEmbeddingJson(raw) {
  if (!raw) return null;
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

function montarChunksGlobais() {
  const chunks = [];
  const push = (fonte, titulo, texto) => {
    for (const [idx, parte] of fatiarTexto(texto).entries()) {
      chunks.push({
        escopo: 'global',
        projetoId: null,
        fonte,
        titulo: idx === 0 ? titulo : `${titulo} (parte ${idx + 1})`,
        texto: parte,
        hashConteudo: hashTexto(`${fonte}|${titulo}|${parte}`)
      });
    }
  };

  push('manual', 'Manual do sistema Agentica', carregarManualSistemaAssistente());
  push('tese', 'Tese Blueprint IA (excerto)', carregarTeseResumoAssistente());
  push('catalogo', 'Catálogo de dimensões Blueprint/SATF', catalogoDimensoesMarkdown());

  for (let i = 0; i < ORDEM_DIMENSOES_SATF.length; i++) {
    const nome = ORDEM_DIMENSOES_SATF[i];
    const cod = `D${i + 1}`;
    const guia = blocoGuiaProgressaoDimensaoSatf(nome, 2);
    if (guia) push('guia', `Guia progressão ${cod} — ${nome}`, guia);
  }

  try {
    if (fs.existsSync(GUIAS_DIR)) {
      for (const f of fs.readdirSync(GUIAS_DIR).filter((x) => x.endsWith('.txt')).slice(0, 20)) {
        const full = path.join(GUIAS_DIR, f);
        const txt = fs.readFileSync(full, 'utf8').slice(0, 12000);
        push('guia_arquivo', f.replace(/\.txt$/i, ''), txt);
      }
    }
  } catch {
    /* ignore */
  }

  return chunks;
}

export function obterChunksGlobaisMemoria() {
  const now = Date.now();
  if (cacheGlobalMemoria && now - cacheGlobalMemoria.builtAt < CACHE_TTL_MS) {
    return cacheGlobalMemoria.chunks;
  }
  const chunks = montarChunksGlobais();
  cacheGlobalMemoria = { chunks, builtAt: now };
  return chunks;
}

async function chunksProjeto(projetoId) {
  if (!projetoId) return [];
  const md = await blocoContextoProjetoMarkdown(prisma, projetoId);
  if (!md) return [];
  const out = [];
  for (const [idx, parte] of fatiarTexto(md, { size: 1000 }).entries()) {
    out.push({
      escopo: 'projeto',
      projetoId,
      fonte: 'projeto_contexto',
      titulo: idx === 0 ? 'Contexto do projeto' : `Contexto do projeto (parte ${idx + 1})`,
      texto: parte,
      hashConteudo: hashTexto(`projeto|${projetoId}|${idx}|${parte}`)
    });
  }
  return out;
}

/** Delegado à indexação (última versão por tipo + DB). */
export async function chunksRelatoriosIAProjeto(projetoId, { usuario = null } = {}) {
  const { obterChunksRelatoriosIAProjeto } = await import('./assistenteIndexacao.js');
  return obterChunksRelatoriosIAProjeto(projetoId, { usuario });
}

function boostRelatorioNaQuery(queryTokens, scoreKw, fonte) {
  if (fonte !== 'relatorio_ia') return scoreKw;
  const hints = [
    'book',
    'relatorio',
    'relatório',
    'diagnostico',
    'diagnóstico',
    'roadmap',
    'biblioteca',
    'executivo',
    'secao',
    'seção',
    'maturidade'
  ];
  const hit = hints.some((h) => queryTokens.includes(tokenizar(h)[0] || h));
  return hit ? scoreKw * 1.35 + 0.4 : scoreKw * 1.05;
}

/**
 * Retrieval híbrido: keyword + embeddings persistidos (só gera embedding da query / faltantes).
 * @param {string} pergunta
 * @param {{ projetoId?: number|null, topK?: number, modoPergunta?: string, usuario?: object|null }} opts
 */
export async function recuperarChunksRelevantes(
  pergunta,
  { projetoId = null, topK = TOP_K, modoPergunta = 'auto', usuario = null } = {}
) {
  const q = String(pergunta || '').trim();
  const queryTokens = tokenizar(q);
  const modoNorm = normalizarModoAssistente(modoPergunta);

  let pool = [
    ...obterChunksGlobaisMemoria(),
    ...(await chunksProjeto(projetoId)),
    ...(await chunksRelatoriosIAProjeto(projetoId, { usuario }))
  ];
  pool = filtrarCandidatosPorModo(pool, modoNorm);

  // Modo book/projeto sem conteúdo: não inventar com manual genérico demais
  if ((modoNorm === 'book' || modoNorm === 'projeto') && !projetoId) {
    pool = obterChunksGlobaisMemoria().filter((c) => c.fonte === 'manual').slice(0, 4);
  }

  let ranked = pool
    .map((c) => {
      const raw = scoreKeyword(queryTokens, `${c.titulo}\n${c.texto}`);
      return {
        ...c,
        scoreKw: boostRelatorioNaQuery(queryTokens, raw, c.fonte)
      };
    })
    .filter((c) => c.scoreKw > 0.15)
    .sort((a, b) => b.scoreKw - a.scoreKw)
    .slice(0, Math.max(topK * 4, 24));

  if (ranked.length < 3) {
    ranked = pool.slice(0, 6).map((c, i) => ({ ...c, scoreKw: 1 - i * 0.05 }));
  }

  let modo = 'keyword';
  const precisaEmbed = ranked.filter((c) => !Array.isArray(c.embedding));
  const qEmbList = await embedOpenAIBatch([q]);
  const qEmb = qEmbList?.[0] || null;

  if (qEmb) {
    if (precisaEmbed.length) {
      const novos = await embedOpenAIBatch(
        precisaEmbed.map((c) => `${c.titulo}\n${c.texto}`.slice(0, 2000))
      );
      if (novos && novos.length === precisaEmbed.length) {
        precisaEmbed.forEach((c, i) => {
          c.embedding = novos[i];
        });
      }
    }

    const comEmb = ranked.filter((c) => Array.isArray(c.embedding));
    if (comEmb.length >= Math.min(3, ranked.length)) {
      ranked = ranked
        .map((c) => {
          const sim = Array.isArray(c.embedding) ? cosine(qEmb, c.embedding) : 0;
          return {
            ...c,
            scoreEmb: sim,
            score: Array.isArray(c.embedding)
              ? c.scoreKw * 0.45 + sim * 0.55
              : c.scoreKw * 0.85
          };
        })
        .sort((a, b) => b.score - a.score);
      modo = precisaEmbed.length === 0 ? 'hibrido_persistido' : 'hibrido';
    } else {
      ranked = ranked.map((c) => ({ ...c, score: c.scoreKw }));
    }
  } else {
    ranked = ranked.map((c) => ({ ...c, score: c.scoreKw }));
  }

  const top = [];
  let chars = 0;
  let deRelatorio = 0;
  const maxRelatorioSlots = Math.max(3, Math.ceil(topK * 0.6));
  for (const c of ranked) {
    if (top.length >= topK) break;
    if (c.fonte === 'relatorio_ia' && deRelatorio >= maxRelatorioSlots) continue;
    if (chars + c.texto.length > MAX_RETRIEVAL_CHARS) continue;
    top.push({
      fonte: c.fonte,
      titulo: c.titulo,
      texto: c.texto,
      score: Number((c.score || c.scoreKw || 0).toFixed(3)),
      ...(c.relatorioId != null ? { relatorioId: c.relatorioId } : {})
    });
    chars += c.texto.length;
    if (c.fonte === 'relatorio_ia') deRelatorio += 1;
  }

  return { chunks: top, modo, modoPergunta: modoNorm };
}

export function formatarChunksParaPrompt(chunks) {
  if (!chunks?.length) return '_Nenhum trecho recuperado._';
  return chunks
    .map(
      (c, i) =>
        `### Fonte ${i + 1}: ${c.titulo} (${c.fonte}, score ${c.score ?? '—'})\n${c.texto}`
    )
    .join('\n\n');
}

/** Persistência opcional de chunks globais — best-effort. */
export async function sincronizarChunksGlobaisNoDb() {
  await ensureAssistenteSchema();
  const chunks = obterChunksGlobaisMemoria();
  for (const c of chunks.slice(0, 200)) {
    try {
      const existing = await prisma.$queryRaw`
        SELECT id FROM "AssistenteChunk"
        WHERE "escopo" = 'global' AND "hashConteudo" = ${c.hashConteudo}
        LIMIT 1
      `;
      if (existing?.[0]?.id) continue;
      await prisma.$executeRaw`
        INSERT INTO "AssistenteChunk" ("escopo", "projetoId", "fonte", "titulo", "texto", "hashConteudo", "updatedAt")
        VALUES ('global', NULL, ${c.fonte}, ${c.titulo}, ${c.texto}, ${c.hashConteudo}, CURRENT_TIMESTAMP)
      `;
    } catch {
      /* ignore per-row */
    }
  }
}

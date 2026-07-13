/** Labels amigáveis para fases reportadas pelo backend (book SATF em background). */

export const FASES_BOOK_IA_ORDEM = [
  { fase: 'inicio_rota', label: 'Vinculando job em background', minPct: 31 },
  { fase: 'preparacao', label: 'Consolidando assessment da unidade', minPct: 32 },
  { fase: 'preparacao_dimensoes', label: 'Carregando dimensões e scores', minPct: 33 },
  { fase: 'preparacao_scores', label: 'Scores SATF e certificação', minPct: 34 },
  { fase: 'preparacao_contexto', label: 'Contexto e anexos do projeto', minPct: 34 },
  { fase: 'preparacao_blocos', label: 'Estrutura do book', minPct: 34 },
  { fase: 'preparacao_dados_block', label: 'Montando pacote de dados', minPct: 35 },
  { fase: 'preparacao_dados_ok', label: 'Pacote de dados pronto', minPct: 36 },
  { fase: 'preparacao_chunks_montagem', label: 'Montando prompts dos blocos', minPct: 36 },
  { fase: 'preparacao_chunks', label: 'Blocos de IA preparados', minPct: 37 },
  { fase: 'preparacao_ia', label: 'Conectando provedor de IA', minPct: 38 },
  { fase: 'inicio_chunks', label: 'Iniciando geração por blocos', minPct: 39 },
  { fase: 'geracao_ia', label: 'Gerando conteúdo com IA', minPct: 40 },
  { fase: 'chunk_estatico', label: 'Inserindo registros automáticos', minPct: 40 },
  { fase: 'heartbeat_worker', label: 'Aguardando processamento', minPct: 30 }
];

export function parseMetadataJobBook(job) {
  const raw = job?.metadata;
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function labelFaseBookIA(fase) {
  if (!fase) return null;
  const hit = FASES_BOOK_IA_ORDEM.find((x) => x.fase === fase);
  return hit?.label || String(fase).replace(/_/g, ' ');
}

/** Pipeline grosso exibido na UI (preparação → IA → finalização). */
export function pipelineGrossoBook(job) {
  const pct = Number(job?.progresso) || 0;
  const meta = parseMetadataJobBook(job);
  const fase = meta?.fase;
  const emGeracao =
    fase === 'geracao_ia' ||
    fase === 'chunk_estatico' ||
    (meta?.chunkAtual != null && meta?.totalChunks != null);
  const emFinal = pct >= 95;

  const etapas = [
    {
      id: 'prep',
      label: 'Preparação',
      desc: 'Dados, contexto e blocos',
      state: emFinal || emGeracao || pct >= 39 ? 'done' : pct >= 31 ? 'current' : 'pending'
    },
    {
      id: 'ia',
      label: 'Geração IA',
      desc: meta?.totalChunks
        ? `Blocos ${meta.chunkAtual ?? '…'}/${meta.totalChunks}`
        : 'Chamadas ao modelo',
      state: emFinal ? 'done' : emGeracao || pct >= 40 ? 'current' : 'pending'
    },
    {
      id: 'fim',
      label: 'Finalização',
      desc: 'Salvando na biblioteca',
      state: emFinal ? 'current' : 'pending'
    }
  ];

  if (job?.status === 'completed') {
    return etapas.map((e) => ({ ...e, state: 'done' }));
  }
  if (job?.status === 'failed' || job?.status === 'cancelled') {
    return etapas;
  }
  return etapas;
}

export function detalheChunkJob(job) {
  const meta = parseMetadataJobBook(job);
  if (meta?.fase === 'preparacao_chunks_montagem' && meta?.chunkPrepAtual) {
    return {
      atual: meta.chunkPrepAtual,
      total: meta.totalChunks || null,
      label: meta.chunkPrepLabel || meta.mensagem || job?.etapa || null,
      preparacao: true
    };
  }
  if (!meta?.totalChunks) return null;
  const atual = meta.chunkAtual ?? null;
  const label = meta.chunkLabel || meta.mensagem || job?.etapa || null;
  return { atual, total: meta.totalChunks, label };
}

export function textoProgressoPrincipal(job) {
  if (!job) return 'Aguardando…';
  if (job.etapa) return job.etapa;
  const meta = parseMetadataJobBook(job);
  if (meta?.fase) return labelFaseBookIA(meta.fase);
  return 'Gerando book…';
}

export function formatDurationMs(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m} min ${r} s`;
}

/** Estimativa linear pelo progresso % (melhora após ~5%). */
export function estimateRemainingMs(job) {
  if (!job?.startedAt || job.progresso == null) return null;
  const p = Number(job.progresso);
  if (p < 3 || p >= 100) return null;
  const elapsed = Date.now() - new Date(job.startedAt).getTime();
  if (elapsed < 1000) return null;
  const totalPred = elapsed / (p / 100);
  const rem = totalPred - elapsed;
  return Number.isFinite(rem) && rem > 0 ? rem : null;
}

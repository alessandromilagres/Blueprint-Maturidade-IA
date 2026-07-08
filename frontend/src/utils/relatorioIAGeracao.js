import { mapRelatorioIASalvoToViewShape } from './relatorioIAViewModel';

export function relatorioIdFromJobStatus(status) {
  return Number(status?.relatorioId || status?.relatorio?.id || 0);
}

export async function carregarRelatorioSalvoPorId(relatoriosIAApi, salvoId, validar) {
  const row = await relatoriosIAApi.buscar(salvoId);
  if (validar) validar(row);
  return mapRelatorioIASalvoToViewShape(row);
}

const STALE_MINUTES_EXECUTIVO = 20;
const STALE_MINUTES_BOOK = 120;
const TIPOS_BOOK = new Set([
  'completo',
  'completo_rapido',
  'completo_satf',
  'completo_satf_rapido',
  'book_unidade',
  'book_unidade_rapido',
  'book_unidade_satf',
  'book_unidade_satf_rapido'
]);

function limiteMinutosJobObsoleto(tipo) {
  return TIPOS_BOOK.has(tipo) ? STALE_MINUTES_BOOK : STALE_MINUTES_EXECUTIVO;
}

export function jobRelatorioIaEstaObsoleto(job, now = Date.now()) {
  if (!job || !['queued', 'running'].includes(job.status)) return false;
  const ref = job.updatedAt || job.startedAt || job.createdAt;
  if (!ref) return false;
  const minutos = (now - new Date(ref).getTime()) / 60_000;
  return minutos >= limiteMinutosJobObsoleto(job.tipo);
}

/** Ignora jobs zumbis; opcionalmente cancela no backend. */
export async function resolverJobRelatorioIaAtivo(jobs, dashboardApi) {
  const lista = Array.isArray(jobs) ? jobs : [];
  const ativo = lista.find((j) => ['queued', 'running'].includes(j.status));
  if (!ativo) return null;
  if (!jobRelatorioIaEstaObsoleto(ativo)) return ativo;
  try {
    await dashboardApi.cancelarRelatorioIABackground(ativo.id);
  } catch {
    /* job pode já ter sido marcado failed no backend */
  }
  return null;
}

export function resetEstadoGeracaoRelatorioIA(refs) {
  if (refs.geracaoIniciadaRef) refs.geracaoIniciadaRef.current = false;
  if (refs.backgroundRunningRef) refs.backgroundRunningRef.current = false;
}

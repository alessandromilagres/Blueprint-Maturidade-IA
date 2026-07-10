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

/** Mesmo critério do backend ao reutilizar job (`relatorios-ia-jobs/start`). */
export function jobRelatorioIaCompativelComPedido(
  job,
  { versaoId = null, filtroNivelMax = 3, empresaUnidadeId = null } = {}
) {
  const meta = job?.metadata || {};
  if (Number(meta.versaoId || 0) !== Number(versaoId || 0)) return false;
  const salvo = meta.filtroNivelPrioridadeMapeamentoMaturidadeAplicado;
  const a = salvo === undefined || salvo === null ? 3 : salvo;
  const b = filtroNivelMax === undefined || filtroNivelMax === null ? 3 : filtroNivelMax;
  if (a !== b) return false;
  const salvoUnidade = meta.empresaUnidadeId;
  const atualUnidade = empresaUnidadeId == null || empresaUnidadeId === '' ? null : Number(empresaUnidadeId);
  if (salvoUnidade == null && atualUnidade == null) return true;
  return Number(salvoUnidade) === Number(atualUnidade);
}

/** Ignora jobs zumbis; opcionalmente cancela no backend. */
export async function resolverJobRelatorioIaAtivo(jobs, dashboardApi, contexto = {}) {
  const lista = Array.isArray(jobs) ? jobs : [];
  const ativos = lista.filter(
    (j) =>
      ['queued', 'running'].includes(j.status) && jobRelatorioIaCompativelComPedido(j, contexto)
  );
  const ativo = ativos[0] || null;
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

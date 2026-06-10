/** AbortController por jobId — usado para cancelar o fetch longo do book em background. */
const abortControllers = new Map();

export function registerJobAbortController(jobId, ac) {
  if (jobId == null || jobId <= 0) return;
  abortControllers.set(jobId, ac);
}

export function unregisterJobAbortController(jobId) {
  if (jobId == null) return;
  abortControllers.delete(jobId);
}

/** Dispara abort no fetch interno do job (para a conexão HTTP e o handler detecta req "close"). */
export function abortJobLongFetch(jobId) {
  const ac = abortControllers.get(jobId);
  if (!ac) return false;
  try {
    ac.abort();
  } catch (_) {}
  abortControllers.delete(jobId);
  return true;
}

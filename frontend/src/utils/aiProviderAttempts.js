/**
 * Exibição de fallback/falhas entre provedores de IA (UI).
 */

export function coletarAvisosProvedor(data) {
  const fromRoot = Array.isArray(data?.avisosProvedor) ? data.avisosProvedor : [];
  const fromDados = Array.isArray(data?.dadosUsados?.avisosProvedor)
    ? data.dadosUsados.avisosProvedor
    : [];
  return fromRoot.length ? fromRoot : fromDados;
}

export function coletarAvisosProvedorJob(job) {
  const meta = job?.metadata;
  if (!meta || typeof meta !== 'object') return [];
  return Array.isArray(meta.avisosProvedor) ? meta.avisosProvedor : [];
}

export function resumirAvisoProvedor(aviso) {
  if (!aviso) return '';
  if (aviso.tipo === 'fallback_sucesso') {
    const falhas = (aviso.falhas || [])
      .map((f) => `${f.name}: ${f.error}`)
      .join(' → ');
    const bloco = aviso.chunkLabel ? ` (${aviso.chunkLabel})` : '';
    return `Fallback${bloco}: ${aviso.configuredProviderName || '—'} falhou (${falhas || '—'}); usado ${aviso.providerUsadoName || '—'}.`;
  }
  if (aviso.tipo === 'falha_total') {
    const falhas = (aviso.falhas || [])
      .map((f) => `${f.name}: ${f.error}`)
      .join(' → ');
    const bloco = aviso.chunkLabel ? ` (${aviso.chunkLabel})` : '';
    return `Falha total${bloco}: ${falhas || aviso.erroFinal || 'erro desconhecido'}.`;
  }
  return '';
}

export function formatarListaAvisosProvedor(avisos) {
  return (avisos || []).map(resumirAvisoProvedor).filter(Boolean);
}

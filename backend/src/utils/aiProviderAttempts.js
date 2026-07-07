/**
 * Rastreamento e formatação de tentativas/fallback entre provedores de IA.
 */

import { PROVIDERS } from '../services/ai-provider.js';

function truncateMsg(msg, max = 180) {
  const s = String(msg || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

export function providerDisplayName(providerId) {
  return PROVIDERS[providerId]?.name || providerId || '—';
}

export function getProviderAttempts(source) {
  if (!source) return [];
  if (Array.isArray(source.providerAttempts)) return source.providerAttempts;
  if (source instanceof Error && source.providerAttempts) return source.providerAttempts;
  return [];
}

export function formatProviderAttemptsLogLine(attempts, { configuredProvider } = {}) {
  if (!attempts?.length) return '';
  const parts = attempts.map((a) => `${a.name}: ${truncateMsg(a.error, 160)}`);
  let line = `[AI] Falhas antes do fallback: ${parts.join(' → ')}`;
  if (configuredProvider) {
    line += ` (configurado: ${providerDisplayName(configuredProvider)})`;
  }
  return line;
}

export function formatProviderFailureForMarkdown(source) {
  const attempts = getProviderAttempts(source);
  const finalMsg = truncateMsg(typeof source === 'string' ? source : source?.message, 220);
  if (!attempts.length) return finalMsg;
  const falhas = attempts
    .map((a) => `**${a.name}**: ${truncateMsg(a.error, 140)}`)
    .join('; ');
  return `${finalMsg}. Tentativas: ${falhas}`;
}

export function buildFallbackSuccessAviso(resultado, chunk) {
  if (!resultado?.usedFallback || !resultado?.providerAttempts?.length) return null;
  return {
    tipo: 'fallback_sucesso',
    chunkId: chunk?.id || null,
    chunkLabel: chunk?.label || null,
    configuredProvider: resultado.configuredProvider || null,
    configuredProviderName: providerDisplayName(resultado.configuredProvider),
    providerUsado: resultado.provider || null,
    providerUsadoName: providerDisplayName(resultado.provider),
    falhas: resultado.providerAttempts.map((a) => ({
      providerId: a.providerId,
      name: a.name,
      error: truncateMsg(a.error, 200)
    }))
  };
}

export function buildChunkFailureAviso(error, chunk) {
  const attempts = getProviderAttempts(error);
  return {
    tipo: 'falha_total',
    chunkId: chunk?.id || null,
    chunkLabel: chunk?.label || null,
    erroFinal: truncateMsg(error?.message, 300),
    falhas: attempts.map((a) => ({
      providerId: a.providerId,
      name: a.name,
      error: truncateMsg(a.error, 200)
    }))
  };
}

export function metadataFalhasProvedorChunk(error, chunk) {
  const aviso = buildChunkFailureAviso(error, chunk);
  return {
    falhasProvedor: aviso.falhas,
    erroFinal: aviso.erroFinal,
    chunkId: aviso.chunkId,
    chunkLabel: aviso.chunkLabel
  };
}

export function formatSecaoErroGenerico(chunk, error) {
  const detalhe = formatProviderFailureForMarkdown(error);
  return `> ⚠️ **Nota:** Esta seção (${chunk.label}) não pôde ser gerada. ${detalhe} Regenere o relatório se necessário.`;
}

/** Texto curto para etapa do job em background (visível na UI durante geração). */
export function formatEtapaFallbackSucesso(aviso, chunkLabel) {
  if (!aviso) return null;
  const bloco = chunkLabel || aviso.chunkLabel || 'bloco';
  const falha = aviso.falhas?.[0]?.name || aviso.configuredProviderName || '—';
  const usado = aviso.providerUsadoName || '—';
  return `⚠️ ${falha} falhou em «${bloco}» — continuando com ${usado}`;
}

/** Texto curto quando todos os provedores falharam num bloco (book segue no próximo). */
export function formatEtapaFalhaTotalChunk(aviso, chunkLabel) {
  if (!aviso) return null;
  const bloco = chunkLabel || aviso.chunkLabel || 'bloco';
  const cadeia = (aviso.falhas || []).map((f) => f.name).join(' → ') || 'IA';
  return `⚠️ ${cadeia} falhou em «${bloco}» — seguindo para o próximo bloco`;
}

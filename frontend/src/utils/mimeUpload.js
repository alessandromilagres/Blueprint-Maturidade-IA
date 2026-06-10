/**
 * Quando o browser não preenche file.type (comum em alguns SO/extensões),
 * inferimos pelo nome — deve coincidir com TIPOS_PERMITIDOS no backend (arquivos.js).
 */
const EXT_TO_MIME = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet'
};

export function inferMimeTypeFromFileName(fileName) {
  const lower = String(fileName || '').toLowerCase();
  const i = lower.lastIndexOf('.');
  const ext = i >= 0 ? lower.slice(i) : '';
  return EXT_TO_MIME[ext] || '';
}

/** Resolve MIME para upload quando file.type veio vazio ou genérico. */
export function resolveMimeTypeForProdutoUpload(file) {
  const raw = String(file.type || '').split(';')[0].trim().toLowerCase();
  if (raw && raw !== 'application/octet-stream') return raw;
  return inferMimeTypeFromFileName(file.name);
}

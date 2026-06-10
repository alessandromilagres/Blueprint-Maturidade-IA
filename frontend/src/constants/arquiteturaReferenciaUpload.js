/** Extensões e MIME para anexos de arquitetura de referência (alinhado ao backend). */
export const EXTENSOES_ARQUITETURA_REFERENCIA =
  '.pdf,.doc,.docx,.md,.markdown,.txt,.csv,.json,' +
  '.png,.jpg,.jpeg,.gif,.webp,.svg,' +
  '.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods';

const EXT_TO_MIME = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.odp': 'application/vnd.oasis.opendocument.presentation',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet'
};

/**
 * Muitos navegadores enviam .md como text/plain ou string vazia no file.type.
 */
export function mimeTypeParaUploadArquitetura(file) {
  const declared = (file?.type || '').split(';')[0].trim().toLowerCase();
  if (declared && declared !== 'application/octet-stream') {
    return declared;
  }
  const name = String(file?.name || '').toLowerCase();
  const dot = name.lastIndexOf('.');
  if (dot < 0) return '';
  const ext = name.slice(dot);
  return EXT_TO_MIME[ext] || '';
}

export const TEXTO_FORMATOS_ARQUITETURA_REFERENCIA =
  'PDF, Word (.doc, .docx), Markdown (.md), texto (.txt), CSV, JSON, ' +
  'PowerPoint, Excel, OpenDocument, imagens (PNG, JPEG, GIF, WebP, SVG). Até 10 MB por arquivo.';

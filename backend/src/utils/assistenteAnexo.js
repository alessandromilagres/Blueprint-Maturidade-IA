/**
 * Anexo efêmero do Assistente (#10): PDF/MD/TXT só nesta pergunta.
 * Não grava em ProjetoContexto — só no prompt da geração atual.
 */
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import {
  normalizarMimeUpload,
  extrairConteudoTexto
} from './projetoContexto.js';
import { truncarContexto } from './assistenteConhecimento.js';

export const MAX_ANEXO_ASSISTENTE_BYTES = 5 * 1024 * 1024;
export const MAX_ANEXO_TEXTO_CHARS = 16000;

const MIMES_PERMITIDOS = new Set([
  'text/plain',
  'text/markdown',
  'application/pdf'
]);

export function mimeAnexoAssistentePermitido(nomeOriginal, mimeType) {
  const mime = normalizarMimeUpload(nomeOriginal, mimeType);
  return MIMES_PERMITIDOS.has(mime) ? mime : null;
}

/**
 * @param {{ nomeOriginal?: string, mimeType?: string, arquivo?: string }|null} anexo
 * @returns {Promise<{ nome: string, mime: string, texto: string, chars: number }|null>}
 */
export async function processarAnexoAssistente(anexo) {
  if (!anexo || typeof anexo !== 'object') return null;
  const nome = String(anexo.nomeOriginal || anexo.nome || 'anexo').trim().slice(0, 200) || 'anexo';
  const mime = mimeAnexoAssistentePermitido(nome, anexo.mimeType);
  if (!mime) {
    const err = new Error('Anexo inválido. Use PDF, Markdown (.md) ou texto (.txt).');
    err.status = 400;
    throw err;
  }

  const b64 = String(anexo.arquivo || anexo.base64 || '')
    .replace(/^data:[^;]+;base64,/, '')
    .trim();
  if (!b64) {
    const err = new Error('Anexo sem conteúdo');
    err.status = 400;
    throw err;
  }

  let buffer;
  try {
    buffer = Buffer.from(b64, 'base64');
  } catch {
    const err = new Error('Anexo base64 inválido');
    err.status = 400;
    throw err;
  }
  if (!buffer.length) {
    const err = new Error('Anexo vazio');
    err.status = 400;
    throw err;
  }
  if (buffer.length > MAX_ANEXO_ASSISTENTE_BYTES) {
    const err = new Error('Anexo muito grande (máx. 5 MB)');
    err.status = 400;
    throw err;
  }

  const ext =
    mime === 'application/pdf'
      ? '.pdf'
      : mime === 'text/markdown'
        ? '.md'
        : '.txt';
  const tmp = path.join(os.tmpdir(), `assistente-anexo-${crypto.randomBytes(8).toString('hex')}${ext}`);
  try {
    await fs.writeFile(tmp, buffer);
    let texto = await extrairConteudoTexto(tmp, mime);
    if (!texto || !String(texto).trim()) {
      const err = new Error('Não foi possível extrair texto do anexo');
      err.status = 400;
      throw err;
    }
    texto = truncarContexto(String(texto).trim(), MAX_ANEXO_TEXTO_CHARS);
    return {
      nome,
      mime,
      texto,
      chars: texto.length
    };
  } finally {
    await fs.unlink(tmp).catch(() => {});
  }
}

export function formatarMarcadorAnexoUsuario(anexoMeta) {
  if (!anexoMeta?.nome) return '';
  return `\n\n[Anexo: ${anexoMeta.nome} — ${anexoMeta.chars || 0} chars]`;
}

export function blocoAnexoNoPrompt(anexoProcessado) {
  if (!anexoProcessado?.texto) return '';
  return [
    '# ANEXO DESTA PERGUNTA (efêmero — não faz parte do contexto permanente do projeto)',
    `Arquivo: **${anexoProcessado.nome}** (${anexoProcessado.mime})`,
    '',
    anexoProcessado.texto,
    '',
    'Use o anexo acima apenas se a pergunta atual pedir ou depender dele.'
  ].join('\n');
}

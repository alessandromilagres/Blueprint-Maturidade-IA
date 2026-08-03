/**
 * Anexo efêmero do Assistente (#10): PDF/MD/TXT/imagem só nesta pergunta.
 * Não grava em ProjetoContexto — só no prompt da geração atual.
 * Imagens vão por visão (Claude/GPT); texto é extraído de PDF/MD/TXT.
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

const MIMES_TEXTO = new Set(['text/plain', 'text/markdown', 'application/pdf']);
const MIMES_IMAGEM = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]);
const MIMES_PERMITIDOS = new Set([...MIMES_TEXTO, ...MIMES_IMAGEM]);

export function isMimeImagemAssistente(mime) {
  return MIMES_IMAGEM.has(String(mime || '').toLowerCase());
}

/** Detecta o tipo real pelo conteúdo (ex.: JPG renomeado para .pdf). */
export function detectarMimePorMagicBytes(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif';
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (buffer.toString('ascii', 0, 5) === '%PDF-') return 'application/pdf';
  return null;
}

export function mimeAnexoAssistentePermitido(nomeOriginal, mimeType) {
  const mime = normalizarMimeUpload(nomeOriginal, mimeType);
  return MIMES_PERMITIDOS.has(mime) ? mime : null;
}

function extParaMime(mime) {
  switch (mime) {
    case 'application/pdf':
      return '.pdf';
    case 'text/markdown':
      return '.md';
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/gif':
      return '.gif';
    case 'image/webp':
      return '.webp';
    default:
      return '.txt';
  }
}

/**
 * @param {{ nomeOriginal?: string, mimeType?: string, arquivo?: string }|null} anexo
 * @returns {Promise<{
 *   nome: string,
 *   mime: string,
 *   texto: string,
 *   chars: number,
 *   imagem?: { mimeType: string, base64: string }
 * }|null>}
 */
export async function processarAnexoAssistente(anexo) {
  if (!anexo || typeof anexo !== 'object') return null;
  const nome = String(anexo.nomeOriginal || anexo.nome || 'anexo').trim().slice(0, 200) || 'anexo';
  let mime = mimeAnexoAssistentePermitido(nome, anexo.mimeType);

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

  const mimeReal = detectarMimePorMagicBytes(buffer);
  // Conteúdo real vence extensão/MIME declarado (ex.: JPG renomeado para .pdf)
  if (mimeReal && MIMES_PERMITIDOS.has(mimeReal)) {
    mime = mimeReal;
  }

  if (!mime) {
    const err = new Error(
      'Anexo inválido. Use PDF, imagem (JPG/PNG/GIF/WebP), Markdown (.md) ou texto (.txt).'
    );
    err.status = 400;
    throw err;
  }

  if (isMimeImagemAssistente(mime)) {
    const texto =
      `[Imagem anexada: ${nome}. Analise o conteúdo visual (diagrama, fluxo, screenshot ou foto) ` +
      'e responda com base no que aparece na imagem.]';
    return {
      nome,
      mime,
      texto,
      chars: texto.length,
      imagem: { mimeType: mime, base64: b64 }
    };
  }

  const tmp = path.join(
    os.tmpdir(),
    `assistente-anexo-${crypto.randomBytes(8).toString('hex')}${extParaMime(mime)}`
  );
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
  if (anexoMeta.imagem) return `\n\n[Anexo imagem: ${anexoMeta.nome}]`;
  return `\n\n[Anexo: ${anexoMeta.nome} — ${anexoMeta.chars || 0} chars]`;
}

export function blocoAnexoNoPrompt(anexoProcessado) {
  if (!anexoProcessado) return '';
  if (anexoProcessado.imagem) {
    return [
      '# ANEXO DESTA PERGUNTA — IMAGEM (visão)',
      `Arquivo: **${anexoProcessado.nome}** (${anexoProcessado.mime})`,
      '',
      'A imagem está anexada nesta mensagem (multimodal). Descreva e use o conteúdo visual',
      '(fluxos, caixas de decisão, textos na figura) para responder a pergunta.',
      'Não diga que não consegue ver a imagem.'
    ].join('\n');
  }
  if (!anexoProcessado.texto) return '';
  return [
    '# ANEXO DESTA PERGUNTA (efêmero — não faz parte do contexto permanente do projeto)',
    `Arquivo: **${anexoProcessado.nome}** (${anexoProcessado.mime})`,
    '',
    anexoProcessado.texto,
    '',
    'Use o anexo acima apenas se a pergunta atual pedir ou depender dele.'
  ].join('\n');
}

/** Formato esperado por callAI / streamAI (`options.imagens`). */
export function imagensParaIA(anexoProcessado) {
  if (!anexoProcessado?.imagem?.base64) return undefined;
  return [
    {
      mimeType: anexoProcessado.imagem.mimeType,
      base64: anexoProcessado.imagem.base64
    }
  ];
}

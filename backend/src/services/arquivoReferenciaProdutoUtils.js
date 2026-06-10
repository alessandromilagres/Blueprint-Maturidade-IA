/**
 * Grava arquivos de referência de produto no disco + Prisma, alinhado a routes/arquivos.js
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { processarNotificacoesCadastroProduto } from './produto-cadastro-workflow.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_CONTEUDO_DB = 50000;

/** Prefixo de nomes gerados por "Salvar e gerar apoio com IA" — substituídos a cada nova geração. */
export const PREFIX_NOME_IA_IDEALIZACAO = 'IA-idealizacao-';

/** Slugs fixos dos quatro artefatos DT (deve coincidir com idealizacaoApoioEspecificacaoIA). */
export const SLUGS_ARTEFATOS_DT_FIXOS = ['mapa-empatia', 'personas', 'jornada-cliente', 'service-blueprint'];

export function nomesOriginaisArtefatosDt() {
  return SLUGS_ARTEFATOS_DT_FIXOS.map((s) => `${PREFIX_NOME_IA_IDEALIZACAO}${s}.md`);
}

const MIME_MD = 'text/markdown';

async function garantirDiretorioUpload() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Remove arquivos de referência criados por gerações anteriores da idealização (mesmo prefixo no nome).
 */
export async function removerArquivosReferenciaIdealizacaoIA(prisma, produtoId) {
  const antigos = await prisma.arquivoReferencia.findMany({
    where: {
      produtoId,
      nomeOriginal: { startsWith: PREFIX_NOME_IA_IDEALIZACAO }
    }
  });
  for (const a of antigos) {
    const fp = path.join(UPLOAD_DIR, a.nomeArmazenado);
    await fs.unlink(fp).catch(() => {});
    await prisma.arquivoReferencia.delete({ where: { id: a.id } }).catch(() => {});
  }
}

/** Remove só diagramas dinâmicos (mantém os 4 .md fixos de artefatos DT). */
export async function removerSomenteDiagramasIdealizacaoIA(prisma, produtoId) {
  const manter = new Set(nomesOriginaisArtefatosDt());
  const antigos = await prisma.arquivoReferencia.findMany({
    where: {
      produtoId,
      nomeOriginal: { startsWith: PREFIX_NOME_IA_IDEALIZACAO }
    }
  });
  for (const a of antigos) {
    if (manter.has(a.nomeOriginal)) continue;
    const fp = path.join(UPLOAD_DIR, a.nomeArmazenado);
    await fs.unlink(fp).catch(() => {});
    await prisma.arquivoReferencia.delete({ where: { id: a.id } }).catch(() => {});
  }
}

/** Remove só os quatro artefatos DT fixos. */
export async function removerSomenteArtefatosDtIdealizacaoIA(prisma, produtoId) {
  const nomes = nomesOriginaisArtefatosDt();
  const antigos = await prisma.arquivoReferencia.findMany({
    where: {
      produtoId,
      nomeOriginal: { in: nomes }
    }
  });
  for (const a of antigos) {
    const fp = path.join(UPLOAD_DIR, a.nomeArmazenado);
    await fs.unlink(fp).catch(() => {});
    await prisma.arquivoReferencia.delete({ where: { id: a.id } }).catch(() => {});
  }
}

/**
 * @param {{ prisma: import('@prisma/client').PrismaClient, produtoId: number, slug: string, corpoMarkdown: string, descricao?: string | null, categoria?: string }} p
 */
export async function criarArquivoMarkdownReferenciaProduto(p) {
  const {
    prisma,
    produtoId,
    slug,
    corpoMarkdown,
    descricao = null,
    categoria = 'fluxo'
  } = p;

  const safeSlug = String(slug || 'diagrama')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'diagrama';

  const nomeOriginal = `${PREFIX_NOME_IA_IDEALIZACAO}${safeSlug}.md`;
  const buffer = Buffer.from(corpoMarkdown, 'utf8');

  await garantirDiretorioUpload();

  const hash = crypto.randomBytes(16).toString('hex');
  const nomeArmazenado = `${produtoId}_${hash}.md`;
  const filePath = path.join(UPLOAD_DIR, nomeArmazenado);
  await fs.writeFile(filePath, buffer);

  const conteudoExtraido = corpoMarkdown.substring(0, MAX_CONTEUDO_DB);

  const arquivo = await prisma.arquivoReferencia.create({
    data: {
      produtoId,
      nomeOriginal,
      nomeArmazenado,
      mimeType: MIME_MD,
      tamanho: buffer.length,
      categoria,
      descricao: descricao || 'Diagrama gerado automaticamente a partir da idealização (Mermaid).',
      conteudoExtraido
    }
  });

  return arquivo;
}

export async function notificarPosArquivosReferencia(prisma, produtoId) {
  await processarNotificacoesCadastroProduto(prisma, produtoId).catch((err) =>
    console.error('[produto workflow] pós-arquivos idealização IA:', err)
  );
}

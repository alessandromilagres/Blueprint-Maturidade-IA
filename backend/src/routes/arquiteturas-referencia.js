/**
 * Arquiteturas de referência por empresa (cadastro) + anexos.
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middlewares/validate.js';
import { arquiteturaReferenciaSchemas } from '../validators/schemas.js';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseOffice } from 'officeparser';

const officeparser = { parseOffice };
const router = express.Router();

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const TIPOS_PERMITIDOS = {
  'image/png': { ext: '.png' },
  'image/jpeg': { ext: '.jpg' },
  'image/gif': { ext: '.gif' },
  'image/webp': { ext: '.webp' },
  'image/svg+xml': { ext: '.svg' },
  'application/pdf': { ext: '.pdf' },
  'text/plain': { ext: '.txt' },
  'text/markdown': { ext: '.md' },
  'text/csv': { ext: '.csv' },
  'application/json': { ext: '.json' },
  'application/msword': { ext: '.doc' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: '.docx' },
  'application/vnd.ms-powerpoint': { ext: '.ppt' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: '.pptx' },
  'application/vnd.ms-excel': { ext: '.xls' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: '.xlsx' },
  'application/vnd.oasis.opendocument.text': { ext: '.odt' },
  'application/vnd.oasis.opendocument.presentation': { ext: '.odp' },
  'application/vnd.oasis.opendocument.spreadsheet': { ext: '.ods' }
};

const EXT_PARA_MIME = {
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

/** Prioriza extensão do nome (ex.: .md como text/markdown mesmo se o browser enviar text/plain). */
function resolverMimePorNome(nomeOriginal, mimeDeclarado) {
  const ext = path.extname(String(nomeOriginal || '')).toLowerCase();
  const mimePorExt = EXT_PARA_MIME[ext];
  if (mimePorExt && TIPOS_PERMITIDOS[mimePorExt]) return mimePorExt;
  const raw = String(mimeDeclarado || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (raw && raw !== 'application/octet-stream' && TIPOS_PERMITIDOS[raw]) return raw;
  return '';
}

const TIPOS_OFFICE = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.oasis.opendocument.spreadsheet'
];

function usuarioPodeGerirEmpresa(usuario, empresaId) {
  if (!usuario) return false;
  const r = String(usuario.role || '').trim().toLowerCase();
  if (r === 'admin') return true;
  return Number(usuario.empresaId) === Number(empresaId);
}

async function garantirDiretorioUpload() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

async function extrairConteudoTexto(filePath, mimeType) {
  try {
    if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'text/csv') {
      const conteudo = await fs.readFile(filePath, 'utf-8');
      return conteudo.substring(0, 50000);
    }
    if (mimeType === 'image/svg+xml') {
      const conteudo = await fs.readFile(filePath, 'utf-8');
      return conteudo.substring(0, 50000);
    }
    if (mimeType === 'application/json') {
      const conteudo = await fs.readFile(filePath, 'utf-8');
      return conteudo.substring(0, 50000);
    }
    if (TIPOS_OFFICE.includes(mimeType)) {
      try {
        const resultado = await new Promise((resolve, reject) => {
          officeparser.parseOffice(filePath, (data, err) => {
            if (err) reject(err);
            else resolve(data);
          });
        });
        let conteudo;
        if (resultado && typeof resultado.toText === 'function') {
          conteudo = resultado.toText();
        } else if (typeof resultado === 'string') {
          conteudo = resultado;
        }
        if (conteudo && typeof conteudo === 'string') {
          return conteudo.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim().substring(0, 50000);
        }
      } catch {
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** GET ?empresaId= — lista ativas (e inativas se admin quiser — por ora todas não deletadas) */
router.get('/', async (req, res) => {
  try {
    const empresaId = req.query.empresaId ? parseInt(req.query.empresaId, 10) : NaN;
    if (Number.isNaN(empresaId) || empresaId <= 0) {
      return res.status(400).json({ error: 'Informe empresaId na query' });
    }
    if (!usuarioPodeGerirEmpresa(req.usuario, empresaId)) {
      return res.status(403).json({ error: 'Sem permissão para listar arquiteturas desta empresa.' });
    }
    const lista = await prisma.arquiteturaReferencia.findMany({
      where: { empresaId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { arquivos: true, produtos: true } }
      }
    });
    res.json(lista);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/anexos/:arquivoId', async (req, res) => {
  try {
    const arquivoId = parseInt(req.params.arquivoId, 10);
    if (Number.isNaN(arquivoId) || arquivoId <= 0) return res.status(400).json({ error: 'ID inválido' });
    const fileRow = await prisma.arquivoArquiteturaReferencia.findUnique({
      where: { id: arquivoId },
      include: { arquiteturaReferencia: true }
    });
    if (!fileRow) return res.status(404).json({ error: 'Arquivo não encontrado' });
    if (!usuarioPodeGerirEmpresa(req.usuario, fileRow.arquiteturaReferencia.empresaId)) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }
    try {
      await fs.unlink(path.join(UPLOAD_DIR, fileRow.nomeArmazenado));
    } catch {
      /* ignore */
    }
    await prisma.arquivoArquiteturaReferencia.delete({ where: { id: arquivoId } });
    res.status(204).send();
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' });
    const row = await prisma.arquiteturaReferencia.findUnique({
      where: { id },
      include: {
        empresa: { select: { id: true, nome: true } },
        arquivos: { where: { ativo: true }, orderBy: { createdAt: 'desc' } }
      }
    });
    if (!row) return res.status(404).json({ error: 'Não encontrada' });
    if (!usuarioPodeGerirEmpresa(req.usuario, row.empresaId)) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', validate(arquiteturaReferenciaSchemas.criar), async (req, res) => {
  try {
    const { empresaId, ...data } = req.body;
    if (!usuarioPodeGerirEmpresa(req.usuario, empresaId)) {
      return res.status(403).json({ error: 'Sem permissão para criar nesta empresa.' });
    }
    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) return res.status(400).json({ error: 'Empresa não encontrada' });
    const row = await prisma.arquiteturaReferencia.create({
      data: {
        empresaId,
        nome: data.nome,
        descricao: data.descricao ?? null,
        tipoArquitetura: data.tipoArquitetura || 'layered',
        ciCd: data.ciCd ?? null,
        tecnologia: data.tecnologia ?? null,
        topologia: data.topologia ?? null,
        padroesQualidade: data.padroesQualidade ?? null,
        segurancaCompliance: data.segurancaCompliance ?? null,
        observabilidade: data.observabilidade ?? null,
        ambientesImplantacao: data.ambientesImplantacao ?? null,
        responsavelArquitetura: data.responsavelArquitetura ?? null,
        custoOperacionalNotas: data.custoOperacionalNotas ?? null,
        ativo: data.ativo !== false
      },
      include: { empresa: { select: { id: true, nome: true } } }
    });
    res.status(201).json(row);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', validate(arquiteturaReferenciaSchemas.atualizar), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' });
    const existente = await prisma.arquiteturaReferencia.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: 'Não encontrada' });
    if (!usuarioPodeGerirEmpresa(req.usuario, existente.empresaId)) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }
    const row = await prisma.arquiteturaReferencia.update({
      where: { id },
      data: req.body,
      include: { empresa: { select: { id: true, nome: true } } }
    });
    res.json(row);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) return res.status(400).json({ error: 'ID inválido' });
    const existente = await prisma.arquiteturaReferencia.findUnique({
      where: { id },
      include: { arquivos: true }
    });
    if (!existente) return res.status(404).json({ error: 'Não encontrada' });
    if (!usuarioPodeGerirEmpresa(req.usuario, existente.empresaId)) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }
    for (const a of existente.arquivos) {
      try {
        await fs.unlink(path.join(UPLOAD_DIR, a.nomeArmazenado));
      } catch {
        /* ignore */
      }
    }
    await prisma.arquiteturaReferencia.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/arquivos/upload-multipart', async (req, res) => {
  try {
    const arquiteturaReferenciaId = parseInt(req.params.id, 10);
    if (Number.isNaN(arquiteturaReferenciaId) || arquiteturaReferenciaId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const arq = await prisma.arquiteturaReferencia.findUnique({ where: { id: arquiteturaReferenciaId } });
    if (!arq) return res.status(404).json({ error: 'Arquitetura não encontrada' });
    if (!usuarioPodeGerirEmpresa(req.usuario, arq.empresaId)) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }
    const { arquivo, nomeOriginal, mimeType, categoria, descricao } = req.body;
    if (!arquivo || !nomeOriginal) {
      return res.status(400).json({ error: 'Dados incompletos (arquivo e nomeOriginal são obrigatórios)' });
    }
    const mimeResolvido = resolverMimePorNome(nomeOriginal, mimeType);
    if (!mimeResolvido || !TIPOS_PERMITIDOS[mimeResolvido]) {
      return res.status(400).json({
        error:
          'Tipo de arquivo não permitido ou extensão não reconhecida. Use PDF, Office, Markdown, texto, CSV, JSON, planilhas ou imagens (PNG, JPEG, GIF, WebP, SVG).',
        extensao: path.extname(String(nomeOriginal)).toLowerCase()
      });
    }
    await garantirDiretorioUpload();
    const buffer = Buffer.from(arquivo, 'base64');
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'Arquivo muito grande (máximo 10MB)' });
    }
    const tipoInfo = TIPOS_PERMITIDOS[mimeResolvido];
    const hash = crypto.randomBytes(16).toString('hex');
    const nomeArmazenado = `arqref_${arquiteturaReferenciaId}_${hash}${tipoInfo.ext}`;
    const filePath = path.join(UPLOAD_DIR, nomeArmazenado);
    await fs.writeFile(filePath, buffer);
    const conteudoExtraido = await extrairConteudoTexto(filePath, mimeResolvido);
    const salvo = await prisma.arquivoArquiteturaReferencia.create({
      data: {
        arquiteturaReferenciaId,
        nomeOriginal,
        nomeArmazenado,
        mimeType: mimeResolvido,
        tamanho: buffer.length,
        categoria: categoria || 'referencia_arquitetura',
        descricao: descricao || null,
        conteudoExtraido
      }
    });
    res.status(201).json(salvo);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;

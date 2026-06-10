/**
 * Rotas de Arquivos de Referência
 * Upload e gerenciamento de arquivos para enriquecer especificações
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { processarNotificacoesCadastroProduto } from '../services/produto-cadastro-workflow.js';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseOffice } from 'officeparser';

const officeparser = { parseOffice };

const router = express.Router();

// Diretório de uploads
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/** Alinha com inferência do frontend (mime vazio / octet-stream). */
const EXTENSAO_PARA_MIME = {
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

function normalizarMimeUpload(nomeOriginal, mimeType) {
  const base = String(mimeType || '').split(';')[0].trim().toLowerCase();
  if (base && base !== 'application/octet-stream') return base;
  const lower = String(nomeOriginal || '').toLowerCase();
  const dot = lower.lastIndexOf('.');
  const ext = dot >= 0 ? lower.slice(dot) : '';
  return EXTENSAO_PARA_MIME[ext] || base || '';
}

// Tipos de arquivo permitidos
const TIPOS_PERMITIDOS = {
  // Imagens
  'image/png': { ext: '.png', categoria: 'imagem' },
  'image/jpeg': { ext: '.jpg', categoria: 'imagem' },
  'image/gif': { ext: '.gif', categoria: 'imagem' },
  'image/webp': { ext: '.webp', categoria: 'imagem' },
  // PDF
  'application/pdf': { ext: '.pdf', categoria: 'documento' },
  // Texto simples
  'text/plain': { ext: '.txt', categoria: 'documento' },
  'text/markdown': { ext: '.md', categoria: 'documento' },
  'text/csv': { ext: '.csv', categoria: 'dados' },
  'application/json': { ext: '.json', categoria: 'dados' },
  // Microsoft Word
  'application/msword': { ext: '.doc', categoria: 'documento' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: '.docx', categoria: 'documento' },
  // Microsoft PowerPoint
  'application/vnd.ms-powerpoint': { ext: '.ppt', categoria: 'documento' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: '.pptx', categoria: 'documento' },
  // Microsoft Excel
  'application/vnd.ms-excel': { ext: '.xls', categoria: 'dados' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: '.xlsx', categoria: 'dados' },
  // OpenDocument (LibreOffice)
  'application/vnd.oasis.opendocument.text': { ext: '.odt', categoria: 'documento' },
  'application/vnd.oasis.opendocument.presentation': { ext: '.odp', categoria: 'documento' },
  'application/vnd.oasis.opendocument.spreadsheet': { ext: '.ods', categoria: 'dados' },
};

// Garante que o diretório de uploads existe
async function garantirDiretorioUpload() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Tipos que suportam extração via officeparser
const TIPOS_OFFICE = [
  // Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // PowerPoint
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // PDF
  'application/pdf',
  // OpenDocument (LibreOffice)
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.oasis.opendocument.spreadsheet'
];

// Extrai texto de arquivos de texto e documentos Office
async function extrairConteudoTexto(filePath, mimeType) {
  try {
    // Arquivos de texto simples
    if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'text/csv') {
      const conteudo = await fs.readFile(filePath, 'utf-8');
      return conteudo.substring(0, 50000); // Limita a 50k caracteres
    }
    
    if (mimeType === 'application/json') {
      const conteudo = await fs.readFile(filePath, 'utf-8');
      return conteudo.substring(0, 50000);
    }
    
    // Documentos Office (Word, PowerPoint) e PDF usando officeparser
    if (TIPOS_OFFICE.includes(mimeType)) {
      try {
        // officeparser usa callback, convertemos para Promise
        const resultado = await new Promise((resolve, reject) => {
          officeparser.parseOffice(filePath, (data, err) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
        
        // officeparser retorna objeto com método toText() ou string direta
        let conteudo;
        if (resultado && typeof resultado.toText === 'function') {
          conteudo = resultado.toText();
        } else if (typeof resultado === 'string') {
          conteudo = resultado;
        }
        
        if (conteudo && typeof conteudo === 'string') {
          // Limpa espaços excessivos e limita tamanho
          const conteudoLimpo = conteudo
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim()
            .substring(0, 50000);
          console.log(`[Extração] Sucesso: ${filePath} - ${conteudoLimpo.length} caracteres`);
          return conteudoLimpo;
        }
      } catch (parseError) {
        console.warn(`Não foi possível extrair texto de ${filePath}:`, parseError.message);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao extrair conteúdo:', error);
    return null;
  }
}

/**
 * GET /api/arquivos/produto/:produtoId
 * Lista todos os arquivos de referência de um produto
 */
router.get('/produto/:produtoId', async (req, res) => {
  try {
    const produtoId = parseInt(req.params.produtoId);
    
    const arquivos = await prisma.arquivoReferencia.findMany({
      where: { 
        produtoId,
        ativo: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(arquivos);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/arquivos/upload/:produtoId
 * Upload de arquivo de referência
 */
router.post('/upload/:produtoId', express.raw({ 
  type: ['image/*', 'application/pdf', 'text/*', 'application/json'],
  limit: MAX_FILE_SIZE 
}), async (req, res) => {
  try {
    const produtoId = parseInt(req.params.produtoId);
    const mimeType = req.headers['content-type']?.split(';')[0];
    const nomeOriginal = decodeURIComponent(req.headers['x-filename'] || 'arquivo');
    const categoria = req.headers['x-categoria'] || 'geral';
    const descricao = req.headers['x-descricao'] ? decodeURIComponent(req.headers['x-descricao']) : null;
    
    // Verifica se o produto existe
    const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Verifica tipo de arquivo
    if (!TIPOS_PERMITIDOS[mimeType]) {
      return res.status(400).json({ 
        error: 'Tipo de arquivo não permitido',
        tiposPermitidos: Object.keys(TIPOS_PERMITIDOS)
      });
    }
    
    // Verifica tamanho
    if (req.body.length > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'Arquivo muito grande (máximo 10MB)' });
    }
    
    await garantirDiretorioUpload();
    
    // Gera nome único para o arquivo
    const tipoInfo = TIPOS_PERMITIDOS[mimeType];
    const hash = crypto.randomBytes(16).toString('hex');
    const nomeArmazenado = `${produtoId}_${hash}${tipoInfo.ext}`;
    const filePath = path.join(UPLOAD_DIR, nomeArmazenado);
    
    // Salva o arquivo
    await fs.writeFile(filePath, req.body);
    
    // Extrai conteúdo de texto se possível
    const conteudoExtraido = await extrairConteudoTexto(filePath, mimeType);
    
    // Registra no banco
    const arquivo = await prisma.arquivoReferencia.create({
      data: {
        produtoId,
        nomeOriginal,
        nomeArmazenado,
        mimeType,
        tamanho: req.body.length,
        categoria,
        descricao,
        conteudoExtraido
      }
    });

    processarNotificacoesCadastroProduto(prisma, produtoId).catch((err) =>
      console.error('[produto workflow] pós-upload:', err)
    );

    res.status(201).json(arquivo);
    
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/arquivos/upload-multipart/:produtoId
 * Upload de arquivo via JSON com base64 (usado pelo frontend)
 */
router.post('/upload-multipart/:produtoId', async (req, res) => {
  try {
    const produtoId = parseInt(req.params.produtoId);
    const { arquivo, nomeOriginal, mimeType: mimeRaw, categoria, descricao } = req.body;
    
    if (!arquivo || !nomeOriginal) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const mimeType = normalizarMimeUpload(nomeOriginal, mimeRaw);
    if (!mimeType) {
      return res.status(400).json({
        error:
          'Tipo do arquivo não identificado. Use uma extensão conhecida (.pdf, .docx, .png, …) ou outro navegador.'
      });
    }
    
    // Verifica se o produto existe
    const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Verifica tipo de arquivo
    if (!TIPOS_PERMITIDOS[mimeType]) {
      return res.status(400).json({ 
        error: 'Tipo de arquivo não permitido',
        tiposPermitidos: Object.keys(TIPOS_PERMITIDOS)
      });
    }
    
    await garantirDiretorioUpload();
    
    // Decodifica o arquivo de base64
    const buffer = Buffer.from(arquivo, 'base64');
    
    // Verifica tamanho
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'Arquivo muito grande (máximo 10MB)' });
    }
    
    // Gera nome único para o arquivo
    const tipoInfo = TIPOS_PERMITIDOS[mimeType];
    const hash = crypto.randomBytes(16).toString('hex');
    const nomeArmazenado = `${produtoId}_${hash}${tipoInfo.ext}`;
    const filePath = path.join(UPLOAD_DIR, nomeArmazenado);
    
    // Salva o arquivo
    await fs.writeFile(filePath, buffer);
    
    // Extrai conteúdo de texto se possível
    const conteudoExtraido = await extrairConteudoTexto(filePath, mimeType);
    
    // Registra no banco
    const arquivoSalvo = await prisma.arquivoReferencia.create({
      data: {
        produtoId,
        nomeOriginal,
        nomeArmazenado,
        mimeType,
        tamanho: buffer.length,
        categoria: categoria || 'geral',
        descricao: descricao || null,
        conteudoExtraido
      }
    });

    processarNotificacoesCadastroProduto(prisma, produtoId).catch((err) =>
      console.error('[produto workflow] pós-upload:', err)
    );

    res.status(201).json(arquivoSalvo);
    
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/arquivos/:id
 * Retorna informações de um arquivo específico
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const arquivo = await prisma.arquivoReferencia.findUnique({
      where: { id }
    });
    
    if (!arquivo) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    res.json(arquivo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/arquivos/:id/download
 * Download do arquivo
 */
router.get('/:id/download', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const arquivo = await prisma.arquivoReferencia.findUnique({
      where: { id }
    });
    
    if (!arquivo) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    const filePath = path.join(UPLOAD_DIR, arquivo.nomeArmazenado);
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Arquivo não encontrado no disco' });
    }
    
    res.setHeader('Content-Type', arquivo.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(arquivo.nomeOriginal)}"`);
    
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/arquivos/:id/visualizar
 * Visualização inline do arquivo (para imagens)
 */
router.get('/:id/visualizar', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const arquivo = await prisma.arquivoReferencia.findUnique({
      where: { id }
    });
    
    if (!arquivo) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    const filePath = path.join(UPLOAD_DIR, arquivo.nomeArmazenado);
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Arquivo não encontrado no disco' });
    }
    
    res.setHeader('Content-Type', arquivo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(arquivo.nomeOriginal)}"`);
    
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/arquivos/:id
 * Atualiza metadados do arquivo
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { categoria, descricao } = req.body;
    
    const arquivo = await prisma.arquivoReferencia.update({
      where: { id },
      data: {
        categoria,
        descricao
      }
    });
    
    res.json(arquivo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/arquivos/:id
 * Remove um arquivo (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const hardDelete = req.query.hard === 'true';
    
    const arquivo = await prisma.arquivoReferencia.findUnique({
      where: { id }
    });
    
    if (!arquivo) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    if (hardDelete) {
      // Remove o arquivo do disco
      const filePath = path.join(UPLOAD_DIR, arquivo.nomeArmazenado);
      try {
        await fs.unlink(filePath);
      } catch (e) {
        console.warn('Arquivo não encontrado no disco:', e.message);
      }
      
      // Remove do banco
      await prisma.arquivoReferencia.delete({ where: { id } });
    } else {
      // Soft delete
      await prisma.arquivoReferencia.update({
        where: { id },
        data: { ativo: false }
      });
    }
    
    res.json({ message: 'Arquivo removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/arquivos/categorias
 * Lista categorias disponíveis
 */
router.get('/meta/categorias', async (req, res) => {
  res.json([
    { id: 'geral', nome: 'Geral', descricao: 'Arquivos gerais de referência' },
    { id: 'mockup', nome: 'Mockup/Wireframe', descricao: 'Designs e protótipos visuais' },
    { id: 'fluxo', nome: 'Diagrama de Fluxo', descricao: 'Fluxogramas e diagramas de processo' },
    { id: 'requisito', nome: 'Documento de Requisito', descricao: 'Especificações existentes' },
    { id: 'referencia', nome: 'Referência', descricao: 'Material de referência e benchmarks' },
    { id: 'dados', nome: 'Dados/Planilhas', descricao: 'Arquivos CSV, JSON com dados' }
  ]);
});

/**
 * POST /api/arquivos/reprocessar/:id
 * Reprocessa um arquivo para extrair conteúdo novamente
 */
router.post('/reprocessar/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const arquivo = await prisma.arquivoReferencia.findUnique({
      where: { id }
    });
    
    if (!arquivo) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    const filePath = path.join(UPLOAD_DIR, arquivo.nomeArmazenado);
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Arquivo não encontrado no disco' });
    }
    
    // Extrai conteúdo novamente
    const conteudoExtraido = await extrairConteudoTexto(filePath, arquivo.mimeType);
    
    // Atualiza no banco
    const arquivoAtualizado = await prisma.arquivoReferencia.update({
      where: { id },
      data: { conteudoExtraido }
    });
    
    res.json({
      ...arquivoAtualizado,
      conteudoExtraidoTamanho: conteudoExtraido?.length || 0
    });
  } catch (error) {
    console.error('Erro ao reprocessar:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/arquivos/reprocessar-todos/:produtoId
 * Reprocessa todos os arquivos de um produto
 */
router.post('/reprocessar-todos/:produtoId', async (req, res) => {
  try {
    const produtoId = parseInt(req.params.produtoId);
    
    const arquivos = await prisma.arquivoReferencia.findMany({
      where: { produtoId, ativo: true }
    });
    
    const resultados = [];
    
    for (const arquivo of arquivos) {
      const filePath = path.join(UPLOAD_DIR, arquivo.nomeArmazenado);
      
      try {
        await fs.access(filePath);
        const conteudoExtraido = await extrairConteudoTexto(filePath, arquivo.mimeType);
        
        await prisma.arquivoReferencia.update({
          where: { id: arquivo.id },
          data: { conteudoExtraido }
        });
        
        resultados.push({
          id: arquivo.id,
          nome: arquivo.nomeOriginal,
          sucesso: true,
          tamanhoExtraido: conteudoExtraido?.length || 0
        });
      } catch (e) {
        resultados.push({
          id: arquivo.id,
          nome: arquivo.nomeOriginal,
          sucesso: false,
          erro: e.message
        });
      }
    }
    
    res.json({
      total: arquivos.length,
      processados: resultados.filter(r => r.sucesso).length,
      falhas: resultados.filter(r => !r.sucesso).length,
      resultados
    });
  } catch (error) {
    console.error('Erro ao reprocessar arquivos:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

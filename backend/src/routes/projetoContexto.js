import express from 'express';
import { promises as fs } from 'fs';
import { prisma } from '../lib/prisma.js';
import {
  carregarContextoProjeto,
  salvarContextoProjeto,
  uploadArquivoContextoProjeto,
  removerArquivoContextoProjeto,
  obterArquivoContextoProjeto,
  normalizarMimeUpload
} from '../utils/projetoContexto.js';

const router = express.Router();

function parseId(param) {
  const id = parseInt(String(param), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

const PERFIS_EDITAR = ['admin', 'gestor', 'sysmap', 'negocios', 'ti', 'executivo'];
function podeEditar(role) {
  return PERFIS_EDITAR.includes(String(role || '').trim().toLowerCase());
}

router.get('/:id/contexto', async (req, res) => {
  const projetoId = parseId(req.params.id);
  if (!projetoId) return res.status(400).json({ error: 'ID de projeto inválido' });
  try {
    const data = await carregarContextoProjeto(prisma, projetoId);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Erro ao carregar contexto do projeto' });
  }
});

router.put('/:id/contexto', async (req, res) => {
  const projetoId = parseId(req.params.id);
  if (!projetoId) return res.status(400).json({ error: 'ID de projeto inválido' });
  if (!podeEditar(req.usuario?.role)) {
    return res.status(403).json({ error: 'Sem permissão para editar o contexto do projeto' });
  }
  try {
    const data = await salvarContextoProjeto(prisma, projetoId, req.body);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Erro ao salvar contexto do projeto' });
  }
});

router.post('/:id/contexto/upload', async (req, res) => {
  const projetoId = parseId(req.params.id);
  if (!projetoId) return res.status(400).json({ error: 'ID de projeto inválido' });
  if (!podeEditar(req.usuario?.role)) {
    return res.status(403).json({ error: 'Sem permissão para enviar documentos ao projeto' });
  }
  try {
    const { arquivo, nomeOriginal, mimeType: mimeRaw, descricao } = req.body || {};
    if (!arquivo || !nomeOriginal) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }
    const mimeType = normalizarMimeUpload(nomeOriginal, mimeRaw);
    if (!mimeType) {
      return res.status(400).json({ error: 'Tipo do arquivo não identificado' });
    }
    const buffer = Buffer.from(arquivo, 'base64');
    const result = await uploadArquivoContextoProjeto(prisma, projetoId, {
      buffer,
      nomeOriginal,
      mimeType,
      descricao
    });
    const ctx = await carregarContextoProjeto(prisma, projetoId);
    res.json({ ...result, contexto: ctx });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Erro no upload' });
  }
});

router.get('/:id/contexto/arquivos/:arquivoId/visualizar', async (req, res) => {
  const projetoId = parseId(req.params.id);
  const arquivoId = parseId(req.params.arquivoId);
  if (!projetoId || !arquivoId) return res.status(400).json({ error: 'IDs inválidos' });
  try {
    const arq = await obterArquivoContextoProjeto(prisma, projetoId, arquivoId);
    res.setHeader('Content-Type', arq.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(arq.nomeOriginal)}"`);
    const data = await fs.readFile(arq.filePath);
    res.send(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Erro ao visualizar arquivo' });
  }
});

router.get('/:id/contexto/arquivos/:arquivoId/download', async (req, res) => {
  const projetoId = parseId(req.params.id);
  const arquivoId = parseId(req.params.arquivoId);
  if (!projetoId || !arquivoId) return res.status(400).json({ error: 'IDs inválidos' });
  try {
    const arq = await obterArquivoContextoProjeto(prisma, projetoId, arquivoId);
    res.setHeader('Content-Type', arq.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(arq.nomeOriginal)}"`);
    const data = await fs.readFile(arq.filePath);
    res.send(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Erro ao baixar arquivo' });
  }
});

router.delete('/:id/contexto/arquivos/:arquivoId', async (req, res) => {
  const projetoId = parseId(req.params.id);
  const arquivoId = parseId(req.params.arquivoId);
  if (!projetoId || !arquivoId) {
    return res.status(400).json({ error: 'IDs inválidos' });
  }
  if (!podeEditar(req.usuario?.role)) {
    return res.status(403).json({ error: 'Sem permissão para remover documentos do projeto' });
  }
  try {
    await removerArquivoContextoProjeto(prisma, projetoId, arquivoId);
    const ctx = await carregarContextoProjeto(prisma, projetoId);
    res.json(ctx);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Erro ao remover arquivo' });
  }
});

export default router;

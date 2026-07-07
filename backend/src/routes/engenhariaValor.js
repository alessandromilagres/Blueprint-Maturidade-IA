import express from 'express';
import { prisma } from '../lib/prisma.js';
import {
  montarEngenhariaValorProduto,
  montarRoadmapProdutos,
  salvarEngenhariaValorProduto
} from '../utils/engenhariaValorProduto.js';

const router = express.Router();

function parseId(param) {
  const id = parseInt(String(param), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

const PERFIS_EDITAR = ['admin', 'gestor', 'sysmap', 'negocios', 'ti', 'executivo'];
function podeEditar(role) {
  return PERFIS_EDITAR.includes(String(role || '').trim().toLowerCase());
}

router.get('/projeto/:id/roadmap', async (req, res) => {
  const projetoId = parseId(req.params.id);
  if (!projetoId) return res.status(400).json({ error: 'ID de projeto inválido' });
  try {
    const data = await montarRoadmapProdutos(prisma, projetoId);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Erro ao carregar roadmap de produtos' });
  }
});

router.get('/produto/:id', async (req, res) => {
  const produtoId = parseId(req.params.id);
  if (!produtoId) return res.status(400).json({ error: 'ID de produto inválido' });
  try {
    const data = await montarEngenhariaValorProduto(prisma, produtoId);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Erro ao carregar engenharia de valor' });
  }
});

router.put('/produto/:id', async (req, res) => {
  const produtoId = parseId(req.params.id);
  if (!produtoId) return res.status(400).json({ error: 'ID de produto inválido' });
  if (!podeEditar(req.usuario?.role)) {
    return res.status(403).json({ error: 'Sem permissão para editar a engenharia de valor' });
  }
  try {
    const data = await salvarEngenhariaValorProduto(prisma, produtoId, req.body, req.usuario?.id);
    res.json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Erro ao salvar engenharia de valor' });
  }
});

export default router;

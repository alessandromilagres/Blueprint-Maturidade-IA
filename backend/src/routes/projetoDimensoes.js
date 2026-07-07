import express from 'express';
import { prisma } from '../lib/prisma.js';
import {
  montarDimensoesProjeto,
  salvarDimensoesProjeto
} from '../utils/projetoDimensoesConfig.js';

const router = express.Router();

function parseId(param) {
  const id = parseInt(String(param), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

const PERFIS_EDITAR = ['admin', 'gestor', 'sysmap', 'negocios', 'ti', 'executivo'];
function podeEditar(role) {
  return PERFIS_EDITAR.includes(String(role || '').trim().toLowerCase());
}

router.get('/:id/dimensoes', async (req, res) => {
  const projetoId = parseId(req.params.id);
  if (!projetoId) return res.status(400).json({ error: 'ID de projeto inválido' });
  try {
    const data = await montarDimensoesProjeto(prisma, projetoId);
    res.json(data);
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ error: e.message || 'Erro ao carregar dimensões do projeto' });
  }
});

router.put('/:id/dimensoes', async (req, res) => {
  const projetoId = parseId(req.params.id);
  if (!projetoId) return res.status(400).json({ error: 'ID de projeto inválido' });
  if (!podeEditar(req.usuario?.role)) {
    return res
      .status(403)
      .json({ error: 'Sem permissão para configurar as dimensões do projeto' });
  }
  try {
    const data = await salvarDimensoesProjeto(prisma, projetoId, req.body);
    res.json(data);
  } catch (e) {
    res
      .status(e.status || 500)
      .json({ error: e.message || 'Erro ao salvar dimensões do projeto' });
  }
});

export default router;

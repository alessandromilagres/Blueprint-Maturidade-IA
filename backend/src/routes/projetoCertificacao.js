import express from 'express';
import { prisma } from '../lib/prisma.js';
import {
  montarPainelCertificacaoSatf,
  salvarCertificacaoDimensao,
  podeCertificarSatf
} from '../utils/projetoDimensaoCertificacao.js';
import { scoresAreaSatfDeclaradoETeto } from '../utils/satfScoreTeto.js';
import { areaContaParaAvaliacao } from '../utils/avaliacaoAreasRecusadas.js';
import { listarAreasDoProjeto } from '../utils/areaFrameworkCatalog.js';

const router = express.Router();

function parseId(param) {
  const id = parseInt(String(param), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function carregarAvaliacoesFinalizadas(projetoId) {
  return prisma.avaliacao.findMany({
    where: { projetoId, status: 'finalizada' },
    include: {
      respostas: {
        include: { pergunta: { include: { area: true } } }
      }
    }
  });
}

router.get('/:id/certificacao', async (req, res) => {
  const projetoId = parseId(req.params.id);
  if (!projetoId) return res.status(400).json({ error: 'ID de projeto inválido' });
  try {
    const projeto = await prisma.projeto.findUnique({ where: { id: projetoId } });
    if (!projeto) return res.status(404).json({ error: 'Projeto não encontrado' });

    const avaliacoes = await carregarAvaliacoesFinalizadas(projetoId);
    const painel = await montarPainelCertificacaoSatf(prisma, projetoId, avaliacoes, {
      podeEditar: podeCertificarSatf(req.usuario?.role)
    });
    res.json({
      projeto: { id: projeto.id, nome: projeto.nome },
      ...painel
    });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Erro ao carregar certificação' });
  }
});

router.put('/:id/certificacao/:areaId', async (req, res) => {
  const projetoId = parseId(req.params.id);
  const areaId = parseId(req.params.areaId);
  if (!projetoId || !areaId) {
    return res.status(400).json({ error: 'IDs de projeto e dimensão inválidos' });
  }
  if (!podeCertificarSatf(req.usuario?.role)) {
    return res.status(403).json({ error: 'Sem permissão para certificar dimensões SATF' });
  }
  try {
    const areas = await listarAreasDoProjeto(prisma, projetoId, { includePerguntas: false });
    const area = areas.find((a) => a.id === areaId);
    if (!area) return res.status(404).json({ error: 'Dimensão não encontrada neste projeto' });

    const avaliacoes = await carregarAvaliacoesFinalizadas(projetoId);
    const todasAreaIds = areas.map((a) => a.id);
    const { scoreDeclarado, scoreComTeto } = scoresAreaSatfDeclaradoETeto(
      avaliacoes,
      areaId,
      todasAreaIds,
      areaContaParaAvaliacao
    );

    const salvo = await salvarCertificacaoDimensao(
      prisma,
      projetoId,
      areaId,
      {
        ...req.body,
        scoreDeclarado,
        scoreComTeto
      },
      req.usuario?.id
    );
    res.json({ ok: true, certificacao: salvo });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Erro ao salvar certificação' });
  }
});

export default router;

import express from 'express';
import { prisma } from '../lib/prisma.js';
import {
  filtroNivelPrioridadeFromRaw,
  filtroNivelRelatorioIACompativel
} from '../utils/nivelPrioridadeMapeamentoMaturidade.js';
import { enriquecerDadosUsadosComLogo } from '../utils/empresaLogo.js';

const router = express.Router();

function parseJsonSeguro(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ============= LISTAR todos os relatórios IA (com filtros) =============
// GET /api/relatorios-ia?projetoId=&tipo=&empresaId=
router.get('/', async (req, res) => {
  try {
    const { projetoId, tipo, empresaId, limit = 50 } = req.query;
    
    const where = {};
    if (projetoId) where.projetoId = parseInt(projetoId);
    if (tipo) where.tipo = tipo;
    if (empresaId) {
      where.projeto = { empresaId: parseInt(empresaId) };
    }
    
    const relatorios = await prisma.relatorioIA.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        projetoId: true,
        tipo: true,
        titulo: true,
        provider: true,
        modelo: true,
        tokensEntrada: true,
        tokensSaida: true,
        tempoGeracaoMs: true,
        chunksGerados: true,
        totalChunks: true,
        scoreGeral: true,
        nivel: true,
        setor: true,
        versao: true,
        createdAt: true,
        projeto: {
          select: {
            id: true,
            nome: true,
            empresa: { select: { id: true, nome: true, logoPath: true } }
          }
        },
        geradoPor: {
          select: { id: true, nome: true, email: true }
        }
      }
    });
    
    res.json(relatorios);
  } catch (error) {
    console.error('Erro ao listar relatórios IA:', error);
    res.status(500).json({ error: 'Erro ao listar relatórios', details: error.message });
  }
});

// ============= LISTAR versões por projeto e tipo =============
// GET /api/relatorios-ia/versoes/:projetoId/:tipo
router.get('/versoes/:projetoId/:tipo', async (req, res) => {
  try {
    const { projetoId, tipo } = req.params;
    
    if (!['executivo', 'completo', 'completo_rapido'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido. Use "executivo", "completo" ou "completo_rapido"' });
    }
    
    const versoes = await prisma.relatorioIA.findMany({
      where: {
        projetoId: parseInt(projetoId),
        tipo
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        versao: true,
        provider: true,
        modelo: true,
        tokensSaida: true,
        tempoGeracaoMs: true,
        chunksGerados: true,
        totalChunks: true,
        scoreGeral: true,
        nivel: true,
        createdAt: true,
        geradoPor: { select: { id: true, nome: true } }
      }
    });
    
    res.json(versoes);
  } catch (error) {
    console.error('Erro ao listar versões:', error);
    res.status(500).json({ error: 'Erro ao listar versões', details: error.message });
  }
});

// ============= BUSCAR versão mais recente por projeto e tipo =============
// GET /api/relatorios-ia/latest/:projetoId/:tipo
router.get('/latest/:projetoId/:tipo', async (req, res) => {
  try {
    const { projetoId, tipo } = req.params;
    const filtroAtual = filtroNivelPrioridadeFromRaw(req.query?.nivelPrioridadeMapeamentoMaturidade);
    
    if (!['executivo', 'completo', 'completo_rapido'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }
    
    const candidatos = await prisma.relatorioIA.findMany({
      where: {
        projetoId: parseInt(projetoId),
        tipo
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        projeto: {
          select: {
            id: true,
            nome: true,
            empresa: { select: { id: true, nome: true, logoPath: true } }
          }
        },
        geradoPor: { select: { id: true, nome: true } }
      }
    });

    const relatorio = candidatos.find((r) => {
      const dadosUsados = parseJsonSeguro(r.dadosSnapshot);
      return filtroNivelRelatorioIACompativel(dadosUsados, filtroAtual);
    });
    
    if (!relatorio) {
      return res.status(404).json({ error: 'Nenhuma versão encontrada' });
    }
    
    // Inclui dadosSnapshot parseado
    const response = {
      ...relatorio,
      dadosUsados: await enriquecerDadosUsadosComLogo(
        parseJsonSeguro(relatorio.dadosSnapshot),
        relatorio.projeto?.empresa
      )
    };
    delete response.dadosSnapshot;
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar última versão:', error);
    res.status(500).json({ error: 'Erro ao buscar versão', details: error.message });
  }
});

// ============= BUSCAR relatório por ID (conteúdo completo) =============
// GET /api/relatorios-ia/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const relatorio = await prisma.relatorioIA.findUnique({
      where: { id: parseInt(id) },
      include: {
        projeto: {
          select: {
            id: true,
            nome: true,
            empresa: { select: { id: true, nome: true, logoPath: true } }
          }
        },
        geradoPor: { select: { id: true, nome: true } }
      }
    });
    
    if (!relatorio) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }
    
    const response = {
      ...relatorio,
      dadosUsados: await enriquecerDadosUsadosComLogo(
        parseJsonSeguro(relatorio.dadosSnapshot),
        relatorio.projeto?.empresa
      )
    };
    delete response.dadosSnapshot;
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    res.status(500).json({ error: 'Erro ao buscar relatório', details: error.message });
  }
});

// ============= EXCLUIR versão =============
// DELETE /api/relatorios-ia/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.relatorioIA.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ success: true, message: 'Relatório excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir relatório:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao excluir relatório', details: error.message });
  }
});

// ============= ESTATÍSTICAS gerais =============
// GET /api/relatorios-ia/stats/resumo
router.get('/stats/resumo', async (req, res) => {
  try {
    const total = await prisma.relatorioIA.count();
    const porTipo = await prisma.relatorioIA.groupBy({
      by: ['tipo'],
      _count: { _all: true }
    });
    const porProvider = await prisma.relatorioIA.groupBy({
      by: ['provider'],
      _count: { _all: true }
    });
    
    const tokensTotais = await prisma.relatorioIA.aggregate({
      _sum: {
        tokensEntrada: true,
        tokensSaida: true,
        tempoGeracaoMs: true
      }
    });
    
    res.json({
      total,
      porTipo: porTipo.map(t => ({ tipo: t.tipo, count: t._count._all })),
      porProvider: porProvider.map(p => ({ provider: p.provider, count: p._count._all })),
      tokens: {
        entrada: tokensTotais._sum.tokensEntrada || 0,
        saida: tokensTotais._sum.tokensSaida || 0,
        tempoTotalMs: tokensTotais._sum.tempoGeracaoMs || 0
      }
    });
  } catch (error) {
    console.error('Erro ao gerar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao gerar estatísticas', details: error.message });
  }
});

// ============= HELPER: Salvar relatório IA gerado =============
// Usado internamente pelas rotas de geração (chamado de index.js)
export async function salvarRelatorioIA({
  projetoId,
  tipo,
  titulo,
  conteudoMd,
  provider,
  modelo,
  tokensEntrada,
  tokensSaida,
  tempoGeracaoMs,
  chunksGerados,
  totalChunks,
  dadosUsados,
  geradoPorId
}) {
  // Calcula próxima versão para este projeto + tipo
  const ultimaVersao = await prisma.relatorioIA.findFirst({
    where: { projetoId, tipo },
    orderBy: { versao: 'desc' },
    select: { versao: true }
  });
  
  const novaVersao = (ultimaVersao?.versao || 0) + 1;
  
  return await prisma.relatorioIA.create({
    data: {
      projetoId,
      tipo,
      titulo,
      conteudoMd,
      provider,
      modelo,
      tokensEntrada,
      tokensSaida,
      tempoGeracaoMs,
      chunksGerados,
      totalChunks,
      dadosSnapshot: dadosUsados ? JSON.stringify(dadosUsados) : null,
      scoreGeral: dadosUsados?.scoreGeral || null,
      nivel: dadosUsados?.nivel || null,
      setor: dadosUsados?.setor || null,
      geradoPorId,
      versao: novaVersao
    }
  });
}

export default router;

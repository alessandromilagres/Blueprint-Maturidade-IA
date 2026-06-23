import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import {
  avaliarImplicacaoRegulatoriaDimensao,
  listarCrosswalkRegulatorio,
  normalizarCodigoDimensao,
  resolverCrosswalkDimensao,
  DISCLAIMER_REGULATORIO
} from '../utils/regulatorioCrosswalk.js';
import {
  calculateRegulatorySnapshot,
  confirmarSnapshotConsultor,
  obterRegulatorySnapshotProduto,
  podeValidarRegulatorio
} from '../utils/regulatorioSnapshot.js';
import {
  atualizarCicloAberto,
  atualizarMitigacao,
  criarMitigacao,
  criarProximoCicloRegulatorio,
  compararCiclosRegulatorios,
  fecharCicloRegulatorio,
  listarCiclosProduto,
  obterCicloAbertoProduto
} from '../utils/regulatorioCiclo.js';
import { listarNotificacoesRegulatorias } from '../utils/regulatorioNotificacoes.js';
import {
  gerarSecao14RegulatorioBookMarkdown,
  montarDashboardRegulatorioProjeto
} from '../utils/regulatorioDashboard.js';

const router = express.Router();
const UPLOAD_REG_DIR = path.join(process.cwd(), 'uploads', 'regulatorio');
const MAX_EVIDENCIA_BYTES = 10 * 1024 * 1024;
const MIME_EVIDENCIA = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'text/plain': '.txt'
};

async function garantirDirRegulatorio() {
  await fs.mkdir(UPLOAD_REG_DIR, { recursive: true });
}

function parseProdutoId(param) {
  const id = parseInt(String(param), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function parseId(param) {
  const id = parseInt(String(param), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function parseProjetoId(param) {
  return parseId(param);
}

router.get('/crosswalk', (_req, res) => {
  res.json({
    disclaimer: DISCLAIMER_REGULATORIO,
    dimensoes: listarCrosswalkRegulatorio()
  });
});

router.get('/crosswalk/:codigo', (req, res) => {
  const codigo = normalizarCodigoDimensao(req.params.codigo);
  const crosswalk = resolverCrosswalkDimensao(codigo || req.params.codigo);

  if (!crosswalk) {
    return res.status(404).json({ error: 'Dimensão não encontrada no crosswalk regulatório' });
  }

  const scoreParam = req.query.score;
  const score = scoreParam != null && scoreParam !== '' ? Number(scoreParam) : null;

  const payload = {
    crosswalk: {
      codigoDimensao: crosswalk.codigoDimensao,
      nomeDimensao: crosswalk.nomeDimensao,
      scoreLimiar: crosswalk.scoreLimiar,
      riscoNivelPadrao: crosswalk.riscoNivelPadrao,
      isoClausulas: crosswalk.isoClausulas,
      plArtigos: crosswalk.plArtigos,
      lgpdArtigos: crosswalk.lgpdArtigos,
      logicaMapeamento: crosswalk.logicaMapeamento,
      textoIso: crosswalk.textoIso,
      textoPl: crosswalk.textoPl,
      textoLgpd: crosswalk.textoLgpd
    },
    disclaimer: DISCLAIMER_REGULATORIO
  };

  if (Number.isFinite(score)) {
    payload.avaliacao = avaliarImplicacaoRegulatoriaDimensao({
      codigoDimensao: crosswalk.codigoDimensao,
      score
    });
  }

  res.json(payload);
});

router.get('/snapshot/:produtoId', async (req, res) => {
  try {
    const produtoId = parseProdutoId(req.params.produtoId);
    if (!produtoId) return res.status(400).json({ error: 'ID de produto inválido' });

    let snapshot = await obterRegulatorySnapshotProduto(prisma, produtoId);
    if (!snapshot && req.query.recalcular === 'true') {
      snapshot = await calculateRegulatorySnapshot(prisma, produtoId);
    }
    if (!snapshot) {
      return res.status(404).json({
        error: 'Snapshot regulatório não encontrado. Finalize a avaliação IA-First do produto.',
        disclaimer: DISCLAIMER_REGULATORIO
      });
    }

    res.json({ snapshot, disclaimer: DISCLAIMER_REGULATORIO });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message, disclaimer: DISCLAIMER_REGULATORIO });
  }
});

router.post('/snapshot/:produtoId/recalcular', async (req, res) => {
  try {
    const produtoId = parseProdutoId(req.params.produtoId);
    if (!produtoId) return res.status(400).json({ error: 'ID de produto inválido' });

    const preservarValidacao = req.query.preservarValidacao !== 'false';
    const snapshot = await calculateRegulatorySnapshot(prisma, produtoId, { preservarValidacao });
    res.json({ snapshot, preservouValidacao: preservarValidacao, disclaimer: DISCLAIMER_REGULATORIO });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message, disclaimer: DISCLAIMER_REGULATORIO });
  }
});

router.put('/snapshot/:produtoId/confirm', async (req, res) => {
  try {
    const produtoId = parseProdutoId(req.params.produtoId);
    if (!produtoId) return res.status(400).json({ error: 'ID de produto inválido' });

    if (!req.usuario || !podeValidarRegulatorio(req.usuario.role)) {
      return res.status(403).json({
        error: 'Apenas consultores/gestores podem validar o snapshot regulatório'
      });
    }

    const snapshot = await confirmarSnapshotConsultor(prisma, produtoId, req.usuario.id, req.body);
    res.json({ snapshot, disclaimer: DISCLAIMER_REGULATORIO });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message, disclaimer: DISCLAIMER_REGULATORIO });
  }
});

router.get('/produto/:produtoId/ciclos', async (req, res) => {
  try {
    const produtoId = parseProdutoId(req.params.produtoId);
    if (!produtoId) return res.status(400).json({ error: 'ID de produto inválido' });
    const payload = await listarCiclosProduto(prisma, produtoId);
    res.json(payload);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, disclaimer: DISCLAIMER_REGULATORIO });
  }
});

router.get('/produto/:produtoId/ciclos/atual', async (req, res) => {
  try {
    const produtoId = parseProdutoId(req.params.produtoId);
    if (!produtoId) return res.status(400).json({ error: 'ID de produto inválido' });
    const ciclo = await obterCicloAbertoProduto(prisma, produtoId);
    if (!ciclo) {
      return res.status(404).json({
        error: 'Nenhum ciclo regulatório aberto. Finalize a avaliação IA-First ou abra um novo ciclo.',
        disclaimer: DISCLAIMER_REGULATORIO
      });
    }
    res.json({ ciclo, disclaimer: DISCLAIMER_REGULATORIO });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, disclaimer: DISCLAIMER_REGULATORIO });
  }
});

router.post('/produto/:produtoId/ciclos', async (req, res) => {
  try {
    const produtoId = parseProdutoId(req.params.produtoId);
    if (!produtoId) return res.status(400).json({ error: 'ID de produto inválido' });
    if (!req.usuario || !podeValidarRegulatorio(req.usuario.role)) {
      return res.status(403).json({ error: 'Sem permissão para abrir ciclo regulatório' });
    }
    const ciclo = await criarProximoCicloRegulatorio(prisma, produtoId, req.body);
    res.status(201).json({ ciclo, disclaimer: DISCLAIMER_REGULATORIO });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: error.message,
      versaoAtual: error.versaoAtual,
      disclaimer: DISCLAIMER_REGULATORIO
    });
  }
});

router.put('/produto/:produtoId/ciclos/atual', async (req, res) => {
  try {
    const produtoId = parseProdutoId(req.params.produtoId);
    if (!produtoId) return res.status(400).json({ error: 'ID de produto inválido' });
    if (!req.usuario || !podeValidarRegulatorio(req.usuario.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    const ciclo = await atualizarCicloAberto(prisma, produtoId, req.body);
    res.json({ ciclo, disclaimer: DISCLAIMER_REGULATORIO });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, disclaimer: DISCLAIMER_REGULATORIO });
  }
});

router.post('/produto/:produtoId/ciclos/:cicloId/fechar', async (req, res) => {
  try {
    const produtoId = parseProdutoId(req.params.produtoId);
    const cicloId = parseId(req.params.cicloId);
    if (!produtoId || !cicloId) return res.status(400).json({ error: 'IDs inválidos' });
    if (!req.usuario || !podeValidarRegulatorio(req.usuario.role)) {
      return res.status(403).json({ error: 'Sem permissão para fechar ciclo' });
    }
    const ciclo = await fecharCicloRegulatorio(prisma, produtoId, cicloId, req.usuario.id, req.body);
    res.json({ ciclo, disclaimer: DISCLAIMER_REGULATORIO });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: error.message,
      checklistFechamento: error.checklistFechamento,
      disclaimer: DISCLAIMER_REGULATORIO
    });
  }
});

router.post('/produto/:produtoId/ciclos/:cicloId/mitigacoes', async (req, res) => {
  try {
    const produtoId = parseProdutoId(req.params.produtoId);
    const cicloId = parseId(req.params.cicloId);
    if (!produtoId || !cicloId) return res.status(400).json({ error: 'IDs inválidos' });
    if (!req.usuario || !podeValidarRegulatorio(req.usuario.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    const mitigacao = await criarMitigacao(prisma, produtoId, cicloId, req.body);
    res.status(201).json({ mitigacao, disclaimer: DISCLAIMER_REGULATORIO });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, disclaimer: DISCLAIMER_REGULATORIO });
  }
});

router.put('/produto/:produtoId/ciclos/:cicloId/mitigacoes/:mitigacaoId', async (req, res) => {
  try {
    const produtoId = parseProdutoId(req.params.produtoId);
    const cicloId = parseId(req.params.cicloId);
    const mitigacaoId = parseId(req.params.mitigacaoId);
    if (!produtoId || !cicloId || !mitigacaoId) return res.status(400).json({ error: 'IDs inválidos' });
    if (!req.usuario || !podeValidarRegulatorio(req.usuario.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    const mitigacao = await atualizarMitigacao(prisma, produtoId, cicloId, mitigacaoId, req.body);
    res.json({ mitigacao, disclaimer: DISCLAIMER_REGULATORIO });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, disclaimer: DISCLAIMER_REGULATORIO });
  }
});

router.get('/dashboard/:projetoId', async (req, res) => {
  try {
    const projetoId = parseProjetoId(req.params.projetoId);
    if (!projetoId) return res.status(400).json({ error: 'ID de projeto inválido' });

    const versaoId = req.query.versaoId ? parseInt(req.query.versaoId, 10) : null;
    const dashboard = await montarDashboardRegulatorioProjeto(prisma, projetoId, {
      versaoId: Number.isFinite(versaoId) ? versaoId : null
    });
    res.json({ dashboard, disclaimer: DISCLAIMER_REGULATORIO });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, disclaimer: DISCLAIMER_REGULATORIO });
  }
});

router.get('/notificacoes', async (req, res) => {
  try {
    const payload = await listarNotificacoesRegulatorias(prisma, {
      projetoId: req.query.projetoId,
      produtoId: req.query.produtoId
    });
    res.json({ ...payload, disclaimer: DISCLAIMER_REGULATORIO });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, disclaimer: DISCLAIMER_REGULATORIO });
  }
});

router.get('/produto/:produtoId/ciclos/comparativo', async (req, res) => {
  try {
    const produtoId = parseProdutoId(req.params.produtoId);
    if (!produtoId) return res.status(400).json({ error: 'ID de produto inválido' });
    const comparativo = await compararCiclosRegulatorios(prisma, produtoId);
    res.json({ comparativo, disclaimer: DISCLAIMER_REGULATORIO });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, disclaimer: DISCLAIMER_REGULATORIO });
  }
});

router.post('/produto/:produtoId/ciclos/:cicloId/mitigacoes/:mitigacaoId/evidencia', async (req, res) => {
  try {
    const produtoId = parseProdutoId(req.params.produtoId);
    const cicloId = parseId(req.params.cicloId);
    const mitigacaoId = parseId(req.params.mitigacaoId);
    if (!produtoId || !cicloId || !mitigacaoId) return res.status(400).json({ error: 'IDs inválidos' });
    if (!req.usuario || !podeValidarRegulatorio(req.usuario.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const { arquivo, nomeOriginal, mimeType: mimeRaw } = req.body || {};
    if (!arquivo || !nomeOriginal) return res.status(400).json({ error: 'arquivo e nomeOriginal obrigatórios' });

    const mimeType = mimeRaw || 'application/pdf';
    if (!MIME_EVIDENCIA[mimeType]) {
      return res.status(400).json({ error: 'Tipo não permitido', tipos: Object.keys(MIME_EVIDENCIA) });
    }

    const ciclo = await prisma.produtoRegulatorioCiclo.findFirst({
      where: { id: cicloId, produtoId, status: 'aberta' }
    });
    if (!ciclo) return res.status(404).json({ error: 'Ciclo aberto não encontrado' });

    const mitigacao = await prisma.produtoRegulatorioMitigacao.findFirst({
      where: { id: mitigacaoId, cicloId }
    });
    if (!mitigacao) return res.status(404).json({ error: 'Mitigação não encontrada' });

    const buffer = Buffer.from(arquivo, 'base64');
    if (buffer.length > MAX_EVIDENCIA_BYTES) {
      return res.status(400).json({ error: 'Arquivo muito grande (máx. 10MB)' });
    }

    await garantirDirRegulatorio();
    const hash = crypto.randomBytes(12).toString('hex');
    const nomeArmazenado = `m${mitigacaoId}_${hash}${MIME_EVIDENCIA[mimeType]}`;
    await fs.writeFile(path.join(UPLOAD_REG_DIR, nomeArmazenado), buffer);

    const entrada = {
      id: hash,
      nomeOriginal: String(nomeOriginal).slice(0, 200),
      nomeArmazenado,
      mimeType,
      tamanho: buffer.length,
      uploadedAt: new Date().toISOString(),
      url: `/api/regulatorio/evidencias/${nomeArmazenado}`
    };

    const evidencias = Array.isArray(mitigacao.evidencias) ? [...mitigacao.evidencias] : [];
    evidencias.push(entrada);

    const atualizado = await prisma.produtoRegulatorioMitigacao.update({
      where: { id: mitigacaoId },
      data: { evidencias }
    });

    res.status(201).json({ evidencia: entrada, mitigacao: atualizado, disclaimer: DISCLAIMER_REGULATORIO });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, disclaimer: DISCLAIMER_REGULATORIO });
  }
});

router.get('/evidencias/:nomeArmazenado', async (req, res) => {
  try {
    const nome = path.basename(req.params.nomeArmazenado);
    if (!/^m\d+_[a-f0-9]+\.(pdf|png|jpg|webp|txt)$/.test(nome)) {
      return res.status(400).json({ error: 'Arquivo inválido' });
    }
    const filePath = path.join(UPLOAD_REG_DIR, nome);
    const data = await fs.readFile(filePath);
    const ext = path.extname(nome).toLowerCase();
    const types = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain' };
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    res.send(data);
  } catch {
    res.status(404).json({ error: 'Evidência não encontrada' });
  }
});

export default router;

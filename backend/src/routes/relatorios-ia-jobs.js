import express from 'express';
import { prisma } from '../lib/prisma.js';
import { Agent, fetch as undiciFetch } from 'undici';
import {
  registerJobAbortController,
  unregisterJobAbortController,
  abortJobLongFetch
} from '../services/relatorio-ia-job-abort.js';
import {
  filtroNivelPrioridadeFromRaw,
  filtroNivelRelatorioIACompativel,
  queryNivelPrioridadeMapeamentoMaturidade
} from '../utils/nivelPrioridadeMapeamentoMaturidade.js';

const router = express.Router();

function parseJsonSeguro(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Dispatcher dedicado para chamadas internas do job: sem timeout de header/body
// (a geração do book completo pode levar ~30 minutos com 24 chunks).
const longRunningDispatcher = new Agent({
  headersTimeout: 0,            // sem limite para receber headers
  bodyTimeout: 0,               // sem limite para receber body
  keepAliveTimeout: 60_000,
  keepAliveMaxTimeout: 90 * 60 * 1000,
  connect: { timeout: 30_000 }
});

// Verifica se um relatório foi salvo durante a janela de execução do job.
// Útil quando o fetch interno cai (timeout/keep-alive), mas a rota completou
// e gravou o RelatorioIA do lado do servidor.
async function buscarRelatorioGeradoNaJanela(projetoId, tipo, startedAt) {
  if (!startedAt) return null;
  return await prisma.relatorioIA.findFirst({
    where: {
      projetoId,
      tipo,
      createdAt: { gte: startedAt }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function processarJobRelatorioIA({
  jobId,
  projetoId,
  tipo,
  authHeader,
  baseUrl,
  filtroNivelMax = 3
}) {
  const startedAt = new Date();
  try {
    const snapInicio = await prisma.relatorioIAJob.findUnique({
      where: { id: jobId },
      select: { status: true }
    });
    if (snapInicio?.status === 'cancelled') {
      return;
    }

    await prisma.relatorioIAJob.update({
      where: { id: jobId },
      data: {
        status: 'running',
        progresso: 10,
        etapa: 'Preparando geração',
        startedAt
      }
    });

    const nivelQ = queryNivelPrioridadeMapeamentoMaturidade(filtroNivelMax);
    const endpoint =
      tipo === 'completo' || tipo === 'completo_rapido'
        ? `/api/dashboard/projeto/${projetoId}/relatorio-ia-completo?reuse=false&jobId=${jobId}&${nivelQ}${
            tipo === 'completo_rapido' ? '&mode=rapido' : ''
          }`
        : `/api/dashboard/projeto/${projetoId}/relatorio-ia?reuse=false&${nivelQ}`;

    await prisma.relatorioIAJob.update({
      where: { id: jobId },
      data: {
        progresso: 30,
        etapa:
          tipo === 'completo'
            ? 'Gerando book completo com IA (multi-chunk)'
            : tipo === 'completo_rapido'
              ? 'Gerando book modo rápido (multi-chunk reduzido)'
              : 'Gerando relatório executivo com IA'
      }
    });

    let payload = null;
    let httpFailed = false;
    let httpError = null;

    const abortController = new AbortController();
    registerJobAbortController(jobId, abortController);
    try {
      // Importante: usar undici.fetch (não o fetch global do Node) para que
      // o `dispatcher` seja compatível com o Agent. O fetch global usa uma
      // versão interna distinta de undici e quebra com "UND_ERR_INVALID_ARG".
      const resp = await undiciFetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {})
        },
        dispatcher: longRunningDispatcher,
        signal: abortController.signal
      });

      payload = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        httpFailed = true;
        httpError = new Error(payload?.error || payload?.details || `Falha HTTP ${resp.status}`);
      }
    } catch (fetchErr) {
      httpFailed = true;
      httpError = fetchErr;
      const foiAbort =
        fetchErr?.name === 'AbortError' ||
        fetchErr?.code === 'ABORT_ERR' ||
        String(fetchErr?.message || '').toLowerCase().includes('abort');
      if (foiAbort) {
        await prisma.relatorioIAJob
          .update({
            where: { id: jobId },
            data: {
              status: 'cancelled',
              progresso: 100,
              etapa: 'Cancelado',
              erro: 'Cancelado pelo usuário',
              finishedAt: new Date()
            }
          })
          .catch(() => {});
        return;
      }
      console.warn(`[Job ${jobId}] fetch interno falhou: ${fetchErr.message}. Verificando se o relatório foi salvo mesmo assim...`);
    } finally {
      unregisterJobAbortController(jobId);
    }

    // Mesmo se o fetch caiu, a rota pode ter terminado e salvado o relatório.
    // Aguarda mais um tempo para garantir que a geração concluiu, e verifica.
    if (httpFailed) {
      // Espera adicional (algumas tentativas) para a rota terminar de salvar
      const tentativas =
        tipo === 'completo' ? 60 : tipo === 'completo_rapido' ? 35 : 20; // ~10min / ~35min rápido / exec
      const intervaloMs = 10_000;
      let salvo = null;

      for (let i = 0; i < tentativas; i++) {
        await new Promise(r => setTimeout(r, intervaloMs));
        salvo = await buscarRelatorioGeradoNaJanela(projetoId, tipo, startedAt);

        // Atualiza etapa para o usuário ver que estamos aguardando
        await prisma.relatorioIAJob.update({
          where: { id: jobId },
          data: {
            progresso: 50 + Math.min(40, i * 2),
            etapa: `Aguardando finalização da geração (verificação ${i + 1}/${tentativas})`
          }
        }).catch(() => {});

        if (salvo) break;
      }

      if (salvo) {
        await prisma.relatorioIAJob.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            progresso: 100,
            etapa: 'Concluído (recuperado após timeout do canal HTTP interno)',
            relatorioId: salvo.id,
            metadata: JSON.stringify({
              provider: salvo.provider,
              model: salvo.modelo,
              tokens: { entrada: salvo.tokensEntrada, saida: salvo.tokensSaida },
              chunksGerados: salvo.chunksGerados,
              totalChunks: salvo.totalChunks,
              versao: salvo.versao,
              recuperadoAposFalhaFetch: true
            }),
            finishedAt: new Date()
          }
        });
        return;
      }
      // Se mesmo após espera não apareceu, falha de verdade
      throw httpError || new Error('Geração não concluída e sem relatório salvo');
    }

    await prisma.relatorioIAJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progresso: 100,
        etapa: 'Concluído',
        relatorioId: payload.relatorioSalvoId || null,
        metadata: JSON.stringify({
          provider: payload.provider || null,
          model: payload.model || null,
          tempoResposta: payload.tempoResposta || null,
          tokens: payload.tokens || null,
          chunksGerados: payload.chunksGerados || null,
          totalChunks: payload.totalChunks || null,
          versao: payload.versao || null
        }),
        finishedAt: new Date()
      }
    });
  } catch (error) {
    await prisma.relatorioIAJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        progresso: 100,
        etapa: 'Falha',
        erro: error.message || 'Erro inesperado na geração em background',
        finishedAt: new Date()
      }
    });
  }
}

// POST /api/relatorios-ia-jobs/:id/cancel — interrompe job em fila ou em execução (book em background)
router.post('/:id/cancel', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'id inválido' });
    }

    const job = await prisma.relatorioIAJob.findUnique({
      where: { id },
      select: { id: true, status: true, projetoId: true }
    });
    if (!job) return res.status(404).json({ error: 'Job não encontrado' });

    if (!['queued', 'running'].includes(job.status)) {
      return res.status(400).json({
        error: 'Este job não pode ser cancelado',
        statusAtual: job.status
      });
    }

    await prisma.relatorioIAJob.update({
      where: { id },
      data: {
        status: 'cancelled',
        progresso: 100,
        etapa: 'Cancelado pelo usuário',
        erro: null,
        finishedAt: new Date()
      }
    });

    const abortedFetch = abortJobLongFetch(id);

    res.json({
      ok: true,
      abortedFetch,
      message: abortedFetch
        ? 'Cancelamento aplicado: conexão com o gerador foi encerrada.'
        : 'Job marcado como cancelado. Se ainda estiver gerando, pare dentro de instantes.'
    });
  } catch (error) {
    console.error('Erro ao cancelar job IA:', error);
    res.status(500).json({ error: 'Erro ao cancelar job', details: error.message });
  }
});

// POST /api/relatorios-ia-jobs/start
router.post('/start', async (req, res) => {
  try {
    const { projetoId, tipo, nivelPrioridadeMapeamentoMaturidade } = req.body || {};
    const projetoIdNum = Number(projetoId);
    const filtroNivelMax = filtroNivelPrioridadeFromRaw(nivelPrioridadeMapeamentoMaturidade);
    if (!projetoIdNum || Number.isNaN(projetoIdNum)) {
      return res.status(400).json({ error: 'projetoId inválido' });
    }
    if (!['executivo', 'completo', 'completo_rapido'].includes(tipo)) {
      return res.status(400).json({ error: 'tipo inválido. Use executivo, completo ou completo_rapido' });
    }

    const jobsAtivos = await prisma.relatorioIAJob.findMany({
      where: {
        projetoId: projetoIdNum,
        tipo,
        status: { in: ['queued', 'running'] }
      },
      orderBy: { createdAt: 'desc' }
    });
    const existente = jobsAtivos.find((j) => {
      const meta = parseJsonSeguro(j.metadata);
      return filtroNivelRelatorioIACompativel(meta, filtroNivelMax);
    });

    if (existente) {
      return res.json({
        reused: true,
        job: existente
      });
    }

    const job = await prisma.relatorioIAJob.create({
      data: {
        projetoId: projetoIdNum,
        tipo,
        status: 'queued',
        progresso: 0,
        etapa: 'Na fila',
        metadata: JSON.stringify({
          filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax
        }),
        solicitadoPorId: req.usuarioId || null
      }
    });

    const authHeader = req.headers.authorization;
    const baseUrl = `http://localhost:${process.env.PORT || 3001}`;
    setTimeout(() => {
      processarJobRelatorioIA({
        jobId: job.id,
        projetoId: projetoIdNum,
        tipo,
        authHeader,
        baseUrl,
        filtroNivelMax
      });
    }, 50);

    res.status(202).json({
      reused: false,
      job
    });
  } catch (error) {
    console.error('Erro ao iniciar job de relatório IA:', error);
    res.status(500).json({ error: 'Erro ao iniciar job', details: error.message });
  }
});

// GET /api/relatorios-ia-jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const job = await prisma.relatorioIAJob.findUnique({
      where: { id },
      include: {
        relatorio: {
          select: {
            id: true,
            tipo: true,
            titulo: true,
            versao: true,
            createdAt: true
          }
        },
        projeto: {
          select: { id: true, nome: true }
        }
      }
    });

    if (!job) return res.status(404).json({ error: 'Job não encontrado' });

    let metadata = null;
    try { metadata = job.metadata ? JSON.parse(job.metadata) : null; } catch { metadata = null; }

    res.json({
      ...job,
      metadata
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar job', details: error.message });
  }
});

// GET /api/relatorios-ia-jobs?projetoId=&tipo=&status=
router.get('/', async (req, res) => {
  try {
    const { projetoId, tipo, status, limit = 30 } = req.query;
    const where = {};
    if (projetoId) where.projetoId = Number(projetoId);
    if (tipo) where.tipo = tipo;
    if (status) where.status = status;

    const jobs = await prisma.relatorioIAJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      include: {
        relatorio: {
          select: { id: true, versao: true, createdAt: true }
        }
      }
    });

    const parsed = jobs.map((j) => {
      let metadata = null;
      try {
        metadata = j.metadata ? JSON.parse(j.metadata) : null;
      } catch {
        metadata = null;
      }
      return { ...j, metadata };
    });

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar jobs', details: error.message });
  }
});

export default router;

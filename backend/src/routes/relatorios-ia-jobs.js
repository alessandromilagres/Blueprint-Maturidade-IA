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
import { queryEmpresaUnidadeId, filtroUnidadeRelatorioIACompativel } from '../utils/relatorioUnidadeIA.js';
import {
  isTipoRelatorioIAValido,
  isTipoRelatorioIAUnidade,
  MENSAGEM_TIPOS_RELATORIO_IA_INVALIDO
} from '../constants/tiposRelatorioIA.js';
import {
  jobRelatorioIAEstaObsoleto,
  falharJobRelatorioIAObsoleto
} from '../utils/relatorioIAJobStale.js';

const router = express.Router();

function labelEtapaJobRelatorioIA(tipo) {
  if (
    tipo === 'completo' ||
    tipo === 'completo_satf' ||
    tipo === 'book_unidade' ||
    tipo === 'book_unidade_satf'
  ) {
    return 'Gerando book completo com IA (multi-chunk)';
  }
  if (
    tipo === 'completo_rapido' ||
    tipo === 'completo_satf_rapido' ||
    tipo === 'book_unidade_rapido' ||
    tipo === 'book_unidade_satf_rapido'
  ) {
    return 'Gerando book modo rápido (multi-chunk reduzido)';
  }
  if (tipo === 'executivo_unidade') {
    return 'Gerando relatório executivo por unidade com IA';
  }
  return 'Gerando relatório executivo com IA';
}

function parseJsonSeguro(raw) {
  // Parse seguro de metadata JSON dos jobs IA.
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

/** Tentativas de polling após queda do fetch interno (intervalo 10s). */
function tentativasRecuperacaoAposFetchFalho(tipo) {
  if (['completo', 'completo_satf', 'book_unidade', 'book_unidade_satf'].includes(tipo)) {
    return 240; // ~40 min — book completo SATF/Blueprint
  }
  if (
    ['completo_rapido', 'completo_satf_rapido', 'book_unidade_rapido', 'book_unidade_satf_rapido'].includes(
      tipo
    )
  ) {
    return 90; // ~15 min
  }
  return 20;
}

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
  filtroNivelMax = 3,
  versaoId = null,
  empresaUnidadeId = null
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
    const unidadeQ = queryEmpresaUnidadeId(empresaUnidadeId);
    const versaoQ = versaoId ? `&projetoVersaoId=${encodeURIComponent(String(versaoId))}` : '';
    const isBookUnidade =
      tipo === 'book_unidade_satf' ||
      tipo === 'book_unidade_satf_rapido' ||
      tipo === 'book_unidade' ||
      tipo === 'book_unidade_rapido';
    const isBook =
      tipo === 'completo' ||
      tipo === 'completo_rapido' ||
      tipo === 'completo_satf' ||
      tipo === 'completo_satf_rapido' ||
      isBookUnidade;
    const isExecutivoUnidade = tipo === 'executivo_unidade';
    const qExtra = [nivelQ, unidadeQ].filter(Boolean).join('&');
    const endpoint = isBookUnidade
      ? `/api/dashboard/projeto/${projetoId}/relatorio-ia-book-unidade?reuse=false&jobId=${jobId}&${qExtra}${versaoQ}${
          tipo === 'book_unidade_satf_rapido' || tipo === 'book_unidade_rapido' ? '&mode=rapido' : ''
        }`
      : isExecutivoUnidade
        ? `/api/dashboard/projeto/${projetoId}/relatorio-ia-unidade?reuse=false&${qExtra}${versaoQ}`
        : isBook
          ? `/api/dashboard/projeto/${projetoId}/relatorio-ia-completo?reuse=false&jobId=${jobId}&${qExtra}${versaoQ}${
              tipo === 'completo_rapido' || tipo === 'completo_satf_rapido' ? '&mode=rapido' : ''
            }`
          : `/api/dashboard/projeto/${projetoId}/relatorio-ia?reuse=false&${qExtra}${versaoQ}`;

    await prisma.relatorioIAJob.update({
      where: { id: jobId },
      data: {
        progresso: 30,
        etapa: labelEtapaJobRelatorioIA(tipo)
      }
    });

    let payload = null;
    let httpFailed = false;
    let httpError = null;

    const abortController = new AbortController();
    registerJobAbortController(jobId, abortController);

    const heartbeatInicio = Date.now();
    const heartbeat = setInterval(async () => {
      try {
        const snap = await prisma.relatorioIAJob.findUnique({
          where: { id: jobId },
          select: { progresso: true, status: true, updatedAt: true, etapa: true }
        });
        if (!snap || !['queued', 'running'].includes(snap.status)) return;
        const pct = Number(snap.progresso);
        const semProgressoBook =
          pct <= 35 &&
          snap.updatedAt &&
          Date.now() - new Date(snap.updatedAt).getTime() > 90_000;
        if (pct > 35 && !semProgressoBook) return;
        const min = Math.max(1, Math.round((Date.now() - heartbeatInicio) / 60_000));
        await prisma.relatorioIAJob.update({
          where: { id: jobId },
          data: {
            progresso: pct <= 31 ? Math.min(29, 12 + min * 2) : pct,
            etapa:
              pct <= 35
                ? `Gerador ativo (${min} min) — ${snap.etapa || 'preparando book…'}`
                : snap.etapa,
            metadata: JSON.stringify({ fase: 'heartbeat_worker', minutos: min, progressoBook: pct })
          }
        });
      } catch {
        /* ignore */
      }
    }, 45_000);

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
      clearInterval(heartbeat);
      unregisterJobAbortController(jobId);
    }

    // Mesmo se o fetch caiu, a rota pode ter terminado e salvado o relatório.
    // Aguarda mais um tempo para garantir que a geração concluiu, e verifica.
    if (httpFailed) {
      // Espera adicional (algumas tentativas) para a rota terminar de salvar
      const tentativas = tentativasRecuperacaoAposFetchFalho(tipo);
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

    if (payload?.fromCache === true) {
      throw new Error(
        'A geração retornou versão em cache. Nova versão não foi produzida — tente novamente.'
      );
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
    const { projetoId, tipo, nivelPrioridadeMapeamentoMaturidade, versaoId, empresaUnidadeId } =
      req.body || {};
    const projetoIdNum = Number(projetoId);
    const versaoIdNum = versaoId ? Number(versaoId) : null;
    const unidadeIdNum =
      empresaUnidadeId != null && empresaUnidadeId !== ''
        ? Number(empresaUnidadeId)
        : null;
    const filtroNivelMax = filtroNivelPrioridadeFromRaw(nivelPrioridadeMapeamentoMaturidade);
    if (!projetoIdNum || Number.isNaN(projetoIdNum)) {
      return res.status(400).json({ error: 'projetoId inválido' });
    }
    if (!isTipoRelatorioIAValido(tipo)) {
      return res.status(400).json({ error: MENSAGEM_TIPOS_RELATORIO_IA_INVALIDO });
    }

    if (isTipoRelatorioIAUnidade(tipo) && !unidadeIdNum) {
      return res.status(400).json({
        error: 'empresaUnidadeId é obrigatório para relatórios por unidade organizacional'
      });
    }

    const jobsAtivos = await prisma.relatorioIAJob.findMany({
      where: {
        projetoId: projetoIdNum,
        tipo,
        status: { in: ['queued', 'running'] }
      },
      orderBy: { createdAt: 'desc' }
    });
    for (const j of jobsAtivos) {
      if (jobRelatorioIAEstaObsoleto(j)) {
        await falharJobRelatorioIAObsoleto(
          j.id,
          'Job interrompido (sem progresso por tempo prolongado). Gere novamente.'
        );
      }
    }

    const jobsVivos = jobsAtivos.filter((j) => !jobRelatorioIAEstaObsoleto(j));
    const existente = jobsVivos.find((j) => {
      const meta = parseJsonSeguro(j.metadata);
      return (
        filtroNivelRelatorioIACompativel(meta, filtroNivelMax) &&
        filtroUnidadeRelatorioIACompativel(meta, unidadeIdNum) &&
        Number(meta?.versaoId || 0) === Number(versaoIdNum || 0)
      );
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
          filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
          versaoId: versaoIdNum,
          empresaUnidadeId: unidadeIdNum
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
        filtroNivelMax,
        versaoId: versaoIdNum,
        empresaUnidadeId: unidadeIdNum
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

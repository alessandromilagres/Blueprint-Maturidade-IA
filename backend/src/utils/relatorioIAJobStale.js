import { prisma } from '../lib/prisma.js';
import { isTipoRelatorioIABook } from '../constants/tiposRelatorioIA.js';

/** Minutos sem atualização antes de considerar job órfão/zumbi. */
const STALE_MINUTES_EXECUTIVO = 20;
const STALE_MINUTES_BOOK = 120;
const STALE_MINUTES_BOOK_PREPARACAO = 8;

export function limiteMinutosJobObsoleto(tipo, job = null) {
  if (job?.progresso != null && Number(job.progresso) <= 40) {
    return STALE_MINUTES_BOOK_PREPARACAO;
  }
  return isTipoRelatorioIABook(tipo) ? STALE_MINUTES_BOOK : STALE_MINUTES_EXECUTIVO;
}

export function jobRelatorioIAEstaObsoleto(job, now = Date.now()) {
  if (!job || !['queued', 'running'].includes(job.status)) return false;
  const ref = job.updatedAt || job.startedAt || job.createdAt;
  if (!ref) return false;
  const minutos = (now - new Date(ref).getTime()) / 60_000;
  return minutos >= limiteMinutosJobObsoleto(job.tipo, job);
}

export async function falharJobRelatorioIAObsoleto(jobId, motivo) {
  await prisma.relatorioIAJob.update({
    where: { id: jobId },
    data: {
      status: 'failed',
      progresso: 100,
      etapa: 'Interrompido (job órfão)',
      erro: motivo,
      finishedAt: new Date()
    }
  });
}

/** Marca jobs queued/running sem heartbeat recente como failed (restart ou crash). */
export async function recuperarJobsRelatorioIAOrfaos() {
  const ativos = await prisma.relatorioIAJob.findMany({
    where: { status: { in: ['queued', 'running'] } },
    select: {
      id: true,
      tipo: true,
      status: true,
      updatedAt: true,
      startedAt: true,
      createdAt: true
    }
  });

  let recuperados = 0;
  for (const job of ativos) {
    if (!jobRelatorioIAEstaObsoleto(job)) continue;
    await falharJobRelatorioIAObsoleto(
      job.id,
      'Job interrompido (processo reiniciado ou sem progresso por tempo prolongado). Gere novamente.'
    );
    recuperados += 1;
  }
  if (recuperados > 0) {
    console.log(`[relatorios-ia-jobs] ${recuperados} job(s) órfão(s) marcado(s) como failed.`);
  }
  return recuperados;
}

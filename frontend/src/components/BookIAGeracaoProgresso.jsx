import { Ban, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import {
  detalheChunkJob,
  estimateRemainingMs,
  formatDurationMs,
  labelFaseBookIA,
  parseMetadataJobBook,
  pipelineGrossoBook,
  textoProgressoPrincipal
} from '../utils/bookIAGeracaoProgresso';

function StepIcon({ state }) {
  if (state === 'done') return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />;
  if (state === 'current') return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-700" />;
  return <Circle className="h-4 w-4 shrink-0 text-slate-300" />;
}

/**
 * Painel de progresso do book IA em background (preparação 31–39%, chunks, %).
 * variant: fullscreen = tela só com job; inline = faixa no topo do book.
 */
export default function BookIAGeracaoProgresso({
  job,
  variant = 'inline',
  onCancel,
  cancelando = false,
  avisosSlot = null,
  footerSlot = null,
  tickRelogio = 0
}) {
  if (!job) return null;

  const pct = Math.min(100, Math.max(0, Math.round(Number(job.progresso) || 0)));
  const meta = parseMetadataJobBook(job);
  const chunk = detalheChunkJob(job);
  const pipeline = pipelineGrossoBook(job);
  const principal = textoProgressoPrincipal(job);
  const ativo = ['queued', 'running'].includes(job.status);
  const elapsed =
    job.startedAt && ativo
      ? formatDurationMs(Date.now() - new Date(job.startedAt).getTime())
      : job.startedAt && job.finishedAt
        ? formatDurationMs(new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime())
        : '—';

  void tickRelogio;

  const barColor =
    job.status === 'failed'
      ? 'bg-red-500'
      : job.status === 'completed'
        ? 'bg-emerald-500'
        : job.status === 'cancelled'
          ? 'bg-slate-400'
          : 'bg-gradient-to-r from-cyan-500 to-teal-500';

  const shell =
    variant === 'fullscreen'
      ? 'min-h-[calc(100vh-4rem)] flex flex-col justify-center px-6 py-10'
      : 'px-6 py-3';
  const innerMax =
    variant === 'fullscreen' ? 'max-w-3xl' : 'max-w-7xl';

  return (
    <div
      className={
        variant === 'fullscreen'
          ? 'border-b border-cyan-200 bg-gradient-to-b from-cyan-50 to-white'
          : 'border-b border-cyan-200 bg-gradient-to-r from-cyan-50 to-teal-50 print:hidden'
      }
    >
      <div className={`mx-auto flex ${innerMax} flex-col gap-4 text-cyan-950 ${shell}`}>
        {/* Percentual em destaque — sempre visível */}
        <div
          className={`flex flex-col items-center justify-center rounded-2xl border border-cyan-200/90 bg-white/80 px-6 py-5 shadow-sm ${
            variant === 'fullscreen' ? 'py-8' : 'py-4'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Progresso do book</p>
          <p
            className={`mt-1 font-black tabular-nums leading-none tracking-tight text-cyan-950 ${
              variant === 'fullscreen' ? 'text-7xl sm:text-8xl' : 'text-5xl sm:text-6xl'
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            {pct}%
          </p>
          <p className="mt-2 max-w-xl text-center text-sm font-medium text-cyan-900">{principal}</p>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-800">
              Book IA em background · {job.status === 'running' ? 'Em execução' : job.status}
            </p>
            {meta?.fase && ativo && pct < 40 ? (
              <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-700/80">
                Fase: {labelFaseBookIA(meta.fase)}
              </p>
            ) : null}
            {chunk ? (
              <p className="rounded-lg border border-cyan-200/80 bg-white/70 px-3 py-2 text-sm font-medium text-cyan-900">
                {chunk.preparacao ? 'Preparando bloco' : 'Bloco'}{' '}
                <span className="font-mono text-base">
                  {chunk.atual ?? '…'}
                  {chunk.total ? `/${chunk.total}` : ''}
                </span>
                {chunk.label ? (
                  <span className="mt-1 block text-xs font-normal text-cyan-800">{chunk.label}</span>
                ) : null}
              </p>
            ) : meta?.totalChunks ? (
              <p className="text-sm text-cyan-800">
                Total de blocos: <strong>{meta.totalChunks}</strong>
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right text-xs text-cyan-900">
            <p>
              Decorrido: <strong>{elapsed}</strong>
            </p>
            {ativo ? (
              <p className="mt-1">
                Restante ~: <strong>{formatDurationMs(estimateRemainingMs(job))}</strong>
              </p>
            ) : null}
            {job.updatedAt ? (
              <p className="mt-1 text-[10px] text-cyan-700">
                Atualizado {new Date(job.updatedAt).toLocaleTimeString('pt-BR')}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-cyan-200/80">
            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="w-16 shrink-0 text-right font-mono text-xl font-bold text-cyan-950">{pct}%</span>
        </div>

        <ol className="grid gap-2 sm:grid-cols-3">
          {pipeline.map((step) => (
            <li
              key={step.id}
              className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${
                step.state === 'current'
                  ? 'border-cyan-400 bg-white shadow-sm'
                  : step.state === 'done'
                    ? 'border-emerald-200 bg-emerald-50/80'
                    : 'border-cyan-100 bg-cyan-50/40 text-cyan-800/70'
              }`}
            >
              <StepIcon state={step.state} />
              <div className="min-w-0">
                <p className="font-semibold">{step.label}</p>
                <p className="mt-0.5 leading-snug opacity-90">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        {job.status === 'failed' && job.erro ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{job.erro}</p>
        ) : null}

        {variant === 'fullscreen' ? (
          <p className="text-xs text-cyan-800">
            Você pode fechar esta aba e voltar depois — o job continua no servidor. Ao reabrir esta URL, o
            progresso reaparece aqui.
          </p>
        ) : null}

        {avisosSlot}
        {footerSlot}

        {ativo && onCancel ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelando}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
            >
              {cancelando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              Parar geração
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

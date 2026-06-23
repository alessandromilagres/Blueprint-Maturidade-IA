import { Link } from 'react-router-dom';
import { GitBranch, Lock, Plus, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';

const PL_LABELS = {
  INACEITAVEL: 'Inaceitável',
  ALTO: 'Alto risco',
  BAIXO: 'Risco moderado',
  MINIMO: 'Risco mínimo'
};

export default function CicloRegulatorioProduto({
  produtoId,
  regulatorioCiclos,
  podeGerenciar = false,
  onFechar,
  onAbrirProximo,
  acaoEmAndamento = false
}) {
  if (!regulatorioCiclos) return null;

  const { cicloAtual, ciclos = [] } = regulatorioCiclos;
  const fechados = ciclos.filter((c) => c.status === 'fechada');

  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/15 p-2">
            <GitBranch className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Ciclo regulatório</h3>
            {cicloAtual ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {cicloAtual.titulo} — <span className="font-medium text-emerald-700 dark:text-emerald-300">aberto</span>
              </p>
            ) : (
              <p className="text-sm text-amber-700 dark:text-amber-300">Nenhum ciclo aberto</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/dashboard/produto/${produtoId}/regulatorio/mitigacao`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Plano de mitigação
          </Link>
        </div>
      </div>

      {cicloAtual && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-white/70 dark:bg-gray-800/60 px-3 py-2 border border-indigo-100 dark:border-indigo-900/40">
            <p className="text-xs text-gray-500">Meta PL do ciclo</p>
            <p className="font-medium">{PL_LABELS[cicloAtual.metaPlRisco] || cicloAtual.metaPlRisco || '—'}</p>
          </div>
          <div className="rounded-lg bg-white/70 dark:bg-gray-800/60 px-3 py-2 border border-indigo-100 dark:border-indigo-900/40">
            <p className="text-xs text-gray-500">Mitigações</p>
            <p className="font-medium">
              {(cicloAtual.mitigacoes || []).filter((m) => m.status === 'concluida').length}/
              {(cicloAtual.mitigacoes || []).length} concluídas
            </p>
          </div>
          <div className="rounded-lg bg-white/70 dark:bg-gray-800/60 px-3 py-2 border border-indigo-100 dark:border-indigo-900/40">
            <p className="text-xs text-gray-500">Checklist fechamento</p>
            <p className={`font-medium flex items-center gap-1 ${cicloAtual.checklistFechamento?.ok ? 'text-emerald-700' : 'text-amber-700'}`}>
              {cicloAtual.checklistFechamento?.ok ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Pronto
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" /> Pendências
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {podeGerenciar && cicloAtual && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
          <button
            type="button"
            disabled={acaoEmAndamento}
            onClick={() => onFechar?.(cicloAtual)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            Fechar ciclo
          </button>
        </div>
      )}

      {podeGerenciar && !cicloAtual && fechados.length > 0 && (
        <button
          type="button"
          disabled={acaoEmAndamento}
          onClick={() => onAbrirProximo?.()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Abrir próximo ciclo
        </button>
      )}

      {fechados.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Histórico: {fechados.length} ciclo(s) fechado(s).{' '}
          <Link to={`/dashboard/produto/${produtoId}/regulatorio/mitigacao`} className="text-indigo-600 hover:underline">
            Ver comparativo
          </Link>
        </div>
      )}
    </div>
  );
}

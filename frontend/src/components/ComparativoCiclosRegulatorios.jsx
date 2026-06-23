import { TrendingDown, TrendingUp, Minus, GitBranch } from 'lucide-react';

const PL_LABELS = {
  INACEITAVEL: 'Inaceitável',
  ALTO: 'Alto',
  BAIXO: 'Baixo',
  MINIMO: 'Mínimo'
};

function DeltaBadge({ valor, suffix = '', invert = false }) {
  if (valor == null || valor === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-gray-500">
        <Minus className="w-3 h-3" /> —
      </span>
    );
  }
  const positivo = invert ? valor < 0 : valor > 0;
  const Icon = positivo ? TrendingUp : TrendingDown;
  const cor = positivo ? 'text-emerald-600' : 'text-red-600';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${cor}`}>
      <Icon className="w-3 h-3" />
      {valor > 0 ? '+' : ''}
      {typeof valor === 'number' ? valor.toFixed(valor % 1 ? 1 : 0) : valor}
      {suffix}
    </span>
  );
}

export default function ComparativoCiclosRegulatorios({ comparativo }) {
  if (!comparativo?.ciclos?.length) return null;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-indigo-600" />
        Evolução entre ciclos
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 text-left">
            <tr>
              <th className="pb-2">Ciclo</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">PL</th>
              <th className="pb-2">ISO</th>
              <th className="pb-2">RIPD</th>
              <th className="pb-2">Mitigações</th>
            </tr>
          </thead>
          <tbody>
            {comparativo.ciclos.map((c) => (
              <tr key={c.id} className="border-t border-gray-100 dark:border-gray-700">
                <td className="py-2 font-medium">{c.titulo}</td>
                <td className="py-2 capitalize">{c.status}</td>
                <td className="py-2">{PL_LABELS[c.metricas?.pl] || c.metricas?.pl || '—'}</td>
                <td className="py-2">{c.metricas?.iso != null ? `${c.metricas.iso}%` : '—'}</td>
                <td className="py-2">{c.metricas?.lgpdRipd ? 'Sim' : 'Não'}</td>
                <td className="py-2">
                  {(c.mitigacoes || []).filter((m) => m.status === 'concluida').length}/
                  {(c.mitigacoes || []).length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {comparativo.comparacoes?.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500">Comparativo sequencial</p>
          {comparativo.comparacoes.map((par) => (
            <div
              key={`${par.de.numero}-${par.para.numero}`}
              className="rounded-lg bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-xs flex flex-wrap items-center gap-3"
            >
              <span className="font-medium">
                {par.de.titulo} → {par.para.titulo}
              </span>
              <DeltaBadge valor={par.delta.isoDelta} suffix="%" />
              {par.delta.plMelhorou && (
                <span className="text-emerald-600 font-medium">PL melhorou</span>
              )}
              <DeltaBadge
                valor={par.delta.mitigacoesConcluidasDelta}
                suffix=" mitig. concl."
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

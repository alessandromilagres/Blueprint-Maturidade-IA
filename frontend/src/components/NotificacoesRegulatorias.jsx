import { Link } from 'react-router-dom';
import { Bell, AlertTriangle } from 'lucide-react';

const SEV_STYLES = {
  CRITICO: 'border-red-300 bg-red-50 dark:bg-red-950/30',
  ALTO: 'border-orange-300 bg-orange-50 dark:bg-orange-950/20',
  MEDIO: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20',
  BAIXO: 'border-gray-200 bg-gray-50 dark:bg-gray-900/40'
};

export default function NotificacoesRegulatorias({ notificacoes, projetoId, className = '' }) {
  const lista = notificacoes?.notificacoes || [];
  if (lista.length === 0) return null;

  return (
    <div className={`rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
          <Bell className="w-4 h-4 text-amber-600" />
          Alertas regulatórios ({lista.length})
        </h3>
        {notificacoes?.resumo?.criticas > 0 && (
          <span className="text-xs font-bold text-red-600">{notificacoes.resumo.criticas} crítico(s)</span>
        )}
      </div>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {lista.slice(0, 12).map((n) => (
          <li
            key={`${n.codigo}-${n.produtoId}-${n.titulo}`}
            className={`rounded-lg border px-3 py-2 text-xs ${SEV_STYLES[n.severidade] || SEV_STYLES.MEDIO}`}
          >
            <p className="font-medium text-gray-900 dark:text-white flex items-start gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {n.titulo}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mt-0.5 ml-4">{n.mensagem}</p>
            {n.produtoId && (
              <Link
                to={`/dashboard/produto/${n.produtoId}/regulatorio/mitigacao`}
                className="text-indigo-600 hover:underline ml-4 inline-block mt-1"
              >
                Ver produto →
              </Link>
            )}
          </li>
        ))}
      </ul>
      {projetoId && lista.length > 12 && (
        <Link
          to={`/dashboard/projeto/${projetoId}/regulatorio`}
          className="text-xs text-indigo-600 hover:underline mt-2 inline-block"
        >
          Ver todos no dashboard regulatório
        </Link>
      )}
    </div>
  );
}

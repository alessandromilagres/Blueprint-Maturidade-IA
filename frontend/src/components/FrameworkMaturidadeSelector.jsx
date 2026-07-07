import { FRAMEWORK_OPTIONS } from '../constants/frameworkMaturidade';

export default function FrameworkMaturidadeSelector({
  value,
  onChange,
  disabled = false,
  locked = false,
  setorRegulado = false,
  onSetorReguladoChange,
  showSetorRegulado = false
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Framework de maturidade *</label>
        {locked && (
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
            Travado após o início das avaliações — não é possível trocar o framework.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FRAMEWORK_OPTIONS.map((opt) => {
            const selected = value === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled || locked}
                onClick={() => onChange(opt.id)}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  selected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                } ${disabled || locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{opt.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {showSetorRegulado && value === FRAMEWORK_OPTIONS[1].id && (
        <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            className="mt-1"
            checked={setorRegulado}
            disabled={disabled || locked}
            onChange={(e) => onSetorReguladoChange?.(e.target.checked)}
          />
          <span>
            Setor regulado (finanças, saúde, telecom, energia) — D2, D7 e D11 entram com peso 2× na média geral; D11 é obrigatória.
          </span>
        </label>
      )}
    </div>
  );
}

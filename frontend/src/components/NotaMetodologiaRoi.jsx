import { NOTA_METODOLOGIA_ROI_CURTA } from '../utils/metodologiaRoiFinanceiro';

/**
 * Nota metodológica sobre benefício bruto vs ROI líquido — books e relatórios.
 */
export default function NotaMetodologiaRoi({ className = '', compact = false }) {
  if (compact) {
    return (
      <p className={`text-[9px] print:text-[8px] text-slate-400 print:text-slate-600 ${className}`}>
        {NOTA_METODOLOGIA_ROI_CURTA}
      </p>
    );
  }

  return (
    <div
      className={`bg-blue-500/5 print:bg-blue-50 border border-blue-500/20 print:border-blue-200 rounded-lg p-3 ${className}`}
    >
      <p className="text-[10px] font-semibold text-blue-400 print:text-blue-700 uppercase tracking-wider mb-2">
        Como ler ROI neste relatório
      </p>
      <div className="space-y-1.5 text-[9px] text-slate-400 print:text-slate-600">
        <p>
          <span className="font-medium text-slate-300 print:text-slate-700">Benefício bruto:</span> valor
          econômico anual estimado (economia + receita incremental) antes de abater investimento em IA.
        </p>
        <p>
          <span className="font-medium text-slate-300 print:text-slate-700">Ganho líquido:</span> benefício
          bruto − investimento — o custo foi abatido.
        </p>
        <p>
          <span className="font-medium text-slate-300 print:text-slate-700">ROI líquido:</span> (ganho líquido
          ÷ investimento) × 100 — métrica padrão para CFO/conselho.
        </p>
        <p>
          <span className="font-medium text-slate-300 print:text-slate-700">Benchmark MIT por nível:</span>{' '}
          faixa de ROI líquido típico sobre investimento em capacidades de IA (referência MIT CISR / McKinsey /
          BCG) — não margem sobre o faturamento total.
        </p>
      </div>
    </div>
  );
}

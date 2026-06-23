import { useState } from 'react';
import { Scale, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const RISCO_STYLES = {
  CRITICO: {
    badge: 'bg-red-500/20 text-red-300 print:bg-red-100 print:text-red-800 border-red-500/30',
    dot: 'bg-red-400'
  },
  ALTO: {
    badge: 'bg-orange-500/20 text-orange-300 print:bg-orange-100 print:text-orange-800 border-orange-500/30',
    dot: 'bg-orange-400'
  },
  MEDIO: {
    badge: 'bg-amber-500/20 text-amber-300 print:bg-amber-100 print:text-amber-800 border-amber-500/30',
    dot: 'bg-amber-400'
  },
  BAIXO: {
    badge: 'bg-emerald-500/20 text-emerald-300 print:bg-emerald-100 print:text-emerald-800 border-emerald-500/30',
    dot: 'bg-emerald-400'
  }
};

function BadgeRisco({ nivelRisco, nivelRiscoLabel }) {
  if (!nivelRisco) return null;
  const style = RISCO_STYLES[nivelRisco] || RISCO_STYLES.MEDIO;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold print:text-[8px] ${style.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {nivelRiscoLabel || nivelRisco}
    </span>
  );
}

function ListaReferencias({ titulo, itens, resumo }) {
  if ((!itens || itens.length === 0) && !resumo) return null;
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 print:text-slate-600">{titulo}</p>
      {itens?.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {itens.map((item) => (
            <span
              key={item}
              className="rounded bg-slate-700/60 print:bg-slate-200 px-1.5 py-0.5 text-[9px] text-slate-300 print:text-slate-700"
            >
              {item}
            </span>
          ))}
        </div>
      )}
      {resumo && <p className="mt-1 text-[9px] text-slate-400 print:text-slate-600">{resumo}</p>}
    </div>
  );
}

/**
 * Badges e detalhes de implicações regulatórias por dimensão (ISO 42001, PL 2338, LGPD).
 */
export default function ImplicacoesRegulatoriasDimensao({
  regulatorio,
  compact = false,
  defaultExpanded = false,
  className = ''
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!regulatorio?.disponivel) return null;

  const { emGap, nivelRisco, nivelRiscoLabel, iso, pl, lgpd, scoreLimiar, disclaimer } = regulatorio;
  const temReferencias =
    (iso?.clausulas?.length > 0) ||
    (pl?.artigos?.length > 0) ||
    (lgpd?.artigos?.length > 0);

  if (compact) {
    return (
      <div className={`mt-2 border-t border-slate-600/50 print:border-slate-300 pt-2 ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Scale className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-[9px] text-slate-400 print:text-slate-600 truncate">Regulatório</span>
          </div>
          <BadgeRisco nivelRisco={nivelRisco} nivelRiscoLabel={nivelRiscoLabel} />
        </div>
        {emGap && (
          <p className="mt-1 text-[8px] text-amber-400/90 print:text-amber-700">
            Gap provável (score &lt; {scoreLimiar})
          </p>
        )}
        {temReferencias && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 flex items-center gap-1 text-[8px] text-blue-400 print:text-blue-700 print:hidden"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Ocultar' : 'Ver referências'}
          </button>
        )}
        {(expanded || !compact) && temReferencias && (
          <div className="mt-2 space-y-2 print:block">
            <ListaReferencias titulo="ISO 42001" itens={iso?.clausulas} resumo={iso?.resumo} />
            <ListaReferencias titulo="PL 2338" itens={pl?.artigos} resumo={pl?.resumo} />
            <ListaReferencias titulo="LGPD" itens={lgpd?.artigos} resumo={lgpd?.resumo} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-slate-600/50 print:border-slate-300 bg-slate-900/30 print:bg-slate-50 p-3 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-[10px] font-semibold text-slate-300 print:text-slate-800">Implicações regulatórias</p>
            <p className="text-[9px] text-slate-500">
              {regulatorio.codigoDimensao} · limiar {scoreLimiar}
              {emGap ? ' · gap provável' : ' · dentro do limiar'}
            </p>
          </div>
        </div>
        <BadgeRisco nivelRisco={nivelRisco} nivelRiscoLabel={nivelRiscoLabel} />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <ListaReferencias titulo="ISO 42001" itens={iso?.clausulas} resumo={iso?.resumo} />
        <ListaReferencias titulo="PL 2338" itens={pl?.artigos} resumo={pl?.resumo} />
        <ListaReferencias titulo="LGPD" itens={lgpd?.artigos} resumo={lgpd?.resumo} />
      </div>

      {regulatorio.logicaMapeamento && (
        <p className="mt-2 text-[9px] text-slate-400 print:text-slate-600">{regulatorio.logicaMapeamento}</p>
      )}

      <p className="mt-2 flex items-start gap-1 text-[8px] text-slate-500 print:text-slate-600">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
        {disclaimer}
      </p>
    </div>
  );
}

export function DisclaimerRegulatorio({ className = '' }) {
  return (
    <div className={`rounded-lg border border-slate-600/50 print:border-slate-300 bg-slate-800/50 print:bg-slate-50 p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <Scale className="w-4 h-4 text-blue-400 print:text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-semibold text-slate-300 print:text-slate-800">Referência regulatória (estimativa)</p>
          <p className="mt-1 text-[9px] text-slate-400 print:text-slate-600">
            Os badges por dimensão cruzam scores BluePrint com ISO 42001, PL 2338/2023 e LGPD.
            Trata-se de orientação para priorização — não substitui auditoria, certificação ou parecer jurídico.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ResumoRegulatorioProjeto({ resumo, className = '' }) {
  if (!resumo || resumo.totalDimensoesMapeadas === 0) return null;

  return (
    <div className={`rounded-xl border border-slate-700 print:border-slate-300 bg-slate-800 print:bg-slate-50 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Scale className="w-5 h-5 text-blue-400 print:text-blue-600" />
        <h3 className="text-white print:text-slate-900 font-semibold">Panorama regulatório (estimativa)</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="rounded-lg bg-slate-700/50 print:bg-white print:border print:border-slate-200 p-3 text-center">
          <p className="text-xs text-slate-400 uppercase">Dimensões mapeadas</p>
          <p className="text-xl font-bold text-white print:text-slate-900">{resumo.totalDimensoesMapeadas}</p>
        </div>
        <div className="rounded-lg bg-slate-700/50 print:bg-white print:border print:border-slate-200 p-3 text-center">
          <p className="text-xs text-slate-400 uppercase">Gaps prováveis</p>
          <p className="text-xl font-bold text-amber-400 print:text-amber-700">{resumo.totalGaps}</p>
        </div>
        <div className="rounded-lg bg-slate-700/50 print:bg-white print:border print:border-slate-200 p-3 text-center">
          <p className="text-xs text-slate-400 uppercase">Críticos</p>
          <p className="text-xl font-bold text-red-400 print:text-red-700">{resumo.totalCriticos}</p>
        </div>
      </div>
      {resumo.dimensoesEmGap?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase">Prioridades regulatórias</p>
          {resumo.dimensoesEmGap.slice(0, 6).map((d) => (
            <div key={d.codigo} className="flex items-center justify-between rounded-lg bg-slate-700/40 print:bg-slate-100 px-3 py-2">
              <span className="text-sm text-white print:text-slate-900">{d.nome}</span>
              <BadgeRisco nivelRisco={d.nivelRisco} nivelRiscoLabel={d.nivelRisco} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

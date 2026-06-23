import { Link } from 'react-router-dom';
import { Scale, AlertTriangle, Shield, FileWarning, CheckCircle2, ShieldCheck, ClipboardEdit } from 'lucide-react';

const PL_STYLES = {
  INACEITAVEL: 'bg-red-600 text-white border-red-700',
  ALTO: 'bg-orange-500 text-white border-orange-600',
  BAIXO: 'bg-blue-500 text-white border-blue-600',
  MINIMO: 'bg-emerald-600 text-white border-emerald-700'
};

const PL_LABELS = {
  INACEITAVEL: 'Inaceitável',
  ALTO: 'Alto risco',
  BAIXO: 'Risco moderado',
  MINIMO: 'Risco mínimo'
};

function BadgePl({ nivel }) {
  if (!nivel) return null;
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${PL_STYLES[nivel] || PL_STYLES.BAIXO}`}>
      {PL_LABELS[nivel] || nivel}
    </span>
  );
}

/**
 * Bloco de status regulatório do produto (PL 2338, ISO 42001, LGPD).
 */
export default function StatusRegulatorioProduto({
  snapshot,
  produtoId,
  className = '',
  showValidationBadge = true,
  showValidateLink = true,
  podeValidar = false
}) {
  if (!snapshot) return null;

  const plExibir = snapshot.plRiscoNivelEfetivo || snapshot.plRiscoNivel;
  const { isoScoreEstimado, isoGapCount, plDetalhes, lgpdDetalhes, disclaimer } = snapshot;
  const aipdObrigatoria =
    snapshot.aipdObrigatoria ??
    (plExibir === 'ALTO' || plExibir === 'INACEITAVEL');
  const plAjustadoPeloConsultor = snapshot.plReclassificadoConsultor === true;
  const ripdNecessario =
    snapshot.lgpdRipdEfetivo ??
    snapshot.lgpdDetalhes?.ripdNecessario === true;
  const linkId = produtoId || snapshot.produtoId;

  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden ${className}`}>
      <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-gray-900/50 px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2">
              <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status regulatório
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {snapshot.validadoConsultor
                  ? 'Validado pelo consultor'
                  : 'Estimativa automática — aguardando validação'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <BadgePl nivel={plExibir} />
            {showValidationBadge && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  snapshot.validadoConsultor
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                }`}
              >
                {snapshot.validadoConsultor ? (
                  <>
                    <ShieldCheck className="w-3 h-3" /> Validado
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3" /> Estimativa
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {snapshot.aipdPendente && (
        <div className="mx-6 mt-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-4 py-3 flex gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-red-800 dark:text-red-200">AIPD pendente</p>
            <p className="text-red-700 dark:text-red-300 text-xs mt-0.5">
              Alto risco PL sem AIPD em andamento ou concluída. Status atual:{' '}
              {snapshot.aipdStatus === 'em_andamento'
                ? 'em andamento'
                : snapshot.aipdStatus === 'concluida'
                  ? 'concluída'
                  : 'não iniciada'}
            </p>
          </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileWarning className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">PL 2338/2023</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {PL_LABELS[plExibir] || plExibir || '—'}
          </p>
          {plAjustadoPeloConsultor && (
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1 font-medium">
              Reclassificado pelo consultor (automático: {PL_LABELS[snapshot.plRiscoNivel] || snapshot.plRiscoNivel})
            </p>
          )}
          {!plAjustadoPeloConsultor && snapshot.pl2338Confirmado && snapshot.plRiscoNivel !== snapshot.plRiscoNivelConfirmado && (
            <p className="text-[10px] text-gray-500 mt-1">
              Automático: {PL_LABELS[snapshot.plRiscoNivel] || snapshot.plRiscoNivel}
            </p>
          )}
          {plDetalhes?.motivos?.length > 0 && (
            <div className="mt-3">
              {plAjustadoPeloConsultor && (
                <p className="text-[10px] text-gray-500 mb-1">Sinais da estimativa automática (antes do ajuste):</p>
              )}
              <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                {plDetalhes.motivos.slice(0, 3).map((m) => (
                  <li key={m.codigo}>• {m.titulo}</li>
                ))}
              </ul>
            </div>
          )}
          {aipdObrigatoria && (
            <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-red-700 dark:text-red-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {plDetalhes?.aipdMensagem || 'AIPD recomendada antes do deploy'}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">ISO/IEC 42001</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {isoScoreEstimado != null ? `${isoScoreEstimado}%` : '—'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">conformidade estimada</p>
          {isoGapCount != null && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
              {isoGapCount} dimensão(ões) do projeto em gap regulatório
            </p>
          )}
          {snapshot.isoOverride?.notasConsultor && (
            <p className="mt-2 text-xs text-blue-800 dark:text-blue-200 italic">
              Consultor: {snapshot.isoOverride.notasConsultor}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">LGPD</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 text-lg leading-tight">
            {ripdNecessario ? 'RIPD necessário' : 'Sem RIPD obrigatório'}
          </p>
          {snapshot.lgpdReclassificadoConsultor && (
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1">
              Reclassificado pelo consultor
              {snapshot.lgpdDetalhes?.ripdNecessario !== ripdNecessario &&
                ` (automático: ${snapshot.lgpdDetalhes?.ripdNecessario ? 'RIPD' : 'sem RIPD'})`}
            </p>
          )}
          {snapshot.lgpdBaseLegal && (
            <p className="mt-2 text-xs font-medium text-purple-800 dark:text-purple-200">
              Base legal: {snapshot.lgpdBaseLegal}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
            {lgpdDetalhes?.mensagem}
          </p>
          {snapshot.validadoConsultor && ripdNecessario && (
            <p className="mt-2 text-[10px] text-gray-500">
              LGPD é avaliada separadamente da classificação PL — ajuste a base legal acima; RIPD pode permanecer recomendado.
            </p>
          )}
        </div>
      </div>

      <div className="px-6 pb-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700 pt-3">
        <p className="flex items-start gap-2 text-[11px] text-gray-500 dark:text-gray-400 flex-1 min-w-0">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {disclaimer || 'Estimativa orientativa — não constitui certificação nem parecer jurídico.'}
        </p>
        {showValidateLink && linkId && (podeValidar || !snapshot.validadoConsultor) && (
          <Link
            to={`/dashboard/produto/${linkId}/regulatorio`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 shrink-0"
          >
            <ClipboardEdit className="w-3.5 h-3.5" />
            {snapshot.validadoConsultor ? 'Revisar validação' : 'Validar conformidade'}
          </Link>
        )}
      </div>
    </div>
  );
}

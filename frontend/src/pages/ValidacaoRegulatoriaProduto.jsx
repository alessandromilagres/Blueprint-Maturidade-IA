import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Save, Scale, AlertTriangle, ShieldCheck } from 'lucide-react';
import { dashboardApi, regulatorioApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import StatusRegulatorioProduto from '../components/StatusRegulatorioProduto';

const PL_OPCOES = [
  { value: 'MINIMO', label: 'Mínimo' },
  { value: 'BAIXO', label: 'Baixo' },
  { value: 'ALTO', label: 'Alto' },
  { value: 'INACEITAVEL', label: 'Inaceitável' }
];

const AIPD_OPCOES = [
  { value: 'nao_iniciada', label: 'Não iniciada' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída' }
];

const BASES_LGPD = [
  '',
  'Consentimento do titular (Art. 7º, I)',
  'Execução de contrato (Art. 7º, V)',
  'Legítimo interesse (Art. 7º, IX) — requer LIA',
  'Cumprimento de obrigação legal (Art. 7º, II)',
  'Proteção da vida (Art. 7º, VII)',
  'A definir com jurídico'
];

const PL_LABELS = {
  INACEITAVEL: 'Inaceitável',
  ALTO: 'Alto risco',
  BAIXO: 'Risco moderado',
  MINIMO: 'Risco mínimo'
};

function podeValidarRegulatorio(role) {
  const r = String(role || '').trim().toLowerCase();
  return ['admin', 'gestor', 'sysmap', 'negocios', 'ti', 'executivo'].includes(r);
}

export default function ValidacaoRegulatoriaProduto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [produto, setProduto] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [form, setForm] = useState({
    pl2338Confirmado: true,
    plRiscoNivelConfirmado: '',
    lgpdBaseLegal: '',
    lgpdRipdConfirmado: false,
    lgpdRipdNecessario: 'auto',
    aipdStatus: 'nao_iniciada',
    isoOverrideNotas: '',
    consultorNotas: ''
  });

  const podeEditar = podeValidarRegulatorio(usuario?.role);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const dash = await dashboardApi.produto(id);
      setProduto(dash.produto);
      let snap = dash.regulatorySnapshot;
      if (!snap) {
        const res = await regulatorioApi.snapshotProduto(id, { recalcular: true });
        snap = res.snapshot;
      }
      setSnapshot(snap);
      if (snap) {
        setForm({
          pl2338Confirmado: snap.pl2338Confirmado ?? false,
          plRiscoNivelConfirmado: snap.plRiscoNivelConfirmado || snap.plRiscoNivel || '',
          lgpdBaseLegal: snap.lgpdBaseLegal || '',
          lgpdRipdConfirmado: snap.lgpdRipdConfirmado ?? false,
          lgpdRipdNecessario:
            snap.lgpdRipdOverride === true
              ? 'sim'
              : snap.lgpdRipdOverride === false
                ? 'nao'
                : 'auto',
          aipdStatus: snap.aipdStatus || 'nao_iniciada',
          isoOverrideNotas:
            snap.isoOverride?.notasConsultor ||
            (typeof snap.isoOverride === 'string' ? snap.isoOverride : ''),
          consultorNotas: snap.consultorNotas || ''
        });
      }
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar validação regulatória');
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalcular(preservar = true) {
    if (!podeEditar) return;
    if (!confirm(preservar ? 'Recalcular mantendo validação do consultor?' : 'Recalcular e RESETAR validação?')) return;
    setSaving(true);
    try {
      const res = await regulatorioApi.recalcularSnapshotProduto(id, { preservarValidacao: preservar });
      setSnapshot(res.snapshot);
      toast.success(preservar ? 'Snapshot recalculado (validação preservada)' : 'Snapshot recalculado do zero');
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSalvar(e) {
    e.preventDefault();
    if (!podeEditar) return;
    setSaving(true);
    try {
      const payload = {
        pl2338Confirmado: form.pl2338Confirmado,
        plRiscoNivelConfirmado: form.plRiscoNivelConfirmado || null,
        lgpdBaseLegal: form.lgpdBaseLegal || null,
        lgpdRipdConfirmado: form.lgpdRipdConfirmado,
        lgpdRipdNecessario:
          form.lgpdRipdConfirmado && form.lgpdRipdNecessario !== 'auto'
            ? form.lgpdRipdNecessario === 'sim'
            : undefined,
        aipdStatus: form.aipdStatus,
        isoOverride: form.isoOverrideNotas.trim()
          ? { notasConsultor: form.isoOverrideNotas.trim(), atualizadoEm: new Date().toISOString() }
          : null,
        consultorNotas: form.consultorNotas || null,
        validadoConsultor: true
      };
      const res = await regulatorioApi.confirmarSnapshotProduto(id, payload);
      setSnapshot(res.snapshot);
      toast.success('Validação regulatória salva com sucesso');
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar validação');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Nenhum snapshot regulatório. Finalize a avaliação IA-First do produto primeiro.
        </p>
        <Link to={`/dashboard/produto/${id}`} className="text-primary-600 hover:underline">
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/produto/${id}`)}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Scale className="w-7 h-7 text-blue-600" />
              Validação regulatória
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{produto?.nome}</p>
          </div>
        </div>

        {snapshot.alertas?.length > 0 && (
          <div className="space-y-2">
            {snapshot.alertas.map((a) => (
              <div
                key={a.codigo}
                className={`rounded-lg border px-4 py-3 flex gap-3 ${
                  a.severidade === 'CRITICO'
                    ? 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800'
                    : a.severidade === 'ALTO'
                      ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20'
                      : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20'
                }`}
              >
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{a.titulo}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{a.mensagem}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/dashboard/produto/${id}/regulatorio/mitigacao`}
            className="text-sm text-indigo-600 hover:underline"
          >
            Plano de mitigação por ciclo →
          </Link>
        </div>

        <StatusRegulatorioProduto snapshot={snapshot} showValidationBadge showValidateLink={false} />

        {!podeEditar ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
            Apenas gestores e consultores podem editar esta validação.
          </div>
        ) : (
          <form onSubmit={handleSalvar} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Complemento do consultor</h2>
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.pl2338Confirmado}
                onChange={(e) => setForm((f) => ({ ...f, pl2338Confirmado: e.target.checked }))}
                className="rounded mt-0.5"
              />
              <span>
                Aplicar a classificação PL escolhida abaixo (substitui a estimativa automática)
                {!form.pl2338Confirmado && (
                  <span className="block text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Desmarcado: o sistema mantém a classificação automática ({PL_LABELS[snapshot.plRiscoNivel] || snapshot.plRiscoNivel}).
                  </span>
                )}
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Classificação PL (confirmada ou ajustada)
              </label>
              <select
                value={form.plRiscoNivelConfirmado}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    plRiscoNivelConfirmado: e.target.value,
                    pl2338Confirmado: true
                  }))
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                {PL_OPCOES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                    {o.value === snapshot.plRiscoNivel ? ' (igual ao automático)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Estimativa automática atual: {PL_LABELS[snapshot.plRiscoNivel] || snapshot.plRiscoNivel}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status da AIPD
              </label>
              <select
                value={form.aipdStatus}
                onChange={(e) => setForm((f) => ({ ...f, aipdStatus: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                {AIPD_OPCOES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Base legal LGPD
              </label>
              <select
                value={form.lgpdBaseLegal}
                onChange={(e) => setForm((f) => ({ ...f, lgpdBaseLegal: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                {BASES_LGPD.map((b) => (
                  <option key={b || 'vazio'} value={b}>{b || '— Selecionar —'}</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-purple-200 dark:border-purple-900/50 p-4 space-y-3">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">LGPD — RIPD</p>
              <p className="text-xs text-gray-500">
                Estimativa automática:{' '}
                {snapshot.lgpdDetalhes?.ripdNecessario ? 'RIPD necessário' : 'Sem RIPD obrigatório'}
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.lgpdRipdConfirmado}
                  onChange={(e) => setForm((f) => ({ ...f, lgpdRipdConfirmado: e.target.checked }))}
                  className="rounded"
                />
                Confirmo a avaliação LGPD / RIPD para este produto
              </label>
              {form.lgpdRipdConfirmado && (
                <select
                  value={form.lgpdRipdNecessario}
                  onChange={(e) => setForm((f) => ({ ...f, lgpdRipdNecessario: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  <option value="auto">Manter estimativa automática</option>
                  <option value="sim">RIPD necessário</option>
                  <option value="nao">Sem RIPD obrigatório</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ajustes / observações ISO 42001
              </label>
              <textarea
                value={form.isoOverrideNotas}
                onChange={(e) => setForm((f) => ({ ...f, isoOverrideNotas: e.target.value }))}
                rows={3}
                placeholder="Correções ou contexto sobre gaps ISO identificados automaticamente..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas do consultor
              </label>
              <textarea
                value={form.consultorNotas}
                onChange={(e) => setForm((f) => ({ ...f, consultorNotas: e.target.value }))}
                rows={4}
                placeholder="Recomendações, próximos passos, ressalvas..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar validação'}
              </button>
              <button
                type="button"
                onClick={() => handleRecalcular(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Recalcular (manter validação)
              </button>
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm"
              >
                Recarregar
              </button>
            </div>

            {snapshot.validadoConsultor && snapshot.validadoPorUsuario && (
              <p className="text-xs text-gray-500">
                Validado por {snapshot.validadoPorUsuario.nome} em{' '}
                {snapshot.validadoEm ? new Date(snapshot.validadoEm).toLocaleString('pt-BR') : '—'}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

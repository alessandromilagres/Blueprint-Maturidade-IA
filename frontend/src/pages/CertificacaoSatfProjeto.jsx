import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Save,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { projetosApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import FrameworkMaturidadeBadge from '../components/FrameworkMaturidadeBadge';

const STATUS_LABEL = {
  pendente: 'Pendente',
  certificado: 'Certificado',
  rebaixado: 'Rebaixado'
};

const STATUS_STYLE = {
  pendente: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
  certificado: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100',
  rebaixado: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100'
};

function podeCertificar(role) {
  const r = String(role || '').trim().toLowerCase();
  return ['admin', 'gestor', 'sysmap', 'negocios', 'ti', 'executivo'].includes(r);
}

export default function CertificacaoSatfProjeto() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [data, setData] = useState(null);
  const [forms, setForms] = useState({});

  const podeEditar = podeCertificar(usuario?.role);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await projetosApi.certificacao(id);
      setData(res);
      const initial = {};
      for (const d of res.dimensoes || []) {
        if (d.foraDeEscopo || d.semDados) continue;
        initial[d.areaId] = {
          scoreCertificado:
            d.certificacao.scoreCertificado ?? d.scoreComTeto ?? d.scoreDeclarado ?? '',
          status: d.certificacao.status || 'pendente',
          confianca: d.certificacao.confianca || 'media',
          evidenciasResumo: d.certificacao.evidenciasResumo || '',
          observacaoConsultor: d.certificacao.observacaoConsultor || ''
        };
      }
      setForms(initial);
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar certificação');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function updateForm(areaId, field, value) {
    setForms((prev) => ({
      ...prev,
      [areaId]: { ...prev[areaId], [field]: value }
    }));
  }

  async function salvar(areaId, statusOverride) {
    const form = forms[areaId];
    if (!form) return;
    setSavingId(areaId);
    try {
      await projetosApi.salvarCertificacaoDimensao(id, areaId, {
        ...form,
        status: statusOverride || form.status,
        scoreCertificado:
          form.scoreCertificado === '' ? null : Number(form.scoreCertificado)
      });
      toast.success('Certificação salva');
      await load();
    } catch (e) {
      toast.error(e.message || 'Erro ao salvar');
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Carregando revisão de evidências…</div>;
  }

  if (!data) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">Não foi possível carregar a certificação.</p>
        <Link to={`/projetos/${id}`} className="text-primary-600 hover:underline mt-4 inline-block">
          Voltar ao projeto
        </Link>
      </div>
    );
  }

  const dimsRevisao = (data.dimensoes || []).filter((d) => !d.foraDeEscopo && !d.semDados);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <Link to={`/projetos/${id}`} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Revisão de evidências — SATF
            </h1>
            <FrameworkMaturidadeBadge projeto={{ frameworkMaturidade: data.frameworkMaturidade }} />
          </div>
          <p className="text-gray-600 dark:text-gray-400">{data.projeto?.nome}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 max-w-3xl">
            O score oficial do projeto usa a nota <strong>certificada</strong> pelo consultor (ou o
            teto automático por evidência quando ainda pendente). A nota declarada pelos avaliadores
            permanece visível para auditoria.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500">Dimensões</p>
          <p className="text-2xl font-bold">{data.resumo?.total ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Pendentes</p>
          <p className="text-2xl font-bold text-amber-600">{data.resumo?.pendentes ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Certificadas</p>
          <p className="text-2xl font-bold text-emerald-600">{data.resumo?.certificadas ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Status geral</p>
          <p className="text-lg font-semibold capitalize">{data.resumo?.statusGeral || '—'}</p>
        </div>
      </div>

      {data.resumo?.pendentes > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <p className="text-sm">
            {data.resumo.pendentes} dimensão(ões) aguardam certificação. O dashboard usa o score com
            teto por evidência até o consultor validar.
          </p>
        </div>
      )}

      {!podeEditar && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          Modo somente leitura — apenas gestores e consultores podem certificar dimensões.
        </div>
      )}

      <div className="space-y-4">
        {dimsRevisao.map((dim) => {
          const form = forms[dim.areaId] || {};
          const gap = Math.max(0, (dim.scoreDeclarado || 0) - (dim.scoreOficial || 0));
          const saving = savingId === dim.areaId;

          return (
            <div key={dim.areaId} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">{dim.area}</h2>
                  {dim.codigoFramework && (
                    <p className="text-xs text-gray-500">{dim.codigoFramework}</p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    STATUS_STYLE[dim.certificacao.status] || STATUS_STYLE.pendente
                  }`}
                >
                  {STATUS_LABEL[dim.certificacao.status] || dim.certificacao.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-4 text-sm">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3">
                  <p className="text-gray-500 text-xs">Declarado</p>
                  <p className="font-semibold text-lg">{dim.scoreDeclarado?.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3">
                  <p className="text-gray-500 text-xs">Com teto (evidência)</p>
                  <p className="font-semibold text-lg">{dim.scoreComTeto?.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-3">
                  <p className="text-indigo-600 dark:text-indigo-300 text-xs">Oficial atual</p>
                  <p className="font-semibold text-lg text-indigo-900 dark:text-indigo-100">
                    {dim.scoreOficial?.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3">
                  <p className="text-gray-500 text-xs">Avaliadores</p>
                  <p className="font-semibold">{dim.avaliadoresCobriram}</p>
                </div>
              </div>

              {gap > 0.05 && (
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                  Gap declarado → oficial: −{gap.toFixed(2)} (evidência ou certificação)
                </p>
              )}

              {dim.foraDaMediaGeral && (
                <p className="text-xs text-violet-600 dark:text-violet-300 mb-3">
                  Dimensão fora da média geral — certificação própria (ex.: D10).
                </p>
              )}

              {podeEditar && (
                <div className="grid gap-3 md:grid-cols-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nota certificada (1–5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={0.1}
                      className="input"
                      value={form.scoreCertificado ?? ''}
                      onChange={(e) => updateForm(dim.areaId, 'scoreCertificado', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Confiança</label>
                    <select
                      className="input"
                      value={form.confianca || 'media'}
                      onChange={(e) => updateForm(dim.areaId, 'confianca', e.target.value)}
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Média</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Resumo das evidências</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={form.evidenciasResumo || ''}
                      onChange={(e) => updateForm(dim.areaId, 'evidenciasResumo', e.target.value)}
                      placeholder="Links, gates, atas, dashboards revisados..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Observação do consultor</label>
                    <textarea
                      className="input"
                      rows={2}
                      value={form.observacaoConsultor || ''}
                      onChange={(e) => updateForm(dim.areaId, 'observacaoConsultor', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => salvar(dim.areaId, 'certificado')}
                      className="btn btn-success flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {saving ? 'Salvando…' : 'Certificar'}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => salvar(dim.areaId, 'rebaixado')}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Rebaixar
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => salvar(dim.areaId, 'pendente')}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Voltar pendente
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => salvar(dim.areaId)}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Salvar rascunho
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Link
          to={`/dashboard/projeto/${id}`}
          className="btn btn-primary"
        >
          Ver dashboard (score oficial)
        </Link>
      </div>
    </div>
  );
}

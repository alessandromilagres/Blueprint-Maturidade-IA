import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Lock,
  GitBranch,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { dashboardApi, regulatorioApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import StatusRegulatorioProduto from '../components/StatusRegulatorioProduto';
import ComparativoCiclosRegulatorios from '../components/ComparativoCiclosRegulatorios';

const PL_OPCOES = [
  { value: '', label: '— Sem meta —' },
  { value: 'MINIMO', label: 'Mínimo' },
  { value: 'BAIXO', label: 'Baixo' },
  { value: 'ALTO', label: 'Alto' },
  { value: 'INACEITAVEL', label: 'Inaceitável' }
];

const STATUS_OPCOES = [
  { value: 'planejada', label: 'Planejada' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída' }
];

const PL_LABELS = {
  INACEITAVEL: 'Inaceitável',
  ALTO: 'Alto',
  BAIXO: 'Baixo',
  MINIMO: 'Mínimo'
};

function podeGerenciar(role) {
  const r = String(role || '').trim().toLowerCase();
  return ['admin', 'gestor', 'sysmap', 'negocios', 'ti', 'executivo'].includes(r);
}

export default function PlanoMitigacaoRegulatoria() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [produto, setProduto] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [ciclosInfo, setCiclosInfo] = useState(null);
  const [comparativo, setComparativo] = useState(null);
  const [cicloMeta, setCicloMeta] = useState({ metaPlRisco: '', consultorNotas: '' });
  const [novaMitigacao, setNovaMitigacao] = useState({
    titulo: '',
    descricao: '',
    responsavel: '',
    prazo: '',
    status: 'planejada'
  });

  const podeEditar = podeGerenciar(usuario?.role);
  const cicloAtual = ciclosInfo?.cicloAtual;

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const dash = await dashboardApi.produto(id);
      setProduto(dash.produto);
      setSnapshot(dash.regulatorySnapshot);
      const ciclos = await regulatorioApi.ciclosProduto(id);
      setCiclosInfo(ciclos);
      try {
        const comp = await regulatorioApi.comparativoCiclos(id);
        setComparativo(comp.comparativo);
      } catch {
        setComparativo(null);
      }
      if (ciclos.cicloAtual) {
        setCicloMeta({
          metaPlRisco: ciclos.cicloAtual.metaPlRisco || '',
          consultorNotas: ciclos.cicloAtual.consultorNotas || ''
        });
      }
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar plano de mitigação');
    } finally {
      setLoading(false);
    }
  }

  async function salvarMetaCiclo() {
    if (!podeEditar || !cicloAtual) return;
    setSaving(true);
    try {
      const res = await regulatorioApi.atualizarCicloAtual(id, cicloMeta);
      setCiclosInfo((prev) => ({ ...prev, cicloAtual: res.ciclo }));
      toast.success('Meta do ciclo atualizada');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function salvarMitigacao(mitigacao) {
    if (!podeEditar || !cicloAtual) return;
    setSaving(true);
    try {
      await regulatorioApi.atualizarMitigacao(id, cicloAtual.id, mitigacao.id, mitigacao);
      await load();
      toast.success('Mitigação atualizada');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function adicionarMitigacao(e) {
    e.preventDefault();
    if (!podeEditar || !cicloAtual || !novaMitigacao.titulo.trim()) return;
    setSaving(true);
    try {
      await regulatorioApi.criarMitigacao(id, cicloAtual.id, novaMitigacao);
      setNovaMitigacao({ titulo: '', descricao: '', responsavel: '', prazo: '', status: 'planejada' });
      await load();
      toast.success('Mitigação adicionada');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function fecharCiclo(forcar = false) {
    if (!cicloAtual || !podeEditar) return;
    const checklist = cicloAtual.checklistFechamento;
    if (!forcar && checklist && !checklist.ok) {
      const msg = `Pendências:\n${(checklist.pendencias || []).map((p) => `• ${p.mensagem}`).join('\n')}\n\nDeseja forçar o fechamento mesmo assim?`;
      if (!confirm(msg)) return;
      const motivo = prompt('Motivo do fechamento forçado:', 'Prazo comercial / decisão executiva');
      if (motivo == null) return;
      return fecharCicloComMotivo(motivo);
    }
    if (!confirm(`Fechar ${cicloAtual.titulo}? O snapshot atual será congelado no histórico.`)) return;
    await fecharCicloComMotivo(null);
  }

  async function fecharCicloComMotivo(motivo) {
    setSaving(true);
    try {
      await regulatorioApi.fecharCiclo(id, cicloAtual.id, {
        forcar: !!motivo,
        motivo,
        metaPlRisco: cicloMeta.metaPlRisco || null,
        consultorNotas: cicloMeta.consultorNotas || null
      });
      toast.success('Ciclo fechado. Você pode abrir o próximo ciclo.');
      await load();
    } catch (e) {
      if (e.checklistFechamento) {
        toast.error(`${e.message}: ${(e.checklistFechamento.pendencias || []).map((p) => p.mensagem).join('; ')}`);
      } else {
        toast.error(e.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function abrirProximoCiclo() {
    if (!podeEditar) return;
    if (!confirm('Abrir novo ciclo regulatório? O snapshot será recalculado e mitigações pendentes podem ser herdadas.')) return;
    setSaving(true);
    try {
      await regulatorioApi.criarCiclo(id, { titulo: `Ciclo regulatório ${(ciclosInfo?.ciclos?.length || 0) + 1}` });
      toast.success('Novo ciclo aberto');
      await load();
    } catch (e) {
      toast.error(e.message);
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
          Finalize a avaliação IA-First para iniciar o controle regulatório por ciclo.
        </p>
        <Link to={`/dashboard/produto/${id}`} className="text-primary-600 hover:underline">
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
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
              <GitBranch className="w-7 h-7 text-indigo-600" />
              Plano de mitigação regulatória
            </h1>
            <p className="text-sm text-gray-500">{produto?.nome}</p>
          </div>
        </div>

        <StatusRegulatorioProduto snapshot={snapshot} produtoId={id} showValidateLink />

        {comparativo && <ComparativoCiclosRegulatorios comparativo={comparativo} />}

        {!cicloAtual ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-100">Nenhum ciclo aberto</p>
            <p className="text-amber-800 dark:text-amber-200 mt-1">
              Feche o ciclo anterior ou abra um novo para continuar o trabalho de redução de risco.
            </p>
            {podeEditar && (
              <button
                type="button"
                onClick={abrirProximoCiclo}
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white"
              >
                <Plus className="w-3.5 h-3.5" /> Abrir próximo ciclo
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                {cicloAtual.titulo}
                <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5">aberto</span>
              </h2>
              {cicloAtual.projetoVersaoId && (
                <p className="text-xs text-gray-500">
                  Vinculado à versão do projeto #{cicloAtual.projetoVersaoId}
                </p>
              )}

              {cicloAtual.checklistFechamento && !cicloAtual.checklistFechamento.ok && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm">
                  <p className="font-medium flex items-center gap-1 text-amber-900">
                    <AlertTriangle className="w-4 h-4" /> Pendências para fechar o ciclo
                  </p>
                  <ul className="mt-2 space-y-1 text-amber-800 dark:text-amber-200 text-xs">
                    {(cicloAtual.checklistFechamento.pendencias || []).map((p) => (
                      <li key={p.codigo}>• {p.mensagem}</li>
                    ))}
                  </ul>
                  <Link
                    to={`/dashboard/produto/${id}/regulatorio`}
                    className="inline-block mt-2 text-xs text-indigo-600 hover:underline"
                  >
                    Ir para validação do consultor →
                  </Link>
                </div>
              )}

              {podeEditar && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Meta de risco PL ao fim do ciclo</label>
                    <select
                      value={cicloMeta.metaPlRisco}
                      onChange={(e) => setCicloMeta((m) => ({ ...m, metaPlRisco: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                    >
                      {PL_OPCOES.map((o) => (
                        <option key={o.value || 'vazio'} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={salvarMetaCiclo}
                      disabled={saving}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-800 text-white px-3 py-2 text-sm disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" /> Salvar meta
                    </button>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notas do ciclo</label>
                    <textarea
                      value={cicloMeta.consultorNotas}
                      onChange={(e) => setCicloMeta((m) => ({ ...m, consultorNotas: e.target.value }))}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Ações de mitigação</h3>
              {(cicloAtual.mitigacoes || []).map((m) => (
                <MitigacaoCard
                  key={m.id}
                  mitigacao={m}
                  produtoId={id}
                  cicloId={cicloAtual.id}
                  podeEditar={podeEditar}
                  saving={saving}
                  onSave={salvarMitigacao}
                  onUploaded={load}
                />
              ))}
              {(cicloAtual.mitigacoes || []).length === 0 && (
                <p className="text-sm text-gray-500">Nenhuma mitigação — adicione ações para reduzir o risco.</p>
              )}
            </div>

            {podeEditar && (
              <form onSubmit={adicionarMitigacao} className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 space-y-3">
                <p className="text-sm font-medium">Nova mitigação</p>
                <input
                  value={novaMitigacao.titulo}
                  onChange={(e) => setNovaMitigacao((n) => ({ ...n, titulo: e.target.value }))}
                  placeholder="Título (ex.: Implementar supervisão humana no fluxo X)"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900"
                  required
                />
                <textarea
                  value={novaMitigacao.descricao}
                  onChange={(e) => setNovaMitigacao((n) => ({ ...n, descricao: e.target.value }))}
                  placeholder="Descrição / evidência esperada"
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    value={novaMitigacao.responsavel}
                    onChange={(e) => setNovaMitigacao((n) => ({ ...n, responsavel: e.target.value }))}
                    placeholder="Responsável"
                    className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900"
                  />
                  <input
                    type="date"
                    value={novaMitigacao.prazo}
                    onChange={(e) => setNovaMitigacao((n) => ({ ...n, prazo: e.target.value }))}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-900"
                  />
                  <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">
                    Adicionar
                  </button>
                </div>
              </form>
            )}

            {podeEditar && (
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fecharCiclo(false)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  Fechar ciclo
                </button>
              </div>
            )}
          </>
        )}

        {(ciclosInfo?.ciclos || []).filter((c) => c.status === 'fechada').length > 0 && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
            <h3 className="font-semibold mb-3">Histórico de ciclos</h3>
            <div className="space-y-2">
              {ciclosInfo.ciclos
                .filter((c) => c.status === 'fechada')
                .map((c) => {
                  const snapF = c.snapshotFechamento;
                  const pl = snapF?.plRiscoNivelEfetivo || snapF?.plRiscoNivel;
                  return (
                    <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                      <span className="font-medium">{c.titulo}</span>
                      <span className="text-gray-500">
                        PL: {PL_LABELS[pl] || pl || '—'} · fechado em{' '}
                        {c.fechadaEm ? new Date(c.fechadaEm).toLocaleDateString('pt-BR') : '—'}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MitigacaoCard({ mitigacao, produtoId, cicloId, podeEditar, saving, onSave, onUploaded }) {
  const toast = useToast();
  const [edit, setEdit] = useState(mitigacao);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setEdit(mitigacao);
  }, [mitigacao]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file || !podeEditar) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo máximo 10MB');
      return;
    }
    setUploading(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await regulatorioApi.uploadEvidenciaMitigacao(produtoId, cicloId, mitigacao.id, {
        arquivo: base64,
        nomeOriginal: file.name,
        mimeType: file.type || 'application/pdf'
      });
      toast.success('Evidência anexada');
      onUploaded?.();
    } catch (err) {
      toast.error(err.message || 'Erro no upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const evidencias = edit.evidencias || mitigacao.evidencias || [];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2">
      {podeEditar ? (
        <>
          <input
            value={edit.titulo}
            onChange={(e) => setEdit((x) => ({ ...x, titulo: e.target.value }))}
            className="w-full font-medium bg-transparent border-b border-gray-200 dark:border-gray-600 pb-1 text-sm"
          />
          <textarea
            value={edit.descricao || ''}
            onChange={(e) => setEdit((x) => ({ ...x, descricao: e.target.value }))}
            rows={2}
            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-2 py-1"
          />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
            <input
              value={edit.responsavel || ''}
              onChange={(e) => setEdit((x) => ({ ...x, responsavel: e.target.value }))}
              placeholder="Responsável"
              className="rounded border border-gray-200 dark:border-gray-600 px-2 py-1 bg-gray-50 dark:bg-gray-900"
            />
            <input
              type="date"
              value={edit.prazo ? String(edit.prazo).slice(0, 10) : ''}
              onChange={(e) => setEdit((x) => ({ ...x, prazo: e.target.value }))}
              className="rounded border border-gray-200 dark:border-gray-600 px-2 py-1 bg-gray-50 dark:bg-gray-900"
            />
            <select
              value={edit.status}
              onChange={(e) => setEdit((x) => ({ ...x, status: e.target.value }))}
              className="rounded border border-gray-200 dark:border-gray-600 px-2 py-1 bg-gray-50 dark:bg-gray-900"
            >
              {STATUS_OPCOES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={saving}
              onClick={() => onSave(edit)}
              className="rounded bg-emerald-600 text-white text-xs py-1.5 disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <label className="text-xs text-indigo-600 cursor-pointer hover:underline">
              <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt" onChange={handleFile} disabled={uploading} />
              {uploading ? 'Enviando...' : '+ Anexar evidência'}
            </label>
            {evidencias.map((ev) => (
              <a
                key={ev.id || ev.nomeArmazenado}
                href={`/api${ev.url}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-gray-600 underline"
              >
                {ev.nomeOriginal}
              </a>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="font-medium">{mitigacao.titulo}</p>
          <p className="text-sm text-gray-600">{mitigacao.descricao}</p>
        </>
      )}
      {mitigacao.status === 'concluida' && (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" /> Concluída
        </span>
      )}
    </div>
  );
}

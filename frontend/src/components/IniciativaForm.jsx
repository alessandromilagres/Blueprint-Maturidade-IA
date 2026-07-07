/**
 * Painel lateral de criação/edição de iniciativa do roadmap.
 * Mantém os campos de amarração ao diagnóstico (gap, score-alvo, ROI) — diferencial do módulo.
 */
import { useEffect, useState } from 'react';
import { X, Trash2, Save } from 'lucide-react';

const STATUS_OPCOES = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'planejada', label: 'Planejada' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' }
];
const PRIORIDADE_OPCOES = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' }
];

function dataInput(valor) {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const VAZIA = {
  titulo: '',
  descricao: '',
  responsavel: '',
  status: 'backlog',
  prioridade: 'media',
  progresso: 0,
  dataInicio: '',
  dataFimPrevista: '',
  dataFimReal: '',
  gapVinculado: '',
  scoreAlvo: '',
  roiEstimado: '',
  contextoTipo: 'dimensao',
  contextoId: '',
  contextoRotulo: ''
};

export default function IniciativaForm({
  aberta,
  iniciativa,
  contextoTipo,
  opcoesContexto = [],
  podeEditar = true,
  onSalvar,
  onRemover,
  onFechar
}) {
  const [form, setForm] = useState(VAZIA);
  const [salvando, setSalvando] = useState(false);
  const editando = Boolean(iniciativa?.id);

  useEffect(() => {
    if (iniciativa) {
      setForm({
        ...VAZIA,
        ...iniciativa,
        descricao: iniciativa.descricao || '',
        responsavel: iniciativa.responsavel || '',
        contextoRotulo: iniciativa.contextoRotulo || '',
        dataInicio: dataInput(iniciativa.dataInicio),
        dataFimPrevista: dataInput(iniciativa.dataFimPrevista),
        dataFimReal: dataInput(iniciativa.dataFimReal),
        gapVinculado: iniciativa.gapVinculado ?? '',
        scoreAlvo: iniciativa.scoreAlvo ?? '',
        roiEstimado: iniciativa.roiEstimado ?? ''
      });
    } else {
      setForm({ ...VAZIA, contextoTipo: contextoTipo || 'dimensao' });
    }
  }, [iniciativa, contextoTipo, aberta]);

  if (!aberta) return null;

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar() {
    if (!form.titulo.trim()) return;
    setSalvando(true);
    try {
      const payload = {
        ...form,
        progresso: Number(form.progresso) || 0,
        gapVinculado: form.gapVinculado === '' ? null : Number(form.gapVinculado),
        scoreAlvo: form.scoreAlvo === '' ? null : Number(form.scoreAlvo),
        roiEstimado: form.roiEstimado === '' ? null : Number(form.roiEstimado),
        dataInicio: form.dataInicio || null,
        dataFimPrevista: form.dataFimPrevista || null,
        dataFimReal: form.dataFimReal || null
      };
      // Rótulo amigável do contexto a partir das opções
      const op = opcoesContexto.find((o) => String(o.value) === String(form.contextoId));
      if (op) payload.contextoRotulo = op.label;
      await onSalvar(payload);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onFechar} />
      <div className="relative w-full max-w-md h-full bg-white dark:bg-gray-900 shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {editando ? 'Editar iniciativa' : 'Nova iniciativa'}
          </h3>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Campo label="Título *">
            <input
              type="text"
              value={form.titulo}
              disabled={!podeEditar}
              onChange={(e) => set('titulo', e.target.value)}
              className="input"
              placeholder="Ex.: Implantar catálogo de dados governado"
            />
          </Campo>

          <Campo label="Contexto (lente)">
            <select
              value={form.contextoId}
              disabled={!podeEditar}
              onChange={(e) => set('contextoId', e.target.value)}
              className="input"
            >
              <option value="">Selecione…</option>
              {opcoesContexto.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Campo>

          <Campo label="Descrição">
            <textarea
              value={form.descricao}
              disabled={!podeEditar}
              onChange={(e) => set('descricao', e.target.value)}
              rows={3}
              className="input"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Responsável">
              <input type="text" value={form.responsavel} disabled={!podeEditar} onChange={(e) => set('responsavel', e.target.value)} className="input" />
            </Campo>
            <Campo label="Progresso (%)">
              <input type="number" min="0" max="100" value={form.progresso} disabled={!podeEditar} onChange={(e) => set('progresso', e.target.value)} className="input" />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Status">
              <select value={form.status} disabled={!podeEditar} onChange={(e) => set('status', e.target.value)} className="input">
                {STATUS_OPCOES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Campo>
            <Campo label="Prioridade">
              <select value={form.prioridade} disabled={!podeEditar} onChange={(e) => set('prioridade', e.target.value)} className="input">
                {PRIORIDADE_OPCOES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Início">
              <input type="date" value={form.dataInicio} disabled={!podeEditar} onChange={(e) => set('dataInicio', e.target.value)} className="input" />
            </Campo>
            <Campo label="Fim previsto">
              <input type="date" value={form.dataFimPrevista} disabled={!podeEditar} onChange={(e) => set('dataFimPrevista', e.target.value)} className="input" />
            </Campo>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Amarração ao diagnóstico
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Campo label="Gap">
                <input type="number" step="0.1" value={form.gapVinculado} disabled={!podeEditar} onChange={(e) => set('gapVinculado', e.target.value)} className="input" />
              </Campo>
              <Campo label="Score-alvo">
                <input type="number" step="0.1" min="1" max="5" value={form.scoreAlvo} disabled={!podeEditar} onChange={(e) => set('scoreAlvo', e.target.value)} className="input" />
              </Campo>
              <Campo label="ROI (%)">
                <input type="number" step="1" value={form.roiEstimado} disabled={!podeEditar} onChange={(e) => set('roiEstimado', e.target.value)} className="input" />
              </Campo>
            </div>
          </div>
        </div>

        {podeEditar && (
          <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-900">
            <button
              onClick={salvar}
              disabled={salvando || !form.titulo.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
            {editando && (
              <button
                onClick={() => onRemover(iniciativa)}
                className="flex items-center justify-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid rgb(209 213 219);
          border-radius: 0.5rem;
          padding: 0.5rem 0.625rem;
          font-size: 0.875rem;
          background: transparent;
        }
        .dark .input { border-color: rgb(55 65 81); color: rgb(229 231 235); }
        .input:disabled { opacity: 0.6; }
      `}</style>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</span>
      {children}
    </label>
  );
}

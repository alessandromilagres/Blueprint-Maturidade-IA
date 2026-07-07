/**
 * Roadmap Visual Multi-Contexto (Item Crítico 1 — Rev. 2).
 * Eixo polimórfico ("lente"): dimensão | produto | portfólio, com o mesmo motor de timeline.
 * Diferencial preservado: cada iniciativa nasce do diagnóstico (gap → execução → re-diagnóstico).
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Download, LayoutGrid, List, Sparkles, Filter, Loader2, BarChart3
} from 'lucide-react';
import { iniciativasApi, produtosApi, dashboardApi } from '../services/api';
import { ORDEM_DIMENSOES_FRAMEWORK } from '../constants/ordemDimensoesFramework';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { podeGerenciarExecucao } from '../constants/perfisGestaoExecucao';
import GanttChart from '../components/GanttChart';
import IniciativaForm from '../components/IniciativaForm';

const LENTES = [
  { id: 'dimensao', label: 'Maturidade (D01–D16)' },
  { id: 'produto', label: 'Produto' },
  { id: 'portfolio', label: 'Portfólio' }
];

const STATUS_LABEL = {
  backlog: 'Backlog', planejada: 'Planejada', em_andamento: 'Em andamento',
  concluida: 'Concluída', cancelada: 'Cancelada'
};

function codigoDimensao(idx) {
  return `D${String(idx + 1).padStart(2, '0')}`;
}

export default function RoadmapTimeline() {
  const { id } = useParams();
  const projetoId = Number(id);
  const [searchParams] = useSearchParams();
  const versaoId = searchParams.get('versaoId');
  const toast = useToast();
  const { usuario } = useAuth();
  const podeEditar = podeGerenciarExecucao(usuario?.role);

  const [lente, setLente] = useState('dimensao');
  const [iniciativas, setIniciativas] = useState([]);
  const [scoresPorArea, setScoresPorArea] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('gantt');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPrioridade, setFiltroPrioridade] = useState('');
  const [busca, setBusca] = useState('');
  const [painelAberto, setPainelAberto] = useState(false);
  const [iniciativaSel, setIniciativaSel] = useState(null);
  const [importando, setImportando] = useState(false);

  useEffect(() => {
    carregar();
  }, [projetoId, lente, versaoId]);

  useEffect(() => {
    dashboardApi.projeto(projetoId, versaoId ? { versaoId } : {})
      .then((d) => setScoresPorArea(d?.scoresPorArea || []))
      .catch(() => {});
    produtosApi.listar(projetoId).then((p) => setProdutos(p || [])).catch(() => {});
  }, [projetoId, versaoId]);

  async function carregar() {
    setLoading(true);
    try {
      const params = { projetoId, contextoTipo: lente };
      if (versaoId) params.projetoVersaoId = versaoId;
      const data = await iniciativasApi.listar(params);
      setIniciativas(data || []);
    } catch (e) {
      toast.error(e.message || 'Erro ao carregar roadmap');
    } finally {
      setLoading(false);
    }
  }

  const scorePorNome = useMemo(() => {
    const m = new Map();
    for (const s of scoresPorArea) m.set(s.area, Number(s.score) || 0);
    return m;
  }, [scoresPorArea]);

  // Opções de contexto conforme a lente ativa
  const opcoesContexto = useMemo(() => {
    if (lente === 'dimensao') {
      return ORDEM_DIMENSOES_FRAMEWORK.map((nome, idx) => ({ value: codigoDimensao(idx), label: `${codigoDimensao(idx)} · ${nome}` }));
    }
    if (lente === 'produto') {
      return (produtos || []).map((p) => ({ value: String(p.id), label: p.nome }));
    }
    // portfólio: livre, a partir das iniciativas existentes
    const vistos = new Map();
    for (const i of iniciativas) {
      if (i.contextoId) vistos.set(i.contextoId, i.contextoRotulo || i.contextoId);
    }
    return [...vistos.entries()].map(([value, label]) => ({ value, label }));
  }, [lente, produtos, iniciativas]);

  const iniciativasFiltradas = useMemo(() => {
    return iniciativas.filter((i) => {
      if (filtroStatus && i.status !== filtroStatus) return false;
      if (filtroPrioridade && i.prioridade !== filtroPrioridade) return false;
      if (busca) {
        const t = `${i.titulo} ${i.responsavel || ''} ${i.contextoRotulo || ''}`.toLowerCase();
        if (!t.includes(busca.toLowerCase())) return false;
      }
      return true;
    });
  }, [iniciativas, filtroStatus, filtroPrioridade, busca]);

  // Agrupamento (eixo Y do Gantt) pela lente ativa
  const grupos = useMemo(() => {
    const mapa = new Map();
    const rotuloPara = (i) => {
      if (i.contextoRotulo) return i.contextoRotulo;
      const op = opcoesContexto.find((o) => String(o.value) === String(i.contextoId));
      return op?.label || i.contextoId;
    };
    for (const i of iniciativasFiltradas) {
      const chave = i.contextoId || 'sem-contexto';
      if (!mapa.has(chave)) {
        const rotulo = rotuloPara(i);
        const nomeDim = lente === 'dimensao'
          ? ORDEM_DIMENSOES_FRAMEWORK[parseInt(String(i.contextoId).replace(/\D/g, ''), 10) - 1]
          : null;
        const score = nomeDim ? scorePorNome.get(nomeDim) : null;
        mapa.set(chave, {
          chave,
          rotulo,
          critico: score != null && score > 0 && score < 2.5,
          iniciativas: []
        });
      }
      mapa.get(chave).iniciativas.push(i);
    }
    return [...mapa.values()];
  }, [iniciativasFiltradas, lente, opcoesContexto, scorePorNome]);

  function abrirNova() {
    setIniciativaSel(null);
    setPainelAberto(true);
  }
  function abrirEdicao(ini) {
    setIniciativaSel(ini);
    setPainelAberto(true);
  }

  async function salvar(payload) {
    try {
      const dados = { ...payload, projetoId, contextoTipo: lente };
      if (versaoId) dados.projetoVersaoId = Number(versaoId);
      if (iniciativaSel?.id) {
        await iniciativasApi.atualizar(iniciativaSel.id, dados);
        toast.success('Iniciativa atualizada');
      } else {
        await iniciativasApi.criar(dados);
        toast.success('Iniciativa criada');
      }
      setPainelAberto(false);
      carregar();
    } catch (e) {
      toast.error(e.message || 'Erro ao salvar');
    }
  }

  async function remover(ini) {
    if (!ini?.id) return;
    if (!window.confirm('Remover esta iniciativa?')) return;
    try {
      await iniciativasApi.remover(ini.id);
      toast.success('Iniciativa removida');
      setPainelAberto(false);
      carregar();
    } catch (e) {
      toast.error(e.message || 'Erro ao remover');
    }
  }

  async function importarRoadmap() {
    setImportando(true);
    try {
      const body = { projetoId };
      if (versaoId) body.projetoVersaoId = Number(versaoId);
      const r = await iniciativasApi.importarRoadmapIA(0, body);
      toast.success(`${r.criadas} iniciativa(s) importada(s) do diagnóstico${r.ignoradas ? `, ${r.ignoradas} já existiam` : ''}`);
      if (lente !== 'dimensao') setLente('dimensao');
      else carregar();
    } catch (e) {
      toast.error(e.message || 'Erro ao importar roadmap');
    } finally {
      setImportando(false);
    }
  }

  async function exportarCsv() {
    try {
      await iniciativasApi.exportarCsv({ projetoId, contextoTipo: lente, projetoVersaoId: versaoId || undefined });
    } catch (e) {
      toast.error(e.message || 'Erro ao exportar');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Link to={`/dashboard/projeto/${projetoId}`} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Roadmap de Iniciativas</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to={`/dashboard/projeto/${projetoId}/executive-dashboard${versaoId ? `?versaoId=${versaoId}` : ''}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Executive Dashboard
            </Link>
          </div>
        </div>

        {/* Seletor de lente */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {LENTES.map((l) => (
            <button
              key={l.id}
              onClick={() => setLente(l.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                lente === l.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Barra de ações e filtros */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-gray-400">
            <Filter className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-200"
          />
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-200">
            <option value="">Status: todos</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filtroPrioridade} onChange={(e) => setFiltroPrioridade(e.target.value)} className="px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-200">
            <option value="">Prioridade: todas</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button onClick={() => setVista('gantt')} className={`px-2.5 py-1.5 ${vista === 'gantt' ? 'bg-blue-600 text-white' : 'text-gray-500'}`} title="Gantt">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setVista('lista')} className={`px-2.5 py-1.5 ${vista === 'lista' ? 'bg-blue-600 text-white' : 'text-gray-500'}`} title="Lista">
                <List className="w-4 h-4" />
              </button>
            </div>
            <button onClick={exportarCsv} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
              <Download className="w-4 h-4" /> CSV
            </button>
            {podeEditar && (
              <>
                <button onClick={importarRoadmap} disabled={importando} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-purple-200 text-purple-700 dark:text-purple-300 rounded-lg disabled:opacity-50">
                  {importando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Importar do diagnóstico
                </button>
                <button onClick={abrirNova} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg">
                  <Plus className="w-4 h-4" /> Nova
                </button>
              </>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : vista === 'gantt' ? (
            <GanttChart grupos={grupos} onSelecionar={abrirEdicao} />
          ) : (
            <ListaIniciativas grupos={grupos} onSelecionar={abrirEdicao} />
          )}
        </div>
      </div>

      <IniciativaForm
        aberta={painelAberto}
        iniciativa={iniciativaSel}
        contextoTipo={lente}
        opcoesContexto={opcoesContexto}
        podeEditar={podeEditar}
        onSalvar={salvar}
        onRemover={remover}
        onFechar={() => setPainelAberto(false)}
      />
    </div>
  );
}

function ListaIniciativas({ grupos, onSelecionar }) {
  const todas = grupos.flatMap((g) => g.iniciativas.map((i) => ({ ...i, grupo: g.rotulo })));
  if (todas.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">Nenhuma iniciativa.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <th className="py-2 px-2">Contexto</th>
            <th className="py-2 px-2">Iniciativa</th>
            <th className="py-2 px-2">Responsável</th>
            <th className="py-2 px-2">Status</th>
            <th className="py-2 px-2">Prioridade</th>
            <th className="py-2 px-2">Progresso</th>
            <th className="py-2 px-2">Gap</th>
          </tr>
        </thead>
        <tbody>
          {todas.map((i) => (
            <tr key={i.id} onClick={() => onSelecionar(i)} className="border-b border-gray-50 dark:border-gray-800 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer">
              <td className="py-2 px-2 text-gray-500 dark:text-gray-400">{i.grupo}</td>
              <td className="py-2 px-2 font-medium text-gray-800 dark:text-gray-100">{i.titulo}</td>
              <td className="py-2 px-2 text-gray-500 dark:text-gray-400">{i.responsavel || '—'}</td>
              <td className="py-2 px-2">{STATUS_LABEL[i.status] || i.status}</td>
              <td className="py-2 px-2 capitalize">{i.prioridade}</td>
              <td className="py-2 px-2">{i.progresso || 0}%</td>
              <td className="py-2 px-2">{i.gapVinculado != null ? Number(i.gapVinculado).toFixed(1) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

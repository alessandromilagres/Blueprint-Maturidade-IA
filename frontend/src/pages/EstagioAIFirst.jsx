import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Target, 
  Rocket, 
  FileCode, 
  Map, 
  Brain,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Award,
  ArrowRight,
  Loader2,
  Users,
  Package,
  FolderKanban,
  Activity,
  Star,
  AlertCircle,
  TrendingUp,
  Zap,
  ChevronRight
} from 'lucide-react';
import api, { dashboardApi } from '../services/api';
import { nivelNumericoDeScore } from '../utils/nivelMaturidadeRubrica.js';

const ESTAGIOS = [
  { 
    id: 'blueprint', 
    nome: 'Blueprint', 
    nomeFull: 'Blueprint Estratégico',
    icon: Target, 
    cor: 'violet',
    nivel: 'Estratégico',
    descricao: 'Diagnóstico completo de maturidade em IA e definição da estratégia de transformação digital.',
    entregas: ['Avaliação MIT CISR', 'Relatório de Maturidade', 'Gaps Identificados', 'Roadmap Estratégico'],
    metricas: ['Score de Maturidade', 'Nível MIT CISR', 'Áreas Avaliadas', 'Avaliadores Participantes']
  },
  { 
    id: 'playbook', 
    nome: 'Playbook', 
    nomeFull: 'Playbook Atlas',
    icon: Map, 
    cor: 'blue',
    nivel: 'Tático',
    descricao: 'Execução do plano de transformação, capacitação de equipes e implementação de governança.',
    entregas: ['Plano de Ação 90 dias', 'Comitê de IA', 'Políticas de Uso', 'Programa de Capacitação'],
    metricas: ['Ações Executadas', 'Pessoas Capacitadas', 'Políticas Implementadas', 'Quick Wins']
  },
  { 
    id: 'roadmap', 
    nome: 'Roadmap', 
    nomeFull: 'Roadmap AI-First',
    icon: Rocket, 
    cor: 'emerald',
    nivel: 'Tático-Operacional',
    descricao: 'Definição e priorização de produtos de IA com casos de uso e ROI estimado.',
    entregas: ['Catálogo de Produtos', 'Business Cases', 'Priorização por ROI', 'MVPs Definidos'],
    metricas: ['Produtos Mapeados', 'ROI Projetado', 'Time-to-Market', 'Investimento Necessário']
  },
  { 
    id: 'especificacoes', 
    nome: 'Specs', 
    nomeFull: 'Especificações Técnicas',
    icon: FileCode, 
    cor: 'amber',
    nivel: 'Operacional',
    descricao: 'Documentação técnica detalhada para desenvolvimento e implementação dos produtos.',
    entregas: ['PRD Completo', 'Arquitetura Técnica', 'API Contracts', 'Plano de Testes'],
    metricas: ['Docs Gerados', 'Cobertura Funcional', 'Story Points', 'Sprint Planning']
  }
];

const NIVEIS = {
  1: { nome: 'Inicial', icon: '🌱', cor: 'red', desc: 'Explorando IA' },
  2: { nome: 'Oportunista', icon: '🔍', cor: 'orange', desc: 'Experimentando' },
  3: { nome: 'Sistemático', icon: '⚙️', cor: 'yellow', desc: 'Estruturando' },
  4: { nome: 'Diferenciado', icon: '🚀', cor: 'emerald', desc: 'Escalando' },
  5: { nome: 'Transformador', icon: '🏆', cor: 'purple', desc: 'Liderando' }
};

const COR_CONFIG = {
  violet: { bg: 'bg-violet-500', light: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/40', gradient: 'from-violet-600 to-purple-600' },
  blue: { bg: 'bg-blue-500', light: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40', gradient: 'from-blue-600 to-cyan-600' },
  emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', gradient: 'from-emerald-600 to-teal-600' },
  amber: { bg: 'bg-amber-500', light: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', gradient: 'from-amber-600 to-orange-600' },
  red: { bg: 'bg-red-500', light: 'bg-red-500/20', text: 'text-red-400', gradient: 'from-red-500 to-rose-600' },
  orange: { bg: 'bg-orange-500', light: 'bg-orange-500/20', text: 'text-orange-400', gradient: 'from-orange-500 to-amber-600' },
  yellow: { bg: 'bg-yellow-500', light: 'bg-yellow-500/20', text: 'text-yellow-400', gradient: 'from-yellow-500 to-amber-500' },
  purple: { bg: 'bg-purple-500', light: 'bg-purple-500/20', text: 'text-purple-400', gradient: 'from-purple-500 to-indigo-600' }
};

function EstagioAIFirst() {
  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [projetos, setProjetos] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState(null);
  const [data, setData] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDados, setLoadingDados] = useState(false);

  useEffect(() => { carregarEmpresas(); }, []);
  useEffect(() => { if (empresaSelecionada) carregarProjetos(empresaSelecionada); }, [empresaSelecionada]);
  useEffect(() => { if (projetoSelecionado) carregarDados(projetoSelecionado); }, [projetoSelecionado]);

  async function carregarEmpresas() {
    try {
      const res = await api.get('/empresas');
      const arr = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setEmpresas(arr);
      if (arr.length > 0) setEmpresaSelecionada(arr[0].id);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function carregarProjetos(empresaId) {
    try {
      const res = await api.get(`/projetos?empresaId=${empresaId}`);
      const arr = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setProjetos(arr);
      setProjetoSelecionado(null);
      setData(null);
      if (arr.length > 0) setProjetoSelecionado(arr[0].id);
    } catch (e) { console.error(e); setProjetos([]); }
  }

  async function carregarDados(projetoId) {
    setLoadingDados(true);
    try {
      const dashboard = await dashboardApi.projeto(projetoId);
      const prodRes = await api.get(`/produtos?empresaId=${empresaSelecionada}`);
      const prods = Array.isArray(prodRes.data) ? prodRes.data : [];
      setProdutos(prods);
      
      const nivel = nivelNumericoDeScore(dashboard.scoreGeral);
      const estagios = calcularEstagios(dashboard, prods);
      
      setData({
        ...dashboard,
        nivel,
        estagios,
        progresso: Object.values(estagios).reduce((s, e) => s + e.prog, 0) / 4
      });
    } catch (e) { console.error(e); setData(null); }
    finally { setLoadingDados(false); }
  }

  function calcularEstagios(d, prods) {
    const prodsAtivos = prods.filter(p => p?.status !== 'CANCELADO');
    const prodsEspec = prods.filter(p => p?.especificacoes?.length > 0 || p?._count?.especificacoes > 0);
    
    return {
      blueprint: {
        status: d.scoreGeral > 0 ? 'done' : d.avaliacoes?.length > 0 ? 'progress' : 'pending',
        prog: d.scoreGeral > 0 ? 100 : d.avaliacoes?.length > 0 ? 50 : 0,
        info: d.scoreGeral > 0 ? `${d.scoreGeral.toFixed(1)} pts` : 'Pendente'
      },
      playbook: {
        status: d.projeto?.status === 'CONCLUIDO' ? 'done' : d.projeto?.status === 'EM_EXECUCAO' ? 'progress' : 'pending',
        prog: d.projeto?.status === 'CONCLUIDO' ? 100 : d.projeto?.status === 'EM_EXECUCAO' ? 60 : 0,
        info: d.projeto?.status === 'CONCLUIDO' ? 'Executado' : d.projeto?.status === 'EM_EXECUCAO' ? 'Em execução' : 'Pendente'
      },
      roadmap: {
        status: prodsAtivos.length >= 5 ? 'done' : prodsAtivos.length > 0 ? 'progress' : 'pending',
        prog: Math.min(100, (prodsAtivos.length / 5) * 100),
        info: `${prodsAtivos.length} produtos`
      },
      especificacoes: {
        status: prods.length > 0 && prodsEspec.length >= prods.length * 0.8 ? 'done' : prodsEspec.length > 0 ? 'progress' : 'pending',
        prog: prods.length > 0 ? (prodsEspec.length / prods.length) * 100 : 0,
        info: prods.length > 0 ? `${prodsEspec.length}/${prods.length}` : 'Sem produtos'
      }
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (empresas.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhuma empresa</h2>
          <Link to="/empresas" className="text-purple-400 hover:text-purple-300">Cadastrar empresa →</Link>
        </div>
      </div>
    );
  }

  const nivelConfig = data ? NIVEIS[data.nivel] : NIVEIS[1];
  const nivelCor = COR_CONFIG[nivelConfig.cor];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Header Compacto */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Jornada AI-First</h1>
              <p className="text-slate-500 text-xs">Transformação em Inteligência Artificial</p>
            </div>
          </div>
          
          {/* Seletores */}
          <div className="flex gap-2">
            <select
              value={empresaSelecionada || ''}
              onChange={(e) => setEmpresaSelecionada(Number(e.target.value))}
              className="bg-slate-800/80 border border-slate-700 text-sm rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
            <select
              value={projetoSelecionado || ''}
              onChange={(e) => setProjetoSelecionado(Number(e.target.value))}
              className="bg-slate-800/80 border border-slate-700 text-sm rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              disabled={projetos.length === 0}
            >
              {projetos.length === 0 
                ? <option>Sem projetos</option>
                : projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)
              }
            </select>
          </div>
        </div>

        {!projetoSelecionado || projetos.length === 0 ? (
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500/50 mx-auto mb-3" />
            <p className="text-slate-400">Selecione ou crie um projeto</p>
            <Link to="/projetos" className="text-purple-400 text-sm hover:underline mt-2 inline-block">
              Gerenciar projetos →
            </Link>
          </div>
        ) : loadingDados ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : data && (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Coluna Esquerda - Maturidade */}
            <div className="space-y-4">
              {/* Card de Nível */}
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${nivelCor.gradient} p-6`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60 text-xs uppercase tracking-wider">Maturidade IA</span>
                    <span className="text-4xl">{nivelConfig.icon}</span>
                  </div>
                  <div className="text-5xl font-black mb-1">{data.scoreGeral?.toFixed(1) || '0.0'}</div>
                  <div className="text-xl font-semibold text-white/90">Nível {data.nivel} — {nivelConfig.nome}</div>
                  <div className="text-white/60 text-sm mt-1">{nivelConfig.desc}</div>
                  
                  <div className="mt-4 flex items-center gap-4 text-sm text-white/70">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {data.totalAvaliadores || 0} avaliadores
                    </span>
                  </div>
                </div>
              </div>

              {/* Escala de Níveis Mini */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">Escala MIT CISR</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div 
                      key={n}
                      className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                        data.nivel === n 
                          ? `bg-gradient-to-br ${COR_CONFIG[NIVEIS[n].cor].gradient} text-white shadow-lg` 
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {n}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                  <span>Inicial</span>
                  <span>Transformador</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-3">
                  <Package className="w-4 h-4 text-emerald-400 mb-1" />
                  <div className="text-xl font-bold">{produtos.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase">Produtos IA</div>
                </div>
                <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-3">
                  <Activity className="w-4 h-4 text-amber-400 mb-1" />
                  <div className="text-xl font-bold">{Math.round(data.progresso)}%</div>
                  <div className="text-[10px] text-slate-500 uppercase">Progresso</div>
                </div>
              </div>
            </div>

            {/* Coluna Central - Pirâmide Compacta */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <h2 className="font-bold">Pirâmide de Evolução</h2>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3 h-3" /> OK</span>
                    <span className="flex items-center gap-1 text-amber-400"><Clock className="w-3 h-3" /> Em progresso</span>
                    <span className="flex items-center gap-1 text-slate-500"><Circle className="w-3 h-3" /> Pendente</span>
                  </div>
                </div>

                {/* Pirâmide Visual Compacta */}
                <div className="relative py-4">
                  {/* Linhas de conexão */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/50 via-blue-500/50 via-emerald-500/50 to-amber-500/50" />
                  
                  <div className="space-y-3">
                    {ESTAGIOS.map((estagio, idx) => {
                      const Icon = estagio.icon;
                      const status = data.estagios[estagio.id];
                      const cor = COR_CONFIG[estagio.cor];
                      const isDone = status?.status === 'done';
                      const isProgress = status?.status === 'progress';
                      const widths = ['w-[55%]', 'w-[70%]', 'w-[85%]', 'w-full'];
                      
                      return (
                        <div key={estagio.id} className="flex justify-center">
                          <div className={`${widths[idx]} relative`}>
                            <div className={`
                              relative rounded-xl p-3 transition-all
                              ${isDone 
                                ? `bg-gradient-to-r ${cor.gradient} shadow-lg shadow-${estagio.cor}-500/20` 
                                : isProgress 
                                  ? `${cor.light} border border-dashed ${cor.border}` 
                                  : 'bg-slate-800/50 border border-slate-700/50'}
                            `}>
                              {/* Indicador lateral */}
                              <div className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 ${
                                isDone ? 'bg-white border-white' : isProgress ? `${cor.bg} ${cor.border}` : 'bg-slate-700 border-slate-600'
                              }`} />
                              
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isDone ? 'bg-white/20' : cor.light
                                }`}>
                                  <Icon className={`w-4 h-4 ${isDone ? 'text-white' : cor.text}`} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-semibold text-sm ${isDone ? 'text-white' : 'text-white'}`}>
                                      {estagio.nome}
                                    </span>
                                    {isDone && <CheckCircle2 className="w-4 h-4 text-white/80" />}
                                    {isProgress && <Clock className="w-4 h-4 text-amber-400 animate-pulse" />}
                                  </div>
                                  <span className={`text-xs ${isDone ? 'text-white/60' : 'text-slate-500'}`}>
                                    {status?.info}
                                  </span>
                                </div>
                                
                                <div className={`text-right ${isDone ? 'text-white' : cor.text}`}>
                                  <span className="text-xl font-bold">{Math.round(status?.prog || 0)}%</span>
                                </div>
                              </div>
                              
                              {/* Progress bar */}
                              <div className="mt-2 h-1 bg-black/20 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-700 ${
                                    isDone ? 'bg-white/40' : `bg-gradient-to-r ${cor.gradient}`
                                  }`}
                                  style={{ width: `${status?.prog || 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cards de Detalhes */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800">
                  {ESTAGIOS.map(estagio => {
                    const status = data.estagios[estagio.id];
                    const cor = COR_CONFIG[estagio.cor];
                    const Icon = estagio.icon;
                    
                    return (
                      <div key={estagio.id} className={`rounded-lg p-2.5 ${cor.light} border ${cor.border}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className={`w-3.5 h-3.5 ${cor.text}`} />
                          <span className={`text-xs font-medium ${cor.text}`}>{estagio.nome}</span>
                        </div>
                        <div className="text-lg font-bold text-white">{Math.round(status?.prog || 0)}%</div>
                        <div className="text-[10px] text-slate-400">{status?.info}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Link Dashboard */}
                <Link
                  to={`/dashboard/projeto/${projetoSelecionado}`}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-medium transition-all"
                >
                  Ver Dashboard Completo <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Seção de Detalhamento */}
          {data?.estagios && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-lg">Detalhamento dos Estágios</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ESTAGIOS.map(estagio => {
                const Icon = estagio.icon;
                const status = data.estagios?.[estagio.id];
                const cor = COR_CONFIG[estagio.cor];
                const isDone = status?.status === 'done';
                const isProgress = status?.status === 'progress';
                
                return (
                  <div 
                    key={estagio.id}
                    className={`
                      bg-slate-900/50 rounded-2xl border overflow-hidden transition-all hover:border-opacity-60
                      ${isDone ? 'border-emerald-500/40' : isProgress ? 'border-amber-500/40' : 'border-slate-800'}
                    `}
                  >
                    {/* Header do Card */}
                    <div className={`p-4 ${isDone ? `bg-gradient-to-r ${cor.gradient}` : cor.light}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDone ? 'bg-white/20' : cor.light}`}>
                            <Icon className={`w-5 h-5 ${isDone ? 'text-white' : cor.text}`} />
                          </div>
                          <div>
                            <h3 className={`font-bold ${isDone ? 'text-white' : 'text-white'}`}>{estagio.nomeFull}</h3>
                            <span className={`text-xs ${isDone ? 'text-white/60' : 'text-slate-500'}`}>{estagio.nivel}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${isDone ? 'text-white' : cor.text}`}>
                            {Math.round(status?.prog || 0)}%
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                            {isProgress && <Clock className="w-3 h-3 text-amber-400" />}
                            {!isDone && !isProgress && <Circle className="w-3 h-3 text-slate-500" />}
                            <span className={`text-xs ${isDone ? 'text-white/70' : 'text-slate-500'}`}>
                              {isDone ? 'Concluído' : isProgress ? 'Em progresso' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="p-4 space-y-4">
                      {/* Descrição */}
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {estagio.descricao}
                      </p>
                      
                      {/* Entregas */}
                      <div>
                        <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Entregas Principais
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {estagio.entregas.map((entrega, i) => (
                            <span 
                              key={i}
                              className={`text-xs px-2 py-1 rounded-md ${cor.light} ${cor.text} border ${cor.border}`}
                            >
                              {entrega}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Métricas */}
                      <div>
                        <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                          <Activity className="w-3 h-3" /> Métricas de Sucesso
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {estagio.metricas.map((metrica, i) => (
                            <div 
                              key={i}
                              className="flex items-center gap-2 text-xs text-slate-400"
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${cor.bg}`} />
                              {metrica}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status Info */}
                      <div className={`p-3 rounded-lg ${cor.light} border ${cor.border}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">Status Atual</span>
                          <span className={`text-sm font-medium ${cor.text}`}>{status?.info || 'Não iniciado'}</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${cor.gradient}`}
                            style={{ width: `${status?.prog || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}

export default EstagioAIFirst;

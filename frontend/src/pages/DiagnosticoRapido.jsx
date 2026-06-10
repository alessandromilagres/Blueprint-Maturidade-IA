import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Save, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Building2, 
  User, 
  Zap,
  Target,
  BarChart3,
  FileText,
  AlertTriangle,
  Lightbulb,
  Info,
  HelpCircle,
  Database,
  DollarSign,
  Shield,
  Rocket,
  TrendingUp,
  Users,
  Brain,
  Settings
} from 'lucide-react';
import api from '../services/api';

// Configuração visual por dimensão (cores completas para Tailwind JIT)
const DIMENSAO_CONFIG = {
  'Estratégia e Liderança': { 
    icon: Target, 
    emoji: '🎯',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
    badgeText: 'text-blue-700 dark:text-blue-300',
    numberBg: 'from-blue-500 to-blue-600',
    tipBg: 'bg-blue-50 dark:bg-blue-900/20',
    tipBorder: 'border-blue-100 dark:border-blue-800/50',
    tipIcon: 'text-blue-500 dark:text-blue-400',
    tipTitle: 'text-blue-700 dark:text-blue-300',
    tipText: 'text-blue-600 dark:text-blue-400',
    selectedCriteria: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 ring-blue-500',
    btnActive: 'from-blue-500 to-blue-600 ring-blue-300',
    levelText: 'text-blue-600 dark:text-blue-400'
  },
  'Dados e Tecnologia': { 
    icon: Database, 
    emoji: '💾',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/30',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
    badgeText: 'text-purple-700 dark:text-purple-300',
    numberBg: 'from-purple-500 to-purple-600',
    tipBg: 'bg-purple-50 dark:bg-purple-900/20',
    tipBorder: 'border-purple-100 dark:border-purple-800/50',
    tipIcon: 'text-purple-500 dark:text-purple-400',
    tipTitle: 'text-purple-700 dark:text-purple-300',
    tipText: 'text-purple-600 dark:text-purple-400',
    selectedCriteria: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 ring-purple-500',
    btnActive: 'from-purple-500 to-purple-600 ring-purple-300',
    levelText: 'text-purple-600 dark:text-purple-400'
  },
  'Valor de Negócio e ROI': { 
    icon: DollarSign, 
    emoji: '💰',
    badgeBg: 'bg-green-100 dark:bg-green-900/30',
    badgeBorder: 'border-green-200 dark:border-green-800',
    badgeText: 'text-green-700 dark:text-green-300',
    numberBg: 'from-green-500 to-green-600',
    tipBg: 'bg-green-50 dark:bg-green-900/20',
    tipBorder: 'border-green-100 dark:border-green-800/50',
    tipIcon: 'text-green-500 dark:text-green-400',
    tipTitle: 'text-green-700 dark:text-green-300',
    tipText: 'text-green-600 dark:text-green-400',
    selectedCriteria: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 ring-green-500',
    btnActive: 'from-green-500 to-green-600 ring-green-300',
    levelText: 'text-green-600 dark:text-green-400'
  },
  'Governança e Risco': { 
    icon: Shield, 
    emoji: '🛡️',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/30',
    badgeBorder: 'border-orange-200 dark:border-orange-800',
    badgeText: 'text-orange-700 dark:text-orange-300',
    numberBg: 'from-orange-500 to-orange-600',
    tipBg: 'bg-orange-50 dark:bg-orange-900/20',
    tipBorder: 'border-orange-100 dark:border-orange-800/50',
    tipIcon: 'text-orange-500 dark:text-orange-400',
    tipTitle: 'text-orange-700 dark:text-orange-300',
    tipText: 'text-orange-600 dark:text-orange-400',
    selectedCriteria: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 ring-orange-500',
    btnActive: 'from-orange-500 to-orange-600 ring-orange-300',
    levelText: 'text-orange-600 dark:text-orange-400'
  },
  'Prontidão para Mudança': { 
    icon: Rocket, 
    emoji: '🚀',
    badgeBg: 'bg-pink-100 dark:bg-pink-900/30',
    badgeBorder: 'border-pink-200 dark:border-pink-800',
    badgeText: 'text-pink-700 dark:text-pink-300',
    numberBg: 'from-pink-500 to-pink-600',
    tipBg: 'bg-pink-50 dark:bg-pink-900/20',
    tipBorder: 'border-pink-100 dark:border-pink-800/50',
    tipIcon: 'text-pink-500 dark:text-pink-400',
    tipTitle: 'text-pink-700 dark:text-pink-300',
    tipText: 'text-pink-600 dark:text-pink-400',
    selectedCriteria: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 ring-pink-500',
    btnActive: 'from-pink-500 to-pink-600 ring-pink-300',
    levelText: 'text-pink-600 dark:text-pink-400'
  }
};

// Configuração padrão
const DEFAULT_CONFIG = {
  icon: Target,
  emoji: '📋',
  badgeBg: 'bg-gray-100 dark:bg-gray-900/30',
  badgeBorder: 'border-gray-200 dark:border-gray-800',
  badgeText: 'text-gray-700 dark:text-gray-300',
  numberBg: 'from-gray-500 to-gray-600',
  tipBg: 'bg-gray-50 dark:bg-gray-900/20',
  tipBorder: 'border-gray-100 dark:border-gray-800/50',
  tipIcon: 'text-gray-500 dark:text-gray-400',
  tipTitle: 'text-gray-700 dark:text-gray-300',
  tipText: 'text-gray-600 dark:text-gray-400',
  selectedCriteria: 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 ring-gray-500',
  btnActive: 'from-gray-500 to-gray-600 ring-gray-300',
  levelText: 'text-gray-600 dark:text-gray-400'
};

// O que cada pergunta avalia - descrições explicativas
const SIGNIFICADO_PERGUNTAS = {
  // Estratégia e Liderança
  'Estratégia e Liderança': {
    1: 'Avalia se existe uma visão de futuro clara sobre como IA pode impactar o negócio e se ela está sendo comunicada.',
    2: 'Verifica se há um executivo C-level com autoridade real para liderar a transformação por IA.',
    3: 'Mede o grau de integração das iniciativas de IA com o planejamento estratégico e metas da empresa.',
    4: 'Avalia o nível de conhecimento da liderança sobre capacidades, limitações e ética em IA.',
    5: 'Verifica se existem planos concretos e budget para investir em IA nos próximos 12 meses.'
  },
  // Dados e Tecnologia
  'Dados e Tecnologia': {
    1: 'Avalia a qualidade, organização e acessibilidade dos dados que alimentariam modelos de IA.',
    2: 'Verifica se a infraestrutura de cloud está preparada para suportar cargas de trabalho de IA.',
    3: 'Mede a capacidade de integrar soluções de IA aos sistemas e processos existentes via APIs.',
    4: 'Avalia a experiência atual da empresa com tecnologias de IA/ML em produção.',
    5: 'Verifica se os processos de negócio estão documentados e rastreáveis para automação.'
  },
  // Valor de Negócio e ROI
  'Valor de Negócio e ROI': {
    1: 'Avalia a capacidade de identificar casos de uso de IA com potencial de valor mensurável.',
    2: 'Verifica se existe metodologia para calcular ROI de projetos de tecnologia e inovação.',
    3: 'Mede a disposição para investir em projetos com retorno de médio prazo (6-18 meses).',
    4: 'Avalia o histórico e aprendizados de projetos anteriores de transformação digital.',
    5: 'Verifica se existem métricas de negócio claras que poderiam ser impactadas por IA.'
  },
  // Governança e Risco
  'Governança e Risco': {
    1: 'Avalia se existem políticas definidas para uso ético e seguro de IA na organização.',
    2: 'Verifica a consciência sobre riscos específicos de IA (viés, alucinações, vazamento de dados).',
    3: 'Para setores regulados: avalia clareza sobre implicações regulatórias do uso de IA.',
    4: 'Mede os controles para proteger dados sensíveis de ferramentas de IA externas.',
    5: 'Avalia a capacidade de explicar decisões tomadas por sistemas de IA (transparência).'
  },
  // Prontidão para Mudança
  'Prontidão para Mudança': {
    1: 'Avalia a abertura dos colaboradores para adotar novas tecnologias e mudar formas de trabalho.',
    2: 'Verifica como a empresa está endereçando preocupações sobre IA substituir empregos.',
    3: 'Mede a capacidade de formar ou contratar talentos técnicos em IA rapidamente.',
    4: 'Avalia a velocidade de tomada de decisão e implementação de novas iniciativas.',
    5: 'Verifica a disposição para iniciar uma jornada estruturada de IA com apoio externo.'
  }
};

const SETORES = [
  'Tecnologia',
  'Financeiro / Bancos',
  'Seguros',
  'Saúde',
  'Varejo',
  'Indústria',
  'Telecomunicações',
  'Energia',
  'Agronegócio',
  'Educação',
  'Governo / Setor Público',
  'Serviços Profissionais',
  'Outro'
];

const PORTES = [
  'Startup (até 50 funcionários)',
  'Pequena (51-200 funcionários)',
  'Média (201-1000 funcionários)',
  'Grande (1001-5000 funcionários)',
  'Enterprise (5000+ funcionários)'
];

export default function DiagnosticoRapido() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [etapa, setEtapa] = useState(id ? 'questionario' : 'inicio');
  const [diagnostico, setDiagnostico] = useState(null);
  const [dimensoes, setDimensoes] = useState([]);
  const [currentDimensaoIndex, setCurrentDimensaoIndex] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tempoInicio, setTempoInicio] = useState(null);
  
  const [formDados, setFormDados] = useState({
    nomeResponsavel: '',
    emailResponsavel: '',
    cargoResponsavel: '',
    nomeEmpresa: '',
    setorEmpresa: '',
    porteEmpresa: '',
    conduzidoPor: ''
  });

  const perguntasContainerRef = useRef(null);

  useEffect(() => {
    loadDimensoes();
    if (id) {
      loadDiagnostico(id);
    }
  }, [id]);

  async function loadDimensoes() {
    try {
      const data = await api.get('/diagnostico/dimensoes');
      setDimensoes(data);
      return data;
    } catch (error) {
      console.error('Erro ao carregar dimensões:', error);
      return [];
    }
  }

  async function loadDiagnostico(diagnosticoId) {
    setLoading(true);
    try {
      const data = await api.get(`/diagnostico/${diagnosticoId}`);
      setDiagnostico(data);
      
      const respostasMap = {};
      data.respostas.forEach((r) => {
        respostasMap[r.perguntaId] = {
          perguntaId: r.perguntaId,
          pontuacao: r.pontuacao,
          observacoes: r.observacoes || ''
        };
      });
      setRespostas(respostasMap);
      setEtapa('questionario');
      setTempoInicio(new Date());
    } catch (error) {
      console.error('Erro ao carregar diagnóstico:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleIniciar() {
    if (!formDados.nomeResponsavel || !formDados.nomeEmpresa) {
      alert('Por favor, preencha pelo menos seu nome e o nome da empresa.');
      return;
    }

    setLoading(true);
    try {
      // Garantir que dimensões estejam carregadas
      if (dimensoes.length === 0) {
        await loadDimensoes();
      }
      
      const data = await api.post('/diagnostico/iniciar', formDados);
      setDiagnostico(data);
      
      const respostasMap = {};
      data.respostas.forEach((r) => {
        respostasMap[r.perguntaId] = {
          perguntaId: r.perguntaId,
          pontuacao: r.pontuacao,
          observacoes: r.observacoes || ''
        };
      });
      setRespostas(respostasMap);
      setTempoInicio(new Date());
      setEtapa('questionario');
      
      navigate(`/diagnostico-rapido/${data.id}`, { replace: true });
    } catch (error) {
      console.error('Erro ao iniciar diagnóstico:', error);
      alert('Erro ao iniciar diagnóstico. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handlePontuacaoChange(perguntaId, pontuacao) {
    setRespostas((prev) => ({
      ...prev,
      [perguntaId]: {
        ...prev[perguntaId],
        perguntaId,
        pontuacao
      }
    }));
  }

  function handleObservacaoChange(perguntaId, observacoes) {
    setRespostas((prev) => ({
      ...prev,
      [perguntaId]: {
        ...prev[perguntaId],
        perguntaId,
        observacoes
      }
    }));
  }

  async function handleSalvar() {
    if (!diagnostico) return;
    
    setSaving(true);
    try {
      const respostasArray = Object.values(respostas).filter(r => r.pontuacao !== null);
      await api.put(`/diagnostico/${diagnostico.id}/respostas`, { respostas: respostasArray });
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalizar() {
    if (!diagnostico) return;
    
    const todasRespondidas = Object.values(respostas).every(r => r.pontuacao !== null);
    if (!todasRespondidas) {
      alert('Por favor, responda todas as perguntas antes de finalizar.');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/diagnostico/${diagnostico.id}/respostas`, { 
        respostas: Object.values(respostas) 
      });
      
      const duracaoMinutos = tempoInicio 
        ? Math.round((new Date() - tempoInicio) / 60000) 
        : null;
      
      await api.put(`/diagnostico/${diagnostico.id}/finalizar`, { duracaoMinutos });
      
      navigate(`/diagnostico-rapido/${diagnostico.id}/relatorio`);
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      alert('Erro ao finalizar: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  }

  function getProgressoDimensao(dimensaoId) {
    const perguntasDimensao = dimensoes.find(d => d.id === dimensaoId)?.perguntas || [];
    const respondidas = perguntasDimensao.filter(p => respostas[p.id]?.pontuacao !== null).length;
    return { respondidas, total: perguntasDimensao.length };
  }

  function getProgressoGeral() {
    const totalPerguntas = dimensoes.reduce((acc, d) => acc + d.perguntas.length, 0);
    const respondidas = Object.values(respostas).filter(r => r.pontuacao !== null).length;
    return { respondidas, total: totalPerguntas, percentual: totalPerguntas > 0 ? Math.round((respondidas / totalPerguntas) * 100) : 0 };
  }

  function handleNavegacao(direcao) {
    if (direcao === 'proximo' && currentDimensaoIndex < dimensoes.length - 1) {
      setCurrentDimensaoIndex(prev => prev + 1);
      handleSalvar();
    } else if (direcao === 'anterior' && currentDimensaoIndex > 0) {
      setCurrentDimensaoIndex(prev => prev - 1);
    }
    
    if (perguntasContainerRef.current) {
      perguntasContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function formatarCriterios(criterios) {
    if (!criterios) return [];
    return criterios.split('\n').filter(c => c.trim());
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (etapa === 'inicio') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Diagnóstico Rápido de Maturidade em IA
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Avalie o nível de prontidão da sua organização para adoção de Inteligência Artificial em apenas 30 minutos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-blue-500" />
                <span className="font-semibold text-gray-900 dark:text-white">30 minutos</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Questionário objetivo com 25 perguntas essenciais
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-6 h-6 text-purple-500" />
                <span className="font-semibold text-gray-900 dark:text-white">5 Dimensões</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Cobertura das áreas de maior impacto estratégico
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="w-6 h-6 text-green-500" />
                <span className="font-semibold text-gray-900 dark:text-white">Relatório Instantâneo</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Score, gaps e recomendações ao finalizar
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Dados do Respondente
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  value={formDados.nomeResponsavel}
                  onChange={(e) => setFormDados({ ...formDados, nomeResponsavel: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formDados.emailResponsavel}
                  onChange={(e) => setFormDados({ ...formDados, emailResponsavel: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cargo
                </label>
                <input
                  type="text"
                  value={formDados.cargoResponsavel}
                  onChange={(e) => setFormDados({ ...formDados, cargoResponsavel: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Diretor de TI, CTO, Gerente..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={formDados.nomeEmpresa}
                  onChange={(e) => setFormDados({ ...formDados, nomeEmpresa: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome da empresa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Setor
                </label>
                <select
                  value={formDados.setorEmpresa}
                  onChange={(e) => setFormDados({ ...formDados, setorEmpresa: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione o setor</option>
                  {SETORES.map(setor => (
                    <option key={setor} value={setor}>{setor}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Porte
                </label>
                <select
                  value={formDados.porteEmpresa}
                  onChange={(e) => setFormDados({ ...formDados, porteEmpresa: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione o porte</option>
                  {PORTES.map(porte => (
                    <option key={porte} value={porte}>{porte}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Conduzido por (opcional)
                </label>
                <input
                  type="text"
                  value={formDados.conduzidoPor}
                  onChange={(e) => setFormDados({ ...formDados, conduzidoPor: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome do consultor/gerente de relacionamento"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleIniciar}
                disabled={loading}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <Play className="w-5 h-5" />
                Iniciar Diagnóstico
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Este diagnóstico rápido oferece uma visão inicial da maturidade em IA.
              <br />
              Para uma análise completa e detalhada, recomendamos o Assessment Completo com 108 perguntas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const dimensaoAtual = dimensoes[currentDimensaoIndex];
  const progresso = getProgressoGeral();

  if (!dimensaoAtual || dimensoes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando questionário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Diagnóstico Rápido
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {diagnostico?.nomeEmpresa || 'Empresa'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {progresso.respondidas}/{progresso.total} perguntas
                </div>
                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${progresso.percentual}%` }}
                  />
                </div>
              </div>
              
              <button
                onClick={handleSalvar}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {dimensoes.map((dimensao, index) => {
            const prog = getProgressoDimensao(dimensao.id);
            const isAtiva = index === currentDimensaoIndex;
            const isCompleta = prog.respondidas === prog.total;
            
            return (
              <button
                key={dimensao.id}
                onClick={() => {
                  handleSalvar();
                  setCurrentDimensaoIndex(index);
                }}
                className={`
                  flex-shrink-0 px-4 py-3 rounded-xl transition-all text-left
                  ${isAtiva 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{dimensao.icone}</span>
                  <div>
                    <div className="text-sm font-medium whitespace-nowrap">
                      {dimensao.nome}
                    </div>
                    <div className={`text-xs ${isAtiva ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {prog.respondidas}/{prog.total}
                      {isCompleta && <CheckCircle className="w-3 h-3 inline ml-1" />}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {dimensaoAtual && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{dimensaoAtual.icone}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {dimensaoAtual.nome}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {dimensaoAtual.descricao}
                  </p>
                </div>
              </div>
            </div>

            <div ref={perguntasContainerRef} className="p-6 space-y-8 max-h-[60vh] overflow-y-auto">
              {dimensaoAtual.perguntas.map((pergunta, idx) => {
                const resposta = respostas[pergunta.id] || {};
                const criterios = formatarCriterios(pergunta.criterios);
                const config = DIMENSAO_CONFIG[dimensaoAtual.nome] || DEFAULT_CONFIG;
                const significado = SIGNIFICADO_PERGUNTAS[dimensaoAtual.nome]?.[pergunta.numero] || 'Avalia aspectos importantes desta dimensão.';
                
                return (
                  <div key={pergunta.id} className="border-b border-gray-100 dark:border-gray-700 pb-8 last:border-0 last:pb-0">
                    {/* Header da Pergunta com Área e Número */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.badgeBg} border ${config.badgeBorder}`}>
                        <span className="text-lg">{config.emoji}</span>
                        <span className={`text-xs font-semibold ${config.badgeText}`}>
                          {dimensaoAtual.nome}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                          Pergunta {idx + 1} de {dimensaoAtual.perguntas.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${config.numberBg} text-white flex items-center justify-center font-bold shadow-lg`}>
                        {idx + 1}
                      </div>
                      <div className="flex-grow">
                        <p className="text-gray-900 dark:text-white font-medium text-lg mb-3">
                          {pergunta.texto}
                        </p>

                        {/* O que esta pergunta avalia */}
                        <div className={`flex items-start gap-2 mb-4 p-3 rounded-lg ${config.tipBg} border ${config.tipBorder}`}>
                          <Lightbulb className={`w-4 h-4 ${config.tipIcon} mt-0.5 flex-shrink-0`} />
                          <div>
                            <span className={`text-xs font-semibold ${config.tipTitle} uppercase tracking-wide`}>
                              O que esta pergunta avalia
                            </span>
                            <p className={`text-sm ${config.tipText} mt-0.5`}>
                              {significado}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <HelpCircle className="w-3.5 h-3.5" />
                            Critérios de Pontuação
                          </div>
                          <div className="space-y-2">
                            {criterios.map((criterio, i) => (
                              <div 
                                key={i} 
                                className={`
                                  text-sm p-2.5 rounded-lg transition-all cursor-pointer
                                  ${resposta.pontuacao === i + 1 
                                    ? `${config.selectedCriteria} font-medium ring-2` 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                                  }
                                `}
                                onClick={() => handlePontuacaoChange(pergunta.id, i + 1)}
                              >
                                {criterio}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pontuação:</span>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((nota) => (
                              <button
                                key={nota}
                                onClick={() => handlePontuacaoChange(pergunta.id, nota)}
                                className={`
                                  w-11 h-11 rounded-xl font-bold text-lg transition-all
                                  ${resposta.pontuacao === nota
                                    ? `bg-gradient-to-br ${config.btnActive} text-white shadow-lg scale-110 ring-2`
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                                  }
                                `}
                              >
                                {nota}
                              </button>
                            ))}
                          </div>
                          {resposta.pontuacao && (
                            <span className={`ml-2 text-sm font-medium ${config.levelText}`}>
                              {resposta.pontuacao === 1 ? 'Inicial' : 
                               resposta.pontuacao === 2 ? 'Básico' : 
                               resposta.pontuacao === 3 ? 'Intermediário' : 
                               resposta.pontuacao === 4 ? 'Avançado' : 'Otimizado'}
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="text-sm text-gray-500 dark:text-gray-400 block mb-2 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />
                            Observações (opcional)
                          </label>
                          <textarea
                            value={resposta.observacoes || ''}
                            onChange={(e) => handleObservacaoChange(pergunta.id, e.target.value)}
                            placeholder="Adicione contexto ou justificativa para sua resposta..."
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleNavegacao('anterior')}
                  disabled={currentDimensaoIndex === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Anterior
                </button>

                <div className="flex items-center gap-2">
                  {dimensoes.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentDimensaoIndex
                          ? 'bg-blue-600'
                          : index < currentDimensaoIndex
                          ? 'bg-blue-300'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {currentDimensaoIndex === dimensoes.length - 1 ? (
                  <button
                    onClick={handleFinalizar}
                    disabled={saving || progresso.percentual < 100}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {saving ? 'Finalizando...' : 'Finalizar e Ver Relatório'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavegacao('proximo')}
                    className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Próximo
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {progresso.percentual < 100 && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Atenção:</strong> Responda todas as perguntas para gerar o relatório completo. 
              Faltam {progresso.total - progresso.respondidas} perguntas.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

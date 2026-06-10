import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  Save,
  Target,
  AlertTriangle,
  Zap,
  DollarSign,
  Calendar,
  Building2,
  FolderKanban,
  CheckCircle,
  Info,
  TrendingUp,
  Clock,
  FileText,
  GitBranch,
  Paperclip,
  MessageSquare,
  Plug,
  Lock,
  ListOrdered,
  Loader2,
  Trash2,
  Lightbulb
} from 'lucide-react';
import { produtosApi, projetosApi, verticaisApi, arquivosApi, arquiteturasReferenciaApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  podeIniciarCadastroProduto,
  podeDetalhamentoTecnicoProduto,
  podeEditarEtapasIniciais,
  podeFinanceiroCronogramaProduto,
  CATEGORIA_ARQUIVO_FASE1,
  CATEGORIA_ARQUIVO_FASE2
} from '../constants/produtoWorkflow.js';
import { labelTipoArquiteturaReferencia } from '../constants/tiposArquiteturaReferencia';

const STATUS_CONSTRUCAO = [
  { value: 'planejado', label: '📋 Planejado', color: 'bg-gray-500', description: 'Produto em fase de planejamento' },
  { value: 'em_construcao', label: '🔧 Em Construção', color: 'bg-blue-500', description: 'Desenvolvimento em andamento' },
  { value: 'em_teste', label: '🧪 Em Teste', color: 'bg-yellow-500', description: 'Em fase de testes e validação' },
  { value: 'ativo', label: '✅ Ativo', color: 'bg-green-500', description: 'Produto em produção' },
  { value: 'suspenso', label: '⏸️ Suspenso', color: 'bg-red-500', description: 'Temporariamente pausado' },
  { value: 'cancelado', label: '❌ Cancelado', color: 'bg-gray-400', description: 'Projeto cancelado' },
];

const FASES = [
  { value: 'ideia', label: '💡 Ideia', color: 'bg-purple-500', description: 'Conceito inicial' },
  { value: 'mvp', label: '🚀 MVP', color: 'bg-blue-500', description: 'Produto Mínimo Viável' },
  { value: 'piloto', label: '🧪 Piloto', color: 'bg-yellow-500', description: 'Teste com usuários reais' },
  { value: 'producao', label: '✅ Produção', color: 'bg-green-500', description: 'Em uso pleno' },
];

const COMPLEXIDADES = [
  { value: 'baixa', label: '🟢 Baixa', color: 'text-green-600', description: 'Implementação simples' },
  { value: 'media', label: '🟡 Média', color: 'text-yellow-600', description: 'Complexidade moderada' },
  { value: 'alta', label: '🔴 Alta', color: 'text-red-600', description: 'Projeto complexo' },
];

const TECNOLOGIAS_SUGERIDAS = [
  'LLM', 'RAG', 'Computer Vision', 'NLP', 'Machine Learning', 
  'Deep Learning', 'Agentes IA', 'GPT', 'Claude', 'Embeddings',
  'Vector DB', 'Fine-tuning', 'Prompt Engineering', 'OCR', 'Speech-to-Text',
  'Text-to-Speech', 'Sentiment Analysis', 'Chatbot', 'Automação', 'RPA'
];

const MAX_CHARS = 5000;

function modeloSlugParaApi(slug) {
  return slug === 'design-thinking' ? 'design_thinking' : 'convencional';
}

function labelModeloCriacao(apiVal) {
  return apiVal === 'design_thinking' ? 'Design thinking' : 'Convencional';
}

function SectionCard({ icon: Icon, title, description, color, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r ${color}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            {description && <p className="text-sm text-white/80">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 3, maxLength = MAX_CHARS, hint, disabled = false }) {
  const remaining = maxLength - (value?.length || 0);
  const isNearLimit = remaining < 500;
  const isAtLimit = remaining <= 0;
  
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <textarea
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-lg border ${
          isAtLimit 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        rows={rows}
        value={value || ''}
        onChange={(e) => {
          if (e.target.value.length <= maxLength) {
            onChange(e.target.value);
          }
        }}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      <div className="flex justify-between items-center">
        {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
        <p className={`text-xs ml-auto ${
          isAtLimit ? 'text-red-500 font-bold' : isNearLimit ? 'text-yellow-600' : 'text-gray-400'
        }`}>
          {remaining.toLocaleString()} caracteres restantes
        </p>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text', maxLength = MAX_CHARS, hint, required, prefix, suffix }) {
  const isTextInput = type === 'text';
  const remaining = isTextInput ? maxLength - (value?.length || 0) : null;
  const isNearLimit = isTextInput && remaining < 500;
  const isAtLimit = isTextInput && remaining <= 0;
  
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {prefix}
          </span>
        )}
        <input
          type={type}
          className={`w-full px-4 py-3 rounded-lg border ${
            isAtLimit 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-colors ${
            prefix ? 'pl-8' : ''
          } ${suffix ? 'pr-16' : ''}`}
          value={value || ''}
          onChange={(e) => {
            if (isTextInput && e.target.value.length > maxLength) return;
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          required={required}
          maxLength={isTextInput ? maxLength : undefined}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
            {suffix}
          </span>
        )}
      </div>
      <div className="flex justify-between items-center">
        {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
        {isTextInput && (
          <p className={`text-xs ml-auto ${
            isAtLimit ? 'text-red-500 font-bold' : isNearLimit ? 'text-yellow-600' : 'text-gray-400'
          }`}>
            {remaining?.toLocaleString()} caracteres
          </p>
        )}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, required, hint, disabled = false }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        disabled={disabled}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">{placeholder || 'Selecione...'}</option>
        {options.map((opt) => (
          <option key={opt.value || opt.id} value={opt.value || opt.id}>
            {opt.label || opt.nome || `${opt.icone} ${opt.nome}`}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

function TechBadge({ tech, onAdd, selected }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        selected 
          ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/30'
      }`}
    >
      {selected ? '✓ ' : '+ '}{tech}
    </button>
  );
}

export default function ProdutoForm() {
  const { id, modeloCriacao: modeloSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projetoIdParam = searchParams.get('projetoId');
  const { usuario } = useAuth();

  const isEditing = Boolean(id);
  const [modeloCriacaoSalvo, setModeloCriacaoSalvo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projetos, setProjetos] = useState([]);
  const [verticais, setVerticais] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [arquivos, setArquivos] = useState([]);
  const [arquiteturasRef, setArquiteturasRef] = useState([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const fileInputFase1Ref = useRef(null);
  const fileInputFase2Ref = useRef(null);

  const ACCEPT_ANEXOS_PRODUTO =
    '.pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.md,.csv,.json,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods';

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    projetoId: projetoIdParam || '',
    verticalId: '',
    problemaResolve: '',
    publicoAlvo: '',
    tecnologias: '',
    faseAtual: 'ideia',
    complexidade: 'media',
    diferencialCompetitivo: '',
    principaisRiscos: '',
    dependenciasExternas: '',
    metricaPrincipal: '',
    baselineAtual: '',
    metaEsperada: '',
    prazoMeta: '',
    custoHoraHomem: '150',
    produtividadeTradicional: '40',
    produtividadeAgentica: '120',
    custoEstimado: '',
    retornoAnualEsperado: '',
    dataInicioConstrucao: '',
    dataFimConstrucao: '',
    dataAtivacaoProducao: '',
    statusConstrucao: 'planejado',
    observacoesCronograma: '',
    requisitosFuncionais: '',
    fluxosWorkflow: '',
    observacoesGeraisFase1: '',
    requisitosNaoFuncionais: '',
    integracoesApis: '',
    restricoesLimitacoes: '',
    observacoesGeraisFase2: '',
    arquiteturaReferenciaId: ''
  });

  useEffect(() => {
    loadData();
  }, [id, projetoIdParam]);

  useEffect(() => {
    if (isEditing || loading) return;
    const ok =
      modeloSlug === 'convencional' || modeloSlug === 'design-thinking';
    if (!ok) {
      navigate(projetoIdParam ? `/produtos/novo?projetoId=${projetoIdParam}` : '/produtos/novo');
    }
  }, [isEditing, loading, modeloSlug, navigate, projetoIdParam]);

  const empresaIdArquiteturas = projetos.find((p) => p.id === parseInt(formData.projetoId, 10))?.empresaId;

  useEffect(() => {
    if (!empresaIdArquiteturas) {
      setArquiteturasRef([]);
      return;
    }
    let cancelled = false;
    arquiteturasReferenciaApi
      .listar(empresaIdArquiteturas)
      .then((data) => {
        if (!cancelled) setArquiteturasRef(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setArquiteturasRef([]);
      });
    return () => {
      cancelled = true;
    };
  }, [empresaIdArquiteturas]);

  useEffect(() => {
    if (!isEditing && usuario && !podeIniciarCadastroProduto(usuario)) {
      alert('Apenas perfis Negócios, TI, SysMap ou Administrador podem iniciar o cadastro de produto.');
      navigate('/produtos');
    }
  }, [isEditing, usuario, navigate]);

  function parseInformacoes(ia) {
    if (!ia || typeof ia !== 'object') {
      return {
        requisitosFuncionais: '',
        fluxosWorkflow: '',
        observacoesGeraisFase1: '',
        requisitosNaoFuncionais: '',
        integracoesApis: '',
        restricoesLimitacoes: '',
        observacoesGeraisFase2: ''
      };
    }
    return {
      requisitosFuncionais: String(ia.requisitosFuncionais ?? ia.requisitosAdicionais ?? ''),
      fluxosWorkflow: String(ia.fluxosWorkflow ?? ''),
      observacoesGeraisFase1: String(ia.observacoesGeraisFase1 ?? ''),
      requisitosNaoFuncionais: String(ia.requisitosNaoFuncionais ?? ''),
      integracoesApis: String(ia.integracoes ?? ''),
      restricoesLimitacoes: String(ia.restricoes ?? ''),
      observacoesGeraisFase2: String(ia.observacoesGeraisFase2 ?? ia.observacoes ?? '')
    };
  }

  async function loadData() {
    try {
      const [projetosData, verticaisData] = await Promise.all([
        projetosApi.listar(),
        verticaisApi.listar()
      ]);

      setProjetos(projetosData);
      setVerticais(verticaisData);

      if (id) {
        const produto = await produtosApi.buscar(id);
        setModeloCriacaoSalvo(produto.modeloCriacao || 'convencional');
        const inf = parseInformacoes(produto.informacoesAdicionaisEspecificacao);
        try {
          const arq = await arquivosApi.listarPorProduto(id);
          setArquivos(Array.isArray(arq) ? arq : []);
        } catch {
          setArquivos([]);
        }
        setFormData({
          nome: produto.nome || '',
          descricao: produto.descricao || '',
          projetoId: produto.projetoId ? String(produto.projetoId) : '',
          verticalId: produto.verticalId ? String(produto.verticalId) : '',
          problemaResolve: produto.problemaResolve || '',
          publicoAlvo: produto.publicoAlvo || '',
          tecnologias: produto.tecnologias || '',
          faseAtual: produto.faseAtual || 'ideia',
          complexidade: produto.complexidade || 'media',
          diferencialCompetitivo: produto.diferencialCompetitivo || '',
          principaisRiscos: produto.principaisRiscos || '',
          dependenciasExternas: produto.dependenciasExternas || '',
          metricaPrincipal: produto.metricaPrincipal || '',
          baselineAtual: produto.baselineAtual || '',
          metaEsperada: produto.metaEsperada || '',
          prazoMeta: produto.prazoMeta ? produto.prazoMeta.split('T')[0] : '',
          custoHoraHomem: produto.custoHoraHomem || '150',
          produtividadeTradicional: produto.produtividadeTradicional || '40',
          produtividadeAgentica: produto.produtividadeAgentica || '120',
          custoEstimado: produto.custoEstimado || '',
          retornoAnualEsperado: produto.retornoAnualEsperado || '',
          dataInicioConstrucao: produto.dataInicioConstrucao ? produto.dataInicioConstrucao.split('T')[0] : '',
          dataFimConstrucao: produto.dataFimConstrucao ? produto.dataFimConstrucao.split('T')[0] : '',
          dataAtivacaoProducao: produto.dataAtivacaoProducao ? produto.dataAtivacaoProducao.split('T')[0] : '',
          statusConstrucao: produto.statusConstrucao || 'planejado',
          observacoesCronograma: produto.observacoesCronograma || '',
          arquiteturaReferenciaId: produto.arquiteturaReferenciaId
            ? String(produto.arquiteturaReferenciaId)
            : '',
          ...inf
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function buildApiPayload(fd) {
    const {
      requisitosFuncionais,
      fluxosWorkflow,
      observacoesGeraisFase1,
      requisitosNaoFuncionais,
      integracoesApis,
      restricoesLimitacoes,
      observacoesGeraisFase2,
      ...apiFields
    } = fd;
    const out = {
      ...apiFields,
      informacoesAdicionaisEspecificacao: {
        requisitosFuncionais: requisitosFuncionais || null,
        fluxosWorkflow: fluxosWorkflow || null,
        observacoesGeraisFase1: observacoesGeraisFase1 || null,
        requisitosNaoFuncionais: requisitosNaoFuncionais || null,
        integracoes: integracoesApis || null,
        restricoes: restricoesLimitacoes || null,
        observacoesGeraisFase2: observacoesGeraisFase2 || null
      }
    };
    if (out.arquiteturaReferenciaId === '' || out.arquiteturaReferenciaId === undefined) {
      out.arquiteturaReferenciaId = null;
    } else {
      out.arquiteturaReferenciaId = parseInt(String(out.arquiteturaReferenciaId), 10);
    }
    if (!isEditing) {
      out.modeloCriacao =
        modeloSlug === 'design-thinking' ? 'design_thinking' : 'convencional';
    }
    return out;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = buildApiPayload(formData);
      if (isEditing) {
        await produtosApi.atualizar(id, payload);
        navigate('/produtos');
      } else {
        const created = await produtosApi.criar(payload);
        if (modeloSlug === 'design-thinking') {
          navigate(`/produtos/${created.id}/idealizacao`);
        } else {
          navigate(`/produtos/${created.id}/editar`);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert(`Erro ao ${isEditing ? 'atualizar' : 'criar'} produto: ` + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadArquivo(file, categoria) {
    if (!id) {
      alert('Salve o produto (informações básicas e projeto) uma vez para habilitar anexos; em seguida continue o cadastro nesta tela.');
      return;
    }
    const pid = parseInt(id, 10);
    setUploadBusy(true);
    try {
      const b64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const s = reader.result;
          const i = String(s).indexOf(',');
          resolve(i >= 0 ? String(s).slice(i + 1) : s);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await arquivosApi.upload(
        pid,
        { name: file.name, type: file.type || '', base64: b64 },
        categoria,
        ''
      );
      const arq = await arquivosApi.listarPorProduto(pid);
      setArquivos(Array.isArray(arq) ? arq : []);
    } catch (err) {
      alert(err.message || 'Falha no upload');
    } finally {
      setUploadBusy(false);
    }
  }

  function abrirSeletorAnexoFase1() {
    if (!id) {
      alert('Salve o produto (informações básicas e projeto) uma vez para habilitar anexos; em seguida continue o cadastro nesta tela.');
      return;
    }
    if (!podeColabFase1) {
      alert('Sem permissão para anexar nesta etapa (usuário da mesma empresa do projeto ou perfil autorizado).');
      return;
    }
    if (uploadBusy) return;
    fileInputFase1Ref.current?.click();
  }

  function abrirSeletorAnexoFase2() {
    if (!id) {
      alert('Salve o produto uma vez para habilitar anexos.');
      return;
    }
    if (!podeFase2) {
      alert('Anexos da 2ª fase: apenas Administrador, TI ou SysMap (mesma empresa do projeto) podem enviar.');
      return;
    }
    if (uploadBusy) return;
    fileInputFase2Ref.current?.click();
  }

  async function handleExcluirArquivo(arquivoId) {
    if (!confirm('Remover este arquivo?')) return;
    try {
      await arquivosApi.excluir(arquivoId, true);
      if (id) {
        const arq = await arquivosApi.listarPorProduto(id);
        setArquivos(Array.isArray(arq) ? arq : []);
      }
    } catch (err) {
      alert(err.message || 'Erro ao excluir');
    }
  }

  function toggleTech(tech) {
    const current = formData.tecnologias ? formData.tecnologias.split(', ').filter(Boolean) : [];
    if (current.includes(tech)) {
      setFormData({ ...formData, tecnologias: current.filter(t => t !== tech).join(', ') });
    } else {
      setFormData({ ...formData, tecnologias: [...current, tech].join(', ') });
    }
  }

  const selectedTechs = formData.tecnologias ? formData.tecnologias.split(', ').filter(Boolean) : [];

  const selectedProjeto = projetos.find(
    (p) => Number(p.id) === Number(formData.projetoId)
  );
  const empresaIdProjeto = selectedProjeto?.empresaId;
  const podeFase2 = podeDetalhamentoTecnicoProduto(usuario);
  const podeFinanceiroCronograma = podeFinanceiroCronogramaProduto(usuario, empresaIdProjeto);
  const podeColabFase1 = empresaIdProjeto
    ? podeEditarEtapasIniciais(usuario, empresaIdProjeto)
    : podeIniciarCadastroProduto(usuario);

  const WORKFLOW_STEPS = [
    { n: 0, t: 'Informações básicas', d: 'Dados essenciais + prazo', fase: 1 },
    { n: 1, t: 'Requisitos funcionais', d: 'Todos os perfis da empresa', fase: 1 },
    { n: 2, t: 'Fluxos / workflow', d: 'Processos e fluxos do produto', fase: 1 },
    { n: 3, t: 'Arquivos de apoio (1ª fase)', d: 'Anexos iniciais', fase: 1 },
    { n: 4, t: 'Observações gerais (1ª fase)', d: 'Notas para o time', fase: 1 },
    { n: 5, t: 'Detalhamento do produto', d: 'Contexto técnico', fase: 2 },
    { n: 6, t: 'Sucesso (KPIs)', d: 'Indicadores', fase: 2 },
    { n: 7, t: 'Requisitos não funcionais', d: 'Performance, segurança etc.', fase: 2 },
    { n: 8, t: 'Arquivos de apoio (2ª fase)', d: 'Documentação técnica', fase: 2 },
    { n: 9, t: 'Integrações e APIs', d: 'Sistemas externos', fase: 2 },
    { n: 10, t: 'Restrições e limitações', d: 'Premissas e limites', fase: 2 },
    { n: 11, t: 'Observações gerais (2ª fase)', d: 'Comentários finais', fase: 2 },
    { n: 12, t: 'Financeiro e cronograma', d: 'Admin ou SysMap', fase: 2 }
  ];

  const roi = formData.custoEstimado && formData.retornoAnualEsperado 
    ? ((parseFloat(formData.retornoAnualEsperado) / parseFloat(formData.custoEstimado)) * 100).toFixed(0)
    : null;
  
  const payback = formData.custoEstimado && formData.retornoAnualEsperado
    ? Math.ceil(parseFloat(formData.custoEstimado) / (parseFloat(formData.retornoAnualEsperado) / 12))
    : null;

  const modeloBadgeApi = isEditing
    ? modeloCriacaoSalvo
    : modeloSlugParaApi(modeloSlug);
  const voltarNovoHref = projetoIdParam
    ? `/produtos/novo?projetoId=${encodeURIComponent(projetoIdParam)}`
    : '/produtos/novo';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to={isEditing ? '/produtos' : voltarNovoHref}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                  {modeloBadgeApi === 'design_thinking' ? (
                    <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      {isEditing ? 'Editar Produto' : 'Novo Produto IA-First'}
                    </h1>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        modeloBadgeApi === 'design_thinking'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {labelModeloCriacao(modeloBadgeApi)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isEditing
                      ? `Editando: ${formData.nome}`
                      : modeloSlug === 'design-thinking'
                        ? 'Cadastro com foco em idealização (design thinking); depois você irá à Fase A do produto.'
                        : 'Cadastro convencional por etapas; após criar, continue editando neste fluxo.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/produtos"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </Link>
              <button
                onClick={handleSubmit}
                disabled={saving || !formData.nome || !formData.projetoId}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-white mb-3">
            <ListOrdered className="w-4 h-4 text-primary-600" />
            Workflow de cadastro
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Etapas 1–5: todos os usuários da empresa. Etapas 6–12 (detalhamento técnico): Administrador, TI ou SysMap.
            Financeiro e cronograma: apenas Administrador ou SysMap.
          </p>
          <div className="flex flex-wrap gap-2">
            {WORKFLOW_STEPS.map((s) => (
              <button
                key={s.n}
                type="button"
                onClick={() => {
                  setCurrentStep(s.n);
                  const targetId =
                    s.n <= 4
                      ? `wf-step-${s.n}`
                      : s.n === 12
                        ? 'wf-step-12'
                        : s.n === 5
                          ? 'wf-step-5'
                          : s.n === 8
                            ? 'wf-step-8'
                            : 'wf-fase2-tec';
                  document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`text-left text-xs px-2 py-1 rounded border transition-colors ${
                  currentStep === s.n
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary-300'
                }`}
              >
                <span className="font-semibold">{s.n + 1}.</span> {s.t}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          <div id="wf-step-0" className="scroll-mt-28">
          {/* Seção 1: Informações Básicas */}
          <SectionCard 
            icon={Package} 
            title="Informações Básicas" 
            description="Dados essenciais do produto"
            color="from-orange-500 to-orange-600"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <InputField
                  label="Nome do Produto"
                  value={formData.nome}
                  onChange={(val) => setFormData({ ...formData, nome: val })}
                  placeholder="Ex: Assistente Virtual de Atendimento"
                  required
                  hint="Nome claro e descritivo do produto"
                />
              </div>
              
              <div className="lg:col-span-2">
                <TextAreaField
                  label="Descrição"
                  value={formData.descricao}
                  onChange={(val) => setFormData({ ...formData, descricao: val })}
                  placeholder="Descreva o produto, seus objetivos principais e como ele utilizará IA..."
                  rows={4}
                  hint="Uma descrição clara ajuda na avaliação e especificação"
                />
              </div>
              
              <SelectField
                label="Projeto"
                value={formData.projetoId}
                onChange={(val) => setFormData({ ...formData, projetoId: val })}
                options={projetos.map(p => ({
                  value: p.id,
                  label: `${p.nome} (${p.empresa?.nome})`
                }))}
                placeholder="Selecione o projeto"
                required
                hint="O produto será vinculado a este projeto"
              />
              
              <SelectField
                label="Vertical (MIT CISR)"
                value={formData.verticalId}
                onChange={(val) => setFormData({ ...formData, verticalId: val })}
                options={verticais.map(v => ({
                  value: v.id,
                  label: `${v.icone} ${v.nome}`
                }))}
                placeholder="Selecione a vertical"
                hint="Define as perguntas de avaliação específicas"
              />

              <div className="lg:col-span-2">
                <SelectField
                  label="Arquitetura padrão da empresa"
                  value={formData.arquiteturaReferenciaId}
                  onChange={(val) => setFormData({ ...formData, arquiteturaReferenciaId: val })}
                  options={arquiteturasRef
                    .filter((a) => a.ativo)
                    .map((a) => ({
                      value: String(a.id),
                      label: `${a.nome} — ${labelTipoArquiteturaReferencia(a.tipoArquitetura)}`
                    }))}
                  placeholder={
                    !formData.projetoId
                      ? 'Selecione o projeto para listar arquiteturas da empresa'
                      : arquiteturasRef.length === 0
                        ? 'Nenhuma arquitetura cadastrada para esta empresa'
                        : 'Opcional — padrão técnico corporativo aplicável ao produto'
                  }
                  hint="Cadastros → Arquiteturas de referência (mesma empresa do projeto). Qualquer perfil da empresa pode definir neste campo."
                  disabled={!formData.projetoId || !podeColabFase1}
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Prazo para atingir a meta
                </label>
                <input
                  type="date"
                  disabled={!podeColabFase1}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                  value={formData.prazoMeta}
                  onChange={(e) => setFormData({ ...formData, prazoMeta: e.target.value })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Prazo associado à meta do produto (etapa nas informações básicas do workflow).
                </p>
              </div>

              {/* Preview do Projeto Selecionado */}
              {selectedProjeto && (
                <div className="lg:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">{selectedProjeto.empresa?.nome}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{selectedProjeto.nome}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
          </div>

          <div id="wf-step-1" className="scroll-mt-28">
          <SectionCard
            icon={FileText}
            title="Requisitos funcionais"
            description="Comportamentos e funcionalidades esperadas"
            color="from-teal-500 to-teal-600"
          >
            <TextAreaField
              label="Requisitos funcionais"
              value={formData.requisitosFuncionais}
              onChange={(val) => setFormData({ ...formData, requisitosFuncionais: val })}
              placeholder="Liste requisitos funcionais de forma clara e priorizada..."
              rows={6}
              maxLength={20000}
              hint="Separado dos requisitos não funcionais (etapa posterior)."
            />
          </SectionCard>
          </div>

          <div id="wf-step-2" className="scroll-mt-28">
          <SectionCard
            icon={GitBranch}
            title="Fluxos ou workflow do produto"
            description="Jornadas, estados e integração com processos"
            color="from-cyan-500 to-cyan-600"
          >
            <TextAreaField
              label="Fluxos / workflow"
              value={formData.fluxosWorkflow}
              onChange={(val) => setFormData({ ...formData, fluxosWorkflow: val })}
              placeholder="Descreva fluxos principais, estados e handoffs..."
              rows={6}
              maxLength={20000}
            />
          </SectionCard>
          </div>

          <div id="wf-step-3" className="scroll-mt-28">
          <SectionCard
            icon={Paperclip}
            title="Arquivos de apoio (1ª fase)"
            description="Documentos iniciais — use a categoria da primeira fase no upload"
            color="from-slate-500 to-slate-600"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Após salvar o produto uma vez, anexe arquivos aqui. Eles serão marcados como <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{CATEGORIA_ARQUIVO_FASE1}</code> para o workflow.
            </p>
            <input
              ref={fileInputFase1Ref}
              type="file"
              className="sr-only"
              tabIndex={-1}
              accept={ACCEPT_ANEXOS_PRODUTO}
              disabled={!id || uploadBusy || !podeColabFase1}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) handleUploadArquivo(f, CATEGORIA_ARQUIVO_FASE1);
              }}
            />
            <button
              type="button"
              onClick={abrirSeletorAnexoFase1}
              disabled={!id || uploadBusy || !podeColabFase1}
              title={
                !id
                  ? 'Salve o produto antes de anexar'
                  : !podeColabFase1
                    ? 'Sem permissão para anexar'
                    : 'Selecionar arquivo'
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700"
            >
              {uploadBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Anexar arquivo (fase 1)
            </button>
            <ul className="mt-4 space-y-2 text-sm">
              {arquivos
                .filter((a) => a.categoria === CATEGORIA_ARQUIVO_FASE1 || a.categoria === 'geral')
                .map((a) => (
                  <li key={a.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span>
                      {a.nomeOriginal}{' '}
                      <span className="text-xs text-gray-400">({a.categoria})</span>
                    </span>
                    <button type="button" onClick={() => handleExcluirArquivo(a.id)} className="text-red-600" disabled={!podeColabFase1}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              {arquivos.length === 0 && <li className="text-gray-500 dark:text-gray-400">Nenhum anexo ainda.</li>}
            </ul>
          </SectionCard>
          </div>

          <div id="wf-step-4" className="scroll-mt-28">
          <SectionCard
            icon={MessageSquare}
            title="Observações gerais (1ª fase)"
            description="Notas para Administrador, TI ou SysMap"
            color="from-indigo-500 to-indigo-600"
          >
            <TextAreaField
              label="Observações"
              value={formData.observacoesGeraisFase1}
              onChange={(val) => setFormData({ ...formData, observacoesGeraisFase1: val })}
              placeholder="Contexto adicional, dúvidas, dependências de negócio..."
              rows={4}
              maxLength={20000}
            />
          </SectionCard>
          </div>

          <div id="wf-step-5" className="scroll-mt-28">
          <div className={`relative rounded-xl border border-amber-200 dark:border-amber-900/50 ${!podeFase2 ? 'ring-2 ring-amber-300/60' : ''}`}>
            {!podeFase2 && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-10 px-4 bg-white/80 dark:bg-gray-900/85 rounded-xl backdrop-blur-[1px]">
                <div className="max-w-lg text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                  <Lock className="w-8 h-8 mx-auto text-amber-600 mb-2" />
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Etapas de detalhamento técnico
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                    Apenas <strong>Administrador</strong>, <strong>TI</strong> ou <strong>SysMap</strong> (vinculados à empresa) podem editar a partir do detalhamento do produto. Você pode visualizar o conteúdo já salvo.
                  </p>
                </div>
              </div>
            )}

          {/* Seção 2: Detalhamento do Produto */}
          <SectionCard 
            icon={Target} 
            title="Detalhamento do Produto" 
            description="Contexto e especificações técnicas"
            color="from-purple-500 to-purple-600"
          >
            <div className="space-y-6">
              <TextAreaField
                label="Problema que Resolve"
                value={formData.problemaResolve}
                onChange={(val) => setFormData({ ...formData, problemaResolve: val })}
                placeholder="Qual problema de negócio ou dor do cliente este produto resolve? Seja específico sobre o impacto atual e como a IA pode ajudar..."
                rows={4}
                hint="Descreva a dor/problema que motiva a criação deste produto"
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InputField
                  label="Público-Alvo"
                  value={formData.publicoAlvo}
                  onChange={(val) => setFormData({ ...formData, publicoAlvo: val })}
                  placeholder="Ex: Equipe de atendimento ao cliente, Analistas financeiros"
                  hint="Quem usará este produto?"
                />
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tecnologias Utilizadas
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={formData.tecnologias}
                    onChange={(e) => setFormData({ ...formData, tecnologias: e.target.value })}
                    placeholder="Selecione abaixo ou digite..."
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {TECNOLOGIAS_SUGERIDAS.map(tech => (
                      <TechBadge 
                        key={tech} 
                        tech={tech} 
                        onAdd={() => toggleTech(tech)}
                        selected={selectedTechs.includes(tech)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectField
                  label="Fase Atual"
                  value={formData.faseAtual}
                  onChange={(val) => setFormData({ ...formData, faseAtual: val })}
                  options={FASES}
                  hint={FASES.find(f => f.value === formData.faseAtual)?.description}
                />
                
                <SelectField
                  label="Complexidade"
                  value={formData.complexidade}
                  onChange={(val) => setFormData({ ...formData, complexidade: val })}
                  options={COMPLEXIDADES}
                  hint={COMPLEXIDADES.find(c => c.value === formData.complexidade)?.description}
                />
                
                <SelectField
                  label="Status de Construção"
                  value={formData.statusConstrucao}
                  onChange={(val) => setFormData({ ...formData, statusConstrucao: val })}
                  options={STATUS_CONSTRUCAO}
                  hint={STATUS_CONSTRUCAO.find(s => s.value === formData.statusConstrucao)?.description}
                />
              </div>
            </div>
          </SectionCard>

          {/* Seção 3: Diferenciais e Riscos */}
          <SectionCard 
            icon={AlertTriangle} 
            title="Diferenciais e Riscos" 
            description="Análise competitiva e gestão de riscos"
            color="from-yellow-500 to-orange-500"
          >
            <div className="space-y-6">
              <TextAreaField
                label="Diferencial Competitivo"
                value={formData.diferencialCompetitivo}
                onChange={(val) => setFormData({ ...formData, diferencialCompetitivo: val })}
                placeholder="O que torna este produto único no mercado? Quais vantagens competitivas ele oferece?"
                rows={3}
                hint="Destaque o que diferencia seu produto da concorrência"
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TextAreaField
                  label="Principais Riscos"
                  value={formData.principaisRiscos}
                  onChange={(val) => setFormData({ ...formData, principaisRiscos: val })}
                  placeholder="Riscos técnicos, de mercado, regulatórios, de adoção..."
                  rows={4}
                  hint="Identifique riscos para mitigação proativa"
                />
                
                <TextAreaField
                  label="Dependências Externas"
                  value={formData.dependenciasExternas}
                  onChange={(val) => setFormData({ ...formData, dependenciasExternas: val })}
                  placeholder="APIs de terceiros, fornecedores, integrações, dados externos..."
                  rows={4}
                  hint="Liste dependências que podem impactar o projeto"
                />
              </div>
            </div>
          </SectionCard>

          <div id="wf-fase2-tec" className="scroll-mt-28">
          {/* Seção 4: Métricas de Sucesso */}
          <SectionCard 
            icon={Zap} 
            title="Métricas de Sucesso (KPIs)" 
            description="Indicadores para medir o sucesso do produto"
            color="from-green-500 to-emerald-600"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InputField
                label="Métrica Principal"
                value={formData.metricaPrincipal}
                onChange={(val) => setFormData({ ...formData, metricaPrincipal: val })}
                placeholder="Ex: Tempo médio de atendimento, Taxa de conversão, NPS"
                hint="O indicador mais importante de sucesso"
              />
              
              <InputField
                label="Baseline Atual"
                value={formData.baselineAtual}
                onChange={(val) => setFormData({ ...formData, baselineAtual: val })}
                placeholder="Ex: 15 minutos, 2.5%, Score 7.2"
                hint="Valor atual da métrica antes do produto"
              />
              
              <InputField
                label="Meta Esperada"
                value={formData.metaEsperada}
                onChange={(val) => setFormData({ ...formData, metaEsperada: val })}
                placeholder="Ex: 3 minutos, 8%, Score 9.0"
                hint="Valor esperado após implementação"
              />
            </div>
            
            {/* Preview de Melhoria */}
            {formData.baselineAtual && formData.metaEsperada && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">Melhoria esperada:</span>
                  <span>{formData.baselineAtual} → {formData.metaEsperada}</span>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={AlertTriangle}
            title="Requisitos não funcionais"
            description="Performance, segurança, disponibilidade, compliance"
            color="from-violet-500 to-violet-600"
          >
            <TextAreaField
              label="Requisitos não funcionais"
              value={formData.requisitosNaoFuncionais}
              onChange={(val) => setFormData({ ...formData, requisitosNaoFuncionais: val })}
              placeholder="SLAs, volumes, LGPD, auditoria, latência, RTO/RPO..."
              rows={6}
              maxLength={20000}
            />
          </SectionCard>

          </div>

          </div>

          <div id="wf-step-8" className="scroll-mt-28">
          <SectionCard
            icon={Paperclip}
            title="Arquivos de apoio (2ª fase)"
            description="Documentação técnica complementar (fora do bloqueio de tela — o botão respeita o perfil)"
            color="from-slate-600 to-slate-800"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Upload com categoria <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{CATEGORIA_ARQUIVO_FASE2}</code>.
              Perfis de negócio não enviam nesta fase; use a fase 1 ou peça ao TI/SysMap.
            </p>
            <input
              ref={fileInputFase2Ref}
              type="file"
              className="sr-only"
              tabIndex={-1}
              accept={ACCEPT_ANEXOS_PRODUTO}
              disabled={!id || uploadBusy || !podeFase2}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) handleUploadArquivo(f, CATEGORIA_ARQUIVO_FASE2);
              }}
            />
            <button
              type="button"
              onClick={abrirSeletorAnexoFase2}
              disabled={!id || uploadBusy || !podeFase2}
              title={
                !id
                  ? 'Salve o produto antes de anexar'
                  : !podeFase2
                    ? 'Apenas Administrador, TI ou SysMap podem anexar na 2ª fase'
                    : 'Selecionar arquivo'
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700"
            >
              Anexar arquivo (fase 2)
            </button>
            <ul className="mt-4 space-y-2 text-sm">
              {arquivos
                .filter((a) => a.categoria === CATEGORIA_ARQUIVO_FASE2)
                .map((a) => (
                  <li key={a.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <span>{a.nomeOriginal}</span>
                    <button type="button" onClick={() => handleExcluirArquivo(a.id)} className="text-red-600" disabled={!podeFase2}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
            </ul>
          </SectionCard>
          </div>

          <div
            className={`relative rounded-xl border border-amber-200 dark:border-amber-900/50 ${!podeFase2 ? 'ring-2 ring-amber-300/60' : ''}`}
          >
            {!podeFase2 && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-10 px-4 bg-white/80 dark:bg-gray-900/85 rounded-xl backdrop-blur-[1px]">
                <div className="max-w-lg text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 pointer-events-auto">
                  <Lock className="w-8 h-8 mx-auto text-amber-600 mb-2" />
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Integrações, restrições e observações (detalhamento técnico)
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                    Apenas <strong>Administrador</strong>, <strong>TI</strong> ou <strong>SysMap</strong> (vinculados à empresa) podem editar estas etapas. Os anexos da 2ª fase ficam na seção anterior.
                  </p>
                </div>
              </div>
            )}

          <SectionCard
            icon={Plug}
            title="Integrações e APIs"
            description="Sistemas externos e contratos"
            color="from-sky-500 to-sky-600"
          >
            <TextAreaField
              label="Integrações e APIs"
              value={formData.integracoesApis}
              onChange={(val) => setFormData({ ...formData, integracoesApis: val })}
              placeholder="APIs REST, filas, ERP, CRM, autenticação..."
              rows={5}
              maxLength={20000}
            />
          </SectionCard>

          <SectionCard
            icon={Lock}
            title="Restrições e limitações"
            description="Premissas, exclusões e limites"
            color="from-rose-500 to-rose-600"
          >
            <TextAreaField
              label="Restrições e limitações"
              value={formData.restricoesLimitacoes}
              onChange={(val) => setFormData({ ...formData, restricoesLimitacoes: val })}
              placeholder="Orçamento, prazos fixos, tecnologias proibidas, escopo excluído..."
              rows={5}
              maxLength={20000}
            />
          </SectionCard>

          <SectionCard
            icon={MessageSquare}
            title="Observações gerais (2ª fase)"
            description="Comentários finais para o time técnico"
            color="from-fuchsia-500 to-fuchsia-600"
          >
            <TextAreaField
              label="Observações gerais"
              value={formData.observacoesGeraisFase2}
              onChange={(val) => setFormData({ ...formData, observacoesGeraisFase2: val })}
              placeholder="Observações adicionais..."
              rows={4}
              maxLength={20000}
            />
          </SectionCard>

          </div>
          </div>

          <div id="wf-step-12" className="scroll-mt-28">
          <div
            className={`relative rounded-xl border border-amber-200/80 dark:border-amber-900/40 ${
              !podeFinanceiroCronograma ? 'ring-2 ring-amber-300/60' : ''
            }`}
          >
            {!podeFinanceiroCronograma && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-10 px-4 bg-white/80 dark:bg-gray-900/85 rounded-xl backdrop-blur-[1px]">
                <div className="max-w-lg text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                  <Lock className="w-8 h-8 mx-auto text-amber-600 mb-2" />
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Informações financeiras e cronograma
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                    Apenas <strong>Administrador</strong> ou <strong>SysMap</strong> (vinculados à empresa do projeto)
                    podem editar esta etapa. Você pode visualizar os valores já salvos.
                  </p>
                </div>
              </div>
            )}
          {/* Seção 5: Informações Financeiras */}
          <SectionCard 
            icon={DollarSign} 
            title="Informações Financeiras" 
            description="Custos, investimento e retorno esperado"
            color="from-emerald-500 to-teal-600"
          >
            <div className="space-y-6">
              {/* Parâmetros de Produtividade */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Parâmetros de Produtividade (para cálculos)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm text-gray-600 dark:text-gray-400">Custo Hora/Homem</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="number"
                        disabled={!podeFinanceiroCronograma}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        value={formData.custoHoraHomem}
                        onChange={(e) => setFormData({ ...formData, custoHoraHomem: e.target.value })}
                        placeholder="150"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm text-gray-600 dark:text-gray-400">Prod. Tradicional</label>
                    <div className="relative">
                      <input
                        type="number"
                        disabled={!podeFinanceiroCronograma}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-16 disabled:opacity-50 disabled:cursor-not-allowed"
                        value={formData.produtividadeTradicional}
                        onChange={(e) => setFormData({ ...formData, produtividadeTradicional: e.target.value })}
                        placeholder="40"
                        min="1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">SP/mês</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-sm text-gray-600 dark:text-gray-400">Prod. Agêntica</label>
                    <div className="relative">
                      <input
                        type="number"
                        disabled={!podeFinanceiroCronograma}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-16 disabled:opacity-50 disabled:cursor-not-allowed"
                        value={formData.produtividadeAgentica}
                        onChange={(e) => setFormData({ ...formData, produtividadeAgentica: e.target.value })}
                        placeholder="120"
                        min="1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">SP/mês</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Custos e Retorno */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custo Estimado Total
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="number"
                      disabled={!podeFinanceiroCronograma}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      value={formData.custoEstimado}
                      onChange={(e) => setFormData({ ...formData, custoEstimado: e.target.value })}
                      placeholder="150000"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Investimento total para construção</p>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Retorno Anual Esperado
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="number"
                      disabled={!podeFinanceiroCronograma}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      value={formData.retornoAnualEsperado}
                      onChange={(e) => setFormData({ ...formData, retornoAnualEsperado: e.target.value })}
                      placeholder="300000"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Economia ou receita anual gerada</p>
                </div>
              </div>
              
              {/* Preview de ROI */}
              {roi && payback && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm font-medium text-green-100">ROI Projetado</span>
                    </div>
                    <p className="text-4xl font-bold">{roi}%</p>
                    <p className="text-sm text-green-100 mt-1">Retorno sobre investimento</p>
                  </div>
                  
                  <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="text-sm font-medium text-blue-100">Payback</span>
                    </div>
                    <p className="text-4xl font-bold">{payback}</p>
                    <p className="text-sm text-blue-100 mt-1">meses para retorno</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Seção 6: Cronograma */}
          <SectionCard 
            icon={Calendar} 
            title="Cronograma" 
            description="Datas importantes do projeto"
            color="from-blue-500 to-indigo-600"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Início da Construção
                  </label>
                  <input
                    type="date"
                    disabled={!podeFinanceiroCronograma}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formData.dataInicioConstrucao}
                    onChange={(e) => setFormData({ ...formData, dataInicioConstrucao: e.target.value })}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fim da Construção
                  </label>
                  <input
                    type="date"
                    disabled={!podeFinanceiroCronograma}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formData.dataFimConstrucao}
                    onChange={(e) => setFormData({ ...formData, dataFimConstrucao: e.target.value })}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ativação em Produção
                  </label>
                  <input
                    type="date"
                    disabled={!podeFinanceiroCronograma}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={formData.dataAtivacaoProducao}
                    onChange={(e) => setFormData({ ...formData, dataAtivacaoProducao: e.target.value })}
                  />
                </div>
              </div>
              
              {/* Timeline Visual */}
              {(formData.dataInicioConstrucao || formData.dataFimConstrucao || formData.dataAtivacaoProducao) && (
                <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex-1 flex items-center">
                    {formData.dataInicioConstrucao && (
                      <div className="flex-1 text-center">
                        <div className="w-4 h-4 rounded-full bg-blue-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">Início</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(formData.dataInicioConstrucao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {formData.dataFimConstrucao && (
                      <>
                        <div className="flex-1 h-1 bg-blue-300 dark:bg-blue-700" />
                        <div className="flex-1 text-center">
                          <div className="w-4 h-4 rounded-full bg-yellow-500 mx-auto mb-1" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">Fim Construção</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(formData.dataFimConstrucao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </>
                    )}
                    {formData.dataAtivacaoProducao && (
                      <>
                        <div className="flex-1 h-1 bg-green-300 dark:bg-green-700" />
                        <div className="flex-1 text-center">
                          <div className="w-4 h-4 rounded-full bg-green-500 mx-auto mb-1" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">Produção</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(formData.dataAtivacaoProducao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <TextAreaField
                label="Observações do Cronograma"
                value={formData.observacoesCronograma}
                onChange={(val) => setFormData({ ...formData, observacoesCronograma: val })}
                placeholder="Dependências, marcos importantes, riscos de prazo..."
                rows={3}
                hint="Informações adicionais sobre o cronograma"
                disabled={!podeFinanceiroCronograma}
              />
            </div>
          </SectionCard>

          </div>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 pt-4 pb-8 border-t border-gray-200 dark:border-gray-700 -mx-6 px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="text-red-500">*</span> Campos obrigatórios · após criar, você será levado à edição para anexar arquivos.
              </div>
              <div className="flex items-center gap-3">
                <Link 
                  to="/produtos"
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={saving || !formData.nome || !formData.projetoId}
                  className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium shadow-lg"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

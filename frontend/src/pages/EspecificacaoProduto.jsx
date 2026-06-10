import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronRight,
  Edit3,
  Save,
  X,
  ArrowLeft,
  Cpu,
  FileCode,
  Shield,
  Server,
  Briefcase,
  FolderOpen,
  Settings,
  Target,
  Zap,
  AlertTriangle,
  Info,
  Package,
  Building2,
  TrendingUp,
  ChevronUp
} from 'lucide-react';
import api from '../services/api';
import { useActivity } from '../contexts/ActivityContext';
import ArquivosReferencia from '../components/ArquivosReferencia';
import MarkdownRenderer from '../components/MarkdownRenderer';
import ModalSelecaoDocumentos from '../components/ModalSelecaoDocumentos';

// Função para calcular score de completude
function calcularScoreCompletude(produto) {
  if (!produto) return { score: 0, obrigatorios: 0, recomendados: 0, opcionais: 0, faltantes: [] };
  
  const camposObrigatorios = [
    { campo: 'nome', label: 'Nome do Produto' },
    { campo: 'descricao', label: 'Descrição' },
    { campo: 'problemaResolve', label: 'Problema que Resolve' },
    { campo: 'publicoAlvo', label: 'Público-Alvo' },
    { campo: 'tecnologias', label: 'Tecnologias' },
    { campo: 'verticalId', label: 'Vertical' },
  ];
  
  const camposRecomendados = [
    { campo: 'metricaPrincipal', label: 'Métrica Principal (KPI)' },
    { campo: 'baselineAtual', label: 'Baseline Atual' },
    { campo: 'metaEsperada', label: 'Meta Esperada' },
    { campo: 'prazoMeta', label: 'Prazo para Meta' },
    { campo: 'diferencialCompetitivo', label: 'Diferencial Competitivo' },
    { campo: 'principaisRiscos', label: 'Principais Riscos' },
    { campo: 'dependenciasExternas', label: 'Dependências Externas' },
    { campo: 'complexidade', label: 'Complexidade' },
    { campo: 'faseAtual', label: 'Fase Atual' },
  ];
  
  const camposOpcionais = [
    { campo: 'custoEstimado', label: 'Custo Estimado' },
    { campo: 'retornoAnualEsperado', label: 'Retorno Anual' },
    { campo: 'dataInicioConstrucao', label: 'Data Início' },
    { campo: 'dataFimConstrucao', label: 'Data Fim' },
    { campo: 'dataAtivacaoProducao', label: 'Data Produção' },
    { campo: 'observacoesCronograma', label: 'Observações Cronograma' },
  ];
  
  const obrigatoriosPreenchidos = camposObrigatorios.filter(c => produto[c.campo]).length;
  const recomendadosPreenchidos = camposRecomendados.filter(c => produto[c.campo]).length;
  const opcionaisPreenchidos = camposOpcionais.filter(c => produto[c.campo]).length;
  
  const obrigatoriosPercent = (obrigatoriosPreenchidos / camposObrigatorios.length) * 100;
  const recomendadosPercent = (recomendadosPreenchidos / camposRecomendados.length) * 100;
  const opcionaisPercent = (opcionaisPreenchidos / camposOpcionais.length) * 100;
  
  const score = (obrigatoriosPercent * 0.5) + (recomendadosPercent * 0.35) + (opcionaisPercent * 0.15);
  
  const faltantes = {
    obrigatorios: camposObrigatorios.filter(c => !produto[c.campo]).map(c => c.label),
    recomendados: camposRecomendados.filter(c => !produto[c.campo]).map(c => c.label),
    opcionais: camposOpcionais.filter(c => !produto[c.campo]).map(c => c.label),
  };
  
  return {
    score: Math.round(score),
    obrigatorios: Math.round(obrigatoriosPercent),
    recomendados: Math.round(recomendadosPercent),
    opcionais: Math.round(opcionaisPercent),
    faltantes,
    counts: {
      obrigatorios: { preenchidos: obrigatoriosPreenchidos, total: camposObrigatorios.length },
      recomendados: { preenchidos: recomendadosPreenchidos, total: camposRecomendados.length },
      opcionais: { preenchidos: opcionaisPreenchidos, total: camposOpcionais.length },
    }
  };
}

function getScoreConfig(score) {
  if (score >= 95) return { nivel: 'Completo', cor: 'green', emoji: '🟢', mensagem: 'Especificação premium - máxima qualidade' };
  if (score >= 85) return { nivel: 'Muito Bom', cor: 'blue', emoji: '🔵', mensagem: 'Especificação muito completa' };
  if (score >= 70) return { nivel: 'Bom', cor: 'yellow', emoji: '🟡', mensagem: 'Boa completude - especificação detalhada' };
  if (score >= 50) return { nivel: 'Básico', cor: 'orange', emoji: '🟠', mensagem: 'Especificação básica - considere preencher mais campos' };
  return { nivel: 'Insuficiente', cor: 'red', emoji: '🔴', mensagem: 'Preencha os campos obrigatórios para gerar' };
}

// Componente de Painel de Contexto do Produto
function ContextoProdutoPanel({
  produto,
  contextoExpandido,
  setContextoExpandido,
  informacoesAdicionais,
  setInformacoesAdicionais,
  especificacoes,
  onSalvarInformacoesAdicionais,
  salvandoInformacoes,
  mensagemSalvarIA
}) {
  const scoreData = calcularScoreCompletude(produto);
  const scoreConfig = getScoreConfig(scoreData.score);
  const [abaAtiva, setAbaAtiva] = useState('dados');
  
  const formatarValor = (valor) => {
    if (!valor) return <span className="text-gray-400 italic">Não informado</span>;
    return valor;
  };
  
  const formatarMoeda = (valor) => {
    if (!valor) return <span className="text-gray-400 italic">Não informado</span>;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };
  
  const formatarData = (data) => {
    if (!data) return <span className="text-gray-400 italic">Não informada</span>;
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const corScore = {
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-indigo-600',
    yellow: 'from-yellow-500 to-amber-600',
    orange: 'from-orange-500 to-red-500',
    red: 'from-red-500 to-red-700',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
      {/* Header do Painel */}
      <div 
        className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 cursor-pointer hover:from-purple-100 hover:to-blue-100 transition-colors"
        onClick={() => setContextoExpandido(!contextoExpandido)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Contexto do Produto</h2>
              <p className="text-sm text-gray-600">Dados que serão usados para gerar a especificação</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Score Badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${corScore[scoreConfig.cor]} text-white`}>
              <span className="text-lg">{scoreConfig.emoji}</span>
              <span className="font-bold">{scoreData.score}%</span>
              <span className="text-sm opacity-90">{scoreConfig.nivel}</span>
            </div>
            
            {contextoExpandido ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>
      
      {/* Conteúdo Expandido */}
      {contextoExpandido && (
        <div className="p-6">
          {/* Barra de Progresso Detalhada */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Completude para Especificação</span>
              <span className="text-sm text-gray-500">{scoreConfig.mensagem}</span>
            </div>
            
            {/* Barra Principal */}
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div 
                className={`h-full bg-gradient-to-r ${corScore[scoreConfig.cor]} transition-all duration-500`}
                style={{ width: `${scoreData.score}%` }}
              />
            </div>
            
            {/* Detalhes por Categoria */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600">Obrigatórios</span>
                  <span className="font-medium">{scoreData.counts.obrigatorios.preenchidos}/{scoreData.counts.obrigatorios.total}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${scoreData.obrigatorios === 100 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${scoreData.obrigatorios}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600">Recomendados</span>
                  <span className="font-medium">{scoreData.counts.recomendados.preenchidos}/{scoreData.counts.recomendados.total}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500"
                    style={{ width: `${scoreData.recomendados}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-600">Opcionais</span>
                  <span className="font-medium">{scoreData.counts.opcionais.preenchidos}/{scoreData.counts.opcionais.total}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ width: `${scoreData.opcionais}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Campos Faltantes */}
            {scoreData.faltantes.obrigatorios.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Campos obrigatórios faltantes:
                </p>
                <p className="text-sm text-red-600 mt-1">
                  {scoreData.faltantes.obrigatorios.join(', ')}
                </p>
                <Link 
                  to={`/produtos/${produto.id}/editar`}
                  className="inline-flex items-center gap-1 text-sm text-red-700 hover:text-red-800 mt-2 font-medium"
                >
                  <Edit3 className="w-3 h-3" />
                  Completar cadastro do produto
                </Link>
              </div>
            )}
            
            {scoreData.faltantes.obrigatorios.length === 0 && scoreData.faltantes.recomendados.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Campos recomendados para melhor especificação:
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  {scoreData.faltantes.recomendados.slice(0, 5).join(', ')}
                  {scoreData.faltantes.recomendados.length > 5 && ` e mais ${scoreData.faltantes.recomendados.length - 5}...`}
                </p>
              </div>
            )}
          </div>
          
          {/* Abas */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="flex gap-4">
              <button
                onClick={() => setAbaAtiva('dados')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  abaAtiva === 'dados'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Dados do Produto
              </button>
              <button
                onClick={() => setAbaAtiva('adicional')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  abaAtiva === 'adicional'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Edit3 className="w-4 h-4 inline mr-2" />
                Informações Adicionais
              </button>
            </nav>
          </div>
          
          {/* Aba: Dados do Produto */}
          {abaAtiva === 'dados' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna 1: Informações Básicas e Detalhamento */}
              <div className="space-y-4">
                {/* Card: Informações Básicas */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
                    <h3 className="font-medium text-orange-800 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Informações Básicas
                    </h3>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">Nome:</span>
                      <span className="ml-2 font-medium text-gray-900">{formatarValor(produto.nome)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Descrição:</span>
                      <p className="mt-1 text-gray-700">{formatarValor(produto.descricao)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Vertical:</span>
                      <span className="ml-2 text-gray-900">
                        {produto.vertical ? `${produto.vertical.icone} ${produto.vertical.nome}` : <span className="text-gray-400 italic">Não selecionada</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Projeto:</span>
                      <span className="ml-2 text-gray-900">{produto.projeto?.nome || <span className="text-gray-400 italic">N/A</span>}</span>
                    </div>
                  </div>
                </div>
                
                {/* Card: Detalhamento */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
                    <h3 className="font-medium text-purple-800 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Detalhamento
                    </h3>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">Problema que Resolve:</span>
                      <p className="mt-1 text-gray-700">{formatarValor(produto.problemaResolve)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Público-Alvo:</span>
                      <span className="ml-2 text-gray-900">{formatarValor(produto.publicoAlvo)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tecnologias:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {produto.tecnologias ? produto.tecnologias.split(',').map((tech, i) => (
                          <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            {tech.trim()}
                          </span>
                        )) : <span className="text-gray-400 italic">Não informadas</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-gray-500">Fase:</span>
                        <p className="font-medium">{formatarValor(produto.faseAtual)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Complexidade:</span>
                        <p className="font-medium">{formatarValor(produto.complexidade)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <p className="font-medium">{formatarValor(produto.statusConstrucao)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Coluna 2: Métricas, Financeiro, Riscos */}
              <div className="space-y-4">
                {/* Card: Métricas de Sucesso */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                    <h3 className="font-medium text-green-800 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Métricas de Sucesso
                    </h3>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">KPI Principal:</span>
                      <span className="ml-2 text-gray-900">{formatarValor(produto.metricaPrincipal)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-500">Baseline:</span>
                        <p className="font-medium">{formatarValor(produto.baselineAtual)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Meta:</span>
                        <p className="font-medium text-green-600">{formatarValor(produto.metaEsperada)}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Prazo:</span>
                      <span className="ml-2 text-gray-900">{formatarData(produto.prazoMeta)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Card: Financeiro */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                    <h3 className="font-medium text-emerald-800 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Informações Financeiras
                    </h3>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-500">Custo Estimado:</span>
                        <p className="font-medium text-gray-900">{formatarMoeda(produto.custoEstimado)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Retorno Anual:</span>
                        <p className="font-medium text-green-600">{formatarMoeda(produto.retornoAnualEsperado)}</p>
                      </div>
                    </div>
                    {produto.custoEstimado && produto.retornoAnualEsperado && (
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <span className="text-gray-500">ROI:</span>
                          <p className="font-bold text-green-600">
                            {((produto.retornoAnualEsperado / produto.custoEstimado) * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Payback:</span>
                          <p className="font-bold text-blue-600">
                            {Math.ceil(produto.custoEstimado / (produto.retornoAnualEsperado / 12))} meses
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Card: Riscos e Diferenciais */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
                    <h3 className="font-medium text-yellow-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Diferenciais e Riscos
                    </h3>
                  </div>
                  <div className="p-4 space-y-3 text-sm">
                    <div>
                      <span className="text-gray-500">Diferencial Competitivo:</span>
                      <p className="mt-1 text-gray-700">{formatarValor(produto.diferencialCompetitivo)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Principais Riscos:</span>
                      <p className="mt-1 text-gray-700">{formatarValor(produto.principaisRiscos)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Dependências Externas:</span>
                      <p className="mt-1 text-gray-700">{formatarValor(produto.dependenciasExternas)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Aba: Informações Adicionais */}
          {abaAtiva === 'adicional' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Adicione informações complementares que não estão no cadastro do produto. Essas informações serão usadas para enriquecer a especificação gerada.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requisitos funcionais (complemento)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={4}
                    placeholder="Complemente ou refine os requisitos funcionais já cadastrados no produto..."
                    value={informacoesAdicionais.requisitosFuncionais}
                    onChange={(e) => setInformacoesAdicionais({ ...informacoesAdicionais, requisitosFuncionais: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requisitos não funcionais (complemento)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={4}
                    placeholder="SLA, segurança, disponibilidade, volumes, compliance..."
                    value={informacoesAdicionais.requisitosNaoFuncionais}
                    onChange={(e) => setInformacoesAdicionais({ ...informacoesAdicionais, requisitosNaoFuncionais: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Integrações e APIs
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={4}
                    placeholder="Descreva sistemas que devem se integrar, APIs necessárias..."
                    value={informacoesAdicionais.integracoes}
                    onChange={(e) => setInformacoesAdicionais({...informacoesAdicionais, integracoes: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Restrições e Limitações
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={4}
                    placeholder="Restrições técnicas, regulatórias, de prazo, orçamento..."
                    value={informacoesAdicionais.restricoes}
                    onChange={(e) => setInformacoesAdicionais({...informacoesAdicionais, restricoes: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações gerais (2ª fase / especificação)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={4}
                    placeholder="Qualquer informação adicional relevante para a especificação..."
                    value={informacoesAdicionais.observacoesGeraisFase2}
                    onChange={(e) => setInformacoesAdicionais({ ...informacoesAdicionais, observacoesGeraisFase2: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2 border-t border-gray-200">
                {mensagemSalvarIA ? (
                  <span className="text-sm text-emerald-600 font-medium order-2 sm:order-1 sm:mr-auto">{mensagemSalvarIA}</span>
                ) : null}
                <button
                  type="button"
                  disabled={salvandoInformacoes}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSalvarInformacoesAdicionais?.();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {salvandoInformacoes ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar informações adicionais
                </button>
              </div>
            </div>
          )}
          
          {/* Link para editar produto */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Os dados acima são do cadastro do produto.
            </p>
            <Link 
              to={`/produtos/${produto.id}/editar`}
              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              <Edit3 className="w-4 h-4" />
              Editar cadastro do produto
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

const TIPOS_DOCUMENTOS = {
  // Essenciais
  prd: { nome: 'PRD - Product Requirements Document', icone: FileText, cor: 'blue' },
  requisitos_funcionais: { nome: 'Requisitos Funcionais', icone: FileCode, cor: 'green' },
  requisitos_nao_funcionais: { nome: 'Requisitos Não Funcionais', icone: Shield, cor: 'purple' },
  arquitetura: { nome: 'Arquitetura Técnica', icone: Server, cor: 'orange' },
  cronograma: { nome: 'Cronograma e Estimativas', icone: Calendar, cor: 'pink' },
  blueprint: { nome: 'Blueprint de Construção', icone: Briefcase, cor: 'indigo' },
  // Opcionais (Fase 2)
  modelagem_dados: { nome: 'Modelagem de Dados', icone: Server, cor: 'cyan' },
  api_contracts: { nome: 'API Contracts (OpenAPI)', icone: FileCode, cor: 'emerald' },
  casos_teste: { nome: 'Casos de Teste', icone: FileText, cor: 'amber' },
  wireframes: { nome: 'Wireframes e Fluxos de Tela', icone: FileText, cor: 'sky' },
  glossario: { nome: 'Glossário do Domínio', icone: FileText, cor: 'violet' },
  riscos: { nome: 'Riscos e Mitigações', icone: Shield, cor: 'red' },
  plano_deploy: { nome: 'Plano de Deploy', icone: Server, cor: 'teal' }
};

export default function EspecificacaoProduto() {
  const { id: produtoId } = useParams();
  const navigate = useNavigate();
  const activityCtx = useActivity();
  const setPresenceAction = activityCtx?.setPresenceAction;

  const [produto, setProduto] = useState(null);
  const [especificacoes, setEspecificacoes] = useState([]);
  const [especificacaoAtual, setEspecificacaoAtual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [statusGeracao, setStatusGeracao] = useState(null);
  const [documentoExpandido, setDocumentoExpandido] = useState(null);
  const [editando, setEditando] = useState(null);
  const [conteudoEditado, setConteudoEditado] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [arquivosCount, setArquivosCount] = useState(0);
  const [exportando, setExportando] = useState(null);
  const [modalSelecaoAberto, setModalSelecaoAberto] = useState(false);
  const [contextoExpandido, setContextoExpandido] = useState(true);
  const [informacoesAdicionais, setInformacoesAdicionais] = useState({
    requisitosFuncionais: '',
    requisitosNaoFuncionais: '',
    integracoes: '',
    restricoes: '',
    observacoesGeraisFase2: ''
  });
  const [salvandoInformacoes, setSalvandoInformacoes] = useState(false);
  const [mensagemSalvarIA, setMensagemSalvarIA] = useState('');

  // Função para exportar com autenticação
  const exportarEspecificacao = async (formato) => {
    if (!especificacaoAtual) return;
    
    try {
      setExportando(formato);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/especificacoes/${especificacaoAtual.id}/exportar/${formato}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        throw new Error('Erro ao exportar');
      }
      
      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `especificacao_v${especificacaoAtual.versao}`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      } else {
        const extensoes = { html: '.html', md: '.md', json: '.json', docx: '.docx' };
        filename += extensoes[formato] || '';
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar documento');
    } finally {
      setExportando(null);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [produtoId]);

  useEffect(() => {
    let interval;
    if (statusGeracao && statusGeracao.status === 'gerando') {
      interval = setInterval(verificarStatusGeracao, 3000);
    }
    return () => clearInterval(interval);
  }, [statusGeracao]);

  useEffect(() => {
    if (!setPresenceAction) return;
    if (gerando && statusGeracao) {
      const p = statusGeracao.progresso ?? 0;
      const etapa = statusGeracao.etapaResumo || statusGeracao.documentoAtualTitulo;
      setPresenceAction(etapa ? `IA: ${etapa} (${p}%)` : `Gerando especificação (${p}%)`);
    } else {
      setPresenceAction(null);
    }
    return () => setPresenceAction(null);
  }, [gerando, statusGeracao, setPresenceAction]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [produtoData, especificacoesData] = await Promise.all([
        api.get(`/produtos/${produtoId}`),
        api.get(`/especificacoes/produto/${produtoId}`)
      ]);
      
      setProduto(produtoData);
      const ia = produtoData.informacoesAdicionaisEspecificacao;
      if (ia && typeof ia === 'object' && !Array.isArray(ia)) {
        setInformacoesAdicionais({
          requisitosFuncionais: String(ia.requisitosFuncionais ?? ia.requisitosAdicionais ?? ''),
          requisitosNaoFuncionais: String(ia.requisitosNaoFuncionais ?? ''),
          integracoes: String(ia.integracoes ?? ''),
          restricoes: String(ia.restricoes ?? ''),
          observacoesGeraisFase2: String(ia.observacoesGeraisFase2 ?? ia.observacoes ?? '')
        });
      } else {
        setInformacoesAdicionais({
          requisitosFuncionais: '',
          requisitosNaoFuncionais: '',
          integracoes: '',
          restricoes: '',
          observacoesGeraisFase2: ''
        });
      }
      setEspecificacoes(especificacoesData || []);
      
      if (especificacoesData && especificacoesData.length > 0) {
        setEspecificacaoAtual(especificacoesData[0]);
        if (especificacoesData[0].documentos?.length > 0) {
          setDocumentoExpandido(especificacoesData[0].documentos[0].tipo);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarInformacoesAdicionais = async () => {
    try {
      setSalvandoInformacoes(true);
      setMensagemSalvarIA('');
      await api.put(`/produtos/${produtoId}`, {
        informacoesAdicionaisEspecificacao: {
          requisitosFuncionais: informacoesAdicionais.requisitosFuncionais,
          requisitosNaoFuncionais: informacoesAdicionais.requisitosNaoFuncionais,
          integracoes: informacoesAdicionais.integracoes,
          restricoes: informacoesAdicionais.restricoes,
          observacoesGeraisFase2: informacoesAdicionais.observacoesGeraisFase2
        }
      });
      setMensagemSalvarIA('Informações salvas com sucesso.');
      setTimeout(() => setMensagemSalvarIA(''), 5000);
      await carregarDados();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Erro ao salvar informações adicionais');
    } finally {
      setSalvandoInformacoes(false);
    }
  };

  const abrirModalSelecao = () => {
    setModalSelecaoAberto(true);
  };

  const iniciarGeracao = async (tiposSelecionados = null) => {
    try {
      setModalSelecaoAberto(false);
      setGerando(true);
      
      const response = await api.post(`/especificacoes/gerar/${produtoId}`, {
        tiposSelecionados,
        informacoesAdicionais: {
          requisitosFuncionais: informacoesAdicionais.requisitosFuncionais,
          requisitosNaoFuncionais: informacoesAdicionais.requisitosNaoFuncionais,
          integracoes: informacoesAdicionais.integracoes,
          restricoes: informacoesAdicionais.restricoes,
          observacoesGeraisFase2: informacoesAdicionais.observacoesGeraisFase2
        }
      });
      
      setStatusGeracao({
        id: response.especificacaoId,
        status: 'gerando',
        versao: response.versao,
        tiposSelecionados: response.tiposSelecionados,
        totalDocumentos: response.totalDocumentos,
        tempoEstimado: response.tempoEstimado
      });
    } catch (error) {
      console.error('Erro ao iniciar geração:', error);
      alert(error.message || 'Erro ao iniciar geração');
      setGerando(false);
    }
  };

  const verificarStatusGeracao = async () => {
    if (!statusGeracao?.id) return;
    
    try {
      const response = await api.get(`/especificacoes/${statusGeracao.id}/status`);
      
      if (response.status !== 'gerando') {
        setStatusGeracao(null);
        setGerando(false);
        carregarDados();
      } else {
        setStatusGeracao(prev => ({ ...prev, ...response }));
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const regenerarDocumento = async (tipo) => {
    if (!confirm(`Deseja regenerar o documento "${TIPOS_DOCUMENTOS[tipo]?.nome}"? O conteúdo atual será substituído.`)) {
      return;
    }
    
    try {
      setGerando(true);
      await api.post(`/especificacoes/gerar-documento/${produtoId}`, {
        tipo,
        especificacaoId: especificacaoAtual?.id
      });
      carregarDados();
    } catch (error) {
      console.error('Erro ao regenerar documento:', error);
      alert('Erro ao regenerar documento');
    } finally {
      setGerando(false);
    }
  };

  const iniciarEdicao = (doc) => {
    setEditando(doc.id);
    setConteudoEditado(doc.conteudo);
  };

  const salvarEdicao = async (docId) => {
    try {
      setSalvando(true);
      await api.put(`/especificacoes/documento/${docId}`, {
        conteudo: conteudoEditado
      });
      setEditando(null);
      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar documento');
    } finally {
      setSalvando(false);
    }
  };

  const aprovarEspecificacao = async () => {
    if (!confirm('Deseja aprovar esta especificação? Isso indica que ela está pronta para uso.')) {
      return;
    }
    
    try {
      await api.put(`/especificacoes/${especificacaoAtual.id}/aprovar`);
      carregarDados();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      alert('Erro ao aprovar especificação');
    }
  };

  const formatarCusto = (valor) => {
    if (!valor) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link 
          to={`/produtos/${produtoId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para o produto
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Especificação Automática
            </h1>
            <p className="text-gray-600 mt-1">
              {produto?.nome} - Geração de documentação técnica com IA
            </p>
          </div>
          
          <button
            onClick={abrirModalSelecao}
            disabled={gerando}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 shadow-lg"
          >
            {gerando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {especificacoes.length > 0 ? 'Gerar Nova Versão' : 'Gerar Especificação'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Painel de Contexto do Produto */}
      {produto && (
        <ContextoProdutoPanel 
          produto={produto}
          contextoExpandido={contextoExpandido}
          setContextoExpandido={setContextoExpandido}
          informacoesAdicionais={informacoesAdicionais}
          setInformacoesAdicionais={setInformacoesAdicionais}
          especificacoes={especificacoes}
          onSalvarInformacoesAdicionais={salvarInformacoesAdicionais}
          salvandoInformacoes={salvandoInformacoes}
          mensagemSalvarIA={mensagemSalvarIA}
        />
      )}

      {/* Status de Geração com Progresso Visual */}
      {gerando && statusGeracao && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-600">
                  {statusGeracao.progresso || 0}%
                </span>
              </div>
              <Loader2 className="w-6 h-6 animate-spin text-purple-600 absolute -bottom-1 -right-1" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-purple-900 text-lg">
                Gerando especificação v{statusGeracao.versao}...
              </p>
              {statusGeracao.totalDocumentos && (
                <p className="text-xs text-purple-600 mt-0.5">
                  {statusGeracao.totalDocumentos} documento(s) selecionado(s)
                  {statusGeracao.tempoEstimado && ` • Tempo estimado: ${statusGeracao.tempoEstimado}`}
                </p>
              )}
              {(statusGeracao.etapaResumo || statusGeracao.documentoAtualTitulo) && (
                <p className="text-sm text-purple-800 mt-1">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  <span className="font-medium">
                    {statusGeracao.etapaResumo || `Processando: ${statusGeracao.documentoAtualTitulo}`}
                  </span>
                </p>
              )}
              
              {/* Barra de Progresso */}
              <div className="mt-3 bg-purple-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-purple-600 h-full transition-all duration-500 ease-out"
                  style={{ width: `${statusGeracao.progresso || 0}%` }}
                />
              </div>
              
              {/* Lista de Documentos com Status */}
              <div className="mt-4 grid grid-cols-5 gap-2">
                {statusGeracao.documentos?.map((doc) => (
                  <div 
                    key={doc.tipo}
                    className={`text-xs p-2 rounded flex items-center gap-1 ${
                      doc.status === 'concluido' ? 'bg-green-100 text-green-700' :
                      doc.status === 'gerando' ? 'bg-purple-200 text-purple-700 animate-pulse' :
                      doc.status === 'erro' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {doc.status === 'concluido' && <CheckCircle className="w-3 h-3" />}
                    {doc.status === 'gerando' && <Loader2 className="w-3 h-3 animate-spin" />}
                    {doc.status === 'erro' && <AlertCircle className="w-3 h-3" />}
                    {doc.status === 'pendente' && <Clock className="w-3 h-3" />}
                    <span className="truncate">{TIPOS_DOCUMENTOS[doc.tipo]?.nome?.split(' - ')[0] || doc.tipo}</span>
                  </div>
                ))}
              </div>
              
              {arquivosCount > 0 && (
                <p className="text-xs text-purple-600 mt-3">
                  <FolderOpen className="w-3 h-3 inline mr-1" />
                  Utilizando {arquivosCount} arquivo(s) de referência como contexto
                </p>
              )}
              <p className="text-xs text-purple-600/90 mt-3">
                Você pode sair desta página; a geração continua no servidor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Arquivos de Referência */}
      <ArquivosReferencia 
        produtoId={parseInt(produtoId)} 
        onArquivosChange={(arquivos) => setArquivosCount(arquivos?.length || 0)}
      />

      {/* Sem especificações */}
      {!gerando && especificacoes.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Cpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma especificação gerada
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Clique no botão acima para gerar automaticamente toda a documentação técnica 
            do produto usando Inteligência Artificial.
            {arquivosCount > 0 && (
              <span className="block mt-2 text-blue-600">
                {arquivosCount} arquivo(s) de referência serão usados para enriquecer a especificação.
              </span>
            )}
          </p>
          <div className="text-left max-w-md mx-auto bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Documentos que serão gerados:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {Object.entries(TIPOS_DOCUMENTOS).map(([key, value]) => (
                <li key={key} className="flex items-center gap-2">
                  <value.icone className="w-4 h-4 text-gray-400" />
                  {value.nome}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Especificação Atual */}
      {especificacaoAtual && (
        <div className="space-y-6">
          {/* Story Points Card */}
          {especificacaoAtual.storyPointsTotais && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm">Esforço Total Estimado</p>
                  <p className="text-3xl font-bold">{especificacaoAtual.storyPointsTotais} Story Points</p>
                </div>
                <Sparkles className="w-10 h-10 text-indigo-200" />
              </div>
            </div>
          )}

          {/* Comparativo: Tradicional vs Agêntico */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card Tradicional */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Desenvolvimento Tradicional</h3>
                  <p className="text-xs text-gray-500">{especificacaoAtual.produtividadeTradicional || 40} SP/mês/dev</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Horas</p>
                  <p className="text-lg font-bold text-gray-900">
                    {especificacaoAtual.horasTradicional?.toLocaleString() || 'N/A'}h
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Custo</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatarCusto(especificacaoAtual.custoTradicional)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Prazo</p>
                  <p className="text-lg font-bold text-gray-900">
                    {especificacaoAtual.prazoTradicional || 'N/A'} sem
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Equipe</p>
                  <p className="text-lg font-bold text-gray-900">
                    {especificacaoAtual.equipeTradicional || 'N/A'} devs
                  </p>
                </div>
              </div>
            </div>

            {/* Card Agêntico */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm border-2 border-purple-300 p-5 relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                Recomendado
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">Fábrica Agêntica (com IA)</h3>
                  <p className="text-xs text-purple-600">{especificacaoAtual.produtividadeAgentica || 120} SP/mês/dev</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-purple-600">Horas</p>
                  <p className="text-lg font-bold text-purple-900">
                    {especificacaoAtual.horasAgentica?.toLocaleString() || 'N/A'}h
                  </p>
                  {especificacaoAtual.horasTradicional && especificacaoAtual.horasAgentica && (
                    <span className="text-xs text-green-600">
                      -{Math.round((1 - especificacaoAtual.horasAgentica / especificacaoAtual.horasTradicional) * 100)}%
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-purple-600">Custo</p>
                  <p className="text-lg font-bold text-purple-900">
                    {formatarCusto(especificacaoAtual.custoAgentica)}
                  </p>
                  {especificacaoAtual.custoTradicional && especificacaoAtual.custoAgentica && (
                    <span className="text-xs text-green-600">
                      -{Math.round((1 - especificacaoAtual.custoAgentica / especificacaoAtual.custoTradicional) * 100)}%
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-purple-600">Prazo</p>
                  <p className="text-lg font-bold text-purple-900">
                    {especificacaoAtual.prazoAgentica || 'N/A'} sem
                  </p>
                  {especificacaoAtual.prazoTradicional && especificacaoAtual.prazoAgentica && (
                    <span className="text-xs text-green-600">
                      -{Math.round((1 - especificacaoAtual.prazoAgentica / especificacaoAtual.prazoTradicional) * 100)}%
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-purple-600">Equipe</p>
                  <p className="text-lg font-bold text-purple-900">
                    {especificacaoAtual.equipeAgentica || 'N/A'} devs
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cards de Métricas Extras */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Cpu className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Modelo IA</p>
                  <p className="text-sm font-bold text-gray-900">
                    {especificacaoAtual.modeloIA || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tokens Usados</p>
                  <p className="text-sm font-bold text-gray-900">
                    {especificacaoAtual.tokensUsados?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tempo Geração</p>
                  <p className="text-sm font-bold text-gray-900">
                    {especificacaoAtual.tempoGeracao ? `${Math.round(especificacaoAtual.tempoGeracao / 60)}min` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Equipe</p>
                  <p className="text-xl font-bold text-gray-900">
                    {especificacaoAtual.tamanhoEquipe || 'N/A'} pessoas
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info da Especificação */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  especificacaoAtual.status === 'aprovado' 
                    ? 'bg-green-100 text-green-800'
                    : especificacaoAtual.status === 'concluido'
                    ? 'bg-blue-100 text-blue-800'
                    : especificacaoAtual.status === 'erro'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {especificacaoAtual.status === 'aprovado' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                  {especificacaoAtual.status === 'erro' && <AlertCircle className="w-4 h-4 inline mr-1" />}
                  {especificacaoAtual.status.charAt(0).toUpperCase() + especificacaoAtual.status.slice(1)}
                </span>
                <span className="text-sm text-gray-500">
                  Versão {especificacaoAtual.versao}
                </span>
                <span className="text-sm text-gray-500">
                  Gerada em {new Date(especificacaoAtual.createdAt).toLocaleDateString('pt-BR')}
                </span>
                {especificacaoAtual.tempoGeracao && (
                  <span className="text-sm text-gray-400">
                    ({especificacaoAtual.tempoGeracao}s para gerar)
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Export buttons */}
                <div className="flex items-center gap-1 border-r pr-3 mr-2">
                  <button
                    onClick={() => exportarEspecificacao('html')}
                    disabled={exportando}
                    className="inline-flex items-center gap-1 px-2 py-1 text-gray-500 hover:bg-gray-100 rounded text-xs disabled:opacity-50"
                    title="Exportar HTML"
                  >
                    {exportando === 'html' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    HTML
                  </button>
                  <button
                    onClick={() => exportarEspecificacao('md')}
                    disabled={exportando}
                    className="inline-flex items-center gap-1 px-2 py-1 text-gray-500 hover:bg-gray-100 rounded text-xs disabled:opacity-50"
                    title="Exportar Markdown"
                  >
                    {exportando === 'md' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    MD
                  </button>
                  <button
                    onClick={() => exportarEspecificacao('docx')}
                    disabled={exportando}
                    className="inline-flex items-center gap-1 px-2 py-1 text-gray-500 hover:bg-gray-100 rounded text-xs disabled:opacity-50"
                    title="Exportar Word"
                  >
                    {exportando === 'docx' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    Word
                  </button>
                  <button
                    onClick={() => exportarEspecificacao('json')}
                    disabled={exportando}
                    className="inline-flex items-center gap-1 px-2 py-1 text-gray-500 hover:bg-gray-100 rounded text-xs disabled:opacity-50"
                    title="Exportar JSON"
                  >
                    {exportando === 'json' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    JSON
                  </button>
                </div>
                
                {especificacaoAtual.status === 'concluido' && (
                  <button
                    onClick={aprovarEspecificacao}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Documentos */}
          <div className="bg-white rounded-lg shadow-sm border divide-y">
            {especificacaoAtual.documentos?.map((doc) => {
              const tipoInfo = TIPOS_DOCUMENTOS[doc.tipo] || { nome: doc.tipo, icone: FileText, cor: 'gray' };
              const IconComponent = tipoInfo.icone;
              const isExpanded = documentoExpandido === doc.tipo;
              const isEditing = editando === doc.id;
              
              return (
                <div key={doc.id} className="divide-y">
                  {/* Header do documento */}
                  <div 
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}
                    onClick={() => setDocumentoExpandido(isExpanded ? null : doc.tipo)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                        <div className={`p-2 rounded-lg bg-${tipoInfo.cor}-100`}>
                          <IconComponent className={`w-5 h-5 text-${tipoInfo.cor}-600`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{tipoInfo.nome}</h4>
                          {doc.editadoManualmente && (
                            <span className="text-xs text-orange-600">Editado manualmente</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => regenerarDocumento(doc.tipo)}
                          disabled={gerando}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="Regenerar documento"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDocumentoExpandido(doc.tipo);
                            iniciarEdicao(doc);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar documento"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Conteúdo do documento */}
                  {isExpanded && (
                    <div className="p-6 bg-gray-50">
                      {isEditing ? (
                        <div className="space-y-4">
                          <textarea
                            value={conteudoEditado}
                            onChange={(e) => setConteudoEditado(e.target.value)}
                            className="w-full h-[500px] p-4 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditando(null)}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              <X className="w-4 h-4 inline mr-1" />
                              Cancelar
                            </button>
                            <button
                              onClick={() => salvarEdicao(doc.id)}
                              disabled={salvando}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              {salvando ? (
                                <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 inline mr-1" />
                              )}
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {doc.status === 'erro' && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <p className="text-sm text-red-800">
                                Falha ao gerar este documento. Tente novamente ou edite manualmente.
                              </p>
                              <button
                                type="button"
                                onClick={() => regenerarDocumento(doc.tipo)}
                                disabled={gerando}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 shrink-0"
                              >
                                <RefreshCw className="w-4 h-4" />
                                Tentar novamente
                              </button>
                            </div>
                          )}
                          <MarkdownRenderer 
                            content={doc.conteudo}
                            className="markdown-content"
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Histórico de Versões */}
          {especificacoes.length > 1 && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-medium text-gray-900 mb-3">Histórico de Versões</h3>
              <div className="space-y-2">
                {especificacoes.map((esp) => (
                  <button
                    key={esp.id}
                    onClick={() => {
                      setEspecificacaoAtual(esp);
                      setDocumentoExpandido(esp.documentos?.[0]?.tipo || null);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      especificacaoAtual?.id === esp.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Versão {esp.versao}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        esp.status === 'aprovado' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {esp.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(esp.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Seleção de Documentos */}
      <ModalSelecaoDocumentos
        isOpen={modalSelecaoAberto}
        onClose={() => setModalSelecaoAberto(false)}
        onConfirm={iniciarGeracao}
        loading={gerando}
      />
    </div>
  );
}


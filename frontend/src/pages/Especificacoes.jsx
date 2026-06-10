import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Download,
  ChevronDown,
  ChevronRight,
  Eye,
  Building2,
  FolderKanban,
  Package,
  Filter,
  Search,
  FileCode,
  Shield,
  Server,
  Briefcase
} from 'lucide-react';
import api from '../services/api';

const TIPOS_DOCUMENTOS = {
  prd: { nome: 'PRD - Product Requirements Document', icone: FileText, cor: 'blue' },
  requisitos_funcionais: { nome: 'Requisitos Funcionais', icone: FileCode, cor: 'green' },
  requisitos_nao_funcionais: { nome: 'Requisitos Não Funcionais', icone: Shield, cor: 'purple' },
  arquitetura: { nome: 'Arquitetura Técnica', icone: Server, cor: 'orange' },
  cronograma: { nome: 'Cronograma e Estimativas', icone: Calendar, cor: 'pink' },
  blueprint: { nome: 'Blueprint de Construção', icone: Briefcase, cor: 'indigo' }
};

const STATUS_CONFIG = {
  gerando: { label: 'Gerando', cor: 'yellow', icone: Loader2 },
  concluido: { label: 'Concluído', cor: 'blue', icone: CheckCircle },
  aprovado: { label: 'Aprovado', cor: 'green', icone: CheckCircle },
  erro: { label: 'Erro', cor: 'red', icone: AlertCircle }
};

export default function Especificacoes() {
  const [especificacoes, setEspecificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroProjeto, setFiltroProjeto] = useState('');
  const [filtroProduto, setFiltroProduto] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');
  const [expandido, setExpandido] = useState(null);
  const [documentoExpandido, setDocumentoExpandido] = useState(null);

  useEffect(() => {
    carregarEspecificacoes();
  }, []);

  const carregarEspecificacoes = async () => {
    try {
      setLoading(true);
      const data = await api.get('/especificacoes');
      setEspecificacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar especificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const empresas = [...new Set(especificacoes.map(e => e.produto?.projeto?.empresa?.nome).filter(Boolean))];
  const projetos = [...new Set(especificacoes.map(e => e.produto?.projeto?.nome).filter(Boolean))];
  const produtos = [...new Set(especificacoes.map(e => e.produto?.nome).filter(Boolean))];

  const especificacoesFiltradas = especificacoes.filter(esp => {
    if (filtroEmpresa && esp.produto?.projeto?.empresa?.nome !== filtroEmpresa) return false;
    if (filtroProjeto && esp.produto?.projeto?.nome !== filtroProjeto) return false;
    if (filtroProduto && esp.produto?.nome !== filtroProduto) return false;
    if (filtroStatus && esp.status !== filtroStatus) return false;
    if (busca) {
      const termoBusca = busca.toLowerCase();
      const match = 
        esp.produto?.nome?.toLowerCase().includes(termoBusca) ||
        esp.produto?.projeto?.nome?.toLowerCase().includes(termoBusca) ||
        esp.produto?.projeto?.empresa?.nome?.toLowerCase().includes(termoBusca);
      if (!match) return false;
    }
    return true;
  });

  const especificacoesPorProduto = especificacoesFiltradas.reduce((acc, esp) => {
    const produtoId = esp.produto?.id;
    if (!produtoId) return acc;
    if (!acc[produtoId]) {
      acc[produtoId] = {
        produto: esp.produto,
        especificacoes: []
      };
    }
    acc[produtoId].especificacoes.push(esp);
    return acc;
  }, {});

  const formatarCusto = (valor) => {
    if (!valor) return 'N/A';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const formatarData = (data) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Especificações de Produtos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Documentação técnica gerada com IA
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-purple-600">{especificacoes.length}</p>
          <p className="text-sm text-gray-500">especificações geradas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="input"
          >
            <option value="">Todas as empresas</option>
            {empresas.map(emp => (
              <option key={emp} value={emp}>{emp}</option>
            ))}
          </select>
          <select
            value={filtroProjeto}
            onChange={(e) => setFiltroProjeto(e.target.value)}
            className="input"
          >
            <option value="">Todos os projetos</option>
            {projetos.map(proj => (
              <option key={proj} value={proj}>{proj}</option>
            ))}
          </select>
          <select
            value={filtroProduto}
            onChange={(e) => setFiltroProduto(e.target.value)}
            className="input"
          >
            <option value="">Todos os produtos</option>
            {produtos.map(prod => (
              <option key={prod} value={prod}>{prod}</option>
            ))}
          </select>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="input"
          >
            <option value="">Todos os status</option>
            <option value="gerando">Gerando</option>
            <option value="concluido">Concluído</option>
            <option value="aprovado">Aprovado</option>
            <option value="erro">Erro</option>
          </select>
        </div>
      </div>

      {/* Sem especificações */}
      {especificacoes.length === 0 && (
        <div className="card text-center py-12">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhuma especificação gerada
          </h3>
          <p className="text-gray-500 mb-4">
            Acesse um produto e clique em "Gerar Especificação" para começar.
          </p>
          <Link to="/produtos" className="btn btn-primary inline-flex items-center gap-2">
            <Package className="w-4 h-4" />
            Ver Produtos
          </Link>
        </div>
      )}

      {/* Lista de especificações por produto */}
      {Object.values(especificacoesPorProduto).length > 0 && (
        <div className="space-y-4">
          {Object.values(especificacoesPorProduto).map(({ produto, especificacoes: especs }) => (
            <div key={produto.id} className="card overflow-hidden">
              {/* Header do Produto */}
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-4 -mt-4 px-4 py-4 border-b dark:border-gray-700"
                onClick={() => setExpandido(expandido === produto.id ? null : produto.id)}
              >
                <div className="flex items-center gap-4">
                  <button className="p-1">
                    {expandido === produto.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {produto.nome}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Building2 className="w-3 h-3" />
                      <span>{produto.projeto?.empresa?.nome}</span>
                      <span className="text-gray-300">•</span>
                      <FolderKanban className="w-3 h-3" />
                      <span>{produto.projeto?.nome}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {especs.length} versão(ões)
                  </span>
                  <Link
                    to={`/produtos/${produto.id}/especificacao`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn btn-sm bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver/Editar
                  </Link>
                </div>
              </div>

              {/* Lista de versões */}
              {expandido === produto.id && (
                <div className="mt-4 space-y-4">
                  {especs.map((esp) => {
                    const statusConfig = STATUS_CONFIG[esp.status] || STATUS_CONFIG.concluido;
                    const StatusIcon = statusConfig.icone;
                    
                    return (
                      <div 
                        key={esp.id} 
                        className="border dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        {/* Header da versão */}
                        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${statusConfig.cor}-100 text-${statusConfig.cor}-800 dark:bg-${statusConfig.cor}-900/50 dark:text-${statusConfig.cor}-300`}>
                              <StatusIcon className={`w-3 h-3 ${esp.status === 'gerando' ? 'animate-spin' : ''}`} />
                              {statusConfig.label}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              Versão {esp.versao}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatarData(esp.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={`/api/especificacoes/${esp.id}/exportar/html`}
                              target="_blank"
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                              title="Exportar HTML"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </div>

                        {/* Métricas */}
                        <div className="px-4 py-3 grid grid-cols-4 gap-4 border-b dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <div>
                              <p className="text-xs text-gray-500">Horas</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {esp.horasEstimadas?.toLocaleString() || 'N/A'}h
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <div>
                              <p className="text-xs text-gray-500">Custo</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {formatarCusto(esp.custoDesenvolvimento)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-500" />
                            <div>
                              <p className="text-xs text-gray-500">Prazo</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {esp.prazoSemanas || 'N/A'} semanas
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-500">Equipe</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {esp.tamanhoEquipe || 'N/A'} pessoas
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Documentos */}
                        <div className="px-4 py-3">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Documentos ({esp.documentos?.length || 0})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {esp.documentos?.map((doc) => {
                              const tipoInfo = TIPOS_DOCUMENTOS[doc.tipo] || { 
                                nome: doc.tipo, 
                                icone: FileText, 
                                cor: 'gray' 
                              };
                              const IconDoc = tipoInfo.icone;
                              const isDocExpandido = documentoExpandido === `${esp.id}-${doc.tipo}`;
                              
                              return (
                                <div key={doc.id}>
                                  <button
                                    onClick={() => setDocumentoExpandido(isDocExpandido ? null : `${esp.id}-${doc.tipo}`)}
                                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                                      isDocExpandido 
                                        ? 'bg-purple-100 dark:bg-purple-900/50 border-2 border-purple-400' 
                                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    <IconDoc className={`w-4 h-4 text-${tipoInfo.cor}-500`} />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                                      {tipoInfo.nome.split(' - ')[0]}
                                    </span>
                                    {doc.editadoManualmente && (
                                      <span className="text-xs text-orange-500">✏️</span>
                                    )}
                                    {isDocExpandido ? (
                                      <ChevronDown className="w-3 h-3 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-gray-400" />
                                    )}
                                  </button>
                                  
                                  {isDocExpandido && (
                                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700 max-h-96 overflow-y-auto">
                                      <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                                        {doc.conteudo}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nenhum resultado com filtros */}
      {especificacoes.length > 0 && especificacoesFiltradas.length === 0 && (
        <div className="card text-center py-8">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma especificação encontrada com os filtros selecionados.</p>
          <button
            onClick={() => {
              setFiltroEmpresa('');
              setFiltroProjeto('');
              setFiltroProduto('');
              setFiltroStatus('');
              setBusca('');
            }}
            className="text-purple-600 hover:underline mt-2"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}

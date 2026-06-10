import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, FolderKanban, ClipboardCheck, Pencil, Trash2,
  Wallet, Brain, GraduationCap, Scale, Heart, ShoppingCart, Factory, Sprout, Code,
  BarChart3, Building2, Truck, Car
} from 'lucide-react';
import { projetosApi, empresasApi } from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const VERTICAIS = [
  { id: 'fintech', nome: 'Tecnologia Financeira (FinTech)', descricao: 'Pagamentos, investimentos, empréstimos e compliance', icon: Wallet, color: 'text-green-500' },
  { id: 'aifirst', nome: 'Inteligência Artificial (AI First)', descricao: 'Agentes de IA verticais para automação profunda', icon: Brain, color: 'text-purple-500' },
  { id: 'edtech', nome: 'Tecnologia Educacional (EdTech)', descricao: 'Aprendizado online, treinamentos e desenvolvimento', icon: GraduationCap, color: 'text-blue-500' },
  { id: 'legaltech', nome: 'Legal Tech', descricao: 'Gestão jurídica, e-discovery e automação de contratos', icon: Scale, color: 'text-slate-600' },
  { id: 'saude', nome: 'Saúde e Bem-Estar', descricao: 'Monitoramento, fitness, medicina alternativa e telessaúde', icon: Heart, color: 'text-red-500' },
  { id: 'ecommerce', nome: 'E-commerce e Varejo', descricao: 'Plataformas especializadas para lojistas online', icon: ShoppingCart, color: 'text-orange-500' },
  { id: 'manufatura', nome: 'Manufatura e Indústria', descricao: 'Automação de produção, cadeia de suprimentos e qualidade', icon: Factory, color: 'text-slate-500' },
  { id: 'agrovert', nome: 'Agricultura Vertical e Sustentabilidade', descricao: 'Produção de alimentos em ambientes controlados', icon: Sprout, color: 'text-emerald-500' },
  { id: 'tecnologia', nome: 'Tecnologia (Software e Consultoria)', descricao: 'Desenvolvimento de software e consultoria em TI', icon: Code, color: 'text-cyan-500' },
  { id: 'servicos', nome: 'Serviços Profissionais', descricao: 'BPO, Contact Center, Atendimento, Facilities e Serviços Gerais', icon: Building2, color: 'text-indigo-500' },
  { id: 'logistica', nome: 'Logística e Supply Chain', descricao: 'Transporte, Armazenagem, Distribuição, Last Mile e Gestão de Estoque', icon: Truck, color: 'text-amber-600' },
  { id: 'mobilidade', nome: 'Mobilidade e Smart Cities', descricao: 'Estacionamentos, Transporte Urbano, Gestão de Tráfego, Frotas e Infraestrutura', icon: Car, color: 'text-sky-500' },
];

const AUDIENCIAS_PRIMARIAS = [
  { id: 'time_executivo', nome: 'Time Executivo' },
  { id: 'board', nome: 'Board' },
  { id: 'lideres_operacao', nome: 'Líderes de Operação' },
  { id: 'lideres_produto', nome: 'Líderes de Produto' },
  { id: 'lideres_financeiros', nome: 'Líderes Financeiros' },
];

const LENTES_PRIORITARIAS = [
  { id: 'aumento_receita', nome: 'Aumento da receita' },
  { id: 'reducao_custos', nome: 'Redução de custos' },
  { id: 'operacoes', nome: 'Operações' },
  { id: 'suporte_cliente', nome: 'Suporte ao cliente' },
  { id: 'produtividade_vendas', nome: 'Produtividade de vendas' },
  { id: 'trabalho_intelectual', nome: 'Trabalho intelectual' },
  { id: 'risco_conformidade', nome: 'Risco e conformidade' },
  { id: 'entrega_produtos', nome: 'Entrega de produtos' },
];

export { VERTICAIS, AUDIENCIAS_PRIMARIAS, LENTES_PRIORITARIAS };

export default function Projetos() {
  const [projetos, setProjetos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProjeto, setEditingProjeto] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    vertical: '',
    audienciaPrimaria: [],
    lentesPrioritarias: [],
    faturamentoAnualProjeto: '',
    status: 'ativo',
    empresaId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [projetosData, empresasData] = await Promise.all([
        projetosApi.listar(),
        empresasApi.listar(),
      ]);
      setProjetos(projetosData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(projeto = null) {
    if (projeto) {
      setEditingProjeto(projeto);
      setFormData({
        nome: projeto.nome || '',
        descricao: projeto.descricao || '',
        vertical: projeto.vertical ?? '',
        audienciaPrimaria: projeto.audienciaPrimaria ? JSON.parse(projeto.audienciaPrimaria) : [],
        lentesPrioritarias: projeto.lentesPrioritarias ? JSON.parse(projeto.lentesPrioritarias) : [],
        faturamentoAnualProjeto:
          projeto.faturamentoAnualProjeto != null && projeto.faturamentoAnualProjeto !== ''
            ? String(projeto.faturamentoAnualProjeto)
            : '',
        status: projeto.status || 'ativo',
        empresaId: projeto.empresaId?.toString() || '',
      });
    } else {
      setEditingProjeto(null);
      setFormData({
        nome: '',
        descricao: '',
        vertical: '',
        audienciaPrimaria: [],
        lentesPrioritarias: [],
        faturamentoAnualProjeto: '',
        status: 'ativo',
        empresaId: empresas[0]?.id?.toString() || '',
      });
    }
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = { 
        ...formData, 
        empresaId: parseInt(formData.empresaId),
        vertical: formData.vertical || null,
        audienciaPrimaria: formData.audienciaPrimaria.length > 0 ? JSON.stringify(formData.audienciaPrimaria) : null,
        lentesPrioritarias: formData.lentesPrioritarias.length > 0 ? JSON.stringify(formData.lentesPrioritarias) : null,
        faturamentoAnualProjeto:
          formData.faturamentoAnualProjeto === '' || formData.faturamentoAnualProjeto == null
            ? null
            : parseFloat(String(formData.faturamentoAnualProjeto).replace(',', '.')),
      };
      if (editingProjeto) {
        await projetosApi.atualizar(editingProjeto.id, data);
      } else {
        await projetosApi.criar(data);
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      alert('Erro ao salvar projeto: ' + error.message);
    }
  }

  async function handleDelete(projeto) {
    if (confirm(`Deseja excluir o projeto "${projeto.nome}"?`)) {
      try {
        await projetosApi.excluir(projeto.id);
        loadData();
      } catch (error) {
        alert('Erro ao excluir projeto: ' + error.message);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projetos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie os projetos de avaliação</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/dashboard/projetos-ranking" 
            className="btn btn-secondary flex items-center gap-2"
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard Ranking
          </Link>
          <button 
            onClick={() => openModal()} 
            className="btn btn-primary flex items-center gap-2"
            disabled={empresas.length === 0}
          >
            <Plus className="w-5 h-5" />
            Novo Projeto
          </button>
        </div>
      </div>

      {empresas.length === 0 ? (
        <div className="card text-center py-12">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Cadastre uma empresa primeiro</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Para criar projetos, você precisa ter empresas cadastradas</p>
          <Link to="/empresas" className="btn btn-primary">
            Ir para Empresas
          </Link>
        </div>
      ) : projetos.length === 0 ? (
        <div className="card text-center py-12">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum projeto cadastrado</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Comece cadastrando seu primeiro projeto</p>
          <button onClick={() => openModal()} className="btn btn-primary">
            Cadastrar Projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projetos.map((projeto) => (
            <div key={projeto.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg">
                    <FolderKanban className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <Link to={`/projetos/${projeto.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                      {projeto.nome}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{projeto.empresa.nome}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openModal(projeto)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(projeto)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {projeto.descricao && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{projeto.descricao}</p>
              )}

              {projeto.vertical && (
                <div className="mb-3">
                  {(() => {
                    const verticalInfo = VERTICAIS.find(v => v.id === projeto.vertical);
                    if (verticalInfo) {
                      const IconComponent = verticalInfo.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${verticalInfo.color}`}>
                          <IconComponent className="w-3 h-3" />
                          {verticalInfo.nome}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              <div className="flex items-center justify-between">
                <StatusBadge status={projeto.status} />
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <ClipboardCheck className="w-4 h-4" />
                  <span>{projeto._count.avaliacoes} avaliações</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProjeto ? 'Editar Projeto' : 'Novo Projeto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Empresa *</label>
            <select
              className="input"
              value={formData.empresaId}
              onChange={(e) => setFormData({ ...formData, empresaId: e.target.value })}
              required
            >
              <option value="">Selecione uma empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Nome do Projeto *</label>
            <input
              type="text"
              className="input"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Descrição</label>
            <textarea
              className="input"
              rows={3}
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o objetivo do projeto..."
            />
          </div>

          <div>
            <label className="label">Faturamento anual do projeto (organização)</label>
            <input
              type="number"
              min={0}
              step={1000}
              className="input"
              placeholder="Ex: 5000000 (R$ no ano, para calibrar ROI nos relatórios)"
              value={formData.faturamentoAnualProjeto}
              onChange={(e) => setFormData({ ...formData, faturamentoAnualProjeto: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Valor em R$ referente ao escopo do projeto em 12 meses. Define o percentual-base aplicado nas projeções de ROI em relatórios e dashboards.
            </p>
          </div>

          <div>
            <label className="label">Vertical / Setor</label>
            <select
              className="input"
              value={formData.vertical || ''}
              onChange={(e) => setFormData({ ...formData, vertical: e.target.value || null })}
            >
              <option value="">Selecione a vertical (opcional)</option>
              {VERTICAIS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              A vertical influencia as recomendações específicas do relatório
            </p>
          </div>

          <div>
            <label className="label">Audiência Primária</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {AUDIENCIAS_PRIMARIAS.map((audiencia) => (
                <label key={audiencia.id} className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.audienciaPrimaria.includes(audiencia.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, audienciaPrimaria: [...formData.audienciaPrimaria, audiencia.id] });
                      } else {
                        setFormData({ ...formData, audienciaPrimaria: formData.audienciaPrimaria.filter(a => a !== audiencia.id) });
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{audiencia.nome}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selecione os públicos-alvo do projeto
            </p>
          </div>

          <div>
            <label className="label">Lentes Prioritárias</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {LENTES_PRIORITARIAS.map((lente) => (
                <label key={lente.id} className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.lentesPrioritarias.includes(lente.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, lentesPrioritarias: [...formData.lentesPrioritarias, lente.id] });
                      } else {
                        setFormData({ ...formData, lentesPrioritarias: formData.lentesPrioritarias.filter(l => l !== lente.id) });
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{lente.nome}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selecione as áreas de foco prioritárias
            </p>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {editingProjeto ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

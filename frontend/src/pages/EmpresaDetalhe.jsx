import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, Users, FolderKanban, Plus, Pencil, Trash2, ArrowLeft, BarChart3, Globe } from 'lucide-react';
import { empresasApi, usuariosApi, projetosApi, avaliacoesApi } from '../services/api';
import Modal from '../components/Modal';
import { VERTICAIS, AUDIENCIAS_PRIMARIAS, LENTES_PRIORITARIAS } from './Projetos';
import { OPCOES_PERFIL_USUARIO, labelPerfilUsuario } from '../constants/perfilUsuario.js';
import { labelPorteComFaixa } from '../constants/porteEmpresa';

export default function EmpresaDetalhe() {
  const { id } = useParams();
  const [empresa, setEmpresa] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadEmpresa();
  }, [id]);

  async function loadEmpresa() {
    try {
      const [empresaData, avaliacoesData] = await Promise.all([
        empresasApi.buscar(id),
        avaliacoesApi.listar(null, id)
      ]);
      setEmpresa(empresaData);
      setAvaliacoes(avaliacoesData);
    } catch (error) {
      console.error('Erro ao carregar empresa:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(type, item = null) {
    setModalType(type);
    setEditingItem(item);
    
    if (type === 'usuario') {
      setFormData({
        nome: item?.nome || '',
        email: item?.email || '',
        cargo: item?.cargo || '',
        telefone: item?.telefone || '',
        empresaId: parseInt(id),
        role: item?.role || 'avaliador',
        ativo: item?.ativo !== false,
      });
    } else if (type === 'projeto') {
      setFormData({
        nome: item?.nome || '',
        descricao: item?.descricao || '',
        vertical: item?.vertical || '',
        audienciaPrimaria: item?.audienciaPrimaria ? JSON.parse(item.audienciaPrimaria) : [],
        lentesPrioritarias: item?.lentesPrioritarias ? JSON.parse(item.lentesPrioritarias) : [],
        faturamentoAnualProjeto:
          item?.faturamentoAnualProjeto != null && item?.faturamentoAnualProjeto !== ''
            ? String(item.faturamentoAnualProjeto)
            : '',
        status: item?.status || 'ativo',
        empresaId: parseInt(id),
      });
    }
  }

  async function handleSubmitUsuario(e) {
    e.preventDefault();
    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        cargo: formData.cargo || null,
        telefone: formData.telefone || null,
        empresaId: formData.empresaId,
        role: formData.role || 'avaliador',
      };
      if (editingItem) {
        await usuariosApi.atualizar(editingItem.id, { ...payload, ativo: formData.ativo !== false });
      } else {
        await usuariosApi.criar(payload);
      }
      setModalType(null);
      loadEmpresa();
    } catch (error) {
      alert('Erro ao salvar usuário: ' + error.message);
    }
  }

  async function handleSubmitProjeto(e) {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        vertical: formData.vertical || null,
        audienciaPrimaria: formData.audienciaPrimaria?.length > 0 ? JSON.stringify(formData.audienciaPrimaria) : null,
        lentesPrioritarias: formData.lentesPrioritarias?.length > 0 ? JSON.stringify(formData.lentesPrioritarias) : null,
        faturamentoAnualProjeto:
          formData.faturamentoAnualProjeto === '' || formData.faturamentoAnualProjeto == null
            ? null
            : parseFloat(String(formData.faturamentoAnualProjeto).replace(',', '.')),
      };
      if (editingItem) {
        await projetosApi.atualizar(editingItem.id, data);
      } else {
        await projetosApi.criar(data);
      }
      setModalType(null);
      loadEmpresa();
    } catch (error) {
      alert('Erro ao salvar projeto: ' + error.message);
    }
  }

  async function handleDeleteUsuario(usuario) {
    if (confirm(`Deseja excluir o usuário "${usuario.nome}"?`)) {
      try {
        await usuariosApi.excluir(usuario.id);
        loadEmpresa();
      } catch (error) {
        alert('Erro ao excluir usuário: ' + error.message);
      }
    }
  }

  async function handleDeleteProjeto(projeto) {
    if (confirm(`Deseja excluir o projeto "${projeto.nome}"?`)) {
      try {
        await projetosApi.excluir(projeto.id);
        loadEmpresa();
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

  if (!empresa) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Empresa não encontrada</h2>
        <Link to="/empresas" className="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
          Voltar para empresas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/empresas" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-xl">
            <Building2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{empresa.nome}</h1>
            <p className="text-gray-600 dark:text-gray-400">{empresa.setor || 'Setor não informado'}</p>
          </div>
        </div>
      </div>

      {/* Dashboard Link */}
      {avaliacoes.filter(a => a.status === 'finalizada').length > 0 && (
        <div className="card bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Dashboard de Maturidade - Empresa</h2>
              <p className="text-green-100 text-sm">
                {avaliacoes.filter(a => a.status === 'finalizada').length} avaliação(ões) finalizada(s) • Veja o resultado consolidado da empresa
              </p>
            </div>
            <Link
              to={`/dashboard/empresa/${empresa.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              Ver Dashboard
            </Link>
          </div>
        </div>
      )}

      {(empresa.cnpj || empresa.email || empresa.telefone || empresa.website) && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Informações</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {empresa.cnpj && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">CNPJ:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{empresa.cnpj}</span>
              </div>
            )}
            {empresa.porte && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Porte:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{labelPorteComFaixa(empresa.porte)}</span>
              </div>
            )}
            {empresa.email && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{empresa.email}</span>
              </div>
            )}
            {empresa.telefone && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Telefone:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{empresa.telefone}</span>
              </div>
            )}
            {empresa.endereco && (
              <div className="md:col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Endereço:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{empresa.endereco}</span>
              </div>
            )}
            {empresa.website && (
              <div className="md:col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Website:</span>
                <a 
                  href={empresa.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
                >
                  <Globe className="w-4 h-4" />
                  {empresa.website}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Usuários ({empresa.usuarios.length})</h2>
            </div>
            <button onClick={() => openModal('usuario')} className="btn btn-primary text-sm py-1.5">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {empresa.usuarios.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Nenhum usuário cadastrado</p>
          ) : (
            <div className="space-y-2">
              {empresa.usuarios.map((usuario) => (
                <div key={usuario.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{usuario.nome}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{usuario.email}</p>
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                      Perfil: {labelPerfilUsuario(usuario.role)}
                    </p>
                    {usuario.cargo && <p className="text-xs text-gray-400 dark:text-gray-500">{usuario.cargo}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal('usuario', usuario)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-gray-600 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUsuario(usuario)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white dark:hover:bg-gray-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Projetos ({empresa.projetos.length})</h2>
            </div>
            <button onClick={() => openModal('projeto')} className="btn btn-primary text-sm py-1.5">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {empresa.projetos.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">Nenhum projeto cadastrado</p>
          ) : (
            <div className="space-y-2">
              {empresa.projetos.map((projeto) => (
                <div key={projeto.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <Link to={`/projetos/${projeto.id}`} className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                      {projeto.nome}
                    </Link>
                    {projeto.descricao && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{projeto.descricao}</p>}
                    <p className="text-xs text-gray-400 dark:text-gray-500">{projeto._count.avaliacoes} avaliações</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal('projeto', projeto)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-gray-600 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProjeto(projeto)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white dark:hover:bg-gray-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={modalType === 'usuario'}
        onClose={() => setModalType(null)}
        title={editingItem ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <form onSubmit={handleSubmitUsuario} className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input
              type="text"
              className="input"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Perfil *</label>
            <select
              className="input"
              value={formData.role || 'avaliador'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              {OPCOES_PERFIL_USUARIO.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Negócios, TI e SysMap são perfis da empresa; o usuário fica vinculado a esta empresa.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cargo</label>
              <input
                type="text"
                className="input"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input
                type="tel"
                className="input"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
          </div>
          {editingItem && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={formData.ativo !== false}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Usuário ativo</span>
              </label>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setModalType(null)} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {editingItem ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalType === 'projeto'}
        onClose={() => setModalType(null)}
        title={editingItem ? 'Editar Projeto' : 'Novo Projeto'}
      >
        <form onSubmit={handleSubmitProjeto} className="space-y-4">
          <div>
            <label className="label">Nome *</label>
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
              placeholder="R$ no ano (calibra ROI nos relatórios)"
              value={formData.faturamentoAnualProjeto ?? ''}
              onChange={(e) => setFormData({ ...formData, faturamentoAnualProjeto: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Base para percentual de referência de ROI em relatórios.</p>
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
                    checked={formData.audienciaPrimaria?.includes(audiencia.id) || false}
                    onChange={(e) => {
                      const current = formData.audienciaPrimaria || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, audienciaPrimaria: [...current, audiencia.id] });
                      } else {
                        setFormData({ ...formData, audienciaPrimaria: current.filter(a => a !== audiencia.id) });
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{audiencia.nome}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Lentes Prioritárias</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {LENTES_PRIORITARIAS.map((lente) => (
                <label key={lente.id} className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.lentesPrioritarias?.includes(lente.id) || false}
                    onChange={(e) => {
                      const current = formData.lentesPrioritarias || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, lentesPrioritarias: [...current, lente.id] });
                      } else {
                        setFormData({ ...formData, lentesPrioritarias: current.filter(l => l !== lente.id) });
                      }
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{lente.nome}</span>
                </label>
              ))}
            </div>
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
            <button type="button" onClick={() => setModalType(null)} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {editingItem ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

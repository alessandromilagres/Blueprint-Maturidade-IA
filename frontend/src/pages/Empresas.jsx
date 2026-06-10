import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, Users, FolderKanban, Pencil, Trash2, Globe } from 'lucide-react';
import { empresasApi } from '../services/api';
import Modal from '../components/Modal';
import { FAIXAS_FUNCIONARIOS_PORTE } from '../constants/porteEmpresa';

export default function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    setor: '',
    porte: '',
    telefone: '',
    email: '',
    endereco: '',
    website: '',
  });

  useEffect(() => {
    loadEmpresas();
  }, []);

  async function loadEmpresas() {
    try {
      const data = await empresasApi.listar();
      setEmpresas(data);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(empresa = null) {
    if (empresa) {
      setEditingEmpresa(empresa);
      setFormData({
        nome: empresa.nome || '',
        cnpj: empresa.cnpj || '',
        setor: empresa.setor || '',
        porte: empresa.porte || '',
        telefone: empresa.telefone || '',
        email: empresa.email || '',
        endereco: empresa.endereco || '',
        website: empresa.website || '',
      });
    } else {
      setEditingEmpresa(null);
      setFormData({
        nome: '',
        cnpj: '',
        setor: '',
        porte: '',
        telefone: '',
        email: '',
        endereco: '',
        website: '',
      });
    }
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingEmpresa) {
        await empresasApi.atualizar(editingEmpresa.id, formData);
      } else {
        await empresasApi.criar(formData);
      }
      setModalOpen(false);
      loadEmpresas();
    } catch (error) {
      alert('Erro ao salvar empresa: ' + error.message);
    }
  }

  async function handleDelete(empresa) {
    if (confirm(`Deseja excluir a empresa "${empresa.nome}"?`)) {
      try {
        await empresasApi.excluir(empresa.id);
        loadEmpresas();
      } catch (error) {
        alert('Erro ao excluir empresa: ' + error.message);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Empresas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie as empresas cadastradas</p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nova Empresa
        </button>
      </div>

      {empresas.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma empresa cadastrada</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Comece cadastrando sua primeira empresa</p>
          <button onClick={() => openModal()} className="btn btn-primary">
            Cadastrar Empresa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresas.map((empresa) => (
            <div key={empresa.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 dark:bg-primary-900/50 p-2 rounded-lg">
                    <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <Link to={`/empresas/${empresa.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                      {empresa.nome}
                    </Link>
                    {empresa.setor && <p className="text-sm text-gray-500 dark:text-gray-400">{empresa.setor}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openModal(empresa)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(empresa)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{empresa._count.usuarios} usuários</span>
                </div>
                <div className="flex items-center gap-1">
                  <FolderKanban className="w-4 h-4" />
                  <span>{empresa._count.projetos} projetos</span>
                </div>
              </div>

              {empresa.cnpj && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">CNPJ: {empresa.cnpj}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">CNPJ</label>
              <input
                type="text"
                className="input"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Porte</label>
              <select
                className="input"
                value={formData.porte}
                onChange={(e) => setFormData({ ...formData, porte: e.target.value })}
              >
                <option value="">Selecione</option>
                <option value="Micro">Micro — {FAIXAS_FUNCIONARIOS_PORTE.Micro}</option>
                <option value="Pequena">Pequena — {FAIXAS_FUNCIONARIOS_PORTE.Pequena}</option>
                <option value="Média">Média — {FAIXAS_FUNCIONARIOS_PORTE['Média']}</option>
                <option value="Grande">Grande — {FAIXAS_FUNCIONARIOS_PORTE.Grande}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Setor</label>
            <input
              type="text"
              className="input"
              value={formData.setor}
              onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
              placeholder="Ex: Tecnologia, Finanças, Varejo..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Telefone</label>
              <input
                type="tel"
                className="input"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Endereço</label>
            <input
              type="text"
              className="input"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Website</label>
            <input
              type="url"
              className="input"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://exemplo.com.br"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              {editingEmpresa ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

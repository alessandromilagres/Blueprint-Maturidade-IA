import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, Users, FolderKanban, Pencil, Trash2, ImagePlus, X } from 'lucide-react';
import { empresasApi } from '../services/api';
import Modal from '../components/Modal';
import { FAIXAS_FUNCIONARIOS_PORTE } from '../constants/porteEmpresa';
import EmpresaLogoRelatorio from '../components/EmpresaLogoRelatorio';

const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml';

export default function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [removerLogo, setRemoverLogo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const logoInputRef = useRef(null);
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

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

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

  function resetLogoState() {
    setLogoFile(null);
    setRemoverLogo(false);
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  }

  async function openModal(empresa = null) {
    resetLogoState();
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
      if (empresa.empresaLogoDisponivel || empresa.logoPath) {
        try {
          const blob = await empresasApi.buscarLogoBlob(empresa.id);
          if (blob) setLogoPreview(URL.createObjectURL(blob));
        } catch {
          /* sem preview */
        }
      }
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

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo deve ter no máximo 2 MB.');
      e.target.value = '';
      return;
    }
    setLogoFile(file);
    setRemoverLogo(false);
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleRemoverLogo() {
    setLogoFile(null);
    setRemoverLogo(true);
    if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      let empresaId = editingEmpresa?.id;
      if (editingEmpresa) {
        await empresasApi.atualizar(editingEmpresa.id, formData);
      } else {
        const criada = await empresasApi.criar(formData);
        empresaId = criada.id;
      }

      if (empresaId) {
        if (removerLogo && (editingEmpresa?.logoPath || editingEmpresa?.empresaLogoDisponivel)) {
          await empresasApi.removerLogo(empresaId);
        } else if (logoFile) {
          await empresasApi.uploadLogo(empresaId, logoFile);
        }
      }

      setModalOpen(false);
      resetLogoState();
      loadEmpresas();
    } catch (error) {
      alert('Erro ao salvar empresa: ' + error.message);
    } finally {
      setSalvando(false);
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
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-primary-100 dark:bg-primary-900/50 p-2 rounded-lg shrink-0 flex items-center justify-center w-12 h-12">
                    {empresa.empresaLogoDisponivel ? (
                      <EmpresaLogoRelatorio
                        empresaId={empresa.id}
                        empresaLogoDisponivel={empresa.empresaLogoDisponivel}
                        className="max-h-8 max-w-[2.5rem]"
                        alt={`Logo ${empresa.nome}`}
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link to={`/empresas/${empresa.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                      {empresa.nome}
                    </Link>
                    {empresa.setor && <p className="text-sm text-gray-500 dark:text-gray-400">{empresa.setor}</p>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
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
            <label className="label">Logo da empresa</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Aparece nos books e relatórios IA quando cadastrado. PNG, JPEG, WebP ou SVG — máx. 2 MB.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview logo" className="max-h-full max-w-full object-contain p-1" />
                ) : (
                  <ImagePlus className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept={LOGO_ACCEPT}
                  onChange={handleLogoChange}
                  className="text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-primary-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-700"
                />
                {(logoPreview || editingEmpresa?.empresaLogoDisponivel || editingEmpresa?.logoPath) && !removerLogo && (
                  <button
                    type="button"
                    onClick={handleRemoverLogo}
                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remover logo
                  </button>
                )}
              </div>
            </div>
          </div>

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
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary flex-1" disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={salvando}>
              {salvando ? 'Salvando…' : editingEmpresa ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Key,
  Building2,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  Filter,
  Send,
  FolderKanban,
  Package,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { usuariosApi, empresasApi, projetosApi, produtosApi, convitesApi, areasApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { OPCOES_PERFIL_USUARIO } from '../constants/perfilUsuario.js';
import {
  idsAreasSugeridasPorCargo,
  inferirPerfilCargoAvaliador
} from '../utils/mapaCargosDimensoesAvaliacao.js';

const ROLES = {
  admin: { label: 'Administrador', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  gestor: { label: 'Gestor', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  avaliador: { label: 'Avaliador', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  negocios: { label: 'Negócios', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' },
  ti: { label: 'TI', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200' },
  sysmap: { label: 'SysMap', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200' }
};

export default function Usuarios() {
  const { isAdmin, usuario: usuarioLogado } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroRole, setFiltroRole] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('');
  
  const [modalAberto, setModalAberto] = useState(false);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [usuarioSenha, setUsuarioSenha] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    cargo: '',
    telefone: '',
    empresaId: '',
    role: 'avaliador',
    ativo: true,
    nivelPrioridadeMapeamentoMaturidade: 1
  });

  const [formSenha, setFormSenha] = useState({
    novaSenha: '',
    confirmarSenha: ''
  });

  const [modalConviteAberto, setModalConviteAberto] = useState(false);
  const [usuarioConvite, setUsuarioConvite] = useState(null);
  const [projetos, setProjetos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [enviandoConvite, setEnviandoConvite] = useState(false);
  const [resultadoConvite, setResultadoConvite] = useState(null);
  const [qrCodeConvite, setQrCodeConvite] = useState('');
  const [formConvite, setFormConvite] = useState({
    tipo: 'projeto',
    projetoId: '',
    produtoId: '',
    areaIds: [],
    incluirMencaoDesejosIaNoConvite: true
  });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const link = resultadoConvite?.email?.linkAvaliacao;
    if (!link) {
      setQrCodeConvite('');
      return;
    }

    let cancelado = false;
    QRCode.toDataURL(link, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0D1B2A',
        light: '#FFFFFF'
      }
    })
      .then((dataUrl) => {
        if (!cancelado) setQrCodeConvite(dataUrl);
      })
      .catch((error) => {
        console.error('Erro ao gerar QR Code do convite:', error);
        if (!cancelado) setQrCodeConvite('');
      });

    return () => {
      cancelado = true;
    };
  }, [resultadoConvite?.email?.linkAvaliacao]);

  async function carregarDados() {
    try {
      const [usuariosData, empresasData] = await Promise.all([
        usuariosApi.listar(),
        empresasApi.listar()
      ]);
      setUsuarios(usuariosData);
      setEmpresas(empresasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusca = u.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       u.email.toLowerCase().includes(busca.toLowerCase());
    const matchEmpresa = !filtroEmpresa || u.empresaId === parseInt(filtroEmpresa);
    const matchRole = !filtroRole || u.role === filtroRole;
    const matchAtivo = filtroAtivo === '' || u.ativo === (filtroAtivo === 'true');
    return matchBusca && matchEmpresa && matchRole && matchAtivo;
  });

  function abrirModalNovo() {
    setUsuarioEditando(null);
    setForm({
      nome: '',
      email: '',
      senha: '',
      cargo: '',
      telefone: '',
      empresaId: empresas[0]?.id || '',
      role: 'avaliador',
      ativo: true,
      nivelPrioridadeMapeamentoMaturidade: 1
    });
    setErro('');
    setModalAberto(true);
  }

  function abrirModalEditar(usuario) {
    setUsuarioEditando(usuario);
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      cargo: usuario.cargo || '',
      telefone: usuario.telefone || '',
      empresaId: usuario.empresaId,
      role: usuario.role || 'avaliador',
      ativo: usuario.ativo !== false,
      nivelPrioridadeMapeamentoMaturidade:
        usuario.nivelPrioridadeMapeamentoMaturidade >= 1 &&
        usuario.nivelPrioridadeMapeamentoMaturidade <= 3
          ? usuario.nivelPrioridadeMapeamentoMaturidade
          : 1
    });
    setErro('');
    setModalAberto(true);
  }

  function abrirModalSenha(usuario) {
    setUsuarioSenha(usuario);
    setFormSenha({ novaSenha: '', confirmarSenha: '' });
    setErro('');
    setModalSenhaAberto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    try {
      if (usuarioEditando) {
        const dadosAtualizar = { ...form };
        delete dadosAtualizar.senha;
        const atualizado = await usuariosApi.atualizar(usuarioEditando.id, dadosAtualizar);
        if (atualizado?.avisoCompatibilidade) {
          setModalAberto(false);
          await carregarDados();
          alert(atualizado.avisoCompatibilidade);
          setSalvando(false);
          return;
        }
      } else {
        // Senha agora é opcional. Se for preenchida, exige mínimo de 6 caracteres.
        // Se ficar em branco, o backend irá gerar a senha temporária "SysMap"
        // automaticamente no momento do envio do convite de avaliação.
        if (form.senha && form.senha.length > 0 && form.senha.length < 6) {
          setErro('Se preenchida, a senha deve ter pelo menos 6 caracteres.');
          setSalvando(false);
          return;
        }
        const payload = { ...form };
        if (!payload.senha) delete payload.senha;
        const criado = await usuariosApi.criar(payload);
        if (criado?.avisoCompatibilidade) {
          setModalAberto(false);
          await carregarDados();
          alert(criado.avisoCompatibilidade);
          setSalvando(false);
          return;
        }
      }
      setModalAberto(false);
      await carregarDados();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleDefinirSenha(e) {
    e.preventDefault();
    setErro('');

    if (formSenha.novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (formSenha.novaSenha !== formSenha.confirmarSenha) {
      setErro('As senhas não conferem');
      return;
    }

    setSalvando(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/definir-senha/${usuarioSenha.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ novaSenha: formSenha.novaSenha })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao definir senha');
      }

      setModalSenhaAberto(false);
      alert('Senha definida com sucesso!');
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(usuario) {
    if (usuario.id === usuarioLogado?.id) {
      alert('Você não pode excluir seu próprio usuário');
      return;
    }

    if (!confirm(`Deseja realmente excluir o usuário "${usuario.nome}"?`)) {
      return;
    }

    try {
      await usuariosApi.excluir(usuario.id);
      carregarDados();
    } catch (error) {
      alert('Erro ao excluir: ' + error.message);
    }
  }

  async function handleToggleAtivo(usuario) {
    if (usuario.id === usuarioLogado?.id) {
      alert('Você não pode desativar seu próprio usuário');
      return;
    }

    try {
      await usuariosApi.atualizar(usuario.id, { ativo: !usuario.ativo });
      carregarDados();
    } catch (error) {
      alert('Erro ao atualizar: ' + error.message);
    }
  }

  function sugerirAreasPorCargo(cargo, todasAreas) {
    return idsAreasSugeridasPorCargo(cargo, todasAreas);
  }

  function aplicarSugestaoCargoProjeto(usuario, areasBase, extras = {}) {
    const areaIds = sugerirAreasPorCargo(usuario?.cargo, areasBase);
    return {
      tipo: 'projeto',
      projetoId: '',
      produtoId: '',
      areaIds,
      incluirMencaoDesejosIaNoConvite: true,
      ...extras
    };
  }

  async function abrirModalConvite(usuario) {
    setUsuarioConvite(usuario);
    setFormConvite({ tipo: 'projeto', projetoId: '', produtoId: '', areaIds: [], incluirMencaoDesejosIaNoConvite: true });
    setResultadoConvite(null);
    setErro('');
    
    try {
      const [projetosData, produtosData, areasData] = await Promise.all([
        projetosApi.listar(usuario.empresaId),
        produtosApi.listar(null, usuario.empresaId),
        areasApi.listar()
      ]);
      setProjetos(projetosData);
      setProdutos(produtosData);
      setAreas(areasData);

      setFormConvite(aplicarSugestaoCargoProjeto(usuario, areasData));
    } catch (error) {
      console.error('Erro ao carregar projetos/produtos/áreas:', error);
      setProjetos([]);
      setProdutos([]);
      setAreas([]);
    }
    
    setModalConviteAberto(true);
  }

  async function handleEnviarConvite(e) {
    e.preventDefault();
    setErro('');
    setResultadoConvite(null);
    
    if (formConvite.tipo === 'projeto' && !formConvite.projetoId) {
      setErro('Selecione um projeto');
      return;
    }
    
    if (formConvite.tipo === 'projeto' && formConvite.areaIds.length === 0) {
      setErro('Selecione pelo menos uma área de avaliação');
      return;
    }
    
    if (formConvite.tipo === 'produto' && !formConvite.produtoId) {
      setErro('Selecione um produto');
      return;
    }
    
    setEnviandoConvite(true);
    
    try {
      const payload = {
        avaliadorId: usuarioConvite.id,
        tipo: formConvite.tipo,
        projetoId: formConvite.tipo === 'projeto' ? parseInt(formConvite.projetoId) : null,
        produtoId: formConvite.tipo === 'produto' ? parseInt(formConvite.produtoId) : null,
        areaIds: formConvite.tipo === 'projeto' ? formConvite.areaIds : []
      };
      if (formConvite.tipo === 'projeto') {
        payload.incluirMencaoDesejosIaNoConvite = formConvite.incluirMencaoDesejosIaNoConvite !== false;
      }
      const resultado = await convitesApi.enviar(payload);
      
      setResultadoConvite(resultado);
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviandoConvite(false);
    }
  }

  function toggleArea(areaId) {
    setFormConvite(prev => ({
      ...prev,
      areaIds: prev.areaIds.includes(areaId)
        ? prev.areaIds.filter(id => id !== areaId)
        : [...prev.areaIds, areaId]
    }));
  }

  function selecionarTodasAreas() {
    setFormConvite(prev => ({
      ...prev,
      areaIds: areas.map(a => a.id)
    }));
  }

  function limparAreas() {
    setFormConvite(prev => ({
      ...prev,
      areaIds: []
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7" />
            Usuários
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os usuários do sistema
          </p>
        </div>
        {isAdmin() && (
          <button
            onClick={abrirModalNovo}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Usuário
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="input"
          >
            <option value="">Todas as empresas</option>
            {empresas.map(e => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
          <select
            value={filtroRole}
            onChange={(e) => setFiltroRole(e.target.value)}
            className="input"
          >
            <option value="">Todos os perfis</option>
            {OPCOES_PERFIL_USUARIO.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={filtroAtivo}
            onChange={(e) => setFiltroAtivo(e.target.value)}
            className="input"
          >
            <option value="">Todos os status</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                <th className="pb-3 font-medium">Usuário</th>
                <th className="pb-3 font-medium">Empresa</th>
                <th className="pb-3 font-medium">Perfil</th>
                <th className="pb-3 font-medium">Prioridade maturidade</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!usuario.ativo ? 'opacity-60' : ''}`}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {usuario.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{usuario.nome}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" />
                              {usuario.email}
                            </span>
                            {usuario.telefone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" />
                                {usuario.telefone}
                              </span>
                            )}
                          </div>
                          {usuario.cargo && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{usuario.cargo}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {usuario.empresa?.nome || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ROLES[usuario.role]?.color || ROLES.avaliador.color}`}>
                        <Shield className="w-3 h-3" />
                        {ROLES[usuario.role]?.label || 'Avaliador'}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                        {usuario.nivelPrioridadeMapeamentoMaturidade >= 1 &&
                        usuario.nivelPrioridadeMapeamentoMaturidade <= 3
                          ? usuario.nivelPrioridadeMapeamentoMaturidade
                          : '—'}
                      </span>
                    </td>
                    <td className="py-4">
                      {usuario.ativo !== false ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                          <XCircle className="w-4 h-4" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin() && (
                          <>
                            {usuario.role === 'avaliador' && usuario.ativo !== false && (
                              <button
                                onClick={() => abrirModalConvite(usuario)}
                                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="Enviar convite para avaliação"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => abrirModalSenha(usuario)}
                              className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                              title="Definir senha"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => abrirModalEditar(usuario)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleAtivo(usuario)}
                              className={`p-2 rounded-lg transition-colors ${
                                usuario.ativo !== false
                                  ? 'text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                  : 'text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                              }`}
                              title={usuario.ativo !== false ? 'Desativar' : 'Ativar'}
                            >
                              {usuario.ativo !== false ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleExcluir(usuario)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t dark:border-gray-700 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          {usuariosFiltrados.length} usuário(s) encontrado(s)
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title={usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {erro}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
                className="input"
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="input"
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Perfil *
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
                className="input"
              >
                {OPCOES_PERFIL_USUARIO.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Negócios, TI e SysMap são perfis da fase 2: cada usuário permanece vinculado à empresa selecionada.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prioridade no mapeamento de maturidade (projeto)
              </label>
              <select
                value={form.nivelPrioridadeMapeamentoMaturidade}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nivelPrioridadeMapeamentoMaturidade: parseInt(e.target.value, 10)
                  })
                }
                className="input max-w-md"
              >
                <option value={1}>Nível 1 — entra só quando o filtro do dashboard for “até 1”</option>
                <option value={2}>Nível 2 — entra nos filtros “até 2” e “até 3”</option>
                <option value={3}>Nível 3 — entra em todos os filtros (padrão)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Usado para consolidar scores do dashboard de maturidade: filtro “até N” inclui avaliadores de
                prioridade 1 até N.
              </p>
            </div>

            {!usuarioEditando && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Senha (opcional)
                </label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  className="input"
                  placeholder="Deixe em branco para gerar 'SysMap' no envio do convite"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Se ficar em branco, a senha temporária <strong>SysMap</strong> será criada automaticamente
                  e enviada por e-mail quando o operador disparar o convite de avaliação.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Empresa *
              </label>
              <select
                value={form.empresaId}
                onChange={(e) => setForm({ ...form, empresaId: e.target.value })}
                required
                className="input"
              >
                <option value="">Selecione...</option>
                {empresas.map(e => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cargo
              </label>
              <input
                type="text"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                className="input"
                placeholder="Ex: Gerente de TI"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className="input"
                placeholder="(11) 99999-9999"
              />
            </div>

            {usuarioEditando && (
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Usuário ativo</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="btn-primary"
            >
              {salvando ? 'Salvando...' : usuarioEditando ? 'Salvar' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Definir Senha */}
      <Modal
        isOpen={modalSenhaAberto}
        onClose={() => setModalSenhaAberto(false)}
        title={`Definir Senha - ${usuarioSenha?.nome}`}
      >
        <form onSubmit={handleDefinirSenha} className="space-y-4">
          {erro && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {erro}
            </div>
          )}

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Atenção:</strong> Você está definindo uma nova senha para este usuário. A senha atual será substituída.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nova Senha *
            </label>
            <input
              type="password"
              value={formSenha.novaSenha}
              onChange={(e) => setFormSenha({ ...formSenha, novaSenha: e.target.value })}
              required
              className="input"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirmar Senha *
            </label>
            <input
              type="password"
              value={formSenha.confirmarSenha}
              onChange={(e) => setFormSenha({ ...formSenha, confirmarSenha: e.target.value })}
              required
              className="input"
              placeholder="Repita a senha"
              minLength={6}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setModalSenhaAberto(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="btn-primary"
            >
              {salvando ? 'Salvando...' : 'Definir Senha'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Enviar Convite para Avaliação */}
      <Modal
        isOpen={modalConviteAberto}
        onClose={() => setModalConviteAberto(false)}
        title={`Enviar Convite - ${usuarioConvite?.nome}`}
      >
        {resultadoConvite ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Convite enviado com sucesso!</span>
              </div>
              {resultadoConvite.email?.simulado && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                  ⚠️ SMTP não configurado. Email simulado.
                </p>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Link de acesso:</p>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={resultadoConvite.email?.linkAvaliacao || ''} 
                  className="input text-xs flex-1"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resultadoConvite.email?.linkAvaliacao || '');
                    alert('Link copiado!');
                  }}
                  className="btn-secondary px-3 py-2"
                  title="Copiar link"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                O avaliador pode usar este link para acessar diretamente a avaliação.
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                  QR Code para teste no celular
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-[220px] h-[220px] flex items-center justify-center bg-white border border-gray-200 rounded-xl p-3">
                  {qrCodeConvite ? (
                    <img
                      src={qrCodeConvite}
                      alt="QR Code do convite de avaliação"
                      className="w-full h-full"
                    />
                  ) : (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p>
                      Abra a câmera do celular, aponte para o QR Code e toque na notificação para abrir o convite.
                    </p>
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      O QR Code usa o mesmo link exibido acima, incluindo as dimensões selecionadas no convite.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button
                onClick={() => {
                  setResultadoConvite(null);
                  setFormConvite({
                    tipo: 'projeto',
                    projetoId: '',
                    produtoId: '',
                    areaIds: [],
                    incluirMencaoDesejosIaNoConvite: true
                  });
                }}
                className="btn-secondary"
              >
                Enviar outro
              </button>
              <button
                onClick={() => setModalConviteAberto(false)}
                className="btn-primary"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEnviarConvite} className="space-y-4">
            {erro && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {erro}
              </div>
            )}

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Envie um convite por email para <strong>{usuarioConvite?.nome}</strong> realizar uma avaliação.
                O email será enviado para <strong>{usuarioConvite?.email}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Avaliação
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormConvite(
                      aplicarSugestaoCargoProjeto(usuarioConvite, areas, {
                        projetoId: formConvite.projetoId || '',
                        produtoId: ''
                      })
                    )
                  }
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    formConvite.tipo === 'projeto'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <FolderKanban className={`w-6 h-6 ${formConvite.tipo === 'projeto' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${formConvite.tipo === 'projeto' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    Projeto
                  </span>
                  <span className="text-xs text-gray-500">Maturidade em IA</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormConvite({
                      ...formConvite,
                      tipo: 'produto',
                      projetoId: '',
                      areaIds: []
                    })
                  }
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    formConvite.tipo === 'produto'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <Package className={`w-6 h-6 ${formConvite.tipo === 'produto' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${formConvite.tipo === 'produto' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    Produto
                  </span>
                  <span className="text-xs text-gray-500">IA-First</span>
                </button>
              </div>
            </div>

            {formConvite.tipo === 'projeto' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Projeto *
                  </label>
                  <select
                    value={formConvite.projetoId}
                    onChange={(e) => setFormConvite({ ...formConvite, projetoId: e.target.value })}
                    required
                    className="input"
                  >
                    <option value="">Selecione um projeto...</option>
                    {projetos.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  {projetos.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Nenhum projeto encontrado para a empresa do avaliador.
                    </p>
                  )}
                </div>

                {formConvite.projetoId && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Áreas de Avaliação *
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selecionarTodasAreas}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Selecionar todas
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={limparAreas}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                    {usuarioConvite?.cargo && formConvite.areaIds.length > 0 && (
                      <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Áreas sugeridas pela matriz Cargo × Dimensão para o cargo "<strong>{usuarioConvite.cargo}</strong>"
                          {inferirPerfilCargoAvaliador(usuarioConvite.cargo)
                            ? ` (${inferirPerfilCargoAvaliador(usuarioConvite.cargo)})`
                            : ''}
                          . Você pode alterar conforme necessário.
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      {areas.map(area => (
                        <label
                          key={area.id}
                          className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            formConvite.areaIds.includes(area.id)
                              ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-600/50 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formConvite.areaIds.includes(area.id)}
                            onChange={() => toggleArea(area.id)}
                            className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div>
                            <span className={`text-sm font-medium ${
                              formConvite.areaIds.includes(area.id)
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {area.nome}
                            </span>
                            {area.descricao && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {area.descricao}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {formConvite.areaIds.length} de {areas.length} áreas selecionadas
                    </p>
                    <label className="flex items-start gap-3 mt-4 p-3 rounded-lg border border-teal-200 dark:border-teal-900/50 bg-teal-50/60 dark:bg-teal-950/25 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formConvite.incluirMencaoDesejosIaNoConvite !== false}
                        onChange={(e) =>
                          setFormConvite({
                            ...formConvite,
                            incluirMencaoDesejosIaNoConvite: e.target.checked
                          })
                        }
                        className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-800 dark:text-gray-200">
                        <strong>E-mail do convite:</strong> incluir um parágrafo sobre o bloco opcional{' '}
                        <strong>Desejos IA</strong> (no final do questionário; não altera a pontuação de maturidade).
                      </span>
                    </label>
                  </div>
                )}
              </>
            )}

            {formConvite.tipo === 'produto' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Produto *
                </label>
                <select
                  value={formConvite.produtoId}
                  onChange={(e) => setFormConvite({ ...formConvite, produtoId: e.target.value })}
                  required
                  className="input"
                >
                  <option value="">Selecione um produto...</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} ({p.projeto?.nome})</option>
                  ))}
                </select>
                {produtos.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Nenhum produto encontrado para a empresa do avaliador.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={() => setModalConviteAberto(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviandoConvite}
                className="btn-primary flex items-center gap-2"
              >
                {enviandoConvite ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Convite
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

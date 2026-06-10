import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FolderKanban, ClipboardCheck, Plus, ArrowLeft, Trash2, FileText, BarChart3, CheckSquare, Download, Archive, ClipboardList, Sparkles } from 'lucide-react';
import { projetosApi, avaliacoesApi, usuariosApi, areasApi, exportarApi } from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import ScoreBadge from '../components/ScoreBadge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatDatePtBr } from '../utils/formatDate';

export default function ProjetoDetalhe() {
  const { id } = useParams();
  const { isGestor, isAvaliador } = useAuth();
  const toast = useToast();
  const [projeto, setProjeto] = useState(null);
  const [painelAvaliadores, setPainelAvaliadores] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);

  useEffect(() => {
    loadProjeto();
  }, [id]);

  useEffect(() => {
    if (!projeto?.id) return;
    if (!isGestor() || isAvaliador()) {
      setPainelAvaliadores(null);
      return;
    }
    let cancelled = false;
    projetosApi
      .avaliadoresStatus(projeto.id)
      .then((d) => {
        if (!cancelled) setPainelAvaliadores(d);
      })
      .catch(() => {
        if (!cancelled) setPainelAvaliadores(null);
      });
    return () => {
      cancelled = true;
    };
  }, [projeto?.id]);

  async function loadProjeto() {
    try {
      const [projetoData, areasData] = await Promise.all([
        projetosApi.buscar(id),
        areasApi.listar()
      ]);
      
      setProjeto(projetoData);
      setAreas(areasData);
      
      const usuariosData = await usuariosApi.listar(projetoData.empresaId);
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setSelectedUsuario(usuarios[0]?.id || '');
    setSelectedAreas(areas.map(a => a.id));
    setModalOpen(true);
  }

  function toggleArea(areaId) {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  }

  function selectAllAreas() {
    setSelectedAreas(areas.map(a => a.id));
  }

  function deselectAllAreas() {
    setSelectedAreas([]);
  }

  async function handleNovaAvaliacao(e) {
    e.preventDefault();
    
    if (selectedAreas.length === 0) {
      toast.info('Selecione pelo menos uma área para avaliar');
      return;
    }
    
    try {
      const avaliacao = await avaliacoesApi.criar({
        projetoId: parseInt(id),
        usuarioId: parseInt(selectedUsuario),
        areaIds: selectedAreas,
      });
      setModalOpen(false);
      window.location.href = `/avaliacoes/${avaliacao.id}`;
    } catch (error) {
      toast.error('Erro ao criar avaliação: ' + error.message);
    }
  }

  async function handleDeleteAvaliacao(avaliacao) {
    if (confirm('Deseja excluir esta avaliação?')) {
      try {
        await avaliacoesApi.excluir(avaliacao.id);
        loadProjeto();
      } catch (error) {
        toast.error('Erro ao excluir avaliação: ' + error.message);
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

  if (!projeto) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Projeto não encontrado</h2>
        <Link to="/projetos" className="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
          Voltar para projetos
        </Link>
      </div>
    );
  }

  const avaliacoesFinalizadas = projeto.avaliacoes.filter(a => a.status === 'finalizada');
  const linhasPainel = painelAvaliadores?.avaliadores || [];
  const finalizadasPainel = linhasPainel.filter((a) => a.statusFormulario === 'finalizada').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/projetos" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-xl">
            <FolderKanban className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{projeto.nome}</h1>
            <Link to={`/empresas/${projeto.empresa.id}`} className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
              {projeto.empresa.nome}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              className="btn btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <div className="absolute right-0 mt-1 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 max-h-96 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                Exportar Markdown (ZIP com 2 arquivos)
              </div>
              <button
                onClick={() => exportarApi.download(
                  exportarApi.projetoZipMd(id),
                  `projeto-${projeto.nome.replace(/\s+/g, '-')}.zip`
                )}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                <div>
                  <div>Projeto (ZIP)</div>
                  <div className="text-xs text-gray-400">projeto.md + empresa_projeto.md</div>
                </div>
              </button>
              <button
                onClick={() => exportarApi.download(
                  exportarApi.projetoZipMdCompleto(id),
                  `projeto-completo-${projeto.nome.replace(/\s+/g, '-')}.zip`
                )}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                <div>
                  <div>Projeto + Especificações (ZIP)</div>
                  <div className="text-xs text-gray-400">projeto-completo.md + empresa_projeto.md</div>
                </div>
              </button>
              <button
                onClick={() => exportarApi.download(
                  exportarApi.projetoZipRelatorioMaturidade(id),
                  `relatorio-maturidade-${projeto.nome.replace(/\s+/g, '-')}.zip`
                )}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700"
              >
                <Archive className="w-4 h-4" />
                <div>
                  <div>Relatório de Maturidade IA (ZIP)</div>
                  <div className="text-xs text-gray-400">relatorio-maturidade-ia.md + empresa_projeto.md</div>
                </div>
              </button>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                Exportar Word (ZIP com 2 arquivos)
              </div>
              <button
                onClick={() => exportarApi.download(
                  exportarApi.projetoZipDocx(id),
                  `projeto-${projeto.nome.replace(/\s+/g, '-')}.zip`
                )}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                <div>
                  <div>Projeto (ZIP Word)</div>
                  <div className="text-xs text-gray-400">projeto.docx + empresa_projeto.docx</div>
                </div>
              </button>
            </div>
          </div>
          <StatusBadge status={projeto.status} />
        </div>
      </div>

      {projeto.descricao && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Descrição</h2>
          <p className="text-gray-600 dark:text-gray-400">{projeto.descricao}</p>
        </div>
      )}

      {isGestor() && !isAvaliador() && linhasPainel.length > 0 && (
        <div className="card border-l-4 border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 dark:border-primary-400">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ClipboardList className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Acompanhamento dos avaliadores (maturidade)</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {finalizadasPainel} de {linhasPainel.length} avaliador(es) concluíram o questionário deste projeto.
                </p>
              </div>
            </div>
            <Link
              to="/acompanhamento-avaliadores"
              state={{
                empresaId: projeto.empresaId,
                projetoId: projeto.id,
                escopo: 'projeto',
              }}
              className="btn btn-secondary whitespace-nowrap shrink-0 self-start sm:self-center"
            >
              Abrir painel
            </Link>
          </div>
        </div>
      )}

      {projeto.faturamentoAnualProjeto != null && Number(projeto.faturamentoAnualProjeto) > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Faturamento anual (projeto)</h2>
          <p className="text-gray-900 dark:text-white text-lg font-medium">
            R$ {Number(projeto.faturamentoAnualProjeto).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Usado para calibrar o percentual de referência de ROI em relatórios, dashboards e exportações.
          </p>
        </div>
      )}

      {/* Dashboard Link */}
      {avaliacoesFinalizadas.length > 0 && (
        <div className="card bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Dashboard de Maturidade</h2>
              <p className="text-blue-100 text-sm">
                {avaliacoesFinalizadas.length} avaliação(ões) finalizada(s) • Veja o resultado consolidado
              </p>
            </div>
            <Link
              to={`/dashboard/projeto/${projeto.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              Ver Dashboard
            </Link>
          </div>
        </div>
      )}

      <div className="card border border-teal-200 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Desejos IA (roadmap)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-2xl">
              Respostas opcionais do último bloco do questionário — apoiam o entendimento do roadmap futuro e{' '}
              <strong>não alteram</strong> a pontuação de maturidade. Visualize por avaliador e exporte em Word (individual ou
              consolidado).
            </p>
          </div>
          <Link
            to={`/projetos/${projeto.id}/desejos-ia`}
            className="btn btn-secondary flex items-center gap-2 shrink-0"
          >
            <FileText className="w-4 h-4" />
            Abrir painel Desejos IA
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Avaliações ({projeto.avaliacoes.length})</h2>
          </div>
          <button
            onClick={openModal}
            className="btn btn-primary flex items-center gap-2"
            disabled={usuarios.length === 0}
          >
            <Plus className="w-4 h-4" />
            Nova Avaliação
          </button>
        </div>

        {usuarios.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="mb-2">Cadastre usuários na empresa para criar avaliações</p>
            <Link to={`/empresas/${projeto.empresa.id}`} className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
              Ir para a empresa
            </Link>
          </div>
        ) : projeto.avaliacoes.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma avaliação realizada</p>
            <button
              onClick={openModal}
              className="text-primary-600 dark:text-primary-400 hover:underline text-sm mt-2"
            >
              Iniciar primeira avaliação
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                  <th className="pb-3 font-medium">Avaliador</th>
                  <th className="pb-3 font-medium">Áreas</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {projeto.avaliacoes.map((avaliacao) => {
                  const areasSelecionadas = avaliacao.areasSelecionadas 
                    ? JSON.parse(avaliacao.areasSelecionadas) 
                    : areas.map(a => a.id);
                  
                  return (
                    <tr key={avaliacao.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{avaliacao.usuario.nome}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{avaliacao.usuario.email}</p>
                      </td>
                      <td className="py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {areasSelecionadas.length} de {areas.length} áreas
                        </span>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={avaliacao.status} />
                      </td>
                      <td className="py-3">
                        {avaliacao.scoreGeral ? (
                          <ScoreBadge score={avaliacao.scoreGeral} nivel={avaliacao.nivelGeral} size="sm" />
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400 text-sm">
                        {formatDatePtBr(avaliacao.createdAt ?? avaliacao.created_at)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          {avaliacao.status === 'finalizada' ? (
                            <Link
                              to={`/relatorios/${avaliacao.id}`}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              title="Ver Relatório"
                            >
                              <FileText className="w-4 h-4" />
                            </Link>
                          ) : (
                            <Link
                              to={`/avaliacoes/${avaliacao.id}`}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                            >
                              Continuar
                            </Link>
                          )}
                          <button
                            onClick={() => handleDeleteAvaliacao(avaliacao)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova Avaliação"
      >
        <form onSubmit={handleNovaAvaliacao} className="space-y-4">
          <div>
            <label className="label">Avaliador *</label>
            <select
              className="input"
              value={selectedUsuario}
              onChange={(e) => setSelectedUsuario(e.target.value)}
              required
            >
              <option value="">Selecione um usuário</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome} ({usuario.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Áreas a Avaliar *</label>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={selectAllAreas}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Selecionar todas
                </button>
                <span className="text-gray-300">|</span>
                <button 
                  type="button" 
                  onClick={deselectAllAreas}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Limpar
                </button>
              </div>
            </div>
            <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
              {areas.map((area) => (
                <label 
                  key={area.id} 
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedAreas.includes(area.id) 
                      ? 'bg-primary-50 border border-primary-200' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(area.id)}
                    onChange={() => toggleArea(area.id)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{area.nome}</p>
                    <p className="text-xs text-gray-500">{area.perguntas.length} perguntas</p>
                  </div>
                  {selectedAreas.includes(area.id) && (
                    <CheckSquare className="w-4 h-4 text-primary-600" />
                  )}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedAreas.length} de {areas.length} áreas selecionadas 
              ({selectedAreas.reduce((acc, areaId) => {
                const area = areas.find(a => a.id === areaId);
                return acc + (area?.perguntas.length || 0);
              }, 0)} perguntas)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary flex-1"
              disabled={selectedAreas.length === 0}
            >
              Iniciar Avaliação
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

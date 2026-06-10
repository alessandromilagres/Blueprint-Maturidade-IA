import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, ArrowLeft, Plus, Trash2, FileText, BarChart3, Award, Target, Users, Sparkles, Download, Lightbulb, ClipboardList } from 'lucide-react';
import { produtosApi, avaliacoesProdutoApi, usuariosApi, verticaisApi, exportarApi } from '../services/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function ProdutoDetalhe() {
  const { id } = useParams();
  const { isGestor, isAvaliador } = useAuth();
  const toast = useToast();
  const [produto, setProduto] = useState(null);
  const [painelAvaliadores, setPainelAvaliadores] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [verticais, setVerticais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState('');
  const [selectedVerticais, setSelectedVerticais] = useState([]);

  useEffect(() => {
    loadProduto();
  }, [id]);

  useEffect(() => {
    if (!produto?.id) return;
    if (!isGestor() || isAvaliador()) {
      setPainelAvaliadores(null);
      return;
    }
    let cancelled = false;
    produtosApi
      .avaliadoresStatus(produto.id)
      .then((d) => {
        if (!cancelled) setPainelAvaliadores(d);
      })
      .catch(() => {
        if (!cancelled) setPainelAvaliadores(null);
      });
    return () => {
      cancelled = true;
    };
  }, [produto?.id]);

  async function loadProduto() {
    try {
      const [produtoData, verticaisData] = await Promise.all([
        produtosApi.buscar(id),
        verticaisApi.listar()
      ]);
      
      setProduto(produtoData);
      setVerticais(verticaisData);
      
      if (produtoData.projeto?.empresaId) {
        const usuariosData = await usuariosApi.listar(produtoData.projeto.empresaId);
        setUsuarios(usuariosData);
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setSelectedUsuario(usuarios[0]?.id || '');
    setSelectedVerticais([]);
    setModalOpen(true);
  }

  function toggleVertical(verticalId) {
    setSelectedVerticais(prev => {
      if (prev.includes(verticalId)) {
        return prev.filter(id => id !== verticalId);
      } else {
        return [...prev, verticalId];
      }
    });
  }

  function selectAllVerticais() {
    setSelectedVerticais(verticais.map(v => v.id));
  }

  function clearAllVerticais() {
    setSelectedVerticais([]);
  }

  async function handleNovaAvaliacao(e) {
    e.preventDefault();
    
    if (selectedVerticais.length === 0) {
      toast.info('Selecione pelo menos uma vertical para avaliar');
      return;
    }
    
    try {
      const avaliacao = await avaliacoesProdutoApi.criar({
        produtoId: parseInt(id),
        usuarioId: parseInt(selectedUsuario),
        verticalIds: selectedVerticais,
      });
      setModalOpen(false);
      window.location.href = `/avaliacoes-produto/${avaliacao.id}`;
    } catch (error) {
      toast.error('Erro ao criar avaliação: ' + error.message);
    }
  }

  async function handleDeleteAvaliacao(avaliacao) {
    if (confirm('Deseja excluir esta avaliação?')) {
      try {
        await avaliacoesProdutoApi.excluir(avaliacao.id);
        loadProduto();
      } catch (error) {
        toast.error('Erro ao excluir avaliação: ' + error.message);
      }
    }
  }

  const getScoreColor = (score) => {
    if (!score) return 'text-gray-400';
    if (score >= 4) return 'text-green-500';
    if (score >= 3) return 'text-blue-500';
    if (score >= 2) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getNivelRelevancia = (score) => {
    if (!score) return 'Não avaliado';
    if (score >= 4.5) return 'Muito Alta Relevância';
    if (score >= 3.5) return 'Alta Relevância';
    if (score >= 2.5) return 'Boa Relevância';
    if (score >= 1.5) return 'Relevância Moderada';
    return 'Baixa Relevância';
  };

  const totalPerguntas = verticais.reduce((acc, v) => acc + (v.perguntas?.length || 0), 0);
  const perguntasSelecionadas = selectedVerticais.length > 0
    ? verticais.filter(v => selectedVerticais.includes(v.id)).reduce((acc, v) => acc + (v.perguntas?.length || 0), 0)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Produto não encontrado</h2>
        <Link to="/produtos" className="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
          Voltar para produtos
        </Link>
      </div>
    );
  }

  const avaliacoesFinalizadas = produto.avaliacoes?.filter(a => a.status === 'finalizada') || [];
  const linhasPainel = painelAvaliadores?.avaliadores || [];
  const finalizadasPainel = linhasPainel.filter((a) => a.statusFormulario === 'finalizada').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/produtos" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-orange-100 dark:bg-orange-900/50 p-3 rounded-xl">
            <Package className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{produto.nome}</h1>
            <Link 
              to={`/projetos/${produto.projeto?.id}`} 
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              {produto.projeto?.nome} • {produto.projeto?.empresa?.nome}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {produto.modeloCriacao === 'design_thinking' ? (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200">
              Design thinking
            </span>
          ) : (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              Convencional
            </span>
          )}
          <button
            onClick={() => exportarApi.download(
              exportarApi.produto(id),
              `produto-${produto.nome.replace(/\s+/g, '-')}.md`
            )}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar MD
          </button>
          <StatusBadge status={produto.status} />
        </div>
      </div>

      {produto.descricao && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Descrição</h2>
          <p className="text-gray-600 dark:text-gray-400">{produto.descricao}</p>
        </div>
      )}

      {isGestor() && !isAvaliador() && linhasPainel.length > 0 && produto.projeto?.id && (
        <div className="card border-l-4 border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-400">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Acompanhamento dos avaliadores (produto)</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {finalizadasPainel} de {linhasPainel.length} avaliador(es) concluíram a avaliação de relevância deste produto.
                </p>
              </div>
            </div>
            <Link
              to="/acompanhamento-avaliadores"
              state={{
                empresaId: produto.projeto?.empresaId,
                projetoId: produto.projeto?.id,
                produtoId: produto.id,
                escopo: 'produto',
              }}
              className="btn btn-secondary whitespace-nowrap shrink-0 self-start sm:self-center"
            >
              Abrir painel
            </Link>
          </div>
        </div>
      )}

      {/* Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-orange-500 to-amber-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Score de Relevância</p>
              <p className="text-4xl font-bold">{produto.scoreRelevancia?.toFixed(1) || '-'}</p>
              <p className="text-orange-100 text-sm">/5.0</p>
            </div>
            <Target className="w-12 h-12 text-orange-200" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-sm">Classificação</span>
          </div>
          <p className={`text-2xl font-bold ${getScoreColor(produto.scoreRelevancia)}`}>
            {produto.classificacao ? `#${produto.classificacao}` : '-'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {getNivelRelevancia(produto.scoreRelevancia)}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Avaliações</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {avaliacoesFinalizadas.length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            finalizadas
          </p>
        </div>
      </div>

      {/* Info about evaluation */}
      <div className="card bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700">
        <div className="flex items-start gap-3">
          <Target className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
              Avaliação de Relevância por Vertical
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-400 mb-2">
              A avaliação é composta por <strong>{totalPerguntas} perguntas</strong> divididas em <strong>{verticais.length} verticais</strong>:
            </p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {verticais.map(v => (
                <div key={v.id} className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <span>{v.icone}</span>
                  <span className="truncate">{v.nome.split('(')[0].trim()}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-500 mt-2">
              Cada vertical tem 3 perguntas: ROI, Automação Agêntica e APIs
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Link - aparece quando há avaliações finalizadas */}
      {avaliacoesFinalizadas.length > 0 && (
        <div className="card bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <h2 className="text-lg font-semibold mb-1">Dashboard de Relevância</h2>
              <p className="text-purple-100 text-sm">
                {avaliacoesFinalizadas.length} avaliação(ões) finalizada(s) • Veja o resultado consolidado
              </p>
            </div>
            <Link
              to={`/dashboard/produto/${produto.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              Ver Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Fase A — Idealização (antes da especificação) */}
      <div className="card bg-gradient-to-r from-amber-500 to-orange-600 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Fase A — Idealização do produto</h2>
            </div>
            <p className="text-amber-100 text-sm">
              Design sprint compacto: problema, solução, experimento e decisões — consolide o produto antes da
              documentação técnica.
            </p>
          </div>
          <Link
            to={`/produtos/${produto.id}/idealizacao`}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-amber-700 font-medium hover:bg-amber-50 rounded-lg transition-colors shadow-lg"
          >
            <Lightbulb className="w-5 h-5" />
            Abrir idealização
          </Link>
        </div>
      </div>

      {/* Card de Especificação (Fase B) - sempre visível */}
      <div className="card bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Especificação Automática com IA</h2>
            </div>
            <p className="text-indigo-100 text-sm">
              {avaliacoesFinalizadas.length > 0 
                ? 'Gere documentação técnica completa: PRD, requisitos, arquitetura e cronograma'
                : 'Finalize uma avaliação para gerar especificação com dados mais precisos'}
            </p>
          </div>
          <Link
            to={`/produtos/${produto.id}/especificacao`}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Gerar Especificação
          </Link>
        </div>
      </div>

      {/* Avaliações */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Avaliações de Relevância ({produto.avaliacoes?.length || 0})
            </h2>
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
            <Link 
              to={`/empresas/${produto.projeto?.empresa?.id}`} 
              className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              Ir para a empresa
            </Link>
          </div>
        ) : (produto.avaliacoes?.length || 0) === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
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
                  <th className="pb-3 font-medium">Perguntas</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {produto.avaliacoes?.map((avaliacao) => (
                  <tr key={avaliacao.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{avaliacao.usuario?.nome}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{avaliacao.usuario?.email}</p>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {totalPerguntas} perguntas ({verticais.length} verticais)
                      </span>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={avaliacao.status} />
                    </td>
                    <td className="py-3">
                      <span className={`font-bold ${getScoreColor(avaliacao.scoreRelevancia)}`}>
                        {avaliacao.scoreRelevancia ? avaliacao.scoreRelevancia.toFixed(1) : '-'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(avaliacao.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        {avaliacao.status === 'finalizada' ? (
                          <Link
                            to={`/dashboard/produto/${produto.id}`}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                          >
                            Ver Dashboard
                          </Link>
                        ) : (
                          <Link
                            to={`/avaliacoes-produto/${avaliacao.id}`}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova Avaliação de Relevância"
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

          {/* Seleção de Verticais */}
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-purple-900 dark:text-purple-300 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Selecione as Verticais *
              </h4>
              <div className="flex gap-2 text-xs">
                <button 
                  type="button"
                  onClick={selectAllVerticais} 
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Selecionar todas
                </button>
                <span className="text-gray-400">|</span>
                <button 
                  type="button"
                  onClick={clearAllVerticais} 
                  className="text-gray-500 hover:underline"
                >
                  Limpar
                </button>
              </div>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-400 mb-3">
              Escolha quais verticais deseja avaliar para este produto:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {verticais.map(v => (
                <label 
                  key={v.id} 
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedVerticais.includes(v.id)
                      ? 'bg-purple-100 dark:bg-purple-800/50 border-2 border-purple-400'
                      : 'bg-white dark:bg-gray-700 border-2 border-transparent hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedVerticais.includes(v.id)}
                      onChange={() => toggleVertical(v.id)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-lg">{v.icone}</span>
                    <span className="text-sm text-gray-900 dark:text-white font-medium">
                      {v.nome}
                    </span>
                  </div>
                  <span className="text-xs text-purple-500 dark:text-purple-400">
                    {v.perguntas?.length || 3} perguntas
                  </span>
                </label>
              ))}
            </div>
            <div className="border-t border-purple-200 dark:border-purple-700 mt-3 pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-600 dark:text-purple-400">
                  {selectedVerticais.length} vertical(is) selecionada(s)
                </span>
                <span className="font-medium text-purple-700 dark:text-purple-300">
                  Total: {perguntasSelecionadas} perguntas
                </span>
              </div>
              <p className="text-xs text-purple-500 dark:text-purple-500 mt-2">
                Cada vertical avalia: ROI e Redução de Custos, Automação Agêntica, APIs e Aceleradores
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary flex-1"
              disabled={!selectedUsuario || selectedVerticais.length === 0}
            >
              Iniciar Avaliação ({perguntasSelecionadas} perguntas)
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

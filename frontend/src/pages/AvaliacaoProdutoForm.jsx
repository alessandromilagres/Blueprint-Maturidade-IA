import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Target, Package, ChevronDown, ChevronUp, Zap, Bot } from 'lucide-react';
import { avaliacoesProdutoApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function AvaliacaoProdutoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [avaliacao, setAvaliacao] = useState(null);
  const [perguntasObrigatorias, setPerguntasObrigatorias] = useState([]);
  const [verticais, setVerticais] = useState([]);
  const [respostasObrigatorias, setRespostasObrigatorias] = useState({});
  const [respostasVerticais, setRespostasVerticais] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [showObrigatorias, setShowObrigatorias] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const saveVerticalDebounceRef = useRef({});

  const draftKey = id ? `blueprint_aval_prod_${id}` : null;

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    return () => {
      const timers = saveVerticalDebounceRef.current;
      for (const k of Object.keys(timers)) {
        const t = timers[k];
        if (t) clearTimeout(t);
      }
      saveVerticalDebounceRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (!draftKey || loading || !avaliacao) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            ts: Date.now(),
            respostasObrigatorias,
            respostasVerticais,
          })
        );
      } catch {
        /* ignore */
      }
    }, 900);
    return () => clearTimeout(t);
  }, [draftKey, respostasObrigatorias, respostasVerticais, loading, avaliacao]);

  async function loadData() {
    try {
      const avaliacaoData = await avaliacoesProdutoApi.buscar(id);
      setAvaliacao(avaliacaoData);
      setPerguntasObrigatorias(avaliacaoData.perguntasObrigatorias || []);
      setVerticais(avaliacaoData.verticais || []);
      
      // Mapear respostas obrigatórias
      const respostasObrigatoriasMap = {};
      avaliacaoData.respostasObrigatorias?.forEach((r) => {
        respostasObrigatoriasMap[r.id] = {
          id: r.id,
          pontuacao: r.pontuacao,
          observacoes: r.observacoes || '',
        };
      });
      setRespostasObrigatorias(respostasObrigatoriasMap);
      
      // Mapear respostas das verticais
      const respostasVerticaisMap = {};
      avaliacaoData.respostasVerticais?.forEach((r) => {
        respostasVerticaisMap[r.id] = {
          id: r.id,
          pontuacao: r.pontuacao,
          observacoes: r.observacoes || '',
        };
      });
      setRespostasVerticais(respostasVerticaisMap);
      
      const initialExpanded = {};
      avaliacaoData.verticais?.forEach((v, index) => {
        initialExpanded[v.id] = index === 0;
      });
      setExpandedSections(initialExpanded);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Não foi possível carregar a avaliação. ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  }

  function getRespostaForPerguntaObrigatoria(perguntaId) {
    return avaliacao?.respostasObrigatorias?.find((r) => r.perguntaObrigatoriaId === perguntaId);
  }

  function getRespostaForPerguntaVertical(perguntaId) {
    return avaliacao?.respostasVerticais?.find((r) => r.perguntaProdutoId === perguntaId);
  }

  function handlePontuacaoObrigatoria(respostaId, pontuacao) {
    setRespostasObrigatorias((prev) => ({
      ...prev,
      [respostaId]: {
        ...prev[respostaId],
        pontuacao: pontuacao,
      },
    }));
  }

  function handleObservacaoObrigatoria(respostaId, observacoes) {
    setRespostasObrigatorias((prev) => ({
      ...prev,
      [respostaId]: {
        ...prev[respostaId],
        observacoes: observacoes,
      },
    }));
  }

  function handlePontuacaoVertical(respostaId, pontuacao) {
    setRespostasVerticais((prev) => ({
      ...prev,
      [respostaId]: {
        ...prev[respostaId],
        pontuacao: pontuacao,
      },
    }));
  }

  function handleObservacaoVertical(respostaId, observacoes) {
    setRespostasVerticais((prev) => ({
      ...prev,
      [respostaId]: {
        ...prev[respostaId],
        observacoes: observacoes,
      },
    }));
  }

  async function persistRespostas(showSuccessToast) {
    const atualizada = await avaliacoesProdutoApi.salvarRespostas(id, {
      respostasObrigatorias: Object.values(respostasObrigatorias),
      respostasVerticais: Object.values(respostasVerticais),
    });
    setAvaliacao(atualizada);
    const obrMap = {};
    atualizada.respostasObrigatorias?.forEach((r) => {
      obrMap[r.id] = { id: r.id, pontuacao: r.pontuacao, observacoes: r.observacoes || '' };
    });
    setRespostasObrigatorias(obrMap);
    const vertMap = {};
    atualizada.respostasVerticais?.forEach((r) => {
      vertMap[r.id] = { id: r.id, pontuacao: r.pontuacao, observacoes: r.observacoes || '' };
    });
    setRespostasVerticais(vertMap);
    setLastSavedAt(new Date());
    try {
      if (draftKey) localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
    if (showSuccessToast) {
      toast.success('Progresso salvo com sucesso.');
    }
    return atualizada;
  }

  function toggleSection(verticalId) {
    const willCollapse = expandedSections[verticalId];
    setExpandedSections((prev) => ({
      ...prev,
      [verticalId]: !prev[verticalId],
    }));
    if (willCollapse) {
      const prevTimer = saveVerticalDebounceRef.current[verticalId];
      if (prevTimer) clearTimeout(prevTimer);
      saveVerticalDebounceRef.current[verticalId] = setTimeout(async () => {
        delete saveVerticalDebounceRef.current[verticalId];
        setSaving(true);
        try {
          await persistRespostas(false);
        } catch (e) {
          toast.error('Não foi possível salvar ao fechar a seção. ' + (e.message || ''));
        } finally {
          setSaving(false);
        }
      }, 400);
    }
  }

  function expandAll() {
    const allExpanded = {};
    verticais.forEach(v => { allExpanded[v.id] = true; });
    setExpandedSections(allExpanded);
  }

  function collapseAll() {
    const allCollapsed = {};
    verticais.forEach(v => { allCollapsed[v.id] = false; });
    setExpandedSections(allCollapsed);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await persistRespostas(true);
    } catch (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalizar() {
    const totalPerguntasObrigatorias = perguntasObrigatorias.length;
    const totalPerguntasVerticais = verticais.reduce((acc, v) => acc + (v.perguntas?.length || 0), 0);
    const totalPerguntas = totalPerguntasObrigatorias + totalPerguntasVerticais;
    
    const respondidasObrigatorias = Object.values(respostasObrigatorias).filter((r) => r.pontuacao !== null).length;
    const respondidasVerticais = Object.values(respostasVerticais).filter((r) => r.pontuacao !== null).length;
    const respondidas = respondidasObrigatorias + respondidasVerticais;
    
    if (respondidasObrigatorias < totalPerguntasObrigatorias) {
      toast.info(
        `Responda todas as ${totalPerguntasObrigatorias} perguntas obrigatórias de Transformação Agêntica antes de finalizar. Você respondeu ${respondidasObrigatorias}.`
      );
      return;
    }
    
    if (respondidas < totalPerguntas) {
      if (!confirm(`Você respondeu ${respondidas} de ${totalPerguntas} perguntas. Deseja finalizar mesmo assim?`)) {
        return;
      }
    } else {
      if (!confirm('Deseja finalizar a avaliação? Após finalizada, não será possível alterar as respostas.')) {
        return;
      }
    }

    setSaving(true);
    try {
      await persistRespostas(false);
      await avaliacoesProdutoApi.finalizar(id);
      navigate(`/dashboard/produto/${avaliacao.produto.id}`);
    } catch (error) {
      toast.error('Erro ao finalizar: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function getProgressoTotal() {
    const totalPerguntasObrigatorias = perguntasObrigatorias.length;
    const totalPerguntasVerticais = verticais.reduce((acc, v) => acc + (v.perguntas?.length || 0), 0);
    const totalPerguntas = totalPerguntasObrigatorias + totalPerguntasVerticais;
    
    const respondidasObrigatorias = Object.values(respostasObrigatorias).filter((r) => r.pontuacao !== null).length;
    const respondidasVerticais = Object.values(respostasVerticais).filter((r) => r.pontuacao !== null).length;
    const respondidas = respondidasObrigatorias + respondidasVerticais;
    
    return { 
      respondidas, 
      total: totalPerguntas, 
      percentual: totalPerguntas > 0 ? Math.round((respondidas / totalPerguntas) * 100) : 0,
      obrigatorias: { respondidas: respondidasObrigatorias, total: totalPerguntasObrigatorias },
      verticais: { respondidas: respondidasVerticais, total: totalPerguntasVerticais }
    };
  }

  function getProgressoObrigatorias() {
    const total = perguntasObrigatorias.length;
    const respondidas = Object.values(respostasObrigatorias).filter((r) => r.pontuacao !== null).length;
    return { respondidas, total };
  }

  function getProgressoVertical(vertical) {
    const perguntas = vertical.perguntas || [];
    const respondidas = perguntas.filter(p => {
      const resposta = getRespostaForPerguntaVertical(p.id);
      return resposta && respostasVerticais[resposta.id]?.pontuacao !== null;
    }).length;
    return { respondidas, total: perguntas.length };
  }

  const getScoreLabel = (score) => {
    switch (score) {
      case 1: return 'Discordo totalmente / Não se aplica';
      case 2: return 'Discordo parcialmente';
      case 3: return 'Neutro / Moderado';
      case 4: return 'Concordo parcialmente';
      case 5: return 'Concordo totalmente / Alta aplicação';
      default: return '';
    }
  };

  const getCategoriaColor = (categoria) => {
    if (categoria?.includes('ROI')) return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
    if (categoria?.includes('Automação')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    if (categoria?.includes('APIs')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  const getCategoriaObrigatoriaColor = (categoria) => {
    if (categoria?.includes('Maturidade')) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300';
    if (categoria?.includes('Redução')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
    if (categoria?.includes('ROI')) return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
    if (categoria?.includes('Integração')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
    if (categoria?.includes('Escalabilidade')) return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300';
    if (categoria?.includes('Governança')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
    if (categoria?.includes('Aprendizado')) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300';
    if (categoria?.includes('Experiência')) return 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  const getPesoLabel = (peso) => {
    return `${Math.round(peso * 100)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!avaliacao) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Avaliação não encontrada</h2>
        <Link to="/produtos" className="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
          Voltar para produtos
        </Link>
      </div>
    );
  }

  const progresso = getProgressoTotal();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/produtos/${avaliacao.produto?.id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Avaliação de Relevância por Vertical</h1>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Package className="w-4 h-4" />
              <span>{avaliacao.produto?.nome}</span>
              <span>•</span>
              <span>{avaliacao.produto?.projeto?.empresa?.nome}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {lastSavedAt && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Salvo automaticamente às{' '}
              {lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={handleFinalizar}
            disabled={saving}
            className="btn btn-success flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Finalizar
          </button>
          </div>
        </div>
      </div>

      {/* Framework Info */}
      <div className="card bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Bot className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Avaliação de Transformação Agêntica + Verticais</h2>
        </div>
        <p className="text-indigo-100 text-sm">
          Esta avaliação possui <strong>{progresso.obrigatorias.total} perguntas obrigatórias universais</strong> de Transformação Agêntica 
          (que se aplicam a qualquer produto) + <strong>{progresso.verticais.total} perguntas específicas</strong> das verticais selecionadas. 
          Total: {progresso.total} perguntas.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso Geral</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {progresso.respondidas} de {progresso.total} perguntas ({progresso.percentual}%)
            </span>
            <div className="flex gap-2 text-xs">
              <button onClick={expandAll} className="text-primary-600 hover:underline">Expandir todas</button>
              <span className="text-gray-300">|</span>
              <button onClick={collapseAll} className="text-gray-500 hover:underline">Recolher todas</button>
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progresso.percentual}%` }}
          />
        </div>
      </div>

      {/* Perguntas Obrigatórias Universais - Transformação Agêntica */}
      {perguntasObrigatorias.length > 0 && (
        <div className="card border-2 border-indigo-200 dark:border-indigo-800">
          <button
            onClick={() => setShowObrigatorias(!showObrigatorias)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getProgressoObrigatorias().respondidas === getProgressoObrigatorias().total ? 'bg-green-100 dark:bg-green-900/50' : 'bg-indigo-100 dark:bg-indigo-900/50'}`}>
                <Zap className={`w-6 h-6 ${getProgressoObrigatorias().respondidas === getProgressoObrigatorias().total ? 'text-green-600' : 'text-indigo-600'}`} />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  🎯 Transformação Agêntica
                  <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 px-2 py-0.5 rounded-full">OBRIGATÓRIO</span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getProgressoObrigatorias().respondidas}/{getProgressoObrigatorias().total} respondidas
                  {getProgressoObrigatorias().respondidas === getProgressoObrigatorias().total && <span className="text-green-500 ml-2">✓ Completa</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressoObrigatorias().respondidas === getProgressoObrigatorias().total ? 'bg-green-500' : 'bg-indigo-500'}`}
                  style={{ width: `${(getProgressoObrigatorias().respondidas / getProgressoObrigatorias().total) * 100}%` }}
                />
              </div>
              {showObrigatorias ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>

          {showObrigatorias && (
            <div className="space-y-6 pt-6 mt-4 border-t dark:border-gray-700">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-4">
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  <strong>Estas 8 perguntas universais</strong> avaliam a capacidade de Transformação Agêntica do projeto - 
                  uso de Multi-Agent Systems (Agentes de IA autônomos) para automatizar processos complexos, reduzir custos e gerar valor exponencial.
                  <strong> Todas devem ser respondidas.</strong>
                </p>
              </div>
              
              {perguntasObrigatorias.map((pergunta) => {
                const resposta = getRespostaForPerguntaObrigatoria(pergunta.id);
                if (!resposta) return null;
                
                const respostaAtual = respostasObrigatorias[resposta.id] || {};

                return (
                  <div key={pergunta.id} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3 mb-4 flex-wrap">
                      <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${getCategoriaObrigatoriaColor(pergunta.categoria)}`}>
                        {pergunta.categoria}
                      </span>
                      <span className="flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        Peso: {getPesoLabel(pergunta.peso)}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium mb-3">{pergunta.texto}</p>
                    
                    {pergunta.criterios && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg mb-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Critérios de pontuação:</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line">{pergunta.criterios}</p>
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Pontuação (1-5):
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((nota) => (
                          <button
                            key={nota}
                            onClick={() => handlePontuacaoObrigatoria(resposta.id, nota)}
                            className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                              respostaAtual.pontuacao === nota
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-600'
                            }`}
                          >
                            <span className="text-2xl font-bold">{nota}</span>
                            <span className="text-xs mt-1 text-center leading-tight">
                              {nota === 1 && 'Não'}
                              {nota === 2 && 'Baixo'}
                              {nota === 3 && 'Moderado'}
                              {nota === 4 && 'Signif.'}
                              {nota === 5 && 'Total'}
                            </span>
                          </button>
                        ))}
                      </div>
                      {respostaAtual.pontuacao && (
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
                          {getScoreLabel(respostaAtual.pontuacao)}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Observações (opcional):
                      </label>
                      <textarea
                        className="input"
                        rows={2}
                        placeholder="Adicione observações, evidências ou justificativas..."
                        value={respostaAtual.observacoes || ''}
                        onChange={(e) => handleObservacaoObrigatoria(resposta.id, e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Perguntas por Vertical */}
      {verticais.length > 0 && (
        <div className="flex items-center gap-2 mt-6 mb-2">
          <Target className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Perguntas por Vertical Selecionada</h2>
        </div>
      )}
      
      {verticais.map((vertical) => {
        const progressoVertical = getProgressoVertical(vertical);
        const isComplete = progressoVertical.respondidas === progressoVertical.total;

        return (
          <div key={vertical.id} className="card">
            <button
              onClick={() => toggleSection(vertical.id)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-100 dark:bg-green-900/50' : 'bg-purple-100 dark:bg-purple-900/50'}`}>
                  <span className="text-2xl">{vertical.icone}</span>
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {vertical.nome}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {progressoVertical.respondidas}/{progressoVertical.total} respondidas
                    {isComplete && <span className="text-green-500 ml-2">✓ Completa</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${isComplete ? 'bg-green-500' : 'bg-purple-500'}`}
                    style={{ width: `${(progressoVertical.respondidas / progressoVertical.total) * 100}%` }}
                  />
                </div>
                {expandedSections[vertical.id] ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {expandedSections[vertical.id] && (
              <div className="space-y-6 pt-6 mt-4 border-t dark:border-gray-700">
                {vertical.perguntas?.map((pergunta) => {
                  const resposta = getRespostaForPerguntaVertical(pergunta.id);
                  if (!resposta) return null;
                  
                  const respostaAtual = respostasVerticais[resposta.id] || {};

                  return (
                    <div key={pergunta.id} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3 mb-4">
                        <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${getCategoriaColor(pergunta.categoria)}`}>
                          {pergunta.categoria}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium mb-4">{pergunta.texto}</p>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Pontuação (1-5):
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {[1, 2, 3, 4, 5].map((nota) => (
                            <button
                              key={nota}
                              onClick={() => handlePontuacaoVertical(resposta.id, nota)}
                              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                                respostaAtual.pontuacao === nota
                                  ? 'bg-purple-100 dark:bg-purple-900/50 border-purple-500 text-purple-700 dark:text-purple-300'
                                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600'
                              }`}
                            >
                              <span className="text-2xl font-bold">{nota}</span>
                              <span className="text-xs mt-1 text-center leading-tight">
                                {nota === 1 && 'Discordo'}
                                {nota === 2 && 'Parcial'}
                                {nota === 3 && 'Neutro'}
                                {nota === 4 && 'Concordo'}
                                {nota === 5 && 'Total'}
                              </span>
                            </button>
                          ))}
                        </div>
                        {respostaAtual.pontuacao && (
                          <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                            {getScoreLabel(respostaAtual.pontuacao)}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Observações (opcional):
                        </label>
                        <textarea
                          className="input"
                          rows={2}
                          placeholder="Adicione observações, evidências ou justificativas..."
                          value={respostaAtual.observacoes || ''}
                          onChange={(e) => handleObservacaoVertical(resposta.id, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Final Actions */}
      <div className="flex items-center justify-between">
        <Link
          to={`/produtos/${avaliacao.produto?.id}`}
          className="btn btn-secondary"
        >
          Voltar ao Produto
        </Link>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Progresso
          </button>
          <button
            onClick={handleFinalizar}
            disabled={saving}
            className="btn btn-success flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Finalizar Avaliação
          </button>
        </div>
      </div>
    </div>
  );
}

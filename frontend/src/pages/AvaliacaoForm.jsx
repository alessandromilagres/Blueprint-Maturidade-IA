import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, ChevronLeft, ChevronRight, Info, HelpCircle, X, AlertTriangle, Eye, PlayCircle } from 'lucide-react';
import { avaliacoesApi, areasApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import DesejosIaAvaliacaoMaturidade from '../components/DesejosIaAvaliacaoMaturidade.jsx';
import { DESEJOS_IA_EMPTY, mergeDesejosFromApi } from '../constants/desejosIaAvaliacaoMaturidade.js';
import { buscarEsclarecimentoAvaliacaoMaturidade } from '../constants/esclarecimentosAvaliacaoMaturidade.js';

function gerarExplicacaoPergunta(pergunta, area) {
  const codigo = area?.ordem && pergunta?.numero ? `${area.ordem}.${pergunta.numero}` : null;
  const enriquecida = codigo ? buscarEsclarecimentoAvaliacaoMaturidade(codigo) : null;

  return {
    area: area?.nome,
    oQueAvalia:
      enriquecida?.oQueAvalia ||
      'Esta pergunta avalia um aspecto específico da maturidade em IA da organização. Considere evidências concretas e responda de acordo com a realidade observada.',
    exemplosPorVertical: enriquecida?.exemplosPorVertical || [],
  };
}

export default function AvaliacaoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAvaliador } = useAuth();
  const toast = useToast();
  const [avaliacao, setAvaliacao] = useState(null);
  const [areas, setAreas] = useState([]);
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [respostas, setRespostas] = useState({});
  /** IDs de área que o avaliador indicou não estar apto a responder — excluídas dos cálculos no servidor */
  const [areasRecusadas, setAreasRecusadas] = useState([]);
  const [desejosIA, setDesejosIA] = useState(() => ({ ...DESEJOS_IA_EMPTY }));
  /** E-mail de conclusão: incluir ou não o bloco Desejos IA (se houver respostas salvas). */
  const [incluirDesejosIaNoEmail, setIncluirDesejosIaNoEmail] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const perguntasContainerRef = useRef(null);
  const [ajudaAberta, setAjudaAberta] = useState(null);
  const [onboardingFechado, setOnboardingFechado] = useState(false);
  const [revisaoAberta, setRevisaoAberta] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const draftKey = id ? `blueprint_aval_mat_${id}` : null;
  const onboardingKey = id ? `blueprint_onboarding_mat_${id}` : null;

  useEffect(() => {
    if (!onboardingKey) return;
    setOnboardingFechado(localStorage.getItem(onboardingKey) === 'ok');
  }, [onboardingKey]);

  useEffect(() => {
    if (!draftKey || loading || !avaliacao) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({ ts: Date.now(), respostas, areasRecusadas, desejosIA, currentAreaIndex })
        );
      } catch {
        /* ignore quota */
      }
    }, 900);
    return () => clearTimeout(t);
  }, [draftKey, respostas, areasRecusadas, desejosIA, currentAreaIndex, loading, avaliacao]);

  async function loadData() {
    setLoadError(null);
    try {
      const [avaliacaoData, areasData] = await Promise.all([
        avaliacoesApi.buscar(id),
        areasApi.listar(),
      ]);
      
      setAvaliacao(avaliacaoData);
      
      const areasSelecionadas = avaliacaoData.areasSelecionadas 
        ? JSON.parse(avaliacaoData.areasSelecionadas) 
        : areasData.map(a => a.id);
      
      const areasFiltradas = areasData.filter(a => areasSelecionadas.includes(a.id));
      setAreas(areasFiltradas);

      let recIds = [];
      if (avaliacaoData.areasRecusadas) {
        try {
          const parsed = JSON.parse(avaliacaoData.areasRecusadas);
          recIds = Array.isArray(parsed)
            ? parsed.map((x) => parseInt(x, 10)).filter((n) => !Number.isNaN(n))
            : [];
        } catch {
          recIds = [];
        }
      }
      const respostasMap = {};
      avaliacaoData.respostas.forEach((r) => {
        respostasMap[r.id] = {
          id: r.id,
          pontuacao: r.pontuacao,
          semInformacao: r.semInformacao === true,
          observacoes: r.observacoes || '',
        };
      });

      let respostasIniciais = respostasMap;
      let areasRecusadasIniciais = recIds;
      let desejosIniciais = mergeDesejosFromApi(avaliacaoData.desejosIA);
      let areaIndexRascunho = null;
      try {
        const rawDraft = draftKey ? localStorage.getItem(draftKey) : null;
        const draft = rawDraft ? JSON.parse(rawDraft) : null;
        const serverUpdatedAt = avaliacaoData.updatedAt ? new Date(avaliacaoData.updatedAt).getTime() : 0;
        if (draft?.ts && draft.ts > serverUpdatedAt) {
          if (draft.respostas && typeof draft.respostas === 'object') {
            respostasIniciais = { ...respostasMap, ...draft.respostas };
          }
          if (Array.isArray(draft.areasRecusadas)) {
            areasRecusadasIniciais = draft.areasRecusadas;
          }
          if (draft.desejosIA && typeof draft.desejosIA === 'object') {
            desejosIniciais = mergeDesejosFromApi(draft.desejosIA);
          }
          if (Number.isInteger(draft.currentAreaIndex)) {
            areaIndexRascunho = draft.currentAreaIndex;
          }
        }
      } catch {
        /* ignora rascunho local inválido */
      }

      setAreasRecusadas(areasRecusadasIniciais);
      setRespostas(respostasIniciais);
      setDesejosIA(desejosIniciais);
      setCurrentAreaIndex(
        resolverAreaInicial(areasFiltradas, avaliacaoData.respostas, respostasIniciais, areasRecusadasIniciais, areaIndexRascunho)
      );
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoadError(error.message || 'Erro desconhecido');
      toast.error('Não foi possível carregar a avaliação. ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  }

  /** Persiste respostas no servidor e sincroniza estado local (scores atualizados). */
  async function persistRespostas(showSuccessToast) {
    const respostasArray = Object.values(respostas);
    const atualizada = await avaliacoesApi.salvarRespostas(id, respostasArray, areasRecusadas, desejosIA);
    const aviso = atualizada.avisoDesejosIa;
    if (aviso) {
      toast.info(aviso);
    }
    const { avisoDesejosIa: _aviso, ...avaliacaoSemAviso } = atualizada;
    setAvaliacao((prev) => {
      const base = { ...avaliacaoSemAviso };
      if (!Array.isArray(base.respostas) && prev && Array.isArray(prev.respostas)) {
        base.respostas = prev.respostas;
      }
      if (!base.projeto && prev?.projeto) {
        base.projeto = prev.projeto;
      }
      if (!base.usuario && prev?.usuario) {
        base.usuario = prev.usuario;
      }
      return base;
    });
    const respostasParaMap = Array.isArray(avaliacaoSemAviso.respostas)
      ? avaliacaoSemAviso.respostas
      : Array.isArray(atualizada.respostas)
        ? atualizada.respostas
        : avaliacao?.respostas ?? [];
    const respostasMap = {};
    respostasParaMap.forEach((r) => {
      respostasMap[r.id] = {
        id: r.id,
        pontuacao: r.pontuacao,
        semInformacao: r.semInformacao === true,
        observacoes: r.observacoes || '',
      };
    });
    setRespostas(respostasMap);
    setDesejosIA(aviso ? desejosIA : mergeDesejosFromApi(avaliacaoSemAviso.desejosIA));
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

  function getRespostaByPergunta(perguntaId) {
    return avaliacao?.respostas.find((r) => r.perguntaId === perguntaId);
  }

  function respostaPreenchida(respostaAtual) {
    return (
      respostaAtual &&
      (respostaAtual.semInformacao === true ||
        (respostaAtual.pontuacao !== null && respostaAtual.pontuacao !== undefined))
    );
  }

  function resolverAreaInicial(areasLista, respostasBase, respostasAtuais, recusadas, indiceRascunho) {
    if (Number.isInteger(indiceRascunho) && indiceRascunho >= 0 && indiceRascunho <= areasLista.length) {
      return indiceRascunho;
    }

    const primeiraPendente = areasLista.findIndex((area) => {
      if (recusadas.includes(area.id)) return false;
      return area.perguntas.some((pergunta) => {
        const resposta = respostasBase.find((r) => r.perguntaId === pergunta.id);
        return !respostaPreenchida(resposta ? respostasAtuais[resposta.id] : null);
      });
    });

    return primeiraPendente >= 0 ? primeiraPendente : 0;
  }

  function handlePontuacaoChange(respostaId, pontuacao) {
    setRespostas((prev) => ({
      ...prev,
      [respostaId]: {
        ...prev[respostaId],
        pontuacao: pontuacao,
        semInformacao: false,
      },
    }));
  }

  function handleSemInformacaoChange(respostaId, marcado) {
    setRespostas((prev) => ({
      ...prev,
      [respostaId]: {
        ...prev[respostaId],
        pontuacao: marcado ? null : prev[respostaId]?.pontuacao ?? null,
        semInformacao: marcado,
      },
    }));
  }

  function handleObservacaoChange(respostaId, observacoes) {
    setRespostas((prev) => ({
      ...prev,
      [respostaId]: {
        ...prev[respostaId],
        observacoes: observacoes,
      },
    }));
  }

  function toggleAreaRecusada(areaId, marcado) {
    setAreasRecusadas((prev) => {
      if (marcado) {
        return [...new Set([...prev, areaId])];
      }
      return prev.filter((id) => id !== areaId);
    });

    if (marcado) {
      const area = areas.find((a) => a.id === areaId);
      if (!area || !avaliacao?.respostas) return;
      setRespostas((prev) => {
        const next = { ...prev };
        area.perguntas.forEach((p) => {
          const r = avaliacao.respostas.find((x) => x.perguntaId === p.id);
          if (r && next[r.id]) {
            next[r.id] = { ...next[r.id], pontuacao: null, semInformacao: false, observacoes: '' };
          }
        });
        return next;
      });
    }
  }

  function handleFinalizar() {
    const resumo = getResumoRevisao();
    if (resumo.total === 0) {
      toast.info(
        'Não há nenhum grupo disponível para responder (todos foram marcados como não aptos). Ajuste as opções ou fale com o gestor do projeto.'
      );
      return;
    }
    setRevisaoAberta(true);
  }

  async function handleConfirmarFinalizacao() {
    const resumo = getResumoRevisao();
    if (resumo.total === 0) {
      toast.info(
        'Não há nenhum grupo disponível para responder (todos foram marcados como não aptos). Ajuste as opções ou fale com o gestor do projeto.'
      );
      return;
    }

    setSaving(true);
    try {
      await persistRespostas(false);
      await avaliacoesApi.finalizar(id, { incluirDesejosIaNoEmail });
      // Avaliadores veem apenas a tela simplificada (sem plano de ação).
      // Admins/gestores continuam indo direto para o relatório completo.
      if (isAvaliador && isAvaliador()) {
        navigate(`/avaliacao-concluida/${id}`);
      } else {
        navigate(`/relatorios/${id}`);
      }
    } catch (error) {
      toast.error('Erro ao finalizar: ' + error.message);
    } finally {
      setSaving(false);
      setRevisaoAberta(false);
    }
  }

  function getProgressoArea(area) {
    const perguntasArea = area.perguntas;
    if (areasRecusadas.includes(area.id)) {
      return { respondidas: perguntasArea.length, total: perguntasArea.length };
    }
    const respondidasArea = perguntasArea.filter((p) => {
      const resposta = getRespostaByPergunta(p.id);
      const atual = resposta ? respostas[resposta.id] : null;
      return atual && (atual.semInformacao === true || (atual.pontuacao !== null && atual.pontuacao !== undefined));
    }).length;
    return { respondidas: respondidasArea, total: perguntasArea.length };
  }

  function getProgressoTotal() {
    const total = areas.reduce(
      (acc, area) =>
        acc + (areasRecusadas.includes(area.id) ? 0 : area.perguntas.length),
      0
    );
    const respondidas = areas.reduce((acc, area) => {
      if (areasRecusadas.includes(area.id)) return acc;
      const n = area.perguntas.filter((p) => {
        const resposta = getRespostaByPergunta(p.id);
        const atual = resposta ? respostas[resposta.id] : null;
        return atual && (atual.semInformacao === true || (atual.pontuacao !== null && atual.pontuacao !== undefined));
      }).length;
      return acc + n;
    }, 0);
    const percentual =
      total > 0 ? Math.round((respondidas / total) * 100) : 0;
    return { respondidas, total, percentual };
  }

  function getResumoRevisao() {
    const areasResumo = areas.map((area) => {
      const recusada = areasRecusadas.includes(area.id);
      const total = recusada ? 0 : area.perguntas.length;
      const respondidas = recusada
        ? 0
        : area.perguntas.filter((p) => {
            const resposta = getRespostaByPergunta(p.id);
            const atual = resposta ? respostas[resposta.id] : null;
            return respostaPreenchida(atual);
          }).length;
      const semInformacao = recusada
        ? 0
        : area.perguntas.filter((p) => {
            const resposta = getRespostaByPergunta(p.id);
            const atual = resposta ? respostas[resposta.id] : null;
            return atual?.semInformacao === true;
          }).length;
      return {
        id: area.id,
        nome: area.nome,
        recusada,
        total,
        respondidas,
        pendentes: Math.max(total - respondidas, 0),
        semInformacao,
      };
    });
    const total = areasResumo.reduce((acc, area) => acc + area.total, 0);
    const respondidas = areasResumo.reduce((acc, area) => acc + area.respondidas, 0);
    const pendentes = areasResumo.reduce((acc, area) => acc + area.pendentes, 0);
    const recusadas = areasResumo.filter((area) => area.recusada).length;
    const semInformacao = areasResumo.reduce((acc, area) => acc + area.semInformacao, 0);
    return {
      areasResumo,
      total,
      respondidas,
      pendentes,
      recusadas,
      semInformacao,
      percentual: total > 0 ? Math.round((respondidas / total) * 100) : 0,
    };
  }

  function fecharOnboarding() {
    setOnboardingFechado(true);
    try {
      if (onboardingKey) localStorage.setItem(onboardingKey, 'ok');
    } catch {
      /* ignore quota */
    }
  }

  function scrollToPerguntas() {
    setTimeout(() => {
      if (perguntasContainerRef.current) {
        perguntasContainerRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  }

  async function handleAreaChange(newIndex) {
    if (newIndex === currentAreaIndex) return;
    if (newIndex < 0 || newIndex > areas.length) return;
    setSaving(true);
    try {
      const indoParaDesejos = newIndex === areas.length;
      try {
        await persistRespostas(false);
      } catch (persistErr) {
        if (indoParaDesejos) {
          console.warn('[AvaliacaoForm] persist ao abrir Desejos IA:', persistErr);
          toast.info(
            'A aba Desejos IA foi aberta, mas o servidor não confirmou o salvamento agora. Use Salvar ou verifique a conexão. ' +
              (persistErr?.message || '')
          );
        } else {
          throw persistErr;
        }
      }
      setCurrentAreaIndex(newIndex);
      scrollToPerguntas();
    } catch (error) {
      toast.error(
        'Não foi possível salvar o progresso antes de trocar de área. Suas respostas permanecem nesta tela — verifique a conexão e tente novamente. ' +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!avaliacao) {
    if (loadError) {
      return (
        <div className="text-center py-12 max-w-lg mx-auto px-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Não foi possível abrir esta avaliação
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm whitespace-pre-wrap">{loadError}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
            Se o erro citar a tabela <code className="text-xs">AvaliacaoDesejosIA</code>, execute as migrações no
            backend ou o endpoint <code className="text-xs">migrate-schema</code> para criar a tabela.
          </p>
          <Link to="/avaliacoes" className="text-primary-600 dark:text-primary-400 hover:underline mt-6 inline-block">
            Voltar para avaliações
          </Link>
        </div>
      );
    }
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Avaliação não encontrada</h2>
        <Link to="/avaliacoes" className="text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
          Voltar para avaliações
        </Link>
      </div>
    );
  }

  const currentArea = currentAreaIndex < areas.length ? areas[currentAreaIndex] : null;
  const isDesejosTab = currentAreaIndex >= areas.length;
  const progresso = getProgressoTotal();
  const resumoRevisao = getResumoRevisao();

  function desejosTabTemConteudo() {
    const d = desejosIA;
    return (
      (d.q1_escolhas && d.q1_escolhas.length > 0) ||
      (d.q1_outro && d.q1_outro.trim()) ||
      (d.q1_comentario && d.q1_comentario.trim()) ||
      (d.q2_dor && d.q2_dor.trim()) ||
      (d.q3 && d.q3.trim()) ||
      (d.q4 && d.q4.trim()) ||
      (d.q5 && d.q5.trim())
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/projetos/${avaliacao.projeto.id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Assessment de Maturidade em IA</h1>
            <p className="text-gray-600 dark:text-gray-400">{avaliacao.projeto.nome} - {avaliacao.projeto.empresa.nome}</p>
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

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso Geral</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{progresso.respondidas} de {progresso.total} perguntas ({progresso.percentual}%)</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progresso.percentual}%` }}
          />
        </div>
      </div>

      {!onboardingFechado && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/60 dark:bg-blue-950/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <PlayCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold text-blue-950 dark:text-blue-100">
                  Como responder esta avaliação
                </h2>
                <div className="mt-3 grid gap-3 text-sm text-blue-900 dark:text-blue-100 md:grid-cols-3">
                  <div>
                    <strong className="block">1. Use evidências reais</strong>
                    Responda pensando no que já acontece hoje, não no plano ideal.
                  </div>
                  <div>
                    <strong className="block">2. Marque sem informação</strong>
                    Se não souber avaliar uma pergunta, ela não entra na média.
                  </div>
                  <div>
                    <strong className="block">3. Pode parar e voltar</strong>
                    Seu progresso é salvo e o sistema retoma na dimensão pendente.
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={fecharOnboarding}
              className="self-start rounded-lg bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-100 dark:hover:bg-blue-900"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {areas.map((area, index) => {
          const areaProgresso = getProgressoArea(area);
          const isComplete = areaProgresso.respondidas === areaProgresso.total;
          const isCurrent = index === currentAreaIndex && !isDesejosTab;
          const recusada = areasRecusadas.includes(area.id);
          
          return (
            <button
              key={area.id}
              type="button"
              disabled={saving}
              onClick={() => handleAreaChange(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isCurrent
                  ? 'bg-primary-600 text-white'
                  : recusada
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60'
                  : isComplete
                  ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {area.nome}
              <span className={`ml-2 ${isCurrent ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'}`}>
                ({areaProgresso.respondidas}/{areaProgresso.total})
              </span>
            </button>
          );
        })}
        <button
          type="button"
          disabled={saving}
          onClick={() => handleAreaChange(areas.length)}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDesejosTab
              ? 'bg-primary-600 text-white'
              : desejosTabTemConteudo()
              ? 'bg-teal-100 text-teal-900 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-100 dark:hover:bg-teal-900/60'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Desejos IA
          <span className={`ml-2 ${isDesejosTab ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'}`}>
            (opcional)
          </span>
        </button>
      </div>

      <div className="card" ref={perguntasContainerRef}>
        {isDesejosTab ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Desejos IA</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Visão de futuro — complemento opcional ao assessment de maturidade.
            </p>
            <DesejosIaAvaliacaoMaturidade
              empresaNome={avaliacao.projeto?.empresa?.nome}
              value={desejosIA}
              onChange={setDesejosIA}
            />
            <label className="flex items-start gap-3 mt-6 p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/40 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={incluirDesejosIaNoEmail}
                onChange={(e) => setIncluirDesejosIaNoEmail(e.target.checked)}
              />
              <span className="text-sm text-gray-800 dark:text-gray-200">
                <strong>E-mail de conclusão:</strong> incluir as respostas do bloco Desejos IA (se houver), na mesma mensagem que resume as demais perguntas.
                {desejosTabTemConteudo() ? (
                  <span className="block text-gray-600 dark:text-gray-400 mt-1">
                    Você preencheu este bloco — desmarque se não quiser que essas respostas apareçam no e-mail.
                  </span>
                ) : (
                  <span className="block text-gray-600 dark:text-gray-400 mt-1">
                    Se salvar respostas aqui antes de finalizar, elas só vão no e-mail se esta opção estiver marcada.
                  </span>
                )}
              </span>
            </label>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{currentArea?.nome}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{currentArea?.descricao}</p>

            {currentArea && (
              <label className="flex items-start gap-3 p-4 mb-6 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={areasRecusadas.includes(currentArea.id)}
                  onChange={(e) => toggleAreaRecusada(currentArea.id, e.target.checked)}
                />
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  Não estou apto(a) a responder este grupo de perguntas. Se marcar, este grupo fica desabilitado e é desconsiderado nos resultados e médias.
                </span>
              </label>
            )}

            <div className={`space-y-8 ${currentArea && areasRecusadas.includes(currentArea.id) ? 'opacity-55 pointer-events-none select-none' : ''}`}>
              {currentArea?.perguntas.map((pergunta) => {
                const resposta = getRespostaByPergunta(pergunta.id);
                if (!resposta) return null;
                
                const respostaAtual = respostas[resposta.id] || {};
                const criterios = pergunta.criterios.split('\n');

                const explicacao = gerarExplicacaoPergunta(pergunta, currentArea);

                return (
                  <div key={pergunta.id} className="border-b border-gray-100 dark:border-gray-700 pb-8 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center font-semibold text-sm">
                        {pergunta.numero}
                      </span>
                      <p className="text-gray-900 dark:text-white font-medium pt-1 flex-1">{pergunta.texto}</p>
                    </div>

                    <div className="ml-11 mb-4">
                      <button
                        onClick={() => setAjudaAberta(ajudaAberta === pergunta.id ? null : pergunta.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>O que essa pergunta avalia?</span>
                      </button>

                      {ajudaAberta === pergunta.id && (
                        <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-fadeIn">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                                {explicacao.area}
                              </span>
                            </div>
                            <button
                              onClick={() => setAjudaAberta(null)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                            <div>
                              <p className="font-semibold">O que essa pergunta avalia</p>
                              <p className="mt-1">{explicacao.oQueAvalia}</p>
                            </div>
                            {explicacao.exemplosPorVertical.length > 0 && (
                              <div>
                                <p className="font-semibold">Exemplos por vertical</p>
                                <ul className="mt-1 list-disc space-y-1 pl-5">
                                  {explicacao.exemplosPorVertical.map((exemplo, idx) => (
                                    <li key={idx}>{exemplo}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-11">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <Info className="w-4 h-4" />
                          <span className="font-medium">Critérios de Pontuação:</span>
                        </div>
                        <div className="space-y-1">
                          {criterios.map((criterio, idx) => (
                            <p key={idx} className="text-sm text-gray-600 dark:text-gray-400">{criterio}</p>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pontuação:</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((nota) => (
                            <button
                              key={nota}
                              type="button"
                              disabled={respostaAtual.semInformacao === true}
                              onClick={() => handlePontuacaoChange(resposta.id, nota)}
                              className={`w-12 h-12 rounded-lg font-semibold text-lg transition-colors ${
                                respostaAtual.pontuacao === nota
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                              } disabled:cursor-not-allowed disabled:opacity-40`}
                            >
                              {nota}
                            </button>
                          ))}
                        </div>
                        <label className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
                          <input
                            type="checkbox"
                            className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                            checked={respostaAtual.semInformacao === true}
                            onChange={(e) => handleSemInformacaoChange(resposta.id, e.target.checked)}
                          />
                          <span>
                            Não tenho informação suficiente para responder esta pergunta.
                            <span className="block text-xs text-amber-800/80 dark:text-amber-100/80">
                              Ao marcar, esta pergunta fica sem pontuação e não entra na média deste grupo nem no score geral.
                            </span>
                          </span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observações:</label>
                        <textarea
                          className="input"
                          rows={2}
                          placeholder="Adicione observações ou evidências..."
                          value={respostaAtual.observacoes || ''}
                          onChange={(e) => handleObservacaoChange(resposta.id, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            handleAreaChange(isDesejosTab ? areas.length - 1 : Math.max(0, currentAreaIndex - 1))
          }
          disabled={(currentAreaIndex === 0 && !isDesejosTab) || saving}
          className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
          {isDesejosTab ? 'Voltar ao último grupo' : 'Área Anterior'}
        </button>
        
        {isDesejosTab ? (
          <button
            type="button"
            onClick={handleFinalizar}
            disabled={saving}
            className="btn btn-success flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Finalizar avaliação
          </button>
        ) : currentAreaIndex < areas.length - 1 ? (
          <button
            type="button"
            onClick={() => handleAreaChange(currentAreaIndex + 1)}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            Próxima área
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleAreaChange(areas.length)}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            Desejos IA (opcional)
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {revisaoAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  <Eye className="h-5 w-5 text-primary-600" />
                  Revisar antes de finalizar
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Após finalizar, suas respostas ficam bloqueadas para edição.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRevisaoAberta(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Respondidas</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {resumoRevisao.respondidas}/{resumoRevisao.total}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Progresso</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {resumoRevisao.percentual}%
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Sem informação</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {resumoRevisao.semInformacao}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Grupos recusados</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {resumoRevisao.recusadas}
                </p>
              </div>
            </div>

            {resumoRevisao.pendentes > 0 && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Ainda existem {resumoRevisao.pendentes} perguntas sem nota ou justificativa.</p>
                  <p className="mt-1">Você pode voltar e completar agora, ou finalizar sabendo que elas não entram no cálculo.</p>
                </div>
              </div>
            )}

            <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              {resumoRevisao.areasResumo.map((area) => (
                <div
                  key={area.id}
                  className="flex flex-col gap-2 border-b border-gray-100 p-4 last:border-b-0 dark:border-gray-700 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{area.nome}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {area.recusada
                        ? 'Marcada como não apto(a) a responder'
                        : `${area.respondidas} de ${area.total} respondidas`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {area.pendentes > 0 && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-100">
                        {area.pendentes} pendente(s)
                      </span>
                    )}
                    {area.semInformacao > 0 && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                        {area.semInformacao} sem informação
                      </span>
                    )}
                    {area.pendentes === 0 && !area.recusada && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-100">
                        Completa
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRevisaoAberta(false)}
                disabled={saving}
                className="btn btn-secondary"
              >
                Voltar para revisar
              </button>
              <button
                type="button"
                onClick={handleConfirmarFinalizacao}
                disabled={saving}
                className="btn btn-success flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {saving ? 'Finalizando...' : 'Confirmar finalização'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

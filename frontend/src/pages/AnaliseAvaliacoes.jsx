import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FolderKanban,
  GitBranch,
  HelpCircle,
  Loader2,
  Search,
  Users,
} from 'lucide-react';
import { avaliacoesApi, projetosApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ScoreBadge from '../components/ScoreBadge';

function criterioDaPontuacao(resposta) {
  if (resposta?.pontuacao == null || !resposta?.pergunta?.criterios) return '';
  return String(resposta.pergunta.criterios)
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean)[Number(resposta.pontuacao) - 1] || '';
}

function resumoRespostas(respostas = []) {
  const total = respostas.length;
  const comNota = respostas.filter((r) => r.pontuacao != null).length;
  const semInformacao = respostas.filter((r) => r.semInformacao === true).length;
  const pendentes = respostas.filter((r) => r.pontuacao == null && r.semInformacao !== true).length;
  const soma = respostas.reduce((acc, r) => acc + (r.pontuacao != null ? Number(r.pontuacao) : 0), 0);
  const media = comNota > 0 ? soma / comNota : 0;
  const progresso = total > 0 ? Math.round(((comNota + semInformacao) / total) * 100) : 0;
  return { total, comNota, semInformacao, pendentes, media, progresso };
}

function formatPeso(peso) {
  if (!Number.isFinite(peso)) return '-';
  return `${(peso * 100).toFixed(peso < 0.1 ? 1 : 0)}%`;
}

function calcularConsolidado(avaliacoesDetalhadas = []) {
  const dimensoesMap = new Map();
  const todasRespostas = [];

  avaliacoesDetalhadas.forEach((avaliacao) => {
    (avaliacao.respostas || []).forEach((resposta) => {
      todasRespostas.push(resposta);
      const area = resposta.pergunta?.area || {};
      const areaId = area.id ?? resposta.pergunta?.areaId ?? 'sem-area';
      const key = String(areaId);

      if (!dimensoesMap.has(key)) {
        dimensoesMap.set(key, {
          areaId,
          areaNome: area.nome || 'Sem dimensão',
          ordem: area.ordem ?? 999,
          peso: Number(area.peso ?? 1),
          respostas: [],
          avaliadores: new Set(),
        });
      }

      const dimensao = dimensoesMap.get(key);
      dimensao.respostas.push({ ...resposta, avaliacao });
      dimensao.avaliadores.add(avaliacao.id);
    });
  });

  const dimensoes = [...dimensoesMap.values()]
    .sort((a, b) => a.ordem - b.ordem)
    .map((dimensao) => {
      const resumo = resumoRespostas(dimensao.respostas);
      const peso = Number.isFinite(dimensao.peso) && dimensao.peso > 0 ? dimensao.peso : 1;
      const temNota = resumo.comNota > 0;
      return {
        ...dimensao,
        ...resumo,
        peso,
        qtdAvaliadores: dimensao.avaliadores.size,
        scorePonderado: temNota ? resumo.media * peso : 0,
        pesoConsiderado: temNota ? peso : 0,
      };
    });

  const resumoGeral = resumoRespostas(todasRespostas);
  const totalPesoConsiderado = dimensoes.reduce((acc, d) => acc + d.pesoConsiderado, 0);
  const totalPonderado = dimensoes.reduce((acc, d) => acc + d.scorePonderado, 0);
  const mediaPonderada = totalPesoConsiderado > 0 ? totalPonderado / totalPesoConsiderado : 0;

  return {
    dimensoes,
    resumoGeral,
    mediaPonderada,
    totalPesoConsiderado,
  };
}

function agruparRespostasPorDimensao(respostas = []) {
  const map = new Map();
  respostas
    .slice()
    .sort((a, b) => {
      const ordemA = a.pergunta?.area?.ordem ?? 999;
      const ordemB = b.pergunta?.area?.ordem ?? 999;
      if (ordemA !== ordemB) return ordemA - ordemB;
      return (a.pergunta?.numero ?? 0) - (b.pergunta?.numero ?? 0);
    })
    .forEach((resposta) => {
      const area = resposta.pergunta?.area || {};
      const areaId = area.id ?? resposta.pergunta?.areaId ?? 'sem-area';
      const key = String(areaId);
      if (!map.has(key)) {
        map.set(key, {
          areaId,
          areaNome: area.nome || 'Sem dimensão',
          respostas: [],
        });
      }
      map.get(key).respostas.push(resposta);
    });
  return [...map.values()];
}

export default function AnaliseAvaliacoes() {
  const [projetos, setProjetos] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [projetoId, setProjetoId] = useState('');
  const [versoesInfo, setVersoesInfo] = useState(null);
  const [versaoId, setVersaoId] = useState('');
  const [loadingVersoes, setLoadingVersoes] = useState(false);
  const [busca, setBusca] = useState('');
  const [idsSelecionados, setIdsSelecionados] = useState([]);
  const [detalhesPorId, setDetalhesPorId] = useState({});
  const [respostasAbertas, setRespostasAbertas] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingSelecionados, setLoadingSelecionados] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function carregarDados() {
      try {
        setLoading(true);
        const [projetosData, avaliacoesData] = await Promise.all([
          projetosApi.listar(),
          avaliacoesApi.listar(),
        ]);
        if (cancelled) return;
        setProjetos(Array.isArray(projetosData) ? projetosData : []);
        setAvaliacoes(Array.isArray(avaliacoesData) ? avaliacoesData : []);
      } catch (e) {
        if (!cancelled) setErro(e.message || 'Erro ao carregar avaliações');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    carregarDados();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setIdsSelecionados([]);
    setRespostasAbertas({});
    setVersaoId('');
    setVersoesInfo(null);
  }, [projetoId]);

  useEffect(() => {
    if (!projetoId) return undefined;
    let cancelled = false;
    async function carregarVersoesProjeto() {
      try {
        setLoadingVersoes(true);
        const data = await projetosApi.versoes(projetoId);
        if (cancelled) return;
        setVersoesInfo(data);
        const versoes = data?.versoes || [];
        const abertaComFinalizadas =
          data?.versaoAtual?.finalizadas > 0 ? data.versaoAtual : null;
        const ultimaComFinalizadas = versoes.find((versao) => Number(versao.finalizadas || 0) > 0);
        const versaoPreferida = abertaComFinalizadas || ultimaComFinalizadas || data?.versaoAtual || versoes[0];
        setVersaoId(versaoPreferida?.id ? String(versaoPreferida.id) : 'todas');
      } catch (e) {
        if (!cancelled) {
          setVersoesInfo(null);
          setVersaoId('');
          setErro(e.message || 'Erro ao carregar versões do projeto');
        }
      } finally {
        if (!cancelled) setLoadingVersoes(false);
      }
    }
    carregarVersoesProjeto();
    return () => {
      cancelled = true;
    };
  }, [projetoId]);

  useEffect(() => {
    setIdsSelecionados([]);
    setRespostasAbertas({});
  }, [versaoId]);

  useEffect(() => {
    const idsPendentes = idsSelecionados.filter((id) => !detalhesPorId[id]);
    if (idsPendentes.length === 0) return undefined;

    let cancelled = false;
    async function carregarSelecionados() {
      try {
        setLoadingSelecionados(true);
        setErro('');
        const detalhes = await Promise.all(idsPendentes.map((id) => avaliacoesApi.buscar(id)));
        if (cancelled) return;
        setDetalhesPorId((prev) => {
          const next = { ...prev };
          detalhes.forEach((detalhe) => {
            next[String(detalhe.id)] = detalhe;
          });
          return next;
        });
      } catch (e) {
        if (!cancelled) setErro(e.message || 'Erro ao carregar respostas dos avaliadores selecionados');
      } finally {
        if (!cancelled) setLoadingSelecionados(false);
      }
    }
    carregarSelecionados();
    return () => {
      cancelled = true;
    };
  }, [detalhesPorId, idsSelecionados]);

  const projetoSelecionado = projetos.find((p) => String(p.id) === String(projetoId));
  const versaoSelecionada = (versoesInfo?.versoes || []).find((v) => String(v.id) === String(versaoId));
  const escopoVersaoLabel = versaoSelecionada?.titulo || 'todas as versões';
  const avaliacaoIdsVersaoSelecionada = new Set(
    (versaoSelecionada?.avaliacaoFinalizadaIds || versaoSelecionada?.avaliacaoIds || []).map((id) => String(id))
  );

  const avaliacoesDoProjeto = useMemo(() => {
    if (!projetoId) return [];
    const q = busca.trim().toLowerCase();
    return avaliacoes
      .filter((a) => String(a.projeto?.id) === String(projetoId))
      .filter((a) => {
        if (versaoId === 'todas' || !versaoId) return true;
        if (avaliacaoIdsVersaoSelecionada.size > 0) {
          return avaliacaoIdsVersaoSelecionada.has(String(a.id));
        }
        return (
          String(a.projetoVersao?.id || '') === String(versaoId) ||
          String(a.projetoVersao?.numero || '') === String(versaoSelecionada?.numero || '') ||
          String(a.projetoVersao?.titulo || '').toLowerCase() ===
            String(versaoSelecionada?.titulo || '').toLowerCase()
        );
      })
      .filter((a) => a.status === 'finalizada')
      .filter((a) => {
        if (!q) return true;
        const u = a.usuario || {};
        return `${u.nome || ''} ${u.email || ''} ${u.cargo || ''}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (a.usuario?.nome || '').localeCompare(b.usuario?.nome || '', 'pt-BR'));
  }, [avaliacoes, busca, projetoId, versaoId, avaliacaoIdsVersaoSelecionada, versaoSelecionada]);
  const avaliacoesDetalhadasSelecionadas = idsSelecionados
    .map((id) => detalhesPorId[id])
    .filter(Boolean);
  const consolidado = calcularConsolidado(avaliacoesDetalhadasSelecionadas);
  const todosVisiveisMarcados =
    avaliacoesDoProjeto.length > 0 &&
    avaliacoesDoProjeto.every((a) => idsSelecionados.includes(String(a.id)));

  function toggleAvaliador(id) {
    const idStr = String(id);
    setIdsSelecionados((prev) =>
      prev.includes(idStr) ? prev.filter((item) => item !== idStr) : [...prev, idStr]
    );
  }

  function adicionarPeloCombo(id) {
    if (!id) return;
    const idStr = String(id);
    setIdsSelecionados((prev) => (prev.includes(idStr) ? prev : [...prev, idStr]));
  }

  function toggleTodosVisiveis() {
    const idsVisiveis = avaliacoesDoProjeto.map((a) => String(a.id));
    setIdsSelecionados((prev) => {
      if (idsVisiveis.every((id) => prev.includes(id))) {
        return prev.filter((id) => !idsVisiveis.includes(id));
      }
      return [...new Set([...prev, ...idsVisiveis])];
    });
  }

  function toggleRespostas(key) {
    setRespostasAbertas((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard de Avaliações
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Selecione um projeto, marque avaliações finalizadas e veja a média ponderada consolidada por dimensão.
        </p>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {erro}
        </div>
      )}

      <div className="card">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div>
            <label className="label">Projeto</label>
            <select
              className="input"
              value={projetoId}
              onChange={(e) => setProjetoId(e.target.value)}
              disabled={loading}
            >
              <option value="">{loading ? 'Carregando projetos...' : 'Selecione um projeto'}</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Versão da pesquisa</label>
            <select
              className="input"
              value={versaoId}
              onChange={(e) => setVersaoId(e.target.value)}
              disabled={!projetoId || loadingVersoes || !(versoesInfo?.versoes || []).length}
            >
              <option value="">
                {loadingVersoes ? 'Carregando versões...' : 'Selecione a versão'}
              </option>
              <option value="todas">Todas as versões</option>
              {(versoesInfo?.versoes || []).map((versao) => (
                <option key={versao.id} value={versao.id}>
                  {versao.titulo} · {versao.status} · {versao.finalizadas || 0} finalizada(s)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Adicionar avaliador pelo combo</label>
            <select
              className="input"
              value=""
              onChange={(e) => adicionarPeloCombo(e.target.value)}
              disabled={!projetoId || !versaoId || avaliacoesDoProjeto.length === 0}
            >
              <option value="">Marcar um avaliador finalizado</option>
              {avaliacoesDoProjeto.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.usuario?.nome || 'Sem nome'} · {a.usuario?.cargo || a.usuario?.email || 'sem cargo'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Buscar avaliador</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-9"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome, e-mail ou cargo"
                disabled={!projetoId || !versaoId}
              />
            </div>
          </div>
        </div>
      </div>

      {!projetoId && !loading && (
        <div className="card py-12 text-center">
          <FolderKanban className="mx-auto mb-4 h-14 w-14 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Selecione um projeto</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Os avaliadores com avaliação finalizada aparecem com checkbox depois da escolha do projeto.
          </p>
        </div>
      )}

      {loading && (
        <div className="card flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando avaliações...
        </div>
      )}

      {projetoId && !loading && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(380px,0.9fr)_minmax(0,1.4fr)]">
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <FolderKanban className="h-4 w-4" />
                    Projeto selecionado
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {projetoSelecionado?.nome || 'Projeto'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {projetoSelecionado?.empresa?.nome || ''}
                  </p>
                  {versaoSelecionada && (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
                      <GitBranch className="h-3 w-3" />
                      {versaoSelecionada.titulo} · {versaoSelecionada.status}
                    </p>
                  )}
                  {versaoId === 'todas' && (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      <GitBranch className="h-3 w-3" />
                      Todas as versões
                    </p>
                  )}
                </div>
                <div className="rounded-xl bg-primary-50 px-3 py-2 text-center dark:bg-primary-900/30">
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                    {idsSelecionados.length}
                  </p>
                  <p className="text-xs text-primary-700 dark:text-primary-300">finalizados marcados</p>
                </div>
              </div>
            </div>

            <div className="card overflow-hidden p-0">
              <div className="border-b px-5 py-4 dark:border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary-600" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                    Avaliadores finalizados do projeto
                    </h2>
                  </div>
                  {avaliacoesDoProjeto.length > 0 && (
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={todosVisiveisMarcados}
                        onChange={toggleTodosVisiveis}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600"
                      />
                      Marcar todos
                    </label>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Marque um ou mais avaliadores da versão selecionada para recalcular o consolidado.
                </p>
              </div>

              {avaliacoesDoProjeto.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma avaliação finalizada encontrada para {escopoVersaoLabel}.
                </div>
              ) : (
                <div className="max-h-[620px] overflow-y-auto">
                  {avaliacoesDoProjeto.map((avaliacao) => {
                    const marcado = idsSelecionados.includes(String(avaliacao.id));
                    return (
                      <label
                        key={avaliacao.id}
                        className={`block cursor-pointer border-b px-5 py-4 transition-colors last:border-b-0 dark:border-gray-700 ${
                          marcado
                            ? 'bg-primary-50 dark:bg-primary-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={() => toggleAvaliador(avaliacao.id)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {avaliacao.usuario?.nome || 'Sem nome'}
                                </p>
                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                  {avaliacao.usuario?.email}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  {avaliacao.usuario?.cargo || 'Cargo não informado'}
                                </p>
                                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                                  <GitBranch className="h-3 w-3" />
                                  {avaliacao.projetoVersao?.titulo || versaoSelecionada?.titulo || 'Versão 1'}
                                </p>
                              </div>
                              <StatusBadge status={avaliacao.status} />
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              {avaliacao.scoreGeral != null ? (
                                <ScoreBadge score={Number(avaliacao.scoreGeral)} nivel={avaliacao.nivelGeral} size="sm" />
                              ) : (
                                <span className="text-xs text-gray-400">Sem score</span>
                              )}
                              <span className="text-xs text-gray-400">#{avaliacao.id}</span>
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {idsSelecionados.length === 0 && (
              <div className="card py-12 text-center">
                <ClipboardCheck className="mx-auto mb-4 h-14 w-14 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Marque avaliadores para montar a média
                </h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                  O cálculo consolidado considera apenas as avaliações marcadas.
                </p>
              </div>
            )}

            {idsSelecionados.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="card">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avaliadores marcados</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                      {idsSelecionados.length}
                    </p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Média ponderada</p>
                    <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                      {consolidado.mediaPonderada.toFixed(2)}
                    </p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Perguntas com nota</p>
                    <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {consolidado.resumoGeral.comNota}
                    </p>
                  </div>
                  <div className="card">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sem informação</p>
                    <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {consolidado.resumoGeral.semInformacao}
                    </p>
                  </div>
                </div>

                {loadingSelecionados && (
                  <div className="card flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Recalculando avaliadores marcados...
                  </div>
                )}

                <div className="card">
                  <div className="mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Média ponderada consolidada por dimensão
                    </h2>
                  </div>
                  {versaoSelecionada && (
                    <p className="mb-4 inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
                      <GitBranch className="h-3 w-3" />
                      Análise da {versaoSelecionada.titulo} · {versaoSelecionada.status}
                    </p>
                  )}
                  {versaoId === 'todas' && (
                    <p className="mb-4 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      <GitBranch className="h-3 w-3" />
                      Análise considerando todas as versões
                    </p>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          <th className="py-2 pr-3 font-medium">Dimensão</th>
                          <th className="py-2 px-3 font-medium">Média</th>
                          <th className="py-2 px-3 font-medium">Peso</th>
                          <th className="py-2 px-3 font-medium">Score ponderado</th>
                          <th className="py-2 px-3 font-medium">Avaliadores</th>
                          <th className="py-2 px-3 font-medium">Com nota</th>
                          <th className="py-2 pl-3 font-medium">Sem info</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-gray-700">
                        {consolidado.dimensoes.map((d) => (
                          <tr key={d.areaId}>
                            <td className="py-3 pr-3 font-medium text-gray-900 dark:text-white">{d.areaNome}</td>
                            <td className="py-3 px-3">{d.comNota ? d.media.toFixed(2) : '-'}</td>
                            <td className="py-3 px-3">{formatPeso(d.peso)}</td>
                            <td className="py-3 px-3">{d.comNota ? d.scorePonderado.toFixed(3) : '-'}</td>
                            <td className="py-3 px-3">{d.qtdAvaliadores}</td>
                            <td className="py-3 px-3">{d.comNota}</td>
                            <td className="py-3 pl-3">{d.semInformacao}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Documento: perguntas e respostas por dimensão
                    </h2>
                  </div>

                  {consolidado.dimensoes.map((dimensao) => {
                    const keyDocumento = `documento-dimensao-${dimensao.areaId}`;
                    const aberta = respostasAbertas[keyDocumento] === true;
                    return (
                      <div key={dimensao.areaId} className="card">
                        <button
                          type="button"
                          onClick={() => toggleRespostas(keyDocumento)}
                          className="flex w-full items-center justify-between gap-4 text-left"
                        >
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {dimensao.areaNome}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {dimensao.respostas.length} resposta(s) · Média {dimensao.comNota ? dimensao.media.toFixed(2) : '-'} · {dimensao.qtdAvaliadores} avaliador(es)
                            </p>
                          </div>
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${aberta ? 'rotate-180' : ''}`} />
                        </button>

                        {aberta && (
                          <div className="mt-4 space-y-4">
                            {dimensao.respostas.map((resposta) => {
                              const semInfo = resposta.semInformacao === true;
                              const pendente = resposta.pontuacao == null && !semInfo;
                              const criterio = criterioDaPontuacao(resposta);
                              const avaliador = resposta.avaliacao?.usuario || {};
                              return (
                                <div
                                  key={`${resposta.avaliacao?.id}-${resposta.id}`}
                                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                                >
                                  <div className="mb-3 flex flex-col gap-2 border-b border-gray-100 pb-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {avaliador.nome || 'Avaliador'}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {avaliador.cargo || avaliador.email || 'Cargo não informado'}
                                      </p>
                                    </div>
                                    {semInfo ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                        <HelpCircle className="h-3.5 w-3.5" />
                                        Sem informação
                                      </span>
                                    ) : pendente ? (
                                      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-200">
                                        Pendente
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Nota {resposta.pontuacao}
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Pergunta {resposta.pergunta?.numero ?? '-'}
                                  </p>
                                  <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                    {resposta.pergunta?.texto || 'Pergunta não encontrada'}
                                  </p>

                                  {criterio && !semInfo && (
                                    <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:bg-blue-900/20 dark:text-blue-100">
                                      <strong>Resposta/critério selecionado:</strong> {criterio}
                                    </div>
                                  )}

                                  {resposta.observacoes ? (
                                    <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-700/50 dark:text-gray-200">
                                      <strong>Observação/evidência:</strong> {resposta.observacoes}
                                    </div>
                                  ) : (
                                    <p className="mt-3 text-xs text-gray-400">Sem observação registrada.</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Respostas dos avaliadores marcados
                    </h2>
                  </div>

                  {avaliacoesDetalhadasSelecionadas.map((avaliacao) => {
                    const keyAvaliador = `avaliador-${avaliacao.id}`;
                    const abertoAvaliador = respostasAbertas[keyAvaliador] === true;
                    const grupos = agruparRespostasPorDimensao(avaliacao.respostas || []);
                    return (
                      <div key={avaliacao.id} className="card">
                        <button
                          type="button"
                          onClick={() => toggleRespostas(keyAvaliador)}
                          className="flex w-full items-center justify-between gap-4 text-left"
                        >
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {avaliacao.usuario?.nome || 'Avaliador'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {avaliacao.usuario?.cargo || avaliacao.usuario?.email || ''} · clique para ver respostas
                            </p>
                          </div>
                          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${abertoAvaliador ? 'rotate-180' : ''}`} />
                        </button>

                        {abertoAvaliador && (
                          <div className="mt-4 space-y-3">
                            {grupos.map((grupo) => {
                              const keyDimensao = `${avaliacao.id}-${grupo.areaId}`;
                              const abertaDimensao = respostasAbertas[keyDimensao] === true;
                              const resumo = resumoRespostas(grupo.respostas);
                              return (
                                <div key={grupo.areaId} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                                  <button
                                    type="button"
                                    onClick={() => toggleRespostas(keyDimensao)}
                                    className="flex w-full items-center justify-between gap-4 text-left"
                                  >
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">{grupo.areaNome}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Média {resumo.comNota ? resumo.media.toFixed(2) : '-'} · {resumo.comNota} com nota · {resumo.semInformacao} sem informação
                                      </p>
                                    </div>
                                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${abertaDimensao ? 'rotate-180' : ''}`} />
                                  </button>

                                  {abertaDimensao && (
                                    <div className="mt-3 space-y-3">
                                      {grupo.respostas.map((resposta) => {
                                        const semInfo = resposta.semInformacao === true;
                                        const pendente = resposta.pontuacao == null && !semInfo;
                                        const criterio = criterioDaPontuacao(resposta);
                                        return (
                                          <div
                                            key={resposta.id}
                                            className={`rounded-xl border p-4 ${
                                              semInfo
                                                ? 'border-amber-200 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-900/15'
                                                : pendente
                                                  ? 'border-red-200 bg-red-50/70 dark:border-red-800 dark:bg-red-900/15'
                                                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                            }`}
                                          >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                              <div className="min-w-0 flex-1">
                                                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                                  Pergunta {resposta.pergunta?.numero ?? '-'}
                                                </p>
                                                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                                                  {resposta.pergunta?.texto || 'Pergunta não encontrada'}
                                                </p>
                                              </div>
                                              <div className="shrink-0">
                                                {semInfo ? (
                                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                                    <HelpCircle className="h-3.5 w-3.5" />
                                                    Sem informação
                                                  </span>
                                                ) : pendente ? (
                                                  <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-200">
                                                    Pendente
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Nota {resposta.pontuacao}
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            {criterio && !semInfo && (
                                              <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:bg-blue-900/20 dark:text-blue-100">
                                                <strong>Critério selecionado:</strong> {criterio}
                                              </div>
                                            )}

                                            {resposta.observacoes ? (
                                              <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-700/50 dark:text-gray-200">
                                                <strong>Observação/evidência:</strong> {resposta.observacoes}
                                              </div>
                                            ) : (
                                              <p className="mt-3 text-xs text-gray-400">Sem observação registrada.</p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Download, GitBranch, Lightbulb, Printer, Target, Users } from 'lucide-react';
import { dashboardApi } from '../services/api';

function baixarCsv(nomeArquivo, linhas) {
  const csv = linhas
    .map((linha) => linha.map((valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

const CRITICIDADE_STYLE = {
  critica: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
  alta: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100',
  media: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100'
};

export default function PlanoAcaoProjeto() {
  const { id } = useParams();
  const location = useLocation();
  const versaoIdSelecionada = new URLSearchParams(location.search).get('versaoId');
  const [dashboard, setDashboard] = useState(null);
  const [filtroNivel, setFiltroNivel] = useState(3);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function carregar() {
      try {
        setLoading(true);
        setErro('');
        const data = await dashboardApi.projeto(id, {
          nivelPrioridadeMapeamentoMaturidade: filtroNivel,
          versaoId: versaoIdSelecionada
        });
        if (!cancelled) setDashboard(data);
      } catch (error) {
        if (!cancelled) setErro(error.message || 'Não foi possível carregar o plano de ação.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    carregar();
    return () => {
      cancelled = true;
    };
  }, [id, filtroNivel, versaoIdSelecionada]);

  const plano = dashboard?.planoAcao || [];
  const resumo = useMemo(() => {
    const criticas = plano.filter((item) => item.criticidade === 'critica').length;
    const altas = plano.filter((item) => item.criticidade === 'alta').length;
    return { criticas, altas, total: plano.length };
  }, [plano]);

  function exportarCsv() {
    baixarCsv(`plano-acao-${dashboard?.projeto?.nome || id}.csv`, [
      ['Versão do projeto', 'Dimensão', 'Score', 'Nível', 'Criticidade', 'Responsável sugerido', 'Ações 30 dias', 'Ações 90 dias'],
      ...plano.map((item) => [
        dashboard?.projetoVersao?.titulo || 'Versão atual',
        item.area,
        item.score,
        item.nivel,
        item.criticidade,
        item.responsavelSugerido,
        (item.acoes30Dias || []).join(' | '),
        (item.acoes90Dias || []).join(' | ')
      ])
    ]);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">Erro ao carregar plano de ação</p>
        <p className="mt-1 text-sm">{erro}</p>
        <Link to={`/projetos/${id}`} className="mt-4 inline-flex text-sm font-medium underline">
          Voltar ao projeto
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between print:hidden">
        <div>
          <Link to={`/projetos/${id}`} className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao projeto
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <Lightbulb className="h-7 w-7 text-amber-500" />
            Plano de Ação Executivo
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {dashboard?.projeto?.nome} · {dashboard?.empresa?.nome}
          </p>
          {dashboard?.projetoVersao && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">
              <GitBranch className="h-3 w-3" />
              {dashboard.projetoVersao.titulo} · {dashboard.projetoVersao.status}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filtroNivel}
            onChange={(e) => setFiltroNivel(parseInt(e.target.value, 10))}
            className="input max-w-xs"
          >
            <option value={1}>Prioridade 1</option>
            <option value={2}>Prioridades 1 e 2</option>
            <option value={3}>Prioridades 1, 2 e 3</option>
          </select>
          <button type="button" onClick={exportarCsv} className="btn btn-secondary inline-flex items-center gap-2" disabled={plano.length === 0}>
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button type="button" onClick={() => window.print()} className="btn btn-secondary inline-flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Imprimir/PDF
          </button>
        </div>
      </div>

      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">Plano de Ação Executivo</h1>
        <p>{dashboard?.projeto?.nome} · {dashboard?.empresa?.nome}</p>
        {dashboard?.projetoVersao && <p>{dashboard.projetoVersao.titulo} · {dashboard.projetoVersao.status}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="flex items-center gap-3">
            <Target className="h-9 w-9 rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Dimensões priorizadas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumo.total}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-9 w-9 rounded-lg bg-red-100 p-2 text-red-700 dark:bg-red-900/40 dark:text-red-200" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Críticas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumo.criticas}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <Users className="h-9 w-9 rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avaliadores no consolidado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboard?.totalAvaliadores || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {plano.length === 0 ? (
        <div className="card text-center">
          <p className="font-medium text-gray-900 dark:text-white">Nenhuma dimensão crítica encontrada.</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            O plano é gerado para dimensões com score abaixo de 3,5.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {plano.map((item, index) => (
            <section key={item.areaId} className="card break-inside-avoid">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">Prioridade {index + 1}</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{item.area}</h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Score {Number(item.score).toFixed(1)} · {item.nivel} · Responsável sugerido: {item.responsavelSugerido}
                  </p>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${CRITICIDADE_STYLE[item.criticidade] || CRITICIDADE_STYLE.media}`}>
                  {item.criticidade}
                </span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Ações de 30 dias</h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {(item.acoes30Dias || []).map((acao) => (
                      <li key={acao} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span>{acao}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Ações de 90 dias</h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {(item.acoes90Dias || []).map((acao) => (
                      <li key={acao} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary-500" />
                        <span>{acao}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

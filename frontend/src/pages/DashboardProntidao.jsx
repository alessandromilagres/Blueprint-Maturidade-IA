import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, CheckCircle, ClipboardCheck, Download, FolderKanban, Gauge, Printer, TrendingUp, Users } from 'lucide-react';
import { projetosApi } from '../services/api';
import ScoreBadge from '../components/ScoreBadge';
import StatusBadge from '../components/StatusBadge';

function classificarProntidao(indice) {
  if (indice >= 80) return { label: 'Pronto para escalar', color: 'text-green-700 bg-green-100 dark:text-green-100 dark:bg-green-900/50' };
  if (indice >= 60) return { label: 'Em preparação', color: 'text-blue-700 bg-blue-100 dark:text-blue-100 dark:bg-blue-900/50' };
  if (indice >= 40) return { label: 'Atenção executiva', color: 'text-amber-700 bg-amber-100 dark:text-amber-100 dark:bg-amber-900/50' };
  return { label: 'Baixa prontidão', color: 'text-red-700 bg-red-100 dark:text-red-100 dark:bg-red-900/50' };
}

function calcularProjeto(projeto) {
  const avaliacoes = projeto.avaliacoes || [];
  const finalizadas = avaliacoes.filter((a) => a.status === 'finalizada');
  const scoresValidos = finalizadas
    .map((a) => Number(a.scoreGeral))
    .filter((score) => Number.isFinite(score) && score > 0);
  const scoreMedio =
    scoresValidos.length > 0
      ? scoresValidos.reduce((acc, score) => acc + score, 0) / scoresValidos.length
      : 0;
  const taxaConclusao = avaliacoes.length > 0 ? finalizadas.length / avaliacoes.length : 0;
  const indice = Math.round(((scoreMedio / 5) * 70 + taxaConclusao * 30) || 0);
  const classificacao = classificarProntidao(indice);
  const pendentes = avaliacoes.length - finalizadas.length;
  const riscos = [
    avaliacoes.length === 0 ? 'Sem avaliações criadas' : null,
    avaliacoes.length > 0 && taxaConclusao < 0.6 ? 'Baixa taxa de conclusão' : null,
    scoresValidos.length > 0 && scoreMedio < 3 ? 'Score médio abaixo de 3' : null,
  ].filter(Boolean);

  return {
    ...projeto,
    totalAvaliacoes: avaliacoes.length,
    finalizadas: finalizadas.length,
    pendentes,
    taxaConclusao,
    scoreMedio,
    indice,
    classificacao,
    riscos,
  };
}

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

export default function DashboardProntidao() {
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        setErro('');
        const lista = await projetosApi.listar();
        const detalhes = await Promise.all(lista.map((projeto) => projetosApi.buscar(projeto.id)));
        setProjetos(detalhes.map(calcularProjeto));
      } catch (error) {
        setErro(error.message || 'Não foi possível carregar o dashboard de prontidão.');
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  const resumo = useMemo(() => {
    const comDados = projetos.filter((p) => p.totalAvaliacoes > 0);
    const scoreMedio =
      comDados.length > 0
        ? comDados.reduce((acc, p) => acc + p.scoreMedio, 0) / comDados.length
        : 0;
    const indiceMedio =
      projetos.length > 0
        ? Math.round(projetos.reduce((acc, p) => acc + p.indice, 0) / projetos.length)
        : 0;
    const totalAvaliacoes = projetos.reduce((acc, p) => acc + p.totalAvaliacoes, 0);
    const finalizadas = projetos.reduce((acc, p) => acc + p.finalizadas, 0);
    const taxaConclusao = totalAvaliacoes > 0 ? finalizadas / totalAvaliacoes : 0;
    const prontos = projetos.filter((p) => p.indice >= 80).length;
    const atencao = projetos.filter((p) => p.indice < 60).length;

    return {
      scoreMedio,
      indiceMedio,
      totalAvaliacoes,
      finalizadas,
      taxaConclusao,
      prontos,
      atencao,
      classificacao: classificarProntidao(indiceMedio),
    };
  }, [projetos]);

  const projetosOrdenados = [...projetos].sort((a, b) => a.indice - b.indice);
  const prioridades = projetosOrdenados.filter((p) => p.riscos.length > 0).slice(0, 5);

  function exportarCsv() {
    baixarCsv('dashboard-prontidao.csv', [
      ['Projeto', 'Empresa', 'Prontidao', 'Classificacao', 'Score medio', 'Conclusao %', 'Finalizadas', 'Total avaliacoes', 'Riscos'],
      ...projetosOrdenados.map((p) => [
        p.nome,
        p.empresa?.nome || '',
        p.indice,
        p.classificacao.label,
        p.scoreMedio.toFixed(2),
        Math.round(p.taxaConclusao * 100),
        p.finalizadas,
        p.totalAvaliacoes,
        p.riscos.join(' | '),
      ]),
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
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
        <p className="font-medium">Não foi possível carregar o dashboard</p>
        <p className="mt-2 text-sm">{erro}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <Gauge className="h-7 w-7 text-primary-600" />
            Dashboard Executivo de Prontidão
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Visão consolidada para priorizar projetos prontos para escala e pontos que exigem ação executiva.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={exportarCsv} className="btn btn-secondary inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button type="button" onClick={() => window.print()} className="btn btn-secondary inline-flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Imprimir/PDF
          </button>
          <span className={`rounded-full px-4 py-2 text-sm font-semibold ${resumo.classificacao.color}`}>
            {resumo.classificacao.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <Gauge className="h-9 w-9 rounded-lg bg-primary-100 p-2 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Índice de prontidão</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumo.indiceMedio}%</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-9 w-9 rounded-lg bg-green-100 p-2 text-green-700 dark:bg-green-900/40 dark:text-green-200" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Score médio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumo.scoreMedio.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-9 w-9 rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Conclusão</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(resumo.taxaConclusao * 100)}%</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-9 w-9 rounded-lg bg-purple-100 p-2 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Projetos prontos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{resumo.prontos}/{projetos.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Prioridades Executivas
          </h2>
          {prioridades.length === 0 ? (
            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-100">
              Nenhum bloqueio crítico encontrado nos projetos avaliados.
            </div>
          ) : (
            <div className="space-y-3">
              {prioridades.map((projeto) => (
                <Link
                  key={projeto.id}
                  to={`/projetos/${projeto.id}`}
                  className="block rounded-xl border border-gray-200 p-4 transition hover:border-primary-300 hover:bg-primary-50/50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{projeto.nome}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{projeto.empresa?.nome}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                      {projeto.indice}%
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-200">
                    {projeto.riscos.join(' • ')}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Prontidão por Projeto</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{resumo.atencao} em atenção</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-3 font-medium">Projeto</th>
                  <th className="pb-3 font-medium">Empresa</th>
                  <th className="pb-3 font-medium">Prontidão</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Avaliações</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {projetosOrdenados.map((projeto) => (
                  <tr key={projeto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{projeto.nome}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {projeto.empresa?.nome}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${projeto.classificacao.color}`}>
                        {projeto.indice}% · {projeto.classificacao.label}
                      </span>
                    </td>
                    <td className="py-3">
                      {projeto.scoreMedio > 0 ? (
                        <ScoreBadge score={projeto.scoreMedio} size="sm" />
                      ) : (
                        <span className="text-sm text-gray-400">Sem score</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <Users className="h-4 w-4" />
                        {projeto.finalizadas}/{projeto.totalAvaliacoes}
                      </span>
                      <div className="mt-1">
                        <StatusBadge status={projeto.pendentes > 0 ? 'em_andamento' : 'finalizada'} />
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/dashboard/projeto/${projeto.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        Detalhar <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {projetos.length === 0 && (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              <CheckCircle className="mx-auto mb-2 h-10 w-10 opacity-50" />
              Nenhum projeto cadastrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

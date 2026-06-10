import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Building2, CheckCircle, Download, FolderKanban, Printer, TrendingUp, Users } from 'lucide-react';
import { empresasApi, projetosApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ScoreBadge from '../components/ScoreBadge';

function calcularProjeto(projeto) {
  const avaliacoes = projeto.avaliacoes || [];
  const finalizadas = avaliacoes.filter((a) => a.status === 'finalizada');
  const scores = finalizadas
    .map((a) => Number(a.scoreGeral))
    .filter((score) => Number.isFinite(score) && score > 0);
  const scoreMedio = scores.length ? scores.reduce((acc, score) => acc + score, 0) / scores.length : 0;
  const conclusao = avaliacoes.length ? Math.round((finalizadas.length / avaliacoes.length) * 100) : 0;
  const prontidao = Math.round(((scoreMedio / 5) * 70 + (conclusao / 100) * 30) || 0);
  const riscos = [
    avaliacoes.length === 0 ? 'Sem avaliações' : null,
    conclusao < 60 ? 'Conclusão baixa' : null,
    scoreMedio > 0 && scoreMedio < 3 ? 'Maturidade baixa' : null,
  ].filter(Boolean);

  return {
    ...projeto,
    totalAvaliacoes: avaliacoes.length,
    finalizadas: finalizadas.length,
    scoreMedio,
    conclusao,
    prontidao,
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

export default function ComparativoEmpresa() {
  const { usuario, isAdmin } = useAuth();
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState('');
  const [projetos, setProjetos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregarEmpresas() {
      try {
        const lista = await empresasApi.listar();
        setEmpresas(lista);
        setEmpresaId(isAdmin() ? String(lista[0]?.id || '') : String(usuario?.empresaId || ''));
      } catch (error) {
        setErro(error.message || 'Não foi possível carregar empresas.');
        setLoading(false);
      }
    }

    carregarEmpresas();
  }, [isAdmin, usuario?.empresaId]);

  useEffect(() => {
    if (!empresaId) return;
    async function carregarProjetos() {
      try {
        setLoading(true);
        setErro('');
        const lista = await projetosApi.listar(parseInt(empresaId, 10));
        const detalhes = await Promise.all(lista.map((projeto) => projetosApi.buscar(projeto.id)));
        setProjetos(detalhes.map(calcularProjeto));
      } catch (error) {
        setErro(error.message || 'Não foi possível carregar o comparativo.');
      } finally {
        setLoading(false);
      }
    }

    carregarProjetos();
  }, [empresaId]);

  const empresaSelecionada = empresas.find((empresa) => String(empresa.id) === String(empresaId));
  const resumo = useMemo(() => {
    const comScore = projetos.filter((p) => p.scoreMedio > 0);
    const scoreMedio = comScore.length
      ? comScore.reduce((acc, p) => acc + p.scoreMedio, 0) / comScore.length
      : 0;
    const prontidaoMedia = projetos.length
      ? Math.round(projetos.reduce((acc, p) => acc + p.prontidao, 0) / projetos.length)
      : 0;
    const totalAvaliacoes = projetos.reduce((acc, p) => acc + p.totalAvaliacoes, 0);
    const finalizadas = projetos.reduce((acc, p) => acc + p.finalizadas, 0);
    const conclusao = totalAvaliacoes ? Math.round((finalizadas / totalAvaliacoes) * 100) : 0;
    return {
      scoreMedio,
      prontidaoMedia,
      totalAvaliacoes,
      finalizadas,
      conclusao,
      emRisco: projetos.filter((p) => p.riscos.length > 0).length,
    };
  }, [projetos]);

  function exportarCsv() {
    baixarCsv(`comparativo-${empresaSelecionada?.nome || 'empresa'}.csv`, [
      ['Projeto', 'Empresa', 'Prontidao', 'Score medio', 'Conclusao %', 'Avaliacoes finalizadas', 'Avaliacoes total', 'Riscos'],
      ...projetos.map((p) => [
        p.nome,
        empresaSelecionada?.nome || p.empresa?.nome || '',
        p.prontidao,
        p.scoreMedio.toFixed(2),
        p.conclusao,
        p.finalizadas,
        p.totalAvaliacoes,
        p.riscos.join(' | '),
      ]),
    ]);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <BarChart3 className="h-7 w-7 text-primary-600" />
            Comparativo Executivo por Empresa
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Compare projetos lado a lado por prontidão, maturidade, conclusão e riscos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportarCsv} className="btn btn-secondary inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button type="button" onClick={() => window.print()} className="btn btn-secondary inline-flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Imprimir/PDF
          </button>
        </div>
      </div>

      <div className="card">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          <Building2 className="mr-1 inline h-4 w-4" />
          Empresa
        </label>
        {isAdmin() ? (
          <select className="input max-w-xl" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nome}
              </option>
            ))}
          </select>
        ) : (
          <p className="font-medium text-gray-900 dark:text-white">{empresaSelecionada?.nome || usuario?.empresa?.nome || '—'}</p>
        )}
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100">
          {erro}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Prontidão média</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{resumo.prontidaoMedia}%</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Score médio</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{resumo.scoreMedio.toFixed(2)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Conclusão</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{resumo.conclusao}%</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-500 dark:text-gray-400">Projetos em risco</p>
              <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{resumo.emRisco}</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <th className="pb-3 font-medium">Projeto</th>
                    <th className="pb-3 font-medium">Prontidão</th>
                    <th className="pb-3 font-medium">Score</th>
                    <th className="pb-3 font-medium">Conclusão</th>
                    <th className="pb-3 font-medium">Riscos</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {[...projetos].sort((a, b) => a.prontidao - b.prontidao).map((projeto) => (
                    <tr key={projeto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                      <td className="py-3 font-medium text-gray-900 dark:text-white">
                        <span className="inline-flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 text-purple-500" />
                          {projeto.nome}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                          {projeto.prontidao}%
                        </span>
                      </td>
                      <td className="py-3">
                        {projeto.scoreMedio > 0 ? <ScoreBadge score={projeto.scoreMedio} size="sm" /> : <span className="text-sm text-gray-400">Sem score</span>}
                      </td>
                      <td className="py-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {projeto.finalizadas}/{projeto.totalAvaliacoes} · {projeto.conclusao}%
                        </span>
                      </td>
                      <td className="py-3 text-sm">
                        {projeto.riscos.length ? (
                          <span className="text-amber-700 dark:text-amber-300">{projeto.riscos.join(' · ')}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300">
                            <CheckCircle className="h-4 w-4" />
                            Sem alerta
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <Link to={`/dashboard/projeto/${projeto.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
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
                Nenhum projeto encontrado para esta empresa.
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
              <TrendingUp className="mb-2 h-5 w-5" />
              Priorize projetos com alta prontidão e score consistente para escala controlada.
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
              Projetos com conclusão baixa precisam de reforço de adesão antes de decisões executivas.
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-100">
              Use os links de detalhe para aprofundar dimensões fracas e próximos passos.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

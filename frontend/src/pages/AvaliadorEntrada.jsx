import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardCheck, Loader2, LogOut, Package } from 'lucide-react';
import { avaliacoesApi, avaliacoesProdutoApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/StatusBadge';

function isPendente(avaliacao) {
  return String(avaliacao?.status || '').toLowerCase() !== 'finalizada';
}

function normalizeProjeto(avaliacao) {
  return {
    id: `projeto-${avaliacao.id}`,
    tipo: 'projeto',
    avaliacaoId: avaliacao.id,
    titulo: avaliacao.projeto?.nome || 'Avaliação de maturidade',
    subtitulo: avaliacao.projeto?.empresa?.nome || 'Projeto',
    status: avaliacao.status,
    updatedAt: avaliacao.updatedAt || avaliacao.createdAt,
    url: `/avaliacoes/${avaliacao.id}`
  };
}

function normalizeProduto(avaliacao) {
  return {
    id: `produto-${avaliacao.id}`,
    tipo: 'produto',
    avaliacaoId: avaliacao.id,
    titulo: avaliacao.produto?.nome || 'Avaliação de produto',
    subtitulo: avaliacao.produto?.projeto?.nome || 'Produto IA-First',
    status: avaliacao.status,
    updatedAt: avaliacao.updatedAt || avaliacao.createdAt,
    url: `/avaliacoes-produto/${avaliacao.id}`
  };
}

export default function AvaliadorEntrada() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [itens, setItens] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function carregar() {
      try {
        setLoading(true);
        setErro('');
        const [avaliacoesProjeto, avaliacoesProduto] = await Promise.all([
          avaliacoesApi.listar(),
          avaliacoesProdutoApi.listar()
        ]);
        if (cancelled) return;
        const pendentes = [
          ...(Array.isArray(avaliacoesProjeto) ? avaliacoesProjeto.filter(isPendente).map(normalizeProjeto) : []),
          ...(Array.isArray(avaliacoesProduto) ? avaliacoesProduto.filter(isPendente).map(normalizeProduto) : [])
        ].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

        if (pendentes.length === 1) {
          navigate(pendentes[0].url, { replace: true });
          return;
        }
        setItens(pendentes);
      } catch (e) {
        if (!cancelled) setErro(e.message || 'Não foi possível carregar suas avaliações.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    carregar();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const nome = useMemo(() => usuario?.nome || 'Avaliador', [usuario?.nome]);

  function sair() {
    logout();
    navigate('/login', { replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-300" />
          <p className="text-lg font-medium">Localizando sua avaliação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <p className="text-sm text-blue-100">Blueprint IA</p>
          <h1 className="mt-1 text-2xl font-bold">Olá, {nome}</h1>
          <p className="mt-1 text-sm text-blue-100">
            Este acesso é exclusivo para responder avaliações. Escolha uma pendência para continuar.
          </p>
        </div>

        <div className="space-y-4 p-6">
          {erro ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              {erro}
            </div>
          ) : null}

          {!erro && itens.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-700/40">
              <ClipboardCheck className="mx-auto mb-3 h-12 w-12 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nenhuma avaliação pendente
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Quando você receber um convite ou tiver uma avaliação em andamento, ela aparecerá aqui.
              </p>
            </div>
          ) : null}

          {itens.map((item) => (
            <Link
              key={item.id}
              to={item.url}
              className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                  {item.tipo === 'produto' ? <Package className="h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900 dark:text-white">{item.titulo}</p>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">{item.subtitulo}</p>
                </div>
              </div>
              <StatusBadge status={item.status} />
            </Link>
          ))}

          <div className="flex justify-center border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={sair}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Activity, Users, MapPin, RefreshCw, Clock } from 'lucide-react';
import { observabilidadeApi } from '../services/api';

function tempoRelativo(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s atrás`;
  if (s < 3600) return `${Math.round(s / 60)}min atrás`;
  return d.toLocaleString('pt-BR');
}

export default function Observabilidade() {
  const [aba, setAba] = useState('ao_vivo');
  const [activeMinutes, setActiveMinutes] = useState(5);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const res = await observabilidadeApi.sessoes(activeMinutes);
      setData(res);
    } catch (e) {
      setErro(e.message || 'Erro ao carregar');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeMinutes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    const id = setInterval(carregar, 10000);
    return () => clearInterval(id);
  }, [carregar]);

  const listaAoVivo = data?.ativos || [];
  const listaUltimas = data?.todos || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 dark:bg-indigo-900/40 p-3 rounded-xl">
            <Activity className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Observabilidade</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Usuários ativos e últimas páginas (heartbeat a cada ~25s)
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            Considerar “online” nos últimos
            <select
              className="input py-1.5 text-sm"
              value={activeMinutes}
              onChange={(e) => {
                setLoading(true);
                setActiveMinutes(Number(e.target.value));
              }}
            >
              <option value={3}>3 min</option>
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              carregar();
            }}
            className="btn btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {data?.serverTime && (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Servidor: {new Date(data.serverTime).toLocaleString('pt-BR')}
        </p>
      )}

      {erro && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {erro}
        </div>
      )}

      <div className="flex gap-2 border-b dark:border-gray-700 pb-px">
        <button
          type="button"
          onClick={() => setAba('ao_vivo')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${
            aba === 'ao_vivo'
              ? 'bg-white dark:bg-gray-800 border border-b-0 dark:border-gray-700 text-indigo-600'
              : 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Ao vivo ({listaAoVivo.length})
        </button>
        <button
          type="button"
          onClick={() => setAba('paginas')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${
            aba === 'paginas'
              ? 'bg-white dark:bg-gray-800 border border-b-0 dark:border-gray-700 text-indigo-600'
              : 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Última página registrada ({listaUltimas.length})
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading && !data ? (
          <div className="p-12 text-center text-gray-500">Carregando…</div>
        ) : aba === 'ao_vivo' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <th className="p-3 font-medium">Usuário</th>
                  <th className="p-3 font-medium">Empresa</th>
                  <th className="p-3 font-medium">Perfil</th>
                  <th className="p-3 font-medium">Última ação</th>
                  <th className="p-3 font-medium">Página (path)</th>
                  <th className="p-3 font-medium">Visto</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {listaAoVivo.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Nenhum usuário nesta janela de tempo. Ajuste os minutos ou aguarde heartbeat.
                    </td>
                  </tr>
                ) : (
                  listaAoVivo.map((row) => (
                    <tr key={row.usuarioId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-3 font-medium text-gray-900 dark:text-white">
                        {row.usuario?.nome}
                        <div className="text-xs text-gray-500 font-normal">{row.usuario?.email}</div>
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {row.usuario?.empresa?.nome || '—'}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">{row.usuario?.role}</td>
                      <td className="p-3 text-gray-700 dark:text-gray-300 max-w-xs truncate" title={row.ultimaAcao || ''}>
                        {row.ultimaAcao || '—'}
                      </td>
                      <td className="p-3">
                        <div className="text-gray-800 dark:text-gray-200">{row.rotuloPagina}</div>
                        <div className="text-xs text-gray-500 truncate max-w-md" title={row.ultimoPath}>
                          {row.ultimoPath || '—'}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600 whitespace-nowrap">{tempoRelativo(row.atualizadoEm)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <th className="p-3 font-medium">Usuário</th>
                  <th className="p-3 font-medium">Empresa</th>
                  <th className="p-3 font-medium">Última página (rótulo)</th>
                  <th className="p-3 font-medium">Path completo</th>
                  <th className="p-3 font-medium">Última atividade registrada</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {listaUltimas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhum registro de presença ainda.
                    </td>
                  </tr>
                ) : (
                  listaUltimas.map((row) => (
                    <tr key={row.usuarioId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-3 font-medium text-gray-900 dark:text-white">
                        {row.usuario?.nome}
                        <div className="text-xs text-gray-500 font-normal">{row.usuario?.email}</div>
                      </td>
                      <td className="p-3">{row.usuario?.empresa?.nome || '—'}</td>
                      <td className="p-3">{row.rotuloPagina}</td>
                      <td className="p-3 text-xs text-gray-600 max-w-lg truncate" title={row.ultimoPath}>
                        {row.ultimoPath}
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-600">
                        {new Date(row.atualizadoEm).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

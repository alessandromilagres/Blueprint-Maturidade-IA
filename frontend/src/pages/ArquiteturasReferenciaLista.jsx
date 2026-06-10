import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { empresasApi, arquiteturasReferenciaApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { labelTipoArquiteturaReferencia } from '../constants/tiposArquiteturaReferencia';

export default function ArquiteturasReferenciaLista() {
  const { usuario, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState('');
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await empresasApi.listar();
        setEmpresas(Array.isArray(data) ? data : []);
        if (!isAdmin() && usuario?.empresaId) {
          setEmpresaId(String(usuario.empresaId));
        }
      } catch {
        setEmpresas([]);
      }
    })();
  }, [isAdmin, usuario?.empresaId]);

  useEffect(() => {
    if (!empresaId) {
      setLista([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    arquiteturasReferenciaApi
      .listar(parseInt(empresaId, 10))
      .then((data) => {
        if (!cancelled) setLista(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setLista([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [empresaId]);

  async function handleExcluir(row) {
    if (!window.confirm(`Excluir a arquitetura "${row.nome}"? Produtos vinculados ficarão sem referência.`)) return;
    try {
      await arquiteturasReferenciaApi.excluir(row.id);
      setLista((prev) => prev.filter((x) => x.id !== row.id));
    } catch (e) {
      alert(e.message || 'Erro ao excluir');
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
            <Layers className="w-7 h-7 text-indigo-600 dark:text-indigo-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Arquiteturas de referência</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Padrões técnicos, CI/CD e topologia por empresa — usados no detalhamento do produto.
            </p>
          </div>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Empresa</label>
        <div className="flex flex-wrap items-end gap-3">
          <select
            className="min-w-[240px] px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            disabled={!isAdmin() && Boolean(usuario?.empresaId)}
          >
            <option value="">Selecione a empresa</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
          <Link
            to={empresaId ? `/arquiteturas-referencia/nova?empresaId=${empresaId}` : '#'}
            onClick={(ev) => {
              if (!empresaId) {
                ev.preventDefault();
                alert('Selecione uma empresa primeiro.');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Nova arquitetura
          </Link>
        </div>
      </div>

      {!empresaId ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">Escolha uma empresa para listar as arquiteturas.</p>
      ) : loading ? (
        <p className="text-gray-500">Carregando…</p>
      ) : lista.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          Nenhuma arquitetura cadastrada. Use &quot;Nova arquitetura&quot; para criar a primeira.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-600 dark:text-gray-300">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Anexos</th>
                <th className="px-4 py-3 font-medium">Produtos</th>
                <th className="px-4 py-3 font-medium">Ativo</th>
                <th className="px-4 py-3 font-medium w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 dark:border-gray-700/80">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.nome}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {labelTipoArquiteturaReferencia(row.tipoArquitetura)}
                  </td>
                  <td className="px-4 py-3">{row._count?.arquivos ?? 0}</td>
                  <td className="px-4 py-3">{row._count?.produtos ?? 0}</td>
                  <td className="px-4 py-3">{row.ativo ? 'Sim' : 'Não'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/arquiteturas-referencia/${row.id}/editar`)}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluir(row)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
  );
}

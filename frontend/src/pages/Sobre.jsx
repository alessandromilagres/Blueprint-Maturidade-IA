import { useState, useEffect, useCallback } from 'react';
import { Info, Copy, Check, RefreshCw, Server, Monitor, GitCommit } from 'lucide-react';
import { getFrontendReleaseInfo } from '../constants/releaseInfo.js';

async function fetchBackendReleaseInfo() {
  const response = await fetch('/api/release-info');
  if (!response.ok) {
    throw new Error('Não foi possível obter informações do backend');
  }
  return response.json();
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      title={`Copiar ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

function InfoCard({ title, icon: Icon, info, accent = 'blue' }) {
  const accentClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  };

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${accentClasses[accent]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{info.app}</p>
        </div>
      </div>

      <dl className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-sm text-gray-500 dark:text-gray-400">Versão</dt>
          <dd className="text-sm font-mono font-medium text-gray-900 dark:text-white">{info.version}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-sm text-gray-500 dark:text-gray-400">ID de release</dt>
          <dd className="flex items-center gap-2">
            <code className="text-sm font-mono font-medium text-gray-900 dark:text-white">{info.releaseId}</code>
            <CopyButton value={info.releaseId} label="ID de release" />
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-sm text-gray-500 dark:text-gray-400">Ambiente</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">{info.environment}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function Sobre() {
  const frontend = getFrontendReleaseInfo();
  const [backend, setBackend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    setLoading(true);
    try {
      const data = await fetchBackendReleaseInfo();
      setBackend(data);
    } catch (e) {
      setErro(e.message || 'Erro ao carregar informações do backend');
      setBackend(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const alinhado = backend && frontend.releaseId === backend.releaseId;
  const divergente = backend && frontend.releaseId !== backend.releaseId;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
            <Info className="w-8 h-8 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sobre</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Versão e identificador de release para comparar desenvolvimento e produção
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={carregar}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {backend && (
        <div
          className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
            alinhado
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
              : divergente
                ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
          }`}
        >
          <GitCommit
            className={`w-5 h-5 mt-0.5 shrink-0 ${
              alinhado
                ? 'text-green-600 dark:text-green-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          />
          <div>
            <p
              className={`text-sm font-medium ${
                alinhado
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-amber-800 dark:text-amber-300'
              }`}
            >
              {alinhado
                ? 'Frontend e backend com o mesmo ID de release'
                : 'Frontend e backend com IDs de release diferentes'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {alinhado
                ? 'Esta instância parece consistente (mesmo commit/build em ambas as camadas).'
                : 'Pode indicar deploy parcial, cache do navegador ou ambientes distintos. Compare com produção em agentica.sysmap.com.br.'}
            </p>
          </div>
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {erro}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <InfoCard title="Frontend" icon={Monitor} info={frontend} accent="blue" />
        {backend ? (
          <InfoCard title="Backend" icon={Server} info={backend} accent="emerald" />
        ) : (
          <div className="card p-6 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            {loading ? 'Carregando backend…' : 'Backend indisponível'}
          </div>
        )}
      </div>

      <div className="card p-6 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Como comparar com produção</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>Abra esta página em produção (menu do administrador → Sobre).</li>
          <li>Compare o <strong className="text-gray-800 dark:text-gray-200">ID de release</strong> do frontend e do backend.</li>
          <li>Se os IDs forem iguais entre dev e prod, a mesma versão está em execução.</li>
          <li>Em deploy Docker, o ID corresponde ao commit Git usado no build (<code className="font-mono text-xs">RELEASE_ID</code>).</li>
        </ol>
      </div>
    </div>
  );
}

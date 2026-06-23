import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  AlertTriangle,
  Shield,
  Package,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import NotificacoesRegulatorias from '../components/NotificacoesRegulatorias';
import { regulatorioApi } from '../services/api';

const PL_STYLES = {
  INACEITAVEL: 'text-red-700 bg-red-100',
  ALTO: 'text-orange-700 bg-orange-100',
  BAIXO: 'text-blue-700 bg-blue-100',
  MINIMO: 'text-emerald-700 bg-emerald-100'
};

function PlanoColuna({ titulo, itens, cor }) {
  return (
    <div className={`rounded-xl border p-4 ${cor}`}>
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        {titulo}
      </h3>
      {itens?.length === 0 ? (
        <p className="text-xs text-gray-500">Nenhuma ação neste horizonte.</p>
      ) : (
        <ul className="space-y-3">
          {itens.map((item, i) => (
            <li key={`${item.titulo}-${i}`} className="text-sm border-b border-black/5 pb-2 last:border-0">
              <p className="font-medium text-gray-900 dark:text-white">{item.titulo}</p>
              {item.produtoNome && (
                <p className="text-xs text-gray-500 mt-0.5">Produto: {item.produtoNome}</p>
              )}
              {item.descricao && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{item.descricao}</p>}
              <p className="text-[10px] text-gray-500 mt-1">Resp.: {item.responsavel || 'A definir'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardRegulatorioProjeto() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const versaoId = searchParams.get('versaoId');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [id, versaoId]);

  async function load() {
    setLoading(true);
    try {
      const res = await regulatorioApi.dashboardProjeto(id, versaoId);
      setDashboard(res.dashboard);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-center text-gray-600">
        Dashboard regulatório indisponível.
      </div>
    );
  }

  const { projeto, kpis, produtos, plano30_60_90: plano, disclaimer } = dashboard;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            to={`/dashboard/projeto/${id}${versaoId ? `?versaoId=${versaoId}` : ''}`}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Scale className="w-7 h-7 text-blue-600" />
              Conformidade regulatória
            </h1>
            <p className="text-sm text-gray-500">
              {projeto.nome} · {projeto.empresa}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Produtos mapeados', value: `${kpis.comSnapshot}/${kpis.totalProdutos}`, icon: Package },
            { label: 'Alto risco PL', value: kpis.altoRiscoPl, icon: AlertTriangle, alert: kpis.altoRiscoPl > 0 },
            { label: 'AIPD pendente', value: kpis.aipdPendente, icon: Shield, alert: kpis.aipdPendente > 0 },
            { label: 'Validação pendente', value: kpis.validacaoPendente, icon: CheckCircle2, alert: kpis.validacaoPendente > 0 }
          ].map((k) => (
            <div
              key={k.label}
              className={`rounded-xl border p-4 bg-white dark:bg-gray-800 ${
                k.alert ? 'border-amber-300 dark:border-amber-800' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <k.icon className={`w-5 h-5 mb-2 ${k.alert ? 'text-amber-600' : 'text-gray-400'}`} />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
              <p className="text-xs text-gray-500">{k.label}</p>
            </div>
          ))}
        </div>

        {dashboard.notificacoes?.total > 0 && (
          <NotificacoesRegulatorias notificacoes={dashboard.notificacoes} projetoId={id} />
        )}

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 font-semibold">
            Status por produto
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2">Produto</th>
                  <th className="px-4 py-2">PL 2338</th>
                  <th className="px-4 py-2">ISO</th>
                  <th className="px-4 py-2">LGPD</th>
                  <th className="px-4 py-2">Validado</th>
                  <th className="px-4 py-2">Ciclo</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => (
                  <tr key={p.produtoId} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-3 font-medium">{p.produtoNome}</td>
                    <td className="px-4 py-3">
                      {p.temSnapshot ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            PL_STYLES[p.plRiscoNivelEfetivo] || 'bg-gray-100'
                          }`}
                        >
                          {p.plLabel || p.plRiscoNivelEfetivo}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.isoScoreEstimado != null ? `${p.isoScoreEstimado}%` : '—'}
                    </td>
                    <td className="px-4 py-3">{p.lgpdRipd ? 'RIPD' : p.temSnapshot ? 'OK' : '—'}</td>
                    <td className="px-4 py-3">
                      {p.temSnapshot ? (p.validadoConsultor ? 'Sim' : 'Pendente') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">{p.cicloAtual?.titulo || '—'}</td>
                    <td className="px-4 py-3">
                      {p.temSnapshot && (
                        <Link
                          to={`/dashboard/produto/${p.produtoId}/regulatorio/mitigacao`}
                          className="text-indigo-600 hover:underline text-xs inline-flex items-center gap-1"
                        >
                          Mitigação <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Plano de ação 30 / 60 / 90 dias
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PlanoColuna
              titulo="30 dias — urgente"
              itens={plano?.dias30}
              cor="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/40"
            />
            <PlanoColuna
              titulo="60 dias"
              itens={plano?.dias60}
              cor="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40"
            />
            <PlanoColuna
              titulo="90 dias"
              itens={plano?.dias90}
              cor="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/40"
            />
          </div>
        </div>

        <p className="text-[11px] text-gray-500">
          {disclaimer} Consulte também <code className="text-xs">docs/MANUAL_MODULO_REGULATORIO.md</code> no repositório.
        </p>
      </div>
    </div>
  );
}

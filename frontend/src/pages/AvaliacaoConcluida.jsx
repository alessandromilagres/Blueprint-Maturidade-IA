import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Mail, ArrowLeft, Building2 } from 'lucide-react';
import { avaliacoesApi } from '../services/api';

export default function AvaliacaoConcluida() {
  const { id } = useParams();
  const [avaliacao, setAvaliacao] = useState(null);

  useEffect(() => {
    let cancelled = false;
    avaliacoesApi
      .buscar(id)
      .then((data) => {
        if (!cancelled) setAvaliacao(data);
      })
      .catch(() => {
        if (!cancelled) setAvaliacao(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-8 text-white text-center shadow-lg">
        <div className="flex justify-center mb-4">
          <div className="bg-white/20 rounded-full p-4">
            <CheckCircle className="w-12 h-12" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Obrigado pela participação!</h1>
        <p className="text-emerald-50 max-w-xl mx-auto leading-relaxed">
          Sua avaliação foi concluída e suas respostas foram registradas com sucesso.
          Agradecemos o tempo dedicado — sua contribuição é essencial para o diagnóstico de maturidade em IA.
        </p>
      </div>

      {avaliacao?.projeto && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-900/50 dark:bg-gray-800">
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Avaliação registrada para {avaliacao.projeto.nome}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Empresa: {avaliacao.projeto.empresa?.nome || '—'} · Conclusão:{' '}
                {avaliacao.updatedAt ? new Date(avaliacao.updatedAt).toLocaleString('pt-BR') : 'agora'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 flex items-start gap-3">
        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Confira seu e-mail.</strong> Enviamos uma cópia com <strong>as perguntas e as respostas que você registrou</strong>
          (sem notas ou indicadores de desempenho). Se não encontrar em alguns minutos, verifique a pasta de spam.
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/avaliacoes"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Minhas avaliações
        </Link>
      </div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6 max-w-xl mx-auto">
        O plano de ação detalhado, recomendações estratégicas e relatório executivo são
        analisados pela equipe responsável e disponibilizados aos gestores da sua organização.
      </p>
    </div>
  );
}

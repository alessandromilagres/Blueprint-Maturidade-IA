import { Link, useSearchParams } from 'react-router-dom';
import { Package, ArrowLeft, ListOrdered, Lightbulb } from 'lucide-react';

export default function ProdutoEscolhaModelo() {
  const [searchParams] = useSearchParams();
  const projetoQ = searchParams.get('projetoId');
  const suffix = projetoQ ? `?projetoId=${encodeURIComponent(projetoQ)}` : '';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          to="/produtos"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
            <Package className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Novo produto</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Escolha como deseja iniciar o cadastro
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          to={`/produtos/novo/convencional${suffix}`}
          className="group card border-2 border-transparent hover:border-primary-500 dark:hover:border-primary-600 transition-all hover:shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors">
              <ListOrdered className="w-8 h-8 text-slate-700 dark:text-slate-200" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Modelo convencional
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Cadastro guiado por etapas (informações básicas, requisitos, fluxos, anexos e
                detalhamento técnico). Ideal quando o time já tem clareza ou prefere o fluxo linear.
              </p>
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                Continuar com este modelo →
              </span>
            </div>
          </div>
        </Link>

        <Link
          to={`/produtos/novo/design-thinking${suffix}`}
          className="group card border-2 border-transparent hover:border-amber-500 dark:hover:border-amber-600 transition-all hover:shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/40 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/60 transition-colors">
              <Lightbulb className="w-8 h-8 text-amber-800 dark:text-amber-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Modelo design thinking
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Mesmo cadastro estruturado, com ênfase na Fase A de idealização (problema,
                hipóteses, solução e experimento). Após criar o produto, você será direcionado à
                tela de idealização antes da especificação técnica.
              </p>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Continuar com design thinking →
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

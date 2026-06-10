import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, FolderKanban, Package, ClipboardCheck, X, CheckCircle2, Circle } from 'lucide-react';

const STORAGE_KEY = 'blueprint_ia_onboarding_dismissed';

export default function OnboardingChecklist({
  empresasCount,
  projetosCount,
  produtosCount,
  avaliacoesCount
}) {
  const [hidden, setHidden] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1'
  );

  if (hidden) return null;

  const steps = [
    {
      ok: empresasCount >= 1,
      label: 'Cadastrar pelo menos uma empresa',
      to: '/empresas',
      icon: Building2
    },
    {
      ok: projetosCount >= 1,
      label: 'Criar um projeto vinculado à empresa',
      to: '/projetos',
      icon: FolderKanban
    },
    {
      ok: produtosCount >= 1 || avaliacoesCount >= 1,
      label: 'Registrar um produto IA-First ou iniciar uma avaliação',
      to: produtosCount >= 1 ? '/produtos' : '/avaliacoes',
      icon: produtosCount >= 1 ? Package : ClipboardCheck
    }
  ];

  const doneCount = steps.filter((s) => s.ok).length;
  if (doneCount === steps.length) return null;

  return (
    <div className="card border-2 border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/30">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Primeiros passos</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Complete o checklist para extrair o máximo do Blueprint IA ({doneCount}/{steps.length}).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, '1');
            setHidden(true);
          }}
          className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
          title="Dispensar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <ul className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            {step.ok ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${step.ok ? 'text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                {step.label}
              </p>
              {!step.ok && (
                <Link
                  to={step.to}
                  className="inline-flex items-center gap-1.5 mt-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <step.icon className="w-4 h-4" />
                  Ir agora
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

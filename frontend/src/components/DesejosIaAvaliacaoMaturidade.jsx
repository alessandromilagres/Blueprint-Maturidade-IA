import { DESEJOS_IA_Q1_OPCOES, mergeDesejosFromApi } from '../constants/desejosIaAvaliacaoMaturidade.js';

/**
 * Bloco opcional no fim do assessment de maturidade (projeto).
 */
export default function DesejosIaAvaliacaoMaturidade({ empresaNome, value, onChange }) {
  const d = mergeDesejosFromApi(value);

  function patch(partial) {
    onChange({ ...d, ...partial });
  }

  function toggleQ1(id) {
    const cur = d.q1_escolhas || [];
    if (cur.includes(id)) {
      patch({ q1_escolhas: cur.filter((x) => x !== id) });
      return;
    }
    if (cur.length >= 2) return;
    patch({ q1_escolhas: [...cur, id] });
  }

  const nomeEmpresa = empresaNome || 'sua empresa';

  return (
    <div className="space-y-8 text-gray-900 dark:text-gray-100">
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/25 px-5 py-4">
        <h2 className="text-lg font-semibold mb-2">Você concluiu o questionário de maturidade. Obrigado.</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Agora queremos ouvir algo diferente: não o estado atual, mas a sua visão de futuro. As próximas 5 perguntas
          são curtas e não têm resposta certa ou errada. O que nos interessa é a sua perspectiva — como líder da sua
          área — sobre onde a <strong>{nomeEmpresa}</strong> quer chegar com inteligência artificial. Suas respostas
          serão usadas pela <strong>SysMap</strong> para construir um roadmap de projetos alinhado à realidade e às
          ambições da empresa — não um plano genérico de prateleira.
        </p>
        <p className="mt-3 text-sm font-medium text-emerald-800 dark:text-emerald-300">
          Leva menos de 8 minutos. Vale cada minuto.
        </p>
      </div>

      <section className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Pergunta 1 | Visão de futuro
        </p>
        <p className="text-sm font-medium">
          Em 2 anos, qual resultado de negócio você quer que a IA tenha ajudado a <strong>{nomeEmpresa}</strong> a
          alcançar?
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Escolha até 2 opções.</p>
        <div className="space-y-2">
          {DESEJOS_IA_Q1_OPCOES.map((op) => {
            const checked = d.q1_escolhas.includes(op.id);
            const maxReached = d.q1_escolhas.length >= 2 && !checked;
            return (
              <label
                key={op.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-950/40'
                    : maxReached
                    ? 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={checked}
                  disabled={maxReached}
                  onChange={() => toggleQ1(op.id)}
                />
                <span className="text-sm leading-snug">{op.label}</span>
              </label>
            );
          })}
        </div>
        {d.q1_escolhas.includes('outro') && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Especifique &quot;Outro&quot;</label>
            <input
              type="text"
              className="input w-full text-sm"
              value={d.q1_outro}
              onChange={(e) => patch({ q1_outro: e.target.value })}
              placeholder="Descreva em uma linha"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Se quiser detalhar sua escolha ou dar um exemplo concreto, escreva aqui:
          </label>
          <textarea
            className="input w-full text-sm"
            rows={3}
            value={d.q1_comentario}
            onChange={(e) => patch({ q1_comentario: e.target.value })}
          />
        </div>
      </section>

      <section className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Pergunta 2 | Dor mais relevante
        </p>
        <p className="text-sm font-medium">
          Na sua área de atuação, qual é o problema que mais te preocupa hoje — e que você acredita que a IA poderia
          ajudar a resolver?
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Campo aberto — seja específico. Pode ser uma dor do dia a dia ou uma decisão difícil por falta de dados.
        </p>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sua resposta:</label>
        <textarea
          className="input w-full text-sm"
          rows={4}
          value={d.q2_dor}
          onChange={(e) => patch({ q2_dor: e.target.value })}
          placeholder="Escreva aqui…"
        />
      </section>

      <section className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pergunta 3</p>
        <p className="text-sm font-medium">
          Quais use cases ou iniciativas de IA você considera prioritários para os próximos 12 meses?
        </p>
        <textarea
          className="input w-full text-sm"
          rows={3}
          value={d.q3}
          onChange={(e) => patch({ q3: e.target.value })}
        />
      </section>

      <section className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pergunta 4</p>
        <p className="text-sm font-medium">
          Do ponto de vista da sua área, o que mais pode travar ou acelerar a adoção de IA na organização?
        </p>
        <textarea
          className="input w-full text-sm"
          rows={3}
          value={d.q4}
          onChange={(e) => patch({ q4: e.target.value })}
        />
      </section>

      <section className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pergunta 5</p>
        <p className="text-sm font-medium">
          Há algo mais que gostaria de comunicar à liderança ou à SysMap sobre IA na empresa?
        </p>
        <textarea
          className="input w-full text-sm"
          rows={3}
          value={d.q5}
          onChange={(e) => patch({ q5: e.target.value })}
        />
      </section>

      <p className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
        Este bloco é <strong>opcional</strong>. Você pode finalizar a avaliação sem respondê-lo; o que já respondeu no
        assessment continua válido.
      </p>
    </div>
  );
}

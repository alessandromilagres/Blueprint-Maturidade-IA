/** Opções da pergunta 1 — ids alinhados ao backend */
export const DESEJOS_IA_Q1_OPCOES = [
  { id: 'custo', label: 'Redução significativa de custos operacionais na fábrica (energia, manutenção, desperdício)' },
  { id: 'qualidade', label: 'Melhoria expressiva na qualidade' },
  { id: 'receita', label: 'Aumento da receita por melhor forecast de demanda e gestão comercial' },
  { id: 'agilidade', label: 'Agilidade na tomada de decisão — dados confiáveis em tempo real para a liderança' },
  { id: 'talentos', label: 'Melhoria na experiência e retenção de talentos' },
  { id: 'esg', label: 'Avanço nas metas de sustentabilidade e ESG' },
  { id: 'vantagem', label: 'Vantagem competitiva clara frente aos concorrentes' },
  { id: 'outro', label: 'Outro' }
];

export const DESEJOS_IA_EMPTY = {
  q1_escolhas: [],
  q1_outro: '',
  q1_comentario: '',
  q2_dor: '',
  q3: '',
  q4: '',
  q5: ''
};

export function mergeDesejosFromApi(raw) {
  if (!raw || typeof raw !== 'object') return { ...DESEJOS_IA_EMPTY };
  return {
    q1_escolhas: Array.isArray(raw.q1_escolhas) ? raw.q1_escolhas.filter(Boolean) : [],
    q1_outro: raw.q1_outro ?? '',
    q1_comentario: raw.q1_comentario ?? '',
    q2_dor: raw.q2_dor ?? '',
    q3: raw.q3 ?? '',
    q4: raw.q4 ?? '',
    q5: raw.q5 ?? ''
  };
}

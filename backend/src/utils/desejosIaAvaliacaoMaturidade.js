/** Opções da pergunta 1 (ambição de resultado) — ids estáveis. */
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

const Q1_IDS = new Set(DESEJOS_IA_Q1_OPCOES.map((o) => o.id));

function clip(s, max) {
  if (s == null) return '';
  const t = String(s).trim();
  return t.length > max ? t.slice(0, max) : t;
}

/**
 * Normaliza payload do bloco opcional Desejos IA.
 * @returns {object|null} objeto persistível ou null se vazio
 */
export function normalizarDesejosIA(raw) {
  if (raw == null) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;

  const escolhasIn = Array.isArray(raw.q1_escolhas) ? raw.q1_escolhas : [];
  const escolhas = [];
  for (const x of escolhasIn) {
    const id = String(x || '').trim();
    if (Q1_IDS.has(id) && !escolhas.includes(id)) escolhas.push(id);
    if (escolhas.length >= 2) break;
  }

  const q1_outro = clip(raw.q1_outro, 500);
  const q1_comentario = clip(raw.q1_comentario, 8000);
  const q2_dor = clip(raw.q2_dor, 8000);
  const q3 = clip(raw.q3, 8000);
  const q4 = clip(raw.q4, 8000);
  const q5 = clip(raw.q5, 8000);

  const temAlgo =
    escolhas.length > 0 ||
    q1_outro ||
    q1_comentario ||
    q2_dor ||
    q3 ||
    q4 ||
    q5;
  if (!temAlgo) return null;

  return {
    versao: 1,
    q1_escolhas: escolhas,
    q1_outro,
    q1_comentario,
    q2_dor,
    q3,
    q4,
    q5
  };
}

function labelQ1(id) {
  const o = DESEJOS_IA_Q1_OPCOES.find((x) => x.id === id);
  return o ? o.label : id;
}

/**
 * Linhas para o e-mail de resultado (mesmo formato das respostas da maturidade).
 * @returns {Array<{ area: string, pergunta: string, textoResposta: string, observacoes: string|null }>}
 */
export function desejosIaParaRespostasEmail(d) {
  if (!d || typeof d !== 'object') return [];
  const out = [];
  const escolhas = Array.isArray(d.q1_escolhas) ? d.q1_escolhas : [];
  if (escolhas.length || (d.q1_outro && String(d.q1_outro).trim())) {
    const partes = escolhas.map(labelQ1);
    if (d.q1_outro && String(d.q1_outro).trim()) partes.push(`Outro: ${String(d.q1_outro).trim()}`);
    out.push({
      area: 'Desejos IA',
      pergunta: 'Pergunta 1 | Visão de futuro — Em 2 anos, qual resultado de negócio você quer que a IA tenha ajudado a empresa a alcançar? (até 2 opções)',
      textoResposta: partes.length ? partes.join(' · ') : '—',
      observacoes: d.q1_comentario?.trim() || null
    });
  }
  if (d.q2_dor && String(d.q2_dor).trim()) {
    out.push({
      area: 'Desejos IA',
      pergunta:
        'Pergunta 2 | Dor mais relevante — Na sua área de atuação, qual é o problema que mais te preocupa hoje — e que você acredita que a IA poderia ajudar a resolver?',
      textoResposta: String(d.q2_dor).trim(),
      observacoes: null
    });
  }
  if (d.q3 && String(d.q3).trim()) {
    out.push({
      area: 'Desejos IA',
      pergunta:
        'Pergunta 3 — Quais use cases ou iniciativas de IA você considera prioritários para os próximos 12 meses?',
      textoResposta: String(d.q3).trim(),
      observacoes: null
    });
  }
  if (d.q4 && String(d.q4).trim()) {
    out.push({
      area: 'Desejos IA',
      pergunta:
        'Pergunta 4 — Do ponto de vista da sua área, o que mais pode travar ou acelerar a adoção de IA na organização?',
      textoResposta: String(d.q4).trim(),
      observacoes: null
    });
  }
  if (d.q5 && String(d.q5).trim()) {
    out.push({
      area: 'Desejos IA',
      pergunta: 'Pergunta 5 — Há algo mais que gostaria de comunicar à liderança ou à SysMap sobre IA na empresa?',
      textoResposta: String(d.q5).trim(),
      observacoes: null
    });
  }
  return out;
}

/** Indica se há conteúdo persistível no JSON (após normalização). */
export function desejosIaTemRespostasGuardadas(d) {
  return normalizarDesejosIA(d) != null;
}

/** Palavras-chave em campos textuais do produto para sinais regulatórios (PL 2338 / LGPD). */

export const DOMINIOS_ALTO_RISCO_PL = [
  { id: 'credito', label: 'Acesso a crédito ou scoring financeiro', keywords: ['crédito', 'credito', 'scoring', 'empréstimo', 'emprestimo', 'financiamento', 'inadimpl'] },
  { id: 'emprego', label: 'Emprego ou triagem de candidatos', keywords: ['emprego', 'contratação', 'contratacao', 'recrutamento', 'rh ', 'candidato', 'colaborador'] },
  { id: 'saude', label: 'Saúde ou decisão clínica', keywords: ['saúde', 'saude', 'clínico', 'clinico', 'diagnóstico', 'diagnostico', 'paciente', 'hospital'] },
  { id: 'beneficios', label: 'Benefícios sociais ou previdenciários', keywords: ['benefício', 'beneficio', 'previdência', 'previdencia', 'auxílio', 'auxilio'] },
  { id: 'infra_critica', label: 'Infraestrutura crítica', keywords: ['infraestrutura crítica', 'energia', 'saneamento', 'telecomunicações críticas', 'defesa'] },
  { id: 'monitoramento_trabalhador', label: 'Monitoramento de desempenho de trabalhadores', keywords: ['monitoramento de colaborador', 'produtividade do funcionário', 'vigilância', 'vigilancia', 'timesheet', 'monitora trabalhador'] }
];

export const DADOS_PESSOAIS_KEYWORDS = [
  'dados pessoais',
  'pessoal',
  'cpf',
  'titular',
  'cliente',
  'usuário final',
  'usuario final',
  'biometria',
  'biométrico',
  'sensível',
  'sensivel',
  'lgpd',
  'privacidade'
];

export const VERTICAIS_ALTO_RISCO = [
  'financ',
  'saúde',
  'saude',
  'health',
  'rh',
  'recursos humanos',
  'segurança pública'
];

export function textoProdutoParaAnalise(produto) {
  const partes = [
    produto?.nome,
    produto?.descricao,
    produto?.problemaResolve,
    produto?.publicoAlvo,
    produto?.principaisRiscos,
    produto?.tecnologias,
    produto?.vertical?.nome
  ];
  return partes.filter(Boolean).join(' ').toLowerCase();
}

export function detectarDominiosAltoRisco(texto) {
  const t = String(texto || '').toLowerCase();
  return DOMINIOS_ALTO_RISCO_PL.filter((d) =>
    d.keywords.some((k) => t.includes(k.toLowerCase()))
  );
}

export function produtoTrataDadosPessoais(texto) {
  const t = String(texto || '').toLowerCase();
  return DADOS_PESSOAIS_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

export function verticalIndicaAltoRisco(nomeVertical) {
  const n = String(nomeVertical || '').toLowerCase();
  return VERTICAIS_ALTO_RISCO.some((v) => n.includes(v));
}

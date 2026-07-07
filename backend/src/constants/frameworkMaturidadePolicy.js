/** Frameworks de maturidade mutuamente exclusivos por projeto (Etapa 1+). */

export const FRAMEWORK_BLUEPRINT_16 = 'BLUEPRINT_16';
export const FRAMEWORK_SATF_TI_V3 = 'SATF_TI_V3';

export const FRAMEWORKS_MATURIDADE = [FRAMEWORK_BLUEPRINT_16, FRAMEWORK_SATF_TI_V3];

export const FRAMEWORK_POLICIES = {
  [FRAMEWORK_BLUEPRINT_16]: {
    id: FRAMEWORK_BLUEPRINT_16,
    label: 'Blueprint IA — Maturidade Organizacional',
    shortLabel: 'Blueprint 16',
    descricao:
      '16 dimensões enterprise (estratégia, receita, MIT CISR, conformidade). Assessment com 108 perguntas.',
    dimensoesNucleo: 16,
    perguntasAprox: 108
  },
  [FRAMEWORK_SATF_TI_V3]: {
    id: FRAMEWORK_SATF_TI_V3,
    label: 'SATF — IA Maturidade TI',
    shortLabel: 'SATF TI',
    descricao:
      '11 dimensões focadas em engenharia, plataforma, legado e Fábrica Agêntica. Assessment ~75 perguntas (Etapa 2).',
    dimensoesNucleo: 9,
    dimensoesEspecializadas: 2,
    perguntasAprox: 75
  }
};

export function frameworkMaturidadeValido(raw) {
  const v = String(raw || '').trim().toUpperCase();
  return FRAMEWORKS_MATURIDADE.includes(v) ? v : null;
}

export function normalizarFrameworkMaturidade(raw, fallback = FRAMEWORK_BLUEPRINT_16) {
  return frameworkMaturidadeValido(raw) || fallback;
}

export function policyFramework(frameworkMaturidade) {
  return FRAMEWORK_POLICIES[normalizarFrameworkMaturidade(frameworkMaturidade)];
}

export function listarFrameworksParaApi() {
  return FRAMEWORKS_MATURIDADE.map((id) => FRAMEWORK_POLICIES[id]);
}

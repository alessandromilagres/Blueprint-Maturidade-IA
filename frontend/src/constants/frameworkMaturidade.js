export const FRAMEWORK_BLUEPRINT_16 = 'BLUEPRINT_16';
export const FRAMEWORK_SATF_TI_V3 = 'SATF_TI_V3';

export const FRAMEWORK_OPTIONS = [
  {
    id: FRAMEWORK_BLUEPRINT_16,
    shortLabel: 'Blueprint 16',
    title: 'Blueprint IA — Maturidade Organizacional',
    description:
      '16 dimensões enterprise: estratégia, ROI, receita, MIT CISR, conformidade. Ideal para diagnóstico C-Level e board.',
    badgeClass:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
  },
  {
    id: FRAMEWORK_SATF_TI_V3,
    shortLabel: 'SATF TI',
    title: 'SATF — IA Maturidade TI',
    description:
      'Foco em engenharia, plataforma, legado e Fábrica Agêntica. Ideal para áreas de TI, CTO e operações de software.',
    badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200'
  }
];

export function frameworkBadgeClass(frameworkMaturidade) {
  return (
    FRAMEWORK_OPTIONS.find((o) => o.id === frameworkMaturidade)?.badgeClass ||
    FRAMEWORK_OPTIONS[0].badgeClass
  );
}

export function frameworkShortLabel(frameworkMaturidade) {
  return (
    FRAMEWORK_OPTIONS.find((o) => o.id === frameworkMaturidade)?.shortLabel || 'Blueprint 16'
  );
}

export function isSatfFramework(frameworkMaturidade) {
  return frameworkMaturidade === FRAMEWORK_SATF_TI_V3;
}

/** Tipo gravado na biblioteca IA / job de background. */
export function bookIaTipoProjeto(frameworkMaturidade, modoRapido = false) {
  if (isSatfFramework(frameworkMaturidade)) {
    return modoRapido ? 'completo_satf_rapido' : 'completo_satf';
  }
  return modoRapido ? 'completo_rapido' : 'completo';
}

export function totalDimensoesBookFramework(frameworkMaturidade) {
  return isSatfFramework(frameworkMaturidade) ? 11 : 16;
}

export function isTipoBookCompleto(tipo) {
  return ['completo', 'completo_rapido', 'completo_satf', 'completo_satf_rapido'].includes(tipo);
}

/** Textos de capa, escala e rodapé do relatório técnico por framework. */
export function relatorioFrameworkMeta(frameworkMaturidade) {
  if (isSatfFramework(frameworkMaturidade)) {
    return {
      coverSubtitle: 'Assessment Completo • SATF TI v3 — IA Maturidade TI',
      scaleTitle: 'Escala de Maturidade SysMap (N1–N5)',
      footerMetodologia: 'Instrumento SATF TI v3 — IA Maturidade TI (SysMap Solutions)',
      roiDisclaimerMit: false,
      escalaNiveis: [
        { nivel: 'Inicial', score: '1.0–1.8', cor: 'red' },
        { nivel: 'Oportunista', score: '1.8–2.6', cor: 'orange' },
        { nivel: 'Estruturado', score: '2.6–3.4', cor: 'amber' },
        { nivel: 'Gerenciado', score: '3.4–4.2', cor: 'blue' },
        { nivel: 'Otimizado', score: '4.2–5.0', cor: 'green' }
      ],
      apendicePrincipal: {
        nome: 'SATF TI v3',
        subtitulo: 'IA Maturidade TI — Instrumento SysMap',
        descricao:
          'Framework para maturidade de IA em TI: estratégia, engenharia, plataforma, legado, Fábrica Agêntica (D10) e conformidade regulatória (D11).',
        referencia: 'Instrumento v3 — Jun/2026'
      }
    };
  }

  return {
    coverSubtitle: 'Assessment Completo • MIT CISR Framework',
    scaleTitle: 'Escala de Maturidade MIT CISR',
    footerMetodologia: 'Baseado no MIT CISR Enterprise AI Maturity Model',
    roiDisclaimerMit: true,
    escalaNiveis: [
      { nivel: 'Inicial', score: '1.0-1.5', cor: 'red' },
      { nivel: 'Oportunista', score: '1.5-2.5', cor: 'orange' },
      { nivel: 'Estruturado', score: '2.5-3.5', cor: 'amber' },
      { nivel: 'Gerenciado', score: '3.5-4.5', cor: 'blue' },
      { nivel: 'Otimizado', score: '4.5-5.0', cor: 'green' }
    ],
    apendicePrincipal: {
      nome: 'MIT CISR',
      subtitulo: 'Enterprise AI Maturity Model',
      descricao:
        'Framework do MIT Center for Information Systems Research para avaliar maturidade empresarial em IA.',
      referencia: 'Weill, Woerner & Sebastian (2024)'
    }
  };
}

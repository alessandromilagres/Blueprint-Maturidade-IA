/**
 * Ordem oficial das dimensões por framework (Blueprint 16 vs SATF TI v3).
 */
import { ORDEM_NOMES_SATF } from '../data/satfFrameworkSeed.js';
import {
  FRAMEWORK_BLUEPRINT_16,
  FRAMEWORK_SATF_TI_V3,
  normalizarFrameworkMaturidade
} from '../constants/frameworkMaturidadePolicy.js';

export const ORDEM_DIMENSOES_FRAMEWORK = [
  'Estratégia e Liderança',
  'Dados e Tecnologia',
  'Governança e Risco',
  'Pessoas e Cultura',
  'Operações e Processos',
  'Inovação e Experimentação',
  'Valor de Negócio e ROI',
  'Ecossistema e Parcerias',
  'Valor por Unidade de Negócio',
  'Talentos e Capacidades',
  'Conformidade Regulatória',
  'Prontidão para Mudança',
  'Plataforma e Industrialização de IA',
  'IA como Gerador de Receita',
  'Maturidade por Tipo de IA',
  'Eficácia de IA (MIT CISR)'
];

export const ORDEM_DIMENSOES_SATF = ORDEM_NOMES_SATF;

export const TOTAL_DIMENSOES_FRAMEWORK = ORDEM_DIMENSOES_FRAMEWORK.length;
export const TOTAL_DIMENSOES_SATF = ORDEM_DIMENSOES_SATF.length;

export function ordemNomesPorFramework(frameworkMaturidade) {
  const fw = normalizarFrameworkMaturidade(frameworkMaturidade);
  return fw === FRAMEWORK_SATF_TI_V3 ? ORDEM_DIMENSOES_SATF : ORDEM_DIMENSOES_FRAMEWORK;
}

export function totalDimensoesPorFramework(frameworkMaturidade) {
  return ordemNomesPorFramework(frameworkMaturidade).length;
}

export function frameworkMaturidadeDeAreas(areas) {
  return normalizarFrameworkMaturidade(areas?.[0]?.frameworkMaturidade);
}

export function nomeDimensaoFramework(item) {
  if (!item) return '';
  return String(item.area ?? item.nome ?? item.areaNome ?? '').trim();
}

export function indiceOrdemDimensaoFramework(nome, frameworkMaturidade = FRAMEWORK_BLUEPRINT_16) {
  const n = String(nome || '').trim();
  const ordem = ordemNomesPorFramework(frameworkMaturidade);
  const i = ordem.indexOf(n);
  return i >= 0 ? i : 9999;
}

export function compararDimensoesPorOrdemFramework(a, b, frameworkMaturidade) {
  const fw = frameworkMaturidade || frameworkMaturidadeDeAreas([a, b].filter(Boolean));
  const ia = indiceOrdemDimensaoFramework(nomeDimensaoFramework(a), fw);
  const ib = indiceOrdemDimensaoFramework(nomeDimensaoFramework(b), fw);
  if (ia !== ib) return ia - ib;
  return (a?.ordem ?? a?.areaId ?? a?.id ?? 0) - (b?.ordem ?? b?.areaId ?? b?.id ?? 0);
}

export function ordenarDimensoesPorFramework(dimensoes, frameworkMaturidade) {
  const fw = frameworkMaturidade || frameworkMaturidadeDeAreas(dimensoes);
  return [...(dimensoes || [])].sort((a, b) => compararDimensoesPorOrdemFramework(a, b, fw));
}

export function ordenarAreasPorFramework(areas, frameworkMaturidade) {
  const fw = frameworkMaturidade || frameworkMaturidadeDeAreas(areas);
  return [...(areas || [])].sort((a, b) => compararDimensoesPorOrdemFramework(a, b, fw));
}

export function blocoOrdemDimensoesFrameworkMarkdown(frameworkMaturidade = FRAMEWORK_BLUEPRINT_16) {
  const fw = normalizarFrameworkMaturidade(frameworkMaturidade);
  const ordem = ordemNomesPorFramework(fw);
  const titulo =
    fw === FRAMEWORK_SATF_TI_V3
      ? '## Ordem obrigatória das 11 dimensões SATF (Seção 3 do book)'
      : '## Ordem obrigatória das 16 dimensões (Seção 3 do book)';
  const linhas = ordem.map((nome, idx) => `${idx + 1}. ${nome}`).join('\n');
  return `${titulo}

${linhas}

Todas devem aparecer nesta ordem: **score > 0** → análise completa; **score = 0** → registro sem análise.`;
}

/** Garante todas as dimensões do framework na ordem canônica. */
export function garantirTodasDimensoesFramework(areas, dimensoesParciais = [], frameworkMaturidade) {
  const fw = normalizarFrameworkMaturidade(
    frameworkMaturidade || frameworkMaturidadeDeAreas(areas)
  );
  const ordem = ordemNomesPorFramework(fw);
  const porNome = new Map((dimensoesParciais || []).map((d) => [nomeDimensaoFramework(d), d]));

  return ordem.map((nome, idx) => {
    const existente = porNome.get(nome);
    if (existente) {
      return { ...existente, ordemFramework: idx + 1, area: nome };
    }
    const area = (areas || []).find((a) => a.nome === nome);
    if (area) {
      return {
        areaId: area.id,
        area: area.nome,
        descricao: area.descricao,
        score: 0,
        nivel: 1,
        avaliadoresCobriram: 0,
        totalAvaliadores: 0,
        perguntas: (area.perguntas || []).map((p) => ({
          numero: p.numero,
          texto: p.texto,
          score: 0,
          totalRespostas: 0
        })),
        semDadosConsolidados: true,
        ordemFramework: idx + 1
      };
    }
    return {
      areaId: idx + 1,
      area: nome,
      score: 0,
      nivel: 1,
      perguntas: [],
      semDadosConsolidados: true,
      ordemFramework: idx + 1
    };
  });
}

/**
 * Ordem oficial das 16 dimensões do framework Blueprint IA (Seção 3 dos books e relatórios).
 * Todas devem aparecer: score > 0 → análise; score = 0 → registro sem análise.
 */
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

export const TOTAL_DIMENSOES_FRAMEWORK = ORDEM_DIMENSOES_FRAMEWORK.length;

export function nomeDimensaoFramework(item) {
  if (!item) return '';
  return String(item.area ?? item.nome ?? item.areaNome ?? '').trim();
}

export function indiceOrdemDimensaoFramework(nome) {
  const n = String(nome || '').trim();
  const i = ORDEM_DIMENSOES_FRAMEWORK.indexOf(n);
  return i >= 0 ? i : 9999;
}

export function compararDimensoesPorOrdemFramework(a, b) {
  const ia = indiceOrdemDimensaoFramework(nomeDimensaoFramework(a));
  const ib = indiceOrdemDimensaoFramework(nomeDimensaoFramework(b));
  if (ia !== ib) return ia - ib;
  return (a?.areaId ?? a?.id ?? 0) - (b?.areaId ?? b?.id ?? 0);
}

export function ordenarDimensoesPorFramework(dimensoes) {
  return [...(dimensoes || [])].sort(compararDimensoesPorOrdemFramework);
}

export function ordenarAreasPorFramework(areas) {
  return [...(areas || [])].sort(compararDimensoesPorOrdemFramework);
}

/** Garante as 16 dimensões na ordem do framework (mescla com cadastro de áreas). */
export function blocoOrdemDimensoesFrameworkMarkdown() {
  const linhas = ORDEM_DIMENSOES_FRAMEWORK.map((nome, idx) => `${idx + 1}. ${nome}`).join('\n');
  return `## Ordem obrigatória das 16 dimensões (Seção 3 do book)

${linhas}

Todas devem aparecer nesta ordem: **score > 0** → análise completa; **score = 0** → registro sem análise.`;
}

export function garantirTodasDimensoesFramework(areas, dimensoesParciais = []) {
  const porNome = new Map(
    (dimensoesParciais || []).map((d) => [nomeDimensaoFramework(d), d])
  );

  const resultado = ORDEM_DIMENSOES_FRAMEWORK.map((nome, idx) => {
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

  return resultado;
}

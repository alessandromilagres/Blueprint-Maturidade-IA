/** Ordem oficial das 16 dimensões (alinhada ao backend / Seção 3 dos books). */
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

export function indiceOrdemDimensaoFramework(nome) {
  const i = ORDEM_DIMENSOES_FRAMEWORK.indexOf(String(nome || '').trim());
  return i >= 0 ? i : 9999;
}

export function ordenarDimensoesPorFramework(dimensoes) {
  return [...(dimensoes || [])].sort(
    (a, b) =>
      indiceOrdemDimensaoFramework(a.area ?? a.nome) -
      indiceOrdemDimensaoFramework(b.area ?? b.nome)
  );
}

export function contarDimensoesSecao3Book(markdown) {
  const encontrados = new Set();
  for (const m of String(markdown || '').matchAll(/^## 3\.(\d+)\s+Dimens[aã]o\s*[—–-]/gim)) {
    encontrados.add(parseInt(m[1], 10));
  }
  return encontrados;
}

export function relatorioBookSecao3Completo(markdown, totalEsperado = 16) {
  const encontrados = contarDimensoesSecao3Book(markdown);
  const faltando = [];
  for (let i = 1; i <= totalEsperado; i++) {
    if (!encontrados.has(i)) faltando.push(i);
  }
  return { ok: faltando.length === 0, faltando, total: encontrados.size };
}

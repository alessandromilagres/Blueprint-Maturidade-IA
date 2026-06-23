/**
 * Metodologia financeira Blueprint IA (espelho do backend).
 */

export const NOTA_METODOLOGIA_ROI_CURTA =
  'Benefício bruto = valor econômico anual estimado antes de abater investimento em IA. ' +
  'Ganho líquido = benefício bruto − investimento. ' +
  'ROI líquido = (ganho líquido ÷ investimento) × 100. ' +
  'Faixas MIT por nível indicam ROI líquido típico sobre investimento em capacidades de IA — não margem sobre o faturamento total.';

export const MIT_ROI_POR_NIVEL = {
  1: { roiMin: -50, roiMax: 50, roiMed: 0, investPctMin: 0.5, investPctMax: 1, tempo: '18-24 meses' },
  2: { roiMin: 50, roiMax: 150, roiMed: 100, investPctMin: 1, investPctMax: 2, tempo: '12-18 meses' },
  3: { roiMin: 150, roiMax: 300, roiMed: 200, investPctMin: 2, investPctMax: 4, tempo: '9-12 meses' },
  4: { roiMin: 300, roiMax: 500, roiMed: 400, investPctMin: 4, investPctMax: 7, tempo: '6-9 meses' },
  5: { roiMin: 500, roiMax: 1000, roiMed: 700, investPctMin: 7, investPctMax: 12, tempo: '3-6 meses' }
};

export function calcularMetricasCenarioFinanceiro(beneficioBruto, investimentoAnual) {
  const inv = Number(investimentoAnual) || 0;
  const bruto = Number(beneficioBruto) || 0;
  const liquido = bruto - inv;
  const roiLiquidoPct = inv > 0 ? (liquido / inv) * 100 : null;
  const retornoBrutoMultiplo = inv > 0 ? bruto / inv : null;

  return {
    beneficioBrutoAnual: bruto,
    investimentoAnual: inv,
    ganhoLiquidoAnual: liquido,
    roiLiquidoPct: roiLiquidoPct != null ? parseFloat(roiLiquidoPct.toFixed(1)) : null,
    retornoBrutoMultiplo:
      retornoBrutoMultiplo != null ? parseFloat(retornoBrutoMultiplo.toFixed(2)) : null,
    economia: bruto,
    roi: retornoBrutoMultiplo != null ? parseFloat(retornoBrutoMultiplo.toFixed(2)) : null,
    payback: null
  };
}

export function enriquecerCenarioFinanceiro(cenario, investimentoAnual) {
  const bruto = cenario?.beneficioBrutoAnual ?? cenario?.economia ?? 0;
  const metricas = calcularMetricasCenarioFinanceiro(bruto, investimentoAnual);
  return {
    ...cenario,
    ...metricas,
    payback: cenario?.payback ?? metricas.payback
  };
}

export function formatarMoedaCompacta(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}k`;
  return `R$ ${Math.round(n).toLocaleString('pt-BR')}`;
}

export function faixaRoiLiquidoMitNivel(nivel) {
  const r = MIT_ROI_POR_NIVEL[nivel];
  if (!r) return null;
  return `${r.roiMin}% a ${r.roiMax}% (ROI líquido sobre investimento em IA)`;
}

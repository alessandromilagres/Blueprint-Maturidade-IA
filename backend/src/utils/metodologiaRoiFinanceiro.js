/**
 * Metodologia financeira Blueprint IA — separa benefício bruto, investimento e ROI líquido.
 * Benchmarks MIT/McKinsey/BCG permanecem como referência de maturidade; projeções calibradas
 * deixam explícito se o custo foi abatido.
 */

export const NOTA_METODOLOGIA_ROI_CURTA =
  'Benefício bruto = valor econômico anual estimado antes de abater investimento em IA. ' +
  'Ganho líquido = benefício bruto − investimento. ' +
  'ROI líquido = (ganho líquido ÷ investimento) × 100. ' +
  'Faixas MIT por nível indicam ROI líquido típico sobre investimento em capacidades de IA — não margem sobre o faturamento total.';

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
    /** @deprecated use beneficioBrutoAnual */
    economia: bruto,
    /** @deprecated use retornoBrutoMultiplo — não é ROI líquido */
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

function fmtMoeda(valor) {
  if (valor == null || !Number.isFinite(Number(valor))) return '—';
  return `R$ ${Math.round(Number(valor)).toLocaleString('pt-BR')}`;
}

function fmtPct(valor) {
  if (valor == null || !Number.isFinite(Number(valor))) return '—';
  return `${Number(valor).toFixed(0)}%`;
}

/**
 * Bloco Markdown para prompts IA e exportações — tabela de cenários com ROI líquido explícito.
 */
export function blocoParametrosFinanceirosMarkdown(finProj) {
  if (!finProj?.cenarios) return '';

  const inv = finProj.usaFaturamento
    ? finProj.investimentoAnualReferencia
    : finProj.baseInvestimento;

  const linhas = ['conservador', 'base', 'agressivo'].map((chave) => {
    const c = enriquecerCenarioFinanceiro(finProj.cenarios[chave], inv);
    const nome = chave.charAt(0).toUpperCase() + chave.slice(1);
    return `| ${nome} | ${fmtMoeda(c.investimentoAnual)} | ${fmtMoeda(c.beneficioBrutoAnual)} | ${fmtMoeda(c.ganhoLiquidoAnual)} | ${fmtPct(c.roiLiquidoPct)} | ${c.payback ?? '—'} meses |`;
  });

  let md = `## Parâmetros financeiros (calibragem — obrigatório nas projeções)\n\n`;
  md += `### Como ler os números (credibilidade para CFO/conselho)\n\n`;
  md += `| Conceito | O que significa |\n`;
  md += `|:---|:---|\n`;
  md += `| **Benefício bruto estimado** | Valor econômico anual (economia + receita incremental) **antes** de abater investimento em IA |\n`;
  md += `| **Investimento de referência** | Custo anual típico em capacidades de IA (talento, dados, plataforma, governança, casos de uso) |\n`;
  md += `| **Ganho líquido** | Benefício bruto − investimento — **custo abatido** |\n`;
  md += `| **ROI líquido %** | (Ganho líquido ÷ investimento) × 100 — métrica financeira padrão |\n`;
  md += `| **Benchmark MIT por nível** | Faixa de **ROI líquido** sobre investimento em IA (referência MIT CISR / McKinsey / BCG) — **não** margem sobre faturamento total |\n\n`;

  if (finProj.usaFaturamento) {
    md += `- **Faturamento anual do projeto:** ${fmtMoeda(finProj.faturamentoAnualProjeto)}\n`;
    md += `- **Percentual de referência para escalar benefício bruto:** ${finProj.percentualReferenciaRoi}% do faturamento\n\n`;
  } else {
    md += `- **Faturamento:** não calibrado — cenários usam investimento de referência fixo ${fmtMoeda(inv)}\n\n`;
  }

  md += `### Cenários projetados (horizonte 12 meses)\n\n`;
  md += `| Cenário | Investimento 12m | Benefício bruto 12m | Ganho líquido 12m | ROI líquido | Payback |\n`;
  md += `|:---:|:---:|:---:|:---:|:---:|:---:|\n`;
  md += `${linhas.join('\n')}\n\n`;
  md += `**Regra para redação:** sempre apresente **benefício bruto** e **ROI líquido** em colunas ou frases separadas. Nunca apresente o múltiplo bruto (benefício÷investimento) como se fosse ROI líquido.\n`;

  return md;
}

export function blocoMetodologiaRoiExecutivaMarkdown() {
  return `### Metodologia ROI (obrigatória em qualquer seção financeira)

${NOTA_METODOLOGIA_ROI_CURTA}

Ao citar benchmarks MIT/McKinsey/BCG por nível de maturidade, rotule como **"ROI líquido típico sobre investimento em IA (referência de mercado)"**. Nas projeções calibradas em R$, mostre investimento, benefício bruto, ganho líquido e ROI líquido em linhas distintas.`;
}

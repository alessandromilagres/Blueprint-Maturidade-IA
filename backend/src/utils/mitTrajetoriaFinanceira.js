/**
 * Referência MIT CISR: ROI típico como retorno SOBRE INVESTIMENTO em capacidades de IA
 * (alinhado às faixas usadas nas exportações / modelo interno).
 */
import { percentualReferenciaRoi } from './roiPorFaturamento.js';
import { nivelNumericoDeScore } from './nivelMaturidadeRubrica.js';

export const MIT_ROI_POR_NIVEL = {
  1: { roiMin: -50, roiMax: 50, roiMed: 0, investPctMin: 0.5, investPctMax: 1, tempo: '18-24 meses' },
  2: { roiMin: 50, roiMax: 150, roiMed: 100, investPctMin: 1, investPctMax: 2, tempo: '12-18 meses' },
  3: { roiMin: 150, roiMax: 300, roiMed: 200, investPctMin: 2, investPctMax: 4, tempo: '9-12 meses' },
  4: { roiMin: 300, roiMax: 500, roiMed: 400, investPctMin: 4, investPctMax: 7, tempo: '6-9 meses' },
  5: { roiMin: 500, roiMax: 1000, roiMed: 700, investPctMin: 7, investPctMax: 12, tempo: '3-6 meses' }
};

export function nivelMitFromScore(scoreGeral) {
  return nivelNumericoDeScore(scoreGeral);
}

/**
 * Bloco Markdown para dados do assessment (book / prompts IA).
 */
export function blocoTrajetoriaMitMarkdown({ scoreGeral, faturamentoAnualProjeto }) {
  const n0 = nivelMitFromScore(scoreGeral);
  const fat =
    faturamentoAnualProjeto != null && Number(faturamentoAnualProjeto) > 0
      ? Number(faturamentoAnualProjeto)
      : null;
  const pctRef = percentualReferenciaRoi(fat);

  let md = `## Trajetória de valor MIT CISR (ROI × maturidade)\n\n`;
  md += `**Leitura correta do ROI Blueprint:** no Enterprise AI Maturity Model (MIT CISR), os percentuais por nível são **ROI líquido típico sobre o investimento anual em capacidades de IA** (talento, dados, plataforma, governança, casos de uso)—**não** margem líquida nem lucro da empresa sobre receita total.\n\n`;
  md += `| Conceito | Definição |\n`;
  md += `|:---|:---|\n`;
  md += `| **Benefício bruto estimado** | Valor econômico anual antes de abater o investimento em IA |\n`;
  md += `| **Ganho líquido** | Benefício bruto − investimento (custo abatido) |\n`;
  md += `| **ROI líquido % (benchmark MIT)** | (Ganho líquido ÷ investimento) × 100 — faixas por nível abaixo |\n\n`;
  md += `**Por que o número pode parecer “baixo” no curto prazo:** no nível atual (${n0}), parte do esforço ainda é **fundação** (dados, governança, pilotos); o ganho **acumulado no longo prazo** aparece quando a organização **consolida práticas do nível seguinte**, onde as faixas de ROI do benchmark MIT são sistematicamente mais altas.\n\n`;
  md += `| Nível MIT | ROI líquido típico (sobre invest. em IA) | Horizonte típico |\n`;
  md += `|:---:|:---:|:---:|\n`;
  for (let n = 1; n <= 5; n++) {
    const r = MIT_ROI_POR_NIVEL[n];
    md += `| **${n}** | ${r.roiMin}% a ${r.roiMax}% (média ${r.roiMed}%) | ${r.tempo} |\n`;
  }
  md += `\n**Transição de nível:** ao avançar de **Nível ${n0}** para **Nível ${Math.min(n0 + 1, 5)}**, o benchmark indica migração para a **faixa de ROI da linha seguinte** (maior retorno sobre cada real investido em IA), desde que investimento e práticas acompanhem as recomendações do modelo.\n\n`;

  if (fat && pctRef) {
    md += `### Estimativa em R$ (ordem de grandeza — premissa MIT)\n\n`;
    md += `- Faturamento anual do projeto: **R$ ${fat.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}**\n`;
    md += `- Percentual de referência para escalar projeções: **${pctRef}%** do faturamento\n\n`;
    md += `Para cada nível-alvo (consolidando práticas típicas daquele estágio), investimento anual em IA no benchmark costuma situar-se entre **${MIT_ROI_POR_NIVEL[1].investPctMin}% e ${MIT_ROI_POR_NIVEL[5].investPctMax}%** do faturamento, crescente com o nível. Usando o **ponto médio** da faixa de investimento de cada nível sobre o faturamento informado:\n\n`;
    md += `| Nível-alvo | Inv. anual ref. (≈ médio MIT) | Ganho líquido anual médio | Benefício bruto anual (líq. + invest.) |\n`;
    md += `|:---:|:---:|:---:|:---:|\n`;
    for (let n = 1; n <= 5; n++) {
      const r = MIT_ROI_POR_NIVEL[n];
      const pctInvMed = (r.investPctMin + r.investPctMax) / 2;
      const inv = fat * (pctInvMed / 100);
      const ganhoLiquido = inv * (r.roiMed / 100);
      const beneficioBruto = inv + ganhoLiquido;
      md += `| ${n} | R$ ${Math.round(inv).toLocaleString('pt-BR')} | R$ ${Math.round(ganhoLiquido).toLocaleString('pt-BR')} | R$ ${Math.round(beneficioBruto).toLocaleString('pt-BR')} |\n`;
    }
    md += `\n*Valores ilustrativos para comunicar **ganho de longo prazo ao mudar de nível**; não são garantia contratual.*\n`;
  } else {
    md += `Cadastre o **faturamento anual do projeto** no sistema para que os relatórios mostrem a mesma trajetória **em R$**.\n`;
  }

  return md;
}

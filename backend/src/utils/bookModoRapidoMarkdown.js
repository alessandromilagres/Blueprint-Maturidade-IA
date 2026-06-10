import {
  MIT_ROI_POR_NIVEL,
  nivelMitFromScore,
  blocoTrajetoriaMitMarkdown
} from './mitTrajetoriaFinanceira.js';

function resumirPergunta(texto, max = 90) {
  const t = String(texto || '').trim();
  if (t.length <= max) return t;
  return `${t.substring(0, max - 3)}...`;
}

/**
 * Texto-guia para a seção "Ganho no longo prazo (MIT CISR)" no Book modo rápido.
 * A IA deve seguir esta estrutura (pode adaptar redação, não omitir os quatro blocos).
 */
export function blocoGanhoLongoPrazoMitBookRapido({ scoreGeral, faturamentoAnualProjeto }) {
  const n0 = nivelMitFromScore(scoreGeral);
  const n1 = Math.min(n0 + 1, 5);
  const r0 = MIT_ROI_POR_NIVEL[n0];
  const r1 = MIT_ROI_POR_NIVEL[n1];
  const nomes = [
    'Inicial / Experimentando',
    'Oportunista / Preparando',
    'Sistemático / Escalando',
    'Diferenciado / Industrializando',
    'Transformador / Liderando'
  ];

  let md = `### Modelo para o parágrafo "Ganho no longo prazo (MIT CISR)" (use estes 4 blocos curtos)\n\n`;
  md += `**1) O que estamos medindo**\n`;
  md += `O assessment posiciona a organização no **Nível ${n0} (${nomes[n0 - 1]})**, com score consolidado **${Number(scoreGeral).toFixed(2)}** (escala 1–5). `;
  md += `No MIT CISR, evoluir de maturidade significa investir de forma estruturada em **capacidades de IA** (dados, pessoas, governança, plataforma e casos de uso).\n\n`;

  md += `**2) O que o ROI do modelo NÃO é**\n`;
  md += `Os percentuais de ROI por nível **não** representam lucro da empresa sobre o faturamento total nem margem líquida automática. `;
  md += `Eles indicam, em média, **quanto retorno típico se obtém sobre cada real investido em IA** naquele estágio de maturidade.\n\n`;

  md += `**3) Por que o ganho parece modesto agora**\n`;
  md += `No **Nível ${n0}**, parte do esforço ainda é **fundação** (dados, governança, pilotos). `;
  md += `A faixa de ROI típica deste estágio é **${r0.roiMin}% a ${r0.roiMax}%** sobre o investimento em IA (horizonte **${r0.tempo}**). `;
  md += `Isso explica projeções conservadoras no curto prazo — não significa que IA não gera valor, e sim que o retorno **acumula** quando as práticas do próximo nível se consolidam.\n\n`;

  md += `**4) Ganho no longo prazo ao subir um nível**\n`;
  md += `Ao consolidar o **Nível ${n1} (${nomes[n1 - 1]})**, o benchmark MIT aponta faixa de ROI **${r1.roiMin}% a ${r1.roiMax}%** (média **${r1.roiMed}%**) sobre o investimento em IA, em horizonte **${r1.tempo}**. `;
  md += `O ganho estratégico é **passar da linha ${n0} para a linha ${n1}** da trajetória — maior retorno por real investido em capacidades de IA, não multiplicar o faturamento da empresa por um percentual isolado.\n`;

  if (faturamentoAnualProjeto != null && Number(faturamentoAnualProjeto) > 0) {
    const fat = Number(faturamentoAnualProjeto);
    const pctInv0 = (r0.investPctMin + r0.investPctMax) / 2;
    const pctInv1 = (r1.investPctMin + r1.investPctMax) / 2;
    const inv0 = fat * (pctInv0 / 100);
    const inv1 = fat * (pctInv1 / 100);
    const ret0 = inv0 * (r0.roiMed / 100);
    const ret1 = inv1 * (r1.roiMed / 100);
    md += `\n*Ordem de grandeza (premissa MIT, faturamento R$ ${fat.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}): investimento médio em IA ~R$ ${Math.round(inv0).toLocaleString('pt-BR')} no nível ${n0} vs ~R$ ${Math.round(inv1).toLocaleString('pt-BR')} no nível ${n1}; retorno médio esperado sobre esse investimento ~R$ ${Math.round(ret0).toLocaleString('pt-BR')} → ~R$ ${Math.round(ret1).toLocaleString('pt-BR')}.*\n`;
  }

  md += `\n*(Referência detalhada: bloco "Trajetória de valor MIT CISR" abaixo.)*\n`;
  return md;
}

/** Tabela Markdown de perguntas de uma dimensão; última linha = score geral da dimensão. */
export function tabelaPerguntasDimensaoMarkdown(dim) {
  const linhas = (dim.perguntas || []).map(
    (p) => `| ${p.numero} | ${resumirPergunta(p.texto)} | ${p.score.toFixed(2)} |`
  );
  if (linhas.length === 0) {
    return `| — | *(sem respostas consolidadas nesta dimensão)* | — |\n| **Score geral da dimensão** | **${dim.area}** | **${dim.score.toFixed(2)}** |`;
  }
  return [
    '| # | Pergunta | Score |',
    '|:---:|:---|:---:|',
    ...linhas,
    `| **—** | **Score geral da dimensão** | **${dim.score.toFixed(2)}** |`
  ].join('\n');
}

/**
 * Apêndice C e referência para Seção 3 (modo rápido): todas as dimensões + linha final do projeto.
 */
export function apendiceScoresPorPerguntaBookRapido(scoresPorArea, scoreGeral, nivel, nomesNivel) {
  const partes = scoresPorArea.map((dim) => {
    return `#### ${dim.area}\n\n${tabelaPerguntasDimensaoMarkdown(dim)}`;
  });
  const blocoFinal = [
    '#### Consolidado do projeto',
    '',
    '| Indicador | Valor |',
    '|:---|:---:|',
    `| **Score geral do projeto** | **${scoreGeral.toFixed(2)}** |`,
    `| **Nível de maturidade** | **${nivel} — ${nomesNivel[nivel - 1] || ''}** |`,
    '',
    '*O score geral é a média das dimensões com score > 0 no consolidado do dashboard.*'
  ].join('\n');
  return `${partes.join('\n\n')}\n\n${blocoFinal}`;
}

/** Bloco extra injetado no modo rápido (ganho MIT + tabelas prontas). */
export function blocoDadosExtrasBookRapido({
  scoresPorArea,
  scoreGeral,
  nivel,
  nomesNivel,
  faturamentoAnualProjeto
}) {
  const tabelasDim = scoresPorArea
    .map((dim) => `### Tabela — ${dim.area}\n\n${tabelaPerguntasDimensaoMarkdown(dim)}`)
    .join('\n\n');

  return `${blocoGanhoLongoPrazoMitBookRapido({ scoreGeral, faturamentoAnualProjeto })}

## Tabelas de scores por dimensão (reproduza no book; **não remova a última linha** de cada tabela)

${tabelasDim}

## Apêndice C — modelo completo (copie na Seção 12.C)

${apendiceScoresPorPerguntaBookRapido(scoresPorArea, scoreGeral, nivel, nomesNivel)}

${blocoTrajetoriaMitMarkdown({ scoreGeral, faturamentoAnualProjeto })}
`;
}

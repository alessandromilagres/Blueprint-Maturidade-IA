import {
  MIT_ROI_POR_NIVEL,
  nivelMitFromScore,
  blocoTrajetoriaMitMarkdown
} from './mitTrajetoriaFinanceira.js';
import { ORDEM_DIMENSOES_FRAMEWORK } from './ordemDimensoesFramework.js';

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
  md += `Eles indicam **ROI líquido típico** — (benefício bruto − investimento em IA) ÷ investimento — naquele estágio de maturidade (referência MIT CISR / McKinsey / BCG).\n\n`;

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
    const ganho0 = inv0 * (r0.roiMed / 100);
    const ganho1 = inv1 * (r1.roiMed / 100);
    md += `\n*Ordem de grandeza (premissa MIT, faturamento R$ ${fat.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}): investimento médio em IA ~R$ ${Math.round(inv0).toLocaleString('pt-BR')} (nível ${n0}) → ~R$ ${Math.round(inv1).toLocaleString('pt-BR')} (nível ${n1}); ganho líquido médio ~R$ ${Math.round(ganho0).toLocaleString('pt-BR')} → ~R$ ${Math.round(ganho1).toLocaleString('pt-BR')} (custo abatido).*\n`;
  }

  md += `\n*(Referência detalhada: bloco "Trajetória de valor MIT CISR" abaixo.)*\n`;
  return md;
}

/** Dimensão sem score consolidado (0 ou sem respostas na rodada). */
export function dimensaoComScoreZero(dim) {
  return Boolean(dim?.semDadosConsolidados) || Number(dim?.score) <= 0;
}

/** Tabela Markdown de perguntas de uma dimensão; última linha = score geral da dimensão. */
export function tabelaPerguntasDimensaoMarkdown(dim) {
  const scoreDimensao = dimensaoComScoreZero(dim) ? '0.00' : dim.score.toFixed(2);
  const linhas = (dim.perguntas || []).map(
    (p) =>
      `| ${p.numero} | ${resumirPergunta(p.texto)} | ${
        p.totalRespostas > 0 ? p.score.toFixed(2) : '0.00'
      } |`
  );
  if (linhas.length === 0) {
    return `| — | *(sem perguntas cadastradas nesta dimensão)* | — |\n| **Score geral da dimensão** | **${dim.area}** | **${scoreDimensao}** |`;
  }
  return [
    '| # | Pergunta | Score |',
    '|:---:|:---|:---:|',
    ...linhas,
    `| **—** | **Score geral da dimensão** | **${scoreDimensao}** |`
  ].join('\n');
}

/** Cabeçalho da subseção 3.X no book (com ou sem dados consolidados). */
export function rotuloDimensaoBookMarkdown(dim, { bookCompleto = false } = {}) {
  const nome = String(dim.area || '').trim();
  const sep = bookCompleto ? ' · ' : ' | ';
  if (dimensaoComScoreZero(dim)) {
    return `## {numSecao} Dimensão — ${nome} — Score 0${sep}Não analisada neste relatório`;
  }
  return `## {numSecao} Dimensão — ${nome} — Score ${dim.score.toFixed(2)}${sep}Nível ${dim.nivel}`;
}

export function aplicarNumSecaoRotuloDimensao(numSecao, dim, opts = {}) {
  return rotuloDimensaoBookMarkdown(dim, opts).replace('{numSecao}', numSecao);
}

export function introducaoSecao3BookMarkdown(totalDimensoes, { modoRapido = false } = {}) {
  const notaZero = modoRapido
    ? ' Dimensões com **score 0** constam apenas para registro e **não são analisadas**.'
    : ' Dimensões com **score 0** constam para registro e **não são analisadas**.';
  const listaOrdem = ORDEM_DIMENSOES_FRAMEWORK.map((nome, idx) => `${idx + 1}. ${nome}`).join('\n');
  return `# 3. DIAGNÓSTICO POR DIMENSÃO

Este capítulo apresenta as **${totalDimensoes} dimensões** do framework Blueprint IA na ordem abaixo.${notaZero}

${listaOrdem}

**Estrutura de numeração (obrigatória em todo o capítulo):**
- **3.N** — título da dimensão (nível ## no Markdown)
- **3.N.1**, **3.N.2**, … — subseções da dimensão (nível ### no Markdown)`;
}

/** Remove cabeçalhos duplicados que a IA costuma gerar na Seção 3. */
export function limparConteudoIaSecao3Dimensao(markdown, numSecao, { bookCompleto = false } = {}) {
  if (!markdown) return '';
  const esc = numSecao.replace(/\./g, '\\.');
  const reDimHeader = new RegExp(`^#{1,2}\\s+${esc}\\b`, 'i');
  const reDimensaoTituloDuplicado = new RegExp(`^#{1,2}\\s+${esc}\\s+Dimens[aã]o\\s*[—–-]`, 'i');
  const reSub = new RegExp(`^(#{1,4})\\s+(${esc}\\.\\d+)\\s*(.*)$`);
  const linhas = String(markdown).split('\n');
  const out = [];
  let inFence = false;

  for (const linha of linhas) {
    const t = linha.trim();
    if (t.startsWith('```')) {
      inFence = !inFence;
      out.push(linha);
      continue;
    }
    if (inFence) {
      out.push(linha);
      continue;
    }
    if (/^#\s+3\.\s*DIAGNÓSTICO/i.test(t)) continue;

    if (bookCompleto) {
      if (reDimensaoTituloDuplicado.test(t)) continue;
      if (/^#{1,2}\s+dimens[aã]o\s*[—–-]/i.test(t) && t.includes(numSecao)) continue;
      const sub = linha.match(reSub);
      if (sub) {
        const titulo = sub[3] ? ` ${sub[3].trim()}` : '';
        out.push(`### ${sub[2]}${titulo}`);
        continue;
      }
      out.push(linha);
      continue;
    }

    if (reDimHeader.test(t)) continue;
    if (/^#{1,2}\s+dimens[aã]o\s*[—–-]/i.test(t) && t.includes(numSecao)) continue;

    const sub = linha.match(reSub);
    if (sub) {
      const titulo = sub[3] ? ` ${sub[3].trim()}` : '';
      out.push(`### ${sub[2]}${titulo}`);
      continue;
    }
    out.push(linha);
  }

  return out.join('\n').trim();
}

/** Monta bloco final da dimensão com cabeçalho padronizado + corpo limpo da IA. */
export function montarBlocoSecao3Dimensao({
  numSecao,
  dim,
  conteudoIa,
  isFirst = false,
  totalDimensoes = 16,
  modoRapido = false
}) {
  const bookCompleto = !modoRapido;
  const partes = [];
  if (isFirst) partes.push(introducaoSecao3BookMarkdown(totalDimensoes, { modoRapido }));
  partes.push(aplicarNumSecaoRotuloDimensao(numSecao, dim, { bookCompleto }));
  const corpo = limparConteudoIaSecao3Dimensao(conteudoIa, numSecao, { bookCompleto });
  if (corpo) partes.push(corpo);
  return partes.join('\n\n').trim();
}

export function instrucaoPromptSecao3SemCabecalhos(numSecao, isFirst) {
  if (isFirst) {
    return `Esta é a **primeira dimensão** da Seção 3. **NÃO** gere "# 3. DIAGNÓSTICO POR DIMENSÃO" nem "## ${numSecao} Dimensão — …" — o sistema insere esses títulos automaticamente.\n\nComece **diretamente** com ### ${numSecao}.1\n\n`;
  }
  return `Gere **somente** o conteúdo da dimensão **${numSecao}**. **NÃO** gere "# 3." nem "## ${numSecao}" — comece diretamente com ### ${numSecao}.1\n\n`;
}

/**
 * Bloco fixo da Seção 3 para dimensões com score 0 — consta no book, sem análise IA.
 */
/** Conta cabeçalhos ## 3.N Dimensão — … no book montado. */
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

/** Preenche slots vazios da Seção 3 (erro de chunk, cancelamento parcial, etc.). */
export function garantirBlocosSecao3Book(blocosPorIndice, dimensoesDiagnostico, { modoRapido = false } = {}) {
  const total = dimensoesDiagnostico.length;
  return blocosPorIndice.map((bloco, idx) => {
    if (bloco) return bloco;
    const dim = dimensoesDiagnostico[idx];
    const numSecao = `3.${idx + 1}`;
    if (dimensaoComScoreZero(dim)) {
      return blocoDimensaoScoreZeroSecao3(numSecao, dim, {
        isFirst: idx === 0,
        totalDimensoes: total
      });
    }
    return montarBlocoSecao3Dimensao({
      numSecao,
      dim,
      conteudoIa: `### ${numSecao}.1 Status da dimensão\n\n> ⚠️ **Conteúdo não gerado** — bloco ausente na montagem do book. Regenere o relatório.\n\n### ${numSecao}.2 Registro de scores por pergunta\n\n${tabelaPerguntasDimensaoMarkdown(dim)}`,
      isFirst: idx === 0,
      totalDimensoes: total,
      modoRapido
    });
  });
}

export function blocoFallbackErroSecao3Dimensao(
  numSecao,
  dim,
  erroMsg,
  { isFirst = false, totalDimensoes = 16, modoRapido = false } = {}
) {
  const msg = String(erroMsg || 'erro temporário').slice(0, 300);
  return montarBlocoSecao3Dimensao({
    numSecao,
    dim,
    conteudoIa: `### ${numSecao}.1 Status da dimensão\n\n> ⚠️ **Esta seção não pôde ser gerada pela IA** (${msg}).\n\n### ${numSecao}.2 Registro de scores por pergunta\n\n${tabelaPerguntasDimensaoMarkdown(dim)}`,
    isFirst,
    totalDimensoes,
    modoRapido
  });
}

export function blocoDimensaoScoreZeroSecao3(numSecao, dim, { isFirst = false, totalDimensoes = 16, modoRapido = true } = {}) {
  const bookCompleto = !modoRapido;
  let md = '';
  if (isFirst) {
    md += `${introducaoSecao3BookMarkdown(totalDimensoes, { modoRapido })}\n\n`;
  }
  md += `${aplicarNumSecaoRotuloDimensao(numSecao, dim, { bookCompleto })}\n\n`;
  md += `### ${numSecao}.1 Status da dimensão\n\n`;
  md += `> **Esta dimensão não será analisada** porque o score consolidado é **0** — não há avaliações consolidadas nesta rodada.\n\n`;
  md += `### ${numSecao}.2 Registro de scores por pergunta\n\n${tabelaPerguntasDimensaoMarkdown(dim)}\n`;
  return md;
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
    '*O score geral é a média das dimensões com score > 0 no consolidado do dashboard. As 16 dimensões do framework aparecem no Apêndice C (dimensões com score 0 constam apenas para registro, sem análise diagnóstica).*'
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

  return `## Tabelas de scores por dimensão (reproduza no book; **não remova a última linha** de cada tabela)

${tabelasDim}

## Apêndice C — modelo completo (copie na Seção 12.C)

${apendiceScoresPorPerguntaBookRapido(scoresPorArea, scoreGeral, nivel, nomesNivel)}

${blocoTrajetoriaMitMarkdown({ scoreGeral, faturamentoAnualProjeto })}
`;
}

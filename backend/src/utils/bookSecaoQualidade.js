/**
 * Orçamentos de redação + validação pós-geração para seções críticas do book IA
 * (descrição da unidade, tabela-resumo do roadmap, próximos passos).
 */

export const INSTRUCAO_FECHAR_FRASE_COMPLETA =
  'Sempre termine com frase completa e pontuação. Se estiver perto do limite de tamanho, priorize fechar a frase e a seção atual em vez de iniciar conteúdo novo.';

export const INSTRUCAO_RETRY_QUALIDADE =
  'REGENERAÇÃO (qualidade): seja mais conciso; feche todas as frases com pontuação; respeite o orçamento de tamanho e o número de linhas/itens pedidos; não invente fatos.';

const PONTUACAO_FINAL_OK = /[.!?:)”"')\]]\s*$/u;

/** Contagem aproximada de palavras (PT). */
export function contarPalavras(texto) {
  const s = String(texto || '').trim();
  if (!s) return 0;
  return s.split(/\s+/).filter(Boolean).length;
}

/**
 * Normaliza descrição do cadastro para 1 parágrafo ~maxPalavras (determinístico).
 * Cadastro vazio → "—". Não inventa fatos.
 */
export function normalizarDescricaoUnidadeOrcamento(descricao, { maxPalavras = 120 } = {}) {
  const raw = String(descricao || '').trim();
  if (!raw || raw === '—') return '—';

  const collapsed = raw.replace(/\s+/g, ' ').trim();
  const words = collapsed.split(/\s+/).filter(Boolean);
  if (words.length <= maxPalavras) {
    return garantirPontuacaoFinal(collapsed);
  }

  let out = words.slice(0, maxPalavras).join(' ');
  const lastStop = Math.max(out.lastIndexOf('.'), out.lastIndexOf('!'), out.lastIndexOf('?'));
  if (lastStop > Math.floor(out.length * 0.45)) {
    out = out.slice(0, lastStop + 1).trim();
  } else {
    out = garantirPontuacaoFinal(out);
  }
  return out;
}

function garantirPontuacaoFinal(texto) {
  const t = String(texto || '').trim();
  if (!t) return t;
  if (PONTUACAO_FINAL_OK.test(t)) return t;
  return `${t}.`;
}

/** Prompt curto para polir a descrição cadastrada (LLM). */
export function montarPromptPolirDescricaoUnidade(descricaoCadastro, { maxPalavras = 120 } = {}) {
  const fonte = String(descricaoCadastro || '').trim();
  return `ORÇAMENTO DE REDAÇÃO (obrigatório):
- Reescreva a descrição da unidade abaixo em **um único parágrafo**, no máximo **~${maxPalavras} palavras**.
- Preserve apenas fatos do texto; **não invente** missão, sistemas ou dores.
- ${INSTRUCAO_FECHAR_FRASE_COMPLETA}
- Responda **somente** com o parágrafo final (sem título, sem markdown, sem listas).

TEXTO DO CADASTRO:
${fonte}`;
}

/**
 * Dimensões-alvo da tabela-resumo: foco da unidade; se vazio, dimensões no escopo do book.
 * @param {Array<{ area?: string, codigoFramework?: string }>} dimensoesEscopo
 * @returns {string[]} rótulos "Dn — Nome" ou nomes
 */
export function listarDimensoesTabelaResumo(dimensoesEscopo = []) {
  return (dimensoesEscopo || [])
    .map((d) => {
      const cod = String(d?.codigoFramework || '').trim().toUpperCase();
      const nome = String(d?.area || d?.nome || '').trim();
      if (cod && nome) return `${cod} — ${nome}`;
      return nome || cod || '';
    })
    .filter(Boolean);
}

/** Trecho de orçamento para a tabela-resumo (N linhas = foco/escopo real). */
export function instrucaoOrcamentoTabelaResumo(dimensoesEscopo = [], { nRoadmap = 4 } = {}) {
  const dims = listarDimensoesTabelaResumo(dimensoesEscopo);
  const n = Math.max(1, dims.length || 1);
  const lista = dims.length
    ? dims.map((d, i) => `${i + 1}. ${d}`).join('\n')
    : '(use as dimensões presentes no bloco DADOS)';
  return `ORÇAMENTO TABELA-RESUMO (obrigatório):
- Gere **somente** \`### ${nRoadmap}.5 Tabela Resumo do Roadmap\` + **uma** tabela Markdown.
- **Exatamente ${n} linha(s) de dados** — uma por dimensão abaixo (não invente linhas extras; não omita):
${lista}
- Cada célula de ação/iniciativa: **no máximo 20 palavras**.
- Colunas sugeridas: Dimensão | Ação 30d | Ação 60d | Ação 90d | Owner sugerido
- ${INSTRUCAO_FECHAR_FRASE_COMPLETA}`;
}

export function montarPromptTabelaResumoRoadmap({
  regrasTaxonomia = '',
  nRoadmap = 4,
  nProximos = 5,
  dimensoesEscopo = [],
  focoUnidadeTxt = '',
  dados = ''
} = {}) {
  return `${regrasTaxonomia}
# Continuação da Seção ${nRoadmap} — Tabela Resumo

Gere **SOMENTE** a subseção \`### ${nRoadmap}.5 Tabela Resumo do Roadmap\` (e a tabela).
**PARE** antes de "# ${nProximos}." — não gere horizontes 4.1–4.4 de novo nem Próximos Passos.

${instrucaoOrcamentoTabelaResumo(dimensoesEscopo, { nRoadmap })}
${focoUnidadeTxt}

DADOS:
${dados}`;
}

/** Orçamento de próximos passos (books por unidade; também aplicado no template enterprise alinhado). */
export function instrucaoOrcamentoProximosPassos({ maxItens = 4 } = {}) {
  return `ORÇAMENTO PRÓXIMOS PASSOS (obrigatório):
- No máximo **${maxItens} ações numeradas** (não 7–10).
- Cada item: **1–2 frases** com responsável, entregável e prazo.
- ${INSTRUCAO_FECHAR_FRASE_COMPLETA}`;
}

export function blocoInstrucaoFecharFrasePrompt() {
  return `
FECHAMENTO DE TEXTO (CRÍTICO):
- ${INSTRUCAO_FECHAR_FRASE_COMPLETA}
`;
}

function celulasTabela(linha) {
  const t = String(linha || '').trim();
  if (!t.startsWith('|')) return null;
  const parts = t.split('|').slice(1, -1);
  if (parts.length === 0) return null;
  return parts.map((c) => c.trim());
}

function ehSeparadorTabela(celulas) {
  if (!celulas || !celulas.length) return false;
  return celulas.every((c) => /^:?-{3,}:?$/.test(c.replace(/\s/g, '')));
}

/**
 * Heurística: texto parece truncado (corta no meio / termina com vírgula / " e" / barra).
 */
export function pareceTruncado(texto) {
  const t = String(texto || '').trim();
  if (!t) return false;
  if (/[,;/]\s*$/.test(t)) return true;
  if (/\s+e\s*$/i.test(t)) return true;
  if (/\s+(de|da|do|dos|das|para|com|em|no|na|por|que|ou)\s*$/i.test(t)) return true;
  // corta no meio de palavra: termina com letra minúscula sem pontuação e sem espaço recente longo
  if (/[a-záàâãéêíóôõúç]$/i.test(t) && !PONTUACAO_FINAL_OK.test(t)) {
    const ultima = t.split(/\s+/).pop() || '';
    // palavra isolada muito curta no fim após corte típico de token
    if (ultima.length >= 2 && ultima.length <= 12 && !/[.!?]$/.test(t)) {
      // só marca se não parece heading/bullet curto intencional
      if (t.length > 40 || /,/.test(t)) return true;
    }
  }
  return false;
}

function validarParagrafosPontuacao(markdown) {
  const problemas = [];
  const linhas = String(markdown || '').split('\n');
  let buffer = [];

  const flush = () => {
    const para = buffer.join(' ').replace(/\s+/g, ' ').trim();
    buffer = [];
    if (!para || para.length < 25) return;
    if (/^[-*|>]/.test(para) || /^\d+[.)]/.test(para) || para.startsWith('|') || para.startsWith('#')) {
      return;
    }
    if (pareceTruncado(para) || !PONTUACAO_FINAL_OK.test(para)) {
      problemas.push({ tipo: 'pontuacao_paragrafo', trecho: para.slice(0, 120) });
    }
  };

  for (const linha of linhas) {
    const t = linha.trim();
    if (!t) {
      flush();
      continue;
    }
    if (t.startsWith('#') || t.startsWith('|') || t.startsWith('>') || /^[-*]\s/.test(t) || /^\d+[.)]\s/.test(t)) {
      flush();
      continue;
    }
    buffer.push(t);
  }
  flush();
  return problemas;
}

function validarTabelas(markdown) {
  const problemas = [];
  const linhas = String(markdown || '').split('\n');
  let colunasEsperadas = null;
  let emTabela = false;

  for (const linha of linhas) {
    const celulas = celulasTabela(linha);
    if (!celulas) {
      emTabela = false;
      colunasEsperadas = null;
      continue;
    }
    if (ehSeparadorTabela(celulas)) {
      continue;
    }
    if (!emTabela) {
      emTabela = true;
      colunasEsperadas = celulas.length;
      continue;
    }
    if (colunasEsperadas != null && celulas.length !== colunasEsperadas) {
      problemas.push({
        tipo: 'tabela_colunas',
        esperado: colunasEsperadas,
        obtido: celulas.length,
        trecho: linha.slice(0, 120)
      });
    }
    for (const c of celulas) {
      if (c.length > 8 && pareceTruncado(c)) {
        problemas.push({ tipo: 'celula_truncada', trecho: c.slice(0, 80) });
      }
    }
  }
  return problemas;
}

function validarListasNumeradas(markdown) {
  const problemas = [];
  const itens = [];
  const re = /^(\d+)[.)]\s+(.+)$/;
  for (const linha of String(markdown || '').split('\n')) {
    const m = linha.trim().match(re);
    if (m) itens.push({ n: parseInt(m[1], 10), texto: m[2].trim() });
  }
  if (!itens.length) return problemas;
  const ultimo = itens[itens.length - 1];
  if (pareceTruncado(ultimo.texto) || (!PONTUACAO_FINAL_OK.test(ultimo.texto) && ultimo.texto.length > 30)) {
    problemas.push({ tipo: 'lista_item_truncado', trecho: ultimo.texto.slice(0, 120) });
  }
  return problemas;
}

/**
 * @param {string} markdown
 * @param {{ tipo?: 'descricao' | 'tabela_resumo' | 'proximos' | 'generico', maxPalavrasDescricao?: number, linhasTabelaEsperadas?: number, maxItensProximos?: number }} [opts]
 * @returns {{ ok: boolean, problemas: Array<object> }}
 */
export function validarSecaoBookQualidade(markdown, opts = {}) {
  const tipo = opts.tipo || 'generico';
  const texto = String(markdown || '').trim();
  const problemas = [];

  if (!texto) {
    return { ok: false, problemas: [{ tipo: 'vazio' }] };
  }

  if (tipo === 'descricao') {
    const limpo = texto.replace(/^\*\*Descrição\*\*\s*/i, '').trim();
    if (limpo === '—') return { ok: true, problemas: [] };
    const palavras = contarPalavras(limpo);
    if (palavras > (opts.maxPalavrasDescricao || 140)) {
      problemas.push({ tipo: 'descricao_longa', palavras });
    }
    if (/\n\s*\n/.test(limpo) || limpo.split('\n').filter((l) => l.trim()).length > 2) {
      problemas.push({ tipo: 'descricao_multilinha' });
    }
    if (pareceTruncado(limpo) || !PONTUACAO_FINAL_OK.test(limpo)) {
      problemas.push({ tipo: 'descricao_truncada', trecho: limpo.slice(0, 120) });
    }
    return { ok: problemas.length === 0, problemas };
  }

  problemas.push(...validarTabelas(texto));
  problemas.push(...validarListasNumeradas(texto));
  if (tipo !== 'tabela_resumo') {
    problemas.push(...validarParagrafosPontuacao(texto));
  }

  if (tipo === 'tabela_resumo') {
    const linhasDados = String(texto)
      .split('\n')
      .map((l) => celulasTabela(l))
      .filter((c) => c && !ehSeparadorTabela(c));
    // header + N data rows
    const nEsperado = opts.linhasTabelaEsperadas;
    if (nEsperado != null && linhasDados.length >= 1) {
      const dados = linhasDados.length - 1;
      if (dados !== nEsperado) {
        problemas.push({
          tipo: 'tabela_linhas',
          esperado: nEsperado,
          obtido: dados
        });
      }
    }
  }

  if (tipo === 'proximos') {
    const itens = [...texto.matchAll(/^\d+[.)]\s+/gm)];
    const maxItens = opts.maxItensProximos ?? 4;
    if (itens.length > maxItens) {
      problemas.push({ tipo: 'proximos_excesso', obtido: itens.length, max: maxItens });
    }
  }

  return { ok: problemas.length === 0, problemas };
}

/**
 * Escolhe o melhor entre primeira e segunda tentativa (menos problemas; preferir ok).
 */
export function escolherMelhorConteudoQualidade(primeiro, segundo, opts = {}) {
  const a = { content: primeiro, ...validarSecaoBookQualidade(primeiro, opts) };
  const b = { content: segundo, ...validarSecaoBookQualidade(segundo, opts) };
  if (a.ok && !b.ok) return { content: a.content, ok: true, problemas: [], tentativa: 1 };
  if (b.ok && !a.ok) return { content: b.content, ok: true, problemas: [], tentativa: 2 };
  if (b.problemas.length < a.problemas.length) {
    return { content: b.content, ok: b.ok, problemas: b.problemas, tentativa: 2 };
  }
  return { content: a.content, ok: a.ok, problemas: a.problemas, tentativa: 1 };
}

/**
 * Gera conteúdo com 1 retry automático se a validação falhar.
 * @param {(prompt: string, maxTokens?: number) => Promise<{ content: string, stopReason?: string, truncated?: boolean, tokensEntrada?: number, tokensSaida?: number, provider?: string, model?: string }>} gerarFn
 */
export async function gerarComValidacaoQualidade({
  prompt,
  maxTokens,
  gerarFn,
  qualidadeOpts = {},
  chunkId = '',
  chunkLabel = ''
}) {
  const primeiro = await gerarFn(prompt, maxTokens);
  const v1 = validarSecaoBookQualidade(primeiro.content || '', qualidadeOpts);
  const meta = {
    chunkId,
    chunkLabel,
    stopReason: primeiro.stopReason || null,
    truncated: Boolean(primeiro.truncated),
    qualidadeOk: v1.ok,
    qualidadeProblemas: v1.problemas,
    qualidadeRetry: false
  };

  if (v1.ok) {
    return {
      content: primeiro.content || '',
      tokensEntrada: primeiro.tokensEntrada || 0,
      tokensSaida: primeiro.tokensSaida || 0,
      provider: primeiro.provider,
      model: primeiro.model,
      stopReason: primeiro.stopReason,
      truncated: primeiro.truncated,
      meta,
      warning: null
    };
  }

  const promptRetry = `${prompt}\n\n${INSTRUCAO_RETRY_QUALIDADE}`;
  const segundo = await gerarFn(promptRetry, maxTokens);
  const melhor = escolherMelhorConteudoQualidade(primeiro.content || '', segundo.content || '', qualidadeOpts);
  const warning = melhor.ok
    ? null
    : {
        tipo: 'qualidade_secao',
        chunkId,
        chunkLabel,
        problemas: melhor.problemas,
        mensagem: `Seção "${chunkLabel || chunkId}" com possíveis truncamentos após retry — mantido best effort.`
      };

  return {
    content: melhor.content,
    tokensEntrada: (primeiro.tokensEntrada || 0) + (segundo.tokensEntrada || 0),
    tokensSaida: (primeiro.tokensSaida || 0) + (segundo.tokensSaida || 0),
    provider: segundo.provider || primeiro.provider,
    model: segundo.model || primeiro.model,
    stopReason: segundo.stopReason || primeiro.stopReason,
    truncated: Boolean(segundo.truncated || primeiro.truncated),
    meta: {
      ...meta,
      qualidadeRetry: true,
      qualidadeOk: melhor.ok,
      qualidadeProblemas: melhor.problemas,
      stopReasonRetry: segundo.stopReason || null,
      truncatedRetry: Boolean(segundo.truncated)
    },
    warning
  };
}

/**
 * Orçamento de prompt para book IA / multi-provedor.
 * Evita 413 TPM (ex.: Groq llama-3.3-70b ~12k TPM) e remove erros brutos do markdown.
 */

/** Heurística: ~4 caracteres ≈ 1 token (PT/EN misto). */
export function estimateTokensApprox(text) {
  const s = String(text || '');
  if (!s) return 0;
  return Math.ceil(s.length / 4);
}

/**
 * Detecta payload/contexto/TPM grandes demais (Groq 413, Anthropic context, etc.).
 */
export function isRequestTooLargeError(errorOrMsg) {
  const msg = String(
    typeof errorOrMsg === 'string' ? errorOrMsg : errorOrMsg?.message || ''
  ).toLowerCase();
  if (!msg) return false;
  return (
    /\b413\b/.test(msg) ||
    msg.includes('request too large') ||
    msg.includes('payload too large') ||
    msg.includes('tpm') ||
    msg.includes('tokens per minute') ||
    msg.includes('rate_limit_exceeded') ||
    msg.includes('context_length') ||
    msg.includes('context length') ||
    msg.includes('maximum context') ||
    msg.includes('too many tokens') ||
    msg.includes('prompt is too long') ||
    (msg.includes('max_tokens') && msg.includes('exceed')) ||
    msg.includes('input is too long')
  );
}

/**
 * Mensagem amigável para o book — sem JSON de API, org IDs ou stack.
 * Também inspeciona `providerAttempts` (fallback multi-provedor) para 413/TPM.
 */
export function softAiFailureMessageForBook(errorOrMsg) {
  const attempts = Array.isArray(errorOrMsg?.providerAttempts)
    ? errorOrMsg.providerAttempts
    : [];
  const oversized =
    isRequestTooLargeError(errorOrMsg) ||
    attempts.some((a) => isRequestTooLargeError(a?.error || a?.message || a));
  if (oversized) {
    return 'A análise automática desta seção ficou incompleta por limite de capacidade do provedor de IA. Segue esqueleto com scores oficiais; regenere o book ou esta seção quando a fila de IA estiver disponível.';
  }
  return 'A análise automática desta seção ficou incompleta. Segue esqueleto com scores e tabela de perguntas; regenere o book ou esta seção se necessário.';
}

/**
 * Remove trechos volumosos (guias longos, contexto, inventário) mantendo instruções e DADOS essenciais.
 * Cabeçalho + nota + (opcional miolo) + cauda cabem em maxChars sem cortar o final da cauda.
 */
export function shrinkPromptToCharBudget(prompt, maxChars, { notaTruncagem } = {}) {
  const text = String(prompt || '');
  if (!text || text.length <= maxChars) {
    return { prompt: text, shrunk: false, originalChars: text.length };
  }

  const notaBase =
    notaTruncagem ||
    `\n\n> *[Contexto do prompt reduzido automaticamente para caber no limite do provedor de IA (${text.length}→${maxChars} caracteres). Priorize scores, [Qn] e recomendações acionáveis.]*\n\n`;
  const nota = notaBase.length < maxChars - 160 ? notaBase : '\n\n> *[Prompt reduzido]*\n\n';
  const usable = Math.max(160, maxChars - nota.length);
  const headLen = Math.floor(usable * 0.55);
  const tailLen = usable - headLen;
  const out = `${text.slice(0, headLen)}${nota}${text.slice(-tailLen)}`;
  return {
    prompt: out,
    shrunk: true,
    originalChars: text.length
  };
}

/**
 * Orçamentos seguros por provedor (tokens aproximados input + max_tokens reservados).
 * Groq free/dev llama-3.3-70b-versatile costuma ter TPM 12_000.
 */
export const AI_PROMPT_BUDGETS = {
  groq: {
    tpmLimit: 12_000,
    /** Reserva para saída + margem no minuto */
    maxOutputTokens: 2_500,
    /** ~ chars de prompt+system seguros (~4.5k tokens) */
    maxInputChars: 16_000,
    shrinkSteps: [16_000, 10_000, 6_000, 3_500]
  },
  openai: {
    tpmLimit: 80_000,
    maxOutputTokens: 6_000,
    maxInputChars: 48_000,
    shrinkSteps: [48_000, 28_000, 14_000]
  },
  anthropic: {
    tpmLimit: 200_000,
    maxOutputTokens: 8_000,
    maxInputChars: 80_000,
    shrinkSteps: [80_000, 40_000, 20_000]
  },
  default: {
    tpmLimit: 30_000,
    maxOutputTokens: 4_000,
    maxInputChars: 24_000,
    shrinkSteps: [24_000, 12_000, 6_000]
  }
};

export function getProviderPromptBudget(providerId) {
  return AI_PROMPT_BUDGETS[providerId] || AI_PROMPT_BUDGETS.default;
}

/**
 * Ajusta maxTokens e encolhe o user prompt para caber no orçamento do provedor.
 */
export function fitPromptToProviderBudget(prompt, systemPrompt, options = {}, providerId = 'default') {
  const budget = getProviderPromptBudget(providerId);
  const systemChars = String(systemPrompt || '').length;
  const maxInputChars = Math.max(2_000, budget.maxInputChars - Math.min(systemChars, budget.maxInputChars - 1_500));
  const requestedMax = Number(options.maxTokens) || budget.maxOutputTokens;
  const maxTokens = Math.min(requestedMax, budget.maxOutputTokens);

  const fitted = shrinkPromptToCharBudget(prompt, maxInputChars);
  return {
    prompt: fitted.prompt,
    options: { ...options, maxTokens },
    shrunk: fitted.shrunk,
    originalChars: fitted.originalChars,
    budget,
    providerId
  };
}

/**
 * Próximo teto de caracteres para retry após 413 (menor que o atual).
 */
export function nextShrinkCharBudget(currentPromptChars, providerId = 'default') {
  const budget = getProviderPromptBudget(providerId);
  const steps = budget.shrinkSteps || AI_PROMPT_BUDGETS.default.shrinkSteps;
  const current = Number(currentPromptChars) || 0;
  for (const step of steps) {
    if (step < current * 0.92) return step;
  }
  return Math.max(2_500, Math.floor(current * 0.5));
}

/** Cap de contexto cliente em prompts de dimensão (chars). */
export const PROMPT_CONTEXTO_DIMENSAO_SAFE_CHARS = 8_000;

export function limitarBlocoMarkdown(bloco, maxChars, rotulo = 'bloco') {
  const text = String(bloco || '');
  if (!text || text.length <= maxChars) return text;
  const notaFull = `\n\n> *[${rotulo} truncado para o limite do provedor de IA — ${text.length} caracteres no cadastro]*\n`;
  const nota = notaFull.length < maxChars * 0.6 ? notaFull : '\n\n> *[truncado]*\n';
  const bodyMax = Math.max(0, maxChars - nota.length);
  return `${text.slice(0, bodyMax)}${nota}`;
}

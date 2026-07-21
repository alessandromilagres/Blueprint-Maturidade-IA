/**
 * Streaming de IA para o Assistente (SSE).
 * Suporta Anthropic, OpenAI e Groq via stream=true.
 */
import {
  loadPersistedAIConfig,
  isProviderConfigured,
  PROVIDERS,
  sanitizeUnicodeForJson
} from './ai-provider.js';

function jsonSafe(payload) {
  return JSON.stringify(sanitizeUnicodeForJson(payload));
}

async function* streamAnthropic(prompt, systemPrompt, options = {}) {
  const provider = PROVIDERS.anthropic;
  const apiKey = process.env[provider.envKey];
  if (!apiKey) throw new Error(`${provider.envKey} não configurada`);

  const response = await fetch(provider.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: jsonSafe({
      model: options.model || provider.defaultModel,
      max_tokens: options.maxTokens || 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      stream: true
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic stream ${response.status}: ${err.slice(0, 400)}`);
  }

  yield* iterSseText(response, (evt) => {
    if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
      return evt.delta.text || '';
    }
    return '';
  });
}

async function* streamOpenAICompatible(providerId, prompt, systemPrompt, options = {}) {
  const provider = PROVIDERS[providerId];
  const apiKey = process.env[provider.envKey];
  if (!apiKey) throw new Error(`${provider.envKey} não configurada`);

  const response = await fetch(provider.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: jsonSafe({
      model: options.model || provider.defaultModel,
      max_tokens: options.maxTokens || 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      stream: true
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${provider.name} stream ${response.status}: ${err.slice(0, 400)}`);
  }

  yield* iterSseText(response, (evt) => {
    const piece = evt.choices?.[0]?.delta?.content;
    return piece || '';
  });
}

async function* iterSseText(response, extractText) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Resposta sem body stream');
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const evt = JSON.parse(data);
        const text = extractText(evt);
        if (text) yield text;
      } catch {
        /* ignore partial json */
      }
    }
  }
}

/**
 * @yields {{ type: 'token'|'meta'|'error', text?: string, provider?: string, model?: string, message?: string }}
 */
export async function* streamAI(prompt, systemPrompt, options = {}) {
  await loadPersistedAIConfig();

  const providersToTry = [];
  const configured = process.env.AI_PROVIDER || 'anthropic';
  if (isProviderConfigured(configured)) providersToTry.push(configured);
  for (const p of ['anthropic', 'openai', 'groq']) {
    if (!providersToTry.includes(p) && isProviderConfigured(p)) providersToTry.push(p);
  }
  if (!providersToTry.length) {
    yield { type: 'error', message: 'Nenhum provedor de IA configurado' };
    return;
  }

  let lastError = null;
  for (const providerId of providersToTry) {
    try {
      const model = options.model || PROVIDERS[providerId].defaultModel;
      yield { type: 'meta', provider: providerId, model };

      const gen =
        providerId === 'anthropic'
          ? streamAnthropic(prompt, systemPrompt, options)
          : streamOpenAICompatible(providerId, prompt, systemPrompt, options);

      for await (const token of gen) {
        if (token) yield { type: 'token', text: token };
      }
      return;
    } catch (e) {
      lastError = e;
      console.warn(`[AI stream] ${providerId} falhou:`, e.message);
    }
  }

  yield {
    type: 'error',
    message: lastError?.message || 'Falha no streaming de IA'
  };
}

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

  let messageContent = prompt;
  if (options.imagens?.length) {
    messageContent = [];
    for (const img of options.imagens) {
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mimeType,
          data: img.base64
        }
      });
    }
    messageContent.push({ type: 'text', text: prompt });
  }

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
      messages: [{ role: 'user', content: messageContent }],
      stream: true
    }),
    signal: options.signal || undefined
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
  }, options.signal);
}

async function* streamOpenAICompatible(providerId, prompt, systemPrompt, options = {}) {
  const provider = PROVIDERS[providerId];
  const apiKey = process.env[provider.envKey];
  if (!apiKey) throw new Error(`${provider.envKey} não configurada`);

  if (providerId === 'groq' && options.imagens?.length) {
    throw new Error('Groq não suporta imagens; use Anthropic ou OpenAI');
  }

  let userContent = prompt;
  if (options.imagens?.length) {
    userContent = [];
    for (const img of options.imagens) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` }
      });
    }
    userContent.push({ type: 'text', text: prompt });
  }

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
        { role: 'user', content: userContent }
      ],
      stream: true
    }),
    signal: options.signal || undefined
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${provider.name} stream ${response.status}: ${err.slice(0, 400)}`);
  }

  yield* iterSseText(response, (evt) => {
    const piece = evt.choices?.[0]?.delta?.content;
    return piece || '';
  }, options.signal);
}

function isAbortError(err) {
  return (
    err?.name === 'AbortError' ||
    err?.code === 'ABORT_ERR' ||
    /aborted|AbortError/i.test(String(err?.message || ''))
  );
}

async function* iterSseText(response, extractText, signal) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Resposta sem body stream');
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        const err = new Error('Stream cancelado');
        err.name = 'AbortError';
        throw err;
      }
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
  } catch (e) {
    if (isAbortError(e) || signal?.aborted) {
      const err = new Error('Stream cancelado');
      err.name = 'AbortError';
      throw err;
    }
    throw e;
  } finally {
    try {
      reader.releaseLock?.();
    } catch {
      /* ignore */
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
  const temImagens = Array.isArray(options.imagens) && options.imagens.length > 0;
  const ordem = temImagens ? ['anthropic', 'openai'] : ['anthropic', 'openai', 'groq'];
  if (isProviderConfigured(configured) && (!temImagens || configured !== 'groq')) {
    providersToTry.push(configured);
  }
  for (const p of ordem) {
    if (!providersToTry.includes(p) && isProviderConfigured(p)) providersToTry.push(p);
  }
  if (!providersToTry.length) {
    yield { type: 'error', message: 'Nenhum provedor de IA configurado' };
    return;
  }

  let lastError = null;
  for (const providerId of providersToTry) {
    if (options.signal?.aborted) {
      yield { type: 'aborted' };
      return;
    }
    try {
      const model = options.model || PROVIDERS[providerId].defaultModel;
      yield { type: 'meta', provider: providerId, model };

      const gen =
        providerId === 'anthropic'
          ? streamAnthropic(prompt, systemPrompt, options)
          : streamOpenAICompatible(providerId, prompt, systemPrompt, options);

      for await (const token of gen) {
        if (options.signal?.aborted) {
          yield { type: 'aborted' };
          return;
        }
        if (token) yield { type: 'token', text: token };
      }
      return;
    } catch (e) {
      if (e?.name === 'AbortError' || options.signal?.aborted) {
        yield { type: 'aborted' };
        return;
      }
      lastError = e;
      console.warn(`[AI stream] ${providerId} falhou:`, e.message);
    }
  }

  yield {
    type: 'error',
    message: lastError?.message || 'Falha no streaming de IA'
  };
}

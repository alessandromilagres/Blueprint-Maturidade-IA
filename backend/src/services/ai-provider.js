/**
 * Serviço de IA Multi-Provedor
 * Suporta: Anthropic (Claude), OpenAI (GPT-4), Groq (Llama)
 * 
 * Configuração via variável de ambiente AI_PROVIDER:
 * - 'anthropic' (padrão): Usa Claude
 * - 'openai': Usa GPT-4
 * - 'groq': Usa Llama 3.1 via Groq
 */

import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';

// Configurações dos provedores
const PROVIDERS = {
  anthropic: {
    name: 'Anthropic (Claude)',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-sonnet-4-6',
    envKey: 'ANTHROPIC_API_KEY',
    maxTokens: 16000
  },
  openai: {
    name: 'OpenAI (GPT-4)',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    envKey: 'OPENAI_API_KEY',
    maxTokens: 8192
  },
  groq: {
    name: 'Groq (Llama)',
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    envKey: 'GROQ_API_KEY',
    maxTokens: 8192
  }
};

const CONFIG_PROVIDER_KEY = 'AI_PROVIDER';
let persistedConfigLoaded = false;

/** Timeout por chamada HTTP à API de IA (geração de documentos pode levar vários minutos). */
function getAiFetchSignal() {
  const msRaw = Number(process.env.AI_FETCH_TIMEOUT_MS);
  const ms = Number.isFinite(msRaw) && msRaw >= 60000 ? msRaw : 900000; // padrão 15 min
  try {
    return typeof AbortSignal !== 'undefined' && AbortSignal.timeout
      ? AbortSignal.timeout(ms)
      : undefined;
  } catch {
    return undefined;
  }
}

function getEncryptionKey() {
  const secret = process.env.JWT_SECRET || process.env.AI_CONFIG_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado. Necessário para proteger API keys persistidas.');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decryptSecret(value) {
  if (!value?.startsWith('enc:v1:')) return value || '';
  const [, , ivB64, tagB64, encryptedB64] = value.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(ivB64, 'base64')
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

async function upsertConfig(chave, valor, criptografado = false) {
  await prisma.configuracaoIA.upsert({
    where: { chave },
    update: { valor, criptografado },
    create: { chave, valor, criptografado }
  });
}

async function loadPersistedAIConfig({ force = false } = {}) {
  if (persistedConfigLoaded && !force) return;

  try {
    const configs = await prisma.configuracaoIA.findMany();
    for (const config of configs) {
      if (config.chave === CONFIG_PROVIDER_KEY) {
        process.env.AI_PROVIDER = config.valor;
        continue;
      }

      const provider = Object.values(PROVIDERS).find((p) => p.envKey === config.chave);
      if (!provider) continue;

      process.env[config.chave] = config.criptografado
        ? decryptSecret(config.valor)
        : config.valor;
    }
    persistedConfigLoaded = true;
  } catch (error) {
    // Em ambientes recém-migrados a tabela pode ainda não existir durante tooling local.
    // Não derruba a aplicação: as variáveis do ambiente continuam funcionando.
    console.warn('[AI] Não foi possível carregar configurações persistidas:', error.message);
  }
}

async function saveProviderApiKey(providerId, apiKey) {
  const provider = PROVIDERS[providerId];
  if (!provider) {
    throw new Error(`Provedor inválido: ${providerId}`);
  }

  process.env[provider.envKey] = apiKey;
  await upsertConfig(provider.envKey, encryptSecret(apiKey), true);
  persistedConfigLoaded = false;
}

async function saveCurrentProvider(providerId) {
  if (!PROVIDERS[providerId]) {
    throw new Error(`Provedor inválido: ${providerId}`);
  }

  process.env.AI_PROVIDER = providerId;
  await upsertConfig(CONFIG_PROVIDER_KEY, providerId, false);
  persistedConfigLoaded = false;
}

/**
 * Obtém o provedor atual configurado
 */
function getProvider() {
  const providerName = process.env.AI_PROVIDER || 'anthropic';
  const provider = PROVIDERS[providerName];
  
  if (!provider) {
    throw new Error(`Provedor de IA inválido: ${providerName}. Use: anthropic, openai ou groq`);
  }
  
  return { ...provider, id: providerName };
}

/**
 * Verifica se o provedor está configurado (tem API key)
 */
function isProviderConfigured(providerId) {
  const provider = PROVIDERS[providerId];
  if (!provider) return false;
  return !!process.env[provider.envKey];
}

/**
 * Retorna lista de provedores disponíveis (configurados)
 */
function getAvailableProviders() {
  return Object.entries(PROVIDERS)
    .filter(([id]) => isProviderConfigured(id))
    .map(([id, config]) => ({
      id,
      name: config.name,
      model: config.defaultModel,
      configured: true
    }));
}

/**
 * Retorna status de todos os provedores
 */
function getProvidersStatus() {
  const currentProvider = process.env.AI_PROVIDER || 'anthropic';
  
  return Object.entries(PROVIDERS).map(([id, config]) => ({
    id,
    name: config.name,
    model: config.defaultModel,
    configured: isProviderConfigured(id),
    active: id === currentProvider
  }));
}

/**
 * Chamada para Anthropic (Claude)
 */
async function callAnthropic(prompt, systemPrompt, options = {}) {
  const provider = PROVIDERS.anthropic;
  const apiKey = process.env[provider.envKey];
  
  if (!apiKey) {
    throw new Error(`${provider.envKey} não configurada. Adicione no arquivo .env`);
  }
  
  // Monta o conteúdo da mensagem (pode incluir imagens)
  let messageContent;
  
  if (options.imagens && options.imagens.length > 0) {
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
  } else {
    messageContent = prompt;
  }
  
  const response = await fetch(provider.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    signal: getAiFetchSignal(),
    body: JSON.stringify({
      model: options.model || provider.defaultModel,
      max_tokens: options.maxTokens || provider.maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: messageContent }]
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro na API Anthropic: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  // Anthropic stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use'
  const stopReasonRaw = data.stop_reason;
  const truncated = stopReasonRaw === 'max_tokens';

  return {
    content: data.content[0].text,
    model: data.model,
    tokensEntrada: data.usage?.input_tokens || 0,
    tokensSaida: data.usage?.output_tokens || 0,
    stopReason: truncated ? 'max_tokens' : 'end_turn',
    stopReasonRaw,
    truncated,
    provider: 'anthropic'
  };
}

/**
 * Chamada para OpenAI (GPT-4)
 */
async function callOpenAI(prompt, systemPrompt, options = {}) {
  const provider = PROVIDERS.openai;
  const apiKey = process.env[provider.envKey];
  
  if (!apiKey) {
    throw new Error(`${provider.envKey} não configurada. Adicione no arquivo .env`);
  }
  
  // Monta as mensagens
  const messages = [
    { role: 'system', content: systemPrompt }
  ];
  
  // Se tem imagens, usa formato multimodal
  if (options.imagens && options.imagens.length > 0) {
    const content = [];
    
    for (const img of options.imagens) {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:${img.mimeType};base64,${img.base64}`
        }
      });
    }
    
    content.push({ type: 'text', text: prompt });
    messages.push({ role: 'user', content });
  } else {
    messages.push({ role: 'user', content: prompt });
  }
  
  const response = await fetch(provider.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    signal: getAiFetchSignal(),
    body: JSON.stringify({
      model: options.model || provider.defaultModel,
      max_tokens: options.maxTokens || provider.maxTokens,
      messages
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro na API OpenAI: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  // OpenAI finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls'
  const stopReasonRaw = data.choices[0].finish_reason;
  const truncated = stopReasonRaw === 'length';

  return {
    content: data.choices[0].message.content,
    model: data.model,
    tokensEntrada: data.usage?.prompt_tokens || 0,
    tokensSaida: data.usage?.completion_tokens || 0,
    stopReason: truncated ? 'max_tokens' : 'end_turn',
    stopReasonRaw,
    truncated,
    provider: 'openai'
  };
}

/**
 * Chamada para Groq (Llama)
 */
async function callGroq(prompt, systemPrompt, options = {}) {
  const provider = PROVIDERS.groq;
  const apiKey = process.env[provider.envKey];
  
  if (!apiKey) {
    throw new Error(`${provider.envKey} não configurada. Adicione no arquivo .env`);
  }
  
  // Groq usa formato compatível com OpenAI
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];
  
  // Nota: Groq com Llama não suporta imagens (apenas texto)
  if (options.imagens && options.imagens.length > 0) {
    console.warn('Groq/Llama não suporta imagens. Usando apenas texto.');
  }
  
  const response = await fetch(provider.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    signal: getAiFetchSignal(),
    body: JSON.stringify({
      model: options.model || provider.defaultModel,
      max_tokens: options.maxTokens || provider.maxTokens,
      messages
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro na API Groq: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  // Groq usa formato OpenAI: 'stop' | 'length' | 'content_filter'
  const stopReasonRaw = data.choices[0].finish_reason;
  const truncated = stopReasonRaw === 'length';

  return {
    content: data.choices[0].message.content,
    model: data.model,
    tokensEntrada: data.usage?.prompt_tokens || 0,
    tokensSaida: data.usage?.completion_tokens || 0,
    stopReason: truncated ? 'max_tokens' : 'end_turn',
    stopReasonRaw,
    truncated,
    provider: 'groq'
  };
}

/**
 * Função principal - chama o provedor configurado
 * Faz fallback automático se o provedor principal falhar
 */
async function callAI(prompt, systemPrompt, options = {}) {
  const startTime = Date.now();
  await loadPersistedAIConfig();
  
  // Se foi especificado um provedor específico, usa ele
  const specificProvider = options.provider;
  
  // Ordem de tentativa: provedor específico > configurado > fallback
  const providersToTry = [];
  
  if (specificProvider && isProviderConfigured(specificProvider)) {
    providersToTry.push(specificProvider);
  }
  
  const configuredProvider = process.env.AI_PROVIDER || 'anthropic';
  if (!providersToTry.includes(configuredProvider) && isProviderConfigured(configuredProvider)) {
    providersToTry.push(configuredProvider);
  }
  
  // Adiciona outros provedores configurados como fallback
  const fallbackOrder = ['openai', 'groq', 'anthropic'];
  for (const provider of fallbackOrder) {
    if (!providersToTry.includes(provider) && isProviderConfigured(provider)) {
      providersToTry.push(provider);
    }
  }
  
  if (providersToTry.length === 0) {
    throw new Error('Nenhum provedor de IA configurado. Configure ANTHROPIC_API_KEY, OPENAI_API_KEY ou GROQ_API_KEY no .env');
  }
  
  let lastError = null;
  
  for (const providerId of providersToTry) {
    try {
      console.log(`[AI] Tentando provedor: ${PROVIDERS[providerId].name}`);
      
      let result;
      
      switch (providerId) {
        case 'anthropic':
          result = await callAnthropic(prompt, systemPrompt, options);
          break;
        case 'openai':
          result = await callOpenAI(prompt, systemPrompt, options);
          break;
        case 'groq':
          result = await callGroq(prompt, systemPrompt, options);
          break;
        default:
          throw new Error(`Provedor desconhecido: ${providerId}`);
      }
      
      result.tempoResposta = Date.now() - startTime;
      console.log(`[AI] Sucesso com ${PROVIDERS[providerId].name} em ${result.tempoResposta}ms`);
      
      return result;
      
    } catch (error) {
      console.error(`[AI] Erro com ${PROVIDERS[providerId].name}:`, error.message);
      if (error.cause) {
        console.error(`[AI] Causa do erro:`, error.cause);
      }
      lastError = error;
      
      // Se não há mais provedores para tentar, lança o erro
      if (providersToTry.indexOf(providerId) === providersToTry.length - 1) {
        throw lastError;
      }
      
      console.log(`[AI] Tentando próximo provedor...`);
    }
  }
  
  throw lastError || new Error('Falha em todos os provedores de IA');
}

/**
 * Chama a IA e, se a resposta for truncada por max_tokens, automaticamente
 * solicita continuações até a IA terminar naturalmente (ou atingir o limite
 * de tentativas).
 *
 * Concatena o conteúdo das chamadas e somatoriza os tokens.
 *
 * @param {string} prompt prompt inicial
 * @param {string} systemPrompt system prompt compartilhado
 * @param {object} options opcoes (temperature, maxTokens, model, provider, ...)
 * @param {object} continuationOpts { maxContinuations: 3, minContentTail: 800 }
 */
async function callAIWithContinuation(prompt, systemPrompt, options = {}, continuationOpts = {}) {
  const maxContinuations = continuationOpts.maxContinuations ?? 3;
  const tailChars = continuationOpts.minContentTail ?? 800;

  // 1ª chamada
  const first = await callAI(prompt, systemPrompt, options);

  let combined = first.content || '';
  let tokensEntrada = first.tokensEntrada || 0;
  let tokensSaida = first.tokensSaida || 0;
  let lastResult = first;
  let continuations = 0;

  while (lastResult.truncated && continuations < maxContinuations) {
    continuations++;
    const tail = combined.slice(-tailChars);
    const continuationPrompt = `Continue EXATAMENTE de onde a sua resposta anterior parou. NÃO repita o conteúdo já escrito. NÃO acrescente preâmbulos como "Continuando..." ou "Aqui está o restante". Apenas escreva o próximo token a partir do final mostrado abaixo, mantendo a mesma estrutura, formatação Markdown e estilo.

ÚLTIMOS CARACTERES DA SUA RESPOSTA ANTERIOR (para você se localizar — NÃO os reescreva):
"""
${tail}
"""

CONTINUE A PARTIR DAQUI:`;

    console.log(`[AI] Resposta truncada por max_tokens. Solicitando continuação ${continuations}/${maxContinuations}...`);

    const next = await callAI(continuationPrompt, systemPrompt, options);

    // Garante uma quebra de parágrafo entre as partes (sem dobrar se já houver)
    if (combined.endsWith('\n')) {
      combined += next.content || '';
    } else {
      combined += '\n' + (next.content || '');
    }
    tokensEntrada += next.tokensEntrada || 0;
    tokensSaida += next.tokensSaida || 0;
    lastResult = next;
  }

  return {
    content: combined,
    model: first.model,
    tokensEntrada,
    tokensSaida,
    provider: first.provider,
    tempoResposta: lastResult.tempoResposta,
    stopReason: lastResult.stopReason,
    stopReasonRaw: lastResult.stopReasonRaw,
    truncated: lastResult.truncated,
    continuations
  };
}

/**
 * Alterna para um provedor específico (temporariamente)
 * Retorna uma função que restaura o provedor original
 */
function useProvider(providerId) {
  if (!PROVIDERS[providerId]) {
    throw new Error(`Provedor inválido: ${providerId}`);
  }
  
  if (!isProviderConfigured(providerId)) {
    throw new Error(`Provedor ${providerId} não configurado. Adicione ${PROVIDERS[providerId].envKey} no .env`);
  }
  
  const originalProvider = process.env.AI_PROVIDER;
  process.env.AI_PROVIDER = providerId;
  
  return () => {
    process.env.AI_PROVIDER = originalProvider;
  };
}

export {
  callAI,
  callAIWithContinuation,
  loadPersistedAIConfig,
  saveCurrentProvider,
  saveProviderApiKey,
  getProvider,
  getAvailableProviders,
  getProvidersStatus,
  isProviderConfigured,
  useProvider,
  PROVIDERS,
  // Exporta funções individuais para uso direto se necessário
  callAnthropic,
  callOpenAI,
  callGroq
};

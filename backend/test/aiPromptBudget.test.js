import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateTokensApprox,
  isRequestTooLargeError,
  softAiFailureMessageForBook,
  shrinkPromptToCharBudget,
  fitPromptToProviderBudget,
  nextShrinkCharBudget,
  limitarBlocoMarkdown
} from '../src/utils/aiPromptBudget.js';
import { formatSecaoErroGenerico } from '../src/utils/aiProviderAttempts.js';

describe('aiPromptBudget', () => {
  it('estimateTokensApprox usa heurística chars/4', () => {
    assert.equal(estimateTokensApprox('abcd'), 1);
    assert.equal(estimateTokensApprox('a'.repeat(400)), 100);
  });

  it('isRequestTooLargeError detecta Groq 413 / TPM', () => {
    const groq413 =
      'Erro na API Groq: 413 - Request too large for model llama-3.3-70b-versatile. TPM Limit 12000';
    assert.equal(isRequestTooLargeError(groq413), true);
    assert.equal(isRequestTooLargeError(new Error(groq413)), true);
    assert.equal(isRequestTooLargeError('Erro na API Anthropic: 401 - invalid x-api-key'), false);
  });

  it('softAiFailureMessageForBook não vaza JSON/TPM brutos', () => {
    const groq413 =
      'Erro na API Groq: 413 - Request too large for model llama-3.3-70b-versatile … TPM Limit 12000 … org_xxx';
    const msg = softAiFailureMessageForBook(groq413);
    assert.match(msg, /incompleta|limite|seção/i);
    assert.equal(msg.includes('413'), false);
    assert.equal(msg.includes('org_'), false);
    assert.equal(msg.includes('TPM'), false);
    assert.equal(msg.includes('llama'), false);
  });

  it('shrinkPromptToCharBudget reduz e mantém cabeçalho/cauda', () => {
    const big = `INSTRUÇÕES INICIO\n${'x'.repeat(20_000)}\nDADOS FINAIS SCORE 1.83`;
    const { prompt, shrunk, originalChars } = shrinkPromptToCharBudget(big, 4_000);
    assert.equal(shrunk, true);
    assert.equal(originalChars, big.length);
    assert.ok(prompt.length <= 4_000);
    assert.match(prompt, /INSTRUÇÕES INICIO/);
    assert.match(prompt, /DADOS FINAIS SCORE 1\.83/);
    assert.match(prompt, /reduzido automaticamente/i);
  });

  it('fitPromptToProviderBudget cobre Groq com maxTokens e prompt menores', () => {
    const prompt = 'P'.repeat(40_000);
    const system = 'SYSTEM';
    const fitted = fitPromptToProviderBudget(prompt, system, { maxTokens: 6000 }, 'groq');
    assert.ok(fitted.prompt.length < prompt.length);
    assert.ok(fitted.options.maxTokens <= 2500);
    assert.equal(fitted.shrunk, true);
  });

  it('nextShrinkCharBudget desce na escada do provedor', () => {
    assert.ok(nextShrinkCharBudget(16_000, 'groq') < 16_000);
    assert.ok(nextShrinkCharBudget(3_600, 'groq') <= 3_500);
  });

  it('limitarBlocoMarkdown marca truncagem', () => {
    const out = limitarBlocoMarkdown('a'.repeat(100), 80, 'teste');
    assert.ok(out.length <= 80);
    assert.match(out, /truncado/);
  });
});

describe('esqueleto / mensagem soft (regressão book)', () => {
  it('mensagem soft + shrink evitam texto de falha 413 no markdown final simulado', () => {
    const err =
      'Erro na API Groq: 413 - Request too large for model llama-3.3-70b-versatile. TPM Limit 12000. Tentativas: Anthropic (Claude): Erro na API Anthropic:';
    const soft = softAiFailureMessageForBook(err);
    const markdown = `> ⚠️ ${soft}\n\n### 3.3.1 Análise\n\nScore oficial 1.83.`;
    assert.equal(/413|TPM|llama|org_|Groq|Request too large/i.test(markdown), false);
    assert.match(markdown, /Score oficial 1\.83/);
  });

  it('softAiFailureMessageForBook detecta 413 em providerAttempts', () => {
    const err = new Error('Falha em todos os provedores de IA');
    err.providerAttempts = [
      {
        providerId: 'groq',
        name: 'Groq (Llama)',
        error:
          'Erro na API Groq: 413 - Request too large for model llama-3.3-70b-versatile. TPM Limit 12000'
      }
    ];
    const msg = softAiFailureMessageForBook(err);
    assert.match(msg, /limite de capacidade/i);
    assert.equal(/413|TPM|llama|Groq/i.test(msg), false);
  });

  it('formatSecaoErroGenerico não vaza JSON bruto no markdown', () => {
    const err = new Error(
      'Erro na API Groq: 413 - {"error":{"message":"Request too large","type":"tokens","code":"rate_limit_exceeded"}}'
    );
    const md = formatSecaoErroGenerico({ id: 'sec_4_5', label: 'Gaps + Forças' }, err);
    assert.match(md, /não pôde ser gerada automaticamente/i);
    assert.equal(/413|rate_limit|Request too large|tokens per minute|"error"/i.test(md), false);
  });
});

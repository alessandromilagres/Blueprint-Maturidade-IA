import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeUnicodeForJson } from '../src/services/ai-provider.js';

describe('sanitizeUnicodeForJson', () => {
  it('preserva pares surrogates válidos (emoji)', () => {
    const s = 'ok 😀 fim';
    assert.equal(sanitizeUnicodeForJson(s), s);
  });

  it('substitui high surrogate órfão', () => {
    const broken = `antes ${String.fromCharCode(0xd800)} depois`;
    const out = sanitizeUnicodeForJson(broken);
    assert.equal(out.includes('\uFFFD'), true);
    assert.doesNotThrow(() => JSON.stringify({ text: out }));
  });

  it('substitui low surrogate órfão', () => {
    const broken = `x${String.fromCharCode(0xdc00)}y`;
    const out = sanitizeUnicodeForJson(broken);
    assert.equal(out, 'x\uFFFDy');
    assert.doesNotThrow(() => JSON.stringify({ text: out }));
  });

  it('sanitiza objetos aninhados', () => {
    const payload = {
      system: `a${String.fromCharCode(0xd83d)}`,
      messages: [{ content: `b${String.fromCharCode(0xdc00)}` }]
    };
    const clean = sanitizeUnicodeForJson(payload);
    assert.doesNotThrow(() => JSON.stringify(clean));
    assert.equal(clean.system, 'a\uFFFD');
    assert.equal(clean.messages[0].content, 'b\uFFFD');
  });
});

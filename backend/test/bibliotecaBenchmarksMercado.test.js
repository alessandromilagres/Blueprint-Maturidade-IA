import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  obterBenchmarkDimensao,
  blocoBenchmarkDimensaoPrompt,
  resolverCodigoBenchmarkDimensao,
  bibliotecaBenchmarksMercadoRaw
} from '../src/utils/bibliotecaBenchmarksMercado.js';

describe('biblioteca benchmarks mercado', () => {
  it('carrega satf D1–D11 e blueprint 1–16', () => {
    const lib = bibliotecaBenchmarksMercadoRaw();
    assert.equal(Object.keys(lib.satf).length, 11);
    assert.equal(Object.keys(lib.blueprint_mit).length, 16);
  });

  it('resolve códigos por instrumento', () => {
    assert.equal(resolverCodigoBenchmarkDimensao('satf', 'D4'), 'D4');
    assert.equal(resolverCodigoBenchmarkDimensao('satf', { codigoFramework: 'D8' }), 'D8');
    assert.equal(
      resolverCodigoBenchmarkDimensao('satf', {
        area: 'Engenharia & Padrões de Desenvolvimento'
      }),
      'D4'
    );
    assert.equal(resolverCodigoBenchmarkDimensao('blueprint_mit', '15'), '15');
    assert.equal(resolverCodigoBenchmarkDimensao('blueprint_mit', { ordem: 3 }), '3');
  });

  it('D4 e D8 satf têm frases distintas (anti-repetição)', () => {
    const d4 = obterBenchmarkDimensao('satf', 'D4');
    const d8 = obterBenchmarkDimensao('satf', 'D8');
    assert.ok(d4?.frase);
    assert.ok(d8?.frase);
    assert.notEqual(d4.frase, d8.frase);
    assert.match(d4.fonte, /DORA/i);
    assert.match(d8.fonte, /Gartner/i);
  });

  it('nunca cruza satf com blueprint_mit', () => {
    const d4Satf = obterBenchmarkDimensao('satf', 'D4');
    const bp4 = obterBenchmarkDimensao('blueprint_mit', '4');
    assert.ok(d4Satf);
    assert.ok(bp4);
    assert.notEqual(d4Satf.frase, bp4.frase);
    assert.equal(obterBenchmarkDimensao('satf', '4'), null);
    assert.equal(obterBenchmarkDimensao('blueprint_mit', 'D4'), null);
  });

  it('prompt inclui frase/fonte e omite alerta_governanca', () => {
    const prompt = blocoBenchmarkDimensaoPrompt('satf', 'D11');
    assert.match(prompt, /BENCHMARK DE MERCADO DESTA DIMENSÃO/);
    assert.match(prompt, /EU AI Act|Deloitte/i);
    assert.doesNotMatch(prompt, /alerta_governanca|Alcino/i);
    const d4 = blocoBenchmarkDimensaoPrompt('satf', { codigoFramework: 'D4' });
    assert.match(d4, /16,2%|deploy sob demanda/i);
    assert.match(d4, /proibido/i);
  });

  it('chave ausente vira placeholder sem inventar', () => {
    const p = blocoBenchmarkDimensaoPrompt('satf', 'D99');
    assert.match(p, /benchmark pendente/i);
  });
});

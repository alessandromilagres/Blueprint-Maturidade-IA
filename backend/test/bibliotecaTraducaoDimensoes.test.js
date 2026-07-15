import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarModeloOperacional,
  obterTraducaoDimensao,
  obterTraducaoDimensaoEfetiva,
  dimensaoForaEscopoModeloOperacional,
  filtrarDimensoesPorModeloOperacional,
  blocoTraducaoDimensaoModeloPrompt
} from '../src/utils/bibliotecaTraducaoDimensoes.js';

describe('modelo operacional + biblioteca tradução', () => {
  it('normaliza aliases grt/grs/coe', () => {
    assert.equal(normalizarModeloOperacional('GRT'), 'delivery');
    assert.equal(normalizarModeloOperacional('grs'), 'sustentacao');
    assert.equal(normalizarModeloOperacional('COE-IA'), 'coe');
    assert.equal(normalizarModeloOperacional(''), null);
  });

  it('D4 delivery usa DORA; sustentacao proíbe deploy', () => {
    const d = obterTraducaoDimensao('delivery', 'D4');
    const s = obterTraducaoDimensao('sustentacao', 'D4');
    assert.match(d.perguntas_e_metricas.join(' '), /DORA/i);
    assert.match(s.proibido, /deploy/i);
    assert.doesNotMatch(s.perguntas_e_metricas.join(' '), /DORA/i);
  });

  it('defaults do produto não citam clientes fixos', () => {
    const s9 = obterTraducaoDimensao('sustentacao', 'D9');
    assert.doesNotMatch(s9.perguntas_e_metricas.join(' '), /Ipiranga|Araújo|Tagout/i);
  });

  it('override da unidade sobrescreve métricas do default', () => {
    const efetiva = obterTraducaoDimensaoEfetiva(
      {
        modeloOperacional: 'sustentacao',
        traducaoDimensoes: JSON.stringify({
          D4: {
            perguntas_e_metricas: ['FCR do cliente ACME na ferramenta X'],
            proibido: 'Não falar de deploy'
          }
        })
      },
      'D4'
    );
    assert.deepEqual(efetiva.perguntas_e_metricas, ['FCR do cliente ACME na ferramenta X']);
    assert.match(efetiva.proibido, /deploy/i);
    assert.equal(efetiva.fonte, 'default_produto+cadastro_unidade');
  });

  it('D8 fora do escopo no delivery e permanece na sustentacao', () => {
    assert.equal(dimensaoForaEscopoModeloOperacional('delivery', 'D8'), true);
    assert.equal(dimensaoForaEscopoModeloOperacional('sustentacao', 'D8'), false);
    const dims = [
      { codigoFramework: 'D4', area: 'Engenharia' },
      { codigoFramework: 'D8', area: 'Legado' }
    ];
    const filtradas = filtrarDimensoesPorModeloOperacional(dims, {
      modeloOperacional: 'delivery'
    });
    assert.deepEqual(
      filtradas.map((d) => d.codigoFramework),
      ['D4']
    );
  });

  it('prompt de tradução Sustentação/D7 proíbe defeitos/CT', () => {
    const bloco = blocoTraducaoDimensaoModeloPrompt(
      { nome: 'GRS', modeloOperacional: 'sustentacao' },
      { codigoFramework: 'D7', area: 'QA' }
    );
    assert.match(bloco, /PROIBIDO/i);
    assert.match(bloco, /defeitos\/CT/i);
    assert.match(bloco, /falso positivo/i);
  });
});

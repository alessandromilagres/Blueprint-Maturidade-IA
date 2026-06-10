import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcularProgressoAvaliacaoProjeto } from '../src/utils/avaliacaoAreasRecusadas.js';
import { calcularProgressoAvaliacaoProduto } from '../src/utils/avaliacaoProdutoProgresso.js';

describe('calcularProgressoAvaliacaoProjeto', () => {
  const areas = [
    { id: 1, perguntas: [{ id: 101 }, { id: 102 }] },
    { id: 2, perguntas: [{ id: 201 }] },
  ];

  it('conta apenas áreas selecionadas e não recusadas', () => {
    const avaliacao = {
      areasSelecionadas: JSON.stringify([1]),
      areasRecusadas: JSON.stringify([]),
      respostas: [
        { perguntaId: 101, pontuacao: 3 },
        { perguntaId: 102, pontuacao: null },
      ],
    };
    const r = calcularProgressoAvaliacaoProjeto(avaliacao, areas);
    assert.equal(r.total, 2);
    assert.equal(r.respondidas, 1);
    assert.equal(r.percentual, 50);
  });

  it('exclui área recusada do denominador', () => {
    const avaliacao = {
      areasSelecionadas: JSON.stringify([1, 2]),
      areasRecusadas: JSON.stringify([1]),
      respostas: [
        { perguntaId: 101, pontuacao: 5 },
        { perguntaId: 201, pontuacao: 4 },
      ],
    };
    const r = calcularProgressoAvaliacaoProjeto(avaliacao, areas);
    assert.equal(r.total, 1);
    assert.equal(r.respondidas, 1);
    assert.equal(r.percentual, 100);
  });
});

describe('calcularProgressoAvaliacaoProduto', () => {
  const obrig = [{ id: 1 }, { id: 2 }];
  const verticais = [{ id: 10, perguntas: [{ id: 1001 }, { id: 1002 }] }];

  it('soma obrigatórias e verticais', () => {
    const avaliacao = {
      respostasObrigatorias: [
        { perguntaObrigatoriaId: 1, pontuacao: 3 },
        { perguntaObrigatoriaId: 2, pontuacao: null },
      ],
      respostasVerticais: [{ perguntaProdutoId: 1001, pontuacao: 4 }],
    };
    const r = calcularProgressoAvaliacaoProduto(avaliacao, obrig, verticais);
    assert.equal(r.total, 4);
    assert.equal(r.respondidas, 2);
    assert.equal(r.percentual, 50);
    assert.deepEqual(r.obrigatorias, { respondidas: 1, total: 2 });
    assert.deepEqual(r.verticais, { respondidas: 1, total: 2 });
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseUnidadesGovernadasIds,
  normalizarUnidadesGovernadasIdsInput,
  usuarioPapelInclusaoUnidade,
  usuarioIncluidoNoFiltroUnidadeEmpresa,
  anotarAvaliacoesInclusaoUnidade,
  usuarioTemRestricaoUnidadesAssistente,
  idsUnidadesVisiveisAssistente,
  usuarioPodeAcessarEscopoRelatorioAssistente,
  PESO_AVALIACAO_UNIDADE_HOME,
  PESO_AVALIACAO_UNIDADE_GOVERNADA
} from '../src/utils/empresaUnidade.js';
import { calcularScoresConsolidadoMaturidade } from '../src/utils/scoresConsolidadoProjetoMaturidade.js';

describe('parseUnidadesGovernadasIds', () => {
  it('aceita JSON string, array e lista separada', () => {
    assert.deepEqual(parseUnidadesGovernadasIds('[2,3,5]'), [2, 3, 5]);
    assert.deepEqual(parseUnidadesGovernadasIds([2, '3', 3]), [2, 3]);
    assert.deepEqual(parseUnidadesGovernadasIds('2, 3;5'), [2, 3, 5]);
    assert.deepEqual(parseUnidadesGovernadasIds(null), []);
    assert.deepEqual(parseUnidadesGovernadasIds(''), []);
  });
});

describe('normalizarUnidadesGovernadasIdsInput', () => {
  it('valida IDs contra unidades ativas da empresa', () => {
    const ok = normalizarUnidadesGovernadasIdsInput([10, 20], {
      empresaId: 1,
      unidadesValidas: [{ id: 10 }, { id: 20 }, { id: 30 }]
    });
    assert.equal(ok.ok, true);
    assert.deepEqual(ok.ids, [10, 20]);
    assert.equal(ok.json, '[10,20]');

    const fail = normalizarUnidadesGovernadasIdsInput([10, 99], {
      empresaId: 1,
      unidadesValidas: [{ id: 10 }]
    });
    assert.equal(fail.ok, false);
    assert.match(fail.error, /99/);
  });

  it('null limpa a lista', () => {
    const r = normalizarUnidadesGovernadasIdsInput(null, { unidadesValidas: [] });
    assert.equal(r.ok, true);
    assert.deepEqual(r.ids, []);
    assert.equal(r.json, null);
  });
});

describe('filtro unidade + gestor multi-unidade', () => {
  const geralId = 1;
  const siId = 10;
  const infraId = 11;

  const homeSi = {
    empresaUnidadeId: siId,
    unidadesGovernadasIds: null
  };
  const gestor = {
    empresaUnidadeId: geralId,
    unidadesGovernadasIds: JSON.stringify([siId, infraId])
  };

  it('inclui home e governada; exclui quem não governa', () => {
    assert.equal(usuarioPapelInclusaoUnidade(homeSi, siId, geralId), 'home');
    assert.equal(usuarioPapelInclusaoUnidade(gestor, siId, geralId), 'governada');
    assert.equal(usuarioPapelInclusaoUnidade(homeSi, infraId, geralId), null);
    assert.equal(usuarioIncluidoNoFiltroUnidadeEmpresa(gestor, siId, geralId), true);
    assert.equal(usuarioIncluidoNoFiltroUnidadeEmpresa(homeSi, infraId, geralId), false);
  });

  it('home tem precedência sobre governada', () => {
    const ambos = {
      empresaUnidadeId: siId,
      unidadesGovernadasIds: [siId, infraId]
    };
    assert.equal(usuarioPapelInclusaoUnidade(ambos, siId, geralId), 'home');
  });

  it('anota pesos home=1 e governada=0.5', () => {
    const avs = [
      { id: 1, usuario: homeSi },
      { id: 2, usuario: gestor }
    ];
    anotarAvaliacoesInclusaoUnidade(avs, siId, geralId);
    assert.equal(avs[0].inclusaoUnidade, 'home');
    assert.equal(avs[0].pesoConsolidadoUnidade, PESO_AVALIACAO_UNIDADE_HOME);
    assert.equal(avs[0].gestorMultiUnidade, false);
    assert.equal(avs[1].inclusaoUnidade, 'governada');
    assert.equal(avs[1].pesoConsolidadoUnidade, PESO_AVALIACAO_UNIDADE_GOVERNADA);
    assert.equal(avs[1].gestorMultiUnidade, true);
  });
});

describe('média ponderada consolidado por unidade', () => {
  it('especialista 2 (peso 1) + gestor governada 4 (peso 0.5) ≠ média simples 3', () => {
    const areas = [
      {
        id: 1,
        nome: 'D1',
        descricao: '',
        perguntas: [{ id: 101, numero: 1, texto: 'P1' }]
      }
    ];
    const avaliacoes = [
      {
        pesoConsolidadoUnidade: 1,
        respostas: [{ perguntaId: 101, pontuacao: 2, pergunta: { areaId: 1 } }]
      },
      {
        pesoConsolidadoUnidade: 0.5,
        gestorMultiUnidade: true,
        inclusaoUnidade: 'governada',
        respostas: [{ perguntaId: 101, pontuacao: 4, pergunta: { areaId: 1 } }]
      }
    ];
    const { scoresPorArea, scoreGeral } = calcularScoresConsolidadoMaturidade(avaliacoes, areas);
    // (2*1 + 4*0.5) / (1+0.5) = 4/1.5 ≈ 2.67 — não 3
    assert.equal(scoresPorArea[0].score, 2.67);
    assert.equal(scoreGeral, 2.67);
    assert.notEqual(scoresPorArea[0].score, 3);
  });
});

describe('Assistente — permissões finas por unidade', () => {
  it('admin/sysmap e usuário sem vínculo não têm restrição', () => {
    assert.equal(usuarioTemRestricaoUnidadesAssistente({ role: 'admin', empresaUnidadeId: 2 }), false);
    assert.equal(usuarioTemRestricaoUnidadesAssistente({ role: 'sysmap', unidadesGovernadasIds: '[3]' }), false);
    assert.equal(
      usuarioTemRestricaoUnidadesAssistente({ role: 'gestor', empresaUnidadeId: null, unidadesGovernadasIds: null }),
      false
    );
  });

  it('gestor com home ou governadas fica restrito', () => {
    assert.equal(
      usuarioTemRestricaoUnidadesAssistente({ role: 'gestor', empresaUnidadeId: 10 }),
      true
    );
    assert.equal(
      usuarioTemRestricaoUnidadesAssistente({
        role: 'gestor',
        empresaUnidadeId: null,
        unidadesGovernadasIds: '[20,30]'
      }),
      true
    );
    assert.deepEqual(
      idsUnidadesVisiveisAssistente({
        empresaUnidadeId: 10,
        unidadesGovernadasIds: '[20,10]'
      }),
      [10, 20]
    );
  });

  it('permite escopo geral; bloqueia unidade fora de home∪governadas', () => {
    const gestor = {
      role: 'gestor',
      empresaUnidadeId: 10,
      unidadesGovernadasIds: '[20]'
    };
    assert.equal(
      usuarioPodeAcessarEscopoRelatorioAssistente(gestor, { escopo: 'geral', empresaUnidadeId: null }),
      true
    );
    assert.equal(
      usuarioPodeAcessarEscopoRelatorioAssistente(gestor, { escopo: 'unidade', empresaUnidadeId: 10 }),
      true
    );
    assert.equal(
      usuarioPodeAcessarEscopoRelatorioAssistente(gestor, { escopo: 'unidade', empresaUnidadeId: 20 }),
      true
    );
    assert.equal(
      usuarioPodeAcessarEscopoRelatorioAssistente(gestor, { escopo: 'unidade', empresaUnidadeId: 99 }),
      false
    );
  });
});

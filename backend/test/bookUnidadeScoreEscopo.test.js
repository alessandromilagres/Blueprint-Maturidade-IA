import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { agregarScoresECertificacaoPorDimensoes } from '../src/utils/projetoDimensaoCertificacao.js';
import {
  montarApendiceMetodologiaSatf,
  montarApendicesMetodologicosSatf
} from '../src/utils/bookApendicesMetodologicos.js';

describe('agregarScoresECertificacaoPorDimensoes (book unidade)', () => {
  it('média simples das 6 dims de foco fecha (sem peso)', () => {
    const dims = [
      { codigoFramework: 'D3', score: 1.4, scoreDeclarado: 1.4, scoreOficial: 1.4 },
      { codigoFramework: 'D5', score: 1.75, scoreDeclarado: 1.75, scoreOficial: 1.75 },
      { codigoFramework: 'D6', score: 1.28, scoreDeclarado: 1.28, scoreOficial: 1.28 },
      { codigoFramework: 'D7', score: 1.27, scoreDeclarado: 1.27, scoreOficial: 1.27 },
      { codigoFramework: 'D8', score: 1.29, scoreDeclarado: 1.29, scoreOficial: 1.29 },
      { codigoFramework: 'D9', score: 1.75, scoreDeclarado: 1.75, scoreOficial: 1.75 }
    ];
    const out = agregarScoresECertificacaoPorDimensoes(dims);
    assert.equal(out.scoreGeralOficial, 1.46);
    assert.equal(out.scoreGeralDeclarado, 1.46);
    assert.equal(out.certificacaoResumo.totalDimensoesEscopo, 6);
    assert.equal(out.certificacaoResumo.escopoUnidade, true);
    assert.deepEqual(out.certificacaoResumo.codigosEscopo, ['D3', 'D5', 'D6', 'D7', 'D8', 'D9']);
  });

  it('com peso 2× em D7 (setor regulado) fecha em 1.43', () => {
    const dims = [
      { codigoFramework: 'D3', score: 1.4, scoreOficial: 1.4, scoreDeclarado: 1.4, peso: 1 },
      { codigoFramework: 'D5', score: 1.75, scoreOficial: 1.75, scoreDeclarado: 1.75, peso: 1 },
      { codigoFramework: 'D6', score: 1.28, scoreOficial: 1.28, scoreDeclarado: 1.28, peso: 1 },
      { codigoFramework: 'D7', score: 1.27, scoreOficial: 1.27, scoreDeclarado: 1.27, peso: 2 },
      { codigoFramework: 'D8', score: 1.29, scoreOficial: 1.29, scoreDeclarado: 1.29, peso: 1 },
      { codigoFramework: 'D9', score: 1.75, scoreOficial: 1.75, scoreDeclarado: 1.75, peso: 1 }
    ];
    const out = agregarScoresECertificacaoPorDimensoes(dims);
    assert.equal(out.scoreGeralOficial, 1.43);
  });

  it('exclui D10 fora da média e dims fora de escopo', () => {
    const dims = [
      { codigoFramework: 'D3', score: 2, scoreOficial: 2, scoreDeclarado: 2 },
      { codigoFramework: 'D10', score: 5, scoreOficial: 5, scoreDeclarado: 5, foraDaMediaGeral: true },
      { codigoFramework: 'D11', score: 4, scoreOficial: 4, scoreDeclarado: 4, foraDeEscopo: true }
    ];
    const out = agregarScoresECertificacaoPorDimensoes(dims);
    assert.equal(out.scoreGeralOficial, 2);
  });
});

describe('apêndice SATF escopo unidade', () => {
  it('inclui A.2.1 e ressalva D11 quando exigeUnidade', () => {
    const md = montarApendiceMetodologiaSatf({
      exigeUnidade: true,
      nDimensoesEscopo: 6,
      codigosEscopo: ['D3', 'D5', 'D6', 'D7', 'D8', 'D9']
    });
    assert.match(md, /A\.2\.1 Escopo deste book/);
    assert.match(md, /6 dimensão/);
    assert.match(md, /D3, D5, D6, D7, D8, D9/);
    assert.match(md, /só no diagnóstico se estiver no escopo/i);
    const full = montarApendicesMetodologicosSatf({
      exigeUnidade: true,
      nDimensoesEscopo: 6,
      codigosEscopo: ['D3', 'D5', 'D6', 'D7', 'D8', 'D9']
    });
    assert.match(full, /só entra se estiver no escopo de foco/i);
  });
});

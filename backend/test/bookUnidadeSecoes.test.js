import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizarDimensoesFocoSatfInput, normalizarDimensoesFocoMitInput } from '../src/utils/empresaUnidade.js';
import { dimensoesSecao3BookUnidade } from '../src/utils/bookDadosDimensao.js';
import {
  construirMapaRenumeracaoSecoesPrincipaisSatfUnidade,
  renumerarSecoesPrincipaisBookSatfUnidade
} from '../src/utils/satfBookTaxonomia.js';
import { extrairEntradasIndiceMarkdown } from '../src/utils/markdownSlug.js';

describe('normalizarDimensoesFocoInput', () => {
  it('extrai D1,D3,D4,D7 do template GRT (SATF)', () => {
    assert.deepEqual(normalizarDimensoesFocoSatfInput('D1, D3, D4, D7'), ['D1', 'D3', 'D4', 'D7']);
  });

  it('extrai BP do MIT separado', () => {
    assert.deepEqual(normalizarDimensoesFocoMitInput('BP1, BP4, BP7'), ['BP1', 'BP4', 'BP7']);
  });

  it('exclui dimensões marcadas com prefixo -', () => {
    assert.deepEqual(normalizarDimensoesFocoSatfInput('D1, -D8, D4'), ['D1', 'D4']);
  });
});

describe('dimensoesSecao3BookUnidade', () => {
  const dimensoes = [
    { areaId: 1, area: 'D1', codigoFramework: 'D1', ordem: 1, score: 0 },
    { areaId: 3, area: 'D3', codigoFramework: 'D3', ordem: 3, score: 0 },
    { areaId: 4, area: 'D4', codigoFramework: 'D4', ordem: 4, score: 0 },
    { areaId: 7, area: 'D7', codigoFramework: 'D7', ordem: 7, score: 0 },
    { areaId: 10, area: 'D10', codigoFramework: 'D10', ordem: 10, score: 2.1 }
  ];
  const unidade = { dimensoesFocoSatf: '["D1","D3","D4","D7"]' };

  it('mantém dimensões em foco mesmo com score 0', () => {
    const filtradas = dimensoesSecao3BookUnidade(dimensoes, unidade);
    assert.equal(filtradas.length, 4);
    assert.deepEqual(filtradas.map((d) => d.codigoFramework), ['D1', 'D3', 'D4', 'D7']);
  });
});

describe('renumeracao secoes SATF por unidade GRT', () => {
  const unidadeGrt = { dimensoesFocoSatf: '["D1","D3","D4","D7"]' };
  const noFoco = (cod) => ['D1', 'D3', 'D4', 'D7'].includes(cod);

  it('mapeia 4,7,8 para 4,5,6 omitindo D10 e D11', () => {
    const mapa = construirMapaRenumeracaoSecoesPrincipaisSatfUnidade(true, unidadeGrt, {
      dimensaoNoFoco: noFoco
    });
    assert.deepEqual(mapa.canonParaSeq, { 4: 4, 7: 5, 8: 6 });
  });

  it('renumera headings no markdown', () => {
    const mapa = construirMapaRenumeracaoSecoesPrincipaisSatfUnidade(true, unidadeGrt, {
      dimensaoNoFoco: noFoco
    });
    const md = `# 1. METODOLOGIA\n# 2. SUMÁRIO\n# 3. DIAGNÓSTICO\n## 3.1 Dimensão — D1\n# 4. ROADMAP\n# 7. Capacitação\n### 7.1 Papéis\n# 8. Próximos Passos`;
    const out = renumerarSecoesPrincipaisBookSatfUnidade(md, mapa);
    assert.match(out, /^# 5\. Capacitação/m);
    assert.match(out, /^### 5\.1 Papéis/m);
    assert.match(out, /^# 6\. Próximos Passos/m);
    assert.doesNotMatch(out, /^# 7\./m);
  });

  it('índice SATF fica sequencial sem lacunas', () => {
    const md = `# 1. METODOLOGIA SATF TI v3
# 2. SUMÁRIO EXECUTIVO
# 3. DIAGNÓSTICO POR DIMENSÃO (SATF TI v3)
## 3.1 Dimensão — D1 — Score 1.59 · Nível 1
## 3.2 Dimensão — D3 — Score 1.59 · Nível 1
# 4. ROADMAP ENGENHARIA & PLATAFORMA
# 5. Capacitação, Papéis e Governança de Times
# 6. Próximos Passos e Encerramento`;
    const entradas = extrairEntradasIndiceMarkdown(md, { modo: 'satf' });
    const nums = entradas.filter((e) => e.level === 1).map((e) => parseInt(e.titulo, 10));
    assert.deepEqual(nums, [1, 2, 3, 4, 5, 6]);
  });
});

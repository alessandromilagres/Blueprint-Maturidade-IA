import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizarDimensoesFocoSatfInput, normalizarDimensoesFocoMitInput } from '../src/utils/empresaUnidade.js';
import { dimensoesSecao3BookUnidade } from '../src/utils/bookDadosDimensao.js';
import {
  construirMapaRenumeracaoSecoesPrincipaisSatfUnidade,
  renumerarSecoesPrincipaisBookSatfUnidade,
  removerSpilloverSecao3BookSatf,
  normalizarSecoesBookSatf
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

describe('renumeracao secoes SATF por unidade', () => {
  it('mapeia Roadmap 4→4 e Próximos 8→5 (outline 1–5)', () => {
    const mapa = construirMapaRenumeracaoSecoesPrincipaisSatfUnidade(true, {
      dimensoesFocoSatf: '["D1","D3","D4","D7"]'
    });
    assert.equal(mapa.outlineUnidade, true);
    assert.deepEqual(mapa.canonParaSeq, { 4: 4, 8: 5 });
  });

  it('renumera heading canônico 8→5 no markdown', () => {
    const mapa = construirMapaRenumeracaoSecoesPrincipaisSatfUnidade(true, {});
    const md = `# 1. METODOLOGIA
# 2. SUMÁRIO EXECUTIVO
# 3. DIAGNÓSTICO
## 3.1 Dimensão — D1
# 4. ROADMAP
### 4.1 Visão
# 8. Próximos Passos
### 8.1 Ações`;
    const out = renumerarSecoesPrincipaisBookSatfUnidade(md, mapa);
    assert.match(out, /^# 4\. ROADMAP/m);
    assert.match(out, /^### 4\.1 Visão/m);
    assert.match(out, /^# 5\. Próximos Passos/m);
    assert.match(out, /^### 5\.1 Ações/m);
    assert.doesNotMatch(out, /^# 8\./m);
  });

  it('índice SATF unidade fica 1,2,3,4,5 com dims 3.N', () => {
    const md = `# 1. METODOLOGIA SATF TI v3
# 2. SUMÁRIO EXECUTIVO
# 3. DIAGNÓSTICO POR DIMENSÃO (SATF TI v3)
## 3.1 Dimensão — Estratégia & Postura de IA — Score 1.59 · Nível 1
## 3.2 Dimensão — Governança, Risco & Conformidade — Score 1.59 · Nível 1
# 4. ROADMAP ENGENHARIA & PLATAFORMA
# 5. Próximos Passos e Encerramento`;
    const entradas = extrairEntradasIndiceMarkdown(md, { modo: 'satf' });
    const nums = entradas.filter((e) => e.level === 1).map((e) => parseInt(e.titulo, 10));
    assert.deepEqual(nums, [1, 2, 3, 4, 5]);
    const dims = entradas.filter((e) => e.level === 2).map((e) => e.tituloIndice || e.titulo);
    assert.match(dims[0], /^3\.1\b/);
    assert.match(dims[1], /^3\.2\b/);
  });

  it('não apaga ## 3.N sob # 3. DIAGNÓSTICO nem ## 2.N do sumário', () => {
    const md = `# 1. METODOLOGIA
# 2. SUMÁRIO EXECUTIVO
## 2.1 Panorama
texto sumário
# 3. DIAGNÓSTICO POR DIMENSÃO (SATF TI v3)
## 3.1 Dimensão — D1
### 3.1.1 Análise Diagnóstica
texto dim
# 4. ROADMAP
## 3.9 Dimensão — spillover indevido
# 5. Próximos Passos`;
    const out = normalizarSecoesBookSatf(md);
    assert.match(out, /^## 2\.1 Panorama/m);
    assert.match(out, /^# 3\. DIAGNÓSTICO/m);
    assert.match(out, /^## 3\.1 Dimensão — D1/m);
    assert.doesNotMatch(out, /## 3\.9 Dimensão — spillover/);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  chaveLinhaGlossario,
  resolverFatosCanonicosUnidade,
  mesclarFatosProjetoComUnidade,
  blocoFatosCanonicosUnidadePrompt
} from '../src/utils/fatosCanonicosUnidade.js';
import { validarFatosCanonicosBook } from '../src/utils/projetoContextoFatos.js';

describe('fatos canônicos por unidade (GRS)', () => {
  it('resolve GRS por codigo e aliases', () => {
    const a = resolverFatosCanonicosUnidade({ codigo: 'GRS', nome: 'Sustentação' });
    const b = resolverFatosCanonicosUnidade({
      codigo: 'X',
      nome: 'Gerente Sustentação',
      modeloOperacional: 'sustentacao'
    });
    assert.equal(a?.codigoCanonico, 'GRS');
    assert.equal(b?.codigoCanonico, 'GRS');
    assert.match(a.glossario.join('\n'), /Ipiranga.*Conecta.*KMV/i);
    assert.match(a.glossario.join('\n'), /G5.*Pedra Agroindustrial.*Tagout/i);
    assert.ok(a.termosProibidos.some((t) => /Ipiranga.*Mulesoft/i.test(t)));
  });

  it('não resolve unidade sem alias GRS', () => {
    assert.equal(
      resolverFatosCanonicosUnidade({ codigo: 'GRT', nome: 'Delivery', modeloOperacional: 'delivery' }),
      null
    );
  });

  it('projeto vence em conflito; unidade completa lacunas', () => {
    const mesclado = mesclarFatosProjetoComUnidade(
      {
        glossario: 'Ipiranga → Ferramenta Custom do Projeto\nOutro fato → X',
        termosProibidos: ['TermoProjeto']
      },
      { codigo: 'GRS' }
    );
    assert.match(mesclado.glossario, /Ipiranga → Ferramenta Custom do Projeto/);
    assert.doesNotMatch(mesclado.glossario, /Ipiranga → Conecta/);
    assert.match(mesclado.glossario, /Natura → ServiceNow/);
    assert.match(mesclado.glossario, /Drogaria Araújo → Mulesoft/);
    assert.ok(mesclado.termosProibidos.includes('TermoProjeto'));
    assert.ok(mesclado.termosProibidos.some((t) => /Ipiranga.*Mulesoft/i.test(t)));
  });

  it('injeta glossário completo da unidade se projeto vazio', () => {
    const mesclado = mesclarFatosProjetoComUnidade({ glossario: '', termosProibidos: [] }, { codigo: 'GRS' });
    assert.match(mesclado.glossario, /Ipiranga → Conecta \+ KMV/);
    assert.match(mesclado.glossario, /Pedra Agroindustrial \+ Tagout/);
    assert.equal(mesclado.linhasInjetadasUnidade.length, mesclado.fatosUnidade.glossario.length);
  });

  it('bloco prompt marca Ipiranga≠Mulesoft e G5=Pedra+Tagout', () => {
    const bloco = blocoFatosCanonicosUnidadePrompt({ codigo: 'GRS', nome: 'GRS' });
    assert.match(bloco, /FATOS CANÔNICOS DA UNIDADE/i);
    assert.match(bloco, /Ipiranga.*Conecta.*KMV/i);
    assert.match(bloco, /NÃO Mulesoft/i);
    assert.match(bloco, /Pedra Agroindustrial \+ Tagout/i);
    assert.match(bloco, /Drogaria Araújo → Mulesoft/);
  });

  it('validação pós-geração pega Ipiranga Mulesoft e G5 Araújo+Tagout', () => {
    const { termosProibidos, glossario } = mesclarFatosProjetoComUnidade({}, { codigo: 'GRS' });
    const ruim = validarFatosCanonicosBook(
      'A Ipiranga usa Mulesoft. G5: Drogaria Araújo e Tagout.',
      { termosProibidos, glossario }
    );
    assert.equal(ruim.ok, false);
    assert.ok(ruim.total >= 2);

    const bom = validarFatosCanonicosBook(
      'Ipiranga: Conecta + KMV. G5: Pedra Agroindustrial + Tagout. Araújo: Mulesoft.',
      { termosProibidos, glossario }
    );
    assert.equal(bom.ok, true);
  });

  it('chaveLinhaGlossario normaliza prefixo', () => {
    assert.equal(chaveLinhaGlossario('Ipiranga → Conecta'), chaveLinhaGlossario('Ipiranga: outro'));
  });
});

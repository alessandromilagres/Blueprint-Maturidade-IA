import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  montarApendicesMetodologicosSatf,
  posicionarApendicesMetodologicosComoUltimaSecao,
  removerGlossarioFatosCanonicosDoMarkdown
} from '../src/utils/bookApendicesMetodologicos.js';

describe('apêndices metodológicos sem vazamento de fatos canônicos', () => {
  it('Apêndice B não embute glossário de fatos canônicos mesmo se passado', () => {
    const md = montarApendicesMetodologicosSatf(
      'Alcino apontou que o SAT-F vai só até D10. Pendente de confirmação...'
    );
    assert.match(md, /## Apêndice B — Glossário de Termos/);
    assert.doesNotMatch(md, /Glossário de fatos canônicos/i);
    assert.doesNotMatch(md, /Alcino/);
    assert.doesNotMatch(md, /Pendente de confirmação/);
  });

  it('posicionar remove vazamento e ignora glossarioProjeto', () => {
    const livro = `# Book

## Seção 1

texto

---

# APÊNDICES METODOLÓGICOS

## Apêndice A — Metodologia Aplicada

metodologia

## Apêndice B — Glossário de Termos

| Termo | Definição |
| SATF | framework |

### Glossário de fatos canônicos do projeto

> Termos internos

Alcino apontou que o SAT-F vai só até D10. Pendente de confirmação...
`;

    const out = posicionarApendicesMetodologicosComoUltimaSecao(livro, {
      framework: 'satf',
      glossarioProjeto: 'NÃO DEVE APARECER NO BOOK'
    });

    assert.match(out, /Apêndice B — Glossário/);
    assert.doesNotMatch(out, /Glossário de fatos canônicos/i);
    assert.doesNotMatch(out, /Alcino/);
    assert.doesNotMatch(out, /NÃO DEVE APARECER/);
  });

  it('removerGlossarioFatosCanonicosDoMarkdown corta a seção', () => {
    const md = `## Apêndice B — Glossário de Termos

tabela

### Glossário de fatos canônicos (AUTORIDADE MÁXIMA)

segredo interno

# Fim`;
    const out = removerGlossarioFatosCanonicosDoMarkdown(md);
    assert.match(out, /Apêndice B/);
    assert.doesNotMatch(out, /segredo interno/);
    assert.match(out, /# Fim/);
  });
});

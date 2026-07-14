import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  blocoDescricaoUnidadeMarkdown,
  blocoUnidadeRelatorioMarkdown
} from '../src/utils/relatorioUnidadeIA.js';

const DESC_MULTILINHA = `COE-IA (Centro de Excelência de IA) — Descrição Breve

Missão da área: acelerar adoção segura de IA.
Sistemas: plataforma de agentes, knowledge base.
Dores: escassez de talentos e governança frágil.`;

describe('blocoDescricaoUnidadeMarkdown', () => {
  it('mantém multilinha sob o rótulo Descrição (fora de list item)', () => {
    const md = blocoDescricaoUnidadeMarkdown(DESC_MULTILINHA);
    assert.equal(md.startsWith('**Descrição**\n\n'), true);
    assert.match(md, /Missão da área:/);
    assert.match(md, /Sistemas:/);
    assert.match(md, /Dores:/);
    assert.doesNotMatch(md, /^- \*\*Descrição:\*\*/m);
  });

  it('não trunca conteúdo longo', () => {
    const longo = `${'x'.repeat(1500)}\n\nMissão: manter texto completo.`;
    const md = blocoDescricaoUnidadeMarkdown(longo);
    assert.match(md, /Missão: manter texto completo\./);
    assert.ok(md.includes('x'.repeat(1500)));
  });
});

describe('blocoUnidadeRelatorioMarkdown — Descrição multilinha', () => {
  it('associa missão/sistemas/dores ao bloco Descrição, sem órfãos de list break', () => {
    const md = blocoUnidadeRelatorioMarkdown({
      nome: 'COE-IA',
      descricao: DESC_MULTILINHA,
      ehPadrao: false,
      dimensoesFocoSatf: '["D1","D3"]',
      dimensoesFocoMit: null
    });

    assert.match(md, /## Unidade organizacional — escopo deste relatório/);
    assert.match(md, /- \*\*Unidade:\*\* COE-IA/);
    assert.doesNotMatch(md, /^- \*\*Descrição:\*\*/m);

    const idxDesc = md.indexOf('**Descrição**');
    const idxMissao = md.indexOf('Missão da área:');
    const idxSistemas = md.indexOf('Sistemas:');
    const idxDores = md.indexOf('Dores:');
    const idxFoco = md.indexOf('**Dimensões em foco (SATF):**');

    assert.ok(idxDesc >= 0);
    assert.ok(idxMissao > idxDesc);
    assert.ok(idxSistemas > idxMissao);
    assert.ok(idxDores > idxSistemas);
    // Metadados em bullets ficam antes do bloco Descrição; conteúdo completo logo após o rótulo
    assert.ok(idxFoco < idxDesc);
    assert.ok(idxMissao - idxDesc < 80);

    // Após o rótulo, o texto multilinha permanece contínuo (sem quebra de list item)
    const aposDesc = md.slice(idxDesc);
    assert.match(aposDesc, /^\*\*Descrição\*\*\n\nCOE-IA \(Centro de Excelência de IA\) — Descrição Breve\n\nMissão da área:/);
  });
});

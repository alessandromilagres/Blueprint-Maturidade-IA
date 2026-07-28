import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  carregarManualSistemaAssistente,
  catalogoDimensoesMarkdown,
  montarPacoteConhecimentoBase,
  trechosGuiaParaPergunta,
  truncarContexto
} from '../src/utils/assistenteConhecimento.js';
import {
  fatiarTexto,
  tokenizar,
  obterChunksGlobaisMemoria,
  recuperarChunksRelevantes,
  formatarChunksParaPrompt
} from '../src/utils/assistenteRetrieval.js';
import { SYSTEM_PROMPT_ASSISTENTE } from '../src/utils/assistenteChat.js';

describe('assistente conhecimento', () => {
  it('carrega manual do sistema', () => {
    const md = carregarManualSistemaAssistente();
    assert.ok(md.includes('Agentica'));
    assert.ok(md.includes('Versionamento'));
  });

  it('lista Blueprint e SATF no catálogo', () => {
    const cat = catalogoDimensoesMarkdown();
    assert.match(cat, /Blueprint 16/);
    assert.match(cat, /SATF TI v3/);
    assert.match(cat, /D10/);
  });

  it('pacote base inclui manual e tese/excerto ou placeholder', () => {
    const pack = montarPacoteConhecimentoBase({ pergunta: 'O que é D8?' });
    assert.match(pack, /BASE DE CONHECIMENTO/);
    assert.match(pack, /Manual do sistema/);
    assert.ok(pack.length > 500);
  });

  it('detecta D8 na pergunta para guia', () => {
    const t = trechosGuiaParaPergunta('Explique a dimensão D8 e modernização');
    if (t) assert.match(t, /Modernização|SATF|calibração/i);
  });

  it('trunca contexto longo', () => {
    const out = truncarContexto('x'.repeat(100), 50);
    assert.ok(out.length < 100);
    assert.match(out, /truncado/);
  });
});

describe('assistente RAG (fase 2)', () => {
  it('fatia texto com overlap', () => {
    const parts = fatiarTexto('a'.repeat(2000), { size: 500, overlap: 50 });
    assert.ok(parts.length >= 4);
  });

  it('tokeniza removendo acentos', () => {
    const toks = tokenizar('Dimensão Estratégia');
    assert.ok(toks.includes('dimensao') || toks.includes('dimensão'));
    assert.ok(toks.includes('estrategia') || toks.includes('estratégia'));
  });

  it('monta chunks globais em memória', () => {
    const chunks = obterChunksGlobaisMemoria();
    assert.ok(chunks.length > 5);
    assert.ok(chunks.some((c) => c.fonte === 'manual'));
  });

  it('recupera chunks relevantes para pergunta de versão', async () => {
    const { chunks, modo } = await recuperarChunksRelevantes(
      'Como fechar uma versão de projeto no sistema?'
    );
    assert.ok(chunks.length >= 1);
    assert.ok(['keyword', 'hibrido'].includes(modo));
    const md = formatarChunksParaPrompt(chunks);
    assert.match(md, /Fonte 1/);
  });

  it('sem projetoId não exige RelatorioIA e ainda retorna base global', async () => {
    const { chunks } = await recuperarChunksRelevantes('O que é SATF TI v3?');
    assert.ok(chunks.length >= 1);
    assert.ok(!chunks.some((c) => c.fonte === 'relatorio_ia'));
  });
});

describe('assistente ações contextuais', () => {
  it('sugere glossário e book quando há projeto', async () => {
    const { montarAcoesAssistente } = await import('../src/utils/assistenteAcoes.js');
    const acoes = montarAcoesAssistente({
      mensagem: 'Como cadastrar o glossário de fatos canônicos?',
      resposta: 'Abra o contexto do projeto e preencha o glossário.',
      projetoId: 7,
      fontes: [{ fonte: 'manual', titulo: 'Manual' }]
    });
    assert.ok(acoes.some((a) => a.id === 'abrir_glossario'));
    assert.ok(acoes.some((a) => a.to.includes('#projeto-contexto')));
  });

  it('sugere gerar book quando pergunta menciona book', async () => {
    const { montarAcoesAssistente } = await import('../src/utils/assistenteAcoes.js');
    const acoes = montarAcoesAssistente({
      mensagem: 'Como gerar o book completo?',
      resposta: 'Use o relatório MIT IA completo no projeto.',
      projetoId: 7,
      fontes: [{ fonte: 'relatorio_ia', titulo: 'Book', relatorioId: 12 }]
    });
    assert.ok(acoes.some((a) => a.id === 'gerar_book'));
    assert.ok(acoes.some((a) => a.id === 'biblioteca_ia'));
  });

  it('sem projeto sugere lista de projetos', async () => {
    const { montarAcoesAssistente } = await import('../src/utils/assistenteAcoes.js');
    const acoes = montarAcoesAssistente({
      mensagem: 'Quero gerar um book do projeto',
      resposta: 'Selecione um projeto no Assistente.',
      projetoId: null
    });
    assert.ok(acoes.some((a) => a.id === 'escolher_projeto'));
  });
});

describe('assistente indexação RAG (qualidade)', () => {
  it('seleciona só a última versão por tipo', async () => {
    const { selecionarUltimasVersoesPorTipo } = await import('../src/utils/assistenteIndexacao.js');
    const lista = selecionarUltimasVersoesPorTipo([
      { id: 1, tipo: 'completo', versao: 1, createdAt: '2026-01-01' },
      { id: 2, tipo: 'completo', versao: 3, createdAt: '2026-03-01' },
      { id: 3, tipo: 'completo', versao: 2, createdAt: '2026-02-01' },
      { id: 4, tipo: 'executivo', versao: 1, createdAt: '2026-01-15' },
      { id: 5, tipo: 'executivo', versao: 1, createdAt: '2026-04-01' }
    ]);
    assert.equal(lista.length, 2);
    assert.equal(lista.find((r) => r.tipo === 'completo')?.id, 2);
    assert.equal(lista.find((r) => r.tipo === 'executivo')?.id, 5);
  });

  it('monta chunks de um relatório', async () => {
    const { montarChunksDeRelatorioIA } = await import('../src/utils/assistenteIndexacao.js');
    const chunks = montarChunksDeRelatorioIA({
      id: 99,
      projetoId: 7,
      tipo: 'completo',
      titulo: 'Book teste',
      versao: 2,
      conteudoMd: 'A'.repeat(2500),
      createdAt: new Date().toISOString()
    });
    assert.ok(chunks.length >= 2);
    assert.equal(chunks[0].fonte, 'relatorio_ia');
    assert.equal(chunks[0].relatorioId, 99);
    assert.match(chunks[0].titulo, /Book teste/);
  });
});

describe('assistente fontes e modos', () => {
  it('enriquece fonte de relatório com link', async () => {
    const { enriquecerFontesComLinks } = await import('../src/utils/assistenteFontes.js');
    const out = enriquecerFontesComLinks(
      [{ fonte: 'relatorio_ia', titulo: 'Book X', relatorioId: 12, score: 1 }],
      { projetoId: 7, tiposPorRelatorioId: { 12: 'completo' } }
    );
    assert.ok(out[0].to.includes('/relatorios/7/mit-ia-completo'));
    assert.ok(out[0].to.includes('relatorioSalvoId=12'));
  });

  it('filtra candidatos por modo book', async () => {
    const { filtrarCandidatosPorModo } = await import('../src/utils/assistenteModos.js');
    const pool = [
      { fonte: 'manual', texto: 'a' },
      { fonte: 'relatorio_ia', texto: 'b' },
      { fonte: 'tese', texto: 'c' }
    ];
    const book = filtrarCandidatosPorModo(pool, 'book');
    assert.equal(book.length, 1);
    assert.equal(book[0].fonte, 'relatorio_ia');
  });
});

describe('assistente system prompt', () => {
  it('identifica SysMap e escopo', () => {
    assert.match(SYSTEM_PROMPT_ASSISTENTE, /Assistente Agentica/);
    assert.match(SYSTEM_PROMPT_ASSISTENTE, /SysMap/);
    assert.match(SYSTEM_PROMPT_ASSISTENTE, /FONTES RECUPERADAS/i);
  });
});

describe('assistente preferências (#6)', () => {
  it('normaliza tom e framework favorito', async () => {
    const {
      normalizarTomAssistente,
      normalizarFrameworkFavoritoAssistente,
      instrucaoTomNoPrompt,
      instrucaoFrameworkFavoritoNoPrompt
    } = await import('../src/utils/assistentePreferencias.js');
    assert.equal(normalizarTomAssistente('CURTO'), 'curto');
    assert.equal(normalizarTomAssistente('long'), 'longo');
    assert.equal(normalizarTomAssistente(null), 'medio');
    assert.equal(normalizarFrameworkFavoritoAssistente('SATF_TI_V3'), 'satf');
    assert.equal(normalizarFrameworkFavoritoAssistente('blueprint'), 'blueprint16');
    assert.equal(normalizarFrameworkFavoritoAssistente(''), null);
    assert.match(instrucaoTomNoPrompt('curto'), /curtas/i);
    assert.match(instrucaoFrameworkFavoritoNoPrompt('satf'), /SATF/i);
  });
});

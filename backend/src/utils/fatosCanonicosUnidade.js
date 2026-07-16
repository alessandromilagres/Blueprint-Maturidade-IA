/**
 * Resolve e mescla fatos canônicos de unidade (config do produto) com glossário do projeto.
 * Projeto vence em conflito de chave; linhas não conflitantes da unidade são injetadas.
 */
import { FATOS_CANONICOS_UNIDADES } from '../config/fatos_canonicos_unidades.js';
import { parseListaLinhas } from './projetoContextoFatos.js';
import { normalizarModeloOperacional } from './empresaUnidade.js';

function normalizarChaveUnidade(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Chave de conflito de linha de glossário (lado esquerdo antes de → : —). */
export function chaveLinhaGlossario(linha) {
  const t = String(linha || '').trim();
  if (!t) return '';
  const m = t.match(/^(.+?)(?:\s*(?:→|->|:|—|–)\s+)/);
  const esquerda = (m ? m[1] : t).trim();
  return normalizarChaveUnidade(esquerda).slice(0, 64);
}

function indiceFatosPorAlias() {
  const map = new Map();
  for (const [codigoCanonico, bloco] of Object.entries(FATOS_CANONICOS_UNIDADES)) {
    const aliases = [codigoCanonico, ...(bloco.aliases || [])];
    for (const a of aliases) {
      const k = normalizarChaveUnidade(a);
      if (k) map.set(k, { codigoCanonico, ...bloco });
    }
  }
  return map;
}

const INDICE_FATOS_UNIDADE = indiceFatosPorAlias();

/**
 * Resolve fatos do produto para a unidade (codigo/nome/aliases).
 * Também aceita modelo operacional sustentacao + nome/codigo contendo GRS.
 */
export function resolverFatosCanonicosUnidade(unidadeMeta) {
  if (!unidadeMeta) return null;
  const candidatos = [
    unidadeMeta.codigo,
    unidadeMeta.nome,
    unidadeMeta.codigoUnidade,
    unidadeMeta.alias
  ].filter(Boolean);

  for (const c of candidatos) {
    const hit = INDICE_FATOS_UNIDADE.get(normalizarChaveUnidade(c));
    if (hit) return hit;
  }

  // Fallback: sustentação cujo nome/código menciona GRS
  const modelo = normalizarModeloOperacional(
    unidadeMeta.modeloOperacional ?? unidadeMeta.modelo_operacional
  );
  const blob = normalizarChaveUnidade(
    `${unidadeMeta.codigo || ''} ${unidadeMeta.nome || ''}`
  );
  if (modelo === 'sustentacao' && /\bGRS\b|_GRS_|GERENTE_SUSTENTACAO/.test(blob)) {
    return { codigoCanonico: 'GRS', ...FATOS_CANONICOS_UNIDADES.GRS };
  }
  return null;
}

/**
 * Mescla glossário/termos: projeto vence em chave conflitante; unidade completa lacunas.
 * @returns {{ glossario: string, termosProibidos: string[], fatosUnidade: object|null, linhasInjetadasUnidade: string[] }}
 */
export function mesclarFatosProjetoComUnidade(
  { glossario = '', termosProibidos = [] } = {},
  unidadeMeta
) {
  const fatosUnidade = resolverFatosCanonicosUnidade(unidadeMeta);
  const linhasProjeto = parseListaLinhas(glossario);
  const termosProjeto = Array.isArray(termosProibidos)
    ? termosProibidos.map((t) => String(t).trim()).filter(Boolean)
    : parseListaLinhas(termosProibidos);

  if (!fatosUnidade) {
    return {
      glossario: linhasProjeto.join('\n'),
      termosProibidos: termosProjeto,
      fatosUnidade: null,
      linhasInjetadasUnidade: []
    };
  }

  const chavesProjeto = new Set(linhasProjeto.map(chaveLinhaGlossario).filter(Boolean));
  const linhasUnidade = Array.isArray(fatosUnidade.glossario)
    ? fatosUnidade.glossario.map((l) => String(l || '').trim()).filter(Boolean)
    : parseListaLinhas(fatosUnidade.glossario);
  const linhasInjetadasUnidade = [];
  for (const linha of linhasUnidade) {
    const chave = chaveLinhaGlossario(linha);
    if (chave && chavesProjeto.has(chave)) continue; // projeto vence
    // Também pular se a linha exata já existe
    if (linhasProjeto.some((p) => p.trim() === linha.trim())) continue;
    linhasInjetadasUnidade.push(linha);
  }

  const glossarioMesclado = [...linhasProjeto, ...linhasInjetadasUnidade].join('\n');

  const termosUnidade = (fatosUnidade.termosProibidos || [])
    .map((t) => String(t).trim())
    .filter(Boolean);
  const termosSet = new Set(termosProjeto.map((t) => t.toLowerCase()));
  const termosMesclados = [...termosProjeto];
  for (const t of termosUnidade) {
    if (!termosSet.has(t.toLowerCase())) {
      termosMesclados.push(t);
      termosSet.add(t.toLowerCase());
    }
  }

  return {
    glossario: glossarioMesclado,
    termosProibidos: termosMesclados,
    fatosUnidade,
    linhasInjetadasUnidade
  };
}

/**
 * Bloco curto para prompt (Seção 3/4) — fatos canônicos da unidade.
 * Sempre injeta o glossário completo da unidade (não só linhas novas),
 * para que descrições erradas no cadastro não prevaleçam.
 */
export function blocoFatosCanonicosUnidadePrompt(unidadeMeta) {
  const fatos = resolverFatosCanonicosUnidade(unidadeMeta);
  if (!fatos?.glossario?.length) return '';

  const linhas = [
    '',
    `### FATOS CANÔNICOS DA UNIDADE (${fatos.codigoCanonico || unidadeMeta?.codigo || unidadeMeta?.nome || 'unidade'})`,
    '',
    '> **AUTORIDADE:** estes fatos **vencem** a descrição cadastrada da unidade e anexos em conflito. Não invente mapeamentos cliente→ferramenta fora desta lista.',
    ''
  ];
  for (const g of fatos.glossario) {
    linhas.push(`- ${g}`);
  }
  if (fatos.notaPrompt) {
    linhas.push('');
    linhas.push(`> ${fatos.notaPrompt}`);
  }
  if (fatos.termosProibidos?.length) {
    linhas.push('');
    linhas.push('**Termos proibidos (unidade):**');
    for (const t of fatos.termosProibidos) {
      linhas.push(`- ~~${t}~~`);
    }
  }
  linhas.push('');
  return linhas.join('\n');
}

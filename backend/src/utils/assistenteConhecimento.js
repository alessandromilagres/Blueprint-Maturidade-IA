import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ORDEM_DIMENSOES_FRAMEWORK,
  ORDEM_DIMENSOES_SATF
} from './ordemDimensoesFramework.js';
import { blocoGuiaProgressaoDimensaoSatf } from './guiasProgressaoFramework.js';
import { METODOLOGIA_BLUEPRINT_RESUMO, METODOLOGIA_SATF_RESUMO } from '../constants/consultorRelatorioIA.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');
const REPO_DOCS = path.join(__dirname, '../../../docs');

const MAX_MANUAL = 7000;
const MAX_TESE = 5500;
const MAX_PROJETO_CTX = 9000;
const MAX_GUIA = 2800;

let cacheManual = null;
let cacheTese = null;

function lerArquivoSeguro(filePath, maxChars) {
  try {
    if (!fs.existsSync(filePath)) return '';
    const txt = fs.readFileSync(filePath, 'utf8');
    return String(txt || '').slice(0, maxChars);
  } catch {
    return '';
  }
}

export function carregarManualSistemaAssistente() {
  if (cacheManual != null) return cacheManual;
  const p = path.join(DATA_DIR, 'assistenteManualSistema.md');
  cacheManual = lerArquivoSeguro(p, MAX_MANUAL);
  return cacheManual;
}

export function carregarTeseResumoAssistente() {
  if (cacheTese != null) return cacheTese;
  const candidatos = [
    path.join(REPO_DOCS, 'TESE_BLUEPRINT_IA.md'),
    path.join(REPO_DOCS, 'TESE_BLUEPRINT_AGENTICO.md')
  ];
  let texto = '';
  for (const c of candidatos) {
    texto = lerArquivoSeguro(c, MAX_TESE);
    if (texto) break;
  }
  cacheTese = texto;
  return cacheTese;
}

export function catalogoDimensoesMarkdown() {
  const bp = ORDEM_DIMENSOES_FRAMEWORK.map((n, i) => `| ${i + 1} | ${n} |`).join('\n');
  const satf = ORDEM_DIMENSOES_SATF.map((n, i) => `| D${i + 1} | ${n} |`).join('\n');
  return `## Catálogo de dimensões

**Blueprint 16** (${METODOLOGIA_BLUEPRINT_RESUMO}):
| Ordem | Dimensão |
|-------|----------|
${bp}

No Blueprint a numeração operacional segue a ordem da tabela (16 dims). Códigos Dn do book Blueprint não são os mesmos do SATF.

**SATF TI v3** (${METODOLOGIA_SATF_RESUMO}):
| Código | Dimensão |
|--------|----------|
${satf}

Notas SATF: D10 fora da média geral; D11 só no diagnóstico se estiver no escopo/foco.
`;
}

const MAPA_CODIGO_SATF = Object.fromEntries(
  ORDEM_DIMENSOES_SATF.map((nome, i) => [`D${i + 1}`, nome])
);

/** Detecta menções a Dn / nomes de dimensão e injeta trecho de guia (quando houver). */
export function trechosGuiaParaPergunta(pergunta, { maxChars = MAX_GUIA } = {}) {
  const q = String(pergunta || '');
  const codigos = new Set();
  for (const m of q.matchAll(/\bD\s*([1-9]|1[01])\b/gi)) {
    codigos.add(`D${Number(m[1])}`);
  }
  for (const [cod, nome] of Object.entries(MAPA_CODIGO_SATF)) {
    if (nome && q.toLowerCase().includes(String(nome).toLowerCase().slice(0, 28))) {
      codigos.add(cod);
    }
  }
  if (!codigos.size) return '';

  const partes = [];
  let usado = 0;
  for (const cod of [...codigos].slice(0, 3)) {
    const nome = MAPA_CODIGO_SATF[cod];
    if (!nome) continue;
    const bloco = blocoGuiaProgressaoDimensaoSatf(nome, 2);
    if (!bloco) continue;
    const slice = bloco.slice(0, Math.min(1200, maxChars - usado));
    partes.push(slice);
    usado += slice.length;
    if (usado >= maxChars) break;
  }
  return partes.join('\n\n').slice(0, maxChars);
}

export function truncarContexto(texto, max = MAX_PROJETO_CTX) {
  const s = String(texto || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n\n[…contexto truncado para caber no prompt…]`;
}

export function montarPacoteConhecimentoBase({ pergunta = '' } = {}) {
  const partes = [
    '# BASE DE CONHECIMENTO DO ASSISTENTE',
    '',
    '## Manual do sistema',
    carregarManualSistemaAssistente() || '(manual indisponível)',
    '',
    catalogoDimensoesMarkdown(),
    '',
    '## Tese / fundamentação (excerto)',
    carregarTeseResumoAssistente() || '(tese indisponível neste ambiente)',
  ];
  const guia = trechosGuiaParaPergunta(pergunta);
  if (guia) {
    partes.push('', '## Guia de progressão (trechos relevantes à pergunta)', guia);
  }
  return partes.join('\n');
}

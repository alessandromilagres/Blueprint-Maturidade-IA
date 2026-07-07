import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ORDEM_DIMENSOES_FRAMEWORK } from './ordemDimensoesFramework.js';
import { nivelNumericoDeScore } from './nivelMaturidadeRubrica.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GUIAS_DIR = path.join(__dirname, '../data/guiasProgressao');

const cacheTexto = new Map();

function arquivoGuiaPorIndice(indiceDimensao) {
  const prefix = `Guia_Progressao_D${String(indiceDimensao + 1).padStart(2, '0')}_`;
  const match = fs.readdirSync(GUIAS_DIR).find((f) => f.startsWith(prefix) && f.endsWith('.txt'));
  if (!match) return null;
  return path.join(GUIAS_DIR, match);
}

function carregarTextoGuia(indiceDimensao) {
  if (cacheTexto.has(indiceDimensao)) return cacheTexto.get(indiceDimensao);
  const arquivo = arquivoGuiaPorIndice(indiceDimensao);
  if (!arquivo) {
    cacheTexto.set(indiceDimensao, '');
    return '';
  }
  const texto = fs.readFileSync(arquivo, 'utf8');
  cacheTexto.set(indiceDimensao, texto);
  return texto;
}

/** Extrai a seção do guia oficial para o nível informado (1–5). */
export function extrairSecaoGuiaProgressao(texto, nivel) {
  const n = Math.min(5, Math.max(1, Number(nivel) || 1));
  if (!texto) return '';

  const inicio = new RegExp(`NÍVEL\\s*\\n${n}\\s*\\n`, 'i');
  const matchInicio = texto.match(inicio);
  if (!matchInicio) return '';

  const start = matchInicio.index;
  const resto = texto.slice(start + matchInicio[0].length);
  const proximo =
    n < 5
      ? resto.search(new RegExp(`\\f\\s*\\nNÍVEL\\s*\\n${n + 1}\\s*\\n`, 'i'))
      : -1;
  const bloco = proximo >= 0 ? resto.slice(0, proximo) : resto;
  return bloco.trim().slice(0, 3200);
}

/** Mapeamento aproximado SATF TI v3 → guia Blueprint (mesma pasta de progressão). */
const SATF_PARA_GUIA_BLUEPRINT = {
  'Estratégia & Postura de IA': 'Estratégia e Liderança',
  'Governança, Risco & Conformidade': 'Governança e Risco',
  'Pessoas, Cultura & Capacitação': 'Pessoas e Cultura',
  'Engenharia & Padrões de Desenvolvimento': 'Operações e Processos',
  'Plataforma, Arquitetura & Escala': 'Plataforma e Industrialização de IA',
  'Dados, Contexto & Conhecimento': 'Dados e Tecnologia',
  'Segurança & Qualidade Integrada (QA)': 'Governança e Risco',
  'Modernização & Sustentação de Legado': 'Operações e Processos',
  'FinOps, Valor & Apoio ao Negócio': 'Valor de Negócio e ROI',
  'Fábrica Agêntica de Software': 'Plataforma e Industrialização de IA',
  'Conformidade Regulatória de IA': 'Conformidade Regulatória'
};

function limparTextoGuiaParaPromptSatf(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/^Framework:\s*MIT CISR[^\n]*/gim, '')
    .replace(/\bMIT CISR\b/gi, 'benchmark de mercado')
    .replace(/Dimensão\s+\d+:\s*[^\n]+/gi, '')
    .replace(/\b16 dimens(?:õ|o)es\b/gi, '11 dimensões SATF')
    .trim();
}

export function blocoGuiaProgressaoDimensaoSatf(nomeDimensaoSatf, scoreOuNivel) {
  const nomeSatf = String(nomeDimensaoSatf || '').trim();
  const nomeBlueprint = SATF_PARA_GUIA_BLUEPRINT[nomeSatf];
  if (!nomeBlueprint) return '';

  const idx = ORDEM_DIMENSOES_FRAMEWORK.indexOf(nomeBlueprint);
  if (idx < 0) return '';

  const nivel =
    Number(scoreOuNivel) >= 1 && Number(scoreOuNivel) <= 5
      ? Number(scoreOuNivel)
      : nivelNumericoDeScore(scoreOuNivel);

  const texto = carregarTextoGuia(idx);
  const secao = extrairSecaoGuiaProgressao(texto, nivel);
  if (!secao) return '';

  const secaoLimpa = limparTextoGuiaParaPromptSatf(secao);
  if (!secaoLimpa) return '';

  return `### Referência interna de calibração — ${nomeSatf} (SATF TI v3, Nível ${nivel})

**INSTRUÇÃO CRÍTICA (não reproduzir no book):** calibração interna apenas. No documento final use **exclusivamente** o nome SATF **"${nomeSatf}"** e códigos D1–D11. **Não** cite dimensões Blueprint ("${nomeBlueprint}" ou outras das 16), nem MIT CISR como metodologia.

${secaoLimpa}`;
}

export function blocoGuiaProgressaoDimensao(nomeDimensao, scoreOuNivel) {
  const idx = ORDEM_DIMENSOES_FRAMEWORK.indexOf(String(nomeDimensao || '').trim());
  if (idx < 0) return '';

  const nivel =
    Number(scoreOuNivel) >= 1 && Number(scoreOuNivel) <= 5
      ? Number(scoreOuNivel)
      : nivelNumericoDeScore(scoreOuNivel);

  const texto = carregarTextoGuia(idx);
  const secao = extrairSecaoGuiaProgressao(texto, nivel);
  if (!secao) return '';

  return `### Guia oficial de progressão — ${nomeDimensao} (Nível ${nivel})

Use este conteúdo como **referência obrigatória** para calibrar diagnóstico, riscos e recomendações (não invente critérios fora do guia):

${secao}`;
}

export function blocoMapaProgressaoDimensao(nomeDimensao) {
  const idx = ORDEM_DIMENSOES_FRAMEWORK.indexOf(String(nomeDimensao || '').trim());
  if (idx < 0) return '';
  const texto = carregarTextoGuia(idx);
  if (!texto) return '';

  const mapa = texto.match(
    /Mapa de Progressão[\s\S]*?NÍVEL 5[\s\S]*?4\.2 – 5\.0[\s\S]*?% das empresas/
  );
  if (!mapa) return '';
  return `### Mapa de progressão — ${nomeDimensao}\n\n${mapa[0].trim()}`;
}

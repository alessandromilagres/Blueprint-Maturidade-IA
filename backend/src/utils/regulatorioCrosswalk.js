import {
  CROSSWALK_DIMENSOES,
  CROSSWALK_POR_CODIGO,
  CROSSWALK_POR_NOME,
  DISCLAIMER_REGULATORIO
} from '../data/regulatorio/crosswalk.js';
import { ORDEM_DIMENSOES_FRAMEWORK } from './ordemDimensoesFramework.js';

const CODIGO_REGEX = /^D(\d{1,2})$/i;

export { DISCLAIMER_REGULATORIO };

export function normalizarCodigoDimensao(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const m = upper.match(CODIGO_REGEX);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 16) return `D${String(n).padStart(2, '0')}`;
    return null;
  }
  if (CROSSWALK_POR_NOME.has(raw)) {
    return CROSSWALK_POR_NOME.get(raw).codigoDimensao;
  }
  const matchedName = ORDEM_DIMENSOES_FRAMEWORK.find((d) => d.toLowerCase() === raw.toLowerCase());
  if (matchedName && CROSSWALK_POR_NOME.has(matchedName)) {
    return CROSSWALK_POR_NOME.get(matchedName).codigoDimensao;
  }
  return null;
}

export function resolverCrosswalkDimensao(input) {
  const codigo = normalizarCodigoDimensao(input);
  if (codigo && CROSSWALK_POR_CODIGO.has(codigo)) {
    return CROSSWALK_POR_CODIGO.get(codigo);
  }
  const nome = String(input || '').trim();
  if (CROSSWALK_POR_NOME.has(nome)) {
    return CROSSWALK_POR_NOME.get(nome);
  }
  const parcial = ORDEM_DIMENSOES_FRAMEWORK.find(
    (d) => d.toLowerCase() === nome.toLowerCase()
  );
  if (parcial && CROSSWALK_POR_NOME.has(parcial)) {
    return CROSSWALK_POR_NOME.get(parcial);
  }
  return null;
}

export function codigoDimensaoPorNome(nomeArea) {
  const n = String(nomeArea || '').trim();
  const idx = ORDEM_DIMENSOES_FRAMEWORK.findIndex(
    (d) => d === n || d.toLowerCase() === n.toLowerCase()
  );
  if (idx < 0) return null;
  return `D${String(idx + 1).padStart(2, '0')}`;
}

function nivelRiscoLabel(nivel) {
  const map = {
    CRITICO: 'Crítico',
    ALTO: 'Alto',
    MEDIO: 'Médio',
    BAIXO: 'Baixo'
  };
  return map[nivel] || nivel;
}

/**
 * Avalia implicação regulatória de uma dimensão dado o score BluePrint.
 */
export function avaliarImplicacaoRegulatoriaDimensao({ nomeDimensao, codigoDimensao, score }) {
  const crosswalk =
    resolverCrosswalkDimensao(codigoDimensao || nomeDimensao) ||
    (nomeDimensao ? resolverCrosswalkDimensao(codigoDimensaoPorNome(nomeDimensao)) : null);

  if (!crosswalk) {
    return {
      disponivel: false,
      disclaimer: DISCLAIMER_REGULATORIO
    };
  }

  const scoreNum = Number(score);
  const temScore = Number.isFinite(scoreNum) && scoreNum > 0;
  const limiar = crosswalk.scoreLimiar;
  const emGap = temScore && scoreNum < limiar;
  const nivelRisco = !temScore
    ? null
    : emGap
      ? crosswalk.riscoNivelPadrao
      : 'BAIXO';

  return {
    disponivel: true,
    codigoDimensao: crosswalk.codigoDimensao,
    nomeDimensao: crosswalk.nomeDimensao,
    score: temScore ? scoreNum : null,
    scoreLimiar: limiar,
    emGap,
    nivelRisco,
    nivelRiscoLabel: nivelRisco ? nivelRiscoLabel(nivelRisco) : null,
    iso: {
      clausulas: crosswalk.isoClausulas || [],
      resumo: crosswalk.textoIso
    },
    pl: {
      artigos: crosswalk.plArtigos || [],
      resumo: crosswalk.textoPl
    },
    lgpd: {
      artigos: crosswalk.lgpdArtigos || [],
      resumo: crosswalk.textoLgpd
    },
    logicaMapeamento: crosswalk.logicaMapeamento,
    disclaimer: DISCLAIMER_REGULATORIO
  };
}

export function listarCrosswalkRegulatorio() {
  return CROSSWALK_DIMENSOES.map((item) => ({
    codigoDimensao: item.codigoDimensao,
    nomeDimensao: item.nomeDimensao,
    scoreLimiar: item.scoreLimiar,
    riscoNivelPadrao: item.riscoNivelPadrao,
    isoClausulas: item.isoClausulas,
    plArtigos: item.plArtigos,
    lgpdArtigos: item.lgpdArtigos,
    logicaMapeamento: item.logicaMapeamento
  }));
}

export function enriquecerScoresPorAreaComRegulatorio(scoresPorArea) {
  return (scoresPorArea || []).map((item) => ({
    ...item,
    regulatorio: avaliarImplicacaoRegulatoriaDimensao({
      nomeDimensao: item.area ?? item.nome ?? item.areaNome,
      score: item.score
    })
  }));
}

export function resumoRegulatorioProjeto(scoresPorArea) {
  const enriquecidos = enriquecerScoresPorAreaComRegulatorio(scoresPorArea);
  const comMapeamento = enriquecidos.filter((s) => s.regulatorio?.disponivel);
  const gaps = comMapeamento.filter((s) => s.regulatorio?.emGap);
  const criticos = gaps.filter((s) => s.regulatorio?.nivelRisco === 'CRITICO');

  return {
    totalDimensoesMapeadas: comMapeamento.length,
    totalGaps: gaps.length,
    totalCriticos: criticos.length,
    dimensoesEmGap: gaps.map((s) => ({
      codigo: s.regulatorio.codigoDimensao,
      nome: s.regulatorio.nomeDimensao,
      score: s.regulatorio.score,
      nivelRisco: s.regulatorio.nivelRisco
    })),
    disclaimer: DISCLAIMER_REGULATORIO
  };
}

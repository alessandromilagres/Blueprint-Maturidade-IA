import { areaContaParaAvaliacao } from './avaliacaoAreasRecusadas.js';
import {
  ordenarAreasPorFramework,
  garantirTodasDimensoesFramework,
  frameworkMaturidadeDeAreas
} from './ordemDimensoesFramework.js';
import { nivelNumericoDeScore } from './nivelMaturidadeRubrica.js';
import { areaForaDaMediaGeral } from './frameworkScoringPolicy.js';

export { nivelNumericoDeScore };

/**
 * Mesma agregação do GET /api/dashboard/projeto/:id:
 * média por área em cada avaliador → média entre avaliadores; por pergunta, média das respostas válidas.
 *
 * @param {object} [options]
 * @param {Map<number, number>} [options.pesosPorArea] Pesos (percentuais) por areaId das dimensões
 *   ATIVAS do projeto. Quando informado, o scoreGeral vira média PONDERADA por esses pesos
 *   (dimensões fora do map são excluídas do score). Sem o map → média simples (comportamento atual).
 * @param {Map<number, {ativa:boolean, peso:number, foraDeEscopo:boolean}>} [options.dimensoesConfig]
 *   Config de apresentação por areaId (de mapaApresentacaoDimensoes). Quando informado:
 *   - anexa `peso` e `foraDeEscopo` a cada dimensão (scoresPorArea e todasDimensoes);
 *   - o scoreGeral pondera apenas dimensões ativas (peso > 0, não fora de escopo);
 *   - dimensões fora de escopo saem de `scoresPorArea` (gaps/radar) e vão para `dimensoesForaEscopo`.
 */
export function calcularScoresConsolidadoMaturidade(avaliacoesFinalizadas, areas, options = {}) {
  const dimensoesConfig =
    options && options.dimensoesConfig instanceof Map ? options.dimensoesConfig : null;
  // Compat: pesosPorArea explícito OU derivado da config (ativas, peso>0, não fora de escopo).
  let pesosPorArea =
    options && options.pesosPorArea instanceof Map ? options.pesosPorArea : null;
  if (!pesosPorArea && dimensoesConfig) {
    pesosPorArea = new Map();
    for (const [areaId, cfg] of dimensoesConfig.entries()) {
      if (cfg && cfg.ativa && !cfg.foraDeEscopo && !cfg.foraDaMediaGeral && Number(cfg.peso) > 0) {
        pesosPorArea.set(areaId, Number(cfg.peso));
      }
    }
  }
  const pesoDe = (areaId) => {
    const cfg = dimensoesConfig?.get(areaId);
    return cfg ? Number(cfg.peso) || 0 : null;
  };
  const foraDeEscopoDe = (areaId) => {
    const cfg = dimensoesConfig?.get(areaId);
    return cfg ? cfg.foraDeEscopo === true : false;
  };
  const foraDaMediaDe = (areaId, areaObj) => {
    const cfg = dimensoesConfig?.get(areaId);
    if (cfg?.foraDaMediaGeral === true) return true;
    if (areaObj) return areaForaDaMediaGeral(areaObj);
    return false;
  };
  const fw = frameworkMaturidadeDeAreas(areas);
  const areasOrdenadas = ordenarAreasPorFramework(areas, fw);
  const todasAreaIds = areasOrdenadas.map((a) => a.id);
  const totalAvaliadores = avaliacoesFinalizadas.length;

  const scoresPorArea = areasOrdenadas.map((area) => {
    let somaScores = 0;
    let countAvaliacoes = 0;

    avaliacoesFinalizadas.forEach((avaliacao) => {
      if (!areaContaParaAvaliacao(avaliacao, area.id, todasAreaIds)) return;
      const respostasArea = (avaliacao.respostas || []).filter(
        (r) => r.pergunta?.areaId === area.id && r.pontuacao !== null
      );
      if (respostasArea.length > 0) {
        const media =
          respostasArea.reduce((acc, r) => acc + r.pontuacao, 0) / respostasArea.length;
        somaScores += media;
        countAvaliacoes++;
      }
    });

    const mediaArea = countAvaliacoes > 0 ? somaScores / countAvaliacoes : 0;

    const perguntas = (area.perguntas || []).map((pergunta) => {
      let somaPergunta = 0;
      let countRespostas = 0;
      avaliacoesFinalizadas.forEach((avaliacao) => {
        if (!areaContaParaAvaliacao(avaliacao, area.id, todasAreaIds)) return;
        const resposta = (avaliacao.respostas || []).find(
          (r) => r.perguntaId === pergunta.id && r.pontuacao !== null
        );
        if (resposta) {
          somaPergunta += resposta.pontuacao;
          countRespostas++;
        }
      });
      const scorePergunta = countRespostas > 0 ? somaPergunta / countRespostas : 0;
      return {
        numero: pergunta.numero,
        texto: pergunta.texto,
        score: parseFloat(scorePergunta.toFixed(2)),
        totalRespostas: countRespostas
      };
    });

    return {
      areaId: area.id,
      area: area.nome,
      descricao: area.descricao,
      score: parseFloat(mediaArea.toFixed(2)),
      nivel: nivelNumericoDeScore(mediaArea),
      avaliadoresCobriram: countAvaliacoes,
      totalAvaliadores,
      perguntas,
      semDadosConsolidados: countAvaliacoes === 0,
      foraDaMediaGeral: foraDaMediaDe(area.id, area),
      ...(dimensoesConfig
        ? {
            peso: pesoDe(area.id),
            foraDeEscopo: foraDeEscopoDe(area.id),
            foraDaMediaGeral: foraDaMediaDe(area.id, area)
          }
        : {})
    };
  });

  const entraNaMediaGeral = (a) => {
    const areaObj = areasOrdenadas.find((ar) => ar.id === a.areaId);
    return a.foraDeEscopo !== true && !foraDaMediaDe(a.areaId, areaObj);
  };

  // Gaps/radar: dimensões com nota na média geral (exclui desativadas e D10 SATF).
  const areasComScore = scoresPorArea.filter((a) => a.score > 0 && entraNaMediaGeral(a));
  const dimensoesForaEscopo = dimensoesConfig
    ? scoresPorArea.filter((a) => a.foraDeEscopo === true)
    : [];
  const dimensoesEspecializadas = scoresPorArea.filter(
    (a) => a.foraDaMediaGeral === true && a.foraDeEscopo !== true
  );
  const mediaSimples =
    areasComScore.length > 0
      ? areasComScore.reduce((acc, a) => acc + a.score, 0) / areasComScore.length
      : 0;

  let scoreGeral = mediaSimples;
  if (pesosPorArea && pesosPorArea.size > 0 && areasComScore.length > 0) {
    let somaPonderada = 0;
    let somaPesos = 0;
    for (const a of areasComScore) {
      const peso = Number(pesosPorArea.get(a.areaId)) || 0;
      if (peso > 0) {
        somaPonderada += a.score * peso;
        somaPesos += peso;
      }
    }
    // Se nenhuma dimensão ativa tem nota ainda, mantém a média simples como fallback.
    scoreGeral = somaPesos > 0 ? somaPonderada / somaPesos : mediaSimples;
  }

  let todasDimensoes = garantirTodasDimensoesFramework(areasOrdenadas, scoresPorArea, fw);
  if (dimensoesConfig) {
    todasDimensoes = todasDimensoes.map((d) => ({
      ...d,
      peso: d.areaId != null ? pesoDe(d.areaId) : (d.peso ?? null),
      foraDeEscopo: d.areaId != null ? foraDeEscopoDe(d.areaId) : (d.foraDeEscopo === true),
      foraDaMediaGeral:
        d.areaId != null
          ? foraDaMediaDe(
              d.areaId,
              areasOrdenadas.find((ar) => ar.id === d.areaId)
            )
          : d.foraDaMediaGeral === true
    }));
  } else {
    todasDimensoes = todasDimensoes.map((d) => ({
      ...d,
      foraDaMediaGeral: foraDaMediaDe(
        d.areaId,
        areasOrdenadas.find((ar) => ar.id === d.areaId)
      )
    }));
  }

  return {
    /** Dimensões com score > 0 na média geral (gaps/radar/plano). */
    scoresPorArea: areasComScore,
    /** Dimensões desativadas na config do projeto. */
    dimensoesForaEscopo,
    /** Dimensões avaliadas com score próprio fora da média (ex.: D10 SATF). */
    dimensoesEspecializadas,
    /** Todas as dimensões do framework na ordem canônica. */
    todasDimensoes,
    scoreGeral: parseFloat(scoreGeral.toFixed(2)),
    totalAvaliadores
  };
}

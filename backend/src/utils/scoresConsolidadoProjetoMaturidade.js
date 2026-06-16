import { areaContaParaAvaliacao } from './avaliacaoAreasRecusadas.js';
import {
  ordenarAreasPorFramework,
  garantirTodasDimensoesFramework
} from './ordemDimensoesFramework.js';
import { nivelNumericoDeScore } from './nivelMaturidadeRubrica.js';

export { nivelNumericoDeScore };

/**
 * Mesma agregação do GET /api/dashboard/projeto/:id:
 * média por área em cada avaliador → média entre avaliadores; por pergunta, média das respostas válidas.
 */
export function calcularScoresConsolidadoMaturidade(avaliacoesFinalizadas, areas) {
  const areasOrdenadas = ordenarAreasPorFramework(areas);
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
      semDadosConsolidados: countAvaliacoes === 0
    };
  });

  const areasComScore = scoresPorArea.filter((a) => a.score > 0);
  const scoreGeral =
    areasComScore.length > 0
      ? areasComScore.reduce((acc, a) => acc + a.score, 0) / areasComScore.length
      : 0;

  const todasDimensoes = garantirTodasDimensoesFramework(areasOrdenadas, scoresPorArea);

  return {
    /** Dimensões com score > 0 (média do projeto, top/bottom gaps). */
    scoresPorArea: areasComScore,
    /** Todas as 16 dimensões na ordem oficial do framework. */
    todasDimensoes,
    scoreGeral: parseFloat(scoreGeral.toFixed(2)),
    totalAvaliadores
  };
}

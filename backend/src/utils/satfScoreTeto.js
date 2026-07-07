/**
 * SATF — nota efetiva com teto N3 quando nota ≥ 4 sem evidência válida.
 */
import {
  evidenciaPreenchida,
  exigeEvidenciaSatf
} from './satfEvidenciaObrigatoria.js';

export const SATF_TETO_SEM_EVIDENCIA = 3;

export function pontuacaoEfetivaSatf(resposta) {
  if (!resposta || resposta.semInformacao === true) return null;
  const nota = Number(resposta.pontuacao);
  if (!Number.isFinite(nota)) return null;
  if (!exigeEvidenciaSatf(resposta)) return nota;
  return evidenciaPreenchida(resposta.observacoes) ? nota : SATF_TETO_SEM_EVIDENCIA;
}

export function mediaPontuacoes(valores) {
  const nums = (valores || []).filter((n) => Number.isFinite(n));
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Média declarada e com teto para uma área a partir das avaliações finalizadas.
 */
export function scoresAreaSatfDeclaradoETeto(avaliacoesFinalizadas, areaId, todasAreaIds, areaContaFn) {
  const declaradas = [];
  const comTeto = [];

  for (const avaliacao of avaliacoesFinalizadas || []) {
    if (!areaContaFn(avaliacao, areaId, todasAreaIds)) continue;
    const respostasArea = (avaliacao.respostas || []).filter(
      (r) => r.pergunta?.areaId === areaId && r.pontuacao != null
    );
    if (!respostasArea.length) continue;

    const mediaDecl = mediaPontuacoes(respostasArea.map((r) => Number(r.pontuacao)));
    const mediaTeto = mediaPontuacoes(
      respostasArea.map((r) => pontuacaoEfetivaSatf(r)).filter((n) => n != null)
    );
    declaradas.push(mediaDecl);
    comTeto.push(mediaTeto);
  }

  const scoreDeclarado = declaradas.length ? mediaPontuacoes(declaradas) : 0;
  const scoreComTeto = comTeto.length ? mediaPontuacoes(comTeto) : 0;
  return {
    scoreDeclarado: parseFloat(scoreDeclarado.toFixed(2)),
    scoreComTeto: parseFloat(scoreComTeto.toFixed(2)),
    avaliadoresCobriram: declaradas.length
  };
}

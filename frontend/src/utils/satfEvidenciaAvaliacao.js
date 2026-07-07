import { FRAMEWORK_SATF_TI_V3 } from '../constants/frameworkMaturidade.js';

export const SATF_NOTA_MINIMA_COM_EVIDENCIA = 4;
export const SATF_EVIDENCIA_MIN_CHARS = 20;

export function frameworkExigeEvidenciaSatf(frameworkMaturidade) {
  return frameworkMaturidade === FRAMEWORK_SATF_TI_V3;
}

export function exigeEvidenciaSatf(resposta) {
  if (!resposta || resposta.semInformacao === true) return false;
  const nota = Number(resposta.pontuacao);
  return Number.isFinite(nota) && nota >= SATF_NOTA_MINIMA_COM_EVIDENCIA;
}

export function evidenciaPreenchida(observacoes, minChars = SATF_EVIDENCIA_MIN_CHARS) {
  return String(observacoes || '').trim().length >= minChars;
}

/**
 * @param {Array} areas — áreas com perguntas
 * @param {number[]} areasRecusadas
 * @param {Function} getRespostaByPergunta — (perguntaId) => resposta row
 * @param {Object} respostas — mapa id → { pontuacao, semInformacao, observacoes }
 */
export function coletarPendentesEvidenciaSatf(areas, areasRecusadas, getRespostaByPergunta, respostas) {
  const pendentes = [];

  for (const area of areas || []) {
    if (areasRecusadas.includes(area.id)) continue;
    for (const pergunta of area.perguntas || []) {
      const resposta = getRespostaByPergunta(pergunta.id);
      if (!resposta) continue;
      const atual = respostas[resposta.id] || {};
      if (!exigeEvidenciaSatf(atual)) continue;
      if (evidenciaPreenchida(atual.observacoes)) continue;

      pendentes.push({
        perguntaId: pergunta.id,
        numero: pergunta.numero,
        area: area.nome,
        pergunta: pergunta.texto,
        pontuacao: atual.pontuacao,
        evidenciaEsperada: pergunta.evidenciaEsperada || null,
        areaId: area.id,
      });
    }
  }

  return pendentes;
}

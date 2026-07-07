/**
 * SATF TI v3 — nível ≥ 4 (Gerenciado/Otimizado) exige evidência documentada nas observações.
 */
import { FRAMEWORK_SATF_TI_V3 } from '../constants/frameworkMaturidadePolicy.js';

export const SATF_NOTA_MINIMA_COM_EVIDENCIA = 4;
export const SATF_EVIDENCIA_MIN_CHARS = 20;

export function exigeEvidenciaSatf(resposta) {
  if (!resposta || resposta.semInformacao === true) return false;
  const nota = Number(resposta.pontuacao);
  return Number.isFinite(nota) && nota >= SATF_NOTA_MINIMA_COM_EVIDENCIA;
}

export function evidenciaPreenchida(observacoes, minChars = SATF_EVIDENCIA_MIN_CHARS) {
  return String(observacoes || '').trim().length >= minChars;
}

/**
 * @param {Array<{ perguntaId, pontuacao, semInformacao, observacoes, pergunta? }>} respostas
 */
export function validarEvidenciasSatfObrigatorias(respostas, options = {}) {
  const minChars = options.minChars ?? SATF_EVIDENCIA_MIN_CHARS;
  const pendentes = [];

  for (const resposta of respostas || []) {
    if (!exigeEvidenciaSatf(resposta)) continue;
    if (evidenciaPreenchida(resposta.observacoes, minChars)) continue;

    const pergunta = resposta.pergunta;
    pendentes.push({
      perguntaId: resposta.perguntaId,
      numero: pergunta?.numero ?? null,
      area: pergunta?.area?.nome ?? null,
      pergunta: pergunta?.texto ?? `Pergunta #${resposta.perguntaId}`,
      pontuacao: resposta.pontuacao,
      evidenciaEsperada: pergunta?.evidenciaEsperada ?? null
    });
  }

  return { ok: pendentes.length === 0, pendentes };
}

export function mensagemErroEvidenciasSatf(pendentes) {
  const n = pendentes?.length ?? 0;
  if (n === 0) return '';
  const exemplos = pendentes
    .slice(0, 3)
    .map((p) => `D${String(p.numero ?? '?').padStart(2, '0')} (${p.area || 'dimensão'})`)
    .join(', ');
  const sufixo = n > 3 ? ` e mais ${n - 3}` : '';
  return (
    `SATF: notas ≥ ${SATF_NOTA_MINIMA_COM_EVIDENCIA} exigem evidência nas observações (mín. ${SATF_EVIDENCIA_MIN_CHARS} caracteres). ` +
    `Pendente em ${n} pergunta(s): ${exemplos}${sufixo}.`
  );
}

export function frameworkExigeEvidenciaSatf(frameworkMaturidade) {
  return frameworkMaturidade === FRAMEWORK_SATF_TI_V3;
}

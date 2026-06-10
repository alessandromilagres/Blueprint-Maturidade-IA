/**
 * Áreas que o avaliador indicou não estar apto a responder — excluídas de todos os cálculos.
 */

export function parseAreasRecusadas(avaliacao) {
  if (!avaliacao?.areasRecusadas) return [];
  try {
    const arr = JSON.parse(avaliacao.areasRecusadas);
    return Array.isArray(arr)
      ? arr.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n))
      : [];
  } catch {
    return [];
  }
}

export function parseAreasSelecionadas(avaliacao, todasAreaIds) {
  if (!avaliacao?.areasSelecionadas) return todasAreaIds;
  try {
    const arr = JSON.parse(avaliacao.areasSelecionadas);
    return Array.isArray(arr)
      ? arr.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n))
      : todasAreaIds;
  } catch {
    return todasAreaIds;
  }
}

/** Respostas da avaliação que entram em médias/scores (fora de áreas recusadas). */
export function respostasParaCalculo(avaliacao) {
  const rec = parseAreasRecusadas(avaliacao);
  if (!avaliacao?.respostas?.length) return [];
  return avaliacao.respostas.filter((r) => r.pergunta && !rec.includes(r.pergunta.areaId));
}

export function areaContaParaAvaliacao(avaliacao, areaId, todasAreaIds) {
  const sel = parseAreasSelecionadas(avaliacao, todasAreaIds);
  const rec = parseAreasRecusadas(avaliacao);
  return sel.includes(areaId) && !rec.includes(areaId);
}

/**
 * Mesma lógica do frontend (AvaliacaoForm): áreas recusadas saem do denominador;
 * só contam perguntas nas áreas selecionadas para o avaliador.
 * `areas`: lista de áreas com `{ id, perguntas: [{ id }] }`.
 */
export function calcularProgressoAvaliacaoProjeto(avaliacao, areas) {
  const todasAreaIds = areas.map((a) => a.id);
  const permitted = parseAreasSelecionadas(avaliacao, todasAreaIds);
  const rec = parseAreasRecusadas(avaliacao);

  const mapResposta = new Map();
  for (const r of avaliacao.respostas || []) {
    mapResposta.set(r.perguntaId, r);
  }

  let total = 0;
  let respondidas = 0;

  for (const area of areas) {
    if (!permitted.includes(area.id)) continue;
    if (rec.includes(area.id)) continue;
    const perguntas = area.perguntas || [];
    total += perguntas.length;
    for (const p of perguntas) {
      const r = mapResposta.get(p.id);
      if (
        r != null &&
        (r.semInformacao === true || (r.pontuacao !== null && r.pontuacao !== undefined))
      ) {
        respondidas++;
      }
    }
  }

  const percentual =
    total > 0 ? Math.round((respondidas / total) * 100) : 0;

  return { respondidas, total, percentual };
}

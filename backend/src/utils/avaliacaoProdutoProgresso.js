/**
 * Progresso do questionário de avaliação de produto (obrigatórias + verticais selecionadas).
 * Alinhado à lógica do frontend (AvaliacaoProdutoForm).
 */
export function calcularProgressoAvaliacaoProduto(avaliacao, perguntasObrigatorias, verticais) {
  const obrig = perguntasObrigatorias || [];
  const verts = verticais || [];
  const totalObrig = obrig.length;
  const totalVert = verts.reduce((acc, v) => acc + (v.perguntas?.length || 0), 0);
  const total = totalObrig + totalVert;

  const mapObr = new Map();
  for (const r of avaliacao.respostasObrigatorias || []) {
    mapObr.set(r.perguntaObrigatoriaId, r);
  }
  const mapVert = new Map();
  for (const r of avaliacao.respostasVerticais || []) {
    mapVert.set(r.perguntaProdutoId, r);
  }

  let respondidasObr = 0;
  for (const p of obrig) {
    const r = mapObr.get(p.id);
    if (r != null && r.pontuacao !== null && r.pontuacao !== undefined) respondidasObr++;
  }

  let respondidasVert = 0;
  for (const v of verts) {
    for (const p of v.perguntas || []) {
      const r = mapVert.get(p.id);
      if (r != null && r.pontuacao !== null && r.pontuacao !== undefined) respondidasVert++;
    }
  }

  const respondidas = respondidasObr + respondidasVert;
  const percentual = total > 0 ? Math.round((respondidas / total) * 100) : 0;

  return {
    respondidas,
    total,
    percentual,
    obrigatorias: { respondidas: respondidasObr, total: totalObrig },
    verticais: { respondidas: respondidasVert, total: totalVert }
  };
}

/** Espelho do agrupamento por unidade organizacional (backend/utils/empresaUnidade.js). */

function ordenarUnidadesEmpresa(unidadesEmpresa = []) {
  return [...unidadesEmpresa].sort((a, b) => {
    if (a.ehPadrao && !b.ehPadrao) return -1;
    if (!a.ehPadrao && b.ehPadrao) return 1;
    return (a.ordem ?? 0) - (b.ordem ?? 0) || String(a.nome).localeCompare(String(b.nome), 'pt-BR');
  });
}

export function agruparAvaliadoresPorUnidade({
  avaliadores = [],
  unidadesEmpresa = [],
  unidadeGeralId = null,
  incluirUnidadesVazias = true
} = {}) {
  const ordemUnidades = ordenarUnidadesEmpresa(unidadesEmpresa);
  const grupos = new Map();

  if (incluirUnidadesVazias) {
    for (const unidade of ordemUnidades) {
      grupos.set(unidade.id, { unidade, avaliadores: [] });
    }
  }

  for (const avaliador of avaliadores) {
    const uid = avaliador?.empresaUnidadeId ?? unidadeGeralId;
    if (uid == null) continue;
    if (!grupos.has(uid)) {
      const unidade =
        ordemUnidades.find((u) => u.id === uid) || {
          id: uid,
          nome: avaliador?.empresaUnidadeNome || `Unidade #${uid}`,
          ehPadrao: uid === unidadeGeralId
        };
      grupos.set(uid, { unidade, avaliadores: [] });
    }
    grupos.get(uid).avaliadores.push(avaliador);
  }

  const resultado = [];
  const seen = new Set();
  for (const unidade of ordemUnidades) {
    if (!grupos.has(unidade.id)) continue;
    const grupo = grupos.get(unidade.id);
    resultado.push({
      id: unidade.id,
      nome: unidade.nome,
      codigo: unidade.codigo || '',
      ehPadrao: Boolean(unidade.ehPadrao),
      total: grupo.avaliadores.length,
      avaliadores: grupo.avaliadores
    });
    seen.add(unidade.id);
  }
  for (const [uid, grupo] of grupos) {
    if (seen.has(uid)) continue;
    resultado.push({
      id: uid,
      nome: grupo.unidade.nome,
      codigo: grupo.unidade.codigo || '',
      ehPadrao: Boolean(grupo.unidade.ehPadrao),
      total: grupo.avaliadores.length,
      avaliadores: grupo.avaliadores
    });
  }
  return resultado;
}

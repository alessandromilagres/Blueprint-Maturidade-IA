/** Lê o filtro de prioridade da URL (alinhado ao dashboard). Padrão: 3. */
export function filtroNivelMapeamentoFromSearchParams(searchParams) {
  const raw = searchParams.get('nivelPrioridadeMapeamentoMaturidade');
  if (raw === '0') return 0;
  const n = parseInt(raw ?? '3', 10);
  if (n >= 1 && n <= 3) return n;
  return 3;
}

export function queryNivelMapeamentoMaturidade(filtro) {
  const n = filtro === 0 ? 0 : filtro >= 1 && filtro <= 3 ? filtro : 3;
  return `nivelPrioridadeMapeamentoMaturidade=${n}`;
}

export function labelFiltroNivelMapeamento(filtro) {
  if (filtro === 0) return 'Todos os níveis de prioridade';
  if (filtro === 1) return 'Até nível 1 (somente prioridade 1)';
  if (filtro === 2) return 'Até nível 2 (prioridades 1 e 2)';
  return 'Até nível 3 (prioridades 1, 2 e 3)';
}

export function perguntarFiltroNivelMapeamento({
  defaultValue = 3,
  contexto = 'relatório IA'
} = {}) {
  const padrao = defaultValue === 0 || (defaultValue >= 1 && defaultValue <= 3) ? defaultValue : 3;
  const resposta = window.prompt(
    `Qual nível de avaliadores deve ser analisado para gerar o ${contexto}?\n\n` +
      `1 = somente prioridade 1\n` +
      `2 = prioridades 1 e 2\n` +
      `3 = prioridades 1, 2 e 3\n` +
      `0 = todos os avaliadores finalizados\n\n` +
      `Digite 1, 2, 3 ou 0:`,
    String(padrao)
  );

  if (resposta == null) return null;
  const raw = resposta.trim().toLowerCase();
  if (raw === 'todos' || raw === 'all') return 0;
  const n = parseInt(raw, 10);
  if (n === 0 || (n >= 1 && n <= 3)) return n;
  window.alert('Nível inválido. Digite 1, 2, 3 ou 0 para todos.');
  return null;
}

/** Filtro gravado no snapshot do relatório IA (biblioteca / cache). */
export function filtroNivelFromDadosUsados(dadosUsados) {
  const salvo = dadosUsados?.filtroNivelPrioridadeMapeamentoMaturidadeAplicado;
  if (salvo === null) return 0;
  if (salvo >= 1 && salvo <= 3) return salvo;
  return 3;
}

export function queryVersaoBibliotecaRelatorioIA(r) {
  const qs = new URLSearchParams();
  if (r.tipo === 'completo_rapido') qs.set('modo', 'rapido');
  const filtro =
    r.dadosUsados?.filtroNivelPrioridadeMapeamentoMaturidadeAplicado ??
    r.dadosSnapshot?.filtroNivelPrioridadeMapeamentoMaturidadeAplicado;
  if (filtro === null) qs.set('nivelPrioridadeMapeamentoMaturidade', '0');
  else if (filtro >= 1 && filtro <= 3) {
    qs.set('nivelPrioridadeMapeamentoMaturidade', String(filtro));
  } else {
    qs.set('nivelPrioridadeMapeamentoMaturidade', '3');
  }
  qs.set('versaoId', String(r.id));
  return qs.toString();
}

export function pathRelatorioMitIaCompleto(projetoId, { modoRapido = false, filtroNivel = 3 } = {}) {
  const p = new URLSearchParams();
  if (modoRapido) p.set('modo', 'rapido');
  const n = filtroNivel === 0 ? 0 : filtroNivel >= 1 && filtroNivel <= 3 ? filtroNivel : 3;
  p.set('nivelPrioridadeMapeamentoMaturidade', String(n));
  return `/relatorios/${projetoId}/mit-ia-completo?${p.toString()}`;
}

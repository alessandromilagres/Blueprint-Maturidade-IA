/**
 * Nível 1–3 no cadastro do usuário (prioridade no mapeamento de maturidade do projeto).
 * No filtro dos dashboards, o valor F inclui avaliadores com nível 1 até F (cumulativo):
 * F=1 só nível 1; F=2 níveis 1 e 2; F=3 todos.
 */
export function nivelPrioridadeMapeamentoMaturidadeDoUsuario(usuario) {
  if (!usuario) return 1;
  const raw = usuario.nivelPrioridadeMapeamentoMaturidade;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1 || n > 3) return 1;
  return n;
}

/**
 * Query: nivelPrioridadeMapeamentoMaturidade=1|2|3 (cumulativo).
 * 0 ou "todos" = sem filtro por prioridade (todos os avaliadores).
 * Ausente = 3 (comportamento anterior dos dashboards).
 */
export function filtroNivelPrioridadeFromRaw(raw) {
  if (raw === undefined || raw === null || raw === '') return 3;
  const s = String(raw).trim().toLowerCase();
  if (s === '0' || s === 'todos' || s === 'all') return null;
  const n = parseInt(s, 10);
  if (n === 0) return null;
  if (!Number.isFinite(n) || n < 1 || n > 3) return 3;
  return n;
}

export function parseFiltroNivelPrioridadeMapeamentoMaturidadeMax(req) {
  const raw =
    req.query?.nivelPrioridadeMapeamentoMaturidade ??
    req.query?.filtroNivelMapeamentoMaturidade ??
    req.body?.nivelPrioridadeMapeamentoMaturidade;
  return filtroNivelPrioridadeFromRaw(raw);
}

/** Compara filtro salvo no snapshot do relatório IA com o filtro da requisição atual. */
export function filtroNivelRelatorioIACompativel(dadosUsados, filtroAtual) {
  const salvo = dadosUsados?.filtroNivelPrioridadeMapeamentoMaturidadeAplicado;
  const a = salvo === undefined || salvo === null ? 3 : salvo;
  const b = filtroAtual === undefined || filtroAtual === null ? 3 : filtroAtual;
  return a === b;
}

/** Rótulo do filtro (dashboard / relatórios IA). */
export function labelFiltroConsolidadoAvaliadores(filtroMax) {
  if (filtroMax == null) return 'Todos os níveis de prioridade (todos os avaliadores finalizados)';
  if (filtroMax === 1) return 'Até nível 1 — somente avaliadores com prioridade cadastral 1';
  if (filtroMax === 2) return 'Até nível 2 — prioridades cadastrais 1 e 2';
  return 'Até nível 3 — prioridades cadastrais 1, 2 e 3 (padrão do dashboard)';
}

/**
 * Capa obrigatória no início de relatórios gerados por IA (executivo e books).
 */
export function capaNivelAvaliadoresRelatorioIAMarkdown({
  filtroMax,
  avaliacoesFiltradas = [],
  empresaNome = '',
  projetoNome = ''
}) {
  const filtroLabel = labelFiltroConsolidadoAvaliadores(filtroMax);
  const total = avaliacoesFiltradas.length;
  const esc = (s) =>
    String(s ?? '')
      .replace(/\|/g, '\\|')
      .replace(/\n/g, ' ');

  let md = `## Nível dos avaliadores no consolidado\n\n`;
  md += `> Os scores e a análise deste documento usam **apenas** avaliações finalizadas dos avaliadores listados abaixo, com o **mesmo filtro de prioridade** do dashboard de maturidade do projeto.\n\n`;
  md += `| | |\n|:---|:---|\n`;
  md += `| **Empresa** | ${esc(empresaNome) || '—'} |\n`;
  md += `| **Projeto** | ${esc(projetoNome) || '—'} |\n`;
  md += `| **Filtro de prioridade aplicado** | ${filtroLabel} |\n`;
  md += `| **Quantidade de avaliadores** | ${total} |\n\n`;

  if (total > 0) {
    md += `| Avaliador | E-mail | Prioridade (1–3) |\n|:---|:---|:---:|\n`;
    for (const av of avaliacoesFiltradas) {
      const u = av.usuario || {};
      const n = nivelPrioridadeMapeamentoMaturidadeDoUsuario(u);
      md += `| ${esc(u.nome) || '—'} | ${esc(u.email) || '—'} | **${n}** |\n`;
    }
    md += '\n';
  } else {
    md += `*Nenhuma avaliação finalizada entrou neste filtro de prioridade.*\n\n`;
  }

  md += `---\n\n`;
  return md;
}

const MARCADOR_CAPA_NIVEL_AVALIADORES = '## Nível dos avaliadores no consolidado';

/** Insere a capa no topo se ainda não existir (evita duplicar em regenerações parciais). */
export function prependCapaNivelAvaliadoresAoRelatorio(conteudoMd, opts) {
  if (!conteudoMd || typeof conteudoMd !== 'string') {
    return capaNivelAvaliadoresRelatorioIAMarkdown(opts);
  }
  if (conteudoMd.includes(MARCADOR_CAPA_NIVEL_AVALIADORES)) {
    return conteudoMd;
  }
  return capaNivelAvaliadoresRelatorioIAMarkdown(opts) + conteudoMd.trimStart();
}

/** Query string para propagar o filtro (relatórios IA e jobs). */

/** Lista para prompts IA (metodologia / escopo do consolidado). */
export function blocoAvaliadoresConsolidadoMarkdown(avaliacoesFiltradas, filtroMax) {
  const titulo = labelFiltroConsolidadoAvaliadores(filtroMax);
  if (!avaliacoesFiltradas?.length) {
    return `## Avaliadores no consolidado\n\n*${titulo}.*\n\n- *(nenhuma avaliação finalizada neste filtro)*\n`;
  }
  const linhas = avaliacoesFiltradas.map((av) => {
    const u = av.usuario || {};
    const n = nivelPrioridadeMapeamentoMaturidadeDoUsuario(u);
    return `- **${u.nome || 'Sem nome'}** (${u.email || '—'}) — prioridade **${n}**`;
  });
  return `## Avaliadores no consolidado\n\n*${titulo}.*\n\n${linhas.join('\n')}\n`;
}

export function queryNivelPrioridadeMapeamentoMaturidade(filtroMax) {
  if (filtroMax == null) return 'nivelPrioridadeMapeamentoMaturidade=0';
  if (filtroMax >= 1 && filtroMax <= 3) {
    return `nivelPrioridadeMapeamentoMaturidade=${encodeURIComponent(String(filtroMax))}`;
  }
  return 'nivelPrioridadeMapeamentoMaturidade=3';
}

/** filtroMax null = incluir todos (opção "Todos"). */
export function usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(usuario, filtroMax) {
  if (filtroMax == null) return true;
  return nivelPrioridadeMapeamentoMaturidadeDoUsuario(usuario) <= filtroMax;
}

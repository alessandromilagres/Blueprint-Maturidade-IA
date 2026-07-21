/**
 * Links clicáveis para fontes do Assistente.
 */

const FONTES_GLOBAIS_TO = {
  manual: { to: '/projetos', labelHint: 'Cadastros → Projetos' },
  tese: { to: '/estagio-ai-first', labelHint: 'Estágio AI-First' },
  catalogo: { to: '/estagio-ai-first', labelHint: 'Dimensões / frameworks' },
  guia: { to: '/estagio-ai-first', labelHint: 'Progressão de maturidade' },
  guia_arquivo: { to: '/estagio-ai-first', labelHint: 'Guias de progressão' }
};

function pathRelatorioPorTipo(projetoId, tipo, relatorioId) {
  const t = String(tipo || '').toLowerCase();
  const isExec = t.includes('executivo');
  const base = isExec
    ? `/relatorios/${projetoId}/mit-ia`
    : `/relatorios/${projetoId}/mit-ia-completo`;
  const qs = new URLSearchParams();
  if (relatorioId != null) qs.set('relatorioSalvoId', String(relatorioId));
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

/**
 * @param {Array} fontes
 * @param {{ projetoId?: number|null, tiposPorRelatorioId?: Map|Record }} opts
 */
export function enriquecerFontesComLinks(fontes, opts = {}) {
  const projetoId =
    opts.projetoId != null && Number(opts.projetoId) > 0 ? Number(opts.projetoId) : null;
  const tipos =
    opts.tiposPorRelatorioId instanceof Map
      ? opts.tiposPorRelatorioId
      : new Map(Object.entries(opts.tiposPorRelatorioId || {}).map(([k, v]) => [Number(k), v]));

  return (Array.isArray(fontes) ? fontes : []).map((f) => {
    const fonte = String(f?.fonte || '');
    let to = null;
    let toLabel = null;

    if (fonte === 'relatorio_ia' && f.relatorioId != null && projetoId) {
      const tipo = tipos.get(Number(f.relatorioId)) || f.tipoRelatorio || null;
      to = pathRelatorioPorTipo(projetoId, tipo, f.relatorioId);
      toLabel = 'Abrir relatório';
    } else if (fonte === 'projeto_contexto' && projetoId) {
      to = `/projetos/${projetoId}#projeto-contexto`;
      toLabel = 'Abrir contexto';
    } else if (FONTES_GLOBAIS_TO[fonte]) {
      to = FONTES_GLOBAIS_TO[fonte].to;
      toLabel = FONTES_GLOBAIS_TO[fonte].labelHint;
    } else if (projetoId && /versao|projeto/.test(String(f?.titulo || '').toLowerCase())) {
      to = `/projetos/${projetoId}`;
      toLabel = 'Abrir projeto';
    }

    return {
      ...f,
      ...(to ? { to, toLabel } : {})
    };
  });
}

export { pathRelatorioPorTipo };

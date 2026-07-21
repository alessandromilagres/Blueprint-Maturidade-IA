/**
 * Ações contextuais do Assistente (botões de atalho no chat).
 * Derivadas da pergunta + resposta + fontes + projeto selecionado.
 */

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function pushUnique(acoes, acao) {
  if (!acao?.id || !acao?.to || !acao?.label) return;
  if (acoes.some((a) => a.id === acao.id)) return;
  acoes.push({
    id: acao.id,
    label: acao.label,
    to: acao.to,
    externo: acao.externo === true
  });
}

/**
 * @param {{
 *   mensagem?: string,
 *   resposta?: string,
 *   fontes?: Array<{ fonte?: string, titulo?: string, relatorioId?: number }>,
 *   projetoId?: number|null,
 *   frameworkMaturidade?: string|null
 * }} opts
 * @returns {Array<{ id: string, label: string, to: string, externo?: boolean }>}
 */
export function montarAcoesAssistente(opts = {}) {
  const mensagem = norm(opts.mensagem);
  const resposta = norm(opts.resposta);
  const texto = `${mensagem} ${resposta}`;
  const fontes = Array.isArray(opts.fontes) ? opts.fontes : [];
  const projetoId =
    opts.projetoId != null && Number(opts.projetoId) > 0 ? Number(opts.projetoId) : null;
  const fw = norm(opts.frameworkMaturidade);
  const ehSatf = fw.includes('satf');

  const acoes = [];
  const temFonteRelatorio = fontes.some((f) => f?.fonte === 'relatorio_ia' || f?.relatorioId != null);
  const temFonteManual = fontes.some((f) => f?.fonte === 'manual' || f?.fonte === 'tese');

  if (!projetoId) {
    if (
      /projeto|glossario|certific|book|relatorio|versao|unidade|dashboard|contexto/.test(texto)
    ) {
      pushUnique(acoes, {
        id: 'escolher_projeto',
        label: 'Abrir lista de projetos',
        to: '/projetos'
      });
    }
  } else {
    pushUnique(acoes, {
      id: 'abrir_projeto',
      label: 'Abrir ficha do projeto',
      to: `/projetos/${projetoId}`
    });

    if (/glossario|fato canonico|contexto do (cliente|projeto)|anexo|entregavel|material de referencia/.test(texto)) {
      pushUnique(acoes, {
        id: 'abrir_glossario',
        label: 'Abrir contexto / glossário',
        to: `/projetos/${projetoId}#projeto-contexto`
      });
    }

    if (/certific|score oficial|pendente.*dimens|consultor/.test(texto) || ehSatf) {
      if (/certific|score oficial|pendente/.test(texto) || (ehSatf && /dimensao|d\d{1,2}/.test(texto))) {
        pushUnique(acoes, {
          id: 'abrir_certificacao',
          label: 'Abrir certificação SATF',
          to: `/projetos/${projetoId}/certificacao`
        });
      }
    }

    if (
      /book|relatorio|biblioteca|gerar (o )?book|modo rapido|executivo|diagnostico por dimensao/.test(
        texto
      ) ||
      temFonteRelatorio
    ) {
      pushUnique(acoes, {
        id: 'gerar_book',
        label: 'Gerar / abrir book',
        to: `/relatorios/${projetoId}/mit-ia-completo`
      });
      pushUnique(acoes, {
        id: 'gerar_executivo',
        label: 'Relatório executivo',
        to: `/relatorios/${projetoId}/mit-ia`
      });
      pushUnique(acoes, {
        id: 'biblioteca_ia',
        label: 'Biblioteca de Relatórios IA',
        to: '/biblioteca-ia'
      });
    }

    if (/versao|fechar vers|reabrir vers|checklist de fechamento|evolucao do projeto/.test(texto)) {
      pushUnique(acoes, {
        id: 'versoes_projeto',
        label: 'Ver versões do projeto',
        to: `/projetos/${projetoId}`
      });
      pushUnique(acoes, {
        id: 'evolucao_projeto',
        label: 'Evolução / comparativo',
        to: `/dashboard/projeto/${projetoId}/evolucao`
      });
    }

    if (/dashboard|score geral|maturidade|ranking|prontidao/.test(texto)) {
      pushUnique(acoes, {
        id: 'dashboard_projeto',
        label: 'Dashboard do projeto',
        to: `/dashboard/projeto/${projetoId}`
      });
    }

    if (/roadmap|iniciativa|executive dashboard|command center/.test(texto)) {
      pushUnique(acoes, {
        id: 'roadmap',
        label: 'Roadmap de iniciativas',
        to: `/dashboard/projeto/${projetoId}/roadmap`
      });
    }

    if (/desejo|desejos de ia/.test(texto)) {
      pushUnique(acoes, {
        id: 'desejos_ia',
        label: 'Desejos de IA',
        to: `/projetos/${projetoId}/desejos-ia`
      });
    }
  }

  if (/configuracoes? de ia|provedor|anthropic|openai|groq|api key|chave de api/.test(texto)) {
    pushUnique(acoes, {
      id: 'config_ia',
      label: 'Configurações de IA',
      to: '/configuracoes/ia'
    });
  }

  if (/biblioteca/.test(texto) && !acoes.some((a) => a.id === 'biblioteca_ia')) {
    pushUnique(acoes, {
      id: 'biblioteca_ia',
      label: 'Biblioteca de Relatórios IA',
      to: '/biblioteca-ia'
    });
  }

  // Se só falou de “como usar” genérico e veio manual, oferecer projetos como âncora
  if (temFonteManual && acoes.length === 0 && /como (fa[cç]o|usar|fazer)|onde (fico|esta|abro)/.test(texto)) {
    pushUnique(acoes, {
      id: 'ver_projetos',
      label: 'Ir para Projetos',
      to: '/projetos'
    });
  }

  return acoes.slice(0, 6);
}

/** Normaliza payload persistido em fontesJson (array legado ou { fontes, acoes }). */
export function parseMetaMensagemAssistente(raw) {
  if (raw == null) return { fontes: null, acoes: null };
  let data = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      return { fontes: null, acoes: null };
    }
  }
  if (Array.isArray(data)) return { fontes: data, acoes: null };
  if (data && typeof data === 'object') {
    return {
      fontes: Array.isArray(data.fontes) ? data.fontes : null,
      acoes: Array.isArray(data.acoes) ? data.acoes : null
    };
  }
  return { fontes: null, acoes: null };
}

export function serializarMetaMensagemAssistente({ fontes = null, acoes = null } = {}) {
  return JSON.stringify({
    fontes: Array.isArray(fontes) ? fontes : [],
    acoes: Array.isArray(acoes) ? acoes : []
  });
}

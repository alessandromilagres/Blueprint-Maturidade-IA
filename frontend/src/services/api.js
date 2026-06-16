import { resolveMimeTypeForProdutoUpload } from '../utils/mimeUpload.js';

const API_URL = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    let msg = error.error || 'Erro na requisição';
    if (Array.isArray(error.detalhes) && error.detalhes.length > 0) {
      const extra = error.detalhes
        .map((d) => (d.campo ? `${d.campo}: ${d.mensagem || d.message}` : d.mensagem || d.message))
        .filter(Boolean)
        .join('; ');
      if (extra) msg = `${msg} — ${extra}`;
    } else if (error.details && typeof error.details === 'string') {
      msg = `${msg} — ${error.details}`;
    }
    throw new Error(msg);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const empresasApi = {
  listar: () => request('/empresas'),
  buscar: (id) => request(`/empresas/${id}`),
  criar: (data) => request('/empresas', { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id, data) => request(`/empresas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  excluir: (id) => request(`/empresas/${id}`, { method: 'DELETE' }),
};

export const usuariosApi = {
  listar: (empresaId) => request(`/usuarios${empresaId ? `?empresaId=${empresaId}` : ''}`),
  buscar: (id) => request(`/usuarios/${id}`),
  criar: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id, data) => request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  excluir: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),
};

export const projetosApi = {
  listar: (empresaId) => request(`/projetos${empresaId ? `?empresaId=${empresaId}` : ''}`),
  buscar: (id) => request(`/projetos/${id}`),
  criar: (data) => request('/projetos', { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id, data) => request(`/projetos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  excluir: (id) => request(`/projetos/${id}`, { method: 'DELETE' }),
  desejosIaDashboard: (projetoId) => request(`/projetos/${projetoId}/desejos-ia`),
  versoes: (projetoId) => request(`/projetos/${projetoId}/versoes`),
  criarVersao: (projetoId, data = {}) =>
    request(`/projetos/${projetoId}/versoes`, { method: 'POST', body: JSON.stringify(data) }),
  fecharVersao: (projetoId, versaoId) =>
    request(`/projetos/${projetoId}/versoes/${versaoId}/fechar`, { method: 'POST' }),
  reabrirVersao: (projetoId, versaoId, data = {}) =>
    request(`/projetos/${projetoId}/versoes/${versaoId}/reabrir`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  reenviarConvitesVersao: (projetoId, data = {}) =>
    request(`/projetos/${projetoId}/versoes/reenviar-convites`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  avaliadoresStatus: (projetoId, opts = {}) => {
    const n = opts?.nivelPrioridadeMapeamentoMaturidade;
    if (n === 0 || n === '0') {
      return request(
        `/projetos/${projetoId}/avaliadores-status?nivelPrioridadeMapeamentoMaturidade=0`
      );
    }
    const q =
      n >= 1 && n <= 3 ? `?nivelPrioridadeMapeamentoMaturidade=${encodeURIComponent(String(n))}` : '';
    return request(`/projetos/${projetoId}/avaliadores-status${q}`);
  },
  avaliadoresDimensoes: (projetoId, opts = {}) => {
    const n = opts?.nivelPrioridadeMapeamentoMaturidade;
    if (n === 0 || n === '0') {
      return request(
        `/projetos/${projetoId}/avaliadores-dimensoes?nivelPrioridadeMapeamentoMaturidade=0`
      );
    }
    const q =
      n >= 1 && n <= 3 ? `?nivelPrioridadeMapeamentoMaturidade=${encodeURIComponent(String(n))}` : '';
    return request(`/projetos/${projetoId}/avaliadores-dimensoes${q}`);
  },
  enviarLembreteAvaliador: (projetoId, usuarioId) =>
    request(`/projetos/${projetoId}/avaliadores/lembrete`, {
      method: 'POST',
      body: JSON.stringify({ usuarioId }),
    }),
  enviarLembreteAvaliadoresLote: (projetoId, opts = {}) => {
    const n = opts.nivelPrioridadeMapeamentoMaturidade;
    const body = {};
    if (n === 0 || n === '0') body.nivelPrioridadeMapeamentoMaturidade = 0;
    else if (n >= 1 && n <= 3) body.nivelPrioridadeMapeamentoMaturidade = n;
    return request(`/projetos/${projetoId}/avaliadores/lembrete-lote`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  lembretesLog: (projetoId, limit = 50) =>
    request(`/projetos/${projetoId}/avaliadores/lembretes-log?limit=${limit}`),
};

export const areasApi = {
  listar: () => request('/areas'),
};

export const avaliacoesApi = {
  listar: (projetoId, empresaId) => {
    const params = new URLSearchParams();
    if (projetoId) params.append('projetoId', projetoId);
    if (empresaId) params.append('empresaId', empresaId);
    const query = params.toString();
    return request(`/avaliacoes${query ? `?${query}` : ''}`);
  },
  buscar: (id) => request(`/avaliacoes/${id}`),
  criar: (data) => request('/avaliacoes', { method: 'POST', body: JSON.stringify(data) }),
  salvarRespostas: (id, respostas, areasRecusadas, ...desejosIaOpcional) => {
    const body = { respostas, areasRecusadas: areasRecusadas ?? [] };
    // Só envia `desejosIA` quando o 4º argumento existe (arrow functions não têm `arguments` — Safari quebrava ao finalizar).
    const desejosIA = desejosIaOpcional[0];
    if (desejosIaOpcional.length > 0 && desejosIA !== undefined) {
      body.desejosIA = desejosIA;
    }
    return request(`/avaliacoes/${id}/respostas`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  finalizar: (id, opts = {}) =>
    request(`/avaliacoes/${id}/finalizar`, {
      method: 'PUT',
      body: JSON.stringify({
        ...(opts.incluirDesejosIaNoEmail === false ? { incluirDesejosIaNoEmail: false } : {})
      })
    }),
  excluir: (id) => request(`/avaliacoes/${id}`, { method: 'DELETE' }),
};

export const relatoriosApi = {
  buscar: (avaliacaoId) => request(`/relatorios/avaliacao/${avaliacaoId}`),
};

/** Query de prioridade (1–3 cumulativo; 0 = todos) — alinhado ao dashboard de maturidade. */
function appendNivelPrioridadeMapeamentoParams(params, opts = {}) {
  const n = opts.nivelPrioridadeMapeamentoMaturidade;
  if (n === 0 || n === '0') {
    params.set('nivelPrioridadeMapeamentoMaturidade', '0');
  } else if (n >= 1 && n <= 3) {
    params.set('nivelPrioridadeMapeamentoMaturidade', String(n));
  } else {
    params.set('nivelPrioridadeMapeamentoMaturidade', '3');
  }
  if (opts.projetoVersaoId) params.set('projetoVersaoId', String(opts.projetoVersaoId));
  else if (opts.versaoId) params.set('projetoVersaoId', String(opts.versaoId));
}

export const dashboardApi = {
  projeto: (projetoId, opts = {}) => {
    const params = new URLSearchParams();
    const n = opts.nivelPrioridadeMapeamentoMaturidade;
    if (n >= 1 && n <= 3) params.set('nivelPrioridadeMapeamentoMaturidade', String(n));
    if (opts.projetoVersaoId) params.set('projetoVersaoId', String(opts.projetoVersaoId));
    else if (opts.versaoId) params.set('projetoVersaoId', String(opts.versaoId));
    const q = params.toString();
    return request(`/dashboard/projeto/${projetoId}${q ? `?${q}` : ''}`);
  },
  empresa: (empresaId, opts = {}) => {
    const n = opts.nivelPrioridadeMapeamentoMaturidade;
    const q =
      n >= 1 && n <= 3
        ? `?nivelPrioridadeMapeamentoMaturidade=${encodeURIComponent(String(n))}`
        : '';
    return request(`/dashboard/empresa/${empresaId}${q}`);
  },
  produto: (produtoId) => request(`/dashboard/produto/${produtoId}`),
  produtosProjeto: (projetoId) => request(`/dashboard/produtos-projeto/${projetoId}`),
  projetosRanking: (empresaId) => request(`/dashboard/projetos-ranking${empresaId ? `?empresaId=${empresaId}` : ''}`),
  projetoProdutos: (projetoId) => request(`/dashboard/projeto-produtos/${projetoId}`),
  projetoFinanceiro: (projetoId) => request(`/dashboard/projeto-financeiro/${projetoId}`),
  empresaFinanceiro: (empresaId) => request(`/dashboard/empresa-financeiro/${empresaId}`),
  relatorioIA: (projetoId, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.regenerate) params.set('reuse', 'false');
    appendNivelPrioridadeMapeamentoParams(params, opts);
    const qs = params.toString();
    return request(`/dashboard/projeto/${projetoId}/relatorio-ia?${qs}`, { method: 'POST' });
  },
  relatorioIACompleto: (projetoId, opts = {}) => {
    const params = new URLSearchParams();
    if (opts.regenerate) params.set('reuse', 'false');
    if (opts.modoRapido) params.set('mode', 'rapido');
    appendNivelPrioridadeMapeamentoParams(params, opts);
    const qs = params.toString();
    return request(
      `/dashboard/projeto/${projetoId}/relatorio-ia-completo?${qs}`,
      { method: 'POST' }
    );
  },
  iniciarRelatorioIABackground: (projetoId, tipo, opts = {}) => {
    const body = { projetoId, tipo };
    if (opts.versaoId) body.versaoId = opts.versaoId;
    const n = opts.nivelPrioridadeMapeamentoMaturidade;
    if (n === 0 || n === '0') body.nivelPrioridadeMapeamentoMaturidade = 0;
    else if (n >= 1 && n <= 3) body.nivelPrioridadeMapeamentoMaturidade = n;
    else body.nivelPrioridadeMapeamentoMaturidade = 3;
    return request('/relatorios-ia-jobs/start', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  statusRelatorioIABackground: (jobId) => request(`/relatorios-ia-jobs/${jobId}`),
  cancelarRelatorioIABackground: (jobId) =>
    request(`/relatorios-ia-jobs/${jobId}/cancel`, { method: 'POST' }),
  /** Lista jobs (ex.: acompanhar geração em background do book) */
  listarRelatoriosIaJobs: (params = {}) => {
    const p = new URLSearchParams();
    if (params.projetoId != null) p.set('projetoId', String(params.projetoId));
    if (params.tipo) p.set('tipo', params.tipo);
    if (params.status) p.set('status', params.status);
    if (params.limit) p.set('limit', String(params.limit));
    return request(`/relatorios-ia-jobs?${p.toString()}`);
  },
};

export const relatoriosIAApi = {
  listar: (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.projetoId) params.set('projetoId', filtros.projetoId);
    if (filtros.empresaId) params.set('empresaId', filtros.empresaId);
    if (filtros.tipo) params.set('tipo', filtros.tipo);
    if (filtros.limit) params.set('limit', filtros.limit);
    const qs = params.toString();
    return request(`/relatorios-ia${qs ? `?${qs}` : ''}`);
  },
  buscar: (id) => request(`/relatorios-ia/${id}`),
  versoes: (projetoId, tipo) => request(`/relatorios-ia/versoes/${projetoId}/${tipo}`),
  ultimaVersao: (projetoId, tipo, opts = {}) => {
    const params = new URLSearchParams();
    appendNivelPrioridadeMapeamentoParams(params, opts);
    return request(`/relatorios-ia/latest/${projetoId}/${tipo}?${params.toString()}`);
  },
  excluir: (id) => request(`/relatorios-ia/${id}`, { method: 'DELETE' }),
  estatisticas: () => request('/relatorios-ia/stats/resumo'),
};

export const timelineApi = {
  projeto: (projetoId) => request(`/timeline/projeto/${projetoId}`),
};

// ==========================================
// MÓDULO DE PRODUTO IA-FIRST
// ==========================================

export const perguntasObrigatoriasApi = {
  listar: () => request('/perguntas-obrigatorias-produto'),
};

export const verticaisApi = {
  listar: () => request('/verticais-produto'),
  buscar: (id) => request(`/verticais-produto/${id}`),
};

export const arquiteturasReferenciaApi = {
  listar: (empresaId) => request(`/arquiteturas-referencia?empresaId=${empresaId}`),
  buscar: (id) => request(`/arquiteturas-referencia/${id}`),
  criar: (data) => request('/arquiteturas-referencia', { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id, data) => request(`/arquiteturas-referencia/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  excluir: (id) => request(`/arquiteturas-referencia/${id}`, { method: 'DELETE' }),
  excluirAnexo: (arquivoId) =>
    request(`/arquiteturas-referencia/anexos/${arquivoId}`, { method: 'DELETE' }),
  uploadAnexo: (arquiteturaId, body) =>
    request(`/arquiteturas-referencia/${arquiteturaId}/arquivos/upload-multipart`, {
      method: 'POST',
      body: JSON.stringify(body)
    })
};

export const produtosApi = {
  listar: (projetoId, empresaId) => {
    const params = new URLSearchParams();
    if (projetoId) params.append('projetoId', projetoId);
    if (empresaId) params.append('empresaId', empresaId);
    const query = params.toString();
    return request(`/produtos${query ? `?${query}` : ''}`);
  },
  buscar: (id) => request(`/produtos/${id}`),
  criar: (data) => request('/produtos', { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id, data) => request(`/produtos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  excluir: (id) => request(`/produtos/${id}`, { method: 'DELETE' }),
  /** Preenche informacoesAdicionaisEspecificacao (e opcionalmente campos do produto) a partir da idealização salva. */
  gerarApoioEspecificacaoIA: (id, body = {}) =>
    request(`/produtos/${id}/apoio-especificacao-ia`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  avaliadoresStatus: (produtoId) => request(`/produtos/${produtoId}/avaliadores-status`),
  enviarLembreteAvaliador: (produtoId, usuarioId) =>
    request(`/produtos/${produtoId}/avaliadores/lembrete`, {
      method: 'POST',
      body: JSON.stringify({ usuarioId }),
    }),
  enviarLembreteAvaliadoresLote: (produtoId) =>
    request(`/produtos/${produtoId}/avaliadores/lembrete-lote`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  lembretesLog: (produtoId, limit = 50) =>
    request(`/produtos/${produtoId}/avaliadores/lembretes-log?limit=${limit}`),
};

export const avaliacoesProdutoApi = {
  listar: (produtoId, projetoId) => {
    const params = new URLSearchParams();
    if (produtoId) params.append('produtoId', produtoId);
    if (projetoId) params.append('projetoId', projetoId);
    const query = params.toString();
    return request(`/avaliacoes-produto${query ? `?${query}` : ''}`);
  },
  buscar: (id) => request(`/avaliacoes-produto/${id}`),
  criar: (data) => request('/avaliacoes-produto', { method: 'POST', body: JSON.stringify(data) }),
  salvarRespostas: (id, respostas) => request(`/avaliacoes-produto/${id}/respostas`, {
    method: 'PUT',
    body: JSON.stringify(respostas),
  }),
  finalizar: (id) => request(`/avaliacoes-produto/${id}/finalizar`, { method: 'PUT' }),
  excluir: (id) => request(`/avaliacoes-produto/${id}`, { method: 'DELETE' }),
};

// ==========================================
// CONVITES DE AVALIAÇÃO
// ==========================================

export const convitesApi = {
  listar: (avaliadorId) => request(`/convites${avaliadorId ? `?avaliadorId=${avaliadorId}` : ''}`),
  enviar: (data) => request('/convites/enviar', { method: 'POST', body: JSON.stringify(data) }),
  validar: async (token) => {
    const response = await fetch(`${API_URL}/convite-avaliacao/validar/${token}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },
  aceitar: async (token) => {
    const response = await fetch(`${API_URL}/convite-avaliacao/aceitar/${token}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });
    return response.json();
  },
  acessarSemSenha: async (token) => {
    const response = await fetch(`${API_URL}/convite-avaliacao/acesso/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },
  statusSMTP: () => request('/smtp/status'),
};

// ==========================================
// ESPECIFICAÇÕES DE PRODUTO (IA)
// ==========================================

export const especificacoesApi = {
  listarPorProduto: (produtoId) => request(`/especificacoes/produto/${produtoId}`),
  buscar: (id) => request(`/especificacoes/${id}`),
  gerar: (produtoId) => request(`/especificacoes/gerar/${produtoId}`, { method: 'POST' }),
  gerarDocumento: (produtoId, tipo, especificacaoId) => request(`/especificacoes/gerar-documento/${produtoId}`, { 
    method: 'POST', 
    body: JSON.stringify({ tipo, especificacaoId }) 
  }),
  atualizarDocumento: (id, conteudo) => request(`/especificacoes/documento/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify({ conteudo }) 
  }),
  aprovar: (id, observacoes) => request(`/especificacoes/${id}/aprovar`, { 
    method: 'PUT',
    body: JSON.stringify({ observacoes })
  }),
  status: (id) => request(`/especificacoes/${id}/status`),
  excluir: (id) => request(`/especificacoes/${id}`, { method: 'DELETE' }),
};

// ==========================================
// PROVEDORES DE IA (Multi-provider)
// ==========================================

export const aiProvidersApi = {
  listar: () => request('/especificacoes/ai/providers'),
  alterarProvedor: (provider) => request('/especificacoes/ai/provider', { 
    method: 'POST', 
    body: JSON.stringify({ provider }) 
  }),
  salvarApiKey: (provider, apiKey) => request('/especificacoes/ai/apikey', { 
    method: 'POST', 
    body: JSON.stringify({ provider, apiKey }) 
  }),
  testar: (provider) => request('/especificacoes/ai/test', {
    method: 'POST',
    body: JSON.stringify(provider ? { provider } : {})
  }),
};

// ==========================================
// ARQUIVOS DE REFERÊNCIA
// ==========================================

export const arquivosApi = {
  listarPorProduto: (produtoId) => request(`/arquivos/produto/${produtoId}`),
  buscar: (id) => request(`/arquivos/${id}`),
  categorias: () => request('/arquivos/meta/categorias'),
  upload: async (produtoId, file, categoria = 'geral', descricao = '') => {
    const token = localStorage.getItem('token');
    const mimeType = resolveMimeTypeForProdutoUpload(file);
    if (!mimeType) {
      throw new Error(
        'Não foi possível identificar o tipo do arquivo. Verifique a extensão (.pdf, .docx, .md, …).'
      );
    }

    const response = await fetch(`${API_URL}/arquivos/upload-multipart/${produtoId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        arquivo: file.base64,
        nomeOriginal: file.name,
        mimeType,
        categoria,
        descricao
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro no upload' }));
      throw new Error(error.error || 'Erro no upload');
    }
    
    return response.json();
  },
  atualizar: (id, data) => request(`/arquivos/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  excluir: (id, hard = false) => request(`/arquivos/${id}${hard ? '?hard=true' : ''}`, { 
    method: 'DELETE' 
  }),
  urlDownload: (id) => `${API_URL}/arquivos/${id}/download`,
  urlVisualizar: (id) => `${API_URL}/arquivos/${id}/visualizar`,
};

// ==========================================
// EXPORTAÇÃO DE DOCUMENTOS (MARKDOWN)
// ==========================================

export const exportarApi = {
  relatorio: (avaliacaoId) => `${API_URL}/exportar/relatorio/${avaliacaoId}`,
  projeto: (projetoId) => `${API_URL}/exportar/projeto/${projetoId}`,
  projetoCompleto: (projetoId) => `${API_URL}/exportar/projeto-completo/${projetoId}`,
  projetoCadastro: (projetoId) => `${API_URL}/exportar/projeto/${projetoId}/cadastro`,
  projetoCadastroDocx: (projetoId) => `${API_URL}/exportar/projeto/${projetoId}/cadastro-docx`,
  projetoDocx: (projetoId) => `${API_URL}/exportar/projeto/${projetoId}/docx`,
  projetoZipMd: (projetoId) => `${API_URL}/exportar/projeto/${projetoId}/zip-md`,
  projetoZipMdCompleto: (projetoId) => `${API_URL}/exportar/projeto/${projetoId}/zip-md-completo`,
  projetoZipRelatorioMaturidade: (projetoId) => `${API_URL}/exportar/projeto/${projetoId}/zip-relatorio-maturidade`,
  projetoZipDocx: (projetoId) => `${API_URL}/exportar/projeto/${projetoId}/zip-docx`,
  avaliacaoDesejosIaDocx: (avaliacaoId) => `${API_URL}/exportar/avaliacao/${avaliacaoId}/desejos-ia-docx`,
  projetoDesejosIaDocx: (projetoId) => `${API_URL}/exportar/projeto/${projetoId}/desejos-ia-docx`,
  especificacao: (especificacaoId) => `${API_URL}/exportar/especificacao/${especificacaoId}`,
  produto: (produtoId) => `${API_URL}/exportar/produto/${produtoId}`,
  dashboard: (projetoId) => `${API_URL}/exportar/dashboard/${projetoId}`,
  pacoteVersao: (projetoId, versaoId) => `${API_URL}/exportar/versao/${projetoId}/${versaoId}/zip`,
  
  // Função auxiliar para download
  download: async (url, filename) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    
    if (!response.ok) {
      throw new Error('Erro ao exportar documento');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  }
};

export const observabilidadeApi = {
  sessoes: (activeMinutes = 5) =>
    request(`/observability/sessions?activeMinutes=${activeMinutes}`),
};

/** Template HTML e assunto do e-mail de convite à avaliação (apenas admin). */
export const adminEmailConviteApi = {
  obter: () => request('/admin/email-convite-avaliacao'),
  salvar: (templateHtml, assunto) =>
    request('/admin/email-convite-avaliacao', {
      method: 'PUT',
      body: JSON.stringify({ templateHtml, assunto })
    }),
  preview: (body) =>
    request('/admin/email-convite-avaliacao/preview', {
      method: 'POST',
      body: JSON.stringify(body)
    })
};

// ==========================================
// API GENÉRICA (para uso com import default)
// ==========================================

const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;

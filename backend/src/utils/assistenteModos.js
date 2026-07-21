/**
 * Modos de pergunta do Assistente (chips) — filtram o retrieval.
 */

export const MODOS_ASSISTENTE = [
  { id: 'auto', label: 'Automático', descricao: 'Mistura sistema, tese e projeto' },
  { id: 'sistema', label: 'Como usar', descricao: 'Telas e fluxos do produto' },
  { id: 'metodologia', label: 'Metodologia', descricao: 'Tese, Blueprint e SATF' },
  { id: 'projeto', label: 'Este projeto', descricao: 'Glossário, contexto e scores' },
  { id: 'book', label: 'Deste book', descricao: 'Relatórios IA da biblioteca' }
];

export const MODOS_VALIDOS = new Set(MODOS_ASSISTENTE.map((m) => m.id));

export function normalizarModoAssistente(modo) {
  const m = String(modo || 'auto').trim().toLowerCase();
  return MODOS_VALIDOS.has(m) ? m : 'auto';
}

export function instrucaoModoNoPrompt(modo) {
  const m = normalizarModoAssistente(modo);
  switch (m) {
    case 'sistema':
      return 'MODO ATIVO: **Como usar o sistema** — priorize telas, menus e passos operacionais do Agentica.';
    case 'metodologia':
      return 'MODO ATIVO: **Metodologia** — priorize tese Blueprint/SATF, dimensões e calibração; não invente fatos do cliente.';
    case 'projeto':
      return 'MODO ATIVO: **Este projeto** — priorize glossário, contexto e dados do projeto selecionado.';
    case 'book':
      return 'MODO ATIVO: **Deste book** — priorize trechos dos relatórios IA já gerados; cite o título do book.';
    default:
      return 'MODO ATIVO: **Automático** — escolha a melhor base (sistema, metodologia ou projeto) conforme a pergunta.';
  }
}

/** Filtra candidatos RAG conforme o modo. */
export function filtrarCandidatosPorModo(candidatos, modo) {
  const m = normalizarModoAssistente(modo);
  const lista = Array.isArray(candidatos) ? candidatos : [];
  if (m === 'auto') return lista;

  const keep = (c) => {
    const f = String(c?.fonte || '');
    if (m === 'sistema') {
      return f === 'manual' || f === 'catalogo';
    }
    if (m === 'metodologia') {
      return f === 'tese' || f === 'catalogo' || f === 'guia' || f === 'guia_arquivo';
    }
    if (m === 'projeto') {
      return f === 'projeto_contexto' || f === 'relatorio_ia';
    }
    if (m === 'book') {
      return f === 'relatorio_ia';
    }
    return true;
  };

  const filtrados = lista.filter(keep);
  // Se filtro zerar (ex.: book sem projeto), devolve candidatos originais com aviso via fallback leve
  return filtrados.length ? filtrados : lista.slice(0, Math.min(6, lista.length));
}

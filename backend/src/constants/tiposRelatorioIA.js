/** Tipos persistidos na biblioteca IA e enfileirados em relatorios-ia-jobs. */
export const TIPOS_RELATORIO_IA_VALIDOS = [
  'executivo',
  'executivo_unidade',
  'completo',
  'completo_rapido',
  'completo_satf',
  'completo_satf_rapido',
  'book_unidade',
  'book_unidade_rapido',
  'book_unidade_satf',
  'book_unidade_satf_rapido'
];

export const TIPOS_RELATORIO_IA_UNIDADE = [
  'executivo_unidade',
  'book_unidade',
  'book_unidade_rapido',
  'book_unidade_satf',
  'book_unidade_satf_rapido'
];

export const TIPOS_RELATORIO_IA_BOOK = [
  'completo',
  'completo_rapido',
  'completo_satf',
  'completo_satf_rapido',
  'book_unidade',
  'book_unidade_rapido',
  'book_unidade_satf',
  'book_unidade_satf_rapido'
];

export const MENSAGEM_TIPOS_RELATORIO_IA_INVALIDO =
  `tipo inválido. Use: ${TIPOS_RELATORIO_IA_VALIDOS.join(', ')}`;

export function isTipoRelatorioIAValido(tipo) {
  return TIPOS_RELATORIO_IA_VALIDOS.includes(tipo);
}

export function isTipoRelatorioIAUnidade(tipo) {
  return TIPOS_RELATORIO_IA_UNIDADE.includes(tipo);
}

export function isTipoRelatorioIABook(tipo) {
  return TIPOS_RELATORIO_IA_BOOK.includes(tipo);
}

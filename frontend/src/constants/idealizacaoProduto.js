/** Estado inicial da Fase A — idealização (design sprint), espelha chaves validadas no backend */
export const DEFAULT_IDEALIZACAO_PRODUTO = {
  statusIdealizacao: 'em_andamento',
  problemaContexto: '',
  metricaSucesso: '',
  restricoesPremissas: '',
  mapaJornada: '',
  comoPoderiamos: '',
  ideiasPriorizadas: '',
  solucaoEscolhida: '',
  prototipoLinks: '',
  hipoteseExperimento: '',
  planoValidacao: '',
  decisoesRegistradas: '',
  observacoesGerais: ''
};

export function normalizarIdealizacaoProduto(raw) {
  const d = { ...DEFAULT_IDEALIZACAO_PRODUTO };
  if (raw && typeof raw === 'object') {
    for (const k of Object.keys(DEFAULT_IDEALIZACAO_PRODUTO)) {
      if (k === 'statusIdealizacao') continue;
      if (raw[k] != null && raw[k] !== '') d[k] = String(raw[k]);
    }
    if (raw.statusIdealizacao === 'concluida' || raw.statusIdealizacao === 'em_andamento') {
      d.statusIdealizacao = raw.statusIdealizacao;
    }
  }
  return d;
}

/** Faixas de funcionários (referência — classificação de porte no Brasil / ME). */
export const FAIXAS_FUNCIONARIOS_PORTE = {
  Micro: 'até 19 funcionários',
  Pequena: 'de 20 a 99 funcionários',
  Média: 'de 100 a 499 funcionários',
  Grande: '500 ou mais funcionários'
};

export function labelPorteComFaixa(porte) {
  if (!porte) return '';
  const faixa = FAIXAS_FUNCIONARIOS_PORTE[porte];
  return faixa ? `${porte} (${faixa})` : porte;
}

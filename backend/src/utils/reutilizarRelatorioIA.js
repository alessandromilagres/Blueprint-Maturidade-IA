/**
 * Política de cache da biblioteca IA:
 * - padrão: sempre gerar nova versão com dados atuais do projeto
 * - reuse=true explícito: permite retornar versão salva (somente leitura intencional)
 */
export function deveReutilizarRelatorioIASalvo(req) {
  return req.query.reuse === 'true';
}

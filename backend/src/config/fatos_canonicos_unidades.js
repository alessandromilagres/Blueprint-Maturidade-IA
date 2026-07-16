/**
 * Fatos canônicos por unidade organizacional (produto).
 * Multi-tenant: nomes de cliente ficam APENAS neste arquivo (unidades específicas),
 * nunca nos defaults genéricos de modelo operacional (bibliotecaTraducaoDimensoes).
 *
 * Chave canônica + aliases (codigo/nome normalizados).
 */
export const FATOS_CANONICOS_UNIDADES = Object.freeze({
  GRS: {
    aliases: [
      'GRS',
      'GERENTE_SUSTENTACAO',
      'GERENTE SUSTENTACAO',
      'GERENCIA_DE_SUSTENTACAO',
      'GERENCIA SUSTENTACAO',
      'SUSTENTACAO_GRS',
      'UNIDADE_GRS'
    ],
    /**
     * Mapeamento cliente → ferramenta/escopo (ground truth GRS).
     * Em conflito com descrição desatualizada da unidade, estes fatos vencem.
     */
    glossario: [
      'Natura → ServiceNow / Capta/GPP/Apps',
      'Claro → Jira; Sustentação B2C, Mesa RPA, Camunda',
      'Ipiranga → Conecta + KMV (SRE) — NÃO Mulesoft',
      'Drogaria Araújo → Mulesoft',
      'Pedra Agroindustrial → Salesforce (~40h baseline)',
      'Tagout → Salesforce (~40h baseline)',
      'G5 (lacuna: clientes com descrição idêntica de serviço) → Pedra Agroindustrial + Tagout — NÃO Drogaria Araújo + Tagout'
    ],
    termosProibidos: [
      'Ipiranga: Mulesoft',
      'Ipiranga Mulesoft',
      'Ipiranga → Mulesoft',
      'Ipiranga - Mulesoft',
      'Mulesoft da Ipiranga',
      'Ipiranga usa Mulesoft',
      'Drogaria Araújo e Tagout',
      'Araújo e Tagout',
      'Araújo + Tagout',
      'Drogaria Araújo + Tagout',
      'G5: Drogaria Araújo',
      'G5 Drogaria Araújo'
    ],
    notaPrompt:
      'Se a descrição cadastrada da unidade contradizer este glossário (ex.: Ipiranga=Mulesoft ou G5=Araújo+Tagout), ignore a descrição e use exclusivamente estes fatos.'
  }
});

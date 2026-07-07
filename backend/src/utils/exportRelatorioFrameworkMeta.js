/**
 * Metadados de exportação Markdown/Word por framework de maturidade.
 */
import { FRAMEWORK_SATF_TI_V3 } from '../constants/frameworkMaturidadePolicy.js';

export function isSatfFrameworkExport(frameworkMaturidade) {
  return frameworkMaturidade === FRAMEWORK_SATF_TI_V3;
}

export function tituloRelatorioMaturidadeExport(frameworkMaturidade) {
  return isSatfFrameworkExport(frameworkMaturidade)
    ? '# RELATÓRIO DE MATURIDADE EM IA — TI & ENGENHARIA'
    : '# RELATÓRIO DE MATURIDADE EM INTELIGÊNCIA ARTIFICIAL';
}

export function subtituloRelatorioMaturidadeExport(frameworkMaturidade) {
  return isSatfFrameworkExport(frameworkMaturidade)
    ? '## SATF TI v3 — IA Maturidade TI · Assessment Completo'
    : '## Blueprint Agêntico — Assessment Completo';
}

export function paragrafoSumarioExecutivoExport({
  frameworkMaturidade,
  empresa,
  projeto,
  numDimensoes,
  numAvaliadores,
  scoreGeral,
  nivelGeral
}) {
  if (isSatfFrameworkExport(frameworkMaturidade)) {
    return `Este relatório apresenta os resultados do **Assessment SATF TI v3 — IA Maturidade TI** realizado na **${empresa}** para o projeto **${projeto}**, instrumento SysMap Solutions para maturidade de IA em **engenharia, plataforma e delivery**.

A avaliação analisou **${numDimensoes} dimensões SATF**, com base nas respostas de **${numAvaliadores} avaliador(es)**, resultando em score geral **oficial** de **${scoreGeral.toFixed(2)} pontos**, classificando a operação de TI no nível **"${nivelGeral}"**.`;
  }
  return `Este relatório apresenta os resultados do **Assessment de Maturidade em Inteligência Artificial** realizado na **${empresa}** para o projeto **${projeto}**, utilizando a metodologia **SysMap Blueprint IA**, alinhada com o **MIT CISR Enterprise AI Maturity Model**.

A avaliação analisou **${numDimensoes} dimensões** críticas de maturidade em IA, com base nas respostas de **${numAvaliadores} avaliador(es)**, resultando em um score geral de **${scoreGeral.toFixed(2)} pontos**, classificando a organização no nível **"${nivelGeral}"**.`;
}

export function tabelaResultadoPrincipalExport({
  frameworkMaturidade,
  scoreGeral,
  nivelGeral,
  levelInfo
}) {
  if (isSatfFrameworkExport(frameworkMaturidade)) {
    return `| Métrica | Valor |
|---------|:-----:|
| **Score Geral (oficial SATF)** | **${scoreGeral.toFixed(2)} / 5.00** |
| **Nível de Maturidade TI** | **${nivelGeral}** |
| **Instrumento** | **SATF TI v3 — IA Maturidade TI** |
| **Foco Principal** | ${levelInfo?.focus || 'Engenharia, plataforma e SDLC agêntico'} |
| **Escala operacional** | N1–N5 (SysMap) |`;
  }
  return `| Métrica | Valor |
|---------|:-----:|
| **Score Geral** | **${scoreGeral.toFixed(2)} / 5.00** |
| **Nível de Maturidade** | **${nivelGeral}** |
| **Classificação MIT CISR** | **${levelInfo?.name || '—'}** |
| **Referência MIT** | ${levelInfo?.nameEn || '—'} |
| **Foco Principal** | ${levelInfo?.focus || '—'} |
| **% de Empresas neste Nível** | ${levelInfo?.percentage || '—'} |`;
}

export function rodapeMetodologiaExportDoc(frameworkMaturidade) {
  return isSatfFrameworkExport(frameworkMaturidade)
    ? 'Documento gerado com tecnologia de Inteligência Artificial · Instrumento SATF TI v3 (SysMap Solutions)'
    : 'Documento gerado com tecnologia de Inteligência Artificial · Metodologia SysMap Blueprint IA (referência MIT CISR Enterprise AI Maturity Model)';
}

/** Tipos de book IA na biblioteca por framework. */
export function tiposBookIaExportPorFramework(frameworkMaturidade) {
  if (isSatfFrameworkExport(frameworkMaturidade)) {
    return ['completo_satf', 'completo_satf_rapido'];
  }
  return ['completo', 'completo_rapido'];
}

export function nomeArquivoBookIaExport(tipo) {
  const map = {
    completo: '08-relatorio-ia-completo.md',
    completo_rapido: '08-relatorio-ia-completo-rapido.md',
    completo_satf: '08-relatorio-ia-book-satf.md',
    completo_satf_rapido: '08-relatorio-ia-book-satf-rapido.md',
    executivo: '07-relatorio-ia-executivo.md'
  };
  return map[tipo] || `08-relatorio-ia-${tipo}.md`;
}

export function montarCabecalhoRelatorioMaturidadeMarkdown({
  frameworkMaturidade,
  empresaNome,
  projetoNome,
  versaoLabel,
  dataGeracao,
  sumarioMarkdown
}) {
  return `${tituloRelatorioMaturidadeExport(frameworkMaturidade)}

${subtituloRelatorioMaturidadeExport(frameworkMaturidade)}

---

<div align="center">

**${empresaNome}**

${projetoNome}

Versão da pesquisa: ${versaoLabel}

*${dataGeracao}*

</div>

---

${sumarioMarkdown}

---

# 1. SUMÁRIO EXECUTIVO

`;
}

export function blocoDescobertasSumarioExport(areasFortes, areasParaMelhorar) {
  return `## Principais Descobertas

### Pontos Fortes (Score ≥ 3.5)
${areasFortes.length > 0 ? areasFortes.map((a) => `- **${a.area}**: ${a.score.toFixed(2)} (${a.nivel})`).join('\n') : '- Nenhuma área com score ≥ 3.5'}

### Áreas de Atenção (Score < 3.0)
${areasParaMelhorar.length > 0 ? areasParaMelhorar.map((a) => `- **${a.area}**: ${a.score.toFixed(2)} (${a.nivel})`).join('\n') : '- ✅ Todas as áreas com score ≥ 3.0'}

---
`;
}

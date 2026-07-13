/**
 * Apêndices metodológicos obrigatórios no final do Book Completo (MIT Blueprint e SATF).
 * Conteúdo determinístico — não depende da IA para garantir presença no documento.
 */

function secaoGlossarioProjeto(glossarioProjeto) {
  const txt = String(glossarioProjeto || '').trim();
  if (!txt) return '';
  return `
### Glossário de fatos canônicos do projeto

> Termos e status definidos pelo consultor para este assessment — prevalecem sobre inferências genéricas da IA.

${txt}
`;
}

export function montarApendiceMetodologiaBlueprint() {
  return `# APÊNDICES METODOLÓGICOS

## Apêndice A — Metodologia Aplicada

Este book foi estruturado pela **metodologia SysMap Blueprint IA**, aplicada pela consultoria **SysMap Solutions**. A metodologia integra referências públicas reconhecidas com o framework proprietário SysMap para diagnóstico, roadmap e governança de maturidade em IA.

### A.1 Instrumento e escopo

| Elemento | Descrição |
|----------|-----------|
| **Metodologia** | SysMap Blueprint IA |
| **Referência principal** | MIT CISR Enterprise AI Maturity Model (Weill, Woerner & Sebastian, 2024) |
| **Complementos** | McKinsey (valor e escala), SFIA (capacidades), NIST AI RMF (risco), ADKAR/Prosci (mudança), DORA/MLOps/FinOps (engenharia e operação) |
| **Dimensões** | 16 dimensões do framework Blueprint (Seção 3 deste book) |
| **Escala operacional** | 5 níveis: Inexistente → Inicial → Estruturado → Gerenciado → Otimizado |
| **Estágios MIT CISR** | 4 estágios empresariais (referência qualitativa de evolução) |

### A.2 Coleta e consolidação de scores

1. **Avaliação por dimensão** — questionário Likert aplicado a avaliadores qualificados (negócio, TI, compliance, operações).
2. **Consolidação** — média ponderada das respostas por pergunta e por dimensão; score geral = média das dimensões com dados consolidados.
3. **Filtro de prioridade** — quando aplicável, consolidação restrita a avaliadores até o nível de mapeamento selecionado (capa do book).
4. **Contexto do projeto** — características, documentos e glossário cadastrados personalizam diagnóstico e recomendações (Seção 3).
5. **Projeções financeiras** — ROI líquido sobre investimento em IA (metodologia documentada em \`docs/Atual/METODOLOGIA_ROI_FINANCEIRO.md\`); projeções são referenciais, não contratuais.

### A.3 Interpretação dos níveis

| Nível | Faixa típica | Foco |
|-------|--------------|------|
| 1 — Inexistente / Inicial | 1,0 – 2,0 | Consciência, educação, experimentos isolados |
| 2 — Oportunista | 2,0 – 2,6 | Pilotos pontuais, preparação de dados e governança mínima |
| 3 — Estruturado | 2,6 – 3,4 | Casos de negócio, CoE inicial, MLOps em formação |
| 4 — Gerenciado | 3,4 – 4,2 | Escala, plataforma, FinOps, métricas de valor |
| 5 — Otimizado | 4,2 – 5,0 | IA como diferencial competitivo, inovação contínua |

### A.4 Referências bibliográficas

- Weill, P.; Woerner, S.; Sebastian, I. — *MIT CISR Enterprise AI Maturity Model* (2024)
- NIST — *AI Risk Management Framework* (AI RMF 1.0)
- DORA — *Accelerate* / State of DevOps Report
- FinOps Foundation — Framework de gestão financeira de cloud
- Prosci — ADKAR Model for Change Management`;
}

export function montarApendiceGlossarioBlueprint(glossarioProjeto = '') {
  const extraProjeto = secaoGlossarioProjeto(glossarioProjeto);
  return `## Apêndice B — Glossário de Termos

Termos recorrentes neste book de maturidade em IA (SysMap Blueprint IA).

| Termo | Definição |
|-------|-----------|
| **AI / IA** | Inteligência Artificial — sistemas que executam tarefas cognitivas (predição, classificação, geração). |
| **ML** | Machine Learning — aprendizado a partir de dados sem programação explícita de regras. |
| **LLM** | Large Language Model — modelos de linguagem de grande escala (ex.: GPT, Claude). |
| **GenAI** | IA Generativa — criação de texto, código, imagem ou áudio. |
| **MLOps** | Práticas de operação do ciclo de vida de modelos (CI/CD/CT, monitoramento, drift). |
| **CoE** | Center of Excellence — centro de excelência ou célula central de IA. |
| **ROI líquido** | Ganho líquido ÷ investimento em IA (não confundir com múltiplo bruto benefício÷investimento). |
| **DORA** | DevOps Research and Assessment — métricas de entrega (lead time, deploy frequency, MTTR, change failure rate). |
| **FinOps** | Financial Operations — gestão financeira e unit economics de cloud e inferência. |
| **NIST AI RMF** | Framework de gestão de risco de IA do NIST (Govern, Map, Measure, Manage). |
| **LGPD** | Lei Geral de Proteção de Dados (Brasil). |
| **RAG** | Retrieval-Augmented Generation — geração aumentada por recuperação de contexto documental. |
| **Feature Store** | Repositório versionado de features para treino e inferência. |
| **Model Registry** | Catálogo de modelos em produção com versionamento e metadados. |
| **Pilot / PoC** | Piloto ou prova de conceito — validação controlada antes de escala. |
| **Quick win** | Iniciativa de baixo esforço e retorno rápido (tipicamente ≤ 90 dias). |
| **MIT CISR** | Center for Information Systems Research (MIT) — referência de maturidade empresarial em IA. |
| **Blueprint IA** | Framework SysMap de 16 dimensões para assessment e roadmap de maturidade em IA. |
| **Automation bias** | Tendência de confiar excessivamente em decisões automatizadas sem revisão humana. |
| **Human-in-the-loop** | Revisão ou aprovação humana obrigatória em etapas críticas do fluxo de IA. |
${extraProjeto}`;
}

export function montarApendiceMetodologiaSatf() {
  return `# APÊNDICES METODOLÓGICOS

## Apêndice A — Metodologia Aplicada

Este book foi produzido com o instrumento **SATF TI v3 — IA Maturidade TI**, da consultoria **SysMap Solutions**, para avaliar maturidade de IA em **TI, engenharia, plataforma e delivery** — não substitui assessment enterprise/C-Level genérico (SysMap Blueprint IA / MIT CISR).

### A.1 Instrumento SATF TI v3

| Elemento | Descrição |
|----------|-----------|
| **Versão** | SATF TI v3 (2026) |
| **Dimensões** | 11 (D1–D11) — ver tabela abaixo |
| **Escala** | N1–N5 (Inexistente → Otimizado) |
| **Público-alvo** | CTO, VP Engenharia, heads de plataforma, arquitetura, SRE, delivery |
| **Score oficial** | Nota certificada pelo consultor ou teto por evidência documentada |
| **Score declarado** | Autodeclaração do cliente — gap vs oficial deve ser explicitado quando relevante |

### A.2 Dimensões oficiais (D1–D11)

| Código | Dimensão |
|--------|----------|
| D1 | Estratégia & Postura de IA |
| D2 | Governança, Risco & Conformidade |
| D3 | Pessoas, Cultura & Capacitação |
| D4 | Engenharia & Padrões de Desenvolvimento |
| D5 | Plataforma, Arquitetura & Escala |
| D6 | Dados, Contexto & Conhecimento |
| D7 | Segurança & Qualidade Integrada (QA) |
| D8 | Modernização & Sustentação de Legado |
| D9 | FinOps, Valor & Apoio ao Negócio |
| D10 | Fábrica Agêntica de Software *(fora da média geral)* |
| D11 | Conformidade Regulatória de IA |

### A.3 Três camadas de avaliação

1. **Coleta Likert** — questionário por dimensão aplicado a avaliadores de TI/engenharia.
2. **Evidência obrigatória** — notas ≥ 4 exigem artefato documentado (política, pipeline, métrica, auditoria).
3. **Certificação consultor** — validação SysMap; score oficial pode diferir do declarado.

### A.4 Referências complementares

- ISO/IEC 42001 — Sistema de gestão de IA (SGAI)
- NIST AI RMF — gestão de risco de modelos e sistemas de IA
- LGPD e PL 2.338/2023 — conformidade regulatória no contexto brasileiro
- DORA / Platform Engineering — métricas de entrega e plataforma interna`;
}

export function montarApendiceGlossarioSatf(glossarioProjeto = '') {
  const extraProjeto = secaoGlossarioProjeto(glossarioProjeto);
  return `## Apêndice B — Glossário de Termos

Termos recorrentes no instrumento SATF TI v3 e neste book.

| Termo | Definição |
|-------|-----------|
| **SATF** | SysMap Assessment Framework for Technology — família de instrumentos SysMap para maturidade de TI. |
| **Fábrica Agêntica (D10)** | Modelo operacional de desenvolvimento assistido por agentes de IA (copilots, automação SDLC). |
| **SDLC agêntico** | Ciclo de vida de software com agentes de IA em codificação, teste, revisão e deploy. |
| **Platform Engineering** | Disciplina de construir plataforma interna de desenvolvimento (IDP) para times de produto. |
| **Inner source** | Práticas open-source aplicadas internamente para reuso de código e componentes. |
| **MLOps / LLMOps** | Operação de modelos ML/LLM em produção (versionamento, monitoramento, guardrails). |
| **FinOps (D9)** | Gestão de custo de cloud, inferência e valor de iniciativas de IA para o negócio. |
| **SGAI** | Sistema de Gestão de Inteligência Artificial (ISO 42001). |
| **Evidência SATF** | Artefato exigido para sustentar notas altas (≥ 4) — documento, métrica ou processo auditável. |
| **Score oficial** | Nota validada/certificada — base para diagnóstico e roadmap deste book. |
| **Score declarado** | Autodeclaração do cliente antes ou independente da certificação. |
| **D11** | Dimensão de Conformidade Regulatória de IA — inventário, classificação de risco, LGPD técnico. |
| **Guardrails** | Controles de segurança e política aplicados a prompts, tools e saídas de LLM. |
| **Tech radar** | Catálogo de tecnologias em Adotar / Experimentar / Avaliar / Evitar. |
| **DORA** | Métricas de performance de entrega de software (lead time, deploy frequency, MTTR, CFR). |
| **Copilot / agente** | Assistente de IA integrado ao IDE ou fluxo operacional com escopo definido. |
| **Legacy modernization (D8)** | Estratégias de modernização e sustentação de sistemas legados com IA assistiva. |
| **Entregável A–H** | Documentos de escopo cadastrados no contexto do projeto (diagnóstico, arquitetura, pilotos, GTM etc.). |
${extraProjeto}`;
}

export function montarApendicesMetodologicosBlueprint(glossarioProjeto = '') {
  return `${montarApendiceMetodologiaBlueprint()}\n\n${montarApendiceGlossarioBlueprint(glossarioProjeto)}`.trim();
}

export function montarApendicesMetodologicosSatf(glossarioProjeto = '') {
  return `${montarApendiceMetodologiaSatf()}\n\n${montarApendiceGlossarioSatf(glossarioProjeto)}`.trim();
}

/** Indica se o book já contém o bloco canônico de apêndices metodológicos no final. */
export function bookTemApendicesMetodologicos(markdown) {
  const md = String(markdown || '');
  return (
    /#\s+APÊNDICES METODOLÓGICOS\b/i.test(md) &&
    /##\s+Apêndice\s+A\s+[—-]\s+Metodologia Aplicada/i.test(md) &&
    /##\s+Apêndice\s+B\s+[—-]\s+Glossário/i.test(md)
  );
}

/** Extrai e remove bloco `# APÊNDICES METODOLÓGICOS` de qualquer posição do documento. */
export function extrairBlocoApendicesMetodologicos(markdown) {
  const md = String(markdown || '');
  const padrao = /(?:^|\n)---\n\n(#\s+APÊNDICES METODOLÓGICOS[\s\S]*)$/i;
  const m = md.match(padrao);
  if (m) {
    return {
      corpo: md.slice(0, m.index).trim(),
      apendices: m[1].trim()
    };
  }
  const padraoDireto = /(#\s+APÊNDICES METODOLÓGICOS[\s\S]*)$/i;
  const m2 = md.match(padraoDireto);
  if (m2) {
    return {
      corpo: md.slice(0, m2.index).trim(),
      apendices: m2[1].trim()
    };
  }
  return { corpo: md.trim(), apendices: null };
}

/** Garante que `# APÊNDICES METODOLÓGICOS` seja a última seção do documento (após capas/índice/corpo). */
export function posicionarApendicesMetodologicosComoUltimaSecao(markdown, options = {}) {
  const { corpo, apendices: existente } = extrairBlocoApendicesMetodologicos(markdown);
  if (!corpo && !existente) return String(markdown || '').trim();

  const { framework = 'blueprint', glossarioProjeto = '' } = options;
  const bloco =
    existente && bookTemApendicesMetodologicos(existente)
      ? existente
      : framework === 'satf'
        ? montarApendicesMetodologicosSatf(glossarioProjeto)
        : montarApendicesMetodologicosBlueprint(glossarioProjeto);

  if (!corpo) return bloco;
  return `${corpo}\n\n---\n\n${bloco}`.trim();
}

/** @deprecated alias — use posicionarApendicesMetodologicosComoUltimaSecao */
export function garantirApendicesMetodologicosFinaisBook(markdown, options = {}) {
  return posicionarApendicesMetodologicosComoUltimaSecao(markdown, options);
}

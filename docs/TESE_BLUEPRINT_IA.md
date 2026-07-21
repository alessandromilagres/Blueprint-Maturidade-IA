# Blueprint IA: Um Framework Sistêmico para Avaliação de Maturidade em Inteligência Artificial Corporativa

**SysMap Solutions**

---

## Resumo

Este documento apresenta o **Blueprint IA** (também referido como **Blueprint Agêntico** na documentação metodológica completa), um framework e uma plataforma para avaliação sistemática da maturidade em Inteligência Artificial (IA) em organizações empresariais e para especificação técnica de produtos de IA. O sistema fundamenta-se no modelo MIT CISR Enterprise AI Maturity (Weill, Woerner & Sebastian, 2024) e incorpora conceitos de frameworks reconhecidos como McKinsey Value Creation, SFIA, NIST AI RMF e ADKAR/Prosci.

A proposta organiza-se em **três módulos integrados**: (1) **Avaliação de Maturidade Empresarial**, com escolha de **framework por projeto** — **Blueprint 16** (16 dimensões, 108 perguntas, visão enterprise/C-Level alinhada ao MIT CISR) ou **SATF TI v3** (11 dimensões, 70 perguntas, visão de engenharia, plataforma, legado e Fábrica Agêntica para TI/CTO), com recortes por **unidade organizacional**; (2) **Avaliação de Produtos IA-First**, com 8 perguntas universais de Transformação Agêntica e **12 verticais setoriais** com 6 perguntas cada (72 perguntas verticais), totalizando **80 perguntas** por avaliação de produto; e (3) **Especificação Automática**, que gera documentação de produto e engenharia (por exemplo PRD, requisitos, arquitetura e blueprint de construção) com apoio de IA generativa e **arquitetura multi-provedor** (Anthropic, OpenAI, Groq), com **exportação** de relatórios em Markdown, Word e PDF. A plataforma inclui ainda **Biblioteca IA** versionada (escopo Geral ou por unidade) e o **Assistente Agentica** (copiloto com RAG e permissões por unidade).

O framework oferece métricas quantitativas, projeções financeiras de ROI, benchmarking setorial e continuidade entre diagnóstico e entrega técnica, permitindo identificar gaps, priorizar investimentos e acelerar a jornada de transformação digital com IA.

**Palavras-chave**: Inteligência Artificial, Maturidade Organizacional, Transformação Digital, Multi-Agent Systems, ROI em IA, Especificação Automática, LLMs.

---

## 1. Introdução

### 1.1 Contexto e Motivação

A Inteligência Artificial emergiu como uma das tecnologias mais transformadoras do século XXI, redefinindo modelos de negócio, processos operacionais e a própria natureza do trabalho humano. Segundo relatório da McKinsey Global Institute (2023), a IA generativa pode adicionar entre US$ 2,6 trilhões e US$ 4,4 trilhões anualmente à economia global.

No entanto, apesar do potencial transformador, estudos indicam que **apenas 11% das organizações alcançaram escala significativa com suas iniciativas de IA** (Gartner, 2023). Esta disparidade entre potencial e realização evidencia uma lacuna crítica: a falta de metodologias estruturadas para avaliar, planejar e executar a jornada de maturidade em IA.

### 1.2 Problema de Pesquisa

Como as organizações podem avaliar sistematicamente seu nível de prontidão e maturidade para adoção de IA, identificar gaps críticos e priorizar investimentos de forma a maximizar o retorno sobre investimento (ROI)?

### 1.3 Objetivos

**Objetivo Geral**: Desenvolver um framework abrangente para avaliação de maturidade em IA que permita às organizações diagnosticar seu estado atual, identificar oportunidades e criar roadmaps de evolução.

**Objetivos Específicos**:
1. Estruturar modelos de avaliação multidimensionais baseados em frameworks acadêmicos consolidados: **Blueprint 16** (enterprise/MIT CISR) e **SATF TI v3** (engenharia e operações de software)
2. Definir métricas quantitativas e fórmulas de cálculo para níveis de maturidade e para relevância de produtos IA-First
3. Criar um módulo específico para avaliação de produtos IA-First e Multi-Agent Systems (verticais setoriais e pesos agênticos)
4. Estabelecer projeções financeiras correlacionadas aos níveis de maturidade
5. Permitir benchmarking setorial e comparativo entre organizações
6. **Conectar diagnóstico à execução** por meio de especificação assistida por IA (documentação técnica e de negócio) e exportação multi-formato

---

## 2. Fundamentação Teórica

### 2.1 O Modelo MIT CISR de Maturidade em IA

O MIT Center for Information Systems Research (CISR) propôs em 2022-2024 um modelo de maturidade que classifica as organizações em cinco estágios evolutivos baseados em suas capacidades de IA (Weill, Woerner & Sebastian, 2024):

| Estágio | Denominação | Características Principais |
|---------|-------------|---------------------------|
| 1 | **Inicial** | Experimentos isolados, sem estratégia formal |
| 2 | **Oportunista** | Projetos pontuais, ROI não mensurado |
| 3 | **Estruturado** | Governança definida, processos documentados |
| 4 | **Gerenciado** | IA integrada aos processos core, métricas consistentes |
| 5 | **Otimizado** | IA como diferencial competitivo, inovação contínua |

### 2.2 Frameworks Complementares

O Blueprint IA integra conceitos de múltiplos frameworks reconhecidos:

#### 2.2.1 McKinsey Value Creation Framework
Metodologia para identificação e quantificação de valor gerado por iniciativas de IA em diferentes unidades de negócio, considerando alavancas de receita, custo e eficiência operacional.

#### 2.2.2 SFIA Framework (Skills Framework for the Information Age)
Framework internacional para mapeamento de competências técnicas em tecnologia da informação, utilizado para avaliar gaps de talentos e definir planos de capacitação.

#### 2.2.3 NIST AI Risk Management Framework (AI RMF)
Framework do National Institute of Standards and Technology para gestão de riscos em sistemas de IA, abordando governança, mapeamento, medição e gerenciamento de riscos.

#### 2.2.4 ADKAR/Prosci Change Management Model
Modelo para gestão de mudanças organizacionais com cinco elementos: Awareness, Desire, Knowledge, Ability e Reinforcement. Aplicado para avaliar a prontidão organizacional para transformações com IA.

### 2.3 O Paradigma dos Multi-Agent Systems (MAS)

A evolução recente da IA generativa trouxe o conceito de **Sistemas Multi-Agentes**, onde múltiplos agentes de IA autônomos colaboram para executar tarefas complexas. Este paradigma representa uma mudança fundamental:

> "Agentes de IA não são ferramentas, são trabalhadores digitais autônomos capazes de raciocinar, planejar e executar tarefas complexas sem supervisão humana contínua." — Yann LeCun, Meta AI, 2024

O Blueprint IA incorpora o conceito de **Transformação Agêntica** para avaliar a prontidão de produtos e organizações para este novo paradigma.

---

## 3. Modelo de Maturidade Proposto

### 3.1 Arquitetura do Framework

O Blueprint IA organiza-se em **três módulos** que cobrem maturidade organizacional, relevância de produto e handoff para construção:

```
┌─────────────────────────────────────────────────────────────────┐
│                      BLUEPRINT IA FRAMEWORK                      │
├─────────────────────────────────────────────────────────────────┤
│  MÓDULO 1: MATURIDADE EMPRESARIAL (framework por projeto)        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Blueprint 16 — 16 dimensões, 108 perguntas (C-Level/MIT)    ││
│  │  SATF TI v3 — 11 dimensões, 70 perguntas (TI/engenharia)     ││
│  │  Escolha exclusiva por projeto; travada após 1ª resposta     ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  MÓDULO 2: PRODUTOS IA-FIRST                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  8 Perguntas Universais de Transformação Agêntica (60%)      ││
│  │  12 Verticais × 6 perguntas = 72 perguntas setoriais (40%)  ││
│  │  FinTech, AI First, EdTech, Legal, Saúde, E-commerce,        ││
│  │  Manufatura, AgTech, Tech/Consultoria, Serviços Profissionais││
│  │  Logística, Mobilidade / Smart Cities                        ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  MÓDULO 3: ESPECIFICAÇÃO AUTOMÁTICA                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Geração assistida por IA: PRD, requisitos funcionais e não  ││
│  │  funcionais, arquitetura, cronograma, blueprint consolidado   ││
│  │  Multi-provedor (Claude, GPT, Groq) · Export MD / DOCX / PDF ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 As 16 Dimensões de Maturidade

Cada dimensão possui um peso no cálculo do score geral. Os pesos seguem a versão implementada na plataforma (normalização no motor de scoring); a soma das parcelas é **100%**.

| # | Dimensão | Peso | Descrição | Fundamentação |
|---|----------|------|-----------|---------------|
| 1 | **Estratégia e Liderança** | 8% | Visão estratégica, engajamento do C-Level e roadmap de IA | MIT CISR |
| 2 | **Dados e Tecnologia** | 7% | Infraestrutura de dados, MLOps e escalabilidade | MIT CISR |
| 3 | **Governança e Risco** | 7% | Compliance, ética e gestão de riscos em IA | NIST AI RMF |
| 4 | **Pessoas e Cultura** | 6% | Talentos, capacitação e cultura de experimentação | SFIA |
| 5 | **Operações e Processos** | 6% | IA em produção, automação e SLAs | MIT CISR |
| 6 | **Inovação e Experimentação** | 6% | Labs, prototipagem rápida e adoção de novas tecnologias | MIT CISR |
| 7 | **Valor de Negócio e ROI** | 7% | Quantificação de valor, impacto financeiro | McKinsey |
| 8 | **Ecossistema e Parcerias** | 6% | Plataformas cloud, integrações e parcerias estratégicas | MIT CISR |
| 9 | **Valor por Unidade de Negócio** | 5% | Mapeamento de valor por área/departamento | McKinsey |
| 10 | **Talentos e Capacidades** | 5% | Gaps de skills e plano de desenvolvimento | SFIA |
| 11 | **Conformidade Regulatória** | 5% | LGPD/GDPR, EU AI Act e regulações setoriais | NIST AI RMF |
| 12 | **Prontidão para Mudança** | 5% | Capacidade de absorver e sustentar mudanças | ADKAR/Prosci |
| 13 | **Plataforma e Industrialização de IA** | 7% | Plataforma centralizada, reuso, time-to-production | MIT CISR (Stage 3) |
| 14 | **IA como Gerador de Receita** | 7% | Monetização, AIaaS, novas linhas de receita | MIT CISR (Stage 4) |
| 15 | **Maturidade por Tipo de IA** | 8% | Analítica, generativa, agêntica, robótica — integração | MIT CISR 2024 |
| 16 | **Eficácia de IA (MIT CISR)** | 8% | Operações, experiência do cliente, ecossistema | MIT CISR |

**Total**: 100%

### 3.3 Seleção de Framework por Projeto

Cada **projeto de maturidade** utiliza **um único framework**, escolhido na criação ou edição do projeto:

| ID | Nome | Público-alvo | Dimensões | Perguntas |
|----|------|--------------|-----------|-----------|
| `BLUEPRINT_16` | Blueprint IA — Maturidade Organizacional | C-Level, board, transformação enterprise | 16 | 108 |
| `SATF_TI_V3` | SATF — IA Maturidade TI (Instrumento v3) | TI, engenharia, plataforma, CTO | 11 | 70 |

**Regras operacionais:**

- A escolha é **mutuamente exclusiva** — não é possível misturar dimensões dos dois instrumentos no mesmo projeto.
- O framework fica **travado** após a primeira resposta de avaliação (nota, "sem informação" ou observação), impedindo troca que invalidaria o histórico.
- Projetos **SATF** podem marcar **setor regulado** (finanças, saúde, telecom, energia), o que altera a ponderação (ver §3.4.4).
- Dimensões **ativas** por projeto são configuráveis em ambos os frameworks (exceto obrigatoriedades SATF em setor regulado para D11).
- A API `GET /api/frameworks-maturidade` expõe metadados dos instrumentos para a interface.

### 3.4 Instrumento SATF TI v3 (IA Maturidade TI)

O **SATF** (*SysMap Assessment Framework for TI*) é o segundo instrumento de maturidade da plataforma, publicado como **Instrumento v3 (Jun/2026)**. Enquanto o Blueprint 16 cobre a transformação enterprise com lentes MIT CISR, o SATF avalia a **capacidade de TI e engenharia** para adotar, escalar e operar IA com segurança — incluindo código gerado por IA, agentes em produção, legado e Fábrica Agêntica de Software.

#### 3.4.1 As 11 Dimensões SATF

| Cód. | Dimensão | Perguntas | Na média geral? | Foco principal |
|------|----------|-----------|-----------------|----------------|
| D1 | Estratégia & Postura de IA | 6 | Sim | Green/Red Zone, sponsor, OKRs, redesenho de workflow |
| D2 | Governança, Risco & Conformidade | 6 | Sim (2× se regulado) | Política interna + IA em produto; gates de pipeline |
| D3 | Pessoas, Cultura & Capacitação | 6 | Sim | Citizen developers, orquestração, letramento crítico |
| D4 | Engenharia & Padrões de Desenvolvimento | 6 | Sim | DORA, revisão sob volume de código IA, CFR/MTTR |
| D5 | Plataforma, Arquitetura & Escala | 6 | Sim | Platform engineering, golden paths, PoC → produção |
| D6 | Dados, Contexto & Conhecimento | 6 | Sim | RAG, catálogos, governança de PII para agentes |
| D7 | Segurança & Qualidade Integrada (QA) | 7 | Sim (2× se regulado) | SAST/SCA codificado, least agency, testes não-determinísticos |
| D8 | Modernização & Sustentação de Legado | 6 | Sim | Mapa de bloqueios, spec-first, AIOps, observabilidade de agentes |
| D9 | FinOps, Valor & Apoio ao Negócio | 6 | Sim | Unit economics, FinOps gate no CI/CD, impacto ao usuário |
| D10 | Fábrica Agêntica de Software | 8 | **Não** — score próprio | SDLC agêntico ponta a ponta; fora da média das 9 núcleo |
| D11 | Conformidade Regulatória de IA | 7 | Sim (2× se regulado; **obrigatória** se regulado) | ISO 42001, PL 2.338/2023, LGPD, NIST AI RMF |

**Total**: 70 perguntas Likert (1–5), cada uma com **critérios observáveis** por nível e campo **evidência esperada** orientando o avaliador.

#### 3.4.2 Evidência Obrigatória (SATF)

Diferentemente do Blueprint 16, o SATF exige **evidência documentada** para notas altas:

- Respostas com pontuação **≥ 4** (Gerenciado/Otimizado no instrumento SATF) exigem **observações com no mínimo 20 caracteres** descrevendo a evidência.
- Sem evidência válida, a **nota efetiva** usada no cálculo é **limitada a 3** (teto N3), mesmo que o avaliador tenha declarado 4 ou 5.
- A finalização da avaliação é **bloqueada** se houver perguntas ≥ 4 sem evidência (`SATF_EVIDENCIA_OBRIGATORIA`).
- A interface exibe, por pergunta, o bloco **"Evidência esperada"** (ex.: "Dashboard DORA/DX; série histórica").

Isso alinha o instrumento à prática de auditoria técnica: afirmações de maturidade elevada devem ser sustentadas por artefatos observáveis.

#### 3.4.3 Certificação Consultiva (Camada 3 — SATF)

Após a consolidação das avaliações, perfis autorizados (`admin`, `gestor`, `sysmap`, `negocios`, `ti`, `executivo`) podem executar a **certificação por dimensão** na tela *Certificação SATF* do projeto:

| Camada | Descrição |
|--------|-----------|
| **Declarado** | Média das notas informadas pelos avaliadores |
| **Com teto** | Média após aplicar teto 3 onde faltou evidência em notas ≥ 4 |
| **Oficial (certificado)** | Nota validada ou rebaixada pelo consultor, com status `certificado` ou `rebaixado` |

O **score oficial do projeto** prioriza: nota certificada → nota com teto → nota declarada. Cada dimensão registra confiança (`alta`/`média`/`baixa`), resumo de evidências e observação do consultor.

#### 3.4.4 Setor Regulado e Ponderação

Quando o projeto SATF marca **setor regulado**, as dimensões **D2**, **D7** e **D11** recebem **peso 2×** antes da normalização para 100%. A **D11** torna-se **obrigatória** no projeto. Isso reflete maior exigência de governança, segurança/QA e conformidade em setores como finanças, saúde, telecom e energia.

O **score geral SATF** é a média ponderada de **D1–D9 e D11** (10 dimensões). A **D10 (Fábrica Agêntica)** possui score e relatório próprios, mas **não entra** no denominador da média geral — permitindo diagnosticar maturidade agêntica de software sem distorcer o índice de prontidão de TI.

#### 3.4.5 Escala de Maturidade SATF (N1–N5)

O SATF utiliza faixas SysMap distintas do Blueprint/MIT:

| Faixa | Nível | Classificação |
|-------|-------|---------------|
| 1,0 – 1,8 | N1 | Inicial |
| 1,8 – 2,6 | N2 | Oportunista |
| 2,6 – 3,4 | N3 | Estruturado |
| 3,4 – 4,2 | N4 | Gerenciado |
| 4,2 – 5,0 | N5 | Otimizado |

#### 3.4.6 Relatórios e Books SATF — isolamento taxonômico (Jul/2026)

Projetos SATF geram artefatos **dedicados**, com pipeline de IA **separado** do Blueprint 16. A plataforma não reutiliza prompts, blocos de dados MIT CISR nem taxonomia de 16 dimensões na geração SATF.

| Artefato | Tipo biblioteca | Público | Seções |
|----------|-----------------|---------|--------|
| Relatório executivo IA | `executivo` | CTO, engenharia, plataforma | 5 (capacidades, gaps, roadmap técnico) |
| Book completo | `completo_satf` | Consultoria TI | 1–8 (11 dimensões D1–D11) |
| Book modo rápido | `completo_satf_rapido` | Entrega ágil | Versão condensada SATF |

**Backend:** `satfBookIA.js`, `satfRelatorioExecutivoIA.js`, `satfBookTaxonomia.js`, `exportRelatorioFrameworkMeta.js`. Rotas `POST /relatorio-ia` e `/relatorio-ia-completo` desviam para fluxos SATF quando `ProjetoFramework.frameworkMaturidade = SATF_TI_V3`.

**Regras anti-contaminação:**

1. Taxonomia fechada D1–D11 (nomes oficiais do seed); proibidas 16 dimensões Blueprint, MIT CISR como metodologia principal e rótulos genéricos de outras taxonomias.
2. Validação pós-geração (`validarTaxonomiaBookSatf`); cache (`reuse=true`) só reutiliza versão salva se validação OK.
3. Modo rápido SATF não injeta trajetória MIT nem Apêndice C do book Blueprint.
4. Guias de progressão SATF calibram o modelo internamente sem expor nomes Blueprint no documento final.
5. **Desejos IA** dos avaliadores integrados na Seção 3 do book quando cadastrados (`blocoDesejosIaBook.js`).
6. Resposta API inclui `avisoTaxonomia` quando contaminação é detectada — regenerar com `reuse=false`.

**Frontend e exportação:** labels condicionais no dashboard; alerta amarelo na UI do book; export Word com rodapé SATF e marca **Confidencial**; exports MD/ZIP com cabeçalho SATF TI v3 (`exportRelatorioFrameworkMeta.js`).

**Operação:** books SATF gerados antes de Jul/2026 com índice ou corpo misturando dimensões devem ser **regenerados** na plataforma.

- Capa e rodapé: metodologia **SATF TI v3 — IA Maturidade TI (SysMap Solutions)**
- Escala N1–N5 (sem bloco de ROI MIT CISR típico do Blueprint enterprise)
- Guias de progressão: `docs/Atual/Dimensoes_Evolucao_SAT/` (11 documentos por dimensão)

### 3.5 Comparativo Blueprint 16 × SATF TI v3

| Aspecto | Blueprint 16 | SATF TI v3 |
|---------|--------------|------------|
| Foco | Enterprise, C-Level, board | TI, engenharia, plataforma, legado |
| Dimensões | 16 | 11 |
| Perguntas | 108 | 70 |
| Benchmark | MIT CISR Enterprise AI Maturity | Instrumento SysMap SATF |
| Dimensão especial | — | D10 Fábrica Agêntica (fora da média) |
| Evidência em notas altas | Não obrigatória | Obrigatória (≥ 4, mín. 20 caracteres) |
| Certificação consultiva | Não | Sim (camada 3 por dimensão) |
| Setor regulado | Não | Peso 2× em D2/D7/D11; D11 obrigatória |
| Faixas de maturidade | MIT (ex.: 1,0–1,5 … 4,5–5,0) | SysMap N1–N5 (1,0–1,8 … 4,2–5,0) |
| Books / relatórios IA | `completo` / `completo_rapido`; executivo C-Level + ROI MIT | `completo_satf` / `completo_satf_rapido`; executivo TI/engenharia; pipeline isolado |
| Validação taxonômica | — | `validarTaxonomiaBookSatf`; alerta UI + `avisoTaxonomia` |
| Export Word/MD/ZIP | Rodapé Blueprint / MIT referência | Rodapé SATF + **Confidencial**; sumário técnico SATF |

**Quando usar cada instrumento:** Blueprint 16 para diagnóstico estratégico enterprise e alinhamento a board; SATF para assessment de capacidade de TI, engenharia de software com IA, modernização de legado e operação de agentes em produção.

---

## 4. Metodologia de Avaliação

### 4.1 Estrutura das Perguntas

Cada pergunta do assessment utiliza uma escala Likert de 1 a 5, com critérios específicos que descrevem comportamentos observáveis para cada nível:

**Exemplo de Pergunta (Dimensão: Estratégia e Liderança)**:

> **Pergunta**: Existe uma estratégia clara de IA alinhada com objetivos de negócio?

| Score | Nível | Critérios Observáveis |
|-------|-------|----------------------|
| 1 | Inexistente | Sem estratégia formal, sem documentação, iniciativas reativas |
| 2 | Inicial | Estratégia em desenvolvimento, documentação parcial |
| 3 | Definido | Estratégia documentada, alinhamento claro, comunicada internamente |
| 4 | Gerenciado | Estratégia integrada, revisão semestral, alinhamento com OKRs |
| 5 | Otimizado | Estratégia preditiva, antecipa mercado, inovação contínua |

### 4.2 Coleta de Dados

O framework suporta múltiplos avaliadores por projeto, permitindo:

- **Visão 360°**: Diferentes stakeholders avaliam as mesmas dimensões
- **Seleção de Áreas**: Cada avaliador escolhe quais dimensões tem conhecimento para responder (respeitando dimensões ativas do projeto)
- **Consolidação**: Sistema calcula médias ponderadas considerando todos os avaliadores
- **Framework travado**: Após a primeira resposta, o instrumento (Blueprint ou SATF) não pode ser alterado

### 4.3 Metodologia Específica SATF

Além das regras gerais, projetos **SATF TI v3** aplicam:

1. **Evidência por pergunta**: Cada pergunta inclui texto de *evidência esperada*; notas ≥ 4 exigem observações documentadas.
2. **Teto automático**: Nota efetiva limitada a 3 sem evidência válida, mesmo com declaração 4–5.
3. **Bloqueio na finalização**: Avaliador não conclui enquanto houver pendências de evidência.
4. **Certificação pós-avaliação**: Consultor valida ou rebaixa scores por dimensão; score oficial do projeto usa a camada certificada.
5. **Configuração de dimensões**: Gestor ativa/desativa dimensões do projeto; D11 obrigatória em setor regulado; D10 sempre com score separado.
6. **Convites filtrados**: Convites e detalhe do projeto listam apenas **dimensões ativas** do framework escolhido.

---

## 5. Modelo Matemático e Fórmulas de Cálculo

### 5.1 Cálculo do Score por Área

O score de cada área é calculado pela média aritmética simples das respostas às perguntas daquela área:

$$S_{área} = \frac{\sum_{i=1}^{n} R_i}{n}$$

Onde:
- $S_{área}$ = Score da área
- $R_i$ = Resposta da pergunta $i$ (valor de 1 a 5)
- $n$ = Número de perguntas respondidas na área

### 5.2 Cálculo do Score Geral de Maturidade

O score geral de maturidade é calculado pela média ponderada dos scores de todas as áreas avaliadas:

$$S_{geral} = \frac{\sum_{j=1}^{16} (S_{área_j} \times P_j)}{\sum_{j=1}^{16} P_j}$$

Onde:
- $S_{geral}$ = Score geral de maturidade (1 a 5)
- $S_{área_j}$ = Score da área $j$
- $P_j$ = Peso da área $j$ (conforme tabela de pesos)

### 5.3 Classificação dos Níveis de Maturidade (Blueprint 16)

A partir do score geral, a organização é classificada em um dos cinco níveis:

| Faixa de Score | Nível | Classificação | Descrição |
|----------------|-------|---------------|-----------|
| 1.00 - 1.49 | Inicial | Iniciante | Organização sem estratégia formal de IA |
| 1.50 - 2.49 | Oportunista | Básico | Projetos isolados, sem governança |
| 2.50 - 3.49 | Estruturado | Intermediário | Governança definida, processos em evolução |
| 3.50 - 4.49 | Gerenciado | Avançado | IA integrada, métricas consistentes |
| 4.50 - 5.00 | Otimizado | Expert | IA como core do negócio, inovação contínua |

### 5.3.1 Score Geral SATF TI v3

Para projetos SATF, o score geral considera apenas dimensões que **entram na média** (D1–D9 e D11):

$$S_{geral}^{SATF} = \frac{\sum_{j \in \text{média}} (S_{área_j} \times P_j)}{\sum_{j \in \text{média}} P_j}$$

Onde $P_j$ são pesos iguais por padrão, ou **2×** para D2, D7 e D11 quando `setorRegulado = true`. A dimensão **D10** calcula $S_{D10}$ separadamente e não entra no numerador.

**Nota efetiva por resposta SATF** (para cálculo com teto):

$$R_i^{efetiva} = \begin{cases} R_i & \text{se } R_i < 4 \text{ ou evidência válida} \\ \min(R_i, 3) & \text{se } R_i \geq 4 \text{ sem evidência} \end{cases}$$

**Score oficial por dimensão** (após certificação):

$$S_{oficial} = S_{certificado} \;||\; S_{com\_teto} \;||\; S_{declarado}$$

### 5.3.2 Classificação SATF (N1–N5)

| Faixa | Nível |
|-------|-------|
| 1,0 – 1,8 | N1 Inicial |
| 1,8 – 2,6 | N2 Oportunista |
| 2,6 – 3,4 | N3 Estruturado |
| 3,4 – 4,2 | N4 Gerenciado |
| 4,2 – 5,0 | N5 Otimizado |

### 5.4 Consolidação de Múltiplos Avaliadores

Quando há múltiplos avaliadores para um mesmo projeto, o score consolidado por área é:

$$S_{área}^{consolidado} = \frac{\sum_{k=1}^{m} S_{área_k}}{m}$$

Onde:
- $m$ = Número de avaliadores que responderam a área
- $S_{área_k}$ = Score da área dado pelo avaliador $k$

---

## 6. Módulo de Avaliação de Produtos IA-First

### 6.1 Conceito de Transformação Agêntica

O **Módulo 2** do Blueprint IA foca na avaliação de produtos e soluções baseados em IA, especialmente aqueles que utilizam o paradigma de **Multi-Agent Systems**. A Transformação Agêntica representa a evolução de:

```
Automação Tradicional → RPA → Chatbots → Agentes Autônomos → Multi-Agent Systems
        (1990s)         (2010s)  (2015s)     (2022+)           (2024+)
```

### 6.2 Estrutura do Assessment de Produtos

O assessment de produtos é composto por dois blocos:

#### Bloco 1: Perguntas Universais de Transformação Agêntica (8 perguntas)

Aplicadas a **todos os produtos**, independente da vertical, com pesos específicos:

| # | Categoria | Peso | Foco da Avaliação |
|---|-----------|------|-------------------|
| 1 | Maturidade para Agentes Autônomos | 20% | Capacidade de operação autônoma 24/7 |
| 2 | Impacto no ROI e Receita | 20% | Geração de receita incremental |
| 3 | Redução de Custos Operacionais | 15% | Automação e eficiência |
| 4 | Integração com APIs e Ecossistema | 15% | Interoperabilidade e orquestração |
| 5 | Escalabilidade e Elasticidade | 10% | Capacidade de escalar sob demanda |
| 6 | Governança e Conformidade | 10% | Auditoria, explicabilidade, compliance |
| 7 | Aprendizado e Evolução | 5% | Capacidade de melhoria contínua |
| 8 | Experiência do Usuário | 5% | Impacto em NPS/CSAT |

**Total**: 100%

#### Bloco 2: Perguntas por Vertical (12 verticais × 6 perguntas cada)

Cada vertical possui 6 perguntas específicas focadas em:
1. **ROI e Redução de Custos** específicos do setor
2. **Automação Agêntica** aplicada ao domínio
3. **APIs e Aceleradores** técnicos relevantes
4. **Viabilidade Técnica** da infraestrutura do cliente
5. **Prontidão do Cliente** para adoção
6. **Riscos e Compliance** setoriais

**Verticais Disponíveis**:
- FinTech (Tecnologia Financeira)
- AI First (Produtos Nativos de IA)
- EdTech (Tecnologia Educacional)
- LegalTech (Tecnologia Jurídica)
- Healthcare (Saúde e Bem-Estar)
- E-commerce e Varejo
- Manufatura e Indústria
- AgTech e Sustentabilidade
- Tecnologia e Consultoria
- Serviços Profissionais (BPO, Contact Center, Facilities)
- Logística e Supply Chain
- Mobilidade e Smart Cities

### 6.3 Cálculo do Score de Relevância do Produto

O score final de relevância do produto combina os dois blocos:

$$S_{relevância} = (S_{agêntico} \times 0.60) + (S_{verticais} \times 0.40)$$

Onde:

**Score de Transformação Agêntica**:
$$S_{agêntico} = \sum_{i=1}^{8} (R_i \times P_i)$$

Sendo $R_i$ a resposta (1-5) e $P_i$ o peso da pergunta $i$.

**Score de Verticais**:
$$S_{verticais} = \frac{\sum_{j=1}^{v} S_{vertical_j}}{v}$$

Onde $v$ é o número de verticais com resposta (na implementação atual, as **12 verticais** são avaliadas para cada produto, logo tipicamente $v = 12$) e $S_{vertical_j}$ é a **média aritmética das 6 perguntas** da vertical $j$ (escala 1–5 por pergunta).

### 6.3.1 Classificação Alternativa por Engenharia de Valor

Além do score de relevância (combinação agêntico + verticais), a plataforma oferece um **segundo método de priorização de produtos**, fundamentado em **Engenharia de Valor** (Value Engineering — Miles, 1961). Os dois métodos **coexistem**: o modelo de relevância (60/40) permanece como classificação padrão e a Engenharia de Valor adiciona uma lente complementar, orientada aos gaps de maturidade do projeto.

**Princípio.** Em Engenharia de Valor, a prioridade de uma alternativa resulta da soma ponderada de critérios ("drivers de valor"). No Blueprint, os drivers são as **16 dimensões de maturidade** do projeto ao qual o produto pertence. O peso de cada driver é dado pela **ordem** definida pelo decisor, seguindo a sequência de **Fibonacci** (o driver no topo recebe o maior peso). A ordem **padrão** é sugerida pela **nota inversa** de maturidade — a dimensão de menor nota fica no topo —, priorizando aquilo que mais reduz a nota geral do projeto; o decisor pode reordenar livremente.

Para cada produto atribui-se um **impacto** (escala 0–5) sobre cada driver. A prioridade de valor é:

$$S_{valor} = \sum_{d=1}^{n} \left( w_d \times I_d \right)$$

Onde:
- $n$ = número de drivers (dimensões) ativos;
- $w_d$ = peso de Fibonacci associado à posição do driver $d$ (topo = maior peso);
- $I_d$ = impacto do produto no driver $d$ (0–5).

A forma normalizada (0–100%), usada para comparar produtos, é:

$$S_{valor}^{norm} = \frac{S_{valor}}{\sum_{d=1}^{n} (w_d \times 5)} \times 100$$

**Escopo e governança.** A configuração de drivers (ordem, impacto e ativação) é mantida **por produto**. Como os pesos derivam da maturidade vigente do Blueprint e da priorização explícita do decisor, o método expõe uma **memória de cálculo transparente** (peso × impacto por driver) e alinha a priorização de produtos aos gaps estratégicos identificados no diagnóstico.

### 6.4 Módulo 3: Especificação Automática

O **Módulo 3** fecha o ciclo entre diagnóstico e implementação: a partir dos dados do produto e das avaliações (Módulos 1 e 2), a plataforma gera documentação estruturada com IA generativa — incluindo, conforme o fluxo configurado, **PRD**, **requisitos funcionais e não funcionais**, **arquitetura técnica**, **cronograma e estimativas** e **blueprint de construção**. A solução adota **múltiplos provedores de modelo** (por exemplo Anthropic Claude, OpenAI, Groq), com configuração administrativa e **exportação** de relatórios de maturidade e entregas em **Markdown**, **Word** e **PDF**, alinhando a metodologia à operação de projetos reais.

---

## 7. Projeções Financeiras por Nível de Maturidade

### 7.1 Correlação entre Maturidade e Retorno Financeiro

Estudos empíricos demonstram correlação positiva entre maturidade em IA e resultados financeiros. O Blueprint IA utiliza as seguintes projeções baseadas em benchmarks de mercado:

| Nível | Crescimento de Receita | Redução de Custos | ROI Esperado | Time-to-ROI |
|-------|----------------------|-------------------|--------------|-------------|
| 1 - Inicial | -2% | -2% | 0% | 18-24 meses |
| 2 - Oportunista | +2% | -5% | 100% | 12-18 meses |
| 3 - Estruturado | +6% | -10% | 200% | 9-12 meses |
| 4 - Gerenciado | +12% | -18% | 400% | 6-9 meses |
| 5 - Otimizado | +22% | -28% | 700% | 3-6 meses |

### 7.2 Modelo de Projeção de ROI

O ROI projetado para iniciativas de IA pode ser calculado por:

$$ROI = \frac{(Receita_{incremental} + Custos_{reduzidos}) - Investimento_{IA}}{Investimento_{IA}} \times 100$$

Onde:
- $Receita_{incremental}$ = Receita adicional gerada por IA
- $Custos_{reduzidos}$ = Economia operacional com automação
- $Investimento_{IA}$ = Total investido em tecnologia, talentos e infraestrutura

### 7.3 Curva de Valor Acumulado

Organizações em níveis mais altos de maturidade demonstram crescimento exponencial no valor gerado:

```
Valor
Gerado
   │
   │                                    ╱ Nível 5
   │                               ╱───╱
   │                          ╱───╱
   │                     ╱───╱     Nível 4
   │                ╱───╱
   │           ╱───╱          Nível 3
   │      ╱───╱
   │ ╱───╱               Nível 2
   │╱_____________________ Nível 1
   └──────────────────────────────────► Tempo
```

---

## 8. Benchmarking e Análise Comparativa

### 8.1 Metodologia de Benchmarking

O Blueprint IA permite comparar organizações:

1. **Benchmark Setorial**: Comparação com médias do setor de atuação
2. **Benchmark por Porte**: Comparação com empresas de porte similar
3. **Benchmark por Dimensão**: Identificação de gaps específicos

### 8.2 Indicadores de Posicionamento

| Indicador | Definição | Cálculo |
|-----------|-----------|---------|
| **Percentil** | Posição relativa no setor | % de empresas abaixo do score |
| **Gap to Leader** | Distância para o líder | $Score_{líder} - Score_{empresa}$ |
| **Top 25%** | Acima do terceiro quartil | $Score > Q_3$ |
| **Bottom 25%** | Abaixo do primeiro quartil | $Score < Q_1$ |

### 8.3 Matriz de Priorização

Com base nos scores por dimensão e benchmarks, o sistema gera uma matriz de priorização:

```
                    Importância Estratégica
                    Baixa          Alta
              ┌──────────────┬──────────────┐
        Alto  │   MANTER     │  EXCELÊNCIA  │
Gap de        │              │              │
Score         ├──────────────┼──────────────┤
        Baixo │   MONITORAR  │  PRIORIZAR   │
              └──────────────┴──────────────┘
```

---

## 9. Recomendações por Nível de Maturidade

### 9.1 Nível 1 - Inicial → Oportunista

**Foco**: Criar consciência e estrutura básica

- Definir sponsor executivo para IA
- Identificar 2-3 casos de uso com ROI mensurável
- Estabelecer governança mínima de dados
- Iniciar programa de capacitação básica

### 9.2 Nível 2 - Oportunista → Estruturado

**Foco**: Profissionalizar e escalar

- Documentar estratégia de IA alinhada ao negócio
- Implementar MLOps básico
- Criar centro de excelência em IA
- Estabelecer métricas de sucesso padronizadas

### 9.3 Nível 3 - Estruturado → Gerenciado

**Foco**: Integrar e otimizar

- Integrar IA aos processos core
- Implementar governança avançada e compliance
- Escalar soluções bem-sucedidas
- Desenvolver parcerias estratégicas

### 9.4 Nível 4 - Gerenciado → Otimizado

**Foco**: Inovar e liderar

- Experimentar com tecnologias emergentes
- Criar produtos IA-First
- Estabelecer-se como referência no setor
- Contribuir para comunidade e ecossistema

---

## 10. Como o Sistema Funciona na Prática

### 10.1 Visão Operacional

O Blueprint IA transforma a metodologia da tese em um fluxo operacional de diagnóstico, análise, geração de relatórios e especificação. A plataforma parte do cadastro de empresas, projetos, produtos e usuários; distribui avaliações por convite; consolida respostas; gera painéis executivos; e usa IA generativa para produzir relatórios e documentos técnicos.

O funcionamento pode ser resumido em dez etapas:

1. **Configuração inicial**: administradores cadastram empresas, usuários, projetos (com **escolha de framework**: Blueprint 16 ou SATF TI v3), produtos, custos de referência e provedores de IA.
2. **Planejamento da avaliação**: o sistema sugere dimensões de avaliação a partir do cargo do avaliador, usando a matriz Cargo × Dimensão, mas permite ajuste manual.
3. **Convite e resposta**: avaliadores recebem convite por e-mail/link/QR Code, podem acessar avaliações de maturidade por magic link sem senha e respondem perguntas com escala de 1 a 5, podendo marcar "sem informação" quando não têm evidência suficiente.
4. **Acompanhamento operacional**: gestores acompanham link enviado, link aberto, avaliação iniciada, progresso salvo, finalização, lembretes e alertas de qualidade.
5. **Consolidação**: o motor de scoring calcula progresso, score por dimensão, score geral ponderado e recortes por avaliador, projeto, produto e empresa.
6. **Análise comparativa**: a tela de análise de avaliações permite comparar avaliadores finalizados por dimensão, identificar divergências e observar critérios escolhidos.
7. **Dashboards executivos**: painéis de prontidão e comparativo por empresa apoiam priorização por score, conclusão, riscos e potencial de escala.
8. **Relatórios e biblioteca IA**: relatórios estratégicos e books (empresa **geral** ou **por unidade organizacional**) são gerados em background, salvos em biblioteca versionada com indicação de escopo, e exportados em Markdown, Word ou PDF.
9. **Assistente Agentica**: copiloto com RAG sobre manual, tese, contexto do projeto e books autorizados; modos de pergunta, feedback e permissões por unidade.
10. **Especificação e execução**: a partir do diagnóstico e dos dados do produto, o módulo de especificação automática gera PRD, requisitos, arquitetura, cronograma, custos e blueprint de construção.

### 10.2 Papéis e Acessos

O sistema separa responsabilidades por perfil:

| Perfil | Responsabilidade | Acesso típico |
|--------|------------------|---------------|
| Administrador | Configura a operação, usuários, IA, templates, empresas e parâmetros | Visão completa |
| Consultor/Gestor | Acompanha projetos, produtos, avaliações e relatórios | Painéis e análises |
| Avaliador | Responde avaliações recebidas por convite | Entrada restrita de avaliador |
| Stakeholder executivo | Consome dashboards, relatórios e recomendações | Relatórios e exportações |

O perfil avaliador possui navegação restrita, evitando acesso a áreas administrativas e mantendo foco nas avaliações pendentes. Essa restrição existe tanto no sistema web quanto no aplicativo mobile. Para avaliações de maturidade, o avaliador também pode entrar por magic link, quando o convite é válido, sem precisar digitar senha.

### 10.3 Aplicativo Mobile do Avaliador

O Blueprint IA possui um aplicativo complementar chamado **Blueprint IA Avaliador**, construído em Expo/React Native. Ele não replica a plataforma administrativa; seu objetivo é simplificar a jornada de resposta para avaliadores que preferem usar celular.

O aplicativo permite:

- Login com as credenciais do Blueprint IA
- Armazenamento local do token no dispositivo
- Listagem de avaliações pendentes
- Resposta de avaliações de maturidade por projeto
- Resposta de avaliações de produto IA-First
- Marcação de dimensão recusada quando o avaliador não se considera apto
- Marcação "sem informação" em perguntas de maturidade
- Salvamento parcial
- Finalização da avaliação

O app consome a mesma API do backend, usa JWT para autenticação e atualiza os mesmos dados usados pelos dashboards web. Assim, uma avaliação respondida pelo app aparece imediatamente no acompanhamento de avaliadores, na consolidação de scores e nos relatórios.

Em produção, a URL de API do app deve apontar para:

```text
https://agentica.sysmap.com.br/api
```

Em desenvolvimento, a URL é configurada por `EXPO_PUBLIC_API_URL`, permitindo apontar para o backend local.

### 10.4 Avaliação de Maturidade

Cada projeto pode ter múltiplos avaliadores e utiliza **um framework fixo** (Blueprint 16 ou SATF TI v3), selecionado na criação do projeto. O seletor de framework (`FrameworkMaturidadeSelector`) apresenta descrição, público-alvo e quantidade de dimensões/perguntas. Projetos SATF exibem opção **setor regulado** e badge `SATF TI` nos painéis.

O convite define o projeto, o avaliador e as dimensões esperadas. A seleção de áreas pode ser manual ou sugerida pela matriz Cargo × Dimensão, **limitada às dimensões ativas** do framework do projeto. Por exemplo, cargos de tecnologia em projeto SATF recebem dimensões como Engenharia, Plataforma, Segurança & QA e Modernização de Legado; perfis executivos em projeto Blueprint recebem conjunto mais amplo de dimensões estratégicas.

Convites de maturidade usam um fluxo de acesso simplificado: o link recebido por e-mail ou QR Code chama a API pública de validação do convite, cria ou reutiliza a avaliação do respondente, gera uma sessão JWT e redireciona diretamente para a tela de resposta. O fluxo mantém autorização no backend, impede uso por usuário inativo e registra eventos de abertura e início da avaliação.

Durante a resposta, cada pergunta exibe:

- Critérios objetivos de pontuação de 1 a 5
- Esclarecimento enriquecido sobre o que a pergunta avalia
- Exemplos por vertical de negócio (Blueprint) ou **evidência esperada** (SATF)
- Campo de observações (obrigatório para SATF quando nota ≥ 4)
- Opção "sem informação", que conta como pergunta tratada no progresso, mas não entra no score

Projetos **SATF** após consolidação permitem **certificação consultiva** por dimensão (`/projetos/:id/certificacao`), onde o consultor valida evidências e define o score oficial.

Antes de finalizar, o avaliador visualiza uma revisão com perguntas respondidas, pendentes, respostas sem informação e dimensões recusadas. Isso reduz respostas especulativas, melhora a consciência do avaliador sobre lacunas e aumenta a qualidade do diagnóstico.

### 10.5 Acompanhamento e Auditoria de Avaliadores

A operação de avaliação é acompanhada em tempo quase real por uma tela dedicada ao gestor. O painel mostra etapa do convite, progresso, necessidade de lembrete, alertas de qualidade e trilha recente.

A trilha operacional é gravada na tabela `AvaliacaoEvento`, com eventos como:

- Convite enviado
- Link aberto
- Avaliação iniciada
- Progresso salvo
- Revisão/finalização

Esses eventos permitem distinguir falta de recebimento, falta de abertura, abandono antes de iniciar e avaliação em andamento. O acompanhamento também identifica padrões de risco, como muitas respostas "sem informação", notas extremas sem evidência e conclusão rápida demais.

### 10.6 Dashboards Executivos

Além dos dashboards por empresa, projeto e produto, a plataforma possui visões executivas de prontidão:

- **Prontidão Executiva**: consolida score médio e taxa de conclusão para indicar projetos prontos para escala ou que exigem atenção.
- **Comparativo por Empresa**: compara projetos lado a lado por prontidão, maturidade, conclusão e riscos, com exportação CSV e impressão/PDF.

Essas visões ajudam a transformar a avaliação em uma agenda executiva de priorização.

### 10.7 Relatórios IA em Background

Os relatórios gerados por IA podem ser longos e consumir muitos tokens. Por isso, a geração executa em background por meio de jobs persistidos. A interface inicia a geração, acompanha status, progresso e erros, e carrega a versão salva quando o job termina.

Esse desenho evita timeout no navegador, permite continuidade mesmo em relatórios multi-chunk e mantém histórico de versões na biblioteca de relatórios IA.

**Isolamento por framework (Jul/2026):** projetos SATF usam módulos dedicados (`satfBookIA.js`, `satfRelatorioExecutivoIA.js`) com validação taxonômica pós-geração; projetos Blueprint mantêm fluxo MIT CISR e 16 dimensões inalterados.

**Escopo Geral × por unidade:** cada geração pode cobrir a empresa/projeto inteiro (**Geral**) ou uma **unidade organizacional** (`EmpresaUnidade`), com tipos dedicados (`book_unidade*`, `executivo_unidade`, variantes SATF). O snapshot do relatório registra a unidade aplicada; a **Biblioteca IA** exibe o escopo (Geral ou “Por unidade · nome”) e permite filtrar por ele.

### 10.8 Unidades Organizacionais e Governança Multi-Unidade

Empresas podem cadastrar **unidades organizacionais** (ex.: Delivery, COE-IA, Sustentação), incluindo a unidade canônica **Geral**. Usuários têm:

- **Unidade home** (`empresaUnidadeId`) — vínculo principal do avaliador/gestor
- **Unidades governadas** (`unidadesGovernadasIds`) — unidades adicionais sob responsabilidade do gestor (peso 0,5 no consolidado por unidade; home = peso 1)

No diagnóstico filtrado por unidade, entram avaliações de home ∪ governadas. Nos **relatórios por unidade**, o book usa o escopo e as dimensões em foco da unidade. No **Assistente Agentica**, usuários com home e/ou governadas só recuperam books/relatórios dessas unidades (além dos de escopo Geral); `admin` e `sysmap` mantêm visão completa.

### 10.9 Assistente Agentica

A plataforma inclui o **Assistente Agentica** (`/assistente`): copiloto de produto e metodologia com:

1. **RAG híbrido** (palavra-chave + embeddings) sobre manual do sistema, excertos de tese/guias, contexto do projeto e **última versão** de cada tipo de relatório IA indexado
2. **Modos de pergunta**: Automático, Como usar, Metodologia, Este projeto, Deste book
3. **Fontes clicáveis** para abrir o relatório ou a tela citada
4. **Ações contextuais** (glossário, book, certificação, dashboard, etc.)
5. **Feedback** 👍/👎 com motivo, usado para afinar dicas em perguntas seguintes
6. **Permissões finas** por unidade (item acima) e isolamento por empresa no acesso ao projeto

Conversas são persistidas por usuário. Relatórios antigos indexam sob demanda na primeira recuperação ou ao salvar nova versão.

### 10.10 Arquitetura Técnica Resumida

| Camada | Tecnologia / Função |
|--------|----------------------|
| Frontend | React, Vite, TailwindCSS, React Router |
| Aplicativo mobile | Expo, React Native, AsyncStorage |
| Backend | Node.js, Express, Prisma |
| Banco de dados | PostgreSQL em produção |
| IA generativa | Provedores configuráveis: Anthropic, OpenAI e Groq |
| Assistente / RAG | Chunks e embeddings persistidos; streaming SSE |
| Autenticação | JWT e rotas protegidas por perfil; escopo por empresa/unidade |
| Auditoria operacional | Eventos de convite, abertura, início, salvamento e finalização |
| Deploy | Azure DevOps, Docker/Docker Compose, Nginx/HTTPS |
| Exportação | Markdown, Word e PDF |

### 10.11 Artefatos Gerados

Ao final de um ciclo, a organização pode obter:

- Dashboard executivo de maturidade
- Dashboard de prontidão executiva
- Comparativo executivo por empresa
- Score consolidado por empresa, projeto, produto, dimensão e avaliador (e por unidade, quando aplicável)
- Trilha operacional de avaliadores e alertas de qualidade
- Relatório estratégico C-Level (geral ou por unidade)
- Book completo de maturidade em IA (geral ou por unidade; Blueprint ou SATF)
- Análise comparativa de avaliações por dimensão
- Relatórios exportáveis em Word, Markdown e PDF
- Especificações técnicas de produto IA-First
- Biblioteca histórica de relatórios IA versionados, com escopo Geral/unidade
- Conversas e respostas do Assistente Agentica ancoradas em fontes autorizadas

---

## 11. Conclusões

### 11.1 Síntese

O **Blueprint IA** apresenta um framework e uma plataforma robustos, cientificamente fundamentados, para avaliação de maturidade em Inteligência Artificial e para **relevância de produtos IA-First**. Ao integrar conceitos do MIT CISR, McKinsey, SFIA, NIST e ADKAR — e estender o modelo com dimensões de plataforma, receita, tipos de IA e eficácia nas três lentes do MIT — o sistema oferece visão holística das capacidades organizacionais e um caminho até especificação técnica.

### 11.2 Contribuições

1. **Modelo Multidimensional Dual**: **Blueprint 16** (108 perguntas, visão enterprise/MIT) e **SATF TI v3** (70 perguntas, visão TI/engenharia com evidência obrigatória e certificação)
2. **Métricas Quantitativas**: Fórmulas objetivas para score de maturidade, consolidação multiavaliador e relevância de produto (bloco agêntico + verticais)
3. **Transformação Agêntica**: Avaliação estruturada de prontidão para **Multi-Agent Systems** no nível de produto (8 universais + 12 verticais)
4. **Projeções Financeiras**: Correlação entre maturidade e ROI baseada em evidências de mercado
5. **Benchmarking**: Capacidade de comparação setorial e identificação de gaps
6. **Da avaliação à entrega**: Módulo de **especificação automática**, exportação multi-formato e arquitetura multi-provedor de IA generativa
7. **Operacionalização do diagnóstico**: Convites, fluxo restrito de avaliador, respostas "sem informação", matriz Cargo × Dimensão, análise comparativa e geração assíncrona de relatórios IA
8. **Unidades organizacionais**: Diagnóstico e books por unidade, consolidado com home/governadas e Biblioteca com escopo Geral × unidade
9. **Assistente Agentica**: Copiloto com RAG, modos de pergunta, fontes clicáveis, feedback e permissões finas por unidade

### 11.3 Limitações e Trabalhos Futuros

- Necessidade de validação empírica com amostra ampla de organizações
- Calibração das projeções financeiras com dados longitudinais
- Extensão para novos domínios verticais
- Integração com ferramentas de monitoramento contínuo

### 11.4 Implicações Práticas

O Blueprint IA permite às organizações:

1. **Diagnosticar** seu estado atual de maturidade em IA
2. **Identificar** gaps críticos e áreas de melhoria
3. **Priorizar** investimentos com base em potencial de retorno
4. **Planejar** roadmaps de evolução estruturados
5. **Acompanhar** progresso através de avaliações periódicas
6. **Comparar** performance com benchmarks do mercado

---

## Referências

1. Weill, P., Woerner, S. L., & Sebastian, I. M. (2024). *Enterprise AI: From Experimentation to Transformation*. MIT CISR Research Briefing.

2. McKinsey Global Institute. (2023). *The Economic Potential of Generative AI: The Next Productivity Frontier*.

3. National Institute of Standards and Technology. (2023). *Artificial Intelligence Risk Management Framework (AI RMF 1.0)*. NIST AI 100-1.

4. SFIA Foundation. (2021). *Skills Framework for the Information Age Version 8*.

5. Prosci. (2018). *ADKAR: A Model for Change in Business, Government and Our Community*.

6. Gartner. (2023). *AI Maturity Model: From Hype to Reality in Enterprise AI*.

7. Gartner. (2024). *Data and Analytics Leadership Vision for 2024*.

8. BCG Henderson Institute. (2023). *How to Create Value with AI at Scale*.

9. Harvard Business Review. (2024). *The Multi-Agent Future of Enterprise AI*.

10. MIT Sloan Management Review. (2023). *Winning with AI is a Leadership Issue*.

---

## Anexos

### Anexo A: Questionário Blueprint 16

*[Manual completo: 108 perguntas em 16 dimensões — ver `docs/PERGUNTAS_BLUEPRINT_COMPLETO.md` e o seed da aplicação]*

### Anexo A2: Questionário SATF TI v3

*[70 perguntas em 11 dimensões — ver `backend/src/data/satfFrameworkSeed.js`, critérios em `satfPerguntaCriterios.js` e fundamentação em `docs/Atual/Fundamentacao_SATF_IA_Maturidade_TI_SATF.docx`]*

**Dimensões e guias de progressão SATF** (11 documentos):

- `docs/Atual/Dimensoes_Evolucao_SAT/Guia_Progressao_SATF_D01` … `D11`

### Anexo B: Questionário de Transformação Agêntica e Verticais

*[8 perguntas universais + 72 perguntas em 12 verticais (6 por vertical); total 80 por avaliação de produto]*

### Anexo C: Modelo de Relatório Executivo e Especificações

*[Relatórios MIT/MIT completo, executivo, biblioteca de IA e documentos gerados pelo Módulo 3 — templates produzidos pela plataforma]*

---

**Blueprint IA** — *Transformando empresas com Inteligência Artificial*

**SysMap Solutions** © 2024-2026

---

*Documento atualizado em: Julho de 2026*
*Versão: 2.7*

---

### Nota de Atualização (v2.7)

Esta versão documenta a **operação por unidades organizacionais** e o **Assistente Agentica** (Jul/2026):

1. **Unidades** (`EmpresaUnidade`): home do usuário, unidades governadas (peso 0,5 no consolidado) e filtros de diagnóstico por unidade
2. **Relatórios Geral × por unidade**: tipos `book_unidade*`, `executivo_unidade` e variantes SATF; snapshot com metadados de unidade
3. **Biblioteca IA**: badge e filtro de escopo (Geral ou Por unidade · nome)
4. **Assistente Agentica**: RAG (manual, tese, contexto, books), modos, fontes clicáveis, ações, feedback 👍/👎 e permissões finas (home ∪ governadas; `admin`/`sysmap` sem restrição de unidade)
5. **Glossário/fatos canônicos** no contexto do projeto (prioridade sobre anexos) permanece como reforço de qualidade factual dos books

### Nota de Atualização (v2.6)

Esta versão documenta o **isolamento taxonômico SATF** em relatórios e books gerados por IA (Jul/2026):

1. **Pipeline dedicado SATF**: `satfBookIA.js`, `satfRelatorioExecutivoIA.js`, `satfBookTaxonomia.js` — sem reutilização de prompts/blocos MIT CISR do Blueprint 16
2. **Executivo SATF**: tipo `executivo` com 5 seções para CTO/engenharia (distinto do executivo C-Level Blueprint)
3. **Validação pós-geração**: `validarTaxonomiaBookSatf`; cache condicional; campo `avisoTaxonomia` na API
4. **UI e exportação**: labels SATF no dashboard, alerta de contaminação, Word/MD/ZIP com metadados SATF (`exportRelatorioFrameworkMeta.js`)
5. **Desejos IA** integrados na Seção 3 dos books; regeneração obrigatória de artefatos SATF antigos contaminados

### Nota de Atualização (v2.5)

Esta versão documenta o **instrumento SATF TI v3** como segunda opção de avaliação de maturidade na plataforma:

1. **Seleção por projeto**: Blueprint 16 ou SATF TI v3 (mutuamente exclusivos; travados após 1ª resposta)
2. **SATF**: 11 dimensões, 70 perguntas, evidência obrigatória (≥ 4), teto N3, certificação consultiva, setor regulado
3. **D10 Fábrica Agêntica**: score próprio, fora da média geral
4. **Escala N1–N5** SysMap, books `completo_satf` e guias em `Dimensoes_Evolucao_SAT/`

### Nota de Atualização (v2.4)

Esta versão alinha o texto da tese ao **funcionamento atual** da plataforma Blueprint IA / Blueprint Agêntico:

1. **Maturidade empresarial**: **16 dimensões** e **108 perguntas** (inclui Plataforma e Industrialização, IA como Gerador de Receita, Maturidade por Tipo de IA e Eficácia MIT CISR), com pesos atualizados na Seção 3.2
2. **Arquitetura em três módulos**: maturidade organizacional, produtos IA-first e **especificação automática**
3. **Produto IA-First**: **12 verticais** com **6 perguntas** por vertical (72) + **8** universais (**80** perguntas por avaliação); correção da fórmula agregada das verticais
4. **Plataforma**: mantém **multi-provedor** (Anthropic, OpenAI, Groq), **exportação** Markdown/Word/PDF e **Configurações de IA** no painel administrativo
5. **Operação de avaliações**: inclui entrada restrita para avaliadores, magic link sem senha em convites de maturidade, convites reaproveitáveis com segurança, resposta "sem informação", esclarecimentos enriquecidos por pergunta, revisão final e análise comparativa por dimensão
6. **Acompanhamento e auditoria**: registra eventos de convite, abertura, início, salvamento e finalização, com alertas de qualidade e filtros operacionais para adesão
7. **Dashboards executivos**: adiciona prontidão executiva e comparativo por empresa para priorização por projeto
8. **Relatórios IA**: geração sempre em background para relatórios longos, com biblioteca versionada, filtros de prioridade e exportações executivas
9. **Aplicativo mobile**: documentação do app Blueprint IA Avaliador, seu escopo, arquitetura Expo/React Native e integração com a API do sistema

As notas v2.1, v2.2 e v2.3 permanecem válidas como funcionalidades de base; a v2.4 consolida a narrativa acadêmica com o funcionamento operacional atual.

Para o tratamento monográfico longo, consulte a **Tese Acadêmica do Blueprint Agêntico** (`docs/TESE_BLUEPRINT_AGENTICO_ACADEMICA.md`).

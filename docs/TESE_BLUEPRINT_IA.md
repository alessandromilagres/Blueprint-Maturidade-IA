# Blueprint IA: Um Framework Sistêmico para Avaliação de Maturidade em Inteligência Artificial Corporativa

**SysMap Solutions**

---

## Resumo

Este documento apresenta o **Blueprint IA** (também referido como **Blueprint Agêntico** na documentação metodológica completa), um framework e uma plataforma para avaliação sistemática da maturidade em Inteligência Artificial (IA) em organizações empresariais e para especificação técnica de produtos de IA. O sistema fundamenta-se no modelo MIT CISR Enterprise AI Maturity (Weill, Woerner & Sebastian, 2024) e incorpora conceitos de frameworks reconhecidos como McKinsey Value Creation, SFIA, NIST AI RMF e ADKAR/Prosci.

A proposta organiza-se em **três módulos integrados**: (1) **Avaliação de Maturidade Empresarial**, com **16 dimensões** e **108 perguntas** estruturadas — incluindo dimensões de plataforma e industrialização, IA como gerador de receita, maturidade por tipo de IA (analítica, generativa, agêntica, robótica) e eficácia de IA nas três lentes do MIT CISR (operações, experiência do cliente, ecossistema); (2) **Avaliação de Produtos IA-First**, com 8 perguntas universais de Transformação Agêntica e **12 verticais setoriais** com 6 perguntas cada (72 perguntas verticais), totalizando **80 perguntas** por avaliação de produto; e (3) **Especificação Automática**, que gera documentação de produto e engenharia (por exemplo PRD, requisitos, arquitetura e blueprint de construção) com apoio de IA generativa e **arquitetura multi-provedor** (Anthropic, OpenAI, Groq), com **exportação** de relatórios em Markdown, Word e PDF.

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
1. Estruturar um modelo de avaliação multidimensional baseado em frameworks acadêmicos consolidados, com **16 dimensões** alinhadas ao estágio de maturidade MIT CISR e extensões de plataforma, receita, tipos de IA e eficácia
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
│  MÓDULO 1: MATURIDADE EMPRESARIAL                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  16 Dimensões (108 perguntas)                                ││
│  │  Bloco fundacional (1–12): estratégia, dados, governança,    ││
│  │  pessoas, operações, inovação, valor/ROI, ecossistema,       ││
│  │  valor por BU, talentos, conformidade, mudança               ││
│  │  Extensões MIT / plataforma (13–16): plataforma e            ││
│  │  industrialização, IA como receita, tipos de IA, eficácia    ││
│  │  (operações, cliente, ecossistema)                           ││
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
- **Seleção de Áreas**: Cada avaliador escolhe quais dimensões tem conhecimento para responder
- **Consolidação**: Sistema calcula médias ponderadas considerando todos os avaliadores

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

### 5.3 Classificação dos Níveis de Maturidade

A partir do score geral, a organização é classificada em um dos cinco níveis:

| Faixa de Score | Nível | Classificação | Descrição |
|----------------|-------|---------------|-----------|
| 1.00 - 1.49 | Inicial | Iniciante | Organização sem estratégia formal de IA |
| 1.50 - 2.49 | Oportunista | Básico | Projetos isolados, sem governança |
| 2.50 - 3.49 | Estruturado | Intermediário | Governança definida, processos em evolução |
| 3.50 - 4.49 | Gerenciado | Avançado | IA integrada, métricas consistentes |
| 4.50 - 5.00 | Otimizado | Expert | IA como core do negócio, inovação contínua |

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

O funcionamento pode ser resumido em nove etapas:

1. **Configuração inicial**: administradores cadastram empresas, usuários, projetos, produtos, custos de referência e provedores de IA.
2. **Planejamento da avaliação**: o sistema sugere dimensões de avaliação a partir do cargo do avaliador, usando a matriz Cargo × Dimensão, mas permite ajuste manual.
3. **Convite e resposta**: avaliadores recebem convite por e-mail/link/QR Code, podem acessar avaliações de maturidade por magic link sem senha e respondem perguntas com escala de 1 a 5, podendo marcar "sem informação" quando não têm evidência suficiente.
4. **Acompanhamento operacional**: gestores acompanham link enviado, link aberto, avaliação iniciada, progresso salvo, finalização, lembretes e alertas de qualidade.
5. **Consolidação**: o motor de scoring calcula progresso, score por dimensão, score geral ponderado e recortes por avaliador, projeto, produto e empresa.
6. **Análise comparativa**: a tela de análise de avaliações permite comparar avaliadores finalizados por dimensão, identificar divergências e observar critérios escolhidos.
7. **Dashboards executivos**: painéis de prontidão e comparativo por empresa apoiam priorização por score, conclusão, riscos e potencial de escala.
8. **Relatórios e biblioteca IA**: relatórios estratégicos e books completos são gerados em background, salvos em biblioteca versionada e exportados em Markdown, Word ou PDF.
9. **Especificação e execução**: a partir do diagnóstico e dos dados do produto, o módulo de especificação automática gera PRD, requisitos, arquitetura, cronograma, custos e blueprint de construção.

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

Cada projeto pode ter múltiplos avaliadores. O convite define o projeto, o avaliador e as dimensões esperadas. A seleção de áreas pode ser manual ou sugerida pela matriz Cargo × Dimensão. Por exemplo, cargos de tecnologia tendem a receber dimensões como Dados e Tecnologia, Plataforma, Governança de Sistemas e Ecossistema; perfis executivos recebem um conjunto mais amplo de dimensões estratégicas.

Convites de maturidade usam um fluxo de acesso simplificado: o link recebido por e-mail ou QR Code chama a API pública de validação do convite, cria ou reutiliza a avaliação do respondente, gera uma sessão JWT e redireciona diretamente para a tela de resposta. O fluxo mantém autorização no backend, impede uso por usuário inativo e registra eventos de abertura e início da avaliação.

Durante a resposta, cada pergunta exibe:

- Critérios objetivos de pontuação de 1 a 5
- Esclarecimento enriquecido sobre o que a pergunta avalia
- Exemplos por vertical de negócio
- Campo de observações
- Opção "sem informação", que conta como pergunta tratada no progresso, mas não entra no score

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

### 10.8 Arquitetura Técnica Resumida

| Camada | Tecnologia / Função |
|--------|----------------------|
| Frontend | React, Vite, TailwindCSS, React Router |
| Aplicativo mobile | Expo, React Native, AsyncStorage |
| Backend | Node.js, Express, Prisma |
| Banco de dados | PostgreSQL em produção |
| IA generativa | Provedores configuráveis: Anthropic, OpenAI e Groq |
| Autenticação | JWT e rotas protegidas por perfil |
| Auditoria operacional | Eventos de convite, abertura, início, salvamento e finalização |
| Deploy | Azure DevOps, Docker/Docker Compose, Nginx/HTTPS |
| Exportação | Markdown, Word e PDF |

### 10.9 Artefatos Gerados

Ao final de um ciclo, a organização pode obter:

- Dashboard executivo de maturidade
- Dashboard de prontidão executiva
- Comparativo executivo por empresa
- Score consolidado por empresa, projeto, produto, dimensão e avaliador
- Trilha operacional de avaliadores e alertas de qualidade
- Relatório estratégico C-Level
- Book completo de maturidade em IA
- Análise comparativa de avaliações por dimensão
- Relatórios exportáveis em Word, Markdown e PDF
- Especificações técnicas de produto IA-First
- Biblioteca histórica de relatórios IA versionados

---

## 11. Conclusões

### 11.1 Síntese

O **Blueprint IA** apresenta um framework e uma plataforma robustos, cientificamente fundamentados, para avaliação de maturidade em Inteligência Artificial e para **relevância de produtos IA-First**. Ao integrar conceitos do MIT CISR, McKinsey, SFIA, NIST e ADKAR — e estender o modelo com dimensões de plataforma, receita, tipos de IA e eficácia nas três lentes do MIT — o sistema oferece visão holística das capacidades organizacionais e um caminho até especificação técnica.

### 11.2 Contribuições

1. **Modelo Multidimensional**: **16 dimensões** e **108 perguntas** cobrindo aspectos técnicos, organizacionais, culturais, de plataforma e de eficácia em IA
2. **Métricas Quantitativas**: Fórmulas objetivas para score de maturidade, consolidação multiavaliador e relevância de produto (bloco agêntico + verticais)
3. **Transformação Agêntica**: Avaliação estruturada de prontidão para **Multi-Agent Systems** no nível de produto (8 universais + 12 verticais)
4. **Projeções Financeiras**: Correlação entre maturidade e ROI baseada em evidências de mercado
5. **Benchmarking**: Capacidade de comparação setorial e identificação de gaps
6. **Da avaliação à entrega**: Módulo de **especificação automática**, exportação multi-formato e arquitetura multi-provedor de IA generativa
7. **Operacionalização do diagnóstico**: Convites, fluxo restrito de avaliador, respostas "sem informação", matriz Cargo × Dimensão, análise comparativa e geração assíncrona de relatórios IA

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

### Anexo A: Questionário Completo por Dimensão

*[Manual completo: 108 perguntas em 16 dimensões — ver `docs/PERGUNTAS_BLUEPRINT_COMPLETO.md` e o seed da aplicação]*

### Anexo B: Questionário de Transformação Agêntica e Verticais

*[8 perguntas universais + 72 perguntas em 12 verticais (6 por vertical); total 80 por avaliação de produto]*

### Anexo C: Modelo de Relatório Executivo e Especificações

*[Relatórios MIT/MIT completo, executivo, biblioteca de IA e documentos gerados pelo Módulo 3 — templates produzidos pela plataforma]*

---

**Blueprint IA** — *Transformando empresas com Inteligência Artificial*

**SysMap Solutions** © 2024-2026

---

*Documento atualizado em: Junho de 2026*
*Versão: 2.4*

---

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

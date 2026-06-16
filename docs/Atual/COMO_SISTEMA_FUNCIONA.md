# Como o Sistema Blueprint IA Funciona

**Versão:** Junho/2026
**Produto:** Blueprint IA / Blueprint Agêntico
**Objetivo:** explicar o funcionamento operacional da plataforma, da configuração inicial à geração de relatórios e especificações.

---

## 1. Visão Geral

O Blueprint IA é uma plataforma web para avaliar maturidade em Inteligência Artificial, analisar produtos IA-First, gerar relatórios executivos com IA e transformar diagnósticos em especificações técnicas.

Na prática, o sistema conecta quatro fluxos:

1. **Diagnóstico de maturidade organizacional**
2. **Avaliação de produtos IA-First**
3. **Relatórios e books gerados por IA**
4. **Especificação automática para execução de produtos**

---

## 2. Principais Papéis

| Papel | O que faz |
|------|-----------|
| Administrador | Configura usuários, empresas, projetos, IA, custos, templates e parâmetros gerais |
| Consultor/Gestor | Cria projetos, convida avaliadores, acompanha dashboards e analisa resultados |
| Avaliador | Responde avaliações de maturidade ou produto a partir de convites |
| Executivo | Consome relatórios, dashboards, recomendações e exportações |

O perfil **avaliador** tem acesso restrito: ao entrar no sistema, é direcionado para sua tela de entrada e só consegue acessar avaliações pendentes, avaliações de produto e páginas de conclusão.

---

## 3. Fluxo de Maturidade Empresarial

### 3.1 Cadastro e Preparação

O administrador ou gestor cadastra:

- Empresa
- Usuários e seus perfis
- Projetos de avaliação
- Produtos vinculados aos projetos
- Custos e parâmetros financeiros
- Provedor de IA e chaves de API
- Templates de e-mail e convites

### 3.2 Convite de Avaliadores

Ao convidar um avaliador para um projeto, o sistema permite selecionar as dimensões que ele deve responder. Para reduzir ruído, a plataforma usa uma **matriz Cargo × Dimensão** para sugerir automaticamente áreas compatíveis com o cargo do avaliador.

Exemplos:

- Perfis executivos recebem dimensões estratégicas, governança, ROI e mudança.
- Perfis técnicos recebem dados, tecnologia, plataforma, governança de sistemas e ecossistema.
- Perfis de RH recebem talentos, cultura, conformidade e prontidão para mudança.

O gestor pode aceitar ou ajustar as sugestões antes de enviar o convite.

### 3.3 Resposta da Avaliação

O avaliador responde perguntas em escala de 1 a 5. Cada pergunta apresenta:

- Texto da pergunta
- Critérios de pontuação
- Esclarecimento sobre o que a pergunta avalia
- Exemplos por vertical de negócio
- Campo de observações
- Opção **sem informação**

A opção **sem informação** é usada quando o avaliador não tem evidência suficiente para responder. Ela conta para o progresso da avaliação, mas não entra no cálculo do score.

### 3.4 Consolidação

Quando as avaliações são finalizadas, o sistema calcula:

- Progresso por avaliador
- Score por dimensão
- Score geral ponderado
- Nível de maturidade
- Consolidação multiavaliador
- Comparativos por projeto, empresa e produto

As áreas recusadas ou não selecionadas por um avaliador não distorcem o score.

---

## 4. Análise de Avaliações

A tela **Análise de Avaliações** permite comparar avaliações finalizadas de um projeto.

Ela mostra:

- Avaliadores finalizados
- Resumo de respostas com nota, sem informação e pendentes
- Score consolidado das avaliações selecionadas
- Score por dimensão
- Respostas e critérios escolhidos por pergunta

Esse fluxo ajuda a identificar divergências entre avaliadores, dimensões com baixa maturidade e pontos que exigem alinhamento antes do relatório executivo.

---

## 5. Dashboards

O sistema possui dashboards por diferentes níveis:

- **Empresa**: visão consolidada de projetos, produtos e maturidade
- **Projeto**: avaliação de maturidade, avaliadores, financeiro, produtos e relatórios
- **Produto**: avaliação IA-First, relevância agêntica e especificação
- **Usuários**: perfis, convites e permissões

Os dashboards combinam dados operacionais, scores e projeções para apoiar decisões de priorização.

---

## 6. Relatórios Gerados por IA

### 6.1 Tipos de Relatório

A plataforma gera:

- Relatório estratégico C-Level
- Book completo de maturidade em IA
- Book em modo rápido
- Relatórios executivos e exportações tradicionais
- Documentos técnicos de especificação

### 6.2 Geração em Background

Relatórios de IA são extensos e podem demorar. Por isso, a geração ocorre em **background**.

O fluxo é:

1. Usuário solicita a geração
2. Sistema cria um job
3. Backend executa a chamada longa de IA
4. Interface acompanha status e progresso
5. Relatório é salvo na biblioteca
6. Usuário abre a versão salva e exporta quando necessário

Esse modelo evita timeout no navegador, preserva versões e permite relatórios multi-chunk.

### 6.3 Biblioteca de IA

Todo relatório gerado por IA pode ser salvo com:

- Projeto
- Tipo de relatório
- Versão
- Provedor/modelo
- Tokens
- Data de geração
- Snapshot dos dados usados

Isso permite rastreabilidade e comparação entre versões.

---

## 7. Avaliação de Produtos IA-First

O módulo de produtos avalia se uma solução está preparada para operar no paradigma IA-First e agêntico.

A avaliação combina:

- **8 perguntas universais** de Transformação Agêntica
- **12 verticais setoriais** com 6 perguntas cada

O score final combina prontidão agêntica, impacto em ROI, automação, integração, escalabilidade, governança e aderência setorial.

---

## 8. Especificação Automática

A partir do cadastro do produto, avaliações e documentos de referência, o sistema pode gerar:

- PRD
- Requisitos funcionais
- Requisitos não funcionais
- Arquitetura técnica
- Cronograma
- Estimativas de esforço e custo
- Blueprint de construção

O processamento roda em background quando necessário e pode usar arquivos de referência selecionados pelo usuário.

---

## 9. Configurações de IA

Administradores podem configurar provedores de IA:

- Anthropic
- OpenAI
- Groq

As configurações são persistidas no banco de dados com proteção, evitando perda de chaves após deploy ou reinício. A tela de configuração permite salvar e testar provedores separadamente.

---

## 10. Exportações

O sistema exporta conteúdos em:

- Markdown
- Word
- PDF/impressão

Exportações de avaliação usam o score da avaliação correta do respondente e recalculam resultados quando necessário a partir das respostas.

---

## 11. Arquitetura Técnica

| Camada | Descrição |
|--------|-----------|
| Frontend | React, Vite, TailwindCSS e React Router |
| Backend | Node.js, Express e Prisma |
| Banco | PostgreSQL em produção |
| Autenticação | JWT e rotas protegidas por perfil |
| IA | Provedores configuráveis e geração com continuação quando necessário |
| Deploy | Azure DevOps, Docker/Docker Compose, Nginx e HTTPS |

---

## 12. Fluxo Resumido Ponta a Ponta

```text
Empresa/Projeto
      ↓
Cadastro de usuários e avaliadores
      ↓
Sugestão de dimensões por cargo
      ↓
Convite por e-mail/link
      ↓
Resposta da avaliação
      ↓
Consolidação de scores
      ↓
Dashboards e análise por dimensão
      ↓
Relatórios IA em background
      ↓
Biblioteca/versionamento/exportação
      ↓
Especificação automática de produto
```

---

## 13. Resultado Esperado

Ao usar o Blueprint IA, a organização sai de uma avaliação subjetiva e fragmentada para um processo estruturado, rastreável e acionável. O sistema mostra onde a empresa está, quais dimensões precisam evoluir, quais produtos têm maior potencial IA-First e quais documentos devem orientar a execução.

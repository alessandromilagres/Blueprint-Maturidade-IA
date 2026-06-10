# Como o Sistema Blueprint IA Funciona

**Versão:** Junho/2026
**Produto:** Blueprint IA / Blueprint Agêntico
**Objetivo:** explicar o funcionamento operacional da plataforma, da configuração inicial à geração de relatórios, acompanhamento de avaliadores e especificações.

---

## 1. Visão Geral

O Blueprint IA é uma plataforma web para avaliar maturidade em Inteligência Artificial, analisar produtos IA-First, gerar relatórios executivos com IA e transformar diagnósticos em especificações técnicas.

Na prática, o sistema conecta seis fluxos:

1. **Diagnóstico de maturidade organizacional**
2. **Avaliação de produtos IA-First**
3. **Relatórios e books gerados por IA**
4. **Especificação automática para execução de produtos**
5. **Aplicativo mobile do avaliador**
6. **Acompanhamento executivo e auditoria operacional**

---

## 2. Principais Papéis

| Papel | O que faz |
|------|-----------|
| Administrador | Configura usuários, empresas, projetos, IA, custos, templates e parâmetros gerais |
| Consultor/Gestor | Cria projetos, convida avaliadores, acompanha dashboards e analisa resultados |
| Avaliador | Responde avaliações de maturidade ou produto a partir de convites |
| Executivo | Consome relatórios, dashboards, recomendações e exportações |

O perfil **avaliador** tem acesso restrito: ao entrar no sistema web, é direcionado para sua lista de avaliações e só consegue acessar avaliações pendentes, avaliações de produto e páginas de conclusão. Quando usa o aplicativo mobile, o avaliador acessa o mesmo backend e as mesmas regras de autorização, mas em uma experiência simplificada para celular.

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

Convites de maturidade usam **magic link**: o avaliador pode abrir o link recebido por e-mail, ou o QR Code associado, e acessar diretamente a avaliação sem digitar senha. O backend valida o token do convite, cria ou reutiliza a avaliação vinculada ao avaliador, gera uma sessão JWT e redireciona para a tela correta. Convites de produto continuam usando o fluxo autenticado tradicional.

Quando o convite é enviado, aberto ou usado para iniciar a avaliação, o sistema registra eventos operacionais para acompanhamento e auditoria.

### 3.3 Resposta da Avaliação

O avaliador responde perguntas em escala de 1 a 5. Cada pergunta apresenta:

- Texto da pergunta
- Critérios de pontuação
- Esclarecimento sobre o que a pergunta avalia
- Exemplos por vertical de negócio
- Campo de observações
- Opção **sem informação**

A opção **sem informação** é usada quando o avaliador não tem evidência suficiente para responder. Ela conta para o progresso da avaliação, mas não entra no cálculo do score.

Antes de finalizar, a tela apresenta uma revisão com:

- Total respondido e percentual de progresso
- Perguntas pendentes
- Quantidade de respostas marcadas como sem informação
- Grupos/dimensões recusados
- Confirmação explícita antes de bloquear a edição

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

## 5. Acompanhamento de Avaliadores

A tela de acompanhamento permite ao gestor operar a adesão da avaliação em tempo real. Ela combina dados de convite, avaliação, lembretes e auditoria de eventos.

O painel mostra:

- Avaliadores por status: convite pendente, não iniciado, em andamento, pronto para finalizar e finalizado
- Indicadores de link enviado, link aberto e avaliação iniciada
- Casos em que o avaliador abriu o link, mas ainda não iniciou a resposta
- Progresso médio do projeto
- Filtros rápidos para pendentes, alertas de qualidade, lembretes, não abriu e abriu sem iniciar
- Ação contextual de lembrete ou reenvio de link
- Trilha recente do avaliador, incluindo convite enviado, link aberto, avaliação iniciada, progresso salvo e finalização

### 5.1 Auditoria e Qualidade

O backend mantém uma tabela operacional `AvaliacaoEvento` para registrar eventos do fluxo de avaliação. Essa trilha não substitui logs técnicos, mas ajuda o gestor a entender onde a adesão está travando.

Além disso, o sistema calcula alertas de qualidade:

- Respostas com a mesma nota em sequência
- Conclusão rápida demais
- Muitas marcações "sem informação"
- Notas extremas sem observação/evidência
- "Sem informação" sem contexto

Esses alertas ajudam a separar problemas reais de maturidade de problemas de qualidade de resposta.

---

## 6. Dashboards

O sistema possui dashboards por diferentes níveis:

- **Empresa**: visão consolidada de projetos, produtos e maturidade
- **Projeto**: avaliação de maturidade, avaliadores, financeiro, produtos e relatórios
- **Produto**: avaliação IA-First, relevância agêntica e especificação
- **Usuários**: perfis, convites e permissões
- **Prontidão Executiva**: índice agregado de prontidão por projeto, combinando score e conclusão
- **Comparativo por Empresa**: comparação lado a lado de projetos por prontidão, maturidade, conclusão e riscos

Os dashboards combinam dados operacionais, scores e projeções para apoiar decisões de priorização.

O comparativo por empresa pode ser exportado em CSV ou impresso como PDF pelo navegador.

---

## 7. Relatórios Gerados por IA

### 7.1 Tipos de Relatório

A plataforma gera:

- Relatório estratégico C-Level
- Book completo de maturidade em IA
- Book em modo rápido
- Relatórios executivos e exportações tradicionais
- Documentos técnicos de especificação

### 7.2 Geração em Background

Relatórios de IA são extensos e podem demorar. Por isso, a geração ocorre em **background**.

O fluxo é:

1. Usuário solicita a geração
2. Sistema cria um job
3. Backend executa a chamada longa de IA
4. Interface acompanha status e progresso
5. Relatório é salvo na biblioteca
6. Usuário abre a versão salva e exporta quando necessário

Esse modelo evita timeout no navegador, preserva versões e permite relatórios multi-chunk.

### 7.3 Biblioteca de IA

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

## 8. Avaliação de Produtos IA-First

O módulo de produtos avalia se uma solução está preparada para operar no paradigma IA-First e agêntico.

A avaliação combina:

- **8 perguntas universais** de Transformação Agêntica
- **12 verticais setoriais** com 6 perguntas cada

O score final combina prontidão agêntica, impacto em ROI, automação, integração, escalabilidade, governança e aderência setorial.

---

## 9. Especificação Automática

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

## 10. Configurações de IA

Administradores podem configurar provedores de IA:

- Anthropic
- OpenAI
- Groq

As configurações são persistidas no banco de dados com proteção, evitando perda de chaves após deploy ou reinício. A tela de configuração permite salvar e testar provedores separadamente.

---

## 11. Exportações

O sistema exporta conteúdos em:

- Markdown
- Word
- PDF/impressão

Exportações de avaliação usam o score da avaliação correta do respondente e recalculam resultados quando necessário a partir das respostas.

---

## 12. Aplicativo Mobile do Avaliador

O Blueprint IA também possui um aplicativo mobile dedicado ao avaliador: **Blueprint IA Avaliador**. Ele foi criado para reduzir atrito no preenchimento das avaliações e permitir que executivos, gestores e especialistas respondam pelo celular sem navegar por áreas administrativas do sistema.

### 12.1 Escopo do Aplicativo

O aplicativo mobile cobre apenas a jornada do avaliador:

- Login com as mesmas credenciais do Blueprint IA
- Persistência segura do token no dispositivo
- Listagem de avaliações pendentes
- Resposta de avaliação de maturidade por projeto
- Resposta de avaliação de produto IA-First
- Marcação de área recusada quando o avaliador não está apto a responder uma dimensão
- Marcação "não tenho informação suficiente" em perguntas de maturidade
- Salvamento parcial de progresso
- Finalização da avaliação

Administração, cadastro de empresas, criação de projetos, envio de convites, dashboards, relatórios, biblioteca de IA e configurações continuam no sistema web.

### 12.2 Como o App se Conecta ao Sistema

O app é construído em **Expo / React Native** e consome a API do backend Node/Express. A URL da API é configurada por ambiente:

```text
EXPO_PUBLIC_API_URL=https://agentica.sysmap.com.br/api
```

Em desenvolvimento, pode apontar para a máquina local:

```text
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3001/api
```

No simulador iOS, `http://localhost:3001/api` costuma funcionar. No emulador Android, normalmente usa-se `http://10.0.2.2:3001/api`.

### 12.3 Fluxo no Aplicativo

```text
Login do avaliador
      ↓
Token salvo no AsyncStorage
      ↓
Lista de avaliações pendentes
      ↓
Escolha de avaliação de maturidade ou produto
      ↓
Resposta, observações e salvamento parcial
      ↓
Finalização
      ↓
Backend atualiza scores, progresso e dashboards web
```

### 12.4 Relação com QR Code e Convites

Os convites enviados pelo sistema web podem incluir QR Code para abrir a avaliação pelo celular. Para avaliações de maturidade, o link web usa magic link e pode iniciar uma sessão sem senha. Quando houver distribuição/publicação do app, o mesmo fluxo pode evoluir para deep link usando o scheme `blueprintavaliador`.

### 12.5 Limites Atuais

O app mobile é intencionalmente enxuto. Ele não substitui o sistema web e não contempla:

- Gestão administrativa
- Criação ou edição de projetos
- Cadastro de usuários
- Envio de convites
- Geração de relatórios IA
- Exportações
- Configurações de provedores de IA

---

## 13. Arquitetura Técnica

| Camada | Descrição |
|--------|-----------|
| Frontend | React, Vite, TailwindCSS e React Router |
| Aplicativo mobile | Expo, React Native e AsyncStorage |
| Backend | Node.js, Express e Prisma |
| Banco | PostgreSQL em produção |
| Autenticação | JWT e rotas protegidas por perfil |
| Auditoria operacional | Eventos `AvaliacaoEvento` para convite, abertura, início, salvamento e finalização |
| IA | Provedores configuráveis e geração com continuação quando necessário |
| Deploy | Azure DevOps, Docker/Docker Compose, Nginx e HTTPS |

---

## 14. Fluxo Resumido Ponta a Ponta

```text
Empresa/Projeto
      ↓
Cadastro de usuários e avaliadores
      ↓
Sugestão de dimensões por cargo
      ↓
Convite por e-mail/link/QR Code
      ↓
Magic link, login ou app mobile
      ↓
Resposta, salvamento parcial e revisão final
      ↓
Consolidação de scores
      ↓
Auditoria, acompanhamento e alertas de qualidade
      ↓
Dashboards, prontidão executiva e comparativo por empresa
      ↓
Relatórios IA em background
      ↓
Biblioteca/versionamento/exportação
      ↓
Especificação automática de produto
```

---

## 15. Resultado Esperado

Ao usar o Blueprint IA, a organização sai de uma avaliação subjetiva e fragmentada para um processo estruturado, rastreável e acionável. O sistema mostra onde a empresa está, quais dimensões precisam evoluir, quais produtos têm maior potencial IA-First e quais documentos devem orientar a execução.

# Manual rápido — Agentica / Blueprint IA (SysMap)

Assistente de uso do sistema. Respostas devem orientar o usuário a telas e fluxos reais.

## Produto

- **Agentica** (Blueprint IA): plataforma SysMap para maturidade em IA, avaliação de produtos IA-First e especificação com IA.
- Frameworks por projeto: **Blueprint 16** (enterprise/C-Level, 16 dims) ou **SATF TI v3** (TI/engenharia, 11 dims D1–D11).
- Consultoria = **SysMap Solutions**. MIT CISR = referência/benchmark, não autoria.

## Cadastros principais

1. **Empresas** (`/empresas`) — cliente, unidades organizacionais, logo.
2. **Projetos** (`/projetos`) — assessment vinculado a uma empresa; escolha do framework; versões.
3. **Usuários** (`/usuarios`) — perfis (admin, gestor, avaliador, etc.); unidade; unidades governadas (gestor multi-unidade).
4. **Avaliações** (`/avaliacoes`) — questionário Likert por dimensão; convites / magic link.

## Fluxo típico de maturidade

1. Criar empresa → unidades (se book por unidade).
2. Criar projeto → definir framework (Blueprint ou SATF).
3. (Opcional) Configurar dimensões ativas/peso no projeto.
4. Convidar avaliadores e acompanhar progresso.
5. Finalizar avaliações → ver dashboard do projeto.
6. (SATF) Certificar dimensões no consultor (`/projetos/:id/certificacao`).
7. Cadastrar **contexto do cliente** (glossário de fatos, anexos A–H) na ficha do projeto.
8. Gerar relatório executivo ou **book** (geral ou por unidade) → Biblioteca IA.

## Versionamento de projetos

- Em **Projeto** → versões: criar, fechar (checklist), reabrir, comparar evolução.
- Dashboard e exports podem filtrar por `versaoId`.
- Fechar versão consolida snapshot; reabrir permite ajustes controlados.

## Books e relatórios IA

- Relatório executivo e book completo: a partir do projeto / menu de relatórios.
- **Book por unidade**: escopo = dimensões de foco da unidade; score geral = só essas dims (não o composto enterprise).
- Biblioteca: `/biblioteca-ia` — histórico de gerações.
- Jobs longos: progresso por polling; não cancelar o browser no meio sem necessidade.
- Configuração de provedor (Anthropic/OpenAI/Groq): `/configuracoes/ia` (admin).
- **Assistente Agentica:** com projeto selecionado, a busca (RAG) inclui os **relatórios IA mais recentes por tipo** daquele projeto (books/executivos), com índice incremental ao gerar um novo relatório.

## Contexto do projeto (crítico para qualidade da IA)

- Na ficha do projeto: características, URLs, **glossário de fatos canônicos**, uploads (MD/PDF/DOC).
- O glossário prevalece sobre anexos em conflito.
- Entregáveis A–H: usar rótulos canônicos; books SATF citam inventário cadastrado.

## Dimensões e scores

- Escala típica N1–N5 (score ~1–5).
- **Declarado** = autodeclaração; **oficial** = certificado/teto por evidência (SATF).
- D10 (Fábrica Agêntica) no SATF fica **fora da média geral**.
- D11 só entra no diagnóstico do book unidade se estiver no foco.

## Módulos de execução (menu Execução)

- Estágio AI-First, Roadmap de Iniciativas, Executive Dashboard, Produtos Command Center.
- Prontidão executiva, comparativo por empresa, ranking de projetos.
- Produtos IA-First: cadastro, idealização, especificação automática, validação regulatória, engenharia de valor.

## Diagnóstico rápido

- Fluxo demo/público reduzido (`/diagnostico-rapido`) — 25 perguntas / ~30 min; não substitui assessment completo.

## Boas práticas ao orientar o usuário

- Citar o caminho da tela quando souber (ex.: Projetos → detalhe → Contexto).
- Se faltar dado do projeto no contexto injetado, pedir para selecionar o projeto no Assistente ou cadastrar glossário/anexos.
- Não inventar botões, rotas ou campos que não estejam neste manual ou nos DADOS.
- Não vazar dados de outro cliente/projeto.

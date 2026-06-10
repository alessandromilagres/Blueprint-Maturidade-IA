# Documentação Completa do Sistema Blueprint IA

**Produto:** Blueprint IA / Blueprint Agêntico
**Empresa:** SysMap Solutions
**Versão da documentação:** Junho/2026
**Ambiente de produção:** `https://agentica.sysmap.com.br`
**Escopo:** documentação funcional, técnica, operacional, administrativa e de CI/CD do sistema.

---

## 1. Objetivo do Documento

Este documento consolida toda a documentação do sistema Blueprint IA em uma visão única e completa. Ele foi criado para apoiar administradores, gestores, consultores, avaliadores, times técnicos, times de produto, operação, sustentação e responsáveis por implantação.

Ele cobre:

- Visão geral do produto.
- Papéis e permissões.
- Fluxos funcionais ponta a ponta.
- Módulos de maturidade, produto IA-First e especificação automática.
- Relatórios gerados por IA.
- Dashboards executivos.
- Aplicativo mobile do avaliador.
- Arquitetura técnica.
- Modelo de dados.
- APIs e integrações.
- Segurança.
- Observabilidade e auditoria.
- CI/CD com Azure DevOps.
- Operação em produção.
- Troubleshooting.
- Rotinas recomendadas.

---

## 2. Visão Geral do Sistema

O Blueprint IA é uma plataforma para avaliar a maturidade de organizações em Inteligência Artificial, analisar produtos IA-First, acompanhar avaliadores, gerar relatórios executivos com IA e transformar diagnósticos em especificações técnicas acionáveis.

O sistema conecta seis grandes capacidades:

1. Diagnóstico de maturidade organizacional.
2. Avaliação de produtos IA-First e transformação agêntica.
3. Acompanhamento de avaliadores, convites e qualidade das respostas.
4. Relatórios e books gerados por IA em background.
5. Especificação automática de produtos.
6. Aplicativo mobile para avaliadores.

Na prática, o Blueprint IA transforma um processo de avaliação subjetivo em um fluxo estruturado, rastreável e orientado a decisão executiva.

---

## 3. URLs e Ambientes

### 3.1 Produção

```text
Frontend: https://agentica.sysmap.com.br
API:      https://agentica.sysmap.com.br/api
Health:   https://agentica.sysmap.com.br/api/health
```

### 3.2 Desenvolvimento Local

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3001
API:      http://localhost:3001/api
```

### 3.3 Mobile

Produção:

```text
EXPO_PUBLIC_API_URL=https://agentica.sysmap.com.br/api
```

Desenvolvimento:

```text
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3001/api
```

---

## 4. Papéis e Responsabilidades

| Perfil | Responsabilidade | Acesso típico |
|--------|------------------|---------------|
| Administrador | Configura empresas, usuários, projetos, IA, templates, arquitetura e operação | Acesso completo |
| Gestor/Consultor | Cria projetos, acompanha avaliações, analisa dashboards e gera relatórios | Operação de avaliação |
| Avaliador | Responde avaliações de maturidade e produto | Acesso restrito |
| Executivo | Consome dashboards, relatórios, comparativos e recomendações | Visão decisória |
| Negócios/TI/SysMap | Perfis de apoio por contexto organizacional | Varia conforme regra de acesso |

### 4.1 Administrador

O administrador é responsável por preparar e governar o ambiente:

- Criar empresas.
- Criar e manter usuários.
- Definir perfis.
- Criar projetos.
- Cadastrar produtos IA-First.
- Configurar provedores de IA.
- Configurar templates de e-mail.
- Acompanhar operação.
- Verificar observabilidade.
- Apoiar deploys e validações funcionais.

### 4.2 Gestor ou Consultor

O gestor conduz o processo de avaliação:

- Planeja a avaliação.
- Seleciona avaliadores.
- Ajusta dimensões por avaliador.
- Envia convites.
- Acompanha adesão.
- Analisa respostas.
- Gera relatórios.
- Recomenda ações.

### 4.3 Avaliador

O avaliador responde às avaliações recebidas.

O acesso é restrito a:

- Lista de avaliações.
- Formulário de avaliação de maturidade.
- Formulário de avaliação de produto.
- Tela de conclusão.

O avaliador não acessa cadastros, dashboards executivos, configurações, relatórios administrativos ou dados de outros usuários.

---

## 5. Estrutura do Repositório

```text
blueprint-ia/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   ├── seed.js
│   │   └── seed-diagnostico.js
│   └── src/
│       ├── index.js
│       ├── routes/
│       ├── services/
│       ├── middlewares/
│       ├── validators/
│       └── utils/
├── frontend/
│   └── src/
│       ├── components/
│       ├── constants/
│       ├── contexts/
│       ├── pages/
│       ├── services/
│       └── utils/
├── avaliador-mobile/
├── docs/
├── scripts/
├── azure-pipelines.yml
├── docker-compose.prod.yml
├── docker-compose.yml
└── README.md
```

---

## 6. Stack Técnica

| Camada | Tecnologia |
|--------|------------|
| Frontend web | React, Vite, TailwindCSS, React Router |
| Backend | Node.js, Express, Prisma |
| Banco | PostgreSQL |
| Mobile | Expo, React Native, AsyncStorage |
| Autenticação | JWT |
| IA generativa | Anthropic, OpenAI, Groq |
| E-mail | Microsoft Graph ou SMTP |
| Deploy | Azure DevOps, Azure CLI, Docker Compose |
| Web server | Nginx no container frontend |
| Produção | Azure VM |

---

## 7. Módulos Funcionais

### 7.1 Cadastros

O sistema possui cadastros estruturantes:

- Empresas.
- Usuários.
- Projetos.
- Produtos IA-First.
- Arquiteturas de referência.

Empresas são a raiz da organização dos dados. Usuários, projetos, produtos e arquiteturas se conectam a empresas.

### 7.2 Avaliação de Maturidade

A avaliação de maturidade usa:

- 16 dimensões.
- 108 perguntas.
- Escala de 1 a 5.
- Observações/evidências por pergunta.
- Opção "sem informação".
- Recusa de dimensão.
- Consolidação por avaliador, projeto, dimensão e empresa.

Dimensões:

1. Estratégia e Liderança.
2. Dados e Tecnologia.
3. Governança e Risco.
4. Pessoas e Cultura.
5. Operações e Processos.
6. Inovação e Experimentação.
7. Valor de Negócio e ROI.
8. Ecossistema e Parcerias.
9. Valor por Unidade de Negócio.
10. Talentos e Capacidades.
11. Conformidade Regulatória.
12. Prontidão para Mudança.
13. Plataforma e Industrialização de IA.
14. IA como Gerador de Receita.
15. Maturidade por Tipo de IA.
16. Eficácia de IA.

### 7.3 Avaliação de Produtos IA-First

O módulo de produtos avalia a prontidão de soluções no paradigma IA-First e agêntico.

Estrutura:

- 8 perguntas universais de transformação agêntica.
- 12 verticais setoriais.
- 6 perguntas por vertical.
- Score obrigatório.
- Score por vertical.
- Score de relevância.
- Score de prioridade estratégica.

O produto pode estar em fases como:

- Ideia.
- MVP.
- Piloto.
- Produção.

### 7.4 Especificação Automática

O módulo transforma dados do produto em documentação técnica.

Entradas:

- Dados do produto.
- Projeto e empresa.
- Avaliação IA-First.
- Avaliação de maturidade.
- Arquitetura de referência.
- Arquivos de referência.
- Informações adicionais.
- Custos e produtividade.

Saídas:

- PRD.
- Requisitos funcionais.
- Requisitos não funcionais.
- Arquitetura técnica.
- Cronograma.
- Estimativas.
- Blueprint de construção.

### 7.5 Relatórios Gerados por IA

Relatórios longos são gerados em background.

Tipos:

- Relatório estratégico C-Level.
- Book completo de maturidade em IA.
- Book modo rápido.
- Relatório executivo.
- Documentos técnicos.

Os relatórios ficam em biblioteca versionada.

### 7.6 Diagnóstico Rápido

Fluxo público/demo, separado da avaliação formal.

Usos:

- Demonstração.
- Coleta inicial.
- Pré-diagnóstico comercial.
- Geração de relatório simplificado.

### 7.7 Acompanhamento de Avaliadores

Painel operacional para acompanhar adesão e qualidade.

Mostra:

- Convite enviado.
- Link aberto.
- Avaliação iniciada.
- Progresso salvo.
- Avaliação finalizada.
- Status por avaliador.
- Pendências.
- Lembretes.
- Alertas de qualidade.

### 7.8 Dashboards Executivos

Principais dashboards:

- Dashboard inicial.
- Dashboard de empresa.
- Dashboard de projeto.
- Dashboard de produto.
- Prontidão Executiva.
- Comparativo por Empresa.
- Ranking de Projetos.
- Biblioteca de Relatórios IA.

---

## 8. Fluxos Ponta a Ponta

### 8.1 Fluxo de Avaliação de Maturidade

```text
Criar empresa
      ↓
Criar usuários
      ↓
Criar projeto
      ↓
Selecionar avaliadores
      ↓
Sugerir dimensões por cargo
      ↓
Enviar convite por e-mail/link/QR Code
      ↓
Avaliador acessa por magic link, login ou app
      ↓
Responde perguntas
      ↓
Salva progresso
      ↓
Revisa antes de finalizar
      ↓
Finaliza avaliação
      ↓
Sistema recalcula scores
      ↓
Gestor acompanha e analisa
      ↓
Gera dashboards e relatórios
```

### 8.2 Fluxo de Produto IA-First

```text
Criar projeto
      ↓
Criar produto IA-First
      ↓
Preencher descrição, problema, público, tecnologias e vertical
      ↓
Responder avaliação de produto
      ↓
Calcular relevância agêntica
      ↓
Vincular arquitetura e arquivos, se houver
      ↓
Gerar especificação automática
      ↓
Revisar documentos
      ↓
Aprovar especificação
```

### 8.3 Fluxo de Relatório IA

```text
Projeto com avaliações concluídas
      ↓
Usuário solicita relatório
      ↓
Backend cria job
      ↓
Job executa chamadas IA
      ↓
Interface acompanha progresso
      ↓
Relatório é salvo na biblioteca
      ↓
Usuário abre, revisa e exporta
```

### 8.4 Fluxo de CI/CD

```text
Branch release
      ↓
Validação local
      ↓
PR para main
      ↓
Merge aprovado
      ↓
Azure Pipeline
      ↓
Deploy na VM
      ↓
Docker Compose rebuild
      ↓
Prisma migrate deploy
      ↓
Smoke test
```

---

## 9. Magic Link, Convites e QR Code

Convites de maturidade usam magic link para reduzir atrito.

Rota:

```text
POST /api/convite-avaliacao/acesso/:token
```

Fluxo:

1. Recebe token.
2. Busca convite.
3. Confirma que é convite de projeto/maturidade.
4. Valida expiração.
5. Verifica usuário ativo.
6. Registra evento de link aberto.
7. Cria ou reutiliza avaliação.
8. Registra evento de avaliação iniciada.
9. Gera JWT.
10. Redireciona para `/avaliacoes/:id`.

Convites de produto seguem fluxo autenticado tradicional.

QR Code aponta para o link web do convite. No futuro, pode evoluir para deep link mobile usando o scheme do app.

---

## 10. Qualidade das Respostas

O sistema calcula alertas para apoiar o gestor.

Alertas possíveis:

- Mesmo score em muitas perguntas.
- Conclusão rápida demais.
- Muitas respostas marcadas como "sem informação".
- Nota extrema sem observação/evidência.
- "Sem informação" sem contexto.

Esses alertas não invalidam a avaliação automaticamente. Eles indicam necessidade de revisão.

---

## 11. Lembretes

Lembretes podem ser:

- Individuais.
- Em lote.
- Automáticos por cron.
- Automáticos para avaliações paradas há 48h, quando habilitado.

Tabela de auditoria:

```text
LogLembreteAvaliacao
```

Uso recomendado:

- Reenviar link para quem não abriu.
- Reforçar quem abriu sem iniciar.
- Lembrar quem iniciou mas não concluiu.
- Evitar gerar relatório final com baixa adesão.

---

## 12. Modelo de Dados

### 12.1 Organização

- `Empresa`: cliente/organização.
- `Usuario`: usuários e perfis.
- `UsuarioPresenca`: presença e atividade.
- `Projeto`: contexto da avaliação.
- `Produto`: produto IA-First.

### 12.2 Maturidade

- `Area`: dimensão.
- `Pergunta`: pergunta da dimensão.
- `Avaliacao`: avaliação de maturidade.
- `Resposta`: resposta por pergunta.
- `AvaliacaoDesejosIA`: desejos/roadmap IA.

Campos importantes:

- `areasSelecionadas`.
- `areasRecusadas`.
- `semInformacao`.
- `scoreGeral`.
- `nivelGeral`.

### 12.3 Convites

- `ConviteAvaliacao`.
- `LogLembreteAvaliacao`.
- `AvaliacaoEvento`.

### 12.4 Produto

- `PerguntaObrigatoriaProduto`.
- `RespostaObrigatoriaProduto`.
- `VerticalProduto`.
- `PerguntaProduto`.
- `AvaliacaoProduto`.
- `RespostaProduto`.

### 12.5 Especificação

- `EspecificacaoProduto`.
- `DocumentoEspecificacao`.
- `HistoricoGeracaoIA`.
- `ArquivoReferencia`.
- `ArquiteturaReferencia`.
- `ArquivoArquiteturaReferencia`.

### 12.6 Relatórios IA

- `RelatorioIA`.
- `RelatorioIAJob`.

### 12.7 Configurações

- Configurações de IA.
- Templates de convite.
- Dados de provedores.

---

## 13. APIs Principais

### 13.1 Autenticação

```text
POST /api/auth/login
GET  /api/auth/me
```

### 13.2 Empresas

```text
GET    /api/empresas
GET    /api/empresas/:id
POST   /api/empresas
PUT    /api/empresas/:id
DELETE /api/empresas/:id
```

### 13.3 Usuários

```text
GET    /api/usuarios
GET    /api/usuarios/:id
POST   /api/usuarios
PUT    /api/usuarios/:id
DELETE /api/usuarios/:id
```

### 13.4 Projetos

```text
GET    /api/projetos
GET    /api/projetos/:id
POST   /api/projetos
PUT    /api/projetos/:id
DELETE /api/projetos/:id
```

### 13.5 Avaliações de Maturidade

```text
GET  /api/avaliacoes
GET  /api/avaliacoes/:id
POST /api/avaliacoes
PUT  /api/avaliacoes/:id/respostas
PUT  /api/avaliacoes/:id/finalizar
```

### 13.6 Acompanhamento

```text
GET  /api/projetos/:id/avaliadores-status
POST /api/projetos/:id/avaliadores/lembrete
POST /api/projetos/:id/avaliadores/lembrete-lote
GET  /api/projetos/:id/avaliadores/lembretes-log
```

### 13.7 Convites

```text
POST /api/convites/enviar
GET  /api/convite-avaliacao/validar/:token
POST /api/convite-avaliacao/acesso/:token
POST /api/convite-avaliacao/aceitar/:token
```

### 13.8 Produtos

```text
GET    /api/produtos
GET    /api/produtos/:id
POST   /api/produtos
PUT    /api/produtos/:id
DELETE /api/produtos/:id
```

### 13.9 Avaliações de Produto

```text
GET /api/avaliacoes-produto
GET /api/avaliacoes-produto/:id
PUT /api/avaliacoes-produto/:id/respostas
PUT /api/avaliacoes-produto/:id/finalizar
```

### 13.10 Relatórios IA

```text
GET  /api/relatorios-ia
GET  /api/relatorios-ia/:id
GET  /api/relatorios-ia/latest/:projetoId/:tipo
POST /api/relatorios-ia-jobs/start
GET  /api/relatorios-ia-jobs/:id
POST /api/relatorios-ia-jobs/:id/cancel
```

### 13.11 Especificações

```text
GET  /api/especificacoes/produto/:produtoId
POST /api/especificacoes/gerar/:produtoId
GET  /api/especificacoes/:id/status
PUT  /api/especificacoes/documento/:id
PUT  /api/especificacoes/:id/aprovar
```

### 13.12 Health

```text
GET /api/health
```

---

## 14. Frontend Web

### 14.1 Componentes Principais

- `Layout`: navegação principal.
- `PrivateRoute`: proteção de rotas.
- `AdminRoute`: proteção administrativa.
- `ScoreBadge`: exibição de scores.
- `StatusBadge`: status operacional.
- `MarkdownRenderer`: renderização de documentos e relatórios.
- `ModalSelecaoDocumentos`: seleção de documentos.

### 14.2 Páginas Administrativas

- Empresas.
- Projetos.
- Produtos.
- Usuários.
- Arquiteturas de referência.
- Configurações IA.
- Template de e-mail.
- Observabilidade.

### 14.3 Páginas de Avaliação

- Lista de avaliações.
- Formulário de maturidade.
- Formulário de produto.
- Acompanhamento de avaliadores.
- Análise de avaliações.
- Tela de conclusão.

### 14.4 Páginas Executivas

- Dashboard inicial.
- Dashboard de empresa.
- Dashboard de projeto.
- Dashboard de produto.
- Prontidão Executiva.
- Comparativo por Empresa.
- Ranking Projetos.
- Biblioteca de Relatórios IA.

---

## 15. Aplicativo Mobile

Diretório:

```text
avaliador-mobile/
```

Objetivo:

- Permitir que avaliadores respondam avaliações pelo celular.

Funcionalidades:

- Login.
- Persistência de token.
- Lista de pendências.
- Resposta de maturidade.
- Resposta de produto.
- Salvamento parcial.
- Finalização.

Limitações:

- Não administra empresas.
- Não cria projetos.
- Não gera relatórios.
- Não configura IA.
- Não substitui dashboards web.

---

## 16. Inteligência Artificial

### 16.1 Provedores

Provedores suportados:

- Anthropic.
- OpenAI.
- Groq.

### 16.2 Configuração

Administradores configuram provedores em:

```text
Configurações > IA
```

As chaves são persistidas no banco com proteção.

### 16.3 Uso de IA

IA é usada para:

- Relatórios estratégicos.
- Books de maturidade.
- Relatórios executivos.
- Especificações automáticas.
- Documentos técnicos.
- Apoio à estruturação de recomendações.

### 16.4 Jobs em Background

Relatórios longos usam jobs para evitar timeout.

Cada job registra:

- Tipo.
- Projeto.
- Status.
- Progresso.
- Erro, se houver.
- Resultado salvo.

---

## 17. Exportações

O sistema exporta:

- Markdown.
- Word.
- PDF/impressão.
- CSV em comparativos.
- HTML/JSON em fluxos técnicos, quando suportado.

Regra importante:

Exportações de avaliação individual usam a nota da avaliação da pessoa que respondeu, recalculando a partir das respostas quando necessário.

---

## 18. Segurança

### 18.1 Autenticação

JWT via header:

```text
Authorization: Bearer <token>
```

### 18.2 Autorização

Rotas protegidas por:

- Login.
- Perfil.
- Empresa vinculada.
- Usuário avaliador dono da avaliação.

### 18.3 Magic Link

Magic link:

- Só funciona com convite válido.
- Expira conforme `dataExpiracao`.
- Exige avaliador ativo.
- Cria sessão limitada por JWT.
- Não dá acesso administrativo.

### 18.4 Secrets

Segredos não devem ir para o repositório.

Usar:

- Azure DevOps Variable Groups.
- Azure Key Vault.
- `.env` protegido na VM.
- Banco com proteção para chaves de IA.

---

## 19. Observabilidade

### 19.1 Healthcheck

```text
GET /api/health
```

### 19.2 Auditoria Operacional

Tabelas:

- `UsuarioPresenca`.
- `AvaliacaoEvento`.
- `LogLembreteAvaliacao`.
- `HistoricoGeracaoIA`.

### 19.3 Containers

Containers de produção:

- `blueprint-ia-db-prod`.
- `blueprint-ia-backend-prod`.
- `blueprint-ia-frontend-prod`.

Comandos:

```sh
docker compose -f docker-compose.prod.yml ps
docker logs blueprint-ia-backend-prod --tail=100
docker logs blueprint-ia-frontend-prod --tail=100
docker logs blueprint-ia-db-prod --tail=100
```

---

## 20. CI/CD e Produção

### 20.1 Pipeline

Arquivo:

```text
azure-pipelines.yml
```

Trigger:

```text
main
```

Pipeline:

1. Checkout.
2. Azure CLI.
3. `az vm run-command invoke`.
4. Atualização do repositório na VM.
5. Atualização de variáveis de e-mail.
6. `docker compose down`.
7. `docker compose up -d --build`.
8. `prisma migrate deploy`.
9. `docker image prune`.
10. Status dos containers.

### 20.2 Produção

```text
Resource Group: rg-blueagentic-devops-prod
VM: vm-app-prod
Deploy path: /mnt/dados/blueprint-agentica
```

### 20.3 Smoke Test

API:

```sh
curl -ksS https://agentica.sysmap.com.br/api/health
```

Frontend:

```sh
curl -ksS -I https://agentica.sysmap.com.br/
```

---

## 21. Variáveis de Ambiente

Backend:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `BASE_URL`
- `EMAIL_PROVIDER`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `MAIL_SENDER_ADDRESS`
- `AI_PROVIDER`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `LEMBRETE_CRON_ENABLED`
- `LEMBRETE_CRON_AUTO_48H`

Frontend:

- `VITE_API_URL`, se necessário.

Mobile:

- `EXPO_PUBLIC_API_URL`.

---

## 22. Operação Recomendada

### 22.1 Antes de Iniciar Avaliação

1. Criar empresa.
2. Criar usuários.
3. Conferir cargos.
4. Criar projeto.
5. Definir avaliadores.
6. Validar template de convite.
7. Enviar convites.

### 22.2 Durante Avaliação

1. Monitorar acompanhamento.
2. Filtrar quem não abriu.
3. Filtrar quem abriu sem iniciar.
4. Enviar lembretes.
5. Revisar alertas de qualidade.
6. Apoiar dúvidas.

### 22.3 Depois da Avaliação

1. Conferir finalizações.
2. Usar análise comparativa.
3. Gerar dashboards.
4. Gerar relatório IA.
5. Revisar relatório.
6. Exportar.
7. Gerar especificação, se houver produto.

---

## 23. Troubleshooting Funcional

| Situação | Ação |
|----------|------|
| Avaliador não recebeu convite | Conferir e-mail, template, envio Graph/SMTP e reenviar link. |
| Link expirado | Gerar novo convite. |
| Avaliador abriu mas não iniciou | Usar filtro "abriu sem iniciar" e enviar reforço. |
| Avaliação com alertas | Revisar evidências e pedir complementação. |
| Relatório IA demora | Conferir job em background e aguardar biblioteca. |
| Relatório truncado | Regenerar com fluxo em background e continuação. |
| Chave IA falha | Testar provedor em Configurações > IA. |
| Exportação inconsistente | Recalcular a partir da avaliação correta e verificar respostas. |
| Produto sem especificação boa | Completar campos, arquitetura e arquivos de referência. |

---

## 24. Troubleshooting Técnico

| Situação | Ação |
|----------|------|
| Backend reiniciando | Ver logs do container backend. |
| Frontend fora | Ver healthcheck do backend e logs do frontend. |
| Banco indisponível | Ver container PostgreSQL e volume. |
| Migration falhou | Rodar `npx prisma migrate status` no container. |
| Pipeline não iniciou | Disparar manualmente no Azure DevOps. |
| Pipeline em fila | Aguardar agente ou verificar disponibilidade. |
| E-mail Graph falhou | Ver `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`. |
| Certificado HTTPS falhou | Ver volume `ssl` e Nginx. |
| Site mostra versão antiga | Ver cache/CDN e `last-modified`. |

---

## 25. Checklist de Release

Antes do PR:

- `git status` revisado.
- Arquivos temporários fora.
- Secrets fora.
- `./scripts/sandbox-verify.sh` executado.
- `git diff --check` limpo.
- Migrações revisadas.
- Documentação atualizada.

Durante o PR:

- Descrição clara.
- Testes informados.
- Riscos informados.
- Aprovação registrada.
- Merge em `main`.

Depois do deploy:

- Pipeline `succeeded`.
- `/api/health` com `200`.
- Frontend com `200`.
- Login validado.
- Fluxo alterado testado.
- Logs sem erro crítico.

---

## 26. Documentos Complementares

- `README.md`
- `docs/COMO_SISTEMA_FUNCIONA.md`
- `docs/TESE_BLUEPRINT_IA.md`
- `docs/DOCUMENTACAO_TECNICA.md`
- `docs/MANUAL_USUARIO_ADMINISTRADOR.md`
- `docs/MANUAL_CICD_AZURE_DEVOPS.md`
- `docs/APLICATIVO_AVALIADOR_MOBILE.md`
- `docs/ESPECIFICACAO_AUTOMATICA.md`
- `docs/ESPECIFICACAO_PRODUTO_REQUISITOS.md`
- `docs/PERGUNTAS_MATURIDADE_POR_DIMENSAO_EXPORT.md`

---

## 27. Glossário

| Termo | Definição |
|-------|-----------|
| Avaliador | Usuário que responde avaliações. |
| Magic link | Link de convite que cria sessão segura sem senha para maturidade. |
| Dimensão | Área avaliada no modelo de maturidade. |
| Sem informação | Resposta tratada que não entra no score. |
| Área recusada | Dimensão que o avaliador declara não estar apto a responder. |
| Produto IA-First | Produto avaliado sob paradigma de IA e agentes. |
| Transformação agêntica | Prontidão para uso de agentes e sistemas multiagentes. |
| Relatório IA | Documento gerado por provedor de IA. |
| Job background | Processo assíncrono para tarefas longas. |
| Arquitetura de referência | Padrão técnico reutilizável da empresa. |
| Especificação automática | Geração de PRD, requisitos, arquitetura e blueprint. |
| CI/CD | Processo de integração e entrega contínua. |

---

## 28. Conclusão

O Blueprint IA combina diagnóstico de maturidade, análise de produtos IA-First, acompanhamento operacional, geração de relatórios por IA, especificação automática e deploy controlado em Azure DevOps.

O sistema foi desenhado para garantir:

- Rastreabilidade.
- Qualidade de resposta.
- Aderência executiva.
- Redução de timeout em tarefas longas.
- Persistência de relatórios e configurações.
- Governança de acesso.
- Operação segura em produção.

Este documento deve ser usado como referência principal do sistema e complementado pelos documentos específicos de administração, CI/CD, mobile, especificação e tese metodológica.

# Documentação Técnica do Blueprint IA

**Sistema:** Blueprint IA / Blueprint Agêntico
**Versão:** Junho/2026
**Ambiente de produção:** Azure VM + Docker Compose + Azure DevOps

---

## 1. Visão Técnica

O Blueprint IA é uma aplicação web full-stack para avaliação de maturidade em IA, análise de produtos IA-First, acompanhamento de avaliadores, geração de relatórios por IA e especificação automática de produtos.

Arquitetura principal:

```text
Usuário Web / Avaliador
      ↓ HTTPS
Frontend React + Nginx
      ↓ /api
Backend Node.js + Express
      ↓ Prisma
PostgreSQL
      ↓
Jobs, relatórios, auditoria e arquivos
```

Componentes complementares:

- Aplicativo mobile do avaliador em Expo/React Native.
- Pipeline Azure DevOps para deploy em produção.
- Docker Compose para orquestração dos serviços.
- Provedores externos de IA: Anthropic, OpenAI e Groq.
- Microsoft Graph ou SMTP para envio de e-mails.

---

## 2. Estrutura do Repositório

```text
blueprint-ia/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
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
│       ├── contexts/
│       ├── pages/
│       ├── services/
│       └── utils/
├── avaliador-mobile/
├── docs/
├── scripts/
├── azure-pipelines.yml
├── docker-compose.prod.yml
└── README.md
```

---

## 3. Stack Técnica

| Camada | Tecnologia |
|--------|------------|
| Frontend web | React, Vite, TailwindCSS, React Router |
| Backend | Node.js, Express, Prisma |
| Banco | PostgreSQL |
| Mobile | Expo, React Native, AsyncStorage |
| Autenticação | JWT |
| IA | Anthropic, OpenAI, Groq |
| E-mail | Microsoft Graph ou SMTP |
| Deploy | Azure DevOps, Azure CLI, Docker Compose |
| Proxy/web server | Nginx no container frontend |

---

## 4. Backend

### 4.1 Entrada da API

Arquivo principal:

```text
backend/src/index.js
```

Responsabilidades:

- Inicialização do Express.
- Registro de middlewares globais.
- Rotas de autenticação.
- Rotas de empresas, projetos, produtos e avaliações.
- Convites e magic link.
- Acompanhamento de avaliadores.
- Dashboards.
- Relatórios IA.
- Especificações.
- Exportações.
- Ajustes compatíveis de schema em produção.

### 4.2 Middlewares

Principais middlewares:

- `authMiddleware`: valida JWT e injeta usuário na requisição.
- `roleMiddleware`: restringe rotas por perfil.
- `globalSanitizer`: higienização global.
- `validate`: validação por schema.

### 4.3 Serviços

Serviços relevantes:

- `email.js`: envio de e-mail via Graph/SMTP e links de convite.
- `emailConviteTemplate.js`: templates configuráveis de convite.
- `ai-provider.js`: abstração de provedores de IA.
- `anthropic.js`: integração com Anthropic.
- `export.js`: geração/exportação de relatórios.
- `lembreteEnvioService.js`: lembretes individuais, lote e automáticos.

### 4.4 Rotas Modulares

Rotas em `backend/src/routes/`:

- `arquivos.js`: arquivos de referência.
- `diagnostico.js`: diagnóstico rápido.
- `especificacao.js`: geração e consulta de especificações.
- `exportacao.js`: exportações.
- `relatorios-ia.js`: biblioteca e versões de relatórios IA.
- `relatorios-ia-jobs.js`: jobs em background de relatórios IA.

---

## 5. Frontend Web

### 5.1 Entrada da Aplicação

Arquivos principais:

```text
frontend/src/App.jsx
frontend/src/components/Layout.jsx
frontend/src/services/api.js
```

### 5.2 Contextos

- `AuthContext`: sessão, usuário, perfis e logout.
- `ThemeContext`: tema visual e modo claro/escuro.
- `ToastContext`: mensagens de feedback.
- `ActivityContext`: presença/atividade para observabilidade.

### 5.3 Páginas Principais

Cadastros:

- `Empresas.jsx`
- `Projetos.jsx`
- `Produtos.jsx`
- `Usuarios.jsx`
- `ArquiteturasReferenciaLista.jsx`

Avaliações:

- `Avaliacoes.jsx`
- `AvaliacaoForm.jsx`
- `AcompanhamentoAvaliadores.jsx`
- `AnaliseAvaliacoes.jsx`
- `AvaliacaoProdutoForm.jsx`
- `AcessoMagicLink.jsx`

Execução e relatórios:

- `DashboardProntidao.jsx`
- `ComparativoEmpresa.jsx`
- `DashboardProjetosRanking.jsx`
- `RelatoriosIABiblioteca.jsx`
- `RelatorioMITIA.jsx`
- `RelatorioMITIACompleto.jsx`
- `Especificacoes.jsx`
- `EspecificacaoProduto.jsx`

Configurações:

- `ConfiguracoesIA.jsx`
- `AdminEmailConviteAvaliacao.jsx`
- `Observabilidade.jsx`

---

## 6. Mobile

Diretório:

```text
avaliador-mobile/
```

Tecnologias:

- Expo
- React Native
- AsyncStorage

Escopo:

- Login do avaliador.
- Listagem de pendências.
- Resposta de avaliações de maturidade e produto.
- Salvamento parcial.
- Finalização.

O app não substitui o sistema web administrativo.

---

## 7. Modelo de Dados

Arquivo:

```text
backend/prisma/schema.prisma
```

### 7.1 Núcleo Organizacional

- `Empresa`: cliente/organização.
- `Usuario`: usuários e perfis.
- `UsuarioPresenca`: presença e última atividade.
- `Projeto`: contexto da avaliação de maturidade.
- `Produto`: produto IA-First vinculado a projeto.

### 7.2 Maturidade

- `Area`: dimensão de maturidade.
- `Pergunta`: pergunta vinculada à dimensão.
- `Avaliacao`: avaliação de maturidade por usuário/projeto.
- `Resposta`: resposta por pergunta.
- `AvaliacaoDesejosIA`: dados opcionais de desejos/roadmap IA.

Campos importantes:

- `areasSelecionadas`: dimensões selecionadas para o avaliador.
- `areasRecusadas`: dimensões recusadas pelo avaliador.
- `semInformacao`: resposta tratada sem entrar no score.
- `nivelPrioridadeMapeamentoMaturidade`: filtro cumulativo por prioridade.

### 7.3 Convites e Auditoria

- `ConviteAvaliacao`: convites de maturidade/produto.
- `LogLembreteAvaliacao`: auditoria de lembretes.
- `AvaliacaoEvento`: tabela operacional criada pelo backend para eventos do fluxo.

Eventos operacionais:

- `convite_enviado`
- `convite_aberto`
- `avaliacao_iniciada`
- `avaliacao_salva`
- `avaliacao_finalizada`

### 7.4 Produto IA-First

- `PerguntaObrigatoriaProduto`: perguntas universais.
- `VerticalProduto`: vertical setorial.
- `PerguntaProduto`: pergunta por vertical.
- `AvaliacaoProduto`: avaliação do produto.
- `RespostaObrigatoriaProduto`
- `RespostaProduto`

### 7.5 Especificação Automática

- `EspecificacaoProduto`
- `DocumentoEspecificacao`
- `HistoricoGeracaoIA`
- `ArquivoReferencia`
- `ArquiteturaReferencia`
- `ArquivoArquiteturaReferencia`

---

## 8. Autenticação e Autorização

O sistema usa JWT.

Fluxo padrão:

```text
POST /api/auth/login
      ↓
JWT no localStorage
      ↓
Authorization: Bearer <token>
      ↓
authMiddleware valida e carrega usuário
```

Perfis principais:

- `admin`
- `gestor`
- `avaliador`
- `negocios`
- `ti`
- `sysmap`

O perfil avaliador tem navegação restrita.

---

## 9. Magic Link de Avaliação

Rota pública web:

```text
POST /api/convite-avaliacao/acesso/:token
```

Fluxo:

1. Valida token do convite.
2. Confirma que o convite é de maturidade.
3. Verifica expiração.
4. Verifica se o avaliador está ativo.
5. Registra evento `convite_aberto`.
6. Cria ou reutiliza avaliação.
7. Registra evento `avaliacao_iniciada`.
8. Gera JWT.
9. Retorna `redirectUrl` para `/avaliacoes/:id`.

Esse fluxo reduz atrito do avaliador sem abrir acesso administrativo.

---

## 10. Relatórios IA em Background

Relatórios extensos usam jobs persistidos.

Rotas:

```text
POST /api/relatorios-ia-jobs/start
GET /api/relatorios-ia-jobs/:id
POST /api/relatorios-ia-jobs/:id/cancel
```

Benefícios:

- Evita timeout do navegador.
- Permite acompanhamento de progresso.
- Mantém histórico na biblioteca.
- Separa relatórios por tipo e filtro de prioridade.

### 10.1 Metodologia de ROI (projeções financeiras)

Implementação técnica da separação entre benefício bruto, investimento e ROI líquido.

| Módulo | Caminho |
|--------|---------|
| Métricas e blocos Markdown para IA | `backend/src/utils/metodologiaRoiFinanceiro.js` |
| Projeção calibrada (cenários) | `backend/src/utils/roiPorFaturamento.js` |
| Trajetória MIT por nível | `backend/src/utils/mitTrajetoriaFinanceira.js` |
| Modelo narrativo “Ganho no longo prazo” | `backend/src/utils/bookModoRapidoMarkdown.js` |
| UI — nota metodológica | `frontend/src/components/NotaMetodologiaRoi.jsx` |
| Espelho frontend | `frontend/src/utils/metodologiaRoiFinanceiro.js`, `roiPorFaturamento.js` |

Função central:

```javascript
calcularMetricasCenarioFinanceiro(beneficioBruto, investimentoAnual)
// ganhoLiquidoAnual = beneficioBruto - investimento
// roiLiquidoPct = (ganhoLiquido / investimento) * 100
```

`projecaoFinanceiraRelatorio({ faturamentoAnualProjeto, scoreGeral })` alimenta dashboards, relatórios técnicos/executivos e o bloco `dadosBlock` dos prompts de book/relatório IA em `backend/src/index.js`.

Documentação funcional e fundamento teórico: [`docs/Atual/METODOLOGIA_ROI_FINANCEIRO.md`](Atual/METODOLOGIA_ROI_FINANCEIRO.md).

---

## 11. Especificação Automática

Entrada:

- Produto.
- Projeto e empresa.
- Avaliações de maturidade e produto.
- Informações adicionais.
- Arquitetura de referência.
- Arquivos de referência.
- Custos e produtividade.

Saída:

- PRD.
- Requisitos funcionais.
- Requisitos não funcionais.
- Arquitetura técnica.
- Cronograma.
- Blueprint de construção.

Documentos relacionados:

- `docs/ESPECIFICACAO_AUTOMATICA.md`
- `docs/ESPECIFICACAO_PRODUTO_REQUISITOS.md`

---

## 12. E-mail e Convites

O envio de e-mails suporta:

- Microsoft Graph (`EMAIL_PROVIDER=graph`)
- SMTP (`EMAIL_PROVIDER=smtp`)
- Simulação em log quando configuração estiver incompleta

Variáveis Graph:

- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `MAIL_SENDER_ADDRESS`

Templates de convite são configuráveis no banco e renderizados pelo backend.

---

## 13. Arquivos e Uploads

Uploads persistem no volume:

```text
uploads_data
```

Na produção:

```text
/mnt/dados/volumes/uploads_data
```

Categorias:

- Arquivos de referência de produto.
- Arquivos de arquitetura de referência.

O backend pode extrair conteúdo textual para enriquecer prompts e especificações.

---

## 14. Deploy e Infraestrutura

Produção usa:

- Azure DevOps
- Azure CLI `az vm run-command invoke`
- VM Azure
- Docker Compose
- PostgreSQL em container com volume persistente
- Nginx/HTTPS no frontend

Arquivos:

- `azure-pipelines.yml`
- `docker-compose.prod.yml`
- `scripts/sandbox-verify.sh`
- `docs/MANUAL_CICD_AZURE_DEVOPS.md`

---

## 15. Variáveis de Ambiente

Backend:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `BASE_URL`
- `EMAIL_PROVIDER`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
- `MAIL_SENDER_ADDRESS`
- `AI_PROVIDER`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `LEMBRETE_CRON_ENABLED`
- `LEMBRETE_CRON_AUTO_48H`

Frontend:

- `VITE_API_URL`, quando necessário. Em produção o build usa `/api`.

Mobile:

- `EXPO_PUBLIC_API_URL`

---

## 16. Validação Técnica

Comando principal:

```sh
./scripts/sandbox-verify.sh
```

Executa:

- `npm run build` no frontend.
- `node --check src/index.js` no backend.
- `npx prisma validate`.

Também recomendado:

```sh
git diff --check
```

---

## 17. Observabilidade e Auditoria

Camadas de observabilidade:

- Healthcheck `/api/health`.
- Docker healthchecks.
- Logs de containers.
- `UsuarioPresenca` para atividade de usuário.
- `AvaliacaoEvento` para fluxo de avaliação.
- `LogLembreteAvaliacao` para lembretes.
- `HistoricoGeracaoIA` para chamadas de geração.

---

## 18. Segurança

Regras principais:

- JWT obrigatório em rotas protegidas.
- Perfil avaliador com acesso restrito.
- Secrets fora do repositório.
- Graph secrets via Variable Group/Key Vault.
- Chaves de IA persistidas com proteção.
- Magic link limitado a convite válido e avaliador ativo.
- Arquivos e uploads devem ser tratados como dados sensíveis quando contiverem contexto de negócio.

---

## 19. Referências

- `README.md`
- `docs/COMO_SISTEMA_FUNCIONA.md`
- `docs/Atual/METODOLOGIA_ROI_FINANCEIRO.md`
- `docs/MANUAL_USUARIO_ADMINISTRADOR.md`
- `docs/MANUAL_CICD_AZURE_DEVOPS.md`
- `docs/ESPECIFICACAO_AUTOMATICA.md`
- `docs/ESPECIFICACAO_PRODUTO_REQUISITOS.md`
- `backend/prisma/schema.prisma`
- `azure-pipelines.yml`
- `docker-compose.prod.yml`

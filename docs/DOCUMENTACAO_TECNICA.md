# Documentação Técnica do Blueprint IA

**Sistema:** Blueprint IA / Blueprint Agêntico
**Versão:** Julho/2026 (isolamento taxonômico SATF em relatórios IA)
**Ambiente de produção:** Azure VM + Docker Compose + Azure DevOps

---

## 1. Visão Técnica

O Blueprint IA é uma aplicação web full-stack para avaliação de maturidade em IA, análise de produtos IA-First, conformidade regulatória estimada, acompanhamento de avaliadores, versionamento de projetos, geração de relatórios por IA e especificação automática de produtos.

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
- Versionamento de projetos (`ProjetoVersao`).
- Dashboards.
- Relatórios IA (SysMap Solutions; MIT CISR como referência).
- Módulo regulatório (snapshots, ciclos, mitigações).
- Logo da empresa (`/api/empresas/:id/logo`).
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
- `empresa-logo.js`: upload, leitura e remoção de logo da empresa.
- `especificacao.js`: geração e consulta de especificações.
- `exportacao.js`: exportações Markdown/ZIP por versão.
- `regulatorio.js`: crosswalk, snapshots, ciclos, mitigações, dashboard e notificações.
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
- `EvolucaoProjeto.jsx`
- `RelatoriosIABiblioteca.jsx`
- `RelatorioMITIA.jsx`
- `RelatorioMITIACompleto.jsx`
- `DashboardRegulatorioProjeto.jsx`
- `ValidacaoRegulatoriaProduto.jsx`
- `PlanoMitigacaoRegulatoria.jsx`
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

- `Empresa`: cliente/organização (`logoPath` opcional).
- `Usuario`: usuários e perfis.
- `UsuarioPresenca`: presença e última atividade.
- `Projeto`: contexto da avaliação de maturidade (`isoTargetScore` opcional para ISO 42001).
- `Produto`: produto IA-First vinculado a projeto.
- `ProjetoVersao`: versões numeradas do projeto (aberta/fechada).
- `ProjetoVersaoAvaliacao` / `ProjetoVersaoConvite`: vínculos da versão.

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

### 7.6 Regulatório

- `RegulatorySnapshot`: snapshot PL 2338, ISO 42001 e LGPD por produto.
- `ProdutoRegulatorioCiclo`: ciclo aberto/fechado vinculado à versão do projeto.
- `ProdutoRegulatorioMitigacao`: ações de mitigação com evidências anexadas.

Utilitários: `regulatorioSnapshot.js`, `regulatorioCiclo.js`, `regulatorioCrosswalk.js`, `regulatorioDashboard.js`, `regulatorioNotificacoes.js`. Dados estáticos em `backend/src/data/regulatorio/`.

### 7.7 Rubrica e Guias de Progressão

- `nivelMaturidadeRubrica.js`: faixas oficiais de score → nível 1–5.
- `guiasProgressaoFramework.js`: trechos dos guias de progressão por dimensão/nível para books IA (SATF usa mapeamento interno sem expor nomes Blueprint no documento).
- `ordemDimensoesFramework.js`: ordem canônica Blueprint 16 ou SATF 11 (`FRAMEWORK_SATF_TI_V3` vs `BLUEPRINT_16`).
- `satfBookIA.js`, `satfRelatorioExecutivoIA.js`, `satfBookTaxonomia.js`: geração e validação de books/executivos SATF.
- `exportRelatorioFrameworkMeta.js`: cabeçalhos e sumários de exportação MD/ZIP por framework.
- `blocoDesejosIaBook.js`: integração de Desejos IA nos prompts de book (Seção 3).

### 7.8 Roadmap de Iniciativas

- `Iniciativa`: item do roadmap com eixo polimórfico (`contextoTipo` = `dimensao` | `produto` | `portfolio`, `contextoId`, `contextoRotulo`).
- Amarração ao diagnóstico: `gapVinculado`, `scoreAlvo`, `roiEstimado`, `origemRelatorioId`.
- `projetoVersaoId` é coluna `Int` simples (a tabela `ProjetoVersao` é gerenciada por SQL raw, sem relation Prisma) — mesmo padrão de `ProdutoRegulatorioCiclo`.
- Schema garantido em runtime por `ensureIniciativaSchema()` no startup (`backend/src/index.js`) e migration `20260625160000_roadmap_iniciativas`.

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

Constantes de persona/atribuição IA: `backend/src/constants/consultorRelatorioIA.js` (SysMap Solutions; MIT CISR = referência apenas em projetos **Blueprint 16**; SATF usa `METODOLOGIA_SATF_RESUMO` e `SYSTEM_PROMPT_PERSONA_BOOK_SATF`).

### 10.2 Relatórios e Books IA — isolamento por framework (Jul/2026)

A partir de Jul/2026, artefatos gerados por IA são **isolados por framework**. Projetos **SATF TI v3** não reutilizam prompts, blocos de dados nem taxonomia do **Blueprint 16 / MIT CISR** em books e relatórios executivos.

#### Tipos na biblioteca

| Artefato | Blueprint 16 (`BLUEPRINT_16`) | SATF TI v3 (`SATF_TI_V3`) |
|----------|-------------------------------|---------------------------|
| Relatório executivo IA | `executivo` — C-Level, ROI MIT | `executivo` — fluxo dedicado (`satfRelatorioExecutivoIA.js`) |
| Book completo | `completo` (~16 dimensões, seções 1–13) | `completo_satf` (11 dimensões, seções 1–8) |
| Book modo rápido | `completo_rapido` | `completo_satf_rapido` |

#### Desvio de rota no backend

```text
POST /api/dashboard/projeto/:id/relatorio-ia
  → se framework = SATF_TI_V3 → executarGeracaoRelatorioExecutivoSatf()
  → senão → fluxo executivo Blueprint (MIT ROI, 16 dimensões)

POST /api/dashboard/projeto/:id/relatorio-ia-completo
  → se framework = SATF_TI_V3 → executarGeracaoBookSatf()
  → senão → fluxo book Blueprint
```

#### Módulos SATF

| Módulo | Função |
|--------|--------|
| `satfBookIA.js` | Book SATF multi-chunk (~18 blocos), seções 1–8 |
| `satfRelatorioExecutivoIA.js` | Executivo SATF (5 seções, público CTO/engenharia) |
| `satfBookTaxonomia.js` | Taxonomia canônica D1–D11, `validarTaxonomiaBookSatf()`, capa **CONFIDENCIAL**, `blocoDadosExtrasBookRapidoSatf` |
| `exportRelatorioFrameworkMeta.js` | Títulos/sumários de export MD e ZIP; books SATF no pacote de versão |

#### Regras de geração SATF

1. **Taxonomia única:** somente dimensões SATF D1–D11 com nomes oficiais do seed (`satfFrameworkSeed.js`).
2. **Proibição explícita** nos prompts: 16 dimensões Blueprint, MIT CISR como metodologia principal, taxonomias genéricas (ex.: “Engenharia de Dados”, “Produto & Experiência com IA”).
3. **Modo rápido:** não injeta trajetória MIT nem Apêndice C do book Blueprint (`blocoDadosExtrasBookRapidoSatf`).
4. **Guias de progressão:** `blocoGuiaProgressaoDimensaoSatf` — calibração interna; instrução para não reproduzir nomes Blueprint no documento final.
5. **Desejos IA:** bloco consolidado em `blocoDesejosIaBook.js`, referenciado na Seção 3 de ambos os books.
6. **Validação pós-geração:** `validarTaxonomiaBookSatf(markdown)`; cache (`reuse=true`) só reutiliza versão salva se validação OK.
7. **Resposta API:** campo `avisoTaxonomia` quando contaminação é detectada (regenerar com `reuse=false`).

#### Frontend

- `RelatorioMITIA.jsx` — executivo; labels/disclaimer/Word footer SATF vs Blueprint.
- `RelatorioMITIACompleto.jsx` — book; alerta amarelo de taxonomia; export Word com `footerMetodologia`.
- `DashboardProjeto.jsx` — menu “Relatórios IA · SATF TI v3” e botão “Executivo TI / Engenharia (IA)” em projetos SATF.
- `frameworkMaturidade.js` — `bookIaTipoProjeto()`, `relatorioFrameworkMeta()`.

#### Exportações

- `exportacao.js` usa `listarAreasDoProjeto` em projetos SATF (11 dimensões, não 16 genéricas).
- ZIP de versão inclui `08-relatorio-ia-book-satf.md` / `-rapido` conforme framework.
- Sumário executivo do relatório técnico MD diferencia SATF vs Blueprint (`paragrafoSumarioExecutivoExport`).

---

## 10.1 Módulo Regulatório

Prefixo base: `/api/regulatorio`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/crosswalk` | Mapa dimensão → implicações PL/ISO/LGPD |
| GET | `/snapshot/:produtoId` | Snapshot atual do produto |
| POST | `/snapshot/:produtoId/recalcular` | Recalcula após nova IA-First |
| PUT | `/snapshot/:produtoId/confirm` | Validação do consultor |
| GET/POST/PUT | `/produto/:produtoId/ciclos/*` | Ciclos abertos/fechados e mitigações |
| GET | `/dashboard/:projetoId` | Dashboard consolidado do projeto |
| GET | `/notificacoes` | Alertas operacionais |

Manual: [`docs/MANUAL_MODULO_REGULATORIO.md`](MANUAL_MODULO_REGULATORIO.md).

---

## 10.2 Versionamento de Projetos

Tabelas `ProjetoVersao`, `ProjetoVersaoAvaliacao`, `ProjetoVersaoConvite` criadas/verificadas em startup via `ensureProjetoVersaoSchema()`.

Endpoints principais (em `index.js`):

- Listagem e detalhe de versões por projeto
- Fechar versão (checklist + resumo executivo)
- Criar/reabrir versão
- Export ZIP: `GET /api/exportar/versao/:projetoId/:versaoId/zip`
- Comparativo visual: página `EvolucaoProjeto.jsx`

Validador de produção: [`docs/VALIDADOR_VERSIONAMENTO_PRODUCAO.md`](VALIDADOR_VERSIONAMENTO_PRODUCAO.md).

---

## 10.3 Logo da Empresa

Rotas em `empresa-logo.js`:

```text
GET    /api/empresas/:id/logo
POST   /api/empresas/:id/logo
DELETE /api/empresas/:id/logo
```

Armazenamento: `uploads/empresas/{empresaId}/`. Utilitário `empresaLogo.js` enriquece dashboards e `dadosUsados` dos relatórios IA.

---

## 10.4 Roadmap de Iniciativas e Executive Dashboard

Rotas de iniciativas em `routes/iniciativas.js` (mutação restrita a `admin`, `gestor`, `sysmap`):

```text
GET    /api/iniciativas?projetoId=&projetoVersaoId=&contextoTipo=&contextoId=&status=
GET    /api/iniciativas/export?projetoId=&contextoTipo=        (CSV, UTF-8 BOM)
POST   /api/iniciativas
PUT    /api/iniciativas/:id
DELETE /api/iniciativas/:id
POST   /api/iniciativas/importar-roadmap-ia/:relatorioId       (gera rascunhos a partir dos gaps do diagnóstico)
```

Executive Dashboard (consolidado, em `index.js`):

```text
GET    /api/projetos/:id/executive-dashboard?versaoId=&nivelPrioridadeMapeamentoMaturidade=
```

Retorno: `scoreGeral`/`nivel`, `scoresPorArea` (radar 16D), `topGaps`, `statusRegulatorio` (reusa `montarDashboardRegulatorioProjeto`), `roi` (reusa `projecaoFinanceiraRelatorio`), `proximosPassos` (30/60/90 derivados das iniciativas) e `comparativoVersao` (reusa `montarComparativoVersoesProjeto`).

Frontend: `pages/RoadmapTimeline.jsx` (+ `components/GanttChart.jsx`, `components/IniciativaForm.jsx`) e `pages/ExecutiveDashboard.jsx`. Gantt é customizado (CSS grid + divs), sem dependências externas. O link público assinado do Executive Dashboard foi adiado para fase futura (entrega atual só com login).

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
- Logos de empresa (`uploads/empresas`).
- Evidências de mitigação regulatória.

O container backend usa `docker-entrypoint.sh` para criar `/app/uploads` com permissão do usuário `appuser` antes de iniciar a aplicação (evita `EACCES` em volumes montados).

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
- `docs/DOCUMENTACAO_COMPLETA_SISTEMA.md`
- `docs/Atual/METODOLOGIA_ROI_FINANCEIRO.md`
- `docs/MANUAL_MODULO_REGULATORIO.md`
- `docs/VALIDADOR_VERSIONAMENTO_PRODUCAO.md`
- `docs/MANUAL_USUARIO_ADMINISTRADOR.md`
- `docs/MANUAL_CICD_AZURE_DEVOPS.md`
- `docs/ESPECIFICACAO_AUTOMATICA.md`
- `docs/ESPECIFICACAO_PRODUTO_REQUISITOS.md`
- `backend/docker-entrypoint.sh`
- `backend/prisma/schema.prisma`
- `azure-pipelines.yml`
- `docker-compose.prod.yml`

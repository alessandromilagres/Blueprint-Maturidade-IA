# Handoff para produção — Unidades organizacionais + Relatórios IA + Fase 4

**Data:** 2026-07-08  
**Destinatário:** agente de implantação / release  
**Ambiente alvo PRD:** https://agentica.sysmap.com.br  
**Repositório:** blueprint-ia (Azure DevOps + espelho GitHub `main`)

---

## 1. Resumo executivo

Entrega acumulada em **4 fases** sobre o módulo de **unidades organizacionais** (`UnidadeEmpresa`) e **relatórios IA**, mais correções críticas de **jobs zumbis**, **política “sempre gerar novo”** e **bugs de persistência** do book por unidade.

**Prioridade #1 desta release (relatórios IA):**  
**Não trazer versão antiga do relatório** ao gerar de novo. Sempre produzir versão nova com dados atuais do projeto.  
→ Detalhes completos na **seção 2** (leitura obrigatória para o agente de PRD).

| Fase | Escopo | Status |
|------|--------|--------|
| **1** | `UnidadeEmpresa`, CRUD, `Usuario.empresaUnidadeId`, UI empresa/usuários | Implementado |
| **2** | Dashboard filtrado por unidade | Implementado |
| **3** | `executivo_unidade`, `book_unidade*` (Blueprint + SATF) | Implementado |
| **4** | Comparativo entre unidades + iniciativas por unidade + roadmap filtrado | Implementado |

**Testado localmente hoje (2026-07-08):**
- Relatório **executivo** enterprise: OK (v1 e v2 salvas na biblioteca)
- Relatório **executivo por unidade**: OK
- **Book por unidade**: OK (job concluído, salvo na biblioteca)
- **Book completo enterprise (16 dim.)**: interrompido em testes (jobs cancelados); fluxo validado parcialmente
- **Comparativo unidades / roadmap por unidade**: implementado; validação E2E em PRD recomendada

---

## 2. ⭐ NÃO trazer versão antiga do relatório (PRIORIDADE MÁXIMA)

> **Regra do produto:** “Em hipótese nenhuma usar o anterior como referência — sempre gerar novo.”

Esta foi a principal correção pedida pelo usuário. O agente de PRD **deve garantir que este comportamento não regrida** após o deploy.

### 2.0 Comportamento ANTES vs DEPOIS

| Situação | ❌ ANTES (bug) | ✅ DEPOIS (correto) |
|----------|----------------|---------------------|
| Usuário abre tela “Gerar relatório IA” | Carregava último salvo compatível da biblioteca **antes** de gerar | Tela vazia / loading → enfileira **job novo** |
| Usuário muda avaliações e gera de novo | Via texto da **versão antiga** (dados desatualizados) | IA roda de novo → **nova versão** na biblioteca |
| Job em background conclui | Às vezes recarregava fluxo genérico ou conteúdo antigo | Carrega **só** o `relatorioId` que o job acabou de criar |
| API chamada pelo frontend | Podia omitir `reuse` ou backend assumia cache | **Sempre** `reuse=false` nas rotas de geração |
| API chamada pelo worker de jobs | Idem | URLs internas **sempre** `?reuse=false` |
| Resposta `fromCache: true` num job | Job podia marcar “concluído” sem versão nova | Job **falha** com erro explícito |
| Usuário clica item na **Biblioteca** | — | Abre versão salva via `relatorioSalvoId` (**única exceção**) |

### 2.1 Única exceção permitida (versão antiga de propósito)

Versão antiga só pode aparecer quando o usuário **escolhe explicitamente**:

1. **Biblioteca de Relatórios IA** → botão “Visualizar” em um item  
   → URL contém `relatorioSalvoId=<id>`  
   → Frontend faz `GET /api/relatorios-ia/:id` (somente leitura)

2. **API explícita** (uso avançado / debug): `POST .../relatorio-ia?reuse=true`  
   → Retorna último salvo com `fromCache: true`  
   → **Não é usado** pelo frontend nem pelos jobs em produção

**Qualquer outro caminho = gerar novo.**

### 2.2 Onde a regra está implementada (não remover no merge)

#### Política central (backend)
```javascript
// backend/src/utils/reutilizarRelatorioIA.js
export function deveReutilizarRelatorioIASalvo(req) {
  return req.query.reuse === 'true';  // default efetivo = false
}
```

#### Rotas que respeitam a política
| Rota | Arquivo |
|------|---------|
| `POST /api/dashboard/projeto/:id/relatorio-ia` | `index.js` |
| `POST .../relatorio-ia-completo` | `index.js` |
| `POST .../relatorio-ia-unidade` | `relatorioExecutivoUnidadeBlueprint.js` / SATF |
| `POST .../relatorio-ia-book-unidade` | `bookUnidadeOrganizacionalIA.js` / SATF |
| Fetch interno dos jobs | `relatorios-ia-jobs.js` — **todas** as URLs montadas com `reuse=false` |

#### Worker de jobs — trava de segurança
```javascript
// relatorios-ia-jobs.js — após fetch interno
if (payload?.fromCache === true) {
  throw new Error('A geração retornou versão em cache. Nova versão não foi produzida...');
}
```

#### Frontend — o que foi removido (causa do bug)
- **`carregarRelatorioSalvoSeCompativel`** — removido de `RelatorioMITIA.jsx` e `RelatorioMITIACompleto.jsx`
- Função auxiliar removida de `filtroNivelMaturidade.js`
- **Efeito:** ao montar a página **sem** `relatorioSalvoId`, **não** busca mais “último compatível” na biblioteca

#### Frontend — o que foi adicionado
| Arquivo | Comportamento |
|---------|---------------|
| `api.js` | `new URLSearchParams({ reuse: 'false' })` em todas as chamadas de geração |
| `relatorioIAGeracao.js` | `relatorioIdFromJobStatus` + `carregarRelatorioSalvoPorId` |
| `RelatorioMITIA*.jsx` | Ao iniciar geração: `setData(null)`; ao completar job: load pelo ID do job |
| `relatorioIAViewModel.js` | `fromCache: true` **somente** quando veio da biblioteca (`mapRelatorioIASalvoToViewShape`) |

### 2.3 Fluxo que o agente deve validar em PRD

**Teste A — Geração nova (obrigatório)**
1. Anotar `versao` atual na biblioteca (ex.: v2)
2. Abrir relatório executivo **sem** `relatorioSalvoId` na URL  
   Ex.: `/relatorios/1/mit-ia?nivelPrioridadeMapeamentoMaturidade=3`
3. Aguardar conclusão (~1–2 min)
4. Biblioteca deve ter **v3** (ou N+1)
5. Conteúdo deve refletir dados **atuais** (não copiar v2)

**Teste B — Mudança de dados (obrigatório)**
1. Alterar uma resposta de avaliação (ou filtro de versão/nível)
2. Gerar de novo (sem `relatorioSalvoId`)
3. Nova versão salva; texto deve diferir se dados mudaram

**Teste C — Biblioteca explícita (obrigatório)**
1. Clicar versão **antiga** na biblioteca
2. URL deve ter `relatorioSalvoId=`
3. Banner “versão salva vN” / `fromCache` — **esperado aqui**
4. **Não** deve enfileirar job novo ao abrir

**Teste D — Anti-regressão (obrigatório)**
1. Inspecionar Network: chamadas de geração devem ter `reuse=false`
2. Job concluído deve ter `relatorioId` apontando para linha **nova** em `RelatorioIA`
3. Nunca marcar job `completed` se API retornou `fromCache: true`

### 2.4 Sinais de regressão (alerta vermelho pós-deploy)

| Sinal | Significa |
|-------|-----------|
| Tela mostra relatório **instantaneamente** ao abrir (sem job, sem `relatorioSalvoId`) | Auto-load voltou — **bug** |
| `versao` na biblioteca não incrementa após “gerar” | Não está salvando novo ou está reusando cache |
| Job `completed` mas `relatorioId` null ou aponta para registro antigo | Worker ou rota quebrados |
| Resposta JSON com `fromCache: true` em geração normal | `reuse=true` vazando ou política revertida |
| Usuário vê conteúdo antigo após mudar avaliações | Falha na política “sempre gerar novo” |

### 2.5 Causas que faziam parecer “versão antiga” (contexto para debug)

Além do reuse indevido, estes bugs **mascaravam** o problema ou **impediam** versão nova:

1. **Jobs zumbis** — `POST /start` devolvia job antigo `running` → usuário ficava olhando progresso de geração que nunca terminava (corrigido: `relatorioIAJobStale.js`)
2. **Retry quebrado** — “Tentar novamente” não iniciava nova geração (`geracaoIniciadaRef`)
3. **Book unidade crashava ao salvar** — IA terminava mas `RelatorioIA` não recebia insert (`dimsComDados` scope)

Mesmo corrigindo stale/retry, **a política `reuse=false` é a garantia principal** de não exibir versão antiga como se fosse nova.

### 2.6 Implicação para biblioteca em PRD

- Relatórios **já existentes** em produção **não são apagados**
- Deixam de ser abertos **automaticamente** ao entrar na tela de geração
- Cada geração bem-sucedida cria **nova linha** (`versao` incrementada por `projetoId` + `tipo`)
- Histórico continua acessível pela **Biblioteca** (comportamento desejado)

---

## 2B. Política de relatórios IA — referência técnica (complemento da seção 2)

### Backend (lista completa)
- `backend/src/utils/reutilizarRelatorioIA.js` → `deveReutilizarRelatorioIASalvo(req)` retorna `true` **somente** se `?reuse=true`
- Aplicado em:
  - `backend/src/index.js` — `POST .../relatorio-ia`, `.../relatorio-ia-completo`
  - `backend/src/utils/bookUnidadeOrganizacionalIA.js`
  - `backend/src/utils/relatorioExecutivoUnidadeBlueprint.js`
  - `backend/src/utils/satfBookIA.js`
  - `backend/src/utils/satfRelatorioExecutivoIA.js`
- Jobs internos: sempre `reuse=false` na URL interna (`relatorios-ia-jobs.js`)
- Job **falha explicitamente** se resposta vier com `fromCache: true` (evita marcar job como concluído sem versão nova)

### Frontend
- `frontend/src/services/api.js`: **todas** as rotas IA enviam `reuse=false` por padrão
- **Removido** auto-load silencioso `carregarRelatorioSalvoSeCompativel` de:
  - `RelatorioMITIA.jsx`
  - `RelatorioMITIACompleto.jsx`
  - (função removida de `filtroNivelMaturidade.js`)
- Ao abrir página de geração: **não** carrega última versão da biblioteca; enfileira job novo
- **Exceção intencional:** URL com `relatorioSalvoId` (clique na biblioteca) ainda abre versão salva
- Ao completar job em background: carrega **somente** `relatorioId` do status do job (`relatorioIAGeracao.js` → `relatorioIdFromJobStatus` + `carregarRelatorioSalvoPorId`), **não** chama `gerarRelatorio()` genérico
- Ao iniciar nova geração / regenerar: limpa `data` na tela para não misturar conteúdo antigo

### Implicação para PRD
Relatórios **já salvos na biblioteca em produção** permanecem intactos; só deixam de ser reabertos automaticamente ao entrar na tela de geração. Cada nova geração cria **nova linha** em `RelatorioIA` (versão incrementada).

---

## 2A. Acertos nos relatórios IA — histórico completo

Esta seção documenta **todos os problemas corrigidos** na sessão de 2026-07-08, para o agente de PRD entender o “antes/depois” e o que validar.

### 2A.1 Problema original reportado

> “Relatórios IA pareciam reutilizar versão anterior quando dados do projeto mudavam.”

**Sintomas observados:**
- Usuário alterava avaliações / filtros e ao gerar via UI via conteúdo antigo
- Jobs ficavam em `running` por horas sem concluir
- Biblioteca local vazia enquanto a tela mostrava texto (geração não persistia)
- Botão “Tentar novamente” não fazia nada
- Book por unidade travava em ~30% de progresso
- Banner falso “Seção 3 incompleta (0/16)” ao abrir book por unidade da biblioteca

---

### 2A.2 Tabela de acertos (causa → correção → arquivo)

| # | Problema | Causa raiz | Correção | Arquivo(s) |
|---|----------|------------|----------|------------|
| 1 | Versão antiga na tela após mudar dados | Frontend auto-carregava último salvo compatível antes de gerar | Removido `carregarRelatorioSalvoSeCompativel`; política `reuse=false` | `RelatorioMITIA.jsx`, `RelatorioMITIACompleto.jsx`, `api.js`, `reutilizarRelatorioIA.js` |
| 2 | Job concluído mas tela errada | Polling chamava fluxo genérico em vez de `relatorioId` do job | `relatorioIdFromJobStatus` + `carregarRelatorioSalvoPorId` | `relatorioIAGeracao.js`, páginas de relatório |
| 3 | Backend caía → login HTTP 500 | `parseJsonSeguro` sem wrapper `function` → `SyntaxError: Illegal return` | Restaurado `function parseJsonSeguro(raw) { ... }` | `relatorios-ia-jobs.js` |
| 4 | Book unidade não salvava na biblioteca | `dimsComDados` declarado dentro do `try` e usado fora → `ReferenceError` após IA terminar | `dimsComDados` movido para escopo da função; `totalChunks` reutilizado no save | `bookUnidadeOrganizacionalIA.js` |
| 5 | Shadowing quebrava markdown unidade | `let markdown` shadowing em assignment (sessão anterior) | Corrigido assignment único | `bookUnidadeOrganizacionalIA.js` |
| 6 | Nenhuma geração nova iniciava | Jobs zumbis `queued`/`running` → `POST /start` retornava `reused: true` | Detecção stale + fail no startup e no `/start` | `relatorioIAJobStale.js`, `relatorios-ia-jobs.js`, `index.js` |
| 7 | “Tentar novamente” silencioso | `geracaoIniciadaRef.current` permanecia `true` após erro | Reset em erro, retry com `forceRegenerate=true` | `RelatorioMITIA.jsx`, `RelatorioMITIACompleto.jsx`, `relatorioIAGeracao.js` |
| 8 | Job anexava zumbi antigo no frontend | `obterJobAtivo` aceitava qualquer `running` | `resolverJobRelatorioIaAtivo` cancela job stale | `relatorioIAGeracao.js` |
| 9 | Progresso book unidade parado em 30% | Job worker só atualizava até 30%; rota unidade não reportava chunks; `metadata` como objeto quebrava Prisma | `reportarProgresso()` + `jobId` na query; `metadata: JSON.stringify(...)` | `bookUnidadeOrganizacionalIA.js`, `relatorios-ia-jobs.js` (passa `jobId` na URL interna) |
| 10 | Job marcado OK com cache | Resposta `fromCache: true` apesar de `reuse=false` | Throw no worker se `payload.fromCache === true` | `relatorios-ia-jobs.js` |
| 11 | Banner “Seção 3 incompleta 0/16” em book unidade | Validador enterprise (`## 3.N Dimensão`) aplicado a book unidade (estrutura `## 2.N`) | `secao3Incompleta` desligado para `book_unidade*` / escopo unidade | `RelatorioMITIACompleto.jsx` |
| 12 | Labels de etapa genéricos para book unidade | Worker não distinguia tipos unidade | `labelEtapaJobRelatorioIA()` inclui `book_unidade*` | `relatorios-ia-jobs.js` |
| 13 | Tipos IA inválidos / confusão SATF vs unidade | Tipos espalhados | Centralizado em `TIPOS_RELATORIO_IA_*` + validação no `/start` | `tiposRelatorioIA.js`, `relatorios-ia-jobs.js` |
| 14 | Conteúdo antigo visível ao regenerar | State React não limpo | `setData(null)` ao iniciar background / force regenerate | `RelatorioMITIA*.jsx` |

---

### 2A.3 Fluxo correto pós-acertos (referência para teste)

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant Jobs as POST /relatorios-ia-jobs/start
  participant Worker as processarJobRelatorioIA
  participant Gen as POST /relatorio-ia* ?reuse=false
  participant DB as RelatorioIA

  UI->>Jobs: start (tipo, projetoId, versaoId, unidade?)
  Jobs->>Jobs: fail stale jobs; reuse=false se ativo válido
  Jobs-->>UI: 202 { job }
  Worker->>Gen: fetch interno com auth + jobId (books)
  Gen->>DB: salvarRelatorioIA (fromCache=false)
  Gen-->>Worker: { relatorioSalvoId, fromCache:false }
  Worker->>Worker: fail se fromCache true
  UI->>UI: poll job até completed
  UI->>DB: GET /relatorios-ia/:relatorioId
  UI->>UI: exibir versão nova
```

**Abertura pela biblioteca (exceção):**
- URL com `relatorioSalvoId=N` → `GET /relatorios-ia/N` direto, **sem** enfileirar job

---

### 2A.4 Tipos de relatório IA suportados

Definidos em `backend/src/constants/tiposRelatorioIA.js`:

| Tipo | Descrição |
|------|-----------|
| `executivo` | C-Level enterprise |
| `executivo_unidade` | C-Level por unidade (`empresaUnidadeId` obrigatório no job) |
| `completo` / `completo_rapido` | Book 16 dim. Blueprint |
| `completo_satf` / `completo_satf_rapido` | Book SATF TI v3 |
| `book_unidade` / `book_unidade_rapido` | Book Blueprint por unidade |
| `book_unidade_satf` / `book_unidade_satf_rapido` | Book SATF por unidade |

Jobs exigem `empresaUnidadeId` quando `isTipoRelatorioIAUnidade(tipo)`.

---

### 2A.5 Scripts operacionais (relatórios IA)

```bash
# Marcar jobs queued/running obsoletos como failed (PRD ou local)
cd backend && node scripts/fix-stale-relatorio-ia-jobs.js

# Cancelar todos jobs ativos manualmente (SQL/Prisma ad hoc — usado em debug)
# Preferir API POST /api/relatorios-ia-jobs/:id/cancel ou script acima
```

---

### 2A.6 Validação pós-deploy — relatórios IA (checklist dedicado)

| Teste | Passos | Esperado |
|-------|--------|----------|
| Executivo novo | Dashboard → Relatório IA C-Level → aguardar ~1–2 min | Nova versão na biblioteca; conteúdo reflete dados atuais |
| Não reutilizar | Alterar avaliação → gerar de novo **sem** `relatorioSalvoId` | Versão N+1; texto diferente se dados mudaram |
| Biblioteca explícita | Clicar item antigo na biblioteca | Abre versão salva (`relatorioSalvoId` na URL) |
| Job idempotente | Clicar gerar 2x rápido | Um job ativo ou reuse do mesmo job válido; **não** zumbi eterno |
| Retry após falha | Forçar erro (ex. sem API key) → “Tentar novamente” | Nova tentativa inicia de fato |
| Book unidade | URL com `empresaUnidadeId` → background | Job progride além de 30%; salva `book_unidade`; **sem** banner Seção 3 |
| Book completo | Sem unidade → background | Progresso bloco a bloco; ~20–40 min; salva `completo` |
| fromCache | (inspeção logs) | Worker **não** completa se `fromCache: true` |

**Validado local em 2026-07-08:** executivo ✅, executivo_unidade ✅, book_unidade ✅. Book completo enterprise: interrompido em teste (jobs cancelados manualmente).

---

### 2A.7 O que NÃO muda com estes acertos

- **Scores / avaliações / médias de maturidade** — relatórios IA são leitura + persistência de Markdown; não recalculam diagnóstico
- **Relatórios já na biblioteca PRD** — permanecem; apenas deixam de ser auto-carregados na tela de geração
- **Consultoria nos textos** — continua SysMap (não MIT); ver seção 12

---

## 3. Jobs IA em background — correções (resumo)

> Detalhamento completo na **seção 2A**. Esta seção é índice rápido.

### Problemas que existiam
1. Jobs `queued`/`running` **zumbis** bloqueavam novas gerações (`POST /start` devolvia `reused: true`)
2. Botão **“Tentar novamente”** no frontend não resetava `geracaoIniciadaRef` (retry silencioso)
3. `parseJsonSeguro` quebrado em `relatorios-ia-jobs.js` derrubava backend (corrigido em sessão anterior)
4. Book por unidade: `dimsComDados` fora de escopo → crash ao salvar após IA terminar
5. Progresso book unidade: `metadata` passado como objeto em vez de `JSON.stringify`

### Arquivos novos/alterados
| Arquivo | Função |
|---------|--------|
| `backend/src/utils/relatorioIAJobStale.js` | Detecta jobs órfãos (sem heartbeat) |
| `backend/src/index.js` | `recuperarJobsRelatorioIAOrfaos()` no startup |
| `backend/src/routes/relatorios-ia-jobs.js` | Marca stale antes de reutilizar job; labels book unidade |
| `backend/scripts/fix-stale-relatorio-ia-jobs.js` | Script manual: `node backend/scripts/fix-stale-relatorio-ia-jobs.js` |
| `frontend/src/utils/relatorioIAGeracao.js` | `resolverJobRelatorioIaAtivo`, reset de refs |
| `frontend/src/pages/RelatorioMITIA.jsx` | Retry + stale jobs |
| `frontend/src/pages/RelatorioMITIACompleto.jsx` | Idem + banner Seção 3 não aplica a book unidade |

### Limites stale (config implícita)
- Executivo: **20 min** sem `updatedAt`
- Book (completo/unidade/SATF): **120 min** sem `updatedAt`

---

## 4. Fase 4 — Comparativo + Roadmap por unidade

### Backend
- `backend/src/utils/comparativoUnidadesOrganizacionais.js`
- `GET /api/dashboard/projeto/:id/comparativo-unidades`
- `Iniciativa.empresaUnidadeId` (migration + `ensureIniciativaSchema()`)
- `POST /api/iniciativas/importar-gaps-unidade`
- Filtro `empresaUnidadeId` em `GET /api/iniciativas` e export CSV

### Frontend
- `frontend/src/pages/ComparativoUnidadesProjeto.jsx` (nova)
- Rota: `/dashboard/projeto/:id/comparativo-unidades`
- Link no `DashboardProjeto.jsx`
- `RoadmapTimeline.jsx`: filtro unidade na URL, dropdown, import gaps por unidade
- `api.js`: `comparativoUnidades()`, `importarGapsUnidade()`

### Critérios de aceite Fase 4
1. Comparativo mostra N unidades com score e matriz por dimensão
2. Delta vs enterprise visível
3. Import de gaps cria iniciativas **só da unidade escolhida**
4. Roadmap filtra por `empresaUnidadeId`
5. Geração IA não auto-carrega versão anterior (exceto biblioteca explícita)

---

## 5. Fases 1–3 — Referência rápida

### Schema / migrations (aplicar em PRD via `prisma migrate deploy`)

| Migration | Conteúdo |
|-----------|----------|
| `20260708140000_unidade_empresa` | Tabela `UnidadeEmpresa`, `Usuario.empresaUnidadeId` |
| `20260708170000_iniciativa_empresa_unidade` | `Iniciativa.empresaUnidadeId` + índice |

**Runtime fallback:** `ensureIniciativaSchema()`, `ensureUnidadeEmpresaSchema()` no startup (`index.js` / `lib/prisma.js`) — deploy seguro mesmo se migration atrasar, mas **preferir migrate deploy**.

### Rotas principais novas
- `backend/src/routes/empresa-unidades.js` — CRUD unidades
- `POST .../relatorio-ia-unidade`, `POST .../relatorio-ia-book-unidade`
- Tipos IA: `backend/src/constants/tiposRelatorioIA.js`

### Utils principais
- `empresaUnidade.js`, `relatorioUnidadeIA.js`
- `relatorioExecutivoUnidadeBlueprint.js`, `bookUnidadeOrganizacionalIA.js`, `bookUnidadeContexto.js`

### Frontend
- `EmpresaDetalhe.jsx`, `Usuarios.jsx` — unidades
- `DashboardProjeto.jsx` — filtro unidade + links relatórios/comparativo
- `RelatoriosIABiblioteca.jsx` — tipos unidade + query params

---

## 6. Migrações e banco — ATENÇÃO PRD

### Antes do deploy
```bash
docker exec blueprint-ia-backend-prod npx prisma migrate status
```
Se houver migration **failed** (P3009), resolver **antes** de aplicar novas.

### Após deploy
Validar colunas:
```sql
-- UnidadeEmpresa existe
SELECT COUNT(*) FROM "UnidadeEmpresa";

-- Iniciativa.empresaUnidadeId
SELECT column_name FROM information_schema.columns
WHERE table_name = 'Iniciativa' AND column_name = 'empresaUnidadeId';

-- Usuario.empresaUnidadeId (pode precisar owner do banco)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'Usuario' AND column_name = 'empresaUnidadeId';
```

### Aviso ambiente local (pode repetir em PRD se user DB ≠ owner)
Logs `[schema] ... must be owner of table` em `Empresa`, `Usuario`, `Area` — **não derrubam** o servidor, mas colunas podem não ser criadas via `$executeRawUnsafe`.  
Script de referência: `backend/scripts/fix-usuario-empresa-unidade-id.sql` (rodar como **owner** do banco se necessário).

---

## 7. Fluxo de publicação (obrigatório — AGENTS.md)

1. **Commitar** mudanças na branch de release (`release/prd-*`)
2. Executar:
   ```bash
   ./scripts/publish-prd-release.sh
   ```
   (Azure DevOps + pipeline + smoke test; espelha GitHub via `sync-github-main.sh`)
3. Confirmar:
   ```bash
   curl -sS https://agentica.sysmap.com.br/api/release-info
   git ls-remote github refs/heads/main
   ```

**Não** considerar deploy concluído só com Azure — GitHub `main` faz parte do aceite.

---

## 8. Checklist pós-deploy (agente de implantação)

### Smoke HTTP
- [ ] `GET /api/release-info` → 200
- [ ] Login admin
- [ ] `GET /api/dashboard/projeto/:id/comparativo-unidades` → 200 com unidades
- [ ] `GET /api/iniciativas?projetoId=X&empresaUnidadeId=Y` → filtrado
- [ ] `POST /api/relatorios-ia-jobs/start` tipo `executivo` → job enfileira e completa

### Relatórios IA — **prioridade: não trazer versão antiga** (seção 2.3)
- [ ] Gerar executivo **sem** `relatorioSalvoId` → versão N+1 na biblioteca
- [ ] Alterar dado do projeto → gerar de novo → conteúdo atualizado (não cópia da v anterior)
- [ ] Network: todas as POST de geração com `reuse=false`
- [ ] Job concluído: `relatorioId` aponta para registro **novo**; nunca `fromCache: true`
- [ ] Abrir pela biblioteca (`relatorioSalvoId`) → versão antiga **só aqui** (esperado)
- [ ] Gerar **book completo** (opcional smoke longo ~30 min) ou validar job progride
- [ ] Book **por unidade** com `empresaUnidadeId` → salva tipo `book_unidade`

### Fase 4 UI
- [ ] Dashboard → Comparativo unidades
- [ ] Importar gaps → Roadmap com `?empresaUnidadeId=`

### Jobs órfãos
Se PRD tiver jobs travados de release anterior:
```bash
cd backend && node scripts/fix-stale-relatorio-ia-jobs.js
```

---

## 9. O que NÃO incluir no commit/deploy desta release

Excluir do pacote de produção (não relacionados ou lixo):
- `cavaleiro-sombrio/` — projeto Godot sandbox
- `.github/workflows/cavaleiro-sombrio-sandbox.yml`
- `avaliador-mobile/.expo/`
- Arquivos `~$*` / temporários Office em `docs/`
- `backend/scripts/reset-admin-password.js` — só dev local

---

## 10. Arquivos modificados (git — visão 2026-07-08)

### Backend (tracked modified)
`schema.prisma`, `index.js`, `lib/prisma.js`, `iniciativas.js`, `relatorios-ia-jobs.js`, `relatorios-ia.js`, `satfBookIA.js`, `satfRelatorioExecutivoIA.js`, `schemas.js`, `exportRelatorioFrameworkMeta.js`

### Backend (novos — incluir no commit)
`migrations/20260708140000_*`, `migrations/20260708170000_*`, `empresa-unidades.js`, `tiposRelatorioIA.js`, `bookUnidade*.js`, `comparativoUnidadesOrganizacionais.js`, `empresaUnidade.js`, `relatorioExecutivoUnidadeBlueprint.js`, `relatorioUnidadeIA.js`, `reutilizarRelatorioIA.js`, `relatorioIAJobStale.js`, `fix-stale-relatorio-ia-jobs.js`, `fix-usuario-empresa-unidade-id.sql`

### Frontend (modified + novo)
`ComparativoUnidadesProjeto.jsx` (novo), `relatorioIAGeracao.js` (novo), `App.jsx`, `DashboardProjeto.jsx`, `EmpresaDetalhe.jsx`, `RelatorioMITIA*.jsx`, `RelatoriosIABiblioteca.jsx`, `RoadmapTimeline.jsx`, `Usuarios.jsx`, `api.js`, `filtroNivelMaturidade.js`, `frameworkMaturidade.js`

---

## 11. Bugs / UX conhecidos (pós-fix)

| Sintoma | Causa | Status / Ação |
|---------|-------|----------------|
| Biblioteca vazia em **local** vs cheia em **PRD** | Bancos diferentes | Esperado; PRD tem histórico próprio |
| Banner “Seção 3 incompleta 0/16” em **book unidade** | Validador enterprise na tela errada | **Corrigido** — ver 2A.2 #11 |
| Job preso em 30% (book unidade) | Progresso/metadata | **Corrigido** — ver 2A.2 #9 |
| Book completo demora 20–40 min | 24 chunks IA | Normal; usar background |
| Retry não funcionava | `geracaoIniciadaRef` | **Corrigido** — ver 2A.2 #7 |
| Geração não persistia (book unidade) | `dimsComDados` scope | **Corrigido** — ver 2A.2 #4 |
| Backend 500 no login | `parseJsonSeguro` syntax | **Corrigido** — ver 2A.2 #3 |

---

## 12. Consultores IA (regra AGENTS.md)

Nos books/relatórios gerados:
- **Consultores = SysMap Solutions**, não MIT
- MIT CISR = referência metodológica apenas
- Prompts: `backend/src/constants/consultorRelatorioIA.js`
- UI: `frontend/src/constants/consultorRelatorioIA.js`

---

## 13. Validadores existentes (outros módulos — não cobrem esta release)

Esta entrega **não** tem validador dedicado `validate:comparativo-unidades` ainda. Validadores obrigatórios AGENTS.md para **outros** módulos:
- `npm run validate:versioning`
- `npm run validate:roadmap-executive`

**Recomendação:** smoke manual seção 8 + opcional script futuro para comparativo-unidades.

---

## 14. Estado local no fim do dia (referência)

- Postgres local: `127.0.0.1:5432/blueprint_ia`
- Relatórios salvos localmente: executivo v1/v2, executivo_unidade v1, book_unidade v1
- Nenhum `completo` enterprise salvo localmente (jobs cancelados durante debug)
- Servidores dev: backend `:3001`, frontend `:5173`

---

## 15. Ordem sugerida para o agente de release

1. **Ler seção 2** (não trazer versão antiga) — critério de aceite #1 desta release
2. Revisar diff e **commitar** apenas arquivos da feature (excluir seção 9)
3. `prisma migrate deploy` em PRD (via pipeline habitual)
4. Verificar `migrate status` — zero failed
5. Deploy app (docker compose / pipeline)
6. **Smoke seção 2.3 + checklist relatórios IA (seção 8)** — antes de considerar OK
7. `./scripts/publish-prd-release.sh` + confirmar GitHub `main`
8. Comunicar: biblioteca PRD **mantém histórico**; geração nova **sempre** cria versão nova (exceto clique explícito na biblioteca)

---

## 16. Estrutura obrigatória dos Books IA (2026-07-13)

> **Critério de aceite desta entrega:** apêndices por último + dimensões fora do foco omitidas.

### Regras implementadas

| Regra | MIT completo | SATF completo | Book unidade |
|-------|--------------|---------------|--------------|
| `# APÊNDICES METODOLÓGICOS` **por último** (após índice, capas, sec 13/14) | ✅ | ✅ | ✅ (modo completo) |
| Seção 12 = **Material Complementar** (scores + biblio) — **sem** glossário/metodologia duplicados | ✅ | N/A (SATF não tem sec 12) | N/A |
| `dimensoesFoco` na unidade → **só** essas dims no dashboard, Seção 3, dados IA e prompts | N/A | ✅ | ✅ |
| Dimensões fora do foco **não mencionadas** | N/A | ✅ | ✅ |
| SATF unidade: sec 5 (D10) / sec 6 (D11) omitidas se fora do foco | N/A | ✅ | ✅ |

### Arquivos desta entrega (commitar)

| Arquivo | Função |
|---------|--------|
| `backend/src/utils/bookApendicesMetodologicos.js` | Apêndices A/B determinísticos + `posicionarApendicesMetodologicosComoUltimaSecao()` |
| `backend/src/utils/bookDadosDimensao.js` | `filtrarDimensoesFocoUnidade`, dados isolados por dimensão |
| `backend/src/index.js` | Book MIT completo: sec 12 material complementar; apêndices após capas |
| `backend/src/utils/satfBookIA.js` | Book SATF: apêndices finais; foco unidade; assembly Seção 3 filtrada |
| `backend/src/utils/bookUnidadeOrganizacionalIA.js` | Book MIT unidade: foco + apêndices finais |
| `backend/src/utils/bookUnidadeContexto.js` | Dashboard/instruções: proíbe mencionar dims fora do foco |
| `docs/ESTRUTURA_OBRIGATORIA_BOOKS_IA.md` | Referência de estrutura (4 tipos de book) |

### Validação pós-deploy — books (smoke)

**Book completo MIT**
1. Gerar book completo (background, ~30 min) ou inspecionar último salvo **após** deploy
2. Ordem: seções 1–14 → **último bloco** = `# APÊNDICES METODOLÓGICOS` (A Metodologia, B Glossário)
3. **Não** deve haver `# 12. APÊNDICES` com glossário **antes** da seção 13

**Book por unidade (ex.: foco D4, D5)**
1. Cadastrar unidade com `dimensoesFoco = ["D4","D5"]`
2. Gerar `book_unidade` ou `book_unidade_satf`
3. Dashboard e Seção 3 **só** D4/D5; demais dimensões **ausentes** do texto
4. Apêndices metodológicos no **final** (modo completo)

**Regeneração**
- Books **já na biblioteca PRD** mantêm estrutura antiga até **regenerar**
- Modo rápido **não** anexa apêndices metodológicos (comportamento esperado)

### Documentação
Ver `docs/ESTRUTURA_OBRIGATORIA_BOOKS_IA.md` para árvore completa das seções.

---

## 17. Books por unidade — foco GRT, Seção 3, índice e KPIs (2026-07-13)

> **Critério de aceite adicional:** book SATF por unidade com foco definido deve ter Seção 3 completa, numeração sequencial no índice e recomendações/KPIs por dimensão.

### Problema corrigido (book GRT / Governança Operacional)

| Sintoma | Causa | Correção |
|---------|-------|----------|
| Índice `1, 2, 4, 7, 8` (lacunas 3, 5, 6) | Seção 3 omitida quando dims em foco tinham score individual 0; sec 5/6 (D10/D11) fora do foco mantinham números 7/8 | `dimensoesSecao3BookUnidade()` inclui dims em foco mesmo com score 0; `renumerarSecoesPrincipaisBookSatfUnidade()` compacta 4→5→6 |
| Seção 3 ausente | Early return em chunk quando `dimensaoComScoreZero` | Book por unidade gera análise completa + prompt exige R1–R3 e KPIs |
| Foco corrompido (`ESTRATÉGIA`, `C-LEVEL`…) | Split agressivo no cadastro | `normalizarDimensoesFocoInput()` — commit `a301c75` |
| D8 aparecia indevidamente | Anotação “NÃO APARECE” em segmento separado | Exclusão por contexto após código (`NÃO, APARECE`) |

### Commits desta release (books)

| SHA | Mensagem |
|-----|----------|
| `ee691f2` | Apêndices finais + filtro básico por `dimensoesFoco` |
| `a301c75` | Normalizador de foco + numeração 3.N relativa + UI EmpresaDetalhe |
| `285df68` | Seção 3 score-zero + renumeração índice + testes |

### Arquivos (além da seção 16)

| Arquivo | Função |
|---------|--------|
| `backend/src/utils/satfBookTaxonomia.js` | `construirMapaRenumeracaoSecoesPrincipaisSatfUnidade`, `renumerarSecoesPrincipaisBookSatfUnidade` |
| `backend/src/utils/bookDadosDimensao.js` | `dimensoesSecao3BookUnidade()` |
| `backend/test/bookUnidadeSecoes.test.js` | Testes normalizador + renumeração + índice |

### Numeração esperada — GRT (foco D1, D3, D4, D7)

```
1. Metodologia
2. Sumário executivo
3. Diagnóstico por dimensão
   3.1 D1 — …
   3.2 D3 — …
   3.3 D4 — …
   3.4 D7 — …
   (cada uma: diagnóstico, recomendações R1–R3, KPIs)
4. Roadmap 30-60-90
5. Capacitação e governança   (antes era 7)
6. Próximos passos             (antes era 8)
APÊNDICES METODOLÓGICOS
```

Índice: **1, 2, 3, 3.1–3.4, 4, 5, 6** — sem lacunas.

### Smoke pós-deploy (obrigatório para books unidade)

```bash
cd backend && node --test test/bookUnidadeSecoes.test.js
# Esperado: 6 pass, 0 fail
```

**Manual (GRT):**
1. Empresa → Unidade **Governança Operacional** → salvar foco `D1, D3, D4, D7` (ou reabrir/salvar — normalizador limpa JSON antigo)
2. Gerar **book SATF por unidade** (`book_unidade_satf` ou completo SATF com filtro unidade) — **reuse=false**, job background
3. Validar no documento:
   - Seção 3 presente com 4 subseções
   - Cada subseção com recomendações e tabela KPI
   - Índice sem saltos 1,2,4,7,8
   - Sem D8, D10, D11 no corpo
   - Apêndices por último
4. Books **já na biblioteca** mantêm versão antiga até **regenerar**

### Ordem para agente de release (atualizada)

1. Ler seções **2** (reuse) e **17** (books GRT)
2. Confirmar branch `release/prd-20260701` — HEAD inclui foco MIT/SATF + estrutura unidade 1–5
3. `./scripts/publish-prd-release.sh` (ou pipeline habitual + `./scripts/sync-github-main.sh HEAD`)
4. Smoke seção 2.3 + seção 17 + testes `bookUnidadeSecoes.test.js`
5. Avisar usuário: **regenerar book GRT** após deploy

---

## 18. FECHAMENTO DE VERSÃO — Books por unidade (2026-07-14)

> **Escopo desta versão considerado FECHADO** em `release/prd-20260701`.

### Entregue e aceito nesta versão

| Item | Status |
|------|--------|
| Foco SATF (`D*`) e MIT (`BP*`) separados no cadastro da unidade | ✅ |
| Book por unidade outline **1–5** + apêndices (sem Seção 0; sem D10/D11 dedicadas) | ✅ |
| Template por dimensão `3.x.1`–`3.x.6` | ✅ |
| Índice sequencial; Seção 3 só com dims em foco | ✅ |
| Progresso de job / anti-travamento background | ✅ |
| Book enterprise completo (1–8 SATF / 1–14 MIT) **inalterado** no contrato | ✅ |

### Fora desta versão fechada (próximo incremento)

| Item | Status |
|------|--------|
| Papel opcional por dimensão: **Proprietário / Consumidor / Não se aplica** | 🔜 seção 19 |
| Papéis compostos (both / owner parcial) | Adiado |

---

## 19. Papel por dimensão (Proprietário / Consumidor / Não se aplica)

> Incremento **após** o fechamento da seção 18.

### Regras de produto

| Valor | Efeito no book IA |
|-------|-------------------|
| **Não se aplica** (ou ausente) | Ignora a classificação — análise como hoje |
| **Proprietário** | Unidade é **dona** da dimensão: define padrão, métrica, arbitragem, evolução |
| **Consumidor** | Unidade **consome** a dimensão: adere a padrão, rituais, escalona dependências |

- Opcional no cadastro (por código, por framework SATF/MIT).
- Só afeta **books/relatórios com unidade**; books enterprise sem unidade não usam papel.
- `dimensoesFoco*` continua definindo **quais** dims entram; o papel define **como** analisar.

### Persistência

- `UnidadeEmpresa.dimensoesPapelSatf` / `dimensoesPapelMit` — JSON `{ "D1": "consumidor", "D4": "proprietario" }`
- Migration: `20260714120000_unidade_papel_dimensao`

---

*Documento gerado para continuidade entre agentes. Atualizar SHA final após commit.*

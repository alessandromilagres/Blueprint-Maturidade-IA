# Estrutura obrigatória — Books IA (MIT Blueprint e SATF)

Documento de referência para geração, validação e revisão dos books produzios por IA no backend (`backend/src/index.js`, `satfBookIA.js`, `bookUnidadeOrganizacionalIA.js`).

---

## Regras transversais

### 1. Apêndices metodológicos são sempre a última seção

O bloco **`# APÊNDICES METODOLÓGICOS`** (Apêndice A — Metodologia + Apêndice B — Glossário) é **determinístico** — montado por `bookApendicesMetodologicos.js`, **não** pela IA.

| Onde | Função |
|------|--------|
| Posicionamento | `posicionarApendicesMetodologicosComoUltimaSecao()` |
| Momento | **Após** índice, capas, Seção 0 (unidade), Seção 13/14 e demais prepends |
| Conteúdo IA | **Proibido** duplicar glossário/metodologia em seções numeradas anteriores |

**Ordem de montagem (completo):**

```
corpo IA (seções 1–N)
  → Seção 14 regulatória (MIT, se aplicável)
  → índice navegável
  → capa de avaliadores / confidencial / unidade
  → Seção 0 dashboard (books por unidade)
  → APÊNDICES METODOLÓGICOS   ← literalmente o último conteúdo
```

### 2. Dimensões fora do foco = omitidas totalmente

Quando a unidade organizacional tem `dimensoesFoco` cadastrado (ex.: `["D4","D5","D10"]`):

| Elemento | Comportamento |
|----------|---------------|
| Dashboard (Seção 0) | Tabela, top 3, gaps e plano só das dims em foco |
| Seção 3 / 2 (diagnóstico) | Chunks gerados **somente** para dims em foco |
| Prompts / dadosBlock | Scores e perguntas **somente** das dims em foco |
| IA | **Proibido** mencionar, listar ou referenciar dims fora do foco |
| Fallback | **Sem** fallback para “todas as dimensões” |

Funções: `filtrarDimensoesFocoUnidade`, `indicesDimensoesFocoUnidade`, `instrucoesSistemaBookUnidade`.

Sem `dimensoesFoco` → todas as dimensões do framework entram normalmente.

---

## MIT Blueprint — Book completo (`completo` / `completo_rapido`)

**Framework:** 16 dimensões · referência MIT CISR · escala N1–N5  
**Gerador:** `POST /api/projetos/:id/relatorio-ia-completo` → `index.js`

### Estrutura (modo completo)

| Ordem | Seção | Conteúdo |
|:-----:|-------|----------|
| — | Capa / confidencial | Prepended após montagem |
| — | Índice navegável | `adicionarIndiceAoBookMarkdown` |
| — | Capa avaliadores | Filtro de prioridade de mapeamento |
| 1 | Metodologia aplicada | MIT CISR + escala Blueprint |
| 2 | Sumário executivo | Diagnóstico, trajetória MIT, evolução entre versões |
| 3 | Diagnóstico por dimensão | **3.1 … 3.16** — uma subseção por dimensão do framework |
| 4 | Análise de gaps prioritários | Top 5 gaps |
| 5 | Alavancagem de pontos fortes | Top 5 forças |
| 6 | Roadmap de transformação (12 meses) | 4 fases M1–M12 |
| 7 | Matriz de dependências | Caminho crítico |
| 8 | Projeção de impacto financeiro | ROI líquido, cenários 12m |
| 9 | Governança e estrutura recomendada | CoE, políticas |
| 10 | Riscos e mitigações | Top 10 |
| 11 | KPIs estratégicos | Negócio, DORA/MLOps, FinOps, pessoas |
| 12 | Material complementar | **12.1** scores por pergunta · **12.2** bibliografia |
| 13 | Próximos passos imediatos (30 dias) | Ações numeradas |
| 14 | Conformidade regulatória | Se módulo regulatório ativo no projeto |
| **∴** | **APÊNDICES METODOLÓGICOS** | **A** Metodologia Blueprint · **B** Glossário (+ glossário do projeto) |

> **Seção 12 ≠ Apêndices A/B.** Glossário e metodologia canônicos ficam **somente** no bloco final.

### Modo rápido

Seções condensadas (4+5, 6+7, 8–11, 12+13). Apêndices metodológicos **não** são anexados no modo rápido.

---

## SATF TI v3 — Book completo (`completo_satf`)

**Framework:** 11 dimensões D1–D11 · maturidade TI/engenharia  
**Gerador:** `executarGeracaoBookSatf` → `satfBookIA.js`

### Estrutura (modo completo)

| Ordem | Seção | Conteúdo |
|:-----:|-------|----------|
| — | Capa confidencial SATF | Prepended |
| — | Índice navegável | Modo `satf` |
| — | Capa avaliadores | Filtro prioridade |
| 1 | Metodologia SATF TI v3 | Instrumento, 3 camadas, score oficial vs declarado |
| 2 | Sumário executivo | Diagnóstico TI, entregáveis A–H |
| 3 | Diagnóstico por dimensão | **3.1 … 3.11** — D1–D11 (numeração canônica) |
| 4 | Roadmap engenharia & plataforma | Horizonte 30-60-90 |
| 5 | Fábrica Agêntica de Software | D10 |
| 6 | Conformidade Regulatória de IA | D11 (sempre presente) |
| 7 | Capacitação, papéis e governança | D3, D2 |
| 8 | Próximos passos e encerramento | 7–10 ações TI |
| **∴** | **APÊNDICES METODOLÓGICOS** | **A** Metodologia SATF · **B** Glossário SATF |

> Não existe Seção 12/13/14 no SATF completo. Apêndices metodológicos vêm **depois** da Seção 8 e de todas as capas.

---

## MIT Blueprint — Book por unidade (`book_unidade`)

**Gerador:** `executarGeracaoBookUnidadeBlueprint` → `bookUnidadeOrganizacionalIA.js`  
**Escopo:** avaliadores da unidade · dims filtradas por `dimensoesFoco` quando definido

### Estrutura

| Ordem | Seção | Conteúdo |
|:-----:|-------|----------|
| — | Capa unidade | Nome, descrição, foco |
| — | Capa avaliadores | Filtro prioridade |
| 0 | Dashboard da unidade | Score, tabela dims, top 3, plano rule-based |
| 1 | Sumário executivo da unidade | Panorama, tabela, 5 prioridades 30d |
| 2 | Ações por dimensão | **2.1 … 2.N** — só dims em foco (ou todas) |
| 3 | Roadmap 90 dias da unidade | Cronograma, rituais |
| **∴** | **APÊNDICES METODOLÓGICOS** | Blueprint A + B (modo completo) |

---

## SATF TI v3 — Book por unidade (`book_unidade_satf`)

**Gerador:** `executarGeracaoBookSatf({ exigeUnidade: true })`  
**Escopo:** mesmas regras de foco da unidade

### Estrutura

| Ordem | Seção | Conteúdo |
|:-----:|-------|----------|
| — | Capa confidencial + índice + capas | Como book SATF completo |
| — | Capa unidade | |
| 0 | Dashboard da unidade | Scores/plano só dims em foco |
| 1 | Metodologia SATF + sumário | Contexto da unidade |
| 3 | Diagnóstico por dimensão | **Somente** dims em foco (numeração canônica 3.N) |
| 4 | Roadmap engenharia 30-60-90 | Referencia só dims em foco |
| 5 | Fábrica Agêntica (D10) | Omitida se D10 fora do foco |
| 6 | Conformidade (D11) | Omitida se D11 fora do foco |
| 7 | Capacitação e governança | |
| 8 | Próximos passos | |
| **∴** | **APÊNDICES METODOLÓGICOS** | SATF A + B (modo completo) |

---

## Arquivos de implementação

| Arquivo | Responsabilidade |
|---------|------------------|
| `backend/src/utils/bookApendicesMetodologicos.js` | Bloco canônico A/B, posicionamento final |
| `backend/src/utils/bookDadosDimensao.js` | Filtro `dimensoesFoco`, blocos por dimensão |
| `backend/src/utils/bookUnidadeContexto.js` | Dashboard Seção 0, instruções IA unidade |
| `backend/src/index.js` | Book MIT completo |
| `backend/src/utils/satfBookIA.js` | Book SATF completo e por unidade |
| `backend/src/utils/bookUnidadeOrganizacionalIA.js` | Book MIT por unidade |

---

## Checklist de validação manual

- [ ] `# APÊNDICES METODOLÓGICOS` é a **última** linha de conteúdo estrutural do documento
- [ ] Não há `# 12. APÊNDICES` com Apêndice A/B gerado pela IA (MIT completo)
- [ ] Seção 13 (MIT) e Seção 14 (regulatório) aparecem **antes** dos apêndices metodológicos
- [ ] Unidade com foco: nenhuma dimensão fora da lista aparece no texto
- [ ] Unidade com foco: Seção 3 contém **apenas** as subseções `3.N` das dims em foco

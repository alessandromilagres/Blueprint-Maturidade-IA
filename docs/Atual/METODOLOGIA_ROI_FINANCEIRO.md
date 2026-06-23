# Metodologia de ROI e Projeções Financeiras — Blueprint IA

**Versão:** Junho/2026
**Escopo:** books, relatórios executivos IA, relatórios técnicos, dashboards e exportações Word
**Objetivo:** separar com clareza **benchmark de maturidade**, **benefício bruto estimado**, **investimento de referência** e **ROI líquido** — requisito de credibilidade para CFO, conselho e investidores.

---

## 1. Problema que esta metodologia resolve

O Blueprint IA correlaciona **nível de maturidade em IA** com **resultados financeiros esperados**, usando referências públicas (MIT CISR, McKinsey, BCG). Historicamente, três camadas distintas podiam aparecer misturadas nos relatórios:

| Camada | O que representa | Risco se confundido |
|--------|------------------|---------------------|
| Benchmark por nível MIT | ROI líquido típico **sobre investimento em IA** naquele estágio de maturidade | Parecer “margem da empresa” ou % do faturamento total |
| Benefício bruto estimado | Valor econômico anual (economia + receita incremental) **antes** de abater custo | Ser lido como lucro líquido |
| ROI líquido projetado | Retorno **após** abater investimento em IA | Ser confundido com múltiplo bruto (benefício ÷ investimento) |

A partir de Junho/2026, **todos os relatórios e books** devem rotular explicitamente cada métrica e **nunca** apresentar o múltiplo bruto como se fosse ROI líquido.

---

## 2. Glossário oficial

| Termo | Definição | Fórmula |
|-------|-----------|---------|
| **Benefício bruto estimado** | Valor econômico anual atribuído às iniciativas de IA (redução de custo, produtividade, receita incremental) **antes** de descontar o investimento | \( B_{bruto} \) |
| **Investimento de referência** | Custo anual típico em capacidades de IA: talento, dados, plataforma, governança, casos de uso, operação | \( I \) |
| **Ganho líquido** | Benefício após abater o investimento (**custo abatido**) | \( G_{liq} = B_{bruto} - I \) |
| **ROI líquido %** | Métrica padrão de finanças corporativas | \( ROI_{liq} = \frac{G_{liq}}{I} \times 100 \) |
| **Retorno bruto múltiplo** | Apenas indicador auxiliar (não usar como ROI em narrativa executiva) | \( M_{bruto} = \frac{B_{bruto}}{I} \) |
| **Benchmark MIT por nível** | Faixa de **ROI líquido típico** sobre investimento em IA naquele estágio — referência de mercado, não garantia | Tabela `MIT_ROI_POR_NIVEL` |
| **Payback** | Meses até o benefício bruto acumulado cobrir o investimento anual de referência | \( \lceil 12 \times I / B_{bruto} \rceil \) (mín. 3 meses) |

### O que o ROI do Blueprint **não** é

- Não é margem líquida da empresa sobre o faturamento total.
- Não é lucro contábil auditado.
- Não é promessa contratual de retorno.
- Não deve ser comunicado sem indicar se o custo foi abatido.

---

## 3. Duas camadas do modelo financeiro

### 3.1 Camada A — Trajetória MIT CISR (benchmark de maturidade)

**Fundamento teórico:** Enterprise AI Maturity Model (MIT CISR — Weill, Woerner & Sebastian, 2024/2025). Estudos do MIT CISR, McKinsey Global Institute e BCG indicam que organizações em estágios mais maduros de IA obtêm **maior retorno por real investido em capacidades de IA**, com horizontes de captura de valor mais curtos.

O Blueprint mapeia o **score consolidado (1–5)** para um **nível operacional** e consulta a tabela `MIT_ROI_POR_NIVEL`:

| Nível | ROI líquido típico (min – max) | Média | Investimento (% faturamento) | Horizonte |
|:-----:|:------------------------------:|:-----:|:----------------------------:|:---------:|
| 1 | −50% a 50% | 0% | 0,5% – 1% | 18–24 meses |
| 2 | 50% a 150% | 100% | 1% – 2% | 12–18 meses |
| 3 | 150% a 300% | 200% | 2% – 4% | 9–12 meses |
| 4 | 300% a 500% | 400% | 4% – 7% | 6–9 meses |
| 5 | 500% a 1000% | 700% | 7% – 12% | 3–6 meses |

**Interpretação:** no Nível 2, ROI líquido médio de **100%** significa que, para cada R$ 1 investido em IA naquele estágio, espera-se **R$ 1 de ganho líquido** (além da recuperação do investimento). O **benefício bruto** seria \( I + G_{liq} = 2I \).

**Estimativa em R$ (quando há faturamento cadastrado):**

\[
I_n = F \times \frac{investPctMin_n + investPctMax_n}{2 \times 100}
\]

\[
G_{liq,n} = I_n \times \frac{roiMed_n}{100}
\]

\[
B_{bruto,n} = I_n + G_{liq,n}
\]

Onde \( F \) = faturamento anual do projeto na organização.

### 3.2 Camada B — Projeção calibrada (cenários Conservador / Base / Agressivo)

Usada em relatórios técnicos, executivos e Seção 8 dos books. Depende do **faturamento anual do projeto** e do **score de maturidade**.

#### Percentual de referência para benefício bruto (`percentualReferenciaRoi`)

Escala o benefício bruto como % do faturamento — empresas menores tendem a percentual maior (base em R$ menor):

| Faturamento anual | % referência |
|-------------------|:------------:|
| &lt; R$ 500 mil | 4,0% |
| &lt; R$ 2 milhões | 3,4% |
| &lt; R$ 10 milhões | 2,8% |
| &lt; R$ 100 milhões | 2,2% |
| &lt; R$ 500 milhões | 1,8% |
| ≥ R$ 500 milhões | 1,4% |

#### Fator de maturidade (`fatorMaturidadeScore`)

Ajusta o percentual efetivo conforme o score consolidado:

| Score | Fator |
|:-----:|:-----:|
| &lt; 1,5 | 0,75 |
| &lt; 2,5 | 0,88 |
| &lt; 3,5 | 1,00 |
| &lt; 4,5 | 1,12 |
| ≥ 4,5 | 1,25 |

#### Investimento anual de referência

\[
I = \mathrm{clamp}(F \times 1{,}5\%,\ 80\,000,\ \min(F \times 8\%,\ 12\,000\,000))
\]

#### Benefício bruto por cenário

\[
pct_{efetivo} = \frac{pct_{ref} \times fator_{maturidade}}{100}
\]

| Cenário | Multiplicador sobre \( F \times pct_{efetivo} \) |
|---------|:--------------------------------------------------:|
| Conservador | × 0,65 |
| Base | × 1,00 |
| Agressivo | × 1,45 |

Para cada cenário, o sistema calcula \( B_{bruto} \), depois \( G_{liq} \) e \( ROI_{liq} \) via `calcularMetricasCenarioFinanceiro`.

#### Modo legado (sem faturamento cadastrado)

Investimento fixo estimado por score (R$ 500k / 350k / 200k) e benefício bruto como múltiplo desse investimento. Os relatórios exibem aviso de calibração incompleta e priorizam faixas MIT por nível.

---

## 4. Exemplo numérico

**Entrada:** faturamento R$ 10.000.000, score 2,8 → fator maturidade 1,0, % ref. 2,8%.

| Etapa | Cálculo | Resultado |
|-------|---------|-----------:|
| % efetivo | 2,8% × 1,0 | 2,8% |
| Investimento \( I \) | clamp(10M × 1,5%, 80k, min(800k, 12M)) | **R$ 150.000** |
| Benefício bruto (base) | 10M × 2,8% × 1,0 | **R$ 220.000** |
| Ganho líquido | 220k − 150k | **R$ 70.000** |
| ROI líquido | 70k ÷ 150k × 100 | **46,7%** |
| Retorno bruto múltiplo | 220k ÷ 150k | 1,47× *(não comunicar como ROI)* |

Antes da correção metodológica, o sistema poderia exibir **147%** confundindo o múltiplo bruto com ROI líquido.

---

## 5. Onde aparece no produto

| Superfície | Conteúdo financeiro |
|------------|---------------------|
| Relatório técnico (`Relatorio.jsx`) | Cards com investimento, benefício bruto, ganho líquido, ROI líquido, payback |
| Relatório executivo (`RelatorioExecutivo.jsx`) | Cenários + nota metodológica |
| Book completo / rápido (IA) | Seções 1, 2, 8 + blocos injetados nos prompts |
| Relatório executivo IA | Seção 4 com colunas separadas |
| Exportação Word (`generateReport.js`) | Capa e projeções com logo e métricas calibradas |
| Dashboard do projeto | Projeções e exportações |

### Estrutura obrigatória em books (Seção 8)

Tabela com colunas:

`Investimento 12m | Benefício bruto 12m | Ganho líquido 12m | ROI líquido % | Payback`

Parágrafo **“Ganho no longo prazo (MIT CISR)”** com 4 blocos:

1. O que estamos medindo (maturidade × capacidades de IA)
2. O que o ROI **não** é (não é margem sobre faturamento)
3. Por que o ganho parece modesto no nível atual
4. Ganho ao consolidar o próximo nível (faixa MIT + horizonte)

---

## 6. Fundamento técnico (implementação)

### 6.1 Módulos principais

| Arquivo | Responsabilidade |
|---------|------------------|
| `backend/src/utils/metodologiaRoiFinanceiro.js` | Cálculo de métricas, blocos Markdown para prompts IA |
| `backend/src/utils/roiPorFaturamento.js` | `percentualReferenciaRoi`, `projecaoFinanceiraRelatorio` |
| `backend/src/utils/mitTrajetoriaFinanceira.js` | `MIT_ROI_POR_NIVEL`, `blocoTrajetoriaMitMarkdown` |
| `backend/src/utils/bookModoRapidoMarkdown.js` | Modelo “Ganho no longo prazo” (4 blocos) |
| `frontend/src/utils/metodologiaRoiFinanceiro.js` | Espelho frontend + formatação UI |
| `frontend/src/utils/roiPorFaturamento.js` | Espelho das projeções para telas |
| `frontend/src/components/NotaMetodologiaRoi.jsx` | Callout “Como ler ROI neste relatório” |

### 6.2 Função central

```javascript
// backend/src/utils/metodologiaRoiFinanceiro.js
calcularMetricasCenarioFinanceiro(beneficioBruto, investimentoAnual)
// → { beneficioBrutoAnual, investimentoAnual, ganhoLiquidoAnual, roiLiquidoPct, retornoBrutoMultiplo }
```

`projecaoFinanceiraRelatorio` chama `enriquecerCenarioFinanceiro` para cada cenário antes de retornar ao backend, frontend e prompts.

### 6.3 Injeção nos prompts de IA

No endpoint de geração de book (`backend/src/index.js`), o bloco `dadosBlock` inclui:

- `blocoParametrosFinanceirosMarkdown(finProjBook)` — tabela calibrada com ROI líquido
- `blocoGanhoLongoPrazoMitBookRapido(...)` — modelo narrativo em 4 blocos
- `blocoTrajetoriaMitMarkdown(...)` — tabela MIT por nível

Regras nos system prompts:

- Separar benefício bruto e ROI líquido em colunas ou frases distintas.
- Benchmarks MIT = ROI líquido sobre investimento em IA.
- Proibido apresentar `retornoBrutoMultiplo` como ROI líquido.

### 6.4 Pré-requisito de calibração

Cadastrar **faturamento anual do projeto** no formulário do projeto. Sem esse dado, cenários em R$ usam investimento fixo legado; a trajetória MIT em percentuais continua disponível.

---

## 7. Referências bibliográficas e de mercado

| Fonte | Uso no Blueprint |
|-------|------------------|
| MIT CISR — *Building Enterprise AI Maturity* (2024) | Estágios de maturidade, faixas de ROI por nível, horizontes |
| MIT CISR — *Grow Enterprise AI Maturity* (2025) | Evolução entre estágios |
| McKinsey Global Institute — *The State of AI* (2024) | Correlação maturidade × valor, benchmarks setoriais |
| BCG — estudos de valor com IA | Complemento às faixas de retorno em escala |
| Rubrica interna D07 — Valor de Negócio e ROI | Avaliação se a organização **mede** ROI (dimensão do assessment) |

**Nota de autoria:** scores numéricos (1–5) e projeções em R$ são **adaptação SysMap Blueprint IA** calibrada sobre essas referências. O MIT CISR não valida automaticamente relatórios gerados pela plataforma.

---

## 8. Manutenção e evolução

- Alterações nas faixas MIT devem atualizar `MIT_ROI_POR_NIVEL` em `mitTrajetoriaFinanceira.js` e o espelho em `frontend/src/utils/metodologiaRoiFinanceiro.js`.
- Alterações nas faixas de % sobre faturamento devem atualizar `percentualReferenciaRoi` em `roiPorFaturamento.js` (backend e frontend).
- Novos relatórios exportados devem reutilizar `calcularMetricasCenarioFinanceiro` — não recalcular ROI ad hoc na UI.
- Relatórios IA **já salvos** na biblioteca antes desta versão podem não conter a nova redação; regenere o book/relatório para aplicar a metodologia.

---

## 9. Resumo para comunicação executiva

> O Blueprint mostra **quanto valor a IA pode gerar** (benefício bruto) e **quanto sobra depois de pagar o investimento em IA** (ganho líquido e ROI líquido). Os benchmarks do MIT e McKinsey indicam o que empresas no **mesmo nível de maturidade** costumam obter — são referência de mercado, não meta contratual. Subir de nível de maturidade aumenta o ROI líquido típico porque a organização captura mais valor por real investido em capacidades de IA.

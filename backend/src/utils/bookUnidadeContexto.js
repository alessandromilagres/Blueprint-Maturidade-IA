/**
 * Contexto compartilhado para books IA por unidade organizacional:
 * dashboard consolidado, plano de ação por dimensão e instruções para IA.
 */
import { parseDimensoesFocoJson, formatarDimensoesFocoDisplay } from './empresaUnidade.js';
import { NOMES_NIVEL_BLUEPRINT } from './nivelMaturidadeRubrica.js';
import { dimensaoComScoreZero } from './bookModoRapidoMarkdown.js';
import { FRAMEWORK_SATF_TI_V3 } from '../constants/frameworkMaturidadePolicy.js';

/** Plano de ação rule-based por dimensões com score abaixo do alvo (espelha dashboard). */
export function gerarPlanoAcaoPorDimensao(scoresPorArea, { scoreAlvo = 3.5, maxItens = 8 } = {}) {
  return (scoresPorArea || [])
    .filter((area) => Number(area.score) > 0 && Number(area.score) < scoreAlvo)
    .sort((a, b) => Number(a.score) - Number(b.score))
    .slice(0, maxItens)
    .map((area) => {
      const score = Number(area.score) || 0;
      const criticidade = score < 2 ? 'critica' : score < 3 ? 'alta' : 'media';
      const areaLower = String(area.area || '').toLowerCase();
      const responsavelSugerido = areaLower.includes('governança') || areaLower.includes('governanca')
        ? 'Sponsor executivo + Segurança/Compliance'
        : areaLower.includes('dados') || areaLower.includes('tecnologia') || areaLower.includes('plataforma')
          ? 'CTO / Head de Dados / Engenharia'
          : areaLower.includes('pessoas') || areaLower.includes('cultura')
            ? 'RH + Lideranças de negócio'
            : 'Sponsor da unidade + dono da dimensão';

      return {
        areaId: area.areaId,
        area: area.area,
        score: area.score,
        nivel: area.nivel,
        criticidade,
        responsavelSugerido,
        acoes30Dias: [
          `Validar diagnóstico da dimensão "${area.area}" com os responsáveis desta unidade.`,
          'Definir dono, métrica de sucesso e evidências esperadas para a unidade.',
          'Priorizar 2 ações rápidas que reduzam risco ou desbloqueiem valor na unidade.'
        ],
        acoes90Dias: [
          'Executar piloto controlado na unidade com acompanhamento quinzenal.',
          'Formalizar processo, política ou ritual de governança necessário à unidade.',
          'Medir avanço e preparar nova rodada de avaliação desta dimensão.'
        ]
      };
    });
}

export function planoAcaoPorNomeDimensao(planoAcao, nomeDimensao) {
  if (!nomeDimensao) return null;
  const alvo = String(nomeDimensao).trim().toLowerCase();
  return (planoAcao || []).find((p) => String(p.area || '').trim().toLowerCase() === alvo) || null;
}

export function montarBlocoPlanoAcaoUnidadeMarkdown(planoAcao) {
  if (!planoAcao?.length) {
    return `## Plano de ação prioritário (unidade)

Nenhuma dimensão abaixo do alvo de maturidade nesta unidade — mantenha monitoramento e eleve bar de evidências nas dimensões já maduras.
`;
  }

  const linhas = planoAcao.map((p, i) => {
    const crit =
      p.criticidade === 'critica' ? '🔴 Crítica' : p.criticidade === 'alta' ? '🟠 Alta' : '🟡 Média';
    return `### ${i + 1}. ${p.area} — score ${Number(p.score).toFixed(2)} (${crit})

- **Responsável sugerido:** ${p.responsavelSugerido}
- **30 dias:**
${p.acoes30Dias.map((a) => `  - ${a}`).join('\n')}
- **90 dias:**
${p.acoes90Dias.map((a) => `  - ${a}`).join('\n')}`;
  });

  return `## Plano de ação prioritário (unidade)

Dimensões abaixo do alvo de maturidade, ordenadas por urgência (mesma lógica do dashboard do projeto):

${linhas.join('\n\n')}
`;
}

/**
 * Seção determinística # 0 — espelha o dashboard filtrado por unidade.
 */
export function montarSecaoDashboardUnidadeMarkdown({
  unidadeMeta,
  frameworkMaturidade,
  scoreGeral,
  scoreGeralDeclarado = null,
  certificacaoSatf = null,
  scoresPorArea,
  avaliacoesFiltradas,
  planoAcao,
  filtroNivelMax
}) {
  const isSatf = frameworkMaturidade === FRAMEWORK_SATF_TI_V3;
  const nivel = Math.min(5, Math.max(1, Math.round(Number(scoreGeral) || 1)));
  const nomesNivel = NOMES_NIVEL_BLUEPRINT;
  const foco = parseDimensoesFocoJson(unidadeMeta?.dimensoesFoco);
  const focoListaTxt = formatarDimensoesFocoDisplay(foco);
  const focoDisplay = focoListaTxt || 'Todas as dimensões do framework (sem filtro de foco)';

  const ordenados = [...(scoresPorArea || [])].filter((a) => !dimensaoComScoreZero(a));
  ordenados.sort((a, b) => Number(b.score) - Number(a.score));
  const top3 = ordenados.slice(0, 3);
  const bottom3 = [...ordenados].reverse().slice(0, 3);

  const tabelaDims = (scoresPorArea || [])
    .map((a) => {
      if (dimensaoComScoreZero(a)) {
        return `| ${a.area} | — | — | Sem dados consolidados |`;
      }
      const gap =
        a.scoreDeclarado != null && Math.abs(a.scoreDeclarado - a.score) > 0.05
          ? ` · gap decl→oficial ${(a.scoreDeclarado - a.score).toFixed(2)}`
          : '';
      const cert = a.certificacao?.status ? ` · cert: ${a.certificacao.status}` : '';
      return `| **${a.area}** | **${Number(a.score).toFixed(2)}** | N${a.nivel || nivel} | ${
        a.foraDeEscopo ? 'Fora de escopo' : 'No consolidado'
      }${gap}${cert} |`;
    })
    .join('\n');

  const avaliadores = (avaliacoesFiltradas || [])
    .map((av) => {
      const nome = av.usuario?.nome || `Avaliador #${av.id}`;
      const prio = av.usuario?.nivelPrioridadeMapeamentoMaturidade;
      return `- **${nome}**${prio != null ? ` (prioridade ${prio})` : ''}`;
    })
    .join('\n');

  const certBlock = certificacaoSatf
    ? `
### Certificação SATF (unidade)
- Status geral: **${certificacaoSatf.statusGeral}**
- Pendentes: ${certificacaoSatf.pendentes} · Certificadas: ${certificacaoSatf.certificadas} · Rebaixadas: ${certificacaoSatf.rebaixadas}
${scoreGeralDeclarado != null ? `- Score declarado: **${Number(scoreGeralDeclarado).toFixed(2)}** · Oficial: **${Number(scoreGeral).toFixed(2)}**` : ''}
`
    : '';

  return `# 0. DASHBOARD DA UNIDADE ORGANIZACIONAL

> Esta seção reflete **exclusivamente** os avaliadores vinculados à unidade abaixo (usuários sem unidade cadastrada entram em **Geral**).
${focoListaTxt ? `\n> **Escopo de dimensões:** somente **${focoListaTxt}** entram neste book — demais dimensões **não são analisadas nem mencionadas**.\n` : ''}

## Unidade
- **Nome:** ${unidadeMeta?.nome || '—'}${unidadeMeta?.ehPadrao ? ' (padrão Geral)' : ''}
- **Descrição:** ${String(unidadeMeta?.descricao || '').trim() || '—'}
- **Dimensões em foco:** ${focoDisplay}
- **Framework:** ${isSatf ? 'SATF TI v3' : 'SysMap Blueprint IA (16 dimensões)'}
- **Filtro de prioridade:** ${filtroNivelMax == null ? 'Todos os níveis' : `Até nível ${filtroNivelMax}`}

## Score consolidado da unidade
| Métrica | Valor |
|---------|:-----:|
| **Score geral** | **${Number(scoreGeral).toFixed(2)} / 5.00** |
| **Nível** | **${nomesNivel[nivel - 1] || nivel}** (N${nivel}) |
| **Avaliadores no consolidado** | **${(avaliacoesFiltradas || []).length}** |

${certBlock}

## Scores por dimensão (unidade)

| Dimensão | Score | Nível | Observação |
|----------|:-----:|:-----:|------------|
${tabelaDims || '| — | — | — | — |'}

### Top 3 forças da unidade
${top3.length ? top3.map((a, i) => `${i + 1}. **${a.area}** — ${Number(a.score).toFixed(2)}`).join('\n') : '—'}

### Top 3 gaps da unidade
${bottom3.length ? bottom3.map((a, i) => `${i + 1}. **${a.area}** — ${Number(a.score).toFixed(2)}`).join('\n') : '—'}

## Avaliadores desta unidade
${avaliadores || '— Nenhum avaliador no filtro atual.'}

${montarBlocoPlanoAcaoUnidadeMarkdown(planoAcao)}

---
`;
}

export function montarBlocoPlanoAcaoDimensaoPrompt(planoDim) {
  if (!planoDim) {
    return 'Sem plano rule-based prioritário para esta dimensão (score no alvo ou acima). Ainda assim, proponha ações específicas para elevar maturidade desta unidade.';
  }
  return `PLANO DE AÇÃO SUGERIDO (dashboard — use como semente, detalhe e contextualize para esta unidade):
- Criticidade: ${planoDim.criticidade}
- Responsável sugerido: ${planoDim.responsavelSugerido}
- 30 dias: ${planoDim.acoes30Dias.join(' | ')}
- 90 dias: ${planoDim.acoes90Dias.join(' | ')}
**Obrigatório:** expanda em ações numeradas, owners, entregáveis e prazos concretos para **esta unidade**.`;
}

export function instrucoesSistemaBookUnidade({ unidadeMeta, frameworkMaturidade }) {
  const isSatf = frameworkMaturidade === FRAMEWORK_SATF_TI_V3;
  const foco = parseDimensoesFocoJson(unidadeMeta?.dimensoesFoco);
  const focoTxt = formatarDimensoesFocoDisplay(foco);

  return `
CONTEXTO DE UNIDADE ORGANIZACIONAL (OBRIGATÓRIO):
- Este book é **exclusivo da unidade "${unidadeMeta?.nome || '—'}"** — scores, diagnósticos e recomendações refletem **somente** avaliadores desta unidade.
- **Não** generalize para a empresa inteira; use linguagem "nesta unidade", "para ${unidadeMeta?.nome || 'a unidade'}".
- Framework: ${isSatf ? 'SATF TI v3 (D1–D11)' : 'SysMap Blueprint IA (16 dimensões, referência MIT CISR)'}.
${focoTxt ? `- Dimensões em foco desta unidade: **${focoTxt}** — analise **somente** estas dimensões. **Proibido** mencionar, listar ou referenciar dimensões fora do foco (trate-as como fora do escopo deste book).` : '- Em cada chunk de dimensão, use **somente** os dados da dimensão da vez — não misture scores ou perguntas de outras áreas.'}
- A Seção 0 (Dashboard) já traz scores e plano rule-based — **complemente** com ações específicas, owners e entregáveis; não repita tabelas inteiras.
- Em cada dimensão, responda explicitamente: **o que esta unidade deve fazer agora** (30/60/90 dias).
`;
}

export function prependSecaoDashboardUnidadeAoRelatorio(conteudo, secaoDashboard) {
  if (!secaoDashboard) return conteudo;
  const idx = conteudo.search(/^#\s+1\./m);
  if (idx > 0) {
    return `${conteudo.slice(0, idx)}\n${secaoDashboard}\n${conteudo.slice(idx)}`;
  }
  return `${secaoDashboard}\n\n${conteudo}`;
}

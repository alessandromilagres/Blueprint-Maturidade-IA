/**
 * Geração de Markdown para exportação do Executive Dashboard e Command Center de Produtos.
 */

const fmtMoeda = (v) =>
  v == null || !Number.isFinite(Number(v)) ? '—' : `R$ ${Math.round(Number(v)).toLocaleString('pt-BR')}`;
const fmtPct = (v) =>
  v == null || !Number.isFinite(Number(v)) ? '—' : `${Number(v).toFixed(0)}%`;
const fmtScore = (v) =>
  v == null || !Number.isFinite(Number(v)) ? '—' : Number(v).toFixed(2);
const fmtData = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
};

export function gerarMarkdownExecutiveDashboard(data) {
  const linhas = [];
  const dataGeracao = new Date().toLocaleString('pt-BR');
  const versaoLabel = data.projetoVersao
    ? `${data.projetoVersao.titulo} (${data.projetoVersao.status})`
    : 'Versão atual';

  linhas.push(`# Executive Dashboard — ${data.projeto?.nome || 'Projeto'}`);
  linhas.push('');
  linhas.push(`**Empresa:** ${data.empresa?.nome || '—'}`);
  linhas.push(`**Versão:** ${versaoLabel}`);
  linhas.push(`**Gerado em:** ${dataGeracao}`);
  linhas.push(`**Avaliadores na versão:** ${data.totalAvaliadores ?? 0}`);
  linhas.push('');
  linhas.push('---');
  linhas.push('');
  linhas.push('## Maturidade consolidada');
  linhas.push('');
  linhas.push(`- **Score geral:** ${fmtScore(data.scoreGeral)} / 5,0`);
  linhas.push(`- **Nível:** ${data.nivel || '—'} — ${data.nivelNome || '—'}`);

  const comp = data.comparativoVersao;
  if (comp?.disponivel) {
    const sinal = comp.delta > 0 ? '+' : '';
    linhas.push(`- **Evolução vs versão anterior:** ${sinal}${fmtScore(comp.delta)} (${comp.tendencia || 'estável'})`);
  }

  linhas.push('');
  linhas.push('## Radar — dimensões no escopo');
  linhas.push('');
  linhas.push('| Dimensão | Score | Nível | Peso |');
  linhas.push('| --- | ---: | --- | ---: |');
  for (const s of data.scoresPorArea || []) {
    if (s.foraDeEscopo) continue;
    if (s.semDadosConsolidados) continue;
    linhas.push(
      `| ${s.area} | ${fmtScore(s.score)} | ${s.nivel ?? '—'} | ${s.peso != null ? `${s.peso}%` : '—'} |`
    );
  }

  if ((data.dimensoesForaEscopo || []).length) {
    linhas.push('');
    linhas.push('## Dimensões fora do escopo deste projeto');
    linhas.push('');
    linhas.push('_Desativadas na configuração; não entram no score ponderado nem nas lacunas._');
    linhas.push('');
    for (const s of data.dimensoesForaEscopo) {
      linhas.push(`- ${s.area}${s.score > 0 ? ` (nota histórica ${fmtScore(s.score)})` : ''}`);
    }
  }

  linhas.push('');
  linhas.push('## Top 5 lacunas');
  linhas.push('');
  if (!(data.topGaps || []).length) {
    linhas.push('_Sem lacunas relevantes._');
  } else {
    linhas.push('| Dimensão | Atual | Alvo | Gap |');
    linhas.push('| --- | ---: | ---: | ---: |');
    for (const g of data.topGaps) {
      linhas.push(`| ${g.area} | ${fmtScore(g.score)} | ${fmtScore(g.scoreAlvo)} | ${fmtScore(g.gap)} |`);
    }
  }

  linhas.push('');
  linhas.push('## Conformidade regulatória');
  linhas.push('');
  const reg = data.statusRegulatorio;
  if (reg && !reg.indisponivel && reg.kpis) {
    linhas.push(`- Produtos: **${reg.kpis.totalProdutos ?? 0}**`);
    linhas.push(`- Alto risco (PL): **${reg.kpis.altoRiscoPl ?? 0}**`);
    linhas.push(`- AIPD pendente: **${reg.kpis.aipdPendente ?? 0}**`);
    linhas.push(`- Validação consultor pendente: **${reg.kpis.validacaoPendente ?? 0}**`);
  } else {
    linhas.push(`_${reg?.mensagem || 'Sem dados regulatórios para este projeto.'}_`);
  }

  linhas.push('');
  linhas.push('## ROI projetado (líquido)');
  linhas.push('');
  const roi = data.roi;
  if (roi?.cenarios) {
    for (const [k, label] of [['conservador', 'Conservador'], ['base', 'Base'], ['agressivo', 'Agressivo']]) {
      const c = roi.cenarios[k];
      if (!c) continue;
      linhas.push(`- **${label}:** ganho ${fmtMoeda(c.ganhoLiquidoAnual)} · ROI ${fmtPct(c.roiLiquidoPct)}`);
    }
    linhas.push('');
    linhas.push('_ROI líquido = (benefício bruto − investimento) ÷ investimento._');
  } else {
    linhas.push('_Sem projeção financeira disponível._');
  }

  linhas.push('');
  linhas.push('## Próximos passos (roadmap)');
  linhas.push('');
  for (const [k, label] of [['dias30', '30 dias'], ['dias60', '60 dias'], ['dias90', '90 dias']]) {
    linhas.push(`### ${label}`);
  const itens = data.proximosPassos?.[k] || [];
    if (!itens.length) {
      linhas.push('- —');
    } else {
      for (const p of itens) {
        linhas.push(`- ${p.titulo}${p.contextoRotulo ? ` (${p.contextoRotulo})` : ''}`);
      }
    }
    linhas.push('');
  }

  if (reg?.disclaimer) {
    linhas.push('---');
    linhas.push('');
    linhas.push(`_${reg.disclaimer}_`);
  }

  return linhas.join('\n');
}

export function gerarMarkdownProdutosCommandCenter(data) {
  const linhas = [];
  const dataGeracao = new Date().toLocaleString('pt-BR');
  const k = data.kpis || {};

  linhas.push(`# Command Center — Produtos IA-First`);
  linhas.push('');
  linhas.push(`**Projeto:** ${data.projeto?.nome || '—'}`);
  linhas.push(`**Empresa:** ${data.empresa?.nome || '—'}`);
  linhas.push(`**Gerado em:** ${dataGeracao}`);
  linhas.push('');
  linhas.push('---');
  linhas.push('');
  linhas.push('## KPIs do portfólio');
  linhas.push('');
  linhas.push(`- Produtos: **${k.totalProdutos ?? 0}** (${k.produtosAvaliados ?? 0} avaliados)`);
  linhas.push(`- Score médio (relevância): **${fmtScore(k.scoreMedioRelevancia)}**`);
  linhas.push(`- ROI agregado: **${fmtPct(k.roiAgregado)}**`);
  linhas.push(`- Custo agêntico total: **${fmtMoeda(k.custoTotalAgentico)}**`);
  linhas.push(`- Economia agêntica vs tradicional: **${fmtMoeda(k.economiaTotalAgentica)}**`);
  linhas.push(`- Alto risco regulatório: **${k.altoRiscoRegulatorio ?? 0}**`);
  linhas.push(`- Validação consultor pendente: **${k.validacaoPendente ?? 0}**`);
  linhas.push(`- AIPD pendente: **${k.aipdPendente ?? 0}**`);

  linhas.push('');
  linhas.push('## Ranking estratégico');
  linhas.push('');
  linhas.push('| # | Produto | Relevância | Prontidão agêntica | ROI | Risco PL | Status |');
  linhas.push('| ---: | --- | ---: | ---: | ---: | --- | --- |');
  const ranking = [...(data.produtos || [])]
    .sort((a, b) => (b.metricas?.prioridadeEstrategica || 0) - (a.metricas?.prioridadeEstrategica || 0));
  ranking.forEach((p, i) => {
    const risco = p.regulatorio?.plRiscoNivel || '—';
    linhas.push(
      `| ${i + 1} | ${p.nome} | ${fmtScore(p.scoreRelevancia)} | ${fmtScore(p.scoreObrigatorio)} | ${fmtPct(p.financeiro?.roiIndividual)} | ${risco} | ${p.status || '—'} |`
    );
  });

  linhas.push('');
  linhas.push('## Detalhamento por produto');
  linhas.push('');
  for (const p of data.produtos || []) {
    linhas.push(`### ${p.nome}`);
    linhas.push('');
    linhas.push(`- Relevância: ${fmtScore(p.scoreRelevancia)} · Prontidão agêntica: ${fmtScore(p.scoreObrigatorio)} · Verticais: ${fmtScore(p.scoreVerticais)}`);
    linhas.push(`- ROI individual: ${fmtPct(p.financeiro?.roiIndividual)} · Payback: ${p.financeiro?.paybackMeses != null ? `${p.financeiro.paybackMeses} meses` : '—'}`);
    if (p.especificacao) {
      linhas.push(`- Economia de construção: ${fmtPct(p.especificacao.economiaPct)} (${fmtMoeda(p.especificacao.economiaValor)})`);
    }
    if (p.regulatorio) {
      linhas.push(`- Regulatório: PL ${p.regulatorio.plRiscoNivel || '—'} · ISO ${fmtPct(p.regulatorio.isoConformidadePct)} · LGPD ${p.regulatorio.lgpdRiscoNivel || '—'}`);
    }
    if ((p.iniciativas || []).length) {
      linhas.push('- Iniciativas vinculadas:');
      for (const ini of p.iniciativas) {
        linhas.push(`  - ${ini.titulo} (${ini.status}, ${ini.progresso}%) — prazo ${fmtData(ini.dataFimPrevista)}`);
      }
    }
    linhas.push('');
  }

  return linhas.join('\n');
}

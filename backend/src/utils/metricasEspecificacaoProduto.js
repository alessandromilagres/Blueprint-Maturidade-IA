/**
 * Métricas de esforço/prazo para especificação de produto — determinísticas a partir do cadastro,
 * independentes da quantidade ou do tipo de documentos gerados pela IA.
 */

function norm(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase();
}

/**
 * Story points totais do escopo: função pura de complexidade, fase e classificação do produto.
 */
export function calcularStoryPointsTotaisProduto(produto) {
  const c = norm(produto?.complexidade) || 'media';
  const base = { baixa: 120, media: 220, alta: 380 }[c] ?? 220;

  const f = norm(produto?.faseAtual) || 'ideia';
  const multFase = { ideia: 1.06, mvp: 1.03, piloto: 1.0, producao: 0.94 }[f] ?? 1.0;

  let pts = Math.round(base * multFase);
  const cl = Number(produto?.classificacao);
  if (Number.isFinite(cl) && cl >= 1 && cl <= 5) {
    pts = Math.round(pts * (0.94 + 0.03 * cl));
  }
  return Math.max(40, Math.min(2000, pts));
}

/**
 * Cenários tradicional vs agêntico derivados dos SP fixos e das produtividades/custo do produto.
 */
export function calcularMetricasEspecificacaoProduto(produto) {
  const custoHoraHomem = produto.custoHoraHomem || 150;
  const prodTradicional = produto.produtividadeTradicional || 40;
  const prodAgentica = produto.produtividadeAgentica || 120;
  const storyPointsTotais = calcularStoryPointsTotaisProduto(produto);

  const equipeTrad = 6;
  const spPorMesTrad = prodTradicional * equipeTrad;
  const mesesTrad = storyPointsTotais / spPorMesTrad;
  const tradicional = {
    equipe: equipeTrad,
    prazoSemanas: Math.max(1, Math.ceil(mesesTrad * 4)),
    horas: storyPointsTotais * 6,
    custo: Math.round(storyPointsTotais * 6 * custoHoraHomem)
  };

  const equipeAgen = Math.max(2, Math.ceil(equipeTrad * 0.6));
  const spPorMesAgen = prodAgentica * equipeAgen;
  const mesesAgen = storyPointsTotais / spPorMesAgen;
  const agentica = {
    equipe: equipeAgen,
    prazoSemanas: Math.max(1, Math.ceil(mesesAgen * 4)),
    horas: storyPointsTotais * 4,
    custo: Math.round(storyPointsTotais * 4 * custoHoraHomem)
  };

  return {
    storyPointsTotais,
    custoHoraHomem,
    prodTradicional,
    prodAgentica,
    tradicional,
    agentica
  };
}

function fmtNumBR(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

/**
 * Bloco Markdown único para anexar ao fim de qualquer documento de especificação.
 */
export function formatarSecaoMetricasEspecificacao(metricas, produto) {
  const inicio = produto?.dataInicioConstrucao
    ? new Date(produto.dataInicioConstrucao).toLocaleDateString('pt-BR')
    : '— (cadastre a data de início no produto)';

  const sp = metricas.storyPointsTotais;
  const { tradicional: t, agentica: a, prodTradicional, prodAgentica, custoHoraHomem } =
    metricas;

  let dataFimTrad = '—';
  let dataFimAgen = '—';
  if (produto?.dataInicioConstrucao) {
    const di = new Date(produto.dataInicioConstrucao);
    const fimT = new Date(di);
    fimT.setDate(fimT.getDate() + t.prazoSemanas * 7);
    const fimA = new Date(di);
    fimA.setDate(fimA.getDate() + a.prazoSemanas * 7);
    dataFimTrad = fimT.toLocaleDateString('pt-BR');
    dataFimAgen = fimA.toLocaleDateString('pt-BR');
  }

  return [
    '---',
    '',
    '## Métricas de esforço, produtividade e prazo (referência fixa do produto)',
    '',
    '> Estes valores **não dependem** do tipo de documento nem da quantidade de documentos gerados. São calculados a partir do cadastro do produto (complexidade, fase, classificação, produtividades, custo/hora e datas).',
    '',
    '| Métrica | Tradicional | Fábrica agêntica |',
    '|---------|-------------|------------------|',
    `| **Story points totais (escopo)** | **${sp} SP** | **${sp} SP** |`,
    `| **Produtividade (SP/mês/dev)** | ${prodTradicional} | ${prodAgentica} |`,
    `| **Equipe estimada** | ${t.equipe} | ${a.equipe} |`,
    `| **Duração estimada** | ${t.prazoSemanas} semanas | ${a.prazoSemanas} semanas |`,
    `| **Horas totais estimadas** | ${fmtNumBR(t.horas)} h | ${fmtNumBR(a.horas)} h |`,
    `| **Custo total estimado** | R$ ${fmtNumBR(t.custo)} | R$ ${fmtNumBR(a.custo)} |`,
    `| **Custo médio hora-homem** | R$ ${fmtNumBR(custoHoraHomem)}/h | R$ ${fmtNumBR(custoHoraHomem)}/h |`,
    `| **Data de início (cadastro)** | ${inicio} | ${inicio} |`,
    `| **Data fim construção (estimada a partir do início)** | ${dataFimTrad} | ${dataFimAgen} |`,
    ''
  ].join('\n');
}

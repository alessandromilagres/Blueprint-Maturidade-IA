/**
 * Engenharia de Valor para classificação de produtos IA-First.
 *
 * Modelo multicritério ponderado (Value Engineering):
 *   Prioridade(produto) = Σ_d [ peso_d × impacto_d ]
 *
 * - Drivers de valor = dimensões do Blueprint de maturidade do projeto do produto.
 * - A ordem padrão dos drivers vem da NOTA INVERSA (menor nota de maturidade = maior
 *   prioridade), priorizando o que mais derruba a nota geral do projeto. O usuário pode
 *   reordenar.
 * - O peso de cada driver segue a sequência de FIBONACCI conforme a ordem: o driver no
 *   topo (1ª posição) recebe o maior número de Fibonacci.
 * - O impacto (0–5) de cada produto em cada driver é informado manualmente.
 *
 * Escopo: POR PRODUTO. Convive com a classificação atual (scorePrioridadeEstrategica),
 * sem substituí-la. Persistência via tabela própria criada em runtime (raw SQL), seguindo
 * o mesmo padrão de ProjetoVersao/Iniciativa para não exigir ALTER em tabelas existentes.
 */
import { ordenarAreasPorFramework } from './ordemDimensoesFramework.js';
import { calcularScoresConsolidadoMaturidade } from './scoresConsolidadoProjetoMaturidade.js';

/** Sequência de Fibonacci (estilo ágil, sem o 1 duplicado) para 16 dimensões. */
export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];

let schemaReady = false;

export async function ensureEngenhariaValorSchema(prisma) {
  if (schemaReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProdutoEngenhariaValor" (
      "produtoId" INTEGER PRIMARY KEY,
      "drivers" JSONB NOT NULL DEFAULT '[]',
      "scoreValor" DOUBLE PRECISION,
      "scoreValorNormalizado" DOUBLE PRECISION,
      "atualizadoPorUsuarioId" INTEGER,
      "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  schemaReady = true;
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function clamp(n, min, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

/**
 * Peso de Fibonacci para uma posição (1..total). Posição 1 = topo = maior peso.
 */
export function pesoFibonacciPorPosicao(posicao, total) {
  if (!total || total <= 0) return 0;
  const seq = FIBONACCI.slice(0, total);
  const idx = total - Number(posicao); // posição 1 -> último (maior) item da sub-sequência
  const safe = Math.max(0, Math.min(seq.length - 1, idx));
  return seq[safe];
}

/**
 * Calcula a prioridade de valor a partir da lista de drivers ativos.
 * @param {Array<{ordem:number, impacto:number, ativo?:boolean}>} drivers
 */
export function calcularPrioridadeValor(drivers = []) {
  const ativos = drivers.filter((d) => d.ativo !== false);
  const total = ativos.length;
  let soma = 0;
  let max = 0;
  for (const d of ativos) {
    const peso = pesoFibonacciPorPosicao(d.ordem, total);
    const impacto = clamp(d.impacto, 0, 5);
    soma += peso * impacto;
    max += peso * 5;
  }
  return {
    scoreValor: round2(soma),
    scoreValorNormalizado: max > 0 ? round2((soma / max) * 100) : 0
  };
}

/** Carrega as 16 dimensões do projeto com a nota consolidada de maturidade. */
async function carregarDimensoesProjeto(prisma, projetoId) {
  const areas = ordenarAreasPorFramework(
    await prisma.area.findMany({
      include: { perguntas: { orderBy: { numero: 'asc' } } },
      orderBy: { ordem: 'asc' }
    })
  );
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { projetoId, status: 'finalizada' },
    include: { respostas: { include: { pergunta: { include: { area: true } } } } }
  });
  const { todasDimensoes } = calcularScoresConsolidadoMaturidade(avaliacoes, areas);
  return (todasDimensoes || []).map((d) => ({
    areaId: d.areaId ?? null,
    area: d.area,
    score: Number(d.score) || 0,
    nivel: d.nivel ?? null,
    semDadosConsolidados: d.semDadosConsolidados === true
  }));
}

/** Drivers padrão: ordenados por NOTA crescente (gargalo no topo), impacto 0. */
function driversPadrao(dimensoes) {
  return [...dimensoes]
    .sort((a, b) => a.score - b.score)
    .map((d, i) => ({
      areaId: d.areaId,
      area: d.area,
      ordem: i + 1,
      impacto: 0,
      ativo: true,
      score: d.score,
      nivel: d.nivel,
      semDadosConsolidados: d.semDadosConsolidados
    }));
}

/** Combina a config salva com as notas vivas das dimensões. */
function mesclarDriversSalvos(salvos, dimensoes) {
  const porAreaId = new Map();
  const porNome = new Map();
  for (const dim of dimensoes) {
    if (dim.areaId != null) porAreaId.set(Number(dim.areaId), dim);
    porNome.set(String(dim.area).toLowerCase(), dim);
  }

  const usados = new Set();
  const combinados = [];
  for (const s of salvos) {
    let dim = s.areaId != null ? porAreaId.get(Number(s.areaId)) : null;
    if (!dim) dim = porNome.get(String(s.area || '').toLowerCase());
    if (!dim) continue;
    const chave = dim.areaId != null ? `id:${dim.areaId}` : `nome:${String(dim.area).toLowerCase()}`;
    if (usados.has(chave)) continue;
    usados.add(chave);
    combinados.push({
      areaId: dim.areaId,
      area: dim.area,
      ordem: Number(s.ordem) || combinados.length + 1,
      impacto: clamp(s.impacto, 0, 5),
      ativo: s.ativo !== false,
      score: dim.score,
      nivel: dim.nivel,
      semDadosConsolidados: dim.semDadosConsolidados
    });
  }

  // Dimensões novas (não estavam na config salva) entram ao final, ordenadas por nota.
  const novas = dimensoes
    .filter((dim) => {
      const chave = dim.areaId != null ? `id:${dim.areaId}` : `nome:${String(dim.area).toLowerCase()}`;
      return !usados.has(chave);
    })
    .sort((a, b) => a.score - b.score)
    .map((dim) => ({
      areaId: dim.areaId,
      area: dim.area,
      ordem: 0,
      impacto: 0,
      ativo: true,
      score: dim.score,
      nivel: dim.nivel,
      semDadosConsolidados: dim.semDadosConsolidados
    }));

  return [...combinados, ...novas]
    .sort((a, b) => (a.ordem || 9999) - (b.ordem || 9999))
    .map((d, i) => ({ ...d, ordem: i + 1 }));
}

/**
 * Monta o estado completo da engenharia de valor de um produto (para a tela e leitura).
 */
export async function montarEngenhariaValorProduto(prisma, produtoId) {
  await ensureEngenhariaValorSchema(prisma);

  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    include: { projeto: { include: { empresa: true } } }
  });
  if (!produto) {
    const err = new Error('Produto não encontrado');
    err.status = 404;
    throw err;
  }

  const dimensoes = await carregarDimensoesProjeto(prisma, produto.projetoId);

  const rows = await prisma.$queryRaw`
    SELECT "drivers", "scoreValor", "scoreValorNormalizado", "atualizadoEm"
    FROM "ProdutoEngenhariaValor" WHERE "produtoId" = ${produtoId}
  `;
  const registro = rows?.[0] || null;
  const salvos = Array.isArray(registro?.drivers) ? registro.drivers : null;

  let drivers = salvos && salvos.length ? mesclarDriversSalvos(salvos, dimensoes) : driversPadrao(dimensoes);

  const totalAtivos = drivers.filter((d) => d.ativo !== false).length;
  drivers = drivers.map((d) => ({
    ...d,
    pesoFibonacci: d.ativo !== false ? pesoFibonacciPorPosicao(d.ordem, totalAtivos) : 0
  }));

  const prioridade = calcularPrioridadeValor(drivers);

  return {
    produto: { id: produto.id, nome: produto.nome },
    projeto: {
      id: produto.projeto?.id,
      nome: produto.projeto?.nome,
      empresa: produto.projeto?.empresa?.nome || null
    },
    configurado: Boolean(salvos && salvos.length),
    drivers,
    fibonacci: FIBONACCI.slice(0, Math.max(1, totalAtivos)),
    ...prioridade,
    atualizadoEm: registro?.atualizadoEm || null,
    metodologia:
      'Engenharia de valor: peso por Fibonacci segundo a ordem dos drivers (nota inversa do Blueprint sugere a ordem); impacto 0–5 informado por produto.'
  };
}

/**
 * Roadmap de produtos IA-First de um projeto, com os dois modelos de priorização lado a lado:
 *   - tradicional  → scorePrioridadeEstrategica (60% relevância + 40% blueprint)
 *   - engenharia de valor → scoreValorNormalizado (drivers do Blueprint × impacto, peso Fibonacci)
 * Inclui as datas de cronograma para o gráfico de execução.
 */
export async function montarRoadmapProdutos(prisma, projetoId) {
  await ensureEngenhariaValorSchema(prisma);

  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    include: { empresa: true }
  });
  if (!projeto) {
    const err = new Error('Projeto não encontrado');
    err.status = 404;
    throw err;
  }

  const produtos = await prisma.produto.findMany({
    where: { projetoId, status: { not: 'cancelado' } },
    orderBy: [{ classificacao: 'asc' }, { scorePrioridadeEstrategica: 'desc' }]
  });

  const ids = produtos.map((p) => p.id);
  const valorRows = ids.length
    ? await prisma.$queryRawUnsafe(
        `SELECT "produtoId","scoreValor","scoreValorNormalizado","atualizadoEm"
         FROM "ProdutoEngenhariaValor" WHERE "produtoId" = ANY($1::int[])`,
        ids
      )
    : [];
  const valorPorProduto = new Map(valorRows.map((r) => [Number(r.produtoId), r]));

  const itens = produtos.map((p) => {
    const valor = valorPorProduto.get(p.id) || null;
    return {
      id: p.id,
      nome: p.nome,
      status: p.status,
      faseAtual: p.faseAtual || 'ideia',
      complexidade: p.complexidade || 'media',
      statusConstrucao: p.statusConstrucao || 'planejado',
      classificacao: p.classificacao ?? null,
      tradicional: {
        scorePrioridadeEstrategica: p.scorePrioridadeEstrategica ?? 0,
        scoreRelevancia: p.scoreRelevancia ?? 0,
        scoreBlueprint: p.scoreBlueprint ?? 0
      },
      valor: {
        configurado: Boolean(valor),
        scoreValor: valor ? Number(valor.scoreValor) || 0 : 0,
        scoreValorNormalizado: valor ? Number(valor.scoreValorNormalizado) || 0 : 0,
        atualizadoEm: valor?.atualizadoEm || null
      },
      cronograma: {
        dataInicioConstrucao: p.dataInicioConstrucao,
        dataFimConstrucao: p.dataFimConstrucao,
        dataAtivacaoProducao: p.dataAtivacaoProducao
      }
    };
  });

  // Rankings (1 = maior prioridade). Empate mantém ordem estável por nome.
  const rankTradicional = [...itens]
    .sort(
      (a, b) =>
        b.tradicional.scorePrioridadeEstrategica - a.tradicional.scorePrioridadeEstrategica ||
        a.nome.localeCompare(b.nome)
    )
    .map((it, i) => ({ id: it.id, posicao: i + 1 }));

  const rankValor = [...itens]
    .sort(
      (a, b) =>
        b.valor.scoreValorNormalizado - a.valor.scoreValorNormalizado || a.nome.localeCompare(b.nome)
    )
    .map((it, i) => ({ id: it.id, posicao: i + 1 }));

  const posTrad = new Map(rankTradicional.map((r) => [r.id, r.posicao]));
  const posValor = new Map(rankValor.map((r) => [r.id, r.posicao]));

  for (const it of itens) {
    it.tradicional.posicao = posTrad.get(it.id) ?? null;
    it.valor.posicao = posValor.get(it.id) ?? null;
  }

  return {
    projeto: { id: projeto.id, nome: projeto.nome, empresa: projeto.empresa?.nome || null },
    total: itens.length,
    configuradosValor: itens.filter((i) => i.valor.configurado).length,
    produtos: itens
  };
}

/**
 * Persiste a config de drivers (ordem + impacto + ativo) de um produto e recalcula a prioridade.
 */
export async function salvarEngenhariaValorProduto(prisma, produtoId, body = {}, usuarioId = null) {
  await ensureEngenhariaValorSchema(prisma);

  const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
  if (!produto) {
    const err = new Error('Produto não encontrado');
    err.status = 404;
    throw err;
  }

  const entrada = Array.isArray(body.drivers) ? body.drivers : [];
  const normalizados = entrada
    .map((d) => ({
      areaId: d.areaId != null ? Number(d.areaId) : null,
      area: String(d.area || ''),
      ordem: Number(d.ordem) || 9999,
      impacto: clamp(d.impacto, 0, 5),
      ativo: d.ativo !== false
    }))
    .filter((d) => d.area || d.areaId != null)
    .sort((a, b) => a.ordem - b.ordem)
    .map((d, i) => ({ ...d, ordem: i + 1 }));

  // Pesos consideram apenas drivers ativos.
  const prioridade = calcularPrioridadeValor(normalizados);

  await prisma.$executeRawUnsafe(
    `INSERT INTO "ProdutoEngenhariaValor"
       ("produtoId","drivers","scoreValor","scoreValorNormalizado","atualizadoPorUsuarioId","atualizadoEm")
     VALUES ($1, $2::jsonb, $3, $4, $5, CURRENT_TIMESTAMP)
     ON CONFLICT ("produtoId") DO UPDATE SET
       "drivers" = EXCLUDED."drivers",
       "scoreValor" = EXCLUDED."scoreValor",
       "scoreValorNormalizado" = EXCLUDED."scoreValorNormalizado",
       "atualizadoPorUsuarioId" = EXCLUDED."atualizadoPorUsuarioId",
       "atualizadoEm" = CURRENT_TIMESTAMP`,
    produtoId,
    JSON.stringify(normalizados),
    prioridade.scoreValor,
    prioridade.scoreValorNormalizado,
    usuarioId || null
  );

  return montarEngenhariaValorProduto(prisma, produtoId);
}

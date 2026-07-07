/**
 * Configuração de dimensões avaliadas POR PROJETO.
 *
 * Cada projeto Blueprint pode escolher QUAIS das 16 dimensões serão avaliadas
 * (checkbox) e o PESO de cada dimensão (percentual, soma das ativas = 100%).
 *
 * - As dimensões ativas viram o default de áreas dos convites de avaliação do projeto.
 * - Os pesos entram como MÉDIA PONDERADA no score consolidado de maturidade do projeto
 *   (ver calcularScoresConsolidadoMaturidade, parâmetro pesosPorArea).
 *
 * `Area` é global (compartilhada por todos os projetos), por isso a seleção/peso é
 * mantida em tabela própria por projeto, criada em runtime via raw SQL
 * (mesmo padrão de ProjetoVersao/Iniciativa/ProdutoEngenhariaValor — sem ALTER em
 * tabelas existentes nem migração obrigatória).
 */
import { ordenarAreasPorFramework } from './ordemDimensoesFramework.js';
import { calcularScoresConsolidadoMaturidade } from './scoresConsolidadoProjetoMaturidade.js';
import { listarAreasDoProjeto } from './areaFrameworkCatalog.js';
import { carregarFrameworkProjeto } from './projetoFramework.js';
import {
  areaForaDaMediaGeral,
  pesosDefaultNormalizadosFramework,
  areaReforcoPesoRegulatorioSatf,
  codigoFrameworkArea
} from './frameworkScoringPolicy.js';
import { FRAMEWORK_SATF_TI_V3 } from '../constants/frameworkMaturidadePolicy.js';

let schemaReady = false;

export async function ensureProjetoDimensaoConfigSchema(prisma) {
  if (schemaReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProjetoDimensaoConfig" (
      "id" SERIAL PRIMARY KEY,
      "projetoId" INTEGER NOT NULL,
      "areaId" INTEGER NOT NULL,
      "ativa" BOOLEAN NOT NULL DEFAULT true,
      "peso" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProjetoDimensaoConfig_projetoId_areaId_key" UNIQUE ("projetoId", "areaId")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ProjetoDimensaoConfig_projetoId_idx"
    ON "ProjetoDimensaoConfig" ("projetoId")
  `);
  schemaReady = true;
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Lê as linhas de configuração salvas do projeto (pode estar vazio = sem config). */
export async function carregarConfigDimensoesProjeto(prisma, projetoId) {
  await ensureProjetoDimensaoConfigSchema(prisma);
  const rows = await prisma.$queryRaw`
    SELECT "areaId", "ativa", "peso"
    FROM "ProjetoDimensaoConfig"
    WHERE "projetoId" = ${projetoId}
  `;
  const porAreaId = new Map();
  for (const r of rows) {
    porAreaId.set(Number(r.areaId), {
      areaId: Number(r.areaId),
      ativa: r.ativa !== false,
      peso: Number(r.peso) || 0
    });
  }
  return { configurado: porAreaId.size > 0, porAreaId };
}

/**
 * Map<areaId, peso> apenas das dimensões ATIVAS, para média ponderada no score.
 * Retorna Map vazio quando o projeto não tem config (mantém média simples atual).
 */
export async function pesosAtivosPorAreaDoProjeto(prisma, projetoId) {
  const { configurado, porAreaId } = await carregarConfigDimensoesProjeto(prisma, projetoId);
  const pesos = new Map();
  if (!configurado) return pesos;
  for (const cfg of porAreaId.values()) {
    if (cfg.ativa && cfg.peso > 0) pesos.set(cfg.areaId, cfg.peso);
  }
  return pesos;
}

/**
 * Mapa de APRESENTAÇÃO das dimensões para dashboards/relatórios/books:
 *   Map<areaId, { ativa, peso, foraDeEscopo }>
 *
 * - peso: percentual configurado (ou default normalizado de Area.peso quando sem config).
 * - foraDeEscopo: true quando o projeto TEM config e a dimensão está desativada
 *   (deve sair de radar/gaps/plano e ir para a seção "Fora do escopo").
 *
 * Leve: 1 query de áreas + config (não recalcula notas das avaliações).
 */
export async function mapaApresentacaoDimensoes(prisma, projetoId) {
  await ensureProjetoDimensaoConfigSchema(prisma);
  const { frameworkMaturidade, setorRegulado } = await carregarFrameworkProjeto(prisma, projetoId);
  const { configurado, porAreaId } = await carregarConfigDimensoesProjeto(prisma, projetoId);
  const areas = ordenarAreasPorFramework(
    await listarAreasDoProjeto(prisma, projetoId, { includePerguntas: false })
  );
  const pesosDefault = pesosDefaultNormalizadosFramework(areas, frameworkMaturidade, {
    setorRegulado
  });

  const mapa = new Map();
  for (const area of areas) {
    const cfg = porAreaId.get(area.id);
    const ativa = cfg ? cfg.ativa : true;
    const foraDaMediaGeral = areaForaDaMediaGeral(area);
    const peso = cfg ? round2(cfg.peso) : (pesosDefault.get(area.id) ?? 0);
    mapa.set(area.id, {
      ativa,
      peso,
      foraDaMediaGeral,
      foraDeEscopo: configurado && !ativa
    });
  }
  return { configurado, porAreaId: mapa, frameworkMaturidade, setorRegulado };
}

/** Remove dimensões marcadas como fora do escopo (desativadas na config do projeto). */
export function filtrarScoresNoEscopo(scoresPorArea) {
  return (scoresPorArea || []).filter((s) => s.foraDeEscopo !== true);
}

/** Nomes das dimensões fora de escopo a partir do mapa de apresentação. */
export function nomesDimensoesForaEscopo(porAreaId, areas = []) {
  const nomes = [];
  for (const area of areas) {
    const cfg = porAreaId?.get(area.id);
    if (cfg?.foraDeEscopo) nomes.push(area.nome);
  }
  return nomes;
}

/**
 * Lista de areaIds ATIVOS do projeto (default de áreas dos convites).
 * Retorna null quando o projeto não tem config (mantém o default anterior do convite).
 */
export async function areaIdsAtivosDoProjeto(prisma, projetoId) {
  const { configurado, porAreaId } = await carregarConfigDimensoesProjeto(prisma, projetoId);
  if (!configurado) return null;
  const ids = [];
  for (const cfg of porAreaId.values()) {
    if (cfg.ativa) ids.push(cfg.areaId);
  }
  return ids;
}

/**
 * Pesos default por areaId — delega à política do framework (SATF exclui D10 da média).
 */
function pesosDefaultNormalizados(areas, frameworkMaturidade, setorRegulado = false) {
  return pesosDefaultNormalizadosFramework(areas, frameworkMaturidade, { setorRegulado });
}

/** Carrega as 16 dimensões na ordem do framework com a nota consolidada de maturidade. */
async function carregarNotasDimensoes(prisma, projetoId) {
  const areas = ordenarAreasPorFramework(
    await listarAreasDoProjeto(prisma, projetoId)
  );
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { projetoId, status: 'finalizada' },
    include: { respostas: { include: { pergunta: { include: { area: true } } } } }
  });
  const { todasDimensoes } = calcularScoresConsolidadoMaturidade(avaliacoes, areas);
  const notas = new Map();
  for (const d of todasDimensoes || []) {
    if (d.areaId != null) {
      notas.set(Number(d.areaId), {
        score: Number(d.score) || 0,
        nivel: d.nivel ?? null,
        semDadosConsolidados: d.semDadosConsolidados === true
      });
    }
  }
  return { areas, notas };
}

/**
 * Estado completo para a tela de configuração: 16 dimensões com ativa/peso/nota.
 * Sem config salva → todas ativas com peso igual (100/16 = 6.25%).
 */
export async function montarDimensoesProjeto(prisma, projetoId) {
  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    include: { empresa: true }
  });
  if (!projeto) {
    const err = new Error('Projeto não encontrado');
    err.status = 404;
    throw err;
  }

  const { configurado, porAreaId } = await carregarConfigDimensoesProjeto(prisma, projetoId);
  const { frameworkMaturidade, setorRegulado } = await carregarFrameworkProjeto(prisma, projetoId);
  const { areas, notas } = await carregarNotasDimensoes(prisma, projetoId);

  const pesosDefault = pesosDefaultNormalizados(areas, frameworkMaturidade, setorRegulado);

  const dimensoes = areas.map((area) => {
    const cfg = porAreaId.get(area.id);
    const nota = notas.get(area.id) || {};
    const foraDaMediaGeral = areaForaDaMediaGeral(area);
    const codigo = codigoFrameworkArea(area);
    return {
      areaId: area.id,
      area: area.nome,
      ordem: area.ordem,
      codigoFramework: codigo,
      tipoDimensao: area.tipoDimensao ?? 'nucleo',
      foraDaMediaGeral,
      pesoReforcoRegulatorio: areaReforcoPesoRegulatorioSatf(area, setorRegulado),
      obrigatoria: frameworkMaturidade === FRAMEWORK_SATF_TI_V3 && setorRegulado && codigo === 'D11',
      ativa: cfg ? cfg.ativa : true,
      peso: cfg ? round2(cfg.peso) : (pesosDefault.get(area.id) ?? 0),
      notaAtual: Number(nota.score) || 0,
      nivel: nota.nivel ?? null,
      semDadosConsolidados: nota.semDadosConsolidados === true
    };
  });

  const totalAtivas = dimensoes.filter((d) => d.ativa).length;
  const somaPesosAtivas = round2(
    dimensoes.filter((d) => d.ativa).reduce((acc, d) => acc + d.peso, 0)
  );

  return {
    projeto: { id: projeto.id, nome: projeto.nome, empresa: projeto.empresa?.nome || null },
    frameworkMaturidade,
    setorRegulado,
    configurado,
    totalDimensoes: dimensoes.length,
    totalAtivas,
    somaPesosAtivas,
    dimensoes
  };
}

/**
 * Persiste a config (ativa + peso por dimensão). Exige soma das ATIVAS = 100% e ≥ 1 ativa.
 */
export async function salvarDimensoesProjeto(prisma, projetoId, body = {}) {
  await ensureProjetoDimensaoConfigSchema(prisma);

  const projeto = await prisma.projeto.findUnique({ where: { id: projetoId } });
  if (!projeto) {
    const err = new Error('Projeto não encontrado');
    err.status = 404;
    throw err;
  }

  const areas = await listarAreasDoProjeto(prisma, projetoId, { includePerguntas: false });
  const { frameworkMaturidade, setorRegulado } = await carregarFrameworkProjeto(prisma, projetoId);
  const areaIdsValidas = new Set(areas.map((a) => a.id));
  const areaPorId = new Map(areas.map((a) => [a.id, a]));

  const entrada = Array.isArray(body.dimensoes) ? body.dimensoes : [];
  const normalizadas = [];
  const vistos = new Set();
  for (const d of entrada) {
    const areaId = Number(d.areaId);
    if (!areaIdsValidas.has(areaId) || vistos.has(areaId)) continue;
    vistos.add(areaId);
    const foraMedia = areaForaDaMediaGeral(areaPorId.get(areaId));
    const ativa = d.ativa !== false;
    const peso = foraMedia ? 0 : ativa ? Math.max(0, round2(d.peso)) : 0;
    normalizadas.push({ areaId, ativa, peso });
  }

  const ativas = normalizadas.filter((d) => d.ativa);
  const ativasNaMedia = ativas.filter((d) => !areaForaDaMediaGeral(areaPorId.get(d.areaId)));
  if (ativas.length === 0) {
    const err = new Error('Selecione ao menos uma dimensão para avaliar.');
    err.status = 400;
    throw err;
  }

  if (frameworkMaturidade === FRAMEWORK_SATF_TI_V3 && setorRegulado) {
    const d11 = areas.find((a) => codigoFrameworkArea(a) === 'D11');
    const cfgD11 = d11 ? normalizadas.find((d) => d.areaId === d11.id) : null;
    if (d11 && (!cfgD11 || !cfgD11.ativa)) {
      const err = new Error(
        'Em setor regulado, a dimensão D11 (Conformidade Regulatória de IA) é obrigatória e não pode ser desativada.'
      );
      err.status = 400;
      throw err;
    }
  }

  const soma = round2(ativasNaMedia.reduce((acc, d) => acc + d.peso, 0));
  if (ativasNaMedia.length > 0 && Math.abs(soma - 100) > 0.05) {
    const err = new Error(
      `A soma dos pesos das dimensões ativas deve ser 100% (atual: ${soma}%).`
    );
    err.status = 400;
    throw err;
  }

  await prisma.$transaction([
    prisma.$executeRawUnsafe(
      `DELETE FROM "ProjetoDimensaoConfig" WHERE "projetoId" = $1`,
      projetoId
    ),
    ...normalizadas.map((d) =>
      prisma.$executeRawUnsafe(
        `INSERT INTO "ProjetoDimensaoConfig"
           ("projetoId","areaId","ativa","peso","createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        projetoId,
        d.areaId,
        d.ativa,
        d.peso
      )
    )
  ]);

  return montarDimensoesProjeto(prisma, projetoId);
}

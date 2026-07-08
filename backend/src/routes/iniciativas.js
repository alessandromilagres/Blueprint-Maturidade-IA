import express from 'express';
import { prisma } from '../lib/prisma.js';
import { podeValidarRegulatorio } from '../utils/regulatorioSnapshot.js';
import { calcularScoresConsolidadoMaturidade } from '../utils/scoresConsolidadoProjetoMaturidade.js';
import {
  ORDEM_DIMENSOES_FRAMEWORK,
  ordenarAreasPorFramework
} from '../utils/ordemDimensoesFramework.js';
import { listarAreasDoProjeto } from '../utils/areaFrameworkCatalog.js';
import { garantirUnidadeGeralEmpresa } from '../utils/empresaUnidade.js';
import { filtrarAvaliacoesRelatorioProjeto } from '../utils/relatorioUnidadeIA.js';
import { filtroNivelPrioridadeFromRaw } from '../utils/nivelPrioridadeMapeamentoMaturidade.js';

const router = express.Router();

const STATUS_VALIDOS = ['backlog', 'planejada', 'em_andamento', 'concluida', 'cancelada'];
const PRIORIDADES_VALIDAS = ['alta', 'media', 'baixa'];
const CONTEXTOS_VALIDOS = ['dimensao', 'produto', 'portfolio'];
// Mutação alinhada ao módulo regulatório (admin, gestor, sysmap, negocios, ti, executivo).
function gestaoExecucaoMiddleware(req, res, next) {
  if (!req.usuario) return res.status(401).json({ error: 'Não autenticado' });
  if (!podeValidarRegulatorio(req.usuario.role)) {
    return res.status(403).json({ error: 'Acesso não autorizado para este perfil' });
  }
  return next();
}

function parseId(param) {
  const id = parseInt(String(param), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** "D01".."D16" → rótulo da dimensão (1-indexado pela ordem oficial do framework). */
export function rotuloDimensaoPorCodigo(codigo) {
  const m = String(codigo || '').trim().toUpperCase().match(/^D?0*([0-9]{1,2})$/);
  if (!m) return null;
  const idx = parseInt(m[1], 10) - 1;
  return ORDEM_DIMENSOES_FRAMEWORK[idx] || null;
}

/** Índice (1-based) da dimensão pelo nome → "D01".."D16". */
function codigoDimensaoPorNome(nome) {
  const idx = ORDEM_DIMENSOES_FRAMEWORK.indexOf(String(nome || '').trim());
  if (idx < 0) return null;
  return `D${String(idx + 1).padStart(2, '0')}`;
}

function parseDataOpcional(valor) {
  if (valor === undefined) return undefined;
  if (valor === null || valor === '') return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function clampProgresso(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function sanitizarPayloadIniciativa(body = {}, { parcial = false } = {}) {
  const erros = [];
  const data = {};

  if (!parcial || body.titulo !== undefined) {
    const titulo = String(body.titulo || '').trim();
    if (!titulo) erros.push('titulo é obrigatório');
    else data.titulo = titulo.slice(0, 300);
  }

  if (!parcial || body.contextoTipo !== undefined) {
    const ct = String(body.contextoTipo || 'dimensao').trim().toLowerCase();
    if (!CONTEXTOS_VALIDOS.includes(ct)) erros.push(`contextoTipo inválido (${CONTEXTOS_VALIDOS.join(', ')})`);
    else data.contextoTipo = ct;
  }

  if (!parcial || body.contextoId !== undefined) {
    const ci = String(body.contextoId ?? '').trim();
    if (!ci) erros.push('contextoId é obrigatório');
    else data.contextoId = ci.slice(0, 100);
  }

  if (body.contextoRotulo !== undefined) {
    data.contextoRotulo = body.contextoRotulo ? String(body.contextoRotulo).trim().slice(0, 200) : null;
  }
  if (body.descricao !== undefined) {
    data.descricao = body.descricao ? String(body.descricao).trim() : null;
  }
  if (body.responsavel !== undefined) {
    data.responsavel = body.responsavel ? String(body.responsavel).trim().slice(0, 200) : null;
  }

  if (body.status !== undefined) {
    const st = String(body.status).trim().toLowerCase();
    if (!STATUS_VALIDOS.includes(st)) erros.push(`status inválido (${STATUS_VALIDOS.join(', ')})`);
    else data.status = st;
  }
  if (body.prioridade !== undefined) {
    const pr = String(body.prioridade).trim().toLowerCase();
    if (!PRIORIDADES_VALIDAS.includes(pr)) erros.push(`prioridade inválida (${PRIORIDADES_VALIDAS.join(', ')})`);
    else data.prioridade = pr;
  }
  if (body.progresso !== undefined) {
    data.progresso = clampProgresso(body.progresso);
  }

  for (const campo of ['dataInicio', 'dataFimPrevista', 'dataFimReal']) {
    if (body[campo] !== undefined) {
      const d = parseDataOpcional(body[campo]);
      if (d === undefined) erros.push(`${campo} inválida`);
      else data[campo] = d;
    }
  }

  for (const campo of ['gapVinculado', 'scoreAlvo', 'roiEstimado']) {
    if (body[campo] !== undefined) {
      data[campo] = body[campo] === null || body[campo] === '' ? null : Number(body[campo]);
      if (data[campo] !== null && !Number.isFinite(data[campo])) erros.push(`${campo} inválido`);
    }
  }
  if (body.projetoVersaoId !== undefined) {
    data.projetoVersaoId = body.projetoVersaoId ? parseId(body.projetoVersaoId) : null;
  }
  if (body.origemRelatorioId !== undefined) {
    data.origemRelatorioId = body.origemRelatorioId ? parseId(body.origemRelatorioId) : null;
  }
  if (body.empresaUnidadeId !== undefined) {
    data.empresaUnidadeId =
      body.empresaUnidadeId === null || body.empresaUnidadeId === ''
        ? null
        : parseId(body.empresaUnidadeId);
    if (body.empresaUnidadeId != null && body.empresaUnidadeId !== '' && !data.empresaUnidadeId) {
      erros.push('empresaUnidadeId inválido');
    }
  }

  return { data, erros };
}

async function validarUnidadeIniciativa(projetoId, empresaUnidadeId) {
  if (empresaUnidadeId == null) return { ok: true };
  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    select: { empresaId: true }
  });
  if (!projeto) return { ok: false, status: 404, error: 'Projeto não encontrado' };
  const unidade = await prisma.unidadeEmpresa.findFirst({
    where: { id: empresaUnidadeId, empresaId: projeto.empresaId, ativo: true }
  });
  if (!unidade) {
    return { ok: false, status: 400, error: 'Unidade organizacional inválida para este projeto' };
  }
  return { ok: true, unidade };
}

async function idsAvaliacoesDaVersaoLocal(projetoId, projetoVersaoId) {
  if (!projetoVersaoId) return null;
  const rows = await prisma.$queryRaw`
    SELECT a."id"
    FROM "Avaliacao" a
    JOIN "ProjetoVersaoAvaliacao" pva ON pva."avaliacaoId" = a."id"
    WHERE a."projetoId" = ${projetoId} AND pva."projetoVersaoId" = ${projetoVersaoId}
  `;
  return new Set(rows.map((row) => Number(row.id)));
}

async function criarIniciativasDeGaps({
  projetoId,
  projetoVersaoId,
  scoreAlvoPadrao,
  avaliacoesFiltradas,
  relatorioId,
  criadoPorId,
  empresaUnidadeId = null,
  unidadeNome = null
}) {
  const areas = ordenarAreasPorFramework(await listarAreasDoProjeto(prisma, projetoId));
  const { scoresPorArea } = calcularScoresConsolidadoMaturidade(avaliacoesFiltradas, areas);
  const gaps = (scoresPorArea || [])
    .filter((a) => Number(a.score) > 0 && Number(a.score) < scoreAlvoPadrao)
    .sort((a, b) => Number(a.score) - Number(b.score))
    .slice(0, 12);

  if (gaps.length === 0) {
    return {
      criadas: 0,
      ignoradas: 0,
      iniciativas: [],
      mensagem: 'Nenhum gap abaixo do score-alvo.'
    };
  }

  const existentes = await prisma.iniciativa.findMany({
    where: {
      projetoId,
      contextoTipo: 'dimensao',
      projetoVersaoId: projetoVersaoId ?? undefined,
      empresaUnidadeId: empresaUnidadeId ?? null
    },
    select: { contextoId: true }
  });
  const jaImportadas = new Set(existentes.map((e) => e.contextoId));

  const criadas = [];
  let ignoradas = 0;
  const prefixoUnidade = unidadeNome ? `[${unidadeNome}] ` : '';

  for (const gap of gaps) {
    const codigo = codigoDimensaoPorNome(gap.area);
    const contextoId = codigo || gap.area;
    if (jaImportadas.has(contextoId)) {
      ignoradas++;
      continue;
    }
    const gapValor = parseFloat((scoreAlvoPadrao - Number(gap.score)).toFixed(2));
    const iniciativa = await prisma.iniciativa.create({
      data: {
        projetoId,
        projetoVersaoId,
        empresaUnidadeId,
        contextoTipo: 'dimensao',
        contextoId,
        contextoRotulo: gap.area,
        titulo: `${prefixoUnidade}Evoluir maturidade: ${gap.area}`,
        descricao: unidadeNome
          ? `Iniciativa da unidade ${unidadeNome}. Score atual ${Number(gap.score).toFixed(2)} → alvo ${scoreAlvoPadrao.toFixed(1)}.`
          : `Iniciativa derivada do diagnóstico. Score atual ${Number(gap.score).toFixed(2)} → alvo ${scoreAlvoPadrao.toFixed(1)}.`,
        status: 'backlog',
        prioridade: Number(gap.score) < 2 ? 'alta' : Number(gap.score) < 3 ? 'media' : 'baixa',
        progresso: 0,
        gapVinculado: gapValor,
        scoreAlvo: scoreAlvoPadrao,
        origemRelatorioId: relatorioId || null,
        criadoPorId: criadoPorId || null
      }
    });
    criadas.push(iniciativa);
  }

  return { criadas: criadas.length, ignoradas, iniciativas: criadas };
}

// GET /api/iniciativas?projetoId=&projetoVersaoId=&contextoTipo=&contextoId=&status=
router.get('/', async (req, res) => {
  try {
    const projetoId = parseId(req.query.projetoId);
    if (!projetoId) return res.status(400).json({ error: 'projetoId é obrigatório' });

    const where = { projetoId };
    if (req.query.projetoVersaoId) where.projetoVersaoId = parseId(req.query.projetoVersaoId);
    if (req.query.contextoTipo) {
      const ct = String(req.query.contextoTipo).toLowerCase();
      if (CONTEXTOS_VALIDOS.includes(ct)) where.contextoTipo = ct;
    }
    if (req.query.contextoId) where.contextoId = String(req.query.contextoId);
    if (req.query.status) {
      const st = String(req.query.status).toLowerCase();
      if (STATUS_VALIDOS.includes(st)) where.status = st;
    }
    if (req.query.empresaUnidadeId !== undefined && req.query.empresaUnidadeId !== '') {
      const uid = parseId(req.query.empresaUnidadeId);
      if (uid) where.empresaUnidadeId = uid;
    } else if (req.query.empresaUnidadeId === 'null' || req.query.empresaUnidadeId === '0') {
      where.empresaUnidadeId = null;
    }

    const iniciativas = await prisma.iniciativa.findMany({
      where,
      orderBy: [{ contextoId: 'asc' }, { prioridade: 'asc' }, { createdAt: 'asc' }],
      include: { criadoPor: { select: { id: true, nome: true } } }
    });

    res.json(iniciativas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/iniciativas/export?projetoId=&contextoTipo=&format=csv
router.get('/export', async (req, res) => {
  try {
    const projetoId = parseId(req.query.projetoId);
    if (!projetoId) return res.status(400).json({ error: 'projetoId é obrigatório' });

    const where = { projetoId };
    if (req.query.projetoVersaoId) where.projetoVersaoId = parseId(req.query.projetoVersaoId);
    if (req.query.contextoTipo) {
      const ct = String(req.query.contextoTipo).toLowerCase();
      if (CONTEXTOS_VALIDOS.includes(ct)) where.contextoTipo = ct;
    }
    if (req.query.empresaUnidadeId !== undefined && req.query.empresaUnidadeId !== '') {
      const uid = parseId(req.query.empresaUnidadeId);
      if (uid) where.empresaUnidadeId = uid;
    }

    const iniciativas = await prisma.iniciativa.findMany({
      where,
      orderBy: [{ contextoId: 'asc' }, { createdAt: 'asc' }]
    });

    const colunas = [
      'id', 'contextoTipo', 'contextoId', 'contextoRotulo', 'titulo', 'descricao',
      'responsavel', 'status', 'prioridade', 'progresso',
      'dataInicio', 'dataFimPrevista', 'dataFimReal',
      'gapVinculado', 'scoreAlvo', 'roiEstimado', 'empresaUnidadeId'
    ];
    const escapar = (v) => {
      if (v === null || v === undefined) return '';
      const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
      return /[";,\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const linhas = [colunas.join(',')];
    for (const ini of iniciativas) {
      linhas.push(colunas.map((c) => escapar(ini[c])).join(','));
    }
    // BOM para abrir corretamente no Excel pt-BR
    const csv = '\uFEFF' + linhas.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="roadmap-projeto-${projetoId}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/iniciativas
router.post('/', gestaoExecucaoMiddleware, async (req, res) => {
  try {
    const projetoId = parseId(req.body.projetoId);
    if (!projetoId) return res.status(400).json({ error: 'projetoId é obrigatório' });

    const projeto = await prisma.projeto.findUnique({ where: { id: projetoId }, select: { id: true } });
    if (!projeto) return res.status(404).json({ error: 'Projeto não encontrado' });

    const { data, erros } = sanitizarPayloadIniciativa(req.body);
    if (erros.length) return res.status(400).json({ error: 'Dados inválidos', detalhes: erros.map((m) => ({ mensagem: m })) });

    if (data.contextoTipo === 'dimensao' && !data.contextoRotulo) {
      data.contextoRotulo = rotuloDimensaoPorCodigo(data.contextoId) || data.contextoRotulo;
    }

    if (data.empresaUnidadeId) {
      const valUnidade = await validarUnidadeIniciativa(projetoId, data.empresaUnidadeId);
      if (!valUnidade.ok) return res.status(valUnidade.status).json({ error: valUnidade.error });
    }

    const iniciativa = await prisma.iniciativa.create({
      data: {
        projetoId,
        criadoPorId: req.usuario?.id || null,
        ...data
      }
    });
    res.status(201).json(iniciativa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/iniciativas/:id
router.put('/:id', gestaoExecucaoMiddleware, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const existente = await prisma.iniciativa.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: 'Iniciativa não encontrada' });

    const { data, erros } = sanitizarPayloadIniciativa(req.body, { parcial: true });
    if (erros.length) return res.status(400).json({ error: 'Dados inválidos', detalhes: erros.map((m) => ({ mensagem: m })) });

    if (data.empresaUnidadeId) {
      const valUnidade = await validarUnidadeIniciativa(existente.projetoId, data.empresaUnidadeId);
      if (!valUnidade.ok) return res.status(valUnidade.status).json({ error: valUnidade.error });
    }

    const iniciativa = await prisma.iniciativa.update({ where: { id }, data });
    res.json(iniciativa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/iniciativas/:id
router.delete('/:id', gestaoExecucaoMiddleware, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });

    const existente = await prisma.iniciativa.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ error: 'Iniciativa não encontrada' });

    await prisma.iniciativa.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/iniciativas/importar-roadmap-ia/:relatorioId
// Cria rascunhos de iniciativas (lente dimensão) a partir dos gaps do diagnóstico do projeto.
// O vínculo iniciativa ↔ gap ↔ score-alvo ↔ ROI é o diferencial do módulo.
router.post('/importar-roadmap-ia/:relatorioId', gestaoExecucaoMiddleware, async (req, res) => {
  try {
    const relatorioId = parseId(req.params.relatorioId);
    const projetoId = parseId(req.body.projetoId);
    if (!projetoId) return res.status(400).json({ error: 'projetoId é obrigatório' });

    const projetoVersaoId = req.body.projetoVersaoId ? parseId(req.body.projetoVersaoId) : null;
    const scoreAlvoPadrao = Number(req.body.scoreAlvo) > 0 ? Number(req.body.scoreAlvo) : 3.5;

    const projeto = await prisma.projeto.findUnique({
      where: { id: projetoId },
      include: {
        avaliacoes: {
          where: { status: 'finalizada' },
          include: { usuario: true, respostas: { include: { pergunta: { include: { area: true } } } } }
        }
      }
    });
    if (!projeto) return res.status(404).json({ error: 'Projeto não encontrado' });
    if (projeto.avaliacoes.length === 0) {
      return res.status(400).json({ error: 'Não há avaliações finalizadas para derivar o roadmap.' });
    }

    const resultado = await criarIniciativasDeGaps({
      projetoId,
      projetoVersaoId,
      scoreAlvoPadrao,
      avaliacoesFiltradas: projeto.avaliacoes,
      relatorioId,
      criadoPorId: req.usuario?.id || null,
      empresaUnidadeId: null
    });

    res.status(201).json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/iniciativas/importar-gaps-unidade
router.post('/importar-gaps-unidade', gestaoExecucaoMiddleware, async (req, res) => {
  try {
    const projetoId = parseId(req.body.projetoId);
    const empresaUnidadeId = parseId(req.body.empresaUnidadeId);
    if (!projetoId) return res.status(400).json({ error: 'projetoId é obrigatório' });
    if (!empresaUnidadeId) return res.status(400).json({ error: 'empresaUnidadeId é obrigatório' });

    const valUnidade = await validarUnidadeIniciativa(projetoId, empresaUnidadeId);
    if (!valUnidade.ok) return res.status(valUnidade.status).json({ error: valUnidade.error });

    const projetoVersaoId = req.body.projetoVersaoId ? parseId(req.body.projetoVersaoId) : null;
    const scoreAlvoPadrao = Number(req.body.scoreAlvo) > 0 ? Number(req.body.scoreAlvo) : 3.5;
    const filtroNivelMax = filtroNivelPrioridadeFromRaw(req.body.nivelPrioridadeMapeamentoMaturidade);

    const projeto = await prisma.projeto.findUnique({
      where: { id: projetoId },
      include: {
        avaliacoes: {
          where: { status: 'finalizada' },
          include: {
            usuario: { include: { empresaUnidade: true } },
            respostas: { include: { pergunta: { include: { area: true } } } }
          }
        }
      }
    });
    if (!projeto) return res.status(404).json({ error: 'Projeto não encontrado' });

    const unidadeGeral = await garantirUnidadeGeralEmpresa(projeto.empresaId);
    const idsVersao = await idsAvaliacoesDaVersaoLocal(projetoId, projetoVersaoId);
    const idsSet =
      idsVersao ||
      new Set((projeto.avaliacoes || []).map((a) => Number(a.id)));
    const avaliacoesFiltradas = filtrarAvaliacoesRelatorioProjeto(projeto.avaliacoes, {
      idsVersao: idsSet,
      filtroNivelMax,
      filtroUnidadeId: empresaUnidadeId,
      unidadeGeralId: unidadeGeral?.id
    });

    if (!avaliacoesFiltradas.length) {
      return res.status(400).json({
        error: 'Não há avaliações finalizadas de avaliadores desta unidade.'
      });
    }

    const resultado = await criarIniciativasDeGaps({
      projetoId,
      projetoVersaoId,
      scoreAlvoPadrao,
      avaliacoesFiltradas,
      relatorioId: null,
      criadoPorId: req.usuario?.id || null,
      empresaUnidadeId,
      unidadeNome: valUnidade.unidade?.nome || null
    });

    res.status(201).json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/iniciativas/importar-produto/:produtoId
// Cria iniciativas (lente produto) a partir das perguntas de transformação agêntica com menor score.
router.post('/importar-produto/:produtoId', gestaoExecucaoMiddleware, async (req, res) => {
  try {
    const produtoId = parseId(req.params.produtoId);
    if (!produtoId) return res.status(400).json({ error: 'produtoId inválido' });

    const projetoVersaoId = req.body.projetoVersaoId ? parseId(req.body.projetoVersaoId) : null;
    const scoreAlvoPadrao = Number(req.body.scoreAlvo) > 0 ? Number(req.body.scoreAlvo) : 3.5;

    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: {
        avaliacoes: {
          where: { status: 'finalizada' },
          include: { respostasObrigatorias: { include: { perguntaObrigatoria: true } } }
        }
      }
    });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    if (produto.avaliacoes.length === 0) {
      return res.status(400).json({ error: 'Não há avaliações finalizadas do produto para derivar iniciativas.' });
    }

    const perguntas = await prisma.perguntaObrigatoriaProduto.findMany({ orderBy: { ordem: 'asc' } });
    const gaps = perguntas
      .map((pergunta) => {
        let soma = 0;
        let count = 0;
        for (const av of produto.avaliacoes) {
          const r = av.respostasObrigatorias?.find(
            (x) => x.perguntaObrigatoriaId === pergunta.id && x.pontuacao !== null
          );
          if (r) { soma += r.pontuacao; count++; }
        }
        const score = count > 0 ? soma / count : 0;
        return { pergunta, score, count };
      })
      .filter((g) => g.count > 0 && g.score < scoreAlvoPadrao)
      .sort((a, b) => a.score - b.score)
      .slice(0, 8);

    if (gaps.length === 0) {
      return res.json({ criadas: 0, ignoradas: 0, iniciativas: [], mensagem: 'Nenhum gap de prontidão agêntica abaixo do alvo.' });
    }

    const existentes = await prisma.iniciativa.findMany({
      where: { projetoId: produto.projetoId, contextoTipo: 'produto', contextoId: String(produtoId) },
      select: { titulo: true }
    });
    const titulosExistentes = new Set(existentes.map((e) => e.titulo));

    const criadas = [];
    let ignoradas = 0;
    for (const gap of gaps) {
      const titulo = `[${produto.nome}] ${gap.pergunta.categoria}`;
      if (titulosExistentes.has(titulo)) { ignoradas++; continue; }
      const iniciativa = await prisma.iniciativa.create({
        data: {
          projetoId: produto.projetoId,
          projetoVersaoId,
          contextoTipo: 'produto',
          contextoId: String(produtoId),
          contextoRotulo: produto.nome,
          titulo,
          descricao: `Gap de transformação agêntica: "${gap.pergunta.texto}". Score atual ${gap.score.toFixed(2)} → alvo ${scoreAlvoPadrao.toFixed(1)}.`,
          status: 'backlog',
          prioridade: gap.score < 2 ? 'alta' : gap.score < 3 ? 'media' : 'baixa',
          progresso: 0,
          gapVinculado: parseFloat((scoreAlvoPadrao - gap.score).toFixed(2)),
          scoreAlvo: scoreAlvoPadrao,
          criadoPorId: req.usuario?.id || null
        }
      });
      criadas.push(iniciativa);
    }

    res.status(201).json({ criadas: criadas.length, ignoradas, iniciativas: criadas });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

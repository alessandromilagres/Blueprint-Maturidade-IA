import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import {
  prisma,
  initPrismaUsuarioColumnProbe,
  isUsuarioNivelPrioridadeColumnPresentInDb,
  refreshUsuarioNivelPrioridadeColumnFlag,
  usuarioCreateCompat
} from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import especificacaoRoutes from './routes/especificacao.js';
import arquivosRoutes from './routes/arquivos.js';
import arquiteturasReferenciaRoutes from './routes/arquiteturas-referencia.js';
import exportacaoRoutes from './routes/exportacao.js';
import diagnosticoRoutes from './routes/diagnostico.js';
import relatoriosIARoutes, { salvarRelatorioIA } from './routes/relatorios-ia.js';
import relatoriosIAJobsRoutes from './routes/relatorios-ia-jobs.js';
import empresaLogoRoutes from './routes/empresa-logo.js';
import regulatorioRoutes from './routes/regulatorio.js';
import { authMiddleware, roleMiddleware, generateToken } from './middlewares/auth.js';
import { validate, globalSanitizer } from './middlewares/validate.js';
import { 
  empresaSchemas, 
  usuarioSchemas, 
  projetoSchemas, 
  produtoSchemas,
  avaliacaoSchemas,
  avaliacaoProdutoSchemas,
  idParam,
  querySchemas
} from './validators/schemas.js';
import {
  gerarTokenConvite,
  enviarEmailConviteAvaliacao,
  enviarEmailResultadoAvaliacao,
  verificarConexaoSMTP
} from './services/email.js';
import {
  getConviteConfigFromDb,
  salvarConviteConfigNoDb,
  getDefaultConviteTemplateHtml,
  getDefaultAssuntoConvite,
  PLACEHOLDERS_CONVITE,
  DESCRICAO_PLACEHOLDERS_CONVITE,
  previewConviteHtml,
  montarAssuntoConvite
} from './services/emailConviteTemplate.js';
import { callAI, callAIWithContinuation, getProvider, loadPersistedAIConfig } from './services/ai-provider.js';
import {
  usuarioPodeIniciarCadastroProduto,
  usuarioMesmaEmpresaProjeto
} from './constants/produtoWorkflow.js';
import {
  mergeInformacoesAdicionais,
  mergeIdealizacaoProduto,
  filtrarBodyProdutoPorPapel,
  processarNotificacoesCadastroProduto
} from './services/produto-cadastro-workflow.js';
import { gerarApoioEspecificacaoDaIdealizacao } from './services/idealizacaoApoioEspecificacaoIA.js';
import { adicionarIndiceAoBookMarkdown } from './utils/bookMarkdownIndice.js';
import { percentualReferenciaRoi, projecaoFinanceiraRelatorio } from './utils/roiPorFaturamento.js';
import {
  blocoParametrosFinanceirosMarkdown,
  blocoMetodologiaRoiExecutivaMarkdown
} from './utils/metodologiaRoiFinanceiro.js';
import { blocoTrajetoriaMitMarkdown } from './utils/mitTrajetoriaFinanceira.js';
import {
  blocoEvolucaoVersoesMarkdown,
  blocoLogicaMaturidadeMarkdown,
  montarComparativoVersoesProjeto
} from './utils/evolucaoVersoesProjeto.js';
import {
  blocoDadosExtrasBookRapido,
  blocoGanhoLongoPrazoMitBookRapido,
  tabelaPerguntasDimensaoMarkdown,
  dimensaoComScoreZero,
  blocoDimensaoScoreZeroSecao3,
  blocoFallbackErroSecao3Dimensao,
  garantirBlocosSecao3Book,
  instrucaoPromptSecao3SemCabecalhos,
  montarBlocoSecao3Dimensao,
  relatorioBookSecao3Completo
} from './utils/bookModoRapidoMarkdown.js';
import {
  parseAreasRecusadas,
  parseAreasSelecionadas,
  respostasParaCalculo,
  areaContaParaAvaliacao,
  calcularProgressoAvaliacaoProjeto
} from './utils/avaliacaoAreasRecusadas.js';
import { normalizarDesejosIA, desejosIaParaRespostasEmail } from './utils/desejosIaAvaliacaoMaturidade.js';
import {
  mergeDesejosIaNaAvaliacaoParaApi,
  findUniqueAvaliacaoApiOrFallback,
  updateAvaliacaoComMergeFallback,
  isMissingAvaliacaoDesejosIaTableError,
  isAvaliacaoDesejosIaUpsertFailureIgnorable
} from './utils/avaliacaoDesejosIaMerge.js';
import {
  parseFiltroNivelPrioridadeMapeamentoMaturidadeMax,
  usuarioIncluidoNoFiltroNivelMapeamentoMaturidade,
  nivelPrioridadeMapeamentoMaturidadeDoUsuario,
  filtroNivelRelatorioIACompativel,
  blocoAvaliadoresConsolidadoMarkdown,
  prependCapaNivelAvaliadoresAoRelatorio
} from './utils/nivelPrioridadeMapeamentoMaturidade.js';
import {
  calcularScoresConsolidadoMaturidade,
  nivelNumericoDeScore
} from './utils/scoresConsolidadoProjetoMaturidade.js';
import { NOMES_NIVEL_BLUEPRINT, faixaNivelPorScore } from './utils/nivelMaturidadeRubrica.js';
import { blocoGuiaProgressaoDimensao } from './utils/guiasProgressaoFramework.js';
import {
  ordenarAreasPorFramework,
  ordenarDimensoesPorFramework,
  blocoOrdemDimensoesFrameworkMarkdown
} from './utils/ordemDimensoesFramework.js';
import { idsAreasSugeridasPorCargo } from './utils/mapaCargosDimensoesAvaliacao.js';
import { getEstagioMitDeScore, mitCisrReferenciaDashboard } from './constants/mitCisrEnterpriseAiMaturity.js';
import {
  SYSTEM_PROMPT_PERSONA_EXECUTIVO,
  SYSTEM_PROMPT_PERSONA_BOOK,
  SYSTEM_PROMPT_PERSONA_BOOK_RAPIDO
} from './constants/consultorRelatorioIA.js';
import { removerArquivosLogoEmpresa, enriquecerDadosUsadosComLogo, resolverLogoEmpresa, enriquecerEmpresasComLogo, enriquecerEmpresaComLogo, probeEmpresaLogoPathColumn } from './utils/empresaLogo.js';
import {
  enriquecerScoresPorAreaComRegulatorio,
  resumoRegulatorioProjeto
} from './utils/regulatorioCrosswalk.js';
import { calculateRegulatorySnapshot, obterRegulatorySnapshotProduto } from './utils/regulatorioSnapshot.js';
import { listarCiclosProduto } from './utils/regulatorioCiclo.js';
import {
  gerarSecao14RegulatorioBookMarkdown,
  montarDashboardRegulatorioProjeto
} from './utils/regulatorioDashboard.js';
import {
  enviarLembreteProjetoComAuditoria,
  executarLembreteLoteProjeto,
  enviarLembreteProdutoComAuditoria,
  executarLembreteLoteProduto,
  obterStatusAvaliadoresProduto
} from './services/lembreteEnvioService.js';
import { startLembreteCronIfEnabled } from './cron/lembreteAgendado.js';

/** Role admin — visão global (ex.: lista todos os produtos). */
function roleIsAdmin(role) {
  return String(role || '').trim().toLowerCase() === 'admin';
}

function usuarioPodeGerenciarProjeto(req, projeto) {
  if (!projeto) return false;
  if (roleIsAdmin(req.usuario?.role)) return true;
  const eid = req.usuario?.empresaId;
  if (eid == null) return false;
  return Number(projeto.empresaId) === Number(eid);
}

function usuarioPodeGerenciarProduto(req, produto) {
  if (!produto?.projeto) return false;
  if (roleIsAdmin(req.usuario?.role)) return true;
  const eid = req.usuario?.empresaId;
  if (eid == null) return false;
  return Number(produto.projeto.empresaId) === Number(eid);
}

function getBaseUrlApp() {
  return String(process.env.BASE_URL || 'https://agentica.sysmap.com.br').replace(/\/$/, '');
}

function parseJsonArrayNumeros(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((id) => parseInt(id, 10)).filter((id) => Number.isFinite(id) && id > 0);
  } catch {
    return [];
  }
}

function dimensoesSelecionadasDoConvite(convite, areaPorId) {
  return parseJsonArrayNumeros(convite?.areasSelecionadas)
    .map((id) => areaPorId.get(id))
    .filter(Boolean)
    .map((area) => ({ id: area.id, nome: area.nome }));
}

let avaliacaoEventoTableReady = false;
let projetoVersaoSchemaReady = false;

async function ensureAvaliacaoEventoTable() {
  if (avaliacaoEventoTableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AvaliacaoEvento" (
      "id" SERIAL PRIMARY KEY,
      "tipo" TEXT NOT NULL,
      "avaliacaoId" INTEGER,
      "conviteId" INTEGER,
      "projetoId" INTEGER,
      "usuarioId" INTEGER,
      "metadata" JSONB,
      "ip" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "AvaliacaoEvento_projetoId_createdAt_idx"
    ON "AvaliacaoEvento" ("projetoId", "createdAt")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "AvaliacaoEvento_avaliacaoId_createdAt_idx"
    ON "AvaliacaoEvento" ("avaliacaoId", "createdAt")
  `);
  avaliacaoEventoTableReady = true;
}

async function ensureProjetoVersaoSchema() {
  if (projetoVersaoSchemaReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProjetoVersao" (
      "id" SERIAL PRIMARY KEY,
      "projetoId" INTEGER NOT NULL,
      "numero" INTEGER NOT NULL,
      "titulo" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'aberta',
      "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "fechadaEm" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ProjetoVersao_projetoId_numero_key" UNIQUE ("projetoId", "numero")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProjetoVersaoAvaliacao" (
      "avaliacaoId" INTEGER PRIMARY KEY,
      "projetoVersaoId" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProjetoVersaoConvite" (
      "conviteId" INTEGER PRIMARY KEY,
      "projetoVersaoId" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ProjetoVersao_projetoId_numero_idx"
    ON "ProjetoVersao" ("projetoId", "numero")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ProjetoVersaoAvaliacao_projetoVersaoId_idx"
    ON "ProjetoVersaoAvaliacao" ("projetoVersaoId")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ProjetoVersaoConvite_projetoVersaoId_idx"
    ON "ProjetoVersaoConvite" ("projetoVersaoId")
  `);
  projetoVersaoSchemaReady = true;
}

function normalizarProjetoVersao(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    projetoId: Number(row.projetoId),
    numero: Number(row.numero),
    titulo: row.titulo,
    status: row.status,
    iniciadaEm: row.iniciadaEm,
    fechadaEm: row.fechadaEm,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

async function obterOuCriarVersaoInicialProjeto(projetoId) {
  await ensureProjetoVersaoSchema();
  let versoes = await prisma.$queryRaw`
    SELECT * FROM "ProjetoVersao"
    WHERE "projetoId" = ${projetoId}
    ORDER BY "numero" ASC
  `;
  if (versoes.length === 0) {
    versoes = await prisma.$queryRaw`
      INSERT INTO "ProjetoVersao" ("projetoId", "numero", "titulo", "status")
      VALUES (${projetoId}, 1, 'Versão 1', 'aberta')
      RETURNING *
    `;
  }
  const primeira = normalizarProjetoVersao(versoes[0]);
  await prisma.$executeRaw`
    INSERT INTO "ProjetoVersaoAvaliacao" ("avaliacaoId", "projetoVersaoId")
    SELECT a."id", ${primeira.id}
    FROM "Avaliacao" a
    LEFT JOIN "ProjetoVersaoAvaliacao" pva ON pva."avaliacaoId" = a."id"
    WHERE a."projetoId" = ${projetoId} AND pva."avaliacaoId" IS NULL
    ON CONFLICT ("avaliacaoId") DO NOTHING
  `;
  await prisma.$executeRaw`
    INSERT INTO "ProjetoVersaoConvite" ("conviteId", "projetoVersaoId")
    SELECT c."id", ${primeira.id}
    FROM "ConviteAvaliacao" c
    LEFT JOIN "ProjetoVersaoConvite" pvc ON pvc."conviteId" = c."id"
    WHERE c."projetoId" = ${projetoId} AND pvc."conviteId" IS NULL
    ON CONFLICT ("conviteId") DO NOTHING
  `;
  return primeira;
}

async function obterVersaoAtualProjeto(projetoId) {
  await obterOuCriarVersaoInicialProjeto(projetoId);
  const abertas = await prisma.$queryRaw`
    SELECT * FROM "ProjetoVersao"
    WHERE "projetoId" = ${projetoId} AND "status" = 'aberta'
    ORDER BY "numero" DESC
    LIMIT 1
  `;
  if (abertas.length > 0) return normalizarProjetoVersao(abertas[0]);
  const ultimas = await prisma.$queryRaw`
    SELECT * FROM "ProjetoVersao"
    WHERE "projetoId" = ${projetoId}
    ORDER BY "numero" DESC
    LIMIT 1
  `;
  return normalizarProjetoVersao(ultimas[0]);
}

async function obterVersaoParaEscritaProjeto(projetoId) {
  await obterOuCriarVersaoInicialProjeto(projetoId);
  const abertas = await prisma.$queryRaw`
    SELECT * FROM "ProjetoVersao"
    WHERE "projetoId" = ${projetoId} AND "status" = 'aberta'
    ORDER BY "numero" DESC
    LIMIT 1
  `;
  if (abertas.length > 0) return normalizarProjetoVersao(abertas[0]);
  return null;
}

async function obterVersaoAbertaProjetoOuErro(projetoId) {
  const versao = await obterVersaoParaEscritaProjeto(projetoId);
  if (!versao || versao.status !== 'aberta') {
    const error = new Error('Não existe versão aberta para este projeto. Crie a próxima versão antes de enviar convites.');
    error.statusCode = 409;
    throw error;
  }
  return versao;
}

async function obterVersaoAnteriorFechadaProjeto(projetoId, versaoAtual) {
  await obterOuCriarVersaoInicialProjeto(projetoId);
  const rows = await prisma.$queryRaw`
    SELECT *
    FROM "ProjetoVersao"
    WHERE "projetoId" = ${projetoId}
      AND "status" = 'fechada'
      AND "numero" < ${versaoAtual?.numero || 999999}
    ORDER BY "numero" DESC
    LIMIT 1
  `;
  return rows.length > 0 ? normalizarProjetoVersao(rows[0]) : null;
}

async function obterVersaoSelecionadaProjeto(req, projetoId) {
  await obterOuCriarVersaoInicialProjeto(projetoId);
  const rawVersaoId = req.query?.projetoVersaoId ?? req.query?.versaoId;
  if (rawVersaoId != null && rawVersaoId !== '') {
    const versaoId = parseInt(rawVersaoId, 10);
    if (Number.isFinite(versaoId) && versaoId > 0) {
      const rows = await prisma.$queryRaw`
        SELECT * FROM "ProjetoVersao"
        WHERE "id" = ${versaoId} AND "projetoId" = ${projetoId}
        LIMIT 1
      `;
      if (rows.length > 0) return normalizarProjetoVersao(rows[0]);
    }
  }
  return obterVersaoAtualProjeto(projetoId);
}

async function setProjetoVersaoEmAvaliacao(avaliacaoId, projetoVersaoId) {
  if (!avaliacaoId || !projetoVersaoId) return;
  await ensureProjetoVersaoSchema();
  await prisma.$executeRaw`
    INSERT INTO "ProjetoVersaoAvaliacao" ("avaliacaoId", "projetoVersaoId")
    VALUES (${avaliacaoId}, ${projetoVersaoId})
    ON CONFLICT ("avaliacaoId")
    DO UPDATE SET "projetoVersaoId" = EXCLUDED."projetoVersaoId"
  `;
}

async function setProjetoVersaoEmConvite(conviteId, projetoVersaoId) {
  if (!conviteId || !projetoVersaoId) return;
  await ensureProjetoVersaoSchema();
  await prisma.$executeRaw`
    INSERT INTO "ProjetoVersaoConvite" ("conviteId", "projetoVersaoId")
    VALUES (${conviteId}, ${projetoVersaoId})
    ON CONFLICT ("conviteId")
    DO UPDATE SET "projetoVersaoId" = EXCLUDED."projetoVersaoId"
  `;
}

async function obterVersaoDoConviteProjeto(convite) {
  if (!convite?.id || !convite?.projetoId) return null;
  await obterOuCriarVersaoInicialProjeto(convite.projetoId);
  const rows = await prisma.$queryRaw`
    SELECT v.*
    FROM "ProjetoVersaoConvite" pvc
    JOIN "ProjetoVersao" v ON v."id" = pvc."projetoVersaoId"
    JOIN "ConviteAvaliacao" c ON c."id" = pvc."conviteId"
    WHERE c."id" = ${convite.id}
    LIMIT 1
  `;
  if (rows.length > 0) return normalizarProjetoVersao(rows[0]);
  const versao = await obterVersaoAtualProjeto(convite.projetoId);
  await setProjetoVersaoEmConvite(convite.id, versao.id);
  return versao;
}

async function idsAvaliacoesDaVersao(projetoId, projetoVersaoId) {
  await obterOuCriarVersaoInicialProjeto(projetoId);
  const rows = await prisma.$queryRaw`
    SELECT a."id"
    FROM "Avaliacao" a
    JOIN "ProjetoVersaoAvaliacao" pva ON pva."avaliacaoId" = a."id"
    WHERE a."projetoId" = ${projetoId} AND pva."projetoVersaoId" = ${projetoVersaoId}
  `;
  return new Set(rows.map((row) => Number(row.id)));
}

async function idsConvitesDaVersao(projetoId, projetoVersaoId) {
  await obterOuCriarVersaoInicialProjeto(projetoId);
  const rows = await prisma.$queryRaw`
    SELECT c."id"
    FROM "ConviteAvaliacao" c
    JOIN "ProjetoVersaoConvite" pvc ON pvc."conviteId" = c."id"
    WHERE c."projetoId" = ${projetoId} AND pvc."projetoVersaoId" = ${projetoVersaoId}
  `;
  return new Set(rows.map((row) => Number(row.id)));
}

async function obterVersaoDaAvaliacao(avaliacao) {
  if (!avaliacao?.id || !avaliacao?.projetoId) return null;
  await obterOuCriarVersaoInicialProjeto(avaliacao.projetoId);
  const rows = await prisma.$queryRaw`
    SELECT v.*
    FROM "ProjetoVersaoAvaliacao" pva
    JOIN "ProjetoVersao" v ON v."id" = pva."projetoVersaoId"
    WHERE pva."avaliacaoId" = ${avaliacao.id}
    LIMIT 1
  `;
  if (rows.length > 0) return normalizarProjetoVersao(rows[0]);
  const versao = await obterVersaoAtualProjeto(avaliacao.projetoId);
  await setProjetoVersaoEmAvaliacao(avaliacao.id, versao.id);
  return versao;
}

async function anexarVersoesEmAvaliacoes(avaliacoes) {
  const out = [];
  for (const avaliacao of avaliacoes || []) {
    out.push({
      ...avaliacao,
      projetoVersao: await obterVersaoDaAvaliacao(avaliacao)
    });
  }
  return out;
}

async function registrarEventoAvaliacao({
  tipo,
  avaliacaoId = null,
  conviteId = null,
  projetoId = null,
  usuarioId = null,
  metadata = null,
  req = null
}) {
  try {
    await ensureAvaliacaoEventoTable();
    const ip = req?.headers?.['x-forwarded-for']?.split(',')?.[0]?.trim() || req?.ip || null;
    const userAgent = req?.headers?.['user-agent'] || null;
    await prisma.$executeRaw`
      INSERT INTO "AvaliacaoEvento"
        ("tipo", "avaliacaoId", "conviteId", "projetoId", "usuarioId", "metadata", "ip", "userAgent")
      VALUES
        (${tipo}, ${avaliacaoId}, ${conviteId}, ${projetoId}, ${usuarioId}, CAST(${metadata ? JSON.stringify(metadata) : null} AS JSONB), ${ip}, ${userAgent})
    `;
  } catch (error) {
    console.warn('[AvaliacaoEvento] Falha ao registrar evento:', error.message);
  }
}

async function listarEventosAvaliacaoPorProjeto(projetoId) {
  try {
    await ensureAvaliacaoEventoTable();
    return await prisma.$queryRaw`
      SELECT
        "id", "tipo", "avaliacaoId", "conviteId", "projetoId", "usuarioId",
        "metadata", "createdAt"
      FROM "AvaliacaoEvento"
      WHERE "projetoId" = ${projetoId}
      ORDER BY "createdAt" DESC
      LIMIT 1000
    `;
  } catch (error) {
    console.warn('[AvaliacaoEvento] Falha ao listar eventos:', error.message);
    return [];
  }
}

function calcularAlertasQualidadeAvaliacao(avaliacao) {
  if (!avaliacao) {
    return { status: 'sem_dados', alertas: [], alertasRespostas: [] };
  }

  const respostas = avaliacao.respostas || [];
  const respostasComNota = respostas
    .map((resposta) => resposta.pontuacao)
    .filter((pontuacao) => pontuacao != null)
    .map(Number);
  const alertas = [];
  const alertasRespostas = [];

  if (respostasComNota.length >= 3 && new Set(respostasComNota).size === 1) {
    alertas.push({
      tipo: 'straight_lining',
      severidade: 'alta',
      mensagem: `Todas as ${respostasComNota.length} respostas com nota usam o mesmo score (${respostasComNota[0]}).`
    });
  }

  const semInformacao = respostas.filter((r) => r.semInformacao === true).length;
  const totalRespostas = respostas.length;
  if (totalRespostas >= 5 && semInformacao / totalRespostas >= 0.35) {
    alertas.push({
      tipo: 'muitas_sem_informacao',
      severidade: 'media',
      mensagem: `${semInformacao} de ${totalRespostas} perguntas foram marcadas como sem informação.`
    });
  }

  for (const resposta of respostas) {
    const pergunta = resposta.pergunta;
    const area = pergunta?.area;
    const observacoes = String(resposta.observacoes || '').trim();
    if (resposta.semInformacao === true && !observacoes) {
      alertasRespostas.push({
        tipo: 'sem_informacao_sem_contexto',
        severidade: 'baixa',
        perguntaId: resposta.perguntaId,
        pergunta: pergunta?.texto || `Pergunta #${resposta.perguntaId}`,
        area: area?.nome || null,
        mensagem: 'Marcada como sem informação sem observação de contexto.'
      });
    } else if ((Number(resposta.pontuacao) === 1 || Number(resposta.pontuacao) === 5) && !observacoes) {
      alertasRespostas.push({
        tipo: 'nota_extrema_sem_evidencia',
        severidade: 'baixa',
        perguntaId: resposta.perguntaId,
        pergunta: pergunta?.texto || `Pergunta #${resposta.perguntaId}`,
        area: area?.nome || null,
        mensagem: `Nota ${resposta.pontuacao} sem observação/evidência.`
      });
    }
  }

  if (alertasRespostas.length >= 5) {
    alertas.push({
      tipo: 'baixa_evidencia_respostas',
      severidade: 'baixa',
      mensagem: `${alertasRespostas.length} resposta(s) merecem revisão de evidência/contexto.`
    });
  }

  if (avaliacao.status === 'finalizada') {
    const inicio = new Date(avaliacao.createdAt).getTime();
    const fim = new Date(avaliacao.updatedAt).getTime();
    const duracaoMinutos = Number.isFinite(inicio) && Number.isFinite(fim)
      ? Math.max(0, Math.round((fim - inicio) / 60000))
      : null;
    if (duracaoMinutos != null && duracaoMinutos < 2) {
      alertas.push({
        tipo: 'conclusao_rapida',
        severidade: 'media',
        mensagem: `Avaliação concluída em ${duracaoMinutos} minuto(s).`
      });
    }
  }

  return {
    status: alertas.length > 0 || alertasRespostas.length > 0 ? 'atencao' : 'ok',
    alertas,
    alertasRespostas: alertasRespostas.slice(0, 12)
  };
}

function calcularResumoAcompanhamento(linhas) {
  const total = linhas.length;
  const finalizadas = linhas.filter((row) => row.statusFormulario === 'finalizada').length;
  const emAndamento = linhas.filter((row) => row.statusFormulario === 'em_andamento').length;
  const prontasParaFinalizar = linhas.filter((row) => row.statusFormulario === 'pronto_finalizar').length;
  const naoIniciadas = linhas.filter((row) => row.statusFormulario === 'nao_iniciada').length;
  const convitePendente = linhas.filter((row) => row.statusFormulario === 'convite_pendente').length;
  const pendentesLembrete = linhas.filter((row) => row.podeLembrar).length;
  const linksEnviados = linhas.filter((row) => row.conviteLink).length;
  const linksAbertos = linhas.filter((row) => row.abriuConvite).length;
  const avaliacoesIniciadas = linhas.filter((row) => row.iniciouAvaliacao).length;
  const progressoMedio =
    total > 0
      ? Math.round(linhas.reduce((acc, row) => acc + Number(row.percentual || 0), 0) / total)
      : 0;

  return {
    total,
    finalizadas,
    emAndamento,
    prontasParaFinalizar,
    naoIniciadas,
    convitePendente,
    pendentesLembrete,
    linksEnviados,
    linksAbertos,
    avaliacoesIniciadas,
    progressoMedio,
    taxaConclusao: total > 0 ? Math.round((finalizadas / total) * 100) : 0
  };
}

function gerarPlanoAcaoPorDimensao(scoresPorArea) {
  return (scoresPorArea || [])
    .filter((area) => Number(area.score) > 0 && Number(area.score) < 3.5)
    .sort((a, b) => Number(a.score) - Number(b.score))
    .slice(0, 6)
    .map((area) => {
      const score = Number(area.score) || 0;
      const criticidade = score < 2 ? 'critica' : score < 3 ? 'alta' : 'media';
      const responsavelSugerido = area.area?.toLowerCase().includes('governança')
        ? 'Sponsor executivo + Segurança/Compliance'
        : area.area?.toLowerCase().includes('dados') || area.area?.toLowerCase().includes('tecnologia')
          ? 'CTO / Head de Dados'
          : area.area?.toLowerCase().includes('pessoas') || area.area?.toLowerCase().includes('cultura')
            ? 'RH + Lideranças de negócio'
            : 'Sponsor executivo + dono da dimensão';

      return {
        areaId: area.areaId,
        area: area.area,
        score: area.score,
        nivel: area.nivel,
        criticidade,
        responsavelSugerido,
        acoes30Dias: [
          `Validar diagnóstico da dimensão "${area.area}" com os responsáveis.`,
          'Definir dono, métrica de sucesso e evidências esperadas.',
          'Priorizar 2 ações rápidas que reduzam risco ou desbloqueiem valor.'
        ],
        acoes90Dias: [
          'Executar piloto controlado com acompanhamento quinzenal.',
          'Formalizar processo, política ou ritual de governança necessário.',
          'Medir avanço e preparar nova rodada de avaliação da dimensão.'
        ]
      };
    });
}

function gerarResumoComentariosAvaliacoes(avaliacoes) {
  const porArea = new Map();
  for (const avaliacao of avaliacoes || []) {
    for (const resposta of avaliacao.respostas || []) {
      const texto = String(resposta.observacoes || '').trim();
      if (!texto) continue;
      const area = resposta.pergunta?.area?.nome || 'Outras';
      if (!porArea.has(area)) porArea.set(area, []);
      porArea.get(area).push(texto);
    }
  }

  const palavrasChave = [
    ['dados', 'dados'],
    ['governança', 'governanca'],
    ['processo', 'processos'],
    ['cultura', 'cultura'],
    ['treinamento', 'capacitacao'],
    ['segurança', 'seguranca'],
    ['roi', 'valor'],
    ['integração', 'integracao'],
    ['legado', 'legado']
  ];

  const areas = [...porArea.entries()].map(([area, comentarios]) => {
    const textoCompleto = comentarios.join(' ').toLowerCase();
    const temas = palavrasChave
      .filter(([label, normalizado]) => textoCompleto.includes(label) || textoCompleto.includes(normalizado))
      .map(([label]) => label);
    return {
      area,
      totalComentarios: comentarios.length,
      temas: temas.slice(0, 5),
      exemplos: comentarios.slice(0, 3)
    };
  });

  return {
    totalComentarios: areas.reduce((acc, item) => acc + item.totalComentarios, 0),
    areas: areas.sort((a, b) => b.totalComentarios - a.totalComentarios).slice(0, 6)
  };
}

function calcularScoresPorAreaDaAvaliacao(avaliacao, areas) {
  const todasAreaIds = (areas || []).map((area) => area.id);
  return (areas || [])
    .filter((area) => areaContaParaAvaliacao(avaliacao, area.id, todasAreaIds))
    .map((area) => {
      const respostasArea = (avaliacao.respostas || []).filter(
        (r) => r.pergunta?.areaId === area.id && r.pontuacao !== null
      );
      const score = respostasArea.length > 0
        ? respostasArea.reduce((acc, r) => acc + Number(r.pontuacao || 0), 0) / respostasArea.length
        : 0;
      return {
        areaId: area.id,
        area: area.nome,
        score: parseFloat(score.toFixed(2)),
        totalRespostas: respostasArea.length
      };
    })
    .filter((area) => area.totalRespostas > 0);
}

function gerarComparativoAvaliacoesProjeto(avaliacoes, areas = []) {
  const ordenadas = [...(avaliacoes || [])].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
  if (ordenadas.length < 2) {
    return { disponivel: false, mensagem: 'É necessário ter ao menos duas avaliações finalizadas no projeto.' };
  }

  const primeira = ordenadas[0];
  const ultima = ordenadas[ordenadas.length - 1];
  const delta = Number(ultima.scoreGeral || 0) - Number(primeira.scoreGeral || 0);
  const scoresPrimeira = calcularScoresPorAreaDaAvaliacao(primeira, areas);
  const scoresUltima = calcularScoresPorAreaDaAvaliacao(ultima, areas);
  const scorePrimeiraPorArea = new Map(scoresPrimeira.map((item) => [item.areaId, item]));
  const dimensoes = scoresUltima
    .map((atual) => {
      const anterior = scorePrimeiraPorArea.get(atual.areaId);
      if (!anterior) return null;
      const deltaArea = Number(atual.score || 0) - Number(anterior.score || 0);
      return {
        areaId: atual.areaId,
        area: atual.area,
        scoreInicial: anterior.score,
        scoreFinal: atual.score,
        delta: parseFloat(deltaArea.toFixed(2)),
        tendencia: deltaArea > 0.15 ? 'evoluiu' : deltaArea < -0.15 ? 'regrediu' : 'estavel'
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.delta - b.delta);

  return {
    disponivel: true,
    primeira: {
      avaliacaoId: primeira.id,
      avaliador: primeira.usuario?.nome,
      data: primeira.updatedAt,
      score: primeira.scoreGeral
    },
    ultima: {
      avaliacaoId: ultima.id,
      avaliador: ultima.usuario?.nome,
      data: ultima.updatedAt,
      score: ultima.scoreGeral
    },
    delta: parseFloat(delta.toFixed(2)),
    tendencia: delta > 0.15 ? 'evoluiu' : delta < -0.15 ? 'regrediu' : 'estavel',
    historico: ordenadas.map((a) => ({
      avaliacaoId: a.id,
      avaliador: a.usuario?.nome,
      data: a.updatedAt,
      score: a.scoreGeral,
      nivel: a.nivelGeral,
      scoresPorArea: calcularScoresPorAreaDaAvaliacao(a, areas)
    })),
    dimensoes
  };
}

function extrairPrazoAvaliacaoProjeto(projeto) {
  const texto = String(projeto?.descricao || '');
  const match = texto.match(/(?:prazo|data limite)\s*[:=]\s*(\d{4}-\d{2}-\d{2})/i);
  const dataLimite = match ? match[1] : null;
  const base = dataLimite ? new Date(`${dataLimite}T23:59:59`) : null;
  const hoje = new Date();
  const diasRestantes = base ? Math.ceil((base.getTime() - hoje.getTime()) / 86400000) : null;
  const criadoEm = projeto?.createdAt ? new Date(projeto.createdAt) : null;
  const prazoSugerido = criadoEm && !Number.isNaN(criadoEm.getTime())
    ? new Date(criadoEm.getTime() + 14 * 86400000).toISOString().slice(0, 10)
    : null;

  return {
    dataLimite,
    diasRestantes,
    status: dataLimite == null
      ? 'sem_prazo'
      : diasRestantes < 0
        ? 'atrasado'
        : diasRestantes <= 2
          ? 'vence_em_breve'
          : 'no_prazo',
    prazoSugerido,
    instrucoes: 'Para definir prazo sem migração de banco, inclua na descrição do projeto: prazo: AAAA-MM-DD.'
  };
}

/** Atualiza RelatorioIAJob durante geração do book (acompanhamento em background). */
async function atualizarProgressoJobBook(jobId, data) {
  if (!jobId) return;
  try {
    await prisma.relatorioIAJob.update({
      where: { id: jobId },
      data
    });
  } catch (err) {
    console.warn('[Book IA] atualizarProgressoJobBook:', err.message);
  }
}

async function resolverArquiteturaReferenciaProduto(arquiteturaReferenciaId, empresaIdProjeto) {
  if (arquiteturaReferenciaId === undefined || arquiteturaReferenciaId === null || arquiteturaReferenciaId === '') {
    return { ok: true, id: null };
  }
  const id =
    typeof arquiteturaReferenciaId === 'number'
      ? arquiteturaReferenciaId
      : parseInt(String(arquiteturaReferenciaId), 10);
  if (Number.isNaN(id) || id <= 0) {
    return { ok: false, error: 'arquiteturaReferenciaId inválido' };
  }
  const arq = await prisma.arquiteturaReferencia.findUnique({ where: { id } });
  if (!arq) return { ok: false, error: 'Arquitetura de referência não encontrada' };
  if (!arq.ativo) return { ok: false, error: 'Arquitetura de referência inativa' };
  if (Number(arq.empresaId) !== Number(empresaIdProjeto)) {
    return { ok: false, error: 'A arquitetura deve pertencer à mesma empresa do projeto.' };
  }
  return { ok: true, id };
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(globalSanitizer);

// Rotas de autenticação (públicas)
app.use('/api/auth', authRoutes);

// Rotas de especificação (protegidas - registradas após middleware de auth)
// Serão montadas após o middleware de autenticação abaixo

// Rota de health check (pública)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota temporária para aplicar migrações pendentes via SQL raw
app.post('/api/migrate-schema', async (req, res) => {
  try {
    const { setupToken } = req.body;
    
    if (setupToken !== 'BLUEPRINT_SETUP_2024_SYSMAP') {
      return res.status(403).json({ error: 'Token de setup inválido' });
    }
    
    const results = [];
    
    // Adicionar campos faltantes com tratamento de erro individual
    const alterations = [
      'ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "website" TEXT',
      'ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "logoPath" TEXT',
      'ALTER TABLE "Projeto" ADD COLUMN IF NOT EXISTS "audienciaPrimaria" TEXT',
      'ALTER TABLE "Projeto" ADD COLUMN IF NOT EXISTS "lentesPrioritarias" TEXT',
      'ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "scoreBlueprint" DOUBLE PRECISION',
      'ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "scorePrioridadeEstrategica" DOUBLE PRECISION',
      'ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "custoHoraHomem" DOUBLE PRECISION DEFAULT 150',
      'ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "produtividadeTradicional" DOUBLE PRECISION DEFAULT 40',
      'ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "produtividadeAgentica" DOUBLE PRECISION DEFAULT 120',
      'ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "idealizacaoProduto" JSONB',
      'ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "modeloCriacao" TEXT DEFAULT \'convencional\'',
      'ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "storyPointsTotais" INTEGER',
      'ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "horasTradicional" DOUBLE PRECISION',
      'ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "custoTradicional" DOUBLE PRECISION',
      'ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "prazoTradicional" INTEGER',
      'ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "equipeTradicional" INTEGER',
      'ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "produtividadeTradicional" DOUBLE PRECISION',
      'ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "horasAgentica" DOUBLE PRECISION',
      'ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "custoAgentica" DOUBLE PRECISION',
      'ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "prazoAgentica" INTEGER',
      'ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "equipeAgentica" INTEGER',
      'ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "produtividadeAgentica" DOUBLE PRECISION',
      'ALTER TABLE "DocumentoEspecificacao" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT \'pendente\'',
      `CREATE TABLE IF NOT EXISTS "LogLembreteAvaliacao" (
        "id" SERIAL NOT NULL,
        "escopoTipo" TEXT NOT NULL,
        "projetoId" INTEGER,
        "produtoId" INTEGER,
        "destinatarioUsuarioId" INTEGER NOT NULL,
        "destinatarioEmail" TEXT NOT NULL,
        "destinatarioNome" TEXT NOT NULL,
        "enviadoPorUsuarioId" INTEGER,
        "modo" TEXT NOT NULL,
        "sucesso" BOOLEAN NOT NULL,
        "erro" TEXT,
        "emailSimulado" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LogLembreteAvaliacao_pkey" PRIMARY KEY ("id")
      )`,
      'CREATE INDEX IF NOT EXISTS "LogLembreteAvaliacao_projetoId_createdAt_idx" ON "LogLembreteAvaliacao"("projetoId", "createdAt")',
      'CREATE INDEX IF NOT EXISTS "LogLembreteAvaliacao_produtoId_createdAt_idx" ON "LogLembreteAvaliacao"("produtoId", "createdAt")',
      'ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "nivelPrioridadeMapeamentoMaturidade" INTEGER NOT NULL DEFAULT 1',
      'UPDATE "Usuario" SET "nivelPrioridadeMapeamentoMaturidade" = 1 WHERE "nivelPrioridadeMapeamentoMaturidade" IS DISTINCT FROM 1',
      'ALTER TABLE "Usuario" ALTER COLUMN "nivelPrioridadeMapeamentoMaturidade" SET DEFAULT 1',
      `CREATE TABLE IF NOT EXISTS "AvaliacaoDesejosIA" (
        "id" SERIAL NOT NULL,
        "avaliacaoId" INTEGER NOT NULL,
        "payload" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AvaliacaoDesejosIA_pkey" PRIMARY KEY ("id")
      )`,
      'CREATE UNIQUE INDEX IF NOT EXISTS "AvaliacaoDesejosIA_avaliacaoId_key" ON "AvaliacaoDesejosIA"("avaliacaoId")',
      'ALTER TABLE "AvaliacaoDesejosIA" ADD CONSTRAINT "AvaliacaoDesejosIA_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE'
    ];
    
    for (const sql of alterations) {
      try {
        await prisma.$executeRawUnsafe(sql);
        results.push({ sql: sql.substring(0, 60) + '...', status: 'ok' });
      } catch (err) {
        results.push({ sql: sql.substring(0, 60) + '...', status: 'skip', error: err.message });
      }
    }
    
    res.json({ success: true, message: 'Migrações aplicadas', results });
  } catch (error) {
    console.error('Erro no migrate-schema:', error);
    res.status(500).json({ error: 'Erro ao aplicar migrações', details: error.message });
  }
});

// Rota temporária para importar dados de outro ambiente
app.post('/api/import-data', async (req, res) => {
  try {
    const { setupToken, data } = req.body;
    
    if (setupToken !== 'BLUEPRINT_SETUP_2024_SYSMAP') {
      return res.status(403).json({ error: 'Token de setup inválido' });
    }
    
    const results = { imported: {}, errors: [] };
    
    // Desabilita constraints temporariamente
    await prisma.$executeRawUnsafe('SET session_replication_role = replica');
    
    try {
      // Importa na ordem correta (respeitando FKs)
      
      // 1. Areas
      if (data.areas?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "Area" CASCADE');
        for (const item of data.areas) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "Area" (id, nome, descricao, ordem, peso)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET nome=$2, descricao=$3, ordem=$4, peso=$5
          `, item.id, item.nome, item.descricao, item.ordem, item.peso);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Area"', 'id'), (SELECT MAX(id) FROM "Area"))`);
        results.imported.areas = data.areas.length;
      }
      
      // 2. Perguntas
      if (data.perguntas?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "Pergunta" CASCADE');
        for (const item of data.perguntas) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "Pergunta" (id, numero, texto, criterios, "areaId")
            VALUES ($1, $2, $3, $4, $5)
          `, item.id, item.numero, item.texto, item.criterios, item.areaId);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Pergunta"', 'id'), (SELECT MAX(id) FROM "Pergunta"))`);
        results.imported.perguntas = data.perguntas.length;
      }
      
      // 3. VerticalProduto
      if (data.verticais?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "VerticalProduto" CASCADE');
        for (const item of data.verticais) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "VerticalProduto" (id, nome, descricao, foco, icone, ordem)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, item.id, item.nome, item.descricao, item.foco, item.icone, item.ordem);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"VerticalProduto"', 'id'), (SELECT MAX(id) FROM "VerticalProduto"))`);
        results.imported.verticais = data.verticais.length;
      }
      
      // 4. PerguntaProduto
      if (data.perguntasProduto?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "PerguntaProduto" CASCADE');
        for (const item of data.perguntasProduto) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "PerguntaProduto" (id, numero, categoria, texto, "verticalId")
            VALUES ($1, $2, $3, $4, $5)
          `, item.id, item.numero, item.categoria, item.texto, item.verticalId);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"PerguntaProduto"', 'id'), (SELECT MAX(id) FROM "PerguntaProduto"))`);
        results.imported.perguntasProduto = data.perguntasProduto.length;
      }
      
      // 5. PerguntaObrigatoriaProduto
      if (data.perguntasObrigatorias?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "PerguntaObrigatoriaProduto" CASCADE');
        for (const item of data.perguntasObrigatorias) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "PerguntaObrigatoriaProduto" (id, numero, categoria, texto, criterios, peso, ordem)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, item.id, item.numero, item.categoria, item.texto, item.criterios, item.peso, item.ordem);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"PerguntaObrigatoriaProduto"', 'id'), (SELECT MAX(id) FROM "PerguntaObrigatoriaProduto"))`);
        results.imported.perguntasObrigatorias = data.perguntasObrigatorias.length;
      }
      
      // 6. Empresas
      if (data.empresas?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "Empresa" CASCADE');
        for (const item of data.empresas) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "Empresa" (id, nome, cnpj, setor, porte, telefone, email, endereco, website, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamp, $11::timestamp)
          `, item.id, item.nome, item.cnpj, item.setor, item.porte, item.telefone, item.email, item.endereco, item.website, item.createdAt, item.updatedAt);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Empresa"', 'id'), (SELECT MAX(id) FROM "Empresa"))`);
        results.imported.empresas = data.empresas.length;
      }
      
      // 7. Usuarios
      if (data.usuarios?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "Usuario" CASCADE');
        for (const item of data.usuarios) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "Usuario" (id, nome, email, senha, cargo, telefone, role, "empresaId", ativo, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamp, $11::timestamp)
          `, item.id, item.nome, item.email, item.senha, item.cargo, item.telefone, item.role, item.empresaId, item.ativo, item.createdAt, item.updatedAt);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Usuario"', 'id'), (SELECT MAX(id) FROM "Usuario"))`);
        results.imported.usuarios = data.usuarios.length;
      }
      
      // 8. Projetos
      if (data.projetos?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "Projeto" CASCADE');
        for (const item of data.projetos) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "Projeto" (id, nome, descricao, vertical, status, "empresaId", "createdAt", "updatedAt", "audienciaPrimaria", "lentesPrioritarias")
            VALUES ($1, $2, $3, $4, $5, $6, $7::timestamp, $8::timestamp, $9, $10)
          `, item.id, item.nome, item.descricao, item.vertical, item.status, item.empresaId, item.createdAt, item.updatedAt, item.audienciaPrimaria, item.lentesPrioritarias);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Projeto"', 'id'), (SELECT MAX(id) FROM "Projeto"))`);
        results.imported.projetos = data.projetos.length;
      }
      
      // 9. Produtos
      if (data.produtos?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "Produto" CASCADE');
        for (const item of data.produtos) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "Produto" (id, nome, descricao, status, "projetoId", "verticalId", "scoreRelevancia", "scoreObrigatorio", 
              "scoreBlueprint", "scorePrioridadeEstrategica", classificacao, "problemaResolve", "publicoAlvo", tecnologias, 
              "faseAtual", complexidade, "diferencialCompetitivo", "principaisRiscos", "dependenciasExternas",
              "metricaPrincipal", "baselineAtual", "metaEsperada", "custoHoraHomem", "produtividadeTradicional", "produtividadeAgentica",
              "custoEstimado", "retornoAnualEsperado", "statusConstrucao", "observacoesCronograma", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30::timestamp, $31::timestamp)
          `, item.id, item.nome, item.descricao, item.status, item.projetoId, item.verticalId, item.scoreRelevancia, item.scoreObrigatorio,
             item.scoreBlueprint, item.scorePrioridadeEstrategica, item.classificacao, item.problemaResolve, item.publicoAlvo, item.tecnologias,
             item.faseAtual, item.complexidade, item.diferencialCompetitivo, item.principaisRiscos, item.dependenciasExternas,
             item.metricaPrincipal, item.baselineAtual, item.metaEsperada, item.custoHoraHomem, item.produtividadeTradicional, item.produtividadeAgentica,
             item.custoEstimado, item.retornoAnualEsperado, item.statusConstrucao, item.observacoesCronograma, item.createdAt, item.updatedAt);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Produto"', 'id'), (SELECT MAX(id) FROM "Produto"))`);
        results.imported.produtos = data.produtos.length;
      }
      
      // 10. Avaliacoes
      if (data.avaliacoes?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "Avaliacao" CASCADE');
        for (const item of data.avaliacoes) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "Avaliacao" (id, "projetoId", "usuarioId", status, "scoreGeral", "nivelGeral", "areasSelecionadas", "areasRecusadas", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamp, $10::timestamp)
          `, item.id, item.projetoId, item.usuarioId, item.status, item.scoreGeral, item.nivelGeral, item.areasSelecionadas, item.areasRecusadas ?? null, item.createdAt, item.updatedAt);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Avaliacao"', 'id'), (SELECT MAX(id) FROM "Avaliacao"))`);
        results.imported.avaliacoes = data.avaliacoes.length;
      }
      
      // 11. Respostas
      if (data.respostas?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "Resposta" CASCADE');
        for (const item of data.respostas) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "Resposta" (id, "avaliacaoId", "perguntaId", pontuacao, observacoes, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6::timestamp, $7::timestamp)
          `, item.id, item.avaliacaoId, item.perguntaId, item.pontuacao, item.observacoes, item.createdAt, item.updatedAt);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Resposta"', 'id'), (SELECT MAX(id) FROM "Resposta"))`);
        results.imported.respostas = data.respostas.length;
      }
      
      // 12. DimensaoDiagnostico
      if (data.dimensoesDiagnostico?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "DimensaoDiagnostico" CASCADE');
        for (const item of data.dimensoesDiagnostico) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "DimensaoDiagnostico" (id, nome, descricao, icone, ordem, peso)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, item.id, item.nome, item.descricao, item.icone, item.ordem, item.peso);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"DimensaoDiagnostico"', 'id'), (SELECT MAX(id) FROM "DimensaoDiagnostico"))`);
        results.imported.dimensoesDiagnostico = data.dimensoesDiagnostico.length;
      }
      
      // 13. PerguntaDiagnostico
      if (data.perguntasDiagnostico?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "PerguntaDiagnostico" CASCADE');
        for (const item of data.perguntasDiagnostico) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "PerguntaDiagnostico" (id, numero, texto, criterios, "dimensaoId", ordem)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, item.id, item.numero, item.texto, item.criterios, item.dimensaoId, item.ordem);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"PerguntaDiagnostico"', 'id'), (SELECT MAX(id) FROM "PerguntaDiagnostico"))`);
        results.imported.perguntasDiagnostico = data.perguntasDiagnostico.length;
      }
      
      // 14. AvaliacaoProduto
      if (data.avaliacoesProduto?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "AvaliacaoProduto" CASCADE');
        for (const item of data.avaliacoesProduto) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "AvaliacaoProduto" (id, "produtoId", "usuarioId", "verticaisSelecionadas", status, 
              "scoreObrigatorio", "scoreVerticais", "scoreRelevancia", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamp, $10::timestamp)
          `, item.id, item.produtoId, item.usuarioId, item.verticaisSelecionadas, item.status,
             item.scoreObrigatorio, item.scoreVerticais, item.scoreRelevancia, item.createdAt, item.updatedAt);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"AvaliacaoProduto"', 'id'), (SELECT MAX(id) FROM "AvaliacaoProduto"))`);
        results.imported.avaliacoesProduto = data.avaliacoesProduto.length;
      }
      
      // 15. RespostaProduto
      if (data.respostasProduto?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "RespostaProduto" CASCADE');
        for (const item of data.respostasProduto) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "RespostaProduto" (id, "avaliacaoProdutoId", "perguntaProdutoId", pontuacao, observacoes, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6::timestamp, $7::timestamp)
          `, item.id, item.avaliacaoProdutoId, item.perguntaProdutoId, item.pontuacao, item.observacoes, item.createdAt, item.updatedAt);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"RespostaProduto"', 'id'), (SELECT MAX(id) FROM "RespostaProduto"))`);
        results.imported.respostasProduto = data.respostasProduto.length;
      }
      
      // 16. RespostaObrigatoriaProduto
      if (data.respostasObrigatorias?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "RespostaObrigatoriaProduto" CASCADE');
        for (const item of data.respostasObrigatorias) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "RespostaObrigatoriaProduto" (id, "avaliacaoProdutoId", "perguntaObrigatoriaId", pontuacao, observacoes, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6::timestamp, $7::timestamp)
          `, item.id, item.avaliacaoProdutoId, item.perguntaObrigatoriaId, item.pontuacao, item.observacoes, item.createdAt, item.updatedAt);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"RespostaObrigatoriaProduto"', 'id'), (SELECT MAX(id) FROM "RespostaObrigatoriaProduto"))`);
        results.imported.respostasObrigatorias = data.respostasObrigatorias.length;
      }
      
      // 17. ConviteAvaliacao
      if (data.convitesAvaliacao?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "ConviteAvaliacao" CASCADE');
        for (const item of data.convitesAvaliacao) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "ConviteAvaliacao" (id, token, "avaliadorId", tipo, "projetoId", "produtoId", 
              "areasSelecionadas", "enviadoPor", status, "dataExpiracao", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamp, $11::timestamp, $12::timestamp)
          `, item.id, item.token, item.avaliadorId, item.tipo, item.projetoId, item.produtoId,
             item.areasSelecionadas, item.enviadoPor, item.status, item.dataExpiracao, item.createdAt, item.updatedAt);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"ConviteAvaliacao"', 'id'), (SELECT MAX(id) FROM "ConviteAvaliacao"))`);
        results.imported.convitesAvaliacao = data.convitesAvaliacao.length;
      }
      
      // 18. EspecificacaoProduto
      if (data.especificacoesProduto?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "EspecificacaoProduto" CASCADE');
        for (const item of data.especificacoesProduto) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "EspecificacaoProduto" (id, "produtoId", versao, status, "modeloIA", "tokensUsados", 
              "tempoGeracao", "custoEstimadoIA", "storyPointsTotais", "horasTradicional", "custoTradicional", 
              "prazoTradicional", "equipeTradicional", "produtividadeTradicional", "horasAgentica", "custoAgentica", 
              "prazoAgentica", "equipeAgentica", "produtividadeAgentica", "resumoExecutivo", "geradoPorId", 
              "aprovadoPorId", "dataAprovacao", observacoes, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23::timestamp, $24, $25::timestamp, $26::timestamp)
          `, item.id, item.produtoId, item.versao, item.status, item.modeloIA, item.tokensUsados,
             item.tempoGeracao, item.custoEstimadoIA, item.storyPointsTotais, item.horasTradicional, item.custoTradicional,
             item.prazoTradicional, item.equipeTradicional, item.produtividadeTradicional, item.horasAgentica, item.custoAgentica,
             item.prazoAgentica, item.equipeAgentica, item.produtividadeAgentica, item.resumoExecutivo, item.geradoPorId,
             item.aprovadoPorId, item.dataAprovacao, item.observacoes, item.createdAt, item.updatedAt);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"EspecificacaoProduto"', 'id'), (SELECT MAX(id) FROM "EspecificacaoProduto"))`);
        results.imported.especificacoesProduto = data.especificacoesProduto.length;
      }
      
      // 19. DocumentoEspecificacao
      if (data.documentosEspecificacao?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "DocumentoEspecificacao" CASCADE');
        for (const item of data.documentosEspecificacao) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "DocumentoEspecificacao" (id, "especificacaoId", tipo, titulo, conteudo, ordem, status, 
              "versaoDocumento", "editadoManualmente", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamp, $11::timestamp)
          `, item.id, item.especificacaoId, item.tipo, item.titulo, item.conteudo, item.ordem, item.status,
             item.versaoDocumento, item.editadoManualmente, item.createdAt, item.updatedAt);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"DocumentoEspecificacao"', 'id'), (SELECT MAX(id) FROM "DocumentoEspecificacao"))`);
        results.imported.documentosEspecificacao = data.documentosEspecificacao.length;
      }
      
      // 20. ArquivoReferencia
      if (data.arquivosReferencia?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "ArquivoReferencia" CASCADE');
        for (const item of data.arquivosReferencia) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "ArquivoReferencia" (id, "produtoId", "nomeOriginal", "nomeArmazenado", "mimeType", 
              tamanho, categoria, "conteudoExtraido", descricao, ativo, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::timestamp, $12::timestamp)
          `, item.id, item.produtoId, item.nomeOriginal, item.nomeArmazenado, item.mimeType,
             item.tamanho, item.categoria, item.conteudoExtraido, item.descricao, item.ativo, item.createdAt, item.updatedAt);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"ArquivoReferencia"', 'id'), (SELECT MAX(id) FROM "ArquivoReferencia"))`);
        results.imported.arquivosReferencia = data.arquivosReferencia.length;
      }
      
      // 21. ConfiguracaoCusto
      if (data.configuracoesCusto?.length > 0) {
        await prisma.$executeRawUnsafe('TRUNCATE TABLE "ConfiguracaoCusto" CASCADE');
        for (const item of data.configuracoesCusto) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "ConfiguracaoCusto" (id, perfil, descricao, "custoHora", ativo, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6::timestamp, $7::timestamp)
          `, item.id, item.perfil, item.descricao, item.custoHora, item.ativo, item.createdAt, item.updatedAt);
        }
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"ConfiguracaoCusto"', 'id'), (SELECT MAX(id) FROM "ConfiguracaoCusto"))`);
        results.imported.configuracoesCusto = data.configuracoesCusto.length;
      }
      
    } finally {
      // Reabilita constraints
      await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT');
    }
    
    res.json({ success: true, message: 'Dados importados com sucesso', results });
  } catch (error) {
    console.error('Erro no import-data:', error);
    res.status(500).json({ error: 'Erro ao importar dados', details: error.message });
  }
});

// Rota temporária de setup para criar/resetar usuário admin (REMOVER APÓS USO)
app.post('/api/setup-admin', async (req, res) => {
  try {
    const { setupToken } = req.body;
    
    // Token de segurança para evitar uso não autorizado
    if (setupToken !== 'BLUEPRINT_SETUP_2024_SYSMAP') {
      return res.status(403).json({ error: 'Token de setup inválido' });
    }
    
    // Verificar/criar empresa SysMap usando raw query para evitar erro de coluna
    let empresa;
    const empresas = await prisma.$queryRaw`SELECT id, nome FROM "Empresa" WHERE nome = 'SysMap Solutions' LIMIT 1`;
    
    if (empresas.length === 0) {
      empresa = await prisma.$queryRaw`
        INSERT INTO "Empresa" (nome, setor, porte, email, "createdAt", "updatedAt") 
        VALUES ('SysMap Solutions', 'Tecnologia', 'Grande', 'contato@sysmap.com.br', NOW(), NOW())
        RETURNING id, nome
      `;
      empresa = empresa[0];
    } else {
      empresa = empresas[0];
    }
    
    // Hash da senha
    const senhaHash = await bcrypt.hash('admin123', 10);
    
    // Verificar se admin existe
    const adminExists = await prisma.$queryRaw`SELECT id FROM "Usuario" WHERE email = 'admin@sysmap.com.br' LIMIT 1`;
    
    if (adminExists.length > 0) {
      // Atualizar admin existente
      await prisma.$queryRaw`
        UPDATE "Usuario" 
        SET senha = ${senhaHash}, role = 'admin', ativo = true, "updatedAt" = NOW()
        WHERE email = 'admin@sysmap.com.br'
      `;
    } else {
      // Criar novo admin
      await prisma.$queryRaw`
        INSERT INTO "Usuario" (nome, email, senha, cargo, role, "empresaId", ativo, "createdAt", "updatedAt")
        VALUES ('Administrador', 'admin@sysmap.com.br', ${senhaHash}, 'Administrador do Sistema', 'admin', ${empresa.id}, true, NOW(), NOW())
      `;
    }
    
    res.json({ 
      success: true, 
      message: 'Admin configurado com sucesso',
      email: 'admin@sysmap.com.br',
      info: 'Senha: admin123 - ALTERE APÓS O PRIMEIRO LOGIN!'
    });
  } catch (error) {
    console.error('Erro no setup-admin:', error);
    res.status(500).json({ error: 'Erro ao configurar admin', details: error.message });
  }
});

// Middleware de autenticação para todas as rotas /api/* exceto rotas públicas
app.use('/api', (req, res, next) => {
  const publicPaths = ['/auth', '/health', '/setup-admin', '/migrate-schema', '/import-data', '/convite-avaliacao/validar', '/convite-avaliacao/acesso', '/diagnostico'];
  if (publicPaths.some(path => req.path.startsWith(path)) || req.path === '/health' || req.path === '/setup-admin') {
    return next();
  }
  return authMiddleware(req, res, next);
});

// Rotas de diagnóstico rápido (públicas - para demonstração)
app.use('/api/diagnostico', diagnosticoRoutes);

// Rotas de especificação automática (IA)
app.use('/api/especificacoes', especificacaoRoutes);

// Rotas de arquivos de referência
app.use('/api/arquivos', arquivosRoutes);
app.use('/api/arquiteturas-referencia', arquiteturasReferenciaRoutes);

// Rotas de exportação de documentos (Markdown)
app.use('/api/exportar', exportacaoRoutes);

// Logo da empresa (GET/POST/DELETE /api/empresas/:id/logo)
app.use('/api/empresas', empresaLogoRoutes);

// Módulo regulatório — crosswalk dimensões × ISO 42001 / PL 2338 / LGPD (Semana 1)
app.use('/api/regulatorio', regulatorioRoutes);

// Rotas de relatórios IA persistidos (versionamento + biblioteca)
app.use('/api/relatorios-ia', relatoriosIARoutes);
app.use('/api/relatorios-ia-jobs', relatoriosIAJobsRoutes);

// ==================== EMPRESAS ====================

app.get('/api/empresas', async (req, res) => {
  try {
    const empresas = await prisma.empresa.findMany({
      include: {
        _count: {
          select: { usuarios: true, projetos: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(await enriquecerEmpresasComLogo(empresas));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/empresas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const empresa = await prisma.empresa.findUnique({
      where: { id },
      include: {
        usuarios: true,
        projetos: {
          include: {
            _count: { select: { avaliacoes: true } }
          }
        }
      }
    });
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    res.json(await enriquecerEmpresaComLogo(empresa));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/empresas', validate(empresaSchemas.criar), async (req, res) => {
  try {
    const empresa = await prisma.empresa.create({
      data: req.body
    });
    res.status(201).json(empresa);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/empresas/:id', validate(empresaSchemas.atualizar), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const empresa = await prisma.empresa.update({
      where: { id },
      data: req.body
    });
    res.json(empresa);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/empresas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    await removerArquivosLogoEmpresa(id);
    
    await prisma.empresa.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    res.status(400).json({ error: error.message });
  }
});

// ==================== USUÁRIOS ====================

const AVISO_NIVEL_PRIORIDADE_SEM_COLUNA_NO_BD =
  'O nível de prioridade (1–3) não foi gravado: a coluna "nivelPrioridadeMapeamentoMaturidade" ainda não existe na tabela Usuario no PostgreSQL. O administrador do banco deve executar backend/scripts/fix-usuario-nivel-prioridade.sql (como superusuário) ou aplicar as migrações Prisma e reiniciar o backend.';

app.get('/api/usuarios', async (req, res) => {
  try {
    const { empresaId } = req.query;
    let where = {};
    
    if (empresaId) {
      const id = parseInt(empresaId);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'empresaId inválido' });
      }
      where.empresaId = id;
    }
    
    const usuarios = await prisma.usuario.findMany({
      where,
      include: { empresa: true },
      orderBy: { createdAt: 'desc' }
    });
    const usuariosSemSenha = usuarios.map(({ senha, ...u }) => u);
    res.json(usuariosSemSenha);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: { empresa: true, avaliacoes: true }
    });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const { senha, ...usuarioSemSenha } = usuario;
    res.json(usuarioSemSenha);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/usuarios', validate(usuarioSchemas.criar), async (req, res) => {
  try {
    await refreshUsuarioNivelPrioridadeColumnFlag();
    const { nome, email, senha, cargo, telefone, empresaId, role, ativo, nivelPrioridadeMapeamentoMaturidade } =
      req.body;

    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }
    
    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) {
      return res.status(400).json({ error: 'Empresa não encontrada' });
    }
    
    let senhaCriptografada = null;
    if (senha) {
      senhaCriptografada = await bcrypt.hash(senha, 10);
    }
    
    const usuario = await usuarioCreateCompat({
      data: {
        nome,
        email,
        senha: senhaCriptografada,
        cargo,
        telefone,
        empresaId,
        role: role || 'avaliador',
        ativo: ativo !== false,
        nivelPrioridadeMapeamentoMaturidade: nivelPrioridadeMapeamentoMaturidade ?? 1
      },
      include: { empresa: true }
    });

    const { senha: _, ...usuarioSemSenha } = usuario;
    let avisoCompatibilidade = null;
    if (
      !isUsuarioNivelPrioridadeColumnPresentInDb() &&
      nivelPrioridadeMapeamentoMaturidade != null &&
      Number(nivelPrioridadeMapeamentoMaturidade) !== 1
    ) {
      avisoCompatibilidade = AVISO_NIVEL_PRIORIDADE_SEM_COLUNA_NO_BD;
    }
    res
      .status(201)
      .json(avisoCompatibilidade ? { ...usuarioSemSenha, avisoCompatibilidade } : usuarioSemSenha);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/usuarios/:id', validate(usuarioSchemas.atualizar), async (req, res) => {
  try {
    await refreshUsuarioNivelPrioridadeColumnFlag();
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const { senha, ...dadosAtualizar } = req.body;

    let avisoCompatibilidade = null;
    if (
      !isUsuarioNivelPrioridadeColumnPresentInDb() &&
      dadosAtualizar.nivelPrioridadeMapeamentoMaturidade !== undefined
    ) {
      avisoCompatibilidade = AVISO_NIVEL_PRIORIDADE_SEM_COLUNA_NO_BD;
      delete dadosAtualizar.nivelPrioridadeMapeamentoMaturidade;
    }

    if (dadosAtualizar.empresaId) {
      const empresa = await prisma.empresa.findUnique({ where: { id: dadosAtualizar.empresaId } });
      if (!empresa) {
        return res.status(400).json({ error: 'Empresa não encontrada' });
      }
    }
    
    const usuario = await prisma.usuario.update({
      where: { id },
      data: dadosAtualizar,
      include: { empresa: true }
    });
    
    const { senha: _, ...usuarioSemSenha } = usuario;
    res.json(
      avisoCompatibilidade ? { ...usuarioSemSenha, avisoCompatibilidade } : usuarioSemSenha
    );
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    await prisma.usuario.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(400).json({ error: error.message });
  }
});

// ==================== CONVITES DE AVALIAÇÃO ====================

app.get('/api/convites', async (req, res) => {
  try {
    const { avaliadorId, status } = req.query;
    let where = {};
    
    if (avaliadorId) {
      where.avaliadorId = parseInt(avaliadorId);
    }
    
    if (status) {
      where.status = status;
    }
    
    const convites = await prisma.conviteAvaliacao.findMany({
      where,
      include: {
        avaliador: { select: { id: true, nome: true, email: true } },
        projeto: { include: { empresa: true } },
        produto: { include: { projeto: { include: { empresa: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(convites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/convites/enviar', async (req, res) => {
  try {
    const { avaliadorId, tipo, projetoId, produtoId, areaIds, incluirMencaoDesejosIaNoConvite } = req.body;
    const enviadoPor = req.usuarioId;
    
    if (!avaliadorId || !tipo) {
      return res.status(400).json({ error: 'avaliadorId e tipo são obrigatórios' });
    }
    
    if (tipo === 'projeto' && !projetoId) {
      return res.status(400).json({ error: 'projetoId é obrigatório para avaliação de projeto' });
    }
    
    if (tipo === 'produto' && !produtoId) {
      return res.status(400).json({ error: 'produtoId é obrigatório para avaliação de produto' });
    }
    
    const avaliador = await prisma.usuario.findUnique({
      where: { id: parseInt(avaliadorId) },
      include: { empresa: true }
    });
    
    if (!avaliador) {
      return res.status(404).json({ error: 'Avaliador não encontrado' });
    }

    // Convites de maturidade usam magic link. Fluxos antigos ainda recebem
    // senha temporária quando o avaliador foi criado sem senha.
    let senhaTemporariaParaEmail = null;
    if (tipo !== 'projeto' && !avaliador.senha) {
      const SENHA_TEMP = 'SysMap';
      const hash = await bcrypt.hash(SENHA_TEMP, 10);
      await prisma.usuario.update({
        where: { id: avaliador.id },
        data: { senha: hash }
      });
      senhaTemporariaParaEmail = SENHA_TEMP;
    }

    const remetente = await prisma.usuario.findUnique({
      where: { id: enviadoPor }
    });
    
    let item, itemNome, empresaNome;
    
    if (tipo === 'projeto') {
      item = await prisma.projeto.findUnique({
        where: { id: parseInt(projetoId) },
        include: { empresa: true }
      });
      if (!item) {
        return res.status(404).json({ error: 'Projeto não encontrado' });
      }
      itemNome = item.nome;
      empresaNome = item.empresa.nome;
    } else {
      item = await prisma.produto.findUnique({
        where: { id: parseInt(produtoId) },
        include: { projeto: { include: { empresa: true } } }
      });
      if (!item) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      itemNome = item.nome;
      empresaNome = item.projeto.empresa.nome;
    }
    
    const token = gerarTokenConvite();
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + 30);
    
    let areaIdsArray = Array.isArray(areaIds)
      ? areaIds.map(id => parseInt(id, 10)).filter((id) => Number.isFinite(id) && id > 0)
      : [];
    const projetoVersao = tipo === 'projeto'
      ? await obterVersaoAbertaProjetoOuErro(parseInt(projetoId, 10))
      : null;
    if (tipo === 'projeto') {
      const areas = await prisma.area.findMany({ select: { id: true, nome: true } });
      const areaIdsValidas = new Set(areas.map((a) => a.id));
      areaIdsArray = areaIdsArray.filter((id) => areaIdsValidas.has(id));
      if (areaIdsArray.length === 0) {
        areaIdsArray = idsAreasSugeridasPorCargo(avaliador.cargo, areas);
      }
    }
    
    const convite = await prisma.conviteAvaliacao.create({
      data: {
        token,
        avaliadorId: parseInt(avaliadorId),
        tipo,
        projetoId: tipo === 'projeto' ? parseInt(projetoId) : null,
        produtoId: tipo === 'produto' ? parseInt(produtoId) : null,
        areasSelecionadas: areaIdsArray.length > 0 ? JSON.stringify(areaIdsArray) : null,
        enviadoPor,
        dataExpiracao
      },
      include: {
        avaliador: { select: { id: true, nome: true, email: true } },
        projeto: { include: { empresa: true } },
        produto: { include: { projeto: { include: { empresa: true } } } }
      }
    });
    if (projetoVersao) {
      await setProjetoVersaoEmConvite(convite.id, projetoVersao.id);
    }
    
    const resultadoEmail = await enviarEmailConviteAvaliacao({
      destinatarioEmail: avaliador.email,
      destinatarioNome: avaliador.nome,
      remetenteNome: remetente?.nome,
      empresaNome,
      tipo,
      itemNome,
      token,
      loginUsuario: avaliador.email,
      senhaTemporaria: senhaTemporariaParaEmail,
      incluirMencaoDesejosIaNoConvite:
        tipo === 'projeto' ? incluirMencaoDesejosIaNoConvite !== false : false
    });

    if (tipo === 'projeto') {
      await registrarEventoAvaliacao({
        tipo: 'convite_enviado',
        conviteId: convite.id,
        projetoId: convite.projetoId,
        usuarioId: convite.avaliadorId,
        metadata: { emailSimulado: resultadoEmail?.simulado === true },
        req
      });
    }
    
    res.status(201).json({
      convite,
      email: resultadoEmail
    });
  } catch (error) {
    console.error('Erro ao enviar convite:', error);
    res.status(error.statusCode || 400).json({ error: error.message });
  }
});

app.post('/api/projetos/:id/versoes/reenviar-convites', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id, 10);
    const usuarioIdFiltro = req.body?.usuarioId ? parseInt(req.body.usuarioId, 10) : null;
    if (!Number.isFinite(projetoId) || projetoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const projeto = await prisma.projeto.findUnique({
      where: { id: projetoId },
      include: { empresa: true }
    });
    if (!projeto) return res.status(404).json({ error: 'Projeto não encontrado' });
    if (!usuarioPodeGerenciarProjeto(req, projeto)) {
      return res.status(403).json({ error: 'Sem permissão para este projeto.' });
    }

    const versaoAberta = await obterVersaoAbertaProjetoOuErro(projetoId);
    const versaoBase = await obterVersaoAnteriorFechadaProjeto(projetoId, versaoAberta);
    if (!versaoBase) {
      return res.status(400).json({
        error: 'Não há versão fechada anterior para copiar os convites.'
      });
    }

    const convitesBase = await prisma.$queryRaw`
      SELECT DISTINCT ON (c."avaliadorId")
        c."id", c."avaliadorId", c."areasSelecionadas", c."createdAt"
      FROM "ConviteAvaliacao" c
      JOIN "ProjetoVersaoConvite" pvc ON pvc."conviteId" = c."id"
      WHERE c."projetoId" = ${projetoId}
        AND c."tipo" = 'projeto'
        AND pvc."projetoVersaoId" = ${versaoBase.id}
        ${usuarioIdFiltro ? Prisma.sql`AND c."avaliadorId" = ${usuarioIdFiltro}` : Prisma.empty}
      ORDER BY c."avaliadorId", c."createdAt" DESC
    `;

    if (convitesBase.length === 0) {
      return res.status(404).json({ error: 'Nenhum convite encontrado na versão anterior para reenviar.' });
    }

    const remetente = await prisma.usuario.findUnique({ where: { id: req.usuarioId } });
    const idsConvitesDestino = await idsConvitesDaVersao(projetoId, versaoAberta.id);
    const resultados = [];
    for (const conviteBase of convitesBase) {
      const avaliador = await prisma.usuario.findUnique({
        where: { id: Number(conviteBase.avaliadorId) },
        include: { empresa: true }
      });
      if (!avaliador || avaliador.ativo === false) {
        resultados.push({
          avaliadorId: Number(conviteBase.avaliadorId),
          sucesso: false,
          erro: 'Avaliador não encontrado ou inativo.'
        });
        continue;
      }

      let convite = idsConvitesDestino.size > 0
        ? await prisma.conviteAvaliacao.findFirst({
            where: {
              id: { in: [...idsConvitesDestino] },
              avaliadorId: avaliador.id,
              projetoId,
              tipo: 'projeto'
            },
            orderBy: { createdAt: 'desc' }
          })
        : null;
      const reutilizado = !!convite;
      if (!convite) {
        const token = gerarTokenConvite();
        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + 30);
        convite = await prisma.conviteAvaliacao.create({
          data: {
            token,
            avaliadorId: avaliador.id,
            tipo: 'projeto',
            projetoId,
            produtoId: null,
            areasSelecionadas: conviteBase.areasSelecionadas || null,
            enviadoPor: req.usuarioId,
            dataExpiracao
          }
        });
        await setProjetoVersaoEmConvite(convite.id, versaoAberta.id);
        idsConvitesDestino.add(Number(convite.id));
      }

      const resultadoEmail = await enviarEmailConviteAvaliacao({
        destinatarioEmail: avaliador.email,
        destinatarioNome: avaliador.nome,
        remetenteNome: remetente?.nome,
        empresaNome: projeto.empresa?.nome || '—',
        tipo: 'projeto',
        itemNome: projeto.nome,
        token: convite.token,
        loginUsuario: avaliador.email,
        senhaTemporaria: null,
        incluirMencaoDesejosIaNoConvite: true
      });

      await registrarEventoAvaliacao({
        tipo: 'convite_enviado',
        conviteId: convite.id,
        projetoId,
        usuarioId: avaliador.id,
        metadata: {
          origem: 'reenviar_versao',
          versaoBaseId: versaoBase.id,
          versaoDestinoId: versaoAberta.id,
          conviteReutilizado: reutilizado,
          emailSimulado: resultadoEmail?.simulado === true
        },
        req
      });

      resultados.push({
        avaliadorId: avaliador.id,
        avaliadorNome: avaliador.nome,
        conviteId: convite.id,
        sucesso: true,
        reutilizado,
        linkAvaliacao: resultadoEmail?.linkAvaliacao || `${getBaseUrlApp()}/avaliacao/acesso/${convite.token}`,
        email: resultadoEmail
      });
    }

    res.json({
      projeto: { id: projeto.id, nome: projeto.nome },
      versaoBase,
      versaoDestino: versaoAberta,
      total: resultados.length,
      sucesso: resultados.filter((r) => r.sucesso).length,
      falhas: resultados.filter((r) => !r.sucesso).length,
      resultados
    });
  } catch (error) {
    console.error('reenviar-convites-versao:', error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

app.get('/api/convite-avaliacao/validar/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const convite = await prisma.conviteAvaliacao.findUnique({
      where: { token },
      include: {
        avaliador: {
          include: { empresa: true }
        },
        projeto: { include: { empresa: true } },
        produto: { include: { projeto: { include: { empresa: true } } } }
      }
    });
    
    if (!convite) {
      return res.status(404).json({ error: 'Convite não encontrado', valido: false });
    }
    
    if (convite.status === 'expirado') {
      return res.status(400).json({ error: 'Convite expirado', valido: false });
    }
    
    if (new Date() > convite.dataExpiracao) {
      await prisma.conviteAvaliacao.update({
        where: { id: convite.id },
        data: { status: 'expirado' }
      });
      return res.status(400).json({ error: 'Convite expirado', valido: false });
    }
    
    const { senha, ...avaliadorSemSenha } = convite.avaliador;
    
    res.json({
      valido: true,
      convite: {
        id: convite.id,
        tipo: convite.tipo,
        status: convite.status,
        avaliador: avaliadorSemSenha,
        projeto: convite.projeto,
        produto: convite.produto
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, valido: false });
  }
});

app.post('/api/convite-avaliacao/acesso/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const convite = await prisma.conviteAvaliacao.findUnique({
      where: { token },
      include: {
        avaliador: { include: { empresa: true } },
        projeto: true,
        produto: true
      }
    });

    if (!convite) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    if (convite.tipo !== 'projeto') {
      return res.status(400).json({
        error: 'Acesso sem senha disponível apenas para avaliações de maturidade.'
      });
    }

    if (convite.status === 'expirado' || new Date() > convite.dataExpiracao) {
      if (convite.status !== 'expirado') {
        await prisma.conviteAvaliacao.update({
          where: { id: convite.id },
          data: { status: 'expirado' }
        });
      }
      return res.status(400).json({ error: 'Convite expirado' });
    }

    if (!convite.avaliador?.ativo) {
      return res.status(403).json({ error: 'Usuário avaliador inativo.' });
    }

    await registrarEventoAvaliacao({
      tipo: 'convite_aberto',
      conviteId: convite.id,
      projetoId: convite.projetoId,
      usuarioId: convite.avaliadorId,
      metadata: { origem: 'magic_link' },
      req
    });

    const projetoVersao = await obterVersaoDoConviteProjeto(convite);
    const idsAvaliacaoVersao = projetoVersao
      ? await idsAvaliacoesDaVersao(convite.projetoId, projetoVersao.id)
      : null;
    let avaliacao = await prisma.avaliacao.findFirst({
      where: {
        projetoId: convite.projetoId,
        usuarioId: convite.avaliadorId,
        ...(idsAvaliacaoVersao ? { id: { in: [...idsAvaliacaoVersao] } } : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    const reutilizada = !!avaliacao;
    if (!avaliacao) {
      const areasSelecionadas = convite.areasSelecionadas
        ? JSON.parse(convite.areasSelecionadas)
        : null;
      const perguntas =
        areasSelecionadas && areasSelecionadas.length > 0
          ? await prisma.pergunta.findMany({
              where: { areaId: { in: areasSelecionadas } },
              orderBy: [{ areaId: 'asc' }, { numero: 'asc' }]
            })
          : await prisma.pergunta.findMany({
              orderBy: [{ areaId: 'asc' }, { numero: 'asc' }]
            });

      avaliacao = await prisma.avaliacao.create({
        data: {
          projetoId: convite.projetoId,
          usuarioId: convite.avaliadorId,
          areasSelecionadas: convite.areasSelecionadas,
          respostas: {
            create: perguntas.map((p) => ({ perguntaId: p.id }))
          }
        }
      });
      if (projetoVersao) {
        await setProjetoVersaoEmAvaliacao(avaliacao.id, projetoVersao.id);
      }
    }

    await registrarEventoAvaliacao({
      tipo: 'avaliacao_iniciada',
      avaliacaoId: avaliacao.id,
      conviteId: convite.id,
      projetoId: convite.projetoId,
      usuarioId: convite.avaliadorId,
      metadata: { reutilizada },
      req
    });

    if (convite.status === 'pendente') {
      await prisma.conviteAvaliacao.update({
        where: { id: convite.id },
        data: { status: 'aceito' }
      });
    }

    const sessionToken = generateToken(convite.avaliador);
    const { senha: _senha, ...usuarioSemSenha } = convite.avaliador;

    res.json({
      success: true,
      token: sessionToken,
      usuario: usuarioSemSenha,
      tipo: 'projeto',
      avaliacaoId: avaliacao.id,
      redirectUrl: `/avaliacoes/${avaliacao.id}`,
      reused: reutilizada
    });
  } catch (error) {
    console.error('Erro no acesso mágico do convite:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/convite-avaliacao/aceitar/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const convite = await prisma.conviteAvaliacao.findUnique({
      where: { token },
      include: {
        avaliador: true,
        projeto: true,
        produto: true
      }
    });
    
    if (!convite) {
      return res.status(404).json({ error: 'Convite não encontrado' });
    }

    if (Number(req.usuario?.id) !== Number(convite.avaliadorId)) {
      return res.status(403).json({ error: 'Este convite pertence a outro avaliador' });
    }
    
    if (convite.status === 'aceito') {
      if (convite.tipo === 'projeto') {
        const projetoVersao = await obterVersaoDoConviteProjeto(convite);
        const idsAvaliacaoVersao = projetoVersao
          ? await idsAvaliacoesDaVersao(convite.projetoId, projetoVersao.id)
          : null;
        const avaliacaoExistente = await prisma.avaliacao.findFirst({
          where: {
            projetoId: convite.projetoId,
            usuarioId: convite.avaliadorId,
            ...(idsAvaliacaoVersao ? { id: { in: [...idsAvaliacaoVersao] } } : {})
          },
          orderBy: { createdAt: 'desc' }
        });
        if (avaliacaoExistente) {
          return res.json({
            success: true,
            tipo: 'projeto',
            avaliacaoId: avaliacaoExistente.id,
            redirectUrl: `/avaliacoes/${avaliacaoExistente.id}`,
            reused: true
          });
        }
      } else {
        const avaliacaoExistente = await prisma.avaliacaoProduto.findFirst({
          where: {
            produtoId: convite.produtoId,
            usuarioId: convite.avaliadorId
          },
          orderBy: { createdAt: 'desc' }
        });
        if (avaliacaoExistente) {
          return res.json({
            success: true,
            tipo: 'produto',
            avaliacaoId: avaliacaoExistente.id,
            redirectUrl: `/avaliacoes-produto/${avaliacaoExistente.id}`,
            reused: true
          });
        }
      }
    }

    if (convite.status !== 'pendente') {
      return res.status(400).json({ error: 'Convite já foi utilizado ou expirado' });
    }
    
    if (new Date() > convite.dataExpiracao) {
      await prisma.conviteAvaliacao.update({
        where: { id: convite.id },
        data: { status: 'expirado' }
      });
      return res.status(400).json({ error: 'Convite expirado' });
    }
    
    await prisma.conviteAvaliacao.update({
      where: { id: convite.id },
      data: { status: 'aceito' }
    });
    
    let avaliacao;
    
    if (convite.tipo === 'projeto') {
      const projetoVersao = await obterVersaoDoConviteProjeto(convite);
      const areasSelecionadas = convite.areasSelecionadas 
        ? JSON.parse(convite.areasSelecionadas) 
        : null;
      
      let perguntas;
      if (areasSelecionadas && areasSelecionadas.length > 0) {
        perguntas = await prisma.pergunta.findMany({
          where: { areaId: { in: areasSelecionadas } }
        });
      } else {
        perguntas = await prisma.pergunta.findMany();
      }
      
      avaliacao = await prisma.avaliacao.create({
        data: {
          projetoId: convite.projetoId,
          usuarioId: convite.avaliadorId,
          areasSelecionadas: convite.areasSelecionadas,
          respostas: {
            create: perguntas.map(p => ({
              perguntaId: p.id
            }))
          }
        },
        include: {
          projeto: { include: { empresa: true } },
          usuario: true
        }
      });
      if (projetoVersao) {
        await setProjetoVersaoEmAvaliacao(avaliacao.id, projetoVersao.id);
      }
      
      res.json({
        success: true,
        tipo: 'projeto',
        avaliacaoId: avaliacao.id,
        redirectUrl: `/avaliacoes/${avaliacao.id}`
      });
    } else {
      const perguntasObrigatorias = await prisma.perguntaObrigatoriaProduto.findMany();
      const perguntasVerticais = await prisma.perguntaProduto.findMany();
      
      avaliacao = await prisma.avaliacaoProduto.create({
        data: {
          produtoId: convite.produtoId,
          usuarioId: convite.avaliadorId,
          respostasObrigatorias: {
            create: perguntasObrigatorias.map(p => ({
              perguntaObrigatoriaId: p.id
            }))
          },
          respostasVerticais: {
            create: perguntasVerticais.map(p => ({
              perguntaProdutoId: p.id
            }))
          }
        },
        include: {
          produto: { include: { projeto: { include: { empresa: true } } } },
          usuario: true
        }
      });
      
      res.json({
        success: true,
        tipo: 'produto',
        avaliacaoId: avaliacao.id,
        redirectUrl: `/avaliacoes-produto/${avaliacao.id}`
      });
    }
  } catch (error) {
    console.error('Erro ao aceitar convite:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/smtp/status', async (req, res) => {
  const status = await verificarConexaoSMTP();
  res.json(status);
});

// Endpoint para testar envio de email (usa o provider configurado: smtp ou graph)
app.post('/api/email/test', async (req, res) => {
  try {
    const destinatario = req.body?.destinatario;
    if (!destinatario) {
      return res.status(400).json({ error: 'Campo "destinatario" obrigatorio' });
    }

    const status = await verificarConexaoSMTP();
    if (!status.conectado) {
      return res.status(500).json({ error: 'Provider de email nao esta conectado', status });
    }

    const resultado = await enviarEmailConviteAvaliacao({
      destinatarioEmail: destinatario,
      destinatarioNome: 'Teste Blueprint IA',
      remetenteNome: 'Sistema Blueprint IA',
      empresaNome: 'SysMap Solutions',
      tipo: 'projeto',
      itemNome: 'Email de Teste - Configuracao de Producao',
      token: 'teste-' + Date.now()
    });

    res.json({ success: true, provider: status.provider, resultado });
  } catch (error) {
    console.error('Erro ao testar email:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN — template e-mail convite avaliação ====================
app.get('/api/admin/email-convite-avaliacao', async (req, res) => {
  try {
    if (!roleIsAdmin(req.usuario?.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const cfg = await getConviteConfigFromDb();
    res.json({
      templateHtml: cfg.templateHtml,
      assunto: cfg.assunto,
      usandoPadraoHtml: cfg.usandoPadraoHtml,
      usandoPadraoAssunto: cfg.usandoPadraoAssunto,
      placeholders: PLACEHOLDERS_CONVITE,
      descricaoPlaceholders: DESCRICAO_PLACEHOLDERS_CONVITE,
      defaultTemplateHtml: getDefaultConviteTemplateHtml(),
      defaultAssunto: getDefaultAssuntoConvite()
    });
  } catch (error) {
    console.error('admin email-convite get:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/email-convite-avaliacao', async (req, res) => {
  try {
    if (!roleIsAdmin(req.usuario?.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const templateHtml = req.body?.templateHtml;
    const assunto = req.body?.assunto;
    if (typeof templateHtml !== 'string' || !templateHtml.trim()) {
      return res.status(400).json({ error: 'Campo templateHtml é obrigatório' });
    }
    if (typeof assunto !== 'string' || !assunto.trim()) {
      return res.status(400).json({ error: 'Campo assunto é obrigatório' });
    }
    if (templateHtml.length > 400000) {
      return res.status(400).json({ error: 'templateHtml excede o limite de 400000 caracteres' });
    }
    if (assunto.length > 500) {
      return res.status(400).json({ error: 'assunto excede 500 caracteres' });
    }
    await salvarConviteConfigNoDb({ templateHtml, assunto: assunto.trim() });
    res.json({ success: true });
  } catch (error) {
    console.error('admin email-convite put:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/email-convite-avaliacao/preview', async (req, res) => {
  try {
    if (!roleIsAdmin(req.usuario?.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const dbCfg = await getConviteConfigFromDb();
    const templateHtml =
      typeof req.body?.templateHtml === 'string' && req.body.templateHtml.trim()
        ? req.body.templateHtml
        : dbCfg.templateHtml;
    const assuntoTpl =
      typeof req.body?.assunto === 'string' && req.body.assunto.trim()
        ? req.body.assunto
        : dbCfg.assunto;
    const sample =
      req.body?.sampleData && typeof req.body.sampleData === 'object' && !Array.isArray(req.body.sampleData)
        ? req.body.sampleData
        : {};
    const html = previewConviteHtml(templateHtml, sample);
    const tipoTexto =
      sample.tipoTexto ||
      sample.tipoAvaliacao ||
      'Avaliação de Maturidade em IA';
    const assunto = montarAssuntoConvite(assuntoTpl, {
      tipoTexto,
      empresaNome: sample.nomeEmpresa || 'Empresa Exemplo Ltda',
      itemNome: sample.nomeItem || ''
    });
    res.json({ html, assunto });
  } catch (error) {
    console.error('admin email-convite preview:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PROJETOS ====================

app.get('/api/projetos', async (req, res) => {
  try {
    const { empresaId } = req.query;
    let where = {};
    
    if (roleIsAdmin(req.usuario?.role)) {
      if (empresaId) {
        const id = parseInt(empresaId, 10);
        if (isNaN(id) || id <= 0) {
          return res.status(400).json({ error: 'empresaId inválido' });
        }
        where.empresaId = id;
      }
    } else {
      const eid = req.usuario.empresaId;
      if (eid == null) {
        return res.status(403).json({ error: 'Usuário sem empresa vinculada.' });
      }
      if (empresaId && parseInt(empresaId, 10) !== Number(eid)) {
        return res.status(403).json({ error: 'Sem permissão para listar projetos de outra empresa.' });
      }
      where.empresaId = eid;
    }
    
    const projetos = await prisma.projeto.findMany({
      where,
      include: {
        empresa: true,
        _count: { select: { avaliacoes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projetos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** Progresso do questionário por avaliador (gestão do projeto). */
app.get('/api/projetos/:id/avaliadores-status', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id, 10);
    if (isNaN(projetoId) || projetoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const filtroNivelMax = parseFiltroNivelPrioridadeMapeamentoMaturidadeMax(req);

    const projeto = await prisma.projeto.findUnique({
      where: { id: projetoId },
      include: { empresa: true }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    if (!usuarioPodeGerenciarProjeto(req, projeto)) {
      return res.status(403).json({ error: 'Sem permissão para este projeto.' });
    }

    const areas = await prisma.area.findMany({
      include: { perguntas: { orderBy: { numero: 'asc' } } },
      orderBy: { ordem: 'asc' }
    });
    const areaPorId = new Map(areas.map((area) => [area.id, area]));

    const projetoVersao = await obterVersaoSelecionadaProjeto(req, projetoId);
    const [avaliacoesRaw, convitesRaw, eventos] = await Promise.all([
      prisma.avaliacao.findMany({
        where: { projetoId },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              cargo: true,
              nivelPrioridadeMapeamentoMaturidade: true
            }
          },
          respostas: {
            include: {
              pergunta: { include: { area: true } }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.conviteAvaliacao.findMany({
        where: { projetoId, tipo: 'projeto' },
        include: {
          avaliador: {
            select: {
              id: true,
              nome: true,
              email: true,
              cargo: true,
              nivelPrioridadeMapeamentoMaturidade: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      listarEventosAvaliacaoPorProjeto(projetoId)
    ]);
    const idsAvaliacaoVersao = await idsAvaliacoesDaVersao(projetoId, projetoVersao.id);
    const idsConviteVersao = await idsConvitesDaVersao(projetoId, projetoVersao.id);
    const avaliacoes = avaliacoesRaw.filter((avaliacao) => idsAvaliacaoVersao.has(Number(avaliacao.id)));
    const convites = convitesRaw.filter((convite) => idsConviteVersao.has(Number(convite.id)));

    const avaliacaoPorUsuario = new Map();
    for (const av of avaliacoes) {
      if (!avaliacaoPorUsuario.has(av.usuarioId)) {
        avaliacaoPorUsuario.set(av.usuarioId, av);
      }
    }

    const ids = new Set();
    for (const av of avaliacoes) ids.add(av.usuarioId);
    for (const c of convites) ids.add(c.avaliadorId);

    const eventosPorUsuario = new Map();
    for (const evento of eventos) {
      const uid = Number(evento.usuarioId);
      if (!uid) continue;
      if (!eventosPorUsuario.has(uid)) eventosPorUsuario.set(uid, []);
      eventosPorUsuario.get(uid).push({
        id: Number(evento.id),
        tipo: evento.tipo,
        avaliacaoId: evento.avaliacaoId,
        conviteId: evento.conviteId,
        metadata: evento.metadata,
        createdAt: evento.createdAt
      });
    }

    const agora = new Date();
    const convitePendentePorUsuario = new Map();
    for (const c of convites) {
      if (c.status !== 'pendente') continue;
      if (new Date(c.dataExpiracao) <= agora) continue;
      if (!convitePendentePorUsuario.has(c.avaliadorId)) {
        convitePendentePorUsuario.set(c.avaliadorId, c);
      }
    }

    const linhas = [];

    for (const uid of ids) {
      const avaliacao = avaliacaoPorUsuario.get(uid);
      const usuario =
        avaliacao?.usuario ??
        convites.find((x) => x.avaliadorId === uid)?.avaliador;

      if (!usuario) continue;
      if (!usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(usuario, filtroNivelMax)) continue;

      let respondidas = 0;
      let total = 0;
      let percentual = 0;
      let statusFormulario = 'sem_avaliacao';
      let avaliacaoId = null;
      let statusAvaliacao = null;
      let alertasQualidade = [];
      let alertasRespostas = [];
      let qualidadeDadoStatus = 'sem_dados';
      let iniciadoEm = null;
      let atualizadoEm = null;
      let minutosAteConclusao = null;
      let dimensaoAtual = null;

      if (avaliacao) {
        const prog = calcularProgressoAvaliacaoProjeto(avaliacao, areas);
        respondidas = prog.respondidas;
        total = prog.total;
        percentual = prog.percentual;
        const respostasPorPergunta = new Map((avaliacao.respostas || []).map((r) => [r.perguntaId, r]));
        const areasSelecionadas = parseAreasSelecionadas(avaliacao, areas.map((area) => area.id));
        const areasRecusadas = parseAreasRecusadas(avaliacao);
        const areaPendente = areas.find((area) => {
          if (!areasSelecionadas.includes(area.id) || areasRecusadas.includes(area.id)) return false;
          return (area.perguntas || []).some((pergunta) => {
            const resposta = respostasPorPergunta.get(pergunta.id);
            return !resposta || (resposta.semInformacao !== true && resposta.pontuacao == null);
          });
        });
        dimensaoAtual = areaPendente?.nome || null;
        statusAvaliacao = avaliacao.status;
        avaliacaoId = avaliacao.id;
        iniciadoEm = avaliacao.createdAt;
        atualizadoEm = avaliacao.updatedAt;
        if (avaliacao.status === 'finalizada') {
          const inicio = new Date(avaliacao.createdAt).getTime();
          const fim = new Date(avaliacao.updatedAt).getTime();
          minutosAteConclusao = Number.isFinite(inicio) && Number.isFinite(fim)
            ? Math.max(0, Math.round((fim - inicio) / 60000))
            : null;
        }
        const qualidade = calcularAlertasQualidadeAvaliacao(avaliacao);
        alertasQualidade = qualidade.alertas;
        alertasRespostas = qualidade.alertasRespostas || [];
        qualidadeDadoStatus = qualidade.status;
        if (avaliacao.status === 'finalizada') {
          statusFormulario = 'finalizada';
        } else if (percentual >= 100) {
          statusFormulario = 'pronto_finalizar';
        } else if (percentual > 0) {
          statusFormulario = 'em_andamento';
        } else {
          statusFormulario = 'nao_iniciada';
        }
      } else {
        statusFormulario = convitePendentePorUsuario.has(uid)
          ? 'convite_pendente'
          : 'sem_avaliacao';
      }

      const convitePendente = convitePendentePorUsuario.get(uid);
      const ultimoConvite = convites.find((x) => x.avaliadorId === uid);
      const conviteParaLink = convitePendente || ultimoConvite;
      const dimensoesConvite = dimensoesSelecionadasDoConvite(conviteParaLink, areaPorId);
      const conviteLink = conviteParaLink
        ? `${getBaseUrlApp()}/avaliacao/acesso/${conviteParaLink.token}`
        : null;
      const auditoria = eventosPorUsuario.get(uid) || [];
      const abriuConvite = auditoria.some((evento) => evento.tipo === 'convite_aberto');
      const iniciouAvaliacao = !!avaliacao || auditoria.some((evento) => evento.tipo === 'avaliacao_iniciada');
      const ultimoEvento = auditoria[0] || null;
      const etapaConvite = avaliacao?.status === 'finalizada'
        ? 'finalizada'
        : iniciouAvaliacao && percentual > 0
          ? 'em_andamento'
          : iniciouAvaliacao
            ? 'iniciada_sem_respostas'
            : abriuConvite
              ? 'abriu_sem_iniciar'
              : conviteParaLink
                ? 'link_enviado'
                : 'sem_convite';

      linhas.push({
        usuarioId: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        nivelPrioridadeMapeamentoMaturidade:
          nivelPrioridadeMapeamentoMaturidadeDoUsuario(usuario),
        avaliacaoId,
        statusAvaliacao,
        respondidas,
        totalPerguntas: total,
        percentual,
        statusFormulario,
        convitePendente: !!convitePendente,
        iniciadoEm,
        atualizadoEm,
        minutosAteConclusao,
        qualidadeDadoStatus,
        alertasQualidade,
        alertasRespostas,
        dimensoesConvite,
        conviteLink,
        abriuConvite,
        iniciouAvaliacao,
        etapaConvite,
        dimensaoAtual,
        ultimoEvento,
        auditoria: auditoria.slice(0, 8),
        podeLembrar:
          statusAvaliacao !== 'finalizada' &&
          (!!avaliacao || !!convitePendente)
      });
    }

    linhas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    res.json({
      projeto: { id: projeto.id, nome: projeto.nome },
      projetoVersao,
      empresa: projeto.empresa,
      filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
      resumoOperacional: calcularResumoAcompanhamento(linhas),
      resumoQualidade: {
        alertas: linhas.reduce((acc, row) => acc + (row.alertasQualidade?.length || 0), 0),
        avaliadoresComAlerta: linhas.filter((row) => row.qualidadeDadoStatus === 'atencao').length
      },
      avaliadores: linhas
    });
  } catch (error) {
    console.error('avaliadores-status:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projetos/:id/avaliadores-dimensoes', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id, 10);
    if (isNaN(projetoId) || projetoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const filtroNivelMax = parseFiltroNivelPrioridadeMapeamentoMaturidadeMax(req);

    const projeto = await prisma.projeto.findUnique({
      where: { id: projetoId },
      include: { empresa: true }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    if (!usuarioPodeGerenciarProjeto(req, projeto)) {
      return res.status(403).json({ error: 'Sem permissão para este projeto.' });
    }

    const projetoVersao = await obterVersaoSelecionadaProjeto(req, projetoId);
    const [areas, avaliacoesRaw, convitesRaw] = await Promise.all([
      prisma.area.findMany({
        include: { perguntas: { select: { id: true }, orderBy: { numero: 'asc' } } },
        orderBy: { ordem: 'asc' }
      }),
      prisma.avaliacao.findMany({
        where: { projetoId },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              cargo: true,
              nivelPrioridadeMapeamentoMaturidade: true
            }
          },
          respostas: true
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.conviteAvaliacao.findMany({
        where: { projetoId, tipo: 'projeto' },
        include: {
          avaliador: {
            select: {
              id: true,
              nome: true,
              email: true,
              cargo: true,
              nivelPrioridadeMapeamentoMaturidade: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    const idsAvaliacaoVersao = await idsAvaliacoesDaVersao(projetoId, projetoVersao.id);
    const idsConviteVersao = await idsConvitesDaVersao(projetoId, projetoVersao.id);
    const avaliacoes = avaliacoesRaw.filter((avaliacao) => idsAvaliacaoVersao.has(Number(avaliacao.id)));
    const convites = convitesRaw.filter((convite) => idsConviteVersao.has(Number(convite.id)));

    const todasAreaIds = areas.map((area) => area.id);
    const avaliacaoPorUsuario = new Map();
    for (const avaliacao of avaliacoes) {
      if (!avaliacaoPorUsuario.has(avaliacao.usuarioId)) {
        avaliacaoPorUsuario.set(avaliacao.usuarioId, avaliacao);
      }
    }

    const convitePorUsuario = new Map();
    for (const convite of convites) {
      if (!convitePorUsuario.has(convite.avaliadorId)) {
        convitePorUsuario.set(convite.avaliadorId, convite);
      }
    }

    const usuarioIds = new Set([
      ...avaliacoes.map((avaliacao) => avaliacao.usuarioId),
      ...convites.map((convite) => convite.avaliadorId)
    ]);

    const linhas = [];
    for (const usuarioId of usuarioIds) {
      const avaliacao = avaliacaoPorUsuario.get(usuarioId);
      const convite = convitePorUsuario.get(usuarioId);
      const usuario = avaliacao?.usuario || convite?.avaliador;
      if (!usuario) continue;
      if (!usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(usuario, filtroNivelMax)) continue;

      const areasSelecionadas = avaliacao
        ? parseAreasSelecionadas(avaliacao, todasAreaIds)
        : parseJsonArrayNumeros(convite?.areasSelecionadas).length > 0
          ? parseJsonArrayNumeros(convite.areasSelecionadas)
          : todasAreaIds;
      const areasRecusadas = avaliacao ? parseAreasRecusadas(avaliacao) : [];
      const respostasPorPergunta = new Map();
      for (const resposta of avaliacao?.respostas || []) {
        respostasPorPergunta.set(resposta.perguntaId, resposta);
      }

      const dimensoes = areas.map((area) => {
        const selecionada = areasSelecionadas.includes(area.id);
        const recusada = areasRecusadas.includes(area.id);
        const perguntas = area.perguntas || [];
        const total = selecionada && !recusada ? perguntas.length : 0;
        const respondidas = selecionada && !recusada
          ? perguntas.filter((pergunta) => {
              const resposta = respostasPorPergunta.get(pergunta.id);
              return (
                resposta &&
                (resposta.semInformacao === true ||
                  (resposta.pontuacao !== null && resposta.pontuacao !== undefined))
              );
            }).length
          : 0;
        let status = 'fora_escopo';
        if (recusada) status = 'recusada';
        else if (selecionada && !avaliacao) status = 'convidada';
        else if (selecionada && respondidas === 0) status = 'nao_iniciada';
        else if (selecionada && respondidas < total) status = 'parcial';
        else if (selecionada && total > 0) status = 'avaliada';

        return {
          areaId: area.id,
          nome: area.nome,
          ordem: area.ordem,
          selecionada,
          recusada,
          respondidas,
          total,
          percentual: total > 0 ? Math.round((respondidas / total) * 100) : 0,
          status
        };
      });

      const dimensoesAvaliadas = dimensoes.filter((dimensao) => dimensao.status === 'avaliada').length;
      const dimensoesParciais = dimensoes.filter((dimensao) => dimensao.status === 'parcial').length;
      const dimensoesNoEscopo = dimensoes.filter((dimensao) => dimensao.selecionada && !dimensao.recusada).length;
      const dimensoesAvaliadasNomes = dimensoes
        .filter((dimensao) => dimensao.status === 'avaliada')
        .map((dimensao) => dimensao.nome);

      linhas.push({
        usuarioId,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo,
        nivelPrioridadeMapeamentoMaturidade:
          nivelPrioridadeMapeamentoMaturidadeDoUsuario(usuario),
        avaliacaoId: avaliacao?.id || null,
        statusAvaliacao: avaliacao?.status || null,
        conviteId: convite?.id || null,
        statusConvite: convite?.status || null,
        dataAvaliacaoFinal: avaliacao?.status === 'finalizada' ? avaliacao.updatedAt : null,
        atualizadoEm: avaliacao?.updatedAt || convite?.updatedAt || null,
        dimensoesNoEscopo,
        dimensoesAvaliadas,
        dimensoesAvaliadasNomes,
        dimensoesParciais,
        dimensoes
      });
    }

    linhas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    res.json({
      projeto: { id: projeto.id, nome: projeto.nome },
      projetoVersao,
      empresa: projeto.empresa,
      filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
      areas: areas.map((area) => ({
        id: area.id,
        nome: area.nome,
        ordem: area.ordem,
        totalPerguntas: area.perguntas?.length || 0
      })),
      resumo: {
        avaliadores: linhas.length,
        dimensoesAvaliadas: linhas.reduce((acc, row) => acc + row.dimensoesAvaliadas, 0),
        dimensoesParciais: linhas.reduce((acc, row) => acc + row.dimensoesParciais, 0),
        dimensoesNoEscopo: linhas.reduce((acc, row) => acc + row.dimensoesNoEscopo, 0)
      },
      avaliadores: linhas
    });
  } catch (error) {
    console.error('avaliadores-dimensoes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projetos/:id/avaliadores/lembrete', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id, 10);
    const usuarioId = parseInt(req.body?.usuarioId, 10);
    if (isNaN(projetoId) || isNaN(usuarioId)) {
      return res.status(400).json({ error: 'usuarioId é obrigatório e deve ser válido' });
    }

    const projeto = await prisma.projeto.findUnique({
      where: { id: projetoId },
      include: { empresa: true }
    });
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    if (!usuarioPodeGerenciarProjeto(req, projeto)) {
      return res.status(403).json({ error: 'Sem permissão para este projeto.' });
    }

    try {
      const resultado = await enviarLembreteProjetoComAuditoria(prisma, {
        projetoId,
        usuarioId,
        enviadoPorUsuarioId: req.usuarioId,
        modo: 'individual',
        areasCache: null
      });
      res.json({ ok: true, email: resultado });
    } catch (err) {
      const msg = err?.message || String(err);
      if (
        msg.includes('não encontrado') ||
        msg.includes('Não há avaliação') ||
        msg.includes('finalizada')
      ) {
        return res.status(400).json({ error: msg });
      }
      throw err;
    }
  } catch (error) {
    console.error('lembrete avaliador:', error);
    res.status(500).json({ error: error.message });
  }
});

/** Lembrete em lote com intervalo entre envios (LEMBRETE_LOTE_DELAY_MS) e auditoria. */
app.post('/api/projetos/:id/avaliadores/lembrete-lote', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id, 10);
    if (isNaN(projetoId) || projetoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const projeto = await prisma.projeto.findUnique({
      where: { id: projetoId },
      include: { empresa: true }
    });
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    if (!usuarioPodeGerenciarProjeto(req, projeto)) {
      return res.status(403).json({ error: 'Sem permissão para este projeto.' });
    }

    let nivelPrioridadeMapeamentoMaturidadeMax = 3;
    const b = req.body?.nivelPrioridadeMapeamentoMaturidade;
    if (b !== undefined && b !== null && b !== '') {
      const s = String(b).trim().toLowerCase();
      if (s === '0' || s === 'todos') nivelPrioridadeMapeamentoMaturidadeMax = null;
      else {
        const n = parseInt(s, 10);
        if (n === 0) nivelPrioridadeMapeamentoMaturidadeMax = null;
        else if (Number.isFinite(n) && n >= 1 && n <= 3) nivelPrioridadeMapeamentoMaturidadeMax = n;
      }
    }

    const out = await executarLembreteLoteProjeto(prisma, {
      projetoId,
      enviadoPorUsuarioId: req.usuarioId,
      modo: 'lote',
      nivelPrioridadeMapeamentoMaturidadeMax
    });

    if (out.total === 0) {
      return res.json({
        ok: true,
        mensagem: 'Nenhum avaliador pendente para lembrete neste projeto.',
        ...out
      });
    }

    res.json({ ok: true, ...out });
  } catch (error) {
    console.error('lembrete-lote:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projetos/:id/avaliadores/lembretes-log', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id, 10);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    if (isNaN(projetoId) || projetoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const projeto = await prisma.projeto.findUnique({ where: { id: projetoId } });
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    if (!usuarioPodeGerenciarProjeto(req, projeto)) {
      return res.status(403).json({ error: 'Sem permissão para este projeto.' });
    }
    const logs = await prisma.logLembreteAvaliacao.findMany({
      where: { projetoId, escopoTipo: 'projeto' },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** Dashboard: respostas do bloco opcional Desejos IA por avaliação (não entra no score de maturidade). */
app.get('/api/projetos/:id/desejos-ia', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id, 10);
    if (Number.isNaN(projetoId) || projetoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    let desejosIaPersistenciaDisponivel = true;
    let projeto;
    try {
      projeto = await prisma.projeto.findUnique({
        where: { id: projetoId },
        include: {
          empresa: { select: { id: true, nome: true } },
          avaliacoes: {
            include: {
              usuario: { select: { id: true, nome: true, email: true, cargo: true } },
              desejosIADados: true
            },
            orderBy: { id: 'asc' }
          }
        }
      });
    } catch (e) {
      if (!isMissingAvaliacaoDesejosIaTableError(e)) throw e;
      desejosIaPersistenciaDisponivel = false;
      projeto = await prisma.projeto.findUnique({
        where: { id: projetoId },
        include: {
          empresa: { select: { id: true, nome: true } },
          avaliacoes: {
            include: {
              usuario: { select: { id: true, nome: true, email: true, cargo: true } }
            },
            orderBy: { id: 'asc' }
          }
        }
      });
    }

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    if (!roleIsAdmin(req.usuario?.role)) {
      const eidUser = req.usuario.empresaId;
      if (eidUser == null || Number(projeto.empresaId) !== Number(eidUser)) {
        return res.status(403).json({ error: 'Sem permissão para acessar este projeto.' });
      }
    }

    const role = String(req.usuario?.role || '').trim().toLowerCase();
    let avaliacoesLista = projeto.avaliacoes;
    if (role === 'avaliador') {
      avaliacoesLista = avaliacoesLista.filter(
        (a) => Number(a.usuarioId) === Number(req.usuario.id)
      );
    }

    const linhasPorAvaliacao = avaliacoesLista.map((a) => {
      const payload = a.desejosIADados?.payload ?? null;
      const linhas = desejosIaParaRespostasEmail(payload);
      return {
        avaliacaoId: a.id,
        status: a.status,
        usuario: a.usuario,
        temDesejosIA: linhas.length > 0,
        desejosIA: payload,
        linhas
      };
    });

    res.json({
      projeto: {
        id: projeto.id,
        nome: projeto.nome,
        empresa: projeto.empresa
      },
      avaliacoes: linhasPorAvaliacao,
      meta: {
        desejosIaPersistenciaDisponivel
      }
    });
  } catch (error) {
    console.error('GET desejos-ia projeto:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projetos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const projeto = await prisma.projeto.findUnique({
      where: { id },
      include: {
        empresa: true,
        avaliacoes: {
          include: { usuario: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    if (!roleIsAdmin(req.usuario?.role)) {
      const eidUser = req.usuario.empresaId;
      if (eidUser == null || Number(projeto.empresaId) !== Number(eidUser)) {
        return res.status(403).json({ error: 'Sem permissão para acessar este projeto.' });
      }
    }
    res.json({
      ...projeto,
      avaliacoes: await anexarVersoesEmAvaliacoes(projeto.avaliacoes)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projetos/:id/versoes', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id, 10);
    if (!Number.isFinite(projetoId) || projetoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const projeto = await prisma.projeto.findUnique({
      where: { id: projetoId },
      include: { empresa: true }
    });
    if (!projeto) return res.status(404).json({ error: 'Projeto não encontrado' });
    if (!usuarioPodeGerenciarProjeto(req, projeto)) {
      return res.status(403).json({ error: 'Sem permissão para este projeto.' });
    }

    const atual = await obterVersaoAtualProjeto(projetoId);
    const rows = await prisma.$queryRaw`
      SELECT
        v.*,
        COUNT(a."id")::int AS "totalAvaliacoes",
        COUNT(a."id") FILTER (WHERE a."status" = 'finalizada')::int AS "finalizadas",
        AVG(a."scoreGeral") FILTER (WHERE a."status" = 'finalizada') AS "scoreMedio",
        MIN(a."createdAt") AS "primeiraAvaliacaoEm",
        MAX(a."updatedAt") AS "ultimaAvaliacaoEm",
        COALESCE(
          ARRAY_AGG(a."id" ORDER BY a."id") FILTER (WHERE a."id" IS NOT NULL),
          ARRAY[]::integer[]
        ) AS "avaliacaoIds",
        COALESCE(
          ARRAY_AGG(a."id" ORDER BY a."id") FILTER (WHERE a."id" IS NOT NULL AND a."status" = 'finalizada'),
          ARRAY[]::integer[]
        ) AS "avaliacaoFinalizadaIds"
      FROM "ProjetoVersao" v
      LEFT JOIN "ProjetoVersaoAvaliacao" pva ON pva."projetoVersaoId" = v."id"
      LEFT JOIN "Avaliacao" a ON a."id" = pva."avaliacaoId"
      WHERE v."projetoId" = ${projetoId}
      GROUP BY v."id"
      ORDER BY v."numero" ASC
    `;

    const areasResumoVersao = await prisma.area.findMany({
      select: { id: true, nome: true },
      orderBy: { ordem: 'asc' }
    });
    const versoesBase = rows.map((row) => ({
      ...normalizarProjetoVersao(row),
      totalAvaliacoes: Number(row.totalAvaliacoes || 0),
      finalizadas: Number(row.finalizadas || 0),
      scoreMedio: row.scoreMedio == null ? null : parseFloat(Number(row.scoreMedio).toFixed(2)),
      primeiraAvaliacaoEm: row.primeiraAvaliacaoEm,
      ultimaAvaliacaoEm: row.ultimaAvaliacaoEm,
      avaliacaoIds: (row.avaliacaoIds || []).map((id) => Number(id)),
      avaliacaoFinalizadaIds: (row.avaliacaoFinalizadaIds || []).map((id) => Number(id))
    }));
    const versoesDetalhadas = await Promise.all(versoesBase.map(async (versao) => {
      const [conviteRows, dimensaoRows] = await Promise.all([
        prisma.$queryRaw`
          SELECT c."status", COUNT(*)::int AS "total"
          FROM "ConviteAvaliacao" c
          JOIN "ProjetoVersaoConvite" pvc ON pvc."conviteId" = c."id"
          WHERE c."projetoId" = ${projetoId} AND pvc."projetoVersaoId" = ${versao.id}
          GROUP BY c."status"
        `,
        versao.avaliacaoFinalizadaIds.length > 0
          ? prisma.$queryRaw`
              SELECT ar."id" AS "areaId", ar."nome" AS "area", AVG(r."pontuacao") AS "score"
              FROM "Resposta" r
              JOIN "Pergunta" p ON p."id" = r."perguntaId"
              JOIN "Area" ar ON ar."id" = p."areaId"
              WHERE r."avaliacaoId" IN (${Prisma.join(versao.avaliacaoFinalizadaIds)})
                AND r."pontuacao" IS NOT NULL
              GROUP BY ar."id", ar."nome", ar."ordem"
              ORDER BY ar."ordem" ASC
            `
          : []
      ]);
      const convitesPorStatus = Object.fromEntries(
        conviteRows.map((row) => [row.status || 'desconhecido', Number(row.total || 0)])
      );
      const scoresDimensoes = dimensaoRows.map((row) => ({
        areaId: Number(row.areaId),
        area: row.area,
        score: row.score == null ? null : parseFloat(Number(row.score).toFixed(2))
      }));
      const idsDimensoesRespondidas = new Set(scoresDimensoes.map((row) => Number(row.areaId)));
      const dimensoesSemResposta = areasResumoVersao.filter((area) => !idsDimensoesRespondidas.has(Number(area.id)));
      const pontosFortes = scoresDimensoes
        .filter((row) => row.score != null)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      const riscos = scoresDimensoes
        .filter((row) => row.score != null)
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);
      const pendencias = [
        versao.finalizadas === 0
          ? { tipo: 'sem_finalizadas', severidade: 'alta', mensagem: 'Nenhuma avaliação finalizada nesta versão.' }
          : null,
        versao.totalAvaliacoes > versao.finalizadas
          ? {
              tipo: 'avaliacoes_pendentes',
              severidade: 'media',
              mensagem: `${versao.totalAvaliacoes - versao.finalizadas} avaliação(ões) ainda não finalizada(s).`
            }
          : null,
        Number(convitesPorStatus.pendente || 0) > 0
          ? {
              tipo: 'convites_pendentes',
              severidade: 'media',
              mensagem: `${convitesPorStatus.pendente} convite(s) ainda pendente(s).`
            }
          : null,
        dimensoesSemResposta.length > 0 && versao.finalizadas > 0
          ? {
              tipo: 'dimensoes_sem_resposta',
              severidade: 'baixa',
              mensagem: `${dimensoesSemResposta.length} dimensão(ões) sem resposta nesta versão.`
            }
          : null,
        versao.scoreMedio != null && versao.scoreMedio < 3
          ? { tipo: 'score_baixo', severidade: 'media', mensagem: 'Score médio abaixo de 3,0.' }
          : null
      ].filter(Boolean);
      return {
        ...versao,
        convitesPorStatus,
        checklistFechamento: {
          prontoParaFechar: pendencias.length === 0,
          pendencias
        },
        resumoExecutivo: {
          score: versao.scoreMedio,
          totalAvaliadores: versao.totalAvaliacoes,
          finalizadas: versao.finalizadas,
          pontosFortes,
          riscos,
          dimensoesSemResposta: dimensoesSemResposta.map((area) => ({ areaId: area.id, area: area.nome }))
        }
      };
    }));
    const versoesComEvolucao = versoesDetalhadas.map((versao, index) => {
      const anterior = index > 0 ? versoesDetalhadas[index - 1] : null;
      const deltaScore =
        anterior?.scoreMedio != null && versao.scoreMedio != null
          ? parseFloat((Number(versao.scoreMedio) - Number(anterior.scoreMedio)).toFixed(2))
          : null;
      return {
        ...versao,
        resumoExecutivo: {
          ...versao.resumoExecutivo,
          versaoAnterior: anterior ? { id: anterior.id, titulo: anterior.titulo, score: anterior.scoreMedio } : null,
          deltaScore,
          tendencia: deltaScore == null ? 'sem_comparacao' : deltaScore > 0.15 ? 'evoluiu' : deltaScore < -0.15 ? 'regrediu' : 'estavel'
        }
      };
    });

    res.json({
      projeto: { id: projeto.id, nome: projeto.nome },
      empresa: projeto.empresa,
      versaoAtual: atual,
      versoes: versoesComEvolucao
    });
  } catch (error) {
    console.error('projetos-versoes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projetos/:id/versoes/:versaoId/fechar', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id, 10);
    const versaoId = parseInt(req.params.versaoId, 10);
    const projeto = await prisma.projeto.findUnique({ where: { id: projetoId }, include: { empresa: true } });
    if (!projeto) return res.status(404).json({ error: 'Projeto não encontrado' });
    if (!usuarioPodeGerenciarProjeto(req, projeto)) {
      return res.status(403).json({ error: 'Sem permissão para este projeto.' });
    }
    await obterOuCriarVersaoInicialProjeto(projetoId);
    const rows = await prisma.$queryRaw`
      UPDATE "ProjetoVersao"
      SET "status" = 'fechada', "fechadaEm" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${versaoId} AND "projetoId" = ${projetoId}
      RETURNING *
    `;
    if (rows.length === 0) return res.status(404).json({ error: 'Versão não encontrada' });
    const versaoFechada = normalizarProjetoVersao(rows[0]);
    await registrarEventoAvaliacao({
      tipo: 'projeto_versao_fechada',
      projetoId,
      usuarioId: req.usuarioId,
      metadata: { versaoId: versaoFechada.id, titulo: versaoFechada.titulo, numero: versaoFechada.numero },
      req
    });
    res.json(versaoFechada);
  } catch (error) {
    console.error('fechar-versao-projeto:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projetos/:id/versoes/:versaoId/reabrir', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id, 10);
    const versaoId = parseInt(req.params.versaoId, 10);
    const projeto = await prisma.projeto.findUnique({ where: { id: projetoId }, include: { empresa: true } });
    if (!projeto) return res.status(404).json({ error: 'Projeto não encontrado' });
    if (!usuarioPodeGerenciarProjeto(req, projeto)) {
      return res.status(403).json({ error: 'Sem permissão para este projeto.' });
    }
    await obterOuCriarVersaoInicialProjeto(projetoId);
    const alvoRows = await prisma.$queryRaw`
      SELECT * FROM "ProjetoVersao"
      WHERE "id" = ${versaoId} AND "projetoId" = ${projetoId}
      LIMIT 1
    `;
    if (alvoRows.length === 0) return res.status(404).json({ error: 'Versão não encontrada' });
    const versaoAnterior = normalizarProjetoVersao(alvoRows[0]);
    await prisma.$executeRaw`
      UPDATE "ProjetoVersao"
      SET "status" = 'fechada', "fechadaEm" = COALESCE("fechadaEm", CURRENT_TIMESTAMP), "updatedAt" = CURRENT_TIMESTAMP
      WHERE "projetoId" = ${projetoId} AND "status" = 'aberta' AND "id" <> ${versaoId}
    `;
    const rows = await prisma.$queryRaw`
      UPDATE "ProjetoVersao"
      SET "status" = 'aberta', "fechadaEm" = NULL, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${versaoId} AND "projetoId" = ${projetoId}
      RETURNING *
    `;
    const versaoReaberta = normalizarProjetoVersao(rows[0]);
    await registrarEventoAvaliacao({
      tipo: 'projeto_versao_reaberta',
      projetoId,
      usuarioId: req.usuarioId,
      metadata: {
        versaoId: versaoReaberta.id,
        titulo: versaoReaberta.titulo,
        numero: versaoReaberta.numero,
        statusAnterior: versaoAnterior.status,
        motivo: req.body?.motivo || 'Correção manual'
      },
      req
    });
    res.json(versaoReaberta);
  } catch (error) {
    console.error('reabrir-versao-projeto:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projetos/:id/versoes', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id, 10);
    const projeto = await prisma.projeto.findUnique({ where: { id: projetoId }, include: { empresa: true } });
    if (!projeto) return res.status(404).json({ error: 'Projeto não encontrado' });
    if (!usuarioPodeGerenciarProjeto(req, projeto)) {
      return res.status(403).json({ error: 'Sem permissão para este projeto.' });
    }
    await obterOuCriarVersaoInicialProjeto(projetoId);
    const aberta = await prisma.$queryRaw`
      SELECT * FROM "ProjetoVersao"
      WHERE "projetoId" = ${projetoId} AND "status" = 'aberta'
      ORDER BY "numero" DESC
      LIMIT 1
    `;
    if (aberta.length > 0) {
      return res.status(409).json({
        error: 'Feche a versão atual antes de criar a próxima.',
        versaoAtual: normalizarProjetoVersao(aberta[0])
      });
    }
    const maxRows = await prisma.$queryRaw`
      SELECT COALESCE(MAX("numero"), 0)::int AS "maxNumero"
      FROM "ProjetoVersao"
      WHERE "projetoId" = ${projetoId}
    `;
    const numero = Number(maxRows[0]?.maxNumero || 0) + 1;
    const titulo = String(req.body?.titulo || `Versão ${numero}`).trim().slice(0, 120);
    const rows = await prisma.$queryRaw`
      INSERT INTO "ProjetoVersao" ("projetoId", "numero", "titulo", "status")
      VALUES (${projetoId}, ${numero}, ${titulo}, 'aberta')
      RETURNING *
    `;
    res.status(201).json(normalizarProjetoVersao(rows[0]));
  } catch (error) {
    console.error('criar-versao-projeto:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projetos', validate(projetoSchemas.criar), async (req, res) => {
  try {
    const { empresaId } = req.body;
    
    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) {
      return res.status(400).json({ error: 'Empresa não encontrada' });
    }
    
    const projeto = await prisma.projeto.create({
      data: req.body,
      include: { empresa: true }
    });
    res.status(201).json(projeto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/projetos/:id', validate(projetoSchemas.atualizar), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    if (req.body.empresaId) {
      const empresa = await prisma.empresa.findUnique({ where: { id: req.body.empresaId } });
      if (!empresa) {
        return res.status(400).json({ error: 'Empresa não encontrada' });
      }
    }
    
    const projeto = await prisma.projeto.update({
      where: { id },
      data: req.body,
      include: { empresa: true }
    });
    res.json(projeto);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/projetos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    await prisma.projeto.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    res.status(400).json({ error: error.message });
  }
});

// ==================== ÁREAS E PERGUNTAS ====================

app.get('/api/areas', async (req, res) => {
  try {
    const areas = await prisma.area.findMany({
      include: {
        perguntas: {
          orderBy: { numero: 'asc' }
        }
      },
      orderBy: { ordem: 'asc' }
    });
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AVALIAÇÕES ====================

function usuarioPodeAcessarAvaliacao(req, avaliacao) {
  if (!req.usuario) return false;
  if (roleIsAdmin(req.usuario.role)) return true;
  return avaliacao.usuarioId === req.usuario.id;
}

function usuarioPodeAcessarAvaliacaoProduto(req, avaliacao) {
  if (!req.usuario) return false;
  if (roleIsAdmin(req.usuario.role)) return true;
  return avaliacao.usuarioId === req.usuario.id;
}

app.get('/api/avaliacoes', async (req, res) => {
  try {
    const { projetoId, empresaId } = req.query;
    let where = {};
    
    if (projetoId) {
      where.projetoId = parseInt(projetoId);
    }
    
    if (empresaId) {
      where.projeto = { empresaId: parseInt(empresaId) };
    }

    if (!roleIsAdmin(req.usuario?.role)) {
      where.usuarioId = req.usuario.id;
    }
    
    const avaliacoes = await prisma.avaliacao.findMany({
      where,
      include: {
        projeto: { include: { empresa: true } },
        usuario: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(await anexarVersoesEmAvaliacoes(avaliacoes));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/avaliacoes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de avaliação inválido' });
    }

    const avaliacao = await findUniqueAvaliacaoApiOrFallback(prisma, id);
    if (!avaliacao) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    if (!usuarioPodeAcessarAvaliacao(req, avaliacao)) {
      return res.status(403).json({ error: 'Acesso negado a esta avaliação' });
    }

    res.json({
      ...mergeDesejosIaNaAvaliacaoParaApi(avaliacao),
      projetoVersao: await obterVersaoDaAvaliacao(avaliacao)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/avaliacoes', async (req, res) => {
  try {
    const { projetoId, usuarioId, areaIds } = req.body;
    
    const projetoIdInt = parseInt(projetoId);
    const usuarioIdInt = parseInt(usuarioId);
    
    if (isNaN(projetoIdInt) || isNaN(usuarioIdInt)) {
      return res.status(400).json({ error: 'projetoId e usuarioId são obrigatórios' });
    }

    if (!roleIsAdmin(req.usuario?.role) && usuarioIdInt !== req.usuario.id) {
      return res.status(403).json({ error: 'Você só pode criar avaliações para o seu próprio usuário' });
    }
    const projetoVersao = await obterVersaoAbertaProjetoOuErro(projetoIdInt);
    
    let perguntas;
    const areaIdsArray = Array.isArray(areaIds) ? areaIds.map(id => parseInt(id)) : [];
    
    if (areaIdsArray.length > 0) {
      perguntas = await prisma.pergunta.findMany({
        where: { areaId: { in: areaIdsArray } }
      });
    } else {
      perguntas = await prisma.pergunta.findMany();
    }
    
    const avaliacao = await prisma.avaliacao.create({
      data: {
        projetoId: projetoIdInt,
        usuarioId: usuarioIdInt,
        areasSelecionadas: areaIdsArray.length > 0 ? JSON.stringify(areaIdsArray) : null,
        respostas: {
          create: perguntas.map(p => ({
            perguntaId: p.id
          }))
        }
      },
      include: {
        projeto: { include: { empresa: true } },
        usuario: true,
        respostas: {
          include: {
            pergunta: { include: { area: true } }
          }
        }
      }
    });
    await setProjetoVersaoEmAvaliacao(avaliacao.id, projetoVersao.id);
    res.status(201).json(mergeDesejosIaNaAvaliacaoParaApi(avaliacao));
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(error.statusCode || 400).json({ error: error.message });
  }
});

app.put('/api/avaliacoes/:id/respostas', async (req, res) => {
  try {
    const avaliacaoId = parseInt(req.params.id);
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      select: { id: true, usuarioId: true, areasSelecionadas: true }
    });

    if (!avaliacao) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    if (!usuarioPodeAcessarAvaliacao(req, avaliacao)) {
      return res.status(403).json({ error: 'Acesso negado a esta avaliação' });
    }

    const areas = await prisma.area.findMany({ select: { id: true } });
    const todasAreaIds = areas.map((a) => a.id);
    const areasPermitidas = parseAreasSelecionadas(avaliacao, todasAreaIds);

    const { respostas: rawRespostas, areasRecusadas: rawRec } = req.body;
    const listaRespostas = Array.isArray(rawRespostas) ? rawRespostas : [];

    let areasRecusadas = Array.isArray(rawRec)
      ? [...new Set(rawRec.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n) && n > 0))]
      : [];
    areasRecusadas = areasRecusadas.filter((id) => areasPermitidas.includes(id));

    const updateAvaliacao = {
      areasRecusadas:
        areasRecusadas.length > 0 ? JSON.stringify(areasRecusadas) : null
    };

    await prisma.avaliacao.update({
      where: { id: avaliacaoId },
      data: updateAvaliacao
    });

    let avisoDesejosIa = null;
    /** Só true após deleteMany/upsert sem exceção — usado para recompor `desejosIA` na resposta se o include vier vazio. */
    let desejosGravadosNoDb = false;
    /** Cópia do payload normalizado enviado ao DB (quando a chave `desejosIA` veio no body). */
    let desejosNormalizadoSalvo = null;
    if (Object.prototype.hasOwnProperty.call(req.body, 'desejosIA')) {
      const rawDesejos = req.body.desejosIA;
      const normalized = normalizarDesejosIA(rawDesejos);
      desejosNormalizadoSalvo = normalized;
      try {
        if (normalized == null) {
          await prisma.avaliacaoDesejosIA.deleteMany({ where: { avaliacaoId } });
        } else {
          await prisma.avaliacaoDesejosIA.upsert({
            where: { avaliacaoId },
            create: { avaliacaoId, payload: normalized },
            update: { payload: normalized }
          });
        }
        desejosGravadosNoDb = true;
      } catch (e) {
        if (!isAvaliacaoDesejosIaUpsertFailureIgnorable(e)) throw e;
        avisoDesejosIa =
          'Os Desejos IA não foram gravados no servidor (tabela indisponível ou sem permissão na base). ' +
          'O restante foi salvo. Peça para aplicar a migração que cria a tabela AvaliacaoDesejosIA.';
        console.warn('[Avaliacao] Desejos IA não persistidos:', e.message);
      }
      if (
        !avisoDesejosIa &&
        rawDesejos != null &&
        typeof rawDesejos === 'object' &&
        !Array.isArray(rawDesejos) &&
        normalized == null &&
        Object.values(rawDesejos).some((v) => {
          if (Array.isArray(v)) return v.length > 0;
          if (typeof v === 'string') return v.trim().length > 0;
          return v != null && v !== '' && v !== false;
        })
      ) {
        avisoDesejosIa =
          'Desejos IA: nada foi gravado — os dados não passaram na validação (ex.: na 1ª pergunta use até 2 opções da lista ou preencha as perguntas abertas).';
      }
    }

    for (const resposta of listaRespostas) {
      if (!resposta || resposta.id == null) continue;
      const semInformacao = resposta.semInformacao === true;
      const pontuacao =
        semInformacao || resposta.pontuacao == null
          ? null
          : Math.min(5, Math.max(1, parseInt(resposta.pontuacao, 10)));
      await prisma.resposta.update({
        where: { id: resposta.id },
        data: {
          pontuacao,
          semInformacao,
          observacoes: resposta.observacoes
        }
      });
    }

    if (areasRecusadas.length > 0) {
      await prisma.resposta.updateMany({
        where: {
          avaliacaoId,
          pergunta: { areaId: { in: areasRecusadas } }
        },
        data: { pontuacao: null, semInformacao: false, observacoes: null }
      });
    }

    let avaliacaoAtualizada = await calcularScore(avaliacaoId);
    await registrarEventoAvaliacao({
      tipo: 'avaliacao_salva',
      avaliacaoId,
      projetoId: avaliacaoAtualizada?.projetoId || null,
      usuarioId: avaliacao.usuarioId,
      metadata: {
        respostasRecebidas: listaRespostas.length,
        areasRecusadas: areasRecusadas.length
      },
      req
    });
    if (
      desejosGravadosNoDb &&
      desejosNormalizadoSalvo != null &&
      avaliacaoAtualizada.desejosIA == null
    ) {
      try {
        const row = await prisma.avaliacaoDesejosIA.findUnique({ where: { avaliacaoId } });
        const payload = row?.payload ?? desejosNormalizadoSalvo;
        avaliacaoAtualizada = { ...avaliacaoAtualizada, desejosIA: payload };
      } catch (e) {
        if (!isMissingAvaliacaoDesejosIaTableError(e)) throw e;
        avaliacaoAtualizada = { ...avaliacaoAtualizada, desejosIA: desejosNormalizadoSalvo };
      }
      console.warn(
        '[Avaliacao] PUT respostas: desejosIA ausente no JSON após gravar; resposta recomposta a partir do banco ou do payload normalizado.'
      );
    }
    if (avisoDesejosIa) {
      res.json({ ...avaliacaoAtualizada, avisoDesejosIa });
    } else {
      res.json(avaliacaoAtualizada);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/avaliacoes/:id/finalizar', async (req, res) => {
  try {
    const incluirDesejosIaNoEmail = req.body?.incluirDesejosIaNoEmail !== false;
    const avaliacaoId = parseInt(req.params.id);
    const avaliacaoExistente = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      select: { id: true, usuarioId: true }
    });

    if (!avaliacaoExistente) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    if (!usuarioPodeAcessarAvaliacao(req, avaliacaoExistente)) {
      return res.status(403).json({ error: 'Acesso negado a esta avaliação' });
    }

    await calcularScore(avaliacaoId);

    const avaliacao = await updateAvaliacaoComMergeFallback(prisma, avaliacaoId, { status: 'finalizada' });
    await registrarEventoAvaliacao({
      tipo: 'avaliacao_revisada',
      avaliacaoId,
      projetoId: avaliacao?.projetoId || null,
      usuarioId: avaliacaoExistente.usuarioId,
      metadata: { origem: 'modal_revisao' },
      req
    });
    await registrarEventoAvaliacao({
      tipo: 'avaliacao_finalizada',
      avaliacaoId,
      projetoId: avaliacao?.projetoId || null,
      usuarioId: avaliacaoExistente.usuarioId,
      metadata: { incluirDesejosIaNoEmail },
      req
    });

    // Envia e-mail ao avaliador apenas com perguntas e respostas textuais (sem notas).
    // Não bloqueia a resposta caso o envio falhe — apenas registra o erro no log.
    (async () => {
      try {
        const respostasFormatadas = respostasParaCalculo(avaliacao)
          .filter(r => r.pontuacao !== null)
          .map(r => {
            const textoResposta =
              textoLinhaCriterioAvaliacao(r.pontuacao, r.pergunta?.criterios) ||
              'Resposta registrada.';
            return {
              area: r.pergunta?.area?.nome || 'Outras',
              pergunta: r.pergunta?.texto || `Pergunta #${r.perguntaId}`,
              textoResposta,
              observacoes: r.observacoes?.trim() || null
            };
          });

        const payloadDesejos = avaliacao.desejosIA ?? avaliacao.desejosIADados?.payload;
        const desejosExtras = incluirDesejosIaNoEmail ? desejosIaParaRespostasEmail(payloadDesejos) : [];
        const todasRespostasEmail = [...respostasFormatadas, ...desejosExtras];

        if (avaliacao.usuario?.email) {
          await enviarEmailResultadoAvaliacao({
            destinatarioEmail: avaliacao.usuario.email,
            destinatarioNome: avaliacao.usuario.nome,
            empresaNome: avaliacao.projeto?.empresa?.nome || '—',
            projetoNome: avaliacao.projeto?.nome || '—',
            respostas: todasRespostasEmail,
            dataConclusao: new Date().toLocaleString('pt-BR')
          });
        }
      } catch (emailErr) {
        console.error('[Finalizar Avaliação] Falha ao enviar e-mail de resultado:', emailErr.message);
      }
    })();

    res.json(avaliacao);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/avaliacoes/:id', async (req, res) => {
  try {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, usuarioId: true }
    });

    if (!avaliacao) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    if (!usuarioPodeAcessarAvaliacao(req, avaliacao)) {
      return res.status(403).json({ error: 'Acesso negado a esta avaliação' });
    }

    await prisma.avaliacao.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== RELATÓRIOS ====================

app.get('/api/relatorios/avaliacao/:id', async (req, res) => {
  try {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        projeto: { include: { empresa: true } },
        usuario: true,
        respostas: {
          include: {
            pergunta: { include: { area: true } }
          }
        }
      }
    });
    
    if (!avaliacao) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    if (!usuarioPodeAcessarAvaliacao(req, avaliacao)) {
      return res.status(403).json({ error: 'Acesso negado a esta avaliação' });
    }
    
    const areas = await prisma.area.findMany({ orderBy: { ordem: 'asc' } });
    
    const areasSelecionadas = avaliacao.areasSelecionadas 
      ? JSON.parse(avaliacao.areasSelecionadas) 
      : areas.map(a => a.id);
    
    const areasRecusadasIds = parseAreasRecusadas(avaliacao);
    
    const scoresPorArea = areas
      .filter(area => areasSelecionadas.includes(area.id) && !areasRecusadasIds.includes(area.id))
      .map(area => {
        const respostasArea = avaliacao.respostas.filter(
          r => r.pergunta.areaId === area.id && r.pontuacao !== null
        );
        
        const somapontos = respostasArea.reduce((acc, r) => acc + r.pontuacao, 0);
        const media = respostasArea.length > 0 ? somapontos / respostasArea.length : 0;
        
        return {
          areaId: area.id,
          area: area.nome,
          score: parseFloat(media.toFixed(2)),
          nivel: getNivelMaturidade(media),
          peso: area.peso,
          respondidas: respostasArea.length,
          total: 6
        };
      });
    
    const totalPeso = scoresPorArea.reduce((acc, item) => acc + item.peso, 0);
    const scoreGeral =
      totalPeso > 0
        ? scoresPorArea.reduce((acc, item) => acc + item.score * item.peso, 0) / totalPeso
        : 0;
    
    const logoMeta = await resolverLogoEmpresa(avaliacao.projeto.empresa);
    const relatorio = {
      avaliacao: {
        id: avaliacao.id,
        status: avaliacao.status,
        areasSelecionadas,
        areasRecusadas: areasRecusadasIds,
        createdAt: avaliacao.createdAt,
        updatedAt: avaliacao.updatedAt
      },
      projetoVersao: await obterVersaoDaAvaliacao(avaliacao),
      projeto: avaliacao.projeto,
      empresa: avaliacao.projeto.empresa,
      usuario: avaliacao.usuario,
      scoreGeral: parseFloat(scoreGeral.toFixed(2)),
      nivelGeral: getNivelMaturidade(scoreGeral),
      scoresPorArea: enriquecerScoresPorAreaComRegulatorio(scoresPorArea),
      resumoRegulatorio: resumoRegulatorioProjeto(scoresPorArea),
      respostas: avaliacao.respostas,
      ...logoMeta
    };
    
    res.json(relatorio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard consolidado por projeto (múltiplos avaliadores)
app.get('/api/dashboard/projeto/:id', async (req, res) => {
  try {
    const filtroNivelMax = parseFiltroNivelPrioridadeMapeamentoMaturidadeMax(req);
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        empresa: true,
        avaliacoes: {
          where: { status: 'finalizada' },
          include: {
            usuario: true,
            respostas: {
              include: {
                pergunta: { include: { area: true } }
              }
            }
          }
        }
      }
    });
    
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const areas = ordenarAreasPorFramework(
      await prisma.area.findMany({
        include: { perguntas: { orderBy: { numero: 'asc' } } },
        orderBy: { ordem: 'asc' }
      })
    );
    const todasAreaIds = areas.map((a) => a.id);
    const projetoVersao = await obterVersaoSelecionadaProjeto(req, projeto.id);
    const idsAvaliacaoVersao = await idsAvaliacoesDaVersao(projeto.id, projetoVersao.id);

    const avaliacoesFinalizadas = projeto.avaliacoes.filter((av) =>
      idsAvaliacaoVersao.has(Number(av.id)) &&
      usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(av.usuario, filtroNivelMax)
    );
    const totalAvaliadores = avaliacoesFinalizadas.length;

    if (totalAvaliadores === 0) {
      return res.json({
        projeto,
        projetoVersao,
        empresa: projeto.empresa,
        filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
        totalAvaliadores: 0,
        scoreGeral: 0,
        nivelGeral: 'Não avaliado',
        classificacao: 'Não avaliado',
        progresso: 0,
        prazoAvaliacao: extrairPrazoAvaliacaoProjeto(projeto),
        planoAcao: [],
        resumoComentarios: { totalComentarios: 0, areas: [] },
        comparativoAvaliacoes: {
          disponivel: false,
          mensagem: 'É necessário ter ao menos duas avaliações finalizadas no projeto.'
        },
        scoresPorArea: [],
        scoresPorEtapa: [],
        avaliadores: []
      });
    }
    
    const scoresPorArea = areas.map(area => {
      let somaScores = 0;
      let countAvaliacoes = 0;
      
      avaliacoesFinalizadas.forEach(avaliacao => {
        if (!areaContaParaAvaliacao(avaliacao, area.id, todasAreaIds)) {
          return;
        }
        const respostasArea = avaliacao.respostas.filter(
          r => r.pergunta.areaId === area.id && r.pontuacao !== null
        );
        
        if (respostasArea.length > 0) {
          const somapontos = respostasArea.reduce((acc, r) => acc + r.pontuacao, 0);
          const media = somapontos / respostasArea.length;
          somaScores += media;
          countAvaliacoes++;
        }
      });
      
      const mediaArea = countAvaliacoes > 0 ? somaScores / countAvaliacoes : 0;
      
      return {
        areaId: area.id,
        area: area.nome,
        score: parseFloat(mediaArea.toFixed(2)),
        nivel: getNivelMaturidade(mediaArea),
        avaliadoresCobriram: countAvaliacoes,
        totalAvaliadores
      };
    });
    
    const scoresPorEtapa = [];
    areas.forEach(area => {
      area.perguntas.forEach(pergunta => {
        let somaScores = 0;
        let countRespostas = 0;
        
        avaliacoesFinalizadas.forEach(avaliacao => {
          if (!areaContaParaAvaliacao(avaliacao, area.id, todasAreaIds)) return;
          const resposta = avaliacao.respostas.find(r => r.perguntaId === pergunta.id && r.pontuacao !== null);
          if (resposta) {
            somaScores += resposta.pontuacao;
            countRespostas++;
          }
        });
        
        const mediaEtapa = countRespostas > 0 ? somaScores / countRespostas : 0;
        
        scoresPorEtapa.push({
          perguntaId: pergunta.id,
          etapa: `${pergunta.numero}. ${pergunta.texto.substring(0, 30)}...`,
          etapaCompleta: pergunta.texto,
          areaId: area.id,
          areaNome: area.nome,
          score: parseFloat(mediaEtapa.toFixed(2)),
          nivel: getNivelMaturidade(mediaEtapa)
        });
      });
    });
    
    const areasComScore = scoresPorArea.filter(a => a.score > 0);
    const scoreGeral = areasComScore.length > 0
      ? areasComScore.reduce((acc, a) => acc + a.score, 0) / areasComScore.length
      : 0;
    
    const totalPerguntas = areas.reduce((acc, a) => acc + a.perguntas.length, 0);
    const perguntasRespondidas = scoresPorEtapa.filter(e => e.score > 0).length;
    const progresso = Math.round((perguntasRespondidas / totalPerguntas) * 100);
    
    // Calcular métricas MIT CISR
    const estagioMIT = getEstagioMitDeScore(scoreGeral);
    const eficaciaMIT = calcularEficaciaMIT(scoresPorArea);
    const maturidadeTiposIA = calcularMaturidadePorTipoIA(scoresPorArea);
    
    const logoMetaProjeto = await resolverLogoEmpresa(projeto.empresa);
    const dashboard = {
      projeto: {
        id: projeto.id,
        nome: projeto.nome,
        descricao: projeto.descricao,
        vertical: projeto.vertical
      },
      projetoVersao,
      empresa: projeto.empresa,
      filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
      totalAvaliadores,
      scoreGeral: parseFloat(scoreGeral.toFixed(2)),
      nivelGeral: getNivelMaturidade(scoreGeral),
      classificacao: getClassificacao(scoreGeral),
      
      // Métricas MIT CISR
      mitCISR: {
        estagio: estagioMIT,
        eficacia: eficaciaMIT,
        maturidadeTiposIA,
        referencia: mitCisrReferenciaDashboard()
      },
      
      progresso,
      prazoAvaliacao: extrairPrazoAvaliacaoProjeto(projeto),
      etapasAvaliadas: areasComScore.length,
      totalEtapas: areas.length,
      scoresPorArea: enriquecerScoresPorAreaComRegulatorio(scoresPorArea),
      scoresPorEtapa,
      planoAcao: gerarPlanoAcaoPorDimensao(scoresPorArea),
      resumoRegulatorio: resumoRegulatorioProjeto(scoresPorArea),
      resumoComentarios: gerarResumoComentariosAvaliacoes(avaliacoesFinalizadas),
      comparativoAvaliacoes: gerarComparativoAvaliacoesProjeto(avaliacoesFinalizadas, areas),
      avaliadores: avaliacoesFinalizadas.map((a) => ({
        id: a.usuario.id,
        nome: a.usuario.nome,
        email: a.usuario.email,
        nivelPrioridadeMapeamentoMaturidade:
          nivelPrioridadeMapeamentoMaturidadeDoUsuario(a.usuario),
        avaliacaoId: a.id,
        dataAvaliacao: a.updatedAt,
        areasSelecionadas: a.areasSelecionadas ? JSON.parse(a.areasSelecionadas) : areas.map((ar) => ar.id),
        areasRecusadas: parseAreasRecusadas(a),
        respostas: a.respostas.map((r) => ({
          id: r.id,
          perguntaId: r.perguntaId,
          pontuacao: r.pontuacao,
          observacoes: r.observacoes
        }))
      })),
      areas,
      ...logoMetaProjeto
    };

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard consolidado por empresa
app.get('/api/dashboard/empresa/:id', async (req, res) => {
  try {
    const filtroNivelMax = parseFiltroNivelPrioridadeMapeamentoMaturidadeMax(req);
    const empresa = await prisma.empresa.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        projetos: {
          include: {
            avaliacoes: {
              where: { status: 'finalizada' },
              include: {
                usuario: true,
                respostas: {
                  include: {
                    pergunta: { include: { area: true } }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    
    const areas = ordenarAreasPorFramework(
      await prisma.area.findMany({
        include: { perguntas: { orderBy: { numero: 'asc' } } },
        orderBy: { ordem: 'asc' }
      })
    );
    const todasAreaIdsEmpresa = areas.map((a) => a.id);

    const todasAvaliacoes = empresa.projetos
      .flatMap((p) => p.avaliacoes)
      .filter((av) =>
        usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(av.usuario, filtroNivelMax)
      );
    const totalAvaliadores = todasAvaliacoes.length;

    if (totalAvaliadores === 0) {
      return res.json({
        empresa,
        filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
        totalAvaliadores: 0,
        totalProjetos: empresa.projetos.length,
        scoreGeral: 0,
        nivelGeral: 'Não avaliado',
        classificacao: 'Não avaliado',
        progresso: 0,
        scoresPorArea: [],
        scoresPorEtapa: [],
        projetos: empresa.projetos.map(p => ({ id: p.id, nome: p.nome, vertical: p.vertical, avaliacoes: 0, score: 0 }))
      });
    }
    
    const scoresPorArea = areas.map(area => {
      let somaScores = 0;
      let countAvaliacoes = 0;
      
      todasAvaliacoes.forEach(avaliacao => {
        if (!areaContaParaAvaliacao(avaliacao, area.id, todasAreaIdsEmpresa)) {
          return;
        }
        const respostasArea = avaliacao.respostas.filter(
          r => r.pergunta.areaId === area.id && r.pontuacao !== null
        );
        
        if (respostasArea.length > 0) {
          const somapontos = respostasArea.reduce((acc, r) => acc + r.pontuacao, 0);
          const media = somapontos / respostasArea.length;
          somaScores += media;
          countAvaliacoes++;
        }
      });
      
      const mediaArea = countAvaliacoes > 0 ? somaScores / countAvaliacoes : 0;
      
      return {
        areaId: area.id,
        area: area.nome,
        score: parseFloat(mediaArea.toFixed(2)),
        nivel: getNivelMaturidade(mediaArea),
        avaliadoresCobriram: countAvaliacoes,
        totalAvaliadores
      };
    });
    
    const scoresPorEtapa = [];
    areas.forEach(area => {
      area.perguntas.forEach(pergunta => {
        let somaScores = 0;
        let countRespostas = 0;
        
        todasAvaliacoes.forEach(avaliacao => {
          if (!areaContaParaAvaliacao(avaliacao, area.id, todasAreaIdsEmpresa)) return;
          const resposta = avaliacao.respostas.find(r => r.perguntaId === pergunta.id && r.pontuacao !== null);
          if (resposta) {
            somaScores += resposta.pontuacao;
            countRespostas++;
          }
        });
        
        const mediaEtapa = countRespostas > 0 ? somaScores / countRespostas : 0;
        
        scoresPorEtapa.push({
          perguntaId: pergunta.id,
          etapa: `${pergunta.numero}. ${pergunta.texto.substring(0, 30)}...`,
          etapaCompleta: pergunta.texto,
          areaId: area.id,
          areaNome: area.nome,
          score: parseFloat(mediaEtapa.toFixed(2)),
          nivel: getNivelMaturidade(mediaEtapa)
        });
      });
    });
    
    const areasComScore = scoresPorArea.filter(a => a.score > 0);
    const scoreGeral = areasComScore.length > 0
      ? areasComScore.reduce((acc, a) => acc + a.score, 0) / areasComScore.length
      : 0;
    
    const totalPerguntas = areas.reduce((acc, a) => acc + a.perguntas.length, 0);
    const perguntasRespondidas = scoresPorEtapa.filter(e => e.score > 0).length;
    const progresso = Math.round((perguntasRespondidas / totalPerguntas) * 100);
    
    const projetosComScore = empresa.projetos.map((projeto) => {
      const avaliacoesProjeto = projeto.avaliacoes.filter((av) =>
        usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(av.usuario, filtroNivelMax)
      );
      if (avaliacoesProjeto.length === 0) {
        return { id: projeto.id, nome: projeto.nome, vertical: projeto.vertical, avaliacoes: 0, score: 0 };
      }

      let somaScores = 0;
      let count = 0;

      avaliacoesProjeto.forEach((avaliacao) => {
        const respostasComPontuacao = respostasParaCalculo(avaliacao).filter(r => r.pontuacao !== null);
        if (respostasComPontuacao.length > 0) {
          const media = respostasComPontuacao.reduce((acc, r) => acc + r.pontuacao, 0) / respostasComPontuacao.length;
          somaScores += media;
          count++;
        }
      });
      
      return {
        id: projeto.id,
        nome: projeto.nome,
        vertical: projeto.vertical,
        avaliacoes: avaliacoesProjeto.length,
        score: count > 0 ? parseFloat((somaScores / count).toFixed(2)) : 0
      };
    });
    
    // Calcular métricas MIT CISR
    const estagioMIT = getEstagioMitDeScore(scoreGeral);
    const eficaciaMIT = calcularEficaciaMIT(scoresPorArea);
    const maturidadeTiposIA = calcularMaturidadePorTipoIA(scoresPorArea);
    
    const logoMetaEmpresa = await resolverLogoEmpresa(empresa);
    const dashboard = {
      empresa,
      filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
      totalAvaliadores,
      totalProjetos: empresa.projetos.length,
      scoreGeral: parseFloat(scoreGeral.toFixed(2)),
      nivelGeral: getNivelMaturidade(scoreGeral),
      classificacao: getClassificacao(scoreGeral),
      
      // Métricas MIT CISR
      mitCISR: {
        estagio: estagioMIT,
        eficacia: eficaciaMIT,
        maturidadeTiposIA,
        referencia: mitCisrReferenciaDashboard()
      },
      
      progresso,
      etapasAvaliadas: areasComScore.length,
      totalEtapas: areas.length,
      scoresPorArea: enriquecerScoresPorAreaComRegulatorio(scoresPorArea),
      scoresPorEtapa,
      projetos: projetosComScore,
      resumoRegulatorio: resumoRegulatorioProjeto(scoresPorArea),
      avaliadores: todasAvaliacoes.map((a) => ({
        id: a.usuario.id,
        nome: a.usuario.nome,
        email: a.usuario.email,
        nivelPrioridadeMapeamentoMaturidade:
          nivelPrioridadeMapeamentoMaturidadeDoUsuario(a.usuario),
        avaliacaoId: a.id,
        dataAvaliacao: a.updatedAt,
        areasSelecionadas: a.areasSelecionadas ? JSON.parse(a.areasSelecionadas) : areas.map((ar) => ar.id),
        areasRecusadas: parseAreasRecusadas(a),
        respostas: a.respostas.map((r) => ({
          id: r.id,
          perguntaId: r.perguntaId,
          pontuacao: r.pontuacao,
          observacoes: r.observacoes
        }))
      })),
      areas,
      ...logoMetaEmpresa
    };

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// MÓDULO DE PRODUTO IA-FIRST (MIT CISR)
// ==========================================

// ==================== PERGUNTAS OBRIGATÓRIAS ====================

app.get('/api/perguntas-obrigatorias-produto', async (req, res) => {
  try {
    const perguntas = await prisma.perguntaObrigatoriaProduto.findMany({
      orderBy: { ordem: 'asc' }
    });
    res.json(perguntas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== VERTICAIS DE PRODUTO ====================

app.get('/api/verticais-produto', async (req, res) => {
  try {
    const verticais = await prisma.verticalProduto.findMany({
      include: {
        perguntas: {
          orderBy: { numero: 'asc' }
        }
      },
      orderBy: { ordem: 'asc' }
    });
    res.json(verticais);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/verticais-produto/:id', async (req, res) => {
  try {
    const vertical = await prisma.verticalProduto.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        perguntas: {
          orderBy: { numero: 'asc' }
        }
      }
    });
    if (!vertical) {
      return res.status(404).json({ error: 'Vertical não encontrada' });
    }
    res.json(vertical);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PRODUTOS ====================

app.get('/api/produtos', async (req, res) => {
  try {
    const { projetoId, empresaId } = req.query;
    let where = {};
    
    if (projetoId) {
      const pid = parseInt(projetoId, 10);
      if (!isNaN(pid) && pid > 0) {
        where.projetoId = pid;
      }
    }
    
    if (roleIsAdmin(req.usuario?.role)) {
      if (empresaId) {
        const eid = parseInt(empresaId, 10);
        if (!isNaN(eid) && eid > 0) {
          where.projeto = { ...(where.projeto || {}), empresaId: eid };
        }
      }
    } else {
      const eidUser = req.usuario.empresaId;
      if (eidUser == null || eidUser === undefined) {
        return res.status(403).json({ error: 'Usuário sem empresa vinculada.' });
      }
      where.projeto = { ...(where.projeto || {}), empresaId: Number(eidUser) };
    }
    
    const produtos = await prisma.produto.findMany({
      where,
      include: {
        projeto: { include: { empresa: true } },
        _count: { select: { avaliacoes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/produtos/:id', async (req, res) => {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        projeto: { include: { empresa: true } },
        vertical: true,
        arquiteturaReferencia: {
          select: {
            id: true,
            nome: true,
            tipoArquitetura: true,
            empresaId: true,
            ativo: true
          }
        },
        avaliacoes: {
          include: {
            usuario: true,
            respostasObrigatorias: {
              include: {
                perguntaObrigatoria: true
              }
            },
            respostasVerticais: {
              include: {
                perguntaProduto: {
                  include: { vertical: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    if (!roleIsAdmin(req.usuario?.role)) {
      const eidUser = req.usuario.empresaId;
      const eidProj = produto.projeto?.empresaId;
      if (eidUser == null || Number(eidProj) !== Number(eidUser)) {
        return res.status(403).json({ error: 'Sem permissão para acessar este produto.' });
      }
    }
    res.json(produto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/produtos/:id/avaliadores-status', async (req, res) => {
  try {
    const produtoId = parseInt(req.params.id, 10);
    if (isNaN(produtoId) || produtoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: { projeto: true }
    });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    if (!usuarioPodeGerenciarProduto(req, produto)) {
      return res.status(403).json({ error: 'Sem permissão para este produto.' });
    }
    const payload = await obterStatusAvaliadoresProduto(prisma, produtoId);
    res.json(payload);
  } catch (error) {
    console.error('produto avaliadores-status:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/produtos/:id/avaliadores/lembrete', async (req, res) => {
  try {
    const produtoId = parseInt(req.params.id, 10);
    const usuarioId = parseInt(req.body?.usuarioId, 10);
    if (isNaN(produtoId) || isNaN(usuarioId)) {
      return res.status(400).json({ error: 'usuarioId é obrigatório e deve ser válido' });
    }
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: { projeto: { include: { empresa: true } } }
    });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    if (!usuarioPodeGerenciarProduto(req, produto)) {
      return res.status(403).json({ error: 'Sem permissão para este produto.' });
    }
    try {
      const resultado = await enviarLembreteProdutoComAuditoria(prisma, {
        produtoId,
        usuarioId,
        enviadoPorUsuarioId: req.usuarioId,
        modo: 'individual'
      });
      res.json({ ok: true, email: resultado });
    } catch (err) {
      const msg = err?.message || String(err);
      if (
        msg.includes('não encontrado') ||
        msg.includes('Não há avaliação') ||
        msg.includes('finalizada')
      ) {
        return res.status(400).json({ error: msg });
      }
      throw err;
    }
  } catch (error) {
    console.error('lembrete produto:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/produtos/:id/avaliadores/lembrete-lote', async (req, res) => {
  try {
    const produtoId = parseInt(req.params.id, 10);
    if (isNaN(produtoId) || produtoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: { projeto: { include: { empresa: true } } }
    });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    if (!usuarioPodeGerenciarProduto(req, produto)) {
      return res.status(403).json({ error: 'Sem permissão para este produto.' });
    }
    const out = await executarLembreteLoteProduto(prisma, {
      produtoId,
      enviadoPorUsuarioId: req.usuarioId,
      modo: 'lote'
    });
    if (out.total === 0) {
      return res.json({
        ok: true,
        mensagem: 'Nenhum avaliador pendente para lembrete neste produto.',
        ...out
      });
    }
    res.json({ ok: true, ...out });
  } catch (error) {
    console.error('lembrete-lote produto:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/produtos/:id/avaliadores/lembretes-log', async (req, res) => {
  try {
    const produtoId = parseInt(req.params.id, 10);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    if (isNaN(produtoId) || produtoId <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: { projeto: true }
    });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    if (!usuarioPodeGerenciarProduto(req, produto)) {
      return res.status(403).json({ error: 'Sem permissão para este produto.' });
    }
    const logs = await prisma.logLembreteAvaliacao.findMany({
      where: { produtoId, escopoTipo: 'produto' },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/produtos', validate(produtoSchemas.criar), async (req, res) => {
  try {
    const { projetoId } = req.body;

    const projeto = await prisma.projeto.findUnique({ where: { id: projetoId } });
    if (!projeto) {
      return res.status(400).json({ error: 'Projeto não encontrado' });
    }
    if (!usuarioPodeIniciarCadastroProduto(req.usuario, projeto.empresaId)) {
      return res.status(403).json({ error: 'Sem permissão para cadastrar produto neste projeto (Negócios, TI, SysMap ou Administrador da mesma empresa).' });
    }

    const body = filtrarBodyProdutoPorPapel(req.usuario, projeto.empresaId, req.body);
    const iaMerged = mergeInformacoesAdicionais({}, body.informacoesAdicionaisEspecificacao ?? undefined);

    const arch = await resolverArquiteturaReferenciaProduto(body.arquiteturaReferenciaId, projeto.empresaId);
    if (!arch.ok) {
      return res.status(400).json({ error: arch.error });
    }

    const produto = await prisma.produto.create({
      data: {
        nome: body.nome,
        descricao: body.descricao || null,
        projetoId: body.projetoId,
        verticalId: body.verticalId || null,
        arquiteturaReferenciaId: arch.id,
        problemaResolve: body.problemaResolve || null,
        publicoAlvo: body.publicoAlvo || null,
        tecnologias: body.tecnologias || null,
        faseAtual: body.faseAtual || 'ideia',
        complexidade: body.complexidade || 'media',
        diferencialCompetitivo: body.diferencialCompetitivo || null,
        principaisRiscos: body.principaisRiscos || null,
        dependenciasExternas: body.dependenciasExternas || null,
        metricaPrincipal: body.metricaPrincipal || null,
        baselineAtual: body.baselineAtual || null,
        metaEsperada: body.metaEsperada || null,
        prazoMeta: body.prazoMeta ? new Date(body.prazoMeta) : null,
        custoHoraHomem: body.custoHoraHomem ? parseFloat(body.custoHoraHomem) : 150,
        produtividadeTradicional: body.produtividadeTradicional ? parseFloat(body.produtividadeTradicional) : 40,
        produtividadeAgentica: body.produtividadeAgentica ? parseFloat(body.produtividadeAgentica) : 120,
        custoEstimado: body.custoEstimado || null,
        retornoAnualEsperado: body.retornoAnualEsperado || null,
        dataInicioConstrucao: body.dataInicioConstrucao ? new Date(body.dataInicioConstrucao) : null,
        dataFimConstrucao: body.dataFimConstrucao ? new Date(body.dataFimConstrucao) : null,
        dataAtivacaoProducao: body.dataAtivacaoProducao ? new Date(body.dataAtivacaoProducao) : null,
        statusConstrucao: body.statusConstrucao || 'planejado',
        observacoesCronograma: body.observacoesCronograma || null,
        modeloCriacao: body.modeloCriacao === 'design_thinking' ? 'design_thinking' : 'convencional',
        informacoesAdicionaisEspecificacao: Object.keys(iaMerged).length ? iaMerged : undefined,
        ...(body.idealizacaoProduto !== undefined && body.idealizacaoProduto !== null
          ? {
              idealizacaoProduto: mergeIdealizacaoProduto({}, body.idealizacaoProduto)
            }
          : {})
      },
      include: {
        projeto: { include: { empresa: true } },
        vertical: true,
        arquiteturaReferencia: {
          select: { id: true, nome: true, tipoArquitetura: true, empresaId: true, ativo: true }
        }
      }
    });
    processarNotificacoesCadastroProduto(prisma, produto.id).catch((err) =>
      console.error('[produto workflow] notificação:', err)
    );
    res.status(201).json(produto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/produtos/:id', validate(produtoSchemas.atualizar), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const existente = await prisma.produto.findUnique({
      where: { id },
      include: { projeto: true }
    });
    if (!existente) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    const empresaIdProjeto = existente.projeto.empresaId;
    if (!usuarioMesmaEmpresaProjeto(req.usuario, empresaIdProjeto)) {
      return res.status(403).json({ error: 'Sem permissão para editar este produto.' });
    }

    const body = filtrarBodyProdutoPorPapel(req.usuario, empresaIdProjeto, req.body);

    const {
      nome, descricao, status, verticalId,
      problemaResolve, publicoAlvo, tecnologias, faseAtual, complexidade,
      diferencialCompetitivo, principaisRiscos, dependenciasExternas,
      metricaPrincipal, baselineAtual, metaEsperada, prazoMeta,
      custoHoraHomem, produtividadeTradicional, produtividadeAgentica, custoEstimado, retornoAnualEsperado,
      dataInicioConstrucao, dataFimConstrucao, dataAtivacaoProducao,
      statusConstrucao, observacoesCronograma,
      arquiteturaReferenciaId,
      informacoesAdicionaisEspecificacao,
      idealizacaoProduto,
      modeloCriacao
    } = body;

    const updateData = {};
    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao || null;
    if (status !== undefined) updateData.status = status;
    if (verticalId !== undefined) updateData.verticalId = verticalId || null;
    if (problemaResolve !== undefined) updateData.problemaResolve = problemaResolve || null;
    if (publicoAlvo !== undefined) updateData.publicoAlvo = publicoAlvo || null;
    if (tecnologias !== undefined) updateData.tecnologias = tecnologias || null;
    if (faseAtual !== undefined) updateData.faseAtual = faseAtual;
    if (complexidade !== undefined) updateData.complexidade = complexidade;
    if (diferencialCompetitivo !== undefined) updateData.diferencialCompetitivo = diferencialCompetitivo || null;
    if (principaisRiscos !== undefined) updateData.principaisRiscos = principaisRiscos || null;
    if (dependenciasExternas !== undefined) updateData.dependenciasExternas = dependenciasExternas || null;
    if (metricaPrincipal !== undefined) updateData.metricaPrincipal = metricaPrincipal || null;
    if (baselineAtual !== undefined) updateData.baselineAtual = baselineAtual || null;
    if (metaEsperada !== undefined) updateData.metaEsperada = metaEsperada || null;
    if (prazoMeta !== undefined) updateData.prazoMeta = prazoMeta ? new Date(prazoMeta) : null;
    if (custoHoraHomem !== undefined) updateData.custoHoraHomem = custoHoraHomem ? parseFloat(custoHoraHomem) : 150;
    if (produtividadeTradicional !== undefined) updateData.produtividadeTradicional = produtividadeTradicional ? parseFloat(produtividadeTradicional) : 40;
    if (produtividadeAgentica !== undefined) updateData.produtividadeAgentica = produtividadeAgentica ? parseFloat(produtividadeAgentica) : 120;
    if (custoEstimado !== undefined) updateData.custoEstimado = custoEstimado || null;
    if (retornoAnualEsperado !== undefined) updateData.retornoAnualEsperado = retornoAnualEsperado || null;
    if (dataInicioConstrucao !== undefined) updateData.dataInicioConstrucao = dataInicioConstrucao ? new Date(dataInicioConstrucao) : null;
    if (dataFimConstrucao !== undefined) updateData.dataFimConstrucao = dataFimConstrucao ? new Date(dataFimConstrucao) : null;
    if (dataAtivacaoProducao !== undefined) updateData.dataAtivacaoProducao = dataAtivacaoProducao ? new Date(dataAtivacaoProducao) : null;
    if (statusConstrucao !== undefined) updateData.statusConstrucao = statusConstrucao;
    if (observacoesCronograma !== undefined) updateData.observacoesCronograma = observacoesCronograma || null;
    if (arquiteturaReferenciaId !== undefined) {
      const arch = await resolverArquiteturaReferenciaProduto(arquiteturaReferenciaId, empresaIdProjeto);
      if (!arch.ok) {
        return res.status(400).json({ error: arch.error });
      }
      updateData.arquiteturaReferenciaId = arch.id;
    }
    if (informacoesAdicionaisEspecificacao !== undefined) {
      updateData.informacoesAdicionaisEspecificacao = mergeInformacoesAdicionais(
        existente.informacoesAdicionaisEspecificacao,
        informacoesAdicionaisEspecificacao
      );
    }
    if (idealizacaoProduto !== undefined) {
      updateData.idealizacaoProduto =
        idealizacaoProduto === null
          ? null
          : mergeIdealizacaoProduto(existente.idealizacaoProduto, idealizacaoProduto);
    }
    if (modeloCriacao !== undefined) {
      updateData.modeloCriacao =
        modeloCriacao === 'design_thinking' ? 'design_thinking' : 'convencional';
    }

    const produto = await prisma.produto.update({
      where: { id },
      data: updateData,
      include: {
        projeto: { include: { empresa: true } },
        vertical: true,
        arquiteturaReferencia: {
          select: { id: true, nome: true, tipoArquitetura: true, empresaId: true, ativo: true }
        }
      }
    });
    processarNotificacoesCadastroProduto(prisma, produto.id).catch((err) =>
      console.error('[produto workflow] notificação:', err)
    );
    res.json(produto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/produtos/:id/apoio-especificacao-ia
 * Usa a idealização (Design Thinking) para preencher informacoesAdicionaisEspecificacao e, opcionalmente, campos do produto.
 * Body: { modo?: 'tudo'|'texto'|'anexos'|'anexos_diagramas'|'anexos_artefatos', sobrescrever?, aplicarSugestoesAoProduto?, …flags legadas }
 */
app.post('/api/produtos/:id/apoio-especificacao-ia', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const produto = await prisma.produto.findUnique({
      where: { id },
      include: { projeto: { include: { empresa: true } } }
    });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    if (!usuarioMesmaEmpresaProjeto(req.usuario, produto.projeto?.empresaId)) {
      return res.status(403).json({ error: 'Sem permissão para este produto.' });
    }

    const result = await gerarApoioEspecificacaoDaIdealizacao(prisma, produto, req.body || {});
    res.json(result);
  } catch (error) {
    console.error('[apoio-especificacao-ia]', error);
    res.status(500).json({ error: error.message || 'Falha ao gerar apoio com IA' });
  }
});

app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const existente = await prisma.produto.findUnique({
      where: { id },
      include: { projeto: true }
    });
    if (!existente) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    if (!usuarioMesmaEmpresaProjeto(req.usuario, existente.projeto.empresaId)) {
      return res.status(403).json({ error: 'Sem permissão para excluir este produto.' });
    }
    await prisma.produto.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== AVALIAÇÕES DE PRODUTO ====================

app.get('/api/avaliacoes-produto', async (req, res) => {
  try {
    const { produtoId, projetoId } = req.query;
    let where = {};
    
    if (produtoId) {
      where.produtoId = parseInt(produtoId);
    }
    
    if (projetoId) {
      where.produto = { projetoId: parseInt(projetoId) };
    }

    if (!roleIsAdmin(req.usuario?.role)) {
      where.usuarioId = req.usuario.id;
    }
    
    const avaliacoes = await prisma.avaliacaoProduto.findMany({
      where,
      include: {
        produto: { include: { projeto: true } },
        usuario: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(avaliacoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/avaliacoes-produto/:id', async (req, res) => {
  try {
    let avaliacao = await prisma.avaliacaoProduto.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        produto: { 
          include: { 
            projeto: { include: { empresa: true } }
          } 
        },
        usuario: true,
        respostasObrigatorias: {
          include: {
            perguntaObrigatoria: true
          },
          orderBy: { perguntaObrigatoria: { ordem: 'asc' } }
        },
        respostasVerticais: {
          include: {
            perguntaProduto: {
              include: { vertical: true }
            }
          }
        }
      }
    });
    if (!avaliacao) {
      return res.status(404).json({ error: 'Avaliação de produto não encontrada' });
    }

    if (!usuarioPodeAcessarAvaliacaoProduto(req, avaliacao)) {
      return res.status(403).json({ error: 'Acesso negado a esta avaliação' });
    }
    
    // Buscar perguntas obrigatórias universais
    const perguntasObrigatorias = await prisma.perguntaObrigatoriaProduto.findMany({
      orderBy: { ordem: 'asc' }
    });
    
    // Verificar se há respostas obrigatórias criadas para esta avaliação
    // Se não houver (avaliação criada antes das perguntas obrigatórias), criar agora
    if (avaliacao.respostasObrigatorias.length === 0 && perguntasObrigatorias.length > 0) {
      console.log(`Criando respostas obrigatórias para avaliação ${avaliacao.id}...`);
      
      for (const pergunta of perguntasObrigatorias) {
        await prisma.respostaObrigatoriaProduto.create({
          data: {
            avaliacaoProdutoId: avaliacao.id,
            perguntaObrigatoriaId: pergunta.id
          }
        });
      }
      
      // Recarregar avaliação com as novas respostas
      avaliacao = await prisma.avaliacaoProduto.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          produto: { 
            include: { 
              projeto: { include: { empresa: true } }
            } 
          },
          usuario: true,
          respostasObrigatorias: {
            include: {
              perguntaObrigatoria: true
            },
            orderBy: { perguntaObrigatoria: { ordem: 'asc' } }
          },
          respostasVerticais: {
            include: {
              perguntaProduto: {
                include: { vertical: true }
              }
            }
          }
        }
      });
    }
    
    const verticaisSelecionadas = avaliacao.verticaisSelecionadas 
      ? JSON.parse(avaliacao.verticaisSelecionadas)
      : null;
    
    let verticais;
    if (verticaisSelecionadas && verticaisSelecionadas.length > 0) {
      verticais = await prisma.verticalProduto.findMany({
        where: { id: { in: verticaisSelecionadas } },
        include: { 
          perguntas: { 
            orderBy: { numero: 'asc' } 
          } 
        },
        orderBy: { ordem: 'asc' }
      });
    } else {
      verticais = await prisma.verticalProduto.findMany({
        include: { 
          perguntas: { 
            orderBy: { numero: 'asc' } 
          } 
        },
        orderBy: { ordem: 'asc' }
      });
    }
    
    res.json({
      ...avaliacao,
      perguntasObrigatorias,
      verticais,
      verticaisSelecionadasIds: verticaisSelecionadas
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/avaliacoes-produto', async (req, res) => {
  try {
    const { produtoId, usuarioId, verticalIds } = req.body;
    
    const produtoIdInt = parseInt(produtoId);
    const usuarioIdInt = parseInt(usuarioId);
    
    if (isNaN(produtoIdInt) || isNaN(usuarioIdInt)) {
      return res.status(400).json({ error: 'produtoId e usuarioId são obrigatórios' });
    }

    if (!roleIsAdmin(req.usuario?.role) && usuarioIdInt !== req.usuario.id) {
      return res.status(403).json({ error: 'Você só pode criar avaliações para o seu próprio usuário' });
    }
    
    // Buscar perguntas obrigatórias universais (sempre aplicadas)
    const perguntasObrigatorias = await prisma.perguntaObrigatoriaProduto.findMany({
      orderBy: { ordem: 'asc' }
    });
    
    const verticalIdsArray = Array.isArray(verticalIds) ? verticalIds.map(id => parseInt(id)) : [];
    
    let perguntasVerticais;
    if (verticalIdsArray.length > 0) {
      perguntasVerticais = await prisma.perguntaProduto.findMany({
        where: { verticalId: { in: verticalIdsArray } },
        include: { vertical: true },
        orderBy: [
          { vertical: { ordem: 'asc' } },
          { numero: 'asc' }
        ]
      });
    } else {
      perguntasVerticais = await prisma.perguntaProduto.findMany({
        include: { vertical: true },
        orderBy: [
          { vertical: { ordem: 'asc' } },
          { numero: 'asc' }
        ]
      });
    }
    
    const avaliacao = await prisma.avaliacaoProduto.create({
      data: {
        produtoId: produtoIdInt,
        usuarioId: usuarioIdInt,
        verticaisSelecionadas: verticalIdsArray.length > 0 ? JSON.stringify(verticalIdsArray) : null,
        respostasObrigatorias: {
          create: perguntasObrigatorias.map(p => ({
            perguntaObrigatoriaId: p.id
          }))
        },
        respostasVerticais: {
          create: perguntasVerticais.map(p => ({
            perguntaProdutoId: p.id
          }))
        }
      },
      include: {
        produto: { 
          include: { 
            projeto: { include: { empresa: true } }
          } 
        },
        usuario: true,
        respostasObrigatorias: {
          include: { perguntaObrigatoria: true },
          orderBy: { perguntaObrigatoria: { ordem: 'asc' } }
        },
        respostasVerticais: {
          include: { 
            perguntaProduto: { 
              include: { vertical: true } 
            } 
          }
        }
      }
    });
    
    res.status(201).json(avaliacao);
  } catch (error) {
    console.error('Erro ao criar avaliação de produto:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/avaliacoes-produto/:id/respostas', async (req, res) => {
  try {
    const avaliacaoPerm = await prisma.avaliacaoProduto.findUnique({
      where: { id: parseInt(req.params.id) },
      select: { id: true, usuarioId: true }
    });

    if (!avaliacaoPerm) {
      return res.status(404).json({ error: 'Avaliação de produto não encontrada' });
    }

    if (!usuarioPodeAcessarAvaliacaoProduto(req, avaliacaoPerm)) {
      return res.status(403).json({ error: 'Acesso negado a esta avaliação' });
    }

    const { respostasObrigatorias, respostasVerticais } = req.body;
    
    // Atualizar respostas obrigatórias
    if (respostasObrigatorias && respostasObrigatorias.length > 0) {
      for (const resposta of respostasObrigatorias) {
        await prisma.respostaObrigatoriaProduto.update({
          where: { id: resposta.id },
          data: {
            pontuacao: resposta.pontuacao,
            observacoes: resposta.observacoes
          }
        });
      }
    }
    
    // Atualizar respostas das verticais
    if (respostasVerticais && respostasVerticais.length > 0) {
      for (const resposta of respostasVerticais) {
        await prisma.respostaProduto.update({
          where: { id: resposta.id },
          data: {
            pontuacao: resposta.pontuacao,
            observacoes: resposta.observacoes
          }
        });
      }
    }
    
    const avaliacaoAtualizada = await calcularScoreProduto(parseInt(req.params.id));
    res.json(avaliacaoAtualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/avaliacoes-produto/:id/finalizar', async (req, res) => {
  try {
    const avaliacaoId = parseInt(req.params.id);

    const avaliacaoExistente = await prisma.avaliacaoProduto.findUnique({
      where: { id: avaliacaoId },
      select: { id: true, usuarioId: true }
    });

    if (!avaliacaoExistente) {
      return res.status(404).json({ error: 'Avaliação de produto não encontrada' });
    }

    if (!usuarioPodeAcessarAvaliacaoProduto(req, avaliacaoExistente)) {
      return res.status(403).json({ error: 'Acesso negado a esta avaliação' });
    }
    
    // 1. Calcular os scores da avaliação
    await calcularScoreProduto(avaliacaoId);
    
    // 2. Marcar a avaliação como finalizada
    const avaliacao = await prisma.avaliacaoProduto.update({
      where: { id: avaliacaoId },
      data: { status: 'finalizada' },
      include: {
        produto: { 
          include: { 
            projeto: { include: { empresa: true } }
          } 
        },
        usuario: true,
        respostasObrigatorias: {
          include: { perguntaObrigatoria: true },
          orderBy: { perguntaObrigatoria: { ordem: 'asc' } }
        },
        respostasVerticais: {
          include: { perguntaProduto: { include: { vertical: true } } }
        }
      }
    });
    
    // 3. AGORA atualizar o score do produto (depois que a avaliação está finalizada)
    await atualizarScoreProduto(avaliacao.produtoId);
    
    // 4. Atualizar a classificação de todos os produtos do projeto
    await atualizarClassificacaoProdutos(avaliacao.produto.projetoId);

    // 5. Snapshot regulatório (Semana 2) — classificação PL 2338 / ISO / LGPD
    let regulatorySnapshot = null;
    try {
      regulatorySnapshot = await calculateRegulatorySnapshot(prisma, avaliacao.produtoId);
    } catch (regErr) {
      console.warn('[regulatorio] Snapshot não calculado ao finalizar produto:', regErr?.message || regErr);
    }
    
    // Buscar avaliação atualizada com produto atualizado
    const avaliacaoFinal = await prisma.avaliacaoProduto.findUnique({
      where: { id: avaliacaoId },
      include: {
        produto: { 
          include: { 
            projeto: { include: { empresa: true } }
          } 
        },
        usuario: true,
        respostasObrigatorias: {
          include: { perguntaObrigatoria: true },
          orderBy: { perguntaObrigatoria: { ordem: 'asc' } }
        },
        respostasVerticais: {
          include: { perguntaProduto: { include: { vertical: true } } }
        }
      }
    });
    
    res.json({ ...avaliacaoFinal, regulatorySnapshot });
  } catch (error) {
    console.error('Erro ao finalizar avaliação:', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/avaliacoes-produto/:id', async (req, res) => {
  try {
    const avaliacao = await prisma.avaliacaoProduto.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { produto: true }
    });

    if (!avaliacao) {
      return res.status(404).json({ error: 'Avaliação de produto não encontrada' });
    }

    if (!usuarioPodeAcessarAvaliacaoProduto(req, avaliacao)) {
      return res.status(403).json({ error: 'Acesso negado a esta avaliação' });
    }
    
    await prisma.avaliacaoProduto.delete({
      where: { id: parseInt(req.params.id) }
    });
    
    if (avaliacao) {
      await atualizarClassificacaoProdutos(avaliacao.produto.projetoId);
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== DASHBOARD DE PRODUTO ====================

app.get('/api/dashboard/produto/:id', async (req, res) => {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        projeto: { include: { empresa: true } },
        avaliacoes: {
          where: { status: 'finalizada' },
          include: {
            usuario: true,
            respostasObrigatorias: {
              include: { perguntaObrigatoria: true }
            },
            respostasVerticais: {
              include: { 
                perguntaProduto: { 
                  include: { vertical: true } 
                } 
              }
            }
          }
        }
      }
    });
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Buscar todos os produtos do projeto para calcular ranking
    const todosProdutosProjeto = await prisma.produto.findMany({
      where: { 
        projetoId: produto.projetoId,
        scoreRelevancia: { not: null, gt: 0 }
      },
      orderBy: { scoreRelevancia: 'desc' }
    });
    
    // Buscar perguntas obrigatórias
    const perguntasObrigatorias = await prisma.perguntaObrigatoriaProduto.findMany({
      orderBy: { ordem: 'asc' }
    });
    
    const verticais = await prisma.verticalProduto.findMany({
      include: { perguntas: { orderBy: { numero: 'asc' } } },
      orderBy: { ordem: 'asc' }
    });
    
    const avaliacoesFinalizadas = produto.avaliacoes;
    const totalAvaliadores = avaliacoesFinalizadas.length;
    
    // Calcular posição no ranking do projeto
    const posicaoRanking = todosProdutosProjeto.findIndex(p => p.id === produto.id) + 1;
    const totalProdutosAvaliados = todosProdutosProjeto.length;
    
    if (totalAvaliadores === 0) {
      return res.json({
        produto: {
          id: produto.id,
          nome: produto.nome,
          descricao: produto.descricao,
          status: produto.status,
          scoreRelevancia: 0,
          scoreObrigatorio: 0,
          scoreVerticais: 0,
          scoreBlueprint: produto.scoreBlueprint || 0,
          scorePrioridadeEstrategica: produto.scorePrioridadeEstrategica || 0,
          classificacao: produto.classificacao,
          custoEstimado: produto.custoEstimado,
          retornoAnualEsperado: produto.retornoAnualEsperado,
          dataInicioConstrucao: produto.dataInicioConstrucao,
          dataFimConstrucao: produto.dataFimConstrucao,
          dataAtivacaoProducao: produto.dataAtivacaoProducao,
          statusConstrucao: produto.statusConstrucao || 'planejado',
          observacoesCronograma: produto.observacoesCronograma,
          roiIndividual: produto.custoEstimado > 0 ? parseFloat(((produto.retornoAnualEsperado || 0) / produto.custoEstimado * 100).toFixed(1)) : 0,
          paybackMeses: produto.retornoAnualEsperado > 0 ? Math.ceil((produto.custoEstimado || 0) / (produto.retornoAnualEsperado / 12)) : null
        },
        projeto: produto.projeto,
        empresa: produto.projeto.empresa,
        ranking: {
          posicao: 0,
          totalProdutos: totalProdutosAvaliados,
          outrosProdutos: todosProdutosProjeto.map(p => ({
            id: p.id,
            nome: p.nome,
            scoreRelevancia: p.scoreRelevancia,
            classificacao: p.classificacao
          }))
        },
        totalAvaliadores: 0,
        scoreRelevancia: 0,
        scoreObrigatorio: 0,
        scoreVerticais: 0,
        nivelRelevancia: 'Não avaliado',
        nivelTransformacao: 'Não avaliado',
        scoresPorPerguntaObrigatoria: [],
        scoresPorVertical: [],
        scoresPorCategoria: [],
        avaliadores: [],
        verticais,
        perguntasObrigatorias
      });
    }
    
    // Calcular scores das perguntas obrigatórias (Transformação Agêntica)
    const scoresPorPerguntaObrigatoria = perguntasObrigatorias.map(pergunta => {
      let somaScores = 0;
      let countRespostas = 0;
      
      avaliacoesFinalizadas.forEach(avaliacao => {
        const resposta = avaliacao.respostasObrigatorias?.find(
          r => r.perguntaObrigatoriaId === pergunta.id && r.pontuacao !== null
        );
        if (resposta) {
          somaScores += resposta.pontuacao;
          countRespostas++;
        }
      });
      
      return {
        perguntaId: pergunta.id,
        numero: pergunta.numero,
        categoria: pergunta.categoria,
        texto: pergunta.texto,
        peso: pergunta.peso,
        score: countRespostas > 0 ? parseFloat((somaScores / countRespostas).toFixed(2)) : 0,
        respostas: countRespostas,
        totalAvaliadores
      };
    });
    
    // Calcular score obrigatório ponderado
    let scoreObrigatorio = 0;
    let pesoTotalObrigatorio = 0;
    scoresPorPerguntaObrigatoria.forEach(p => {
      if (p.score > 0) {
        scoreObrigatorio += p.score * p.peso;
        pesoTotalObrigatorio += p.peso;
      }
    });
    if (pesoTotalObrigatorio > 0) {
      scoreObrigatorio = scoreObrigatorio / pesoTotalObrigatorio;
    }
    
    const scoresPorVertical = verticais.map(vertical => {
      const perguntasVertical = vertical.perguntas.map(pergunta => {
        let somaScores = 0;
        let countRespostas = 0;
        
        avaliacoesFinalizadas.forEach(avaliacao => {
          const resposta = avaliacao.respostasVerticais.find(
            r => r.perguntaProdutoId === pergunta.id && r.pontuacao !== null
          );
          if (resposta) {
            somaScores += resposta.pontuacao;
            countRespostas++;
          }
        });
        
        return {
          perguntaId: pergunta.id,
          numero: pergunta.numero,
          categoria: pergunta.categoria,
          texto: pergunta.texto,
          score: countRespostas > 0 ? parseFloat((somaScores / countRespostas).toFixed(2)) : 0,
          respostas: countRespostas,
          totalAvaliadores
        };
      });
      
      const perguntasComScore = perguntasVertical.filter(p => p.score > 0);
      const scoreVertical = perguntasComScore.length > 0
        ? perguntasComScore.reduce((acc, p) => acc + p.score, 0) / perguntasComScore.length
        : 0;
      
      return {
        verticalId: vertical.id,
        nome: vertical.nome,
        icone: vertical.icone,
        foco: vertical.foco,
        score: parseFloat(scoreVertical.toFixed(2)),
        nivel: getNivelRelevancia(scoreVertical),
        perguntas: perguntasVertical
      };
    });
    
    // Calcular score das verticais (média simples)
    const verticaisComScore = scoresPorVertical.filter(v => v.score > 0);
    const scoreVerticais = verticaisComScore.length > 0
      ? verticaisComScore.reduce((acc, v) => acc + v.score, 0) / verticaisComScore.length
      : 0;
    
    const categorias = ['ROI e Redução de Custos', 'Automação Agêntica', 'APIs e Aceleradores'];
    const scoresPorCategoria = categorias.map(categoria => {
      let somaTotal = 0;
      let countTotal = 0;
      
      scoresPorVertical.forEach(v => {
        const pergunta = v.perguntas.find(p => p.categoria === categoria);
        if (pergunta && pergunta.score > 0) {
          somaTotal += pergunta.score;
          countTotal++;
        }
      });
      
      const mediaCategoria = countTotal > 0 ? somaTotal / countTotal : 0;
      
      return {
        categoria,
        score: parseFloat(mediaCategoria.toFixed(2)),
        nivel: getNivelRelevancia(mediaCategoria),
        totalVerticais: countTotal
      };
    });
    
    // Score de Relevância Final: 60% Obrigatório + 40% Verticais
    let scoreRelevancia = 0;
    if (pesoTotalObrigatorio > 0 && verticaisComScore.length > 0) {
      scoreRelevancia = (scoreObrigatorio * 0.6) + (scoreVerticais * 0.4);
    } else if (pesoTotalObrigatorio > 0) {
      scoreRelevancia = scoreObrigatorio;
    } else if (verticaisComScore.length > 0) {
      scoreRelevancia = scoreVerticais;
    }
    
    // Determinar nível de transformação agêntica
    const getNivelTransformacao = (score) => {
      if (score < 2.0) return '❌ Não é Transformação Agêntica';
      if (score < 3.0) return '🟡 Elementos Agênticos Básicos';
      if (score < 4.0) return '🟠 Transformação Moderada';
      if (score < 4.5) return '🟢 Transformação Significativa';
      return '🚀 Transformação Transformacional';
    };
    
    const logoMetaProduto = await resolverLogoEmpresa(produto.projeto?.empresa);
    let regulatorySnapshot = await obterRegulatorySnapshotProduto(prisma, produto.id);
    if (!regulatorySnapshot && totalAvaliadores > 0) {
      try {
        regulatorySnapshot = await calculateRegulatorySnapshot(prisma, produto.id);
      } catch {
        /* sem snapshot se cálculo falhar */
      }
    }

    let regulatorioCiclos = null;
    if (regulatorySnapshot) {
      try {
        regulatorioCiclos = await listarCiclosProduto(prisma, produto.id);
      } catch {
        /* ciclo opcional */
      }
    }

    const dashboard = {
      produto: {
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao,
        status: produto.status,
        scoreRelevancia: parseFloat(scoreRelevancia.toFixed(2)),
        scoreObrigatorio: parseFloat(scoreObrigatorio.toFixed(2)),
        scoreVerticais: parseFloat(scoreVerticais.toFixed(2)),
        scoreBlueprint: produto.scoreBlueprint || 0,
        scorePrioridadeEstrategica: produto.scorePrioridadeEstrategica || 0,
        classificacao: produto.classificacao,
        custoEstimado: produto.custoEstimado,
        retornoAnualEsperado: produto.retornoAnualEsperado,
        dataInicioConstrucao: produto.dataInicioConstrucao,
        dataFimConstrucao: produto.dataFimConstrucao,
        dataAtivacaoProducao: produto.dataAtivacaoProducao,
        statusConstrucao: produto.statusConstrucao || 'planejado',
        observacoesCronograma: produto.observacoesCronograma,
        roiIndividual: produto.custoEstimado > 0 ? parseFloat(((produto.retornoAnualEsperado || 0) / produto.custoEstimado * 100).toFixed(1)) : 0,
        paybackMeses: produto.retornoAnualEsperado > 0 ? Math.ceil((produto.custoEstimado || 0) / (produto.retornoAnualEsperado / 12)) : null
      },
      projeto: produto.projeto,
      empresa: produto.projeto.empresa,
      ranking: {
        posicao: posicaoRanking,
        totalProdutos: totalProdutosAvaliados,
        outrosProdutos: todosProdutosProjeto.map(p => ({
          id: p.id,
          nome: p.nome,
          scoreRelevancia: p.scoreRelevancia,
          classificacao: p.classificacao,
          isAtual: p.id === produto.id
        }))
      },
      totalAvaliadores,
      scoreRelevancia: parseFloat(scoreRelevancia.toFixed(2)),
      scoreObrigatorio: parseFloat(scoreObrigatorio.toFixed(2)),
      scoreVerticais: parseFloat(scoreVerticais.toFixed(2)),
      nivelRelevancia: getNivelRelevancia(scoreRelevancia),
      nivelTransformacao: getNivelTransformacao(scoreObrigatorio),
      scoresPorPerguntaObrigatoria,
      scoresPorVertical,
      scoresPorCategoria,
      avaliadores: avaliacoesFinalizadas.map(a => ({
        id: a.usuario.id,
        nome: a.usuario.nome,
        email: a.usuario.email,
        avaliacaoId: a.id,
        dataAvaliacao: a.updatedAt,
        scoreRelevancia: a.scoreRelevancia,
        scoreObrigatorio: a.scoreObrigatorio,
        scoreVerticais: a.scoreVerticais
      })),
      verticais,
      perguntasObrigatorias,
      regulatorySnapshot,
      regulatorioCiclos,
      ...logoMetaProduto
    };
    
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/produtos-projeto/:id', async (req, res) => {
  try {
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        empresa: true,
        produtos: {
          include: {
            vertical: true,
            avaliacoes: {
              where: { status: 'finalizada' },
              include: {
                usuario: true
              }
            }
          },
          orderBy: [
            { classificacao: 'asc' },
            { scoreRelevancia: 'desc' }
          ]
        }
      }
    });
    
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const verticais = await prisma.verticalProduto.findMany({
      orderBy: { ordem: 'asc' }
    });
    
    const produtosComDados = projeto.produtos.map(produto => ({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      status: produto.status,
      vertical: produto.vertical,
      scoreRelevancia: produto.scoreRelevancia || 0,
      scoreBlueprint: produto.scoreBlueprint || 0,
      scorePrioridadeEstrategica: produto.scorePrioridadeEstrategica || 0,
      classificacao: produto.classificacao,
      totalAvaliacoes: produto.avaliacoes.length,
      avaliadores: produto.avaliacoes.map(a => ({
        id: a.usuario.id,
        nome: a.usuario.nome
      }))
    }));
    
    const logoMetaProdutosProjeto = await resolverLogoEmpresa(projeto.empresa);
    const dashboard = {
      projeto: {
        id: projeto.id,
        nome: projeto.nome,
        descricao: projeto.descricao,
        vertical: projeto.vertical
      },
      empresa: projeto.empresa,
      totalProdutos: projeto.produtos.length,
      produtosAvaliados: projeto.produtos.filter(p => p.scoreRelevancia > 0).length,
      produtos: produtosComDados,
      verticais,
      ...logoMetaProdutosProjeto
    };
    
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RELATÓRIO EXECUTIVO IA (MIT) ====================
// Gera relatório executivo usando IA com prompt validado por professor do MIT
// Por padrão, retorna a última versão SALVA se existir (?reuse=false força nova geração)
app.post('/api/dashboard/projeto/:id/relatorio-ia', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id);
    const reuse = req.query.reuse !== 'false'; // default: true
    const filtroNivelMax = parseFiltroNivelPrioridadeMapeamentoMaturidadeMax(req);
    const projetoVersao = await obterVersaoSelecionadaProjeto(req, projetoId);
    
    // Se reuse=true, tenta retornar versão mais recente já salva (mesmo filtro de prioridade)
    if (reuse) {
      const ultimoSalvo = await prisma.relatorioIA.findFirst({
        where: { projetoId, tipo: 'executivo' },
        orderBy: { createdAt: 'desc' }
      });
      
      if (ultimoSalvo) {
        const dadosSnap = ultimoSalvo.dadosSnapshot
          ? JSON.parse(ultimoSalvo.dadosSnapshot)
          : null;
        if (
          filtroNivelRelatorioIACompativel(dadosSnap, filtroNivelMax) &&
          Number(dadosSnap?.projetoVersao?.id || 0) === Number(projetoVersao?.id || 0)
        ) {
          console.log(`[Relatório IA] Reusando versão salva ${ultimoSalvo.id} (v${ultimoSalvo.versao}) para projeto ${projetoId}`);
          const empresaAtual = await prisma.projeto.findUnique({
            where: { id: projetoId },
            select: { empresa: { select: { id: true, logoPath: true } } }
          });
          return res.json({
            relatorio: ultimoSalvo.conteudoMd,
            provider: ultimoSalvo.provider,
            model: ultimoSalvo.modelo,
            tokens: {
              entrada: ultimoSalvo.tokensEntrada,
              saida: ultimoSalvo.tokensSaida
            },
            tempoResposta: ultimoSalvo.tempoGeracaoMs,
            dadosUsados: await enriquecerDadosUsadosComLogo(dadosSnap, empresaAtual?.empresa),
            relatorioSalvoId: ultimoSalvo.id,
            versao: ultimoSalvo.versao,
            dataGeracao: ultimoSalvo.createdAt,
            fromCache: true,
            filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
            projetoVersao
          });
        }
      }
    }
    
    // Buscar dados completos do projeto
    const projeto = await prisma.projeto.findUnique({
      where: { id: projetoId },
      include: {
        empresa: true,
        avaliacoes: {
          where: { status: 'finalizada' },
          include: {
            usuario: true,
            respostas: {
              include: {
                pergunta: { include: { area: true } }
              }
            }
          }
        }
      }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const idsAvaliacaoVersao = await idsAvaliacoesDaVersao(projetoId, projetoVersao.id);
    const avaliacoesFiltradas = projeto.avaliacoes.filter((av) =>
      idsAvaliacaoVersao.has(Number(av.id)) &&
      usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(av.usuario, filtroNivelMax)
    );

    if (avaliacoesFiltradas.length === 0) {
      return res.status(400).json({
        error:
          projeto.avaliacoes.length === 0
            ? 'Não há avaliações finalizadas para gerar o relatório'
            : 'Não há avaliações finalizadas no filtro de prioridade selecionado ou na versão selecionada.',
        filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
        projetoVersao
      });
    }

    const areas = ordenarAreasPorFramework(
      await prisma.area.findMany({
        include: { perguntas: { orderBy: { numero: 'asc' } } },
        orderBy: { ordem: 'asc' }
      })
    );

    const {
      scoresPorArea: areasComScore,
      todasDimensoes,
      scoreGeral
    } = calcularScoresConsolidadoMaturidade(avaliacoesFiltradas, areas);
    const dimensoesRelatorio = todasDimensoes;
    const scoresPorArea = areasComScore.map((a) => ({ area: a.area, score: a.score }));
    const blocoAvaliadoresExec = blocoAvaliadoresConsolidadoMarkdown(
      avaliacoesFiltradas,
      filtroNivelMax
    );
    const optsCapaAvaliadores = {
      filtroMax: filtroNivelMax,
      avaliacoesFiltradas,
      empresaNome: projeto.empresa.nome,
      projetoNome: projeto.nome
    };

    const nivel = nivelNumericoDeScore(scoreGeral);
    const nomesNivel = NOMES_NIVEL_BLUEPRINT;
    const comparativoVersoes = await montarComparativoVersoesProjeto(prisma, {
      projetoId,
      versaoAtualId: projetoVersao.id,
      avaliacoesFinalizadas: projeto.avaliacoes,
      areas,
      filtroNivelMax,
      usuarioIncluidoNoFiltro: usuarioIncluidoNoFiltroNivelMapeamentoMaturidade
    });
    const blocoEvolucaoVersoes = blocoEvolucaoVersoesMarkdown(comparativoVersoes);
    const blocoLogicaMaturidade = blocoLogicaMaturidadeMarkdown({ scoreGeral, nomesNivel, nivel });

    // Top 3 e Bottom 3
    const ordenados = [...scoresPorArea].sort((a, b) => b.score - a.score);
    const top3 = ordenados.slice(0, 3);
    const bottom3 = ordenados.slice(-3).reverse();

    // Benchmark do setor
    const setor = projeto.vertical || projeto.empresa.setor || 'Geral';
    const mediaSetor = {
      'fintech': 3.2, 'financeiro': 3.2, 'banco': 3.2,
      'saude': 2.6, 'health': 2.6,
      'tecnologia': 3.5, 'tech': 3.5,
      'varejo': 3.1, 'ecommerce': 3.1,
      'industria': 2.4, 'manufatura': 2.4
    }[setor.toLowerCase()] || 2.8;

    // System prompt e prompt do usuário
    const systemPrompt = `${SYSTEM_PROMPT_PERSONA_EXECUTIVO}

DIRETRIZES DE REDAÇÃO (CRÍTICO):
1. Tom de Voz: Executivo, direto, bottom-line first. Sem jargões técnicos desnecessários. Use frases curtas e parágrafos concisos.
2. Foco no Valor: Sempre conecte um gap técnico a um risco de negócio, e uma solução técnica a um ROI projetado.
3. Contextualização Setorial: Use o setor da empresa para dar exemplos reais. Se for Fintech, fale de credit scoring, fraude, etc. Se for Varejo, fale de supply chain, personalização.
4. Playbook Atlas: Para cada gap estrutural identificado, você DEVE recomendar a busca por aceleradores (motores, agentes, APIs) no "Playbook Atlas" (plataforma com +1200 componentes prontos) para acelerar o roadmap.
5. Formatação: Use Markdown. Utilize tabelas para comparações e listas apenas quando estritamente necessário.
6. **ROI MIT**: benchmarks por nível são **ROI líquido típico sobre investimento em IA** (ganho após abater custo), não margem sobre faturamento. Nas projeções em R$, separe **benefício bruto**, **investimento**, **ganho líquido** e **ROI líquido %**. Use o bloco "Parâmetros financeiros" e "Trajetória de valor MIT CISR" dos dados.
7. **Prioridade dos avaliadores**: o sistema insere automaticamente no **início do documento** a seção "Nível dos avaliadores no consolidado" (não repita essa seção). Os scores vêm só do filtro do dashboard (1–3).
8. **Evolução entre versões**: quando o bloco "Evolução entre versões da pesquisa" estiver disponível, a Seção 1 deve mencionar a evolução vs. a rodada anterior e a Seção 2 deve interpretar os deltas por dimensão em termos de maturidade (subiu, manteve ou regrediu).

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO:

# Seção 1: Executive Summary (O "Elevator Pitch")
- Um parágrafo de impacto resumindo a situação atual (Score e Nível) e a contradição principal (ex: "A empresa tem cultura forte, mas infraestrutura zero").
- O gap competitivo em relação à média do setor.
- **Parágrafo dedicado** explicando por que o número de ROI pode parecer modesto no curto prazo e qual é o **ganho esperado ao consolidar o próximo nível** (faixas MIT + horizonte 12–36 meses), usando o bloco Trajetória dos dados.
- O impacto financeiro projetado com **investimento**, **benefício bruto**, **ganho líquido (custo abatido)** e **ROI líquido %** alinhados à subida de nível.

# Seção 2: Diagnóstico Estratégico (Onde estamos)
- Destaque os 2 maiores pontos fortes e explique como eles podem ser alavancados.
- Destaque os 2 maiores gaps (scores mais baixos) e explique o risco de negócio imediato de não resolvê-los.

# Seção 3: O Custo da Inércia vs. O Prêmio da Liderança
- Uma tabela comparativa do **nível atual** vs. **próximo nível** e vs. **Nível 5**, usando as **faixas de ROI típicas por nível** e horizontes do bloco Trajetória MIT dos dados (não confundir com % do faturamento total da empresa).

# Seção 4: Roadmap de Transformação Acelerada
- Proponha um roadmap de 4 fases (Fundação, Pilotos, Escala, Inovação).
- Para cada fase, detalhe 2 ações técnicas específicas para o setor da empresa (não use ações genéricas).
- Indique explicitamente em quais fases o "Playbook Atlas" deve ser utilizado para buscar aceleradores e reduzir o time-to-market.

# Seção 5: Os 3 Pedidos para o C-Level
- Liste 3 decisões imediatas que a diretoria precisa tomar hoje para destravar o roadmap (ex: aprovação de budget, nomeação de comitê).`;

    const pctRefExec = percentualReferenciaRoi(projeto.faturamentoAnualProjeto);
    const fatStrExec =
      projeto.faturamentoAnualProjeto != null && Number(projeto.faturamentoAnualProjeto) > 0
        ? `R$ ${Number(projeto.faturamentoAnualProjeto).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
        : 'Não informado';

    const userPrompt = `Analise os dados brutos abaixo e gere o Relatório Executivo conforme as diretrizes:

DADOS BRUTOS DO ASSESSMENT (INPUT):
- **Empresa:** ${projeto.empresa.nome}
- **Versão da pesquisa:** ${projetoVersao.titulo} (${projetoVersao.status})
- **Projeto:** ${projeto.nome}
- **Setor:** ${setor}
- **Porte:** ${projeto.empresa.porte || 'Não informado'}
- **Faturamento anual do projeto (organização):** ${fatStrExec}
- **Percentual de referência para projeções de ROI:** ${pctRefExec != null ? `${pctRefExec}% (use como base para ROI, economia e impacto financeiro)` : 'Não calibrado — cadastre no projeto'}
- **Score Geral:** ${scoreGeral.toFixed(2)}
- **Nível Atual:** Nível ${nivel} - ${nomesNivel[nivel - 1]}
- **Média do Setor:** ${mediaSetor.toFixed(1)}
- **Gap vs Setor:** ${(scoreGeral - mediaSetor).toFixed(2)} pontos ${scoreGeral > mediaSetor ? '(acima)' : '(abaixo)'}
- **Total de Avaliadores (no filtro de prioridade):** ${avaliacoesFiltradas.length}
- **Filtro de prioridade no consolidado:** ${filtroNivelMax == null ? 'Todos os níveis' : `Até nível ${filtroNivelMax} (cumulativo 1–${filtroNivelMax})`}

**Top 3 Scores (Pontos Fortes — apenas dimensões com score > 0):**
${top3.map(a => `- ${a.area}: ${a.score.toFixed(2)}`).join('\n')}

**Bottom 3 Scores (Gaps Críticos — apenas dimensões com score > 0):**
${bottom3.map(a => `- ${a.area}: ${a.score.toFixed(2)}`).join('\n')}

${blocoOrdemDimensoesFrameworkMarkdown()}

**Todas as 16 Dimensões (ordem obrigatória do framework):**
${dimensoesRelatorio.map(a =>
  `- ${a.area}: ${a.score.toFixed(2)}${a.score === 0 ? ' — *score 0 — não analisada*' : ''}`
).join('\n')}

${blocoAvaliadoresExec}

---

${blocoLogicaMaturidade}

${blocoEvolucaoVersoes}

---

${blocoTrajetoriaMitMarkdown({ scoreGeral, faturamentoAnualProjeto: projeto.faturamentoAnualProjeto })}

${blocoMetodologiaRoiExecutivaMarkdown()}

Gere agora o Relatório Executivo completo em Markdown, seguindo rigorosamente a estrutura obrigatória de 5 seções. Use exemplos REAIS do setor ${setor} em todas as recomendações. Nas Seções 1 e 3, incorpore explicitamente a interpretação da trajetória MIT e o contraste entre nível atual e próximo nível. Na Seção 4 (impacto financeiro), use **sempre** as colunas investimento | benefício bruto | ganho líquido | ROI líquido % — nunca confunda múltiplo bruto com ROI líquido. Se houver evolução entre versões, incorpore também o comparativo de rodadas nas Seções 1 e 2.`;

    await loadPersistedAIConfig();
    console.log(`[Relatório IA] Gerando para projeto ${projetoId} usando ${getProvider().name}`);
    
    const resultado = await callAIWithContinuation(
      userPrompt,
      systemPrompt,
      {
        temperature: 0.7,
        maxTokens: 8000
      },
      { maxContinuations: 2, minContentTail: 800 }
    );

    if (resultado.continuations > 0) {
      console.log(`[Relatório IA] Resposta completada com ${resultado.continuations} continuação(ões) automática(s).`);
    }

    const logoMeta = await resolverLogoEmpresa(projeto.empresa);
    const dadosUsados = {
      empresa: projeto.empresa.nome,
      projeto: projeto.nome,
      ...logoMeta,
      setor,
      scoreGeral,
      nivel,
      mediaSetor,
      top3,
      bottom3,
      scoresPorArea: dimensoesRelatorio.map((a) => ({
        area: a.area,
        score: a.score,
        semDadosConsolidados: a.score === 0 || a.semDadosConsolidados
      })),
      dimensoesComDadosConsolidados: areasComScore.length,
      totalDimensoesFramework: dimensoesRelatorio.length,
      totalAvaliadores: avaliacoesFiltradas.length,
      filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
      projetoVersao,
      comparativoVersoes,
      faturamentoAnualProjeto: projeto.faturamentoAnualProjeto ?? null,
      percentualReferenciaRoi: pctRefExec
    };

    const conteudoExecutivo = prependCapaNivelAvaliadoresAoRelatorio(
      resultado.content,
      optsCapaAvaliadores
    );

    // Persistir versão gerada
    let salvo = null;
    try {
      salvo = await salvarRelatorioIA({
        projetoId,
        tipo: 'executivo',
        titulo: `Relatório Executivo C-Level — ${projeto.empresa.nome}`,
        conteudoMd: conteudoExecutivo,
        provider: resultado.provider,
        modelo: resultado.model,
        tokensEntrada: resultado.tokensEntrada,
        tokensSaida: resultado.tokensSaida,
        tempoGeracaoMs: resultado.tempoResposta,
        dadosUsados,
        geradoPorId: req.user?.id || null
      });
      console.log(`[Relatório IA] Salvo como versão ${salvo.versao} (id ${salvo.id})`);
    } catch (saveErr) {
      console.error('[Relatório IA] Erro ao salvar versão:', saveErr.message);
    }

    res.json({
      relatorio: conteudoExecutivo,
      provider: resultado.provider,
      model: resultado.model,
      tokens: {
        entrada: resultado.tokensEntrada,
        saida: resultado.tokensSaida
      },
      tempoResposta: resultado.tempoResposta,
      dadosUsados,
      relatorioSalvoId: salvo?.id,
      versao: salvo?.versao,
      dataGeracao: salvo?.createdAt,
      fromCache: false,
      filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
      projetoVersao
    });
  } catch (error) {
    console.error('Erro ao gerar relatório IA:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar relatório com IA', 
      details: error.message 
    });
  }
});

// ==================== RELATÓRIO COMPLETO IA - BOOK DE TRABALHO (MIT) ====================
// Gera relatório COMPLETO de maturidade (book de trabalho aprofundado) usando IA
// Usa estratégia MULTI-CHUNK: várias chamadas à IA, uma por bloco de seções,
// para evitar truncamento por max_tokens e produzir um documento realmente completo.
app.post('/api/dashboard/projeto/:id/relatorio-ia-completo', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id);
    const reuse = req.query.reuse !== 'false'; // default: true
    const modoRapido = req.query.mode === 'rapido' || req.query.modo === 'rapido';
    const tipoRelatorio = modoRapido ? 'completo_rapido' : 'completo';
    const filtroNivelMax = parseFiltroNivelPrioridadeMapeamentoMaturidadeMax(req);
    const projetoVersao = await obterVersaoSelecionadaProjeto(req, projetoId);

    /** Quando o cliente HTTP fecha no browser, paramos entre chunks. Jobs em background ignoram close. */
    let bookClienteDesconectou = false;
    let relatorioJobId = null;
    const onBookReqClose = () => {
      if (!relatorioJobId) {
        bookClienteDesconectou = true;
      }
    };
    
    // Se reuse=true, tenta retornar versão mais recente já salva (mesmo filtro de prioridade)
    if (reuse) {
      const ultimoSalvo = await prisma.relatorioIA.findFirst({
        where: { projetoId, tipo: tipoRelatorio },
        orderBy: { createdAt: 'desc' }
      });
      
      if (ultimoSalvo) {
        const dadosSnap = ultimoSalvo.dadosSnapshot
          ? JSON.parse(ultimoSalvo.dadosSnapshot)
          : null;
        const secao3Ok = relatorioBookSecao3Completo(ultimoSalvo.conteudoMd || '').ok;
        if (
          filtroNivelRelatorioIACompativel(dadosSnap, filtroNivelMax) &&
          Number(dadosSnap?.projetoVersao?.id || 0) === Number(projetoVersao?.id || 0) &&
          Number(dadosSnap?.totalDimensoesFramework || 0) === 16 &&
          (dadosSnap?.scoresPorArea?.length || 0) === 16 &&
          secao3Ok
        ) {
          const ultimaAval = await prisma.avaliacao.findFirst({
            where: { projetoId, status: 'finalizada' },
            orderBy: { updatedAt: 'desc' },
            select: { updatedAt: true }
          });
          const relatorioVersaoGeradoEm = ultimoSalvo.createdAt;
          const dadosDesatualizados = Boolean(
            ultimaAval?.updatedAt &&
              ultimaAval.updatedAt.getTime() > relatorioVersaoGeradoEm.getTime()
          );
          console.log(`[Book IA] Reusando versão salva ${ultimoSalvo.id} (v${ultimoSalvo.versao}) para projeto ${projetoId}`);
          const empresaAtual = await prisma.projeto.findUnique({
            where: { id: projetoId },
            select: { empresa: { select: { id: true, logoPath: true } } }
          });
          return res.json({
            relatorio: ultimoSalvo.conteudoMd,
            provider: ultimoSalvo.provider,
            model: ultimoSalvo.modelo,
            tokens: {
              entrada: ultimoSalvo.tokensEntrada,
              saida: ultimoSalvo.tokensSaida
            },
            tempoResposta: ultimoSalvo.tempoGeracaoMs,
            chunksGerados: ultimoSalvo.chunksGerados,
            totalChunks: ultimoSalvo.totalChunks,
            dadosUsados: await enriquecerDadosUsadosComLogo(dadosSnap, empresaAtual?.empresa),
            relatorioSalvoId: ultimoSalvo.id,
            versao: ultimoSalvo.versao,
            dataGeracao: ultimoSalvo.createdAt,
            fromCache: true,
            dadosDesatualizados,
            ultimaAvaliacaoFinalizadaEm: ultimaAval?.updatedAt?.toISOString() ?? null,
            relatorioVersaoGeradoEm: relatorioVersaoGeradoEm.toISOString(),
            modoGeracao: modoRapido ? 'rapido' : 'completo',
            filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
            projetoVersao
          });
        } else {
          const sec3 = relatorioBookSecao3Completo(ultimoSalvo.conteudoMd || '');
          console.log(
            `[Book IA] Versão salva ${ultimoSalvo.id} ignorada — Seção 3: ${sec3.total}/16, metadata scores: ${dadosSnap?.scoresPorArea?.length || 0}. Gerando nova versão.`
          );
        }
      }
    }
    
    const projeto = await prisma.projeto.findUnique({
      where: { id: projetoId },
      include: {
        empresa: true,
        avaliacoes: {
          where: { status: 'finalizada' },
          include: {
            usuario: true,
            respostas: {
              include: {
                pergunta: { include: { area: true } }
              }
            }
          }
        }
      }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const idsAvaliacaoVersao = await idsAvaliacoesDaVersao(projetoId, projetoVersao.id);
    const avaliacoesFiltradas = projeto.avaliacoes.filter((av) =>
      idsAvaliacaoVersao.has(Number(av.id)) &&
      usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(av.usuario, filtroNivelMax)
    );

    if (avaliacoesFiltradas.length === 0) {
      return res.status(400).json({
        error:
          projeto.avaliacoes.length === 0
            ? 'Não há avaliações finalizadas para gerar o relatório'
            : 'Não há avaliações finalizadas no filtro de prioridade selecionado ou na versão selecionada.',
        filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
        projetoVersao
      });
    }

    const jobIdParam = req.query.jobId;
    if (jobIdParam != null && jobIdParam !== '') {
      const jid = parseInt(String(jobIdParam), 10);
      if (!Number.isNaN(jid) && jid > 0) {
        const jobRow = await prisma.relatorioIAJob.findFirst({
          where: { id: jid, projetoId, tipo: tipoRelatorio }
        });
        if (jobRow) relatorioJobId = jid;
      }
    }

    const areas = ordenarAreasPorFramework(
      await prisma.area.findMany({
        include: { perguntas: { orderBy: { numero: 'asc' } } },
        orderBy: { ordem: 'asc' }
      })
    );

    const { scoresPorArea, todasDimensoes, scoreGeral } = calcularScoresConsolidadoMaturidade(
      avaliacoesFiltradas,
      areas
    );
    const dimensoesDiagnostico = todasDimensoes;
    if (dimensoesDiagnostico.length !== 16) {
      console.warn(
        `[Book IA] Esperadas 16 dimensões na Seção 3; recebidas ${dimensoesDiagnostico.length}.`
      );
    }

    const nivel = nivelNumericoDeScore(scoreGeral);
    const nomesNivel = NOMES_NIVEL_BLUEPRINT;
    const comparativoVersoes = await montarComparativoVersoesProjeto(prisma, {
      projetoId,
      versaoAtualId: projetoVersao.id,
      avaliacoesFinalizadas: projeto.avaliacoes,
      areas,
      filtroNivelMax,
      usuarioIncluidoNoFiltro: usuarioIncluidoNoFiltroNivelMapeamentoMaturidade
    });
    const blocoEvolucaoVersoes = blocoEvolucaoVersoesMarkdown(comparativoVersoes);
    const blocoLogicaMaturidade = blocoLogicaMaturidadeMarkdown({ scoreGeral, nomesNivel, nivel });

    const ordenados = [...scoresPorArea].sort((a, b) => b.score - a.score);
    const top5 = ordenados.slice(0, 5);
    const bottom5 = ordenados.slice(-5).reverse();

    const setor = projeto.vertical || projeto.empresa.setor || 'Geral';
    const porte = projeto.empresa.porte || 'Não informado';
    const mediaSetor = {
      'fintech': 3.2, 'financeiro': 3.2, 'banco': 3.2,
      'saude': 2.6, 'health': 2.6,
      'tecnologia': 3.5, 'tech': 3.5,
      'varejo': 3.1, 'ecommerce': 3.1,
      'industria': 2.4, 'manufatura': 2.4
    }[setor.toLowerCase()] || 2.8;

    // ============= SYSTEM PROMPT BASE (compartilhado entre chunks) =============
    const systemPromptBase = `${SYSTEM_PROMPT_PERSONA_BOOK}

MODELO MIT CISR (referência pública): use o framework oficial de **quatro estágios** empresariais — (1) Experiment and Prepare, (2) Build Pilots and Capabilities, (3) Develop AI Ways of Working, (4) Become AI Future Ready — conforme os Research Briefings do MIT CISR (ex.: "Building Enterprise AI Maturity", 2024; atualização "Grow Enterprise AI Maturity…", 2025). O score numérico deste assessment é uma **adaptação SysMap Blueprint IA** em escala 1–5 por dimensões; ao narrar maturidade, conecte-o explicitamente a esses estágios quando pertinente e **não** sugira que o MIT gerou, validou ou emitiu este relatório.

DIRETRIZES DE REDAÇÃO (CRÍTICO):
1. **Profundidade Técnica + Linguagem Estratégica**: rigor técnico com narrativa executiva.
2. **Contextualização Setorial**: use exemplos reais do setor. Fintech → credit scoring, fraude, AML. Saúde → diagnóstico, prontuário, ANVISA. Varejo → supply chain, recomendação, dynamic pricing. Tech → developer productivity, code generation, observability. Indústria → predictive maintenance, computer vision, digital twin.
3. **Playbook Atlas**: em recomendações técnicas, referencie aceleradores no Playbook Atlas (+1200 componentes: motores, agentes, APIs, blueprints).
4. **Frameworks**: cite MIT CISR, DORA Metrics, MLOps, FinOps, NIST AI RMF onde fizer sentido.
5. **KPIs Mensuráveis**: cada recomendação com KPI (baseline, meta 6m, meta 12m).
6. **Markdown Estruturado**: use tabelas para comparações/roadmaps/RACI/KPIs e hierarquia clara (#, ##, ###).
7. **Sem Genericidade**: tudo contextualizado ao setor + porte + nível.
8. **Sem Repetição entre Dimensões**: na Seção 3, cada dimensão deve soar única. Varie vocabulário, abertura dos parágrafos e ângulo do risco (regulatório vs operacional vs receita vs marca etc.). Não reaproveite frases inteiras nem "templates" idênticos de diagnóstico ou risco entre dimensões — personalize sempre pelo nome da dimensão, pelos scores e pelas perguntas listadas no prompt.
8b. **Hierarquia Seção 3**: o sistema insere # 3. e ## 3.N Dimensão — nome; gere somente ### 3.N.1, ### 3.N.2, … (não duplique títulos de dimensão).
8c. **Hierarquia Seções 8–13**: use # para seção principal, ## para subseção numerada (ex.: ## 8.1, ## 9.2) e ### para itens (ex.: ### 13.1.1). Não use negrito no lugar de cabeçalho Markdown.
9. **Importante**: Gere SOMENTE as seções solicitadas em cada chamada. NÃO repita seções já produzidas. NÃO inclua título de capa ou metadados, apenas o conteúdo das seções pedidas.
10. **Calibração financeira**: use EXCLUSIVAMENTE o bloco "Parâmetros financeiros" para investimento, benefício bruto, ganho líquido e ROI líquido %. Separe sempre benefício bruto (antes de abater custo) de ROI líquido (após abater investimento).
11. **Trajetória MIT (ROI × maturidade)**: benchmarks MIT/McKinsey/BCG por nível são **ROI líquido típico sobre investimento em IA**—não margem sobre faturamento. O ganho de longo prazo vem de **subir de nível**. Use o bloco "Trajetória de valor MIT CISR" dos dados;
12. **Projeção temporal**: nas Seções 2, 8 e 13, inclua visão **12–36 meses** de acumulação de valor ao aproximar-se do próximo nível (roadmap de investimento em IA alinhado ao MIT).
13. **Evolução entre versões**: quando o bloco "Evolução entre versões da pesquisa" estiver disponível, a Seção 2 deve incluir subseção **Evolução entre rodadas** interpretando score, nível e deltas por dimensão; referencie também nas Seções 8 e 13 quando pertinente.
14. **Prioridade dos avaliadores**: a capa com filtro e lista de avaliadores é inserida **automaticamente no início** do book — **não** gere de novo "## Nível dos avaliadores no consolidado". Comece direto pela Seção 1 (Metodologia).`;

    // Modo rápido: menos tokens por resposta, prioridade em estrutura e tabelas compactas
    const systemPromptBaseRapido = `${SYSTEM_PROMPT_PERSONA_BOOK_RAPIDO}

REGRAS DO MODO RÁPIDO:
- Textos mais curtos; evite repetir o mesmo argumento entre seções.
- Tabelas com menos linhas quando o prompt pedir “compacto”, mas mantenha consistência com os dados fornecidos.
- Calibração financeira e trajetória MIT: use EXCLUSIVAMENTE o bloco "Parâmetros financeiros" e "Trajetória de valor MIT CISR" dos dados.
- **Tabelas de notas por pergunta:** quando listar scores item a item em tabela, a **última linha** deve ser **"Score geral da dimensão"** com o valor consolidado — use as tabelas prontas em "Tabelas de scores por dimensão" nos DADOS (não omita essa linha).
- **"Ganho no longo prazo (MIT CISR)":** siga o modelo em 4 blocos dos DADOS (o que medimos; o que o ROI não é; por que parece modesto agora; ganho ao subir 1 nível). Linguagem direta, sem jargão repetido.
- **Evolução entre versões:** quando o bloco estiver disponível nos DADOS, inclua subseção **Evolução entre rodadas** na Seção 2.
- **Prioridade dos avaliadores:** a capa com níveis já vem no início do arquivo — não duplique; comece na Seção 1.
- Gere SOMENTE o que cada chamada pedir; não antecipe outras seções.
- **Seção 3:** títulos de dimensão são inseridos pelo sistema (## 3.N Dimensão — nome); gere apenas subseções ### 3.N.1, ### 3.N.2, … (nunca repita # 3. nem ## 3.N).`;

    // Dados de contexto compartilhados (resumo enxuto para incluir em todos os prompts)
    const detalhePerguntasTxt = dimensoesDiagnostico.map(a =>
      `\n### ${a.area} (Score: ${dimensaoComScoreZero(a) ? '0 — não analisada' : a.score})\n${(a.perguntas || []).map(p =>
        `- [Q${p.numero}] ${p.texto.substring(0, 140)}${p.texto.length > 140 ? '...' : ''} → ${p.totalRespostas > 0 ? p.score : '0'}`
      ).join('\n')}`
    ).join('\n');

    const finProjBook = projecaoFinanceiraRelatorio({
      faturamentoAnualProjeto: projeto.faturamentoAnualProjeto,
      scoreGeral
    });
    const pctRefBook = percentualReferenciaRoi(projeto.faturamentoAnualProjeto);
    const fatFmt =
      projeto.faturamentoAnualProjeto != null && Number(projeto.faturamentoAnualProjeto) > 0
        ? `R$ ${Number(projeto.faturamentoAnualProjeto).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
        : 'Não informado';

    const blocoAvaliadoresBook = blocoAvaliadoresConsolidadoMarkdown(
      avaliacoesFiltradas,
      filtroNivelMax
    );
    const optsCapaAvaliadoresBook = {
      filtroMax: filtroNivelMax,
      avaliacoesFiltradas,
      empresaNome: projeto.empresa.nome,
      projetoNome: projeto.nome
    };

    const dadosBlock = `# DADOS DO ASSESSMENT

## Identificação
- **Empresa:** ${projeto.empresa.nome}
- **Projeto:** ${projeto.nome}
- **Versão da pesquisa:** ${projetoVersao.titulo} (${projetoVersao.status})
- **Setor:** ${setor}
- **Porte:** ${porte}
- **Total de Avaliadores (no filtro de prioridade):** ${avaliacoesFiltradas.length}
- **Filtro de prioridade no consolidado:** ${filtroNivelMax == null ? 'Todos os níveis' : `Até nível ${filtroNivelMax} (cumulativo 1–${filtroNivelMax})`}

${blocoAvaliadoresBook}

${blocoLogicaMaturidade}

${blocoEvolucaoVersoes}

## Parâmetros financeiros (calibragem de ROI — obrigatório nas projeções)
${blocoParametrosFinanceirosMarkdown(finProjBook)}

${blocoGanhoLongoPrazoMitBookRapido({ scoreGeral, faturamentoAnualProjeto: projeto.faturamentoAnualProjeto })}

${blocoTrajetoriaMitMarkdown({ scoreGeral, faturamentoAnualProjeto: projeto.faturamentoAnualProjeto })}

## Resultado Geral
- **Score Geral:** ${scoreGeral.toFixed(2)}
- **Nível Atual:** Nível ${nivel} - ${nomesNivel[nivel - 1]}
- **Média do Setor:** ${mediaSetor.toFixed(1)}
- **Gap vs Setor:** ${(scoreGeral - mediaSetor).toFixed(2)} pontos ${scoreGeral > mediaSetor ? '(acima da média)' : '(abaixo da média)'}

${blocoOrdemDimensoesFrameworkMarkdown()}

## Scores por Dimensão (${dimensoesDiagnostico.length} dimensões do framework)
${dimensoesDiagnostico.map(a =>
  `- **${a.area}**${dimensaoComScoreZero(a) ? ' — *score 0 — não analisada no diagnóstico*' : ` (Nível ${a.nivel}): ${a.score.toFixed(2)}`}${a.descricao ? ` — ${a.descricao}` : ''}`
).join('\n')}

## Top 5 Pontos Fortes
${top5.map((a, i) => `${i + 1}. **${a.area}**: ${a.score.toFixed(2)}`).join('\n')}

## Top 5 Gaps Críticos
${bottom5.map((a, i) => `${i + 1}. **${a.area}**: ${a.score.toFixed(2)}`).join('\n')}

## Detalhamento por Pergunta
${detalhePerguntasTxt}`;

    const dadosBlockRapido = modoRapido
      ? `${dadosBlock}

---

${blocoDadosExtrasBookRapido({
  scoresPorArea: dimensoesDiagnostico,
  scoreGeral,
  nivel,
  nomesNivel,
  faturamentoAnualProjeto: projeto.faturamentoAnualProjeto
})}`
      : dadosBlock;

    // ============= CHUNKS / SEÇÕES =============
    // Modo completo: muitos chunks (1 por dimensão na Seção 3).
    // Modo rápido: também 1 chunk por dimensão na Seção 3 (texto mais curto por dimensão).

    const chunks = [];

    if (modoRapido) {
      chunks.push({
        id: 'sec_1_2',
        label: 'Metodologia + Sumário (modo rápido)',
        prompt: `Gere SOMENTE as Seções 1 e 2 do book, em Markdown **condensado** (menos prosa que o book completo):

# 1. METODOLOGIA APLICADA
- Visão geral do MIT CISR: **quatro estágios empresariais** oficiais (Experiment and Prepare → AI Future Ready) + escala operacional Blueprint **5 níveis** (faixas 1.8 / 2.6 / 3.4 / 4.2) em texto curto
- Como interpretar scores (parágrafo)
# 2. SUMÁRIO EXECUTIVO
- 1 parágrafo de diagnóstico (situação atual)
- Subseção **### Ganho no longo prazo (MIT CISR)** com **exatamente os 4 blocos numerados** do modelo nos DADOS (1) O que estamos medindo 2) O que o ROI NÃO é 3) Por que parece modesto agora 4) Ganho ao subir um nível). Redija em prosa clara; não copie só a tabela de ROI sem explicar.
- Subseção **### Evolução entre rodadas** quando o bloco de evolução entre versões estiver disponível nos DADOS.
- Tabela compacta: Score | Nível | vs Setor | horizonte próximo nível
- 5 insights em bullet (1 linha cada)

DADOS:
${dadosBlockRapido}

Comece com "# 1. METODOLOGIA APLICADA".`,
        maxTokens: 3200
      });

      // Seção 3: uma entrada por dimensão (16); score 0 = bloco fixo sem IA
      dimensoesDiagnostico.forEach((dim, idx) => {
        const isFirst = idx === 0;
        const numSecao = `3.${idx + 1}`;
        if (dimensaoComScoreZero(dim)) {
          chunks.push({
            id: `sec_3_${idx + 1}`,
            label: `Registro — ${dim.area} (score 0)`,
            staticContent: blocoDimensaoScoreZeroSecao3(numSecao, dim, {
              isFirst,
              totalDimensoes: dimensoesDiagnostico.length
            })
          });
          return;
        }
        chunks.push({
          id: `sec_3_${idx + 1}`,
          label: `Diagnóstico — ${dim.area} (modo rápido)`,
          prompt: `${instrucaoPromptSecao3SemCabecalhos(numSecao, isFirst)}Gere SOMENTE as subseções ### ${numSecao}.1 a ### ${numSecao}.7 em Markdown.

### ${numSecao}.1 Diagnóstico (1 parágrafo, específico da dimensão **${dim.area}** e do setor)
### ${numSecao}.2 Tabela de scores por pergunta
Reproduza **integralmente** a tabela pronta abaixo (incluindo a **última linha** "Score geral da dimensão").
### ${numSecao}.3 Evidências (até 4 bullets com [Qn], referenciando a tabela)
### ${numSecao}.4 Risco (1 parágrafo — mecanismo de risco desta dimensão, não genérico)
### ${numSecao}.5 Benchmark (1 parágrafo curto vs setor)
### ${numSecao}.6 Recomendações (3 bullets acionáveis; cite Playbook Atlas quando couber)
### ${numSecao}.7 KPIs (tabela 3 linhas: KPI | Baseline | Meta 12m)

OBRIGATÓRIO:
- Use o rótulo **Dimensão — ${dim.area}** apenas se precisar referenciar no texto; **não** crie título ## repetido.
- Numere **exatamente** ${numSecao}.1 … ${numSecao}.7 com ### (três #).
- Não pule subseções.

CONTEXTO GERAL: ${projeto.empresa.nome} · ${setor} · porte ${porte} · score geral ${scoreGeral.toFixed(2)} (Nível ${nivel})

${blocoGuiaProgressaoDimensao(dim.area, dim.nivel || dim.score)}

DADOS CONSOLIDADOS:
${dadosBlockRapido}

TABELA OBRIGATÓRIA (copie integralmente em ${numSecao}.2):
${tabelaPerguntasDimensaoMarkdown(dim)}`,
          maxTokens: 3600
        });
      });

      chunks.push({
        id: 'sec_4_5',
        label: 'Gaps + Forças (modo rápido)',
        prompt: `Gere SOMENTE as Seções 4 e 5, em Markdown condensado:

# 4. GAPS PRIORITÁRIOS
Tabela compacta: Top 5 gaps | Score | Risco (1 frase) | Prioridade P1-P3
Parágrafo curto: cadeia de valor bloqueada (síntese)

# 5. PONTOS FORTES
Tabela: Top 5 forças | como alavancar | quick win 90d (1 linha)
Parágrafo curto: vantagem competitiva

${dadosBlockRapido}

Comece com "# 4."`,
        maxTokens: 3800
      });

      chunks.push({
        id: 'sec_6_7',
        label: 'Roadmap + Dependências (modo rápido)',
        prompt: `Gere SOMENTE as Seções 6 e 7, condensado:

# 6. ROADMAP 12 MESES
Tabela única com colunas: Fase (M1-3 / M4-6 / M7-9 / M10-12) | 3 iniciativas por fase | KPI de saída | nota Atlas (se aplicável)

# 7. DEPENDÊNCIAS
Tabela máx. 8 linhas: Iniciativa | Depende de | Tipo | Parágrafo curto do caminho crítico

${dadosBlockRapido}`,
        maxTokens: 4200
      });

      chunks.push({
        id: 'sec_8_9_10_11',
        label: 'Financeiro + Gov + Riscos + KPIs (modo rápido)',
        prompt: `Gere as Seções 8 a 11 em um único Markdown, **objetivo e compacto**:

# 8. IMPACTO FINANCEIRO — Resuma trajetória MIT (4 blocos do Ganho no longo prazo) + tabela 3 cenários (12m) com colunas: **Investimento | Benefício bruto | Ganho líquido (custo abatido) | ROI líquido % | Payback**. Nunca apresente múltiplo bruto como ROI líquido.
# 9. GOVERNANÇA — bullets: estrutura (CoE/comitês), modelo operação, 4 políticas mínimas.
# 10. RISCOS — tabela Top 6: Risco | P×I | Mitigação | Owner
# 11. KPIs — uma tabela consolidada (até 15 KPIs com baseline/meta 12m) por categorias curtas.

${dadosBlockRapido}`,
        maxTokens: 7200
      });

      chunks.push({
        id: 'sec_12_13',
        label: 'Apêndices + Próximos passos (modo rápido)',
        prompt: `Gere SOMENTE em Markdown:

# 12. APÊNDICES
## A — Glossário (10 termos, tabela Termo | Definição)
## B — Frameworks (lista breve MIT/DORA/MLOps/FinOps/NIST)
## C — Scores por pergunta
Copie **integralmente** o bloco "Apêndice C — modelo completo" dos DADOS (cada dimensão com tabela e **última linha** "Score geral da dimensão"; ao final, bloco "Consolidado do projeto" com **Score geral do projeto**).
## D — Bibliografia (5 referências)

# 13. PRÓXIMOS PASSOS (30 DIAS)
Lista numerada de **5** ações com responsável e entregável (formato compacto). Inclua 1 ação ligada ao próximo nível MIT.

${dadosBlockRapido}`,
        maxTokens: 6500
      });
    } else {

    // CHUNK 1: Seções 1 e 2
    chunks.push({
      id: 'sec_1_2',
      label: 'Metodologia + Sumário Executivo',
      prompt: `Gere SOMENTE as Seções 1 e 2 do book, em Markdown, NESTA ORDEM:

# 1. METODOLOGIA APLICADA
- Breve explicação do MIT CISR Enterprise AI Maturity Model: **quatro estágios empresariais** oficiais + escala operacional Blueprint **5 níveis** (Inexistente → Otimizado; faixas da rubrica nos DADOS)
- Critérios de avaliação utilizados
- Como interpretar os scores e níveis
# 2. SUMÁRIO EXECUTIVO
- Diagnóstico em 1 parágrafo de impacto (situação atual, contradição central, oportunidade)
- **Parágrafo obrigatório "Ganho no longo prazo (MIT)"**: explique que o ROI do modelo MIT é **sobre investimento em IA**; contraste o cenário no **nível atual** com o **potencial ao consolidar o próximo nível** (use a tabela "Trajetória de valor MIT CISR" dos dados e, se houver faturamento, as estimativas em R$).
- **Subseção obrigatória "Evolução entre rodadas"** quando o bloco de evolução entre versões estiver disponível: interprete score, nível e principais deltas por dimensão.
- Tabela: Score Geral, Nível, Posição vs Setor, Tempo Estimado p/ próximo nível, premissas de ROI (MIT)
- Top 5 Insights Estratégicos (bullets curtos e impactantes)

Use os dados:
${dadosBlock}

Gere SOMENTE as seções 1 e 2. Comece direto com "# 1. METODOLOGIA APLICADA".`,
      maxTokens: 6000
    });

    // CHUNK 2..N: Seção 3 — 16 dimensões; score 0 = bloco fixo sem IA
    dimensoesDiagnostico.forEach((dim, idx) => {
      const isFirst = idx === 0;
      const numSecao = `3.${idx + 1}`;
      if (dimensaoComScoreZero(dim)) {
        chunks.push({
          id: `sec_3_${idx + 1}`,
          label: `Registro — ${dim.area} (score 0)`,
          staticContent: blocoDimensaoScoreZeroSecao3(numSecao, dim, {
            isFirst,
            totalDimensoes: dimensoesDiagnostico.length,
            modoRapido: false
          })
        });
        return;
      }
      const detalheDim = (dim.perguntas || [])
        .map(
          (p) =>
            `- [Q${p.numero}] ${p.texto.substring(0, 160)} → ${
              p.totalRespostas > 0 ? `Score ${p.score}` : 'Score 0'
            }`
        )
        .join('\n');
      chunks.push({
        id: `sec_3_${idx + 1}`,
        label: `Diagnóstico — ${dim.area}`,
        prompt: `${instrucaoPromptSecao3SemCabecalhos(numSecao, isFirst)}Gere SOMENTE as subseções ### ${numSecao}.1 a ### ${numSecao}.6 em Markdown.

### ${numSecao}.1 Análise Diagnóstica (2–3 parágrafos profundos sobre o que o score revela)
### ${numSecao}.2 Evidências Críticas (bullets — quais perguntas puxaram score para cima/baixo)
### ${numSecao}.3 Risco de Negócio (1 parágrafo — o que pode acontecer se mantiver este nível)
### ${numSecao}.4 Benchmark Setorial (1 parágrafo — onde a empresa está vs concorrentes do setor)
### ${numSecao}.5 Recomendações Específicas (3–4 ações concretas com Playbook Atlas quando aplicável)
### ${numSecao}.6 KPIs de Acompanhamento (tabela com 3–5 KPIs: KPI | Baseline | Meta 6m | Meta 12m)

OBRIGATÓRIO — EVITE REPETIÇÃO (Análise Diagnóstica e Risco de Negócio):
- A **Análise Diagnóstica** deve abordar o tema **${dim.area}** de forma explícita: referencie em texto as perguntas com [Qn] e o padrão de respostas (não use parágrafo genérico de "maturidade de IA" que valeria para qualquer dimensão).
- O **Risco de Negócio** deve ser **específico desta dimensão**. **Proibido** repetir a mesma frase genérica entre dimensões.
- Numere **exatamente** ${numSecao}.1 … ${numSecao}.6 com ### (três #). **Não** gere "## ${numSecao}" nem "# 3. DIAGNÓSTICO".

CONTEXTO:
- Empresa: ${projeto.empresa.nome} (${setor}, porte ${porte})
- Score geral da empresa: ${scoreGeral.toFixed(2)} (Nível ${nivel})
- Média do setor: ${mediaSetor.toFixed(1)}

DETALHE DESTA DIMENSÃO:
${detalheDim || '- Nenhuma resposta consolidada nesta rodada.'}

${blocoGuiaProgressaoDimensao(dim.area, dim.nivel || dim.score)}

Seja profundo, contextualizado e use exemplos REAIS do setor ${setor}.`,
        maxTokens: 6000
      });
    });

    // CHUNK: Seções 4 e 5 (Gaps + Forças)
    chunks.push({
      id: 'sec_4_5',
      label: 'Gaps Prioritários + Pontos Fortes',
      prompt: `Gere SOMENTE as Seções 4 e 5 do book, em Markdown:

# 4. ANÁLISE DE GAPS PRIORITÁRIOS
- Tabela com Top 5 Gaps Críticos: Dimensão | Score | Risco | Impacto Financeiro Estimado | Effort | Prioridade (P1-P3)
- Para cada gap, parágrafo explicando a "Cadeia de Valor Bloqueada" (o que deixa de acontecer no negócio)

# 5. ALAVANCAGEM DE PONTOS FORTES
- Tabela com Top 5 Forças: Dimensão | Score | Como Alavancar | Quick Wins (90 dias)
- Parágrafo de "Stack Vantagem Competitiva" usando as forças identificadas

CONTEXTO:
${dadosBlock}

Gere SOMENTE as seções 4 e 5. Comece direto com "# 4. ANÁLISE DE GAPS PRIORITÁRIOS".`,
      maxTokens: 7000
    });

    // CHUNK: Seções 6 e 7 (Roadmap + Dependências)
    chunks.push({
      id: 'sec_6_7',
      label: 'Roadmap 12m + Dependências',
      prompt: `Gere SOMENTE as Seções 6 e 7 do book, em Markdown:

# 6. ROADMAP DE TRANSFORMAÇÃO (12 MESES)
Para cada uma das 4 fases, crie uma tabela detalhada:
- **Fase 1: Fundação (Mês 1-3)** — tabela com Ação | Responsável (RACI) | Entregáveis | KPI de Saída (4–5 ações)
- **Fase 2: Pilotos (Mês 4-6)** — mesma estrutura (4–5 ações)
- **Fase 3: Escala (Mês 7-9)** — mesma estrutura (4–5 ações)
- **Fase 4: Industrialização & Inovação (Mês 10-12)** — mesma estrutura (4–5 ações)
- Indique em cada fase onde usar **Playbook Atlas**
- No final: Tabela RACI consolidada (CEO, CIO, CDO, CFO, BU Leaders) por iniciativa-chave

# 7. MATRIZ DE DEPENDÊNCIAS E SEQUÊNCIA
- Tabela com dependências entre iniciativas: Iniciativa | Depende De | Bloqueia | Tipo de Dependência
- Parágrafo identificando o **caminho crítico**

CONTEXTO:
${dadosBlock}

Gere SOMENTE as seções 6 e 7. Comece direto com "# 6. ROADMAP DE TRANSFORMAÇÃO (12 MESES)".`,
      maxTokens: 8000
    });

    // CHUNK: Seções 8, 9 e 10 (Financeiro + Governança + Riscos)
    chunks.push({
      id: 'sec_8_9_10',
      label: 'Financeiro + Governança + Riscos',
      prompt: `Gere SOMENTE as Seções 8, 9 e 10 do book, em Markdown com hierarquia fixa (# seção, ## subseção, ### item):

# 8. PROJEÇÃO DE IMPACTO FINANCEIRO
## 8.1 Trajetória MIT por nível
Reproduza ou resume a tabela de ROI típico por nível (dados do assessment) e explique o **ganho incremental esperado ao subir 1 nível de maturidade** (horizonte 18–36 meses).
## 8.2 Cenários 12 meses
Tabela com 3 cenários (Conservador, Base, Agressivo): Investimento 12m | Benefício bruto 12m | Ganho líquido 12m (custo abatido) | ROI líquido % | Payback (meses). Use os valores do bloco "Parâmetros financeiros" dos DADOS.
## 8.3 Longo prazo (3–5 anos)
Parágrafo(s) sobre acumulação de valor ao aproximar-se dos níveis 4–5, mantendo coerência com a metodologia MIT.
### 8.3.1 Premissas e fontes
MIT CISR, McKinsey, BCG — parágrafo curto.
### 8.3.2 Disclaimer
Projeção referencial, não contratual.

# 9. GOVERNANÇA E ESTRUTURA RECOMENDADA
## 9.1 Estrutura organizacional
CoE de IA, Comitês, papéis com responsabilidades.
## 9.2 Modelo de operação
Centralizado / federado / híbrido — com justificativa.
## 9.3 Políticas mínimas
AI Ethics, Data Governance, Risk Management, Model Lifecycle.

# 10. RISCOS E MITIGAÇÕES
Tabela com Top 10 Riscos: Risco | Probabilidade | Impacto | Estratégia de Mitigação | Owner

OBRIGATÓRIO: use exatamente os títulos # 8., # 9., # 10. e ## 8.N / ## 9.N acima; não use negrito no lugar de cabeçalho Markdown.

CONTEXTO:
${dadosBlock}

Gere SOMENTE as seções 8, 9 e 10. Comece direto com "# 8. PROJEÇÃO DE IMPACTO FINANCEIRO".`,
      maxTokens: 8000
    });

    // CHUNK: Seção 11 (KPIs)
    chunks.push({
      id: 'sec_11',
      label: 'KPIs Estratégicos',
      prompt: `Gere SOMENTE a Seção 11 do book, em Markdown:

# 11. KPIs ESTRATÉGICOS (DASHBOARD EXECUTIVO)
## 11.1 KPIs de negócio
Tabela: KPI | Definição | Baseline | Meta 6m | Meta 12m (Receita por iniciativa IA, Custo evitado, NPS, Time-to-Market).
## 11.2 KPIs técnicos (DORA + MLOps)
Tabela na mesma estrutura (Lead Time, Deploy Frequency, MTTR, Change Failure Rate, Model Drift, Time-to-Production).
## 11.3 KPIs financeiros (FinOps)
Tabela na mesma estrutura (Custo por inferência, Custo por modelo, ROI por caso de uso).
## 11.4 KPIs de pessoas
Tabela na mesma estrutura (% colaboradores treinados, % times com AI assistance, Adoption rate).

OBRIGATÓRIO: comece com # 11. e use ## 11.N para cada categoria; não substitua cabeçalhos por negrito.

CONTEXTO:
${dadosBlock}

Gere SOMENTE a seção 11. Comece direto com "# 11. KPIs ESTRATÉGICOS (DASHBOARD EXECUTIVO)".`,
      maxTokens: 6000
    });

    // CHUNK: Seção 12 (Apêndices A e B)
    chunks.push({
      id: 'sec_12_ab',
      label: 'Apêndices A e B',
      prompt: `Gere SOMENTE o início da Seção 12 do book, em Markdown:

# 12. APÊNDICES

## Apêndice A — Glossário de Termos
Tabela com 15–20 termos essenciais (Termo | Definição)

## Apêndice B — Frameworks de Referência
Lista descritiva: MIT CISR Enterprise AI Maturity Model, DORA Metrics, MLOps (CI/CD/CT), FinOps, NIST AI RMF

CONTEXTO:
${dadosBlock}

Gere SOMENTE a seção 12 até o final do Apêndice B. Comece direto com "# 12. APÊNDICES".`,
      maxTokens: 6000
    });

    // CHUNK: Seção 12 (Apêndices C e D)
    chunks.push({
      id: 'sec_12_cd',
      label: 'Apêndices C e D',
      prompt: `Continue a Seção 12 do book (o bloco ## Apêndice A e ## Apêndice B já foi gerado). Gere SOMENTE em Markdown:

## Apêndice C — Detalhamento dos Scores por Pergunta
Tabela completa com TODAS as perguntas avaliadas (Dimensão | # | Pergunta resumida | Score).
NÃO RESUMA e NÃO CORTE linhas no meio.

## Apêndice D — Bibliografia e Próximas Leituras Recomendadas
Lista de 8–10 referências (livros, papers, sites) sobre maturidade em IA, governança, MLOps

OBRIGATÓRIO: use exatamente ## Apêndice C e ## Apêndice D; não repita # 12. APÊNDICES.

CONTEXTO:
${dadosBlock}

Gere SOMENTE os Apêndices C e D. Comece direto com "## Apêndice C — Detalhamento dos Scores por Pergunta".`,
      maxTokens: 8000
    });

    // CHUNK: Seção 13 (Próximos Passos)
    chunks.push({
      id: 'sec_13',
      label: 'Próximos Passos 30 dias',
      prompt: `Gere SOMENTE a Seção 13 do book, em Markdown:

# 13. PRÓXIMOS PASSOS IMEDIATOS (30 DIAS)
## 13.1 Ações prioritárias
Lista numerada de 7–10 ações concretas. Cada ação em bloco:
### 13.1.N [Nome da Ação]
- **Responsável sugerido:** …
- **Entregável:** …
- **Prazo:** …
## 13.2 Alinhamento ao próximo nível MIT
Parágrafo curto + 1–2 ações explícitas ligadas ao bloco "Trajetória de valor MIT CISR" dos dados.

OBRIGATÓRIO: use # 13., ## 13.1 / ## 13.2 e ### 13.1.N; não use negrito como substituto de cabeçalho.

CONTEXTO:
${dadosBlock}

Gere SOMENTE a seção 13. Comece direto com "# 13. PRÓXIMOS PASSOS IMEDIATOS (30 DIAS)".`,
      maxTokens: 6000
    });
    } // fim else book completo

    // ============= EXECUÇÃO SEQUENCIAL DOS CHUNKS =============
    req.on('close', onBookReqClose);
    try {
    await loadPersistedAIConfig();
    console.log(
      `[Book IA] Gerando para projeto ${projetoId} (${modoRapido ? 'modo rápido' : 'completo'}) usando ${getProvider().name} — ${chunks.length} chunks`
    );

    await atualizarProgressoJobBook(relatorioJobId, {
      progresso: 8,
      etapa: `Montagem do livro · ${chunks.length} blocos IA`,
      metadata: JSON.stringify({
        fase: 'preparacao',
        chunkAtual: 0,
        totalChunks: chunks.length,
        mensagem: 'Carregando modelo e iniciando seções'
      })
    });
    
    const startTime = Date.now();
    const partesPreSec3 = [];
    const blocosSec3PorIndice = Array(dimensoesDiagnostico.length).fill(null);
    const partesPosSec3 = [];
    let chegouSec3 = false;
    let totalTokensEntrada = 0;
    let totalTokensSaida = 0;
    let providerUsado = null;
    let modelUsado = null;

    const registrarConteudoChunk = (chunk, conteudo) => {
      const texto = String(conteudo || '').trim();
      if (!texto) return;
      const mSec3 = String(chunk.id || '').match(/^sec_3_(\d+)$/);
      if (mSec3) {
        chegouSec3 = true;
        const dimIdx = parseInt(mSec3[1], 10) - 1;
        if (dimIdx >= 0 && dimIdx < blocosSec3PorIndice.length) {
          blocosSec3PorIndice[dimIdx] = texto;
        }
        return;
      }
      if (!chegouSec3) {
        partesPreSec3.push(texto);
      } else {
        partesPosSec3.push(texto);
      }
    };

    for (let i = 0; i < chunks.length; i++) {
      if (bookClienteDesconectou) {
        const cancelErr = new Error('BOOK_IA_CANCELADO');
        cancelErr.code = 'BOOK_IA_CANCELADO';
        throw cancelErr;
      }

      if (relatorioJobId) {
        const jobSnap = await prisma.relatorioIAJob.findUnique({
          where: { id: relatorioJobId },
          select: { status: true }
        });
        if (jobSnap?.status === 'cancelled') {
          const cancelErr = new Error('BOOK_IA_CANCELADO');
          cancelErr.code = 'BOOK_IA_CANCELADO';
          throw cancelErr;
        }
      }

      const chunk = chunks[i];
      console.log(`[Book IA] Chunk ${i + 1}/${chunks.length}: ${chunk.label}`);
      
      try {
        if (chunk.staticContent) {
          registrarConteudoChunk(chunk, chunk.staticContent);
          const pct = 6 + Math.round(((i + 1) / chunks.length) * 88);
          await atualizarProgressoJobBook(relatorioJobId, {
            progresso: Math.min(94, pct),
            etapa: `Bloco ${i + 1}/${chunks.length}: ${chunk.label}`,
            metadata: JSON.stringify({
              fase: 'montagem_estatica',
              chunkAtual: i + 1,
              totalChunks: chunks.length,
              chunkLabel: chunk.label,
              chunkId: chunk.id
            })
          });
          continue;
        }

        const systemUsado = modoRapido ? systemPromptBaseRapido : systemPromptBase;
        const contOpts = modoRapido
          ? { maxContinuations: 2, minContentTail: 400 }
          : { maxContinuations: 3, minContentTail: 800 };
        const resultado = await callAIWithContinuation(
          chunk.prompt,
          systemUsado,
          {
            temperature: chunk.id.startsWith('sec_3_') ? 0.45 : modoRapido ? 0.5 : 0.6,
            maxTokens: chunk.maxTokens || 6000
          },
          contOpts
        );

        if (resultado.continuations > 0) {
          console.log(`[Book IA] Chunk ${chunk.id} foi completado com ${resultado.continuations} continuação(ões) automática(s).`);
        }

        const mSec3 = String(chunk.id || '').match(/^sec_3_(\d+)$/);
        if (mSec3) {
          const dimIdx = parseInt(mSec3[1], 10) - 1;
          const dim = dimensoesDiagnostico[dimIdx];
          if (dim) {
            const numSecao = `3.${dimIdx + 1}`;
            registrarConteudoChunk(
              chunk,
              montarBlocoSecao3Dimensao({
                numSecao,
                dim,
                conteudoIa: resultado.content,
                isFirst: dimIdx === 0,
                totalDimensoes: dimensoesDiagnostico.length,
                modoRapido
              })
            );
          } else {
            registrarConteudoChunk(chunk, resultado.content);
          }
        } else {
          registrarConteudoChunk(chunk, resultado.content);
        }
        totalTokensEntrada += resultado.tokensEntrada || 0;
        totalTokensSaida += resultado.tokensSaida || 0;
        if (!providerUsado) providerUsado = resultado.provider;
        if (!modelUsado) modelUsado = resultado.model;

        const pct = 6 + Math.round(((i + 1) / chunks.length) * 88);
        await atualizarProgressoJobBook(relatorioJobId, {
          progresso: Math.min(94, pct),
          etapa: `Bloco ${i + 1}/${chunks.length}: ${chunk.label}`,
          metadata: JSON.stringify({
            fase: 'geracao_ia',
            chunkAtual: i + 1,
            totalChunks: chunks.length,
            chunkLabel: chunk.label,
            chunkId: chunk.id
          })
        });
      } catch (chunkError) {
        console.error(`[Book IA] Erro no chunk ${chunk.id}:`, chunkError.message);
        await atualizarProgressoJobBook(relatorioJobId, {
          etapa: `Erro no bloco ${i + 1}/${chunks.length}: ${chunk.label} (continuando…)`,
          metadata: JSON.stringify({
            fase: 'erro_chunk',
            chunkAtual: i + 1,
            totalChunks: chunks.length,
            chunkLabel: chunk.label,
            erroResumo: String(chunkError.message || '').slice(0, 200)
          })
        });
        const mSec3Err = String(chunk.id || '').match(/^sec_3_(\d+)$/);
        if (mSec3Err) {
          const dimIdx = parseInt(mSec3Err[1], 10) - 1;
          const dim = dimensoesDiagnostico[dimIdx];
          if (dim) {
            const numSecao = `3.${dimIdx + 1}`;
            registrarConteudoChunk(
              chunk,
              dimensaoComScoreZero(dim)
                ? blocoDimensaoScoreZeroSecao3(numSecao, dim, {
                    isFirst: dimIdx === 0,
                    totalDimensoes: dimensoesDiagnostico.length,
                    modoRapido
                  })
                : blocoFallbackErroSecao3Dimensao(numSecao, dim, chunkError.message, {
                    isFirst: dimIdx === 0,
                    totalDimensoes: dimensoesDiagnostico.length,
                    modoRapido
                  })
            );
          }
        } else {
          registrarConteudoChunk(
            chunk,
            `> ⚠️ **Nota:** Esta seção (${chunk.label}) não pôde ser gerada devido a um erro temporário. Por favor, regenere o relatório.`
          );
        }
      }
    }

    const faltandoAntes = blocosSec3PorIndice.filter((b) => !b).length;
    if (faltandoAntes > 0) {
      console.warn(`[Book IA] Seção 3: ${faltandoAntes} bloco(s) ausente(s) — preenchendo com fallback.`);
    }
    const blocosSec3 = garantirBlocosSecao3Book(blocosSec3PorIndice, dimensoesDiagnostico, { modoRapido });

    await atualizarProgressoJobBook(relatorioJobId, {
      progresso: 94,
      etapa: 'Unindo seções e montando índice navegável…',
      metadata: JSON.stringify({
        fase: 'montagem',
        chunkAtual: chunks.length,
        totalChunks: chunks.length
      })
    });

    const relatorioCompleto = [...partesPreSec3, ...blocosSec3, ...partesPosSec3].join('\n\n');

    let secao14Regulatorio = '';
    try {
      const dashReg = await montarDashboardRegulatorioProjeto(prisma, projetoId, {
        scoresPorArea: dimensoesDiagnostico,
        versaoId: projetoVersao?.id
      });
      secao14Regulatorio = gerarSecao14RegulatorioBookMarkdown(dashReg);
    } catch (regBookErr) {
      console.warn('[Book IA] Seção 14 regulatória omitida:', regBookErr?.message || regBookErr);
    }

    const relatorioComRegulatorio = secao14Regulatorio
      ? `${relatorioCompleto}\n\n${secao14Regulatorio}`
      : relatorioCompleto;

    const validacaoSec3 = relatorioBookSecao3Completo(relatorioComRegulatorio);
    if (!validacaoSec3.ok) {
      console.warn(
        `[Book IA] Seção 3 ainda incompleta após montagem (${validacaoSec3.total}/16). Faltando: ${validacaoSec3.faltando.join(', ')}`
      );
    } else {
      console.log(`[Book IA] Seção 3 validada: ${validacaoSec3.total}/16 dimensões na ordem do framework.`);
    }
    const relatorioComIndice = adicionarIndiceAoBookMarkdown(relatorioComRegulatorio);
    const relatorioFinal = prependCapaNivelAvaliadoresAoRelatorio(
      relatorioComIndice,
      optsCapaAvaliadoresBook
    );
    const tempoTotal = Date.now() - startTime;

    console.log(`[Book IA] Concluído em ${tempoTotal}ms · ${totalTokensEntrada} tokens in / ${totalTokensSaida} tokens out`);

    await atualizarProgressoJobBook(relatorioJobId, {
      progresso: 97,
      etapa: 'Salvando nova versão na biblioteca…',
      metadata: JSON.stringify({
        fase: 'persistencia',
        tempoDecorridoMs: tempoTotal,
        totalChunks: chunks.length
      })
    });

    const logoMeta = await resolverLogoEmpresa(projeto.empresa);
    const dadosUsados = {
      empresa: projeto.empresa.nome,
      projeto: projeto.nome,
      ...logoMeta,
      setor,
      porte,
      scoreGeral,
      nivel,
      mediaSetor,
      top5,
      bottom5,
      scoresPorArea: dimensoesDiagnostico.map((a) => ({
        area: a.area,
        score: a.score,
        nivel: a.nivel,
        semDadosConsolidados: dimensaoComScoreZero(a),
      })),
      dimensoesComDadosConsolidados: scoresPorArea.length,
      totalDimensoesFramework: dimensoesDiagnostico.length,
      totalAvaliadores: avaliacoesFiltradas.length,
      filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
      projetoVersao,
      comparativoVersoes,
      faturamentoAnualProjeto: projeto.faturamentoAnualProjeto ?? null,
      percentualReferenciaRoi: pctRefBook,
      modoGeracao: modoRapido ? 'rapido' : 'completo'
    };

    // Persistir versão gerada
    let salvo = null;
    try {
      salvo = await salvarRelatorioIA({
        projetoId,
        tipo: tipoRelatorio,
        titulo: modoRapido
          ? `Book de Trabalho (modo rápido) — Maturidade IA — ${projeto.empresa.nome}`
          : `Book de Trabalho — Maturidade IA — ${projeto.empresa.nome}`,
        conteudoMd: relatorioFinal,
        provider: providerUsado,
        modelo: modelUsado,
        tokensEntrada: totalTokensEntrada,
        tokensSaida: totalTokensSaida,
        tempoGeracaoMs: tempoTotal,
        chunksGerados: chunks.length,
        totalChunks: chunks.length,
        dadosUsados,
        geradoPorId: req.user?.id || null
      });
      console.log(`[Book IA] Salvo como versão ${salvo.versao} (id ${salvo.id})`);
    } catch (saveErr) {
      console.error('[Book IA] Erro ao salvar versão:', saveErr.message);
    }

    let ultimaAvaliacaoFinalizadaEm = null;
    if (avaliacoesFiltradas.length > 0) {
      const maxT = Math.max(
        ...avaliacoesFiltradas.map((a) => new Date(a.updatedAt).getTime())
      );
      ultimaAvaliacaoFinalizadaEm = new Date(maxT);
    }
    const geradoEm = salvo?.createdAt || new Date();

    res.json({
      relatorio: relatorioFinal,
      provider: providerUsado,
      model: modelUsado,
      tokens: {
        entrada: totalTokensEntrada,
        saida: totalTokensSaida
      },
      tempoResposta: tempoTotal,
      chunksGerados: chunks.length,
      totalChunks: chunks.length,
      dadosUsados,
      relatorioSalvoId: salvo?.id,
      versao: salvo?.versao,
      dataGeracao: salvo?.createdAt,
      fromCache: false,
      dadosDesatualizados: false,
      ultimaAvaliacaoFinalizadaEm: ultimaAvaliacaoFinalizadaEm?.toISOString() ?? null,
      relatorioVersaoGeradoEm: geradoEm.toISOString(),
      modoGeracao: modoRapido ? 'rapido' : 'completo',
      filtroNivelPrioridadeMapeamentoMaturidadeAplicado: filtroNivelMax,
      projetoVersao
    });
    } catch (genErr) {
      if (genErr.code === 'BOOK_IA_CANCELADO') {
        console.warn(`[Book IA] Geração cancelada (projeto ${projetoId})`);
        if (relatorioJobId) {
          await prisma.relatorioIAJob
            .update({
              where: { id: relatorioJobId },
              data: {
                status: 'cancelled',
                progresso: 100,
                etapa: 'Cancelado',
                erro: 'Interrompido (cancelamento ou conexão encerrada)',
                finishedAt: new Date()
              }
            })
            .catch(() => {});
        }
        if (!res.writableEnded) {
          return res.status(499).json({
            error: 'Geração cancelada',
            cancelled: true
          });
        }
        return;
      }
      throw genErr;
    } finally {
      req.removeListener('close', onBookReqClose);
    }
  } catch (error) {
    console.error('Erro ao gerar book IA completo:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar book completo com IA', 
      details: error.message 
    });
  }
});

// Dashboard detalhado de produtos por projeto
app.get('/api/dashboard/projeto-produtos/:id', async (req, res) => {
  try {
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        empresa: true,
        produtos: {
          include: {
            avaliacoes: {
              where: { status: 'finalizada' },
              include: {
                usuario: true,
                respostasObrigatorias: {
                  include: { perguntaObrigatoria: true }
                },
                respostasVerticais: {
                  include: { perguntaProduto: { include: { vertical: true } } }
                }
              }
            }
          },
          orderBy: [
            { classificacao: 'asc' },
            { scoreRelevancia: 'desc' }
          ]
        },
        avaliacoes: {
          where: { status: 'finalizada' }
        }
      }
    });
    
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const perguntasObrigatorias = await prisma.perguntaObrigatoriaProduto.findMany({
      orderBy: { ordem: 'asc' }
    });
    
    const verticais = await prisma.verticalProduto.findMany({
      include: { perguntas: { orderBy: { numero: 'asc' } } },
      orderBy: { ordem: 'asc' }
    });
    
    const produtosDetalhados = projeto.produtos.map((produto, index) => {
      const avaliacoes = produto.avaliacoes || [];
      const totalAvaliacoes = avaliacoes.length;
      
      // Calcular scores médios das perguntas obrigatórias
      const scoresPorPerguntaObrigatoria = perguntasObrigatorias.map(pergunta => {
        let somaScores = 0;
        let countRespostas = 0;
        
        avaliacoes.forEach(avaliacao => {
          const resposta = avaliacao.respostasObrigatorias?.find(
            r => r.perguntaObrigatoriaId === pergunta.id && r.pontuacao !== null
          );
          if (resposta) {
            somaScores += resposta.pontuacao;
            countRespostas++;
          }
        });
        
        return {
          perguntaId: pergunta.id,
          numero: pergunta.numero,
          categoria: pergunta.categoria,
          texto: pergunta.texto,
          peso: pergunta.peso,
          score: countRespostas > 0 ? parseFloat((somaScores / countRespostas).toFixed(2)) : 0
        };
      });
      
      // Calcular score obrigatório ponderado
      let scoreObrigatorio = 0;
      let pesoTotalObrigatorio = 0;
      scoresPorPerguntaObrigatoria.forEach(p => {
        if (p.score > 0) {
          scoreObrigatorio += p.score * p.peso;
          pesoTotalObrigatorio += p.peso;
        }
      });
      if (pesoTotalObrigatorio > 0) {
        scoreObrigatorio = scoreObrigatorio / pesoTotalObrigatorio;
      }
      
      // Calcular scores por vertical
      const scoresPorVertical = verticais.map(vertical => {
        let somaScores = 0;
        let countRespostas = 0;
        
        avaliacoes.forEach(avaliacao => {
          vertical.perguntas.forEach(pergunta => {
            const resposta = avaliacao.respostasVerticais?.find(
              r => r.perguntaProdutoId === pergunta.id && r.pontuacao !== null
            );
            if (resposta) {
              somaScores += resposta.pontuacao;
              countRespostas++;
            }
          });
        });
        
        return {
          verticalId: vertical.id,
          nome: vertical.nome,
          icone: vertical.icone,
          score: countRespostas > 0 ? parseFloat((somaScores / countRespostas).toFixed(2)) : 0
        };
      });
      
      const verticaisComScore = scoresPorVertical.filter(v => v.score > 0);
      const scoreVerticais = verticaisComScore.length > 0
        ? verticaisComScore.reduce((acc, v) => acc + v.score, 0) / verticaisComScore.length
        : 0;
      
      // Faróis
      const getFarolTransformacao = (score) => {
        if (!score || score === 0) return { cor: 'gray', nivel: 'Não Avaliado', emoji: '⚪' };
        if (score < 2.0) return { cor: 'red', nivel: 'Crítico', emoji: '🔴' };
        if (score < 3.0) return { cor: 'orange', nivel: 'Atenção', emoji: '🟠' };
        if (score < 4.0) return { cor: 'yellow', nivel: 'Moderado', emoji: '🟡' };
        if (score < 4.5) return { cor: 'green', nivel: 'Bom', emoji: '🟢' };
        return { cor: 'emerald', nivel: 'Excelente', emoji: '💚' };
      };
      
      const getFarolPotencial = (score) => {
        if (!score || score === 0) return { cor: 'gray', nivel: 'Não Avaliado', emoji: '⚪' };
        if (score < 2.0) return { cor: 'red', nivel: 'Baixo', emoji: '📉' };
        if (score < 3.0) return { cor: 'orange', nivel: 'Limitado', emoji: '📊' };
        if (score < 4.0) return { cor: 'yellow', nivel: 'Moderado', emoji: '📈' };
        if (score < 4.5) return { cor: 'green', nivel: 'Alto', emoji: '🚀' };
        return { cor: 'emerald', nivel: 'Muito Alto', emoji: '⭐' };
      };
      
      const getFarolMaturidade = (count) => {
        if (count === 0) return { cor: 'gray', nivel: 'Sem Dados', emoji: '❓' };
        if (count === 1) return { cor: 'orange', nivel: 'Inicial', emoji: '🔸' };
        if (count === 2) return { cor: 'yellow', nivel: 'Validando', emoji: '🔶' };
        if (count >= 3) return { cor: 'green', nivel: 'Consolidado', emoji: '✅' };
        return { cor: 'gray', nivel: 'Não Avaliado', emoji: '⚪' };
      };
      
      const getFarolUrgencia = (scoreRelevancia, totalAv) => {
        if (!scoreRelevancia || scoreRelevancia === 0) return { cor: 'gray', nivel: 'Aguardando', emoji: '⏳', prioridade: 0 };
        if (scoreRelevancia >= 4.0 && totalAv >= 2) return { cor: 'emerald', nivel: 'Pronto p/ Deploy', emoji: '🎯', prioridade: 5 };
        if (scoreRelevancia >= 3.5 && totalAv >= 2) return { cor: 'green', nivel: 'Prioridade Alta', emoji: '🔥', prioridade: 4 };
        if (scoreRelevancia >= 3.0) return { cor: 'yellow', nivel: 'Em Análise', emoji: '🔍', prioridade: 3 };
        if (scoreRelevancia >= 2.0) return { cor: 'orange', nivel: 'Requer Ajustes', emoji: '⚠️', prioridade: 2 };
        return { cor: 'red', nivel: 'Revisar Escopo', emoji: '❌', prioridade: 1 };
      };
      
      return {
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao,
        status: produto.status,
        classificacao: produto.classificacao,
        scoreRelevancia: produto.scoreRelevancia || 0,
        scoreBlueprint: produto.scoreBlueprint || 0,
        scorePrioridadeEstrategica: produto.scorePrioridadeEstrategica || 0,
        scoreObrigatorio: parseFloat(scoreObrigatorio.toFixed(2)),
        scoreVerticais: parseFloat(scoreVerticais.toFixed(2)),
        totalAvaliacoes,
        scoresPorPerguntaObrigatoria,
        scoresPorVertical,
        farois: {
          transformacao: getFarolTransformacao(scoreObrigatorio),
          potencial: getFarolPotencial(scoreVerticais),
          maturidade: getFarolMaturidade(totalAvaliacoes),
          urgencia: getFarolUrgencia(produto.scoreRelevancia, totalAvaliacoes)
        },
        avaliadores: avaliacoes.map(a => ({
          id: a.usuario.id,
          nome: a.usuario.nome,
          email: a.usuario.email,
          scoreRelevancia: a.scoreRelevancia,
          scoreObrigatorio: a.scoreObrigatorio,
          scoreVerticais: a.scoreVerticais,
          dataAvaliacao: a.updatedAt
        }))
      };
    });
    
    // Métricas do projeto
    const produtosAvaliados = produtosDetalhados.filter(p => p.scoreRelevancia > 0);
    const scoreMedioProjeto = produtosAvaliados.length > 0
      ? produtosAvaliados.reduce((acc, p) => acc + p.scoreRelevancia, 0) / produtosAvaliados.length
      : 0;
    
    // Score médio por pergunta obrigatória (todos os produtos)
    const scoresMediosPorPergunta = perguntasObrigatorias.map(pergunta => {
      const scoresValidos = produtosDetalhados
        .map(p => p.scoresPorPerguntaObrigatoria.find(s => s.perguntaId === pergunta.id)?.score || 0)
        .filter(s => s > 0);
      
      return {
        perguntaId: pergunta.id,
        categoria: pergunta.categoria,
        texto: pergunta.texto,
        scoreMedio: scoresValidos.length > 0 
          ? parseFloat((scoresValidos.reduce((a, b) => a + b, 0) / scoresValidos.length).toFixed(2))
          : 0,
        produtosComScore: scoresValidos.length
      };
    });
    
    // Score médio por vertical (todos os produtos)
    const scoresMediosPorVertical = verticais.map(vertical => {
      const scoresValidos = produtosDetalhados
        .map(p => p.scoresPorVertical.find(s => s.verticalId === vertical.id)?.score || 0)
        .filter(s => s > 0);
      
      return {
        verticalId: vertical.id,
        nome: vertical.nome,
        icone: vertical.icone,
        scoreMedio: scoresValidos.length > 0 
          ? parseFloat((scoresValidos.reduce((a, b) => a + b, 0) / scoresValidos.length).toFixed(2))
          : 0,
        produtosComScore: scoresValidos.length
      };
    });
    
    res.json({
      projeto: {
        id: projeto.id,
        nome: projeto.nome,
        descricao: projeto.descricao,
        vertical: projeto.vertical,
        status: projeto.status
      },
      empresa: projeto.empresa,
      metricas: {
        totalProdutos: projeto.produtos.length,
        produtosAvaliados: produtosAvaliados.length,
        scoreMedio: parseFloat(scoreMedioProjeto.toFixed(2)),
        totalAvaliacoesMaturidade: projeto.avaliacoes.length,
        progressoAvaliacao: projeto.produtos.length > 0 
          ? Math.round((produtosAvaliados.length / projeto.produtos.length) * 100) 
          : 0
      },
      produtos: produtosDetalhados,
      analises: {
        scoresMediosPorPergunta,
        scoresMediosPorVertical
      },
      perguntasObrigatorias,
      verticais
    });
  } catch (error) {
    console.error('Erro no dashboard de projeto-produtos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard de Ranking de Projetos com Produtos
app.get('/api/dashboard/projetos-ranking', async (req, res) => {
  try {
    const { empresaId } = req.query;
    let where = {};
    
    if (empresaId) {
      where.empresaId = parseInt(empresaId);
    }
    
    const projetos = await prisma.projeto.findMany({
      where,
      include: {
        empresa: true,
        produtos: {
          include: {
            avaliacoes: {
              where: { status: 'finalizada' },
              include: {
                usuario: true,
                respostasObrigatorias: {
                  include: { perguntaObrigatoria: true }
                },
                respostasVerticais: {
                  include: { perguntaProduto: { include: { vertical: true } } }
                }
              }
            }
          },
          orderBy: [
            { classificacao: 'asc' },
            { scoreRelevancia: 'desc' }
          ]
        },
        avaliacoes: {
          where: { status: 'finalizada' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const verticais = await prisma.verticalProduto.findMany({
      orderBy: { ordem: 'asc' }
    });
    
    const projetosComDados = projetos.map(projeto => {
      const produtosAvaliados = projeto.produtos.filter(p => p.scoreRelevancia && p.scoreRelevancia > 0);
      const totalProdutos = projeto.produtos.length;
      
      const scoreMedioProjeto = produtosAvaliados.length > 0
        ? produtosAvaliados.reduce((acc, p) => acc + p.scoreRelevancia, 0) / produtosAvaliados.length
        : 0;
      
      const produtosComFarois = projeto.produtos.map(produto => {
        const avaliacoes = produto.avaliacoes || [];
        const totalAvaliacoes = avaliacoes.length;
        
        let scoreObrigatorioMedio = 0;
        let scoreVerticaisMedio = 0;
        
        if (totalAvaliacoes > 0) {
          avaliacoes.forEach(av => {
            if (av.scoreObrigatorio) scoreObrigatorioMedio += av.scoreObrigatorio;
            if (av.scoreVerticais) scoreVerticaisMedio += av.scoreVerticais;
          });
          scoreObrigatorioMedio = scoreObrigatorioMedio / totalAvaliacoes;
          scoreVerticaisMedio = scoreVerticaisMedio / totalAvaliacoes;
        }
        
        const getFarolTransformacao = (score) => {
          if (!score || score === 0) return { cor: 'gray', nivel: 'Não Avaliado', emoji: '⚪' };
          if (score < 2.0) return { cor: 'red', nivel: 'Crítico', emoji: '🔴' };
          if (score < 3.0) return { cor: 'orange', nivel: 'Atenção', emoji: '🟠' };
          if (score < 4.0) return { cor: 'yellow', nivel: 'Moderado', emoji: '🟡' };
          if (score < 4.5) return { cor: 'green', nivel: 'Bom', emoji: '🟢' };
          return { cor: 'emerald', nivel: 'Excelente', emoji: '💚' };
        };
        
        const getFarolPotencial = (score) => {
          if (!score || score === 0) return { cor: 'gray', nivel: 'Não Avaliado', emoji: '⚪' };
          if (score < 2.0) return { cor: 'red', nivel: 'Baixo', emoji: '📉' };
          if (score < 3.0) return { cor: 'orange', nivel: 'Limitado', emoji: '📊' };
          if (score < 4.0) return { cor: 'yellow', nivel: 'Moderado', emoji: '📈' };
          if (score < 4.5) return { cor: 'green', nivel: 'Alto', emoji: '🚀' };
          return { cor: 'emerald', nivel: 'Muito Alto', emoji: '⭐' };
        };
        
        const getFarolMaturidade = (count) => {
          if (count === 0) return { cor: 'gray', nivel: 'Sem Dados', emoji: '❓' };
          if (count === 1) return { cor: 'orange', nivel: 'Inicial', emoji: '🔸' };
          if (count === 2) return { cor: 'yellow', nivel: 'Validando', emoji: '🔶' };
          if (count >= 3) return { cor: 'green', nivel: 'Consolidado', emoji: '✅' };
          return { cor: 'gray', nivel: 'Não Avaliado', emoji: '⚪' };
        };
        
        const getFarolUrgencia = (scoreRelevancia, totalAv) => {
          if (!scoreRelevancia || scoreRelevancia === 0) return { cor: 'gray', nivel: 'Aguardando', emoji: '⏳', prioridade: 0 };
          if (scoreRelevancia >= 4.0 && totalAv >= 2) return { cor: 'emerald', nivel: 'Pronto p/ Deploy', emoji: '🎯', prioridade: 5 };
          if (scoreRelevancia >= 3.5 && totalAv >= 2) return { cor: 'green', nivel: 'Prioridade Alta', emoji: '🔥', prioridade: 4 };
          if (scoreRelevancia >= 3.0) return { cor: 'yellow', nivel: 'Em Análise', emoji: '🔍', prioridade: 3 };
          if (scoreRelevancia >= 2.0) return { cor: 'orange', nivel: 'Requer Ajustes', emoji: '⚠️', prioridade: 2 };
          return { cor: 'red', nivel: 'Revisar Escopo', emoji: '❌', prioridade: 1 };
        };
        
        return {
          id: produto.id,
          nome: produto.nome,
          descricao: produto.descricao,
          status: produto.status,
          scoreRelevancia: produto.scoreRelevancia || 0,
          scoreBlueprint: produto.scoreBlueprint || 0,
          scorePrioridadeEstrategica: produto.scorePrioridadeEstrategica || 0,
          scoreObrigatorio: parseFloat(scoreObrigatorioMedio.toFixed(2)),
          classificacao: produto.classificacao,
          totalAvaliacoes,
          farois: {
            transformacao: getFarolTransformacao(scoreObrigatorioMedio),
            potencial: getFarolPotencial(scoreVerticaisMedio),
            maturidade: getFarolMaturidade(totalAvaliacoes),
            urgencia: getFarolUrgencia(produto.scoreRelevancia, totalAvaliacoes)
          },
          avaliadores: avaliacoes.map(a => ({
            id: a.usuario.id,
            nome: a.usuario.nome,
            scoreRelevancia: a.scoreRelevancia
          }))
        };
      });
      
      const produtosOrdenados = [...produtosComFarois].sort((a, b) => {
        if (a.classificacao && b.classificacao) return a.classificacao - b.classificacao;
        if (a.classificacao) return -1;
        if (b.classificacao) return 1;
        return b.scoreRelevancia - a.scoreRelevancia;
      });
      
      const getStatusProjeto = () => {
        if (totalProdutos === 0) return { cor: 'gray', texto: 'Sem Produtos', emoji: '📭' };
        if (produtosAvaliados.length === 0) return { cor: 'orange', texto: 'Aguardando Avaliações', emoji: '⏰' };
        if (produtosAvaliados.length < totalProdutos) return { cor: 'yellow', texto: 'Em Andamento', emoji: '🔄' };
        return { cor: 'green', texto: 'Completo', emoji: '✅' };
      };
      
      return {
        id: projeto.id,
        nome: projeto.nome,
        descricao: projeto.descricao,
        vertical: projeto.vertical,
        empresa: projeto.empresa,
        status: getStatusProjeto(),
        metricas: {
          totalProdutos,
          produtosAvaliados: produtosAvaliados.length,
          scoreMedio: parseFloat(scoreMedioProjeto.toFixed(2)),
          totalAvaliacoes: projeto.avaliacoes.length,
          progressoAvaliacao: totalProdutos > 0 ? Math.round((produtosAvaliados.length / totalProdutos) * 100) : 0
        },
        produtos: produtosOrdenados
      };
    });
    
    const totalGeral = {
      projetos: projetos.length,
      produtos: projetos.reduce((acc, p) => acc + p.produtos.length, 0),
      produtosAvaliados: projetos.reduce((acc, p) => acc + p.produtos.filter(pr => pr.scoreRelevancia > 0).length, 0),
      avaliacoesProduto: projetos.reduce((acc, p) => acc + p.produtos.reduce((a, pr) => a + (pr.avaliacoes?.length || 0), 0), 0)
    };
    
    res.json({
      projetos: projetosComDados,
      verticais,
      totais: totalGeral
    });
  } catch (error) {
    console.error('Erro no dashboard de projetos:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== RECÁLCULO DE PRIORIDADE ESTRATÉGICA ====================

/**
 * POST /api/projetos/:id/recalcular-prioridade
 * Recalcula a classificação de todos os produtos de um projeto
 * considerando o score do Blueprint (projeto)
 */
app.post('/api/projetos/:id/recalcular-prioridade', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.id);
    
    const projeto = await prisma.projeto.findUnique({
      where: { id: projetoId },
      include: {
        produtos: true,
        avaliacoes: {
          where: { status: 'finalizada', scoreGeral: { not: null } }
        }
      }
    });
    
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    // Recalcular classificação usando a função existente
    await atualizarClassificacaoProdutos(projetoId);
    
    // Buscar produtos atualizados
    const produtosAtualizados = await prisma.produto.findMany({
      where: { projetoId },
      orderBy: [
        { classificacao: 'asc' },
        { scorePrioridadeEstrategica: 'desc' }
      ],
      select: {
        id: true,
        nome: true,
        scoreRelevancia: true,
        scoreBlueprint: true,
        scorePrioridadeEstrategica: true,
        classificacao: true
      }
    });
    
    res.json({
      message: 'Prioridade estratégica recalculada com sucesso',
      scoreBlueprint: projeto.avaliacoes.length > 0 
        ? parseFloat((projeto.avaliacoes.reduce((acc, a) => acc + a.scoreGeral, 0) / projeto.avaliacoes.length).toFixed(2))
        : 0,
      totalAvaliacoesBlueprint: projeto.avaliacoes.length,
      produtos: produtosAtualizados
    });
  } catch (error) {
    console.error('Erro ao recalcular prioridade:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/recalcular-prioridades-todos
 * Recalcula a prioridade estratégica de TODOS os produtos de todos os projetos
 */
app.post('/api/recalcular-prioridades-todos', async (req, res) => {
  try {
    const projetos = await prisma.projeto.findMany({
      select: { id: true, nome: true }
    });
    
    const resultados = [];
    
    for (const projeto of projetos) {
      await atualizarClassificacaoProdutos(projeto.id);
      
      const produtos = await prisma.produto.findMany({
        where: { projetoId: projeto.id },
        select: {
          id: true,
          nome: true,
          scoreRelevancia: true,
          scoreBlueprint: true,
          scorePrioridadeEstrategica: true,
          classificacao: true
        },
        orderBy: { classificacao: 'asc' }
      });
      
      resultados.push({
        projetoId: projeto.id,
        projetoNome: projeto.nome,
        produtosAtualizados: produtos.length,
        produtos
      });
    }
    
    res.json({
      message: 'Prioridades recalculadas para todos os projetos',
      totalProjetos: projetos.length,
      resultados
    });
  } catch (error) {
    console.error('Erro ao recalcular todas as prioridades:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== PRIORIDADES ESTRATÉGICAS POR EMPRESA ====================

/**
 * GET /api/dashboard/empresa-prioridades/:empresaId
 * Lista TODOS os produtos de TODOS os projetos da empresa
 * ordenados pela Prioridade Estratégica (considerando Blueprint de cada projeto)
 */
app.get('/api/dashboard/empresa-prioridades/:empresaId', async (req, res) => {
  try {
    const empresaId = parseInt(req.params.empresaId);
    
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      include: {
        projetos: {
          include: {
            avaliacoes: {
              where: { status: 'finalizada', scoreGeral: { not: null } }
            },
            produtos: {
              include: {
                vertical: true,
                avaliacoes: {
                  where: { status: 'finalizada' }
                }
              }
            }
          }
        }
      }
    });
    
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    
    // Calcular score do Blueprint para cada projeto
    const projetosComBlueprint = empresa.projetos.map(projeto => {
      const avaliacoesBlueprint = projeto.avaliacoes || [];
      let scoreBlueprint = 0;
      
      if (avaliacoesBlueprint.length > 0) {
        const soma = avaliacoesBlueprint.reduce((acc, a) => acc + (a.scoreGeral || 0), 0);
        scoreBlueprint = soma / avaliacoesBlueprint.length;
      }
      
      return {
        ...projeto,
        scoreBlueprint: parseFloat(scoreBlueprint.toFixed(2)),
        nivelBlueprint: getNivelMaturidade(scoreBlueprint),
        totalAvaliacoesBlueprint: avaliacoesBlueprint.length
      };
    });
    
    // Criar lista consolidada de produtos com prioridade estratégica
    const todosProdutos = [];
    
    for (const projeto of projetosComBlueprint) {
      for (const produto of projeto.produtos) {
        const scoreRelevancia = produto.scoreRelevancia || 0;
        const scoreBlueprint = projeto.scoreBlueprint || 0;
        
        // Fórmula: 60% Produto + 40% Blueprint
        let scorePrioridadeEstrategica;
        if (scoreRelevancia > 0) {
          if (scoreBlueprint > 0) {
            scorePrioridadeEstrategica = (scoreRelevancia * 0.6) + (scoreBlueprint * 0.4);
          } else {
            scorePrioridadeEstrategica = scoreRelevancia;
          }
        } else {
          scorePrioridadeEstrategica = 0;
        }
        
        todosProdutos.push({
          id: produto.id,
          nome: produto.nome,
          descricao: produto.descricao,
          status: produto.status,
          statusConstrucao: produto.statusConstrucao || 'planejado',
          vertical: produto.vertical,
          
          // Projeto/Blueprint info
          projetoId: projeto.id,
          projetoNome: projeto.nome,
          
          // Scores
          scoreRelevancia: parseFloat(scoreRelevancia.toFixed(2)),
          scoreBlueprint: parseFloat(scoreBlueprint.toFixed(2)),
          scorePrioridadeEstrategica: parseFloat(scorePrioridadeEstrategica.toFixed(2)),
          classificacaoProjeto: produto.classificacao,
          
          // Avaliações
          totalAvaliacoesProduto: produto.avaliacoes?.length || 0,
          totalAvaliacoesBlueprint: projeto.totalAvaliacoesBlueprint,
          
          // Financeiro
          custoEstimado: produto.custoEstimado,
          retornoAnualEsperado: produto.retornoAnualEsperado,
          roi: produto.custoEstimado > 0 
            ? parseFloat(((produto.retornoAnualEsperado || 0) / produto.custoEstimado * 100).toFixed(1))
            : 0,
          
          // Cronograma
          dataInicioConstrucao: produto.dataInicioConstrucao,
          dataFimConstrucao: produto.dataFimConstrucao,
          dataAtivacaoProducao: produto.dataAtivacaoProducao
        });
      }
    }
    
    // Ordenar por Prioridade Estratégica (maior primeiro)
    todosProdutos.sort((a, b) => b.scorePrioridadeEstrategica - a.scorePrioridadeEstrategica);
    
    // Atribuir classificação global na empresa
    todosProdutos.forEach((produto, index) => {
      produto.classificacaoEmpresa = produto.scorePrioridadeEstrategica > 0 ? index + 1 : null;
    });
    
    // Métricas consolidadas
    const produtosAvaliados = todosProdutos.filter(p => p.scoreRelevancia > 0);
    const produtosComBlueprint = todosProdutos.filter(p => p.scoreBlueprint > 0);
    
    const mediaPrioridade = produtosAvaliados.length > 0
      ? produtosAvaliados.reduce((acc, p) => acc + p.scorePrioridadeEstrategica, 0) / produtosAvaliados.length
      : 0;
    
    // Resumo por projeto
    const resumoPorProjeto = projetosComBlueprint.map(projeto => ({
      id: projeto.id,
      nome: projeto.nome,
      vertical: projeto.vertical,
      scoreBlueprint: projeto.scoreBlueprint,
      nivelBlueprint: projeto.nivelBlueprint,
      totalProdutos: projeto.produtos.length,
      produtosAvaliados: projeto.produtos.filter(p => p.scoreRelevancia > 0).length,
      topProduto: todosProdutos
        .filter(p => p.projetoId === projeto.id && p.scoreRelevancia > 0)
        .sort((a, b) => b.scorePrioridadeEstrategica - a.scorePrioridadeEstrategica)[0]?.nome || null
    }));
    
    res.json({
      empresa: {
        id: empresa.id,
        nome: empresa.nome
      },
      metricas: {
        totalProjetos: empresa.projetos.length,
        totalProdutos: todosProdutos.length,
        produtosAvaliados: produtosAvaliados.length,
        produtosComBlueprintAvaliado: produtosComBlueprint.length,
        mediaPrioridadeEstrategica: parseFloat(mediaPrioridade.toFixed(2))
      },
      resumoPorProjeto,
      // Lista ordenada por prioridade estratégica (para execução)
      produtosOrdenadosPorPrioridade: todosProdutos
    });
  } catch (error) {
    console.error('Erro no dashboard de prioridades da empresa:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/empresas/:empresaId/recalcular-prioridades
 * Recalcula a prioridade estratégica de TODOS os produtos de uma empresa
 */
app.post('/api/empresas/:empresaId/recalcular-prioridades', async (req, res) => {
  try {
    const empresaId = parseInt(req.params.empresaId);
    
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      include: {
        projetos: { select: { id: true, nome: true } }
      }
    });
    
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    
    const resultados = [];
    
    for (const projeto of empresa.projetos) {
      await atualizarClassificacaoProdutos(projeto.id);
      
      const produtos = await prisma.produto.findMany({
        where: { projetoId: projeto.id },
        select: {
          id: true,
          nome: true,
          scoreRelevancia: true,
          scoreBlueprint: true,
          scorePrioridadeEstrategica: true,
          classificacao: true
        },
        orderBy: { classificacao: 'asc' }
      });
      
      resultados.push({
        projetoId: projeto.id,
        projetoNome: projeto.nome,
        produtosAtualizados: produtos.length
      });
    }
    
    res.json({
      message: `Prioridades recalculadas para empresa "${empresa.nome}"`,
      empresa: { id: empresa.id, nome: empresa.nome },
      totalProjetos: empresa.projetos.length,
      resultados
    });
  } catch (error) {
    console.error('Erro ao recalcular prioridades da empresa:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DASHBOARD FINANCEIRO E TIMELINE ====================

// Dashboard Financeiro do Projeto (custos, ROI, timeline)
app.get('/api/dashboard/projeto-financeiro/:id', async (req, res) => {
  try {
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        empresa: true,
        produtos: {
          orderBy: [
            { dataInicioConstrucao: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });
    
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const produtos = projeto.produtos;
    
    // Métricas Financeiras Consolidadas
    const custoTotalEstimado = produtos.reduce((acc, p) => acc + (p.custoEstimado || 0), 0);
    const retornoAnualTotal = produtos.reduce((acc, p) => acc + (p.retornoAnualEsperado || 0), 0);
    
    // ROI Projetado (Retorno Anual / Custo Total * 100)
    const roiProjetado = custoTotalEstimado > 0 ? ((retornoAnualTotal / custoTotalEstimado) * 100) : 0;
    
    // Payback em meses
    const paybackMeses = retornoAnualTotal > 0 ? Math.ceil((custoTotalEstimado / (retornoAnualTotal / 12))) : null;
    
    // Produtos por Status de Construção
    const statusCounts = {
      planejado: produtos.filter(p => p.statusConstrucao === 'planejado' || !p.statusConstrucao).length,
      em_construcao: produtos.filter(p => p.statusConstrucao === 'em_construcao').length,
      em_teste: produtos.filter(p => p.statusConstrucao === 'em_teste').length,
      ativo: produtos.filter(p => p.statusConstrucao === 'ativo').length,
      suspenso: produtos.filter(p => p.statusConstrucao === 'suspenso').length,
      cancelado: produtos.filter(p => p.statusConstrucao === 'cancelado').length
    };
    
    // Custo por Status
    const custoPorStatus = {
      planejado: produtos.filter(p => p.statusConstrucao === 'planejado' || !p.statusConstrucao).reduce((acc, p) => acc + (p.custoEstimado || 0), 0),
      em_construcao: produtos.filter(p => p.statusConstrucao === 'em_construcao').reduce((acc, p) => acc + (p.custoEstimado || 0), 0),
      em_teste: produtos.filter(p => p.statusConstrucao === 'em_teste').reduce((acc, p) => acc + (p.custoEstimado || 0), 0),
      ativo: produtos.filter(p => p.statusConstrucao === 'ativo').reduce((acc, p) => acc + (p.custoEstimado || 0), 0),
      suspenso: produtos.filter(p => p.statusConstrucao === 'suspenso').reduce((acc, p) => acc + (p.custoEstimado || 0), 0),
      cancelado: produtos.filter(p => p.statusConstrucao === 'cancelado').reduce((acc, p) => acc + (p.custoEstimado || 0), 0)
    };
    
    // Timeline dos Produtos (para Gantt)
    const timeline = produtos
      .filter(p => p.dataInicioConstrucao || p.dataFimConstrucao || p.dataAtivacaoProducao)
      .map(p => ({
        id: p.id,
        nome: p.nome,
        custoEstimado: p.custoEstimado,
        retornoAnualEsperado: p.retornoAnualEsperado,
        dataInicio: p.dataInicioConstrucao,
        dataFim: p.dataFimConstrucao,
        dataAtivacao: p.dataAtivacaoProducao,
        statusConstrucao: p.statusConstrucao || 'planejado',
        scoreRelevancia: p.scoreRelevancia
      }));
    
    // Projeção Mensal de Custos e Retornos (próximos 24 meses)
    const hoje = new Date();
    const projecaoMensal = [];
    
    for (let i = 0; i < 24; i++) {
      const mesData = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      const mesKey = `${mesData.getFullYear()}-${String(mesData.getMonth() + 1).padStart(2, '0')}`;
      
      let custoMes = 0;
      let retornoMes = 0;
      let produtosEmConstrucao = 0;
      let produtosAtivos = 0;
      
      produtos.forEach(p => {
        // Custos distribuídos durante período de construção
        if (p.dataInicioConstrucao && p.dataFimConstrucao && p.custoEstimado) {
          const inicio = new Date(p.dataInicioConstrucao);
          const fim = new Date(p.dataFimConstrucao);
          
          if (mesData >= inicio && mesData <= fim) {
            const mesesConstrucao = Math.max(1, Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24 * 30)));
            custoMes += p.custoEstimado / mesesConstrucao;
            produtosEmConstrucao++;
          }
        }
        
        // Retornos após ativação
        if (p.dataAtivacaoProducao && p.retornoAnualEsperado) {
          const ativacao = new Date(p.dataAtivacaoProducao);
          if (mesData >= ativacao) {
            retornoMes += p.retornoAnualEsperado / 12;
            produtosAtivos++;
          }
        }
      });
      
      projecaoMensal.push({
        mes: mesKey,
        mesLabel: mesData.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        custo: Math.round(custoMes),
        retorno: Math.round(retornoMes),
        saldo: Math.round(retornoMes - custoMes),
        produtosEmConstrucao,
        produtosAtivos
      });
    }
    
    // Calcular saldo acumulado
    let saldoAcumulado = 0;
    projecaoMensal.forEach(m => {
      saldoAcumulado += m.saldo;
      m.saldoAcumulado = saldoAcumulado;
    });
    
    // Produtos detalhados para o dashboard
    const produtosDetalhados = produtos.map(p => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      statusConstrucao: p.statusConstrucao || 'planejado',
      custoEstimado: p.custoEstimado,
      retornoAnualEsperado: p.retornoAnualEsperado,
      roiIndividual: p.custoEstimado > 0 ? ((p.retornoAnualEsperado || 0) / p.custoEstimado * 100) : 0,
      paybackMeses: p.retornoAnualEsperado > 0 ? Math.ceil((p.custoEstimado || 0) / (p.retornoAnualEsperado / 12)) : null,
      dataInicioConstrucao: p.dataInicioConstrucao,
      dataFimConstrucao: p.dataFimConstrucao,
      dataAtivacaoProducao: p.dataAtivacaoProducao,
      observacoesCronograma: p.observacoesCronograma,
      scoreRelevancia: p.scoreRelevancia,
      classificacao: p.classificacao
    }));
    
    res.json({
      projeto: {
        id: projeto.id,
        nome: projeto.nome,
        descricao: projeto.descricao,
        vertical: projeto.vertical
      },
      empresa: projeto.empresa,
      metricas: {
        totalProdutos: produtos.length,
        custoTotalEstimado,
        retornoAnualTotal,
        roiProjetado: parseFloat(roiProjetado.toFixed(1)),
        paybackMeses,
        retornoMensalMedio: Math.round(retornoAnualTotal / 12)
      },
      statusCounts,
      custoPorStatus,
      timeline,
      projecaoMensal,
      produtos: produtosDetalhados
    });
  } catch (error) {
    console.error('Erro no dashboard financeiro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Financeiro Consolidado da Empresa
app.get('/api/dashboard/empresa-financeiro/:id', async (req, res) => {
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        projetos: {
          include: {
            produtos: true
          }
        }
      }
    });
    
    if (!empresa) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }
    
    const todosProdutos = empresa.projetos.flatMap(p => p.produtos);
    
    // Métricas Consolidadas
    const custoTotalEstimado = todosProdutos.reduce((acc, p) => acc + (p.custoEstimado || 0), 0);
    const retornoAnualTotal = todosProdutos.reduce((acc, p) => acc + (p.retornoAnualEsperado || 0), 0);
    const roiProjetado = custoTotalEstimado > 0 ? ((retornoAnualTotal / custoTotalEstimado) * 100) : 0;
    const paybackMeses = retornoAnualTotal > 0 ? Math.ceil((custoTotalEstimado / (retornoAnualTotal / 12))) : null;
    
    // Métricas por Projeto
    const metricasPorProjeto = empresa.projetos.map(projeto => {
      const produtos = projeto.produtos;
      const custo = produtos.reduce((acc, p) => acc + (p.custoEstimado || 0), 0);
      const retorno = produtos.reduce((acc, p) => acc + (p.retornoAnualEsperado || 0), 0);
      
      return {
        id: projeto.id,
        nome: projeto.nome,
        vertical: projeto.vertical,
        totalProdutos: produtos.length,
        custoTotal: custo,
        retornoAnual: retorno,
        roi: custo > 0 ? parseFloat(((retorno / custo) * 100).toFixed(1)) : 0,
        produtosPlanejados: produtos.filter(p => p.statusConstrucao === 'planejado' || !p.statusConstrucao).length,
        produtosEmConstrucao: produtos.filter(p => p.statusConstrucao === 'em_construcao').length,
        produtosAtivos: produtos.filter(p => p.statusConstrucao === 'ativo').length
      };
    });
    
    // Status Consolidado
    const statusCounts = {
      planejado: todosProdutos.filter(p => p.statusConstrucao === 'planejado' || !p.statusConstrucao).length,
      em_construcao: todosProdutos.filter(p => p.statusConstrucao === 'em_construcao').length,
      em_teste: todosProdutos.filter(p => p.statusConstrucao === 'em_teste').length,
      ativo: todosProdutos.filter(p => p.statusConstrucao === 'ativo').length,
      suspenso: todosProdutos.filter(p => p.statusConstrucao === 'suspenso').length,
      cancelado: todosProdutos.filter(p => p.statusConstrucao === 'cancelado').length
    };
    
    // Top 10 Produtos por ROI
    const topProdutosRoi = todosProdutos
      .filter(p => p.custoEstimado > 0)
      .map(p => ({
        id: p.id,
        nome: p.nome,
        custoEstimado: p.custoEstimado,
        retornoAnualEsperado: p.retornoAnualEsperado,
        roi: ((p.retornoAnualEsperado || 0) / p.custoEstimado * 100),
        statusConstrucao: p.statusConstrucao || 'planejado',
        scoreRelevancia: p.scoreRelevancia
      }))
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 10);
    
    res.json({
      empresa,
      metricas: {
        totalProjetos: empresa.projetos.length,
        totalProdutos: todosProdutos.length,
        custoTotalEstimado,
        retornoAnualTotal,
        roiProjetado: parseFloat(roiProjetado.toFixed(1)),
        paybackMeses,
        retornoMensalMedio: Math.round(retornoAnualTotal / 12)
      },
      statusCounts,
      metricasPorProjeto,
      topProdutosRoi
    });
  } catch (error) {
    console.error('Erro no dashboard financeiro da empresa:', error);
    res.status(500).json({ error: error.message });
  }
});

// Timeline Gantt de todos os produtos de um projeto
app.get('/api/timeline/projeto/:id', async (req, res) => {
  try {
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        empresa: true,
        produtos: {
          orderBy: { dataInicioConstrucao: 'asc' }
        }
      }
    });
    
    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    const STATUS_COLORS = {
      planejado: '#6b7280',
      em_construcao: '#3b82f6',
      em_teste: '#f59e0b',
      ativo: '#22c55e',
      suspenso: '#ef4444',
      cancelado: '#9ca3af'
    };
    
    const tasks = projeto.produtos.map((p, index) => ({
      id: p.id,
      name: p.nome,
      start: p.dataInicioConstrucao || new Date().toISOString(),
      end: p.dataFimConstrucao || p.dataAtivacaoProducao || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      activationDate: p.dataAtivacaoProducao,
      status: p.statusConstrucao || 'planejado',
      color: STATUS_COLORS[p.statusConstrucao || 'planejado'],
      custoEstimado: p.custoEstimado,
      retornoAnualEsperado: p.retornoAnualEsperado,
      scoreRelevancia: p.scoreRelevancia,
      classificacao: p.classificacao,
      progress: getProgressoStatus(p.statusConstrucao)
    }));
    
    res.json({
      projeto: {
        id: projeto.id,
        nome: projeto.nome,
        descricao: projeto.descricao
      },
      empresa: projeto.empresa,
      tasks,
      statusColors: STATUS_COLORS
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function getProgressoStatus(status) {
  const progressos = {
    planejado: 0,
    em_construcao: 40,
    em_teste: 75,
    ativo: 100,
    suspenso: 50,
    cancelado: 0
  };
  return progressos[status] || 0;
}

// ==================== FUNÇÕES AUXILIARES ====================

/** Texto da opção escolhida (linhas do campo criterios da pergunta), sem expor nota numérica. */
function textoLinhaCriterioAvaliacao(pontuacao, criterios) {
  if (pontuacao == null || criterios == null || typeof criterios !== 'string') return '';
  const lines = criterios.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length === 0) return '';
  const idx = Math.min(Math.max(Number(pontuacao), 1), lines.length) - 1;
  return lines[idx] || '';
}

function getNivelMaturidade(score) {
  return faixaNivelPorScore(score).nome;
}

function getNivelRelevancia(score) {
  const n = faixaNivelPorScore(score).nivel;
  return ['Baixa Relevância', 'Relevância Moderada', 'Boa Relevância', 'Alta Relevância', 'Muito Alta Relevância'][n - 1];
}

function getClassificacao(score) {
  return faixaNivelPorScore(score).nome;
}

// ==========================================
// FUNÇÕES MIT CISR - Estágio e Eficácia
// Baseado no MIT CISR Enterprise AI Maturity Model (2024)
// ==========================================

/**
 * Calcula as métricas de eficácia MIT CISR a partir dos scores por área
 * Total AI Effectiveness = média de 3 dimensões:
 * 1. Eficácia para melhorar operações
 * 2. Eficácia para melhorar experiência do cliente
 * 3. Eficácia para suportar e desenvolver ecossistema
 */
function calcularEficaciaMIT(scoresPorArea) {
  // Mapeia as áreas para as 3 dimensões MIT
  const dimensoesMIT = {
    operacoes: [
      'Operações e Processos',
      'Dados e Tecnologia',
      'Plataforma e Industrialização de IA',
      'Valor de Negócio e ROI'
    ],
    cliente: [
      'Estratégia e Liderança',
      'Pessoas e Cultura',
      'Inovação e Experimentação',
      'Prontidão para Mudança'
    ],
    ecossistema: [
      'Ecossistema e Parcerias',
      'IA como Gerador de Receita',
      'Maturidade por Tipo de IA',
      'Governança e Risco'
    ]
  };

  function calcularMediaDimensao(areasNomes) {
    const areasRelevantes = scoresPorArea.filter(a => areasNomes.includes(a.area));
    if (areasRelevantes.length === 0) return 0;
    const soma = areasRelevantes.reduce((acc, a) => acc + a.score, 0);
    return soma / areasRelevantes.length;
  }

  const eficaciaOperacoes = calcularMediaDimensao(dimensoesMIT.operacoes);
  const eficaciaCliente = calcularMediaDimensao(dimensoesMIT.cliente);
  const eficaciaEcossistema = calcularMediaDimensao(dimensoesMIT.ecossistema);
  
  // Total AI Effectiveness é a média das 3 dimensões (convertido para 0-100%)
  const totalAIEffectiveness = ((eficaciaOperacoes + eficaciaCliente + eficaciaEcossistema) / 3) * 20;

  return {
    eficaciaOperacoes: parseFloat(eficaciaOperacoes.toFixed(2)),
    eficaciaOperacoesPercent: parseFloat((eficaciaOperacoes * 20).toFixed(1)),
    eficaciaCliente: parseFloat(eficaciaCliente.toFixed(2)),
    eficaciaClientePercent: parseFloat((eficaciaCliente * 20).toFixed(1)),
    eficaciaEcossistema: parseFloat(eficaciaEcossistema.toFixed(2)),
    eficaciaEcossistemaPercent: parseFloat((eficaciaEcossistema * 20).toFixed(1)),
    totalAIEffectiveness: parseFloat(totalAIEffectiveness.toFixed(1)),
    descricao: {
      operacoes: 'Eficácia em melhorar operações (eficiência, produtividade, qualidade)',
      cliente: 'Eficácia em melhorar experiência do cliente (satisfação, personalização)',
      ecossistema: 'Eficácia em suportar e desenvolver o ecossistema (parceiros, comunidade)'
    }
  };
}

/**
 * Calcula a maturidade por tipo de IA (se a área existir)
 */
function calcularMaturidadePorTipoIA(scoresPorArea) {
  const areaTiposIA = scoresPorArea.find(a => a.area === 'Maturidade por Tipo de IA');
  if (!areaTiposIA) {
    return {
      analitica: 0,
      generativa: 0,
      agentica: 0,
      robotica: 0,
      combinacao: 0
    };
  }
  
  // Os scores individuais seriam calculados a partir das respostas específicas
  // Por agora retornamos o score geral da área como proxy
  return {
    geral: areaTiposIA.score,
    disponivel: true
  };
}

async function calcularScore(avaliacaoId) {
  const avaliacao = await prisma.avaliacao.findUnique({
    where: { id: avaliacaoId },
    include: {
      respostas: {
        include: {
          pergunta: { include: { area: true } }
        }
      }
    }
  });
  
  const areas = await prisma.area.findMany();
  const areasSelecionadas = avaliacao.areasSelecionadas 
    ? JSON.parse(avaliacao.areasSelecionadas) 
    : areas.map(a => a.id);
  const areasRecusadasIds = parseAreasRecusadas(avaliacao);
  
  let scoreGeral = 0;
  let totalPeso = 0;
  
  for (const area of areas) {
    if (!areasSelecionadas.includes(area.id)) continue;
    if (areasRecusadasIds.includes(area.id)) continue;
    // Score usa apenas Resposta × Pergunta das áreas; desejosIA (JSON) não entra aqui.
    
    const respostasArea = avaliacao.respostas.filter(
      r => r.pergunta.areaId === area.id && r.pontuacao !== null
    );
    
    if (respostasArea.length > 0) {
      const somapontos = respostasArea.reduce((acc, r) => acc + r.pontuacao, 0);
      const media = somapontos / respostasArea.length;
      scoreGeral += media * area.peso;
      totalPeso += area.peso;
    }
  }
  
  const scoreFinal = totalPeso > 0 ? scoreGeral / totalPeso : 0;

  return updateAvaliacaoComMergeFallback(prisma, avaliacaoId, {
    scoreGeral: parseFloat(scoreFinal.toFixed(2)),
    nivelGeral: getNivelMaturidade(scoreFinal)
  });
}

async function calcularScoreProduto(avaliacaoId) {
  const avaliacao = await prisma.avaliacaoProduto.findUnique({
    where: { id: avaliacaoId },
    include: {
      respostasObrigatorias: {
        include: {
          perguntaObrigatoria: true
        }
      },
      respostasVerticais: {
        include: {
          perguntaProduto: {
            include: { vertical: true }
          }
        }
      }
    }
  });
  
  // Calcular Score Obrigatório (Transformação Agêntica) usando pesos
  let scoreObrigatorio = 0;
  let pesoTotalObrigatorio = 0;
  
  const respostasObrigatoriasComPontuacao = avaliacao.respostasObrigatorias.filter(r => r.pontuacao !== null);
  if (respostasObrigatoriasComPontuacao.length > 0) {
    for (const resposta of respostasObrigatoriasComPontuacao) {
      const peso = resposta.perguntaObrigatoria.peso;
      scoreObrigatorio += resposta.pontuacao * peso;
      pesoTotalObrigatorio += peso;
    }
    if (pesoTotalObrigatorio > 0) {
      scoreObrigatorio = scoreObrigatorio / pesoTotalObrigatorio;
    }
  }
  
  // Calcular Score das Verticais (média simples)
  let scoreVerticais = 0;
  const respostasVerticaisComPontuacao = avaliacao.respostasVerticais.filter(r => r.pontuacao !== null);
  if (respostasVerticaisComPontuacao.length > 0) {
    const soma = respostasVerticaisComPontuacao.reduce((acc, r) => acc + r.pontuacao, 0);
    scoreVerticais = soma / respostasVerticaisComPontuacao.length;
  }
  
  // Score de Relevância Final: combinação ponderada
  // 60% Score Obrigatório (Transformação Agêntica) + 40% Score Verticais
  let scoreRelevancia = 0;
  if (pesoTotalObrigatorio > 0 && respostasVerticaisComPontuacao.length > 0) {
    scoreRelevancia = (scoreObrigatorio * 0.6) + (scoreVerticais * 0.4);
  } else if (pesoTotalObrigatorio > 0) {
    scoreRelevancia = scoreObrigatorio;
  } else if (respostasVerticaisComPontuacao.length > 0) {
    scoreRelevancia = scoreVerticais;
  }
  
  await prisma.avaliacaoProduto.update({
    where: { id: avaliacaoId },
    data: {
      scoreObrigatorio: parseFloat(scoreObrigatorio.toFixed(2)),
      scoreVerticais: parseFloat(scoreVerticais.toFixed(2)),
      scoreRelevancia: parseFloat(scoreRelevancia.toFixed(2))
    }
  });
  
  return prisma.avaliacaoProduto.findUnique({
    where: { id: avaliacaoId },
    include: {
      produto: { 
        include: { 
          projeto: { include: { empresa: true } }
        } 
      },
      usuario: true,
      respostasObrigatorias: {
        include: { perguntaObrigatoria: true },
        orderBy: { perguntaObrigatoria: { ordem: 'asc' } }
      },
      respostasVerticais: {
        include: { perguntaProduto: { include: { vertical: true } } }
      }
    }
  });
}

async function atualizarScoreProduto(produtoId) {
  const avaliacoesFinalizadas = await prisma.avaliacaoProduto.findMany({
    where: {
      produtoId: produtoId,
      status: 'finalizada',
      scoreRelevancia: { not: null }
    }
  });
  
  let scoreMedia = 0;
  if (avaliacoesFinalizadas.length > 0) {
    const soma = avaliacoesFinalizadas.reduce((acc, a) => acc + a.scoreRelevancia, 0);
    scoreMedia = soma / avaliacoesFinalizadas.length;
  }
  
  await prisma.produto.update({
    where: { id: produtoId },
    data: {
      scoreRelevancia: parseFloat(scoreMedia.toFixed(2))
    }
  });
}

async function atualizarClassificacaoProdutos(projetoId) {
  // 1. Buscar o score do Blueprint (média das avaliações do projeto)
  const avaliacoesBlueprint = await prisma.avaliacao.findMany({
    where: {
      projetoId: projetoId,
      status: 'finalizada',
      scoreGeral: { not: null, gt: 0 }
    }
  });
  
  let scoreBlueprint = 0;
  if (avaliacoesBlueprint.length > 0) {
    const somaScores = avaliacoesBlueprint.reduce((acc, a) => acc + (a.scoreGeral || 0), 0);
    scoreBlueprint = somaScores / avaliacoesBlueprint.length;
  }
  
  console.log(`[Classificação] Projeto ${projetoId} - Score Blueprint: ${scoreBlueprint.toFixed(2)}`);
  
  // 2. Buscar produtos com score de relevância
  const produtos = await prisma.produto.findMany({
    where: {
      projetoId: projetoId,
      scoreRelevancia: { not: null, gt: 0 }
    }
  });
  
  // 3. Calcular Score de Prioridade Estratégica para cada produto
  // Fórmula: 60% scoreRelevancia + 40% scoreBlueprint
  // Isso prioriza produtos em projetos mais maduros em IA
  for (const produto of produtos) {
    const scoreRelevancia = produto.scoreRelevancia || 0;
    
    // Se não há avaliação do Blueprint, usa apenas o score do produto
    let scorePrioridadeEstrategica;
    if (scoreBlueprint > 0) {
      scorePrioridadeEstrategica = (scoreRelevancia * 0.6) + (scoreBlueprint * 0.4);
    } else {
      scorePrioridadeEstrategica = scoreRelevancia;
    }
    
    await prisma.produto.update({
      where: { id: produto.id },
      data: {
        scoreBlueprint: parseFloat(scoreBlueprint.toFixed(2)),
        scorePrioridadeEstrategica: parseFloat(scorePrioridadeEstrategica.toFixed(2))
      }
    });
    
    console.log(`[Classificação] Produto "${produto.nome}": Relevância=${scoreRelevancia.toFixed(2)}, Blueprint=${scoreBlueprint.toFixed(2)}, Prioridade=${scorePrioridadeEstrategica.toFixed(2)}`);
  }
  
  // 4. Ordenar produtos pelo Score de Prioridade Estratégica (não mais por scoreRelevancia)
  const produtosOrdenados = await prisma.produto.findMany({
    where: {
      projetoId: projetoId,
      scorePrioridadeEstrategica: { not: null, gt: 0 }
    },
    orderBy: { scorePrioridadeEstrategica: 'desc' }
  });
  
  // 5. Atribuir classificação (1º, 2º, 3º...) baseada na prioridade estratégica
  for (let i = 0; i < produtosOrdenados.length; i++) {
    await prisma.produto.update({
      where: { id: produtosOrdenados[i].id },
      data: { classificacao: i + 1 }
    });
  }
  
  // 6. Produtos sem score ficam sem classificação
  const produtosSemScore = await prisma.produto.findMany({
    where: {
      projetoId: projetoId,
      OR: [
        { scoreRelevancia: null },
        { scoreRelevancia: 0 }
      ]
    }
  });
  
  for (const produto of produtosSemScore) {
    await prisma.produto.update({
      where: { id: produto.id },
      data: { 
        classificacao: null,
        scoreBlueprint: scoreBlueprint > 0 ? parseFloat(scoreBlueprint.toFixed(2)) : null,
        scorePrioridadeEstrategica: null
      }
    });
  }
  
  console.log(`[Classificação] Projeto ${projetoId}: ${produtosOrdenados.length} produtos classificados por prioridade estratégica`);
}

// ==================== PRESENÇA / OBSERVABILIDADE ====================

app.post('/api/activity/heartbeat', async (req, res) => {
  try {
    if (!req.usuario?.id) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    const pathRaw = String(req.body?.path ?? '');
    let rotuloPagina = String(req.body?.rotuloPagina ?? '');
    const ultimaAcao =
      req.body?.ultimaAcao != null ? String(req.body.ultimaAcao).slice(0, 500) : null;
    const ultimoPath = pathRaw.slice(0, 2048);
    rotuloPagina = rotuloPagina.slice(0, 500);

    await prisma.usuarioPresenca.upsert({
      where: { usuarioId: req.usuario.id },
      create: {
        usuarioId: req.usuario.id,
        ultimoPath,
        rotuloPagina: rotuloPagina || ultimoPath || '/',
        ultimaAcao
      },
      update: {
        ultimoPath,
        rotuloPagina: rotuloPagina || ultimoPath || '/',
        ultimaAcao
      }
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('[heartbeat]', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/observability/sessions', async (req, res) => {
  try {
    if (!roleIsAdmin(req.usuario?.role)) {
      return res.status(403).json({ error: 'Apenas administradores' });
    }
    const activeMinutes = Math.min(
      60,
      Math.max(1, parseInt(String(req.query.activeMinutes || '5'), 10) || 5)
    );
    const since = new Date(Date.now() - activeMinutes * 60 * 1000);

    const presencas = await prisma.usuarioPresenca.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            empresa: { select: { id: true, nome: true } }
          }
        }
      },
      orderBy: { atualizadoEm: 'desc' }
    });

    const serverTime = new Date().toISOString();
    const ativos = presencas.filter((p) => p.atualizadoEm >= since);

    res.json({
      serverTime,
      activeMinutes,
      ativos,
      todos: presencas,
      totalPresencas: presencas.length
    });
  } catch (error) {
    console.error('[observability]', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ERROR HANDLER GLOBAL ====================

app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      detalhes: err.errors.map(e => ({
        campo: e.path.join('.'),
        mensagem: e.message
      }))
    });
  }
  
  if (err.code === 'P2002') {
    return res.status(400).json({ error: 'Registro duplicado' });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro não encontrado' });
  }
  
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// ==================== INICIALIZAÇÃO ====================

/** Evita erro P2022 se a migração Prisma não rodou no banco (coluna ausente). */
async function ensureSchemaUsuarioNivelPrioridadeMaturidade() {
  try {
    try {
      await prisma.$queryRawUnsafe(
        'SELECT "nivelPrioridadeMapeamentoMaturidade" FROM "Usuario" WHERE 1 = 0'
      );
      console.log('[schema] Usuario.nivelPrioridadeMapeamentoMaturidade verificada.');
      return;
    } catch (probeError) {
      const msg = String(probeError?.message || probeError || '');
      const colunaAusente =
        probeError?.code === 'P2022' ||
        probeError?.code === '42703' ||
        /nivelPrioridadeMapeamentoMaturidade.*does not exist/i.test(msg) ||
        /column.*nivelPrioridadeMapeamentoMaturidade.*does not exist/i.test(msg) ||
        /The column `nivelPrioridadeMapeamentoMaturidade`/i.test(msg);
      if (!colunaAusente) throw probeError;
    }

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Usuario" ADD COLUMN IF NOT EXISTS "nivelPrioridadeMapeamentoMaturidade" INTEGER NOT NULL DEFAULT 1'
    );
    await prisma.$executeRawUnsafe(
      'UPDATE "Usuario" SET "nivelPrioridadeMapeamentoMaturidade" = 1 WHERE "nivelPrioridadeMapeamentoMaturidade" IS DISTINCT FROM 1'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Usuario" ALTER COLUMN "nivelPrioridadeMapeamentoMaturidade" SET DEFAULT 1'
    );
    console.log('[schema] Usuario.nivelPrioridadeMapeamentoMaturidade verificada.');
  } catch (e) {
    console.error(
      '[schema] Não foi possível criar/ajustar Usuario.nivelPrioridadeMapeamentoMaturidade:',
      e?.message || e,
      '\nComo dono da tabela ou superusuário, rode: backend/scripts/fix-usuario-nivel-prioridade.sql'
    );
  }
}

/** Evita erro se a migração `20260525150000_resposta_sem_informacao` ainda não foi aplicada. */
async function ensureSchemaRespostaSemInformacao() {
  try {
    try {
      await prisma.$queryRawUnsafe('SELECT "semInformacao" FROM "Resposta" WHERE 1 = 0');
      console.log('[schema] Resposta.semInformacao verificada.');
      return;
    } catch (probeError) {
      const msg = String(probeError?.message || probeError || '');
      const colunaAusente =
        probeError?.code === 'P2022' ||
        probeError?.code === '42703' ||
        /semInformacao.*does not exist/i.test(msg) ||
        /column.*semInformacao.*does not exist/i.test(msg) ||
        /The column `semInformacao`/i.test(msg);
      if (!colunaAusente) throw probeError;
    }

    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Resposta" ADD COLUMN IF NOT EXISTS "semInformacao" BOOLEAN NOT NULL DEFAULT false'
    );
    await prisma.$executeRawUnsafe(
      'UPDATE "Resposta" SET "semInformacao" = false WHERE "semInformacao" IS DISTINCT FROM false'
    );
    console.log('[schema] Resposta.semInformacao verificada.');
  } catch (e) {
    console.error(
      '[schema] Não foi possível criar/ajustar Resposta.semInformacao:',
      e?.message || e,
      '\nComo dono da tabela ou superusuário, rode: backend/prisma/migrations/20260525150000_resposta_sem_informacao/migration.sql'
    );
  }
}

/** Igual à migração `20260515120000_avaliacao_desejos_ia` — evita toast “tabela indisponível” se o deploy não rodou migrate. */
async function ensureSchemaAvaliacaoDesejosIA() {
  try {
    await prisma.$executeRawUnsafe(`
CREATE TABLE IF NOT EXISTS "AvaliacaoDesejosIA" (
    "id" SERIAL NOT NULL,
    "avaliacaoId" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvaliacaoDesejosIA_pkey" PRIMARY KEY ("id")
)`);
    await prisma.$executeRawUnsafe(
      'CREATE UNIQUE INDEX IF NOT EXISTS "AvaliacaoDesejosIA_avaliacaoId_key" ON "AvaliacaoDesejosIA"("avaliacaoId")'
    );
    await prisma.$executeRawUnsafe(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AvaliacaoDesejosIA_avaliacaoId_fkey'
  ) THEN
    ALTER TABLE "AvaliacaoDesejosIA"
      ADD CONSTRAINT "AvaliacaoDesejosIA_avaliacaoId_fkey"
      FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$`);
    console.log('[schema] AvaliacaoDesejosIA verificada.');
  } catch (e) {
    console.error(
      '[schema] Não foi possível criar/ajustar AvaliacaoDesejosIA:',
      e?.message || e,
      '\nComo superusuário ou dono do schema, rode `npx prisma migrate deploy` no backend ou o SQL em prisma/migrations/20260515120000_avaliacao_desejos_ia/migration.sql'
    );
  }
}

async function ensureSchemaEmpresaLogoPath() {
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "logoPath" TEXT'
    );
    console.log('[schema] Empresa.logoPath verificada.');
  } catch (e) {
    console.warn('[schema] Empresa.logoPath:', e?.message || e);
  }
}

initPrismaUsuarioColumnProbe()
  .then(() => ensureSchemaUsuarioNivelPrioridadeMaturidade())
  .then(() => ensureSchemaRespostaSemInformacao())
  .then(() => ensureSchemaAvaliacaoDesejosIA())
  .then(() => ensureSchemaEmpresaLogoPath())
  .then(() => probeEmpresaLogoPathColumn(prisma))
  .then(() => ensureProjetoVersaoSchema())
  .then(() => refreshUsuarioNivelPrioridadeColumnFlag())
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      startLembreteCronIfEnabled(prisma);
    });
  });

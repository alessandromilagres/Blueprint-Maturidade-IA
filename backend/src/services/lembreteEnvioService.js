import { calcularProgressoAvaliacaoProjeto } from '../utils/avaliacaoAreasRecusadas.js';
import { calcularProgressoAvaliacaoProduto } from '../utils/avaliacaoProdutoProgresso.js';
import { usuarioIncluidoNoFiltroNivelMapeamentoMaturidade } from '../utils/nivelPrioridadeMapeamentoMaturidade.js';
import {
  enviarEmailLembreteAvaliacaoProjeto,
  enviarEmailLembreteAvaliacaoProduto
} from './email.js';
import { registrarLogLembrete } from './logLembreteAvaliacao.js';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HORAS_PADRAO_LEMBRETE_AUTO = 48;

function horasParaMs(horas) {
  return Math.max(1, Number(horas) || HORAS_PADRAO_LEMBRETE_AUTO) * 60 * 60 * 1000;
}

function passouJanelaSemConclusao(avaliacao, horas = HORAS_PADRAO_LEMBRETE_AUTO) {
  if (!avaliacao || avaliacao.status === 'finalizada') return false;
  const referencia = new Date(avaliacao.updatedAt || avaliacao.createdAt).getTime();
  if (!Number.isFinite(referencia)) return false;
  return Date.now() - referencia >= horasParaMs(horas);
}

async function temLembreteAutomaticoRecente(prisma, { projetoId, usuarioId, horas }) {
  const desde = new Date(Date.now() - horasParaMs(horas));
  const recente = await prisma.logLembreteAvaliacao.findFirst({
    where: {
      escopoTipo: 'projeto',
      projetoId,
      destinatarioUsuarioId: usuarioId,
      modo: 'auto_48h',
      sucesso: true,
      createdAt: { gte: desde }
    },
    select: { id: true }
  });
  return !!recente;
}

export async function enviarLembreteEmailUsuarioProjeto(
  prisma,
  projeto,
  usuarioId,
  areasCache = null
) {
  const destinatario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!destinatario) {
    throw new Error('Usuário não encontrado');
  }

  const projetoId = projeto.id;
  const avaliacao = await prisma.avaliacao.findFirst({
    where: { projetoId, usuarioId },
    orderBy: { updatedAt: 'desc' }
  });

  const agora = new Date();
  const convitePendente = await prisma.conviteAvaliacao.findFirst({
    where: {
      projetoId,
      avaliadorId: usuarioId,
      tipo: 'projeto',
      status: 'pendente',
      dataExpiracao: { gt: agora }
    },
    orderBy: { createdAt: 'desc' }
  });

  const BASE_URL_APP = process.env.BASE_URL || 'https://agentica.sysmap.com.br';
  let linkAcao;
  let progressoTexto;

  if (avaliacao && avaliacao.status !== 'finalizada') {
    linkAcao = `${BASE_URL_APP}/avaliacoes/${avaliacao.id}`;
    const areas =
      areasCache ||
      (await prisma.area.findMany({
        include: { perguntas: { orderBy: { numero: 'asc' } } },
        orderBy: { ordem: 'asc' }
      }));
    const avFull = await prisma.avaliacao.findUnique({
      where: { id: avaliacao.id },
      include: { respostas: true }
    });
    const p = calcularProgressoAvaliacaoProjeto(avFull, areas);
    progressoTexto =
      p.total > 0
        ? `${p.percentual}% do questionário (${p.respondidas}/${p.total} perguntas respondidas)`
        : 'Questionário disponível — continue pelo link abaixo.';
  } else if (convitePendente) {
    linkAcao = `${BASE_URL_APP}/avaliacao/acesso/${convitePendente.token}`;
    progressoTexto =
      'Convite pendente — abra pelo link para iniciar ou continuar sem senha.';
  } else if (avaliacao?.status === 'finalizada') {
    throw new Error('Avaliação já finalizada.');
  } else {
    throw new Error(
      'Não há avaliação em andamento nem convite pendente válido para este usuário neste projeto.'
    );
  }

  return enviarEmailLembreteAvaliacaoProjeto({
    destinatarioEmail: destinatario.email,
    destinatarioNome: destinatario.nome,
    empresaNome: projeto.empresa.nome,
    projetoNome: projeto.nome,
    linkAcao,
    progressoTexto
  });
}

async function carregarPerguntasEVerticaisAvaliacaoProduto(prisma, avaliacaoProd) {
  const perguntasObrigatorias = await prisma.perguntaObrigatoriaProduto.findMany({
    orderBy: { ordem: 'asc' }
  });
  let vertIds = null;
  try {
    vertIds = avaliacaoProd?.verticaisSelecionadas
      ? JSON.parse(avaliacaoProd.verticaisSelecionadas)
      : null;
  } catch {
    vertIds = null;
  }
  let verticais;
  if (vertIds && vertIds.length > 0) {
    verticais = await prisma.verticalProduto.findMany({
      where: { id: { in: vertIds } },
      include: { perguntas: { orderBy: { numero: 'asc' } } },
      orderBy: { ordem: 'asc' }
    });
  } else {
    verticais = await prisma.verticalProduto.findMany({
      include: { perguntas: { orderBy: { numero: 'asc' } } },
      orderBy: { ordem: 'asc' }
    });
  }
  return { perguntasObrigatorias, verticais };
}

export async function enviarLembreteEmailUsuarioProduto(prisma, produto, usuarioId) {
  const destinatario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!destinatario) {
    throw new Error('Usuário não encontrado');
  }

  const produtoId = produto.id;
  const avaliacao = await prisma.avaliacaoProduto.findFirst({
    where: { produtoId, usuarioId },
    orderBy: { updatedAt: 'desc' }
  });

  const agora = new Date();
  const convitePendente = await prisma.conviteAvaliacao.findFirst({
    where: {
      produtoId,
      avaliadorId: usuarioId,
      tipo: 'produto',
      status: 'pendente',
      dataExpiracao: { gt: agora }
    },
    orderBy: { createdAt: 'desc' }
  });

  const BASE_URL_APP = process.env.BASE_URL || 'https://agentica.sysmap.com.br';
  const empresaNome = produto.projeto.empresa.nome;
  const projetoNome = produto.projeto.nome;
  const produtoNome = produto.nome;
  let linkAcao;
  let progressoTexto;

  if (avaliacao && avaliacao.status !== 'finalizada') {
    linkAcao = `${BASE_URL_APP}/avaliacoes-produto/${avaliacao.id}`;
    const avFull = await prisma.avaliacaoProduto.findUnique({
      where: { id: avaliacao.id },
      include: { respostasObrigatorias: true, respostasVerticais: true }
    });
    const { perguntasObrigatorias, verticais } = await carregarPerguntasEVerticaisAvaliacaoProduto(
      prisma,
      avFull
    );
    const p = calcularProgressoAvaliacaoProduto(avFull, perguntasObrigatorias, verticais);
    progressoTexto =
      p.total > 0
        ? `${p.percentual}% do questionário (${p.respondidas}/${p.total} perguntas respondidas)`
        : 'Questionário disponível — continue pelo link abaixo.';
  } else if (convitePendente) {
    linkAcao = `${BASE_URL_APP}/avaliacao-convite/${convitePendente.token}`;
    progressoTexto =
      'Convite pendente — aceite pelo link para iniciar ou continuar.';
  } else if (avaliacao?.status === 'finalizada') {
    throw new Error('Avaliação já finalizada.');
  } else {
    throw new Error(
      'Não há avaliação em andamento nem convite pendente válido para este usuário neste produto.'
    );
  }

  return enviarEmailLembreteAvaliacaoProduto({
    destinatarioEmail: destinatario.email,
    destinatarioNome: destinatario.nome,
    empresaNome,
    projetoNome,
    produtoNome,
    linkAcao,
    progressoTexto
  });
}

async function auditar(prisma, row) {
  await registrarLogLembrete(prisma, row);
}

export async function enviarLembreteProjetoComAuditoria(
  prisma,
  { projetoId, usuarioId, enviadoPorUsuarioId, modo, areasCache }
) {
  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    include: { empresa: true }
  });
  if (!projeto) throw new Error('Projeto não encontrado');
  const dest = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!dest) throw new Error('Usuário não encontrado');
  try {
    const email = await enviarLembreteEmailUsuarioProjeto(
      prisma,
      projeto,
      usuarioId,
      areasCache
    );
    await auditar(prisma, {
      escopoTipo: 'projeto',
      projetoId,
      produtoId: null,
      destinatarioUsuarioId: usuarioId,
      destinatarioEmail: dest.email,
      destinatarioNome: dest.nome,
      enviadoPorUsuarioId,
      modo,
      sucesso: true,
      erro: null,
      emailSimulado: !!email?.simulado
    });
    return email;
  } catch (err) {
    await auditar(prisma, {
      escopoTipo: 'projeto',
      projetoId,
      produtoId: null,
      destinatarioUsuarioId: usuarioId,
      destinatarioEmail: dest.email,
      destinatarioNome: dest.nome,
      enviadoPorUsuarioId,
      modo,
      sucesso: false,
      erro: err?.message || String(err),
      emailSimulado: false
    });
    throw err;
  }
}

export async function enviarLembreteProdutoComAuditoria(
  prisma,
  { produtoId, usuarioId, enviadoPorUsuarioId, modo }
) {
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    include: { projeto: { include: { empresa: true } } }
  });
  if (!produto) throw new Error('Produto não encontrado');
  const dest = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!dest) throw new Error('Usuário não encontrado');
  try {
    const email = await enviarLembreteEmailUsuarioProduto(prisma, produto, usuarioId);
    await auditar(prisma, {
      escopoTipo: 'produto',
      projetoId: null,
      produtoId,
      destinatarioUsuarioId: usuarioId,
      destinatarioEmail: dest.email,
      destinatarioNome: dest.nome,
      enviadoPorUsuarioId,
      modo,
      sucesso: true,
      erro: null,
      emailSimulado: !!email?.simulado
    });
    return email;
  } catch (err) {
    await auditar(prisma, {
      escopoTipo: 'produto',
      projetoId: null,
      produtoId,
      destinatarioUsuarioId: usuarioId,
      destinatarioEmail: dest.email,
      destinatarioNome: dest.nome,
      enviadoPorUsuarioId,
      modo,
      sucesso: false,
      erro: err?.message || String(err),
      emailSimulado: false
    });
    throw err;
  }
}

/** Lista usuários com convite pendente válido ou avaliação não finalizada (projeto). */
export async function listarDestinatariosLembreteProjeto(
  prisma,
  projetoId,
  nivelPrioridadeMapeamentoMaturidadeMax = null
) {
  const areas = await prisma.area.findMany({
    include: { perguntas: { orderBy: { numero: 'asc' } } },
    orderBy: { ordem: 'asc' }
  });

  const [avaliacoes, convites] = await Promise.all([
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

  const avaliacaoPorUsuario = new Map();
  for (const av of avaliacoes) {
    if (!avaliacaoPorUsuario.has(av.usuarioId)) {
      avaliacaoPorUsuario.set(av.usuarioId, av);
    }
  }

  const ids = new Set();
  for (const av of avaliacoes) ids.add(av.usuarioId);
  for (const c of convites) ids.add(c.avaliadorId);

  const agora = new Date();
  const convitePendentePorUsuario = new Map();
  for (const c of convites) {
    if (c.status !== 'pendente') continue;
    if (new Date(c.dataExpiracao) <= agora) continue;
    if (!convitePendentePorUsuario.has(c.avaliadorId)) {
      convitePendentePorUsuario.set(c.avaliadorId, c);
    }
  }

  const destinatarios = [];
  for (const uid of ids) {
    const avaliacao = avaliacaoPorUsuario.get(uid);
    const convitePendente = convitePendentePorUsuario.get(uid);
    const usuario =
      avaliacao?.usuario ??
      convites.find((x) => x.avaliadorId === uid)?.avaliador;
    if (!usuario) continue;
    if (
      nivelPrioridadeMapeamentoMaturidadeMax != null &&
      !usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(usuario, nivelPrioridadeMapeamentoMaturidadeMax)
    ) {
      continue;
    }
    const statusAvaliacao = avaliacao?.status ?? null;
    const podeLembrar =
      statusAvaliacao !== 'finalizada' &&
      (!!avaliacao || !!convitePendente);
    if (podeLembrar) destinatarios.push(uid);
  }

  return { destinatarios, areas };
}

export async function executarLembreteLoteProjeto(prisma, opts) {
  const {
    projetoId,
    enviadoPorUsuarioId,
    modo = 'lote',
    delayMs = parseInt(process.env.LEMBRETE_LOTE_DELAY_MS || '250', 10) || 0,
    nivelPrioridadeMapeamentoMaturidadeMax = null
  } = opts;

  const { destinatarios, areas } = await listarDestinatariosLembreteProjeto(
    prisma,
    projetoId,
    nivelPrioridadeMapeamentoMaturidadeMax
  );

  if (destinatarios.length === 0) {
    return {
      total: 0,
      enviados: 0,
      falhas: 0,
      detalhes: []
    };
  }

  const detalhes = [];
  let enviados = 0;
  for (let i = 0; i < destinatarios.length; i++) {
    const usuarioId = destinatarios[i];
    try {
      const email = await enviarLembreteProjetoComAuditoria(prisma, {
        projetoId,
        usuarioId,
        enviadoPorUsuarioId,
        modo,
        areasCache: areas
      });
      enviados++;
      detalhes.push({ usuarioId, ok: true, email });
    } catch (err) {
      detalhes.push({
        usuarioId,
        ok: false,
        error: err?.message || String(err)
      });
    }
    if (delayMs > 0 && i < destinatarios.length - 1) {
      await sleep(delayMs);
    }
  }

  return {
    total: destinatarios.length,
    enviados,
    falhas: destinatarios.length - enviados,
    detalhes
  };
}

/** Envia lembrete automático apenas para avaliações iniciadas, paradas há >= 48h e não finalizadas. */
export async function executarLembreteAutomatico48hProjeto(prisma, opts) {
  const {
    projetoId,
    enviadoPorUsuarioId,
    horasSemAtualizacao = parseInt(process.env.LEMBRETE_AUTO_48H_HORAS || '48', 10),
    delayMs = parseInt(process.env.LEMBRETE_LOTE_DELAY_MS || '250', 10) || 0
  } = opts;

  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    include: { empresa: true }
  });
  if (!projeto) throw new Error('Projeto não encontrado');

  const areas = await prisma.area.findMany({
    include: { perguntas: { orderBy: { numero: 'asc' } } },
    orderBy: { ordem: 'asc' }
  });

  const avaliacoes = await prisma.avaliacao.findMany({
    where: { projetoId, status: { not: 'finalizada' } },
    include: { respostas: true, usuario: { select: { id: true } } },
    orderBy: { updatedAt: 'asc' }
  });

  const candidatos = [];
  for (const avaliacao of avaliacoes) {
    const progresso = calcularProgressoAvaliacaoProjeto(avaliacao, areas);
    const iniciou = progresso.respondidas > 0;
    const incompleta = progresso.percentual < 100;
    if (!iniciou || !incompleta || !passouJanelaSemConclusao(avaliacao, horasSemAtualizacao)) continue;
    const jaLembrou = await temLembreteAutomaticoRecente(prisma, {
      projetoId,
      usuarioId: avaliacao.usuarioId,
      horas: horasSemAtualizacao
    });
    if (!jaLembrou) candidatos.push(avaliacao.usuarioId);
  }

  const detalhes = [];
  let enviados = 0;
  for (let i = 0; i < candidatos.length; i++) {
    const usuarioId = candidatos[i];
    try {
      const email = await enviarLembreteProjetoComAuditoria(prisma, {
        projetoId,
        usuarioId,
        enviadoPorUsuarioId,
        modo: 'auto_48h',
        areasCache: areas
      });
      enviados++;
      detalhes.push({ usuarioId, ok: true, email });
    } catch (err) {
      detalhes.push({ usuarioId, ok: false, error: err?.message || String(err) });
    }
    if (delayMs > 0 && i < candidatos.length - 1) {
      await sleep(delayMs);
    }
  }

  return {
    total: candidatos.length,
    enviados,
    falhas: candidatos.length - enviados,
    detalhes
  };
}

export async function listarDestinatariosLembreteProduto(prisma, produtoId) {
  const [avaliacoes, convites] = await Promise.all([
    prisma.avaliacaoProduto.findMany({
      where: { produtoId },
      include: {
        usuario: { select: { id: true, nome: true, email: true, cargo: true } },
        respostasObrigatorias: true,
        respostasVerticais: true
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.conviteAvaliacao.findMany({
      where: { produtoId, tipo: 'produto' },
      include: {
        avaliador: { select: { id: true, nome: true, email: true, cargo: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const avaliacaoPorUsuario = new Map();
  for (const av of avaliacoes) {
    if (!avaliacaoPorUsuario.has(av.usuarioId)) {
      avaliacaoPorUsuario.set(av.usuarioId, av);
    }
  }

  const ids = new Set();
  for (const av of avaliacoes) ids.add(av.usuarioId);
  for (const c of convites) ids.add(c.avaliadorId);

  const agora = new Date();
  const convitePendentePorUsuario = new Map();
  for (const c of convites) {
    if (c.status !== 'pendente') continue;
    if (new Date(c.dataExpiracao) <= agora) continue;
    if (!convitePendentePorUsuario.has(c.avaliadorId)) {
      convitePendentePorUsuario.set(c.avaliadorId, c);
    }
  }

  const destinatarios = [];
  for (const uid of ids) {
    const avaliacao = avaliacaoPorUsuario.get(uid);
    const convitePendente = convitePendentePorUsuario.get(uid);
    const statusAvaliacao = avaliacao?.status ?? null;
    const podeLembrar =
      statusAvaliacao !== 'finalizada' &&
      (!!avaliacao || !!convitePendente);
    if (podeLembrar) destinatarios.push(uid);
  }

  return { destinatarios };
}

export async function executarLembreteLoteProduto(prisma, opts) {
  const {
    produtoId,
    enviadoPorUsuarioId,
    modo = 'lote',
    delayMs = parseInt(process.env.LEMBRETE_LOTE_DELAY_MS || '250', 10) || 0
  } = opts;

  const { destinatarios } = await listarDestinatariosLembreteProduto(prisma, produtoId);

  if (destinatarios.length === 0) {
    return { total: 0, enviados: 0, falhas: 0, detalhes: [] };
  }

  const detalhes = [];
  let enviados = 0;
  for (let i = 0; i < destinatarios.length; i++) {
    const usuarioId = destinatarios[i];
    try {
      const email = await enviarLembreteProdutoComAuditoria(prisma, {
        produtoId,
        usuarioId,
        enviadoPorUsuarioId,
        modo
      });
      enviados++;
      detalhes.push({ usuarioId, ok: true, email });
    } catch (err) {
      detalhes.push({
        usuarioId,
        ok: false,
        error: err?.message || String(err)
      });
    }
    if (delayMs > 0 && i < destinatarios.length - 1) {
      await sleep(delayMs);
    }
  }

  return {
    total: destinatarios.length,
    enviados,
    falhas: destinatarios.length - enviados,
    detalhes
  };
}

/** Painel de progresso por avaliador (produto IA-First). */
export async function obterStatusAvaliadoresProduto(prisma, produtoId) {
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    include: { projeto: { include: { empresa: true } } }
  });
  if (!produto) return null;

  const [avaliacoes, convites] = await Promise.all([
    prisma.avaliacaoProduto.findMany({
      where: { produtoId },
      include: {
        usuario: { select: { id: true, nome: true, email: true, cargo: true } },
        respostasObrigatorias: true,
        respostasVerticais: true
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.conviteAvaliacao.findMany({
      where: { produtoId, tipo: 'produto' },
      include: {
        avaliador: { select: { id: true, nome: true, email: true, cargo: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const avaliacaoPorUsuario = new Map();
  for (const av of avaliacoes) {
    if (!avaliacaoPorUsuario.has(av.usuarioId)) {
      avaliacaoPorUsuario.set(av.usuarioId, av);
    }
  }

  const ids = new Set();
  for (const av of avaliacoes) ids.add(av.usuarioId);
  for (const c of convites) ids.add(c.avaliadorId);

  const agora = new Date();
  const convitePendentePorUsuario = new Map();
  for (const c of convites) {
    if (c.status !== 'pendente') continue;
    if (new Date(c.dataExpiracao) <= agora) continue;
    if (!convitePendentePorUsuario.has(c.avaliadorId)) {
      convitePendentePorUsuario.set(c.avaliadorId, c);
    }
  }

  const perguntasObrigatorias = await prisma.perguntaObrigatoriaProduto.findMany({
    orderBy: { ordem: 'asc' }
  });

  const linhas = [];
  for (const uid of ids) {
    const avaliacao = avaliacaoPorUsuario.get(uid);
    const usuario =
      avaliacao?.usuario ??
      convites.find((x) => x.avaliadorId === uid)?.avaliador;
    if (!usuario) continue;

    let respondidas = 0;
    let total = 0;
    let percentual = 0;
    let statusFormulario = 'sem_avaliacao';
    let avaliacaoId = null;
    let statusAvaliacao = null;

    if (avaliacao) {
      const { verticais } = await carregarPerguntasEVerticaisAvaliacaoProduto(prisma, avaliacao);
      const prog = calcularProgressoAvaliacaoProduto(avaliacao, perguntasObrigatorias, verticais);
      respondidas = prog.respondidas;
      total = prog.total;
      percentual = prog.percentual;
      statusAvaliacao = avaliacao.status;
      avaliacaoId = avaliacao.id;
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
    linhas.push({
      usuarioId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
      avaliacaoId,
      statusAvaliacao,
      respondidas,
      totalPerguntas: total,
      percentual,
      statusFormulario,
      convitePendente: !!convitePendente,
      podeLembrar:
        statusAvaliacao !== 'finalizada' &&
        (!!avaliacao || !!convitePendente)
    });
  }

  linhas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  return {
    produto: { id: produto.id, nome: produto.nome },
    projeto: { id: produto.projeto.id, nome: produto.projeto.nome },
    empresa: produto.projeto.empresa,
    avaliadores: linhas
  };
}

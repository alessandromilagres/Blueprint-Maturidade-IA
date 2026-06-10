import {
  ROLES_NOTIFICACAO_PRODUTO,
  usuarioPodeEditarDetalhamentoProduto,
  usuarioPodeEditarFinanceiroCronogramaProduto
} from '../constants/produtoWorkflow.js';
import { enviarEmailNotificacaoCadastroProduto } from './email.js';

export const CATEGORIA_ARQUIVO_FASE1 = 'cadastro_fase1';
export const CATEGORIA_ARQUIVO_FASE2 = 'cadastro_fase2';

const CAMPOS_DETALHAMENTO_TECNICO = [
  'problemaResolve',
  'publicoAlvo',
  'tecnologias',
  'faseAtual',
  'complexidade',
  'statusConstrucao',
  'diferencialCompetitivo',
  'principaisRiscos',
  'dependenciasExternas',
  'metricaPrincipal',
  'baselineAtual',
  'metaEsperada'
];

const CAMPOS_FINANCEIRO_CRONOGRAMA = [
  'custoHoraHomem',
  'produtividadeTradicional',
  'produtividadeAgentica',
  'custoEstimado',
  'retornoAnualEsperado',
  'dataInicioConstrucao',
  'dataFimConstrucao',
  'dataAtivacaoProducao',
  'observacoesCronograma'
];

const CHAVES_INFO_FASE1 = ['requisitosFuncionais', 'fluxosWorkflow', 'observacoesGeraisFase1', 'requisitosAdicionais'];

const CHAVES_INFO_FASE2 = [
  'requisitosNaoFuncionais',
  'integracoes',
  'restricoes',
  'observacoesGeraisFase2',
  'observacoes'
];

/** Remove campos de detalhamento técnico e/ou financeiro conforme o papel. */
export function filtrarBodyProdutoPorPapel(usuario, empresaIdProjeto, body) {
  if (!body || typeof body !== 'object') return body;
  const out = { ...body };
  const podeDetalhe = usuarioPodeEditarDetalhamentoProduto(usuario, empresaIdProjeto);
  const podeFinanceiro = usuarioPodeEditarFinanceiroCronogramaProduto(usuario, empresaIdProjeto);

  if (!podeDetalhe) {
    for (const k of CAMPOS_DETALHAMENTO_TECNICO) {
      delete out[k];
    }
    for (const k of CAMPOS_FINANCEIRO_CRONOGRAMA) {
      delete out[k];
    }
    if (out.informacoesAdicionaisEspecificacao && typeof out.informacoesAdicionaisEspecificacao === 'object') {
      const ia = { ...out.informacoesAdicionaisEspecificacao };
      for (const k of CHAVES_INFO_FASE2) {
        delete ia[k];
      }
      out.informacoesAdicionaisEspecificacao = ia;
    }
    return out;
  }

  if (!podeFinanceiro) {
    for (const k of CAMPOS_FINANCEIRO_CRONOGRAMA) {
      delete out[k];
    }
  }

  return out;
}

/** Mescla JSON da fase de idealização (PATCH parcial). */
export function mergeIdealizacaoProduto(existing, incoming) {
  if (incoming === null) return null;
  const base = existing && typeof existing === 'object' ? { ...existing } : {};
  const inc = incoming && typeof incoming === 'object' ? { ...incoming } : {};
  return { ...base, ...inc };
}

/** Mescla JSON de informações adicionais preservando _workflow controlado no servidor. */
export function mergeInformacoesAdicionais(existing, incoming) {
  const base = existing && typeof existing === 'object' ? { ...existing } : {};
  const inc = incoming && typeof incoming === 'object' ? { ...incoming } : {};
  const wfServer = base._workflow && typeof base._workflow === 'object' ? { ...base._workflow } : {};
  delete inc._workflow;
  const merged = { ...base, ...inc };
  merged._workflow = wfServer;
  return merged;
}

export function obterInfoObj(produto) {
  const raw = produto.informacoesAdicionaisEspecificacao;
  if (!raw || typeof raw !== 'object') return {};
  return { ...raw };
}

export function textoRequisitosFuncionais(info) {
  return String(info.requisitosFuncionais ?? info.requisitosAdicionais ?? '').trim();
}

export function textoFluxos(info) {
  return String(info.fluxosWorkflow ?? '').trim();
}

export function fase1CadastroCompleta(produto, info, countArquivos) {
  const nome = String(produto.nome || '').trim();
  const rf = textoRequisitosFuncionais(info);
  const fl = textoFluxos(info);
  return Boolean(
    nome &&
    produto.projetoId &&
    rf.length > 0 &&
    fl.length > 0 &&
    countArquivos >= 1
  );
}

export function fase2CadastroCompleta(produto, info, countArquivosFase2) {
  const pr = String(produto.problemaResolve || '').trim();
  const pa = String(produto.publicoAlvo || '').trim();
  const mp = String(produto.metricaPrincipal || '').trim();
  const ba = String(produto.baselineAtual || '').trim();
  const me = String(produto.metaEsperada || '').trim();
  const rnf = String(info.requisitosNaoFuncionais ?? '').trim();
  const integ = String(info.integracoes ?? '').trim();
  const restr = String(info.restricoes ?? '').trim();
  const obs2 = String(info.observacoesGeraisFase2 ?? '').trim();
  return Boolean(
    pr &&
    pa &&
    mp &&
    ba &&
    me &&
    rnf &&
    integ &&
    restr &&
    obs2 &&
    countArquivosFase2 >= 1
  );
}

async function contarArquivosFase1(prisma, produtoId) {
  const tagged = await prisma.arquivoReferencia.count({
    where: { produtoId, ativo: true, categoria: CATEGORIA_ARQUIVO_FASE1 }
  });
  if (tagged > 0) return tagged;
  return prisma.arquivoReferencia.count({ where: { produtoId, ativo: true } });
}

async function contarArquivosFase2(prisma, produtoId) {
  const tagged = await prisma.arquivoReferencia.count({
    where: { produtoId, ativo: true, categoria: CATEGORIA_ARQUIVO_FASE2 }
  });
  if (tagged > 0) return tagged;
  const total = await prisma.arquivoReferencia.count({ where: { produtoId, ativo: true } });
  return total >= 2 ? 1 : 0;
}

async function listarDestinatariosNotificacao(prisma, empresaId) {
  const usuarios = await prisma.usuario.findMany({
    where: {
      empresaId,
      ativo: true,
      role: { in: ROLES_NOTIFICACAO_PRODUTO }
    },
    select: { email: true, nome: true, role: true }
  });
  return usuarios.filter((u) => Boolean(u.email));
}

/**
 * Após criar/atualizar produto ou anexar arquivo: envia e-mails conforme conclusão das fases.
 */
export async function processarNotificacoesCadastroProduto(prisma, produtoId) {
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    include: { projeto: { include: { empresa: true } } }
  });
  if (!produto?.projeto) return;

  const empresaId = produto.projeto.empresaId;
  const info = obterInfoObj(produto);
  const wf = info._workflow && typeof info._workflow === 'object' ? { ...info._workflow } : {};

  const countF1 = await contarArquivosFase1(prisma, produtoId);
  const countF2 = await contarArquivosFase2(prisma, produtoId);

  const linkProduto = `${process.env.BASE_URL || 'https://agentica.sysmap.com.br'}/produtos/${produtoId}/editar`;

  let patch = null;

  if (fase1CadastroCompleta(produto, info, countF1) && !wf.emailFase1Enviado) {
    const dest = await listarDestinatariosNotificacao(prisma, empresaId);
    await enviarEmailNotificacaoCadastroProduto({
      destinatarios: dest,
      assunto: `[Blueprint IA] Produto cadastrado — requer atenção (${produto.nome})`,
      titulo: 'Cadastro do produto (etapas iniciais)',
      mensagem:
        'As etapas iniciais do cadastro do produto foram preenchidas (informações básicas, requisitos funcionais, fluxos e arquivos de apoio). Revise e continue o detalhamento no sistema.',
      produtoNome: produto.nome,
      empresaNome: produto.projeto.empresa?.nome || 'Empresa',
      projetoNome: produto.projeto.nome,
      linkEdicao: linkProduto
    });
    wf.emailFase1Enviado = new Date().toISOString();
    patch = { ...info, _workflow: wf };
  }

  if (fase2CadastroCompleta(produto, info, countF2) && !wf.emailFase2Enviado) {
    const dest = await listarDestinatariosNotificacao(prisma, empresaId);
    await enviarEmailNotificacaoCadastroProduto({
      destinatarios: dest,
      assunto: `[Blueprint IA] Produto detalhado — requer atenção (${produto.nome})`,
      titulo: 'Detalhamento do produto concluído',
      mensagem:
        'As etapas de detalhamento técnico do produto foram preenchidas (contexto, KPIs, requisitos não funcionais, integrações, restrições e demais itens). Acesse o Blueprint IA para revisar.',
      produtoNome: produto.nome,
      empresaNome: produto.projeto.empresa?.nome || 'Empresa',
      projetoNome: produto.projeto.nome,
      linkEdicao: linkProduto
    });
    wf.emailFase2Enviado = new Date().toISOString();
    patch = { ...(patch || info), _workflow: wf };
  }

  if (patch) {
    await prisma.produto.update({
      where: { id: produtoId },
      data: { informacoesAdicionaisEspecificacao: patch }
    });
  }
}

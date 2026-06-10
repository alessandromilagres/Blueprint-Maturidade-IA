/**
 * Rotas de Especificação Automática de Produto
 * Integração com múltiplos provedores de IA (Claude, GPT-4, Llama)
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { 
  gerarDocumento, 
  gerarEspecificacaoCompleta, 
  getTituloDocumento,
  getTiposDocumentosDisponiveis,
  getTiposDocumentosEssenciais,
  TIPOS_DOCUMENTOS_CONFIG,
  carregarArquivosReferencia
} from '../services/anthropic.js';
import {
  gerarHtmlCompleto,
  gerarMarkdownConsolidado,
  gerarDocx
} from '../services/export.js';
import {
  getProvidersStatus,
  getAvailableProviders,
  isProviderConfigured,
  loadPersistedAIConfig,
  saveCurrentProvider,
  saveProviderApiKey,
  PROVIDERS
} from '../services/ai-provider.js';
import {
  calcularMetricasEspecificacaoProduto,
  formatarSecaoMetricasEspecificacao
} from '../utils/metricasEspecificacaoProduto.js';

const router = express.Router();

/** Limite do campo Produto.observacoesCronograma no schema */
const OBS_CRONOGRAMA_MAX = 5000;

/** Data âncora para cronograma: cadastro ou hoje (meio-dia UTC para evitar deslocamento em exibição). */
function resolverDataInicioCronogramaProduto(produto) {
  if (produto?.dataInicioConstrucao) {
    return new Date(produto.dataInicioConstrucao);
  }
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

function montarObservacoesCronogramaPosEspecificacao(versaoEspecificacao, estimativas) {
  const t = estimativas?.tradicional;
  const a = estimativas?.agentica;
  const fmtMoeda = (n) =>
    n != null && Number.isFinite(Number(n))
      ? Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
      : '—';
  return [
    `Atualização automática após geração da especificação (versão ${versaoEspecificacao}).`,
    `Prazo estimado — desenvolvimento tradicional: ~${t?.prazoSemanas ?? '—'} semanas (equipe ~${t?.equipe ?? '—'}, custo total ~R$ ${fmtMoeda(t?.custo)}).`,
    `Prazo estimado — fábrica agêntica: ~${a?.prazoSemanas ?? '—'} semanas (equipe ~${a?.equipe ?? '—'}, custo total ~R$ ${fmtMoeda(a?.custo)}).`,
    'As datas de fim de construção e ativação em produção no cadastro foram alinhadas ao cenário agêntico (início + prazo em semanas; ativação = fim + 1 semana de estabilização).'
  ].join('\n');
}

function mesclarObservacoesCronogramaProduto(textoExistente, novoBloco) {
  const base = String(textoExistente || '').trim();
  const add = String(novoBloco || '').trim();
  if (!add) return base || null;
  if (!base) return add.slice(0, OBS_CRONOGRAMA_MAX);
  const merged = `${base}\n\n---\n${add}`;
  return merged.slice(0, OBS_CRONOGRAMA_MAX);
}

// ==================================================
// ROTAS DE GERENCIAMENTO DE PROVEDORES DE IA
// ==================================================

/**
 * GET /api/especificacoes/ai/providers
 * Lista todos os provedores de IA e seu status
 */
router.get('/ai/providers', async (req, res) => {
  try {
    await loadPersistedAIConfig();
    const status = getProvidersStatus();
    const available = getAvailableProviders();
    
    res.json({
      currentProvider: process.env.AI_PROVIDER || 'anthropic',
      providers: status,
      availableProviders: available,
      message: available.length === 0 
        ? 'Nenhum provedor configurado. Adicione uma API key no .env' 
        : `${available.length} provedor(es) disponível(eis)`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/especificacoes/ai/provider
 * Altera o provedor de IA ativo
 */
router.post('/ai/provider', async (req, res) => {
  try {
    const { provider } = req.body;
    await loadPersistedAIConfig();
    
    if (!provider) {
      return res.status(400).json({ error: 'Informe o provedor (anthropic, openai ou groq)' });
    }
    
    if (!PROVIDERS[provider]) {
      return res.status(400).json({ 
        error: `Provedor inválido: ${provider}`,
        validProviders: Object.keys(PROVIDERS)
      });
    }
    
    if (!isProviderConfigured(provider)) {
      return res.status(400).json({ 
        error: `Provedor ${provider} não configurado`,
        hint: `Adicione ${PROVIDERS[provider].envKey} no arquivo .env`
      });
    }
    
    await saveCurrentProvider(provider);
    
    res.json({
      success: true,
      provider: provider,
      name: PROVIDERS[provider].name,
      model: PROVIDERS[provider].defaultModel,
      message: `Provedor alterado para ${PROVIDERS[provider].name}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/especificacoes/ai/test
 * Testa a conexão com o provedor de IA atual ou com um provedor específico.
 */
router.post('/ai/test', async (req, res) => {
  try {
    const { callAI, loadPersistedAIConfig } = await import('../services/ai-provider.js');
    const { provider } = req.body || {};

    await loadPersistedAIConfig();

    if (provider && !PROVIDERS[provider]) {
      return res.status(400).json({
        success: false,
        error: `Provedor inválido: ${provider}`,
        validProviders: Object.keys(PROVIDERS)
      });
    }

    if (provider && !isProviderConfigured(provider)) {
      return res.status(400).json({
        success: false,
        error: `Provedor ${provider} não configurado`,
        hint: `Configure ${PROVIDERS[provider].envKey} antes de testar`
      });
    }
    
    const startTime = Date.now();
    const result = await callAI(
      'Responda apenas com "OK" se você estiver funcionando.',
      'Você é um assistente de teste. Responda de forma breve.',
      { maxTokens: 50, ...(provider ? { provider } : {}) }
    );
    
    res.json({
      success: true,
      provider: result.provider,
      model: result.model,
      response: result.content,
      tokensUsed: result.tokensEntrada + result.tokensSaida,
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message,
      hint: 'Verifique se a API key está correta e se você tem créditos disponíveis'
    });
  }
});

/**
 * POST /api/especificacoes/ai/apikey
 * Salva a API key de um provedor
 * ATENÇÃO: Em produção, use um serviço de secrets como AWS Secrets Manager, Vault, etc.
 */
router.post('/ai/apikey', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;
    
    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Informe o provedor e a API key' });
    }
    
    if (!PROVIDERS[provider]) {
      return res.status(400).json({ 
        error: `Provedor inválido: ${provider}`,
        validProviders: Object.keys(PROVIDERS)
      });
    }
    
    // Valida formato básico da API key
    const keyPatterns = {
      anthropic: /^sk-ant-/,
      openai: /^sk-/,
      groq: /^gsk_/
    };
    
    if (keyPatterns[provider] && !keyPatterns[provider].test(apiKey)) {
      return res.status(400).json({ 
        error: `Formato de API key inválido para ${PROVIDERS[provider].name}`,
        hint: `A chave deve começar com: ${provider === 'anthropic' ? 'sk-ant-' : provider === 'openai' ? 'sk-' : 'gsk_'}`
      });
    }
    
    await saveProviderApiKey(provider, apiKey);
    console.log(`[AI] API Key para ${provider} salva no banco de dados`);
    
    res.json({
      success: true,
      provider,
      name: PROVIDERS[provider].name,
      message: `API Key do ${PROVIDERS[provider].name} configurada com sucesso!`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================================================
// ROTAS DE TIPOS DE DOCUMENTOS
// ==================================================

/**
 * GET /api/especificacoes/tipos-documentos
 * Lista todos os tipos de documentos disponíveis para geração
 * Retorna quais são essenciais (pré-selecionados) e quais são opcionais
 */
router.get('/tipos-documentos', async (req, res) => {
  try {
    const { apenasDisponiveis } = req.query;
    const tipos = getTiposDocumentosDisponiveis(apenasDisponiveis !== 'false');
    const essenciais = getTiposDocumentosEssenciais();
    
    res.json({
      tipos: tipos.map(t => ({
        ...t,
        selecionado: t.essencial // Pré-seleciona os essenciais
      })),
      essenciais,
      totalDisponiveis: tipos.filter(t => t.disponivel !== false).length,
      totalEssenciais: essenciais.length,
      tempoEstimadoTotal: tipos
        .filter(t => t.essencial && t.disponivel !== false)
        .reduce((acc, t) => {
          const min = parseInt(t.tempoEstimado?.split('-')[0] || '2');
          return acc + min;
        }, 0) + ' min (mínimo)'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/especificacoes
 * Lista todas as especificações de todos os produtos
 */
router.get('/', async (req, res) => {
  try {
    const especificacoes = await prisma.especificacaoProduto.findMany({
      include: {
        produto: {
          include: {
            projeto: {
              include: {
                empresa: true
              }
            },
            vertical: true
          }
        },
        documentos: {
          orderBy: { ordem: 'asc' }
        },
        geradoPor: {
          select: { id: true, nome: true, email: true }
        },
        aprovadoPor: {
          select: { id: true, nome: true, email: true }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ]
    });
    
    res.json(especificacoes);
  } catch (error) {
    console.error('Erro ao listar especificações:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/especificacoes/produto/:produtoId
 * Lista todas as especificações de um produto
 */
router.get('/produto/:produtoId', async (req, res) => {
  try {
    const produtoId = parseInt(req.params.produtoId);
    
    const especificacoes = await prisma.especificacaoProduto.findMany({
      where: { produtoId },
      include: {
        documentos: {
          orderBy: { ordem: 'asc' }
        },
        geradoPor: {
          select: { id: true, nome: true, email: true }
        },
        aprovadoPor: {
          select: { id: true, nome: true, email: true }
        }
      },
      orderBy: { versao: 'desc' }
    });
    
    res.json(especificacoes);
  } catch (error) {
    console.error('Erro ao listar especificações:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/especificacoes/:id
 * Retorna uma especificação específica com todos os documentos
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const especificacao = await prisma.especificacaoProduto.findUnique({
      where: { id },
      include: {
        documentos: {
          orderBy: { ordem: 'asc' }
        },
        produto: {
          include: {
            projeto: true,
            vertical: true
          }
        },
        geradoPor: {
          select: { id: true, nome: true, email: true }
        },
        aprovadoPor: {
          select: { id: true, nome: true, email: true }
        }
      }
    });
    
    if (!especificacao) {
      return res.status(404).json({ error: 'Especificação não encontrada' });
    }
    
    res.json(especificacao);
  } catch (error) {
    console.error('Erro ao buscar especificação:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/especificacoes/gerar/:produtoId
 * Gera uma nova especificação completa para um produto
 * 
 * Body (opcional):
 * - tiposSelecionados: Array de tipos de documentos a gerar (ex: ['prd', 'requisitos_funcionais'])
 *   Se não informado, gera todos os documentos essenciais
 */
router.post('/gerar/:produtoId', async (req, res) => {
  try {
    const produtoId = parseInt(req.params.produtoId);
    const usuarioId = req.usuarioId;
    const { tiposSelecionados } = req.body || {};
    
    // Se não passou tipos selecionados, usa os essenciais
    const tiposParaGerar = tiposSelecionados && tiposSelecionados.length > 0
      ? tiposSelecionados
      : getTiposDocumentosEssenciais();
    
    // Valida se os tipos são válidos
    const tiposValidos = Object.keys(TIPOS_DOCUMENTOS_CONFIG).filter(
      t => TIPOS_DOCUMENTOS_CONFIG[t].disponivel !== false
    );
    const tiposInvalidos = tiposParaGerar.filter(t => !tiposValidos.includes(t));
    
    if (tiposInvalidos.length > 0) {
      return res.status(400).json({
        error: 'Tipos de documentos inválidos',
        tiposInvalidos,
        tiposDisponiveis: tiposValidos
      });
    }
    
    // Busca o produto com todas as informações necessárias
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: {
        projeto: true,
        vertical: true,
        avaliacoes: {
          where: { status: 'finalizada' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            respostasObrigatorias: {
              include: {
                perguntaObrigatoria: true
              }
            },
            respostasVerticais: {
              include: {
                perguntaProduto: true
              }
            }
          }
        },
        arquivosReferencia: {
          where: { ativo: true }
        }
      }
    });
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Verifica se a API key está configurada
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ 
        error: 'API da Anthropic não configurada. Configure ANTHROPIC_API_KEY no arquivo .env' 
      });
    }
    
    // Busca a última versão para incrementar
    const ultimaEspecificacao = await prisma.especificacaoProduto.findFirst({
      where: { produtoId },
      orderBy: { versao: 'desc' }
    });
    const novaVersao = (ultimaEspecificacao?.versao || 0) + 1;
    
    // Busca configurações de custo
    const custos = await prisma.configuracaoCusto.findMany({
      where: { ativo: true }
    });
    
    // Cria o registro da especificação
    const especificacao = await prisma.especificacaoProduto.create({
      data: {
        produtoId,
        versao: novaVersao,
        status: 'gerando',
        geradoPorId: usuarioId
      }
    });
    
    // Calcula tempo estimado
    const tempoEstimado = tiposParaGerar.reduce((acc, tipo) => {
      const config = TIPOS_DOCUMENTOS_CONFIG[tipo];
      const min = parseInt(config?.tempoEstimado?.split('-')[0] || '2');
      return acc + min;
    }, 0);
    
    // Retorna imediatamente para o cliente
    res.status(202).json({
      message: 'Geração de especificação iniciada',
      especificacaoId: especificacao.id,
      versao: novaVersao,
      status: 'gerando',
      tiposSelecionados: tiposParaGerar,
      totalDocumentos: tiposParaGerar.length,
      tempoEstimado: `${tempoEstimado}-${tempoEstimado + tiposParaGerar.length} min`,
      arquivosReferencia: produto.arquivosReferencia?.length || 0
    });
    
    // Processa a geração em background (inclui arquivos de referência e tipos selecionados)
    processarGeracaoEmBackground(
      especificacao.id,
      produto,
      custos,
      produto.arquivosReferencia,
      tiposParaGerar
    ).catch((jobErr) =>
      console.error(`[Especificação] Job em background (id=${especificacao.id}) não tratado:`, jobErr)
    );
    
  } catch (error) {
    console.error('Erro ao iniciar geração:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Processa a geração dos documentos em background com progresso em tempo real
 * @param {number} especificacaoId - ID da especificação
 * @param {Object} produto - Dados do produto
 * @param {Array} custos - Configurações de custo
 * @param {Array} arquivos - Arquivos de referência
 * @param {Array} tiposSelecionados - Tipos de documentos a gerar (se vazio, gera todos essenciais)
 */
async function processarGeracaoEmBackground(especificacaoId, produto, custos, arquivos = [], tiposSelecionados = null) {
  const startTime = Date.now();
  const pausaEntreDocumentosMs = (() => {
    const raw = Number(process.env.AI_DOC_COOLDOWN_MS);
    return Number.isFinite(raw) && raw >= 0 ? raw : 1500;
  })();
  
  // Usa tipos selecionados ou os padrão essenciais
  const tiposDocumentos = tiposSelecionados && tiposSelecionados.length > 0
    ? tiposSelecionados
    : getTiposDocumentosEssenciais();
  
  try {
    console.log(`[Especificação ${especificacaoId}] Iniciando geração com progresso...`);
    
    // Carrega e processa arquivos de referência
    let arquivosReferencia = null;
    if (arquivos && arquivos.length > 0) {
      console.log(`[Especificação ${especificacaoId}] ${arquivos.length} arquivo(s) de referência disponível(is)`);
      arquivosReferencia = await carregarArquivosReferencia(arquivos);
      console.log(`[Especificação ${especificacaoId}] Arquivos carregados: ${arquivosReferencia.documentos.length} documento(s), ${arquivosReferencia.imagens.length} imagem(ns)`);
    }

    // Cria os documentos com status "pendente" para tracking de progresso
    for (let i = 0; i < tiposDocumentos.length; i++) {
      const tipo = tiposDocumentos[i];
      await prisma.documentoEspecificacao.create({
        data: {
          especificacaoId,
          tipo,
          titulo: getTituloDocumento(tipo),
          conteudo: '',
          ordem: i,
          status: 'pendente'
        }
      });
    }
    
    // Métricas de esforço/prazo: determinísticas pelo cadastro do produto (não variam com documentos gerados)
    const metricasFixas = calcularMetricasEspecificacaoProduto(produto);

    // Gera cada documento individualmente com atualização de progresso
    const documentosGerados = [];
    let tokensTotal = 0;
    let modeloUsado = null;
    let documentosAnteriores = null;
    
    // Prepara contexto com arquivos de referência processados
    const opcoesBase = { custos, arquivosReferencia, metricasEspecificacao: metricasFixas };
    
    for (let i = 0; i < tiposDocumentos.length; i++) {
      const tipo = tiposDocumentos[i];
      console.log(`[Especificação ${especificacaoId}] Gerando ${tipo} (${i + 1}/${tiposDocumentos.length})...`);
      
      // Atualiza status para "gerando"
      await prisma.documentoEspecificacao.updateMany({
        where: { especificacaoId, tipo },
        data: { status: 'gerando' }
      });
      
      try {
        // Gera o documento
        const resultado = await gerarDocumento(
          tipo,
          produto,
          produto.vertical,
          produto.avaliacoes,
          { ...opcoesBase, documentosAnteriores }
        );
        
        // Verifica se resultado e conteúdo existem
        const conteudoGerado = resultado?.conteudo || '';
        
        // Atualiza o documento com conteúdo e status "concluido"
        await prisma.documentoEspecificacao.updateMany({
          where: { especificacaoId, tipo },
          data: { 
            conteudo: conteudoGerado,
            status: conteudoGerado ? 'concluido' : 'erro'
          }
        });
        
        // Salva no histórico (só se tiver conteúdo)
        if (conteudoGerado) {
          await prisma.historicoGeracaoIA.create({
            data: {
              produtoId: produto.id,
              tipoDocumento: tipo,
              promptUsado: 'Prompt padrão',
              respostaIA: conteudoGerado.substring(0, 10000),
              modeloIA: resultado?.modelo || 'desconhecido',
              tokensEntrada: resultado?.tokensEntrada || 0,
              tokensSaida: resultado?.tokensSaida || 0,
              tempoResposta: resultado?.tempoResposta || 0,
              sucesso: true
            }
          });
        }
        
        tokensTotal += (resultado?.tokensEntrada || 0) + (resultado?.tokensSaida || 0);
        modeloUsado = resultado?.modelo || modeloUsado;
        
        documentosGerados.push({
          tipo,
          titulo: getTituloDocumento(tipo),
          conteudo: conteudoGerado
        });
        
        // Atualiza contexto para próximos documentos (PRD serve de referência)
        if (tipo === 'prd' && conteudoGerado) {
          documentosAnteriores = conteudoGerado.substring(0, 3000);
        }
        
      } catch (docError) {
        console.error(`[Especificação ${especificacaoId}] Erro no ${tipo}:`, docError.message);
        
        const conteudoErro = `Erro na geração: ${docError.message}\n\n${formatarSecaoMetricasEspecificacao(metricasFixas, produto)}`;
        // Marca documento como erro mas continua com os outros
        await prisma.documentoEspecificacao.updateMany({
          where: { especificacaoId, tipo },
          data: { 
            conteudo: conteudoErro,
            status: 'erro'
          }
        });
      }

      if (i < tiposDocumentos.length - 1 && pausaEntreDocumentosMs > 0) {
        await new Promise((r) => setTimeout(r, pausaEntreDocumentosMs));
      }
    }
    
    const estimativas = {
      storyPointsTotais: metricasFixas.storyPointsTotais,
      tradicional: metricasFixas.tradicional,
      agentica: metricasFixas.agentica
    };
    
    // Gera resumo executivo (com verificação de segurança)
    const docPRD = documentosGerados.find(d => d.tipo === 'prd');
    const resumoExecutivo = (docPRD && docPRD.conteudo) 
      ? docPRD.conteudo.substring(0, 1000) 
      : 'Especificação gerada com sucesso.';
    
    // Atualiza a especificação com os resultados finais
    const tempoTotal = Math.round((Date.now() - startTime) / 1000);
    
    await prisma.especificacaoProduto.update({
      where: { id: especificacaoId },
      data: {
        status: 'concluido',
        modeloIA: modeloUsado,
        tokensUsados: tokensTotal,
        tempoGeracao: tempoTotal,
        // Estimativas tradicionais
        storyPointsTotais: estimativas.storyPointsTotais,
        horasTradicional: estimativas.tradicional?.horas,
        custoTradicional: estimativas.tradicional?.custo,
        prazoTradicional: estimativas.tradicional?.prazoSemanas,
        equipeTradicional: estimativas.tradicional?.equipe,
        produtividadeTradicional: metricasFixas.prodTradicional,
        // Estimativas agênticas
        horasAgentica: estimativas.agentica?.horas,
        custoAgentica: estimativas.agentica?.custo,
        prazoAgentica: estimativas.agentica?.prazoSemanas,
        equipeAgentica: estimativas.agentica?.equipe,
        produtividadeAgentica: metricasFixas.prodAgentica,
        resumoExecutivo
      }
    });

    const espVersaoRow = await prisma.especificacaoProduto.findUnique({
      where: { id: especificacaoId },
      select: { versao: true }
    });
    const versaoEspecificacaoGerada = espVersaoRow?.versao ?? 1;

    // ========================================
    // ATUALIZA O PRODUTO COM BASE NA ESPECIFICAÇÃO (FÁBRICA AGÊNTICA)
    // ========================================
    const atualizacaoProduto = {};

    // 1. Atualiza custo estimado com valor da fábrica agêntica
    if (estimativas.agentica?.custo) {
      atualizacaoProduto.custoEstimado = estimativas.agentica.custo;
    }

    // 2. Cronograma no cadastro do produto (datas coerentes com prazo agêntico em semanas)
    const prazoSemanas = estimativas.agentica?.prazoSemanas;
    if (prazoSemanas != null && Number(prazoSemanas) > 0) {
      const tinhaDataInicio = Boolean(produto.dataInicioConstrucao);
      const dataInicio = resolverDataInicioCronogramaProduto(produto);

      if (!tinhaDataInicio) {
        atualizacaoProduto.dataInicioConstrucao = dataInicio;
      }

      const diasProjeto = Math.ceil(Number(prazoSemanas)) * 7;
      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() + diasProjeto);

      const dataAtivacao = new Date(dataFim);
      dataAtivacao.setDate(dataAtivacao.getDate() + 7);

      atualizacaoProduto.dataFimConstrucao = dataFim;
      atualizacaoProduto.dataAtivacaoProducao = dataAtivacao;
    }

    const blocoCronograma = montarObservacoesCronogramaPosEspecificacao(
      versaoEspecificacaoGerada,
      estimativas
    );
    atualizacaoProduto.observacoesCronograma = mesclarObservacoesCronogramaProduto(
      produto.observacoesCronograma,
      blocoCronograma
    );
    
    // 3. Extrai e sugere KPIs do PRD (apenas se campos estiverem vazios)
    if (docPRD && docPRD.conteudo) {
      const kpisExtraidos = extrairKPIsDoPRD(docPRD.conteudo);
      
      // Atualiza métrica principal se estiver vazia
      if (!produto.metricaPrincipal && kpisExtraidos.metricaPrincipal) {
        atualizacaoProduto.metricaPrincipal = kpisExtraidos.metricaPrincipal;
      }
      
      // Atualiza meta esperada se estiver vazia
      if (!produto.metaEsperada && kpisExtraidos.metaEsperada) {
        atualizacaoProduto.metaEsperada = kpisExtraidos.metaEsperada;
      }
      
      // Atualiza baseline se estiver vazio
      if (!produto.baselineAtual && kpisExtraidos.baselineAtual) {
        atualizacaoProduto.baselineAtual = kpisExtraidos.baselineAtual;
      }
    }
    
    // Aplica atualizações no produto se houver algo para atualizar
    if (Object.keys(atualizacaoProduto).length > 0) {
      await prisma.produto.update({
        where: { id: produto.id },
        data: atualizacaoProduto
      });
      console.log(`[Especificação ${especificacaoId}] Produto atualizado:`, Object.keys(atualizacaoProduto));
    }
    
    console.log(`[Especificação ${especificacaoId}] Geração concluída em ${tempoTotal}s`);
    
  } catch (error) {
    console.error(`[Especificação ${especificacaoId}] Erro fatal:`, error);
    
    await prisma.especificacaoProduto.update({
      where: { id: especificacaoId },
      data: {
        status: 'erro',
        observacoes: error.message
      }
    });

    await prisma.documentoEspecificacao.updateMany({
      where: { especificacaoId, status: { in: ['pendente', 'gerando'] } },
      data: {
        status: 'erro',
        conteudo: `Interrompido: ${error.message}`
      }
    });
  }
}


/**
 * Extrai KPIs e métricas sugeridas do documento PRD gerado
 * @param {string} conteudoPRD - Conteúdo do documento PRD
 * @returns {Object} KPIs extraídos
 */
function extrairKPIsDoPRD(conteudoPRD) {
  const resultado = {
    metricaPrincipal: null,
    metaEsperada: null,
    baselineAtual: null,
    kpisAdicionais: []
  };
  
  // Verificação de segurança
  if (!conteudoPRD || typeof conteudoPRD !== 'string') {
    return resultado;
  }
  
  // Padrões para encontrar North Star Metric / Métrica Principal
  const metricaPrincipalPatterns = [
    /\*\*North\s+Star\s+Metric[:\*]*\s*\*?\*?\s*([^\n\|]+)/i,
    /Métrica\s+Principal[:\s]*\*?\*?\s*([^\n\|]+)/i,
    /KPI\s+Principal[:\s]*\*?\*?\s*([^\n\|]+)/i,
    /\|\s*\*\*([^|*]+)\*\*\s*\|[^|]*\|[^|]*Meta/i
  ];
  
  for (const pattern of metricaPrincipalPatterns) {
    const match = conteudoPRD.match(pattern);
    if (match && match[1]) {
      resultado.metricaPrincipal = match[1].trim().substring(0, 500);
      break;
    }
  }
  
  // Se não encontrou, tenta extrair do contexto de métricas
  if (!resultado.metricaPrincipal) {
    const metricasSection = conteudoPRD.match(/#{1,3}\s*(?:Métricas|KPIs|Indicadores)[^\n]*\n([\s\S]*?)(?=#{1,3}|$)/i);
    if (metricasSection) {
      const primeiraMetrica = metricasSection[1].match(/[-•*]\s*\*?\*?([^:\n]+)/);
      if (primeiraMetrica) {
        resultado.metricaPrincipal = primeiraMetrica[1].trim().substring(0, 500);
      }
    }
  }
  
  // Padrões para encontrar metas
  const metaPatterns = [
    /Meta\s+(?:90\s*d(?:ias)?|3\s*meses)[:\s]*\*?\*?\s*([^\n\|]+)/i,
    /Meta\s+Esperada[:\s]*\*?\*?\s*([^\n\|]+)/i,
    /Objetivo[:\s]*\*?\*?\s*([^\n\|]+)/i,
    /aumentar[^\n]*?(\d+%[^\n]*)/i,
    /reduzir[^\n]*?(\d+%[^\n]*)/i,
    /atingir[^\n]*?(\d+[^\n]*)/i
  ];
  
  for (const pattern of metaPatterns) {
    const match = conteudoPRD.match(pattern);
    if (match && match[1]) {
      resultado.metaEsperada = match[1].trim().substring(0, 200);
      break;
    }
  }
  
  // Padrões para encontrar baseline
  const baselinePatterns = [
    /Baseline[:\s]*\*?\*?\s*([^\n\|]+)/i,
    /Atual[:\s]*\*?\*?\s*([^\n\|]+)/i,
    /Situação\s+Atual[:\s]*\*?\*?\s*([^\n\|]+)/i
  ];
  
  for (const pattern of baselinePatterns) {
    const match = conteudoPRD.match(pattern);
    if (match && match[1]) {
      resultado.baselineAtual = match[1].trim().substring(0, 200);
      break;
    }
  }
  
  // Extrai KPIs adicionais da tabela de métricas
  const tabelaKPIs = conteudoPRD.match(/\|\s*KPI\s*\|[^\n]*\n\|[-\s|]+\n((?:\|[^\n]+\n)+)/i);
  if (tabelaKPIs) {
    const linhas = tabelaKPIs[1].split('\n').filter(l => l.trim());
    for (const linha of linhas.slice(0, 5)) {
      const colunas = linha.split('|').filter(c => c.trim());
      if (colunas.length >= 1) {
        resultado.kpisAdicionais.push(colunas[0].replace(/\*+/g, '').trim());
      }
    }
  }
  
  // Se ainda não tem métrica principal, usa o primeiro KPI adicional
  if (!resultado.metricaPrincipal && resultado.kpisAdicionais.length > 0) {
    resultado.metricaPrincipal = resultado.kpisAdicionais[0];
  }
  
  // Gera sugestões padrão se não encontrou nada
  if (!resultado.metricaPrincipal) {
    resultado.metricaPrincipal = 'Taxa de adoção de usuários ativos';
  }
  if (!resultado.metaEsperada) {
    resultado.metaEsperada = 'Aumentar em 50% nos primeiros 90 dias';
  }
  if (!resultado.baselineAtual) {
    resultado.baselineAtual = 'A ser medido após lançamento';
  }
  
  return resultado;
}

/**
 * POST /api/especificacoes/gerar-documento/:produtoId
 * Gera um documento específico (para regeneração individual)
 */
router.post('/gerar-documento/:produtoId', async (req, res) => {
  try {
    const produtoId = parseInt(req.params.produtoId);
    const { tipo, especificacaoId } = req.body;
    
    if (!tipo) {
      return res.status(400).json({ error: 'Tipo de documento é obrigatório' });
    }
    
    // Busca o produto
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: {
        vertical: true,
        avaliacoes: {
          where: { status: 'finalizada' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            respostasObrigatorias: {
              include: { perguntaObrigatoria: true }
            }
          }
        }
      }
    });
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const custos = await prisma.configuracaoCusto.findMany({ where: { ativo: true } });
    const metricasFixas = calcularMetricasEspecificacaoProduto(produto);
    
    // Gera o documento
    const resultado = await gerarDocumento(
      tipo, 
      produto, 
      produto.vertical, 
      produto.avaliacoes,
      { custos, metricasEspecificacao: metricasFixas }
    );
    
    // Se tiver especificacaoId, atualiza o documento existente
    if (especificacaoId) {
      const docExistente = await prisma.documentoEspecificacao.findFirst({
        where: { especificacaoId, tipo }
      });
      
      if (docExistente) {
        await prisma.documentoEspecificacao.update({
          where: { id: docExistente.id },
          data: {
            conteudo: resultado.conteudo,
            versaoDocumento: docExistente.versaoDocumento + 1,
            editadoManualmente: false
          }
        });
      }
    }
    
    res.json({
      tipo,
      titulo: getTituloDocumento(tipo),
      conteudo: resultado.conteudo,
      metricas: {
        tokensEntrada: resultado.tokensEntrada,
        tokensSaida: resultado.tokensSaida,
        tempoResposta: resultado.tempoResposta
      },
      metricasProjeto: metricasFixas
    });
    
  } catch (error) {
    console.error('Erro ao gerar documento:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/especificacoes/documento/:id
 * Atualiza o conteúdo de um documento (edição manual)
 */
router.put('/documento/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { conteudo } = req.body;
    
    const documento = await prisma.documentoEspecificacao.update({
      where: { id },
      data: {
        conteudo,
        editadoManualmente: true
      }
    });
    
    res.json(documento);
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/especificacoes/:id/aprovar
 * Aprova uma especificação
 */
router.put('/:id/aprovar', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const usuarioId = req.usuarioId;
    const { observacoes } = req.body;
    
    const especificacao = await prisma.especificacaoProduto.update({
      where: { id },
      data: {
        status: 'aprovado',
        aprovadoPorId: usuarioId,
        dataAprovacao: new Date(),
        observacoes
      },
      include: {
        produto: true,
        documentos: true
      }
    });
    
    res.json(especificacao);
  } catch (error) {
    console.error('Erro ao aprovar especificação:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/especificacoes/:id/status
 * Verifica o status de geração com progresso detalhado por documento
 */
router.get('/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const especificacao = await prisma.especificacaoProduto.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        tokensUsados: true,
        tempoGeracao: true,
        // Estimativas tradicionais
        storyPointsTotais: true,
        horasTradicional: true,
        custoTradicional: true,
        prazoTradicional: true,
        equipeTradicional: true,
        produtividadeTradicional: true,
        // Estimativas agênticas
        horasAgentica: true,
        custoAgentica: true,
        prazoAgentica: true,
        equipeAgentica: true,
        produtividadeAgentica: true,
        observacoes: true,
        documentos: {
          select: {
            id: true,
            tipo: true,
            titulo: true,
            status: true,
            ordem: true
          },
          orderBy: { ordem: 'asc' }
        }
      }
    });
    
    if (!especificacao) {
      return res.status(404).json({ error: 'Especificação não encontrada' });
    }
    
    // Calcula progresso baseado nos documentos que realmente foram criados
    const totalDocumentos = especificacao.documentos.length || 5; // Usa o total real de documentos
    const documentosConcluidos = especificacao.documentos.filter(d => d.status === 'concluido').length;
    const documentoGerando = especificacao.documentos.find(d => d.status === 'gerando');
    const progresso = totalDocumentos > 0 
      ? Math.round((documentosConcluidos / totalDocumentos) * 100) 
      : 0;
    
    const etapaResumo =
      especificacao.status === 'gerando'
        ? documentoGerando
          ? `Documento ${documentosConcluidos + 1}/${totalDocumentos}: ${documentoGerando.titulo || documentoGerando.tipo}`
          : 'Preparando documentos…'
        : null;

    res.json({
      ...especificacao,
      progresso,
      documentoAtual: documentoGerando?.tipo || null,
      documentoAtualTitulo: documentoGerando?.titulo || null,
      totalDocumentos,
      documentosConcluidos,
      etapaResumo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/especificacoes/:id
 * Remove uma especificação
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    await prisma.especificacaoProduto.delete({
      where: { id }
    });
    
    res.json({ message: 'Especificação removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover especificação:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/especificacoes/:id/exportar/:formato
 * Exporta a especificação em diferentes formatos (html, md)
 */
router.get('/:id/exportar/:formato', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const formato = req.params.formato.toLowerCase();
    
    const especificacao = await prisma.especificacaoProduto.findUnique({
      where: { id },
      include: {
        documentos: {
          orderBy: { ordem: 'asc' }
        },
        produto: true
      }
    });
    
    if (!especificacao) {
      return res.status(404).json({ error: 'Especificação não encontrada' });
    }
    
    const nomeArquivo = `especificacao_${especificacao.produto.nome.replace(/\s+/g, '_')}_v${especificacao.versao}`;
    
    switch (formato) {
      case 'html':
        const html = gerarHtmlCompleto(especificacao, especificacao.produto);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}.html"`);
        return res.send(html);
        
      case 'md':
      case 'markdown':
        const markdown = gerarMarkdownConsolidado(especificacao, especificacao.produto);
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}.md"`);
        return res.send(markdown);
        
      case 'json':
        res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}.json"`);
        return res.json({
          produto: especificacao.produto,
          versao: especificacao.versao,
          status: especificacao.status,
          metricas: {
            horasEstimadas: especificacao.horasEstimadas,
            custoDesenvolvimento: especificacao.custoDesenvolvimento,
            prazoSemanas: especificacao.prazoSemanas,
            tamanhoEquipe: especificacao.tamanhoEquipe
          },
          documentos: especificacao.documentos.map(d => ({
            tipo: d.tipo,
            titulo: d.titulo,
            conteudo: d.conteudo
          })),
          geradoEm: especificacao.createdAt
        });
      
      case 'docx':
      case 'word':
        const docxBuffer = await gerarDocx(especificacao, especificacao.produto);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}.docx"`);
        return res.send(docxBuffer);
        
      default:
        return res.status(400).json({ error: 'Formato não suportado. Use: html, md, json, docx' });
    }
  } catch (error) {
    console.error('Erro ao exportar:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/configuracoes-custo
 * Lista configurações de custo por perfil
 */
router.get('/configuracoes-custo', async (req, res) => {
  try {
    const configuracoes = await prisma.configuracaoCusto.findMany({
      orderBy: { perfil: 'asc' }
    });
    res.json(configuracoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/configuracoes-custo
 * Cria ou atualiza configuração de custo
 */
router.post('/configuracoes-custo', async (req, res) => {
  try {
    const { perfil, descricao, custoHora, ativo } = req.body;
    
    const configuracao = await prisma.configuracaoCusto.upsert({
      where: { perfil },
      update: { descricao, custoHora, ativo },
      create: { perfil, descricao, custoHora, ativo }
    });
    
    res.json(configuracao);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

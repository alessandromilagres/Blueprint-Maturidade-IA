import express from 'express';
import { prisma } from '../lib/prisma.js';
import { enviarEmailDiagnosticoRapidoResultado } from '../services/email.js';

const router = express.Router();

/**
 * ROTAS DO MÓDULO DE DIAGNÓSTICO RÁPIDO
 * Versão reduzida para demonstração - 25 perguntas em 30 minutos
 */

// ==========================================
// ROTAS PÚBLICAS (para demonstração)
// ==========================================

/**
 * GET /api/diagnostico/dimensoes
 * Lista todas as dimensões com suas perguntas
 */
router.get('/dimensoes', async (req, res) => {
  try {
    const dimensoes = await prisma.dimensaoDiagnostico.findMany({
      include: {
        perguntas: {
          orderBy: { ordem: 'asc' }
        }
      },
      orderBy: { ordem: 'asc' }
    });
    
    res.json(dimensoes);
  } catch (error) {
    console.error('Erro ao buscar dimensões:', error);
    res.status(500).json({ error: 'Erro ao buscar dimensões do diagnóstico' });
  }
});

/**
 * POST /api/diagnostico/iniciar
 * Inicia um novo diagnóstico rápido (pode ser anônimo para demonstração)
 */
router.post('/iniciar', async (req, res) => {
  console.log('[Diagnóstico] POST /iniciar recebido:', req.body);
  try {
    const {
      nomeResponsavel,
      emailResponsavel,
      cargoResponsavel,
      nomeEmpresa,
      setorEmpresa,
      porteEmpresa,
      verticalSelecionada,
      empresaId,
      conduzidoPor
    } = req.body;
    
    if (!nomeResponsavel) {
      console.log('[Diagnóstico] Erro: Nome do responsável não fornecido');
      return res.status(400).json({ error: 'Nome do responsável é obrigatório' });
    }
    
    console.log('[Diagnóstico] Buscando perguntas...');
    // Buscar todas as perguntas
    const perguntas = await prisma.perguntaDiagnostico.findMany();
    console.log('[Diagnóstico] Perguntas encontradas:', perguntas.length);
    
    // Criar diagnóstico com respostas vazias
    const diagnostico = await prisma.diagnosticoRapido.create({
      data: {
        nomeResponsavel,
        emailResponsavel,
        cargoResponsavel,
        nomeEmpresa,
        setorEmpresa,
        porteEmpresa,
        verticalSelecionada,
        empresaId: empresaId || null,
        conduzidoPor,
        status: 'em_andamento',
        respostas: {
          create: perguntas.map(p => ({
            perguntaId: p.id,
            pontuacao: null,
            observacoes: null
          }))
        }
      },
      include: {
        respostas: {
          include: {
            pergunta: {
              include: { dimensao: true }
            }
          }
        }
      }
    });
    
    console.log('[Diagnóstico] Criado com sucesso! ID:', diagnostico.id);
    res.json(diagnostico);
  } catch (error) {
    console.error('[Diagnóstico] ERRO ao iniciar:', error);
    res.status(500).json({ error: 'Erro ao iniciar diagnóstico', details: error.message });
  }
});

/**
 * GET /api/diagnostico/:id
 * Busca um diagnóstico específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const diagnostico = await prisma.diagnosticoRapido.findUnique({
      where: { id: parseInt(id) },
      include: {
        respostas: {
          include: {
            pergunta: {
              include: { dimensao: true }
            }
          }
        },
        empresa: true
      }
    });
    
    if (!diagnostico) {
      return res.status(404).json({ error: 'Diagnóstico não encontrado' });
    }
    
    res.json(diagnostico);
  } catch (error) {
    console.error('Erro ao buscar diagnóstico:', error);
    res.status(500).json({ error: 'Erro ao buscar diagnóstico' });
  }
});

/**
 * PUT /api/diagnostico/:id/respostas
 * Salva respostas do diagnóstico (upsert - cria se não existir)
 */
router.put('/:id/respostas', async (req, res) => {
  try {
    const { id } = req.params;
    const { respostas } = req.body;
    
    // Validar diagnóstico existe
    const diagnostico = await prisma.diagnosticoRapido.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!diagnostico) {
      return res.status(404).json({ error: 'Diagnóstico não encontrado' });
    }
    
    // Upsert respostas (cria se não existir, atualiza se existir)
    for (const resposta of respostas) {
      await prisma.respostaDiagnostico.upsert({
        where: {
          diagnosticoId_perguntaId: {
            diagnosticoId: parseInt(id),
            perguntaId: resposta.perguntaId
          }
        },
        update: {
          pontuacao: resposta.pontuacao,
          observacoes: resposta.observacoes
        },
        create: {
          diagnosticoId: parseInt(id),
          perguntaId: resposta.perguntaId,
          pontuacao: resposta.pontuacao,
          observacoes: resposta.observacoes
        }
      });
    }
    
    // Retornar diagnóstico atualizado
    const diagnosticoAtualizado = await prisma.diagnosticoRapido.findUnique({
      where: { id: parseInt(id) },
      include: {
        respostas: {
          include: {
            pergunta: {
              include: { dimensao: true }
            }
          }
        }
      }
    });
    
    res.json(diagnosticoAtualizado);
  } catch (error) {
    console.error('Erro ao salvar respostas:', error);
    res.status(500).json({ error: 'Erro ao salvar respostas', details: error.message });
  }
});

/**
 * PUT /api/diagnostico/:id/finalizar
 * Finaliza o diagnóstico e calcula scores
 */
router.put('/:id/finalizar', async (req, res) => {
  try {
    const { id } = req.params;
    const { duracaoMinutos } = req.body;
    
    // Buscar diagnóstico com respostas
    const diagnostico = await prisma.diagnosticoRapido.findUnique({
      where: { id: parseInt(id) },
      include: {
        respostas: {
          include: {
            pergunta: {
              include: { dimensao: true }
            }
          }
        }
      }
    });
    
    if (!diagnostico) {
      return res.status(404).json({ error: 'Diagnóstico não encontrado' });
    }
    
    // Verificar se todas as perguntas foram respondidas
    const respostasNaoRespondidas = diagnostico.respostas.filter(r => r.pontuacao === null);
    if (respostasNaoRespondidas.length > 0) {
      return res.status(400).json({ 
        error: 'Todas as perguntas devem ser respondidas para finalizar',
        perguntasFaltando: respostasNaoRespondidas.length
      });
    }
    
    // Calcular score por dimensão
    const scoresPorDimensao = {};
    const dimensoes = await prisma.dimensaoDiagnostico.findMany();
    
    for (const dimensao of dimensoes) {
      const respostasDimensao = diagnostico.respostas.filter(
        r => r.pergunta.dimensaoId === dimensao.id
      );
      
      const somaScore = respostasDimensao.reduce((acc, r) => acc + r.pontuacao, 0);
      const mediaScore = somaScore / respostasDimensao.length;
      
      scoresPorDimensao[dimensao.id] = {
        nome: dimensao.nome,
        icone: dimensao.icone,
        peso: dimensao.peso,
        score: parseFloat(mediaScore.toFixed(2)),
        scorePonderado: parseFloat((mediaScore * dimensao.peso).toFixed(4))
      };
    }
    
    // Calcular score geral ponderado
    const scoreGeral = Object.values(scoresPorDimensao)
      .reduce((acc, d) => acc + d.scorePonderado, 0);
    
    // Determinar nível de maturidade
    let nivelMaturidade;
    if (scoreGeral < 1.5) nivelMaturidade = 'Iniciante';
    else if (scoreGeral < 2.5) nivelMaturidade = 'Explorador';
    else if (scoreGeral < 3.5) nivelMaturidade = 'Praticante';
    else if (scoreGeral < 4.5) nivelMaturidade = 'Avançado';
    else nivelMaturidade = 'Líder';
    
    // Identificar 3 principais gaps (menores scores)
    const dimensoesOrdenadas = Object.entries(scoresPorDimensao)
      .sort((a, b) => a[1].score - b[1].score)
      .slice(0, 3)
      .map(([id, data]) => ({
        dimensaoId: parseInt(id),
        dimensao: data.nome,
        icone: data.icone,
        score: data.score,
        gap: parseFloat((5 - data.score).toFixed(2)),
        prioridade: data.score < 2.5 ? 'Crítica' : data.score < 3.5 ? 'Alta' : 'Média'
      }));
    
    // Gerar recomendação de próximo passo CONTEXTUALIZADA
    const recomendacao = gerarRecomendacaoContextualizada(
      scoreGeral, 
      nivelMaturidade, 
      dimensoesOrdenadas, 
      diagnostico.setorEmpresa, 
      diagnostico.porteEmpresa
    );
    
    // Atualizar diagnóstico
    const diagnosticoFinalizado = await prisma.diagnosticoRapido.update({
      where: { id: parseInt(id) },
      data: {
        status: 'finalizado',
        scoreGeral: parseFloat(scoreGeral.toFixed(2)),
        nivelMaturidade,
        principaisGaps: JSON.stringify(dimensoesOrdenadas),
        recomendacaoProximoPasso: recomendacao,
        duracaoMinutos: duracaoMinutos || null
      },
      include: {
        respostas: {
          include: {
            pergunta: {
              include: { dimensao: true }
            }
          }
        }
      }
    });
    
    // Retornar com scores detalhados
    res.json({
      ...diagnosticoFinalizado,
      scoresPorDimensao: Object.values(scoresPorDimensao)
    });

    (async () => {
      try {
        const emailDest = diagnosticoFinalizado.emailResponsavel?.trim();
        if (!emailDest) {
          return;
        }

        const BASE_URL_APP = process.env.BASE_URL || 'https://agentica.sysmap.com.br';
        const diagnosticoId = parseInt(id);
        const linkRelatorio = `${BASE_URL_APP}/diagnostico-rapido/${diagnosticoId}/relatorio`;
        const contact = process.env.ASSESSMENT_CONTACT_EMAIL || 'contato@sysmap.com.br';
        const mailSubject = encodeURIComponent('Interesse em Assessment Completo de IA');
        const empresaRef =
          diagnostico.nomeEmpresa ||
          diagnosticoFinalizado.nomeEmpresa ||
          '—';
        const mailBody = encodeURIComponent(
          `Olá,\n\nGostaria de solicitar o Assessment Completo de Maturidade em IA.\n\n` +
            `Referência — Diagnóstico rápido (demo):\n` +
            `- ID: ${diagnosticoId}\n` +
            `- Responsável: ${diagnostico.nomeResponsavel || diagnosticoFinalizado.nomeResponsavel || '—'}\n` +
            `- Empresa: ${empresaRef}\n` +
            `- Relatório online: ${linkRelatorio}\n\n` +
            `Atenciosamente`
        );
        const linkMailtoAssessment = `mailto:${contact}?subject=${mailSubject}&body=${mailBody}`;

        const proximasAcoes = gerarAcoesPersonalizadas(
          dimensoesOrdenadas,
          diagnostico.setorEmpresa,
          diagnostico.porteEmpresa
        )
          .concat([
            'Agendar reunião de aprofundamento com especialista em IA',
            'Realizar o Assessment Completo de Maturidade (108 perguntas)'
          ])
          .slice(0, 6);

        const respostasEmail = diagnosticoFinalizado.respostas.map((r) => ({
          dimensao: r.pergunta?.dimensao?.nome || '—',
          pergunta: r.pergunta?.texto || `Pergunta #${r.perguntaId}`,
          pontuacao: r.pontuacao,
          observacoes: r.observacoes
        }));

        await enviarEmailDiagnosticoRapidoResultado({
          destinatarioEmail: emailDest,
          destinatarioNome: diagnostico.nomeResponsavel || 'Olá',
          empresaNome: empresaRef,
          diagnosticoId,
          dataConclusao: new Date().toLocaleString('pt-BR'),
          duracaoMinutos: diagnosticoFinalizado.duracaoMinutos,
          scoreGeral: parseFloat(scoreGeral.toFixed(2)),
          nivelMaturidade,
          scoresPorDimensao: Object.values(scoresPorDimensao).map((d) => ({
            nome: d.nome,
            icone: d.icone,
            score: d.score
          })),
          principaisGaps: dimensoesOrdenadas,
          recomendacaoTexto: recomendacao,
          proximasAcoes,
          respostas: respostasEmail,
          linkRelatorio,
          linkMailtoAssessment
        });
      } catch (emailErr) {
        console.error('[Diagnostico] Falha ao enviar e-mail de resultado do diagnóstico:', emailErr.message);
      }
    })();
  } catch (error) {
    console.error('Erro ao finalizar diagnóstico:', error);
    res.status(500).json({ error: 'Erro ao finalizar diagnóstico' });
  }
});

/**
 * GET /api/diagnostico/:id/relatorio
 * Retorna dados formatados para relatório de uma página
 */
router.get('/:id/relatorio', async (req, res) => {
  try {
    const { id } = req.params;
    
    const diagnostico = await prisma.diagnosticoRapido.findUnique({
      where: { id: parseInt(id) },
      include: {
        respostas: {
          include: {
            pergunta: {
              include: { dimensao: true }
            }
          }
        },
        empresa: true
      }
    });
    
    if (!diagnostico) {
      return res.status(404).json({ error: 'Diagnóstico não encontrado' });
    }
    
    if (diagnostico.status !== 'finalizado') {
      return res.status(400).json({ error: 'Diagnóstico ainda não foi finalizado' });
    }
    
    // Recalcular scores por dimensão para o relatório
    const dimensoes = await prisma.dimensaoDiagnostico.findMany({ orderBy: { ordem: 'asc' } });
    const scoresPorDimensao = dimensoes.map(dimensao => {
      const respostasDimensao = diagnostico.respostas.filter(
        r => r.pergunta.dimensaoId === dimensao.id
      );
      const somaScore = respostasDimensao.reduce((acc, r) => acc + (r.pontuacao || 0), 0);
      const mediaScore = respostasDimensao.length > 0 ? somaScore / respostasDimensao.length : 0;
      
      return {
        id: dimensao.id,
        nome: dimensao.nome,
        icone: dimensao.icone,
        score: parseFloat(mediaScore.toFixed(2)),
        totalPerguntas: respostasDimensao.length
      };
    });
    
    const gaps = diagnostico.principaisGaps ? JSON.parse(diagnostico.principaisGaps) : [];
    
    res.json({
      id: diagnostico.id,
      titulo: 'Diagnóstico Rápido de Maturidade em IA',
      dataRealizacao: diagnostico.updatedAt,
      duracaoMinutos: diagnostico.duracaoMinutos,
      
      respondente: {
        nome: diagnostico.nomeResponsavel,
        email: diagnostico.emailResponsavel,
        cargo: diagnostico.cargoResponsavel,
        empresa: diagnostico.nomeEmpresa || diagnostico.empresa?.nome,
        setor: diagnostico.setorEmpresa || diagnostico.empresa?.setor,
        porte: diagnostico.porteEmpresa || diagnostico.empresa?.porte
      },
      
      resultado: {
        scoreGeral: diagnostico.scoreGeral,
        nivelMaturidade: diagnostico.nivelMaturidade,
        scoresPorDimensao
      },
      
      analise: {
        principaisGaps: gaps,
        recomendacaoProximoPasso: diagnostico.recomendacaoProximoPasso
      },
      
      proximosPassos: {
        titulo: 'Próximos Passos Recomendados',
        acoes: gerarAcoesPersonalizadas(
          gaps, 
          diagnostico.setorEmpresa || diagnostico.empresa?.setor, 
          diagnostico.porteEmpresa || diagnostico.empresa?.porte
        ).concat([
          'Agendar reunião de aprofundamento com especialista em IA',
          'Realizar o Assessment Completo de Maturidade (108 perguntas)'
        ]).slice(0, 6)
      },
      
      contexto: {
        setor: diagnostico.setorEmpresa || diagnostico.empresa?.setor,
        porte: diagnostico.porteEmpresa || diagnostico.empresa?.porte,
        vertical: diagnostico.verticalSelecionada
      },
      
      conduzidoPor: diagnostico.conduzidoPor
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

/**
 * GET /api/diagnostico/listar
 * Lista todos os diagnósticos (com filtros opcionais)
 */
router.get('/', async (req, res) => {
  try {
    const { empresaId, status } = req.query;
    
    const where = {};
    if (empresaId) where.empresaId = parseInt(empresaId);
    if (status) where.status = status;
    
    const diagnosticos = await prisma.diagnosticoRapido.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nomeResponsavel: true,
        nomeEmpresa: true,
        setorEmpresa: true,
        status: true,
        scoreGeral: true,
        nivelMaturidade: true,
        duracaoMinutos: true,
        conduzidoPor: true,
        createdAt: true,
        updatedAt: true,
        empresa: {
          select: { id: true, nome: true }
        }
      }
    });
    
    res.json(diagnosticos);
  } catch (error) {
    console.error('Erro ao listar diagnósticos:', error);
    res.status(500).json({ error: 'Erro ao listar diagnósticos' });
  }
});

/**
 * DELETE /api/diagnostico/:id
 * Remove um diagnóstico
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.diagnosticoRapido.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ success: true, message: 'Diagnóstico removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover diagnóstico:', error);
    res.status(500).json({ error: 'Erro ao remover diagnóstico' });
  }
});

// ==========================================
// SISTEMA DE RECOMENDAÇÕES CONTEXTUALIZADAS
// ==========================================

// Recomendações específicas por setor/vertical
const RECOMENDACOES_POR_VERTICAL = {
  fintech: {
    nome: 'Fintech / Serviços Financeiros',
    regulacoes: ['BACEN', 'CVM', 'LGPD', 'Open Finance'],
    casosUso: ['Análise de crédito com ML', 'Detecção de fraudes em tempo real', 'Chatbots para atendimento', 'Personalização de ofertas'],
    riscos: ['Explicabilidade de modelos de crédito', 'Viés em decisões automatizadas', 'Auditoria regulatória'],
    investimento: { pequeno: '1-2% faturamento', medio: '2-3% faturamento', grande: '3-5% faturamento' }
  },
  saude: {
    nome: 'Saúde / Health',
    regulacoes: ['ANVISA', 'CFM', 'LGPD', 'Lei 13.709 (dados sensíveis)'],
    casosUso: ['Triagem inteligente', 'Análise de imagens médicas', 'Predição de readmissão', 'Otimização de agenda'],
    riscos: ['Responsabilidade médica em decisões de IA', 'Privacidade de dados de saúde', 'Certificação de dispositivos médicos'],
    investimento: { pequeno: '1-2% faturamento', medio: '2-4% faturamento', grande: '4-6% faturamento' }
  },
  tecnologia: {
    nome: 'Tecnologia',
    regulacoes: ['LGPD', 'Propriedade Intelectual', 'Contratos SaaS'],
    casosUso: ['Copilots de código', 'AIOps/monitoramento', 'Automação de testes', 'Otimização de infraestrutura'],
    riscos: ['Segurança de código gerado por IA', 'Dependência de vendors', 'Governança de modelos'],
    investimento: { pequeno: '2-3% faturamento', medio: '3-5% faturamento', grande: '5-8% faturamento' }
  },
  varejo: {
    nome: 'Varejo / E-commerce',
    regulacoes: ['LGPD', 'CDC', 'Regulações de e-commerce'],
    casosUso: ['Recomendação de produtos', 'Previsão de demanda', 'Precificação dinâmica', 'Chatbots de vendas'],
    riscos: ['Discriminação em preços', 'Privacidade de comportamento de compra', 'Sustentabilidade'],
    investimento: { pequeno: '1-2% faturamento', medio: '2-3% faturamento', grande: '3-5% faturamento' }
  },
  industria: {
    nome: 'Indústria / Manufatura',
    regulacoes: ['NRs de segurança', 'ISO 9001', 'ISO 14001', 'LGPD'],
    casosUso: ['Manutenção preditiva', 'Controle de qualidade visual', 'Otimização de produção', 'Digital twins'],
    riscos: ['Segurança operacional', 'Integração com OT/IT', 'Qualificação de operadores'],
    investimento: { pequeno: '1-2% faturamento', medio: '2-4% faturamento', grande: '4-6% faturamento' }
  },
  servicos: {
    nome: 'Serviços Profissionais',
    regulacoes: ['LGPD', 'Regulações profissionais (OAB, CRC, etc.)'],
    casosUso: ['Automação de documentos', 'Análise de contratos', 'Assistentes de pesquisa', 'Gestão de conhecimento'],
    riscos: ['Confidencialidade de informações', 'Responsabilidade profissional', 'Qualidade de outputs'],
    investimento: { pequeno: '1-2% faturamento', medio: '2-3% faturamento', grande: '3-4% faturamento' }
  }
};

// Recomendações por porte da empresa
const RECOMENDACOES_POR_PORTE = {
  pequeno: {
    estrutura: 'Formar squad multidisciplinar de 2-3 pessoas',
    abordagem: 'Priorizar soluções SaaS e APIs prontas',
    investimento: 'Começar com provas de conceito de baixo custo',
    timeframe: 'Quick wins em 1-3 meses'
  },
  medio: {
    estrutura: 'Criar equipe dedicada de 4-6 pessoas com cientista de dados',
    abordagem: 'Combinar soluções prontas com desenvolvimento interno seletivo',
    investimento: 'Budget para pilotos estruturados e infraestrutura básica',
    timeframe: 'Pilotos em 3-6 meses, escala em 9-12 meses'
  },
  grande: {
    estrutura: 'Estabelecer Centro de Excelência com 8-15 pessoas',
    abordagem: 'Desenvolver capabilities internas com parceiros estratégicos',
    investimento: 'Plataforma de dados e MLOps enterprise',
    timeframe: 'Roadmap de 12-24 meses com entregáveis trimestrais'
  },
  enterprise: {
    estrutura: 'CoE federado com squads em cada unidade de negócio',
    abordagem: 'AI-first mindset com plataforma corporativa',
    investimento: 'Investimento em escala com governança centralizada',
    timeframe: 'Transformação contínua com ciclos de inovação'
  }
};

// Ações específicas por dimensão + setor + porte
const ACOES_CONTEXTUALIZADAS = {
  'Estratégia e Visão': {
    fintech: ['Alinhar estratégia de IA com roadmap de Open Finance', 'Definir casos de uso prioritários em crédito e fraude'],
    saude: ['Mapear oportunidades em jornada do paciente', 'Avaliar regulações ANVISA para IA diagnóstica'],
    tecnologia: ['Integrar IA no ciclo de desenvolvimento de produto', 'Definir estratégia de AI-first para novos produtos'],
    varejo: ['Priorizar personalização e previsão de demanda', 'Alinhar IA com estratégia omnichannel'],
    industria: ['Focar em manutenção preditiva e qualidade', 'Mapear integração com sistemas OT existentes'],
    servicos: ['Automatizar processos documentais de alto volume', 'Identificar uso de IA generativa em entregas']
  },
  'Dados e Infraestrutura': {
    fintech: ['Implementar data lake com compliance BACEN', 'Garantir linhagem de dados para auditoria'],
    saude: ['Criar data mesh com segregação de dados sensíveis', 'Implementar anonimização e pseudonimização'],
    tecnologia: ['Construir feature store centralizada', 'Implementar MLOps com CI/CD para modelos'],
    varejo: ['Unificar dados de canais (loja, e-commerce, app)', 'Criar CDP para visão 360° do cliente'],
    industria: ['Integrar dados de OT/IT em plataforma unificada', 'Implementar edge computing para latência baixa'],
    servicos: ['Estruturar base de conhecimento para RAG', 'Implementar gestão de documentos com embeddings']
  },
  'Governança e Ética': {
    fintech: ['Implementar explicabilidade para modelos de crédito', 'Criar comitê de ética com participação de compliance'],
    saude: ['Estabelecer protocolo de validação clínica para IA', 'Documentar responsabilidades médico-legais'],
    tecnologia: ['Criar guardrails para uso de IA generativa', 'Implementar revisão de código gerado por IA'],
    varejo: ['Auditar vieses em recomendação e precificação', 'Garantir transparência em decisões automatizadas'],
    industria: ['Validar segurança de IA em ambientes operacionais', 'Certificar modelos críticos de segurança'],
    servicos: ['Proteger confidencialidade de informações de clientes', 'Documentar uso de IA em entregas']
  },
  'Cultura e Pessoas': {
    fintech: ['Capacitar equipe em IA responsável para finanças', 'Criar trilha de ML Engineering para desenvolvedores'],
    saude: ['Treinar profissionais de saúde em interpretação de IA', 'Formar AI Champions em cada especialidade'],
    tecnologia: ['Upskilling em prompt engineering e AI tools', 'Criar comunidade de prática de AI/ML'],
    varejo: ['Capacitar times de operação em ferramentas de IA', 'Treinar compradores em previsão assistida por IA'],
    industria: ['Qualificar operadores para trabalho com IA', 'Formar técnicos em manutenção preditiva'],
    servicos: ['Treinar profissionais em uso de IA generativa', 'Desenvolver mindset de augmented intelligence']
  },
  'Operações e Processos': {
    fintech: ['Automatizar análise de crédito com human-in-the-loop', 'Implementar detecção de fraude em tempo real'],
    saude: ['Integrar IA em fluxos de triagem e diagnóstico', 'Automatizar agendamento e otimização de recursos'],
    tecnologia: ['Implementar AIOps para monitoramento', 'Automatizar testes e code review com IA'],
    varejo: ['Automatizar reposição com previsão de demanda', 'Implementar precificação dinâmica assistida'],
    industria: ['Implementar manutenção preditiva em equipamentos críticos', 'Automatizar controle de qualidade visual'],
    servicos: ['Automatizar geração de documentos e relatórios', 'Implementar assistentes de pesquisa e análise']
  }
};

// Função para gerar recomendação contextualizada
function gerarRecomendacaoContextualizada(score, nivel, gaps, setor, porte) {
  const gapPrincipal = gaps[0];
  const setorNormalizado = normalizarSetor(setor);
  const porteNormalizado = normalizarPorte(porte);
  
  const configSetor = RECOMENDACOES_POR_VERTICAL[setorNormalizado] || RECOMENDACOES_POR_VERTICAL.servicos;
  const configPorte = RECOMENDACOES_POR_PORTE[porteNormalizado] || RECOMENDACOES_POR_PORTE.medio;
  
  // Base da recomendação
  let recomendacao = `Sua organização do setor de **${configSetor.nome}** está no estágio **${nivel}** em maturidade de IA, com score ${score.toFixed(1)}/5.0.\n\n`;
  
  // Gap principal com contexto do setor
  recomendacao += `**Principal área de atenção:** ${gapPrincipal.dimensao} (score ${gapPrincipal.score}/5). `;
  
  // Ação específica por gap + setor
  const acoesGap = ACOES_CONTEXTUALIZADAS[gapPrincipal.dimensao];
  if (acoesGap && acoesGap[setorNormalizado]) {
    recomendacao += `Para seu setor, recomendamos: ${acoesGap[setorNormalizado][0]}.\n\n`;
  }
  
  // Recomendações por nível e porte
  if (score < 2.0) {
    recomendacao += `**Próximos passos para seu porte (${porteNormalizado}):**\n`;
    recomendacao += `• ${configPorte.estrutura}\n`;
    recomendacao += `• ${configPorte.abordagem}\n`;
    recomendacao += `• Foco em ${configPorte.timeframe}\n\n`;
    recomendacao += `**Casos de uso recomendados para ${configSetor.nome}:** ${configSetor.casosUso.slice(0, 2).join(', ')}.\n\n`;
    recomendacao += `**Atenção às regulações:** ${configSetor.regulacoes.slice(0, 2).join(', ')}.`;
  } else if (score < 3.0) {
    recomendacao += `**Próximos passos para seu porte (${porteNormalizado}):**\n`;
    recomendacao += `• ${configPorte.estrutura}\n`;
    recomendacao += `• Investimento recomendado: ${configSetor.investimento[porteNormalizado] || configSetor.investimento.medio}\n`;
    recomendacao += `• ${configPorte.timeframe}\n\n`;
    recomendacao += `**Quick wins recomendados:** ${configSetor.casosUso.slice(0, 2).join(' e ')}.\n\n`;
    recomendacao += `**Riscos específicos do setor:** ${configSetor.riscos[0]}.`;
  } else if (score < 4.0) {
    recomendacao += `**Evolução para ${porteNormalizado}:**\n`;
    recomendacao += `• Escalar com ${configPorte.estrutura}\n`;
    recomendacao += `• ${configPorte.abordagem}\n\n`;
    recomendacao += `**Casos de uso avançados:** ${configSetor.casosUso.slice(2).join(', ') || configSetor.casosUso.join(', ')}.\n\n`;
    recomendacao += `**Governança:** Atenção a ${configSetor.riscos.join(', ')}.`;
  } else {
    recomendacao += `**Excelência contínua:**\n`;
    recomendacao += `• ${configPorte.estrutura}\n`;
    recomendacao += `• Foco em inovação e diferenciação competitiva\n\n`;
    recomendacao += `Sua organização pode se tornar referência em IA no setor de **${configSetor.nome}**.`;
  }
  
  return recomendacao;
}

// Função para gerar ações personalizadas
function gerarAcoesPersonalizadas(gaps, setor, porte) {
  const setorNormalizado = normalizarSetor(setor);
  const porteNormalizado = normalizarPorte(porte);
  const configPorte = RECOMENDACOES_POR_PORTE[porteNormalizado] || RECOMENDACOES_POR_PORTE.medio;
  
  const acoes = [];
  
  // Ação baseada no porte
  acoes.push(configPorte.estrutura);
  acoes.push(configPorte.investimento);
  
  // Ações baseadas nos gaps + setor
  for (const gap of gaps.slice(0, 2)) {
    const acoesGap = ACOES_CONTEXTUALIZADAS[gap.dimensao];
    if (acoesGap && acoesGap[setorNormalizado]) {
      acoes.push(...acoesGap[setorNormalizado].slice(0, 1));
    }
  }
  
  // Adicionar caso de uso específico do setor
  const configSetor = RECOMENDACOES_POR_VERTICAL[setorNormalizado];
  if (configSetor) {
    acoes.push(`Priorizar: ${configSetor.casosUso[0]}`);
  }
  
  return acoes.slice(0, 4);
}

function normalizarSetor(setor) {
  if (!setor) return 'servicos';
  const setorLower = setor.toLowerCase();
  
  if (setorLower.includes('fintech') || setorLower.includes('financ') || setorLower.includes('banco')) return 'fintech';
  if (setorLower.includes('saude') || setorLower.includes('health') || setorLower.includes('hospital')) return 'saude';
  if (setorLower.includes('tecnologia') || setorLower.includes('tech') || setorLower.includes('software')) return 'tecnologia';
  if (setorLower.includes('varejo') || setorLower.includes('retail') || setorLower.includes('ecommerce')) return 'varejo';
  if (setorLower.includes('industria') || setorLower.includes('manufatura') || setorLower.includes('fabrica')) return 'industria';
  
  return 'servicos';
}

function normalizarPorte(porte) {
  if (!porte) return 'medio';
  const porteLower = porte.toLowerCase();
  
  if (porteLower.includes('pequen') || porteLower.includes('micro') || porteLower.includes('startup')) return 'pequeno';
  if (porteLower.includes('grand') || porteLower.includes('large')) return 'grande';
  if (porteLower.includes('enterprise') || porteLower.includes('corporat') || porteLower.includes('multinacional')) return 'enterprise';
  
  return 'medio';
}

// Função legada mantida para compatibilidade
function gerarRecomendacao(score, nivel, gaps) {
  // Usa a nova função com valores default
  return gerarRecomendacaoContextualizada(score, nivel, gaps, null, null);
}

export default router;

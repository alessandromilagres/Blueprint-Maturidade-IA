import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * SEED - MÓDULO DE DIAGNÓSTICO RÁPIDO
 * 25 perguntas distribuídas em 5 dimensões de alto impacto
 * Aplicação em 30 minutos - Ferramenta de entrada para novos clientes
 */

const dimensoes = [
  {
    nome: 'Estratégia e Liderança',
    descricao: 'Avalia o comprometimento da alta liderança e a clareza estratégica para adoção de IA',
    icone: '🎯',
    ordem: 1,
    peso: 0.20,
    perguntas: [
      {
        numero: 1,
        texto: 'A alta liderança da empresa possui uma visão clara e comunicada sobre como a Inteligência Artificial pode transformar o negócio nos próximos 3-5 anos?',
        criterios: `1 - Não há visão definida; IA é vista apenas como tendência tecnológica sem aplicação concreta
2 - Existe interesse pontual, mas sem visão estratégica formalizada ou comunicada
3 - Há uma visão inicial em desenvolvimento, com discussões em andamento na liderança
4 - Visão clara existe e foi comunicada, com alguns investimentos direcionados
5 - Visão transformacional robusta, amplamente comunicada, com roadmap e budget dedicados`,
        ordem: 1
      },
      {
        numero: 2,
        texto: 'Existe um sponsor executivo (C-level) dedicado às iniciativas de IA com autoridade real para aprovar investimentos e remover barreiras organizacionais?',
        criterios: `1 - Não existe sponsor definido; iniciativas de IA são descentralizadas ou inexistentes
2 - Sponsor existe apenas nominalmente, sem autoridade ou dedicação real
3 - Sponsor designado com alguma autoridade, mas compete com outras prioridades
4 - Sponsor ativo com autoridade parcial e dedicação crescente ao tema
5 - Sponsor C-level dedicado, com autoridade plena, budget próprio e mandato claro`,
        ordem: 2
      },
      {
        numero: 3,
        texto: 'As iniciativas de IA estão formalmente integradas ao planejamento estratégico da empresa, com metas e indicadores específicos?',
        criterios: `1 - IA não faz parte do planejamento estratégico formal
2 - Menções genéricas no planejamento, sem metas ou indicadores específicos
3 - Algumas metas definidas, mas não integradas aos OKRs/KPIs principais
4 - Integração parcial com indicadores específicos em algumas áreas
5 - Integração completa ao planejamento estratégico com OKRs/KPIs cascateados`,
        ordem: 3
      },
      {
        numero: 4,
        texto: 'Qual o nível de conhecimento da liderança sobre as capacidades, limitações e implicações éticas da IA generativa e agentes autônomos?',
        criterios: `1 - Conhecimento superficial ou baseado apenas em notícias e hype
2 - Entendimento básico conceitual, sem visão de aplicação prática
3 - Conhecimento moderado com participação em eventos/treinamentos pontuais
4 - Bom entendimento técnico e de negócio, com visão crítica sobre limitações
5 - Conhecimento profundo, com capacidade de tomar decisões informadas sobre IA`,
        ordem: 4
      },
      {
        numero: 5,
        texto: 'A empresa já realizou ou possui planos concretos de investimento em projetos de IA nos próximos 12 meses?',
        criterios: `1 - Nenhum investimento realizado ou planejado
2 - Investimentos pontuais em ferramentas genéricas (ChatGPT, Copilot básico)
3 - Budget modesto definido para POCs ou pilotos específicos
4 - Investimento significativo planejado com casos de uso priorizados
5 - Budget robusto aprovado com roadmap de projetos e equipe dedicada`,
        ordem: 5
      }
    ]
  },
  {
    nome: 'Dados e Tecnologia',
    descricao: 'Avalia a maturidade da infraestrutura de dados e prontidão tecnológica para IA',
    icone: '💾',
    ordem: 2,
    peso: 0.20,
    perguntas: [
      {
        numero: 1,
        texto: 'Como você classifica a qualidade, organização e acessibilidade dos dados corporativos que seriam necessários para alimentar modelos de IA?',
        criterios: `1 - Dados fragmentados, em silos, sem governança; qualidade desconhecida
2 - Alguns dados estruturados, mas dispersos e com qualidade inconsistente
3 - Dados parcialmente organizados, com iniciativas de qualidade em andamento
4 - Boa estruturação com data lake/warehouse, governança básica implementada
5 - Dados de alta qualidade, catalogados, governados e prontos para consumo por IA`,
        ordem: 1
      },
      {
        numero: 2,
        texto: 'A empresa possui infraestrutura de cloud computing adequada para suportar cargas de trabalho de IA (treinamento, inferência, armazenamento)?',
        criterios: `1 - Infraestrutura majoritariamente on-premise, sem capacidade para IA
2 - Migração para cloud em estágio inicial, sem recursos específicos para IA
3 - Cloud híbrida com alguns recursos disponíveis, mas não otimizados para IA
4 - Infraestrutura cloud robusta com GPUs/TPUs disponíveis sob demanda
5 - Plataforma de IA em cloud madura, com MLOps, AutoML e recursos dedicados`,
        ordem: 2
      },
      {
        numero: 3,
        texto: 'Existem APIs e sistemas de integração que permitiriam conectar soluções de IA aos processos de negócio existentes?',
        criterios: `1 - Sistemas legados fechados, sem APIs; integração seria extremamente difícil
2 - Poucas APIs disponíveis, integrações manuais ou por ETL batch
3 - APIs parciais, com alguns sistemas modernos e outros legados
4 - Ecossistema de APIs bem desenvolvido para sistemas core
5 - Arquitetura API-first, com gateway, versionamento e documentação completa`,
        ordem: 3
      },
      {
        numero: 4,
        texto: 'A empresa já experimentou ou utiliza alguma forma de IA/ML (machine learning tradicional, IA generativa, automação inteligente)?',
        criterios: `1 - Nenhuma experiência com IA/ML
2 - Uso básico de ferramentas prontas (chatbots simples, assistentes genéricos)
3 - Alguns POCs de ML tradicional ou IA generativa em teste
4 - Modelos em produção para casos específicos (recomendação, previsão, etc.)
5 - Múltiplas soluções de IA em produção, incluindo modelos customizados`,
        ordem: 4
      },
      {
        numero: 5,
        texto: 'Qual o nível de documentação e rastreabilidade dos processos de negócio que poderiam ser automatizados ou aumentados por IA?',
        criterios: `1 - Processos não documentados; conhecimento tácito nas pessoas
2 - Documentação parcial e desatualizada de alguns processos críticos
3 - Processos core documentados, mas sem padronização ou métricas
4 - Boa documentação com fluxos, SLAs e métricas de performance
5 - Processos mapeados em detalhe, com dados de execução rastreáveis`,
        ordem: 5
      }
    ]
  },
  {
    nome: 'Valor de Negócio e ROI',
    descricao: 'Avalia a capacidade de identificar, medir e capturar valor de negócio com IA',
    icone: '💰',
    ordem: 3,
    peso: 0.20,
    perguntas: [
      {
        numero: 1,
        texto: 'A empresa consegue identificar claramente casos de uso de IA com potencial de geração de valor mensurável (redução de custos, aumento de receita, eficiência)?',
        criterios: `1 - Não há casos de uso identificados ou são apenas conceituais
2 - Alguns casos de uso listados, mas sem análise de viabilidade ou valor
3 - Casos de uso identificados com estimativas iniciais de valor
4 - Pipeline de casos priorizados por valor, com business cases estruturados
5 - Portfólio maduro de casos com ROI estimado, métricas definidas e priorizados`,
        ordem: 1
      },
      {
        numero: 2,
        texto: 'Existe metodologia estabelecida para calcular o retorno sobre investimento (ROI) de projetos de tecnologia e inovação?',
        criterios: `1 - ROI não é calculado ou é puramente intuitivo
2 - Cálculos básicos esporádicos, sem metodologia padronizada
3 - Metodologia existe mas é aplicada inconsistentemente
4 - Metodologia estabelecida e aplicada para projetos relevantes
5 - Framework robusto de ROI integrado ao ciclo de investimentos com tracking`,
        ordem: 2
      },
      {
        numero: 3,
        texto: 'Qual a disposição da empresa para investir em projetos de IA considerando que os resultados podem levar 6-18 meses para se materializarem?',
        criterios: `1 - Expectativa de resultados imediatos; baixa tolerância a investimentos de médio prazo
2 - Alguma tolerância, mas pressão forte por quick wins no curto prazo
3 - Entendimento do prazo, mas budget limitado para investimentos prolongados
4 - Disposição para investir com horizonte adequado se business case for sólido
5 - Mentalidade de investimento estratégico com paciência para maturação`,
        ordem: 3
      },
      {
        numero: 4,
        texto: 'A empresa já teve experiências anteriores com projetos de transformação digital? Qual foi o nível de sucesso na captura de valor?',
        criterios: `1 - Sem experiência ou experiências majoritariamente fracassadas
2 - Algumas iniciativas com resultados mistos e aprendizados não consolidados
3 - Experiências moderadas com alguns sucessos e framework básico de lições aprendidas
4 - Histórico positivo de projetos de transformação com valor capturado
5 - Track record consistente de sucesso em transformação digital com cultura estabelecida`,
        ordem: 4
      },
      {
        numero: 5,
        texto: 'Existem métricas de negócio claras que poderiam ser impactadas por IA (NPS, tempo de atendimento, taxa de conversão, produtividade, etc.)?',
        criterios: `1 - Métricas de negócio não são claramente definidas ou monitoradas
2 - Métricas básicas existem, mas sem baseline ou monitoramento consistente
3 - Métricas definidas para áreas principais com baseline estabelecido
4 - Dashboard de métricas com baseline, metas e acompanhamento regular
5 - Cultura data-driven com métricas cascateadas e decisões baseadas em dados`,
        ordem: 5
      }
    ]
  },
  {
    nome: 'Governança e Risco',
    descricao: 'Avalia a preparação para uso responsável de IA e gestão de riscos associados',
    icone: '🛡️',
    ordem: 4,
    peso: 0.20,
    perguntas: [
      {
        numero: 1,
        texto: 'A empresa possui políticas definidas para uso de IA, incluindo aspectos de privacidade, segurança de dados e uso ético?',
        criterios: `1 - Nenhuma política específica para IA
2 - Políticas genéricas de TI aplicadas, sem considerações específicas de IA
3 - Diretrizes iniciais de IA em desenvolvimento ou parcialmente implementadas
4 - Políticas de IA documentadas cobrindo principais aspectos de risco
5 - Framework completo de governança de IA com políticas, processos e auditoria`,
        ordem: 1
      },
      {
        numero: 2,
        texto: 'Existe consciência na organização sobre os riscos específicos de IA (viés algorítmico, alucinações, vazamento de dados, dependência de fornecedor)?',
        criterios: `1 - Riscos de IA não são conhecidos ou considerados
2 - Conhecimento superficial limitado a manchetes e notícias
3 - Consciência crescente com algumas discussões internas iniciadas
4 - Entendimento sólido dos riscos com mitigações planejadas
5 - Gestão de riscos de IA madura, integrada ao framework de riscos corporativo`,
        ordem: 2
      },
      {
        numero: 3,
        texto: 'A empresa opera em setor regulado (financeiro, saúde, seguros)? Se sim, há clareza sobre as implicações regulatórias do uso de IA?',
        criterios: `1 - Setor regulado sem qualquer análise de implicações de IA
2 - Consciência inicial das regulações, mas sem análise específica para IA
3 - Análise preliminar realizada, mas sem plano de conformidade
4 - Análise completa com plano de conformidade em implementação
5 - Framework regulatório para IA maduro, com compliance verificado e monitorado`,
        ordem: 3
      },
      {
        numero: 4,
        texto: 'Existem processos para garantir que dados sensíveis ou confidenciais não sejam expostos a ferramentas de IA externas (como ChatGPT público)?',
        criterios: `1 - Nenhum controle; funcionários usam ferramentas públicas livremente
2 - Orientações informais sem enforcement ou monitoramento
3 - Política definida mas sem controles técnicos implementados
4 - Controles técnicos parciais com política comunicada
5 - DLP, classificação de dados e controles técnicos robustos implementados`,
        ordem: 4
      },
      {
        numero: 5,
        texto: 'A empresa tem capacidade de explicar decisões tomadas por sistemas de IA quando questionada (explicabilidade/transparência)?',
        criterios: `1 - Não aplicável (não usa IA) ou nenhuma capacidade de explicação
2 - Capacidade limitada; IA tratada como "caixa preta"
3 - Alguma documentação de modelos, mas explicabilidade limitada
4 - Processos de explicabilidade para sistemas críticos
5 - Framework de XAI implementado com logs, auditorias e explicações geráveis`,
        ordem: 5
      }
    ]
  },
  {
    nome: 'Prontidão para Mudança',
    descricao: 'Avalia a cultura organizacional e capacidade de adaptação para adoção de IA',
    icone: '🚀',
    ordem: 5,
    peso: 0.20,
    perguntas: [
      {
        numero: 1,
        texto: 'Como você avalia a abertura dos colaboradores para adotar novas tecnologias e mudar formas de trabalho?',
        criterios: `1 - Resistência generalizada a mudanças; cultura conservadora
2 - Resistência significativa, mas com bolsões de early adopters
3 - Abertura moderada; mudanças aceitas se bem justificadas e graduais
4 - Cultura receptiva a inovação com entusiasmo em diversas áreas
5 - Cultura de inovação e experimentação; colaboradores proativos em adotar novidades`,
        ordem: 1
      },
      {
        numero: 2,
        texto: 'Existe preocupação significativa entre os funcionários sobre IA substituir seus empregos? Como a empresa está endereçando isso?',
        criterios: `1 - Preocupação alta e não endereçada; clima de medo ou negação
2 - Preocupação significativa com comunicação mínima da liderança
3 - Preocupação moderada; comunicação inicial sobre visão de IA augmentada
4 - Preocupação gerenciada com programa de reskilling e comunicação clara
5 - Narrativa positiva estabelecida com programa robusto de capacitação`,
        ordem: 2
      },
      {
        numero: 3,
        texto: 'A empresa possui ou conseguiria formar rapidamente um time com competências técnicas em IA (cientistas de dados, engenheiros de ML, prompt engineers)?',
        criterios: `1 - Nenhuma competência interna; dependência total de terceiros
2 - Competências muito básicas; dificuldade em atrair talentos
3 - Algumas competências presentes ou em contratação
4 - Time técnico competente em formação ou já estabelecido
5 - Centro de excelência em IA com competências diversas e profundas`,
        ordem: 3
      },
      {
        numero: 4,
        texto: 'Qual a velocidade típica de tomada de decisão e implementação de novas iniciativas tecnológicas na empresa?',
        criterios: `1 - Muito lenta; burocracia pesada e múltiplas aprovações
2 - Lenta; processo decisório complexo e conservador
3 - Moderada; processo estruturado mas com agilidade quando necessário
4 - Ágil para iniciativas priorizadas; processo simplificado disponível
5 - Muito ágil; cultura de experimentação rápida com autonomia para times`,
        ordem: 4
      },
      {
        numero: 5,
        texto: 'A empresa estaria disposta a iniciar uma jornada estruturada de diagnóstico e implementação de IA com apoio especializado externo?',
        criterios: `1 - Sem interesse ou momento não é adequado
2 - Interesse inicial, mas sem budget ou prioridade definida
3 - Interesse moderado; avaliando opções e momento
4 - Interesse alto; buscando ativamente parceiros e metodologia
5 - Pronta para iniciar; sponsor identificado, budget disponível, urgência percebida`,
        ordem: 5
      }
    ]
  }
];

async function seedDiagnosticoRapido() {
  console.log('\n🚀 Iniciando seed do Diagnóstico Rápido...\n');
  
  // Limpar dados existentes
  await prisma.respostaDiagnostico.deleteMany();
  await prisma.diagnosticoRapido.deleteMany();
  await prisma.perguntaDiagnostico.deleteMany();
  await prisma.dimensaoDiagnostico.deleteMany();
  
  console.log('✓ Dados anteriores removidos');
  
  // Criar dimensões e perguntas
  for (const dimensao of dimensoes) {
    const { perguntas, ...dimensaoData } = dimensao;
    
    const dimensaoCriada = await prisma.dimensaoDiagnostico.create({
      data: {
        ...dimensaoData,
        perguntas: {
          create: perguntas
        }
      }
    });
    
    console.log(`✓ Dimensão "${dimensaoCriada.nome}" criada com ${perguntas.length} perguntas`);
  }
  
  const totalDimensoes = await prisma.dimensaoDiagnostico.count();
  const totalPerguntas = await prisma.perguntaDiagnostico.count();
  
  console.log('\n✅ Seed concluído!');
  console.log(`   - ${totalDimensoes} dimensões criadas`);
  console.log(`   - ${totalPerguntas} perguntas criadas`);
  console.log('\n📋 Módulo de Diagnóstico Rápido pronto para uso!\n');
}

// Executar o seed
seedDiagnosticoRapido()
  .catch(e => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { seedDiagnosticoRapido };

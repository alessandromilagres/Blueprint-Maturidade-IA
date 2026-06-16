import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const areas = [
  {
    nome: 'Estratégia e Liderança',
    descricao: 'Avalia a visão estratégica e o engajamento da liderança com IA',
    ordem: 1,
    peso: 0.08,
    perguntas: [
      {
        numero: 1,
        texto: 'Existe uma estratégia clara de IA alinhada com objetivos de negócio?',
        criterios: '1=Sem estratégia formal | Não há documentação | Iniciativas de IA são reativas\n2=Estratégia em desenvolvimento | Documentação parcial | Alguns projetos alinhados\n3=Estratégia documentada | Alinhamento claro | Comunicada internamente\n4=Estratégia integrada | Revisão semestral | Alinhamento com OKRs\n5=Estratégia preditiva | Antecipa mercado | Inovação contínua'
      },
      {
        numero: 2,
        texto: 'O C-Level está engajado e patrocinando iniciativas de IA?',
        criterios: '1=Sem engajamento | C-Level desconhecido | Nenhum patrocínio executivo\n2=Engajamento inicial | Alguns executivos interessados | Patrocínio limitado\n3=Engajamento ativo | Patrocínio consistente | Reuniões regulares\n4=Engajamento profundo | Patrocínio ativo | Decisões rápidas\n5=Engajamento total | IA como diferencial competitivo | Investimento agressivo'
      },
      {
        numero: 3,
        texto: 'Há um orçamento dedicado e aprovado para IA?',
        criterios: '1=Sem orçamento | Recursos improvisados | Financiamento ad-hoc\n2=Orçamento piloto | Recursos limitados | Aprovação ano a ano\n3=Orçamento anual | Aprovado formalmente | Previsibilidade\n4=Orçamento plurianual | Flexível | Crescimento planejado\n5=Orçamento estratégico | Crescimento automático | Sem restrições'
      },
      {
        numero: 4,
        texto: 'Existe um Chief AI Officer ou responsável por IA?',
        criterios: '1=Sem responsável | Ninguém lidera IA | Responsabilidade diluída\n2=Responsável designado | Mas com outras prioridades | Dedicação parcial\n3=Responsável dedicado | Tempo integral | Reporta ao C-Level\n4=CAO com poder | Influência estratégica | Governança clara\n5=CAO na diretoria | Influência em todas decisões | Cultura de IA'
      },
      {
        numero: 5,
        texto: 'A organização tem um roadmap de IA de 1-3 anos?',
        criterios: '1=Sem roadmap | Sem planejamento | Decisões caso a caso\n2=Roadmap básico | Planejamento informal | Atualizado ocasionalmente\n3=Roadmap formal | Atualizado anualmente | Comunicado\n4=Roadmap detalhado | Revisão trimestral | Integrado com negócio\n5=Roadmap adaptativo | Inovação contínua | Liderança de mercado'
      },
      {
        numero: 6,
        texto: 'Há métricas de sucesso definidas para projetos de IA?',
        criterios: '1=Sem métricas | Sucesso indefinido | Sem KPIs\n2=Algumas métricas | Definidas por projeto | Sem padronização\n3=Métricas padronizadas | Definidas antes do projeto | Acompanhadas\n4=Dashboard de métricas | Revisão mensal | Ação corretiva\n5=Métricas preditivas | Ajuste em tempo real | Otimização contínua'
      }
    ]
  },
  {
    nome: 'Dados e Tecnologia',
    descricao: 'Avalia a infraestrutura de dados e tecnologia para IA',
    ordem: 2,
    peso: 0.07,
    perguntas: [
      {
        numero: 1,
        texto: 'Existe um catálogo centralizado de dados?',
        criterios: '1=Sem catálogo | Dados espalhados | Sem documentação\n2=Catálogo piloto | Alguns dados documentados | Cobertura parcial\n3=Catálogo funcional | Maioria dos dados | Atualizado regularmente\n4=Catálogo completo | Metadados ricos | Descoberta automática\n5=Catálogo inteligente | IA descobre dados | Recomendações automáticas'
      },
      {
        numero: 2,
        texto: 'Qual é a qualidade geral dos dados (completude, acurácia)?',
        criterios: '1=Qualidade baixa | Muitos erros | Dados incompletos\n2=Qualidade variável | Limpeza manual | Melhorias em andamento\n3=Qualidade boa | Processos de limpeza | Validação automática\n4=Qualidade excelente | Governança de dados | Monitoramento contínuo\n5=Qualidade perfeita | Autocorreção | Previsão de problemas'
      },
      {
        numero: 3,
        texto: 'Há ferramentas de MLOps implementadas (versionamento, CI/CD)?',
        criterios: '1=Sem ferramentas | Processos manuais | Sem versionamento\n2=Ferramentas básicas | Versionamento manual | Testes limitados\n3=Ferramentas modernas | Versionamento automático | Testes padronizados\n4=MLOps avançado | Automação total | Testes abrangentes\n5=MLOps autônomo | AutoML integrado | Otimização automática'
      },
      {
        numero: 4,
        texto: 'A arquitetura suporta escalabilidade de modelos de IA?',
        criterios: '1=Arquitetura limitada | Sem escalabilidade | Silos de dados\n2=Arquitetura em evolução | Escalabilidade limitada | Alguns silos\n3=Arquitetura escalável | Integração de dados | Sem silos\n4=Arquitetura cloud-native | Escalabilidade automática | Integração perfeita\n5=Arquitetura adaptativa | Escalabilidade infinita | Otimização em tempo real'
      },
      {
        numero: 5,
        texto: 'Existem APIs padronizadas para acesso a dados?',
        criterios: '1=Sem APIs | Acesso ad-hoc | Integração manual\n2=APIs em desenvolvimento | Padrões emergentes | Integração parcial\n3=APIs padronizadas | Documentadas | Uso generalizado\n4=APIs RESTful/GraphQL | Versionadas | Segurança integrada\n5=APIs inteligentes | Adaptação automática | Segurança preditiva'
      },
      {
        numero: 6,
        texto: 'Há infraestrutura de computação (GPU/TPU) disponível?',
        criterios: '1=Sem infraestrutura | Apenas CPU | Sem capacidade\n2=GPU compartilhada | Capacidade limitada | Planejamento em andamento\n3=GPU dedicada | Capacidade adequada | Planejamento de crescimento\n4=GPU/TPU dedicada | Escalabilidade automática | Otimização contínua\n5=Infraestrutura ilimitada | Otimização automática | Custo otimizado'
      }
    ]
  },
  {
    nome: 'Governança e Risco',
    descricao: 'Avalia políticas, conformidade e gestão de riscos em IA',
    ordem: 3,
    peso: 0.07,
    perguntas: [
      {
        numero: 1,
        texto: 'Existe um framework de governança de IA definido?',
        criterios: '1=Sem framework | Sem políticas | Sem controles\n2=Framework em desenvolvimento | Políticas básicas | Alguns controles\n3=Framework documentado | Políticas claras | Controles implementados\n4=Framework avançado | Políticas integradas | Conformidade automática\n5=Framework preditivo | Conformidade automática | Inovação segura'
      },
      {
        numero: 2,
        texto: 'Há conformidade com LGPD/GDPR nos projetos de IA?',
        criterios: '1=Sem conformidade | Não há avaliação | Risco alto\n2=Conformidade parcial | Avaliações ocasionais | Melhorias em andamento\n3=Conformidade básica | Avaliações regulares | Documentação adequada\n4=Conformidade avançada | Monitoramento contínuo | Auditoria regular\n5=Conformidade exemplar | Certificações | Referência no setor'
      },
      {
        numero: 3,
        texto: 'Existe um comitê de ética em IA?',
        criterios: '1=Sem comitê | Sem discussões éticas | Decisões ad-hoc\n2=Discussões informais | Sem estrutura | Reativo\n3=Comitê formal | Reuniões regulares | Diretrizes documentadas\n4=Comitê ativo | Influencia decisões | Revisão de projetos\n5=Comitê estratégico | Cultura ética | Referência externa'
      },
      {
        numero: 4,
        texto: 'Há processos para identificar e mitigar vieses em modelos?',
        criterios: '1=Sem processos | Vieses não avaliados | Risco desconhecido\n2=Avaliação pontual | Alguns modelos | Sem padronização\n3=Processos definidos | Avaliação regular | Documentação\n4=Monitoramento contínuo | Métricas de fairness | Correção automática\n5=Prevenção proativa | IA justa por design | Auditoria externa'
      },
      {
        numero: 5,
        texto: 'Existe gestão de riscos específica para projetos de IA?',
        criterios: '1=Sem gestão | Riscos desconhecidos | Reativo\n2=Gestão básica | Alguns riscos mapeados | Tratamento ad-hoc\n3=Gestão estruturada | Matriz de riscos | Planos de mitigação\n4=Gestão proativa | Monitoramento contínuo | Revisão regular\n5=Gestão preditiva | Antecipação de riscos | Resiliência'
      },
      {
        numero: 6,
        texto: 'Há auditoria regular dos modelos de IA em produção?',
        criterios: '1=Sem auditoria | Modelos não monitorados | Drift desconhecido\n2=Auditoria ocasional | Alguns modelos | Sem padronização\n3=Auditoria regular | Maioria dos modelos | Relatórios\n4=Auditoria contínua | Todos os modelos | Ação corretiva\n5=Auditoria automatizada | Autocorreção | Melhoria contínua'
      }
    ]
  },
  {
    nome: 'Pessoas e Cultura',
    descricao: 'Avalia talentos, capacitação e cultura organizacional para IA',
    ordem: 4,
    peso: 0.06,
    perguntas: [
      {
        numero: 1,
        texto: 'Há talentos de IA na equipe (cientistas de dados, engenheiros de ML)?',
        criterios: '1=Sem talentos | Dependência externa | Sem capacidade\n2=Poucos talentos | Equipe pequena | Capacidade limitada\n3=Equipe dedicada | Cobertura adequada | Crescimento planejado\n4=Centro de excelência | Especialistas diversos | Atração de talentos\n5=Time de classe mundial | Referência no mercado | Retenção excelente'
      },
      {
        numero: 2,
        texto: 'Existe programa de capacitação em IA para funcionários?',
        criterios: '1=Sem programa | Aprendizado individual | Sem investimento\n2=Treinamentos pontuais | Alguns funcionários | Sem estratégia\n3=Programa estruturado | Trilhas de aprendizado | Orçamento definido\n4=Academia interna | Certificações | Parcerias educacionais\n5=Cultura de aprendizado | IA para todos | Inovação contínua'
      },
      {
        numero: 3,
        texto: 'A cultura organizacional é favorável à experimentação?',
        criterios: '1=Cultura avessa ao risco | Erros são punidos | Sem experimentação\n2=Alguma tolerância | Experimentos isolados | Dependente de líderes\n3=Cultura de testes | Falhas são aceitas | Aprendizado valorizado\n4=Cultura experimental | Incentivos para inovar | Recursos para experimentos\n5=Cultura de inovação | Falhar rápido | Experimentação contínua'
      },
      {
        numero: 4,
        texto: 'Há plano de carreira definido para profissionais de IA?',
        criterios: '1=Sem plano | Carreira indefinida | Alta rotatividade\n2=Plano básico | Níveis genéricos | Progressão limitada\n3=Plano estruturado | Trilhas claras | Progressão definida\n4=Plano competitivo | Múltiplas trilhas | Reconhecimento\n5=Plano de referência | Atrai talentos | Retenção excepcional'
      },
      {
        numero: 5,
        texto: 'Existe colaboração entre áreas técnicas e de negócio?',
        criterios: '1=Silos | Comunicação ruim | Conflitos frequentes\n2=Colaboração pontual | Dependente de indivíduos | Melhorias em andamento\n3=Colaboração regular | Processos definidos | Objetivos alinhados\n4=Colaboração profunda | Squads multidisciplinares | Decisões conjuntas\n5=Colaboração fluida | Uma única equipe | Inovação integrada'
      },
      {
        numero: 6,
        texto: 'A empresa consegue atrair e reter talentos de IA?',
        criterios: '1=Dificuldade alta | Alta rotatividade | Marca empregadora fraca\n2=Dificuldade moderada | Rotatividade preocupante | Melhorias em andamento\n3=Atração razoável | Rotatividade aceitável | EVP definido\n4=Atração boa | Baixa rotatividade | Marca empregadora forte\n5=Atração excelente | Referência no mercado | Talentos disputados'
      }
    ]
  },
  {
    nome: 'Operações e Processos',
    descricao: 'Avalia a integração de IA nos processos operacionais',
    ordem: 5,
    peso: 0.06,
    perguntas: [
      {
        numero: 1,
        texto: 'Existem modelos de IA em produção gerando valor?',
        criterios: '1=Nenhum modelo | Apenas PoCs | Sem valor gerado\n2=Poucos modelos | Valor limitado | Produção recente\n3=Vários modelos | Valor consistente | Expansão planejada\n4=Muitos modelos | Valor significativo | Escala\n5=IA pervasiva | Valor transformacional | Core do negócio'
      },
      {
        numero: 2,
        texto: 'Há automação de processos com IA?',
        criterios: '1=Sem automação | Processos manuais | Sem visão de automação\n2=Automação piloto | Alguns processos | Experimentos\n3=Automação estruturada | Processos-chave | Roadmap definido\n4=Automação avançada | Maioria dos processos | Otimização contínua\n5=Hiperautomação | IA autônoma | Processos adaptativos'
      },
      {
        numero: 3,
        texto: 'Existe SLA definido para modelos de IA?',
        criterios: '1=Sem SLA | Performance desconhecida | Sem monitoramento\n2=SLA informal | Alguns modelos | Monitoramento básico\n3=SLA formal | Maioria dos modelos | Monitoramento regular\n4=SLA rigoroso | Todos os modelos | Monitoramento contínuo\n5=SLA adaptativo | Auto-healing | Performance otimizada'
      },
      {
        numero: 4,
        texto: 'Há integração de IA com sistemas legados?',
        criterios: '1=Sem integração | IA isolada | Silos de dados\n2=Integração pontual | Alguns sistemas | Esforço manual\n3=Integração planejada | Roadmap definido | APIs em desenvolvimento\n4=Integração avançada | Maioria dos sistemas | APIs padronizadas\n5=Integração perfeita | Arquitetura moderna | Fluxo contínuo'
      },
      {
        numero: 5,
        texto: 'Existe processo de deploy contínuo para modelos de IA?',
        criterios: '1=Deploy manual | Processo longo | Alto risco\n2=Deploy semi-automatizado | Alguns modelos | Processo em evolução\n3=CI/CD básico | Maioria dos modelos | Testes automatizados\n4=CI/CD avançado | Todos os modelos | Blue-green deploy\n5=MLOps maduro | Deploy contínuo | Rollback automático'
      },
      {
        numero: 6,
        texto: 'Há monitoramento de performance dos modelos em produção?',
        criterios: '1=Sem monitoramento | Drift desconhecido | Reativo\n2=Monitoramento básico | Alertas manuais | Alguns modelos\n3=Monitoramento regular | Dashboards | Maioria dos modelos\n4=Monitoramento contínuo | Alertas automáticos | Todos os modelos\n5=Monitoramento inteligente | Detecção de anomalias | Auto-correção'
      }
    ]
  },
  {
    nome: 'Inovação e Experimentação',
    descricao: 'Avalia a capacidade de inovação e experimentação em IA',
    ordem: 6,
    peso: 0.06,
    perguntas: [
      {
        numero: 1,
        texto: 'Existe um laboratório ou sandbox para experimentação de IA?',
        criterios: '1=Sem ambiente | Experimentos ad-hoc | Sem recursos dedicados\n2=Ambiente básico | Recursos limitados | Uso esporádico\n3=Sandbox estruturado | Recursos adequados | Uso regular\n4=Lab de inovação | Recursos abundantes | Equipe dedicada\n5=Centro de inovação | Estado da arte | Referência externa'
      },
      {
        numero: 2,
        texto: 'Há um processo para testar novas ideias de IA rapidamente?',
        criterios: '1=Sem processo | Ideias morrem | Burocracia alta\n2=Processo informal | Alguns testes | Dependente de indivíduos\n3=Processo definido | Ferramentas para MVPs | Validação em semanas\n4=Fábrica de MVPs | Equipes dedicadas | Dezenas de ideias por ano\n5=Prototipagem autônoma | Criação em dias | Altíssima velocidade'
      },
      {
        numero: 3,
        texto: 'A empresa acompanha e adota novas tecnologias de IA?',
        criterios: '1=Não acompanha | Tecnologias consolidadas | Sem visibilidade\n2=Acompanhamento passivo | Exploração reativa | Interesse individual\n3=Radar tecnológico | Monitorar e selecionar | Experimentação estruturada\n4=Testes proativos | Avalia impacto | Adoção estruturada\n5=Early adopter | Liderança em adoção | Referência no setor'
      },
      {
        numero: 4,
        texto: 'Existe colaboração com universidades, startups ou institutos?',
        criterios: '1=Sem colaboração | Operação isolada | Nenhuma parceria\n2=Colaboração pontual | Contatos informais | Sem estratégia\n3=Parcerias formais | Projetos específicos | Estratégia de parceria\n4=Portfólio de parcerias | Estratégico e diversificado | Alimenta pipeline\n5=Ecossistema de inovação | Centro de ecossistema | Atrai melhores talentos'
      },
      {
        numero: 5,
        texto: 'Há processo para escalar experimentos bem-sucedidos?',
        criterios: '1=PoC do Limbo | Experimentos morrem | Sem caminho para produção\n2=Escala por esforço | Processo manual | Extra effort\n3=Processo de graduação | Investimento | Industrialização planejada\n4=Fast track | Caminho rápido | Recursos garantidos\n5=Escala automatizada | Transição fluida | Protótipo para produto'
      },
      {
        numero: 6,
        texto: 'A empresa contribui para a comunidade de IA?',
        criterios: '1=Apenas consumidora | Sem contribuições | Sem engajamento\n2=Contribuições pontuais | Funcionários isolados | Sem incentivo\n3=Política de contribuição | Incentiva funcionários | Reconhecimento\n4=Projetos open source | Lidera e mantém | Relevante\n5=Referência na comunidade | Publicações científicas | Atração global'
      }
    ]
  },
  {
    nome: 'Valor de Negócio e ROI',
    descricao: 'Avalia o retorno sobre investimento e valor gerado pela IA',
    ordem: 7,
    peso: 0.07,
    perguntas: [
      {
        numero: 1,
        texto: 'Existe um modelo de medição de ROI para projetos de IA?',
        criterios: '1=Sem medição | Percepções subjetivas | Sem cálculos\n2=Cálculos ad-hoc | Inconsistente | Apenas alguns projetos\n3=Modelo padronizado | Aplicado à maioria | Metodologia consistente\n4=ROI acompanhado | Durante ciclo de vida | Metas garantidas\n5=ROI preditivo | Modelos preditivos | Alta acurácia'
      },
      {
        numero: 2,
        texto: 'Qual é o retorno médio sobre investimento dos projetos de IA?',
        criterios: '1=ROI desconhecido | Mais custos que benefícios | Sem percepção\n2=ROI positivo baixo | Leva tempo | Alguns projetos retornam\n3=ROI consistente | Dentro do esperado | Maioria bem-sucedida\n4=ROI acima da média | Significativamente maior | Outros investimentos\n5=ROI exponencial | Novas receitas | Significativo'
      },
      {
        numero: 3,
        texto: 'Há metodologia para quantificar impacto em receita/custos?',
        criterios: '1=Sem quantificação | Impacto anedótico | Sem métricas\n2=Quantificação manual | Isolada | Não divulgados\n3=Metodologia clara | Maioria | KPIs definidos\n4=Dashboards de valor | Tempo real | Atribuição clara\n5=Atribuição automatizada | Contribuição de IA | Resultados financeiros'
      },
      {
        numero: 4,
        texto: 'Projetos de IA estão alinhados com prioridades financeiras?',
        criterios: '1=Desalinhamento | Baixo impacto | Não é prioridade\n2=Alinhamento ocasional | Por acaso | Não deliberado\n3=Alinhamento estratégico | Deliberado | Metas anuais\n4=IA como alavanca | Principais alavancas | Metas longo prazo\n5=IA define estratégia | Influencia definição | Novas possibilidades'
      },
      {
        numero: 5,
        texto: 'Existe priorização de projetos baseada em valor?',
        criterios: '1=Priorização por intuição | Influência política | Sem análise\n2=Priorização informal | Discussão sobre valor | Sem critérios\n3=Processo formal | Business case | Critérios definidos\n4=Gestão de portfólio | Balanceia curto/longo | Alto/baixo risco\n5=Alocação dinâmica | Maior potencial | Ágil e baseado em dados'
      },
      {
        numero: 6,
        texto: 'Como a empresa comunica valor da IA para stakeholders?',
        criterios: '1=Sem comunicação | Sem visibilidade | Liderança desconhecida\n2=Comunicação reativa | Quando solicitado | Sem narrativa\n3=Relatórios periódicos | Trimestrais | Demonstra valor\n4=Comunicação proativa | Contínua | Múltiplos canais\n5=IA na pauta do board | Recorrente e central | Comunicação investidores'
      },
      {
        numero: 7,
        texto: 'Qual a expectativa de crescimento de receita com iniciativas de IA nos próximos 12 meses?',
        criterios: '1=Sem expectativa definida | Não há projeção | IA não impacta receita\n2=Crescimento de 0-5% | Impacto marginal | Algumas iniciativas\n3=Crescimento de 5-10% | Impacto moderado | Múltiplas iniciativas\n4=Crescimento de 10-20% | Impacto significativo | IA como alavanca\n5=Crescimento acima de 20% | IA é diferencial | Novas linhas de receita'
      },
      {
        numero: 8,
        texto: 'Qual a expectativa de redução de custos operacionais com IA nos próximos 12 meses?',
        criterios: '1=Sem expectativa definida | Não há projeção | Custos não impactados\n2=Redução de 0-5% | Impacto marginal | Automação inicial\n3=Redução de 5-15% | Impacto moderado | Automação em escala\n4=Redução de 15-25% | Impacto significativo | Processos otimizados\n5=Redução acima de 25% | Transformação operacional | Hiperautomação'
      }
    ]
  },
  {
    nome: 'Ecossistema e Parcerias',
    descricao: 'Avalia integrações, parcerias e uso de serviços externos',
    ordem: 8,
    peso: 0.06,
    perguntas: [
      {
        numero: 1,
        texto: 'A empresa utiliza plataformas cloud (AWS, Azure, GCP) para IA?',
        criterios: '1=Sem nuvem | On-premise | Pouca escalabilidade\n2=Uso de IaaS | VMs | Gestão manual\n3=Uso de PaaS | Serviços gerenciados | Acelera desenvolvimento\n4=Multi-cloud | Melhores serviços | Governança centralizada\n5=Parceria estratégica | Acesso a beta | Co-desenvolvimento'
      },
      {
        numero: 2,
        texto: 'Há integração com ferramentas e serviços de terceiros?',
        criterios: '1=Sem integração | Desenvolve tudo | Reinventa a roda\n2=Integração ad-hoc | Sem segurança | Sem governança\n3=Catálogo de serviços | Homologados | Fácil consumo\n4=Gateway centralizado | Gerencia consumo | Segurança e custos\n5=Marketplace interno | Descoberta autônoma | Consumo independente'
      },
      {
        numero: 3,
        texto: 'Existe estratégia de make vs. buy para soluções de IA?',
        criterios: '1=Viés de construir | Sempre desenvolver | Sem análise\n2=Decisão informal | Discussão | Sem análise financeira\n3=Framework formal | Critérios definidos | Guia decisão\n4=Análise de TCO | Time-to-market | Baseada em dados\n5=Decisão dinâmica | Portfólio otimizado | Alocação de recursos'
      },
      {
        numero: 4,
        texto: 'Há parcerias com consultorias, vendors ou startups de IA?',
        criterios: '1=Sem parcerias | Resolve internamente | Sem especialistas\n2=Relação de fornecedor | Projetos pontuais | Transacional\n3=Parcerias estruturadas | Projetos específicos | Transferência conhecimento\n4=Parcerias estratégicas | Longo prazo | Extensão da equipe\n5=Co-criação | Propriedade intelectual | Compartilha riscos'
      },
      {
        numero: 5,
        texto: 'A empresa consegue integrar rapidamente novas soluções de IA?',
        criterios: '1=Integração lenta | Meses | Burocracia\n2=Integração com esforço | Significativo | Semanas\n3=Processo definido | Tempo previsível | Semanas\n4=Sandbox e APIs | Integração segura | Dias\n5=Plug-and-play | Modular e padrão | Dias'
      },
      {
        numero: 6,
        texto: 'Existe processo de avaliação e seleção de parceiros?',
        criterios: '1=Seleção por custo | Sem avaliação técnica | Sem processo\n2=Seleção por indicação | Relacionamentos | Sem formalidade\n3=Processo RFI/RFP | Avaliação estruturada | Critérios claros\n4=Avaliação 360° | PoCs e visitas | Checagem referências\n5=Seleção proativa | Mapeamento mercado | Alinhamento estratégico'
      }
    ]
  },
  {
    nome: 'Valor por Unidade de Negócio',
    descricao: 'Mapeia onde IA gera valor em cada área/unidade da organização (baseado em McKinsey Value Creation e BCG AI Value Chain)',
    ordem: 9,
    peso: 0.05,
    perguntas: [
      {
        numero: 1,
        texto: 'Existe mapeamento de casos de uso de IA por unidade de negócio (Serviços, Produtos, Operações, etc.)?',
        criterios: '1=Sem mapeamento | IA centralizada sem visão de negócio | Desconhecimento das áreas\n2=Mapeamento informal | Algumas áreas identificadas | Sem priorização\n3=Mapeamento estruturado | Principais unidades mapeadas | Casos de uso documentados\n4=Mapa de valor completo | Todas unidades | Priorização por impacto\n5=Portfólio dinâmico | Atualização contínua | Valor quantificado por unidade'
      },
      {
        numero: 2,
        texto: 'Cada unidade de negócio tem métricas específicas de valor gerado por IA?',
        criterios: '1=Sem métricas por unidade | Medição centralizada genérica | Áreas não acompanham\n2=Métricas informais | Algumas unidades medem | Inconsistência\n3=KPIs definidos por unidade | Maioria das áreas | Acompanhamento regular\n4=Dashboard por unidade | Todas as áreas | Metas específicas\n5=Atribuição automatizada | Valor em tempo real | Otimização por unidade'
      },
      {
        numero: 3,
        texto: 'Há priorização de investimentos em IA baseada no potencial de valor por unidade?',
        criterios: '1=Investimento centralizado | Sem análise por unidade | Decisão política\n2=Análise ad-hoc | Algumas unidades priorizadas | Sem critérios claros\n3=Framework de priorização | Potencial mapeado | Critérios definidos\n4=Alocação otimizada | Balanceia unidades | ROI por área\n5=Alocação dinâmica | Rebalanceamento contínuo | Maximiza valor total'
      },
      {
        numero: 4,
        texto: 'As unidades de negócio têm autonomia para propor e desenvolver iniciativas de IA?',
        criterios: '1=Centralização total | Unidades dependentes | Sem autonomia\n2=Autonomia limitada | Aprovação central obrigatória | Processo lento\n3=Autonomia parcial | Orçamento próprio para pilotos | Governança central\n4=Autonomia significativa | Unidades lideram iniciativas | Suporte central\n5=Federação madura | Unidades inovam livremente | Centro de excelência apoia'
      },
      {
        numero: 5,
        texto: 'Existe compartilhamento de soluções de IA entre unidades de negócio?',
        criterios: '1=Silos | Cada unidade desenvolve próprio | Duplicação de esforços\n2=Compartilhamento ocasional | Iniciativa individual | Sem processo\n3=Catálogo de soluções | Reutilização incentivada | Documentação\n4=Plataforma compartilhada | Componentes reutilizáveis | Economia de escala\n5=Marketplace interno | Soluções como produto | Cross-selling interno'
      },
      {
        numero: 6,
        texto: 'Qual unidade de negócio está mais avançada em adoção de IA e serve de referência?',
        criterios: '1=Nenhuma referência | Todas iniciantes | Sem benchmark interno\n2=Uma área piloto | Experimentos isolados | Pouca disseminação\n3=Área líder identificada | Cases de sucesso | Compartilha aprendizados\n4=Múltiplas referências | Várias áreas maduras | Best practices documentadas\n5=Excelência disseminada | Todas unidades avançadas | Melhoria contínua'
      }
    ]
  },
  {
    nome: 'Talentos e Capacidades',
    descricao: 'Análise detalhada de gaps de habilidades e plano de desenvolvimento (baseado em SFIA e Gartner D&A Roles Framework)',
    ordem: 10,
    peso: 0.05,
    perguntas: [
      {
        numero: 1,
        texto: 'Existe mapeamento quantitativo de profissionais de IA (Data Scientists, ML Engineers, Data Engineers)?',
        criterios: '1=Sem mapeamento | Desconhece quantidade | Papéis indefinidos\n2=Estimativa informal | Números aproximados | Sem categorização\n3=Inventário de skills | Quantidade por papel | Atualizado anualmente\n4=Matriz de competências | Skills detalhadas | Níveis de proficiência\n5=Skills intelligence | Tempo real | Predição de necessidades'
      },
      {
        numero: 2,
        texto: 'Há análise de gap entre capacidades atuais e necessidades futuras de IA?',
        criterios: '1=Sem análise de gap | Necessidades desconhecidas | Reativo\n2=Gap percebido | Sem quantificação | Baseado em intuição\n3=Gap analysis formal | Quantificado por papel | Roadmap definido\n4=Gap dinâmico | Atualizado com estratégia | Cenários futuros\n5=Workforce planning | Predição de gaps | Ação preventiva'
      },
      {
        numero: 3,
        texto: 'Existe estratégia clara de Build vs. Buy vs. Borrow para talentos de IA?',
        criterios: '1=Sem estratégia | Contratação reativa | Sem planejamento\n2=Estratégia informal | Preferência não documentada | Caso a caso\n3=Estratégia definida | Critérios para cada abordagem | Orçamento separado\n4=Mix otimizado | Balanceia custos e velocidade | Parcerias de talento\n5=Estratégia adaptativa | Ajusta conforme mercado | Múltiplos canais'
      },
      {
        numero: 4,
        texto: 'Há programa estruturado de upskilling/reskilling em IA para colaboradores existentes?',
        criterios: '1=Sem programa | Aprendizado individual | Sem investimento\n2=Treinamentos pontuais | Sem trilha | Participação voluntária\n3=Academia de IA | Trilhas por papel | Certificações\n4=Programa personalizado | Assessment individual | Mentoria\n5=Learning organization | IA para todos | Cultura de aprendizado'
      },
      {
        numero: 5,
        texto: 'Qual o nível de senioridade da equipe de IA (júnior, pleno, sênior, especialista)?',
        criterios: '1=Majoritariamente júnior | Sem seniors | Alta dependência externa\n2=Desbalanceado | Poucos seniors | Sobrecarga de liderança\n3=Balanceado | Mix saudável | Seniors orientam\n4=Experiente | Maioria pleno/sênior | Especialistas presentes\n5=Elite | Especialistas reconhecidos | Atrai talentos top'
      },
      {
        numero: 6,
        texto: 'Existem papéis especializados além de Data Scientist (MLOps, AI Ethics, AI Product Manager)?',
        criterios: '1=Apenas generalistas | Sem especialização | Acúmulo de funções\n2=Alguns especialistas | ML Engineer ou Data Engineer | Gaps em outras áreas\n3=Papéis principais | MLOps, Data Engineer, Analyst | Estrutura básica\n4=Especialização ampla | Ethics, Product, Platform | Estrutura madura\n5=Papéis de fronteira | AI Researcher, AI Architect | Centro de excelência'
      },
      {
        numero: 7,
        texto: 'Há métricas de produtividade e efetividade da equipe de IA?',
        criterios: '1=Sem métricas | Produtividade desconhecida | Sem acompanhamento\n2=Métricas básicas | Projetos entregues | Sem benchmark\n3=Métricas estruturadas | Velocity, lead time | Metas definidas\n4=Métricas avançadas | Valor por colaborador | Benchmark externo\n5=Métricas preditivas | Capacidade futura | Otimização contínua'
      },
      {
        numero: 8,
        texto: 'Qual a taxa de turnover da equipe de IA e como se compara ao mercado?',
        criterios: '1=Turnover crítico | >30% ao ano | Perda de conhecimento\n2=Turnover alto | 20-30% | Dificuldade de retenção\n3=Turnover moderado | 10-20% | Alinhado ao mercado\n4=Turnover baixo | 5-10% | Retenção efetiva\n5=Turnover mínimo | <5% | Employer of choice'
      }
    ]
  },
  {
    nome: 'Conformidade Regulatória',
    descricao: 'Avalia alinhamento com regulações de IA, dados e setoriais (baseado em NIST AI RMF, EU AI Act, regulações setoriais)',
    ordem: 11,
    peso: 0.05,
    perguntas: [
      {
        numero: 1,
        texto: 'Existe mapeamento completo de regulações aplicáveis à IA na organização?',
        criterios: '1=Sem mapeamento | Regulações desconhecidas | Risco de não-conformidade\n2=Mapeamento parcial | Apenas LGPD | Regulações setoriais ignoradas\n3=Mapeamento abrangente | LGPD, setoriais, internacionais | Documentado\n4=Radar regulatório | Monitora mudanças | Atualização proativa\n5=Intelligence regulatório | Antecipa tendências | Influencia reguladores'
      },
      {
        numero: 2,
        texto: 'Há conformidade documentada com LGPD/GDPR em todos os projetos de IA?',
        criterios: '1=Sem conformidade | Dados usados sem análise | Alto risco\n2=Conformidade parcial | Alguns projetos avaliados | Sem processo padrão\n3=DPIA obrigatório | Privacy by design | Documentação completa\n4=Conformidade automatizada | Checks em pipeline | DPO envolvido\n5=Excelência em privacidade | Certificações | Referência no setor'
      },
      {
        numero: 3,
        texto: 'As regulações setoriais específicas são consideradas nos projetos de IA?',
        criterios: '1=Ignoradas | Desconhecimento | Projetos em risco\n2=Consideradas ad-hoc | Quando lembrado | Sem processo\n3=Checklist setorial | BACEN/CVM/ANVISA conforme setor | Validação jurídica\n4=Especialistas setoriais | Compliance integrado | Aprovação obrigatória\n5=Liderança regulatória | Sandbox regulatório | Influencia normas'
      },
      {
        numero: 4,
        texto: 'Existe preparação para regulações emergentes de IA (EU AI Act, regulações de algoritmos)?',
        criterios: '1=Sem preparação | Desconhece regulações futuras | Reativo\n2=Monitoramento passivo | Acompanha notícias | Sem ação\n3=Análise de impacto | Gap assessment | Plano de adequação\n4=Preparação ativa | Implementa antecipadamente | Testes de conformidade\n5=Pioneiro | Já conforme | Referência para outros'
      },
      {
        numero: 5,
        texto: 'Há documentação de explicabilidade e transparência dos modelos de IA?',
        criterios: '1=Sem documentação | Modelos caixa-preta | Sem explicabilidade\n2=Documentação mínima | Alguns modelos | Técnica apenas\n3=Model cards | Maioria dos modelos | Explicabilidade básica\n4=Explicabilidade completa | Todos modelos | Múltiplos stakeholders\n5=Transparência exemplar | Auditorias externas | Publicação de metodologias'
      },
      {
        numero: 6,
        texto: 'Existem processos de auditoria de conformidade regulatória em IA?',
        criterios: '1=Sem auditoria | Conformidade presumida | Alto risco\n2=Auditoria reativa | Quando exigido | Sem periodicidade\n3=Auditoria planejada | Anual | Escopo definido\n4=Auditoria contínua | Automatizada | Cobertura total\n5=Auditoria independente | Terceiros especializados | Certificações'
      },
      {
        numero: 7,
        texto: 'Há gestão de riscos regulatórios com planos de mitigação documentados?',
        criterios: '1=Sem gestão | Riscos desconhecidos | Exposição total\n2=Riscos identificados | Sem mitigação formal | Aceitos implicitamente\n3=Matriz de riscos | Mitigações definidas | Responsáveis\n4=Gestão ativa | Monitoramento contínuo | Planos testados\n5=Gestão preditiva | Antecipa riscos | Resiliência regulatória'
      },
      {
        numero: 8,
        texto: 'A área jurídica/compliance está capacitada e envolvida em projetos de IA?',
        criterios: '1=Não envolvida | Jurídico desconhece IA | Risco legal alto\n2=Envolvimento tardio | Chamado no final | Retrabalho frequente\n3=Envolvimento estruturado | Desde o início | Capacitação básica\n4=Parceria ativa | Jurídico especializado em IA | Co-criação\n5=Legal como enabler | Advogados tech | Acelera inovação responsável'
      }
    ]
  },
  {
    nome: 'Prontidão para Mudança',
    descricao: 'Avalia a capacidade organizacional de absorver e sustentar mudanças relacionadas à adoção de IA (baseado em ADKAR/Prosci e Kotter)',
    ordem: 12,
    peso: 0.05,
    perguntas: [
      {
        numero: 1,
        texto: 'Existe consciência organizacional sobre a necessidade de mudança para adoção de IA?',
        criterios: '1=Sem consciência | Colaboradores desconhecem iniciativas | Comunicação inexistente\n2=Consciência limitada | Apenas liderança sabe | Comunicação esporádica\n3=Consciência parcial | Áreas-chave informadas | Comunicação planejada\n4=Consciência ampla | Maioria compreende o "porquê" | Comunicação frequente\n5=Consciência total | Todos entendem urgência e benefícios | Narrativa inspiradora'
      },
      {
        numero: 2,
        texto: 'Há desejo e motivação dos colaboradores para participar da transformação com IA?',
        criterios: '1=Resistência alta | Medo de substituição | Boicote às iniciativas\n2=Resistência moderada | Ceticismo predominante | Participação forçada\n3=Aceitação passiva | Cumpre por obrigação | Sem entusiasmo\n4=Engajamento ativo | Colaboradores voluntários | Curiosidade e interesse\n5=Entusiasmo generalizado | Colaboradores são promotores | Demanda por mais IA'
      },
      {
        numero: 3,
        texto: 'Existe mapeamento de resistências por área, nível hierárquico ou perfil?',
        criterios: '1=Sem mapeamento | Resistências desconhecidas | Surpresas frequentes\n2=Percepção informal | Baseado em intuição | Sem dados estruturados\n3=Mapeamento básico | Identificação de áreas críticas | Ações pontuais\n4=Mapeamento detalhado | Por área e nível | Planos de mitigação\n5=Gestão proativa | Monitoramento contínuo | Intervenção preventiva'
      },
      {
        numero: 4,
        texto: 'Há uma rede de agentes de mudança ou champions de IA nas áreas?',
        criterios: '1=Sem agentes | Mudança top-down apenas | Sem multiplicadores\n2=Agentes informais | Voluntários isolados | Sem coordenação\n3=Rede em formação | Champions identificados | Treinamento inicial\n4=Rede ativa | Champions em todas áreas | Atuação coordenada\n5=Rede madura | Influenciadores efetivos | Cultura de mudança'
      },
      {
        numero: 5,
        texto: 'Existe capacidade organizacional (tempo, recursos) para absorver mudanças?',
        criterios: '1=Sobrecarga total | Sem capacidade | Mudanças competem\n2=Capacidade mínima | Equipes saturadas | Priorização difícil\n3=Capacidade razoável | Algum tempo dedicado | Planejamento necessário\n4=Capacidade adequada | Recursos alocados | Integração no dia a dia\n5=Capacidade flexível | Organização ágil | Absorve mudanças naturalmente'
      },
      {
        numero: 6,
        texto: 'Há mecanismos para sustentar e reforçar as mudanças implementadas?',
        criterios: '1=Sem sustentação | Mudanças regridem | Volta ao antigo\n2=Sustentação informal | Depende de indivíduos | Inconsistente\n3=Processos de reforço | Acompanhamento pós-implantação | Correções pontuais\n4=Sustentação estruturada | Métricas de adoção | Celebração de sucessos\n5=Melhoria contínua | Feedback integrado | Mudança como competência'
      },
      {
        numero: 7,
        texto: 'A liderança intermediária (gerentes, coordenadores) apoia ativamente as mudanças de IA?',
        criterios: '1=Bloqueio ativo | Gerentes resistem | Sabotam iniciativas\n2=Apoio relutante | Cumprem por pressão | Sem convicção\n3=Apoio neutro | Não atrapalham | Mas também não promovem\n4=Apoio ativo | Gerentes engajados | Facilitam a mudança\n5=Liderança transformadora | Gerentes são exemplos | Inspiram suas equipes'
      },
      {
        numero: 8,
        texto: 'Existe um plano estruturado de gestão de mudança para iniciativas de IA?',
        criterios: '1=Sem plano | Mudança acontece sem gestão | Caos organizacional\n2=Plano básico | Comunicação mínima | Reativo\n3=Plano estruturado | Comunicação, treinamento, suporte | Metodologia definida\n4=Plano integrado | Vinculado ao projeto de IA | Governança de mudança\n5=Change Management Office | Excelência em gestão de mudança | Referência interna'
      }
    ]
  },
  {
    nome: 'Plataforma e Industrialização de IA',
    descricao: 'Avalia a capacidade de escalar IA através de plataformas centralizadas e arquitetura para reuso (baseado em MIT CISR Stage 3)',
    ordem: 13,
    peso: 0.07,
    perguntas: [
      {
        numero: 1,
        texto: 'Existe uma plataforma centralizada de IA para desenvolvimento, deploy e monitoramento de modelos?',
        criterios: '1=Sem plataforma | Cada projeto é isolado | Ferramentas ad-hoc\n2=Plataforma emergente | Algumas ferramentas compartilhadas | Adoção limitada\n3=Plataforma funcional | MLOps básico | Maioria dos projetos utiliza\n4=Plataforma madura | MLOps avançado | Todos projetos utilizam | Self-service\n5=Plataforma de referência | Estado da arte | Comparable a Ally.ai ou DBS | Diferencial competitivo'
      },
      {
        numero: 2,
        texto: 'Há arquitetura para reuso de modelos e componentes de IA entre projetos?',
        criterios: '1=Sem reuso | Cada projeto desenvolve do zero | Duplicação de esforços\n2=Reuso informal | Cópia de código | Sem versionamento\n3=Catálogo de modelos | Componentes documentados | Reuso incentivado\n4=Model Registry | Versionamento | APIs padronizadas | Feature Store\n5=Plataforma composable | Modelos como serviço | Reuso automático | Economia de escala'
      },
      {
        numero: 3,
        texto: 'Existem dashboards de negócio que mostram o valor gerado pela IA em tempo real?',
        criterios: '1=Sem dashboards | Valor da IA é anedótico | Sem visibilidade\n2=Relatórios manuais | Periódicos | Dados desatualizados\n3=Dashboards básicos | Atualizados semanalmente | Principais métricas\n4=Dashboards em tempo real | Por projeto e área | Drill-down disponível\n5=Business Intelligence de IA | Tempo real | Preditivo | Atribuição automática de valor'
      },
      {
        numero: 4,
        texto: 'A empresa tem capacidade de colocar modelos em produção em dias (não semanas/meses)?',
        criterios: '1=Meses para produção | Processo manual | Alto risco\n2=Semanas para produção | Semi-automatizado | Dependente de especialistas\n3=1-2 semanas | CI/CD básico | Processo definido\n4=Dias para produção | CI/CD maduro | Blue-green deploy\n5=Horas para produção | GitOps | Canary releases | Rollback automático'
      },
      {
        numero: 5,
        texto: 'Há padronização de frameworks, bibliotecas e tecnologias de IA na organização?',
        criterios: '1=Nenhuma padronização | Cada equipe escolhe | Fragmentação total\n2=Padronização mínima | Recomendações informais | Baixa adesão\n3=Stack definido | Documentado | Maioria adere\n4=Stack padronizado | Governança | Exceções justificadas\n5=Stack otimizado | Benchmark contínuo | Atualização proativa | Best practices'
      },
      {
        numero: 6,
        texto: 'Existe orquestração de pipelines de dados e ML de ponta a ponta?',
        criterios: '1=Sem orquestração | Processos manuais | Sem rastreabilidade\n2=Orquestração básica | Cron jobs | Scripts manuais\n3=Orquestrador implementado | Airflow/Prefect | Pipelines documentados\n4=Orquestração madura | Observabilidade | Retry automático | Alertas\n5=Orquestração inteligente | Auto-scaling | Otimização de custos | Self-healing'
      },
      {
        numero: 7,
        texto: 'Quantos experimentos/PoCs de IA são executados por ano na organização?',
        criterios: '1=Menos de 10 | Experimentação rara | Processo lento\n2=10-50 experimentos | Alguns times experimentam | Processo informal\n3=50-200 experimentos | Experimentação sistemática | Processo definido\n4=200-500 experimentos | Cultura experimental | Fábrica de PoCs\n5=Mais de 500 experimentos | Meta como DBS (>1000) | Experimentação contínua'
      },
      {
        numero: 8,
        texto: 'Qual o impacto econômico total quantificado dos projetos de IA (em R$ ou US$)?',
        criterios: '1=Não quantificado | Sem métricas financeiras | Percepção apenas\n2=Quantificação parcial | Alguns projetos | Metodologia inconsistente\n3=Quantificação estruturada | Maioria dos projetos | Metodologia padrão\n4=Impacto significativo | >R$10M/ano | Crescimento comprovado\n5=Impacto transformacional | >R$100M/ano | IA como diferencial | Comparable a DBS (S$370M)'
      }
    ]
  },
  {
    nome: 'IA como Gerador de Receita',
    descricao: 'Avalia a capacidade de monetizar IA e criar novos modelos de negócio (baseado em MIT CISR Stage 4)',
    ordem: 14,
    peso: 0.07,
    perguntas: [
      {
        numero: 1,
        texto: 'A empresa monetiza suas capacidades de IA vendendo serviços ou produtos para terceiros?',
        criterios: '1=Não monetiza | IA é apenas custo interno | Sem visão de receita\n2=Exploração inicial | Discussões sobre monetização | Sem receita ainda\n3=Receita piloto | Alguns clientes | Modelo de negócio em teste\n4=Receita estabelecida | Linha de negócio definida | Crescimento consistente\n5=Receita significativa | IA como core business | Comparable a Ping An (30+ bancos clientes)'
      },
      {
        numero: 2,
        texto: 'Existem novos modelos de negócio ou linhas de receita baseados exclusivamente em IA?',
        criterios: '1=Nenhum | IA apenas otimiza existente | Sem inovação de modelo\n2=Ideação | Modelos em discussão | Sem implementação\n3=Piloto | Um novo modelo em teste | Validação de mercado\n4=Modelos estabelecidos | 2-3 linhas de receita IA | Escala\n5=Portfólio de modelos | Múltiplas linhas IA-first | Disrupção do setor'
      },
      {
        numero: 3,
        texto: 'A empresa oferece "IA as a Service" (AIaaS) para clientes ou parceiros?',
        criterios: '1=Não oferece | Sem capacidade | Sem interesse\n2=Capacidade emergente | Poderia oferecer | Sem estrutura\n3=Oferta inicial | APIs disponíveis | Poucos clientes\n4=Oferta madura | Catálogo de serviços | Base de clientes\n5=Líder em AIaaS | Plataforma robusta | Ecossistema de parceiros'
      },
      {
        numero: 4,
        texto: 'Qual percentual da receita total da empresa é atribuído diretamente a produtos/serviços de IA?',
        criterios: '1=0% | IA não gera receita direta | Apenas eficiência\n2=0-5% | Contribuição marginal | Crescimento lento\n3=5-15% | Contribuição relevante | Crescimento consistente\n4=15-30% | Contribuição significativa | IA como diferencial\n5=>30% | IA é core | Empresa AI-first | Transformação completa'
      },
      {
        numero: 5,
        texto: 'A empresa possui propriedade intelectual (patentes, modelos proprietários) em IA?',
        criterios: '1=Nenhuma PI | Usa apenas third-party | Sem diferenciação\n2=PI emergente | Modelos customizados | Sem proteção formal\n3=PI documentada | Alguns modelos proprietários | Trade secrets\n4=Patentes registradas | Portfólio de PI | Vantagem competitiva\n5=Líder em PI | Múltiplas patentes | Licenciamento | Referência técnica'
      },
      {
        numero: 6,
        texto: 'Há vendedores/consultores treinados para vender soluções de IA para clientes?',
        criterios: '1=Nenhum | Equipe comercial não entende IA | Oportunidades perdidas\n2=Poucos treinados | Dependente de especialistas | Escala limitada\n3=Equipe em formação | Treinamento estruturado | Primeiras vendas\n4=Equipe capacitada | Vendas consultivas | Portfólio de casos\n5=Força de vendas IA | Especialização profunda | Demanda supera oferta'
      }
    ]
  },
  {
    nome: 'Maturidade por Tipo de IA',
    descricao: 'Avalia a maturidade em cada tipo de IA: Analítica, Generativa, Agêntica e Robótica (baseado em MIT CISR 2024)',
    ordem: 15,
    peso: 0.08,
    perguntas: [
      {
        numero: 1,
        texto: 'Qual o nível de maturidade em IA Analítica/Tradicional (ML clássico, estatística, previsões)?',
        criterios: '1=Inexistente | Sem modelos analíticos | Decisões por intuição\n2=Inicial | Alguns modelos de ML | Uso pontual\n3=Operacional | Modelos em produção | Previsões integradas ao negócio\n4=Avançado | ML pervasivo | AutoML | Feature engineering maduro\n5=Excelência | ML state-of-the-art | Previsões em tempo real | Competitive advantage'
      },
      {
        numero: 2,
        texto: 'Qual o nível de maturidade em IA Generativa (LLMs, geração de texto/código/imagem)?',
        criterios: '1=Inexistente | Sem uso de GenAI | Desconhecimento\n2=Exploratório | ChatGPT/Copilot individual | Sem governança\n3=Piloto | Casos de uso definidos | Governança básica | RAG implementado\n4=Produção | GenAI em processos críticos | Fine-tuning | Múltiplos LLMs\n5=Inovador | GenAI pervasivo | SLMs proprietários | Diferencial competitivo'
      },
      {
        numero: 3,
        texto: 'Qual o nível de maturidade em IA Agêntica (agentes autônomos, multi-agent systems)?',
        criterios: '1=Inexistente | Sem agentes | Automação básica apenas\n2=Conceitual | Entende o conceito | Sem implementação\n3=Piloto | Primeiros agentes | Tarefas simples | Supervisão alta\n4=Produção | Agentes em processos | Autonomia moderada | Human-in-the-loop\n5=Avançado | Multi-agent systems | Autonomia alta | Orquestração complexa | 24/7'
      },
      {
        numero: 4,
        texto: 'Qual o nível de maturidade em IA Robótica (RPA cognitivo, automação física, robôs)?',
        criterios: '1=Inexistente | Sem RPA/robótica | Processos manuais\n2=RPA básico | Automação de tarefas repetitivas | Sem IA\n3=RPA cognitivo | RPA + ML/NLP | Document processing\n4=Automação inteligente | RPA + GenAI | Process mining | Hyperautomation\n5=Robótica avançada | Robôs físicos + IA | Autonomous operations | Industry 4.0'
      },
      {
        numero: 5,
        texto: 'A empresa consegue combinar múltiplos tipos de IA em soluções integradas?',
        criterios: '1=Não combina | Cada tipo isolado | Silos tecnológicos\n2=Combinação ad-hoc | Integrações manuais | Esforço alto\n3=Combinação planejada | Arquitetura permite | Alguns casos\n4=Combinação sistemática | Plataforma unificada | Múltiplas combinações\n5=Orquestração inteligente | Todos tipos integrados | Soluções compostas | AI fabric'
      },
      {
        numero: 6,
        texto: 'Há roadmap claro de evolução para cada tipo de IA?',
        criterios: '1=Sem roadmap | Evolução reativa | Sem visão\n2=Roadmap informal | Apenas para um tipo | Desatualizado\n3=Roadmaps por tipo | Documentados | Revisão anual\n4=Roadmap integrado | Todos tipos | Revisão trimestral | Investimento alinhado\n5=Roadmap preditivo | Antecipa tendências | Investimento proativo | Liderança tecnológica'
      },
      {
        numero: 7,
        texto: 'Existem especialistas dedicados para cada tipo de IA na organização?',
        criterios: '1=Generalistas apenas | Sem especialização | Conhecimento superficial\n2=Especialistas em 1 tipo | ML ou GenAI | Gaps nos outros\n3=Especialistas em 2 tipos | Cobertura parcial | Contratação em andamento\n4=Especialistas em 3 tipos | Boa cobertura | Desenvolvimento interno\n5=Especialistas em todos | Centro de excelência | Referência de mercado'
      },
      {
        numero: 8,
        texto: 'A empresa monitora e avalia novas tecnologias em cada tipo de IA?',
        criterios: '1=Não monitora | Reativo | Surpresas frequentes\n2=Monitoramento passivo | Notícias | Sem ação estruturada\n3=Radar tecnológico | Avaliação periódica | Experimentação seletiva\n4=Technology scouting | Avaliação contínua | PoCs frequentes | Early adopter\n5=Fronteira tecnológica | Pesquisa própria | Parcerias com academia | Publicações'
      }
    ]
  },
  {
    nome: 'Eficácia de IA (MIT CISR)',
    descricao: 'Avalia a eficácia total de IA nas 3 dimensões do MIT CISR: Operações, Experiência do Cliente e Ecossistema',
    ordem: 16,
    peso: 0.08,
    perguntas: [
      {
        numero: 1,
        texto: 'Qual a eficácia da IA em melhorar as OPERAÇÕES da empresa (eficiência, produtividade, qualidade)?',
        criterios: '1=Nenhuma | IA não impacta operações | Processos manuais\n2=Baixa | Impacto em <10% dos processos | Ganhos marginais\n3=Moderada | Impacto em 10-30% dos processos | Ganhos consistentes\n4=Alta | Impacto em 30-60% dos processos | Ganhos significativos\n5=Muito Alta | Impacto em >60% dos processos | Operações AI-driven'
      },
      {
        numero: 2,
        texto: 'Qual a eficácia da IA em melhorar a EXPERIÊNCIA DO CLIENTE (satisfação, personalização, velocidade)?',
        criterios: '1=Nenhuma | IA não impacta cliente | Experiência tradicional\n2=Baixa | Chatbots básicos | Impacto marginal em NPS\n3=Moderada | Personalização parcial | Melhoria de 5-15% em NPS/CSAT\n4=Alta | Experiência AI-enhanced | Melhoria de 15-30% em NPS/CSAT\n5=Muito Alta | Experiência AI-first | Melhoria >30% em NPS/CSAT | Diferencial competitivo'
      },
      {
        numero: 3,
        texto: 'Qual a eficácia da IA em suportar e desenvolver o ECOSSISTEMA (parceiros, fornecedores, comunidade)?',
        criterios: '1=Nenhuma | IA é interna apenas | Sem impacto no ecossistema\n2=Baixa | Compartilhamento de dados básico | APIs simples\n3=Moderada | Integração com parceiros | APIs de IA disponíveis\n4=Alta | Ecossistema de IA | Parceiros consomem e contribuem | Co-criação\n5=Muito Alta | Líder do ecossistema | Plataforma de IA aberta | Atrai inovação'
      },
      {
        numero: 4,
        texto: 'A IA está EMBUTIDA nas decisões estratégicas e operacionais do dia a dia?',
        criterios: '1=Não | Decisões são humanas | IA é ferramenta ocasional\n2=Parcialmente | IA sugere | Humanos decidem sempre\n3=Moderadamente | IA decide em casos simples | Human-in-the-loop\n4=Significativamente | IA decide maioria | Humanos supervisionam\n5=Totalmente | IA é parte integral | Decisões AI-augmented | Real-time'
      },
      {
        numero: 5,
        texto: 'Os modelos de IA atendem aos SLAs de negócio (disponibilidade, latência, acurácia)?',
        criterios: '1=Sem SLA | Performance desconhecida | Sem monitoramento\n2=SLA informal | Alguns modelos | Monitoramento básico\n3=SLA definido | Maioria dos modelos | Monitoramento regular\n4=SLA rigoroso | Todos modelos | 99.9% uptime | <100ms latência\n5=SLA excelente | 99.99% uptime | <50ms latência | Auto-scaling'
      },
      {
        numero: 6,
        texto: 'Qual o nível de satisfação dos usuários internos com as ferramentas de IA disponíveis?',
        criterios: '1=Baixa | Usuários frustrados | Ferramentas não funcionam | Resistência\n2=Regular | Algumas reclamações | Ferramentas básicas | Adoção forçada\n3=Boa | Satisfação moderada | Ferramentas úteis | Adoção voluntária\n4=Alta | Usuários satisfeitos | Ferramentas excelentes | Demanda por mais\n5=Muito Alta | Usuários entusiastas | Ferramentas essenciais | Promotores internos'
      }
    ]
  }
];

// ==========================================
// PERGUNTAS OBRIGATÓRIAS UNIVERSAIS DE TRANSFORMAÇÃO AGÊNTICA
// Estas 8 perguntas são aplicadas a TODOS os produtos, independente da vertical
// Baseadas no framework de Transformação Agêntica para Multi-Agent Systems
// ==========================================

const perguntasObrigatorias = [
  {
    numero: 1,
    categoria: 'Maturidade para Agentes Autônomos',
    texto: 'O projeto envolve a criação de agentes de IA autônomos (Multi-Agent Systems) que podem executar tarefas complexas sem intervenção humana contínua, operando 24/7 e melhorando iterativamente?',
    criterios: '[1] Não; o projeto é apenas automação RPA ou chatbots simples\n[2] Parcialmente; há alguns elementos de autonomia, mas com muita supervisão humana\n[3] Moderadamente; agentes podem executar tarefas com supervisão ocasional\n[4] Significativamente; agentes são principalmente autônomos com exceções tratadas por humanos\n[5] Totalmente; agentes são totalmente autônomos, auto-corrigíveis e aprendem com o tempo',
    peso: 0.20,
    ordem: 1
  },
  {
    numero: 2,
    categoria: 'Redução de Custos Operacionais',
    texto: 'O projeto pode reduzir custos operacionais em pelo menos 30% através da automação agêntica, incluindo redução de headcount, horas de trabalho manual, ou custos de infraestrutura?',
    criterios: '[1] Não; redução de custos é mínima (<10%)\n[2] Baixa; redução de custos entre 10-20%\n[3] Moderada; redução de custos entre 20-30%\n[4] Significativa; redução de custos entre 30-50%\n[5] Transformacional; redução de custos >50% ou eliminação de posições',
    peso: 0.15,
    ordem: 2
  },
  {
    numero: 3,
    categoria: 'Impacto no ROI e Receita',
    texto: 'O projeto gera receita incremental ou ROI >100% no primeiro ano através de agentes que aumentam throughput, qualidade, ou permitem novos modelos de negócio?',
    criterios: '[1] Não; ROI <20% ou apenas economia de custos\n[2] Baixo; ROI entre 20-50%\n[3] Moderado; ROI entre 50-100%\n[4] Significativo; ROI entre 100-200%\n[5] Transformacional; ROI >200% ou novo modelo de negócio',
    peso: 0.20,
    ordem: 3
  },
  {
    numero: 4,
    categoria: 'Integração com APIs e Ecossistema',
    texto: 'O projeto integra-se com APIs, sistemas legados e ferramentas externas através de um ecossistema de agentes que se comunicam (Manus MCP, webhooks, integrações padrão)?',
    criterios: '[1] Não; agentes funcionam isolados, sem integração\n[2] Parcialmente; integração com 1-2 sistemas principais\n[3] Moderadamente; integração com 3-5 sistemas\n[4] Significativamente; integração com 5+ sistemas, API-first\n[5] Totalmente; ecossistema de agentes multi-sistema, orquestração complexa',
    peso: 0.15,
    ordem: 4
  },
  {
    numero: 5,
    categoria: 'Escalabilidade e Elasticidade',
    texto: 'Os agentes podem escalar elasticamente (aumentar/diminuir capacidade sob demanda) sem degradação de performance, suportando crescimento de 10x em volume?',
    criterios: '[1] Não; agentes têm limitações severas de escala\n[2] Baixa; agentes escalam até 2x com degradação\n[3] Moderada; agentes escalam até 5x com performance aceitável\n[4] Significativa; agentes escalam até 10x com performance mantida\n[5] Totalmente; agentes escalam elasticamente, serverless, auto-scaling',
    peso: 0.10,
    ordem: 5
  },
  {
    numero: 6,
    categoria: 'Governança e Conformidade',
    texto: 'O projeto implementa governança, auditoria e controle de qualidade robustos para agentes, incluindo logging, explicabilidade, detecção de alucinação e conformidade regulatória?',
    criterios: '[1] Não; sem governança, black box, risco regulatório alto\n[2] Baixa; governança mínima, logging básico\n[3] Moderada; governança parcial, auditoria manual\n[4] Significativa; governança forte, auditoria automática, conformidade\n[5] Totalmente; governança completa, explicabilidade total, zero-trust',
    peso: 0.10,
    ordem: 6
  },
  {
    numero: 7,
    categoria: 'Aprendizado e Evolução',
    texto: 'Os agentes podem aprender com feedback, melhorar iterativamente e evoluir sem retreinamento completo, adaptando-se a novos padrões e cenários?',
    criterios: '[1] Não; agentes são estáticos, requerem retreinamento completo\n[2] Baixa; aprendizado muito lento ou requer intervenção frequente\n[3] Moderada; agentes aprendem com feedback, evolução lenta\n[4] Significativa; agentes aprendem rapidamente, evolução contínua\n[5] Totalmente; agentes auto-evoluem, reinforcement learning, zero-shot adaptation',
    peso: 0.05,
    ordem: 7
  },
  {
    numero: 8,
    categoria: 'Experiência do Usuário',
    texto: 'O projeto melhora significativamente a experiência do usuário (tempo de resposta <1s, disponibilidade 24/7, personalização) através de agentes, aumentando NPS/CSAT em >20%?',
    criterios: '[1] Não; experiência não muda ou piora\n[2] Baixa; melhoria <5% em NPS/CSAT\n[3] Moderada; melhoria 5-15% em NPS/CSAT\n[4] Significativa; melhoria 15-30% em NPS/CSAT\n[5] Transformacional; melhoria >30% em NPS/CSAT, novo padrão de UX',
    peso: 0.05,
    ordem: 8
  }
];

// ==========================================
// VERTICAIS DO MÓDULO DE PRODUTO IA-FIRST
// Cada vertical tem 3 perguntas: ROI, Automação Agêntica, APIs
// TODAS as perguntas são aplicadas a TODOS os produtos
// ==========================================

const verticaisProduto = [
  {
    nome: 'Tecnologia Financeira (FinTech)',
    descricao: 'Validação de produtos de IA para o setor financeiro',
    foco: 'Pagamentos, investimentos, empréstimos e compliance',
    icone: '💳',
    ordem: 1,
    perguntas: [
      {
        numero: 1,
        categoria: 'ROI e Redução de Custos',
        texto: 'O projeto projeta um ROI superior a 150% no primeiro ano e reduz os custos operacionais de back-office?'
      },
      {
        numero: 2,
        categoria: 'Automação Agêntica',
        texto: 'A solução utiliza Agentes de IA autônomos para substituir fluxos de trabalho manuais?'
      },
      {
        numero: 3,
        categoria: 'APIs e Aceleradores',
        texto: 'O projeto faz uso de aceleradores SysMap e APIs padronizadas para integrar sistemas legados bancários, reduzindo o tempo de desenvolvimento (Lead Time) em pelo menos 50%?'
      },
      {
        numero: 4,
        categoria: 'Viabilidade Técnica',
        texto: 'A infraestrutura atual do cliente suporta a implementação da solução (conectividade, processamento, armazenamento de dados sensíveis)?'
      },
      {
        numero: 5,
        categoria: 'Prontidão do Cliente',
        texto: 'O cliente possui dados históricos de qualidade suficiente (min. 2 anos) e equipe técnica para sustentar a solução?'
      },
      {
        numero: 6,
        categoria: 'Riscos e Compliance',
        texto: 'A solução atende às regulamentações do setor financeiro (BACEN, CVM, LGPD) e possui mecanismos de auditoria e rastreabilidade?'
      }
    ]
  },
  {
    nome: 'Inteligência Artificial (AI First)',
    descricao: 'Validação de produtos nativamente baseados em IA',
    foco: 'Agentes de IA verticais para automação profunda',
    icone: '🤖',
    ordem: 2,
    perguntas: [
      {
        numero: 1,
        categoria: 'ROI e Redução de Custos',
        texto: 'O projeto demonstra um modelo de negócio onde o custo marginal de entrega do serviço cai para quase zero, gerando margens brutas superiores a 80%?'
      },
      {
        numero: 2,
        categoria: 'Automação Agêntica',
        texto: 'A solução é nativamente baseada em múltiplos Agentes de IA colaborativos (Multi-Agent Systems) que automatizam processos cognitivos fim-a-fim, reduzindo o tempo de execução de dias para minutos?'
      },
      {
        numero: 3,
        categoria: 'APIs e Aceleradores',
        texto: 'O projeto utiliza o Manus MCP ou arquiteturas similares para orquestrar ferramentas externas de forma autônoma, eliminando a necessidade de integrações manuais complexas?'
      },
      {
        numero: 4,
        categoria: 'Viabilidade Técnica',
        texto: 'A arquitetura proposta suporta múltiplos modelos de IA (LLM, embeddings, vision) e permite substituição de modelos sem reengenharia?'
      },
      {
        numero: 5,
        categoria: 'Prontidão do Cliente',
        texto: 'O cliente possui maturidade digital (cloud, APIs, DevOps) e equipe capaz de operar e evoluir agentes de IA?'
      },
      {
        numero: 6,
        categoria: 'Riscos e Dependências',
        texto: 'A solução possui guardrails contra alucinações, mecanismos de fallback humano e plano de contingência para indisponibilidade de LLMs?'
      }
    ]
  },
  {
    nome: 'Tecnologia Educacional (EdTech)',
    descricao: 'Validação de produtos de IA para educação',
    foco: 'Ensino, aprendizado e gestão educacional',
    icone: '📚',
    ordem: 3,
    perguntas: [
      {
        numero: 1,
        categoria: 'ROI e Redução de Custos',
        texto: 'O projeto reduz o custo de produção de conteúdo educacional e tutoria em pelo menos 50%, mantendo ou aumentando a taxa de retenção de alunos?'
      },
      {
        numero: 2,
        categoria: 'Automação Agêntica',
        texto: 'A solução emprega Agentes Tutores 24/7 que automatizam o atendimento a dúvidas e a correção de avaliações, liberando 70% do tempo dos professores para atividades estratégicas?'
      },
      {
        numero: 3,
        categoria: 'APIs e Aceleradores',
        texto: 'O projeto integra APIs de IA Generativa (LLMs) e aceleradores de processamento de linguagem natural para criar trilhas de aprendizado dinâmicas em tempo real?'
      },
      {
        numero: 4,
        categoria: 'Viabilidade Técnica',
        texto: 'A infraestrutura educacional do cliente (LMS, sistemas acadêmicos) permite integração e possui capacidade de processamento para IA?'
      },
      {
        numero: 5,
        categoria: 'Prontidão do Cliente',
        texto: 'A instituição possui dados de desempenho de alunos estruturados e equipe pedagógica engajada na adoção de tecnologia?'
      },
      {
        numero: 6,
        categoria: 'Riscos e Ética',
        texto: 'A solução garante privacidade de dados de menores (quando aplicável), evita vieses pedagógicos e possui supervisão humana adequada?'
      }
    ]
  },
  {
    nome: 'Legal Tech',
    descricao: 'Validação de produtos de IA para área jurídica',
    foco: 'Contratos, e-discovery e automação legal',
    icone: '⚖️',
    ordem: 4,
    perguntas: [
      {
        numero: 1,
        categoria: 'ROI e Redução de Custos',
        texto: 'O projeto reduz as horas faturáveis gastas em revisão de contratos e e-discovery em mais de 60%, aumentando a lucratividade do escritório ou reduzindo custos do departamento jurídico?'
      },
      {
        numero: 2,
        categoria: 'Automação Agêntica',
        texto: 'A solução utiliza Agentes Jurídicos para triagem autônoma de processos, extração de cláusulas e geração de minutas, reduzindo o trabalho paralegal em 50%?'
      },
      {
        numero: 3,
        categoria: 'APIs e Aceleradores',
        texto: 'O projeto faz uso de aceleradores de NLP especializados em jargão jurídico e APIs de busca semântica para acelerar a pesquisa jurisprudencial?'
      },
      {
        numero: 4,
        categoria: 'Viabilidade Técnica',
        texto: 'Os sistemas jurídicos do cliente (gestão de processos, GED) permitem integração e os documentos estão em formato processável por IA?'
      },
      {
        numero: 5,
        categoria: 'Prontidão do Cliente',
        texto: 'O escritório/departamento possui base de contratos e jurisprudência digitalizada e equipe aberta a adoção de ferramentas de IA?'
      },
      {
        numero: 6,
        categoria: 'Riscos e Compliance',
        texto: 'A solução mantém confidencialidade client-attorney, possui trilha de auditoria completa e não substitui decisões que requerem julgamento humano?'
      }
    ]
  },
  {
    nome: 'Saúde e Bem-Estar',
    descricao: 'Validação de produtos de IA para saúde',
    foco: 'Operações hospitalares, triagem e diagnóstico',
    icone: '🏥',
    ordem: 5,
    perguntas: [
      {
        numero: 1,
        categoria: 'ROI e Redução de Custos',
        texto: 'O projeto reduz os custos operacionais hospitalares (ex: triagem, agendamento, documentação) em pelo menos 30% e melhora a satisfação do paciente?'
      },
      {
        numero: 2,
        categoria: 'Automação Agêntica',
        texto: 'A solução implementa Agentes de Triagem e Agendamento que automatizam 80% do fluxo de entrada de pacientes, reduzindo a carga sobre a recepção e enfermagem?'
      },
      {
        numero: 3,
        categoria: 'APIs e Aceleradores',
        texto: 'O projeto utiliza APIs de visão computacional para análise de exames e aceleradores de integração com prontuários eletrônicos (EHR/HL7/FHIR)?'
      },
      {
        numero: 4,
        categoria: 'Viabilidade Técnica',
        texto: 'A infraestrutura hospitalar (rede, servidores, prontuário eletrônico) suporta integração com IA e atende requisitos de latência para aplicações críticas?'
      },
      {
        numero: 5,
        categoria: 'Prontidão do Cliente',
        texto: 'A instituição possui dados clínicos estruturados (histórico de pacientes, exames) e equipe médica engajada na validação de diagnósticos assistidos?'
      },
      {
        numero: 6,
        categoria: 'Riscos e Regulatório',
        texto: 'A solução atende às regulamentações de saúde (ANVISA, CFM, LGPD Saúde), possui mecanismos de segunda opinião humana e não substitui diagnóstico médico final?'
      }
    ]
  },
  {
    nome: 'E-commerce e Varejo',
    descricao: 'Validação de produtos de IA para varejo e e-commerce',
    foco: 'Conversão, atendimento e precificação',
    icone: '🛍️',
    ordem: 6,
    perguntas: [
      {
        numero: 1,
        categoria: 'ROI e Redução de Custos',
        texto: 'O projeto projeta um aumento de conversão de pelo menos 20% e uma redução nos custos de atendimento ao cliente (SAC) de 40%?'
      },
      {
        numero: 2,
        categoria: 'Automação Agêntica',
        texto: 'A solução utiliza Agentes de Atendimento Pós-Venda que resolvem autonomamente trocas, devoluções e rastreamento, eliminando a necessidade de intervenção humana em 70% dos tickets?'
      },
      {
        numero: 3,
        categoria: 'APIs e Aceleradores',
        texto: 'O projeto integra APIs de recomendação semântica e aceleradores de precificação dinâmica para otimizar margens em tempo real?'
      },
      {
        numero: 4,
        categoria: 'Viabilidade Técnica',
        texto: 'A plataforma de e-commerce do cliente (Magento, VTEX, Shopify, etc.) permite integração via APIs e suporta volume de requisições da IA?'
      },
      {
        numero: 5,
        categoria: 'Prontidão do Cliente',
        texto: 'O cliente possui histórico de transações estruturado (min. 1 ano), catálogo de produtos organizado e equipe de e-commerce dedicada?'
      },
      {
        numero: 6,
        categoria: 'Riscos e Experiência',
        texto: 'A solução garante experiência consistente omnichannel, possui plano de contingência para falhas e não prejudica a jornada do cliente?'
      }
    ]
  },
  {
    nome: 'Manufatura e Indústria',
    descricao: 'Validação de produtos de IA para manufatura',
    foco: 'Manutenção preditiva, qualidade e IoT',
    icone: '🏭',
    ordem: 7,
    perguntas: [
      {
        numero: 1,
        categoria: 'ROI e Redução de Custos',
        texto: 'O projeto reduz o tempo de inatividade não planejado (downtime) em 30% e os custos de manutenção em 20%, gerando um ROI direto na linha de produção?'
      },
      {
        numero: 2,
        categoria: 'Automação Agêntica',
        texto: 'A solução emprega Agentes de Monitoramento IoT que analisam dados de sensores e acionam ordens de serviço autonomamente, reduzindo a necessidade de inspeções manuais?'
      },
      {
        numero: 3,
        categoria: 'APIs e Aceleradores',
        texto: 'O projeto utiliza aceleradores de visão computacional para controle de qualidade e APIs de integração com sistemas ERP/MES legados?'
      },
      {
        numero: 4,
        categoria: 'Viabilidade Técnica',
        texto: 'A infraestrutura industrial (rede OT, sensores IoT, sistemas SCADA) permite coleta de dados em tempo real e edge computing?'
      },
      {
        numero: 5,
        categoria: 'Prontidão do Cliente',
        texto: 'A planta industrial possui histórico de dados de sensores e manutenção estruturado e equipe de engenharia/manutenção aberta a IA?'
      },
      {
        numero: 6,
        categoria: 'Riscos e Segurança',
        texto: 'A solução atende normas de segurança industrial (NR-12, ISO 45001), não interfere em sistemas de segurança e possui modo de operação manual?'
      }
    ]
  },
  {
    nome: 'Agricultura Vertical e Sustentabilidade',
    descricao: 'Validação de produtos de IA para agricultura e sustentabilidade',
    foco: 'Controle ambiental, otimização de recursos e IoT',
    icone: '🌱',
    ordem: 8,
    perguntas: [
      {
        numero: 1,
        categoria: 'ROI e Redução de Custos',
        texto: 'O projeto reduz o consumo de energia e água em 40% e aumenta o rendimento da colheita (yield) em 20%, melhorando drasticamente a viabilidade econômica?'
      },
      {
        numero: 2,
        categoria: 'Automação Agêntica',
        texto: 'A solução utiliza Agentes de Controle Ambiental que ajustam autonomamente luz, nutrientes e clima em tempo real, sem necessidade de operadores humanos constantes?'
      },
      {
        numero: 3,
        categoria: 'APIs e Aceleradores',
        texto: 'O projeto integra APIs de previsão climática e aceleradores de análise de dados de sensores IoT para otimização contínua?'
      },
      {
        numero: 4,
        categoria: 'Viabilidade Técnica',
        texto: 'A infraestrutura agrícola (sensores, atuadores, conectividade rural) permite implementação de IA e controle remoto?'
      },
      {
        numero: 5,
        categoria: 'Prontidão do Cliente',
        texto: 'O cliente possui dados históricos de produção e condições ambientais e equipe técnica para operar sistemas de IA agrícola?'
      },
      {
        numero: 6,
        categoria: 'Riscos e Sustentabilidade',
        texto: 'A solução contribui para metas de sustentabilidade (ESG), possui fallback para falhas de conectividade e não compromete a produção?'
      }
    ]
  },
  {
    nome: 'Tecnologia e Consultoria (Tech & Consulting)',
    descricao: 'Validação de produtos de IA para tecnologia e consultoria',
    foco: 'Desenvolvimento de software, QA e Fábrica Agêntica',
    icone: '💻',
    ordem: 9,
    perguntas: [
      {
        numero: 1,
        categoria: 'ROI e Redução de Custos',
        texto: 'O projeto reduz o Lead Time de desenvolvimento de software em 50% e os custos de QA/Testes em 40%, alinhado com a metodologia de Fábrica Agêntica?'
      },
      {
        numero: 2,
        categoria: 'Automação Agêntica',
        texto: 'A solução implementa Agentes Desenvolvedores (Dev AI) que geram, testam e documentam código autonomamente, visando a meta de 80% de código gerado por IA?'
      },
      {
        numero: 3,
        categoria: 'APIs e Aceleradores',
        texto: 'O projeto utiliza aceleradores de CI/CD, APIs de LLMs para code review e o framework Blueprint IA para escalar a entrega de serviços de consultoria?'
      },
      {
        numero: 4,
        categoria: 'Viabilidade Técnica',
        texto: 'A infraestrutura de desenvolvimento do cliente (repositórios, CI/CD, cloud) permite integração com ferramentas de IA e automação?'
      },
      {
        numero: 5,
        categoria: 'Prontidão do Cliente',
        texto: 'O cliente possui práticas de DevOps maduras, documentação de código e equipe de engenharia receptiva a code assistants?'
      },
      {
        numero: 6,
        categoria: 'Riscos e Qualidade',
        texto: 'A solução inclui revisão humana de código crítico, testes de segurança (SAST/DAST) automatizados e não introduz vulnerabilidades?'
      }
    ]
  },
  {
    nome: 'Serviços Profissionais (Professional Services)',
    descricao: 'Validação de produtos de IA para empresas de serviços',
    foco: 'BPO, Contact Center, Atendimento, Facilities e Serviços Gerais',
    icone: '🏢',
    ordem: 10,
    perguntas: [
      {
        numero: 1,
        categoria: 'ROI e Redução de Custos',
        texto: 'O projeto reduz o custo por atendimento/serviço em pelo menos 40% e aumenta a capacidade de atendimento sem aumento proporcional de headcount?'
      },
      {
        numero: 2,
        categoria: 'Automação Agêntica',
        texto: 'A solução utiliza Agentes de Atendimento e Serviço que automatizam interações com clientes, triagem de demandas e resolução de tickets de forma autônoma 24/7?'
      },
      {
        numero: 3,
        categoria: 'APIs e Aceleradores',
        texto: 'O projeto integra APIs de comunicação omnichannel (voz, chat, email, WhatsApp), CRM e sistemas de gestão de serviços para orquestração unificada?'
      },
      {
        numero: 4,
        categoria: 'Viabilidade Técnica',
        texto: 'A infraestrutura de atendimento do cliente (PABX, contact center, ticketing) permite integração com agentes de IA e automação de workflows?'
      },
      {
        numero: 5,
        categoria: 'Prontidão do Cliente',
        texto: 'O cliente possui histórico de atendimentos estruturado, base de conhecimento documentada e equipe de operações receptiva a automação?'
      },
      {
        numero: 6,
        categoria: 'Riscos e Qualidade de Serviço',
        texto: 'A solução mantém SLAs de atendimento, possui escalação automática para humanos em casos complexos e não compromete a satisfação do cliente (NPS)?'
      }
    ]
  },
  {
    nome: 'Logística e Supply Chain',
    descricao: 'Validação de produtos de IA para logística e cadeia de suprimentos',
    foco: 'Transporte, Armazenagem, Distribuição, Last Mile e Gestão de Estoque',
    icone: '🚚',
    ordem: 11,
    perguntas: [
      {
        numero: 1,
        categoria: 'ROI e Redução de Custos',
        texto: 'O projeto reduz custos logísticos em pelo menos 20% (transporte, armazenagem, perdas) e melhora o OTIF (On Time In Full) em 15%?'
      },
      {
        numero: 2,
        categoria: 'Automação Agêntica',
        texto: 'A solução utiliza Agentes de Otimização Logística que planejam rotas, gerenciam estoque e alocam recursos de forma autônoma, adaptando-se a mudanças em tempo real?'
      },
      {
        numero: 3,
        categoria: 'APIs e Aceleradores',
        texto: 'O projeto integra APIs de rastreamento, previsão de demanda, ERPs/WMS e plataformas de e-commerce para visibilidade end-to-end da cadeia de suprimentos?'
      },
      {
        numero: 4,
        categoria: 'Viabilidade Técnica',
        texto: 'A infraestrutura logística do cliente (TMS, WMS, rastreamento GPS, IoT) permite coleta de dados em tempo real e integração com sistemas de IA?'
      },
      {
        numero: 5,
        categoria: 'Prontidão do Cliente',
        texto: 'O cliente possui histórico de operações logísticas estruturado, visibilidade de estoque e equipe de operações aberta a otimização por IA?'
      },
      {
        numero: 6,
        categoria: 'Riscos e Continuidade',
        texto: 'A solução possui planos de contingência para falhas, não interrompe operações críticas e considera sazonalidades e eventos excepcionais?'
      }
    ]
  },
  {
    nome: 'Mobilidade e Smart Cities',
    descricao: 'Validação de produtos de IA para mobilidade urbana e cidades inteligentes',
    foco: 'Estacionamentos, Transporte Urbano, Gestão de Tráfego, Frotas e Infraestrutura Urbana',
    icone: '🚗',
    ordem: 12,
    perguntas: [
      {
        numero: 1,
        categoria: 'ROI e Redução de Custos',
        texto: 'O projeto aumenta o giro de vagas/ativos em pelo menos 25%, reduz o tempo de busca/espera do usuário em 40% e melhora a receita por metro quadrado ou ativo gerenciado?'
      },
      {
        numero: 2,
        categoria: 'Automação Agêntica',
        texto: 'A solução utiliza Agentes de Gestão de Mobilidade que otimizam alocação de vagas, pricing dinâmico, controle de acesso e fluxo de veículos de forma autônoma em tempo real?'
      },
      {
        numero: 3,
        categoria: 'APIs e Aceleradores',
        texto: 'O projeto integra APIs de navegação (Google Maps, Waze), sistemas de pagamento digital, controle de acesso (LPR, totens) e apps de mobilidade para experiência seamless?'
      },
      {
        numero: 4,
        categoria: 'Viabilidade Técnica',
        texto: 'A infraestrutura do cliente (sensores IoT, câmeras LPR, cancelas, totens, conectividade) permite coleta de dados em tempo real e automação de acesso?'
      },
      {
        numero: 5,
        categoria: 'Prontidão do Cliente',
        texto: 'O cliente possui histórico de ocupação, fluxo de veículos e transações estruturado, além de equipe de operações receptiva a IA e automação?'
      },
      {
        numero: 6,
        categoria: 'Riscos e Disponibilidade',
        texto: 'A solução possui alta disponibilidade (99.9%), fallback manual para falhas, não bloqueia acesso de veículos e atende normas de segurança e privacidade (LGPD para placas)?'
      }
    ]
  }
];

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Seed das áreas de assessment de maturidade
  for (const areaData of areas) {
    const { perguntas, ...areaInfo } = areaData;
    
    const existingArea = await prisma.area.findUnique({
      where: { nome: areaInfo.nome }
    });
    
    if (existingArea) {
      console.log(`Área já existe: ${areaInfo.nome}`);
      continue;
    }
    
    const area = await prisma.area.create({
      data: areaInfo
    });
    
    console.log(`Área criada: ${area.nome}`);
    
    for (const perguntaData of perguntas) {
      await prisma.pergunta.create({
        data: {
          ...perguntaData,
          areaId: area.id
        }
      });
    }
    
    console.log(`  - ${perguntas.length} perguntas criadas`);
  }

  // Limpar e recriar perguntas obrigatórias universais
  console.log('\n--- Criando Perguntas Obrigatórias Universais de Transformação Agêntica ---');
  await prisma.respostaObrigatoriaProduto.deleteMany({});
  await prisma.perguntaObrigatoriaProduto.deleteMany({});
  
  for (const perguntaData of perguntasObrigatorias) {
    await prisma.perguntaObrigatoriaProduto.create({
      data: perguntaData
    });
  }
  console.log(`${perguntasObrigatorias.length} perguntas obrigatórias universais criadas (pesos somam 100%).`);

  // Limpar verticais e perguntas existentes para recriar com nova estrutura
  console.log('\n--- Limpando verticais existentes ---');
  await prisma.respostaProduto.deleteMany({});
  await prisma.perguntaProduto.deleteMany({});
  await prisma.verticalProduto.deleteMany({});
  console.log('Verticais e perguntas limpas.');

  // Seed das verticais do Módulo de Produto IA-First
  // Cada vertical tem 3 perguntas (ROI, Automação, APIs) - TODAS são aplicadas a TODOS os produtos
  console.log('\n--- Criando Verticais (Produto IA-First) ---');
  
  for (const verticalData of verticaisProduto) {
    const { perguntas, ...verticalInfo } = verticalData;
    
    const vertical = await prisma.verticalProduto.create({
      data: verticalInfo
    });
    
    console.log(`Vertical criada: ${vertical.nome}`);
    
    for (const perguntaData of perguntas) {
      await prisma.perguntaProduto.create({
        data: {
          numero: perguntaData.numero,
          categoria: perguntaData.categoria,
          texto: perguntaData.texto,
          verticalId: vertical.id
        }
      });
    }
    
    console.log(`  - ${perguntas.length} perguntas criadas (ROI, Automação, APIs)`);
  }

  // Criar empresa e usuário admin padrão para desenvolvimento
  console.log('\n--- Criando usuário admin padrão ---');
  
  let empresaAdmin = await prisma.empresa.findFirst({
    where: { nome: 'SysMap Solutions' }
  });
  
  if (!empresaAdmin) {
    empresaAdmin = await prisma.empresa.create({
      data: {
        nome: 'SysMap Solutions',
        setor: 'Tecnologia',
        porte: 'Grande',
        email: 'contato@sysmap.com.br'
      }
    });
    console.log('Empresa SysMap Solutions criada.');
  }
  
  const adminExistente = await prisma.usuario.findUnique({
    where: { email: 'admin@sysmap.com.br' }
  });
  
  if (!adminExistente) {
    const senhaHash = await bcrypt.hash('AdminSysMap', 10);
    await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: 'admin@sysmap.com.br',
        senha: senhaHash,
        cargo: 'Administrador do Sistema',
        role: 'admin',
        empresaId: empresaAdmin.id,
        ativo: true
      }
    });
    console.log('Usuário admin criado:');
    console.log('  Email: admin@sysmap.com.br');
    console.log('  Senha: AdminSysMap');
  } else {
    // Atualizar senha e role do admin existente
    const senhaHash = await bcrypt.hash('AdminSysMap', 10);
    await prisma.usuario.update({
      where: { email: 'admin@sysmap.com.br' },
      data: { 
        senha: senhaHash, 
        role: 'admin',
        ativo: true
      }
    });
    console.log('Usuário admin atualizado com nova senha.');
  }

  console.log('\nSeed concluído com sucesso!');
  console.log('Total de perguntas para cada avaliação de produto:');
  console.log('  - 8 perguntas obrigatórias universais de Transformação Agêntica (sempre aplicadas)');
  console.log('  - 9 verticais x 6 perguntas = 54 perguntas por verticais (ROI, Automação, APIs, Viabilidade, Prontidão, Riscos)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

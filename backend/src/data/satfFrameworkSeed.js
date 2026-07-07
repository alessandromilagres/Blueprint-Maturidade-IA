/**
 * Catálogo SATF TI v3 — dimensões e perguntas Likert (paridade operacional Blueprint).
 * Fonte: IA Maturidade TI Instrumento v3 (Jun/2026).
 */
import { FRAMEWORK_SATF_TI_V3 } from '../constants/frameworkMaturidadePolicy.js';
import { criteriosSatfPergunta } from './satfPerguntaCriterios.js';

function q(numero, texto, evidenciaEsperada) {
  return { numero, texto, evidenciaEsperada };
}

function anexarCriterios(dim) {
  return {
    ...dim,
    perguntas: dim.perguntas.map((pergunta) => {
      const criterios = criteriosSatfPergunta(dim.codigoFramework, pergunta.numero);
      if (!criterios) {
        throw new Error(`Critérios SATF ausentes para ${dim.codigoFramework}.${pergunta.numero}`);
      }
      return { ...pergunta, criterios };
    })
  };
}

/** @type {import('../utils/areaFrameworkCatalog.js').SatfAreaSeed[]} */
const SATF_FRAMEWORK_SEED_RAW = [
  {
    codigoFramework: 'D1',
    nome: 'Estratégia & Postura de IA',
    descricao: 'Direção explícita para IA: o que fazer, com fronteiras claras (Green/Red Zone).',
    ordem: 1,
    peso: 1 / 9,
    tipoDimensao: 'nucleo',
    perguntas: [
      q(1, 'Existe uma postura/estratégia de IA documentada e comunicada a toda a engenharia? Onde está e quando foi atualizada?', 'Documento de estratégia; data última revisão'),
      q(2, 'Os casos de uso de IA são priorizados por valor de negócio ou por disponibilidade tecnológica? Como são ranqueados?', 'Matriz de priorização; critérios'),
      q(3, 'Há fronteiras explícitas (Green/Red Zone) sobre o que é encorajado, permitido e proibido com IA?', 'Política de uso; exemplos de fronteiras comunicadas'),
      q(4, 'Quem é o sponsor executivo? Há orçamento e OKRs formais associados à IA?', 'Atas de sponsor; OKRs/metas de IA; orçamento dedicado'),
      q(5, "A estratégia distingue 'automatizar o existente' de 'reconceber o workflow com IA'?", 'Exemplos de redesenho de workflow vs. automação'),
      q(6, 'Com que frequência a estratégia é revisada? Quem participa?', 'Calendário de revisão; lista de participantes')
    ]
  },
  {
    codigoFramework: 'D2',
    nome: 'Governança, Risco & Conformidade',
    descricao: 'Governar IA com fronteiras — uso interno e IA embarcada em produtos para clientes.',
    ordem: 2,
    peso: 1 / 9,
    tipoDimensao: 'nucleo',
    perguntas: [
      q(1, 'A política de IA cobre tanto o uso interno quanto a IA embarcada nos produtos entregues a clientes?', 'Política de IA; escopo interno e de produto'),
      q(2, 'Existe classificação Green/Red Zone do que pode/não pode ir a produção via IA? Quem decide?', 'Matriz Green/Red Zone; processo de decisão'),
      q(3, 'Como vocês mapeiam conformidade com ISO 42001, EU AI Act, LGPD e normas setoriais?', 'Matriz de conformidade; checklist por norma'),
      q(4, 'O comitê de risco consegue enumerar todas as aplicações de IA em operação? Compartilhe o inventário.', 'Inventário de apps/agentes; AI Risk Register'),
      q(5, 'Há rastreabilidade de decisões automatizadas e fluxos de dados pessoais processados por IA?', 'Logs de decisão; mapeamento de PII'),
      q(6, 'A governança está codificada em gates de pipeline ou vive em documentos/PDFs?', 'Configuração de gates; evidência de bloqueio automatizado')
    ]
  },
  {
    codigoFramework: 'D3',
    nome: 'Pessoas, Cultura & Capacitação',
    descricao: 'Prontidão humana: citizen developers, orquestração, avaliação crítica do output de IA.',
    ordem: 3,
    peso: 1 / 9,
    tipoDimensao: 'nucleo',
    perguntas: [
      q(1, 'Vocês conseguem identificar quem, fora da TI, está construindo soluções com IA (citizen developers)?', 'Inventário de citizen developers; área de origem'),
      q(2, "O programa de letramento em IA cobre avaliação crítica de output, além de 'como usar a ferramenta'?", 'Ementa do programa; % do time capacitado'),
      q(3, "O papel do engenheiro está evoluindo de 'quem escreve código' para 'quem orquestra e revisa agentes'? Isso está nas descrições de cargo?", 'Job descriptions; trilhas de carreira atualizadas'),
      q(4, 'Existe segurança psicológica para reportar limites e falhas da IA?', 'Pesquisas de cultura; canais de reporte; exemplos'),
      q(5, "Como vocês evitam over-trust no código gerado ('parece correto, não li o que a IA escreveu')?", 'Checklists de aceite; práticas de revisão'),
      q(6, 'Citizen developers que constroem com IA fora da TI estão dentro do guarda-chuva de governança?', 'Processo de inclusão; exemplos de citizen dev governado')
    ]
  },
  {
    codigoFramework: 'D4',
    nome: 'Engenharia & Padrões de Desenvolvimento',
    descricao: 'Saúde do sistema de entrega — DORA, revisão sob alto volume de código gerado por IA.',
    ordem: 4,
    peso: 1 / 9,
    tipoDimensao: 'nucleo',
    perguntas: [
      q(1, 'Vocês medem entrega com DORA (lead time, frequência de deploy, CFR, MTTR) ou com métricas de vaidade (linhas, commits)?', 'Dashboards DORA/DX; série histórica'),
      q(2, 'Os controles de qualidade (testes, versionamento, feedback) absorvem o volume de código que a IA gera?', 'Cobertura de testes; taxa de quebra do pipeline; tempo de feedback'),
      q(3, 'Vocês conseguem distinguir, nas métricas, o que foi gerado por IA do que foi escrito por humanos?', 'Tags de commits de IA; separação nas métricas'),
      q(4, 'Como a revisão de código se sustenta com 3–4× mais commits por desenvolvedor?', 'PR review time; % de PRs sem revisão substantiva'),
      q(5, 'A instabilidade (CFR, incidentes) subiu após a adoção de IA? Vocês monitoram essa correlação?', 'Série histórica de CFR; correlação com adoção de IA'),
      q(6, 'Que % do tempo de engenharia vai para novas capacidades vs. manutenção/KTLO?', 'Dados de alocação; tendência histórica')
    ]
  },
  {
    codigoFramework: 'D5',
    nome: 'Plataforma, Arquitetura & Escala',
    descricao: 'Fundação para escalar IA: platform engineering, golden paths, PoC → produção.',
    ordem: 5,
    peso: 1 / 9,
    tipoDimensao: 'nucleo',
    perguntas: [
      q(1, 'Existe plataforma interna padronizando ambientes, pipelines e serviços compartilhados? Qual a taxa de adoção?', 'Inventário de plataforma; métricas de adoção'),
      q(2, 'A arquitetura é desacoplada com feedback rápido, ou sistemas fortemente acoplados travam o ganho de IA?', 'Diagramas de arquitetura; métricas de acoplamento'),
      q(3, 'O que acontece entre um PoC bem-sucedido e a produção? Quanto se recria do zero?', 'Histórico PoC → produção; time to production; % de retrabalho'),
      q(4, 'A plataforma oferece contexto governado para agentes (catálogos de serviços, bases de conhecimento)?', 'Documentação da plataforma; exemplos de contexto para agentes'),
      q(5, 'Existem golden paths que tornam o caminho seguro também o caminho fácil?', 'Documentação de golden paths; taxa de adoção'),
      q(6, 'Qual a capacidade de escalar soluções de IA de um projeto para múltiplos times simultaneamente?', 'Exemplos de escala; barreiras identificadas')
    ]
  },
  {
    codigoFramework: 'D6',
    nome: 'Dados, Contexto & Conhecimento',
    descricao: 'Ecossistema de dados e conhecimento que alimenta agentes (RAG, catálogos, PII).',
    ordem: 6,
    peso: 1 / 9,
    tipoDimensao: 'nucleo',
    perguntas: [
      q(1, 'O ecossistema de dados é saudável (qualidade, acessibilidade, governança) ou fragmentado?', 'Inventário de fontes; problemas de qualidade; governança ativa'),
      q(2, 'Os agentes e soluções de IA têm acesso a contexto estruturado da empresa, ou cada solução busca o contexto do zero?', 'Arquitetura de contexto; uso de RAG/vector DB; catálogos'),
      q(3, 'Existem sistemas internos de conhecimento que a IA consegue usar de forma confiável e governada?', 'Fontes de conhecimento; exemplos de uso por IA; controle de acesso'),
      q(4, 'Como vocês governam quais dados a IA pode acessar e expor? Há controles de PII?', 'Política de dados para IA; controles de PII; exemplos de bloqueio'),
      q(5, 'Há camada de contexto padronizada (RAG, grafo, ontologia) ou cada solução trata individualmente?', 'Arquitetura de RAG/grafos; padronização; adoção'),
      q(6, 'Como a qualidade dos dados impacta os outputs de IA? Vocês medem isso?', 'Exemplos de falha por dado ruim; métricas de qualidade')
    ]
  },
  {
    codigoFramework: 'D7',
    nome: 'Segurança & Qualidade Integrada (QA)',
    descricao: 'Velocidade sem dívida de segurança: SAST/SCA codificado, least agency, testes de não-determinismo.',
    ordem: 7,
    peso: 1 / 9,
    tipoDimensao: 'nucleo',
    perguntas: [
      q(1, 'As regras de segurança são codificadas (pre-commit hooks, SAST/SCA obrigatório) ou prometidas (prompt/política)?', 'Configuração de pre-commit; gates no CI/CD; exemplo de bloqueio'),
      q(2, 'Como vocês validam código gerado por IA antes do merge? Há automação ou é revisão manual?', 'Processo de validação; tempo de revisão; cobertura'),
      q(3, 'QA está integrado ao ciclo de desenvolvimento ou acoplado no final como fase separada?', 'Posição do QA no pipeline; cobertura de testes'),
      q(4, 'Como testam componentes não-determinísticos (alucinação, estabilidade de agentes, viés)?', 'Estratégia de teste para IA; exemplos de falha capturada'),
      q(5, 'Vocês monitoram secrets expostos no código gerado por IA e pacotes inexistentes (slopsquatting)?', 'Ferramentas de secrets scanning; exemplo de bloqueio'),
      q(6, 'Agentes operam com least agency (privilégio mínimo) e human-in-the-loop em ações destrutivas?', 'Configuração de permissões; exemplos de human-in-the-loop'),
      q(7, 'Vocês medem a dívida de segurança que a velocidade de IA está criando?', 'Relatórios SAST/SCA; tendência histórica; dívida acumulada')
    ]
  },
  {
    codigoFramework: 'D8',
    nome: 'Modernização & Sustentação de Legado',
    descricao: 'Legado que bloqueia IA e operação de agentes em produção (observabilidade, drift).',
    ordem: 8,
    peso: 1 / 9,
    tipoDimensao: 'nucleo',
    perguntas: [
      q(1, 'Quanto do seu legado bloqueia a adoção de IA? Vocês têm um mapa desse legado e dos bloqueios?', 'Inventário de legado; mapa de bloqueios; % orçamento em KTLO'),
      q(2, 'A estratégia de modernização é deliberada (rewrite vs. wrapper vs. re-arquitetura) ou ad-hoc?', 'Estratégia documentada; exemplos de decisão deliberada'),
      q(3, 'Vocês usam abordagem spec-first (reconstruir a intenção antes de traduzir o código) ou tradução direta?', 'Exemplos de modernização; abordagem adotada; qualidade do output'),
      q(4, 'Modernização é projeto big-bang ou capacidade incremental contínua com o sistema em produção?', 'Projetos em andamento; frequência de entregas incrementais'),
      q(5, 'Como vocês operam agentes em produção? Há observabilidade (latência, drift, custo, rollback)?', 'Dashboard de agentes; alertas ativos; exemplos de rollback'),
      q(6, 'As operações usam AIOps/agentes com validação pré/pós e auditoria?', 'Exemplos de AIOps; automação operacional; trilha de auditoria')
    ]
  },
  {
    codigoFramework: 'D9',
    nome: 'FinOps, Valor & Apoio ao Negócio',
    descricao: 'Unit economics de IA, FinOps gate no CI/CD, conexão esforço de engenharia com impacto.',
    ordem: 9,
    peso: 1 / 9,
    tipoDimensao: 'nucleo',
    perguntas: [
      q(1, 'Vocês têm unit economics de IA (custo por inferência, por feature, por chamada de agente) ou só gasto agregado?', 'Dashboard de unit economics; granularidade do custo'),
      q(2, 'Há FinOps gate no CI/CD sinalizando aumento de custo de inferência antes do deploy?', 'Configuração de FinOps gate; exemplos de alerta'),
      q(3, 'A previsão orçamentária captura o custo de inferência por token (auto-escalável) ou só licenças fixas?', 'Modelo de previsão; histórico de surpresas de custo'),
      q(4, 'A IA está acelerando features que importam ao usuário ou só aumentando volume de código?', 'Métricas de impacto ao usuário; NPS/CSAT; features entregues'),
      q(5, 'Como vocês conectam o esforço de engenharia a impacto de negócio mensurável?', 'OKRs de engenharia ligados a negócio; exemplos de medição'),
      q(6, 'Vocês usam o hardware certo para inferência vs. GPUs de treino superdimensionadas?', 'Inventário de infra de IA; análise de right-sizing')
    ]
  },
  {
    codigoFramework: 'D10',
    nome: 'Fábrica Agêntica de Software',
    descricao: 'SDLC agêntico ponta a ponta — score próprio, não entra na média das 9 dimensões núcleo.',
    ordem: 10,
    peso: 0,
    tipoDimensao: 'especializada_fora_media',
    perguntas: [
      q(1, 'Como as demandas de negócio (User Stories / Product Backlog) são processadas pela IA na fábrica?', 'Fluxo de ingestão; exemplos de backlog gerado por IA'),
      q(2, 'Qual é o tamanho do escopo que a IA consegue codificar de forma independente?', 'Exemplos de componentes/serviços gerados por IA'),
      q(3, 'Como a IA tem acesso às regras de arquitetura, padrões técnicos e base de código da empresa?', 'RAG, repositório Git, contexto manual ou dinâmico'),
      q(4, 'De que forma os agentes atuam na validação e garantia de qualidade do software?', 'Testes automatizados; agentes de QA'),
      q(5, 'Como a IA interage com o pipeline de entrega contínua da fábrica?', 'Pipelines automatizados; evidências de deploy/rollback'),
      q(6, 'O que acontece quando o código gerado apresenta falhas de compilação ou de execução?', 'Self-healing no CI/CD ou produção; exemplos de correção automática'),
      q(7, 'Como os diferentes modelos ou instâncias de IA cooperam dentro da fábrica?', 'Diagrama de agentes; exemplos de handoff multiagente'),
      q(8, 'Como a fábrica garante a segurança, conformidade de licenças e ausência de vulnerabilidades no código produzido pela IA?', 'SAST/SCA; agente de segurança; trilha de auditoria')
    ]
  },
  {
    codigoFramework: 'D11',
    nome: 'Conformidade Regulatória de IA',
    descricao: 'ISO 42001, PL 2.338/2023, LGPD aplicada à IA, NIST AI RMF.',
    ordem: 11,
    peso: 1 / 9,
    tipoDimensao: 'nucleo',
    perguntas: [
      q(1, 'A organização tem um Sistema de Gestão de IA (SGAI) com escopo definido, nos termos da ISO 42001? Mostre a documentação.', 'Documento de escopo do SGAI; política de IA formal'),
      q(2, 'Existe inventário de sistemas de IA classificados por categoria de risco (proibido/alto risco/baixo risco), alinhado ao PL 2.338/2023?', 'Inventário de sistemas; matriz de classificação de risco'),
      q(3, 'Para sistemas de IA que processam dados pessoais, qual é a base legal documentada (LGPD art. 7º)? O DPO participa da aprovação?', 'Documentação de base legal; ata de aprovação do DPO'),
      q(4, 'A organização já realizou uma Avaliação de Impacto Algorítmico (AIIA) ou DPIA para algum sistema de IA de alto risco?', 'AIIA/DPIA documentado; data e sistema avaliado'),
      q(5, 'Como a empresa garante o direito à explicação de decisões automatizadas (art. 20 LGPD / PL da IA)? Há processo de revisão humana?', 'Processo de revisão humana; exemplos de explicação fornecida a titular'),
      q(6, 'A organização mapeia sua maturidade de governança de risco de IA segundo as 4 funções do NIST AI RMF (Govern, Map, Measure, Manage)?', 'Autoavaliação NIST RMF; evidência de cada função'),
      q(7, 'Há auditoria interna ou externa periódica do SGAI e dos controles de conformidade de IA?', 'Relatório de auditoria; frequência; achados e planos de ação')
    ]
  }
];

export const SATF_FRAMEWORK_SEED = SATF_FRAMEWORK_SEED_RAW.map(anexarCriterios);

export const ORDEM_NOMES_SATF = SATF_FRAMEWORK_SEED.map((d) => d.nome);

export const FRAMEWORK_SEED_META = {
  frameworkMaturidade: FRAMEWORK_SATF_TI_V3,
  totalDimensoes: SATF_FRAMEWORK_SEED.length,
  totalPerguntas: SATF_FRAMEWORK_SEED.reduce((acc, d) => acc + d.perguntas.length, 0)
};

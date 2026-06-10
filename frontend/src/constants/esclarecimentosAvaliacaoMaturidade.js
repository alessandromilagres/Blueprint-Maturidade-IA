// Gerado a partir do documento Esclarecimentos_Enriquecidos_108_Perguntas_Blueprint_IA.docx.
// Conteúdo exibido ao avaliador: o que a pergunta avalia + exemplos por vertical.

export const ESCLARECIMENTOS_AVALIACAO_MATURIDADE = {
  "1.1": {
    "pergunta": "Existe uma estratégia clara de IA alinhada com objetivos de negócio?",
    "oQueAvalia": "Verifica se a organização possui documento formal que conecta IA diretamente aos objetivos estratégicos — com OKRs, responsáveis e critérios de sucesso definidos. Não basta \"querer usar IA\": a estratégia deve responder por quê, onde, com quais recursos e como medir sucesso.",
    "exemplosPorVertical": [
      "Indústria/Manufatura: Fabricante cerâmico define IA como pilar da meta OEE>92% com roadmap de 3 anos integrando manutenção preditiva e visão computacional.",
      "Serviços Financeiros: Banco médio documenta IA como alavanca para aprovar crédito em <30s e reduzir inadimplência em 15 pontos-base, com revisão semestral vinculada ao BSC.",
      "Varejo: Grupo com 400 lojas conecta IA à meta de reduzir perdas em 20% via previsão de demanda — dono, orçamento e KPI definidos por unidade.",
      "Consultoria/TI: Empresa de serviços define IA como diferencial para entregar projetos com squads 40% menores — estratégia presente no board deck trimestral."
    ]
  },
  "1.2": {
    "pergunta": "O C-Level está engajado e patrocinando iniciativas de IA?",
    "oQueAvalia": "Mede o nível de envolvimento real — não declaratório — da alta liderança. Patrocínio executivo: CEO/CTO/CDO defende budget no board, desbloqueia barreiras políticas e usa as ferramentas de IA no próprio trabalho.",
    "exemplosPorVertical": [
      "Saúde: Presidente de rede hospitalar participa mensalmente do AI Review Board e usa dashboard de IA para acompanhar indicadores de qualidade assistencial.",
      "Varejo: CEO de varejista de moda apresenta cases de IA ao board trimestral — item \"IA\" sempre nos primeiros 15 min da pauta.",
      "Agronegócio: CTO de cooperativa lidera pessoalmente programa de drones com IA, participando de demos de campo com produtores.",
      "Logística: CFO patrocina IA em roteirização como meta oficial de EBITDA — não deixa a iniciativa apenas com TI."
    ]
  },
  "1.3": {
    "pergunta": "Há um orçamento dedicado e aprovado para IA?",
    "oQueAvalia": "Verifica se existe linha orçamentária específica para IA — separada do budget geral de TI — com valor aprovado, responsável e prestação de contas. Orçamentos plurianuais (2-3 anos) indicam maturidade alta.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Banco regional aprova R$12M/ano dedicado a IA — 40% plataforma, 35% pessoas, 25% projetos — separado do TI tradicional.",
      "Indústria: Fabricante destina 2,5% do faturamento para transformação com IA, revisado trimestralmente com demonstração de ROI.",
      "Varejo: Rede cria \"AI Fund\" de R$5M plurianual — cada iniciativa demonstra payback <18 meses para renovação.",
      "Saúde: Hospital recebe budget separado de R$3M para IA em diagnóstico de imagem, cofinanciado por parceiro de equipamentos."
    ]
  },
  "1.4": {
    "pergunta": "Existe um Chief AI Officer ou responsável por IA?",
    "oQueAvalia": "Identifica se há liderança formal com poder de decisão real — mandato para definir estratégia, aprovar arquitetura, resolver conflitos e reportar ao CEO ou board. Diferente de \"coordenador sem poder de decisão\".",
    "exemplosPorVertical": [
      "Banco: CAIO com assento no Comitê Executivo, budget próprio de R$50M e equipe de 80 pessoas — supervisiona todos os modelos em produção e define políticas de uso ético.",
      "Varejo: CDO acumula função de AI Officer, dedica 60% do tempo a IA com equipe de 25 pessoas e participação em todas as decisões de produto digital.",
      "Saúde: \"Diretor de IA Clínica\" — médico com especialização em dados, responsável pela supervisão de modelos e accountability clínica dos sistemas.",
      "Consultoria/TI: \"Head of AI Enablement\" com reporte ao CTO — responsável pela plataforma interna e por habilitar squads com governança definida."
    ]
  },
  "1.5": {
    "pergunta": "A organização tem um roadmap de IA de 1-3 anos?",
    "oQueAvalia": "Avalia se há planejamento de médio prazo que define: quais casos de uso serão priorizados, em que sequência, com quais recursos e quando esperar resultados. Um bom roadmap considera dependências (dados antes de modelos, plataforma antes de escala), investe em capacidades habilitadoras e é revisado periodicamente.",
    "exemplosPorVertical": [
      "Indústria: Roadmap em 4 ondas: manutenção preditiva (0-6m), qualidade inline (7-12m), eficiência energética (13-18m), supply chain integrado (19-36m) — dependências explícitas entre ondas.",
      "Fintech: Mapeia roadmap em camadas: primeiro dados (quality, catalog), depois modelos (fraud, credit), depois experiência (personalização), depois ecossistema (open finance APIs).",
      "Varejo: Rede de farmácias começa por reposição automática de estoque (dados prontos, ROI rápido) e evolui para diagnóstico assistido (maior complexidade, maior impacto).",
      "Energia: Distribuidora mapeia IA em previsão de demanda, detecção de fraudes, manutenção de subestações e trading algorítmico — com revisão trimestral obrigatória."
    ]
  },
  "1.6": {
    "pergunta": "Há métricas de sucesso definidas para projetos de IA?",
    "oQueAvalia": "Mede se KPIs são definidos ANTES dos projetos e acompanhados sistematicamente — não apenas ao final. Métricas de IA incluem acurácia, precision/recall, drift, latência de inferência e impacto no negócio (R$, %, NPS).",
    "exemplosPorVertical": [
      "Logística: Define antes de cada modelo: acurácia mínima de 85%, latência <200ms, redução de 8% no custo de rota — projeto só vai a produção se todos os critérios forem atendidos.",
      "Saúde: Para modelo de triagem: sensibilidade mínima de 95% para casos críticos, especificidade de 80%, NPS do médico >7/10 — revisadas mensalmente.",
      "Serviços Financeiros: Separa métricas técnicas (Gini > 0,45) de métricas de negócio (redução de 15% em inadimplência nos primeiros 6 meses) — cada uma com owner distinto.",
      "Varejo: Modelo de recomendação medido por CTR, conversão incremental, lift em ticket médio e NPS pós-compra — dashboards de métricas com revisão mensal obrigatória."
    ]
  },
  "2.1": {
    "pergunta": "Existe um catálogo centralizado de dados?",
    "oQueAvalia": "Verifica se há inventário organizado e consultável de todos os dados — com metadados (dono, formato, atualização, qualidade), classificação de sensibilidade e descoberta automática. Sem catálogo, equipes de IA passam 40-60% do tempo procurando dados em vez de construir modelos. O catálogo é a fundação do Data Mesh e da democratização de IA.",
    "exemplosPorVertical": [
      "Varejo: DataHub (open source) com 50 sistemas legados — analista encontra a tabela de vendas certa em <3 min, com descrição de cada campo e data de última atualização.",
      "Saúde: Hospital indexa 800+ datasets clínicos com classificação LGPD automática — Data Steward de cada área valida qualidade mensalmente no próprio catálogo.",
      "Serviços Financeiros: Banco usa Collibra para dados regulatórios com linhagem automática mostrando de onde vêm os dados de cada relatório enviado ao BACEN.",
      "Indústria: Fabricante cataloga dados de 800 sensores, laboratório e supply chain — score de qualidade por tabela visível no catálogo antes de qualquer uso em modelos."
    ]
  },
  "2.2": {
    "pergunta": "Qual é a qualidade geral dos dados (completude, acurácia)?",
    "oQueAvalia": "Mede a confiabilidade dos dados para treinar e servir modelos. Dados de má qualidade são a causa número 1 de fracasso em IA — \"garbage in, garbage out\".",
    "exemplosPorVertical": [
      "Serviços Financeiros: 23% dos endereços de clientes desatualizados — modelo de propensão a churn com acurácia 18% menor por causa desse dado crítico ausente.",
      "Saúde: Hospital verifica que 31% dos campos de diagnóstico secundário ficam em branco em prontuários — modelo de readmissão precisa de estratégia de imputação explícita.",
      "Varejo: Implementa Data Quality Score por tabela (nota 0-100) — bloqueia automaticamente uso de dados com score <70 em modelos de produção.",
      "Indústria: Sensores de vibração de 15% das máquinas com calibração divergente gerando dados incorretos — detectado após modelo preditivo ter performance ruim no campo."
    ]
  },
  "2.3": {
    "pergunta": "Há ferramentas de MLOps implementadas (versionamento, CI/CD)?",
    "oQueAvalia": "Avalia se há infraestrutura para desenvolver, testar, versionar e colocar modelos em produção de forma consistente e automatizada. MLOps é para IA o que DevOps foi para software: elimina o gap entre pesquisa e produção. Sem MLOps, cada deploy de modelo leva semanas de trabalho manual e sem rastreabilidade. Ferramentas típicas: MLflow, Weights & Biases, Kubeflow, SageMaker, Azure ML.",
    "exemplosPorVertical": [
      "Consultoria/TI: Empresa implementa MLflow — qualquer modelo reproduzido exatamente em 1 clique, com todos os parâmetros e dataset de treino registrados.",
      "Serviços Financeiros: CI/CD para score de crédito — novo modelo passa por testes automatizados (acurácia, fairness, stress test) e vai a produção em <2 dias.",
      "Varejo: SageMaker Pipelines automatiza retreinamento mensal do modelo de previsão de demanda — sem intervenção manual, com alerta se performance degradar >5%.",
      "Saúde: Rede de laboratórios exige aprovação do médico responsável antes de qualquer modelo de diagnóstico ir a produção — MLflow garante rastreabilidade completa."
    ]
  },
  "2.4": {
    "pergunta": "A arquitetura suporta escalabilidade de modelos de IA?",
    "oQueAvalia": "Verifica se a infraestrutura técnica permite que soluções de IA cresçam de 100 para 1 milhão de requisições sem reescrita. Arquitetura escalável inclui: serving em containers (Docker/Kubernetes), auto-scaling baseado em demanda, separação entre treinamento e inferência, feature store e FinOps de GPU controlado.",
    "exemplosPorVertical": [
      "Fintech: Migra modelo de notebook para serving com KServe ao escalar para 500k análises/dia — sem reescrever o modelo, apenas a infraestrutura ao redor.",
      "Varejo: Feature Store (Feast) garante que o mesmo dado usado no treino é servido em produção — elimina o \"training-serving skew\" que degrada modelos em produção.",
      "Logística: Escala roteirização de 100 para 50.000 cálculos/hora usando GPU spot instances com auto-scaling — custo 70% menor que instâncias dedicadas.",
      "Indústria: GPUs embarcadas em câmeras de inspeção na linha de produção — inferência local <5ms sem latência de rede, retreinamento na nuvem mensalmente."
    ]
  },
  "2.5": {
    "pergunta": "Existem APIs padronizadas para acesso a dados?",
    "oQueAvalia": "Mede se os dados da empresa são acessíveis via interfaces programáticas documentadas, com autenticação, controle de acesso e versionamento. APIs de dados permitem que equipes de IA trabalhem de forma autônoma sem depender de DBAs para cada extração. No contexto de Data Mesh, APIs transformam dados em produtos. Sem APIs, IA fica refém de extrações manuais e planilhas por e-mail.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Banco cria API de dados de clientes com 15 endpoints documentados no Swagger — equipes de fraude, crédito e marketing acessam os mesmos dados de forma independente e auditável.",
      "Saúde: Hospital publica API FHIR (HL7) para dados clínicos — startups parceiras integram em dias ao invés de meses, com controle granular de quais dados cada parceiro acessa.",
      "Varejo: API de inventário em tempo real — modelo de recomendação nunca sugere produto em falta porque consulta diretamente a API, não uma cópia desatualizada.",
      "Logística: API de telemetria de frota — clientes B2B integram em seus sistemas de gestão para rastreamento em tempo real, gerando novo produto de dados monetizável."
    ]
  },
  "2.6": {
    "pergunta": "Há infraestrutura de computação (GPU/TPU) disponível?",
    "oQueAvalia": "Avalia se há poder computacional adequado para treinar e executar modelos — especialmente deep learning, visão computacional e LLMs. A questão não é possuir GPUs físicas, mas ter acesso previsível e a custo gerenciado ao poder computacional necessário. FinOps para GPU é crítico: custos podem explodir sem governança. A escolha entre on-premise, cloud e edge depende dos requisitos de latência, privacidade e volume.",
    "exemplosPorVertical": [
      "Saúde: Hospital de pesquisa mantém cluster com 8 GPUs NVIDIA A100 on-premise para modelos de imagem médica — dados sensíveis de pacientes não saem do ambiente controlado.",
      "Varejo: E-commerce usa spot instances de GPU na AWS para treino mensal de modelos — custo 3x menor que instâncias dedicadas, com script de checkpoint para retomar em interrupção.",
      "Consultoria/TI: Usa Azure OpenAI e fine-tuning APIs — sem necessidade de GPUs próprias, usando modelos fundacionais como base com customização via RAG e fine-tuning.",
      "Indústria: GPUs embarcadas em câmeras de inspeção inline — inferência local <5ms sem latência de rede, modelo retreinado mensalmente na nuvem com dados novos."
    ]
  },
  "3.1": {
    "pergunta": "Existe um framework de governança de IA definido?",
    "oQueAvalia": "Verifica se há políticas e processos formais para todo o ciclo de vida de IA: concepção (qual problema resolve?), desenvolvimento (como treinamos com responsabilidade?), deploy (quem aprova?), operação (quem monitora?) e descontinuação (quando desligar?). A ISO 42001 é o padrão internacional que formaliza esse framework e é crescentemente exigida por clientes corporativos e parceiros.",
    "exemplosPorVertical": [
      "Serviços Financeiros: AI Policy com 4 documentos formais: política de uso aceitável, processo de aprovação por nível de risco, responsabilidades por papel e procedimento de incidentes — todos no portal de compliance.",
      "Saúde: Hospital adota ISO 42001 como referência — cada modelo passa por \"AI Impact Assessment\" obrigatório com aprovação do Comitê de Ética em Pesquisa antes do desenvolvimento.",
      "Varejo: AI Governance Board com reunião quinzenal — aprova modelos novos, monitora riscos em produção e define limites de autonomia para cada tipo de aplicação.",
      "Consultoria/TI: Publica \"AI Principles\" externamente e políticas internas no Notion — qualquer colaborador acessa as regras para uso de IA com clientes em menos de 1 minuto."
    ]
  },
  "3.2": {
    "pergunta": "Há conformidade com LGPD/GDPR nos projetos de IA?",
    "oQueAvalia": "Mede se projetos de IA seguem a LGPD (Lei 13.709/2018) e, se aplicável, o GDPR europeu. Para IA, a LGPD impõe: base legal para tratamento automatizado (art. 20), direito de revisão humana em decisões que afetem o titular e transparência sobre uso de dados. O RIPD (Relatório de Impacto à Proteção de Dados) é obrigatório para processos com risco potencial aos titulares. \"Privacy by design\" — incorporar privacidade desde o início — é o padrão de maturidade esperado.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Banco documenta base legal para cada modelo — DPIA completo para score de crédito com \"legítimo interesse\", cliente pode solicitar revisão humana em qualquer decisão automatizada.",
      "RH/Consultoria: Triagem de currículos por IA auditada para viés de gênero e etnia, com explicação disponível para candidatos reprovados (LGPD art. 20).",
      "Saúde: Dados de saúde tratados como \"dados sensíveis\" (LGPD art. 11) — consentimento explícito documentado, anonimização antes do treinamento, opt-out disponível para cada paciente.",
      "Varejo: Modelo de recomendação com opt-out disponível no app, política de privacidade atualizada sobre IA e prazo de retenção definido para dados de comportamento."
    ]
  },
  "3.3": {
    "pergunta": "Existe um comitê de ética em IA?",
    "oQueAvalia": "Avalia se há fórum formal onde implicações éticas de IA — discriminação, privacidade, transparência, responsabilidade — são debatidas ANTES de incidentes acontecerem. O comitê pode ser um subcomitê de governança existente.",
    "exemplosPorVertical": [
      "Serviços Financeiros: \"AI Ethics Committee\" com representantes de Compliance, Jurídico, TI, Negócios e membro externo independente — reúne-se mensalmente com poder formal de veto sobre modelos de alto risco.",
      "Saúde: \"Comitê de IA Clínica\" com médicos especialistas, enfermeiros, gestores e representante de pacientes — avalia vieses em populações vulneráveis antes de qualquer deploy clínico.",
      "RH/Varejo: AI Ethics Board com especialista em diversidade e inclusão — avalia especificamente modelos de gestão de pessoas para viés sistêmico e impacto em grupos protegidos.",
      "Consultoria/TI: \"Responsible AI Review\" integrado ao pipeline de desenvolvimento — todo modelo acima de nível de risco definido passa por revisão de 3 pessoas antes do go-live."
    ]
  },
  "3.4": {
    "pergunta": "Há processos para identificar e mitigar vieses em modelos?",
    "oQueAvalia": "Verifica se modelos são sistematicamente testados contra vieses discriminatórios (gênero, raça, idade, região, renda) antes de colocá-los em produção e monitorados durante a vida útil em produção. Viés em IA não é apenas problema ético — é risco regulatório crescente. Ferramentas acessíveis: Fairlearn (Microsoft) e AI Fairness 360 (IBM).",
    "exemplosPorVertical": [
      "Serviços Financeiros: Banco testa modelo de crédito contra 12 grupos protegidos — relatório de fairness é anexo obrigatório à documentação de qualquer modelo novo ou atualizado.",
      "RH: E-commerce audita triagem de currículos com AI Fairness 360 — descobre penalização a candidatos de certas universidades públicas e recalibra antes do go-live.",
      "Saúde: Hospital monitora se modelo de triagem classifica corretamente residentes de regiões periféricas — detectou e corrigiu sub-representação no dataset de treinamento.",
      "Varejo: Verifica mensalmente se precificação dinâmica não cria preços diferentes por CEP com perfil demográfico específico — auditoria com dados anonimizados por região."
    ]
  },
  "3.5": {
    "pergunta": "Existe gestão de riscos específica para projetos de IA?",
    "oQueAvalia": "Mede se riscos específicos de IA — diferentes dos riscos de TI tradicionais — são mapeados e mitigados sistematicamente. Riscos típicos de IA: data drift (modelo degrada por mudança nos dados), alucinações de LLMs, adversarial attacks, vendor lock-in em modelos de terceiros, explicabilidade insuficiente para reguladores e risco operacional de modelos autônomos.",
    "exemplosPorVertical": [
      "Logística: \"AI Risk Register\" com 25 riscos catalogados por modelo em produção — cada risco tem probabilidade, impacto financeiro estimado, dono e plano de mitigação, revisado trimestralmente.",
      "Serviços Financeiros: Banco classifica modelos por nível de risco (Baixo/Médio/Alto/Crítico) — modelos Críticos têm fallback automático para regras determinísticas se performance degradar além do limiar.",
      "Saúde: Mapeia risco de \"automation bias\" — médicos aceitando sugestão da IA sem análise crítica — e inclui treinamento específico no protocolo de uso de cada ferramenta.",
      "Varejo: Identifica risco de \"feedback loop\" em recomendações (modelo recomenda populares → fica ainda mais populares) e implementa diversification constraint para mitigar."
    ]
  },
  "3.6": {
    "pergunta": "Há auditoria regular dos modelos de IA em produção?",
    "oQueAvalia": "Avalia se modelos em produção são revisados periodicamente para garantir: (1) performance continua adequada sem drift, (2) dados de entrada dentro da distribuição esperada, (3) modelo está sendo usado conforme especificado e (4) resultados ainda são explicáveis e justificáveis para reguladores. Sem auditoria regular, um modelo pode deteriorar silenciosamente por meses.",
    "exemplosPorVertical": [
      "Serviços Financeiros: \"Model Validation Annual Review\" — time independente de Auditoria Interna avalia performance, viés e conformidade antes de renovar aprovação de modelos regulatórios.",
      "Saúde: Auditoria trimestral — compara predições do modelo com diagnóstico final dos médicos; detectou degradação de 8% em 18 meses e acionou retreinamento imediato.",
      "Varejo: Auditoria automática mensal de modelo de pricing — se desvio padrão dos preços sugeridos aumenta >15%, alerta imediato para revisão humana antes de qualquer ação.",
      "Logística: \"Shadow mode\" para modelos críticos — novo modelo roda em paralelo por 30 dias antes de assumir produção, gerando comparação auditável entre versões."
    ]
  },
  "4.1": {
    "pergunta": "Há talentos de IA na equipe (cientistas de dados, engenheiros de ML)?",
    "oQueAvalia": "Verifica se a organização possui profissionais qualificados em IA internamente ou depende totalmente de terceiros para capacidades críticas. Dependência total cria risco estratégico: a empresa não aprende, não retém conhecimento e fica refém de fornecedores.",
    "exemplosPorVertical": [
      "Varejo: Inicia com 3 Data Scientists e 2 Data Engineers internos — equipe pequena mas suficiente para projetos prioritários, parceiro externo apenas para os menos críticos.",
      "Serviços Financeiros: Banco contrata equipe de 40 pessoas em IA em 2 anos — mix deliberado de Data Scientists, ML Engineers e AI Product Managers com experiência em fintech.",
      "Saúde: Parceria com universidade: 2 pesquisadores embedded na equipe de TI, transferindo conhecimento enquanto desenvolvem projetos clínicos reais com impacto documentado.",
      "Indústria: Cria programa \"Data Engineer Trainee\" — forma 10 engenheiros industriais em dados por ano, priorizando quem já conhece o processo produtivo da fábrica."
    ]
  },
  "4.2": {
    "pergunta": "Existe programa de capacitação em IA para funcionários?",
    "oQueAvalia": "Mede se há investimento sistemático em desenvolver habilidades de IA — não apenas treinamentos pontuais, mas trilhas estruturadas por nível e papel: desde AI Literacy (para todos os funcionários) até certificações avançadas (para equipes técnicas). O conceito de \"democratização de IA\" — não apenas a equipe técnica, mas gestores e operadores usando ferramentas de IA — é o que separa Nível 3 do Nível 4-5.",
    "exemplosPorVertical": [
      "Varejo: 3 trilhas: \"Usuário de IA\" (todos os funcionários, 8h online), \"Analista com IA\" (gestores, 24h com projetos práticos) e \"Desenvolvedor de IA\" (técnicos, 80h + certificação AWS ML Specialty).",
      "Serviços Financeiros: \"AI Passport\" — colaborador acumula horas de treinamento em IA e recebe reconhecimento formal com impacto real na avaliação de desempenho semestral.",
      "Indústria: Parceria com SENAI para \"Operador de IA Industrial\" — técnicos de manutenção aprendem a usar e interpretar resultados de modelos de manutenção preditiva na fábrica.",
      "Saúde: Todos os médicos residentes treinados em \"AI Literacy Clínica\" — como interpretar sugestões de IA, quando confiar, quando questionar e como documentar discordâncias."
    ]
  },
  "4.3": {
    "pergunta": "A cultura organizacional é favorável à experimentação?",
    "oQueAvalia": "Avalia se a organização aceita que experimentos de IA possam e devam falhar como parte do processo de inovação. Cultura de experimentação em IA tem características específicas: processo formal para testar ideias rapidamente, falhas documentadas e compartilhadas como aprendizado, líderes demonstrando tolerância ao risco calculado e recursos alocados para experimentos sem garantia de retorno.",
    "exemplosPorVertical": [
      "Fintech: CEO compartilha mensalmente no all-hands um \"experimento que fracassou e o que aprendemos\" — cria segurança psicológica para times testarem sem medo de punição.",
      "Varejo: 10% do tempo de squads para experimentação livre — projetos resultantes apresentados em \"AI Demo Day\" trimestral, com reconhecimento para as melhores ideias.",
      "Indústria: \"Fábrica de Experimentos\" — qualquer funcionário submete ideia de IA, time técnico valida viabilidade em 2 dias, executa PoC em 30 dias se aprovado.",
      "Consultoria/TI: \"Fail fast awards\" para projetos que provaram hipótese incorreta de forma rápida e documentada — aprender rápido é tão valorizado quanto acertar."
    ]
  },
  "4.4": {
    "pergunta": "Há plano de carreira definido para profissionais de IA?",
    "oQueAvalia": "Verifica se existem trilhas de crescimento claras para reter talentos — com critérios de promoção objetivos, bandas salariais competitivas e múltiplas trajetórias (técnica vs. gestão). Sem plano estruturado, profissionais de IA saem em 18-24 meses para empresas tech que oferecem progressão clara.",
    "exemplosPorVertical": [
      "Banco: Trilha dupla: \"Técnica\" (Júnior→Pleno→Sênior→Staff→Principal) e \"Liderança\" (Tech Lead→Head de IA) — com bandas salariais publicadas internamente, sem mistério sobre o que é preciso para crescer.",
      "Varejo: Critérios objetivos para promoção de ML Engineers: modelos em produção, impacto mensurável documentado, contribuições técnicas ao time — revisão semestral com feedback estruturado.",
      "Indústria: Certificações externas (AWS ML Specialty, TensorFlow Developer) associadas à progressão de carreira — empresa paga a certificação, colaborador recebe aumento ao passar."
    ]
  },
  "4.5": {
    "pergunta": "Existe colaboração entre áreas técnicas e de negócio?",
    "oQueAvalia": "Mede o nível real de integração entre quem desenvolve IA (Data Scientists, Engenheiros) e quem usa os resultados (gestores, analistas, operadores). Colaboração genuína: times de negócio participam da definição do problema; técnicos entendem o impacto operacional dos modelos; há rituais regulares de alinhamento.",
    "exemplosPorVertical": [
      "Varejo: Squads multidisciplinares permanentes: 1 Data Scientist + 1 Data Engineer + 1 Product Manager + 2 especialistas de negócio — objetivo compartilhado, sem hierarquia entre técnico e negócio.",
      "Serviços Financeiros: \"Data Domain Owner\" — executivo de negócio responsável por cada domínio de dados (clientes, produtos, transações) com autoridade para definir casos de uso prioritários.",
      "Saúde: \"AI Clinical Champions\" — médicos que atuam como ponte entre TI e clínica, traduzindo necessidades clínicas em requisitos técnicos e validando modelos no fluxo real de trabalho.",
      "Logística: \"Business-Tech Retrospective\" mensal — negócio e tech juntos avaliam o que funcionou, o que não funcionou e o que precisa de ajuste nos modelos e nos processos."
    ]
  },
  "4.6": {
    "pergunta": "A empresa consegue atrair e reter talentos de IA?",
    "oQueAvalia": "Avalia a capacidade da empresa de competir por talentos escassos no mercado de IA, onde a demanda supera a oferta em 3-4x. Atração inclui: proposta de valor clara (EVP), marca empregadora em tech e projetos desafiadores com visibilidade. Retenção inclui: salários competitivos, ambiente de aprendizado contínuo, autonomia técnica e impacto real e mensurável. Turnover acima de 20% ao ano indica risco estratégico — profissionais levam conhecimento crítico sobre os modelos.",
    "exemplosPorVertical": [
      "Fintech: Publica cases técnicos no LinkedIn — aumenta em 40% as candidaturas de Data Scientists ao mostrar problemas desafiadores e tecnologia de ponta em uso real.",
      "Indústria: Parceria com UNICAMP e USP — residência de pesquisadores, co-publicações de papers científicos, recrutamento direto da pós-graduação, turnover reduzido para 8%.",
      "Varejo: \"AI Transparency Report\" anual — publica projetos mais impactantes, modelos em produção e aprendizados, posicionando-se como empresa tech para candidatos exigentes.",
      "Saúde: Ambiente de pesquisa publicável — Data Scientists podem co-publicar em revistas científicas indexadas, atraindo talentos que querem impacto social e reconhecimento acadêmico."
    ]
  },
  "5.1": {
    "pergunta": "Existem modelos de IA em produção gerando valor?",
    "oQueAvalia": "Verifica se há modelos que saíram do PoC e estão efetivamente gerando valor real e mensurável para o negócio — não apenas sendo executados, mas com impacto documentado em receita, custo ou satisfação. A diferença entre \"em produção\" e \"gerando valor\" é crítica: muitas empresas têm modelos que ninguém usa ou cujo impacto não é medido.",
    "exemplosPorVertical": [
      "Serviços Financeiros: 45 modelos em produção com valor documentado: score de crédito (+R$120M de carteira aprovada), fraud detection (-R$18M em perdas), churn prevention (+12% de retenção de clientes).",
      "Varejo: 8 modelos com dashboard de valor: previsão de demanda (reduz ruptura 22%), precificação dinâmica (+4% de margem), recomendação (+8% de ticket médio).",
      "Saúde: 3 modelos com impacto medido: triagem de risco (-18% de readmissão hospitalar), agendamento inteligente (+15% de utilização de salas), detecção de imagem (-95% de laudos perdidos).",
      "Logística: Modelo de roteirização com IA economiza R$2,3M/mês em combustível — rastreado em painel executivo com comparação ao baseline pré-implementação."
    ]
  },
  "5.2": {
    "pergunta": "Há automação de processos com IA?",
    "oQueAvalia": "Mede quantos processos de negócio foram efetivamente automatizados ou augmentados com IA — além de experimentos isolados. Automação com IA vai além de RPA básico: inclui decisões automatizadas (aprovação de crédito, triagem de ocorrências), geração de conteúdo (relatórios automáticos), e processos cognitivos (leitura de documentos, análise de contratos).",
    "exemplosPorVertical": [
      "Serviços Financeiros: 80% das análises de crédito para PMEs automatizadas — modelo decide para contratos <R$50k, humano revisa para >R$50k. De 3 dias para 4 horas na média.",
      "Saúde: Classificação de exames como \"normal/anômalo\" automatizada — radiologistas revisam apenas os 30% classificados como anômalos, backlog reduzido em 60% em 6 meses.",
      "Varejo: 70% das respostas de SAC automatizadas com chatbot com IA — agente humano foca nos 30% complexos; CSAT aumentou 15 pontos porque atendimento ficou mais rápido.",
      "Logística: Cotação de frete automatizada com IA — cliente insere origem/destino, IA calcula preço ótimo em <1s considerando demanda, capacidade e histórico. De 24h para imediato."
    ]
  },
  "5.3": {
    "pergunta": "Existe SLA definido para modelos de IA?",
    "oQueAvalia": "Avalia se há acordos formais de nível de serviço para modelos de IA em produção — especificando disponibilidade, latência, acurácia mínima e procedimentos de degradação. SLAs de IA são mais complexos que de software tradicional: além de uptime, incluem métricas de qualidade do output (acurácia, precisão, recall) e limites de degradação aceitável antes de ativar fallbacks. Sem SLA, a empresa descobre que o modelo falhou pelo impacto no negócio.",
    "exemplosPorVertical": [
      "Serviços Financeiros: SLA para modelo de fraude: 99,95% de disponibilidade, <50ms de latência P99, precisão mínima de 85% — abaixo do limite, circuit breaker ativa regras estáticas automaticamente.",
      "Varejo: Recomendação com <200ms em 95% das requisições, mínimo de 5 itens relevantes recomendados, degradação elegante para recomendação por popularidade se modelo indisponível.",
      "Logística: Roteirização com resposta em <2 min para 99% das solicitações, rotas dentro de 3% do ótimo calculado, failover manual disponível 24/7 com procedimento documentado."
    ]
  },
  "5.4": {
    "pergunta": "Há integração de IA com sistemas legados?",
    "oQueAvalia": "Verifica se soluções de IA estão conectadas aos sistemas existentes da empresa — ERP, CRM, MES (Manufatura), PEP (Saúde), core bancário — de forma bidirecional: IA recebe dados dos sistemas e os sistemas recebem decisões/recomendações da IA. Integração é frequentemente o maior desafio técnico em projetos de IA em empresas estabelecidas: os dados que a IA precisa estão espalhados em sistemas com APIs inexistentes ou documentação insuficiente.",
    "exemplosPorVertical": [
      "Indústria: Modelo preditivo integrado ao SAP PM — quando detecta anomalia em sensor, cria automaticamente ordem de trabalho de manutenção no ERP sem intervenção humana.",
      "Saúde: Modelo de triagem integrado ao sistema de prontuário (SOUL MV) via HL7 FHIR — médico vê recomendação diretamente no fluxo de atendimento, sem acessar sistema separado.",
      "Varejo: Modelo de previsão integrado ao sistema de reposição — pedidos gerados automaticamente no ERP quando estoque fica abaixo do nível ótimo calculado pelo modelo.",
      "Serviços Financeiros: Score de crédito integrado ao sistema de concessão via API REST — agente de relacionamento vê score em tempo real na tela do CRM durante atendimento."
    ]
  },
  "5.5": {
    "pergunta": "Existe processo de deploy contínuo para modelos de IA?",
    "oQueAvalia": "Mede a capacidade de atualizar modelos em produção de forma rápida, segura e reproduzível — sem depender de janelas de manutenção longas ou intervenções manuais de especialistas únicos. CI/CD para IA (MLOps) inclui: testes automáticos de regressão de performance, deploy gradual (canary, blue-green), rollback automático se métricas degradarem e aprovação humana para modelos críticos. Benchmark: Nível 2 = semanas; Nível 4 = dias; Nível 5 = horas.",
    "exemplosPorVertical": [
      "Consultoria/TI: Pipeline MLOps completo em <4h: código → testes unitários → validação de performance → aprovação de 2 pessoas → staging → smoke test → produção com rollback automático.",
      "Serviços Financeiros: Blue-green deployment para modelos de score — novo modelo ativa para 5% do tráfego, monitora por 48h, expande para 100% se métricas OK. Sem downtime algum.",
      "Varejo: Retreinamento automático semanal de modelo de recomendação — pipeline totalmente automatizado, com aprovação humana somente se acurácia cair mais de 5% vs. versão anterior.",
      "Saúde: Aprovação do médico responsável obrigatória em qualquer update de modelo clínico — pipeline automatiza testes técnicos, humano valida clinicamente antes do deploy final."
    ]
  },
  "5.6": {
    "pergunta": "Há monitoramento de performance dos modelos em produção?",
    "oQueAvalia": "Avalia se há observabilidade real para detectar degradação de modelos (model drift, data drift, concept drift) antes que o impacto chegue ao negócio. Monitoramento de IA inclui: métricas de input (distribuição dos dados que chegam ao modelo), métricas de output (distribuição das predições), métricas de negócio (impacto real) e alertas automáticos quando qualquer métrica sai da faixa esperada. Ferramentas: Evidently AI, WhyLabs, Arize Platform.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Distribuição diária do score de crédito monitorada — mudança >2 desvios padrões dispara alerta automático para o time de modelagem revisar se há data drift real.",
      "Varejo: Taxa de clique em recomendações monitorada em tempo real — degradação de 8% para 5% de CTR dispara alerta e inicia retreinamento automático com dados mais recentes.",
      "Saúde: Acurácia retrospectiva do modelo de diagnóstico verificada semanalmente: compara predição do modelo com diagnóstico final registrado pelo médico — drift detectado antes de impactar pacientes.",
      "Logística: Custo real das rotas vs. custo previsto pelo modelo monitorado mensalmente — desvio >10% dispara investigação sobre mudanças no padrão de tráfego não capturadas."
    ]
  },
  "6.1": {
    "pergunta": "Existe um laboratório ou sandbox para experimentação de IA?",
    "oQueAvalia": "Verifica se há ambiente técnico dedicado onde equipes podem testar novas ideias com dados reais (ou sintéticos representativos), poder computacional adequado e ferramentas modernas — sem as restrições dos sistemas de produção. O sandbox é o antídoto para o \"PoC no laptop\": cria um ambiente controlado, reproduzível e compartilhado.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Sandbox com dados sintéticos que replicam distribuição real de clientes — Data Scientists testam novos modelos sem risco de violar LGPD e sem impactar sistemas de produção.",
      "Varejo: Ambiente com 1 ano de dados históricos, JupyterHub, MLflow e GPUs pré-configurados — acesso liberado para qualquer analista de negócio sem burocracia.",
      "Indústria: \"Digital Twin Lab\" — réplica digital da linha de produção onde modelos de otimização são testados com dados reais antes de qualquer implementação física.",
      "Consultoria/TI: Ambiente sandbox financiado centralmente pela empresa — equipes usam sem custo interno, removendo completamente a barreira financeira para experimentação."
    ]
  },
  "6.2": {
    "pergunta": "Há um processo para testar novas ideias de IA rapidamente?",
    "oQueAvalia": "Mede a velocidade com que ideias de IA podem ser validadas — da concepção ao primeiro resultado real. O benchmark de mercado para empresas Nível 4-5 é de 2-4 semanas para um PoC inicial. O processo inclui: canal para submeter ideias, critérios de priorização claros, equipe dedicada a MVPs, recursos pré-aprovados e rituais de apresentação de resultados. Sem processo estruturado, boas ideias morrem por burocracia ou por não encontrar a pessoa certa para executar.",
    "exemplosPorVertical": [
      "Varejo: \"AI Sprint\" de 2 semanas — qualquer funcionário propõe ideia, squad implementa PoC, apresentação ao negócio decide se investe ou descarta formalmente.",
      "Serviços Financeiros: \"Innovation Pipeline\" com 3 estágios: Ideia (1 semana, análise de viabilidade), PoC (4 semanas, protótipo funcional), Piloto (8 semanas, validação com usuários reais).",
      "Indústria: \"AI Hackathon\" trimestral — equipes mistas (técnico + operação) resolvem problema real em 48h; melhores ideias entram automaticamente no roadmap de desenvolvimento.",
      "Saúde: \"Clinical AI Incubator\" — médicos com ideias recebem suporte de um Data Scientist dedicado por 4 semanas para validar hipótese clínica com dados reais."
    ]
  },
  "6.3": {
    "pergunta": "A empresa acompanha e adota novas tecnologias de IA?",
    "oQueAvalia": "Avalia se há processo sistemático para monitorar o horizonte tecnológico de IA — não apenas acompanhar notícias, mas avaliar, priorizar e experimentar novas tecnologias de forma estruturada. O \"Technology Radar\" da ThoughtWorks é o modelo de referência: categoriza tecnologias em Adoptar, Experimentar, Avaliar e Evitar, revisado semestralmente. Em IA, 1-2 anos de atraso tecnológico significa uma geração inteira de capacidades não disponíveis.",
    "exemplosPorVertical": [
      "Consultoria/TI: \"AI Technology Radar\" interno com 4 categorias — Adoptar (GPT-4o para atendimento), Experimentar (Claude para código), Avaliar (multimodal para documentos), Evitar (AGI prematura).",
      "Varejo: \"Tech Scout\" dedicado que testa 2 novas ferramentas de IA por mês — relatório mensal distribuído para times de tecnologia e negócio com recomendação explícita de adoção ou rejeição.",
      "Serviços Financeiros: Participante de programa beta de modelos de IA — acesso antecipado a novas versões de LLMs permite antecipar oportunidades e riscos antes do mercado geral.",
      "Saúde: Parceria com 3 startups de IA médica em modo \"observação\" — acompanha evolução dos produtos antes de investir em piloto, reduzindo risco de apostar em tecnologia imatura."
    ]
  },
  "6.4": {
    "pergunta": "Existe colaboração com universidades, startups ou institutos?",
    "oQueAvalia": "Verifica se há parcerias externas estruturadas que alimentam o pipeline de inovação — não apenas projetos de consultoria transacional, mas colaborações de pesquisa, acesso a talentos, co-desenvolvimento e transferência de conhecimento. Universidades trazem pesquisa de ponta e talentos; startups trazem agilidade e tecnologias emergentes; institutos como FAPESP, CNPq e EMBRAPII viabilizam financiamento de P&D.",
    "exemplosPorVertical": [
      "Indústria: Parceria com IPT — universidade contribui com pesquisa avançada, empresa contribui com dados industriais reais; ambos publicam resultados e compartilham PI de forma estruturada.",
      "Serviços Financeiros: \"Residência de IA\" com USP e UNICAMP — pesquisadores trabalham 6 meses em problema real, após o qual são contratados ou retornam com publicação científica.",
      "Saúde: Parceria com 2 startups de diagnóstico por imagem — acesso antecipado ao produto em troca de dados anonimizados de treinamento, com co-authorship nas publicações.",
      "Varejo: Co-desenvolve modelo proprietário de previsão de demanda sazonal para o contexto brasileiro com empresa especializada em retail analytics, compartilhando IP de forma equitativa."
    ]
  },
  "6.5": {
    "pergunta": "Há processo para escalar experimentos bem-sucedidos?",
    "oQueAvalia": "Mede se há caminho claro e previsível do PoC para produção — evitando o \"PoC limbo\" onde experimentos bem-sucedidos nunca chegam à escala por falta de processo, recursos ou vontade política. O processo de graduação define: critérios de sucesso para avançar, quem decide, como o projeto ganha recursos e equipe para produção, e como o PoC se conecta ao portfólio de iniciativas.",
    "exemplosPorVertical": [
      "Varejo: Critérios formais de aprovação para escala: PoC demonstra ROI >3x em 90 dias, NPS de usuários >7, dados de qualidade suficiente e arquiteto de dados aprova escalabilidade técnica.",
      "Serviços Financeiros: \"AI Investment Committee\" mensal — decide quais PoCs viram projetos de produção, com budget pré-aprovado de R$200k para aprovados, sem processo orçamentário adicional.",
      "Consultoria/TI: \"Fast Track to Production\" — PoC aprovado pelo negócio recebe automaticamente squad de 3 pessoas por 3 meses, sem necessidade de abrir nova requisição de headcount.",
      "Saúde: \"Clinical Validation Gate\" — modelo que passou nos testes técnicos entra em piloto clínico com 3 médicos por 60 dias antes da decisão formal de escalar para todo o serviço."
    ]
  },
  "6.6": {
    "pergunta": "A empresa contribui para a comunidade de IA?",
    "oQueAvalia": "Avalia se há contribuições para o ecossistema externo de IA — open source, publicações técnicas, participação em conferências, datasets ou APIs públicas. Contribuição externa não é apenas generosidade: é estratégia deliberada de atração de talentos, construção de reputação técnica e influência no ecossistema. Empresas como Nubank, iFood e Mercado Livre publicam papers e mantêm projetos open source como estratégia de marca empregadora para Data Scientists.",
    "exemplosPorVertical": [
      "Consultoria/TI: Publica artigos técnicos no Medium e Substack sobre projetos de IA — aumenta candidaturas de Data Scientists em 60% e posiciona a empresa como referência técnica no mercado.",
      "Serviços Financeiros: Open-sources biblioteca Python de feature engineering para dados financeiros — 2.000 stars no GitHub, referência citada em 3 papers acadêmicos independentes.",
      "Varejo: Disponibiliza dataset anonimizado de comportamento de compras para pesquisadores — contribui para benchmarks públicos e ganha visibilidade na comunidade acadêmica.",
      "Saúde: Co-publica 4 papers por ano em revistas indexadas sobre IA clínica — reputação científica atrai parcerias internacionais e pesquisadores top para programas de residência."
    ]
  },
  "7.1": {
    "pergunta": "Existe um modelo de medição de ROI para projetos de IA?",
    "oQueAvalia": "Verifica se há metodologia padronizada para calcular retorno sobre investimento — antes (para priorização), durante (para acompanhamento) e depois (para aprendizado). ROI de IA é mais complexo que ROI de TI tradicional: inclui valor direto (receita, custo), indireto (satisfação, qualidade, velocidade) e estratégico (vantagem competitiva, capacidade futura).",
    "exemplosPorVertical": [
      "Varejo: \"IA Value Calculator\" com 4 categorias: receita incremental (vendas adicionais via recomendação), eficiência (horas economizadas), qualidade (redução de erros) e estratégico (velocidade de decisão).",
      "Serviços Financeiros: ROI em 3 horizontes distintos: eficiência operacional (medido em 3 meses), receita incremental (medido em 12 meses), novos modelos de negócio (medido em 3 anos).",
      "Saúde: Dois eixos de avaliação: econômico (ROI de 140% em 24 meses por redução de readmissões) e clínico (redução de 23% em eventos adversos — valor estratégico sem ROI financeiro direto).",
      "Logística: ROI calculado em cascata: redução de combustível → menor custo operacional → maior margem → reinvestimento em capacidade — cada nível rastreado com dados reais e auditáveis."
    ]
  },
  "7.2": {
    "pergunta": "Qual é o retorno médio sobre investimento dos projetos de IA?",
    "oQueAvalia": "Mede o ROI efetivo e documentado alcançado pelos projetos concluídos — não o projetado no pitch de aprovação, mas o realizado em produção. O ROI varia muito por tipo: IA de eficiência operacional tem payback mais rápido e previsível (6-18 meses); IA de receita tem ROI maior mas tardio e incerto; IA de experiência do cliente tem ROI difuso mas com valor estratégico comprovado.",
    "exemplosPorVertical": [
      "Serviços Financeiros: ROI médio de 280% para os 10 modelos de produção mais maduros — fraud detection: 450%, score de crédito: 220%, churn prevention: 180%, todos com metodologia auditável.",
      "Varejo: ROI médio de 180% em 12 meses para projetos de eficiência (previsão de demanda, reposição automática) e 95% em 24 meses para projetos de receita (recomendação, personalização).",
      "Logística: ROI de 320% em modelo de roteirização em 18 meses — investimento de R$1,2M gerou economia documentada de R$3,8M em combustível e horas-motorista.",
      "Saúde: ROI de 140% em 24 meses considerando redução de readmissões hospitalares; e redução de 23% em eventos adversos evitáveis como valor estratégico não financeiro adicional."
    ]
  },
  "7.3": {
    "pergunta": "Há metodologia para quantificar impacto em receita/custos?",
    "oQueAvalia": "Avalia se há forma rigorosa de atribuir valor financeiro específico às iniciativas de IA — separando o impacto da IA de outros fatores como sazonalidade, mercado ou outras iniciativas simultâneas. Técnicas robustas incluem: A/B testing (tratamento com IA vs. controle sem), difference-in-differences (comparação antes-depois com grupo de controle) e modelos econométricos de atribuição causal. Sem rigor metodológico, empresas sistematicamente superestimam ou subestimam o impacto real.",
    "exemplosPorVertical": [
      "E-commerce: A/B testing rigoroso — 50% dos usuários com recomendação por IA, 50% com recomendação por popularidade. Diferença de receita é o impacto puro da IA, isolado de sazonalidade e outros fatores.",
      "Serviços Financeiros: Modelo econométrico isola impacto do novo score de crédito — controla taxa de juros, desemprego e safra de carteira para medir efeito puro do modelo de IA.",
      "Saúde: Difference-in-differences: compara clínicas com e sem modelo de triagem — controla por mix de pacientes e sazonalidade para isolar impacto da IA em readmissões.",
      "Varejo: \"Holdout groups\" permanentes — 5% dos SKUs sempre sem IA de precificação para servir como grupo de controle perene ao medir impacto da precificação dinâmica."
    ]
  },
  "7.4": {
    "pergunta": "Projetos de IA estão alinhados com prioridades financeiras?",
    "oQueAvalia": "Verifica se as iniciativas de IA atacam as principais alavancas de valor da empresa — e não apenas os problemas mais fáceis de resolver com IA ou os que têm mais patrocínio político. Alinhamento financeiro significa: as 3-5 maiores oportunidades de impacto financeiro da empresa têm pelo menos um projeto de IA ativo.",
    "exemplosPorVertical": [
      "Varejo: Identifica 5 maiores alavancas financeiras (margem bruta, ruptura, turnover de estoque, lifetime value, custo de devolução) — cada alavanca com pelo menos 1 projeto de IA ativo e KPI ligado.",
      "Serviços Financeiros: As 3 metas do BSC (crescer carteira de crédito, reduzir inadimplência, aumentar NPS) têm projetos de IA correspondentes com metas formalmente conectadas.",
      "Logística: 80% do orçamento de IA alocado para as 3 maiores linhas de custo da empresa: combustível, manutenção e mão de obra — alinhamento explícito e revisado trimestralmente.",
      "Saúde: Iniciativas de IA conectadas às metas de qualidade da acreditação (JCI/ONA) — cada projeto tem \"owner\" de negócio responsável por demonstrar impacto nos indicadores de acreditação."
    ]
  },
  "7.5": {
    "pergunta": "Existe priorização de projetos baseada em valor?",
    "oQueAvalia": "Mede se há processo formal para priorizar o portfólio de projetos de IA por potencial de retorno — em vez de priorizar por facilidade técnica, pressão política ou ordem de chegada. Gestão de portfólio eficaz equilibra: curto vs. longo prazo; alto risco/alto impacto vs. baixo risco/impacto moderado; projetos habilitadores (infraestrutura, dados) vs. projetos de valor direto. Priorização por intuição desperdiça o recurso mais escasso: a capacidade de execução da equipe.",
    "exemplosPorVertical": [
      "Varejo: \"AI Value Matrix\" — eixo X: potencial de impacto financeiro (R$), eixo Y: viabilidade técnica (dados disponíveis, complexidade). Quadrante alto-alto priorizado automaticamente.",
      "Serviços Financeiros: \"AI Business Case Review\" trimestral — NPV em 3 cenários (conservador, base, otimista), comitê aloca budget proporcionalmente ao valor esperado por projeto.",
      "Consultoria/TI: \"IA Value Backlog\" priorizado por ICE Score (Impacto × Confiança × Facilidade de execução) — revisado a cada sprint com representantes de negócio e tecnologia.",
      "Saúde: \"Matriz Clínico-Econômica\" — combina impacto clínico (qualidade, segurança) e econômico (custo-efetividade) para priorizar projetos com validação do Comitê de IA."
    ]
  },
  "7.6": {
    "pergunta": "Como a empresa comunica valor da IA para stakeholders?",
    "oQueAvalia": "Avalia se há comunicação proativa, regular e clara dos resultados de IA para liderança, investidores e colaboradores — transformando números técnicos em narrativa de negócio compreensível. Comunicação eficaz inclui: dashboards executivos em linguagem de negócio (R$, %, NPS), relatórios periódicos para board, cases de sucesso compartilhados interna e externamente, e transparência sobre o que não funcionou. Visibilidade de valor é condição necessária para manter patrocínio executivo ao longo do tempo.",
    "exemplosPorVertical": [
      "Varejo: \"AI Monthly Report\" ao C-Level: 1 página com 5 métricas de impacto (R$), 2 cases de sucesso e 1 lição aprendida — formato fixo, linguagem de negócio pura, sem jargão técnico.",
      "Serviços Financeiros: Slide de IA em toda apresentação de board — impacto acumulado em R$, quantidade de modelos em produção e evolução do score de maturidade trimestral.",
      "Consultoria/TI: \"AI Annual Report\" externo — comunicação pública para clientes, candidatos e mercado sobre maturidade em IA, projetos de destaque e compromissos éticos assumidos.",
      "Saúde: Resultados de IA apresentados em grand rounds mensais — médicos recebem dados de impacto clínico dos modelos que usam no dia a dia, gerando engajamento e feedback de melhoria."
    ]
  },
  "7.7": {
    "pergunta": "Qual a expectativa de crescimento de receita com IA nos próximos 12 meses?",
    "oQueAvalia": "Mede a ambição de crescimento esperado via IA — baseada nos projetos aprovados e em execução, não em expectativa genérica. Projeção realista considera: pipeline de projetos com potencial de receita, probabilidade de execução conforme cronograma e premissas de adoção pelos usuários ou clientes.",
    "exemplosPorVertical": [
      "Varejo: Projeta +8% de receita via: recomendação personalizada (+3%), precificação dinâmica (+2%), redução de abandono de carrinho via chatbot (+2%) e upsell em pós-venda (+1%).",
      "Serviços Financeiros: Projeta +12% de crescimento de carteira via: aprovação mais rápida (mais clientes alcançados), menor inadimplência (mais risco tomado com segurança) e cross-sell via IA de propensão.",
      "Saúde: Rede de clínicas projeta +6% de receita via: redução de no-show com IA de agendamento (+2%), maior throughput de atendimento (+2%) e identificação de pacientes elegíveis para procedimentos (+2%).",
      "Consultoria/TI: Empresa projeta +15% de receita via: Setup COI-IA (novo produto), expansão de clientes existentes com IA e maior win rate em propostas por diferencial técnico comprovado."
    ]
  },
  "7.8": {
    "pergunta": "Qual a expectativa de redução de custos operacionais com IA nos próximos 12 meses?",
    "oQueAvalia": "Mede o potencial de economia esperado via automação e otimização com IA — nos processos operacionais ativos da empresa. Projetos de eficiência com IA tipicamente têm payback mais rápido (6-18 meses) e ROI mais previsível do que projetos de receita. As principais alavancas de redução de custo via IA: automação de processos manuais, otimização de uso de recursos (energia, estoque, pessoal), redução de perdas (fraude, desperdício, retrabalho) e manutenção preditiva.",
    "exemplosPorVertical": [
      "Logística: Projeta -12% de custo operacional: -8% em combustível via roteirização IA, -3% em manutenção via manutenção preditiva, -1% em seguros via telemática com IA.",
      "Indústria: Projeta -18% de custo de manutenção: -12% em paradas não planejadas (preditiva), -4% em peças sobressalentes (otimização de estoque de MRO), -2% em mão de obra.",
      "Serviços Financeiros: Projeta -20% de custo de call center: automação de 70% das interações de SAC com chatbot IA, reduzindo de 500 para 150 agentes humanos em processos de rotina."
    ]
  },
  "8.1": {
    "pergunta": "A empresa utiliza plataformas cloud (AWS, Azure, GCP) para IA?",
    "oQueAvalia": "Verifica se há uso estratégico das plataformas cloud como aceleradoras de IA — não apenas como infraestrutura básica, mas como acesso a serviços gerenciados (SageMaker, Azure ML, Vertex AI), modelos fundacionais via API (Bedrock, Azure OpenAI, Vertex AI Gemini) e ferramentas sem servidor. Empresas 100% on-premise perdem acesso a GPUs modernas e a serviços de GenAI essenciais. Parceria estratégica (Tier 1) com hyperscaler dá acesso antecipado a novas funcionalidades e suporte técnico especializado.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Estratégia multi-cloud: Azure para modelos de linguagem (Azure OpenAI) e AWS para dados (S3, Glue, SageMaker) — evita vendor lock-in e otimiza custo por tipo de serviço.",
      "Varejo: Migra modelos de recomendação para GCP Vertex AI — reduz tempo de treinamento de 8h para 45min com TPUs, com custo 40% menor que manter GPU própria on-premise.",
      "Saúde: AWS HealthLake (FHIR nativo) + SageMaker — dados sensíveis de pacientes ficam em região brasileira (sa-east-1), conformidade LGPD garantida por contrato de processamento de dados.",
      "Indústria: Azure IoT Hub + Azure ML — dados de sensores industriais vão direto da fábrica para a nuvem sem servidor intermediário, com latência <2s para dashboards operacionais."
    ]
  },
  "8.2": {
    "pergunta": "Há integração com ferramentas e serviços de terceiros?",
    "oQueAvalia": "Mede se a empresa aproveita de forma inteligente o ecossistema de ferramentas especializadas — LLMs via API (Anthropic, OpenAI, Google), ferramentas de dados (Snowflake, Databricks), plataformas de automação (Zapier, Make, n8n), ferramentas de análise de documentos — em vez de construir tudo do zero. A decisão estratégica deve ser: construa o que diferencia competitivamente, integre o que é commodity.",
    "exemplosPorVertical": [
      "Consultoria/TI: Integra API da Anthropic (Claude) para análise de contratos e API do GPT-4 para geração de código — equipe foca em orchestration e prompt engineering, não em treinar LLMs do zero.",
      "Varejo: Segment (CDP) + Snowflake (dados) + Vertex AI (modelos) + Braze (ativação) em pipeline de personalização — cada ferramenta faz o melhor, conectadas via APIs padronizadas.",
      "Saúde: Google Document AI para OCR de laudos em papel — sem desenvolvimento próprio de OCR, foca esforço interno em modelos clínicos que exigem expertise médica específica.",
      "Logística: Google Maps Platform API + modelo interno de previsão de tráfego brasileiro — combina dado externo (mapas e tráfego) com dado interno (histórico proprietário de entregas)."
    ]
  },
  "8.3": {
    "pergunta": "Existe estratégia de make vs. buy para soluções de IA?",
    "oQueAvalia": "Avalia se há framework formal para decidir quando desenvolver internamente, comprar uma solução pronta ou contratar como serviço (SaaS). Critérios típicos: diferenciação competitiva (construa), velocidade de go-to-market necessária (compre), custo de manutenção de longo prazo, disponibilidade de dados proprietários e necessidade de customização profunda. Sem framework, empresas tomam decisões de forma inconsistente — ora reinventam a roda, ora compram soluções que não se adaptam ao contexto.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Construa — modelos de risco e crédito (dados proprietários exclusivos, diferencial competitivo); Compre — ferramentas de cybersecurity com IA (commodity); Parcerie — NLP para onboarding (terceiro especializado com customização).",
      "Saúde: Construa — modelos de diagnóstico com 15 anos de dados clínicos próprios; Compre — plataforma de telemonitoramento (não é core do negócio hospitalar); Parcerie — IA para imagem com startup especializada.",
      "Varejo: Construa — previsão de demanda (supply chain e dados de sell-out proprietários); Compre — chatbot de SAC (commodity madura); Integre — recomendação como módulo da plataforma de e-commerce.",
      "Logística: Construa — roteirização customizada para o contexto brasileiro (trânsito, regulações, pedágio); Compre — telemetria de frota (hardware + software de mercado); Parcerie — trading de frete com plataforma digital."
    ]
  },
  "8.4": {
    "pergunta": "Há parcerias com consultorias, vendors ou startups de IA?",
    "oQueAvalia": "Verifica se há relacionamentos estratégicos que complementam capacidades internas — consultorias especializadas (metodologia e aceleração), vendors de plataforma (tecnologia e suporte) e startups de IA (inovação e agilidade). A diferença entre parceria estratégica e relação transacional: o parceiro estratégico trabalha como extensão da equipe, compartilha riscos e resultados, e transfere conhecimento de forma estruturada.",
    "exemplosPorVertical": [
      "Indústria: Parceria estratégica com empresa de IA industrial — parceiro tem acesso aos dados de produção, co-desenvolve modelos e é remunerado por resultado (percentual da economia gerada mensalmente).",
      "Serviços Financeiros: \"AI Partner Program\" com 5 startups de fintech — acesso a dados sintéticos, mentoria técnica e rota de comercialização para clientes do banco, em troca de equity ou first right of refusal.",
      "Varejo: Consultoria especializada em retail analytics embedded por 18 meses — equipe da consultoria transfere metodologia e forma equipe interna ao longo do projeto, não apenas entrega resultados.",
      "Saúde: Consórcio de pesquisa com 2 universidades e 1 empresa de imagem médica — dados compartilhados (anonimizados), publicações conjuntas e propriedade intelectual compartilhada de forma equilibrada."
    ]
  },
  "8.5": {
    "pergunta": "A empresa consegue integrar rapidamente novas soluções de IA?",
    "oQueAvalia": "Mede a agilidade para adotar novas tecnologias de IA — em dias ou semanas, não meses. Velocidade de integração depende de: arquitetura modular (serviços loosely coupled), padrões de API claramente definidos, ambiente de sandbox disponível, processo de aprovação de segurança ágil e cultura de experimentação enraizada. Com novas capacidades de IA surgindo mensalmente em 2024-2025, incapacidade de integrar rapidamente é uma desvantagem competitiva crescente.",
    "exemplosPorVertical": [
      "Consultoria/TI: Novo modelo de LLM em produção em 3 dias — arquitetura de orquestração modular (LangChain) permite trocar o modelo sem reescrever uma linha do fluxo de negócio.",
      "Varejo: Nova ferramenta de personalização em 2 semanas — sandbox disponível, processo de segurança pré-definido para fornecedores SaaS e squad dedicado a integrações sempre disponível.",
      "Serviços Financeiros: Nova plataforma de IA regulatória em 6 semanas — mais rápido que a média do setor (6 meses) por conta de APIs padronizadas e processo de onboarding de fornecedores simplificado.",
      "Logística: Testa nova API de roteirização em 1 dia no sandbox, decide em 1 semana após análise de desempenho comparativa, coloca em produção em 2 semanas com rollout gradual."
    ]
  },
  "8.6": {
    "pergunta": "Existe processo de avaliação e seleção de parceiros?",
    "oQueAvalia": "Avalia se há critérios claros e processo estruturado para escolher parceiros e fornecedores de IA — garantindo que a seleção seja baseada em capacidade técnica, adequação cultural, sustentabilidade financeira, privacidade/segurança e alinhamento estratégico. Para IA especificamente: responsabilidade sobre viés dos modelos, tratamento de dados de treinamento, licenciamento de modelos de terceiros usados na solução e transparência sobre o funcionamento interno.",
    "exemplosPorVertical": [
      "Serviços Financeiros: \"AI Vendor Scorecard\" com 8 dimensões formais: capacidade técnica, segurança, privacidade, solidez financeira, referências de clientes, roadmap de produto, qualidade do suporte e alinhamento regulatório.",
      "Saúde: \"AI Transparency Questionnaire\" obrigatório para qualquer fornecedor de IA — como o modelo foi treinado? Com quais dados? Como viés é testado? Quem responde por erros clínicos?",
      "Varejo: PoC pago de 30 dias antes de qualquer contrato de parceria — avalia performance real com dados reais antes de comprometer orçamento por 12+ meses de contrato.",
      "Indústria: RFI → RFP → PoC → Auditoria Técnica para soluções de IA críticas — processo de 90 dias que reduz significativamente o risco de vendor lock-in e surpresas técnicas pós-contrato."
    ]
  },
  "9.1": {
    "pergunta": "Existe mapeamento de casos de uso de IA por unidade de negócio?",
    "oQueAvalia": "Verifica se há visão estruturada de onde IA pode gerar valor em cada área — não apenas os casos já implementados, mas todo o espaço de oportunidades mapeado e priorizado por potencial de retorno.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Por área: Risco (35 casos mapeados), Crédito (28), Operações (42), Atendimento (31), Compliance (18) — com score de impacto e viabilidade para cada caso documentado.",
      "Indústria: Pela cadeia de valor: Supply Chain (15 casos), Produção (22), Qualidade (12), Manutenção (18), Vendas (8) — atualizado anualmente com revisão do impacto realizado.",
      "Saúde: Por especialidade clínica: Cardiologia (diagnóstico assistido, monitoramento remoto), Oncologia (screening, planejamento de tratamento), UTI (predição de deterioração) — cada especialidade com prioridade definida.",
      "Varejo: Por jornada do cliente: Atração (personalização de mídia), Conversão (recomendação, pricing), Fidelização (churn, cross-sell), Pós-venda (SAC, logística reversa) — 48 casos no total."
    ]
  },
  "9.2": {
    "pergunta": "Cada unidade de negócio tem métricas específicas de valor gerado por IA?",
    "oQueAvalia": "Mede se cada área da empresa tem KPIs próprios para rastrear o impacto de IA em linguagem de negócio relevante para aquela área. Métricas genéricas e centralizadas (\"número de modelos em produção\") não motivam adoção nas áreas. O responsável de Vendas precisa ver impacto em CTR e ticket médio; Operações precisa ver OEE e custo por unidade; RH precisa ver time-to-hire e turnover. Métricas específicas por área são o que transforma IA de \"projeto de TI\" em \"ferramenta de negócio\".",
    "exemplosPorVertical": [
      "Varejo: Por área — Compras (cobertura de estoque, giro, ruptura), Comercial (uplift de receita, win rate), Operações (OTD, custo de frete), Marketing (CAC, ROAS, LTV) — dashboards próprios por área.",
      "Saúde: UTI (mortalidade evitada, LOS médio), Emergência (tempo de triagem, adequação clínica), Centro Cirúrgico (utilização de salas, complicações cirúrgicas), Ambulatório (no-show, satisfação médico).",
      "Indústria: Por centro de custo — Manutenção (MTBF, MTTR, custo/máquina), Qualidade (PPM, custo de retrabalho), Supply Chain (acurácia de forecast, nível de serviço ao cliente final)."
    ]
  },
  "9.3": {
    "pergunta": "Há priorização de investimentos em IA baseada no potencial de valor por unidade?",
    "oQueAvalia": "Avalia se o orçamento de IA é alocado de forma estratégica — para as unidades com maior potencial de retorno, não simplesmente para as que \"pedem mais\" ou têm mais influência política. Priorização por valor requer: mapeamento de oportunidades por unidade (Q9.1), dados históricos de ROI por área e processo de comitê de investimentos que usa esses dados de forma sistemática para alocar recursos.",
    "exemplosPorVertical": [
      "Logística: 50% do budget de IA para Operações (maior potencial de eficiência), 30% para Comercial (crescimento de receita), 20% para Tecnologia (infraestrutura habilitadora) — revisado semestralmente.",
      "Serviços Financeiros: Crédito com ROI provado de 300% recebe 40% do budget; Compliance com ROI difícil de medir recebe orçamento fixo de conformidade obrigatória.",
      "Saúde: UTI e Emergência com prioridade por risco clínico alto + custo por dia elevado; especialidades eletivas com meta de eficiência operacional mais estrita.",
      "Varejo: \"Auction\" semestral de budget de IA — cada área apresenta case de valor ao comitê, que aloca proporcionalmente ao potencial de impacto demonstrado com dados históricos."
    ]
  },
  "9.4": {
    "pergunta": "As unidades de negócio têm autonomia para propor e desenvolver iniciativas de IA?",
    "oQueAvalia": "Verifica o modelo de governança de IA: centralizado (apenas TI/dados desenvolve IA), descentralizado (cada área faz o que quer sem padrão) ou federado (áreas têm autonomia dentro de padrões definidos pelo centro). Autonomia sem padrões gera fragmentação; padrões sem autonomia geram gargalo.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Modelos de risco e compliance = centralizado (alto risco regulatório, exige consistência); modelos de eficiência e experiência = descentralizado (menor risco, precisa de agilidade).",
      "Saúde: Médicos líderes propõem e validam use cases clínicos; TI e dados apoiam a execução; Comitê de IA aprova formalmente; cada área tem budget próprio para pilotos até R$50k sem aprovação central.",
      "Indústria: Engenheiros de processo propõem e validam use cases operacionais; equipe de dados executa; Centro de Excelência garante padrões de dados e governança — accountability genuinamente compartilhada."
    ]
  },
  "9.5": {
    "pergunta": "Existe compartilhamento de soluções de IA entre unidades de negócio?",
    "oQueAvalia": "Mede se há reuso sistemático de soluções de IA entre áreas — evitando que cada unidade desenvolva do zero o que outra já resolveu. Compartilhamento requer: catálogo de soluções internas acessível, APIs padronizadas para consumo, processo de adaptação para novo contexto e governança de versão. Com alta maturidade, o custo marginal de adicionar uma nova BU a uma solução existente é próximo de zero.",
    "exemplosPorVertical": [
      "Serviços Financeiros: \"AI Services Catalog\" interno — modelo de NLP para extração de informação de documentos foi desenvolvido pelo Crédito e hoje é usado por Compliance, Seguros e RH via API interna.",
      "Varejo: Rede com múltiplas bandeiras compartilha modelo de previsão de demanda — treinado separadamente por bandeira mas com mesma arquitetura, processo de deploy e monitoramento.",
      "Saúde: Modelo de triagem do hospital-piloto utilizado por 7 hospitais da rede — adaptações locais mínimas economizando 80% do esforço de desenvolvimento vs. cada hospital desenvolver do zero.",
      "Indústria: Modelo de manutenção preditiva da planta-piloto adaptado por 2 plantas adicionais em 4 semanas vs. 6 meses para desenvolver do zero — reuso com adaptação ao parque de máquinas local."
    ]
  },
  "9.6": {
    "pergunta": "Qual unidade de negócio está mais avançada em adoção de IA e serve de referência?",
    "oQueAvalia": "Identifica se há uma área que funciona como \"lighthouse\" interno — demonstrando o que é possível, documentando os aprendizados e servindo de referência para as demais unidades. Sem lighthouse, cada área começa do zero e comete os mesmos erros.",
    "exemplosPorVertical": [
      "Indústria: Planta de Tijucas como \"lighthouse\" — implementou manutenção preditiva, visão computacional e torre de controle com IA, ROI de R$15M documentado em 18 meses. Outras 4 plantas replicam o modelo.",
      "Serviços Financeiros: Área de Crédito como referência interna — 12 modelos em produção, metodologia de ROI matura e processo de deploy em menos de 1 semana. Outros times usam o playbook do Crédito como base.",
      "Saúde: UTI cardíaca como lighthouse clínico — 4 modelos com impacto documentado em mortalidade e LOS. Outras UTIs e enfermarias seguem o modelo com apoio ativo da equipe pioneira.",
      "Varejo: E-commerce como lighthouse digital — IA em 8 pontos da jornada do cliente. Lojas físicas adotam gradualmente, começando pelos casos de menor complexidade testados no digital."
    ]
  },
  "10.1": {
    "pergunta": "Existe mapeamento quantitativo de profissionais de IA?",
    "oQueAvalia": "Verifica se há inventário preciso de quantas pessoas a empresa possui em cada papel de IA — Data Scientist, ML Engineer, Data Engineer, AI Product Manager, MLOps Engineer, AI Ethics Lead — com nível de senioridade e distribuição por área. Sem esse inventário, é impossível fazer workforce planning, identificar gargalos críticos ou demonstrar evolução de capacidade ao longo do tempo.",
    "exemplosPorVertical": [
      "Serviços Financeiros: \"AI Skills Inventory\" no sistema de RH: 45 Data Scientists (15 Sr, 20 Pl, 10 Jr), 30 ML Engineers, 20 Data Engineers — atualizado semestralmente com avaliação formal.",
      "Consultoria/TI: \"Skills matrix\" dinâmico — colaborador auto-avalia habilidades em IA trimestralmente, validado pelo gestor, usado para alocação em projetos e plano de desenvolvimento individual.",
      "Saúde: Mapeia por tipo de papel: 8 pesquisadores PhD em IA, 12 Engenheiros com certificação ML, 25 \"clinical AI champions\" (médicos treinados para usar IA no fluxo de atendimento clínico)."
    ]
  },
  "10.2": {
    "pergunta": "Há análise de gap entre capacidades atuais e necessidades futuras?",
    "oQueAvalia": "Mede se a empresa sabe quantas pessoas precisa contratar ou desenvolver para executar sua estratégia de IA nos próximos 2-3 anos. Gap analysis inclui: gaps quantitativos (quantas pessoas faltam em cada papel) e gaps qualitativos (quais habilidades específicas faltam).",
    "exemplosPorVertical": [
      "Varejo: Gap analysis anual: estratégia requer 15 MLOps Engineers; empresa tem 4; gap de 11. Plano: contratar 5, desenvolver 4 internamente em 18 meses, terceirizar 2 funções como serviço managed.",
      "Serviços Financeiros: Identifica gap crítico em \"AI Product Manager\" — papel essencial mas inexistente internamente. Cria trilha de desenvolvimento de 18 meses para Product Managers existentes.",
      "Consultoria/TI: 90% dos projetos agora exigem LLM expertise, apenas 15% do time tem essa habilidade. Programa intensivo de 3 meses para fechar o gap principal em 12 meses.",
      "Indústria: Identifica que o gap crítico não é em Data Scientists (tem o suficiente), mas em \"AI-savvy Production Engineers\" — profissionais que entendem tanto de processo produtivo quanto de IA."
    ]
  },
  "10.3": {
    "pergunta": "Existe estratégia clara de Build vs. Buy vs. Borrow para talentos?",
    "oQueAvalia": "Avalia se há decisão deliberada sobre como obter cada competência de IA necessária: Build (contratar e desenvolver internamente), Buy (contratar profissional pronto no mercado) ou Borrow (terceirizar, nearshore, consultoria, parceria com universidade). Cada opção tem tradeoffs distintos: Build é mais lento e barato a longo prazo; Buy é rápido mas caro; Borrow é flexível mas não retém conhecimento estratégico na organização.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Build — ML Engineers e Data Engineers (competência estratégica, forma internamente em 18 meses); Buy — CAIO e ML Scientists Sênior (posição única no mercado); Borrow — DevOps/MLOps para picos de projeto.",
      "Varejo: Borrow para exploração (consultoria nas primeiras 8 semanas de cada projeto novo), Build para execução (time interno assume após PoC validado), Buy para posições de liderança estratégica única.",
      "Saúde: Borrow extensivamente via parcerias com USP e UNICAMP — pesquisadores colaboram em projetos reais, empresa paga research fees e tem first refusal para contratação pós-projeto.",
      "Logística: Build — especialistas em dados de frota e telemetria para o contexto brasileiro (não existem com esse perfil específico no mercado — só formando internamente com programa de upskilling)."
    ]
  },
  "10.4": {
    "pergunta": "Há programa estruturado de upskilling/reskilling em IA?",
    "oQueAvalia": "Verifica se há programas formais para desenvolver colaboradores existentes em competências de IA — reskilling (requalificação para novo papel) e upskilling (aprofundamento no papel atual). O LinkedIn reporta que 40% das habilidades profissionais sofrerão disrupção por IA nos próximos 3 anos. Programas eficazes incluem: assessment inicial de nível, trilha personalizada por papel, mentoria prática, projetos reais e validação por certificação ou entrega mensurável.",
    "exemplosPorVertical": [
      "Varejo: \"Academia de IA\" com 3 trilhas: Fundamentos (todos, 8h online), Usuário Avançado (gestores, 24h com projetos práticos reais), Desenvolvedor (técnicos, 80h + certificação AWS ML Specialty).",
      "Serviços Financeiros: \"AI Bootcamp\" de 3 meses para 50 analistas de crédito e risco — Python, SQL, ML básico e projeto real com impacto financeiro medido e documentado.",
      "Indústria: Parceria com SENAI — 40 operadores de manutenção recebem formação de 160h para operar e interpretar sistemas de manutenção preditiva na linha de produção.",
      "Saúde: \"Clinical AI Residency\" — 10 médicos por ano passam 3 meses embedded no time de dados, aprendendo a formular problemas clínicos como problemas de IA e a interpretar resultados com responsabilidade clínica."
    ]
  },
  "10.5": {
    "pergunta": "Qual o nível de senioridade da equipe de IA?",
    "oQueAvalia": "Mede o mix de níveis de experiência na equipe de IA — do júnior (0-2 anos) ao especialista (10+ anos). Equipes muito júnior enfrentam dependência excessiva de parceiros externos e dificuldade em tomar decisões técnicas complexas de forma autônoma. Equipes muito sênior são caras e podem não ter a velocidade de execução necessária. Mix saudável para empresas em crescimento em IA: 30% sênior/especialista, 50% pleno, 20% júnior — com sênior como mentores ativos dos juniores.",
    "exemplosPorVertical": [
      "Consultoria/TI: 30 profissionais de IA: 6 especialistas (definem arquitetura e lideram clientes), 15 plenos (executam projetos com autonomia), 9 júniors em mentoria ativa — promoção de júnior para pleno em 18 meses.",
      "Serviços Financeiros: Começa com pirâmide invertida (muitos sêniors consultores externos); reequilibra em 2 anos para maioria plenos internos com sêniors como mentores — custo total reduzido em 40%.",
      "Varejo: Avalia senioridade por capacidade de resolver problema complexo sem supervisão, não por tempo de empresa — meritocracy técnica explícita com critérios objetivos publicados.",
      "Saúde: Contrata 2 PhD pesquisadores como \"científicos residentes\" — especialistas em ML médico com influência técnica alta mesmo sendo \"júniors\" em experiência corporativa convencional."
    ]
  },
  "10.6": {
    "pergunta": "Existem papéis especializados além de Data Scientist?",
    "oQueAvalia": "Avalia se a organização reconhece e tem as disciplinas especializadas necessárias além do Data Scientist generalista: MLOps Engineers (colocam modelos em produção e os operam), Data Engineers (pipelines de dados), AI Product Managers (definem o quê e para quem), AI Ethics Specialists (garantem uso responsável e conformidade) e AI Architects (definem a estrutura técnica de plataformas de IA). Sem esses papéis, o Data Scientist se torna gargalo — fazendo tudo e não fazendo nada com excelência.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Time completo com papéis distintos: 25 Data Scientists + 15 ML Engineers + 20 Data Engineers + 8 MLOps Engineers + 5 AI Product Managers + 3 AI Ethics Specialists — cada papel com JD clara.",
      "Varejo: Cria \"ML Platform Engineer\" — papel híbrido entre SRE e Data Engineer, responsável pela infra de IA como produto interno com SLA, roadmap e backlog próprios, tratado como time de produto.",
      "Consultoria/TI: Cria \"AI Delivery Manager\" — não é PM clássico nem tech lead, é especialista em entregar projetos de IA do PoC à produção, gerenciando as incertezas e iterações específicas de ML.",
      "Saúde: \"Clinical AI Validator\" — médico especialista que valida modelos clínicos, serve de ponte entre time de dados e equipe médica e responde clinicamente pelos modelos aprovados para uso assistencial."
    ]
  },
  "10.7": {
    "pergunta": "Há métricas de produtividade e efetividade da equipe de IA?",
    "oQueAvalia": "Verifica se há acompanhamento sistemático da performance da equipe de IA — não apenas entregas (número de modelos, projetos concluídos), mas velocidade (lead time do PoC a produção), qualidade (percentual de modelos que atingem KPI de negócio) e eficiência (custo por modelo em produção). Sem métricas de equipe, é impossível melhorar o processo ou identificar gargalos sistêmicos que prejudicam toda a organização.",
    "exemplosPorVertical": [
      "Consultoria/TI: 4 métricas DORA para ML: frequência de deploy de modelos, lead time PoC→Produção, taxa de rollback de modelos e MTTR quando modelo falha — meta de melhoria trimestral documentada.",
      "Serviços Financeiros: Time-to-Value (dias da ideia ao modelo em produção), hit rate (% que atinge KPI de negócio estabelecido), reuse rate (% de componentes reutilizados de outros projetos).",
      "Varejo: Throughput (features por sprint entregues), déficit técnico (% do tempo em manutenção vs. desenvolvimento de novas capacidades), NPS das BUs clientes da equipe de dados.",
      "Logística: Custo por modelo em produção/ano, número de modelos que um engenheiro consegue operar (indicador de automação do MLOps), latência média de resposta a incidentes em produção."
    ]
  },
  "10.8": {
    "pergunta": "Qual a taxa de turnover da equipe de IA e como se compara ao mercado?",
    "oQueAvalia": "Mede a capacidade de reter talentos de IA comparado ao mercado. Turnover de Data Scientists e ML Engineers no Brasil gira em torno de 25-35% ao ano — empresas que retêm abaixo de 15% estão significativamente acima da média do mercado. Alto turnover não é apenas custo de recontratação (3-6 meses de salário): é perda de conhecimento crítico sobre os dados e modelos da empresa, que raramente está documentado de forma suficientemente transferível.",
    "exemplosPorVertical": [
      "Fintech: Turnover de 8%/ano na equipe de dados — acima do mercado em salários + equity + projetos desafiadores + cultura de aprendizado. Custo de retenção compensa 3x vs. custo de reposição recorrente.",
      "Varejo: Reduz turnover de 32% para 14% em 2 anos: plano de carreira claro e transparente, certificações pagas pela empresa, flexibilidade de local — exit interviews revelaram esses fatores.",
      "Serviços Financeiros: 6 saídas de DS sêniors em 18 meses — cada uma custando 6 meses de reposição mais perda de conhecimento sobre modelos críticos. Cria retention package específico para esse grupo.",
      "Consultoria/TI: Aceita turnover um pouco mais alto (18%) como trade-off consciente — compensa com documentação excelente: \"model passport\" que torna o conhecimento de cada projeto genuinamente transferível."
    ]
  },
  "11.1": {
    "pergunta": "Existe mapeamento completo de regulações aplicáveis à IA?",
    "oQueAvalia": "Verifica se a empresa conhece e catalogou todas as regulações que impactam seus projetos de IA — no Brasil e internacionalmente, gerais e setoriais. Empresas sem mapa completo operam com risco regulatório invisível.",
    "exemplosPorVertical": [
      "Saúde: Mapeia por tipo de sistema de IA: Diagnóstico (ANVISA RDC 27/2024 + CFM), Prescrição (ANVISA), Prontuário Eletrônico (CFM 1.821/2007), Telemonitoramento (ANATEL + ANVISA).",
      "Varejo: Foco em LGPD (dados de clientes em modelos de recomendação e precificação), BACEN (se oferece crédito próprio) e CONAR (regulação de publicidade com uso de IA)."
    ]
  },
  "11.2": {
    "pergunta": "Há conformidade documentada com LGPD/GDPR em todos os projetos de IA?",
    "oQueAvalia": "Mede se há RIPD (Relatório de Impacto à Proteção de Dados — art. 38 da LGPD) e documentação de privacidade para todos os projetos que processam dados pessoais. O RIPD é obrigatório para processos com potencial de risco para os titulares (LGPD art. 38). \"Privacy by design\" — incorporar privacidade desde a concepção do projeto, não no final — é o padrão de maturidade esperado pelas empresas líderes.",
    "exemplosPorVertical": [
      "Serviços Financeiros: RIPD obrigatório antes de aprovação do CAIO — template com 12 seções, revisado pelo DPO e aprovado pelo Compliance antes de qualquer desenvolvimento começar.",
      "Saúde: \"Privacy by Design Checklist\" em todo projeto: minimização de dados (só o necessário), pseudonimização obrigatória em desenvolvimento, anonimização sempre que possível antes do treinamento.",
      "Varejo: Todos os Data Scientists certificados internamente em LGPD com foco em IA antes de ter acesso a dados de clientes — RIPD co-assinado pelo Data Scientist e pelo DPO da empresa.",
      "RH/Consultoria: Todo modelo que impacta colaboradores tem RIPD obrigatório, comunicação formal aos titulares e processo de revisão humana disponível para qualquer decisão automatizada."
    ]
  },
  "11.3": {
    "pergunta": "As regulações setoriais específicas são consideradas nos projetos de IA?",
    "oQueAvalia": "Avalia se além da LGPD, as regulações específicas do setor de atuação são incorporadas nos projetos de IA de forma sistemática. Cada setor tem seu conjunto regulatório crescentemente específico para IA: Financeiro (BACEN Circ. 4.004/2021 para modelos de crédito), Saúde (ANVISA RDC 27/2024 para SaMD), Telecomunicações (ANATEL), Energia (ANEEL), Agronegócio (MAPA).",
    "exemplosPorVertical": [
      "Serviços Financeiros: BACEN Circ. 4.004/2021 — modelos de crédito com documentação técnica obrigatória, backtesting semestral e validação independente de modelo risk integrados ao pipeline MLOps.",
      "Saúde: Hospital notifica ANVISA modelos de IA como SaMD (Software como Dispositivo Médico) quando apoiam decisão clínica — processo formal de regulamentação antes de qualquer deploy clínico.",
      "Energia: Distribuidora garante que algoritmos de gerenciamento de rede seguem normas ANEEL sobre qualidade de fornecimento e gestão de interrupções — auditoria regulatória anual específica.",
      "Agronegócio: Sistema de recomendação de agroquímicos com IA cumpre regulações do MAPA e Ibama sobre receituário agronômico — especialista regulatório revisa qualquer mudança no modelo."
    ]
  },
  "11.4": {
    "pergunta": "Existe preparação para regulações emergentes de IA?",
    "oQueAvalia": "Preparação antecipada é 3-5x menos custosa do que remediar após a obrigatoriedade.",
    "exemplosPorVertical": [
      "Consultoria/TI: Inicia ISO 42001 voluntariamente — processo de 18 meses de implementação já antecipa o que será exigido por clientes corporativos de grande porte em 2025-2026.",
      "Saúde: Implementa documentação de IA Clínica conforme padrões da AMA (American Medical Association) e NHS (Reino Unido) mesmo sem obrigação formal brasileira — antecipa regulações do CFM.",
      "Varejo: Jurídico prepara análise de impacto completa do PL 2.338/2023 — recomendações detalhadas para a gestão sobre o que precisará mudar se aprovado na forma atual ou com emendas."
    ]
  },
  "11.5": {
    "pergunta": "Há documentação de explicabilidade e transparência dos modelos?",
    "oQueAvalia": "Mede se há documentação que explica como os modelos de IA funcionam em linguagem compreensível para diferentes audiências: técnica (para validação por outros Data Scientists), regulatória (para auditores e reguladores como BACEN e ANPD) e para usuários/titulares afetados (para quem quer entender decisões que os impactam). \"Model Cards\" (Google) e \"Datasheets for Datasets\" (Microsoft) são os padrões mais adotados pela indústria. A LGPD art. 20 garante ao titular o direito de solicitar revisão de decisão automatizada.",
    "exemplosPorVertical": [
      "Serviços Financeiros: \"Ficha Técnica do Modelo\" para cada modelo de crédito: objetivo, dados usados, metodologia, limitações conhecidas, métricas de performance e impacto estimado por grupo demográfico — armazenado por 5 anos.",
      "Saúde: \"Clinical AI Card\": acurácia por subgrupo de pacientes, limitações conhecidas do modelo, como o resultado deve ser interpretado pelo médico e casos explícitos onde o modelo não deve ser usado.",
      "Varejo: Explicação em linguagem natural gerada automaticamente (SHAP values convertidos em texto legível) — cliente pode solicitar e receber \"por que recebi essa recomendação?\" de forma compreensível.",
      "Consultoria/TI: SHAP (SHapley Additive Explanations) para todos os modelos preditivos — qualquer decisão do modelo pode ser explicada apontando os 5 principais fatores que influenciaram o resultado."
    ]
  },
  "11.6": {
    "pergunta": "Existem processos de auditoria de conformidade regulatória em IA?",
    "oQueAvalia": "Avalia se há auditorias periódicas — internas e/ou externas — especificamente focadas na conformidade regulatória dos sistemas de IA: base legal para cada processamento documentada, RIPD realizado e atualizado, direitos dos titulares garantidos na prática e adequação à regulação setorial vigente. Diferente da auditoria de performance técnica (Q3.6), esta auditoria foca exclusivamente na perspectiva jurídica e regulatória.",
    "exemplosPorVertical": [
      "Serviços Financeiros: \"AI Compliance Audit\" semestral — time independente de Auditoria Interna verifica se modelos críticos têm RIPD atualizado, documentação adequada e controles de acesso funcionando corretamente.",
      "Saúde: Auditoria externa anual especializada em IA e saúde digital — empresa especializada verifica conformidade com ANVISA, CFM e LGPD, emite relatório com grau de conformidade e recomendações formais.",
      "Varejo: IA incluída no escopo da auditoria externa de LGPD contratada — auditor verifica se modelos de personalização, precificação e decisões automatizadas cumprem todas as obrigações da lei.",
      "Consultoria/TI: \"Pre-launch compliance check\" obrigatório — checklist formal preenchido e aprovado pelo DPO e pelo Head de Compliance antes de qualquer modelo ir a produção."
    ]
  },
  "11.7": {
    "pergunta": "Há gestão de riscos regulatórios com planos de mitigação documentados?",
    "oQueAvalia": "Verifica se os riscos regulatórios específicos de IA são mapeados, avaliados por probabilidade e impacto financeiro, e gerenciados com planos de mitigação explícitos e testados.",
    "exemplosPorVertical": [
      "Serviços Financeiros: \"AI Regulatory Risk Register\" com 18 riscos documentados — cada risco com probabilidade, impacto financeiro estimado, controles existentes e plano de mitigação testado, revisado trimestralmente pelo Compliance.",
      "Saúde: Mapeia risco de modelo ser classificado como SaMD pela ANVISA sem notificação prévia — plano de mitigação: revisão jurídica de todos os modelos clínicos antes de qualquer update de versão.",
      "Varejo: Risco de \"discriminação algorítmica\" em precificação dinâmica mapeado formalmente — auditoria semestral de equidade de preços por segmento socioeconômico e geográfico.",
      "Logística: ANTT, CLT e MTur têm regras sobre jornada de motoristas — modelos de roteirização com IA precisam respeitar limites de horas de direção, mapeados explicitamente no risk register."
    ]
  },
  "11.8": {
    "pergunta": "A área jurídica/compliance está capacitada e envolvida em projetos de IA?",
    "oQueAvalia": "Mede se a área jurídica entende de IA o suficiente para contribuir de forma efetiva nos projetos — ao invés de simplesmente bloquear por desconhecimento ou aprovar tudo por excesso de confiança nos times técnicos. \"Legal as Enabler\" é o modelo de maturidade alta: o jurídico especializado em IA acelera projetos ao resolver questões legais antecipadamente, ao invés de bloqueá-los no final depois de meses de desenvolvimento.",
    "exemplosPorVertical": [
      "Serviços Financeiros: \"AI Legal Squad\" com 3 advogados especializados em tecnologia, privacidade e regulação financeira — participam ativamente do processo de aprovação de modelos desde a concepção, não apenas no final.",
      "Saúde: DPO com background em saúde digital — entende tanto de LGPD quanto de regulações ANVISA e CFM; participa de design reviews de modelos clínicos desde as primeiras fases de ideação.",
      "Consultoria/TI: Toda a equipe jurídica capacitada em \"AI Foundations\" (16h) — advogados fazem perguntas técnicas relevantes em projetos e identificam riscos que times técnicos não veriam sozinhos.",
      "Varejo: \"Legal Sandbox\" criado — advogados têm acesso a ambiente de teste onde podem ver como modelos funcionam na prática e propor salvaguardas preventivas antes de qualquer projeto ir a produção."
    ]
  },
  "12.1": {
    "pergunta": "Existe consciência organizacional sobre a necessidade de mudança para IA?",
    "oQueAvalia": "Colaboradores precisam entender por que a IA é necessária para a empresa — não apenas saber que \"tem um projeto de IA\", mas compreender qual problema a mudança resolve, qual risco endereça e qual oportunidade captura. Sem consciência genuína, resistência é inevitável: as pessoas naturalmente se opõem ao que não entendem. A comunicação do \"porquê\" deve ser autêntica, específica para a realidade da empresa e repetida em múltiplos formatos por múltiplos canais.",
    "exemplosPorVertical": [
      "Varejo: CEO grava vídeo de 5 minutos explicando especificamente por que IA é necessária agora: \"Nosso concorrente aprovou a loja autônoma, precisamos mudar para continuar relevantes\" — enviado a todos os 15.000 colaboradores.",
      "Indústria: \"Town Hall de IA\" trimestral — liderança explica impacto da IA no setor industrial global, mostra cases de concorrentes e conecta isso à sobrevivência e crescimento da empresa em 10 anos.",
      "Saúde: Comunica para toda equipe médica estudos mostrando que IA reduz erros diagnósticos em 35% — foco no benefício clínico ao paciente, não na tecnologia em si, para criar identificação genuína.",
      "Logística: Mostra a motoristas e supervisores: \"Com IA, nossa rota é 12% mais eficiente — isso significa 15% menos horas extras e 20% menos risco de acidente por fadiga\" — linguagem do grupo específico."
    ]
  },
  "12.2": {
    "pergunta": "Há desejo e motivação dos colaboradores para participar da transformação com IA?",
    "oQueAvalia": "Consciência não gera engajamento automaticamente: mesmo entendendo por que mudar, colaboradores podem não querer por medo de substituição, inércia ou desconfiança nos líderes. Medo de substituição por IA é a resistência mais prevalente — estudos mostram que 37% dos trabalhadores têm esse medo. Comunicação honesta sobre o papel da IA como ferramenta que augmenta capacidades humanas (não as substitui) é fundamental.",
    "exemplosPorVertical": [
      "Varejo: Pesquisa de \"IA Readiness\" com todos os colaboradores — 62% motivados, 28% neutros, 10% resistentes. Programa de change management calibrado para endereçar as preocupações específicas dos 38% não motivados.",
      "Serviços Financeiros: Banco garante explicitamente que IA não vai reduzir headcount — demonstra isso com dados: 18 meses após implementar IA, headcount cresceu 8% com novos papéis criados.",
      "Indústria: Converte \"técnicos de manutenção resistentes\" em \"tech champions\" ao incluí-los no desenvolvimento do modelo — eles entendem as máquinas melhor do que qualquer cientista de dados.",
      "Saúde: Aborda medo de médicos de serem substituídos com clareza e evidência: \"IA não substitui diagnóstico médico — ela filtra 70% dos exames normais para que você foque nos 30% que precisam de você.\""
    ]
  },
  "12.3": {
    "pergunta": "Existe mapeamento de resistências por área, nível hierárquico ou perfil?",
    "oQueAvalia": "Avalia se a empresa sabe onde estão os principais bolsões de resistência à adoção de IA — por área (operação vs. corporativo), nível hierárquico (gerência média vs. C-level) ou perfil (profissionais mais antigos vs. mais jovens). Sem esse mapeamento, esforços de change management são genéricos e pouco eficazes.",
    "exemplosPorVertical": [
      "Varejo: \"Change Readiness Survey\" por área — gerência média de lojas é o principal bolsão de resistência (medo de perder autoridade de decisão). Programa de change targeting especificamente esse grupo.",
      "Serviços Financeiros: Mapeamento por antiguidade: colaboradores com mais de 15 anos de empresa têm resistência 2x maior. Programa \"Tech Seniors\" com mentorias invertidas (júniors ensinam ferramentas).",
      "Saúde: Mapeia por especialidade médica: radiologistas mais resistentes (maior impacto percebido na profissão); médicos de emergência mais engajados (veem valor imediato). Estratégia diferente para cada grupo.",
      "Indústria: Supervisores de turno mapeados como resistentes (preocupados com controle) — incluídos como co-criadores do painel de IA; resistência converteu em liderança ativa da mudança."
    ]
  },
  "12.4": {
    "pergunta": "Há uma rede de agentes de mudança ou champions de IA nas áreas?",
    "oQueAvalia": "Verifica se há multiplicadores de IA identificados e formados em cada área — pessoas que influenciam seus pares pelo exemplo, respondem dúvidas no cotidiano e reportam barreiras de adoção para a liderança. Champions são o mecanismo mais eficaz de disseminação de mudança porque têm a credibilidade de \"um de nós\". Para IA especificamente, champions são essenciais para traduzir linguagem técnica em impacto prático por área.",
    "exemplosPorVertical": [
      "Varejo: \"IA Champions Program\" com 35 champions (1 por loja grande, 1 por área corporativa) — treinamento de 24h, acesso antecipado a ferramentas, reunião mensal com o CDO e badge de reconhecimento formal.",
      "Serviços Financeiros: \"Data Advocates\" em cada diretoria — gerentes que usam ferramentas de IA no dia a dia e evangelizam para o time, com meta de aumentar adoção 20% em sua área de influência.",
      "Indústria: 12 \"Operadores de IA\" — técnicos de manutenção treinados para operar o sistema preditivo, identificar anomalias que o modelo não detecta e dar feedback estruturado para o time de dados.",
      "Saúde: \"Clinical AI Residents\" — 10 médicos por ano em treinamento intensivo de 3 meses, voltando às especialidades como referências formais em IA clínica para todos os colegas."
    ]
  },
  "12.5": {
    "pergunta": "Existe capacidade organizacional (tempo, recursos) para absorver mudanças com IA?",
    "oQueAvalia": "Mede se há tempo e recursos reais — não apenas no planejamento, mas na prática — para que os colaboradores aprendam e implementem mudanças de IA sem entrar em sobrecarga crítica. Este é um dos maiores pontos cegos da transformação digital: empresas lançam iniciativas de IA sem considerar que as mesmas pessoas que precisam adotar as mudanças ainda têm suas obrigações operacionais cotidianas intactas. Capacidade de mudança é um recurso finito que precisa ser gerenciado ativamente.",
    "exemplosPorVertical": [
      "Serviços Financeiros: \"Change Calendar\" centralizado — rastreia todas as iniciativas que impactam cada área para evitar sobrecarga. Se área já absorve 2 mudanças grandes, nova iniciativa de IA é adiada formalmente para o próximo semestre.",
      "Varejo: Aloca 10% do tempo oficial de gerentes de loja para \"IA Adoption Activities\" — parte do job description, medido na avaliação de performance semestral, não apenas boa vontade pessoal.",
      "Saúde: Implementa mudança de IA em fases por especialidade — menor número de mudanças simultâneas por área clínica, monitorando impacto na satisfação e throughput antes de expandir.",
      "Indústria: Operadores que participam do piloto de IA têm 2h/semana de tempo estruturado e protegido para aprender e dar feedback — sem isso, participam apenas formalmente sem engajamento real."
    ]
  },
  "12.6": {
    "pergunta": "Há mecanismos para sustentar e reforçar as mudanças implementadas?",
    "oQueAvalia": "Sem mecanismos ativos de sustentação, mudanças — mesmo bem implementadas inicialmente — regridem ao comportamento anterior em 6-18 meses. Sustentação de mudança inclui: celebração visível de sucessos, consequências positivas para adoção (reconhecimento, promoção) e para não-adoção, integração das novas formas de trabalho nos processos formais e medição contínua de adoção vs. impacto.",
    "exemplosPorVertical": [
      "Varejo: Inclui \"uso de IA\" como critério formal de avaliação de desempenho para gestores — usar ferramentas disponíveis é esperado; usar e demonstrar impacto mensurável é reconhecido com bônus.",
      "Serviços Financeiros: \"AI Impact Award\" trimestral — reconhece no all-hands os times com maior valor gerado por IA, com case publicado no portal interno como referência para toda a empresa.",
      "Saúde: Uso de IA integrado nos protocolos clínicos formais — triagem via sistema de IA é o processo padrão documentado no protocolo clínico, revisado pelo Comitê de Qualidade.",
      "Indústria: \"AI Usage Dashboard\" visível na fábrica — mostra em tempo real quantas ordens de manutenção foram geradas pela IA vs. por falha inesperada; cria competição saudável entre turnos e equipes."
    ]
  },
  "12.7": {
    "pergunta": "A liderança intermediária (gerentes, coordenadores) apoia ativamente as mudanças de IA?",
    "oQueAvalia": "Verifica se gerentes e coordenadores — a \"liderança do cotidiano\" que mais influencia o comportamento dos colaboradores no dia a dia — facilitam ou bloqueiam a adoção de IA. A liderança intermediária é o elemento mais crítico e mais negligenciado na transformação de IA: tem poder real de implementar no cotidiano, mas frequentemente sente sua autoridade ameaçada por sistemas que automatizam decisões.",
    "exemplosPorVertical": [
      "Varejo: Gerentes de loja recebem dashboard de IA que reduz o trabalho deles (pedido automático de reposição, alertas de ruptura) antes de receberem qualquer cobrança de adoção — ganham valor antes de mudarem.",
      "Indústria: Supervisores de manutenção são co-criadores do sistema preditivo: sua expertise sobre as máquinas foi incorporada no modelo — eles apresentam o sistema para seus pares como algo que \"fizeram juntos\".",
      "Serviços Financeiros: Gerentes de agência têm \"AI Score\" mostrando o valor gerado pela IA na sua agência — competição amigável entre agências, com reconhecimento para as que mais usam efetivamente.",
      "Saúde: Coordenadores de enfermagem testam modelos antes dos médicos — feedback deles sobre usabilidade é incorporado antes do deploy clínico, fazendo-os sentir genuinamente donos da solução."
    ]
  },
  "12.8": {
    "pergunta": "Existe um plano estruturado de gestão de mudança para iniciativas de IA?",
    "oQueAvalia": "Mede se há metodologia formal de Change Management aplicada especificamente às iniciativas de IA — não um plano genérico de comunicação, mas um plano que endereça os desafios únicos de IA: medo de substituição por automação, opacidade dos modelos para não-especialistas, risco de automation bias, impacto no poder de decisão de diferentes níveis hierárquicos e velocidade de mudança tecnológica muito superior à capacidade humana de absorção.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Contrata Change Manager especializado em transformação digital para liderar programa de change management de IA — papel distinto do PMO de projeto e do time de comunicação interna.",
      "Logística: Cria \"Change Management Playbook para IA\" baseado nas lições dos primeiros projetos — template replicável para todos os novos projetos, reduzindo tempo de planejamento e erros recorrentes."
    ]
  },
  "13.1": {
    "pergunta": "Existe uma plataforma centralizada de IA para desenvolvimento, deploy e monitoramento?",
    "oQueAvalia": "Verifica se há infraestrutura unificada que suporta todo o ciclo de vida de modelos de IA — desenvolvimento (notebooks, experimentos, versionamento), deploy (staging, produção, canary) e monitoramento (drift, performance, alertas). Sem plataforma centralizada, cada projeto reinventa a roda em infraestrutura e processo — o custo de operação cresce linearmente com o número de modelos. Com plataforma matura, o custo marginal de adicionar um novo modelo é 10-20x menor. O DBS Bank (Singapura) com 800+ modelos é a referência global.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Plataforma em 3 camadas: (1) Dados (Databricks + dbt), (2) Treinamento (Kubeflow + MLflow), (3) Serving (Seldon + Prometheus) — 40 modelos operados por equipe de apenas 5 MLOps.",
      "Varejo: AWS SageMaker como plataforma central — todos os Data Scientists usam o mesmo ambiente, todos os modelos passam pelo mesmo pipeline CI/CD, todos monitorados no mesmo dashboard.",
      "Consultoria/TI: \"Fábrica Agêntica\" com plataforma de agentes (LangChain + LangSmith + vector store + orquestrador) — cada novo agente leva 2 semanas para ir a produção vs. 3 meses sem plataforma.",
      "Indústria: Azure IoT Hub + Azure ML + Grafana — sensores de 800 pontos de medição alimentam modelos de manutenção e qualidade de forma contínua, automatizada e com rastreabilidade completa."
    ]
  },
  "13.2": {
    "pergunta": "Há arquitetura para reuso de modelos e componentes de IA entre projetos?",
    "oQueAvalia": "Mede se há economia de escala através de componentização e reuso — feature stores compartilhadas, model registries com modelos base reutilizáveis e componentes de IA modulares (embeddings, classificadores, extratores de entidades) que múltiplos projetos consomem. O reuso é o que permite que empresas com maturidade alta entreguem novos casos de uso em semanas — porque 80% das peças já existem e precisam apenas de pequena customização para o novo contexto.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Feature Store (Feast) com 200+ features computadas uma vez e reutilizadas em 12 modelos — \"comportamento transacional dos últimos 90 dias\" usada por score de crédito, fraude e churn.",
      "Varejo: \"Embeddings de produto\" no model registry — representação vetorial treinada uma vez, reutilizada por recomendação, search semântico, detecção de duplicatas e categorização automática.",
      "Consultoria/TI: Biblioteca de \"AI Components\" — extrator de entidades de texto, classificador de sentimento, gerador de resposta formal — cada agente novo usa componentes existentes como building blocks.",
      "Logística: Modelo de previsão de tempo de entrega reutilizado como componente: originalmente para roteirização, também usado por precificação, comunicação ao cliente e SLA de contratos comerciais."
    ]
  },
  "13.3": {
    "pergunta": "Existem dashboards de negócio que mostram o valor gerado pela IA em tempo real?",
    "oQueAvalia": "Avalia se há visibilidade do impacto de IA em métricas de negócio — não apenas métricas técnicas (acurácia, latência) mas impacto financeiro e operacional real, em tempo próximo do real, visível para executivos e gestores de negócio sem necessidade de preparação de relatórios. Dashboards de valor de IA usam linguagem de negócio (R$, %, NPS), mostram tendência e comparação com o baseline pré-IA.",
    "exemplosPorVertical": [
      "Varejo: \"AI Value Dashboard\" no Power BI acessível a qualquer gerente: valor gerado por recomendação esta semana vs. semana sem IA, economia em ruptura vs. mês anterior, CSAT de atendimento via chatbot.",
      "Serviços Financeiros: \"AI P&L\" mensal — mostra contribuição de cada modelo para o resultado: R$ de carteira aprovada pela IA, R$ de fraude evitado, R$ de custo operacional economizado.",
      "Logística: Painel de operação exibe em TV na sala de comando: combustível economizado hoje pela roteirização IA vs. baseline histórico — visibilidade imediata do valor gerado para todos da equipe.",
      "Saúde: \"Clinical AI Report\" semanal para diretores clínicos: pacientes triados, % concordante com avaliação médica, casos onde IA antecipou piora não percebida pelo time assistencial."
    ]
  },
  "13.4": {
    "pergunta": "A empresa tem capacidade de colocar modelos em produção em dias?",
    "oQueAvalia": "Mede a velocidade de deploy — da aprovação do modelo até a disponibilidade real em produção. Benchmark de maturidade por nível: Nível 1 = meses; Nível 2 = semanas; Nível 3 = 1-2 semanas; Nível 4 = dias; Nível 5 = horas. Velocidade de deploy é um indicador composto de qualidade do pipeline MLOps, automação de testes, processo de aprovação e maturidade da infraestrutura de serving. No contexto de competição com GenAI em 2025, a capacidade de iterar rapidamente em modelos é diferencial competitivo crescente.",
    "exemplosPorVertical": [
      "Consultoria/TI: Pipeline MLOps completo: código → testes unitários → validação de performance → aprovação de 2 pessoas → staging → smoke test → produção em menos de 4 horas totais.",
      "Serviços Financeiros: 3 dias para atualizar modelo de score de crédito: 1 dia de retreinamento + validação automática, 1 dia de testes de regressão, 1 dia de aprovação formal de Model Risk Management.",
      "Varejo: Retreinamento automático semanal do modelo de recomendação — sem intervenção humana, com gate automático: se acurácia cair >5%, alerta para revisão antes de ir a produção.",
      "Logística: Adapta modelo de roteirização para nova cidade em 5 dias úteis: 2 dias de coleta e validação de dados, 2 dias de retreinamento e testes, 1 dia de deploy gradual controlado."
    ]
  },
  "13.5": {
    "pergunta": "Há padronização de frameworks, bibliotecas e tecnologias de IA?",
    "oQueAvalia": "Verifica se há stack técnica definida e respeitada — ou se cada equipe escolhe ferramentas diferentes, criando fragmentação que impede reuso e colaboração entre times. Padronização não significa rigidez: um \"Technology Radar\" com ferramentas obrigatórias, recomendadas, permitidas e evitadas permite flexibilidade controlada. Stack padrão moderna para IA: Python + MLflow + PyTorch/TensorFlow + LangChain (GenAI) + FastAPI (serving) + Kubernetes (orquestração).",
    "exemplosPorVertical": [
      "Consultoria/TI: Stack padrão publicado internamente: Python obrigatório, LangChain para orquestração de agentes, Anthropic/OpenAI como LLM providers, FastAPI para serving, MLflow para tracking — exceções precisam de aprovação arquitetural.",
      "Serviços Financeiros: \"Golden Path\" para IA — ambiente pré-configurado com todas as dependências aprovadas que qualquer Data Scientist instancia em menos de 10 minutos, sem solicitar nada ao TI.",
      "Varejo: TensorFlow para modelos de recomendação (herança dos modelos existentes) e PyTorch para novos projetos de visão computacional — convivência gerenciada com plano de migração explícito.",
      "Indústria: Stack IoT+ML padronizado: Ignition SCADA → Azure IoT Hub → Databricks → Azure ML → Power BI — qualquer novo projeto de IA industrial segue esse path sem reescrever integrações."
    ]
  },
  "13.6": {
    "pergunta": "Existe orquestração de pipelines de dados e ML de ponta a ponta?",
    "oQueAvalia": "Avalia se há automação e rastreabilidade de todo o fluxo de IA — desde a ingestão de dados (streaming ou batch), passando por transformações (feature engineering), treinamento, validação e deploy até o monitoramento contínuo em produção. Orquestração matura usa ferramentas como Apache Airflow, Prefect, Dagster ou Kubeflow Pipelines para garantir: execução reproduzível, rastreabilidade completa de erros, retry automático em falhas transitórias, alertas de falha e documentação automática do histórico de execuções.",
    "exemplosPorVertical": [
      "Varejo: Airflow orquestra pipeline de recomendação: coleta de eventos (24h) → feature engineering (2h) → retreinamento (4h) → validação automática (30min) → deploy se aprovado. Sem intervenção humana.",
      "Serviços Financeiros: Kubeflow Pipelines para modelos de crédito — cada execução registrada com: versão do código, versão dos dados, hiperparâmetros, métricas e ambiente. Reproduzível por auditores do BACEN.",
      "Logística: Prefect orquestra dados de telemática: ingestão de 500k eventos/dia → agregações por veículo → features de comportamento → atualização de modelo de risco → scoring em tempo real.",
      "Indústria: Azure Data Factory + Azure ML Pipelines — dados de sensores → qualidade → treinamento semanal → validação → deploy — pipeline documentado e versionado no Azure DevOps."
    ]
  },
  "13.7": {
    "pergunta": "Quantos experimentos/PoCs de IA são executados por ano?",
    "oQueAvalia": "Mede a velocidade de experimentação — um indicador composto de cultura de inovação, capacidade técnica de execução e processo de gestão de portfólio. A referência global é o DBS Bank (Singapura) que executa mais de 1.000 experimentos por ano com sua \"AI Factory\". Para o contexto brasileiro, empresas Nível 3 executam 50-200 experimentos/ano; Nível 4 chegam a 200-500. Volume de experimentos é proxy de velocidade de aprendizado e capacidade de descobrir oportunidades antes dos concorrentes.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Rastreia experimentos no MLflow — 340 PoCs executados em 2024: 180 em GenAI, 95 em ML clássico e 65 em IA agêntica. Taxa de conversão para produção: 22% — benchmark saudável.",
      "Varejo: Conta cada A/B test de modelo como experimento — 420 testes em 2024 em personalização (280), precificação (90) e search (50). Dashboard público mostra velocidade por time.",
      "Consultoria/TI: Meta de 100 experimentos de IA em 2025 — começa com 35 em 2024, cria processo de \"AI Hackathon\" mensal para aumentar cadência de forma sustentada.",
      "Indústria: 68 PoCs em 2024: 30 em manutenção, 25 em qualidade, 13 em energia. Cada PoC documentado em wiki interno como aprendizado organizacional disponível para toda a empresa."
    ]
  },
  "13.8": {
    "pergunta": "Qual o impacto econômico total quantificado dos projetos de IA?",
    "oQueAvalia": "Mede o valor financeiro total documentado e auditável gerado por todos os projetos de IA da organização — não apenas um projeto específico, mas o portfólio completo acumulado. A referência global é o DBS Bank com S$370M (aproximadamente R$1,5B) em impacto acumulado documentado. Para empresas brasileiras, a escala é diferente, mas a metodologia de quantificação rigorosa e acumulada é o marcador de maturidade. Empresas Nível 4+ conseguem responder \"quanto a IA vale para nós?\" com número auditável e metodologia transparente.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Impacto acumulado documentado em 3 anos: R$45M em redução de fraude, R$82M de carteira adicional via IA, R$23M de economia operacional, R$15M em retenção por NPS = R$165M total auditável.",
      "Logística: Rastreia impacto por modelo em produção: roteirização (R$28M/ano), manutenção preditiva (R$8M/ano), telemática de risco (R$4M/ano em redução de seguros) = R$40M/ano documentado.",
      "Varejo: Consolida impacto no relatório anual para investidores: IA contribuiu com R$120M de receita adicional e R$35M de eficiência operacional em 2024, representando 3,2% do EBITDA.",
      "Indústria: Documenta impacto por projeto: manutenção preditiva (R$15M), qualidade (R$8M), energia (R$6M) = R$29M/ano — cada valor com metodologia de cálculo explícita e auditável."
    ]
  },
  "14.1": {
    "pergunta": "A empresa monetiza suas capacidades de IA vendendo serviços ou produtos para terceiros?",
    "oQueAvalia": "Verifica se IA é fonte de receita externa — não apenas centro de custo interno ou vantagem operacional. Monetização de IA pode acontecer de várias formas: vender modelos treinados como serviço (AIaaS), licenciar plataformas de IA para parceiros, vender produtos aumentados por IA com preço premium, ou criar novos serviços que só existem por causa da IA. O Ping An Group (China) é a referência global: monetizou capacidades de IA para mais de 3.000 empresas e 30 bancos, gerando mais receita de IA do que de seguros em algumas linhas.",
    "exemplosPorVertical": [
      "Consultoria/TI: Empresa cria \"Fábrica Agêntica\" como produto vendável — vende o Setup COI-IA: infraestrutura de agentes IA funcionando no cliente em 90 dias, cobrado por resultado e não por hora.",
      "Serviços Financeiros: Disponibiliza API de score de crédito para fintechs parceiras — 15 fintechs consomem o modelo do banco como serviço, pagando por análise. Nova linha de R$4M/ano de receita.",
      "Saúde: Hospital monetiza modelo de diagnóstico de imagem para clínicas menores sem radiologista 24/7 — SaaS de laudos automatizados com revisão de médico remoto nos alertas. R$2M/ano de receita nova.",
      "Logística: Lança \"FreightSense AI\" para embarcadores — plataforma de inteligência de frete com IA preditiva vendida como produto separado, gerando receita além da operação logística tradicional."
    ]
  },
  "14.2": {
    "pergunta": "Existem novos modelos de negócio baseados exclusivamente em IA?",
    "oQueAvalia": "Mede se IA habilitou linhas de negócio que literalmente não existiriam sem IA — não apenas otimização do modelo existente, mas criação de algo genuinamente novo que gera receita própria. Exemplos de modelos de negócio que só existem por causa de IA: diagnóstico médico remoto escalável em volumes impossíveis sem IA, precificação dinâmica com granularidade por produto/horário/cliente, recomendação personalizada em tempo real para milhões de usuários.",
    "exemplosPorVertical": [
      "Consultoria/TI: Cria \"AI Setup COI\" como produto autônomo — pacote de consultoria + tecnologia cobrado por resultado. Modelo completamente novo: nenhuma empresa de TI tradicional vendia isso antes.",
      "Saúde: Rede cria \"AI-First Clinic\" — clínica sem médico presencial para consultas de rotina onde IA faz triagem e médico remoto valida por telemedicina. Escala impossível sem IA.",
      "Varejo: Cria \"Style Match AI\" — personal shopper automatizado que aprende o gosto do cliente. Receita recorrente de assinatura que não existia antes da IA ser capaz de personalizar em escala.",
      "Logística: \"Freight Intelligence Platform\" — produto de dados e IA vendido para embarcadores que querem analisar o mercado de frete e precificar melhor. Linha de negócio completamente nova."
    ]
  },
  "14.3": {
    "pergunta": "A empresa oferece \"IA as a Service\" (AIaaS) para clientes ou parceiros?",
    "oQueAvalia": "Avalia se há oferta de APIs de IA, plataformas de IA ou modelos de IA como serviço externo — transformando capacidade interna desenvolvida em produto externo gerador de receita. AIaaS pode ser: APIs de modelos específicos (score de crédito, análise de sentimento, extração de dados de documentos), plataformas de desenvolvimento de IA, ou modelos pré-treinados customizáveis por clientes de diferentes setores.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Expõe 5 APIs de IA via Open Finance: score de crédito, análise de capacidade de pagamento, detecção de fraude, análise de comprovantes e cashflow — fintechs parceiras consomem via marketplace regulado.",
      "Saúde: \"Diagnostic AI API\" para clínicas parceiras — análise automática de exames de imagem com resultado em menos de 5 minutos, disponível via REST API com preço por análise realizada.",
      "Varejo: Vende \"Consumer Intelligence API\" para marcas parceiras do ecossistema — insights de comportamento de compra (anonimizados e agregados) e predição de demanda por região geográfica.",
      "Consultoria/TI: Empacota ferramenta de análise de contratos com IA como produto SaaS — vendida para escritórios de advocacia e empresas com alto volume contratual que precisam de velocidade."
    ]
  },
  "14.4": {
    "pergunta": "Qual percentual da receita total é atribuído a produtos/serviços de IA?",
    "oQueAvalia": "Mede a contribuição de IA para a receita total da empresa — indicador que mostra quão \"AI-first\" a empresa realmente é na prática. Empresas em transformação têm 0-5% de receita de IA; empresas avançadas chegam a 15-30%; empresas AI-first como Palantir, C3.ai e DataRobot têm mais de 80%. Para empresas não-nativas de IA, a meta razoável de 5 anos é 10-15% de receita com origem direta ou fortemente influenciada pela IA.",
    "exemplosPorVertical": [
      "Consultoria/TI: Projetos com IA como componente central representam 35% da receita em 2024 vs. 8% em 2022 — crescimento consistente de 9 pontos percentuais por ano. Meta: 60% em 2026.",
      "Serviços Financeiros: Atribui 12% da receita a produtos habilitados por IA: aprovação ágil de crédito, seguros personalizados e investimentos automatizados. Cresce 3 pontos percentuais por ano.",
      "Varejo: IA de recomendação contribui com 18% do GMV do e-commerce — sendo o principal diferencial competitivo em relação a concorrentes sem sistema equivalente.",
      "Saúde: Serviços de telelaudo e telediagnóstico habilitados por IA representam 8% da receita — linha que não existia 3 anos antes da implementação da plataforma de IA diagnóstica."
    ]
  },
  "14.5": {
    "pergunta": "A empresa possui propriedade intelectual (patentes, modelos proprietários) em IA?",
    "oQueAvalia": "Verifica se há Propriedade Intelectual de IA que diferencia a empresa competitivamente e tem valor protegível: patentes de processos ou aplicações de IA, modelos treinados com dados proprietários únicos que concorrentes não conseguem replicar, algoritmos proprietários ou trade secrets técnicos que constituem vantagem competitiva duradoura. PI em IA é ativo crescentemente valioso — startups de IA são avaliadas em grande parte por sua base de PI.",
    "exemplosPorVertical": [
      "Indústria: Registra modelos de IA para detecção de defeitos cerâmicos como software no INPI — conjunto de 15 anos de imagens de defeitos reais é o moat competitivo inimitável sem os dados.",
      "Serviços Financeiros: Patenteia processo de \"análise de crédito multidimensional baseada em comportamento digital\" — primeiro no Brasil a fazê-lo, cria barreira contra fintechs copiando a metodologia.",
      "Saúde: Startup de diagnóstico registra modelo treinado com banco único de exames de doenças tropicais brasileiras — competidor estrangeiro não consegue replicar sem acesso a essa base de dados específica.",
      "Logística: Trade secret em modelo de previsão de tráfego urbano brasileiro — treinado com 8 anos de dados proprietários de frota, não replicável por concorrente sem esse histórico específico."
    ]
  },
  "14.6": {
    "pergunta": "Há vendedores/consultores treinados para vender soluções de IA para clientes?",
    "oQueAvalia": "Mede a capacidade comercial de transformar capacidades de IA em receita — o elo mais fraco em muitas empresas de tecnologia que criam excelentes produtos de IA mas não conseguem vendê-los de forma escalável. Vender IA é diferente de vender software tradicional: requer entendimento do caso de uso do cliente, capacidade de demonstrar valor de forma concreta (ROI, cases similares) e habilidade de navegar objeções técnicas e éticas específicas de IA.",
    "exemplosPorVertical": [
      "Consultoria/TI: Treina 100% dos consultores sênior em \"AI Value Selling\" — como identificar casos de uso no cliente, quantificar valor esperado e construir business case convincente durante o processo comercial.",
      "Saúde: Startup de IA médica contrata \"Clinical AI Specialists\" para vendas — ex-médicos que falam a linguagem do médico, do gestor e do financeiro do hospital de forma genuinamente credível.",
      "Indústria: Field engineers treinados em IA — quando visitam fábricas de clientes, identificam oportunidades de IA e abrem conversa comercial com linguagem do cliente (OEE, downtime, qualidade).",
      "Serviços Financeiros: \"AI Partnership Sales\" separada da venda tradicional — equipe especializada em vender APIs de IA para fintechs parceiras, com modelo de precificação por consumo e sucesso do cliente."
    ]
  },
  "15.1": {
    "pergunta": "Qual o nível de maturidade em IA Analítica/Tradicional?",
    "oQueAvalia": "Mede a capacidade em IA Analítica — o conjunto de técnicas mais estabelecidas de Machine Learning: modelos de classificação (XGBoost, Random Forest), regressão, clustering, séries temporais, sistemas de recomendação e deep learning supervisionado. É a categoria com maior ROI comprovado e menor risco técnico.",
    "exemplosPorVertical": [
      "Serviços Financeiros: IA Analítica em nível 4-5: 40+ modelos de ML em produção, AutoML para atualizações frequentes, feature engineering automatizado, modelos gerando mais de R$150M de valor documentado.",
      "Varejo: Nível 3-4: previsão de demanda (ARIMA + LSTM), classificação de clientes (Random Forest), precificação (Gradient Boosting) — todos em produção com pipeline MLOps maduro.",
      "Saúde: Nível 3: modelos de predição de internação, risco de readmissão e mortalidade cirúrgica — todos revisados clinicamente, em produção, com impacto documentado em indicadores de qualidade.",
      "Logística: Nível 4: roteirização, previsão de demanda de frete, detecção de desvio de rota e scoring de motoristas — todos integrados aos sistemas operacionais em tempo real."
    ]
  },
  "15.2": {
    "pergunta": "Qual o nível de maturidade em IA Generativa?",
    "oQueAvalia": "Avalia o uso de IA Generativa — Large Language Models (LLMs como GPT-4, Claude, Llama), modelos de geração de imagem, geração de código (GitHub Copilot, Cursor) e modelos multimodais. Em 2025, empresas maduras estão transitando do Pilot para Production em múltiplos casos de uso simultaneamente.",
    "exemplosPorVertical": [
      "Consultoria/TI: Nível 4: LLMs em produção para análise de contratos, geração de código, atendimento a clientes e documentação técnica — com RAG para domínio específico e fine-tuning leve documentado.",
      "Varejo: Nível 3: GenAI em produção para descrição de produtos, resposta a perguntas de clientes (RAG sobre catálogo) e geração de e-mails personalizados — governança definida, uso auditado mensalmente.",
      "Serviços Financeiros: Nível 3-4: GenAI para análise de documentos de crédito PJ, geração de relatórios regulatórios e sumarização de chamadas de SAC — com validação humana obrigatória para decisões regulatórias.",
      "Saúde: Nível 2-3: LLMs para geração de sumários de prontuário para handoff entre plantões (com revisão médica obrigatória) e extração estruturada de informação de laudos não-estruturados."
    ]
  },
  "15.3": {
    "pergunta": "Qual o nível de maturidade em IA Agêntica?",
    "oQueAvalia": "Mede a capacidade em IA Agêntica — sistemas de IA que recebem um objetivo e agem autonomamente: planejam etapas, usam ferramentas (APIs, bancos de dados, código), executam ações em sistemas externos e se adaptam aos resultados obtidos. Multi-Agent Systems (MAS) são redes de agentes especializados que colaboram entre si para objetivos complexos.",
    "exemplosPorVertical": [
      "Consultoria/TI: Nível 3-4: agentes executando análise de contrato de ponta a ponta (lê PDF → extrai cláusulas → compara template → gera relatório de riscos) com supervisão humana apenas no output final.",
      "Varejo: Nível 2-3: primeiros agentes para fulfillment (decide automaticamente substitutos quando item está em falta, comunica cliente e processa troca) — com circuit breakers para casos de alta complexidade.",
      "Serviços Financeiros: Nível 2: explorando agentes para onboarding de PJ (coleta documentos, consulta bases públicas, verifica compliance e prepara dossiê) — piloto com supervisão humana total em 100% dos casos.",
      "Saúde: Nível 1-2: estudando agentes para gestão de leitos (monitora alta, coordena limpeza, comunica próximo paciente) — ainda em análise de viabilidade e requisitos de segurança clínica."
    ]
  },
  "15.4": {
    "pergunta": "Qual o nível de maturidade em IA Robótica (RPA cognitivo, automação física)?",
    "oQueAvalia": "Avalia o uso de RPA (Robotic Process Automation) com IA — indo além do RPA básico (automação de cliques em dados estruturados) para RPA Cognitivo (que entende documentos, textos e imagens com NLP/Vision), Process Mining (que descobre automaticamente oportunidades de automação) e, em contextos industriais, Robótica Física com IA (cobots com visão computacional, sistemas de inspeção autônoma). A IA eleva o RPA de \"macro de computador\" para \"automação inteligente que lida com exceções\".",
    "exemplosPorVertical": [
      "Serviços Financeiros: Nível 4: RPA Cognitivo automatiza 85% do processamento de documentos (extratos, contratos, comprovantes) — IDP com acurácia de 94% sem intervenção humana em documentos padrão.",
      "Saúde: Nível 3: RPA para faturamento TISS (envio de guias para operadoras), agendamento automático de retornos e envio de laudos — liberando 30% do tempo das secretárias.",
      "Indústria: Nível 4-5: robôs com visão computacional inspecionam 100% das peças cerâmicas inline, rejeitam defeituosas automaticamente e alimentam modelo que previne defeitos na próxima produção.",
      "Varejo: Nível 3: RPA + NLP processa automaticamente 60% das notas fiscais de fornecedores — OCR extrai dados, modelo valida contra pedido de compra, sistema aprova ou escala para humano."
    ]
  },
  "15.5": {
    "pergunta": "A empresa consegue combinar múltiplos tipos de IA em soluções integradas?",
    "oQueAvalia": "Verifica se há capacidade de criar soluções que integram diferentes tipos de IA em uma solução coesa e orquestrada — por exemplo: IA Analítica (detecta padrão anômalo nos dados) + IA Generativa (explica a anomalia em linguagem natural compreensível) + IA Agêntica (toma ação corretiva nos sistemas afetados). Soluções integradas são mais poderosas do que soluções de tipo único, mas exigem: arquitetura de orquestração robusta, padrões de integração claros entre tipos e equipe com expertise diversificada.",
    "exemplosPorVertical": [
      "Consultoria/TI: Análise de contrato integra: IA Analítica (classifica tipo de contrato), GenAI (extrai e resume cláusulas), IA Agêntica (consulta bases públicas e verifica compliance) — orquestrada por LangGraph.",
      "Logística: Telemetria integra: IA Analítica (detecta padrão de comportamento de risco), GenAI (gera coaching personalizado para o motorista), RPA (envia notificação e registra no sistema de RH).",
      "Saúde: Triagem integra: IA Analítica (score de risco por sinais vitais), GenAI (sumariza histórico do paciente para o médico), Agente (coleta dados complementares automaticamente de sistemas integrados).",
      "Indústria: Qualidade integra: Visão Computacional (detecta defeito na peça), IA Analítica (classifica tipo e causa raiz), GenAI (gera ordem de não-conformidade explicada), RPA (notifica fornecedor e atualiza QMS)."
    ]
  },
  "15.6": {
    "pergunta": "Há roadmap claro de evolução para cada tipo de IA?",
    "oQueAvalia": "Mede se há planejamento de evolução tecnológica para cada tipo de IA — definindo onde a empresa quer estar em cada categoria em 1, 2 e 3 anos, com as dependências entre tipos explicitadas (IA Agêntica requer IA Analítica e IA Generativa maduras como base). Roadmap por tipo de IA previne investimento ineficiente como: GenAI sem dados estruturados suficientes, IA Agêntica sem plataforma de observabilidade, ou automação robótica sem processo de governança estabelecido.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Roadmap por tipo: Analítica (Nível 4, manter e otimizar), GenAI (Nível 3 → 4 em 18 meses com fine-tuning), Agêntica (Nível 2 → pilotos em 6 meses), Robótica (Nível 3, expandir cobertura).",
      "Consultoria/TI: Roadmap explícito: Agêntica como aposta principal (Nível 3 → 5 em 24 meses), GenAI como habilitadora (Nível 3 → 4 em 12 meses), Analítica como base a sustentar (Nível 3, manutenção).",
      "Varejo: Sequência clara: primeiro consolida Analítica (Nível 4), depois escala GenAI em e-commerce (Nível 3 → 4), depois explora Agêntica em supply chain (Nível 2 → 3) — com dependências explícitas.",
      "Saúde: Roadmap clínico: Analítica diagnóstica (expandir especialidades), GenAI para documentação clínica (pilotar em 6 meses), Agêntica para gestão de leitos (18+ meses, após governança madura estabelecida)."
    ]
  },
  "15.7": {
    "pergunta": "Existem especialistas dedicados para cada tipo de IA?",
    "oQueAvalia": "Verifica se há expertise específica em cada tipo de IA — não apenas generalistas que \"conhecem IA em geral\": ML Engineers para IA Analítica, LLM Engineers e Prompt Engineers para IA Generativa, AI Agents Engineers para IA Agêntica, e RPA Architects para IA Robótica. Especialização por tipo é necessária porque cada categoria tem suas ferramentas específicas, armadilhas conhecidas, métricas de avaliação próprias e boas práticas que um generalista não domina com a profundidade necessária.",
    "exemplosPorVertical": [
      "Consultoria/TI: Por tipo: 5 ML Engineers (Analítica), 4 LLM Engineers (GenAI), 3 AI Agents Engineers (Agêntica), 2 RPA Architects (Robótica) + 2 AI Architects que entendem todos os tipos e fazem pontes.",
      "Serviços Financeiros: Contrata \"GenAI Tech Lead\" especializado em LLMs (ex-Big Tech), mantém time de ML Engineers para Analítica e inicia formação interna em Agêntica via programa de residência.",
      "Varejo: Expertise em Analítica (time de 12) e GenAI (time de 5 emergente), mas ainda sem expertise dedicada em Agêntica e Robótica — gap explicitamente reconhecido no workforce planning anual.",
      "Saúde: Médicos-pesquisadores especializados em IA Analítica clínica, parceria com startup para GenAI de documentação, explorando Agêntica — roadmap de contratação e formação claro e financiado."
    ]
  },
  "15.8": {
    "pergunta": "A empresa monitora e avalia novas tecnologias em cada tipo de IA?",
    "oQueAvalia": "Avalia se há processo sistemático de technology scouting para cada tipo de IA — acompanhando papers no ArXiv, releases de novos modelos e frameworks, e aplicações emergentes de mercado. O ritmo de evolução em IA em 2024-2025 é sem precedentes históricos: novas capacidades surgem a cada poucas semanas. Empresas sem radar tecnológico ativo ficam invariavelmente 1-2 anos atrasadas em relação ao estado da arte disponível.",
    "exemplosPorVertical": [
      "Consultoria/TI: Time técnico tem ritual mensal de \"AI Newsletter Review\" — avalia 10 papers relevantes do ArXiv, novos releases de modelos e ferramentas, e decide quais entram para experimentação interna imediata.",
      "Serviços Financeiros: \"AI Technology Scout\" como função dedicada — pessoa que monitora mercado globalmente, testa novos modelos em sandbox e produz relatório trimestral de impacto potencial para o negócio.",
      "Indústria: Parceria com FIESP e CNI para acompanhar adoção de IA na indústria brasileira e global — benchmarking setorial anual que informa o roadmap tecnológico e as prioridades de investimento."
    ]
  },
  "16.1": {
    "pergunta": "Qual a eficácia da IA em melhorar as OPERAÇÕES da empresa?",
    "oQueAvalia": "Mede o impacto real da IA na eficiência, produtividade e qualidade das operações internas — o domínio onde IA tem o ROI mais rápido e mais mensurável, e onde a maioria das empresas começa sua jornada. O DBS Bank cita que IA está embedded em mais de 80% dos processos operacionais como referência de Nível 5 de maturidade.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Eficácia Alta (Nível 4): -65% no tempo de análise de crédito PJ, -45% em custo de SAC com chatbot, -28% em custo de processamento de documentos com IDP — impacto em mais de 30% dos processos.",
      "Indústria: Eficácia Alta (Nível 4): IA de manutenção preditiva aumentou OEE de 71% para 83% em 18 meses, reduzindo custo de produção por tonelada em R$12, impacto medido continuamente.",
      "Saúde: Eficácia Moderada-Alta (Nível 3-4): triagem reduziu tempo de espera 35%, laudos reduziram backlog de imagem 60%, gestão de leitos aumentou giro de leito 18% — impacto clínico e operacional simultâneo."
    ]
  },
  "16.2": {
    "pergunta": "Qual a eficácia da IA em melhorar a EXPERIÊNCIA DO CLIENTE?",
    "oQueAvalia": "Avalia o impacto da IA na satisfação, personalização e velocidade de atendimento ao cliente — o domínio de maior potencial de diferenciação competitiva a longo prazo. Impacto em CX inclui: personalização em tempo real, atendimento 24/7 sem perda de qualidade, redução de atritos na jornada e proatividade (empresa contata cliente antes que ele tenha o problema).",
    "exemplosPorVertical": [
      "Varejo: Eficácia Alta (Nível 4): recomendação personalizada aumentou NPS +12 pontos, CTR +45%, valor médio de pedido +18%. Chatbot com IA resolveu 70% das interações com CSAT 4,2/5 sem humano.",
      "Serviços Financeiros: Eficácia Alta (Nível 4): onboarding digital com IA reduziu taxa de abandono de 55% para 22%, NPS de onboarding subiu 28 pontos, aprovação de crédito em <30s para 80% dos casos.",
      "Saúde: Eficácia Moderada (Nível 3): agendamento inteligente reduziu no-show de 23% para 11%, satisfação do paciente subiu 15 pontos em pesquisa trimestral, tempo de espera por consulta caiu 35%.",
      "Logística: Eficácia Alta (Nível 4): rastreamento em tempo real com IA reduziu contatos de rastreamento ao SAC em 42%, NPS subiu 18 pontos com visibilidade proativa sobre o status das entregas."
    ]
  },
  "16.3": {
    "pergunta": "Qual a eficácia da IA em suportar e desenvolver o ECOSSISTEMA?",
    "oQueAvalia": "Mede o impacto da IA no relacionamento com parceiros, fornecedores e comunidade — o domínio de maior potencial de criação de valor de longo prazo, mas também o mais difícil de quantificar.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Eficácia Moderada-Alta (Nível 3-4): APIs de IA para fintechs parceiras via Open Finance, modelos de risco compartilhados com seguradoras parceiras, insights de comportamento para lojistas.",
      "Varejo: Eficácia Moderada (Nível 3): APIs de dados de comportamento para fornecedores parceiros, previsão de demanda compartilhada com fornecedores estratégicos, integração com marketplaces via IA.",
      "Saúde: Eficácia Moderada (Nível 3): IA para coordenação de cuidados entre hospital e rede ambulatorial, integração com laboratórios parceiros via API, plataforma de dados compartilhada com planos de saúde.",
      "Logística: Eficácia Alta (Nível 4): plataforma de IA disponível para embarcadores parceiros, APIs de roteirização e precificação integradas ao sistema de clientes B2B, ecossistema de dados de tráfego compartilhado."
    ]
  },
  "16.4": {
    "pergunta": "A IA está EMBUTIDA nas decisões estratégicas e operacionais do dia a dia?",
    "oQueAvalia": "Verifica se IA é parte integral das decisões — não uma ferramenta consultada ocasionalmente quando há tempo e disposição, mas componente estrutural dos processos decisórios em múltiplos níveis da organização.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Nível 4: IA decide automaticamente aprovação de crédito para 80% dos casos (score > limiar), sugere faixa de taxa para os outros 20%, humano valida e ajusta com contexto qualitativo.",
      "Varejo: Nível 3-4: reposição de estoque automatizada para 70% dos SKUs, precificação dinâmica automática para 40% do catálogo, promoções sugeridas por IA para aprovação do gestor comercial.",
      "Saúde: Nível 3: IA integrada na triagem de todos os pacientes da emergência, sugestão de protocolos clínicos embutida no prontuário, alertas de deterioração integrados ao fluxo de monitoramento.",
      "Logística: Nível 4: roteirização 100% automatizada pela IA para frota própria, alocação de veículos e motoristas por IA, precificação dinâmica automática para contratos spot de frete."
    ]
  },
  "16.5": {
    "pergunta": "Os modelos de IA atendem aos SLAs de negócio?",
    "oQueAvalia": "Mede se os modelos entregam disponibilidade, latência e acurácia esperadas pelos processos de negócio que dependem deles — não apenas se tecnicamente funcionam, mas se atendem às expectativas reais de performance que os usuários de negócio têm. SLAs de negócio para IA diferem de SLAs de software tradicionais: incluem métricas de qualidade do resultado (acurácia, relevância, precisão) além de disponibilidade e velocidade.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Atende SLA rigoroso (Nível 4-5): 99,95% de disponibilidade do modelo de fraude, <50ms de latência P99, precisão de 87% vs. target de 85% — monitorado em tempo real com alertas automáticos.",
      "Varejo: Atende SLA definido (Nível 4): recomendação com <200ms em 98% das requisições, mínimo de 5 itens relevantes em 95% dos casos, fallback automático funcionando conforme especificado.",
      "Saúde: Atende SLA clínico (Nível 3-4): triagem com resultado em <8s para 99% dos casos vs. SLA de 10s, sensibilidade de 96% para casos críticos vs. target de 95%, revisado semanalmente.",
      "Logística: Atende SLA operacional (Nível 4): roteirização em <90s para 99,5% das solicitações vs. SLA de 2 min, qualidade das rotas dentro de 2% do ótimo vs. target de 3%, monitorado diariamente."
    ]
  },
  "16.6": {
    "pergunta": "Qual o nível de satisfação dos usuários internos com as ferramentas de IA?",
    "oQueAvalia": "Avalia se os colaboradores que usam ferramentas de IA no dia a dia estão satisfeitos com elas — se as ferramentas realmente tornam o trabalho melhor, mais fácil ou mais impactante. Satisfação interna de usuários de IA é um indicador robusto de adoção real vs. adoção forçada, e um preditor confiável de sustentação do uso ao longo do tempo. Insatisfação crônica com ferramentas de IA frequentemente leva ao abandono silencioso — colaboradores voltam aos processos manuais sem comunicar o problema.",
    "exemplosPorVertical": [
      "Serviços Financeiros: Satisfação Alta (Nível 4): NPS interno das ferramentas de IA = 42 (escala -100 a +100), 78% dos usuários classificam as ferramentas como \"essenciais\" para sua produtividade diária.",
      "Varejo: Satisfação Boa (Nível 3-4): CSAT das ferramentas de IA = 4,1/5, 65% dos gestores de loja usam dashboard de IA diariamente, 85% de aderência ao sistema de reposição automática.",
      "Saúde: Satisfação Moderada (Nível 3): NPS interno = 28, 70% dos médicos que usam as ferramentas as avaliam como \"úteis ou muito úteis\", mas 20% relatam dificuldades de usabilidade que precisam ser endereçadas.",
      "Logística: Satisfação Alta (Nível 4): 92% dos operadores consideram o sistema de roteirização IA \"melhor que o anterior\", CSAT = 4,3/5, zero solicitações de rollback ao processo manual nos últimos 12 meses."
    ]
  }
};

export function buscarEsclarecimentoAvaliacaoMaturidade(codigo) {
  return ESCLARECIMENTOS_AVALIACAO_MATURIDADE[String(codigo)] || null;
}

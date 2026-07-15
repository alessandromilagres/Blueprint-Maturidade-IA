/**
 * Tradução de dimensões SATF por modelo operacional (delivery | sustentacao | coe).
 * Fonte humana: backend/src/config/biblioteca_traducao_dimensoes.yaml
 * Runtime: objeto embutido abaixo (sem dependência YAML).
 */
import {
  MODELOS_OPERACIONAIS,
  LABELS_MODELO_OPERACIONAL,
  normalizarModeloOperacional,
  resolverModeloOperacionalUnidade,
  labelModeloOperacional
} from './empresaUnidade.js';

export {
  MODELOS_OPERACIONAIS,
  LABELS_MODELO_OPERACIONAL,
  normalizarModeloOperacional,
  resolverModeloOperacionalUnidade,
  labelModeloOperacional
};

/** Códigos SATF → chave da biblioteca (defaults do produto — editáveis por unidade). */
export const COD_DIM_COM_TRADUCAO = Object.freeze([
  'D4',
  'D5',
  'D6',
  'D7',
  'D8',
  'D9',
  'D10'
]);

const COD_PARA_CHAVE = Object.freeze({
  D4: 'D4_engenharia_padroes',
  D5: 'D5_plataforma_arquitetura',
  D6: 'D6_dados_contexto_conhecimento',
  D7: 'D7_seguranca_qualidade',
  D8: 'D8_modernizacao_legado',
  D9: 'D9_finops_valor',
  D10: 'D10_fabrica_agentica'
});

/** Espelho do YAML (manter alinhado com biblioteca_traducao_dimensoes.yaml). */
export const BIBLIOTECA_TRADUCAO_DIMENSOES = Object.freeze({
  modelos_operacionais: {
    delivery: {
      unidade: 'Delivery (modelo operacional)',
      natureza: 'Projeto com início, meio e fim; produção de código novo para o cliente'
    },
    sustentacao: {
      unidade: 'Sustentação (modelo operacional)',
      natureza: 'Operação contínua por cliente/contrato; ITSM, não produção de código novo'
    },
    coe: {
      unidade: 'COE / Fábrica de IA (modelo operacional)',
      natureza: 'Constrói e governa a fábrica de IA em si, não um processo de negócio específico'
    },
    infraestrutura: {
      unidade: 'Infraestrutura (modelo operacional)',
      natureza: 'Cloud, rede, SRE e plataforma — disponibilidade, mudança de infra e observabilidade'
    },
    desenvolvimento: {
      unidade: 'Desenvolvimento (modelo operacional)',
      natureza: 'Engenharia de software / SDLC interno — produtos e squads, não gestão de ticket ITSM'
    },
    dados: {
      unidade: 'Dados (modelo operacional)',
      natureza: 'Plataforma de dados, qualidade, governança e contexto para analytics/IA'
    }
  },
  dimensoes: {
    D4_engenharia_padroes: {
      nome: 'Engenharia & Padrões de Desenvolvimento',
      delivery: {
        perguntas_e_metricas: [
          'Métricas DORA (deploy frequency, lead time, change failure rate, MTTR)',
          'Tag de origem [AI-GEN] no commit — % de código gerado por IA vs. humano',
          'Defeitos/CT vs. meta, por piloto',
          'Playbook de code review calibrado para volume de output agêntico'
        ],
        benchmark_fonte:
          'Benchmark DORA (State of DevOps) — citar ano e fonte, nunca constante fixa'
      },
      sustentacao: {
        perguntas_e_metricas: [
          'Aderência a playbook por nível (N1/N2/N3) — % de incidentes tratados conforme o playbook documentado',
          'Taxa de reincidência — % de incidentes que reabrem o mesmo problema em até 30 dias',
          '% de incidentes com erro conhecido (known error) registrado na Base de Conhecimento',
          'FCR — First Call Resolution — % resolvido no primeiro contato, por nível de atendimento',
          'Backlog aging — tempo médio que um incidente/problema permanece sem tratamento',
          'Tag [IA-assistida] em decisões de triagem/diagnóstico — % de incidentes com apoio de agente'
        ],
        benchmark_fonte:
          'Benchmark ITIL/HDI de FCR e backlog aging por severidade — citar fonte, nunca reaproveitar benchmark DORA',
        proibido:
          "Nunca citar 'frequência de deploy' ou 'PRs com origem IA' para esta unidade — ela não deploya sistemas do cliente."
      },
      coe: {
        perguntas_e_metricas: [
          'Padronização de frameworks/bibliotecas de IA entre as unidades consumidoras',
          'Existência de guia de padrões de engenharia de IA com versão publicada e adotada'
        ]
      },
      infraestrutura: {
        perguntas_e_metricas: [
          'Lead time de change de infraestrutura (IaC/pipeline) e taxa de change failure',
          '% de mudanças aplicadas via pipeline/IaC vs. mudança manual',
          'Aderência a runbooks e standard operating procedures em incidentes de plataforma',
          'Uso de IA para revisão de Terraform/Ansible/Helm ou diagnóstico de drift'
        ],
        benchmark_fonte: 'Benchmark DORA adaptado a changes de infra / SRE — citar fonte',
        proibido:
          "Não confundir com DORA de aplicação de negócio nem com FCR de service desk — o foco é change/IaC/SRE."
      },
      desenvolvimento: {
        perguntas_e_metricas: [
          'Métricas DORA do produto/squad (deploy frequency, lead time, CFR, MTTR)',
          'Cobertura de testes e qualidade de code review com assistência de IA',
          'Padronização de branching, CI e definition of done entre squads',
          '% de PRs com assistência/geração de IA e taxa de retrabalho associada'
        ],
        benchmark_fonte: 'Benchmark DORA (State of DevOps) — citar ano e fonte',
        proibido:
          'Não usar métricas de service desk (FCR/N1–N3) nem de consolidação ITSM nesta unidade.'
      },
      dados: {
        perguntas_e_metricas: [
          'Lead time e taxa de falha de pipelines de dados (ELT/ETL/dbt)',
          'Padrões de engenharia de dados versionados (repo, CI de transformação, testes de contrato)',
          'Data quality gates bloqueantes antes de publicar dataset/modelo',
          'Uso de IA para geração/revisão de transformações e testes de qualidade'
        ],
        benchmark_fonte: 'Práticas de DataOps / data reliability — citar fonte',
        proibido:
          'Não usar DORA de app mobile/web nem FCR de atendimento como métrica principal de Dados.'
      }
    },
    D5_plataforma_arquitetura: {
      nome: 'Plataforma, Arquitetura & Escala',
      delivery: {
        perguntas_e_metricas: [
          'Arquitetura da fonte única de horas/atividades do ciclo de entrega (ferramentas do cliente)',
          'Escalabilidade dos agentes no pipeline de entrega contínua'
        ]
      },
      sustentacao: {
        perguntas_e_metricas: [
          'Decisão de arquitetura de consolidação de ITSM heterogêneo — via API, data lake ou espelho de eventos, com ADR registrado',
          'Padronização de observabilidade entre ferramentas de monitoramento do cliente',
          'Escala = operações já cobertas pela camada de consolidação sobre o total de operações no escopo'
        ],
        proibido:
          'Nunca assumir fonte única já existente — ela é a decisão em aberto desta dimensão, não um fato consumado.'
      },
      coe: {
        perguntas_e_metricas: [
          'Arquitetura de referência para orquestração multi-agente, usada por todas as unidades'
        ]
      },
      infraestrutura: {
        perguntas_e_metricas: [
          'Landing zone / contas cloud padronizadas e multi-ambiente',
          'Observabilidade unificada (métricas, logs, traces) e cobertura dos serviços críticos',
          'Capacidade e autoscaling documentados; ADRs para decisões de plataforma',
          'Prontidão da plataforma para workloads de IA (GPU/quota, rede, identity)'
        ]
      },
      desenvolvimento: {
        perguntas_e_metricas: [
          'Golden paths / plataforma interna de desenvolvedor (IDP)',
          'Padronização de runtime, service mesh, secrets e ambientes por squad',
          'Tempo para um squad subir um serviço novo em produção (paved road)'
        ]
      },
      dados: {
        perguntas_e_metricas: [
          'Arquitetura lakehouse/warehouse e zonas de dados (raw/curated/serving)',
          'Escalabilidade de pipelines e workloads analíticos/IA',
          'ADR de integração com fontes e consumidores (APIs, eventos, batch)'
        ]
      }
    },
    D6_dados_contexto_conhecimento: {
      nome: 'Dados, Contexto & Conhecimento',
      delivery: {
        perguntas_e_metricas: [
          'Base de conhecimento de projeto e taxa de registro de lições aprendidas'
        ]
      },
      sustentacao: {
        perguntas_e_metricas: [
          'Correlação de alertas multi-ferramenta (dor operacional real, não hipotética)',
          'Matriz de ofensores — atualização automática vs. manual',
          'Existência de base de erro conhecido (known error database) reaproveitável',
          'Contexto injetável no agente de triagem a partir do histórico de incidentes',
          'Roteamento por similaridade (ex. Jira/Smarti) — % de incidentes roteados corretamente sem intervenção humana'
        ]
      },
      coe: {
        perguntas_e_metricas: [
          'Curadoria central de conhecimento reutilizável entre unidades'
        ]
      },
      infraestrutura: {
        perguntas_e_metricas: [
          'CMDB / inventário de ativos confiável e atualizado',
          'Telemetria e runbooks como contexto para AIOps',
          'Documentação de topologia e dependências crítica para diagnóstico'
        ]
      },
      desenvolvimento: {
        perguntas_e_metricas: [
          'Knowledge base de arquitetura e decisões técnicas (ADRs) por produto',
          'Reuso de componentes e libs internas documentado',
          'Contexto de domínio/specs disponível aos agentes de coding'
        ]
      },
      dados: {
        escopo: 'DIMENSÃO PRIMÁRIA — núcleo da missão da área de Dados.',
        perguntas_e_metricas: [
          'Catálogo de dados com owners e classificação',
          'Lineage e glossário/semântica para consumo analítico e IA',
          'Qualidade de dados (% datasets com SLA/regras ativas)',
          'Contexto recuperável para RAG/agents (acesso governado a fontes)'
        ]
      }
    },
    D7_seguranca_qualidade: {
      nome: 'Segurança & Qualidade Integrada (QA)',
      delivery: {
        perguntas_e_metricas: [
          'Defeitos/CT vs. meta',
          'Gate de segurança (SAST) em código gerado por IA',
          'Conformidade de licenças de pacotes introduzidos pela IA'
        ]
      },
      sustentacao: {
        perguntas_e_metricas: [
          'Taxa de falso positivo de alerta de monitoramento',
          'Acurácia de triagem do agente — % de classificações de severidade/impacto corretas',
          'Taxa de escalonamento indevido — incidente que sobe de nível sem necessidade real',
          'Shift-left de segurança — detecção preventiva antes da abertura do incidente'
        ],
        proibido:
          "Nunca usar 'defeitos/CT' aqui — não existe CT (caso de teste) no fluxo de atendimento a incidente."
      },
      coe: {
        perguntas_e_metricas: [
          'Define os gates técnicos usados pelas demais unidades, mas não é dono do resultado de QA de cada uma'
        ]
      },
      infraestrutura: {
        perguntas_e_metricas: [
          'Patch/vulnerability management e tempo médio de remediação',
          'Hardening e baseline de segurança por classe de workload',
          'Controles de identidade, rede e secret management',
          'Uso de IA para priorização de CVEs / drift de configuração'
        ],
        proibido: 'Não usar defeitos/CT de aplicativo como métrica principal de Infra.'
      },
      desenvolvimento: {
        perguntas_e_metricas: [
          'SAST/DAST/SCA no pipeline e taxa de débito de vulnerabilidades',
          'Defeitos em produção vs. escape rate',
          'Qualidade de testes (unit/integration/e2e) com assistência de IA',
          'Policy as code para gates de merge/release'
        ]
      },
      dados: {
        perguntas_e_metricas: [
          'Controles de privacidade/PII e mascaramento',
          'Testes de qualidade e contratos de dados em CI',
          'Acesso least-privilege a datasets sensíveis',
          'Monitoramento de anomalias / data incidents'
        ],
        proibido: 'Não usar defeitos/CT de UI como proxy de qualidade de dados.'
      }
    },
    D8_modernizacao_legado: {
      nome: 'Modernização & Sustentação de Legado',
      delivery: {
        escopo:
          'FORA DO ESCOPO — Delivery é projeto novo, não sustentação de legado. Não avaliar.'
      },
      sustentacao: {
        escopo:
          'DIMENSÃO PRIMÁRIA — nunca excluir do escopo desta unidade. É a dimensão mais diretamente ligada ao nome e à missão da área.',
        perguntas_e_metricas: [
          'Modernização de sistemas legados assistida por IA — existência de abordagem definida',
          'Cobertura de testes suficiente para permitir refatoração segura por IA',
          'Priorização documentada de candidatos a modernização',
          'Capacitação das equipes de sustentação para uso de IA no dia a dia'
        ]
      },
      coe: {
        escopo:
          'Consumidor — usa o que a Sustentação aprende para generalizar padrões, não é dono do resultado'
      },
      infraestrutura: {
        perguntas_e_metricas: [
          'Plano de modernização de plataformas legadas (mainframe/hypervisor/OS EOL)',
          'Migração assistida por IA / automação de discovery e assessment',
          'Priorização de dívida técnica de infraestrutura por risco e custo'
        ]
      },
      desenvolvimento: {
        perguntas_e_metricas: [
          'Estratégia de strangler/refactor de monolitos e libs legadas',
          'Cobertura de testes para refatoração segura assistida por IA',
          'Backlog priorizado de modernização por produto'
        ]
      },
      dados: {
        perguntas_e_metricas: [
          'Modernização de ETLs legados e desativação de jobs sombra',
          'Migração de data warehouse/on-prem com qualidade auditável',
          'Priorização de fontes legadas por valor analítico/IA'
        ]
      }
    },
    D9_finops_valor: {
      nome: 'FinOps, Valor & Apoio ao Negócio',
      delivery: {
        perguntas_e_metricas: [
          'ROI por piloto',
          'Custo de tokens atribuído a iniciativas específicas'
        ]
      },
      sustentacao: {
        perguntas_e_metricas: [
          'Risco de erosão de margem em contratos de baseline de horas quando a triagem assistida reduz esforço',
          'Custo de automação de triagem vs. horas economizadas, por operação/contrato',
          'Modelo de repactuação comercial em andamento (sim/não, prazo)'
        ]
      },
      coe: {
        perguntas_e_metricas: [
          'Custo de tokens consolidado entre as unidades que consomem a fábrica'
        ]
      },
      infraestrutura: {
        perguntas_e_metricas: [
          'FinOps de cloud (showback/chargeback, rightsizing, waste)',
          'Custo por ambiente/serviço e anomalias de gasto',
          'ROI de automações de infra vs. horas de operação'
        ]
      },
      desenvolvimento: {
        perguntas_e_metricas: [
          'Custo de ciclo (lead time × capacidade) e valor entregue por squad',
          'Custo de CI/CD e de tokens de coding assistants por produto',
          'Indicadores de throughput vs. qualidade (escapes)'
        ]
      },
      dados: {
        perguntas_e_metricas: [
          'Custo de plataforma de dados (storage/compute/query) por domínio',
          'Valor de datasets (adoção, decisões habilitadas)',
          'Custo de tokens/embeddings em workloads de IA sobre dados'
        ]
      }
    },
    D10_fabrica_agentica: {
      nome: 'Fábrica Agêntica de Software',
      nota_geral:
        "Score sempre 'fora da média geral' em qualquer unidade — mas as PERGUNTAS mudam.",
      delivery: {
        perguntas_e_metricas: [
          'Ingestão de User Story pelo agente',
          'Escopo delegável ao agente (qual etapa do ciclo de entrega)',
          'Contexto injetável (specs, padrões de código)',
          'Loop de auto-correção do agente',
          'Varredura de segurança (SAST) em código gerado'
        ]
      },
      sustentacao: {
        perguntas_e_metricas: [
          'Ingestão de incidente pelo agente (não User Story)',
          'Escopo delegável ao agente — triagem N1? sugestão de contorno N2? apoio a diagnóstico N3?',
          'Contexto injetável — histórico de incidentes + Base de Conhecimento (não specs de código)',
          'Loop de aprendizado — conhecimento resolvido em N3 retroalimenta a Base usada em N2',
          'Validação humana obrigatória (human-in-the-loop) antes de qualquer ação automatizada em ambiente produtivo do cliente',
          'Auditabilidade da decisão do agente de triagem'
        ],
        nota:
          'Primeiro ciclo deve ser read-only (sem escrita em ambiente produtivo do cliente) — trava de acesso documentada.'
      },
      coe: {
        perguntas_e_metricas: [
          'É dono do framework de cooperação multi-agente usado pelas demais unidades'
        ]
      },
      infraestrutura: {
        perguntas_e_metricas: [
          'Agentes AIOps para correlação de alertas e sugestão de remediação',
          'Contexto injetável: telemetria, CMDB, runbooks',
          'Human-in-the-loop antes de change automatizado em produção',
          'Auditabilidade de ações do agente em ambiente crítico'
        ],
        nota: 'Preferir modo sugerir/read-only antes de auto-remediation.'
      },
      desenvolvimento: {
        perguntas_e_metricas: [
          'Agentes no ciclo de coding (spec → PR → testes)',
          'Contexto de repo/padrões/DoD injetável',
          'Loop de auto-correção e revisão humana obrigatória',
          'Integração com CI e políticas de segurança'
        ]
      },
      dados: {
        perguntas_e_metricas: [
          'Agentes sobre catálogo/lineage (descoberta, documentação, testes de qualidade)',
          'Contexto injetável: schemas, glossário, políticas de acesso',
          'Human-in-the-loop antes de publicar dataset/modelo',
          'Auditabilidade de acesso a dados sensíveis por agentes'
        ]
      }
    }
  }
});

function codigoSatfDeDim(codigoOuDim) {
  if (codigoOuDim == null) return null;
  if (typeof codigoOuDim === 'string') {
    const m = String(codigoOuDim).toUpperCase().match(/\b(D(?:10|11|[1-9]))\b/);
    return m ? m[1] : null;
  }
  const cod = String(codigoOuDim?.codigoFramework || '').trim().toUpperCase();
  if (/^D(?:10|11|[1-9])$/.test(cod)) return cod;
  const ordem = Number(codigoOuDim?.ordem);
  if (Number.isFinite(ordem) && ordem >= 1 && ordem <= 11) return `D${ordem}`;
  return null;
}

/** Defaults do produto (sem override de unidade). */
export function obterTraducaoDimensao(modelo, codigoOuDim) {
  const m = normalizarModeloOperacional(modelo);
  const cod = codigoSatfDeDim(codigoOuDim);
  if (!m || !cod) return null;
  const chave = COD_PARA_CHAVE[cod];
  if (!chave) return null;
  const dimMeta = BIBLIOTECA_TRADUCAO_DIMENSOES.dimensoes[chave];
  if (!dimMeta) return null;
  const bloco = dimMeta[m];
  if (!bloco || typeof bloco !== 'object') return null;
  return {
    codigo: cod,
    chave,
    nome: dimMeta.nome,
    notaGeral: dimMeta.nota_geral || null,
    fonte: 'default_produto',
    ...bloco
  };
}

/**
 * Override por unidade: JSON { "D4": { perguntas_e_metricas, proibido, benchmark_fonte, escopo, nota } }.
 * Campos vazios no override não apagam o default (merge superficial).
 */
export function normalizarTraducaoDimensoesInput(valor) {
  if (valor == null || valor === '') return null;
  let mapa = valor;
  if (typeof valor === 'string') {
    try {
      mapa = JSON.parse(valor);
    } catch {
      return null;
    }
  }
  if (!mapa || typeof mapa !== 'object' || Array.isArray(mapa)) return null;

  const out = {};
  for (const [k, v] of Object.entries(mapa)) {
    const cod = String(k || '')
      .trim()
      .toUpperCase();
    if (!COD_PARA_CHAVE[cod]) continue;
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
    const bloco = {};
    if (Array.isArray(v.perguntas_e_metricas)) {
      const arr = v.perguntas_e_metricas.map((x) => String(x || '').trim()).filter(Boolean);
      if (arr.length) bloco.perguntas_e_metricas = arr;
    } else if (typeof v.perguntas_e_metricas === 'string' && v.perguntas_e_metricas.trim()) {
      const arr = v.perguntas_e_metricas
        .split(/\n|;/)
        .map((x) => x.replace(/^[-*•]\s*/, '').trim())
        .filter(Boolean);
      if (arr.length) bloco.perguntas_e_metricas = arr;
    }
    for (const campo of ['proibido', 'benchmark_fonte', 'escopo', 'nota']) {
      if (v[campo] != null && String(v[campo]).trim()) {
        bloco[campo] = String(v[campo]).trim().slice(0, 2000);
      }
    }
    if (Object.keys(bloco).length) out[cod] = bloco;
  }
  return Object.keys(out).length ? out : null;
}

export function serializarTraducaoDimensoes(mapa) {
  const n = normalizarTraducaoDimensoesInput(mapa);
  return n ? JSON.stringify(n) : null;
}

export function parseTraducaoDimensoesJson(rowOrValor) {
  if (rowOrValor == null) return null;
  if (typeof rowOrValor === 'object' && !Array.isArray(rowOrValor) && rowOrValor.traducaoDimensoes == null) {
    return normalizarTraducaoDimensoesInput(rowOrValor);
  }
  const raw =
    typeof rowOrValor === 'object'
      ? rowOrValor.traducaoDimensoes ?? rowOrValor.traducao_dimensoes
      : rowOrValor;
  return normalizarTraducaoDimensoesInput(raw);
}

/** Defaults do modelo + override cadastrado na unidade. */
export function obterTraducaoDimensaoEfetiva(unidadeMeta, codigoOuDim) {
  const modelo = resolverModeloOperacionalUnidade(unidadeMeta);
  const base = obterTraducaoDimensao(modelo, codigoOuDim);
  const cod = codigoSatfDeDim(codigoOuDim);
  if (!cod) return base;
  const override = parseTraducaoDimensoesJson(unidadeMeta)?.[cod];
  if (!base && !override) return null;
  if (!override) return base;
  if (!base) {
    return {
      codigo: cod,
      chave: COD_PARA_CHAVE[cod] || cod,
      nome: cod,
      fonte: 'cadastro_unidade',
      ...override
    };
  }
  return {
    ...base,
    ...override,
    perguntas_e_metricas: override.perguntas_e_metricas?.length
      ? override.perguntas_e_metricas
      : base.perguntas_e_metricas,
    fonte: 'default_produto+cadastro_unidade'
  };
}

/** Snapshot dos defaults de um modelo (para UI preencher placeholders). */
export function listarDefaultsTraducaoPorModelo(modelo) {
  const m = normalizarModeloOperacional(modelo);
  if (!m) return {};
  const out = {};
  for (const cod of COD_DIM_COM_TRADUCAO) {
    const t = obterTraducaoDimensao(m, cod);
    if (t) {
      out[cod] = {
        nome: t.nome,
        perguntas_e_metricas: t.perguntas_e_metricas || [],
        proibido: t.proibido || '',
        benchmark_fonte: t.benchmark_fonte || '',
        escopo: t.escopo || '',
        nota: t.nota || ''
      };
    }
  }
  return out;
}

export function dimensaoForaEscopoModeloOperacional(modeloOuUnidade, codigoOuDim) {
  // Aceita unidadeMeta (objeto com modeloOperacional) ou string modelo
  let t;
  if (modeloOuUnidade && typeof modeloOuUnidade === 'object' && !Array.isArray(modeloOuUnidade)) {
    t = obterTraducaoDimensaoEfetiva(modeloOuUnidade, codigoOuDim);
  } else {
    t = obterTraducaoDimensao(modeloOuUnidade, codigoOuDim);
  }
  if (!t?.escopo) return false;
  return /FORA\s+DO\s+ESCOPO/i.test(String(t.escopo));
}

/**
 * Remove dims fora do escopo do modelo (ex.: D8 no delivery), mesmo se estiverem no foco.
 * Respeita override de escopo no cadastro da unidade.
 */
export function filtrarDimensoesPorModeloOperacional(dimensoes, unidadeMeta) {
  const modelo = resolverModeloOperacionalUnidade(unidadeMeta);
  if (!modelo || !Array.isArray(dimensoes)) return dimensoes || [];
  return dimensoes.filter((d) => !dimensaoForaEscopoModeloOperacional(unidadeMeta, d));
}

/**
 * Bloco markdown para injetar no prompt da Seção 3 (só book por unidade com modelo).
 */
export function blocoTraducaoDimensaoModeloPrompt(unidadeMeta, codigoOuDim) {
  const modelo = resolverModeloOperacionalUnidade(unidadeMeta);
  if (!modelo) return '';
  const t = obterTraducaoDimensaoEfetiva(unidadeMeta, codigoOuDim);
  if (!t) return '';

  const metaModelo = BIBLIOTECA_TRADUCAO_DIMENSOES.modelos_operacionais[modelo];
  const linhas = [
    '',
    `TRADUÇÃO POR MODELO OPERACIONAL (**${modelo}** — ${metaModelo?.natureza || labelModeloOperacional(modelo)}):`,
    `- Dimensão: **${t.codigo}** ${t.nome || ''}`.trim(),
    `- Fonte da tradução: ${t.fonte === 'default_produto' ? 'padrão do produto (editável no cadastro da unidade)' : 'cadastro da unidade (override)'}`,
    '- Use **exclusivamente** as perguntas/métricas abaixo nesta unidade. **Proibido** reutilizar léxico de outro modelo operacional.',
    '- Fatos de cliente/projeto (nomes, contratos, ferramentas) vêm do **contexto cadastrado** e dos DADOS — não invente clientes de outro tenant.'
  ];
  if (t.escopo) linhas.push(`- Escopo: ${t.escopo}`);
  if (t.notaGeral) linhas.push(`- Nota: ${t.notaGeral}`);
  if (t.nota) linhas.push(`- Nota do modelo: ${t.nota}`);
  if (t.proibido) linhas.push(`- **PROIBIDO:** ${t.proibido}`);
  if (t.benchmark_fonte) linhas.push(`- Benchmark: ${t.benchmark_fonte}`);
  const metricas = Array.isArray(t.perguntas_e_metricas) ? t.perguntas_e_metricas : [];
  if (metricas.length) {
    linhas.push('- Perguntas e métricas deste modelo/unidade:');
    for (const item of metricas) linhas.push(`  - ${item}`);
  }
  linhas.push('');
  return linhas.join('\n');
}

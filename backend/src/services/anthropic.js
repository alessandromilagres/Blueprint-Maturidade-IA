/**
 * Serviço de Geração de Especificações com IA
 * Suporta múltiplos provedores: Anthropic (Claude), OpenAI (GPT-4), Groq (Llama)
 * 
 * Configure o provedor via variável de ambiente AI_PROVIDER:
 * - 'anthropic' (padrão): Usa Claude
 * - 'openai': Usa GPT-4o
 * - 'groq': Usa Llama 3.1 (mais barato e rápido)
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  callAI,
  callAIWithContinuation,
  getProvider,
  getProvidersStatus,
  PROVIDERS
} from './ai-provider.js';
import {
  calcularMetricasEspecificacaoProduto,
  formatarSecaoMetricasEspecificacao
} from '../utils/metricasEspecificacaoProduto.js';
import { formatarIdealizacaoParaPrompt } from './idealizacaoApoioEspecificacaoIA.js';

// Diretório de uploads (mesmo do routes/arquivos.js)
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** max_tokens por chamada: respeita opção ou teto configurado para o provedor ativo */
function getMaxTokensParaGeracao(opcoes = {}) {
  const n = Number(opcoes.maxTokens);
  if (Number.isFinite(n) && n > 0) return n;
  return getProvider().maxTokens || 8192;
}

function getMaxContinuacoesIa() {
  const n = Number(process.env.AI_MAX_CONTINUATIONS);
  return Number.isFinite(n) && n >= 1 ? Math.min(25, n) : 12;
}

/** Erros que costumam resolver com backoff (rate limit, overload, rede). */
function isErroTransitórioIA(error) {
  const msg = String(error?.message || error || '').toLowerCase();
  const code = error?.code;
  if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'EAI_AGAIN') return true;
  if (msg.includes('aborterror') || msg.includes('the operation was aborted')) return false;
  if (msg.includes('429') || msg.includes('503')) return true;
  if (msg.includes('overloaded') || msg.includes('rate limit') || msg.includes('too many requests')) return true;
  if (msg.includes('temporarily unavailable') || msg.includes('try again')) return true;
  if (msg.includes('fetch failed') || msg.includes('socket hang up')) return true;
  return false;
}

/**
 * Geração longa: continua se truncar por max_tokens e repete em falhas transitórias.
 */
async function chamarIAGeracaoDocumento(promptFinal, systemPrompt, options) {
  const maxAttempts = 5;
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await callAIWithContinuation(
        promptFinal,
        systemPrompt,
        options,
        { maxContinuations: getMaxContinuacoesIa(), minContentTail: 800 }
      );
    } catch (err) {
      lastError = err;
      if (!isErroTransitórioIA(err) || attempt === maxAttempts - 1) throw err;
      const backoff = Math.min(32000, 1500 * 2 ** attempt);
      console.warn(
        `[IA] Falha transitória na geração (${err.message}); nova tentativa em ${backoff}ms (${attempt + 2}/${maxAttempts})`
      );
      await sleep(backoff);
    }
  }
  throw lastError;
}

/**
 * CONFIGURAÇÃO DE TIPOS DE DOCUMENTOS
 * Define quais documentos são essenciais (pré-selecionados) e quais são opcionais
 */
const TIPOS_DOCUMENTOS_CONFIG = {
  // ===== DOCUMENTOS ESSENCIAIS (pré-selecionados) =====
  prd: {
    id: 'prd',
    nome: 'PRD - Product Requirements Document',
    descricao: 'Visão do produto, personas, user stories detalhadas com critérios de aceite, escopo MVP',
    essencial: true,
    ordem: 1,
    tempoEstimado: '2-3 min',
    icone: 'FileText'
  },
  requisitos_funcionais: {
    id: 'requisitos_funcionais',
    nome: 'Requisitos Funcionais',
    descricao: 'RF-XXX com fluxos, exceções, critérios de aceite, dependências e regras de negócio',
    essencial: true,
    ordem: 2,
    tempoEstimado: '2-3 min',
    icone: 'FileCode'
  },
  requisitos_nao_funcionais: {
    id: 'requisitos_nao_funcionais',
    nome: 'Requisitos Não Funcionais',
    descricao: 'Performance, segurança, escalabilidade, disponibilidade, usabilidade',
    essencial: true,
    ordem: 3,
    tempoEstimado: '1-2 min',
    icone: 'Shield'
  },
  arquitetura: {
    id: 'arquitetura',
    nome: 'Arquitetura Técnica',
    descricao: 'Stack tecnológico, diagramas C4, ADRs (Architecture Decision Records), padrões',
    essencial: true,
    ordem: 4,
    tempoEstimado: '2-3 min',
    icone: 'Server'
  },
  cronograma: {
    id: 'cronograma',
    nome: 'Cronograma e Estimativas',
    descricao: 'Story points, comparativo tradicional vs agêntico, fases, equipe',
    essencial: true,
    ordem: 5,
    tempoEstimado: '2-3 min',
    icone: 'Calendar'
  },
  
  // ===== DOCUMENTOS OPCIONAIS =====
  modelagem_dados: {
    id: 'modelagem_dados',
    nome: 'Modelagem de Dados',
    descricao: 'ERD, schemas de banco, relacionamentos, índices, DDL completo',
    essencial: false,
    ordem: 6,
    tempoEstimado: '2-3 min',
    icone: 'Database'
  },
  api_contracts: {
    id: 'api_contracts',
    nome: 'API Contracts (OpenAPI)',
    descricao: 'Especificação completa de endpoints, request/response, erros',
    essencial: false,
    ordem: 7,
    tempoEstimado: '2-3 min',
    icone: 'Code'
  },
  casos_teste: {
    id: 'casos_teste',
    nome: 'Casos de Teste',
    descricao: 'Test cases derivados dos requisitos funcionais',
    essencial: false,
    ordem: 8,
    tempoEstimado: '2-3 min',
    icone: 'CheckSquare'
  },
  wireframes: {
    id: 'wireframes',
    nome: 'Wireframes e Fluxos de Tela',
    descricao: 'Descrição detalhada de cada tela, componentes e estados',
    essencial: false,
    ordem: 9,
    tempoEstimado: '2-3 min',
    icone: 'Layout'
  },
  glossario: {
    id: 'glossario',
    nome: 'Glossário do Domínio',
    descricao: 'Termos técnicos e de negócio padronizados (Ubiquitous Language)',
    essencial: false,
    ordem: 10,
    tempoEstimado: '1-2 min',
    icone: 'Book'
  },
  riscos: {
    id: 'riscos',
    nome: 'Riscos e Mitigações',
    descricao: 'Análise de riscos técnicos, plano de mitigação e contingência',
    essencial: false,
    ordem: 11,
    tempoEstimado: '2-3 min',
    icone: 'AlertTriangle'
  },
  plano_deploy: {
    id: 'plano_deploy',
    nome: 'Plano de Deploy',
    descricao: 'Infraestrutura, CI/CD, Kubernetes, checklist de go-live',
    essencial: false,
    ordem: 12,
    tempoEstimado: '2-3 min',
    icone: 'Cloud'
  }
};

/**
 * Retorna lista de tipos de documentos disponíveis
 * @param {boolean} apenasDisponiveis - Se true, retorna apenas os documentos disponíveis para geração
 */
function getTiposDocumentosDisponiveis(apenasDisponiveis = true) {
  const tipos = Object.values(TIPOS_DOCUMENTOS_CONFIG);
  
  if (apenasDisponiveis) {
    return tipos.filter(t => t.disponivel !== false);
  }
  
  return tipos;
}

/**
 * Retorna tipos de documentos essenciais (pré-selecionados)
 */
function getTiposDocumentosEssenciais() {
  return Object.values(TIPOS_DOCUMENTOS_CONFIG)
    .filter(t => t.essencial && t.disponivel !== false)
    .map(t => t.id);
}

/**
 * Wrapper para chamada de IA - usa o provedor configurado
 * Mantém compatibilidade com código existente
 */
async function callAnthropic(prompt, systemPrompt, options = {}) {
  const result = await callAI(prompt, systemPrompt, options);
  return result;
}

/**
 * Carrega arquivos de referência do produto
 * Retorna textos extraídos e imagens em base64
 */
async function carregarArquivosReferencia(arquivos) {
  const resultado = {
    documentos: [],
    imagens: []
  };
  
  if (!arquivos || arquivos.length === 0) {
    return resultado;
  }
  
  for (const arquivo of arquivos) {
    if (!arquivo.ativo) continue;
    
    try {
      const filePath = path.join(UPLOAD_DIR, arquivo.nomeArmazenado);
      
      // Se tem conteúdo extraído, usa direto
      if (arquivo.conteudoExtraido && arquivo.conteudoExtraido.length > 0) {
        resultado.documentos.push({
          nome: arquivo.nomeOriginal,
          categoria: arquivo.categoria,
          descricao: arquivo.descricao,
          conteudo: arquivo.conteudoExtraido
        });
        console.log(`[Arquivos] Usando conteúdo extraído: ${arquivo.nomeOriginal} (${arquivo.conteudoExtraido.length} chars)`);
        continue;
      }
      
      // Para imagens, carrega em base64
      if (arquivo.mimeType.startsWith('image/')) {
        try {
          const buffer = await fs.readFile(filePath);
          resultado.imagens.push({
            nome: arquivo.nomeOriginal,
            categoria: arquivo.categoria,
            descricao: arquivo.descricao,
            mimeType: arquivo.mimeType,
            base64: buffer.toString('base64')
          });
          console.log(`[Arquivos] Imagem carregada: ${arquivo.nomeOriginal}`);
        } catch (e) {
          console.warn(`[Arquivos] Não foi possível carregar imagem ${arquivo.nomeOriginal}:`, e.message);
        }
      } else {
        // Para documentos sem conteúdo extraído, avisa no log
        console.warn(`[Arquivos] Documento sem conteúdo extraído: ${arquivo.nomeOriginal} - será ignorado`);
      }
    } catch (e) {
      console.warn(`[Arquivos] Erro ao processar arquivo ${arquivo.nomeOriginal}:`, e.message);
    }
  }
  
  return resultado;
}

/**
 * Monta o contexto completo do produto para os prompts
 * Inclui arquivos de referência (documentos) no contexto textual
 */
function montarContextoProduto(produto, vertical, avaliacoes, arquivosReferencia = null) {
  let tecnologias = [];
  if (produto.tecnologias) {
    try {
      // Tenta parsear como JSON
      tecnologias = JSON.parse(produto.tecnologias);
    } catch {
      // Se falhar, trata como string separada por vírgula
      tecnologias = produto.tecnologias.split(',').map(t => t.trim()).filter(t => t);
    }
  }
  
  let contexto = `
# INFORMAÇÕES DO PRODUTO

## Dados Básicos
- **Nome:** ${produto.nome}
- **Descrição:** ${produto.descricao || 'Não informada'}
- **Fase Atual:** ${produto.faseAtual || 'ideia'}
- **Complexidade:** ${produto.complexidade || 'media'}
- **Status:** ${produto.status}

## Problema e Solução
- **Problema que Resolve:** ${produto.problemaResolve || 'Não informado'}
- **Público-Alvo:** ${produto.publicoAlvo || 'Não informado'}
- **Diferencial Competitivo:** ${produto.diferencialCompetitivo || 'Não informado'}

## Tecnologias
${tecnologias.length > 0 ? tecnologias.map(t => `- ${t}`).join('\n') : '- Não especificadas'}

## Vertical de Mercado
- **Vertical:** ${vertical?.nome || 'Não definida'}
- **Foco:** ${vertical?.foco || 'Não definido'}

## Riscos e Dependências
- **Principais Riscos:** ${produto.principaisRiscos || 'Não identificados'}
- **Dependências Externas:** ${produto.dependenciasExternas || 'Não identificadas'}

## Métricas de Sucesso (KPIs)
- **Métrica Principal:** ${produto.metricaPrincipal || 'Não definida'}
- **Baseline Atual:** ${produto.baselineAtual || 'Não definido'}
- **Meta Esperada:** ${produto.metaEsperada || 'Não definida'}

## Parâmetros de Produtividade para Estimativas
- **Custo Hora/Homem:** R$ ${produto.custoHoraHomem || 150}/hora
- **Produtividade Tradicional:** ${produto.produtividadeTradicional || 40} Story Points/mês/desenvolvedor
- **Produtividade Fábrica Agêntica (com IA):** ${produto.produtividadeAgentica || 120} Story Points/mês/desenvolvedor

## Datas do Cronograma
- **Data Início de Construção:** ${produto.dataInicioConstrucao ? new Date(produto.dataInicioConstrucao).toLocaleDateString('pt-BR') : 'A definir'}
- **Meta de Entrega (Prazo Preferencial):** ${produto.prazoMeta ? new Date(produto.prazoMeta).toLocaleDateString('pt-BR') : 'Não definida'}
- **Status Atual:** ${produto.statusConstrucao || 'planejado'}
${produto.observacoesCronograma ? `- **Observações:** ${produto.observacoesCronograma}` : ''}

> **IMPORTANTE PARA CRONOGRAMA:**
> - Use a **Data de Início de Construção** como ponto de partida obrigatório
> - A **Meta de Entrega** é preferencial (desejável mas não obrigatória)
> - Calcule as datas de **Fim de Construção** e **Ativação em Produção** usando o cenário AGÊNTICO (preferencial)
> - Compare os dois cenários (Tradicional vs Agêntico) mostrando a vantagem da Fábrica Agêntica
`;

  const txtIdeal = formatarIdealizacaoParaPrompt(produto.idealizacaoProduto);
  if (txtIdeal && !txtIdeal.startsWith('(idealização sem texto')) {
    contexto += `
## Idealização (Design Thinking — Fase A)
${txtIdeal}
`;
  }

  // Adiciona informações das avaliações se disponíveis
  if (avaliacoes && avaliacoes.length > 0) {
    const ultimaAvaliacao = avaliacoes[0];
    contexto += `
## Avaliação de Maturidade
- **Score de Relevância:** ${ultimaAvaliacao.scoreRelevancia?.toFixed(1) || 'N/A'}/5
- **Score Transformação Agêntica:** ${ultimaAvaliacao.scoreObrigatorio?.toFixed(1) || 'N/A'}/5
- **Score Verticais:** ${ultimaAvaliacao.scoreVerticais?.toFixed(1) || 'N/A'}/5
`;
    
    // Adiciona respostas das perguntas obrigatórias
    if (ultimaAvaliacao.respostasObrigatorias?.length > 0) {
      contexto += '\n### Respostas da Avaliação de Transformação Agêntica:\n';
      ultimaAvaliacao.respostasObrigatorias.forEach(r => {
        if (r.perguntaObrigatoria && r.pontuacao) {
          contexto += `- **${r.perguntaObrigatoria.categoria}:** ${r.pontuacao}/5`;
          if (r.observacoes) contexto += ` - "${r.observacoes}"`;
          contexto += '\n';
        }
      });
    }
  }

  // Adiciona documentos de referência se disponíveis
  if (arquivosReferencia && arquivosReferencia.documentos && arquivosReferencia.documentos.length > 0) {
    contexto += `
╔══════════════════════════════════════════════════════════════════════════════╗
║  📚 DOCUMENTOS DE REFERÊNCIA DO CLIENTE                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

📌 COMO USAR ESTES DOCUMENTOS:
- RESPEITE: tecnologias, arquitetura, integrações e nomes mencionados
- EXPANDA: crie cronogramas, casos de uso, histórias, fluxos e estimativas detalhadas
- SEJA CRIATIVO: use os documentos como base mas gere conteúdo rico e completo

`;
    arquivosReferencia.documentos.forEach((doc, index) => {
      contexto += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 DOCUMENTO ${index + 1}: ${doc.nome}`;
      if (doc.categoria) contexto += ` [${doc.categoria.toUpperCase()}]`;
      contexto += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      if (doc.descricao) contexto += `📝 Descrição: ${doc.descricao}\n\n`;
      contexto += `CONTEÚDO DO DOCUMENTO:\n${doc.conteudo}\n\n`;
    });
    
    contexto += `
╔══════════════════════════════════════════════════════════════════════════════╗
║  FIM DOS DOCUMENTOS - AGORA GERE CONTEÚDO RICO E DETALHADO                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

`;
  }

  // Nota sobre imagens (serão enviadas separadamente na API)
  if (arquivosReferencia && arquivosReferencia.imagens && arquivosReferencia.imagens.length > 0) {
    contexto += `
╔══════════════════════════════════════════════════════════════════════════════╗
║  🖼️ IMAGENS DE REFERÊNCIA - ANÁLISE OBRIGATÓRIA                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

${arquivosReferencia.imagens.length} imagem(ns) de referência foram anexadas (mockups, wireframes, diagramas).
Você DEVE analisar cada imagem cuidadosamente e incorporar:
- Elementos visuais e layout
- Fluxos de navegação
- Estruturas de tela
- Componentes de interface

`;
    arquivosReferencia.imagens.forEach((img, index) => {
      contexto += `- **Imagem ${index + 1}:** ${img.nome}`;
      if (img.categoria) contexto += ` (${img.categoria})`;
      if (img.descricao) contexto += ` - ${img.descricao}`;
      contexto += '\n';
    });
  }

  return contexto;
}

/**
 * PROMPTS ESPECIALIZADOS PARA CADA TIPO DE DOCUMENTO
 */

/** System prompt “clássico” da Fábrica Agêntica — usado no Blueprint consolidado e compatível com o tom original. */
const SYSTEM_PROMPT_BASE = `Você é um arquiteto de soluções SÊNIOR de classe mundial, com mais de 20 anos de experiência em:

🏆 EXPERTISE TÉCNICA:
- Especificação de sistemas enterprise de alta complexidade
- Arquitetura de soluções de IA de ponta (LLMs, RAG, Agents, Multi-Agent Systems, Computer Vision, MLOps)
- Design de APIs, microsserviços e arquiteturas event-driven
- Metodologias ágeis avançadas, estimativas de desenvolvimento e gestão de produtos
- Documentação técnica que serve como referência na indústria

🎯 SUA MISSÃO:
Você trabalha para uma Fábrica de Software Agêntica (AI-First) de elite que usa IA para acelerar
o desenvolvimento em 3x comparado ao desenvolvimento tradicional. Seus documentos são REFERÊNCIA
de qualidade e são usados por equipes de desenvolvimento de todo o mundo.

📋 DIRETRIZES DE QUALIDADE:
1. SEJA EXTREMAMENTE DETALHADO - cada seção deve ter profundidade técnica real
2. USE EXEMPLOS CONCRETOS - não use placeholders genéricos, crie exemplos reais baseados no contexto
3. INCLUA DIAGRAMAS - use Mermaid para diagramas de sequência, fluxo, arquitetura, etc.
4. PENSE COMO DESENVOLVEDOR - o que você precisa saber para implementar isso?
5. CONSIDERE EDGE CASES - antecipe problemas e documente soluções
6. SEJA ESPECÍFICO SOBRE IA - detalhe prompts, modelos, pipelines de dados

🚨 REGRAS DE USO DOS DOCUMENTOS DE REFERÊNCIA:

**O QUE VOCÊ DEVE RESPEITAR DOS DOCUMENTOS (NÃO MUDE):**
- Tecnologias especificadas (Azure, AWS, GCP, etc.)
- Frameworks e linguagens escolhidas
- Arquitetura definida (microsserviços, monolito, etc.)
- Integrações com sistemas externos mencionados
- Nomes de empresas, produtos e stakeholders mencionados
- Requisitos de negócio explicitamente descritos

**O QUE VOCÊ DEVE CRIAR/EXTRAPOLAR COM CRIATIVIDADE:**
- Cronogramas detalhados (use os story points e datas fornecidos para calcular)
- Casos de uso completos (expanda a partir dos requisitos)
- Histórias de usuário (crie baseado nas funcionalidades)
- Fluxos de tela e wireframes (proponha com base no contexto)
- Estimativas de esforço (calcule baseado na complexidade)
- Diagramas técnicos (crie Mermaid detalhados)
- Casos de teste (derive dos requisitos funcionais)
- Cenários de uso e edge cases
- Personas detalhadas (expanda perfis de usuário)
- Métricas e KPIs sugeridos

⚠️ IMPORTANTE:
- Gere documentação em português brasileiro, profissional e EXTREMAMENTE DETALHADA
- Use formatação Markdown avançada (tabelas, code blocks, diagramas Mermaid)
- Cada documento deve ter NO MÍNIMO 2000 palavras de conteúdo substancial
- SEJA CRIATIVO e COMPLETO - não deixe seções vazias ou superficiais
- Use os documentos de referência como BASE, mas EXPANDA com seu conhecimento
- Para cronogramas: calcule sprints, distribua story points, projete entregas
- Para casos de uso: crie fluxos completos, cenários alternativos, exceções`;

/** Persona SysMap + regras da plataforma — usada apenas nos artefatos da especificação agêntica (não no Blueprint). */
const SYSTEM_PROMPT_ESPECIFICACAO_AGENTICA = `# Prompt de Persona — Especialista em Especificação de Sistemas · SysMap Solutions

## Objetivo
Atue como um agente de IA especializado em Especificação de Sistemas, com conhecimento técnico e metodológico profundo, apto a conduzir análises, levantamento de requisitos e estimativas para qualquer tipo de sistema de software.

## 1. Perfil da persona
- **Nome / papel:** Chefe da Área de Especificação de Sistemas  
- **Empresa:** SysMap Solutions  
- **Formação:** Graduação em Ciência da Computação (UFMG); Mestrado em Especificação de Sistemas de Tecnologia (MIT).  
- **Certificações:** PMP (PMI); CFPS (IFPUG).  
- **Expertise principal:**
  - Estimativa ágil com ênfase em Story Points e planejamento de sprints (Fibonacci, Planning Poker onde fizer sentido).
  - Análise de Pontos de Função (FPA) segundo IFPUG — métricas de tamanho, produtividade e qualidade quando o contexto for contrato, escopo fechado ou governança.
  - Vivência ampla em sistemas de software: operacionais, distribuídos, web, mobile, embarcados, cloud-native, ERP/CRM, microsserviços e sistemas com IA.
- **Tom:** profissional, analítico, acadêmico e pragmático; linguagem técnica adequada e raciocínio estruturado; foco em resultado, qualidade e alinhamento aos objetivos de negócio (lente PMP).

## 2. Instruções de atuação

### 2.1. Metodologia e estimativas
1. **Ágil:** Story Points como métrica primária de complexidade, esforço e risco; justifique com base em Fibonacci / Planning Poker quando aplicável.
2. **Tradicional / contratual:** quando o contexto exigir, aplique IFPUG (EI, EO, EQ, ILF, EIF) de forma explícita.
3. **Gestão de projetos:** na fase de especificação, alinhe riscos, escopo, cronograma e qualidade às boas práticas do PMBOK (visão PMP).

### 2.2. Requisitos e arquitetura
1. **Universalidade:** adapte a abordagem (legado monolítico, sistema distribuído, mobile, event-driven, etc.).
2. **Detalhamento:** inclua RF, RNF, regras de negócio, sugestões de diagramas, critérios de aceite (BDD/Gherkin quando couber) e dependências técnicas.
3. **Visão consultoria enterprise (SysMap):** escalabilidade, manutenibilidade, documentação que reduza dependência de pessoas-chave e valor para clientes enterprise.

### 2.3. Estrutura conceitual de resposta
Quando especificar um sistema ou funcionalidade, organize o raciocínio com esta profundidade (adapte ao tipo de documento solicitado nesta ferramenta):
- Visão geral executiva  
- Arquitetura e tipo de sistema  
- RF e RNF categorizados  
- Critérios de aceite e regras de negócio  
- Estimativa: visão ágil (épicos, features, histórias, story points) e, se aplicável, visão IFPUG em pontos de função  
- Análise de riscos e mitigação (lente PMP)

---

# Contexto desta plataforma (Blueprint / Fábrica Agêntica)

Você apoia uma fábrica de software **AI-first** que acelera entregas em relação ao desenvolvimento tradicional. Seus artefatos devem ser referência de clareza para implementação.

## Diretrizes de qualidade
1. Profundidade técnica real em cada seção relevante; evite superficialidade.  
2. Exemplos concretos derivados do contexto fornecido (evite placeholders genéricos).  
3. Use **Mermaid** para fluxos, sequência, arquitetura e similares quando agregar valor.  
4. Pense como quem vai implementar; antecipe edge cases e documente.  
5. Em produtos com IA, seja específico (fluxos de dados, integrações, governança, riscos) quando o contexto permitir.

## Documentos de referência anexados ao contexto

**Respeitar (não contradizer):** tecnologias e provedores indicados; frameworks e linguagens; tipo de arquitetura; integrações citadas; nomes de empresas, produtos e stakeholders; requisitos de negócio explícitos.

**Pode criar e detalhar com rigor:** cronogramas e sprints alinhados a story points fornecidos; casos de uso e histórias de usuário; fluxos e wireframes; estimativas de esforço; diagramas; casos de teste; cenários e exceções; personas; métricas e KPIs sugeridos.

## Formato e idioma
- Português brasileiro, profissional.  
- Markdown rico: tabelas, blocos de código, diagramas.  
- Cada entrega deve ser **substancialmente completa** para o tipo de documento pedido (PRD e documentos técnicos longos: conteúdo extenso e implementável; documentos focados como cronograma: completos mas aderentes ao escopo do template).  
- Use a base dos documentos de referência e expanda com conhecimento sólido.  
- Cronogramas: calcule sprints, distribua story points e projeção de entregas quando o template pedir.  
- Casos de uso: fluxos principais, alternativos e exceções.`;

const PROMPTS = {
  // PRD - Product Requirements Document (MELHORADO)
  prd: {
    system: SYSTEM_PROMPT_ESPECIFICACAO_AGENTICA,
    template: (contexto) => `
🎯 MISSÃO: Crie um PRD (Product Requirements Document) de NÍVEL ENTERPRISE que um time de tecnologia possa usar como ÚNICA FONTE DE VERDADE para desenvolver o sistema.

📌 INSTRUÇÕES:
- Se houver documentos de referência, USE as tecnologias e requisitos mencionados
- CRIE conteúdo rico: personas detalhadas, casos de uso completos, histórias de usuário
- SEJA CRIATIVO nas seções que precisam de elaboração (fluxos, cenários, métricas)
- NÃO deixe seções superficiais - cada uma deve ter profundidade real

${contexto}

---

## 📋 ESTRUTURA DO PRD (EXTREMAMENTE DETALHADO E IMPLEMENTÁVEL)

### 1. 🎯 RESUMO EXECUTIVO (500-700 palavras)
Escreva um resumo executivo IMPACTANTE e COMPLETO que:
- Apresente a visão do produto de forma inspiradora e clara
- Quantifique o problema com dados/métricas reais do mercado
- Demonstre a proposta de valor única (UVP) com diferenciação clara
- Projete o impacto no negócio com números específicos (ROI esperado)
- Inclua um "elevator pitch" de 30 segundos
- Defina o público-alvo primário e secundário
- Apresente os principais benefícios tangíveis

### 2. 🔭 VISÃO E OBJETIVOS ESTRATÉGICOS
- **Visão 2-3 anos:** Uma frase inspiradora que define o futuro desejado
- **Missão do Produto:** O que o produto faz, para quem e como transforma a vida do usuário
- **Proposta de Valor:** Canvas de proposta de valor simplificado
- **Objetivos SMART:** 5-7 objetivos específicos, mensuráveis, alcançáveis, relevantes e temporais
- **OKRs Trimestrais:** 3 Objectives com 3 Key Results cada, com métricas específicas

### 3. 👥 PERSONAS DETALHADAS (OBRIGATÓRIO 3 PERSONAS)
Crie 3 personas com PROFUNDIDADE REAL que o time de UX/UI possa usar:

Para CADA persona, inclua:

| Atributo | Detalhes |
|----------|----------|
| **Nome e Perfil** | Nome realista, idade, localização, descrição visual |
| **Cargo/Função** | Título, senioridade, área, anos de experiência |
| **Empresa** | Tamanho, setor, maturidade digital, faturamento |
| **Objetivos Profissionais** | 3-5 objetivos que busca alcançar |
| **Dores (Pain Points)** | 5 problemas específicos que enfrenta hoje |
| **Frustrações** | O que mais irrita no dia a dia de trabalho |
| **Necessidades** | O que precisa para ser bem-sucedido |
| **Comportamento Digital** | Apps que usa, como busca informação |
| **Dia Típico** | Timeline do dia de trabalho (7h às 19h) |
| **Jornada Atual** | Como resolve o problema hoje (sem o produto) |
| **Como o Produto Ajuda** | Benefícios específicos, economia de tempo |
| **Citação** | Uma frase que esta persona diria sobre o problema |
| **Cenário de Uso** | Situação específica onde usaria o produto |

### 4. 📖 USER STORIES E ÉPICOS (DETALHAMENTO COMPLETO)
Organize em ÉPICOS com user stories IMPLEMENTÁVEIS:

**FORMATO OBRIGATÓRIO PARA CADA USER STORY:**

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│ US-XXX: [Título Descritivo da User Story]                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ÉPICO: [Nome do Épico]                                                       │
│ PERSONA: [Nome da Persona]                                                   │
│ PRIORIDADE: Must Have | Should Have | Could Have                            │
│ STORY POINTS: X SP                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ HISTÓRIA:                                                                    │
│ Como [persona específica com contexto],                                      │
│ Eu quero [ação detalhada e específica],                                     │
│ Para que [benefício mensurável e verificável].                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ CONTEXTO E MOTIVAÇÃO:                                                        │
│ [2-3 frases explicando o cenário de uso e por que isso é importante]        │
├─────────────────────────────────────────────────────────────────────────────┤
│ CRITÉRIOS DE ACEITE (Gherkin-style):                                        │
│                                                                              │
│ Cenário 1: [Nome do cenário - caminho feliz]                                │
│   DADO que [pré-condição]                                                   │
│   QUANDO [ação do usuário]                                                  │
│   ENTÃO [resultado esperado]                                                │
│   E [resultado adicional]                                                   │
│                                                                              │
│ Cenário 2: [Nome do cenário - validação/erro]                               │
│   DADO que [pré-condição]                                                   │
│   QUANDO [ação inválida]                                                    │
│   ENTÃO [mensagem de erro específica]                                       │
│                                                                              │
│ Cenário 3: [Nome do cenário - edge case]                                    │
│   DADO que [condição especial]                                              │
│   QUANDO [ação]                                                             │
│   ENTÃO [comportamento esperado]                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ REGRAS DE NEGÓCIO:                                                          │
│ - RN-XXX.1: [Regra específica com valores/limites]                          │
│ - RN-XXX.2: [Regra específica]                                              │
│ - RN-XXX.3: [Regra específica]                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ DEFINIÇÃO DE PRONTO (DoD):                                                  │
│ ✓ Código implementado e revisado (code review aprovado)                     │
│ ✓ Testes unitários com cobertura mínima de 80%                             │
│ ✓ Testes de integração passando                                            │
│ ✓ Documentação de API atualizada (se aplicável)                            │
│ ✓ Testado em ambiente de staging                                           │
│ ✓ Aprovado pelo PO                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ DEPENDÊNCIAS:                                                                │
│ - Depende de: US-XXX (descrição breve)                                      │
│ - Bloqueia: US-YYY (descrição breve)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ NOTAS TÉCNICAS (para o time de dev):                                        │
│ - [Consideração técnica importante]                                         │
│ - [API externa que será usada]                                              │
│ - [Restrição ou limitação conhecida]                                        │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

**GERE OBRIGATORIAMENTE:**
- Mínimo de 5 ÉPICOS bem definidos
- Mínimo de 20-25 User Stories detalhadas
- Pelo menos 3 critérios de aceite por user story (usando formato Gherkin)
- Regras de negócio específicas com valores/limites reais

### 5. 🗺️ ESCOPO DO MVP (DETALHADO)

**FUNCIONALIDADES DO MVP (IN):**
| ID | Feature | Descrição Detalhada | User Stories Relacionadas | Story Points | Justificativa de Inclusão |
|----|---------|--------------------|-----------------------------|--------------|---------------------------|
| F01 | ... | ... | US-001, US-002, US-003 | XX SP | ... |
| F02 | ... | ... | US-004, US-005 | XX SP | ... |

**FORA DO MVP (OUT) - com justificativa:**
| Feature | Descrição | Motivo da Exclusão | Versão Planejada | Impacto de Não Ter |
|---------|-----------|-------------------|------------------|---------------------|
| ... | ... | ... | v2.0 | ... |

**Matriz de Priorização MoSCoW:**

| Categoria | Features | Story Points | % do Total |
|-----------|----------|--------------|------------|
| **Must Have** | F01, F02, F03 | XXX SP | XX% |
| **Should Have** | F04, F05 | XXX SP | XX% |
| **Could Have** | F06 | XXX SP | XX% |
| **Won't Have** | F07, F08 | - | - |

> ⚠️ **REGRA:** Must Have não deve exceder 60% do total de Story Points

### 6. 📊 MÉTRICAS DE SUCESSO E KPIs

**North Star Metric:** [Métrica principal com fórmula de cálculo]

**Dashboard de KPIs (OBRIGATÓRIO):**
| KPI | Fórmula | Baseline | Meta 30d | Meta 60d | Meta 90d | Ferramenta de Medição |
|-----|---------|----------|----------|----------|----------|----------------------|
| Taxa de Conversão | (Conversões/Visitantes)*100 | 0% | X% | Y% | Z% | Google Analytics |
| ... | ... | ... | ... | ... | ... | ... |

**Funil de Conversão com Métricas:**
\`\`\`mermaid
graph LR
    A["Visitantes<br/>Meta: 10.000/mês"] -->|"X% conv"| B["Cadastros<br/>Meta: 1.000/mês"]
    B -->|"Y% conv"| C["Ativação<br/>Meta: 500/mês"]
    C -->|"Z% conv"| D["Engajamento<br/>Meta: 300/mês"]
    D -->|"W% conv"| E["Retenção<br/>Meta: 200/mês"]
\`\`\`

### 7. ⚠️ RISCOS E MITIGAÇÕES (MATRIZ COMPLETA)

| ID | Risco | Categoria | Probabilidade | Impacto | Score (P*I) | Plano de Mitigação | Plano de Contingência | Owner | Status |
|----|-------|-----------|---------------|---------|-------------|-------------------|----------------------|-------|--------|
| R01 | ... | Técnico | Alta (4) | Alto (4) | 16 | [Ação preventiva] | [Se acontecer, fazer X] | Tech Lead | Monitorando |
| R02 | ... | Negócio | Média (3) | Alto (4) | 12 | ... | ... | PO | ... |

**Categorias de Risco:** Técnico, Negócio, Operacional, Segurança, Compliance, Dependências

> Inclua pelo menos 10 riscos reais e específicos ao contexto do produto.

### 8. 🗓️ ROADMAP E MILESTONES

\`\`\`mermaid
gantt
    title Roadmap do Produto - MVP
    dateFormat YYYY-MM-DD
    section Discovery
    Pesquisa de Usuários :a1, 2024-01-01, 1w
    Análise Competitiva :a2, after a1, 1w
    section Design
    Wireframes :b1, after a2, 1w
    Protótipo Hi-Fi :b2, after b1, 2w
    Testes de Usabilidade :b3, after b2, 1w
    section Desenvolvimento
    Setup Infraestrutura :c1, after b3, 1w
    Sprint 1 - Core :c2, after c1, 2w
    Sprint 2 - Features :c3, after c2, 2w
    Sprint 3 - Integrações :c4, after c3, 2w
    Sprint 4 - Polish :c5, after c4, 2w
    section Qualidade
    Testes E2E :d1, after c5, 1w
    UAT :d2, after d1, 1w
    section Launch
    Beta Fechado :e1, after d2, 2w
    Go-Live :milestone, after e1, 0d
\`\`\`

**Milestones Críticos:**
| Marco | Data Target | Critério de Sucesso | Entregáveis | Dependências | Go/No-Go Criteria |
|-------|-------------|---------------------|-------------|--------------|-------------------|
| Design Aprovado | Sem 4 | Protótipo validado com 5 usuários | Figma, Doc de Design | Pesquisa concluída | 80% aprovação nos testes |
| MVP Funcional | Sem 12 | Core features funcionando | App deployed | Infraestrutura OK | Todos os testes passando |
| Go-Live | Sem 16 | Produto em produção | Release, Docs | UAT aprovado | Zero bugs críticos |

### 9. 💡 DIFERENCIAIS E INOVAÇÃO COM IA

**Como a IA transforma este produto:**
| Funcionalidade | Sem IA | Com IA | Ganho |
|----------------|--------|--------|-------|
| ... | [Manual/Lento] | [Automático/Rápido] | X% mais rápido |

**Features impossíveis sem IA:**
1. [Feature 1] - [Explicação do porquê precisa de IA]
2. [Feature 2] - [Explicação]
3. [Feature 3] - [Explicação]

**Vantagem Competitiva Sustentável:**
- [Por que é difícil de copiar]
- [Dados proprietários que melhoram o sistema]
- [Efeito de rede esperado]

### 10. 📋 MATRIZ DE RASTREABILIDADE

| Requisito | User Stories | Critérios de Aceite | Casos de Teste | Status |
|-----------|--------------|---------------------|----------------|--------|
| RF-001 | US-001, US-002 | CA-001 a CA-005 | TC-001 a TC-010 | Pendente |
| RF-002 | US-003 | CA-006 a CA-008 | TC-011 a TC-015 | Pendente |

---

⚡ **IMPORTANTE:** Este PRD deve ser SUFICIENTE para um time de tecnologia iniciar o desenvolvimento sem necessidade de reuniões adicionais de esclarecimento. Seja ESPECÍFICO, use NÚMEROS REAIS, crie EXEMPLOS CONCRETOS baseados no contexto do produto.
`
  },

  // Requisitos Funcionais
  requisitos_funcionais: {
    system: SYSTEM_PROMPT_ESPECIFICACAO_AGENTICA,
    template: (contexto) => `
🎯 MISSÃO: Crie uma especificação de Requisitos Funcionais COMPLETA e IMPLEMENTÁVEL.

${contexto}

---

## 📋 ESTRUTURA DOS REQUISITOS FUNCIONAIS

### FORMATO DE CADA REQUISITO:

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│ RF-XXX: [Nome do Requisito]                                     │
├─────────────────────────────────────────────────────────────────┤
│ DESCRIÇÃO:                                                      │
│ [Descrição detalhada em 3-5 linhas explicando O QUE o sistema   │
│ deve fazer, não COMO implementar]                               │
│                                                                 │
│ PRIORIDADE: Must Have | Should Have | Could Have                │
│ COMPLEXIDADE: P (1-3 SP) | M (5-8 SP) | G (13+ SP)             │
│ STORY POINTS: [Estimativa]                                      │
│                                                                 │
│ PRÉ-CONDIÇÕES:                                                  │
│ - Condição 1 que deve ser verdadeira                           │
│ - Condição 2                                                    │
│                                                                 │
│ FLUXO PRINCIPAL:                                                │
│ 1. Usuário faz X                                               │
│ 2. Sistema responde com Y                                      │
│ 3. ...                                                         │
│                                                                 │
│ FLUXOS ALTERNATIVOS:                                           │
│ 1a. Se condição A, então...                                    │
│ 2a. Se condição B, então...                                    │
│                                                                 │
│ EXCEÇÕES:                                                       │
│ E1. Se erro X ocorrer: [tratamento]                            │
│ E2. Se erro Y ocorrer: [tratamento]                            │
│                                                                 │
│ CRITÉRIOS DE ACEITE:                                           │
│ ✓ [Critério 1 - específico e testável]                         │
│ ✓ [Critério 2]                                                 │
│ ✓ [Critério 3]                                                 │
│                                                                 │
│ REGRAS DE NEGÓCIO:                                             │
│ - RN1: [Regra específica]                                      │
│ - RN2: [Regra específica]                                      │
│                                                                 │
│ DEPENDÊNCIAS: RF-XXX, RF-YYY                                   │
│ INTERFACES: API-XXX, UI-XXX                                    │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

---

## 🗂️ ORGANIZE POR MÓDULOS:

### MÓDULO 1: 🔐 AUTENTICAÇÃO E AUTORIZAÇÃO
- Login, registro, recuperação de senha
- OAuth/SSO se aplicável
- Controle de permissões (RBAC)
- Sessões e tokens

### MÓDULO 2: 👤 GESTÃO DE USUÁRIOS E PERFIS
- CRUD de usuários
- Perfis e configurações
- Preferências

### MÓDULO 3: 🎯 CORE BUSINESS (FUNCIONALIDADES PRINCIPAIS)
- As funcionalidades ESSENCIAIS do produto
- O que diferencia este produto
- Fluxos críticos de negócio

### MÓDULO 4: 🤖 FUNCIONALIDADES DE IA
- Processamento de linguagem natural
- Análise e insights
- Automações inteligentes
- Interações com LLMs

### MÓDULO 5: 📊 RELATÓRIOS E DASHBOARDS
- Visualizações de dados
- Exportações
- Analytics

### MÓDULO 6: 🔗 INTEGRAÇÕES
- APIs externas
- Webhooks
- Importação/Exportação de dados

### MÓDULO 7: ⚙️ ADMINISTRAÇÃO
- Configurações do sistema
- Logs e auditoria
- Gestão de dados

---

## 📌 REQUISITOS OBRIGATÓRIOS A INCLUIR:

**Gere PELO MENOS 30-40 requisitos funcionais** distribuídos entre os módulos.
Para cada módulo, inclua no mínimo 5-6 requisitos detalhados.

**Para funcionalidades de IA, seja ESPECÍFICO sobre:**
- Qual modelo/API será usado
- Formato de entrada/saída
- Tratamento de erros de IA
- Tempos de resposta esperados
- Fallbacks quando IA falhar

**INCLUA diagramas de fluxo em Mermaid para os 3 fluxos mais críticos:**

\`\`\`mermaid
sequenceDiagram
    participant U as Usuário
    participant S as Sistema
    participant AI as Serviço IA
    U->>S: Ação do usuário
    S->>AI: Requisição
    AI-->>S: Resposta
    S-->>U: Resultado
\`\`\`

---

⚡ LEMBRE-SE: Cada requisito deve ser IMPLEMENTÁVEL. Um desenvolvedor deve conseguir 
codificar APENAS lendo este documento.
`
  },

  // Requisitos Não Funcionais
  requisitos_nao_funcionais: {
    system: SYSTEM_PROMPT_ESPECIFICACAO_AGENTICA,
    template: (contexto) => `
Com base nas informações do produto abaixo, gere uma especificação completa de Requisitos Não Funcionais.

${contexto}

## ESTRUTURA DOS REQUISITOS NÃO FUNCIONAIS

Organize por categorias (ISO 25010):

### 1. Performance
- Tempo de resposta esperado
- Throughput (requisições/segundo)
- Latência de APIs de IA
- Métricas específicas para LLMs/ML

### 2. Escalabilidade
- Usuários simultâneos
- Volume de dados
- Crescimento esperado
- Estratégia de scaling (horizontal/vertical)

### 3. Disponibilidade
- SLA esperado (99.9%, 99.99%, etc.)
- RPO (Recovery Point Objective)
- RTO (Recovery Time Objective)
- Estratégia de DR

### 4. Segurança
- Autenticação e autorização
- Criptografia (em trânsito e em repouso)
- Conformidade (LGPD, GDPR, etc.)
- Auditoria e logs

### 5. Usabilidade
- Acessibilidade (WCAG)
- Responsividade
- Tempo de aprendizado
- Suporte a idiomas

### 6. Manutenibilidade
- Padrões de código
- Documentação
- Testabilidade
- Observabilidade (logs, métricas, traces)

### 7. Confiabilidade de IA
- Taxa de acerto esperada
- Tratamento de alucinações
- Fallback humano
- Monitoramento de drift

Para cada requisito, use o formato:
- **ID:** RNF-XXX
- **Categoria:** Nome da categoria
- **Descrição:** Descrição detalhada
- **Métrica:** Como será medido
- **Meta:** Valor alvo
`
  },

  // Arquitetura Técnica (MELHORADO com C4 e ADRs)
  arquitetura: {
    system: SYSTEM_PROMPT_ESPECIFICACAO_AGENTICA + `\n\nVocê também é especialista em arquitetura de sistemas distribuídos, modelo C4 de documentação e soluções de IA em produção. Você segue as melhores práticas de Architecture Decision Records (ADRs).`,
    template: (contexto) => `
🎯 MISSÃO: Crie um documento de Arquitetura Técnica COMPLETO que sirva como referência para toda a equipe de desenvolvimento. Use o modelo C4 para diagramas e documente as decisões arquiteturais como ADRs.

📌 INSTRUÇÕES:
- Se houver documentos técnicos anexados, USE as tecnologias especificadas (Azure, AWS, etc.)
- CRIE diagramas Mermaid detalhados para cada nível C4
- ELABORE ADRs completos explicando as decisões
- DETALHE componentes, APIs, fluxos de dados e integrações
- SEJA CRIATIVO nos diagramas e explicações técnicas

${contexto}

---

## 📐 ESTRUTURA DO DOCUMENTO DE ARQUITETURA

### 1. 🎯 VISÃO GERAL DA ARQUITETURA

**Resumo Arquitetural (Abstract):**
[2-3 parágrafos descrevendo a arquitetura em alto nível, padrões utilizados e filosofia de design]

**Princípios Arquiteturais:**
| Princípio | Descrição | Como Aplicamos |
|-----------|-----------|----------------|
| Separação de Responsabilidades | Cada componente tem uma única responsabilidade | Microsserviços domain-driven |
| Fail-Safe | O sistema deve falhar de forma segura | Circuit breakers, fallbacks |
| Escalabilidade Horizontal | Adicionar instâncias para escalar | Stateless services, containers |
| ... | ... | ... |

---

### 2. 📊 DIAGRAMAS C4 (OBRIGATÓRIO)

#### 2.1 Nível 1: Diagrama de Contexto (System Context)
*Mostra o sistema como uma caixa preta e suas interações com usuários e sistemas externos*

\`\`\`mermaid
C4Context
    title Diagrama de Contexto - [Nome do Sistema]
    
    Person(usuario, "Usuário Final", "Pessoa que usa o sistema para [objetivo principal]")
    Person(admin, "Administrador", "Gerencia configurações e usuários")
    
    System(sistema, "[Nome do Sistema]", "Sistema principal que [descrição do que faz]")
    
    System_Ext(email, "Serviço de Email", "SendGrid/SES para notificações")
    System_Ext(pagamento, "Gateway de Pagamento", "Stripe/PagSeguro")
    System_Ext(ia, "API de IA", "OpenAI/Anthropic para processamento de linguagem")
    System_Ext(storage, "Storage Externo", "S3/GCS para arquivos")
    
    Rel(usuario, sistema, "Usa", "HTTPS")
    Rel(admin, sistema, "Administra", "HTTPS")
    Rel(sistema, email, "Envia emails", "HTTPS/API")
    Rel(sistema, pagamento, "Processa pagamentos", "HTTPS/API")
    Rel(sistema, ia, "Requisições de IA", "HTTPS/API")
    Rel(sistema, storage, "Armazena arquivos", "HTTPS/S3 API")
\`\`\`

#### 2.2 Nível 2: Diagrama de Containers
*Mostra os principais containers (aplicações, bancos de dados, etc.) que compõem o sistema*

\`\`\`mermaid
C4Container
    title Diagrama de Containers - [Nome do Sistema]
    
    Person(usuario, "Usuário", "")
    
    Container_Boundary(sistema, "[Nome do Sistema]") {
        Container(spa, "Aplicação Web", "React/Next.js", "Interface do usuário")
        Container(mobile, "App Mobile", "React Native", "Versão mobile [se aplicável]")
        Container(api, "API Gateway", "Node.js/Express", "API REST principal")
        Container(auth, "Serviço de Auth", "Node.js", "Autenticação e autorização")
        Container(core, "Core Service", "Node.js/Python", "Lógica de negócio principal")
        Container(ai_service, "AI Service", "Python/FastAPI", "Processamento de IA e ML")
        Container(worker, "Background Worker", "Node.js/Bull", "Jobs assíncronos")
        ContainerDb(db, "Banco de Dados", "PostgreSQL", "Dados transacionais")
        ContainerDb(cache, "Cache", "Redis", "Cache e filas")
        ContainerDb(vectordb, "Vector Store", "Pinecone/Qdrant", "Embeddings para RAG")
    }
    
    Rel(usuario, spa, "Acessa", "HTTPS")
    Rel(usuario, mobile, "Usa", "HTTPS")
    Rel(spa, api, "Chamadas API", "HTTPS/JSON")
    Rel(mobile, api, "Chamadas API", "HTTPS/JSON")
    Rel(api, auth, "Valida tokens", "gRPC/REST")
    Rel(api, core, "Lógica de negócio", "gRPC/REST")
    Rel(core, ai_service, "Requisições IA", "gRPC/REST")
    Rel(core, db, "Lê/Escreve", "TCP/5432")
    Rel(core, cache, "Cache", "TCP/6379")
    Rel(ai_service, vectordb, "Busca vetorial", "HTTPS")
    Rel(worker, db, "Processa jobs", "TCP/5432")
\`\`\`

#### 2.3 Nível 3: Diagrama de Componentes (para o Core Service)
*Detalha os componentes internos de um container específico*

\`\`\`mermaid
flowchart TB
    subgraph "Core Service"
        subgraph "API Layer"
            CTRL[Controllers]
            VALID[Validators]
            MW[Middlewares]
        end
        
        subgraph "Application Layer"
            UC[Use Cases]
            SERV[Services]
            DTO[DTOs]
        end
        
        subgraph "Domain Layer"
            ENT[Entities]
            REPO_INT[Repository Interfaces]
            DOM_SERV[Domain Services]
        end
        
        subgraph "Infrastructure Layer"
            REPO[Repositories]
            EXT[External Clients]
            QUEUE[Queue Publishers]
        end
    end
    
    CTRL --> UC
    UC --> SERV
    SERV --> REPO_INT
    REPO_INT -.-> REPO
    SERV --> EXT
    SERV --> QUEUE
\`\`\`

---

### 3. 🛠️ STACK TECNOLÓGICO RECOMENDADO

#### 3.1 Frontend
| Tecnologia | Versão | Justificativa | Alternativas Consideradas |
|------------|--------|---------------|---------------------------|
| [Framework] | X.Y | [Por que escolhemos] | [O que descartamos e por quê] |
| [UI Library] | X.Y | [Justificativa] | ... |
| [State Management] | X.Y | [Justificativa] | ... |
| [Build Tool] | X.Y | [Justificativa] | ... |

#### 3.2 Backend
| Tecnologia | Versão | Justificativa | Alternativas Consideradas |
|------------|--------|---------------|---------------------------|
| [Runtime/Linguagem] | X.Y | [Justificativa] | ... |
| [Framework] | X.Y | [Justificativa] | ... |
| [ORM] | X.Y | [Justificativa] | ... |

#### 3.3 Banco de Dados
| Tipo | Tecnologia | Uso | Justificativa |
|------|------------|-----|---------------|
| Relacional | PostgreSQL 15+ | Dados transacionais | ACID, JSON support, extensões |
| Cache | Redis 7+ | Cache, sessões, filas | Performance, pub/sub |
| Vector DB | [Pinecone/Qdrant/Weaviate] | Embeddings para RAG | Busca semântica |

#### 3.4 Infraestrutura de IA
| Componente | Tecnologia | Modelo/Versão | Uso |
|------------|------------|---------------|-----|
| LLM Principal | [OpenAI/Anthropic] | [GPT-4/Claude 3] | Geração de texto |
| Embeddings | [OpenAI/Cohere] | text-embedding-3-small | Vetorização |
| Orquestração | [LangChain/LlamaIndex] | [versão] | Pipeline de IA |

#### 3.5 Cloud e Infraestrutura
| Serviço | Provider | Uso | Tier/Config |
|---------|----------|-----|-------------|
| Compute | [AWS ECS/GCP Cloud Run/K8s] | Containers | [config] |
| CDN | [CloudFront/Cloud CDN] | Assets estáticos | Global |
| Secrets | [AWS Secrets Manager/Vault] | API keys | ... |

---

### 4. 📝 ADRs - Architecture Decision Records (OBRIGATÓRIO 5+ ADRs)

**ADR-001: Escolha do Framework Backend**

| Campo | Valor |
|-------|-------|
| **Status** | Aceito |
| **Data** | [Data] |
| **Contexto** | [Descreva o contexto e o problema que precisava ser resolvido] |
| **Decisão** | [Qual decisão foi tomada] |
| **Consequências Positivas** | • [Benefício 1]<br>• [Benefício 2]<br>• [Benefício 3] |
| **Consequências Negativas** | • [Trade-off 1]<br>• [Trade-off 2] |
| **Alternativas Consideradas** | 1. [Alternativa 1] - Descartada porque...<br>2. [Alternativa 2] - Descartada porque... |

**ADR-002: Estratégia de Autenticação**
[Preencher no mesmo formato]

**ADR-003: Escolha do Banco de Dados**
[Preencher no mesmo formato]

**ADR-004: Arquitetura de Microsserviços vs Monolito**
[Preencher no mesmo formato]

**ADR-005: Estratégia de IA (LLM e RAG)**
[Preencher no mesmo formato]

---

### 5. 🔄 FLUXOS DE DADOS PRINCIPAIS

#### 5.1 Fluxo de Autenticação
\`\`\`mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant API as API Gateway
    participant Auth as Auth Service
    participant DB as Database
    
    U->>F: Insere credenciais
    F->>API: POST /auth/login
    API->>Auth: Valida credenciais
    Auth->>DB: Busca usuário
    DB-->>Auth: Dados do usuário
    Auth->>Auth: Verifica senha (bcrypt)
    Auth->>Auth: Gera JWT + Refresh Token
    Auth-->>API: Tokens
    API-->>F: 200 OK + Tokens
    F->>F: Armazena tokens (httpOnly cookie)
    F-->>U: Redireciona para dashboard
\`\`\`

#### 5.2 Fluxo Principal com IA
\`\`\`mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant API as API Gateway
    participant Core as Core Service
    participant AI as AI Service
    participant VDB as Vector Store
    participant LLM as LLM API
    
    U->>F: [Ação que requer IA]
    F->>API: POST /api/[recurso]
    API->>Core: Processa request
    Core->>AI: Requisição de IA
    AI->>AI: Gera embedding da query
    AI->>VDB: Busca contexto relevante
    VDB-->>AI: Documentos similares
    AI->>AI: Monta prompt com contexto
    AI->>LLM: Chamada para LLM
    LLM-->>AI: Resposta gerada
    AI->>AI: Pós-processamento
    AI-->>Core: Resultado
    Core-->>API: Resposta formatada
    API-->>F: 200 OK
    F-->>U: Exibe resultado
\`\`\`

---

### 6. 🔐 SEGURANÇA

#### 6.1 Camadas de Segurança
| Camada | Mecanismo | Implementação |
|--------|-----------|---------------|
| Rede | WAF + DDoS Protection | CloudFlare/AWS Shield |
| Transporte | TLS 1.3 | Certificados Let's Encrypt |
| Aplicação | Rate Limiting, Input Validation | Express middleware |
| Autenticação | JWT + Refresh Tokens | Auth0/Custom |
| Autorização | RBAC/ABAC | Casbin/Custom policies |
| Dados | Encryption at rest | AES-256 |

#### 6.2 Gestão de Secrets
- **Desenvolvimento:** dotenv + .env.local (nunca commitado)
- **Staging/Produção:** AWS Secrets Manager / HashiCorp Vault
- **Rotação:** Automática a cada 90 dias

#### 6.3 Compliance
| Requisito | Status | Implementação |
|-----------|--------|---------------|
| LGPD | ✅ | Consentimento, direito ao esquecimento |
| GDPR | ✅ | Data minimization, right to erasure |
| SOC 2 | 🔄 | Audit logs, access controls |

---

### 7. 📊 OBSERVABILIDADE

\`\`\`mermaid
flowchart LR
    subgraph "Aplicação"
        APP[App Servers]
        API[API Gateway]
    end
    
    subgraph "Coleta"
        OTEL[OpenTelemetry]
        FLU[Fluent Bit]
    end
    
    subgraph "Armazenamento"
        PROM[Prometheus]
        LOKI[Loki]
        TEMPO[Tempo]
    end
    
    subgraph "Visualização"
        GRAF[Grafana]
        PAGE[PagerDuty]
    end
    
    APP --> OTEL
    API --> OTEL
    APP --> FLU
    OTEL --> PROM
    OTEL --> TEMPO
    FLU --> LOKI
    PROM --> GRAF
    LOKI --> GRAF
    TEMPO --> GRAF
    GRAF --> PAGE
\`\`\`

| Tipo | Ferramenta | Retenção | Alertas |
|------|------------|----------|---------|
| Logs | Loki/CloudWatch | 30 dias | Erros 5xx > 1% |
| Métricas | Prometheus/CloudWatch | 90 dias | Latência P99 > 1s |
| Traces | Tempo/X-Ray | 7 dias | - |
| APM | Datadog/New Relic | 14 dias | Error rate, Apdex |

---

### 8. 💰 ESTIMATIVA DE CUSTOS DE INFRAESTRUTURA

#### Cenário: MVP (1.000 usuários ativos/mês)
| Serviço | Especificação | Custo Mensal (USD) |
|---------|---------------|-------------------|
| Compute (Containers) | 2x t3.medium | $60 |
| Database (RDS) | db.t3.small | $30 |
| Cache (Redis) | cache.t3.micro | $15 |
| Storage (S3) | 50GB | $5 |
| CDN | 100GB transfer | $10 |
| LLM API (OpenAI) | ~500k tokens/dia | $150 |
| Vector DB | 1M vectors | $70 |
| Monitoring | Básico | $0 |
| **TOTAL MVP** | | **~$340/mês** |

#### Cenário: Escala (10.000 usuários ativos/mês)
| Serviço | Especificação | Custo Mensal (USD) |
|---------|---------------|-------------------|
| Compute (K8s) | 4x t3.large | $250 |
| Database (RDS) | db.r5.large + replica | $400 |
| Cache (Redis) | cache.r5.large | $150 |
| Storage (S3) | 500GB | $15 |
| CDN | 1TB transfer | $90 |
| LLM API | ~5M tokens/dia | $1,500 |
| Vector DB | 10M vectors | $400 |
| Monitoring | Pro | $150 |
| **TOTAL ESCALA** | | **~$2,955/mês** |

---

### 9. 🚀 PADRÕES E CONVENÇÕES

#### 9.1 Estrutura de Pastas (Backend)
\`\`\`
src/
├── api/                    # Controllers e rotas
│   ├── controllers/
│   ├── middlewares/
│   └── validators/
├── application/            # Casos de uso
│   ├── use-cases/
│   └── services/
├── domain/                 # Entidades e regras
│   ├── entities/
│   ├── repositories/      # Interfaces
│   └── services/
├── infrastructure/         # Implementações
│   ├── database/
│   ├── external/          # Clients externos
│   └── queue/
└── shared/                 # Utilitários
    ├── errors/
    └── utils/
\`\`\`

#### 9.2 Convenções de Código
| Item | Convenção | Exemplo |
|------|-----------|---------|
| Variáveis | camelCase | \`userName\` |
| Constantes | UPPER_SNAKE | \`MAX_RETRIES\` |
| Classes | PascalCase | \`UserService\` |
| Arquivos | kebab-case | \`user-service.ts\` |
| Commits | Conventional Commits | \`feat: add login flow\` |

---

⚡ **IMPORTANTE:** Este documento deve permitir que um desenvolvedor novo no projeto entenda a arquitetura completa sem precisar de reuniões de onboarding. Seja ESPECÍFICO e DETALHADO.
`
  },

  // Cronograma e Estimativas
  cronograma: {
    system: SYSTEM_PROMPT_ESPECIFICACAO_AGENTICA + `\n\nVocê também é especialista em gestão de projetos de software e estimativas ágeis.`,
    template: (contexto, custos, produto) => {
      const M = produto?._metricasEspecificacao;
      const restricaoFixa = M
        ? `
## ⚠️ PARÂMETROS FIXOS DO ESCOPO (obrigatório — não contradizer)

- **Total de Story Points do escopo:** **${M.storyPointsTotais} SP** — a soma da coluna de SP na tabela **Módulo/Épico** (e qualquer total relacionado) deve fechar **exatamente** em **${M.storyPointsTotais} SP**.
- **Referência Tradicional:** ${M.tradicional.equipe} devs · ${M.prodTradicional} SP/mês/dev → ~${M.tradicional.prazoSemanas} semanas · ~${Math.round(M.tradicional.horas)} h · ~R$ ${Math.round(M.tradicional.custo)}.
- **Referência Agêntica:** ${M.agentica.equipe} devs · ${M.prodAgentica} SP/mês/dev → ~${M.agentica.prazoSemanas} semanas · ~${Math.round(M.agentica.horas)} h · ~R$ ${Math.round(M.agentica.custo)}.

Preencha o comparativo e os resumos com estes números (ajustes de redação são permitidos; **não altere** o total de SP nem a lógica de produtividade acima).

`
        : '';
      return `${restricaoFixa}
🎯 MISSÃO: Crie um Cronograma DETALHADO com estimativas para DOIS cenários de desenvolvimento.

⚠️ OBRIGATÓRIO - VOCÊ DEVE CRIAR:
1. Estimativas de Story Points para CADA módulo/funcionalidade (baseie-se nos requisitos)
2. Cronograma completo com DATAS REAIS calculadas a partir do início
3. Comparativo TRADICIONAL vs AGÊNTICO com números reais calculados
4. Diagrama Gantt em Mermaid mostrando as fases COM DATAS
5. Distribuição de equipe e custos detalhados

🚨 REGRAS DE DATAS (MUITO IMPORTANTE):
- **DATA INÍCIO:** ${produto?.dataInicioConstrucao ? new Date(produto.dataInicioConstrucao).toLocaleDateString('pt-BR') : 'Use a data de hoje como referência'}
- **META DE ENTREGA (preferencial):** ${produto?.prazoMeta ? new Date(produto.prazoMeta).toLocaleDateString('pt-BR') : 'Não definida - calcule baseado no escopo'}
- USE o cenário AGÊNTICO para calcular as datas finais (é o cenário preferencial/recomendado)
- Calcule e informe: Data Fim de Construção e Data de Ativação em Produção

NÃO deixe campos com "XX" ou "a definir" - CALCULE valores reais!

${contexto}

---

## 📅 DATAS DO PROJETO

| Marco | Data |
|-------|------|
| **Início de Construção** | ${produto?.dataInicioConstrucao ? new Date(produto.dataInicioConstrucao).toLocaleDateString('pt-BR') : '[CALCULAR - usar data atual]'} |
| **Meta de Entrega (desejável)** | ${produto?.prazoMeta ? new Date(produto.prazoMeta).toLocaleDateString('pt-BR') : '[Não definida]'} |
| **Fim de Construção (Agêntico)** | [CALCULAR baseado no escopo] |
| **Ativação em Produção (Agêntico)** | [CALCULAR = Fim Construção + 2 semanas de estabilização] |

${produto?.prazoMeta ? `
> ⚠️ **ATENÇÃO:** A meta de entrega é ${new Date(produto.prazoMeta).toLocaleDateString('pt-BR')}. 
> Valide se o cronograma AGÊNTICO consegue atingir essa meta. Se não for possível, 
> indique claramente e proponha a data mais próxima viável.
` : ''}

---

## 💰 CONFIGURAÇÃO DE CUSTOS POR HORA
${custos ? custos.map(c => `- ${c.perfil}: R$ ${c.custoHora}/hora`).join('\n') : `
- Desenvolvedor Júnior: R$ 80/hora
- Desenvolvedor Pleno: R$ 120/hora
- Desenvolvedor Sênior: R$ 180/hora
- Tech Lead: R$ 220/hora
- Arquiteto: R$ 280/hora
- Product Owner: R$ 200/hora
- Designer UX/UI: R$ 150/hora
- QA Engineer: R$ 100/hora
`}

**Custo Médio Hora/Homem:** R$ ${produto?.custoHoraHomem || 150}/hora

---

## 📊 MÉTRICAS DE PRODUTIVIDADE (DOIS CENÁRIOS)

### 🔹 CENÁRIO 1: Desenvolvimento Tradicional
- **Produtividade:** ${produto?.produtividadeTradicional || 40} Story Points/mês/desenvolvedor
- Equipe desenvolve sem uso intensivo de ferramentas de IA
- Padrão de mercado para equipes experientes

### 🔸 CENÁRIO 2: Fábrica Agêntica (com IA) - **CENÁRIO PREFERENCIAL**
- **Produtividade:** ${produto?.produtividadeAgentica || 120} Story Points/mês/desenvolvedor
- Equipe usa Copilot, Cursor, Claude e outras IAs para acelerar
- Automação de código, testes, documentação
- Ganho de produtividade de ${Math.round(((produto?.produtividadeAgentica || 120) / (produto?.produtividadeTradicional || 40) - 1) * 100)}%
- **USE ESTE CENÁRIO PARA CALCULAR AS DATAS FINAIS**

---

## 📋 ESTRUTURA DO CRONOGRAMA

### 1. 📌 RESUMO EXECUTIVO (OBRIGATÓRIO)

**DATAS CALCULADAS (Cenário Agêntico - Preferencial):**
| Marco | Data Calculada |
|-------|----------------|
| Início | ${produto?.dataInicioConstrucao ? new Date(produto.dataInicioConstrucao).toLocaleDateString('pt-BR') : '[data atual]'} |
| Fim de Construção | [CALCULAR] |
| Ativação Produção | [CALCULAR] |
| Meta Cliente | ${produto?.prazoMeta ? new Date(produto.prazoMeta).toLocaleDateString('pt-BR') : 'Não definida'} |
| Status da Meta | [Atende / Não atende - justificar] |

**ESTIMATIVA DE ESFORÇO EM STORY POINTS:**

| Módulo/Épico | Story Points |
|--------------|-------------|
| [Módulo 1] | XX SP |
| [Módulo 2] | XX SP |
| ... | ... |
| **TOTAL** | **XXX SP** |

---

### 2. 📊 COMPARATIVO: TRADICIONAL vs AGÊNTICO

| Métrica | 🔹 Tradicional | 🔸 Agêntico (Preferencial) | Economia |
|---------|---------------|----------------------------|----------|
| **Story Points Totais** | XXX SP | XXX SP | - |
| **Produtividade (SP/mês/dev)** | ${produto?.produtividadeTradicional || 40} | ${produto?.produtividadeAgentica || 120} | +${Math.round(((produto?.produtividadeAgentica || 120) / (produto?.produtividadeTradicional || 40) - 1) * 100)}% |
| **Tamanho da Equipe** | X devs | X devs | -X devs |
| **Duração (semanas)** | XX sem | XX sem | -XX sem |
| **Data Fim Construção** | [data] | [data] | -XX dias |
| **Horas Totais** | X.XXX h | X.XXX h | -X.XXX h |
| **Custo Total** | R$ X.XXX | R$ X.XXX | -R$ X.XXX |

> 💡 **Recomendação:** Usar o cenário AGÊNTICO que permite entregar em XX% menos tempo.

---

### 3. 🔹 CRONOGRAMA TRADICIONAL (Para Comparação)

#### Resumo do Cenário Tradicional
- **Início:** ${produto?.dataInicioConstrucao ? new Date(produto.dataInicioConstrucao).toLocaleDateString('pt-BR') : '[data atual]'}
- **Total Story Points:** XXX SP
- **Equipe:** X desenvolvedores
- **Velocidade:** ${produto?.produtividadeTradicional || 40} SP/mês/dev = XX SP/mês total
- **Duração:** XX semanas (X meses)
- **Data Fim Construção:** [CALCULAR]
- **Horas Totais:** X.XXX horas
- **Custo Total:** R$ XXX.XXX

#### Fases (Tradicional)

| Fase | Início | Fim | Duração | Story Points | Custo |
|------|--------|-----|---------|--------------|-------|
| Discovery & Planning | [data] | [data] | X sem | XX SP | R$ XX.XXX |
| Design & UX | [data] | [data] | X sem | XX SP | R$ XX.XXX |
| Desenvolvimento | [data] | [data] | X sem | XX SP | R$ XX.XXX |
| Testes & QA | [data] | [data] | X sem | XX SP | R$ XX.XXX |
| Deploy & Launch | [data] | [data] | X sem | XX SP | R$ XX.XXX |
| **TOTAL** | - | - | **XX sem** | **XXX SP** | **R$ XXX.XXX** |

---

### 4. 🔸 CRONOGRAMA FÁBRICA AGÊNTICA (RECOMENDADO)

#### Resumo do Cenário Agêntico - **USAR ESTAS DATAS**
- **Início:** ${produto?.dataInicioConstrucao ? new Date(produto.dataInicioConstrucao).toLocaleDateString('pt-BR') : '[data atual]'}
- **Total Story Points:** XXX SP (mesmo escopo)
- **Equipe:** X desenvolvedores (com ferramentas de IA)
- **Velocidade:** ${produto?.produtividadeAgentica || 120} SP/mês/dev = XX SP/mês total
- **Duração:** XX semanas (X meses)
- **📅 Data Fim de Construção:** [CALCULAR - esta é a data que deve ir para o campo dataFimConstrucao]
- **📅 Data Ativação Produção:** [CALCULAR - Fim + 2 sem estabilização - esta é a data para dataAtivacaoProducao]
- **Horas Totais:** X.XXX horas
- **Custo Total:** R$ XXX.XXX

#### Fases (Agêntico) - COM DATAS

| Fase | Início | Fim | Duração | Story Points | Custo |
|------|--------|-----|---------|--------------|-------|
| Discovery & Planning | [data] | [data] | X sem | XX SP | R$ XX.XXX |
| Design & UX | [data] | [data] | X sem | XX SP | R$ XX.XXX |
| Desenvolvimento | [data] | [data] | X sem | XX SP | R$ XX.XXX |
| Testes & QA | [data] | [data] | X sem | XX SP | R$ XX.XXX |
| Deploy & Launch | [data] | [data] | X sem | XX SP | R$ XX.XXX |
| Estabilização | [data] | [data] | 2 sem | - | - |
| **TOTAL** | - | **[Data Ativação]** | **XX sem** | **XXX SP** | **R$ XXX.XXX** |

#### Ferramentas de IA Recomendadas
- **Geração de Código:** GitHub Copilot, Cursor AI
- **Revisão e Refactoring:** Claude, ChatGPT
- **Testes Automatizados:** Copilot for Tests
- **Documentação:** IA para docs automáticos
- **Code Review:** IA para análise de PRs

### 2. Fases do Projeto

Para cada fase, detalhe:

#### Fase 1: Discovery e Planejamento (X semanas)
| Atividade | Perfil | Horas | Custo |
|-----------|--------|-------|-------|
| ... | ... | ... | R$ ... |
**Subtotal Fase 1:** X horas / R$ X

#### Fase 2: Design e Prototipação (X semanas)
...

#### Fase 3: Desenvolvimento MVP (X semanas)
- Sprint 1: ...
- Sprint 2: ...
...

#### Fase 4: Testes e QA (X semanas)
...

#### Fase 5: Deploy e Go-Live (X semanas)
...

### 3. Cronograma Visual (Gantt)
Descreva em formato Mermaid:
\`\`\`mermaid
gantt
    title Cronograma do Projeto
    dateFormat  YYYY-MM-DD
    section Discovery
    ...
\`\`\`

### 4. Marcos (Milestones)
| Marco | Data | Critério de Sucesso |
|-------|------|---------------------|
| ... | ... | ... |

### 5. Equipe Recomendada
| Perfil | Quantidade | Dedicação | Período |
|--------|------------|-----------|---------|
| ... | ... | ... | ... |

### 6. Estimativa em Story Points

| Item | Valor |
|------|-------|
| **Total de Story Points** | X SP |
| **Produtividade por Dev/Mês** | ${produto?.produtividadeTradicional || 40} SP |
| **Desenvolvedores Necessários** | X devs |
| **Duração Estimada** | X meses |
| **Sprints (2 semanas)** | X sprints |

### 7. Resumo Financeiro

| Item | Valor |
|------|-------|
| **Story Points Totais** | X SP |
| **Horas Totais** | X horas |
| **Custo de Desenvolvimento** | R$ X |
| **Custo de Infraestrutura (3 meses)** | R$ X |
| **Margem de Contingência (20%)** | R$ X |
| **TOTAL ESTIMADO** | R$ X |

### 8. Premissas e Riscos do Cronograma
- Premissas consideradas (incluindo produtividade de ${produto?.produtividadeTradicional || 40} SP/mês/dev tradicional e ${produto?.produtividadeAgentica || 120} SP/mês/dev agêntica)
- Riscos que podem impactar o prazo
- Recomendações

Seja realista nas estimativas. Considere a complexidade do produto e as tecnologias de IA envolvidas.
IMPORTANTE: Sempre inclua o total de Story Points no resumo.
`;
    }
  },

  // Blueprint de Construção (documento consolidado)
  blueprint: {
    system: SYSTEM_PROMPT_BASE + `\n\nVocê está gerando o documento final de Blueprint que será usado pela equipe de desenvolvimento.`,
    template: (contexto, documentosAnteriores) => `
Com base nas informações do produto e nos documentos já gerados, crie um Blueprint de Construção consolidado.

${contexto}

## DOCUMENTOS JÁ GERADOS (RESUMO)
${documentosAnteriores || 'Nenhum documento anterior disponível.'}

## ESTRUTURA DO BLUEPRINT DE CONSTRUÇÃO

Este é o documento principal que será entregue à equipe de desenvolvimento.

### 1. Capa e Identificação
- Nome do Produto
- Versão do documento
- Data
- Autores
- Aprovadores

### 2. Sumário Executivo
- O que é o produto (2-3 parágrafos)
- Por que estamos construindo
- Para quem é
- Principais funcionalidades
- Tecnologias-chave

### 3. Escopo da Entrega
#### Incluído (IN)
- Lista de funcionalidades do MVP

#### Não Incluído (OUT)
- O que fica para próximas versões

### 4. Arquitetura em Uma Página
- Diagrama simplificado
- Componentes principais
- Fluxo de dados principal

### 5. Backlog Priorizado
Lista de épicos e histórias prontas para desenvolvimento:

| # | Épico | User Story | Prioridade | Estimativa |
|---|-------|------------|------------|------------|
| 1 | ... | ... | Must Have | XL |
| 2 | ... | ... | Must Have | L |
...

### 6. Definições Técnicas
- Padrões de código
- Padrões de API
- Padrões de banco de dados
- Convenções de nomenclatura

### 7. Checklist de Qualidade
- [ ] Testes unitários (cobertura mínima: 80%)
- [ ] Testes de integração
- [ ] Code review obrigatório
- [ ] Documentação de API
- [ ] Monitoramento configurado
- [ ] Logs estruturados
- [ ] Tratamento de erros
- [ ] Segurança validada

### 8. Critérios de Done
O que define que uma feature está pronta para produção.

### 9. Plano de Entregas
| Sprint | Período | Entregas | Responsável |
|--------|---------|----------|-------------|
| 1 | ... | ... | ... |
...

### 10. Contatos e Responsabilidades
| Papel | Nome | Responsabilidades |
|-------|------|-------------------|
| Product Owner | ... | ... |
| Tech Lead | ... | ... |
...

### 11. Glossário
Termos técnicos e de negócio importantes.

### 12. Anexos
- Links para documentos detalhados
- Referências
- Materiais de apoio

Gere um documento completo, profissional e pronto para uso pela equipe.
`
  },

  // =============================================
  // DOCUMENTOS DA FASE 2 (OPCIONAIS)
  // =============================================

  // Modelagem de Dados
  modelagem_dados: {
    system: SYSTEM_PROMPT_ESPECIFICACAO_AGENTICA + `\n\nVocê também é especialista em modelagem de dados, design de bancos de dados relacionais e NoSQL, e boas práticas de normalização.`,
    template: (contexto) => `
🎯 MISSÃO: Crie um documento de Modelagem de Dados COMPLETO que permita ao time de backend criar o banco de dados sem ambiguidades.

${contexto}

---

## 📊 ESTRUTURA DO DOCUMENTO DE MODELAGEM DE DADOS

### 1. 🎯 VISÃO GERAL DO MODELO DE DADOS

**Resumo:**
[2-3 parágrafos descrevendo a estratégia de dados, tipos de banco escolhidos e justificativas]

**Estratégia de Persistência:**
| Tipo de Dado | Banco | Justificativa |
|--------------|-------|---------------|
| Dados transacionais | PostgreSQL | ACID, integridade referencial |
| Cache/Sessões | Redis | Performance, TTL automático |
| Documentos/Logs | MongoDB | Flexibilidade de schema |
| Busca textual | Elasticsearch | Full-text search |
| Vetores/Embeddings | Pinecone/Qdrant | Busca semântica |

---

### 2. 📐 DIAGRAMA ENTIDADE-RELACIONAMENTO (ERD)

\`\`\`mermaid
erDiagram
    USUARIO ||--o{ SESSAO : "possui"
    USUARIO {
        uuid id PK
        string email UK
        string nome
        string senha_hash
        boolean ativo
        timestamp created_at
        timestamp updated_at
    }
    
    SESSAO {
        uuid id PK
        uuid usuario_id FK
        string token UK
        timestamp expires_at
        timestamp created_at
    }
    
    %% Adicione todas as entidades principais do sistema
    %% Use relacionamentos: ||--o{ (1 para muitos), ||--|| (1 para 1), }o--o{ (muitos para muitos)
\`\`\`

> **IMPORTANTE:** Crie o ERD completo com TODAS as entidades necessárias para o sistema, baseado nos requisitos funcionais.

---

### 3. 📝 DEFINIÇÃO DAS ENTIDADES

Para CADA entidade, documente no formato:

#### 3.1 Entidade: USUARIO

**Descrição:** Representa os usuários do sistema

**Tabela:** \`usuarios\`

| Coluna | Tipo | Constraints | Default | Descrição |
|--------|------|-------------|---------|-----------|
| id | UUID | PK, NOT NULL | uuid_generate_v4() | Identificador único |
| email | VARCHAR(255) | UK, NOT NULL | - | Email único do usuário |
| nome | VARCHAR(150) | NOT NULL | - | Nome completo |
| senha_hash | VARCHAR(255) | NOT NULL | - | Hash bcrypt da senha |
| role | VARCHAR(50) | NOT NULL | 'user' | Papel no sistema (admin, user, etc) |
| ativo | BOOLEAN | NOT NULL | true | Se o usuário está ativo |
| ultimo_login | TIMESTAMP | - | NULL | Data/hora do último login |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | Data de atualização |

**Índices:**
| Nome | Colunas | Tipo | Justificativa |
|------|---------|------|---------------|
| idx_usuarios_email | email | UNIQUE | Busca por email no login |
| idx_usuarios_role | role | B-TREE | Filtro por tipo de usuário |
| idx_usuarios_ativo | ativo | B-TREE | Filtro de usuários ativos |

**Constraints Adicionais:**
\`\`\`sql
ALTER TABLE usuarios ADD CONSTRAINT chk_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');
\`\`\`

> **Repita este formato para TODAS as entidades do sistema (mínimo 8-10 entidades)**

---

### 4. 🔗 RELACIONAMENTOS

| Tabela Origem | Relacionamento | Tabela Destino | FK | On Delete | Descrição |
|---------------|----------------|----------------|----|-----------| -----------|
| sessoes | N:1 | usuarios | usuario_id | CASCADE | Cada sessão pertence a um usuário |
| ... | ... | ... | ... | ... | ... |

---

### 5. 📊 SCHEMAS SQL COMPLETOS

#### 5.1 Script de Criação (DDL)

\`\`\`sql
-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    ativo BOOLEAN NOT NULL DEFAULT true,
    ultimo_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Continue com todas as outras tabelas...
\`\`\`

#### 5.2 Dados Iniciais (Seed)

\`\`\`sql
-- Usuário admin padrão
INSERT INTO usuarios (email, nome, senha_hash, role) VALUES
  ('admin@sistema.com', 'Administrador', '$2b$10$...hash...', 'admin');

-- Outros dados iniciais necessários...
\`\`\`

---

### 6. 🔄 MIGRAÇÕES

| Versão | Descrição | Arquivos Afetados |
|--------|-----------|-------------------|
| V001 | Criação inicial do schema | usuarios, sessoes |
| V002 | Adicionar tabela de [X] | [tabela] |
| ... | ... | ... |

---

### 7. 📈 CONSIDERAÇÕES DE PERFORMANCE

**Índices Recomendados:**
| Tabela | Índice | Tipo | Justificativa |
|--------|--------|------|---------------|
| ... | ... | ... | Consulta frequente em... |

**Particionamento:**
| Tabela | Estratégia | Coluna | Período |
|--------|------------|--------|---------|
| logs | Range | created_at | Mensal |

**Views Materializadas:**
\`\`\`sql
CREATE MATERIALIZED VIEW mv_dashboard_stats AS
SELECT ... 
WITH DATA;

-- Refresh diário
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
\`\`\`

---

### 8. 🔐 SEGURANÇA DE DADOS

**Dados Sensíveis (LGPD/GDPR):**
| Coluna | Tabela | Classificação | Proteção |
|--------|--------|---------------|----------|
| email | usuarios | PII | Encryption at rest |
| senha_hash | usuarios | Credential | Bcrypt + Salt |
| ... | ... | ... | ... |

**Políticas de Retenção:**
| Dado | Período | Ação |
|------|---------|------|
| Logs de acesso | 90 dias | Arquivar/Deletar |
| Dados de usuário inativo | 2 anos | Anonimizar |

---

### 9. 📋 DICIONÁRIO DE DADOS

| Termo | Tipo | Domínio | Descrição |
|-------|------|---------|-----------|
| usuario_id | UUID | - | Identificador único de usuário |
| status | ENUM | 'ativo', 'inativo', 'suspenso' | Status do registro |
| ... | ... | ... | ... |

---

⚡ **IMPORTANTE:** Este documento deve permitir que o DBA e os desenvolvedores backend criem o banco de dados completo sem precisar de esclarecimentos adicionais.
`
  },

  // API Contracts (OpenAPI)
  api_contracts: {
    system: SYSTEM_PROMPT_ESPECIFICACAO_AGENTICA + `\n\nVocê também é especialista em design de APIs RESTful, OpenAPI/Swagger, e boas práticas de API Design.`,
    template: (contexto) => `
🎯 MISSÃO: Crie uma especificação de API Contracts COMPLETA no formato OpenAPI 3.0 que permita ao time de frontend e backend trabalharem em paralelo.

${contexto}

---

## 🔌 ESTRUTURA DO DOCUMENTO DE API CONTRACTS

### 1. 🎯 VISÃO GERAL DA API

**Base URL:** \`https://api.exemplo.com/v1\`

**Versionamento:** URL path (/v1, /v2)

**Formato:** JSON

**Autenticação:** Bearer Token (JWT)

**Rate Limiting:** 
| Plano | Requests/min | Requests/dia |
|-------|--------------|--------------|
| Free | 60 | 1.000 |
| Pro | 300 | 50.000 |
| Enterprise | Ilimitado | Ilimitado |

---

### 2. 🔐 AUTENTICAÇÃO

#### Headers Obrigatórios
\`\`\`
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <uuid> (opcional, para rastreamento)
\`\`\`

#### Fluxo de Autenticação
\`\`\`mermaid
sequenceDiagram
    participant C as Cliente
    participant A as API
    participant DB as Database
    
    C->>A: POST /auth/login {email, password}
    A->>DB: Verifica credenciais
    DB-->>A: Usuário válido
    A-->>C: 200 {access_token, refresh_token, expires_in}
    
    C->>A: GET /recurso (Authorization: Bearer token)
    A->>A: Valida JWT
    A-->>C: 200 {dados}
\`\`\`

---

### 3. 📋 ENDPOINTS POR MÓDULO

#### 3.1 Módulo: Autenticação (/auth)

##### POST /auth/login
**Descrição:** Autentica usuário e retorna tokens

**Request:**
\`\`\`json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
\`\`\`

**Request Schema:**
| Campo | Tipo | Obrigatório | Validação | Descrição |
|-------|------|-------------|-----------|-----------|
| email | string | Sim | email format | Email do usuário |
| password | string | Sim | min: 8 chars | Senha do usuário |

**Responses:**

**200 OK:**
\`\`\`json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "uuid",
      "email": "usuario@email.com",
      "nome": "Nome do Usuário",
      "role": "user"
    }
  }
}
\`\`\`

**400 Bad Request:**
\`\`\`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados de entrada inválidos",
    "details": [
      { "field": "email", "message": "Email inválido" }
    ]
  }
}
\`\`\`

**401 Unauthorized:**
\`\`\`json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email ou senha incorretos"
  }
}
\`\`\`

**423 Locked:**
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Conta bloqueada por excesso de tentativas",
    "details": {
      "locked_until": "2024-01-01T12:00:00Z",
      "attempts": 5
    }
  }
}
\`\`\`

---

##### POST /auth/refresh
**Descrição:** Renova o access_token usando refresh_token

##### POST /auth/logout
**Descrição:** Invalida os tokens do usuário

##### POST /auth/forgot-password
**Descrição:** Solicita reset de senha

##### POST /auth/reset-password
**Descrição:** Reseta a senha com token

---

#### 3.2 Módulo: Usuários (/users)

##### GET /users
**Descrição:** Lista usuários (paginado)

**Query Parameters:**
| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| page | integer | 1 | Página atual |
| limit | integer | 20 | Itens por página (max: 100) |
| search | string | - | Busca por nome ou email |
| role | string | - | Filtro por role |
| sort | string | created_at | Campo de ordenação |
| order | string | desc | asc ou desc |

**Response 200:**
\`\`\`json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "email": "usuario@email.com",
        "nome": "Nome",
        "role": "user",
        "ativo": true,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8,
      "has_next": true,
      "has_prev": false
    }
  }
}
\`\`\`

##### GET /users/:id
##### POST /users
##### PUT /users/:id
##### DELETE /users/:id

---

#### 3.3 Módulo: [Core Business] (/[recurso])

> **Documente TODOS os endpoints necessários para o sistema baseado nos requisitos funcionais**

Para CADA endpoint, inclua:
- Método e URL
- Descrição
- Request body (se aplicável)
- Query parameters (se aplicável)
- Path parameters (se aplicável)
- Todas as responses possíveis (200, 400, 401, 403, 404, 500)

---

### 4. 📊 SCHEMAS REUTILIZÁVEIS

#### User
\`\`\`json
{
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "email": { "type": "string", "format": "email" },
    "nome": { "type": "string", "maxLength": 150 },
    "role": { "type": "string", "enum": ["admin", "user", "guest"] },
    "ativo": { "type": "boolean" },
    "created_at": { "type": "string", "format": "date-time" },
    "updated_at": { "type": "string", "format": "date-time" }
  },
  "required": ["id", "email", "nome", "role"]
}
\`\`\`

#### Error
\`\`\`json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean", "example": false },
    "error": {
      "type": "object",
      "properties": {
        "code": { "type": "string" },
        "message": { "type": "string" },
        "details": { "type": "array" }
      }
    }
  }
}
\`\`\`

#### Pagination
\`\`\`json
{
  "type": "object",
  "properties": {
    "page": { "type": "integer" },
    "limit": { "type": "integer" },
    "total": { "type": "integer" },
    "total_pages": { "type": "integer" },
    "has_next": { "type": "boolean" },
    "has_prev": { "type": "boolean" }
  }
}
\`\`\`

---

### 5. 🚨 CÓDIGOS DE ERRO

| Código HTTP | Error Code | Descrição | Ação do Cliente |
|-------------|------------|-----------|-----------------|
| 400 | VALIDATION_ERROR | Dados de entrada inválidos | Corrigir dados |
| 400 | INVALID_FORMAT | Formato de dados incorreto | Verificar schema |
| 401 | UNAUTHORIZED | Não autenticado | Fazer login |
| 401 | TOKEN_EXPIRED | Token expirado | Usar refresh token |
| 403 | FORBIDDEN | Sem permissão | Contatar admin |
| 404 | NOT_FOUND | Recurso não encontrado | Verificar ID |
| 409 | CONFLICT | Conflito (ex: email já existe) | Usar outro valor |
| 422 | BUSINESS_RULE_VIOLATION | Regra de negócio violada | Ver mensagem |
| 429 | RATE_LIMIT_EXCEEDED | Rate limit excedido | Aguardar |
| 500 | INTERNAL_ERROR | Erro interno | Reportar bug |

---

### 6. 📖 ESPECIFICAÇÃO OPENAPI 3.0

\`\`\`yaml
openapi: 3.0.3
info:
  title: [Nome do Sistema] API
  description: API para [descrição]
  version: 1.0.0
  contact:
    email: api@empresa.com
servers:
  - url: https://api.exemplo.com/v1
    description: Produção
  - url: https://api-staging.exemplo.com/v1
    description: Staging

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  
  schemas:
    # Inclua todos os schemas aqui
    
paths:
  # Inclua todos os paths aqui
\`\`\`

---

⚡ **IMPORTANTE:** Este documento deve permitir que frontend e backend trabalhem em paralelo usando esta especificação como contrato.
`
  },

  // Casos de Teste
  casos_teste: {
    system: SYSTEM_PROMPT_ESPECIFICACAO_AGENTICA + `\n\nVocê também é especialista em QA, test design, e criação de casos de teste seguindo boas práticas de testing.`,
    template: (contexto) => `
🎯 MISSÃO: Crie um documento de Casos de Teste COMPLETO derivado dos requisitos funcionais, que permita ao time de QA iniciar os testes antes mesmo do código estar pronto.

⚠️ OBRIGATÓRIO - VOCÊ DEVE CRIAR:
1. Casos de teste para CADA funcionalidade mencionada nos requisitos
2. Cenários de sucesso (happy path) E cenários de erro/exceção
3. Dados de teste específicos e realistas
4. Critérios de aceite verificáveis
5. Mínimo de 15-20 casos de teste detalhados

DERIVE os casos a partir das funcionalidades do produto - seja CRIATIVO e COMPLETO!

${contexto}

---

## 🧪 ESTRUTURA DO DOCUMENTO DE CASOS DE TESTE

### 1. 🎯 ESTRATÉGIA DE TESTES

**Pirâmide de Testes:**
| Tipo | Proporção | Responsável | Ferramenta Sugerida |
|------|-----------|-------------|---------------------|
| Unitários | 70% | Desenvolvedores | Jest, Vitest |
| Integração | 20% | Desenvolvedores + QA | Supertest, TestContainers |
| E2E | 10% | QA | Playwright, Cypress |

**Ambientes de Teste:**
| Ambiente | URL | Dados | Propósito |
|----------|-----|-------|-----------|
| Local | localhost:3000 | Mock/Seed | Desenvolvimento |
| QA | qa.exemplo.com | Dados de teste | Testes manuais |
| Staging | staging.exemplo.com | Cópia de prod | Homologação |

---

### 2. 📋 CASOS DE TESTE POR MÓDULO

#### Módulo: Autenticação

##### TC-AUTH-001: Login com credenciais válidas

| Campo | Valor |
|-------|-------|
| **ID** | TC-AUTH-001 |
| **Título** | Login com credenciais válidas |
| **Requisito Relacionado** | RF-001, US-001 |
| **Prioridade** | Alta |
| **Tipo** | Funcional |
| **Pré-condições** | Usuário cadastrado e ativo no sistema |

**Dados de Teste:**
| Campo | Valor |
|-------|-------|
| Email | teste@exemplo.com |
| Senha | Senha@123 |

**Passos:**
| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Acessar página de login | URL: /login | Formulário de login exibido |
| 2 | Preencher email | teste@exemplo.com | Campo preenchido |
| 3 | Preencher senha | Senha@123 | Campo preenchido (mascarado) |
| 4 | Clicar em "Entrar" | - | Loading exibido |
| 5 | Aguardar resposta | - | Redirecionado para /dashboard |

**Resultado Esperado Final:**
- Usuário autenticado
- Token JWT armazenado
- Nome do usuário exibido no header
- Menu de navegação disponível

**Critérios de Aceite Verificados:**
- [ ] CA-001: Login em menos de 3 segundos
- [ ] CA-002: Token com expiração de 1 hora
- [ ] CA-003: Refresh token gerado

---

##### TC-AUTH-002: Login com senha incorreta

| Campo | Valor |
|-------|-------|
| **ID** | TC-AUTH-002 |
| **Título** | Login com senha incorreta |
| **Requisito Relacionado** | RF-001 |
| **Prioridade** | Alta |
| **Tipo** | Negativo |
| **Pré-condições** | Usuário cadastrado no sistema |

**Dados de Teste:**
| Campo | Valor |
|-------|-------|
| Email | teste@exemplo.com |
| Senha | SenhaErrada123 |

**Passos:**
| # | Ação | Dados | Resultado Esperado |
|---|------|-------|-------------------|
| 1 | Acessar página de login | URL: /login | Formulário exibido |
| 2 | Preencher email válido | teste@exemplo.com | Campo preenchido |
| 3 | Preencher senha incorreta | SenhaErrada123 | Campo preenchido |
| 4 | Clicar em "Entrar" | - | Loading exibido |
| 5 | Aguardar resposta | - | Mensagem de erro |

**Resultado Esperado Final:**
- Mensagem: "Email ou senha incorretos"
- Usuário permanece na tela de login
- Campo de senha limpo
- Contador de tentativas incrementado

---

##### TC-AUTH-003: Bloqueio após 5 tentativas falhas

| Campo | Valor |
|-------|-------|
| **ID** | TC-AUTH-003 |
| **Título** | Bloqueio de conta por tentativas excessivas |
| **Requisito Relacionado** | RF-001, RNF-SEC-001 |
| **Prioridade** | Alta |
| **Tipo** | Segurança |

**Passos:**
| # | Ação | Resultado Esperado |
|---|------|-------------------|
| 1-5 | Tentar login 5x com senha errada | Mensagem de erro a cada tentativa |
| 6 | Tentar login novamente | Conta bloqueada por 15 minutos |

---

> **CONTINUE criando casos de teste para TODOS os requisitos funcionais**

#### Módulo: [Próximo Módulo]
##### TC-XXX-001: [Título]
...

---

### 3. 📊 MATRIZ DE RASTREABILIDADE

| Requisito | Casos de Teste | Cobertura |
|-----------|---------------|-----------|
| RF-001 | TC-AUTH-001, TC-AUTH-002, TC-AUTH-003, TC-AUTH-004 | 100% |
| RF-002 | TC-USER-001, TC-USER-002 | 100% |
| ... | ... | ... |

---

### 4. 🔄 TESTES DE INTEGRAÇÃO

#### INT-001: Fluxo completo de cadastro e login

**Descrição:** Verifica o fluxo completo desde o cadastro até o primeiro login

**Passos:**
1. Criar novo usuário via API
2. Verificar email de confirmação
3. Ativar conta
4. Fazer login
5. Acessar dados do perfil

**Script de Teste:**
\`\`\`javascript
describe('Fluxo de Cadastro e Login', () => {
  it('deve permitir cadastro, ativação e login', async () => {
    // 1. Cadastrar usuário
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'novo@teste.com', password: 'Senha@123' });
    expect(response.status).toBe(201);
    
    // 2. Ativar conta
    // ...
    
    // 3. Login
    // ...
  });
});
\`\`\`

---

### 5. 🎭 TESTES E2E

#### E2E-001: Jornada do usuário - Primeiro acesso

**Cenário:** Usuário novo acessa o sistema pela primeira vez

\`\`\`gherkin
Feature: Primeiro acesso
  Como um novo usuário
  Eu quero me cadastrar e acessar o sistema
  Para utilizar as funcionalidades

  Scenario: Cadastro e primeiro login bem-sucedido
    Given estou na página inicial
    When clico em "Criar conta"
    And preencho o formulário de cadastro
    And confirmo meu email
    And faço login com minhas credenciais
    Then devo ver o tutorial de boas-vindas
    And devo ter acesso ao dashboard
\`\`\`

---

### 6. 📈 MÉTRICAS DE QUALIDADE

| Métrica | Meta | Crítico |
|---------|------|---------|
| Cobertura de código | > 80% | < 60% |
| Casos de teste passando | 100% | < 95% |
| Bugs críticos em produção | 0 | > 0 |
| Tempo médio de execução E2E | < 10 min | > 20 min |

---

### 7. 📝 CHECKLIST DE TESTE POR RELEASE

- [ ] Todos os testes unitários passando
- [ ] Todos os testes de integração passando
- [ ] Testes E2E executados e passando
- [ ] Testes de regressão executados
- [ ] Testes de performance executados
- [ ] Testes de segurança (OWASP) executados
- [ ] Documentação de release atualizada

---

⚡ **IMPORTANTE:** Crie pelo menos 30-40 casos de teste cobrindo todos os requisitos funcionais do sistema.
`
  },

  // Wireframes e Fluxos de Tela
  wireframes: {
    system: SYSTEM_PROMPT_ESPECIFICACAO_AGENTICA + `\n\nVocê também é especialista em UX/UI Design, arquitetura de informação, e design de interfaces.`,
    template: (contexto) => `
🎯 MISSÃO: Crie um documento de Wireframes e Fluxos de Tela COMPLETO que permita ao time de frontend e designers entenderem exatamente o que deve ser construído.

${contexto}

---

## 🖼️ ESTRUTURA DO DOCUMENTO DE WIREFRAMES

### 1. 🎯 ARQUITETURA DE INFORMAÇÃO

**Mapa do Site:**
\`\`\`mermaid
graph TD
    A[Home] --> B[Login]
    A --> C[Cadastro]
    B --> D[Dashboard]
    D --> E[Perfil]
    D --> F[Módulo 1]
    D --> G[Módulo 2]
    D --> H[Configurações]
    F --> F1[Lista]
    F --> F2[Detalhes]
    F --> F3[Criar/Editar]
\`\`\`

**Hierarquia de Navegação:**
| Nível | Área | Acesso |
|-------|------|--------|
| 1 | Home/Landing | Público |
| 1 | Auth (Login/Cadastro) | Público |
| 2 | Dashboard | Autenticado |
| 2 | Perfil | Autenticado |
| 3 | [Módulos] | Por permissão |

---

### 2. 📱 INVENTÁRIO DE TELAS

| ID | Tela | URL | Descrição | Permissão |
|----|------|-----|-----------|-----------|
| SCR-001 | Login | /login | Autenticação de usuários | Público |
| SCR-002 | Cadastro | /register | Criação de nova conta | Público |
| SCR-003 | Dashboard | /dashboard | Visão geral do sistema | user |
| SCR-004 | Perfil | /profile | Dados do usuário | user |
| ... | ... | ... | ... | ... |

---

### 3. 🖥️ ESPECIFICAÇÃO DE TELAS

#### SCR-001: Tela de Login

**Informações Gerais:**
| Campo | Valor |
|-------|-------|
| URL | /login |
| Título da Página | Login - [Nome do Sistema] |
| Layout | Centralizado, sem sidebar |
| Responsivo | Sim (mobile-first) |

**Wireframe (ASCII):**
\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        HEADER                                │
│  [Logo]                              [Criar Conta]          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                   ┌─────────────────────┐                   │
│                   │                     │                   │
│                   │    [Logo Grande]    │                   │
│                   │                     │                   │
│                   │  Bem-vindo de volta │                   │
│                   │                     │                   │
│                   │  ┌───────────────┐  │                   │
│                   │  │ Email         │  │                   │
│                   │  └───────────────┘  │                   │
│                   │                     │                   │
│                   │  ┌───────────────┐  │                   │
│                   │  │ Senha     [👁] │  │                   │
│                   │  └───────────────┘  │                   │
│                   │                     │                   │
│                   │  [□] Lembrar-me     │                   │
│                   │                     │                   │
│                   │  ┌───────────────┐  │                   │
│                   │  │    ENTRAR     │  │                   │
│                   │  └───────────────┘  │                   │
│                   │                     │                   │
│                   │  Esqueceu a senha?  │                   │
│                   │                     │                   │
│                   │  ─── ou ───         │                   │
│                   │                     │                   │
│                   │  [G] Login Google   │                   │
│                   │                     │                   │
│                   └─────────────────────┘                   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                        FOOTER                                │
└─────────────────────────────────────────────────────────────┘
\`\`\`

**Componentes:**
| ID | Componente | Tipo | Comportamento |
|----|------------|------|---------------|
| C001 | Logo | Imagem/SVG | Clicável → Home |
| C002 | Campo Email | Input text | Validação de email |
| C003 | Campo Senha | Input password | Toggle visibilidade |
| C004 | Checkbox Lembrar | Checkbox | Persiste sessão |
| C005 | Botão Entrar | Button primary | Submit form |
| C006 | Link Esqueceu | Link | → /forgot-password |
| C007 | Botão Google | Button social | OAuth Google |

**Estados:**
| Estado | Descrição | Visual |
|--------|-----------|--------|
| Default | Formulário vazio | Campos vazios |
| Validando | Após submit | Loading no botão |
| Erro | Credenciais inválidas | Mensagem vermelha |
| Sucesso | Login OK | Redirect |

**Validações:**
| Campo | Regra | Mensagem de Erro |
|-------|-------|------------------|
| Email | Required, email format | "Email inválido" |
| Senha | Required, min 8 chars | "Senha obrigatória" |

**Responsividade:**
| Breakpoint | Comportamento |
|------------|---------------|
| Desktop (>1024px) | Card centralizado, 400px largura |
| Tablet (768-1024px) | Card 80% largura |
| Mobile (<768px) | Fullwidth, padding 16px |

---

#### SCR-003: Dashboard

**Wireframe:**
\`\`\`
┌─────────────────────────────────────────────────────────────────────────┐
│ [☰] [Logo]              Dashboard           [🔔] [👤 Nome ▼]           │
├─────────┬───────────────────────────────────────────────────────────────┤
│         │                                                               │
│ 📊 Dash │  Olá, [Nome]! Bem-vindo de volta.                            │
│         │                                                               │
│ 📁 Mod1 │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│         │  │   Card 1    │ │   Card 2    │ │   Card 3    │            │
│ 📁 Mod2 │  │  [Métrica]  │ │  [Métrica]  │ │  [Métrica]  │            │
│         │  │    1.234    │ │      56%    │ │     R$ 10k  │            │
│ 📁 Mod3 │  └─────────────┘ └─────────────┘ └─────────────┘            │
│         │                                                               │
│ ⚙️ Config│  ┌───────────────────────────────────────────────────────┐   │
│         │  │                                                         │   │
│         │  │                    GRÁFICO                             │   │
│         │  │                                                         │   │
│         │  └───────────────────────────────────────────────────────┘   │
│         │                                                               │
│         │  ┌───────────────────────────┐ ┌───────────────────────────┐│
│         │  │       Tabela Recentes     │ │       Atividades          ││
│         │  │  ─────────────────────    │ │  • Ação 1 - 5min atrás   ││
│         │  │  | Col1 | Col2 | Col3 |   │ │  • Ação 2 - 1h atrás     ││
│         │  │  |------|------|------|   │ │  • Ação 3 - ontem        ││
│         │  │  | ...  | ...  | ...  |   │ │                           ││
│         │  └───────────────────────────┘ └───────────────────────────┘│
│         │                                                               │
└─────────┴───────────────────────────────────────────────────────────────┘
\`\`\`

> **Continue especificando TODAS as telas do sistema no mesmo nível de detalhe**

---

### 4. 🔄 FLUXOS DE USUÁRIO

#### Fluxo: Primeiro Acesso

\`\`\`mermaid
graph TD
    A[Landing Page] --> B{Tem conta?}
    B -->|Não| C[Cadastro]
    C --> D[Verificar Email]
    D --> E[Ativar Conta]
    E --> F[Login]
    B -->|Sim| F
    F --> G[Dashboard]
    G --> H{Primeiro acesso?}
    H -->|Sim| I[Tutorial/Onboarding]
    I --> J[Dashboard Completo]
    H -->|Não| J
\`\`\`

#### Fluxo: [Próximo Fluxo]
...

---

### 5. 🧩 COMPONENTES REUTILIZÁVEIS

| Componente | Uso | Props |
|------------|-----|-------|
| Button | Ações | variant, size, loading, disabled |
| Input | Formulários | type, label, error, helper |
| Card | Containers | title, actions, padding |
| Modal | Confirmações | title, content, actions |
| Table | Listagens | columns, data, pagination |
| Toast | Notificações | type, message, duration |

---

### 6. 📐 DESIGN SYSTEM BÁSICO

**Cores:**
| Nome | Hex | Uso |
|------|-----|-----|
| Primary | #6366F1 | Ações principais |
| Secondary | #64748B | Ações secundárias |
| Success | #10B981 | Confirmações |
| Error | #EF4444 | Erros |
| Warning | #F59E0B | Alertas |

**Tipografia:**
| Elemento | Font | Size | Weight |
|----------|------|------|--------|
| H1 | Inter | 32px | 700 |
| H2 | Inter | 24px | 600 |
| Body | Inter | 16px | 400 |
| Small | Inter | 14px | 400 |

**Espaçamento:**
| Token | Valor | Uso |
|-------|-------|-----|
| xs | 4px | Inline |
| sm | 8px | Between elements |
| md | 16px | Section padding |
| lg | 24px | Card padding |
| xl | 32px | Section gap |

---

⚡ **IMPORTANTE:** Especifique TODAS as telas necessárias para o sistema com este nível de detalhe.
`
  },

  // Glossário do Domínio
  glossario: {
    system: SYSTEM_PROMPT_ESPECIFICACAO_AGENTICA + `\n\nVocê também é especialista em Domain-Driven Design (DDD) e comunicação técnica.`,
    template: (contexto) => `
🎯 MISSÃO: Crie um Glossário do Domínio COMPLETO que padronize a linguagem entre negócio e tecnologia (Ubiquitous Language).

${contexto}

---

## 📚 GLOSSÁRIO DO DOMÍNIO

### 1. 🎯 PROPÓSITO

Este glossário estabelece a **Linguagem Ubíqua** do projeto, garantindo que todos (negócio, desenvolvimento, QA, suporte) usem os mesmos termos com os mesmos significados.

**Como usar:**
- Consulte antes de nomear variáveis, classes, tabelas
- Use os termos exatos em documentação e código
- Atualize quando novos termos surgirem

---

### 2. 📖 TERMOS DO DOMÍNIO

#### A

**Ativação**
| Aspecto | Descrição |
|---------|-----------|
| Definição | Processo de habilitar uma conta ou recurso após confirmação |
| Contexto | Usado após cadastro de usuário ou criação de recurso |
| Sinônimos | Habilitação, Enable |
| Antônimos | Desativação, Inativação |
| Exemplo de Uso | "O usuário completou a ativação da conta" |
| No Código | \`status: 'active'\`, \`activate()\`, \`isActivated\` |
| No Banco | \`ativo BOOLEAN DEFAULT false\` |

---

#### C

**Cliente**
| Aspecto | Descrição |
|---------|-----------|
| Definição | Pessoa ou empresa que utiliza os serviços do sistema |
| Contexto | Entidade principal que contrata e paga pelo serviço |
| Diferença de Usuário | Cliente é a entidade pagante; Usuário é quem acessa |
| Exemplo de Uso | "O cliente possui 5 usuários cadastrados" |
| No Código | \`Customer\`, \`cliente\` |
| No Banco | Tabela \`clientes\` |

---

#### U

**Usuário**
| Aspecto | Descrição |
|---------|-----------|
| Definição | Pessoa física que acessa o sistema |
| Contexto | Entidade que faz login e utiliza as funcionalidades |
| Tipos | Admin, User, Guest, Viewer |
| Exemplo de Uso | "O usuário acessou o dashboard" |
| No Código | \`User\`, \`usuario\`, \`currentUser\` |
| No Banco | Tabela \`usuarios\` |

---

> **Continue com TODOS os termos relevantes para o domínio do sistema (mínimo 30 termos)**

---

### 3. 🏷️ TAXONOMIA DE STATUS

| Status | Código | Descrição | Próximos Estados |
|--------|--------|-----------|------------------|
| Rascunho | draft | Criado mas não finalizado | pending, cancelled |
| Pendente | pending | Aguardando ação | active, rejected |
| Ativo | active | Em uso normal | suspended, inactive |
| Suspenso | suspended | Temporariamente parado | active, inactive |
| Inativo | inactive | Desabilitado | active |
| Cancelado | cancelled | Removido permanentemente | - |

---

### 4. 📊 ENUMS E CONSTANTES

#### Roles (Papéis)
| Código | Nome | Permissões |
|--------|------|------------|
| admin | Administrador | Acesso total |
| manager | Gerente | Gerencia equipe |
| user | Usuário | Acesso básico |
| viewer | Visualizador | Apenas leitura |

#### Prioridades
| Código | Nome | SLA |
|--------|------|-----|
| critical | Crítica | 1h |
| high | Alta | 4h |
| medium | Média | 24h |
| low | Baixa | 72h |

---

### 5. 🔤 CONVENÇÕES DE NOMENCLATURA

| Contexto | Convenção | Exemplo |
|----------|-----------|---------|
| Variáveis JS/TS | camelCase | \`userId\`, \`createdAt\` |
| Classes/Types | PascalCase | \`UserService\`, \`CreateUserDto\` |
| Constantes | UPPER_SNAKE | \`MAX_RETRY\`, \`API_URL\` |
| Banco (tabelas) | snake_case plural | \`usuarios\`, \`pedidos\` |
| Banco (colunas) | snake_case | \`created_at\`, \`user_id\` |
| API endpoints | kebab-case plural | \`/api/users\`, \`/api/order-items\` |
| Arquivos | kebab-case | \`user-service.ts\`, \`create-user.dto.ts\` |

---

### 6. 📝 ABREVIAÇÕES APROVADAS

| Abreviação | Significado | Onde Usar |
|------------|-------------|-----------|
| id | Identificador | Código, banco, API |
| dto | Data Transfer Object | Classes de transferência |
| api | Application Programming Interface | Documentação |
| ui | User Interface | Frontend |
| ux | User Experience | Design |
| db | Database | Infraestrutura |
| env | Environment | Configuração |
| auth | Authentication/Authorization | Segurança |
| admin | Administrator | Roles |
| config | Configuration | Configuração |

---

### 7. ❌ TERMOS A EVITAR

| Não Use | Use Em Vez | Motivo |
|---------|------------|--------|
| deletar | remover, excluir | Anglicismo |
| setar | definir, configurar | Anglicismo |
| client | cliente | Padronização PT-BR |
| costumer | customer | Erro de grafia comum |
| data (singular) | dado | Português correto |

---

### 8. 🌍 INTERNACIONALIZAÇÃO

**Idioma Padrão:** Português Brasileiro (pt-BR)

**Termos Técnicos em Inglês (mantidos):**
- API, REST, GraphQL
- JWT, OAuth
- Deploy, Commit, Push
- Bug, Feature, Sprint

---

⚡ **IMPORTANTE:** Este glossário deve ser atualizado sempre que novos termos surgirem no projeto.
`
  },

  // Riscos e Mitigações
  riscos: {
    system: SYSTEM_PROMPT_ESPECIFICACAO_AGENTICA + `\n\nVocê também é especialista em gestão de riscos de projetos de software e análise de impacto.`,
    template: (contexto) => `
🎯 MISSÃO: Crie uma Análise de Riscos COMPLETA que identifique, avalie e proponha mitigações para todos os riscos do projeto.

${contexto}

---

## ⚠️ ANÁLISE DE RISCOS E MITIGAÇÕES

### 1. 🎯 METODOLOGIA

**Matriz de Probabilidade x Impacto:**

|  | Impacto Baixo (1) | Impacto Médio (2) | Impacto Alto (3) | Impacto Crítico (4) |
|--|-------------------|-------------------|------------------|---------------------|
| **Probabilidade Alta (4)** | 4 - Médio | 8 - Alto | 12 - Crítico | 16 - Crítico |
| **Probabilidade Média (3)** | 3 - Baixo | 6 - Médio | 9 - Alto | 12 - Crítico |
| **Probabilidade Baixa (2)** | 2 - Baixo | 4 - Médio | 6 - Médio | 8 - Alto |
| **Probabilidade Muito Baixa (1)** | 1 - Baixo | 2 - Baixo | 3 - Baixo | 4 - Médio |

**Classificação de Resposta:**
| Score | Nível | Ação |
|-------|-------|------|
| 12-16 | Crítico | Tratamento imediato obrigatório |
| 8-11 | Alto | Plano de mitigação prioritário |
| 4-7 | Médio | Monitoramento ativo |
| 1-3 | Baixo | Aceitar e monitorar |

---

### 2. 📋 REGISTRO DE RISCOS

#### R-001: Dependência de API Externa de IA

| Campo | Valor |
|-------|-------|
| **ID** | R-001 |
| **Categoria** | Técnico / Dependência |
| **Descrição** | O sistema depende de APIs de IA (OpenAI/Anthropic) que podem ficar indisponíveis ou mudar preços |
| **Causa Raiz** | Dependência de terceiros para funcionalidade core |
| **Probabilidade** | Média (3) |
| **Impacto** | Alto (3) |
| **Score** | 9 - Alto |
| **Gatilho** | API retorna erro 5xx por mais de 5 minutos |

**Plano de Mitigação:**
| Ação | Responsável | Prazo | Status |
|------|-------------|-------|--------|
| Implementar circuit breaker | Tech Lead | Sprint 2 | Pendente |
| Criar fallback para modelo local | Arquiteto | Sprint 3 | Pendente |
| Cache de respostas frequentes | Backend Dev | Sprint 2 | Pendente |
| Monitorar status da API | DevOps | Contínuo | Em andamento |

**Plano de Contingência:**
- Se API ficar indisponível por > 1h: Ativar modo offline com cache
- Se API ficar indisponível por > 24h: Migrar para provedor alternativo
- Se custos aumentarem > 50%: Revisar arquitetura para modelo local

---

#### R-002: Vazamento de Dados Sensíveis

| Campo | Valor |
|-------|-------|
| **ID** | R-002 |
| **Categoria** | Segurança / Compliance |
| **Descrição** | Exposição de dados pessoais (PII) por falha de segurança |
| **Causa Raiz** | Vulnerabilidades de código, configuração incorreta, ou ataques |
| **Probabilidade** | Baixa (2) |
| **Impacto** | Crítico (4) |
| **Score** | 8 - Alto |
| **Gatilho** | Alerta de segurança, acesso não autorizado detectado |

**Plano de Mitigação:**
| Ação | Responsável | Prazo | Status |
|------|-------------|-------|--------|
| Implementar WAF | DevOps | Sprint 1 | Concluído |
| Criptografia em repouso | DBA | Sprint 1 | Em andamento |
| Pen test trimestral | Segurança | Q1/Q2/Q3/Q4 | Planejado |
| SAST/DAST no CI/CD | DevOps | Sprint 2 | Pendente |
| Treinamento OWASP | Tech Lead | Mensal | Contínuo |

**Plano de Contingência:**
- Notificar ANPD em até 72h (LGPD)
- Comunicar usuários afetados
- Revogar todos os tokens
- Ativar time de resposta a incidentes

---

> **Continue criando pelo menos 15-20 riscos cobrindo todas as categorias**

---

### 3. 📊 RISCOS POR CATEGORIA

#### 3.1 Riscos Técnicos
| ID | Risco | Score | Status |
|----|-------|-------|--------|
| R-001 | Dependência de API Externa | 9 | Mitigando |
| R-003 | Escalabilidade insuficiente | 6 | Monitorando |
| R-004 | Dívida técnica acumulada | 8 | Mitigando |
| ... | ... | ... | ... |

#### 3.2 Riscos de Negócio
| ID | Risco | Score | Status |
|----|-------|-------|--------|
| R-010 | Baixa adoção de usuários | 8 | Monitorando |
| R-011 | Mudança de requisitos | 6 | Aceito |
| ... | ... | ... | ... |

#### 3.3 Riscos de Segurança
| ID | Risco | Score | Status |
|----|-------|-------|--------|
| R-002 | Vazamento de dados | 8 | Mitigando |
| R-020 | Ataque DDoS | 6 | Mitigado |
| ... | ... | ... | ... |

#### 3.4 Riscos Operacionais
| ID | Risco | Score | Status |
|----|-------|-------|--------|
| R-030 | Saída de membro-chave | 9 | Mitigando |
| R-031 | Indisponibilidade de ambiente | 4 | Monitorando |
| ... | ... | ... | ... |

#### 3.5 Riscos de Compliance
| ID | Risco | Score | Status |
|----|-------|-------|--------|
| R-040 | Não conformidade LGPD | 12 | Mitigando |
| R-041 | Falha em auditoria | 6 | Monitorando |
| ... | ... | ... | ... |

---

### 4. 📈 DASHBOARD DE RISCOS

**Distribuição por Nível:**
| Nível | Quantidade | % |
|-------|------------|---|
| Crítico | 2 | 10% |
| Alto | 5 | 25% |
| Médio | 8 | 40% |
| Baixo | 5 | 25% |

**Tendência:**
\`\`\`
Mês     Crítico  Alto  Médio  Baixo
Jan     3        6     7      4
Fev     2        5     8      5  ← Atual
Mar     1        4     8      7  ← Projeção
\`\`\`

---

### 5. 🚨 PLANO DE RESPOSTA A INCIDENTES

| Severidade | Tempo de Resposta | Escalação | Comunicação |
|------------|-------------------|-----------|-------------|
| P1 - Crítico | 15 min | CTO + CEO | Imediata |
| P2 - Alto | 1 hora | Tech Lead + PO | Em 2h |
| P3 - Médio | 4 horas | Dev responsável | Próximo standup |
| P4 - Baixo | 24 horas | Backlog | Relatório semanal |

---

### 6. 📅 REVISÃO DE RISCOS

| Frequência | Participantes | Output |
|------------|---------------|--------|
| Semanal | Tech Lead, PO | Status update |
| Sprint | Time completo | Revisão de scores |
| Mensal | Stakeholders | Report executivo |
| Trimestral | Diretoria | Análise estratégica |

---

⚡ **IMPORTANTE:** Este documento deve ser revisado e atualizado a cada sprint.
`
  },

  // Plano de Deploy
  plano_deploy: {
    system: SYSTEM_PROMPT_ESPECIFICACAO_AGENTICA + `\n\nVocê também é especialista em DevOps, CI/CD, infraestrutura cloud, e boas práticas de deployment.`,
    template: (contexto) => `
🎯 MISSÃO: Crie um Plano de Deploy COMPLETO que permita ao time de DevOps configurar toda a infraestrutura e pipeline de deployment.

${contexto}

---

## 🚀 PLANO DE DEPLOY E INFRAESTRUTURA

### 1. 🎯 VISÃO GERAL

**Estratégia de Deploy:** Blue-Green / Canary

**Ambientes:**
| Ambiente | Propósito | URL | Infra |
|----------|-----------|-----|-------|
| Development | Dev local | localhost:3000 | Docker Compose |
| QA | Testes manuais | qa.exemplo.com | K8s - 1 réplica |
| Staging | Homologação | staging.exemplo.com | K8s - 2 réplicas |
| Production | Usuários reais | app.exemplo.com | K8s - 3+ réplicas |

---

### 2. 🏗️ ARQUITETURA DE INFRAESTRUTURA

\`\`\`mermaid
graph TB
    subgraph "Internet"
        USER[Usuários]
    end
    
    subgraph "Edge"
        CF[CloudFlare CDN/WAF]
    end
    
    subgraph "AWS/GCP/Azure"
        subgraph "Load Balancing"
            ALB[Application Load Balancer]
        end
        
        subgraph "Compute - Kubernetes"
            subgraph "Frontend"
                FE1[Frontend Pod 1]
                FE2[Frontend Pod 2]
            end
            subgraph "Backend"
                BE1[API Pod 1]
                BE2[API Pod 2]
                BE3[API Pod 3]
            end
            subgraph "Workers"
                W1[Worker Pod 1]
                W2[Worker Pod 2]
            end
        end
        
        subgraph "Data"
            RDS[(PostgreSQL RDS)]
            REDIS[(Redis ElastiCache)]
            S3[(S3 Storage)]
        end
        
        subgraph "Observability"
            CW[CloudWatch]
            XR[X-Ray]
        end
    end
    
    subgraph "External"
        OPENAI[OpenAI API]
        SENDGRID[SendGrid]
    end
    
    USER --> CF
    CF --> ALB
    ALB --> FE1 & FE2
    FE1 & FE2 --> BE1 & BE2 & BE3
    BE1 & BE2 & BE3 --> RDS & REDIS & S3
    BE1 & BE2 & BE3 --> OPENAI & SENDGRID
    W1 & W2 --> RDS & REDIS
\`\`\`

---

### 3. 📦 CONTAINERIZAÇÃO

#### Dockerfile - Backend
\`\`\`dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs
EXPOSE 3000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
\`\`\`

#### docker-compose.yml (Development)
\`\`\`yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
      
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    
volumes:
  postgres_data:
\`\`\`

---

### 4. ☸️ KUBERNETES MANIFESTS

#### deployment.yaml
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels:
    app: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: registry.exemplo.com/api:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        envFrom:
        - secretRef:
            name: api-secrets
        - configMapRef:
            name: api-config
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
\`\`\`

#### service.yaml
\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
\`\`\`

#### ingress.yaml
\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.exemplo.com
    secretName: api-tls
  rules:
  - host: api.exemplo.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
\`\`\`

---

### 5. 🔄 CI/CD PIPELINE

#### GitHub Actions - .github/workflows/deploy.yml
\`\`\`yaml
name: Deploy Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npm run test:e2e
      
  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image_tag: \${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: azure/k8s-set-context@v3
        with:
          kubeconfig: \${{ secrets.KUBE_CONFIG_STAGING }}
      - run: |
          kubectl set image deployment/api api=\${{ needs.build.outputs.image_tag }}
          kubectl rollout status deployment/api
          
  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: azure/k8s-set-context@v3
        with:
          kubeconfig: \${{ secrets.KUBE_CONFIG_PROD }}
      - run: |
          kubectl set image deployment/api api=\${{ needs.build.outputs.image_tag }}
          kubectl rollout status deployment/api
\`\`\`

---

### 6. 🔐 GESTÃO DE SECRETS

**Ferramenta:** AWS Secrets Manager / HashiCorp Vault

**Secrets Necessários:**
| Secret | Ambiente | Rotação |
|--------|----------|---------|
| DATABASE_URL | Todos | 90 dias |
| JWT_SECRET | Todos | 30 dias |
| OPENAI_API_KEY | Todos | Manual |
| SENDGRID_API_KEY | Todos | Manual |
| AWS_ACCESS_KEY | CI/CD | 90 dias |

---

### 7. 📊 MONITORAMENTO E ALERTAS

**Stack de Observabilidade:**
| Componente | Ferramenta | Propósito |
|------------|------------|-----------|
| Logs | CloudWatch / Loki | Centralização de logs |
| Métricas | Prometheus / CloudWatch | Métricas de aplicação |
| Traces | X-Ray / Jaeger | Distributed tracing |
| Dashboard | Grafana / CloudWatch | Visualização |
| Alertas | PagerDuty / OpsGenie | Notificações |

**Alertas Configurados:**
| Alerta | Condição | Severidade | Ação |
|--------|----------|------------|------|
| High Error Rate | 5xx > 1% por 5min | P1 | Página on-call |
| High Latency | P99 > 2s por 5min | P2 | Slack + Email |
| Pod Restart | > 3 restarts em 10min | P2 | Slack |
| Disk Usage | > 80% | P3 | Email |

---

### 8. ✅ CHECKLIST DE GO-LIVE

#### Pré-Deploy
- [ ] Todos os testes passando (unit, integration, e2e)
- [ ] Code review aprovado
- [ ] Documentação atualizada
- [ ] Migrations testadas em staging
- [ ] Secrets configurados em produção
- [ ] SSL/TLS certificados válidos
- [ ] DNS configurado

#### Durante Deploy
- [ ] Deploy em horário de baixo tráfego
- [ ] Monitoramento ativo durante deploy
- [ ] Time de rollback disponível
- [ ] Comunicação com stakeholders

#### Pós-Deploy
- [ ] Smoke tests passando
- [ ] Métricas dentro do esperado
- [ ] Logs sem erros críticos
- [ ] Health checks OK
- [ ] Comunicar sucesso aos stakeholders

---

### 9. 🔙 ROLLBACK PLAN

**Critérios para Rollback:**
- Error rate > 5% por mais de 5 minutos
- Latência P99 > 5s
- Funcionalidade crítica indisponível

**Procedimento:**
\`\`\`bash
# 1. Reverter para versão anterior
kubectl rollout undo deployment/api

# 2. Verificar status
kubectl rollout status deployment/api

# 3. Verificar logs
kubectl logs -l app=api --tail=100

# 4. Comunicar stakeholders
# 5. Criar post-mortem
\`\`\`

---

### 10. 💰 ESTIMATIVA DE CUSTOS

| Serviço | Config | Custo/Mês |
|---------|--------|-----------|
| EKS/GKE | 3 nodes t3.medium | $150 |
| RDS | db.t3.small | $30 |
| ElastiCache | cache.t3.micro | $15 |
| S3 | 50GB | $5 |
| CloudFront | 100GB | $10 |
| Route53 | 1 hosted zone | $1 |
| Secrets Manager | 10 secrets | $5 |
| CloudWatch | Básico | $0 |
| **TOTAL** | | **~$216/mês** |

---

⚡ **IMPORTANTE:** Este plano deve ser revisado e atualizado a cada mudança significativa na infraestrutura.
`
  }
};

/**
 * Gera um documento específico
 */
async function gerarDocumento(tipo, produto, vertical, avaliacoes, opcoes = {}) {
  const prompt = PROMPTS[tipo];
  if (!prompt) {
    throw new Error(`Tipo de documento não suportado: ${tipo}`);
  }

  const metricas = opcoes.metricasEspecificacao;
  const produtoParaCronograma =
    tipo === 'cronograma' && metricas
      ? { ...produto, _metricasEspecificacao: metricas }
      : produto;
  
  // Inclui arquivos de referência no contexto
  const contexto = montarContextoProduto(produto, vertical, avaliacoes, opcoes.arquivosReferencia);
  
  // Para cronograma, passa o produto completo para ter acesso às duas produtividades
  const promptFinal = tipo === 'cronograma' 
    ? prompt.template(contexto, opcoes.custos, produtoParaCronograma)
    : prompt.template(contexto, opcoes.custos, opcoes.documentosAnteriores);
  
  // Passa imagens para a API se disponíveis
  const resultado = await chamarIAGeracaoDocumento(promptFinal, prompt.system, {
    maxTokens: getMaxTokensParaGeracao(opcoes),
    imagens: opcoes.arquivosReferencia?.imagens || null
  });
  
  let conteudo = resultado?.content ?? resultado?.conteudo ?? '';
  conteudo = typeof conteudo === 'string' ? conteudo : '';
  if (metricas) {
    const blocoMetricas = formatarSecaoMetricasEspecificacao(metricas, produto);
    conteudo =
      conteudo.trim().length > 0
        ? `${conteudo.trimEnd()}\n\n${blocoMetricas}`
        : blocoMetricas;
  }

  return {
    conteudo,
    modelo: resultado?.model || 'desconhecido',
    tokensEntrada: resultado?.tokensEntrada || 0,
    tokensSaida: resultado?.tokensSaida || 0,
    tempoResposta: resultado?.tempoResposta || 0,
    provider: resultado?.provider || 'unknown'
  };
}

/**
 * Gera todos os documentos de especificação
 * @param {Object} produto - Dados do produto
 * @param {Object} vertical - Vertical do produto
 * @param {Array} avaliacoes - Avaliações do produto
 * @param {Object} opcoes - Opções adicionais
 * @param {Array} opcoes.arquivos - Arquivos de referência do produto (do banco)
 * @param {Array} opcoes.tiposSelecionados - Lista de tipos de documentos a gerar (se vazio, gera todos essenciais)
 */
async function gerarEspecificacaoCompleta(produto, vertical, avaliacoes, opcoes = {}) {
  const documentos = [];
  
  // Se tiposSelecionados foi passado, usa ele; senão, usa os essenciais
  const tiposDocumentos = opcoes.tiposSelecionados && opcoes.tiposSelecionados.length > 0
    ? opcoes.tiposSelecionados.filter(t => PROMPTS[t]) // Filtra apenas tipos que existem
    : getTiposDocumentosEssenciais();
  
  let tokensTotal = 0;
  let tempoTotal = 0;
  
  // Carrega arquivos de referência se disponíveis
  let arquivosReferencia = null;
  if (opcoes.arquivos && opcoes.arquivos.length > 0) {
    console.log(`Carregando ${opcoes.arquivos.length} arquivos de referência...`);
    arquivosReferencia = await carregarArquivosReferencia(opcoes.arquivos);
    console.log(`- ${arquivosReferencia.documentos.length} documento(s) de texto`);
    console.log(`- ${arquivosReferencia.imagens.length} imagem(ns)`);
  }
  
  // Adiciona arquivos às opções
  const metricas =
    opcoes.metricasEspecificacao ?? calcularMetricasEspecificacaoProduto(produto);
  const opcoesComArquivos = {
    ...opcoes,
    arquivosReferencia,
    metricasEspecificacao: metricas
  };
  
  // Gera cada documento sequencialmente
  for (const tipo of tiposDocumentos) {
    try {
      console.log(`Gerando documento: ${tipo}...`);
      const resultado = await gerarDocumento(tipo, produto, vertical, avaliacoes, opcoesComArquivos);
      
      documentos.push({
        tipo,
        titulo: getTituloDocumento(tipo),
        conteudo: resultado.conteudo,
        tokensEntrada: resultado.tokensEntrada,
        tokensSaida: resultado.tokensSaida,
        tempoResposta: resultado.tempoResposta
      });
      
      tokensTotal += (resultado.tokensEntrada || 0) + (resultado.tokensSaida || 0);
      tempoTotal += resultado.tempoResposta || 0;
      
    } catch (error) {
      console.error(`Erro ao gerar ${tipo}:`, error.message);
      documentos.push({
        tipo,
        titulo: getTituloDocumento(tipo),
        conteudo: `Erro ao gerar documento: ${error.message}`,
        erro: true
      });
    }
  }
  
  // Gera o Blueprint consolidado por último
  const resumoDocumentos = documentos
    .filter(d => !d.erro && d.conteudo)
    .map(d => `### ${d.titulo}\n${(d.conteudo || '').substring(0, 500)}...`)
    .join('\n\n');
  
  try {
    console.log('Gerando Blueprint consolidado...');
    const blueprint = await gerarDocumento('blueprint', produto, vertical, avaliacoes, {
      ...opcoesComArquivos,
      documentosAnteriores: resumoDocumentos,
      metricasEspecificacao: metricas
    });
    
    documentos.push({
      tipo: 'blueprint',
      titulo: 'Blueprint de Construção',
      conteudo: blueprint.conteudo,
      tokensEntrada: blueprint.tokensEntrada,
      tokensSaida: blueprint.tokensSaida,
      tempoResposta: blueprint.tempoResposta
    });
    
    tokensTotal += (blueprint.tokensEntrada || 0) + (blueprint.tokensSaida || 0);
    tempoTotal += blueprint.tempoResposta || 0;
    
  } catch (error) {
    console.error('Erro ao gerar Blueprint:', error.message);
  }
  
  // Calcula custo estimado (preços aproximados da Anthropic)
  const custoPorMillionTokens = 15; // USD para Claude 3 Sonnet
  const custoEstimado = (tokensTotal / 1000000) * custoPorMillionTokens;
  
  return {
    documentos,
    metricas: {
      tokensTotal,
      tempoTotal,
      custoEstimadoUSD: custoEstimado,
      modeloUsado: getProvider().defaultModel,
      arquivosUtilizados: arquivosReferencia ? {
        documentos: arquivosReferencia.documentos.length,
        imagens: arquivosReferencia.imagens.length
      } : null
    }
  };
}

/**
 * Retorna o título formatado do documento
 */
function getTituloDocumento(tipo) {
  const titulos = {
    prd: 'PRD - Product Requirements Document',
    requisitos_funcionais: 'Requisitos Funcionais',
    requisitos_nao_funcionais: 'Requisitos Não Funcionais',
    arquitetura: 'Arquitetura Técnica',
    cronograma: 'Cronograma e Estimativas',
    blueprint: 'Blueprint de Construção',
    // Documentos Fase 2
    modelagem_dados: 'Modelagem de Dados',
    api_contracts: 'API Contracts (OpenAPI)',
    casos_teste: 'Casos de Teste',
    wireframes: 'Wireframes e Fluxos de Tela',
    glossario: 'Glossário do Domínio',
    riscos: 'Riscos e Mitigações',
    plano_deploy: 'Plano de Deploy'
  };
  return titulos[tipo] || tipo;
}

/**
 * Extrai estimativas do documento de cronograma gerado
 * @param {string} conteudoCronograma - Conteúdo do documento de cronograma
 * @param {number} custoHoraHomem - Custo por hora configurado no produto (opcional)
 * @param {number} produtividadeSpMes - Story Points por mês por dev (opcional)
 */
function extrairEstimativas(conteudoCronograma, custoHoraHomem = 150, produtividadeSpMes = 40) {
  const estimativas = {
    horasEstimadas: null,
    custoDesenvolvimento: null,
    prazoSemanas: null,
    tamanhoEquipe: null,
    storyPointsTotais: null,
    produtividadeSpMes: produtividadeSpMes
  };
  
  // Múltiplos padrões para capturar horas
  const horasPatterns = [
    /\*\*Horas\s+Totais\*\*\s*\|?\s*(\d+(?:[.,]\d+)?)\s*horas?/i,
    /Horas\s+Totais[:\s]*(\d+(?:[.,]\d+)?)/i,
    /(\d+(?:[.,]\d+)?)\s*horas?\s*totais/i,
    /Total[:\s]*(\d+(?:[.,]\d+)?)\s*horas?/i,
    /Esforço\s+total[:\s]*(\d+(?:[.,]\d+)?)\s*horas?/i,
    /(\d{3,5})\s*h(?:oras)?(?:\s|$)/i
  ];
  
  for (const pattern of horasPatterns) {
    const match = conteudoCronograma.match(pattern);
    if (match) {
      estimativas.horasEstimadas = parseFloat(match[1].replace(',', '.'));
      break;
    }
  }
  
  // Múltiplos padrões para capturar custo
  const custoPatterns = [
    /\*\*(?:TOTAL\s+ESTIMADO|Custo\s+de\s+Desenvolvimento|Custo\s+Total)\*\*\s*\|?\s*R\$\s*([\d.,]+)/i,
    /(?:TOTAL\s+ESTIMADO|Custo\s+Total)[:\s]*R\$\s*([\d.,]+)/i,
    /R\$\s*([\d.,]+)\s*(?:\||\s)*(?:total|estimado)/i,
    /Custo\s+(?:de\s+)?Desenvolvimento[:\s]*R\$\s*([\d.,]+)/i,
    /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/
  ];
  
  for (const pattern of custoPatterns) {
    const match = conteudoCronograma.match(pattern);
    if (match) {
      // Converte formato brasileiro (1.234.567,89) para número
      let valor = match[1].replace(/\./g, '').replace(',', '.');
      estimativas.custoDesenvolvimento = parseFloat(valor);
      break;
    }
  }
  
  // Múltiplos padrões para capturar prazo em semanas
  const prazoPatterns = [
    /Duração\s+total[:\s]*(\d+)\s*semanas?/i,
    /(\d+)\s*semanas?\s*(?:totais?|de\s+duração)/i,
    /Prazo[:\s]*(\d+)\s*semanas?/i,
    /(\d+)\s*a\s*(\d+)\s*semanas?/i
  ];
  
  for (const pattern of prazoPatterns) {
    const match = conteudoCronograma.match(pattern);
    if (match) {
      // Se for range (X a Y semanas), pega o maior
      estimativas.prazoSemanas = match[2] ? parseInt(match[2]) : parseInt(match[1]);
      break;
    }
  }
  
  // Múltiplos padrões para capturar tamanho da equipe
  const equipePatterns = [
    /Tamanho\s+(?:da\s+)?(?:equipe|time)[:\s]*(\d+)\s*(?:pessoas?|profissionais?|membros?)/i,
    /(\d+)\s*(?:pessoas?|profissionais?|membros?)\s*(?:na\s+equipe|no\s+time)/i,
    /equipe\s+(?:de\s+)?(\d+)\s*(?:pessoas?|profissionais?|membros?)/i,
    /\|\s*(\d+)\s*\|\s*(?:Full-time|100%|Dedicação)/i
  ];
  
  for (const pattern of equipePatterns) {
    const match = conteudoCronograma.match(pattern);
    if (match) {
      estimativas.tamanhoEquipe = parseInt(match[1]);
      break;
    }
  }
  
  // Múltiplos padrões para capturar Story Points
  const storyPointsPatterns = [
    /\*\*(?:Total\s+de\s+)?Story\s+Points?\*\*\s*\|?\s*(\d+)\s*SP/i,
    /\*\*Story\s+Points?\s+Totais?\*\*\s*\|?\s*(\d+)\s*SP/i,
    /Story\s+Points?\s+Totais?[:\s]*(\d+)/i,
    /Total[:\s]*(\d+)\s*(?:Story\s+Points?|SP)/i,
    /(\d+)\s*SP\s*(?:totais?|total)/i,
    /Esforço\s+total[:\s]*(\d+)\s*SP/i
  ];
  
  for (const pattern of storyPointsPatterns) {
    const match = conteudoCronograma.match(pattern);
    if (match) {
      estimativas.storyPointsTotais = parseInt(match[1]);
      break;
    }
  }
  
  // Se temos horas mas não temos custo, calcula usando o custoHoraHomem do produto
  if (estimativas.horasEstimadas && !estimativas.custoDesenvolvimento && custoHoraHomem) {
    estimativas.custoDesenvolvimento = Math.round(estimativas.horasEstimadas * custoHoraHomem);
  }
  
  // Se temos Story Points e equipe, calcula duração em meses com base na produtividade
  if (estimativas.storyPointsTotais && estimativas.tamanhoEquipe && produtividadeSpMes) {
    const mesesEstimados = estimativas.storyPointsTotais / (produtividadeSpMes * estimativas.tamanhoEquipe);
    // Converte meses para semanas se não temos prazo
    if (!estimativas.prazoSemanas) {
      estimativas.prazoSemanas = Math.ceil(mesesEstimados * 4);
    }
  }
  
  // Se temos horas mas não temos prazo, estima (considerando 40h/semana por pessoa, equipe média de 3)
  if (estimativas.horasEstimadas && !estimativas.prazoSemanas) {
    const pessoasEquipe = estimativas.tamanhoEquipe || 3;
    estimativas.prazoSemanas = Math.ceil(estimativas.horasEstimadas / (40 * pessoasEquipe));
  }
  
  return estimativas;
}

export {
  callAnthropic,
  gerarDocumento,
  gerarEspecificacaoCompleta,
  extrairEstimativas,
  getTituloDocumento,
  carregarArquivosReferencia,
  getTiposDocumentosDisponiveis,
  getTiposDocumentosEssenciais,
  TIPOS_DOCUMENTOS_CONFIG,
  PROMPTS
};

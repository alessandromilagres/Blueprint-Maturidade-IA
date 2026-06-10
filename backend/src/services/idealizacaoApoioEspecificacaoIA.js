/**
 * Gera texto estruturado para informacoesAdicionaisEspecificacao (e opcionalmente campos do Produto)
 * a partir de idealizacaoProduto, usando o mesmo provedor de IA configurado no sistema.
 */

import { jsonrepair } from 'jsonrepair';
import { callAIWithContinuation } from './ai-provider.js';
import { mergeInformacoesAdicionais } from './produto-cadastro-workflow.js';
import {
  criarArquivoMarkdownReferenciaProduto,
  removerArquivosReferenciaIdealizacaoIA,
  removerSomenteDiagramasIdealizacaoIA,
  removerSomenteArtefatosDtIdealizacaoIA,
  notificarPosArquivosReferencia
} from './arquivoReferenciaProdutoUtils.js';

const ROTULOS_IDEALIZACAO = {
  problemaContexto: 'Problema e contexto',
  metricaSucesso: 'Métrica de sucesso',
  restricoesPremissas: 'Restrições e premissas',
  mapaJornada: 'Mapa ou jornada',
  comoPoderiamos: 'Como poderíamos…',
  ideiasPriorizadas: 'Ideias priorizadas',
  solucaoEscolhida: 'Solução escolhida',
  prototipoLinks: 'Protótipo e links',
  hipoteseExperimento: 'Hipótese do experimento',
  planoValidacao: 'Plano de validação',
  decisoesRegistradas: 'Decisões registradas',
  observacoesGerais: 'Observações gerais'
};

export function formatarIdealizacaoParaPrompt(idealizacao) {
  if (!idealizacao || typeof idealizacao !== 'object') return '(sem dados de idealização)';
  const linhas = [];
  for (const [k, label] of Object.entries(ROTULOS_IDEALIZACAO)) {
    const v = idealizacao[k];
    if (v != null && String(v).trim() !== '') {
      linhas.push(`### ${label}\n${String(v).trim()}`);
    }
  }
  return linhas.length ? linhas.join('\n\n') : '(idealização sem texto preenchido)';
}

const SYSTEM_ESPECIALISTA = `Você é um especialista sênior em Design Thinking aplicado a produtos digitais e IA, atuando também como analista de requisitos e arquiteto de soluções em linguagem clara para times de engenharia.

Sua tarefa é transformar o material da fase de idealização (problema, solução, hipóteses, experimentos, decisões) em conteúdo útil para a geração automática da especificação técnica do produto.

REGRAS:
1. Baseie-se estritamente no que está na idealização; onde faltar detalhe, infira de forma conservadora e marque como premissa quando necessário.
2. Use português do Brasil, tom profissional, listas e Markdown onde ajudar.
3. Responda APENAS com um objeto JSON válido (UTF-8), sem texto antes ou depois, sem blocos markdown ao redor do JSON.
4. Os campos de string devem ser substancialmente úteis (não genéricos de uma linha), mas sem inventar requisitos contradizentes ao combinado na idealização.
5. CRÍTICO — sintaxe JSON: dentro de valores string use apenas \\n para quebra de linha (nunca quebre a linha literalmente dentro das aspas). Escape aspas duplas como \\".`;

const SYSTEM_DIAGRAMAS_Mermaid = `Você gera diagramas Mermaid para documentação de produto a partir de idealização (Design Thinking).

REGRAS:
1. Responda APENAS com JSON válido UTF-8, sem markdown ao redor do JSON.
2. Inclua de 3 a 5 diagramas distintos, em sintaxe Mermaid suportada pelos renderizadores comuns (preferir flowchart TD/LR, sequenceDiagram, stateDiagram-v2 quando fizer sentido).
3. Rótulos curtos em português; evite aspas duplas dentro dos rótulos — use colchetes ou texto simples.
4. Não use subgraph com caracteres especiais problemáticos; mantenha cada diagrama enxuto (idealmente até ~18 nós em flowcharts).
5. Baseie-se no material de idealização; não contradiga decisões descritas.
6. Estrutura JSON obrigatória:
{ "diagramas": [ { "id": "slug-em-kebab-case", "titulo": "string", "mermaid": "uma única definição Mermaid sem cercas code" } ] }
7. No campo "mermaid", use \\n entre linhas da sintaxe Mermaid — não insira quebras de linha literais dentro da string JSON.`;

const SYSTEM_ARTEFATOS_DESIGN_THINKING = `Você é facilitador de Design Thinking e documentação de produto.

Tarefa: produzir QUATRO artefatos em Markdown (pt-BR), derivados estritamente da idealização fornecida.

REGRAS:
1. Responda APENAS com um objeto JSON válido UTF-8 (sem markdown ao redor).
2. Chaves obrigatórias — cada valor é UM ÚNICO string Markdown (use \\n para quebras; nunca quebre linha literal dentro das aspas JSON):
   - mapaEmpatia: mapa de empatia (seções: O que pensa e sente; O que vê; O que ouve; O que fala e faz; Dores; Ganhos). Pode usar tabela Markdown.
   - personas: uma ou duas personas com nome fictício, contexto, objetivos, frustrações, necessidades e como o produto ajuda.
   - jornadaCliente: jornada em etapas (descoberta → consideração → uso → retenção ou equivalente ao contexto), com pensamentos, touchpoints e oportunidades por etapa.
   - serviceBlueprint: blueprint de serviço com linhas em Markdown — evidências/fatos visíveis ao cliente; linha de interação; linha de processos visíveis; linha de suporte; infraestrutura/processos internos (como no modelo clássico de blueprint).
3. Seja concreto em relação ao produto e público inferidos; marque premissas quando necessário.
4. Conteúdo útil para equipes de especificação — não texto genérico de uma linha.`;

/** Metadados dos .md fixos de Design Thinking (slugs alinhados ao PREFIX IA). */
const ARQUIVOS_ARTEFATOS_DT = [
  {
    key: 'mapaEmpatia',
    slug: 'mapa-empatia',
    tituloDoc: 'Mapa de empatia',
    nomeLegivel: 'MAPA DE EMPATIA'
  },
  {
    key: 'personas',
    slug: 'personas',
    tituloDoc: 'Personas',
    nomeLegivel: 'PERSONAS'
  },
  {
    key: 'jornadaCliente',
    slug: 'jornada-cliente',
    tituloDoc: 'Jornada do cliente',
    nomeLegivel: 'JORNADA DO CLIENTE'
  },
  {
    key: 'serviceBlueprint',
    slug: 'service-blueprint',
    tituloDoc: 'Service blueprint',
    nomeLegivel: 'SERVICE BLUEPRINT'
  }
];

function usoDaRespostaIA(ai) {
  return {
    modelo: ai.model,
    tokensEntrada: ai.tokensEntrada,
    tokensSaida: ai.tokensSaida,
    provedor: ai.provider,
    truncado: Boolean(ai.truncated)
  };
}

/**
 * Parse JSON vindo de LLM: quebras literais em strings e vírgulas sobrando são comuns.
 */
function extrairJsonObjeto(textoBruto) {
  const texto = String(textoBruto || '').trim();
  const fence = texto.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidato = fence ? fence[1].trim() : texto;

  const tentar = (raw) => {
    const s = String(raw || '').trim();
    try {
      return JSON.parse(s);
    } catch (err) {
      try {
        return JSON.parse(jsonrepair(s));
      } catch (err2) {
        const start = s.indexOf('{');
        const end = s.lastIndexOf('}');
        if (start >= 0 && end > start) {
          const inner = s.slice(start, end + 1);
          try {
            return JSON.parse(inner);
          } catch {
            return JSON.parse(jsonrepair(inner));
          }
        }
        throw new Error(err2?.message || err?.message || 'JSON inválido');
      }
    }
  };

  try {
    return tentar(candidato);
  } catch (e) {
    throw new Error(`Resposta da IA não é JSON válido: ${e.message}`);
  }
}

const CHAVES_IA = [
  'requisitosFuncionais',
  'fluxosWorkflow',
  'observacoesGeraisFase1',
  'requisitosNaoFuncionais',
  'integracoes',
  'restricoes',
  'observacoesGeraisFase2'
];

const CHAVES_PRODUTO_OPCIONAIS = [
  'problemaResolve',
  'publicoAlvo',
  'metricaPrincipal',
  'baselineAtual',
  'metaEsperada',
  'diferencialCompetitivo',
  'principaisRiscos',
  'dependenciasExternas'
];

function mesclarInformacoesGeradas(existing, incoming, sobrescrever) {
  const base = existing && typeof existing === 'object' ? { ...existing } : {};
  for (const k of CHAVES_IA) {
    const inc = incoming?.[k];
    if (inc == null || String(inc).trim() === '') continue;
    if (sobrescrever || !base[k] || String(base[k]).trim() === '') {
      base[k] = String(inc).trim();
    }
  }
  return base;
}

function mesclarCamposProduto(existingProduto, patch, sobrescrever) {
  const updateData = {};
  if (!patch || typeof patch !== 'object') return updateData;
  for (const k of CHAVES_PRODUTO_OPCIONAIS) {
    const inc = patch[k];
    if (inc == null || String(inc).trim() === '') continue;
    const atual = existingProduto[k];
    if (sobrescrever || atual == null || String(atual).trim() === '') {
      updateData[k] = String(inc).trim();
    }
  }
  return updateData;
}

function limparBlocoMermaid(raw) {
  let s = String(raw || '').trim();
  const fence = s.match(/^```(?:mermaid)?\s*([\s\S]*?)```$/im);
  if (fence) s = fence[1].trim();
  return s.replace(/\r\n/g, '\n');
}

function mermaidPareceValido(s) {
  if (s.length < 12 || s.length > 14000) return false;
  return /(flowchart|graph\s|sequenceDiagram|stateDiagram|classDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|c4Diagram|block-beta)/i.test(
    s
  );
}

function montarMarkdownDiagrama(titulo, mermaid) {
  return `# ${titulo}

Diagrama gerado automaticamente a partir da idealização (Fase A). Pode ser visualizado em editores Markdown com suporte a Mermaid.

\`\`\`mermaid
${mermaid}
\`\`\`
`;
}

/**
 * Apenas chama a IA e monta candidatos a diagramas (sem gravar arquivos).
 * @returns {{ candidatos: Array<{id: string, titulo: string, mer: string}>, uso: object, erro: string | null }}
 */
async function coletarCandidatosDiagramasMermaid(produto, blocoIdeal) {
  const promptDiagramas = `## Produto
- **Nome:** ${produto.nome || '—'}
- **Descrição:** ${produto.descricao || '—'}

## Idealização (entrada)

${blocoIdeal}

---

Gere o JSON com o array "diagramas": cada item com id (slug único), titulo e mermaid.
Sugestão de cobertura (adeque ao contexto): jornada ou fluxo principal; visão por blocos ou macro-arquitetura; diagrama de sequência (ator–sistema); decisões ou estados relevantes.`;

  const ai = await callAIWithContinuation(
    promptDiagramas,
    SYSTEM_DIAGRAMAS_Mermaid,
    { temperature: 0.15, maxTokens: 8000 },
    { maxContinuations: 1 }
  );

  const uso = usoDaRespostaIA(ai);

  let parsed;
  try {
    parsed = extrairJsonObjeto(ai.content || '');
  } catch (e) {
    return { candidatos: [], uso, erro: `Diagramas: JSON inválido (${e.message})` };
  }

  const lista = Array.isArray(parsed.diagramas) ? parsed.diagramas : [];
  const cortada = lista.slice(0, 5);

  const candidatos = [];
  const slugsUsados = new Set();
  for (const item of cortada) {
    const id = item?.id != null ? String(item.id).trim() : '';
    const titulo = item?.titulo != null ? String(item.titulo).trim() : '';
    const mer = limparBlocoMermaid(item?.mermaid);
    if (!id || !titulo || !mermaidPareceValido(mer)) continue;
    const slugKey = id
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!slugKey || slugsUsados.has(slugKey)) continue;
    slugsUsados.add(slugKey);
    candidatos.push({ id: slugKey, titulo, mer });
  }

  const erro = candidatos.length === 0 ? 'Nenhum diagrama Mermaid válido foi produzido pela IA.' : null;
  return { candidatos, uso, erro };
}

/**
 * Gera os quatro artefatos DT em um único JSON.
 * @returns {{ artefatos: Record<string, string>, uso: object, erro: string | null }}
 */
async function gerarObjetoArtefatosDesignThinking(produto, blocoIdeal) {
  const promptArtefatos = `## Produto
- **Nome:** ${produto.nome || '—'}
- **Descrição:** ${produto.descricao || '—'}
- **Projeto:** ${produto.projeto?.nome || '—'}

## Idealização (Fase A — Design Thinking)

${blocoIdeal}

---

Preencha os quatro campos Markdown do JSON conforme o system prompt (mapa de empatia, personas, jornada do cliente, service blueprint).`;

  const ai = await callAIWithContinuation(
    promptArtefatos,
    SYSTEM_ARTEFATOS_DESIGN_THINKING,
    { temperature: 0.25, maxTokens: 14000 },
    { maxContinuations: 2 }
  );

  const uso = usoDaRespostaIA(ai);

  let parsed;
  try {
    parsed = extrairJsonObjeto(ai.content || '');
  } catch (e) {
    return { artefatos: null, uso, erro: `Artefatos Design Thinking: JSON inválido (${e.message})` };
  }

  const artefatos = {};
  for (const { key } of ARQUIVOS_ARTEFATOS_DT) {
    artefatos[key] = parsed[key] != null ? String(parsed[key]).trim() : '';
  }

  return { artefatos, uso, erro: null };
}

function placeholderArtefatoCorpo(chaveLegivel) {
  return `*Conteúdo mínimo inferido — complemente ${chaveLegivel} com o time com base na pesquisa e na idealização.*`;
}

/**
 * Grava diagramas Mermaid e/ou os 4 artefatos DT.
 * @param {{ escopo?: 'todos' | 'diagramas' | 'artefatos' }} opts — o que substituir antes de gravar (evita apagar diagramas ao só gerar DT, e vice-versa).
 */
async function persistirAnexosIdealizacao(
  prisma,
  produtoId,
  { candidatos = [], artefatos = null, escopo = 'todos' }
) {
  const gravarDiagramas = candidatos.length > 0;
  const gravarArtefatos = artefatos != null;

  if (!gravarDiagramas && !gravarArtefatos) {
    return { arquivosDiagramas: [], arquivosArtefatos: [] };
  }

  if (escopo === 'todos') {
    await removerArquivosReferenciaIdealizacaoIA(prisma, produtoId);
  } else if (escopo === 'diagramas') {
    await removerSomenteDiagramasIdealizacaoIA(prisma, produtoId);
  } else if (escopo === 'artefatos') {
    await removerSomenteArtefatosDtIdealizacaoIA(prisma, produtoId);
  }

  const arquivosDiagramas = [];
  const arquivosArtefatos = [];

  if (gravarDiagramas) {
    for (const { id, titulo, mer } of candidatos) {
      const md = montarMarkdownDiagrama(titulo, mer);
      try {
        const salvo = await criarArquivoMarkdownReferenciaProduto({
          prisma,
          produtoId,
          slug: id,
          corpoMarkdown: md,
          descricao: 'Diagrama Mermaid gerado automaticamente a partir da idealização.',
          categoria: 'fluxo'
        });
        arquivosDiagramas.push(salvo);
      } catch (err) {
        console.error('[idealizacao IA] falha ao gravar diagrama', id, err);
      }
    }
  }

  if (gravarArtefatos) {
    for (const meta of ARQUIVOS_ARTEFATOS_DT) {
      let corpo = String(artefatos[meta.key] || '').trim();
      if (corpo.length < 40) {
        corpo = `${placeholderArtefatoCorpo(meta.nomeLegivel)}\n\n${corpo || ''}`;
      }
      const md = `# ${meta.tituloDoc}\n\n**${meta.nomeLegivel}** · gerado a partir da idealização (Fase A).\n\n${corpo}\n`;
      try {
        const salvo = await criarArquivoMarkdownReferenciaProduto({
          prisma,
          produtoId,
          slug: meta.slug,
          corpoMarkdown: md,
          descricao: `Artefato Design Thinking: ${meta.tituloDoc}.`,
          categoria: 'referencia'
        });
        arquivosArtefatos.push(salvo);
      } catch (err) {
        console.error('[idealizacao IA] falha ao gravar artefato', meta.slug, err);
      }
    }
  }

  await notificarPosArquivosReferencia(prisma, produtoId);

  return { arquivosDiagramas, arquivosArtefatos };
}

/**
 * Normaliza opções da API (modo explícito ou flags legadas).
 * Modos: `tudo` (padrão), `texto`, `anexos`, `anexos_diagramas`, `anexos_artefatos`.
 */
export function normalizarOpcoesGeracaoIA(options = {}) {
  const o = options || {};
  const modoRaw = o.modo != null ? String(o.modo).trim().toLowerCase() : '';

  const base = {
    sobrescrever: Boolean(o.sobrescrever),
    aplicarSugestoesAoProduto: o.aplicarSugestoesAoProduto !== false
  };

  if (modoRaw === 'texto') {
    return {
      ...base,
      modo: 'texto',
      gerarApoioTexto: true,
      gerarAnexosDiagramas: false,
      gerarAnexosArtefatos: false
    };
  }
  if (modoRaw === 'anexos_diagramas') {
    return {
      ...base,
      modo: 'anexos_diagramas',
      gerarApoioTexto: false,
      gerarAnexosDiagramas: true,
      gerarAnexosArtefatos: false
    };
  }
  if (modoRaw === 'anexos_artefatos') {
    return {
      ...base,
      modo: 'anexos_artefatos',
      gerarApoioTexto: false,
      gerarAnexosDiagramas: false,
      gerarAnexosArtefatos: true
    };
  }
  if (modoRaw === 'anexos') {
    return {
      ...base,
      modo: 'anexos',
      gerarApoioTexto: false,
      gerarAnexosDiagramas: true,
      gerarAnexosArtefatos: true
    };
  }

  if (!modoRaw || modoRaw === 'tudo') {
    const anyExplicit =
      o.gerarApoioTexto !== undefined ||
      o.anexarDiagramasReferencia !== undefined ||
      o.anexarArtefatosDesignThinking !== undefined;
    if (anyExplicit) {
      return {
        ...base,
        modo: 'custom',
        gerarApoioTexto: o.gerarApoioTexto !== false,
        gerarAnexosDiagramas: o.anexarDiagramasReferencia !== false,
        gerarAnexosArtefatos: o.anexarArtefatosDesignThinking !== false
      };
    }
    return {
      ...base,
      modo: 'tudo',
      gerarApoioTexto: true,
      gerarAnexosDiagramas: true,
      gerarAnexosArtefatos: true
    };
  }

  return {
    ...base,
    modo: 'tudo',
    gerarApoioTexto: true,
    gerarAnexosDiagramas: true,
    gerarAnexosArtefatos: true
  };
}

const INCLUDE_PRODUTO_GERACAO = {
  projeto: { include: { empresa: true } },
  vertical: true,
  arquiteturaReferencia: {
    select: { id: true, nome: true, tipoArquitetura: true, empresaId: true, ativo: true }
  }
};

/**
 * @param {object} produto — registro com projeto.empresa e idealizacaoProduto
 * @param {object} options — ver normalizarOpcoesGeracaoIA
 */
export async function gerarApoioEspecificacaoDaIdealizacao(prisma, produto, options = {}) {
  const opt = normalizarOpcoesGeracaoIA(options);
  const sobrescrever = opt.sobrescrever;
  const aplicarSugestoesAoProduto = opt.aplicarSugestoesAoProduto;

  const idealizacao = produto.idealizacaoProduto;
  if (!idealizacao || typeof idealizacao !== 'object') {
    throw new Error('Salve primeiro o conteúdo da idealização antes de gerar o apoio com IA.');
  }

  const blocoIdeal = formatarIdealizacaoParaPrompt(idealizacao);
  if (blocoIdeal.startsWith('(idealização sem texto')) {
    throw new Error('Preencha ao menos um campo da idealização antes de usar a IA.');
  }

  let atualizado;
  let usoApoio = null;

  if (opt.gerarApoioTexto) {
  const promptUsuario = `## Produto
- **Nome:** ${produto.nome || '—'}
- **Descrição:** ${produto.descricao || '—'}
- **Projeto:** ${produto.projeto?.nome || '—'}
- **Empresa:** ${produto.projeto?.empresa?.nome || '—'}

## Material da idealização (Fase A — Design Thinking)

${blocoIdeal}

---

Gere o JSON com esta estrutura EXATA (todas as chaves em informacoesAdicionaisEspecificacao devem existir; use string vazia "" apenas se realmente não houver nada a deduzir):

{
  "informacoesAdicionaisEspecificacao": {
    "requisitosFuncionais": "Requisitos funcionais derivados da solução escolhida e das decisões (Markdown).",
    "fluxosWorkflow": "Fluxos principais / jornada do usuário e sistemas.",
    "observacoesGeraisFase1": "Observações gerais da fase 1 / contexto para o time.",
    "requisitosNaoFuncionais": "Performance, segurança, disponibilidade, observabilidade, LGPD etc. quando aplicável.",
    "integracoes": "Integrações e APIs necessárias ou prováveis.",
    "restricoes": "Restrições técnicas, de negócio, compliance e premissas.",
    "observacoesGeraisFase2": "Observações para a fase 2 / handoff técnico."
  },
  "produtoCamposOpcionais": {
    "problemaResolve": "síntese curta do problema",
    "publicoAlvo": "quem é o usuário",
    "metricaPrincipal": "KPI principal",
    "baselineAtual": "linha de base se inferível",
    "metaEsperada": "meta",
    "diferencialCompetitivo": "diferencial",
    "principaisRiscos": "riscos",
    "dependenciasExternas": "dependências"
  }
}

Use produtoCamposOpcionais apenas com valores úteis; omita chaves que não puder preencher com base na idealização.`;

  const ai = await callAIWithContinuation(
    promptUsuario,
    SYSTEM_ESPECIALISTA,
    { temperature: 0.2, maxTokens: 12000 },
    { maxContinuations: 2 }
  );

  const texto = ai.content || '';
  const parsed = extrairJsonObjeto(texto);
  const iaGerada = parsed.informacoesAdicionaisEspecificacao || parsed.informacoesAdicionais || {};
  const produtoPatch = parsed.produtoCamposOpcionais || {};

  const iaMerged = mesclarInformacoesGeradas(
    produto.informacoesAdicionaisEspecificacao,
    iaGerada,
    sobrescrever
  );

  const updateData = {
    informacoesAdicionaisEspecificacao: mergeInformacoesAdicionais(
      produto.informacoesAdicionaisEspecificacao,
      iaMerged
    )
  };

  if (aplicarSugestoesAoProduto) {
    Object.assign(
      updateData,
      mesclarCamposProduto(produto, produtoPatch, sobrescrever)
    );
  }

    atualizado = await prisma.produto.update({
      where: { id: produto.id },
      data: updateData,
      include: INCLUDE_PRODUTO_GERACAO
    });

    usoApoio = usoDaRespostaIA(ai);
  } else {
    atualizado = await prisma.produto.findUnique({
      where: { id: produto.id },
      include: INCLUDE_PRODUTO_GERACAO
    });
    if (!atualizado) {
      throw new Error('Produto não encontrado.');
    }
  }

  let diagramas = null;
  let diagramasErro = null;
  let artefatosDesignThinking = null;
  let artefatosDesignThinkingErro = null;

  if (opt.gerarAnexosDiagramas || opt.gerarAnexosArtefatos) {
    try {
      let candidatos = [];
      let usoDiag = null;
      let errDiagColeta = null;

      if (opt.gerarAnexosDiagramas) {
        const d = await coletarCandidatosDiagramasMermaid(atualizado, blocoIdeal);
        candidatos = d.candidatos;
        usoDiag = d.uso;
        errDiagColeta = d.erro;
      }

      let artefatosObj = null;
      let usoDt = null;
      let errDt = null;

      if (opt.gerarAnexosArtefatos) {
        const a = await gerarObjetoArtefatosDesignThinking(atualizado, blocoIdeal);
        usoDt = a.uso;
        if (a.erro) {
          errDt = a.erro;
        } else {
          artefatosObj = a.artefatos;
        }
      }

      const deveDiagramas = opt.gerarAnexosDiagramas && candidatos.length > 0;
      const deveArtefatos = opt.gerarAnexosArtefatos && artefatosObj != null && !errDt;

      const devePersistirAnexos = deveDiagramas || deveArtefatos;

      const escopoPersistencia =
        opt.gerarAnexosDiagramas && opt.gerarAnexosArtefatos
          ? 'todos'
          : opt.gerarAnexosDiagramas
            ? 'diagramas'
            : 'artefatos';

      if (devePersistirAnexos) {
        const persistido = await persistirAnexosIdealizacao(prisma, atualizado.id, {
          candidatos: deveDiagramas ? candidatos : [],
          artefatos: deveArtefatos ? artefatosObj : null,
          escopo: escopoPersistencia
        });

        if (opt.gerarAnexosDiagramas) {
          diagramas = {
            arquivos: persistido.arquivosDiagramas,
            uso: usoDiag
          };
          diagramasErro =
            persistido.arquivosDiagramas.length === 0 && candidatos.length > 0
              ? 'Falha ao registrar diagramas em arquivo de referência.'
              : candidatos.length === 0
                ? errDiagColeta
                : null;
        }

        if (opt.gerarAnexosArtefatos) {
          if (deveArtefatos) {
            artefatosDesignThinking = {
              arquivos: persistido.arquivosArtefatos,
              uso: usoDt
            };
            artefatosDesignThinkingErro =
              persistido.arquivosArtefatos.length === 0
                ? 'Falha ao registrar artefatos Design Thinking.'
                : null;
          } else {
            artefatosDesignThinking = { arquivos: [], uso: usoDt };
            artefatosDesignThinkingErro = errDt;
          }
        }
      } else {
        if (opt.gerarAnexosDiagramas) {
          diagramas = { arquivos: [], uso: usoDiag };
          diagramasErro = errDiagColeta;
        }
        if (opt.gerarAnexosArtefatos) {
          artefatosDesignThinking = { arquivos: [], uso: usoDt };
          artefatosDesignThinkingErro = errDt;
        }
      }
    } catch (e) {
      console.error('[idealizacao IA] anexos:', e);
      const msg = e.message || String(e);
      if (opt.gerarAnexosDiagramas) {
        diagramasErro = msg;
      }
      if (opt.gerarAnexosArtefatos) {
        artefatosDesignThinkingErro = msg;
      }
    }
  }

  return {
    produto: atualizado,
    modo: opt.modo,
    uso: usoApoio,
    diagramas,
    diagramasErro,
    artefatosDesignThinking,
    artefatosDesignThinkingErro
  };
}

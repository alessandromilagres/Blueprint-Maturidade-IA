/**
 * Contexto do projeto Blueprint (Fase 1) — personalização de books/relatórios IA.
 *
 * - Características estruturadas + URLs de referência (JSON em ProjetoContexto).
 * - Documentos MD/PDF/DOC/DOCX e imagens PNG/JPG/GIF/WebP (ProjetoContextoArquivo).
 * - Bloco Markdown injetado no dadosBlock do book e relatório executivo.
 *
 * Persistência via raw SQL (sem ALTER em Projeto), mesmo padrão de ProjetoDimensaoConfig.
 */
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseOffice } from 'officeparser';
import {
  blocoMarkdownGlossarioFatosCanonicos,
  hashContextoFatosBook,
  LABELS_FATOS_CANONICOS,
  DICAS_FATOS_CANONICOS,
  mesclarCamposFatosEmCaracteristicas,
  obterTermosProibidos,
  projetoTemGlossarioFatos
} from './projetoContextoFatos.js';

const officeparser = { parseOffice };

export const UPLOAD_DIR_PROJETO_CONTEXTO = path.join(process.cwd(), 'uploads', 'projeto-contexto');
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_CONTEUDO_DB = 50000;
/** Limite total de texto de contexto injetado nos prompts de IA. */
export const MAX_CONTEXTO_BOOK_CHARS = 12000;

const TIPOS_PERMITIDOS = {
  'text/plain': '.txt',
  'text/markdown': '.md',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

export function isImagemMime(mimeType) {
  return String(mimeType || '').startsWith('image/');
}

const TIPOS_OFFICE = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf'
];

let schemaReady = false;

export async function ensureProjetoContextoSchema(prisma) {
  if (schemaReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProjetoContexto" (
      "projetoId" INTEGER PRIMARY KEY,
      "caracteristicas" JSONB NOT NULL DEFAULT '{}',
      "urls" JSONB NOT NULL DEFAULT '[]',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ProjetoContextoArquivo" (
      "id" SERIAL PRIMARY KEY,
      "projetoId" INTEGER NOT NULL,
      "nomeOriginal" TEXT NOT NULL,
      "nomeArmazenado" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "tamanho" INTEGER NOT NULL,
      "conteudoExtraido" TEXT,
      "descricao" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ProjetoContextoArquivo_projetoId_idx"
    ON "ProjetoContextoArquivo" ("projetoId")
  `);
  schemaReady = true;
}

export function normalizarMimeUpload(nomeOriginal, mimeType) {
  const base = String(mimeType || '').split(';')[0].trim().toLowerCase();
  const map = {
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  if (base && base !== 'application/octet-stream') return base;
  const ext = path.extname(String(nomeOriginal || '').toLowerCase());
  return map[ext] || base || '';
}

export async function garantirDiretorioUpload() {
  try {
    await fs.access(UPLOAD_DIR_PROJETO_CONTEXTO);
  } catch {
    await fs.mkdir(UPLOAD_DIR_PROJETO_CONTEXTO, { recursive: true });
  }
}

export async function extrairConteudoTexto(filePath, mimeType) {
  try {
    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      const conteudo = await fs.readFile(filePath, 'utf-8');
      return conteudo.substring(0, MAX_CONTEUDO_DB);
    }
    if (TIPOS_OFFICE.includes(mimeType)) {
      const resultado = await new Promise((resolve, reject) => {
        officeparser.parseOffice(filePath, (data, err) => (err ? reject(err) : resolve(data)));
      });
      let conteudo;
      if (resultado && typeof resultado.toText === 'function') conteudo = resultado.toText();
      else if (typeof resultado === 'string') conteudo = resultado;
      if (conteudo && typeof conteudo === 'string') {
        return conteudo
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n\n')
          .trim()
          .substring(0, MAX_CONTEUDO_DB);
      }
    }
    return null;
  } catch {
    return null;
  }
}

const CAMPOS_CARACTERISTICAS = [
  'contextoNegocio',
  'stackTecnologica',
  'sistemasCore',
  'cloudProvedor',
  'reguladores',
  'iniciativasEmAndamento',
  'restricoes',
  'publicoAlvoRelatorio'
];

const LABELS_CARACTERISTICAS = {
  contextoNegocio: 'Panorama do negócio',
  stackTecnologica: 'Ferramentas e stack de IA/dados',
  sistemasCore: 'Sistemas corporativos principais',
  cloudProvedor: 'Cloud e infraestrutura',
  reguladores: 'Normas, leis e órgãos reguladores',
  iniciativasEmAndamento: 'Projetos e pilotos de IA em curso',
  restricoes: 'Restrições e limitações conhecidas',
  publicoAlvoRelatorio: 'Quem vai ler este relatório'
};

const DICAS_CARACTERISTICAS = {
  contextoNegocio:
    'Setor, modelo de receita, posição no mercado e principais desafios estratégicos do cliente.',
  stackTecnologica:
    'Linguagens, plataformas de dados, ferramentas de ML/LLM e parceiros tecnológicos relevantes.',
  sistemasCore:
    'ERP, CRM, CDP, data lake, integrações críticas e fontes de dados que a IA deve considerar.',
  cloudProvedor:
    'Provedor cloud (AWS, Azure, GCP), on-prem, Kubernetes, redes e padrões de deploy.',
  reguladores:
    'LGPD, Bacen, ANVISA, SOX, ISO 42001 e outras obrigações que impactam o roadmap de IA.',
  iniciativasEmAndamento:
    'Copilots, chatbots, scoring, automação e qualquer iniciativa já em piloto ou produção.',
  restricoes:
    'Orçamento, legado, políticas internas, resistência cultural ou barreiras contratuais.',
  publicoAlvoRelatorio:
    'Ex.: C-level, board, CTO, diretoria de negócio — define tom e profundidade do book.'
};

function normalizarCaracteristicas(raw = {}) {
  const out = {};
  for (const k of CAMPOS_CARACTERISTICAS) {
    const v = raw[k];
    out[k] = v != null && String(v).trim() ? String(v).trim().slice(0, 8000) : '';
  }
  return mesclarCamposFatosEmCaracteristicas(out, raw);
}

function normalizarUrls(raw = []) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((u) => ({
      url: String(u?.url || '').trim().slice(0, 2000),
      titulo: String(u?.titulo || '').trim().slice(0, 200),
      notas: String(u?.notas || '').trim().slice(0, 2000)
    }))
    .filter((u) => u.url.length > 0)
    .slice(0, 20);
}

export async function carregarContextoProjeto(prisma, projetoId) {
  await ensureProjetoContextoSchema(prisma);

  const projeto = await prisma.projeto.findUnique({
    where: { id: projetoId },
    select: { id: true, nome: true }
  });
  if (!projeto) {
    const err = new Error('Projeto não encontrado');
    err.status = 404;
    throw err;
  }

  const rows = await prisma.$queryRaw`
    SELECT "caracteristicas", "urls", "updatedAt"
    FROM "ProjetoContexto" WHERE "projetoId" = ${projetoId}
  `;
  const reg = rows?.[0] || null;
  const caracteristicas = normalizarCaracteristicas(reg?.caracteristicas || {});
  const urls = normalizarUrls(Array.isArray(reg?.urls) ? reg.urls : []);

  const arquivos = await prisma.$queryRaw`
    SELECT "id", "nomeOriginal", "mimeType", "tamanho", "descricao",
           LENGTH("conteudoExtraido") AS "charsExtraidos", "createdAt"
    FROM "ProjetoContextoArquivo"
    WHERE "projetoId" = ${projetoId}
    ORDER BY "createdAt" DESC
  `;

  return {
    projetoId,
    caracteristicas,
    urls,
    arquivos: (arquivos || []).map((a) => ({
      id: Number(a.id),
      nomeOriginal: a.nomeOriginal,
      mimeType: a.mimeType,
      ehImagem: isImagemMime(a.mimeType),
      tamanho: Number(a.tamanho),
      descricao: a.descricao,
      charsExtraidos: Number(a.charsExtraidos) || 0,
      createdAt: a.createdAt
    })),
    labels: { ...LABELS_CARACTERISTICAS, ...LABELS_FATOS_CANONICOS },
    dicas: { ...DICAS_CARACTERISTICAS, ...DICAS_FATOS_CANONICOS },
    limites: { maxFileSizeMb: 10 },
    updatedAt: reg?.updatedAt || null,
    configurado:
      Object.values(caracteristicas).some((v) => v) ||
      urls.length > 0 ||
      (arquivos || []).length > 0
  };
}

export async function salvarContextoProjeto(prisma, projetoId, body = {}) {
  await ensureProjetoContextoSchema(prisma);
  const projeto = await prisma.projeto.findUnique({ where: { id: projetoId } });
  if (!projeto) {
    const err = new Error('Projeto não encontrado');
    err.status = 404;
    throw err;
  }

  const caracteristicas = normalizarCaracteristicas(body.caracteristicas || {});
  const urls = normalizarUrls(body.urls || []);

  await prisma.$executeRawUnsafe(
    `INSERT INTO "ProjetoContexto" ("projetoId","caracteristicas","urls","createdAt","updatedAt")
     VALUES ($1, $2::jsonb, $3::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT ("projetoId") DO UPDATE SET
       "caracteristicas" = EXCLUDED."caracteristicas",
       "urls" = EXCLUDED."urls",
       "updatedAt" = CURRENT_TIMESTAMP`,
    projetoId,
    JSON.stringify(caracteristicas),
    JSON.stringify(urls)
  );

  return carregarContextoProjeto(prisma, projetoId);
}

export async function uploadArquivoContextoProjeto(
  prisma,
  projetoId,
  { buffer, nomeOriginal, mimeType: mimeRaw, descricao }
) {
  await ensureProjetoContextoSchema(prisma);
  const projeto = await prisma.projeto.findUnique({ where: { id: projetoId } });
  if (!projeto) {
    const err = new Error('Projeto não encontrado');
    err.status = 404;
    throw err;
  }

  const mimeType = normalizarMimeUpload(nomeOriginal, mimeRaw);
  if (!TIPOS_PERMITIDOS[mimeType]) {
    const err = new Error(
      'Tipo não permitido. Use MD, TXT, PDF, DOC, DOCX ou imagens PNG/JPG/GIF/WebP.'
    );
    err.status = 400;
    throw err;
  }
  if (isImagemMime(mimeType) && !String(descricao || '').trim()) {
    const err = new Error('Imagens exigem uma descrição (o book usa o texto; a IA não lê o pixel diretamente).');
    err.status = 400;
    throw err;
  }
  if (buffer.length > MAX_FILE_SIZE) {
    const err = new Error('Arquivo muito grande (máximo 10MB).');
    err.status = 400;
    throw err;
  }

  await garantirDiretorioUpload();
  const ext = TIPOS_PERMITIDOS[mimeType];
  const hash = crypto.randomBytes(16).toString('hex');
  const nomeArmazenado = `p${projetoId}_${hash}${ext}`;
  const filePath = path.join(UPLOAD_DIR_PROJETO_CONTEXTO, nomeArmazenado);
  await fs.writeFile(filePath, buffer);

  const conteudoExtraido = isImagemMime(mimeType)
    ? null
    : await extrairConteudoTexto(filePath, mimeType);

  const descricaoFinal = String(descricao || '').trim().slice(0, 2000) || null;

  const inserted = await prisma.$queryRaw`
    INSERT INTO "ProjetoContextoArquivo"
      ("projetoId","nomeOriginal","nomeArmazenado","mimeType","tamanho","conteudoExtraido","descricao")
    VALUES (${projetoId}, ${nomeOriginal}, ${nomeArmazenado}, ${mimeType}, ${buffer.length},
            ${conteudoExtraido}, ${descricaoFinal})
    RETURNING "id"
  `;

  return { id: Number(inserted[0].id), charsExtraidos: conteudoExtraido?.length || 0, ehImagem: isImagemMime(mimeType) };
}

export async function obterArquivoContextoProjeto(prisma, projetoId, arquivoId) {
  await ensureProjetoContextoSchema(prisma);
  const rows = await prisma.$queryRaw`
    SELECT "id", "nomeOriginal", "nomeArmazenado", "mimeType", "tamanho"
    FROM "ProjetoContextoArquivo"
    WHERE "id" = ${arquivoId} AND "projetoId" = ${projetoId}
  `;
  if (!rows?.length) {
    const err = new Error('Arquivo não encontrado');
    err.status = 404;
    throw err;
  }
  const row = rows[0];
  const filePath = path.join(UPLOAD_DIR_PROJETO_CONTEXTO, row.nomeArmazenado);
  try {
    await fs.access(filePath);
  } catch {
    const err = new Error('Arquivo não encontrado no disco');
    err.status = 404;
    throw err;
  }
  return {
    filePath,
    nomeOriginal: row.nomeOriginal,
    mimeType: row.mimeType,
    tamanho: Number(row.tamanho)
  };
}

export async function removerArquivoContextoProjeto(prisma, projetoId, arquivoId) {
  await ensureProjetoContextoSchema(prisma);
  const rows = await prisma.$queryRaw`
    SELECT "nomeArmazenado" FROM "ProjetoContextoArquivo"
    WHERE "id" = ${arquivoId} AND "projetoId" = ${projetoId}
  `;
  if (!rows?.length) {
    const err = new Error('Arquivo não encontrado');
    err.status = 404;
    throw err;
  }
  const fp = path.join(UPLOAD_DIR_PROJETO_CONTEXTO, rows[0].nomeArmazenado);
  await fs.unlink(fp).catch(() => {});
  await prisma.$executeRawUnsafe(
    `DELETE FROM "ProjetoContextoArquivo" WHERE "id" = $1 AND "projetoId" = $2`,
    arquivoId,
    projetoId
  );
}

function truncar(str, max) {
  const s = String(str || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 20)}\n\n… [truncado]`;
}

/** Rótulos canônicos dos Entregáveis A–H (nomenclatura SysMap Fábrica Agêntica). */
export const ROTULOS_ENTREGAVEL_PROJETO = {
  A: 'Entregável A — Diagnóstico e Baseline',
  B: 'Entregável B — TOM / Modelo Operacional',
  C: 'Entregável C — Arquitetura Técnica',
  D: 'Entregável D — Playbooks Operacionais',
  E: 'Entregável E — Roteiro de Pilotos',
  F: 'Entregável F — Modelo Comercial / GTM',
  G: 'Entregável G — Capacitação e Gestão de Mudança',
  H: 'Entregável H — Diagnóstico de Clientes'
};

/** Nomes alternativos que a IA inventa — devem ser substituídos pelo rótulo canônico. */
const ALTERNATIVAS_NAO_CANONICAS_ENTREGAVEL = {
  E: ['Mapa de Jornadas', 'Mapa de jornadas', 'Jornada do Cliente', 'Jornadas do Cliente'],
  F: ['Plano Comercial', 'Go-to-Market'],
  G: ['Operação', 'Modelo Operacional', 'Gestão Operacional'],
  H: ['Business Case', 'Caso de Negócio', 'Business case', 'Caso de negócio']
};

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Substitui rótulos inventados pela IA pelos nomes canônicos do escopo (A–H).
 * Ex.: "Entregável E (Mapa de Jornadas)" → "Entregável E — Roteiro de Pilotos".
 */
export function normalizarRotulosEntregaveisEscopo(texto, inventario = null) {
  let out = String(texto || '');
  const letras = inventario?.entregaveis?.length
    ? inventario.entregaveis
    : Object.keys(ROTULOS_ENTREGAVEL_PROJETO);

  for (const letra of letras) {
    const canonico = ROTULOS_ENTREGAVEL_PROJETO[letra];
    const tituloCanonico = canonico?.split('—')[1]?.trim() || '';
    const alts = ALTERNATIVAS_NAO_CANONICAS_ENTREGAVEL[letra] || [];

    for (const alt of alts) {
      if (alt.toLowerCase() === tituloCanonico.toLowerCase()) continue;
      const esc = escapeRegex(alt);
      const reParen = new RegExp(
        `(Entreg[aá]vel\\s*[_\\s-]*${letra})\\s*\\(\\s*${esc}\\s*\\)`,
        'gi'
      );
      const reDash = new RegExp(
        `(Entreg[aá]vel\\s*[_\\s-]*${letra})\\s*[—–\\-]\\s*${esc}(?=\\s|,|\\.|;|$|\\))`,
        'gi'
      );
      out = out.replace(reParen, canonico);
      out = out.replace(reDash, canonico);
    }
  }
  return out;
}

/** Bloco de regras de nomenclatura para injeção nos prompts SATF. */
export function blocoRegrasNomenclaturaEntregaveisMarkdown(inventario) {
  if (!inventario?.entregaveis?.length) return '';
  const lista = inventario.entregaveis
    .map((l) => `- **${ROTULOS_ENTREGAVEL_PROJETO[l]}**`)
    .join('\n');
  return `
## NOMENCLATURA OBRIGATÓRIA — ENTREGÁVEIS A–H

Use **exatamente** estes rótulos ao citar documentos do escopo (copie literalmente):

${lista}

**Proibido renomear ou inventar sinônimos:**
- E = **Roteiro de Pilotos** — **não** use "Mapa de Jornadas" nem "Jornada do Cliente"
- F = **Modelo Comercial / GTM**
- G = **Capacitação e Gestão de Mudança** — **não** use só "Operação"
- H = **Diagnóstico de Clientes** — **não** use "Business Case" nem "Caso de Negócio"

Formato preferido: \`Entregável X — [nome canônico]\` (ex.: Entregável E — Roteiro de Pilotos).

---
`;
}

/** Dimensões SATF TI v3 → entregáveis prioritários quando existirem no contexto. */
const SATF_DIM_ENTREGAVEIS_PRIORITARIOS = {
  'Estratégia & Postura de IA': ['A', 'B', 'E', 'F'],
  'Governança, Risco & Conformidade': ['A', 'B', 'C', 'D'],
  'Pessoas, Cultura & Capacitação': ['A', 'B', 'G', 'D'],
  'Engenharia & Padrões de Desenvolvimento': ['A', 'C', 'D'],
  'Plataforma, Arquitetura & Escala': ['A', 'C', 'D'],
  'Dados, Contexto & Conhecimento': ['A', 'C'],
  'Segurança & Qualidade Integrada (QA)': ['A', 'C', 'D'],
  'Modernização & Sustentação de Legado': ['A', 'C', 'H'],
  'FinOps, Valor & Apoio ao Negócio': ['A', 'F', 'H'],
  'Fábrica Agêntica de Software': ['A', 'B', 'C', 'D', 'E', 'H'],
  'Conformidade Regulatória de IA': ['A', 'B', 'C', 'D']
};

function extrairLetraEntregavel(nomeArquivo) {
  const n = String(nomeArquivo || '');
  const m = n.match(/Entreg[aá]vel[_\s-]*([A-H])/i);
  return m ? m[1].toUpperCase() : null;
}

/** Entregáveis prioritários por dimensão SATF que existem no inventário. */
export function entregaveisPrioritariosDimensaoSatf(dimArea, inventario) {
  if (!inventario?.entregaveis?.length) {
    return { prioritarios: [], estendidos: [] };
  }
  const disponiveis = new Set(inventario.entregaveis);
  const prioritarios = (SATF_DIM_ENTREGAVEIS_PRIORITARIOS[dimArea] || ['A', 'B', 'C', 'D']).filter((l) =>
    disponiveis.has(l)
  );
  return {
    prioritarios,
    estendidos: prioritarios.filter((l) => 'EFGH'.includes(l))
  };
}

/** Detecta se o texto cita um Entregável pela letra ou pelo rótulo canônico. */
export function detectarCitacaoEntregavel(texto, letra) {
  const t = String(texto || '');
  if (new RegExp(`Entreg[aá]vel\\s*[_\\s-]*${letra}\\b`, 'i').test(t)) return true;
  const rotulo = ROTULOS_ENTREGAVEL_PROJETO[letra];
  if (!rotulo) return false;
  const parte = rotulo.split('—')[1]?.trim();
  if (parte && parte.length >= 8 && t.toLowerCase().includes(parte.toLowerCase())) return true;
  return false;
}

/** Inventário a partir de cabeçalhos #### do bloco de contexto (fallback se query falhar). */
export function inventarioDocumentosContextoFromMarkdown(blocoMarkdown) {
  const arquivos = [];
  const re = /^####\s+(.+)$/gm;
  let m;
  while ((m = re.exec(String(blocoMarkdown || '')))) {
    arquivos.push({ nomeOriginal: m[1].split('—')[0].trim() });
  }
  return inventarioDocumentosContextoFromArquivos(arquivos);
}

function inserirBulletsEntregaveisSecao3(conteudo, numSecao, modoRapido, bullets) {
  const subEvid = modoRapido ? `${numSecao}.3` : `${numSecao}.2`;
  const headerRe = new RegExp(`(###\\s+${subEvid.replace(/\./g, '\\.')}\\s+Evidências[^\\n]*\\n)`, 'i');
  const m = conteudo.match(headerRe);
  const bloco = `\n**Documentação de escopo (entregáveis cadastrados):**\n${bullets.join('\n')}\n`;
  if (m) {
    const idx = conteudo.indexOf(m[0]) + m[0].length;
    return `${conteudo.slice(0, idx)}${bloco}${conteudo.slice(idx)}`;
  }
  const headerDiagRe = new RegExp(`(###\\s+${numSecao.replace(/\./g, '\\.')}\\.1\\s+[^\\n]*\\n)`, 'i');
  const md = conteudo.match(headerDiagRe);
  if (md) {
    const idx = conteudo.indexOf(md[0]) + md[0].length;
    return `${conteudo.slice(0, idx)}${bloco}${conteudo.slice(idx)}`;
  }
  return `${conteudo.trim()}\n\n${bloco}`;
}

/**
 * Garante citação mínima de entregáveis do escopo na Seção 3 (complemento determinístico).
 * A IA pode omitir E–H; este passo injeta bullets faltantes em Evidências/Diagnóstico.
 */
export function complementarSecao3EntregaveisEscopo(
  conteudo,
  dimArea,
  inventario,
  numSecao,
  { modoRapido = false } = {}
) {
  const texto = String(conteudo || '').trim();
  if (!texto || !inventario?.entregaveis?.length) return conteudo;

  const { prioritarios, estendidos } = entregaveisPrioritariosDimensaoSatf(dimArea, inventario);
  if (!prioritarios.length) return conteudo;

  const citados = prioritarios.filter((l) => detectarCitacaoEntregavel(texto, l));
  const minNecessario = Math.min(2, prioritarios.length);
  const faltantes = prioritarios.filter((l) => !citados.includes(l));
  const toInject = [];

  for (const letra of faltantes) {
    if (citados.length + toInject.length >= minNecessario) break;
    toInject.push(letra);
  }

  const temEstendidoCitado =
    estendidos.some((l) => detectarCitacaoEntregavel(texto, l)) ||
    estendidos.some((l) => toInject.includes(l));
  if (estendidos.length && !temEstendidoCitado) {
    const ext = estendidos.find((l) => !toInject.includes(l));
    if (ext) toInject.unshift(ext);
  }

  if (!toInject.length) return conteudo;

  const bullets = toInject.map(
    (l) =>
      `- **${ROTULOS_ENTREGAVEL_PROJETO[l]}** — anexo cadastrado no contexto do projeto; referência obrigatória para evolução de **${dimArea}**.`
  );
  return inserirBulletsEntregaveisSecao3(texto, numSecao, modoRapido, bullets);
}

/** Monta inventário a partir da lista de arquivos do ProjetoContextoArquivo. */
export function inventarioDocumentosContextoFromArquivos(arquivos = []) {
  const entregaveis = new Set();
  const outros = [];

  for (const arq of arquivos) {
    const nome = arq?.nomeOriginal || '';
    const letra = extrairLetraEntregavel(nome);
    if (letra) {
      entregaveis.add(letra);
      continue;
    }
    const lower = nome.toLowerCase();
    if (/status[_\s-]*pilotos|plano[_\s-]*ataque|plano[_\s-]*comercial/i.test(lower)) {
      outros.push(nome);
    }
  }

  return {
    entregaveis: [...entregaveis].sort(),
    outros: [...new Set(outros)].sort(),
    temEntregaveisEstendidos: [...entregaveis].some((l) => 'EFGH'.includes(l))
  };
}

export async function carregarInventarioDocumentosContexto(prisma, projetoId) {
  await ensureProjetoContextoSchema(prisma);
  try {
    const arquivos = await prisma.$queryRaw`
      SELECT "nomeOriginal", "descricao"
      FROM "ProjetoContextoArquivo"
      WHERE "projetoId" = ${projetoId}
      ORDER BY "createdAt" ASC
    `;
    return inventarioDocumentosContextoFromArquivos(arquivos);
  } catch (err) {
    console.warn('[projetoContexto] inventário de entregáveis indisponível:', err?.message || err);
    return { entregaveis: [], outros: [], temEntregaveisEstendidos: false };
  }
}

/** Bloco Markdown para injeção no dadosBlock do book SATF. */
export function blocoInventarioDocumentosMarkdown(inventario) {
  if (!inventario?.entregaveis?.length && !inventario?.outros?.length) return '';

  const linhas = [];
  if (inventario.entregaveis.length) {
    linhas.push('### Entregáveis documentados no contexto (A–H)');
    for (const letra of inventario.entregaveis) {
      linhas.push(`- **${ROTULOS_ENTREGAVEL_PROJETO[letra] || `Entregável ${letra}`}** — anexo cadastrado`);
    }
  }
  if (inventario.outros.length) {
    linhas.push('### Outros documentos de escopo');
    for (const nome of inventario.outros) {
      linhas.push(`- ${nome}`);
    }
  }
  linhas.push('');
  linhas.push(
    '> **Regra para a IA:** Cite **todos** os Entregáveis A–H listados acima quando forem relevantes à dimensão. **E–H não podem ser ignorados** se estiverem no contexto — especialmente em D1, D3, D9, D10. Use **exatamente** os rótulos acima (E = Roteiro de Pilotos, H = Diagnóstico de Clientes — não renomeie). Se um entregável não se aplicar à dimensão, escreva explicitamente "Entregável X: não aplicável nesta dimensão".'
  );
  return `## Inventário de documentos do escopo\n\n${linhas.join('\n')}`;
}

/** Instruções por dimensão SATF sobre quais Entregáveis E–H citar. */
export function blocoInstrucoesEntregaveisDimensaoSatf(dimArea, inventario) {
  if (!inventario?.entregaveis?.length) return '';

  const disponiveis = new Set(inventario.entregaveis);
  const prioritarios = (SATF_DIM_ENTREGAVEIS_PRIORITARIOS[dimArea] || ['A', 'B', 'C', 'D']).filter((l) =>
    disponiveis.has(l)
  );
  const estendidos = prioritarios.filter((l) => 'EFGH'.includes(l));
  const listaPrioritarios = prioritarios
    .map((l) => ROTULOS_ENTREGAVEL_PROJETO[l] || `Entregável ${l}`)
    .join('; ');

  let md = `
## ENTREGÁVEIS DO ESCOPO — OBRIGATÓRIO NESTA DIMENSÃO (${dimArea})

Entregáveis **cadastrados** no projeto: ${inventario.entregaveis.join(', ')}.
**Prioritários para ${dimArea}:** ${listaPrioritarios || 'A–D (geral)'}.

**Regras:**
- Cite pelo menos **2 entregáveis diferentes** desta lista em Análise Diagnóstica ou Evidências Críticas (nome + versão/tema quando constar no contexto).
- Em **Recomendações**, cada ação deve referenciar um entregável, sistema ou artefato do contexto (ex.: "derivar do Entregável E — Roteiro de Pilotos").
- **Nomenclatura:** use o rótulo canônico literal — E = Roteiro de Pilotos (não "Mapa de Jornadas"); H = Diagnóstico de Clientes (não "Business Case"); G = Capacitação e Gestão de Mudança (não só "Operação").
`;

  if (estendidos.length) {
    md += `- **Obrigatório nesta dimensão:** inclua pelo menos **um** dos Entregáveis estendidos ${estendidos.join(', ')} (${estendidos.map((l) => ROTULOS_ENTREGAVEL_PROJETO[l]).join('; ')}).\n`;
  }

  if (inventario.temEntregaveisEstendidos && !estendidos.length) {
    md += `- Os Entregáveis E–H existem no projeto; se não forem centrais nesta dimensão, mencione brevemente como dependência ou "não aplicável".\n`;
  }

  md += '\n---\n';
  return md;
}

/**
 * Monta bloco Markdown para injeção nos prompts (book + relatório executivo).
 */
export async function blocoContextoProjetoMarkdown(prisma, projetoId) {
  await ensureProjetoContextoSchema(prisma);

  const ctxRows = await prisma.$queryRaw`
    SELECT "caracteristicas", "urls", "updatedAt" FROM "ProjetoContexto" WHERE "projetoId" = ${projetoId}
  `;
  const arquivos = await prisma.$queryRaw`
    SELECT "nomeOriginal", "descricao", "conteudoExtraido", "mimeType"
    FROM "ProjetoContextoArquivo" WHERE "projetoId" = ${projetoId}
    ORDER BY "createdAt" DESC
  `;

  const reg = ctxRows?.[0];
  const caracteristicas = normalizarCaracteristicas(reg?.caracteristicas || {});
  const urls = normalizarUrls(Array.isArray(reg?.urls) ? reg.urls : []);
  const blocoGlossario = blocoMarkdownGlossarioFatosCanonicos(caracteristicas);
  const temGlossario = Boolean(blocoGlossario);

  const temCarac = CAMPOS_CARACTERISTICAS.some((k) => caracteristicas[k]);
  const temUrls = urls.length > 0;
  const temArquivos = (arquivos || []).length > 0;
  if (!temCarac && !temUrls && !temArquivos && !temGlossario) return '';

  const partes = [];
  partes.push('## Contexto do cliente (material de referência do projeto)');
  partes.push('');
  partes.push(
    '> **Instrução à IA:** Priorize este material para personalizar o relatório. Cite processos, sistemas e iniciativas documentados — **incluindo todos os Entregáveis A–H anexados** (não limite-se a A–D). O que não estiver aqui nem no assessment deve ser marcado como inferência ou "não documentado" — evite texto genérico de mercado.'
  );
  if (temGlossario) {
    partes.push(
      '> **Glossário canônico:** em conflito com anexos, desejos IA ou inferências de setor, **prevalece o glossário de fatos canônicos** abaixo.'
    );
  }
  partes.push('');

  if (blocoGlossario) {
    partes.push(blocoGlossario);
  }

  if (temCarac) {
    partes.push('### Características do projeto');
    for (const k of CAMPOS_CARACTERISTICAS) {
      if (caracteristicas[k]) {
        partes.push(`- **${LABELS_CARACTERISTICAS[k]}:** ${caracteristicas[k]}`);
      }
    }
    partes.push('');
  }

  if (temUrls) {
    partes.push('### URLs de referência');
    for (const u of urls) {
      partes.push(`- **${u.titulo || u.url}:** ${u.url}${u.notas ? ` — ${u.notas}` : ''}`);
    }
    partes.push('');
  }

  if (temArquivos) {
    const docs = (arquivos || []).filter((a) => !isImagemMime(a.mimeType));
    const imagens = (arquivos || []).filter((a) => isImagemMime(a.mimeType));

    if (docs.length > 0) {
      partes.push('### Documentos anexados (trechos extraídos)');
      let budget = MAX_CONTEXTO_BOOK_CHARS - partes.join('\n').length;
      for (const arq of docs) {
        if (budget <= 200) break;
        const titulo = arq.descricao
          ? `${arq.nomeOriginal} — ${arq.descricao}`
          : arq.nomeOriginal;
        partes.push(`#### ${titulo}`);
        if (arq.conteudoExtraido) {
          const trecho = truncar(arq.conteudoExtraido, Math.min(3500, budget - 100));
          partes.push(trecho);
          budget -= trecho.length;
        } else {
          partes.push('_Sem texto extraído deste arquivo._');
        }
        partes.push('');
      }
    }

    if (imagens.length > 0) {
      partes.push('### Imagens de referência (descrição fornecida pelo consultor)');
      partes.push(
        '_As imagens não são enviadas pixel a pixel à IA; use as descrições abaixo como referência visual documentada (arquitetura, mockup, fluxo, organograma etc.)._'
      );
      partes.push('');
      for (const arq of imagens) {
        partes.push(`#### ${arq.nomeOriginal} (imagem)`);
        if (arq.descricao) {
          partes.push(`**Descrição:** ${arq.descricao}`);
        } else {
          partes.push('_Sem descrição cadastrada._');
        }
        partes.push('');
      }
    }
  }

  let bloco = partes.join('\n');
  if (bloco.length > MAX_CONTEXTO_BOOK_CHARS) {
    bloco = truncar(bloco, MAX_CONTEXTO_BOOK_CHARS);
  }
  return bloco;
}

/** Indica se há contexto cadastrado (campos, URLs ou documentos). */
export function projetoTemContextoCadastrado(blocoContextoMarkdown) {
  return Boolean(String(blocoContextoMarkdown || '').trim());
}

/** Regra extra no system prompt do book quando há contexto — reforça Seção 3. */
export function blocoInstrucoesSistemaSecao3ComContexto() {
  return `
15. **Contexto do cliente cadastrado (Seção 3 — CRÍTICO):** quando o bloco "Contexto do cliente" estiver nos DADOS, a Seção 3 deve ser escrita para **este** cliente. **Proibido** texto genérico de mercado ("empresa de tecnologia de médio porte", "fintech típica", "SaaS B2B" etc.) salvo se constar no contexto. Personalize diagnóstico, riscos, recomendações e KPIs com iniciativas, sistemas, pilotos, métricas e público-alvo documentados. **Se o inventário listar Entregáveis E–H, eles devem ser citados** nas dimensões pertinentes (D1, D3, D9, D10 em especial) — não omita documentação de escopo cadastrada. **Se houver glossário de fatos canônicos, ele vence anexos antigos em conflito.**`;
}

/** Carrega regras de glossário/termos proibidos para validação pós-geração e prompts. */
export async function carregarRegrasFatosContextoProjeto(prisma, projetoId) {
  await ensureProjetoContextoSchema(prisma);
  const rows = await prisma.$queryRaw`
    SELECT "caracteristicas", "updatedAt" FROM "ProjetoContexto" WHERE "projetoId" = ${projetoId}
  `;
  const reg = rows?.[0];
  const caracteristicas = normalizarCaracteristicas(reg?.caracteristicas || {});
  return {
    caracteristicas,
    glossario: caracteristicas.glossarioFatosCanonicos,
    termosProibidos: obterTermosProibidos(caracteristicas),
    temGlossario: projetoTemGlossarioFatos(caracteristicas),
    hash: hashContextoFatosBook(caracteristicas, reg?.updatedAt),
    updatedAt: reg?.updatedAt || null
  };
}

export { blocoInstrucoesPrioridadeGlossario } from './projetoContextoFatos.js';

/** Instruções por dimensão na Seção 3 quando há contexto cadastrado. */
export function blocoInstrucoesPromptSecao3Dimensao(dimArea, blocoContextoMarkdown) {
  if (!projetoTemContextoCadastrado(blocoContextoMarkdown)) return '';
  return `
## PERSONALIZAÇÃO OBRIGATÓRIA — CONTEXTO DO PROJETO

Este projeto tem **contexto cadastrado** (bloco abaixo). Dimensão atual: **${dimArea}**.

**Proibido neste bloco:**
- Parágrafos intercambiáveis com qualquer empresa do setor
- Usar "empresa de tecnologia de médio porte" / "organização de médio porte" como sujeito principal
- Exemplos de SaaS, fintech ou varejo que não estejam no contexto

**Obrigatório em cada subseção:**
- **Análise diagnóstica:** cite ≥2 fatos concretos do contexto (iniciativas, sistemas, fábricas, pilotos, métricas dos documentos) ligados a ${dimArea}
- **Entregáveis A–H:** se constarem no inventário ou nos anexos, cite os pertinentes a ${dimArea} — **incluindo E–H** (Roteiro de Pilotos, GTM, Capacitação, Diagnóstico de Clientes) quando cadastrados; não limite-se a A–D. Use **rótulos canônicos** (E ≠ Mapa de Jornadas; H ≠ Business Case).
- **Risco de negócio:** risco para a operação/iniciativa documentada no contexto
- **Recomendações:** cada ação referencia processo, squad, sistema ou entregável do contexto (A–H)
- **Benchmark:** compare com o estado descrito no contexto, não só "média do setor" genérica
- **KPIs:** baseline/meta alinhados a métricas do contexto quando existirem

Se faltar dado, escreva "não documentado no contexto do projeto" — não preencha com clichê de mercado.

---
`;
}

/** Regra no system prompt do relatório executivo quando há contexto. */
export function blocoInstrucoesSistemaExecutivoComContexto() {
  return `
9. **Contexto do cliente cadastrado:** use o bloco "Contexto do cliente" nos dados. Seções 2 e 4 devem citar iniciativas, sistemas, pilotos e público documentados — evite diagnóstico e ações genéricas de setor.`;
}

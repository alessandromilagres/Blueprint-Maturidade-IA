import { promises as fs } from 'fs';
import path from 'path';

export const EMPRESA_LOGO_MAX_BYTES = 2 * 1024 * 1024;

export const EMPRESA_LOGO_TIPOS = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg'
};

const EXT_PARA_MIME = Object.fromEntries(
  Object.entries(EMPRESA_LOGO_TIPOS).map(([mime, ext]) => [ext, mime])
);

export function uploadsRootDir() {
  return path.join(process.cwd(), 'uploads');
}

export function diretorioLogoEmpresa(empresaId) {
  return path.join(uploadsRootDir(), 'empresas', String(empresaId));
}

export function resolverMimeLogo(nomeOriginal, mimeDeclarado) {
  const ext = path.extname(String(nomeOriginal || '')).toLowerCase();
  const porExt = EXT_PARA_MIME[ext];
  if (porExt) return porExt;
  const raw = String(mimeDeclarado || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (raw && EMPRESA_LOGO_TIPOS[raw]) return raw;
  return '';
}

export function empresaTemLogo(empresa) {
  if (empresa?.logoPath) return true;
  const id = Number(empresa?.id);
  return Number.isFinite(id) && id > 0 ? null : false;
}

/** Verifica logo no disco (fonte de verdade quando logoPath no DB não está disponível). */
export async function empresaTemLogoArquivo(empresaId) {
  const id = Number(empresaId);
  if (!Number.isFinite(id) || id <= 0) return false;
  try {
    const files = await fs.readdir(diretorioLogoEmpresa(id));
    return files.some((f) => /^logo\.(png|jpe?g|webp|svg)$/i.test(f));
  } catch {
    return false;
  }
}

export async function resolverLogoEmpresa(empresa) {
  if (!empresa) return { ...metaLogoEmpresaRelatorio(null), empresaLogoDisponivel: false };
  let disponivel = Boolean(empresa.logoPath);
  if (!disponivel && empresa.id) {
    disponivel = await empresaTemLogoArquivo(empresa.id);
  }
  return {
    empresaId: Number(empresa.id) || null,
    empresaLogoDisponivel: disponivel
  };
}

export function metaLogoEmpresaRelatorio(empresa) {
  const id = Number(empresa?.id);
  return {
    empresaId: Number.isFinite(id) && id > 0 ? id : null,
    empresaLogoDisponivel: Boolean(empresa?.logoPath)
  };
}

export async function enriquecerEmpresasComLogo(empresas) {
  if (!Array.isArray(empresas)) return empresas;
  return Promise.all(
    empresas.map(async (empresa) => {
      const logo = await resolverLogoEmpresa(empresa);
      return { ...empresa, ...logo };
    })
  );
}

export async function enriquecerEmpresaComLogo(empresa) {
  if (!empresa) return empresa;
  const logo = await resolverLogoEmpresa(empresa);
  return { ...empresa, ...logo };
}

export async function enriquecerDadosUsadosComLogo(dadosUsados, empresa) {
  if (!dadosUsados || typeof dadosUsados !== 'object') return dadosUsados;
  const logo = await resolverLogoEmpresa(empresa);
  return { ...dadosUsados, ...logo };
}

export async function garantirDirLogoEmpresa(empresaId) {
  const dir = diretorioLogoEmpresa(empresaId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function removerArquivosLogoEmpresa(empresaId) {
  const dir = diretorioLogoEmpresa(empresaId);
  try {
    const files = await fs.readdir(dir);
    await Promise.all(files.map((f) => fs.unlink(path.join(dir, f)).catch(() => {})));
    await fs.rmdir(dir).catch(() => {});
  } catch {
    /* diretório inexistente */
  }
}

export async function salvarLogoEmpresa(empresaId, buffer, mimeType, nomeOriginal) {
  const mime = resolverMimeLogo(nomeOriginal, mimeType);
  if (!mime) {
    throw new Error('Formato não suportado. Use PNG, JPEG, WebP ou SVG.');
  }
  if (!buffer?.length || buffer.length > EMPRESA_LOGO_MAX_BYTES) {
    throw new Error('Arquivo inválido ou maior que 2 MB.');
  }

  const ext = EMPRESA_LOGO_TIPOS[mime];
  await removerArquivosLogoEmpresa(empresaId);
  const dir = await garantirDirLogoEmpresa(empresaId);
  const filename = `logo${ext}`;
  const abs = path.join(dir, filename);
  await fs.writeFile(abs, buffer);

  const rel = path.join('empresas', String(empresaId), filename).replace(/\\/g, '/');
  return rel;
}

export function caminhoAbsolutoLogo(logoPath) {
  if (!logoPath || typeof logoPath !== 'string') return null;
  const normalized = logoPath.replace(/\\/g, '/');
  if (normalized.includes('..')) return null;
  return path.join(uploadsRootDir(), normalized);
}

export async function lerLogoEmpresa(logoPath) {
  const abs = caminhoAbsolutoLogo(logoPath);
  if (!abs) return null;
  try {
    const buffer = await fs.readFile(abs);
    const ext = path.extname(abs).toLowerCase();
    const mime = EXT_PARA_MIME[ext] || 'application/octet-stream';
    return { buffer, mime, abs };
  } catch {
    return null;
  }
}

export async function lerLogoEmpresaPorId(empresaId, logoPathHint = null) {
  const id = Number(empresaId);
  if (!Number.isFinite(id) || id <= 0) return null;

  if (logoPathHint) {
    const fromPath = await lerLogoEmpresa(logoPathHint);
    if (fromPath) return fromPath;
  }

  try {
    const dir = diretorioLogoEmpresa(id);
    const files = await fs.readdir(dir);
    const match = files.find((f) => /^logo\.(png|jpe?g|webp|svg)$/i.test(f));
    if (!match) return null;
    const abs = path.join(dir, match);
    const buffer = await fs.readFile(abs);
    const ext = path.extname(match).toLowerCase();
    const mime = EXT_PARA_MIME[ext] || 'application/octet-stream';
    return { buffer, mime, abs };
  } catch {
    return null;
  }
}

export async function removerLogoEmpresaRegistro(prisma, empresaId) {
  await removerArquivosLogoEmpresa(empresaId);
  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { logoPath: true }
    });
    if (empresa?.logoPath) {
      await prisma.empresa.update({
        where: { id: empresaId },
        data: { logoPath: null }
      });
    }
  } catch {
    /* coluna logoPath pode não existir no ambiente */
  }
}

/** null = ainda não sondado; após probe, true/false */
let empresaLogoPathColunaPresente = null;

export async function probeEmpresaLogoPathColumn(prisma) {
  if (empresaLogoPathColunaPresente !== null) return empresaLogoPathColunaPresente;
  try {
    await prisma.$queryRawUnsafe('SELECT "logoPath" FROM "Empresa" WHERE 1 = 0');
    empresaLogoPathColunaPresente = true;
  } catch {
    empresaLogoPathColunaPresente = false;
  }
  return empresaLogoPathColunaPresente;
}

export function isEmpresaLogoPathColumnPresent() {
  return empresaLogoPathColunaPresente === true;
}

const EMPRESA_SELECT_BASE = {
  id: true,
  nome: true,
  cnpj: true,
  setor: true,
  porte: true,
  telefone: true,
  email: true,
  endereco: true,
  website: true,
  createdAt: true,
  updatedAt: true
};

/** Select de Empresa que não quebra quando logoPath ainda não foi migrado. */
export function empresaSelectSeguro() {
  const sel = { ...EMPRESA_SELECT_BASE };
  if (empresaLogoPathColunaPresente) sel.logoPath = true;
  return sel;
}

export function empresaIncludeSeguro() {
  return { empresa: { select: empresaSelectSeguro() } };
}

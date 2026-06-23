import express from 'express';
import { prisma } from '../lib/prisma.js';
import {
  EMPRESA_LOGO_MAX_BYTES,
  salvarLogoEmpresa,
  lerLogoEmpresaPorId,
  removerLogoEmpresaRegistro,
  empresaTemLogoArquivo
} from '../utils/empresaLogo.js';

const router = express.Router();

function usuarioPodeGerirEmpresa(usuario, empresaId) {
  if (!usuario) return false;
  const r = String(usuario.role || '').trim().toLowerCase();
  if (r === 'admin') return true;
  return Number(usuario.empresaId) === Number(empresaId);
}

function parseEmpresaId(param) {
  const id = parseInt(String(param), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

router.get('/:id/logo', async (req, res) => {
  try {
    const empresaId = parseEmpresaId(req.params.id);
    if (!empresaId) return res.status(400).json({ error: 'ID inválido' });

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true, logoPath: true }
    }).catch(async () => {
      const base = await prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { id: true }
      });
      return base ? { ...base, logoPath: null } : null;
    });
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });

    const temArquivo = await empresaTemLogoArquivo(empresaId);
    if (!empresa.logoPath && !temArquivo) {
      return res.status(404).json({ error: 'Logo não cadastrado' });
    }

    const arquivo = await lerLogoEmpresaPorId(empresaId, empresa.logoPath);
    if (!arquivo) {
      return res.status(404).json({ error: 'Arquivo de logo não encontrado' });
    }

    res.setHeader('Content-Type', arquivo.mime);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(arquivo.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  '/:id/logo',
  express.raw({ type: '*/*', limit: EMPRESA_LOGO_MAX_BYTES }),
  async (req, res) => {
    try {
      const empresaId = parseEmpresaId(req.params.id);
      if (!empresaId) return res.status(400).json({ error: 'ID inválido' });

      if (!usuarioPodeGerirEmpresa(req.usuario, empresaId)) {
        return res.status(403).json({ error: 'Sem permissão para alterar o logo desta empresa.' });
      }

      const existente = await prisma.empresa.findUnique({ where: { id: empresaId } });
      if (!existente) return res.status(404).json({ error: 'Empresa não encontrada' });

      const nome = req.headers['x-filename'] || req.headers['x-file-name'] || 'logo.png';
      const mime = req.headers['content-type'] || 'application/octet-stream';
      const logoPath = await salvarLogoEmpresa(empresaId, req.body, mime, nome);

      let empresa;
      try {
        empresa = await prisma.empresa.update({
          where: { id: empresaId },
          data: { logoPath }
        });
      } catch {
        empresa = { id: empresaId, logoPath };
      }

      res.json({
        id: empresa.id,
        logoPath: empresa.logoPath,
        empresaLogoDisponivel: true
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.delete('/:id/logo', async (req, res) => {
  try {
    const empresaId = parseEmpresaId(req.params.id);
    if (!empresaId) return res.status(400).json({ error: 'ID inválido' });

    if (!usuarioPodeGerirEmpresa(req.usuario, empresaId)) {
      return res.status(403).json({ error: 'Sem permissão para remover o logo desta empresa.' });
    }

    await removerLogoEmpresaRegistro(prisma, empresaId);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

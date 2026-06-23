import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma, refreshUsuarioNivelPrioridadeColumnFlag, usuarioCreateCompat } from '../lib/prisma.js';
import { generateToken, authMiddleware } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { authSchemas } from '../validators/schemas.js';
import { empresaIncludeSeguro, probeEmpresaLogoPathColumn } from '../utils/empresaLogo.js';

const router = express.Router();

router.post('/login', validate(authSchemas.login), async (req, res) => {
  try {
    const { email, senha } = req.body;

    await probeEmpresaLogoPathColumn(prisma);
    
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: empresaIncludeSeguro()
    });
    
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Usuário desativado' });
    }
    
    if (!usuario.senha) {
      return res.status(401).json({ error: 'Usuário não possui senha cadastrada. Contate o administrador.' });
    }
    
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = generateToken(usuario);
    
    const { senha: _, ...usuarioSemSenha } = usuario;
    
    res.json({
      token,
      usuario: usuarioSemSenha
    });
  } catch (error) {
    console.error('Erro no login:', error);
    const msg = String(error?.message || error || '');
    const code = error?.code;
    const isDbUnavailable =
      code === 'P1001' ||
      code === 'P1000' ||
      /Can't reach database server|server has closed the connection|ECONNREFUSED|ETIMEDOUT/i.test(
        msg
      );
    if (isDbUnavailable) {
      return res.status(503).json({
        error:
          'Serviço de dados indisponível. Verifique se o PostgreSQL está no ar e se DATABASE_URL está correta no backend.'
      });
    }
    res.status(500).json({
      error: 'Erro interno no servidor',
      ...(process.env.NODE_ENV !== 'production' && { details: msg })
    });
  }
});

router.post('/registro', validate(authSchemas.registro), async (req, res) => {
  try {
    await refreshUsuarioNivelPrioridadeColumnFlag();
    const { nome, email, senha, cargo, telefone, empresaId } = req.body;
    
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email }
    });
    
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }
    
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId }
    });
    
    if (!empresa) {
      return res.status(400).json({ error: 'Empresa não encontrada' });
    }
    
    const senhaCriptografada = await bcrypt.hash(senha, 10);
    
    const usuario = await usuarioCreateCompat({
      data: {
        nome,
        email,
        senha: senhaCriptografada,
        cargo,
        telefone,
        empresaId,
        role: 'avaliador'
      },
      include: empresaIncludeSeguro()
    });
    
    const token = generateToken(usuario);
    
    const { senha: _, ...usuarioSemSenha } = usuario;
    
    res.status(201).json({
      token,
      usuario: usuarioSemSenha
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { senha: _, ...usuarioSemSenha } = req.usuario;
    res.json(usuarioSemSenha);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

router.put('/alterar-senha', authMiddleware, validate(authSchemas.alterarSenha), async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuarioId }
    });
    
    if (!usuario.senha) {
      return res.status(400).json({ error: 'Usuário não possui senha cadastrada' });
    }
    
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
    
    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }
    
    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);
    
    await prisma.usuario.update({
      where: { id: req.usuarioId },
      data: { senha: senhaCriptografada }
    });
    
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

router.put('/definir-senha/:id', authMiddleware, validate(authSchemas.definirSenha), async (req, res) => {
  try {
    if (req.usuario.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem definir senhas' });
    }
    
    const { novaSenha } = req.body;
    const usuarioId = parseInt(req.params.id);
    
    if (isNaN(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({ error: 'ID de usuário inválido' });
    }
    
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);
    
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { senha: senhaCriptografada }
    });
    
    res.json({ message: 'Senha definida com sucesso' });
  } catch (error) {
    console.error('Erro ao definir senha:', error);
    res.status(500).json({ error: 'Erro ao definir senha' });
  }
});

export default router;

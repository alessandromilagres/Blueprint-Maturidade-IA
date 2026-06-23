import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { empresaIncludeSeguro, probeEmpresaLogoPathColumn } from '../utils/empresaLogo.js';
const JWT_SECRET = process.env.JWT_SECRET || 'blueprint-ia-secret-key-change-in-production';

export function generateToken(usuario) {
  return jwt.sign(
    { 
      id: usuario.id, 
      email: usuario.email, 
      role: usuario.role,
      empresaId: usuario.empresaId 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Token mal formatado' });
    }
    
    const [scheme, token] = parts;
    
    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: 'Token mal formatado' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    await probeEmpresaLogoPathColumn(prisma);
    
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      include: empresaIncludeSeguro()
    });
    
    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Usuário desativado' });
    }
    
    req.usuario = usuario;
    req.usuarioId = usuario.id;
    req.empresaId = usuario.empresaId;
    req.role = usuario.role;
    
    return next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ error: 'Erro interno de autenticação' });
  }
}

export function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    if (!allowedRoles.includes(req.usuario.role)) {
      return res.status(403).json({ error: 'Acesso não autorizado para este perfil' });
    }
    
    return next();
  };
}

export { JWT_SECRET };

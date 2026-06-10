import { ZodError } from 'zod';

export function validate(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      const dataToValidate = source === 'body' ? req.body 
                           : source === 'query' ? req.query 
                           : source === 'params' ? req.params 
                           : req.body;
      
      const validatedData = await schema.parseAsync(dataToValidate);
      
      if (source === 'body') {
        req.body = validatedData;
      } else if (source === 'query') {
        req.validatedQuery = validatedData;
      } else if (source === 'params') {
        req.validatedParams = validatedData;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError && error.errors) {
        const errors = error.errors.map(err => ({
          campo: err.path.join('.'),
          mensagem: err.message
        }));
        
        return res.status(400).json({
          error: 'Dados inválidos',
          detalhes: errors
        });
      }
      
      if (error && error.issues) {
        const errors = error.issues.map(err => ({
          campo: err.path ? err.path.join('.') : 'campo',
          mensagem: err.message
        }));
        
        return res.status(400).json({
          error: 'Dados inválidos',
          detalhes: errors
        });
      }
      
      console.error('Erro de validação:', error);
      return res.status(500).json({ error: 'Erro interno de validação' });
    }
  };
}

export function validateParams(schema) {
  return validate(schema, 'params');
}

export function validateQuery(schema) {
  return validate(schema, 'query');
}

export function validateBody(schema) {
  return validate(schema, 'body');
}

/** Senhas não devem passar por remoção de `<>` etc., senão o login/registro falham de forma opaca. */
const CAMPOS_SENHA = new Set([
  'senha',
  'senhaAtual',
  'novaSenha',
  'password',
  'currentPassword',
  'newPassword'
]);

/** HTML intencional (ex.: template de e-mail); remover `<>` quebraria o documento. */
const CAMPOS_PRESERVAR_TAGS_HTML = new Set(['templateHtml']);

export function sanitizeInput(obj, fieldName = null) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Campos que podem ser grandes (base64, conteúdo de documentos)
    const camposGrandes = ['arquivo', 'conteudo', 'conteudoExtraido', 'base64'];
    const limiteCaracteres = camposGrandes.includes(fieldName) ? 50000000 : 10000;
    const trimmed = obj.trim().slice(0, limiteCaracteres);
    if (fieldName && CAMPOS_SENHA.has(fieldName)) {
      return trimmed;
    }
    if (fieldName && CAMPOS_PRESERVAR_TAGS_HTML.has(fieldName)) {
      const limiteHtml = 400000;
      return obj.trim().slice(0, limiteHtml);
    }
    return trimmed
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeInput(item, fieldName));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = key.replace(/[<>$]/g, '').slice(0, 100);
      // JSON estruturado do bloco opcional Desejos IA — não sanitizar strings internas (perde "<", etc.)
      if (sanitizedKey === 'desejosIA' && value !== null && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[sanitizedKey] = value;
        continue;
      }
      sanitized[sanitizedKey] = sanitizeInput(value, key);
    }
    return sanitized;
  }
  
  return obj;
}

export function globalSanitizer(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeInput(req.query);
  }
  next();
}

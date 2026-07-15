import express from 'express';
import { prisma, isUsuarioEmpresaUnidadeColumnPresentInDb } from '../lib/prisma.js';
import {
  garantirUnidadeGeralEmpresa,
  mapUnidadeEmpresaResponse,
  normalizarCodigoUnidade,
  serializarDimensoesFocoSatf,
  serializarDimensoesFocoMit,
  serializarDimensoesPapelSatf,
  serializarDimensoesPapelMit,
  normalizarModeloOperacional,
  UNIDADE_GERAL_CODIGO
} from '../utils/empresaUnidade.js';
import {
  serializarTraducaoDimensoes,
  listarDefaultsTraducaoPorModelo,
  normalizarModeloOperacional as normModeloLib
} from '../utils/bibliotecaTraducaoDimensoes.js';

const router = express.Router({ mergeParams: true });

function parseEmpresaId(req) {
  const id = parseInt(String(req.params.empresaId || req.params.id), 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function requireGestao(req, res, next) {
  if (!req.usuario) return res.status(401).json({ error: 'Não autenticado' });
  const role = String(req.usuario.role || '').toLowerCase();
  if (!['admin', 'gestor', 'sysmap'].includes(role)) {
    return res.status(403).json({ error: 'Acesso não autorizado' });
  }
  return next();
}

function sanitizarPayloadUnidade(body, { parcial = false, ehPadrao = false } = {}) {
  const erros = [];
  const data = {};

  if (!parcial || body.nome !== undefined) {
    const nome = String(body.nome || '').trim();
    if (!nome) erros.push('nome é obrigatório');
    else data.nome = nome.slice(0, 120);
  }

  if (body.codigo !== undefined || body.nome !== undefined) {
    const codigo = normalizarCodigoUnidade(body.codigo, body.nome || data.nome);
    if (ehPadrao) data.codigo = UNIDADE_GERAL_CODIGO;
    else if (codigo === UNIDADE_GERAL_CODIGO) {
      erros.push('codigo GERAL é reservado para a unidade padrão');
    } else data.codigo = codigo;
  }

  if (body.descricao !== undefined) {
    const d = String(body.descricao || '').trim();
    data.descricao = d ? d.slice(0, 2000) : null;
  }

  if (body.dimensoesFocoSatf !== undefined) {
    data.dimensoesFocoSatf = serializarDimensoesFocoSatf(body.dimensoesFocoSatf);
  }
  if (body.dimensoesFocoMit !== undefined) {
    data.dimensoesFocoMit = serializarDimensoesFocoMit(body.dimensoesFocoMit);
  }
  if (body.dimensoesPapelSatf !== undefined) {
    data.dimensoesPapelSatf = serializarDimensoesPapelSatf(body.dimensoesPapelSatf);
  }
  if (body.dimensoesPapelMit !== undefined) {
    data.dimensoesPapelMit = serializarDimensoesPapelMit(body.dimensoesPapelMit);
  }
  if (body.dimensoesFoco !== undefined) {
    data.dimensoesFoco = serializarDimensoesFocoSatf(body.dimensoesFoco);
  }

  if (body.modeloOperacional !== undefined) {
    if (body.modeloOperacional == null || body.modeloOperacional === '') {
      data.modeloOperacional = null;
    } else {
      const modelo = normalizarModeloOperacional(body.modeloOperacional);
      if (!modelo) {
        erros.push('modeloOperacional inválido (use delivery, sustentacao, coe ou vazio)');
      } else {
        data.modeloOperacional = modelo;
      }
    }
  }

  if (body.traducaoDimensoes !== undefined) {
    if (body.traducaoDimensoes == null || body.traducaoDimensoes === '') {
      data.traducaoDimensoes = null;
    } else {
      const serializado = serializarTraducaoDimensoes(body.traducaoDimensoes);
      if (!serializado && body.traducaoDimensoes != null) {
        // objeto vazio após normalizar = limpar
        data.traducaoDimensoes = null;
      } else {
        data.traducaoDimensoes = serializado;
      }
    }
  }

  if (body.ordem !== undefined) {
    const n = parseInt(body.ordem, 10);
    data.ordem = Number.isFinite(n) ? n : 0;
  }

  if (body.ativo !== undefined) {
    data.ativo = body.ativo !== false;
  }

  return { erros, data };
}

/** Defaults de tradução do produto por modelo — para o cadastro montar/editar overrides. */
router.get('/traducao-defaults', async (req, res) => {
  try {
    const modelo = normModeloLib(req.query.modelo);
    if (!modelo) {
      return res.status(400).json({
        error: 'Informe ?modelo=delivery|sustentacao|coe'
      });
    }
    res.json({
      modelo,
      dimensoes: listarDefaultsTraducaoPorModelo(modelo)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const empresaId = parseEmpresaId(req);
    if (!empresaId) return res.status(400).json({ error: 'empresaId inválido' });

    await garantirUnidadeGeralEmpresa(empresaId);

    const unidades = await prisma.unidadeEmpresa.findMany({
      where: { empresaId },
      orderBy: [{ ehPadrao: 'desc' }, { ordem: 'asc' }, { nome: 'asc' }],
      ...(isUsuarioEmpresaUnidadeColumnPresentInDb()
        ? { include: { _count: { select: { usuarios: true } } } }
        : {})
    });

    res.json(unidades.map(mapUnidadeEmpresaResponse));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireGestao, async (req, res) => {
  try {
    const empresaId = parseEmpresaId(req);
    if (!empresaId) return res.status(400).json({ error: 'empresaId inválido' });

    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });

    const { erros, data } = sanitizarPayloadUnidade(req.body);
    if (erros.length) return res.status(400).json({ error: erros.join('; ') });

    const unidade = await prisma.unidadeEmpresa.create({
      data: {
        empresaId,
        nome: data.nome,
        codigo: data.codigo || normalizarCodigoUnidade(null, data.nome),
        descricao: data.descricao ?? null,
        dimensoesFocoSatf: data.dimensoesFocoSatf ?? null,
        dimensoesFocoMit: data.dimensoesFocoMit ?? null,
        dimensoesPapelSatf: data.dimensoesPapelSatf ?? null,
        dimensoesPapelMit: data.dimensoesPapelMit ?? null,
        dimensoesFoco: data.dimensoesFoco ?? null,
        modeloOperacional: data.modeloOperacional ?? null,
        traducaoDimensoes: data.traducaoDimensoes ?? null,
        ehPadrao: false,
        ordem: data.ordem ?? 0,
        ativo: data.ativo !== false
      }
    });

    res.status(201).json(mapUnidadeEmpresaResponse(unidade));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Já existe unidade com este código nesta empresa' });
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/:unidadeId', requireGestao, async (req, res) => {
  try {
    const empresaId = parseEmpresaId(req);
    const unidadeId = parseInt(req.params.unidadeId, 10);
    if (!empresaId || !Number.isFinite(unidadeId) || unidadeId <= 0) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    const atual = await prisma.unidadeEmpresa.findFirst({
      where: { id: unidadeId, empresaId }
    });
    if (!atual) return res.status(404).json({ error: 'Unidade não encontrada' });

    const { erros, data } = sanitizarPayloadUnidade(req.body, {
      parcial: true,
      ehPadrao: atual.ehPadrao
    });
    if (erros.length) return res.status(400).json({ error: erros.join('; ') });

    if (atual.ehPadrao) {
      delete data.codigo;
      if (data.nome !== undefined && String(data.nome).trim() !== atual.nome) {
        data.nome = atual.nome;
      }
      if (data.ativo === false) {
        return res.status(400).json({ error: 'A unidade Geral não pode ser desativada' });
      }
    }

    const unidade = await prisma.unidadeEmpresa.update({
      where: { id: unidadeId },
      data
    });

    res.json(mapUnidadeEmpresaResponse(unidade));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Já existe unidade com este código nesta empresa' });
    }
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:unidadeId', requireGestao, async (req, res) => {
  try {
    const empresaId = parseEmpresaId(req);
    const unidadeId = parseInt(req.params.unidadeId, 10);
    if (!empresaId || !Number.isFinite(unidadeId) || unidadeId <= 0) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    const unidade = await prisma.unidadeEmpresa.findFirst({
      where: { id: unidadeId, empresaId },
      ...(isUsuarioEmpresaUnidadeColumnPresentInDb()
        ? { include: { _count: { select: { usuarios: true } } } }
        : {})
    });
    if (!unidade) return res.status(404).json({ error: 'Unidade não encontrada' });
    if (unidade.ehPadrao) {
      return res.status(400).json({ error: 'A unidade Geral não pode ser excluída' });
    }

    const geral = await garantirUnidadeGeralEmpresa(empresaId);

    const qtdUsuarios = unidade._count?.usuarios ?? 0;
    if (qtdUsuarios > 0 && geral && isUsuarioEmpresaUnidadeColumnPresentInDb()) {
      await prisma.usuario.updateMany({
        where: { empresaUnidadeId: unidadeId },
        data: { empresaUnidadeId: geral.id }
      });
    }

    await prisma.unidadeEmpresa.delete({ where: { id: unidadeId } });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

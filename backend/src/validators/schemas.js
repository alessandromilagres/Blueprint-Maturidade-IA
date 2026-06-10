import { z } from 'zod';
import { ROLES_USUARIO } from '../constants/userRoles.js';

const emptyToNull = (v) => (v === '' || v === undefined ? null : v);

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 10000);
};

const safeString = (minLength = 0, maxLength = 255) => 
  z.string()
    .min(minLength, minLength > 0 ? `Deve ter pelo menos ${minLength} caracteres` : undefined)
    .max(maxLength, `Deve ter no máximo ${maxLength} caracteres`)
    .transform(sanitizeString);

const safeText = (minLength = 0, maxLength = 5000) => 
  z.string()
    .min(minLength, minLength > 0 ? `Deve ter pelo menos ${minLength} caracteres` : undefined)
    .max(maxLength, `Deve ter no máximo ${maxLength} caracteres`)
    .transform(sanitizeString);

const optionalString = (maxLength = 255) =>
  z.preprocess(
    emptyToNull,
    z.string().max(maxLength).transform(sanitizeString).nullable()
  );

const emailSchema = z.string()
  .email('Email inválido')
  .max(255)
  .transform(s => s.toLowerCase().trim());

const optionalEmail = z.preprocess(
  emptyToNull,
  z.string().email('Email inválido').max(255).transform(s => s?.toLowerCase().trim()).nullable()
);

const senhaSchema = z.string()
  .min(6, 'A senha deve ter pelo menos 6 caracteres')
  .max(100, 'Senha muito longa');

const idParam = z.object({
  id: z.string().regex(/^\d+$/, 'ID inválido').transform(Number)
});

const cnpjSchema = z.preprocess(
  emptyToNull,
  z.string().max(20).nullable()
);

const telefoneSchema = z.preprocess(
  emptyToNull,
  z.string().max(20).transform(v => v ? v.replace(/[^\d\s\-\(\)\+]/g, '').slice(0, 20) : v).nullable()
);

const optionalPorte = z.preprocess(
  emptyToNull,
  z.enum(['Micro', 'Pequena', 'Média', 'Grande']).nullable()
);

const optionalUrl = z.preprocess(
  emptyToNull,
  z.string().max(500).url('URL inválida').nullable().or(z.literal('').transform(() => null))
);

export const empresaSchemas = {
  criar: z.object({
    nome: safeString(2, 200),
    cnpj: cnpjSchema.optional(),
    setor: optionalString(100).optional(),
    porte: optionalPorte.optional(),
    telefone: telefoneSchema.optional(),
    email: optionalEmail.optional(),
    endereco: optionalString(500).optional(),
    website: optionalUrl.optional()
  }),
  
  atualizar: z.object({
    nome: safeString(2, 200).optional(),
    cnpj: cnpjSchema.optional(),
    setor: optionalString(100).optional(),
    porte: optionalPorte.optional(),
    telefone: telefoneSchema.optional(),
    email: optionalEmail.optional(),
    endereco: optionalString(500).optional(),
    website: optionalUrl.optional()
  })
};

export const usuarioSchemas = {
  criar: z.object({
    nome: safeString(2, 200),
    email: emailSchema,
    senha: senhaSchema.optional(),
    cargo: safeString(0, 100).optional().nullable(),
    telefone: telefoneSchema,
    empresaId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
    role: z.enum(ROLES_USUARIO).default('avaliador'),
    ativo: z.boolean().default(true),
    nivelPrioridadeMapeamentoMaturidade: z.coerce.number().int().min(1).max(3).optional().default(1)
  }),

  atualizar: z.object({
    nome: safeString(2, 200).optional(),
    email: emailSchema.optional(),
    cargo: safeString(0, 100).optional().nullable(),
    telefone: telefoneSchema.optional(),
    empresaId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    role: z.enum(ROLES_USUARIO).optional(),
    ativo: z.boolean().optional(),
    nivelPrioridadeMapeamentoMaturidade: z.coerce.number().int().min(1).max(3).optional()
  })
};

const optionalFaturamento = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : v),
  z
    .union([
      z.number().nonnegative(),
      z.string().regex(/^\d+(\.\d+)?$/).transform(Number)
    ])
    .nullable()
    .optional()
);

export const projetoSchemas = {
  criar: z.object({
    nome: safeString(2, 200),
    descricao: safeText(0, 2000).optional().nullable(),
    vertical: safeString(0, 100).optional().nullable(),
    audienciaPrimaria: safeString(0, 500).optional().nullable(),
    lentesPrioritarias: safeString(0, 1000).optional().nullable(),
    faturamentoAnualProjeto: optionalFaturamento,
    status: z.enum(['ativo', 'inativo', 'concluido']).default('ativo'),
    empresaId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)])
  }),
  
  atualizar: z.object({
    nome: safeString(2, 200).optional(),
    descricao: safeText(0, 2000).optional().nullable(),
    vertical: safeString(0, 100).optional().nullable(),
    audienciaPrimaria: safeString(0, 500).optional().nullable(),
    lentesPrioritarias: safeString(0, 1000).optional().nullable(),
    faturamentoAnualProjeto: optionalFaturamento,
    status: z.enum(['ativo', 'inativo', 'concluido']).optional(),
    empresaId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).optional()
  })
};

const optionalNumber = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : v),
  z.union([z.number().nonnegative(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).nullable()
);

const optionalDate = z.preprocess(
  emptyToNull,
  z.string().nullable()
);

const optionalId = z.preprocess(
  emptyToNull,
  z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]).nullable()
);

/** Fase A — idealização / sprint (Singularity-style compact); merge no PUT */
const idealizacaoProdutoSchema = z
  .object({
    statusIdealizacao: z.enum(['em_andamento', 'concluida']).optional().nullable(),
    problemaContexto: z.string().max(20000).optional().nullable(),
    metricaSucesso: z.string().max(20000).optional().nullable(),
    restricoesPremissas: z.string().max(20000).optional().nullable(),
    mapaJornada: z.string().max(20000).optional().nullable(),
    comoPoderiamos: z.string().max(20000).optional().nullable(),
    ideiasPriorizadas: z.string().max(20000).optional().nullable(),
    solucaoEscolhida: z.string().max(20000).optional().nullable(),
    prototipoLinks: z.string().max(20000).optional().nullable(),
    hipoteseExperimento: z.string().max(20000).optional().nullable(),
    planoValidacao: z.string().max(20000).optional().nullable(),
    decisoesRegistradas: z.string().max(20000).optional().nullable(),
    observacoesGerais: z.string().max(20000).optional().nullable()
  })
  .passthrough()
  .optional()
  .nullable();

const informacoesAdicionaisEspecificacaoSchema = z
  .object({
    requisitosAdicionais: z.string().max(20000).optional().nullable(),
    requisitosFuncionais: z.string().max(20000).optional().nullable(),
    fluxosWorkflow: z.string().max(20000).optional().nullable(),
    observacoesGeraisFase1: z.string().max(20000).optional().nullable(),
    requisitosNaoFuncionais: z.string().max(20000).optional().nullable(),
    observacoesGeraisFase2: z.string().max(20000).optional().nullable(),
    integracoes: z.string().max(20000).optional().nullable(),
    restricoes: z.string().max(20000).optional().nullable(),
    observacoes: z.string().max(20000).optional().nullable(),
    _workflow: z.record(z.string(), z.unknown()).optional().nullable()
  })
  .passthrough()
  .optional()
  .nullable();

export const produtoSchemas = {
  criar: z.object({
    nome: safeString(2, 200),
    descricao: optionalString(5000).optional(),
    projetoId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
    verticalId: optionalId.optional(),
    // Campos descritivos (limite de 5000 caracteres)
    problemaResolve: optionalString(5000).optional(),
    publicoAlvo: optionalString(5000).optional(),
    tecnologias: optionalString(5000).optional(),
    faseAtual: z.preprocess(
      (v) => (v === '' || v === undefined || v === null ? 'ideia' : v),
      z.enum(['ideia', 'mvp', 'piloto', 'producao'])
    ),
    complexidade: z.preprocess(
      (v) => (v === '' || v === undefined || v === null ? 'media' : v),
      z.enum(['baixa', 'media', 'alta'])
    ),
    diferencialCompetitivo: optionalString(5000).optional(),
    principaisRiscos: optionalString(5000).optional(),
    dependenciasExternas: optionalString(5000).optional(),
    // Métricas de sucesso
    metricaPrincipal: optionalString(5000).optional(),
    baselineAtual: optionalString(5000).optional(),
    metaEsperada: optionalString(5000).optional(),
    prazoMeta: optionalDate.optional(),
    // Campos financeiros e produtividade
    custoHoraHomem: optionalNumber.optional(),
    produtividadeTradicional: optionalNumber.optional(),
    produtividadeAgentica: optionalNumber.optional(),
    custoEstimado: optionalNumber.optional(),
    retornoAnualEsperado: optionalNumber.optional(),
    dataInicioConstrucao: optionalDate.optional(),
    dataFimConstrucao: optionalDate.optional(),
    dataAtivacaoProducao: optionalDate.optional(),
    statusConstrucao: z.preprocess(
      (v) => (v === '' || v === undefined || v === null ? 'planejado' : v),
      z.enum(['planejado', 'em_construcao', 'em_teste', 'ativo', 'suspenso', 'cancelado'])
    ),
    observacoesCronograma: optionalString(5000).optional(),
    arquiteturaReferenciaId: optionalId.optional(),
    idealizacaoProduto: idealizacaoProdutoSchema,
    modeloCriacao: z.enum(['convencional', 'design_thinking']).default('convencional'),
    informacoesAdicionaisEspecificacao: informacoesAdicionaisEspecificacaoSchema
  }),

  atualizar: z.object({
    nome: safeString(2, 200).optional(),
    descricao: optionalString(5000).optional(),
    verticalId: optionalId.optional(),
    status: z.enum(['ativo', 'inativo']).optional(),
    // Campos descritivos (limite de 5000 caracteres)
    problemaResolve: optionalString(5000).optional(),
    publicoAlvo: optionalString(5000).optional(),
    tecnologias: optionalString(5000).optional(),
    faseAtual: z.enum(['ideia', 'mvp', 'piloto', 'producao']).optional(),
    complexidade: z.enum(['baixa', 'media', 'alta']).optional(),
    diferencialCompetitivo: optionalString(5000).optional(),
    principaisRiscos: optionalString(5000).optional(),
    dependenciasExternas: optionalString(5000).optional(),
    // Métricas de sucesso
    metricaPrincipal: optionalString(5000).optional(),
    baselineAtual: optionalString(5000).optional(),
    metaEsperada: optionalString(5000).optional(),
    prazoMeta: optionalDate.optional(),
    // Campos financeiros e produtividade
    custoHoraHomem: optionalNumber.optional(),
    produtividadeTradicional: optionalNumber.optional(),
    produtividadeAgentica: optionalNumber.optional(),
    custoEstimado: optionalNumber.optional(),
    retornoAnualEsperado: optionalNumber.optional(),
    dataInicioConstrucao: optionalDate.optional(),
    dataFimConstrucao: optionalDate.optional(),
    dataAtivacaoProducao: optionalDate.optional(),
    statusConstrucao: z.enum(['planejado', 'em_construcao', 'em_teste', 'ativo', 'suspenso', 'cancelado']).optional(),
    observacoesCronograma: optionalString(5000).optional(),
    arquiteturaReferenciaId: optionalId.optional(),
    idealizacaoProduto: idealizacaoProdutoSchema,
    modeloCriacao: z.enum(['convencional', 'design_thinking']).optional(),
    informacoesAdicionaisEspecificacao: informacoesAdicionaisEspecificacaoSchema
  })
};

const tipoArquiteturaEnum = z.enum([
  'layered',
  'microservices',
  'serverless',
  'monolith',
  'event_driven',
  'hybrid',
  'data_mesh',
  'other'
]);

export const arquiteturaReferenciaSchemas = {
  criar: z.object({
    empresaId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
    nome: safeString(2, 200),
    descricao: optionalString(10000).optional(),
    tipoArquitetura: z.preprocess(
      (v) => (v === '' || v === undefined || v === null ? 'layered' : v),
      tipoArquiteturaEnum
    ),
    ciCd: optionalString(10000).optional(),
    tecnologia: optionalString(10000).optional(),
    topologia: optionalString(10000).optional(),
    padroesQualidade: optionalString(10000).optional(),
    segurancaCompliance: optionalString(10000).optional(),
    observabilidade: optionalString(10000).optional(),
    ambientesImplantacao: optionalString(10000).optional(),
    responsavelArquitetura: optionalString(500).optional(),
    custoOperacionalNotas: optionalString(10000).optional(),
    ativo: z.boolean().optional()
  }),
  atualizar: z.object({
    nome: safeString(2, 200).optional(),
    descricao: optionalString(10000).optional(),
    tipoArquitetura: tipoArquiteturaEnum.optional(),
    ciCd: optionalString(10000).optional(),
    tecnologia: optionalString(10000).optional(),
    topologia: optionalString(10000).optional(),
    padroesQualidade: optionalString(10000).optional(),
    segurancaCompliance: optionalString(10000).optional(),
    observabilidade: optionalString(10000).optional(),
    ambientesImplantacao: optionalString(10000).optional(),
    responsavelArquitetura: optionalString(500).optional(),
    custoOperacionalNotas: optionalString(10000).optional(),
    ativo: z.boolean().optional()
  })
};

export const avaliacaoSchemas = {
  criar: z.object({
    projetoId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
    usuarioId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
    areaIds: z.array(z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)])).optional()
  }),
  
  respostas: z.object({
    respostas: z.array(z.object({
      id: z.number().int().positive(),
      pontuacao: z.number().int().min(1).max(5).optional().nullable(),
      observacoes: safeText(0, 2000).optional().nullable()
    })),
    areasRecusadas: z.array(z.number().int().positive()).optional()
  })
};

export const avaliacaoProdutoSchemas = {
  criar: z.object({
    produtoId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
    usuarioId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)]),
    verticalIds: z.array(z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)])).optional()
  }),
  
  respostas: z.object({
    respostasObrigatorias: z.array(z.object({
      id: z.number().int().positive(),
      pontuacao: z.number().int().min(1).max(5).optional().nullable(),
      observacoes: safeText(0, 2000).optional().nullable()
    })).optional(),
    respostasVerticais: z.array(z.object({
      id: z.number().int().positive(),
      pontuacao: z.number().int().min(1).max(5).optional().nullable(),
      observacoes: safeText(0, 2000).optional().nullable()
    })).optional()
  })
};

export const authSchemas = {
  login: z.object({
    email: emailSchema,
    senha: z.string().min(1, 'Senha é obrigatória')
  }),
  
  registro: z.object({
    nome: safeString(2, 200),
    email: emailSchema,
    senha: senhaSchema,
    cargo: safeString(0, 100).optional().nullable(),
    telefone: telefoneSchema,
    empresaId: z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number)])
  }),
  
  alterarSenha: z.object({
    senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
    novaSenha: senhaSchema
  }),
  
  definirSenha: z.object({
    novaSenha: senhaSchema
  })
};

export const querySchemas = {
  listarComFiltro: z.object({
    empresaId: z.string().regex(/^\d+$/).transform(Number).optional(),
    projetoId: z.string().regex(/^\d+$/).transform(Number).optional(),
    produtoId: z.string().regex(/^\d+$/).transform(Number).optional()
  })
};

export { idParam };

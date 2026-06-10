-- Migração para adicionar campos faltantes ao banco de dados existente
-- Esta migração é idempotente (pode ser executada múltiplas vezes)

-- Adiciona campo website à tabela Empresa
ALTER TABLE "Empresa" ADD COLUMN IF NOT EXISTS "website" TEXT;

-- Adiciona campos ao Projeto
ALTER TABLE "Projeto" ADD COLUMN IF NOT EXISTS "audienciaPrimaria" TEXT;
ALTER TABLE "Projeto" ADD COLUMN IF NOT EXISTS "lentesPrioritarias" TEXT;

-- Adiciona campos ao Produto
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "scoreBlueprint" DOUBLE PRECISION;
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "scorePrioridadeEstrategica" DOUBLE PRECISION;
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "custoHoraHomem" DOUBLE PRECISION DEFAULT 150;
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "produtividadeTradicional" DOUBLE PRECISION DEFAULT 40;
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "produtividadeAgentica" DOUBLE PRECISION DEFAULT 120;

-- Adiciona campos de estimativas à EspecificacaoProduto
ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "storyPointsTotais" INTEGER;
ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "horasTradicional" DOUBLE PRECISION;
ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "custoTradicional" DOUBLE PRECISION;
ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "prazoTradicional" INTEGER;
ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "equipeTradicional" INTEGER;
ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "produtividadeTradicional" DOUBLE PRECISION;
ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "horasAgentica" DOUBLE PRECISION;
ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "custoAgentica" DOUBLE PRECISION;
ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "prazoAgentica" INTEGER;
ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "equipeAgentica" INTEGER;
ALTER TABLE "EspecificacaoProduto" ADD COLUMN IF NOT EXISTS "produtividadeAgentica" DOUBLE PRECISION;

-- Adiciona campo status ao DocumentoEspecificacao
ALTER TABLE "DocumentoEspecificacao" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pendente';

-- Cria tabela ArquivoReferencia se não existir
CREATE TABLE IF NOT EXISTS "ArquivoReferencia" (
    "id" SERIAL NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "nomeArmazenado" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'geral',
    "conteudoExtraido" TEXT,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ArquivoReferencia_pkey" PRIMARY KEY ("id")
);

-- Adiciona FK se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ArquivoReferencia_produtoId_fkey') THEN
        ALTER TABLE "ArquivoReferencia" ADD CONSTRAINT "ArquivoReferencia_produtoId_fkey" 
        FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Cria tabela DimensaoDiagnostico se não existir
CREATE TABLE IF NOT EXISTS "DimensaoDiagnostico" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "icone" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    CONSTRAINT "DimensaoDiagnostico_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DimensaoDiagnostico_nome_key" ON "DimensaoDiagnostico"("nome");

-- Cria tabela PerguntaDiagnostico se não existir
CREATE TABLE IF NOT EXISTS "PerguntaDiagnostico" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "criterios" TEXT NOT NULL,
    "dimensaoId" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PerguntaDiagnostico_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PerguntaDiagnostico_dimensaoId_fkey') THEN
        ALTER TABLE "PerguntaDiagnostico" ADD CONSTRAINT "PerguntaDiagnostico_dimensaoId_fkey" 
        FOREIGN KEY ("dimensaoId") REFERENCES "DimensaoDiagnostico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Cria tabela DiagnosticoRapido se não existir
CREATE TABLE IF NOT EXISTS "DiagnosticoRapido" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER,
    "nomeResponsavel" TEXT NOT NULL,
    "emailResponsavel" TEXT,
    "cargoResponsavel" TEXT,
    "nomeEmpresa" TEXT,
    "setorEmpresa" TEXT,
    "porteEmpresa" TEXT,
    "verticalSelecionada" TEXT,
    "status" TEXT NOT NULL DEFAULT 'em_andamento',
    "scoreGeral" DOUBLE PRECISION,
    "nivelMaturidade" TEXT,
    "principaisGaps" TEXT,
    "recomendacaoProximoPasso" TEXT,
    "duracaoMinutos" INTEGER,
    "conduzidoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiagnosticoRapido_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DiagnosticoRapido_empresaId_fkey') THEN
        ALTER TABLE "DiagnosticoRapido" ADD CONSTRAINT "DiagnosticoRapido_empresaId_fkey" 
        FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Cria tabela RespostaDiagnostico se não existir
CREATE TABLE IF NOT EXISTS "RespostaDiagnostico" (
    "id" SERIAL NOT NULL,
    "diagnosticoId" INTEGER NOT NULL,
    "perguntaId" INTEGER NOT NULL,
    "pontuacao" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RespostaDiagnostico_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RespostaDiagnostico_diagnosticoId_perguntaId_key" ON "RespostaDiagnostico"("diagnosticoId", "perguntaId");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RespostaDiagnostico_diagnosticoId_fkey') THEN
        ALTER TABLE "RespostaDiagnostico" ADD CONSTRAINT "RespostaDiagnostico_diagnosticoId_fkey" 
        FOREIGN KEY ("diagnosticoId") REFERENCES "DiagnosticoRapido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RespostaDiagnostico_perguntaId_fkey') THEN
        ALTER TABLE "RespostaDiagnostico" ADD CONSTRAINT "RespostaDiagnostico_perguntaId_fkey" 
        FOREIGN KEY ("perguntaId") REFERENCES "PerguntaDiagnostico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

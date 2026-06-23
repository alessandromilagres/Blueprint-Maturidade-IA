-- Ciclos regulatórios por produto + mitigações

CREATE TABLE IF NOT EXISTS "ProdutoRegulatorioCiclo" (
  "id" SERIAL PRIMARY KEY,
  "produtoId" INTEGER NOT NULL,
  "numero" INTEGER NOT NULL,
  "titulo" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'aberta',
  "metaPlRisco" TEXT,
  "consultorNotas" TEXT,
  "snapshotAbertura" JSONB,
  "snapshotFechamento" JSONB,
  "checklistFechamento" JSONB,
  "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fechadaEm" TIMESTAMP(3),
  "fechadaPorUsuarioId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProdutoRegulatorioCiclo_produtoId_numero_key" UNIQUE ("produtoId", "numero")
);

CREATE INDEX IF NOT EXISTS "ProdutoRegulatorioCiclo_produtoId_status_idx"
  ON "ProdutoRegulatorioCiclo" ("produtoId", "status");

CREATE TABLE IF NOT EXISTS "ProdutoRegulatorioMitigacao" (
  "id" SERIAL PRIMARY KEY,
  "cicloId" INTEGER NOT NULL,
  "codigoMotivo" TEXT,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "responsavel" TEXT,
  "prazo" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'planejada',
  "evidenciaUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ProdutoRegulatorioMitigacao_cicloId_idx"
  ON "ProdutoRegulatorioMitigacao" ("cicloId");

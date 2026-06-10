-- CreateTable
CREATE TABLE "LogLembreteAvaliacao" (
    "id" SERIAL NOT NULL,
    "escopoTipo" TEXT NOT NULL,
    "projetoId" INTEGER,
    "produtoId" INTEGER,
    "destinatarioUsuarioId" INTEGER NOT NULL,
    "destinatarioEmail" TEXT NOT NULL,
    "destinatarioNome" TEXT NOT NULL,
    "enviadoPorUsuarioId" INTEGER,
    "modo" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "erro" TEXT,
    "emailSimulado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogLembreteAvaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LogLembreteAvaliacao_projetoId_createdAt_idx" ON "LogLembreteAvaliacao"("projetoId", "createdAt");

-- CreateIndex
CREATE INDEX "LogLembreteAvaliacao_produtoId_createdAt_idx" ON "LogLembreteAvaliacao"("produtoId", "createdAt");

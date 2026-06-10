-- CreateTable
CREATE TABLE "RelatorioIA" (
    "id" SERIAL NOT NULL,
    "projetoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudoMd" TEXT NOT NULL,
    "provider" TEXT,
    "modelo" TEXT,
    "tokensEntrada" INTEGER,
    "tokensSaida" INTEGER,
    "tempoGeracaoMs" INTEGER,
    "chunksGerados" INTEGER,
    "totalChunks" INTEGER,
    "dadosSnapshot" TEXT,
    "scoreGeral" DOUBLE PRECISION,
    "nivel" INTEGER,
    "setor" TEXT,
    "geradoPorId" INTEGER,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelatorioIA_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RelatorioIA_projetoId_tipo_idx" ON "RelatorioIA"("projetoId", "tipo");

-- CreateIndex
CREATE INDEX "RelatorioIA_createdAt_idx" ON "RelatorioIA"("createdAt");

-- AddForeignKey
ALTER TABLE "RelatorioIA" ADD CONSTRAINT "RelatorioIA_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatorioIA" ADD CONSTRAINT "RelatorioIA_geradoPorId_fkey" FOREIGN KEY ("geradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

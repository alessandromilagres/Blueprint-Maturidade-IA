-- CreateTable
CREATE TABLE "RelatorioIAJob" (
    "id" SERIAL NOT NULL,
    "projetoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progresso" INTEGER NOT NULL DEFAULT 0,
    "etapa" TEXT,
    "erro" TEXT,
    "relatorioId" INTEGER,
    "solicitadoPorId" INTEGER,
    "metadata" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelatorioIAJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RelatorioIAJob_projetoId_tipo_status_idx" ON "RelatorioIAJob"("projetoId", "tipo", "status");

-- CreateIndex
CREATE INDEX "RelatorioIAJob_createdAt_idx" ON "RelatorioIAJob"("createdAt");

-- AddForeignKey
ALTER TABLE "RelatorioIAJob" ADD CONSTRAINT "RelatorioIAJob_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatorioIAJob" ADD CONSTRAINT "RelatorioIAJob_relatorioId_fkey" FOREIGN KEY ("relatorioId") REFERENCES "RelatorioIA"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatorioIAJob" ADD CONSTRAINT "RelatorioIAJob_solicitadoPorId_fkey" FOREIGN KEY ("solicitadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

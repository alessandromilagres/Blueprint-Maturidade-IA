-- Arquiteturas de referência por empresa + arquivos + vínculo opcional em Produto

CREATE TABLE "ArquiteturaReferencia" (
    "id" SERIAL NOT NULL,
    "empresaId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipoArquitetura" TEXT NOT NULL DEFAULT 'layered',
    "ciCd" TEXT,
    "tecnologia" TEXT,
    "topologia" TEXT,
    "padroesQualidade" TEXT,
    "segurancaCompliance" TEXT,
    "observabilidade" TEXT,
    "ambientesImplantacao" TEXT,
    "responsavelArquitetura" TEXT,
    "custoOperacionalNotas" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArquiteturaReferencia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArquivoArquiteturaReferencia" (
    "id" SERIAL NOT NULL,
    "arquiteturaReferenciaId" INTEGER NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "nomeArmazenado" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'referencia_arquitetura',
    "conteudoExtraido" TEXT,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArquivoArquiteturaReferencia_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ArquiteturaReferencia" ADD CONSTRAINT "ArquiteturaReferencia_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArquivoArquiteturaReferencia" ADD CONSTRAINT "ArquivoArquiteturaReferencia_arquiteturaReferenciaId_fkey" FOREIGN KEY ("arquiteturaReferenciaId") REFERENCES "ArquiteturaReferencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Produto" ADD COLUMN "arquiteturaReferenciaId" INTEGER;

ALTER TABLE "Produto" ADD CONSTRAINT "Produto_arquiteturaReferenciaId_fkey" FOREIGN KEY ("arquiteturaReferenciaId") REFERENCES "ArquiteturaReferencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ArquiteturaReferencia_empresaId_idx" ON "ArquiteturaReferencia"("empresaId");
CREATE INDEX "ArquivoArquiteturaReferencia_arquiteturaReferenciaId_idx" ON "ArquivoArquiteturaReferencia"("arquiteturaReferenciaId");

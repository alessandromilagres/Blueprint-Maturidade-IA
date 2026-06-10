-- CreateTable
CREATE TABLE "ArquivoReferencia" (
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

-- AddForeignKey
ALTER TABLE "ArquivoReferencia" ADD CONSTRAINT "ArquivoReferencia_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

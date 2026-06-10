-- CreateTable
CREATE TABLE "ConfiguracaoIA" (
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "criptografado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoIA_pkey" PRIMARY KEY ("chave")
);

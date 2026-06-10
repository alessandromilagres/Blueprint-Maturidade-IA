-- CreateTable
CREATE TABLE "UsuarioPresenca" (
    "usuarioId" INTEGER NOT NULL,
    "ultimoPath" TEXT NOT NULL DEFAULT '',
    "rotuloPagina" TEXT NOT NULL DEFAULT '',
    "ultimaAcao" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioPresenca_pkey" PRIMARY KEY ("usuarioId")
);

-- AddForeignKey
ALTER TABLE "UsuarioPresenca" ADD CONSTRAINT "UsuarioPresenca_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

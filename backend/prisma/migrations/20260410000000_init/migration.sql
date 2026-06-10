-- CreateTable
CREATE TABLE "Empresa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "setor" TEXT,
    "porte" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT,
    "cargo" TEXT,
    "telefone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'avaliador',
    "empresaId" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConviteAvaliacao" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "avaliadorId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "projetoId" INTEGER,
    "produtoId" INTEGER,
    "areasSelecionadas" TEXT,
    "enviadoPor" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "dataExpiracao" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConviteAvaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projeto" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "vertical" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "empresaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 0.125,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pergunta" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "criterios" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,

    CONSTRAINT "Pergunta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" SERIAL NOT NULL,
    "projetoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'em_andamento',
    "scoreGeral" DOUBLE PRECISION,
    "nivelGeral" TEXT,
    "areasSelecionadas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resposta" (
    "id" SERIAL NOT NULL,
    "avaliacaoId" INTEGER NOT NULL,
    "perguntaId" INTEGER NOT NULL,
    "pontuacao" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerguntaObrigatoriaProduto" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criterios" TEXT,
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 0.125,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PerguntaObrigatoriaProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaObrigatoriaProduto" (
    "id" SERIAL NOT NULL,
    "avaliacaoProdutoId" INTEGER NOT NULL,
    "perguntaObrigatoriaId" INTEGER NOT NULL,
    "pontuacao" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RespostaObrigatoriaProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerticalProduto" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "foco" TEXT,
    "icone" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VerticalProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerguntaProduto" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Geral',
    "texto" TEXT NOT NULL,
    "verticalId" INTEGER NOT NULL,

    CONSTRAINT "PerguntaProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "projetoId" INTEGER NOT NULL,
    "verticalId" INTEGER,
    "scoreRelevancia" DOUBLE PRECISION,
    "scoreObrigatorio" DOUBLE PRECISION,
    "classificacao" INTEGER,
    "problemaResolve" TEXT,
    "publicoAlvo" TEXT,
    "tecnologias" TEXT,
    "faseAtual" TEXT DEFAULT 'ideia',
    "complexidade" TEXT DEFAULT 'media',
    "diferencialCompetitivo" TEXT,
    "principaisRiscos" TEXT,
    "dependenciasExternas" TEXT,
    "metricaPrincipal" TEXT,
    "baselineAtual" TEXT,
    "metaEsperada" TEXT,
    "prazoMeta" TIMESTAMP(3),
    "custoEstimado" DOUBLE PRECISION,
    "retornoAnualEsperado" DOUBLE PRECISION,
    "dataInicioConstrucao" TIMESTAMP(3),
    "dataFimConstrucao" TIMESTAMP(3),
    "dataAtivacaoProducao" TIMESTAMP(3),
    "statusConstrucao" TEXT DEFAULT 'planejado',
    "observacoesCronograma" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvaliacaoProduto" (
    "id" SERIAL NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "verticaisSelecionadas" TEXT,
    "status" TEXT NOT NULL DEFAULT 'em_andamento',
    "scoreObrigatorio" DOUBLE PRECISION,
    "scoreVerticais" DOUBLE PRECISION,
    "scoreRelevancia" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvaliacaoProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespostaProduto" (
    "id" SERIAL NOT NULL,
    "avaliacaoProdutoId" INTEGER NOT NULL,
    "perguntaProdutoId" INTEGER NOT NULL,
    "pontuacao" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RespostaProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EspecificacaoProduto" (
    "id" SERIAL NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'gerando',
    "modeloIA" TEXT,
    "tokensUsados" INTEGER,
    "tempoGeracao" INTEGER,
    "custoEstimadoIA" DOUBLE PRECISION,
    "horasEstimadas" DOUBLE PRECISION,
    "custoDesenvolvimento" DOUBLE PRECISION,
    "prazoSemanas" INTEGER,
    "tamanhoEquipe" INTEGER,
    "resumoExecutivo" TEXT,
    "geradoPorId" INTEGER NOT NULL,
    "aprovadoPorId" INTEGER,
    "dataAprovacao" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EspecificacaoProduto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoEspecificacao" (
    "id" SERIAL NOT NULL,
    "especificacaoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "versaoDocumento" INTEGER NOT NULL DEFAULT 1,
    "editadoManualmente" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoEspecificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoGeracaoIA" (
    "id" SERIAL NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "promptUsado" TEXT NOT NULL,
    "respostaIA" TEXT NOT NULL,
    "modeloIA" TEXT NOT NULL,
    "tokensEntrada" INTEGER,
    "tokensSaida" INTEGER,
    "tempoResposta" INTEGER,
    "sucesso" BOOLEAN NOT NULL DEFAULT true,
    "erroMensagem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoGeracaoIA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoCusto" (
    "id" SERIAL NOT NULL,
    "perfil" TEXT NOT NULL,
    "descricao" TEXT,
    "custoHora" DOUBLE PRECISION NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoCusto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ConviteAvaliacao_token_key" ON "ConviteAvaliacao"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Area_nome_key" ON "Area"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Resposta_avaliacaoId_perguntaId_key" ON "Resposta"("avaliacaoId", "perguntaId");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaObrigatoriaProduto_avaliacaoProdutoId_perguntaObrigatoriaId_key" ON "RespostaObrigatoriaProduto"("avaliacaoProdutoId", "perguntaObrigatoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "VerticalProduto_nome_key" ON "VerticalProduto"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "RespostaProduto_avaliacaoProdutoId_perguntaProdutoId_key" ON "RespostaProduto"("avaliacaoProdutoId", "perguntaProdutoId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentoEspecificacao_especificacaoId_tipo_versaoDocumento_key" ON "DocumentoEspecificacao"("especificacaoId", "tipo", "versaoDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoCusto_perfil_key" ON "ConfiguracaoCusto"("perfil");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteAvaliacao" ADD CONSTRAINT "ConviteAvaliacao_avaliadorId_fkey" FOREIGN KEY ("avaliadorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteAvaliacao" ADD CONSTRAINT "ConviteAvaliacao_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteAvaliacao" ADD CONSTRAINT "ConviteAvaliacao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pergunta" ADD CONSTRAINT "Pergunta_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "Avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "Pergunta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaObrigatoriaProduto" ADD CONSTRAINT "RespostaObrigatoriaProduto_avaliacaoProdutoId_fkey" FOREIGN KEY ("avaliacaoProdutoId") REFERENCES "AvaliacaoProduto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaObrigatoriaProduto" ADD CONSTRAINT "RespostaObrigatoriaProduto_perguntaObrigatoriaId_fkey" FOREIGN KEY ("perguntaObrigatoriaId") REFERENCES "PerguntaObrigatoriaProduto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerguntaProduto" ADD CONSTRAINT "PerguntaProduto_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "VerticalProduto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "VerticalProduto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoProduto" ADD CONSTRAINT "AvaliacaoProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvaliacaoProduto" ADD CONSTRAINT "AvaliacaoProduto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProduto" ADD CONSTRAINT "RespostaProduto_avaliacaoProdutoId_fkey" FOREIGN KEY ("avaliacaoProdutoId") REFERENCES "AvaliacaoProduto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespostaProduto" ADD CONSTRAINT "RespostaProduto_perguntaProdutoId_fkey" FOREIGN KEY ("perguntaProdutoId") REFERENCES "PerguntaProduto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EspecificacaoProduto" ADD CONSTRAINT "EspecificacaoProduto_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EspecificacaoProduto" ADD CONSTRAINT "EspecificacaoProduto_geradoPorId_fkey" FOREIGN KEY ("geradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EspecificacaoProduto" ADD CONSTRAINT "EspecificacaoProduto_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoEspecificacao" ADD CONSTRAINT "DocumentoEspecificacao_especificacaoId_fkey" FOREIGN KEY ("especificacaoId") REFERENCES "EspecificacaoProduto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

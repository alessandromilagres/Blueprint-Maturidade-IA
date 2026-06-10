# Especificação Automática de Produto

O módulo de Especificação Automática usa Inteligência Artificial generativa para criar documentação técnica completa a partir das informações do produto cadastrado no Blueprint IA. O sistema suporta provedores configuráveis, como Anthropic, OpenAI e Groq, conforme configuração administrativa e disponibilidade das chaves.

**Versão:** Junho/2026
**Escopo:** produto IA-First, idealização, avaliação, arquitetura de referência e geração de documentos técnicos.

## Funcionalidades

### Geração Automática de Documentos

A partir dos dados do produto, idealização, avaliação IA-First, arquitetura de referência, arquivos de apoio e informações adicionais, o sistema gera automaticamente:

1. **PRD (Product Requirements Document)**
   - Resumo executivo
   - Visão e objetivos
   - Personas e usuários
   - User stories com critérios de aceite
   - Escopo do MVP
   - Métricas de sucesso
   - Riscos e mitigações

2. **Requisitos Funcionais**
   - Lista completa de funcionalidades
   - Priorização MoSCoW
   - Critérios de aceite
   - Dependências

3. **Requisitos Não Funcionais**
   - Performance e escalabilidade
   - Segurança e conformidade
   - Disponibilidade
   - Usabilidade
   - Confiabilidade de IA

4. **Arquitetura Técnica**
   - Stack tecnológico recomendado
   - Diagramas (Mermaid)
   - Fluxos de dados
   - Integrações
   - Estimativa de custos de infra

5. **Cronograma e Estimativas**
   - Fases do projeto
   - Estimativa de horas por atividade
   - Custo por perfil profissional
   - Gantt chart
   - Equipe recomendada

6. **Blueprint de Construção**
   - Documento consolidado
   - Backlog priorizado
   - Definições técnicas
   - Checklist de qualidade

## Configuração

### 1. Provedor de IA

Configure o provedor na tela administrativa:

```text
Configurações > IA
```

Provedores suportados:

- Anthropic
- OpenAI
- Groq

As chaves são persistidas no banco de dados com proteção. Variáveis de ambiente continuam disponíveis para bootstrap ou fallback, mas o painel administrativo é o fluxo recomendado para operação.

### 2. Configurações de Custo

O sistema usa configurações de custo por hora para calcular estimativas. Execute o seed:

```bash
node prisma/seed-custos.js
```

Perfis disponíveis:
- Desenvolvedor Júnior: R$ 80/hora
- Desenvolvedor Pleno: R$ 120/hora
- Desenvolvedor Sênior: R$ 180/hora
- Tech Lead: R$ 220/hora
- Arquiteto: R$ 280/hora
- Product Owner: R$ 200/hora
- Designer UX/UI: R$ 150/hora
- QA Engineer: R$ 100/hora
- DevOps Engineer: R$ 180/hora
- Data Scientist: R$ 200/hora
- ML Engineer: R$ 220/hora

### 3. Migração do Banco

Em desenvolvimento, use migrações Prisma conforme o fluxo local. Em produção, o pipeline executa:

```bash
npx prisma migrate deploy
```

As principais tabelas envolvidas são `EspecificacaoProduto`, `DocumentoEspecificacao`, `HistoricoGeracaoIA`, `Produto`, `ArquivoReferencia` e `ArquiteturaReferencia`.

## Uso

### Via Interface Web

1. Acesse o detalhe de um produto.
2. Revise descrição, problema, público-alvo, tecnologias e vertical.
3. Inclua informações adicionais de especificação quando necessário.
4. Vincule arquitetura de referência, se existir.
5. Selecione arquivos de referência relevantes.
6. Clique em **Gerar Especificação**.
7. Aguarde a geração dos documentos.
8. Visualize, revise e edite os documentos gerados.
9. Aprove a especificação quando estiver satisfeita.
10. Exporte ou compartilhe os documentos conforme necessidade.

### Via API

**Gerar especificação completa:**
```bash
POST /api/especificacoes/gerar/:produtoId
```

**Verificar status:**
```bash
GET /api/especificacoes/:id/status
```

**Listar especificações de um produto:**
```bash
GET /api/especificacoes/produto/:produtoId
```

**Exportar:**
```bash
GET /api/especificacoes/:id/exportar/html
GET /api/especificacoes/:id/exportar/md
GET /api/especificacoes/:id/exportar/json
```

## Modelo de Dados

### EspecificacaoProduto
- `id`: Identificador único
- `produtoId`: Referência ao produto
- `versao`: Número da versão (incrementa a cada geração)
- `status`: gerando, concluido, erro, revisando, aprovado
- `modeloIA`: Modelo/provedor usado
- `tokensUsados`: Tokens consumidos
- `tempoGeracao`: Tempo de geração em segundos
- `custoEstimadoIA`: Custo da API em USD
- `storyPointsTotais`: Total estimado de story points
- `horasTradicional`: Horas estimadas no modelo tradicional
- `custoTradicional`: Custo estimado no modelo tradicional
- `prazoTradicional`: Prazo estimado no modelo tradicional
- `equipeTradicional`: Tamanho sugerido da equipe tradicional
- `horasAgentica`: Horas estimadas com fábrica agêntica/IA
- `custoAgentica`: Custo estimado com fábrica agêntica/IA
- `prazoAgentica`: Prazo estimado com fábrica agêntica/IA
- `equipeAgentica`: Tamanho sugerido da equipe agêntica
- `resumoExecutivo`: Síntese gerada para a especificação
- `geradoPorId`: Usuário que iniciou a geração
- `aprovadoPorId`: Usuário que aprovou, quando aplicável

### DocumentoEspecificacao
- `id`: Identificador único
- `especificacaoId`: Referência à especificação
- `tipo`: prd, requisitos_funcionais, requisitos_nao_funcionais, arquitetura, cronograma, blueprint
- `titulo`: Título do documento
- `conteudo`: Conteúdo em Markdown
- `ordem`: Ordem de exibição
- `status`: pendente, gerando, concluido, erro
- `versaoDocumento`: Versão do documento
- `editadoManualmente`: Se foi editado após geração

### HistoricoGeracaoIA
- `produtoId`: Produto usado como contexto
- `tipoDocumento`: Tipo do documento solicitado
- `promptUsado`: Prompt enviado ao provedor
- `respostaIA`: Resposta retornada
- `modeloIA`: Modelo usado
- `tokensEntrada` e `tokensSaida`: Consumo aproximado
- `tempoResposta`: Tempo em ms
- `sucesso` e `erroMensagem`: Resultado da chamada

## Custos da API

Os custos variam por provedor e modelo. O sistema registra metadados de geração para auditoria e acompanhamento de consumo.

Uma especificação completa pode consumir:

- 5.000 a 15.000 tokens de entrada, dependendo do contexto, arquivos e arquitetura.
- 20.000 a 60.000 tokens de saída, dependendo da extensão dos documentos.
- Custo variável conforme provedor, modelo e tamanho do resultado.

Para reduzir custo e melhorar qualidade:

- Preencha dados estruturados antes de gerar.
- Use arquivos de referência apenas quando forem relevantes.
- Aprove especificações antes de regenerar repetidamente.
- Reutilize versões salvas quando não houver mudança relevante no produto.

## Melhores Práticas

1. **Preencha o máximo de informações do produto**
   - Quanto mais detalhado o produto, melhor a especificação
   - Inclua: problema, público-alvo, tecnologias, métricas

2. **Faça avaliações antes de gerar**
   - As respostas das avaliações enriquecem o contexto
   - O score de maturidade influencia as recomendações

3. **Use arquitetura de referência**
   - Vincule padrões técnicos da empresa
   - Inclua CI/CD, segurança, observabilidade e ambientes
   - Evite que a IA invente uma arquitetura incompatível com a operação

4. **Selecione arquivos de referência com critério**
   - Use documentos de negócio, fluxos, APIs e padrões técnicos
   - Evite arquivos redundantes ou desatualizados
   - Revise conteúdo extraído quando disponível

5. **Revise e edite os documentos**
   - A IA gera uma base, mas revisão humana é essencial
   - Edite diretamente na interface

6. **Use versionamento**
   - Gere novas versões conforme o produto evolui
   - Compare versões para acompanhar mudanças

7. **Aprove somente após revisão**
   - A aprovação indica que a especificação está pronta para orientar execução
   - Registre observações quando houver ajustes relevantes

## Troubleshooting

### "Provider de IA não configurado"
Configure o provedor em **Configurações > IA** e teste a chave. Se operar por ambiente, confirme `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY` ou variáveis equivalentes.

### "Erro ao gerar documento"
- Verifique se a API key é válida
- Verifique se há saldo/crédito no provedor
- Verifique se o modelo configurado ainda está ativo
- Tente novamente (erros de rede são temporários)

### Geração muito lenta
- A geração de 6 documentos leva 2-5 minutos
- O processamento é sequencial para garantir qualidade
- Acompanhe o status via polling

### Documentos incompletos
- Verifique se o produto tem informações suficientes
- Regenere documentos individuais se necessário

### Arquitetura gerada incompatível
- Vincule uma arquitetura de referência ao produto
- Preencha padrões de CI/CD, segurança, observabilidade e ambientes
- Inclua documentos técnicos de apoio antes de gerar novamente

### Custo/prazo incoerente
- Revise `custoHoraHomem`
- Revise produtividade tradicional e agêntica
- Confira story points e complexidade do produto

## Referências Técnicas

- `backend/prisma/schema.prisma`
- `docs/ESPECIFICACAO_PRODUTO_REQUISITOS.md`
- `docs/COMO_SISTEMA_FUNCIONA.md`
- `docs/MANUAL_CICD_AZURE_DEVOPS.md`

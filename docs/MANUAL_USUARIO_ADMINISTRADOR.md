# Manual do Usuário Administrador

**Sistema:** Blueprint IA / Blueprint Agêntico
**Perfil:** Administrador
**Versão:** Junho/2026

---

## 1. Objetivo do Manual

Este manual orienta o administrador no uso do Blueprint IA, desde a configuração inicial até o acompanhamento de avaliações, geração de relatórios, gestão de IA e análise executiva.

O administrador é o perfil com visão completa do sistema. Ele pode configurar empresas, usuários, projetos, produtos, avaliações, templates, provedores de IA, relatórios e painéis executivos.

---

## 2. Acesso ao Sistema

### 2.1 Login

1. Acesse a URL de produção:

```text
https://agentica.sysmap.com.br
```

2. Informe e-mail e senha cadastrados.
3. Após autenticação, o sistema abre o dashboard principal.

### 2.2 Perfil e Sessão

No canto superior direito, o administrador pode:

- Visualizar o usuário logado.
- Alternar tema claro/escuro.
- Alterar tema visual.
- Sair do sistema.

Se a sessão expirar, o sistema redireciona para a tela de login.

---

## 3. Visão Geral da Navegação

O menu principal do administrador é organizado em blocos:

- **Dashboard**: visão inicial consolidada.
- **Cadastros**: empresas, projetos, produtos, arquiteturas e usuários.
- **Avaliações**: maturidade, acompanhamento, análise e produto.
- **Especificações**: documentos técnicos gerados a partir de produtos e diagnósticos.
- **Execução**: estágio AI-First, prontidão executiva, comparativo por empresa, ranking e biblioteca de IA.
- **Configurações administrativas**: IA, templates de e-mail, observabilidade e parâmetros operacionais.

---

## 4. Cadastros Básicos

### 4.1 Empresas

Use **Cadastros > Empresas** para criar e manter empresas clientes.

Campos e ações típicas:

- Nome da empresa
- Segmento ou vertical
- Dados complementares
- Projetos vinculados
- Dashboards consolidados

Boas práticas:

- Cadastre a empresa antes de criar usuários, projetos e produtos.
- Mantenha nomes padronizados para facilitar filtros e relatórios.

### 4.2 Usuários

Use **Cadastros > Usuários** para criar administradores, gestores, consultores e avaliadores.

O cadastro define:

- Nome
- E-mail
- Empresa vinculada
- Perfil de acesso
- Cargo/função
- Status ativo/inativo
- Prioridade para mapeamento de maturidade, quando aplicável

Perfis comuns:

- **Administrador**: acesso completo.
- **Consultor/Gestor**: acompanha projetos, avaliações e relatórios.
- **Avaliador**: acesso restrito às avaliações recebidas.

Boas práticas:

- Use e-mail corporativo válido, pois ele é usado nos convites.
- Preencha o cargo do avaliador para que a matriz Cargo x Dimensão sugira áreas adequadas.
- Desative usuários que não devem mais acessar a plataforma.

### 4.3 Projetos

Use **Cadastros > Projetos** para criar avaliações de maturidade vinculadas a uma empresa.

Um projeto representa o contexto avaliado, por exemplo:

- Uma área de negócio
- Uma unidade organizacional
- Uma jornada de transformação
- Um programa de IA

Após criar o projeto, o administrador pode:

- Convidar avaliadores.
- Acompanhar progresso.
- Gerar dashboards.
- Gerar relatórios IA.
- Vincular produtos IA-First.

### 4.4 Produtos IA-First

Use **Cadastros > Produtos IA-First** para cadastrar produtos ou ideias de produto que serão avaliados no paradigma IA-First/agêntico.

O produto pode seguir fluxo convencional ou fluxo de idealização. Depois do cadastro, o sistema permite:

- Avaliação IA-First
- Análise de relevância agêntica
- Vinculação a arquitetura de referência
- Geração de especificação automática

### 4.5 Arquiteturas de Referência

Use **Cadastros > Arquiteturas de referência** para registrar padrões técnicos reutilizáveis.

Essas arquiteturas podem incluir:

- Topologia
- Tecnologias recomendadas
- CI/CD
- Segurança e compliance
- Observabilidade
- Ambientes de implantação
- Arquivos e documentos de referência

Essas informações ajudam a qualificar a especificação automática de produtos.

---

## 5. Avaliação de Maturidade

### 5.1 Estrutura da Avaliação

A avaliação de maturidade usa:

- **16 dimensões**
- **108 perguntas**
- Escala de 1 a 5
- Observações/evidências por pergunta
- Opção **sem informação**
- Recusa de dimensão quando o avaliador não está apto a responder

A resposta "sem informação" conta como pergunta tratada no progresso, mas não entra no cálculo do score.

### 5.2 Convite de Avaliadores

No fluxo de projeto ou usuários, o administrador pode enviar convites de avaliação.

Ao convidar:

1. Escolha o avaliador.
2. Confirme o projeto.
3. Revise as dimensões sugeridas pela matriz Cargo x Dimensão.
4. Ajuste as dimensões se necessário.
5. Envie o convite.

Para avaliações de maturidade, o convite pode usar:

- Link por e-mail
- QR Code
- Magic link sem senha

O magic link valida o token do convite, cria ou reutiliza a avaliação do usuário e abre a tela de resposta com uma sessão segura.

### 5.3 Acompanhamento de Avaliadores

Use **Avaliações > Progresso dos avaliadores** para monitorar adesão e qualidade.

O painel mostra:

- Convites enviados
- Links abertos
- Avaliações iniciadas
- Avaliações em andamento
- Avaliações prontas para finalizar
- Avaliações finalizadas
- Progresso médio
- Pendências de lembrete

Filtros úteis:

- **Pendentes**: avaliadores ainda não finalizados.
- **Alertas**: avaliações com possível problema de qualidade.
- **Lembrete**: avaliadores aptos a receber lembrete.
- **Não abriu**: recebeu link, mas não abriu.
- **Abriu sem iniciar**: abriu link, mas não começou a responder.

### 5.4 Trilha e Auditoria

O sistema registra eventos operacionais em `AvaliacaoEvento`.

Eventos registrados:

- Convite enviado
- Link aberto
- Avaliação iniciada
- Progresso salvo
- Avaliação finalizada

Essa trilha ajuda o administrador a entender se o problema está no envio, na abertura do link, no início da avaliação ou na conclusão.

### 5.5 Alertas de Qualidade

O sistema calcula alertas para apoiar a revisão das respostas.

Exemplos:

- Mesmo score em muitas perguntas
- Conclusão rápida demais
- Muitas respostas "sem informação"
- Nota extrema sem evidência
- "Sem informação" sem observação de contexto

Esses alertas não invalidam automaticamente a avaliação. Eles sinalizam que o gestor deve revisar ou pedir complementação ao avaliador.

### 5.6 Lembretes

O administrador pode enviar lembretes individuais ou em lote.

Use lembretes para:

- Reenviar link para quem não abriu.
- Reforçar avaliadores que abriram, mas não iniciaram.
- Cobrar avaliações em andamento.
- Estimular conclusão antes da geração de relatórios.

Também pode haver lembrete automático para avaliações iniciadas e paradas há 48 horas, conforme configuração do backend.

---

## 6. Análise de Avaliações

Use **Avaliações > Análise de Avaliações** para comparar respostas finalizadas de um projeto.

A tela permite:

- Selecionar avaliações finalizadas.
- Comparar score por dimensão.
- Ver respostas por pergunta.
- Identificar divergências entre avaliadores.
- Avaliar critérios escolhidos e observações.

Use essa etapa antes de gerar relatórios executivos, especialmente quando houver divergência entre áreas ou avaliadores.

---

## 7. Avaliação de Produtos IA-First

Use **Cadastros > Produtos IA-First** ou **Avaliações > Avaliações de Produto** para operar produtos.

A avaliação de produto combina:

- 8 perguntas universais de Transformação Agêntica
- 12 verticais setoriais com 6 perguntas cada
- Score de relevância
- Análise de prontidão para produtos IA-First

Após avaliar, o administrador pode:

- Ver dashboard do produto.
- Comparar relevância e maturidade.
- Gerar especificação automática.

---

## 8. Especificações

Use **Especificações** para acessar documentos técnicos gerados pela plataforma.

O sistema pode gerar:

- PRD
- Requisitos funcionais
- Requisitos não funcionais
- Arquitetura técnica
- Cronograma
- Estimativa de esforço e custo
- Blueprint de construção

Boas práticas:

- Revise dados do produto antes de gerar documentos.
- Selecione arquivos de referência relevantes.
- Use arquitetura de referência quando existir padrão técnico da empresa.
- Revise o conteúdo gerado antes de compartilhar com times de execução.

---

## 9. Dashboards Executivos

### 9.1 Dashboard Inicial

Mostra visão geral da operação, com atalhos para empresas, projetos, avaliações e relatórios.

### 9.2 Dashboard de Empresa

Consolida projetos e produtos de uma empresa.

Use para:

- Ver maturidade consolidada.
- Comparar projetos.
- Acompanhar evolução por empresa.

### 9.3 Dashboard de Projeto

Mostra maturidade, dimensões, avaliadores, financeiro, produtos e relatórios do projeto.

Use para:

- Identificar dimensões fracas.
- Avaliar score geral.
- Gerar relatórios IA.
- Navegar para acompanhamento de avaliadores.

### 9.4 Prontidão Executiva

Use **Execução > Prontidão Executiva** para priorizar projetos.

O índice combina:

- Score médio de maturidade
- Taxa de conclusão das avaliações
- Riscos operacionais

Classificações típicas:

- Pronto para escalar
- Em preparação
- Atenção executiva
- Baixa prontidão

### 9.5 Comparativo por Empresa

Use **Execução > Comparativo por Empresa** para comparar projetos lado a lado.

A tela mostra:

- Prontidão por projeto
- Score médio
- Conclusão
- Riscos
- Link para detalhamento

O administrador pode exportar CSV ou imprimir/salvar em PDF pelo navegador.

### 9.6 Ranking de Projetos

Use **Execução > Ranking Projetos** para ordenar projetos por indicadores de maturidade e prontidão.

### 9.7 Biblioteca de Relatórios IA

Use **Execução > Biblioteca de Relatórios IA** para consultar relatórios gerados anteriormente.

A biblioteca guarda:

- Projeto
- Tipo de relatório
- Versão
- Provedor/modelo
- Snapshot de dados
- Data de geração

---

## 10. Relatórios Gerados por IA

Relatórios longos são gerados em background para evitar timeout.

Fluxo recomendado:

1. Certifique-se de que avaliações relevantes estão finalizadas.
2. Abra o dashboard do projeto.
3. Escolha o tipo de relatório.
4. Inicie a geração.
5. Aguarde o job em background.
6. Abra a versão salva na biblioteca.
7. Exporte em Markdown, Word ou PDF quando necessário.

Tipos comuns:

- Relatório estratégico C-Level
- Book completo de maturidade IA
- Book modo rápido
- Relatório executivo

---

## 11. Configurações Administrativas

### 11.1 Configurações de IA

Use **Configurações > IA** para configurar provedores.

Provedores suportados:

- Anthropic
- OpenAI
- Groq

Boas práticas:

- Salve e teste cada provedor separadamente.
- Confirme saldo/crédito do provedor antes de gerar relatórios grandes.
- Evite armazenar chaves fora do painel seguro.
- Após troca de chave, faça um teste simples antes de gerar relatório executivo.

As chaves são persistidas no banco com proteção, evitando perda após deploy/reinício.

### 11.2 Template de E-mail de Convite

Use a área administrativa de template para ajustar assunto e corpo dos convites de avaliação.

O template pode conter:

- Nome do avaliador
- Nome da empresa
- Projeto/produto
- Link de avaliação
- QR Code
- Bloco de credenciais, quando aplicável

### 11.3 Observabilidade

Use a tela de observabilidade para acompanhar presença e atividade operacional dos usuários, quando habilitada.

---

## 12. Diagnóstico Rápido

O diagnóstico rápido é um fluxo público/demo para coleta simplificada.

O administrador pode:

- Abrir o formulário de diagnóstico rápido.
- Consultar histórico de diagnósticos.
- Exportar ou usar resultados como insumo comercial.

Esse fluxo é separado da avaliação formal de maturidade por projeto.

---

## 13. Aplicativo Mobile do Avaliador

O app **Blueprint IA Avaliador** é voltado apenas ao respondente.

O administrador não opera cadastros pelo app. Seu papel é:

- Garantir que o avaliador exista no sistema.
- Enviar convite ou criar avaliação.
- Confirmar que a API de produção está acessível.
- Acompanhar respostas pelo sistema web.

Para detalhes, consulte `docs/APLICATIVO_AVALIADOR_MOBILE.md`.

---

## 14. Rotina Recomendada do Administrador

### Antes da Avaliação

1. Criar ou revisar empresa.
2. Criar usuários avaliadores.
3. Conferir cargos e empresa vinculada.
4. Criar projeto.
5. Selecionar avaliadores e dimensões.
6. Enviar convites.
7. Validar template de e-mail e link.

### Durante a Avaliação

1. Acompanhar progresso dos avaliadores.
2. Filtrar quem não abriu ou abriu sem iniciar.
3. Enviar lembretes.
4. Revisar alertas de qualidade.
5. Apoiar avaliadores com dúvidas.

### Após a Avaliação

1. Conferir avaliações finalizadas.
2. Usar análise comparativa.
3. Revisar divergências.
4. Gerar dashboards e relatórios.
5. Salvar relatório na biblioteca.
6. Exportar documentos executivos.
7. Usar especificação automática quando houver produto vinculado.

---

## 15. Boas Práticas

- Cadastre avaliadores com cargo correto para melhorar sugestões de dimensões.
- Evite gerar relatório executivo antes de obter respostas suficientes.
- Use alertas de qualidade como apoio, não como decisão automática.
- Peça observações/evidências quando houver nota extrema.
- Reenvie link para quem não abriu o convite.
- Use o comparativo por empresa para priorizar projetos com maior prontidão.
- Mantenha provedores de IA testados antes de reuniões importantes.
- Revise documentos gerados por IA antes de distribuição externa.

---

## 16. Solução de Problemas

| Situação | Ação recomendada |
|----------|------------------|
| Avaliador não recebeu convite | Verifique e-mail, reenvie o link e confira configuração de envio. |
| Avaliador abriu mas não iniciou | Use filtro "abriu sem iniciar" e envie reforço direcionado. |
| Link expirado | Gere novo convite. |
| Usuário não consegue acessar | Confira se está ativo, empresa vinculada e perfil correto. |
| Relatório IA demora | Verifique job em background e aguarde conclusão na biblioteca. |
| Provedor IA falha | Teste a chave na tela de configurações e confira saldo/modelo. |
| Score parece inconsistente | Revise áreas recusadas, respostas "sem informação" e avaliações selecionadas. |
| Exportação com dados incompletos | Confirme se avaliação/projeto está finalizado e recalcule/regenere o relatório. |

---

## 17. Referências Internas

- `README.md`
- `docs/COMO_SISTEMA_FUNCIONA.md`
- `docs/TESE_BLUEPRINT_IA.md`
- `docs/APLICATIVO_AVALIADOR_MOBILE.md`
- `docs/PERGUNTAS_MATURIDADE_POR_DIMENSAO_EXPORT.md`
- `docs/ESPECIFICACAO_AUTOMATICA.md`

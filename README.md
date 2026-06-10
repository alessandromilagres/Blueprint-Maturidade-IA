# SysMap | Blueprint IA

**Assessment de Maturidade, Produtos IA-First e Especificação Automática**

Sistema desenvolvido pela **SysMap Solutions** para avaliar maturidade em IA, acompanhar avaliadores, analisar produtos IA-First, gerar relatórios com IA e transformar diagnósticos em especificações técnicas.

## Estrutura do Projeto

```
blueprint-ia/
├── frontend/          # React + Vite + TailwindCSS + React Router
├── backend/           # Node.js + Express + Prisma + jobs em background
├── avaliador-mobile/  # Expo / React Native para avaliadores
├── docs/              # Documentação operacional, tese e guias
└── README.md
```

## Funcionalidades

- **Cadastro e governança**: empresas, usuários, projetos, produtos, custos, templates e provedores de IA.
- **Assessment de maturidade**: 108 perguntas em 16 dimensões, com múltiplos avaliadores por projeto.
- **Convites e acesso do avaliador**: convite por e-mail/link, QR Code, magic link sem senha para maturidade e navegação restrita.
- **Resposta qualificada**: seleção de dimensões por cargo, recusa de dimensão, opção "sem informação", observações/evidências e revisão antes da finalização.
- **Acompanhamento de avaliadores**: status operacional, lembretes, trilha recente, auditoria de abertura de link/início/salvamento/finalização e alertas de qualidade.
- **Dashboards executivos**: empresa, projeto, produto, prontidão executiva, ranking de projetos e comparativo por empresa.
- **Relatórios IA em background**: relatórios estratégicos e books longos com jobs persistidos, biblioteca versionada e exportações.
- **Produtos IA-First**: avaliação por perguntas universais e verticais setoriais.
- **Especificação automática**: geração de PRD, requisitos, arquitetura, cronograma, custos e blueprint de construção.
- **Aplicativo mobile do avaliador**: app Expo/React Native para responder avaliações pelo celular.

## Dimensões do Assessment

1. Estratégia e Liderança
2. Dados e Tecnologia
3. Governança e Risco
4. Pessoas e Cultura
5. Operações e Processos
6. Inovação e Experimentação
7. Valor de Negócio e ROI
8. Ecossistema e Parcerias
9. Valor por Unidade de Negócio (McKinsey Value Creation)
10. Talentos e Capacidades (SFIA Framework)
11. Conformidade Regulatória (NIST AI RMF)
12. Prontidão para Mudança (ADKAR/Prosci)
13. Plataforma e Industrialização de IA
14. IA como Gerador de Receita
15. Maturidade por Tipo de IA
16. Eficácia de IA (MIT CISR)

## Níveis de Maturidade

| Score | Nível | Classificação |
|-------|-------|---------------|
| 1.0 - 1.5 | Inicial | Iniciante |
| 1.5 - 2.5 | Oportunista | Básico |
| 2.5 - 3.5 | Estruturado | Intermediário |
| 3.5 - 4.5 | Gerenciado | Avançado |
| 4.5 - 5.0 | Otimizado | Expert |

## Como Executar

### Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Produção**: https://agentica.sysmap.com.br
- **API produção**: https://agentica.sysmap.com.br/api

## Documentação Principal

- `docs/DOCUMENTACAO_COMPLETA_SISTEMA.md`: documentação completa e consolidada do sistema.
- `docs/COMO_SISTEMA_FUNCIONA.md`: guia operacional ponta a ponta.
- `docs/MANUAL_USUARIO_ADMINISTRADOR.md`: manual de uso para administradores.
- `docs/MANUAL_CICD_AZURE_DEVOPS.md`: manual de CI/CD e deploy no Azure DevOps.
- `docs/DOCUMENTACAO_TECNICA.md`: arquitetura técnica, dados, APIs, segurança e operação.
- `docs/TESE_BLUEPRINT_IA.md`: tese e base metodológica atual.
- `docs/APLICATIVO_AVALIADOR_MOBILE.md`: documentação do aplicativo mobile.
- `docs/PERGUNTAS_MATURIDADE_POR_DIMENSAO_EXPORT.md`: perguntas por dimensão.
- `docs/ESPECIFICACAO_AUTOMATICA.md`: módulo de especificação automática.
- `docs/ESPECIFICACAO_PRODUTO_REQUISITOS.md`: requisitos para gerar especificações de produtos IA-First.

## Variáveis de ambiente (backend)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL do banco (SQLite ou PostgreSQL) para o Prisma |
| `JWT_SECRET` | Segredo para assinatura dos tokens JWT |
| `PORT` | Porta da API (padrão `3001`) |
| `BASE_URL` | URL pública do app usada em links de e-mail e convites (padrão de produção interna se omitido) |
| `EMAIL_PROVIDER` | `smtp` ou `graph` (Microsoft Graph) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Envio via SMTP; se não configurado, o sistema **simula** envio no log |
| `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `MAIL_SENDER_ADDRESS` | Envio via Graph; se incompleto, **simula** no log |
| `LEMBRETE_LOTE_DELAY_MS` | Intervalo em ms entre e-mails em lembretes em lote (padrão `250`) |
| `LEMBRETE_CRON_ENABLED` | `true` para ativar cron opcional de lembretes |
| `LEMBRETE_CRON_PROJETO_IDS` | IDs de projeto separados por vírgula |
| `LEMBRETE_CRON_EXPRESSION` | Expressão cron (padrão `0 9 * * 1`) |
| `LEMBRETE_CRON_TIMEZONE` | Fuso (padrão `America/Sao_Paulo`) |
| `LEMBRETE_CRON_ENVIADO_POR_USUARIO_ID` | ID do usuário gravado como remetente nos logs de auditoria do cron |
| `LEMBRETE_CRON_AUTO_48H` | Ativa lembretes automáticos para avaliações iniciadas e paradas há 48h |

Testes unitários do backend: na pasta `backend`, execute `npm run test` (arquivos `test/*.test.js`).

## Tecnologias

- **Frontend**: React, Vite, TailwindCSS, Chart.js, React Router
- **Backend**: Node.js, Express, Prisma
- **Banco de Dados**: SQLite (desenvolvimento) / PostgreSQL (produção)
- **Mobile**: Expo, React Native, AsyncStorage
- **Deploy**: Azure DevOps, Docker/Docker Compose, Nginx/HTTPS

---

**SysMap Solutions** — Transformando empresas com Inteligência Artificial

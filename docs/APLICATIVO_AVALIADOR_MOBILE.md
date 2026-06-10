# Aplicativo Mobile do Avaliador

**Nome:** Blueprint IA Avaliador
**Pasta:** `avaliador-mobile/`
**Tecnologia:** Expo, React Native e AsyncStorage
**Objetivo:** permitir que avaliadores respondam avaliações do Blueprint IA pelo celular, sem acessar funcionalidades administrativas.

---

## 1. Por Que Existe

O Blueprint IA possui um fluxo web completo para administradores, consultores e gestores. Porém, o avaliador muitas vezes precisa apenas abrir uma pendência, responder perguntas e finalizar. O aplicativo mobile reduz esse atrito e oferece uma jornada mais direta para celular.

O app é complementar ao sistema web. Ele não substitui dashboards, relatórios, biblioteca de IA, cadastros ou configurações.

---

## 2. Escopo Funcional

O app permite:

- Login do avaliador
- Persistência de sessão com token JWT
- Listagem de avaliações pendentes
- Abertura de avaliação de maturidade por projeto
- Abertura de avaliação de produto IA-First
- Resposta por score de 1 a 5
- Observações/evidências por pergunta
- Marcação "não tenho informação suficiente" em maturidade
- Recusa de dimensão quando o avaliador não está apto a responder
- Salvamento parcial
- Finalização da avaliação

O app não permite:

- Criar empresas, projetos ou produtos
- Criar usuários
- Enviar convites
- Gerar relatórios IA
- Configurar provedores de IA
- Exportar relatórios
- Administrar templates de e-mail

---

## 3. Arquitetura

```text
App Expo / React Native
      ↓ HTTPS
Backend Blueprint IA (/api)
      ↓
PostgreSQL
      ↓
Dashboards, relatórios e acompanhamento web
```

O app usa os mesmos endpoints da aplicação web:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/avaliacoes`
- `GET /api/avaliacoes/:id`
- `PUT /api/avaliacoes/:id/respostas`
- `PUT /api/avaliacoes/:id/finalizar`
- `GET /api/avaliacoes-produto`
- `GET /api/avaliacoes-produto/:id`
- `PUT /api/avaliacoes-produto/:id/respostas`
- `PUT /api/avaliacoes-produto/:id/finalizar`

---

## 4. Configuração de Ambiente

Em produção, a URL da API deve apontar para:

```sh
EXPO_PUBLIC_API_URL=https://agentica.sysmap.com.br/api
```

Em desenvolvimento local:

```sh
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3001/api npm start
```

No simulador iOS, `http://localhost:3001/api` normalmente funciona. No emulador Android, use `http://10.0.2.2:3001/api` quando necessário.

---

## 5. Como Rodar

```sh
cd avaliador-mobile
npm install
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3001/api npm start
```

Depois, abra pelo Expo Go, simulador iOS ou emulador Android.

---

## 6. Fluxo do Usuário

```text
Login
  ↓
Lista de pendências
  ↓
Seleciona avaliação de maturidade ou produto
  ↓
Responde perguntas
  ↓
Salva progresso
  ↓
Finaliza avaliação
  ↓
Sistema web reflete progresso e score
```

---

## 7. Relação com Convites e QR Code

O sistema web gera convites por e-mail e pode incluir QR Code. Para avaliações de maturidade, o QR Code e o link do e-mail apontam para um **magic link web** que valida o convite, cria sessão para o avaliador e abre a avaliação sem exigir senha.

O aplicativo mobile continua usando login com credenciais e JWT. Ele prepara o caminho para uma evolução futura em que o QR Code ou o link do convite possa abrir diretamente o app via deep link usando o scheme configurado:

```text
blueprintavaliador://
```

Essa evolução permitiria abrir diretamente a avaliação dentro do app a partir do QR Code ou link do convite, mantendo o backend como fonte de verdade para validação do token, autorização e auditoria.

---

## 8. Segurança e Permissões

- A autenticação usa JWT.
- O token é persistido no AsyncStorage do dispositivo.
- O backend continua sendo a fonte de verdade para autorização.
- O app não expõe rotas administrativas.
- Se o token expira ou o backend retorna `401`, o app encerra a sessão local.
- Magic links de convite são validados no backend web; deep links mobile devem reutilizar essa validação quando forem habilitados.

---

## 9. Limitações Atuais

- Não há modo offline completo.
- O app depende da API estar acessível pela rede do dispositivo.
- Ainda não há push notification.
- Deep link ainda é uma evolução prevista.
- Relatórios e dashboards continuam exclusivamente no sistema web.

---

## 10. Critério de Pronto

O aplicativo está pronto para uso controlado quando:

- Backend de produção estiver acessível em HTTPS.
- Usuário avaliador existir no Blueprint IA.
- Avaliação ou convite estiver criado no sistema web.
- `EXPO_PUBLIC_API_URL` estiver apontando para o ambiente correto.
- Login, salvamento e finalização tiverem sido testados em iOS/Android.

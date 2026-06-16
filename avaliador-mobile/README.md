# Blueprint IA Avaliador Mobile

Aplicativo iOS/Android exclusivo para avaliadores responderem avaliações do Blueprint IA pelo celular.

Ele é complementar ao sistema web: administração, cadastro, convites, dashboards, relatórios, exportações e configurações continuam na plataforma principal.

## O que o app faz

- Login do avaliador.
- Lista de avaliações pendentes.
- Avaliação de maturidade por projeto.
- Avaliação de produto IA-First.
- Resposta com score de 1 a 5.
- Observações/evidências por pergunta.
- Marcação "não tenho informação suficiente" em perguntas de maturidade.
- Recusa de dimensão quando o avaliador não está apto a responder.
- Salvar progresso.
- Finalizar avaliação.

## O que o app não faz

- Não cria empresas, projetos, produtos ou usuários.
- Não envia convites.
- Não gera relatórios IA.
- Não exibe dashboards administrativos.
- Não configura provedores de IA.

## Como rodar

1. Inicie o backend na porta `3001`.
2. Entre nesta pasta:

```sh
cd avaliador-mobile
```

3. Configure a URL da API quando estiver usando um dispositivo físico:

```sh
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3001/api npm start
```

No simulador iOS, `http://localhost:3001/api` normalmente funciona. No emulador Android, use `http://10.0.2.2:3001/api` se necessário.

## Produção

Para apontar o app para produção:

```sh
EXPO_PUBLIC_API_URL=https://agentica.sysmap.com.br/api npm start
```

## Arquitetura

```text
App Expo / React Native
      ↓
API Blueprint IA (/api)
      ↓
PostgreSQL
      ↓
Dashboards e relatórios no sistema web
```

## Documentação

Consulte também:

- `docs/APLICATIVO_AVALIADOR_MOBILE.md`
- `docs/COMO_SISTEMA_FUNCIONA.md`

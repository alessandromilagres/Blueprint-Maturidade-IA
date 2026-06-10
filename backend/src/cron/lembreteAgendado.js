/**
 * Lembretes agendados (cron) para projetos listados em LEMBRETE_CRON_PROJETO_IDS.
 * Desabilitado por padrão — defina LEMBRETE_CRON_ENABLED=true no ambiente confiável.
 */
export function startLembreteCronIfEnabled(prisma) {
  if (String(process.env.LEMBRETE_CRON_ENABLED || '').toLowerCase() !== 'true') {
    return;
  }

  const rawIds = process.env.LEMBRETE_CRON_PROJETO_IDS || '';
  const projetoIds = rawIds
    .split(',')
    .map((s) => parseInt(String(s).trim(), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);

  if (projetoIds.length === 0) {
    console.warn(
      '[LEMBRETE_CRON] LEMBRETE_CRON_ENABLED=true mas LEMBRETE_CRON_PROJETO_IDS vazio — cron não agendado.'
    );
    return;
  }

  const enviadoPorRaw = process.env.LEMBRETE_CRON_ENVIADO_POR_USUARIO_ID;
  const enviadoPorUsuarioId =
    enviadoPorRaw != null && String(enviadoPorRaw).trim() !== ''
      ? parseInt(String(enviadoPorRaw).trim(), 10)
      : null;
  if (enviadoPorUsuarioId == null || Number.isNaN(enviadoPorUsuarioId)) {
    console.warn(
      '[LEMBRETE_CRON] Defina LEMBRETE_CRON_ENVIADO_POR_USUARIO_ID (id de usuário existente) para registrar auditoria — usando null.'
    );
  }

  const expression = process.env.LEMBRETE_CRON_EXPRESSION || '0 9 * * 1';
  const timezone = process.env.LEMBRETE_CRON_TIMEZONE || 'America/Sao_Paulo';

  import('node-cron')
    .then(({ default: cron }) => {
      cron.schedule(
        expression,
        async () => {
          for (const projetoId of projetoIds) {
            try {
              const auto48h = String(process.env.LEMBRETE_CRON_AUTO_48H || '').toLowerCase() === 'true';
              const { executarLembreteLoteProjeto, executarLembreteAutomatico48hProjeto } = await import('../services/lembreteEnvioService.js');
              const out = auto48h
                ? await executarLembreteAutomatico48hProjeto(prisma, {
                    projetoId,
                    enviadoPorUsuarioId:
                      enviadoPorUsuarioId != null && !Number.isNaN(enviadoPorUsuarioId)
                        ? enviadoPorUsuarioId
                        : undefined
                  })
                : await executarLembreteLoteProjeto(prisma, {
                    projetoId,
                    enviadoPorUsuarioId:
                      enviadoPorUsuarioId != null && !Number.isNaN(enviadoPorUsuarioId)
                        ? enviadoPorUsuarioId
                        : undefined,
                    modo: 'cron'
                  });
              console.log(
                `[LEMBRETE_CRON] projeto ${projetoId}: total=${out.total} enviados=${out.enviados} falhas=${out.falhas}`
              );
            } catch (e) {
              console.error(`[LEMBRETE_CRON] projeto ${projetoId}:`, e.message);
            }
          }
        },
        { timezone }
      );
      console.log(
        `[LEMBRETE_CRON] Agendado (${expression}, ${timezone}) para projetos: ${projetoIds.join(', ')}`
      );
    })
    .catch((e) => {
      console.warn('[LEMBRETE_CRON] Instale a dependência node-cron:', e.message);
    });
}

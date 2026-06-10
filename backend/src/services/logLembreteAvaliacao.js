/**
 * Persistência de auditoria para lembretes por e-mail (projeto ou produto).
 */
export async function registrarLogLembrete(prisma, data) {
  return prisma.logLembreteAvaliacao.create({
    data: {
      escopoTipo: data.escopoTipo,
      projetoId: data.projetoId ?? null,
      produtoId: data.produtoId ?? null,
      destinatarioUsuarioId: data.destinatarioUsuarioId,
      destinatarioEmail: data.destinatarioEmail,
      destinatarioNome: data.destinatarioNome,
      enviadoPorUsuarioId: data.enviadoPorUsuarioId ?? null,
      modo: data.modo,
      sucesso: data.sucesso,
      erro: data.erro ?? null,
      emailSimulado: !!data.emailSimulado
    }
  });
}

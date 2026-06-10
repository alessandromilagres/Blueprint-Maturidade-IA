/** Expõe `desejosIA` no JSON da API a partir da relação `desejosIADados` (tabela dedicada). */
export function mergeDesejosIaNaAvaliacaoParaApi(avaliacao) {
  if (!avaliacao || typeof avaliacao !== 'object') return avaliacao;
  const { desejosIADados, ...rest } = avaliacao;
  return {
    ...rest,
    desejosIA: desejosIADados?.payload ?? null
  };
}

/** Ambiente sem migração da tabela `AvaliacaoDesejosIA` — o Prisma falha ao incluir a relação. */
export function isMissingAvaliacaoDesejosIaTableError(err) {
  const m = String(err?.message || err || '');
  if (!/AvaliacaoDesejosIa/i.test(m)) return false;
  return /does not exist|doesn't exist|não existe|relation.*not found|Unknown table/i.test(m);
}

/**
 * Falha ao upsert/delete em `AvaliacaoDesejosIA` que não deve derrubar o PUT de respostas (tabela ausente ou sem permissão).
 */
export function isAvaliacaoDesejosIaUpsertFailureIgnorable(err) {
  const m = String(err?.message || err || '');
  if (!/AvaliacaoDesejosIa/i.test(m)) return false;
  if (/does not exist|doesn't exist|não existe|relation.*not found|Unknown table/i.test(m)) return true;
  if (/must be owner|permission denied|42501|insufficient privilege|not authorized/i.test(m)) return true;
  return false;
}

const INCLUDE_AVALIACAO_API_BASE = {
  projeto: { include: { empresa: true } },
  usuario: true,
  respostas: {
    include: {
      pergunta: { include: { area: true } }
    }
  }
};

export async function findUniqueAvaliacaoApiOrFallback(prisma, id) {
  try {
    return await prisma.avaliacao.findUnique({
      where: { id },
      include: { ...INCLUDE_AVALIACAO_API_BASE, desejosIADados: true }
    });
  } catch (e) {
    if (!isMissingAvaliacaoDesejosIaTableError(e)) throw e;
    return prisma.avaliacao.findUnique({
      where: { id },
      include: { ...INCLUDE_AVALIACAO_API_BASE }
    });
  }
}

export async function updateAvaliacaoComMergeFallback(prisma, avaliacaoId, data) {
  try {
    const u = await prisma.avaliacao.update({
      where: { id: avaliacaoId },
      data,
      include: { ...INCLUDE_AVALIACAO_API_BASE, desejosIADados: true }
    });
    return mergeDesejosIaNaAvaliacaoParaApi(u);
  } catch (e) {
    if (!isMissingAvaliacaoDesejosIaTableError(e)) throw e;
    const u = await prisma.avaliacao.update({
      where: { id: avaliacaoId },
      data,
      include: { ...INCLUDE_AVALIACAO_API_BASE }
    });
    return mergeDesejosIaNaAvaliacaoParaApi(u);
  }
}

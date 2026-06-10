/**
 * Converte o payload do GET /relatorios-ia/:id para o formato esperado pelas telas
 * que normalmente consomem POST /dashboard/projeto/:id/relatorio-ia(-completo).
 */
export function mapRelatorioIASalvoToViewShape(row) {
  const created = row.createdAt ? new Date(row.createdAt) : new Date();
  return {
    relatorio: row.conteudoMd ?? '',
    provider: row.provider ?? '',
    model: row.modelo ?? '',
    tokens: {
      entrada: row.tokensEntrada ?? 0,
      saida: row.tokensSaida ?? 0,
    },
    tempoResposta: row.tempoGeracaoMs ?? 0,
    chunksGerados: row.chunksGerados,
    totalChunks: row.totalChunks,
    dadosUsados: row.dadosUsados ?? null,
    relatorioSalvoId: row.id,
    versao: row.versao,
    dataGeracao: row.createdAt,
    fromCache: true,
    dadosDesatualizados: false,
    ultimaAvaliacaoFinalizadaEm: null,
    relatorioVersaoGeradoEm: created.toISOString(),
    historicoBiblioteca: true,
    tipoRelatorio: row.tipo ?? null,
    modoGeracao:
      row.dadosUsados?.modoGeracao ??
      (row.tipo === 'completo_rapido' ? 'rapido' : row.tipo === 'completo' ? 'completo' : null),
  };
}

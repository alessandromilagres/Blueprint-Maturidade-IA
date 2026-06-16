import { calcularScoresConsolidadoMaturidade } from './scoresConsolidadoProjetoMaturidade.js';
import {
  blocoFaixasRubricaMarkdown,
  nivelNumericoDeScore
} from './nivelMaturidadeRubrica.js';
import { nivelMitFromScore } from './mitTrajetoriaFinanceira.js';
import { ORDEM_DIMENSOES_FRAMEWORK } from './ordemDimensoesFramework.js';

export async function montarComparativoVersoesProjeto(
  prisma,
  {
    projetoId,
    versaoAtualId,
    avaliacoesFinalizadas,
    areas,
    filtroNivelMax,
    usuarioIncluidoNoFiltro
  }
) {
  const versoes = await prisma.$queryRaw`
    SELECT
      v."id",
      v."numero",
      v."titulo",
      v."status",
      COALESCE(
        ARRAY_AGG(pva."avaliacaoId" ORDER BY pva."avaliacaoId") FILTER (WHERE pva."avaliacaoId" IS NOT NULL),
        ARRAY[]::integer[]
      ) AS "avaliacaoIds"
    FROM "ProjetoVersao" v
    LEFT JOIN "ProjetoVersaoAvaliacao" pva ON pva."projetoVersaoId" = v."id"
    WHERE v."projetoId" = ${projetoId}
    GROUP BY v."id"
    ORDER BY v."numero" ASC
  `;

  const historico = versoes
    .map((versao) => {
      const ids = new Set((versao.avaliacaoIds || []).map((id) => Number(id)));
      const avaliacoesVersao = (avaliacoesFinalizadas || []).filter(
        (av) =>
          ids.has(Number(av.id)) &&
          usuarioIncluidoNoFiltro(av.usuario, filtroNivelMax)
      );
      const { scoreGeral, todasDimensoes } = calcularScoresConsolidadoMaturidade(
        avaliacoesVersao,
        areas
      );
      return {
        versaoId: Number(versao.id),
        titulo: versao.titulo,
        numero: Number(versao.numero),
        status: versao.status,
        score: parseFloat(Number(scoreGeral || 0).toFixed(2)),
        nivel: nivelNumericoDeScore(scoreGeral),
        finalizadas: avaliacoesVersao.length,
        scoresPorArea: todasDimensoes.map((area) => ({
          areaId: area.areaId,
          area: area.area,
          score: area.score,
          nivel: area.nivel,
          semDadosConsolidados: area.semDadosConsolidados
        }))
      };
    })
    .filter((item) => item.score > 0);

  if (historico.length < 2) {
    return {
      disponivel: false,
      mensagem: 'Histórico insuficiente para comparar versões da pesquisa.',
      historico
    };
  }

  const comparada =
    historico.find((item) => Number(item.versaoId) === Number(versaoAtualId)) ||
    historico[historico.length - 1];
  const indiceComparada = historico.findIndex((item) => item.versaoId === comparada.versaoId);
  const base = indiceComparada > 0 ? historico[indiceComparada - 1] : historico[0];

  const delta = Number(comparada.score || 0) - Number(base.score || 0);
  const basePorArea = new Map((base.scoresPorArea || []).map((area) => [area.area, area]));
  const comparadaPorArea = new Map((comparada.scoresPorArea || []).map((area) => [area.area, area]));
  const dimensoes = ORDEM_DIMENSOES_FRAMEWORK.map((nome, idx) => {
    const anterior = basePorArea.get(nome);
    const atual = comparadaPorArea.get(nome);
    const scoreBase = Number(anterior?.score || 0);
    const scoreAtual = Number(atual?.score || 0);
    const deltaArea = scoreAtual - scoreBase;
    return {
      ordemFramework: idx + 1,
      areaId: atual?.areaId ?? anterior?.areaId ?? idx + 1,
      area: nome,
      scoreBase,
      scoreAtual,
      delta: parseFloat(deltaArea.toFixed(2)),
      tendencia: deltaArea > 0.15 ? 'evoluiu' : deltaArea < -0.15 ? 'regrediu' : 'estavel',
      semDadosBase: scoreBase <= 0,
      semDadosAtual: scoreAtual <= 0
    };
  });

  return {
    disponivel: true,
    versaoBase: base,
    versaoComparada: comparada,
    delta: parseFloat(delta.toFixed(2)),
    tendencia: delta > 0.15 ? 'evoluiu' : delta < -0.15 ? 'regrediu' : 'estavel',
    historico,
    dimensoes,
    melhorias: [...dimensoes].sort((a, b) => b.delta - a.delta).slice(0, 3),
    regressoes: dimensoes.filter((item) => item.delta < -0.15).slice(0, 3)
  };
}

export function blocoLogicaMaturidadeMarkdown({ scoreGeral, nomesNivel, nivel }) {
  return `## Lógica de maturidade aplicada no assessment

- **Escala do score:** 1,0 a 5,0 por dimensão e consolidado.
- **Agregação:** média por pergunta dentro de cada dimensão, depois média entre avaliadores incluídos no filtro de prioridade; o score geral é a média das dimensões com score > 0.
- **Nível atual interpretado:** Nível ${nivel} — ${nomesNivel[nivel - 1]}.
- **Score consolidado desta versão:** ${Number(scoreGeral).toFixed(2)}.
- **Tradução MIT CISR:** o modelo público MIT descreve **quatro estágios empresariais** (Experiment and Prepare → AI Future Ready); a escala 1–5 acima é operacional Blueprint IA, mapeável aos estágios MIT quando pertinente.
- **Leitura correta:** evolução entre versões mede progresso da organização entre rodadas; trajetória MIT explica o ganho esperado ao consolidar o próximo nível.

${blocoFaixasRubricaMarkdown()}
`;
}

export function blocoEvolucaoVersoesMarkdown(comparativo) {
  if (!comparativo?.disponivel) {
    return `## Evolução entre versões da pesquisa

${comparativo?.mensagem || 'Ainda não há histórico suficiente para comparar rodadas de pesquisa.'}
`;
  }

  const {
    versaoBase,
    versaoComparada,
    historico,
    dimensoes,
    melhorias,
    regressoes,
    delta,
    tendencia
  } = comparativo;
  const nBase = nivelMitFromScore(versaoBase.score);
  const nAtual = nivelMitFromScore(versaoComparada.score);

  return `## Evolução entre versões da pesquisa

Este projeto possui **${historico.length} rodada(s)** com score consolidado disponível.

### Comparativo principal
- **Versão base:** ${versaoBase.titulo} — score **${versaoBase.score.toFixed(2)}** (Nível ${versaoBase.nivel})
- **Versão comparada:** ${versaoComparada.titulo} — score **${versaoComparada.score.toFixed(2)}** (Nível ${versaoComparada.nivel})
- **Variação:** ${delta > 0 ? '+' : ''}${delta.toFixed(2)} (${tendencia})
- **Leitura de maturidade:** Nível MIT ${nBase} → Nível MIT ${nAtual}${
    nAtual > nBase ? ' (avanço de estágio)' : nAtual < nBase ? ' (regressão de estágio)' : ' (mesmo estágio)'
  }

### Histórico de rodadas
| Versão | Status | Finalizadas | Score | Nível |
|---|---|---:|---:|---:|
${historico
  .map(
    (item) =>
      `| ${item.titulo} | ${item.status} | ${item.finalizadas} | ${item.score.toFixed(2)} | ${item.nivel} |`
  )
  .join('\n')}

### Dimensões com maior evolução
${
  melhorias.length
    ? melhorias
        .map(
          (item) =>
            `- **${item.area}:** ${item.scoreBase.toFixed(2)} → ${item.scoreAtual.toFixed(2)} (${item.delta > 0 ? '+' : ''}${item.delta.toFixed(2)})`
        )
        .join('\n')
    : '- Sem avanços relevantes.'
}

### Dimensões que exigem atenção
${
  regressoes.length
    ? regressoes
        .map(
          (item) =>
            `- **${item.area}:** ${item.scoreBase.toFixed(2)} → ${item.scoreAtual.toFixed(2)} (${item.delta.toFixed(2)})`
        )
        .join('\n')
    : '- Nenhuma dimensão regrediu de forma relevante.'
}

### Detalhamento por dimensão
| Dimensão | ${versaoBase.titulo} | ${versaoComparada.titulo} | Delta | Tendência |
|---|---:|---:|---:|---|
${dimensoes
  .map(
    (item) =>
      `| ${item.area} | ${item.scoreBase.toFixed(2)} | ${item.scoreAtual.toFixed(2)} | ${item.delta > 0 ? '+' : ''}${item.delta.toFixed(2)} | ${item.tendencia} |`
  )
  .join('\n')}
`;
}

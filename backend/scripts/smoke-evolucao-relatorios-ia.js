/**
 * Smoke test: comparativo de versões nos dados usados pelos relatórios IA.
 * Não chama a IA — valida montagem do payload que entra nos prompts.
 */
import { PrismaClient } from '@prisma/client';
import {
  montarComparativoVersoesProjeto,
  blocoEvolucaoVersoesMarkdown,
  blocoLogicaMaturidadeMarkdown
} from '../src/utils/evolucaoVersoesProjeto.js';
import { usuarioIncluidoNoFiltroNivelMapeamentoMaturidade } from '../src/utils/nivelPrioridadeMapeamentoMaturidade.js';

const prisma = new PrismaClient();

async function main() {
  const projetos = await prisma.projeto.findMany({
    select: { id: true, nome: true },
    orderBy: { id: 'asc' }
  });

  const areas = await prisma.area.findMany({
    include: { perguntas: { orderBy: { numero: 'asc' } } },
    orderBy: { ordem: 'asc' }
  });

  let tested = 0;
  for (const projeto of projetos) {
    const countRows = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count FROM "ProjetoVersao" WHERE "projetoId" = ${projeto.id}
    `;
    const countVersoes = Number(countRows[0]?.count || 0);
    if (countVersoes < 2) continue;

    const avaliacoes = await prisma.avaliacao.findMany({
      where: { projetoId: projeto.id, status: 'finalizada' },
      include: {
        usuario: true,
        respostas: {
          include: {
            pergunta: { include: { area: true } }
          }
        }
      }
    });
    if (avaliacoes.length === 0) continue;

    const versaoRows = await prisma.$queryRaw`
      SELECT id FROM "ProjetoVersao" WHERE "projetoId" = ${projeto.id} ORDER BY numero DESC LIMIT 1
    `;
    const versaoAtualId = Number(versaoRows[0]?.id);
    if (!versaoAtualId) continue;

    const comparativo = await montarComparativoVersoesProjeto(prisma, {
      projetoId: projeto.id,
      versaoAtualId,
      avaliacoesFinalizadas: avaliacoes,
      areas,
      filtroNivelMax: null,
      usuarioIncluidoNoFiltro: usuarioIncluidoNoFiltroNivelMapeamentoMaturidade
    });

    const evolucao = blocoEvolucaoVersoesMarkdown(comparativo);
    const logica = blocoLogicaMaturidadeMarkdown({
      scoreGeral: comparativo.versaoComparada?.score ?? 0,
      nomesNivel: [
        'Inicial / Experimentando',
        'Oportunista / Preparando',
        'Sistemático / Escalando',
        'Diferenciado / Industrializando',
        'Transformador / Liderando'
      ],
      nivel: comparativo.versaoComparada?.nivel ?? 1
    });

    console.log(JSON.stringify({
      ok: true,
      projetoId: projeto.id,
      projetoNome: projeto.nome,
      versoes: countVersoes,
      comparativoDisponivel: comparativo.disponivel,
      delta: comparativo.delta ?? null,
      tendencia: comparativo.tendencia ?? null,
      blocoEvolucaoTemComparativo: evolucao.includes('Comparativo principal'),
      blocoLogicaTemEscala: logica.includes('Escala do score'),
      dimensoes: comparativo.dimensoes?.length ?? 0
    }, null, 2));

    tested += 1;
    if (tested >= 3) break;
  }

  if (tested === 0) {
    console.log(JSON.stringify({
      ok: false,
      message: 'Nenhum projeto com 2+ versões e avaliações finalizadas encontrado para smoke test.'
    }, null, 2));
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

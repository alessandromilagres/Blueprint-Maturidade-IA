/**
 * Filtro e metadados de relatórios IA por unidade organizacional (Fase 3).
 */
import { prisma } from '../lib/prisma.js';
import {
  garantirUnidadeGeralEmpresa,
  mapUnidadeEmpresaResponse,
  parseFiltroEmpresaUnidadeId,
  usuarioIncluidoNoFiltroUnidadeEmpresa,
  formatarDimensoesFocoSatfDisplay,
  formatarDimensoesFocoMitDisplay,
  parseDimensoesFocoSatfJson,
  parseDimensoesFocoMitJson,
  parseDimensoesPapelSatfJson,
  parseDimensoesPapelMitJson,
  formatarDimensoesPapelDisplay
} from './empresaUnidade.js';
import {
  usuarioIncluidoNoFiltroNivelMapeamentoMaturidade,
  filtroNivelRelatorioIACompativel
} from './nivelPrioridadeMapeamentoMaturidade.js';

export { TIPOS_RELATORIO_IA_UNIDADE } from '../constants/tiposRelatorioIA.js';

export function queryEmpresaUnidadeId(filtroUnidadeId) {
  if (filtroUnidadeId == null || filtroUnidadeId === '') return '';
  const n = Number(filtroUnidadeId);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `empresaUnidadeId=${encodeURIComponent(String(n))}`;
}

export function filtroUnidadeRelatorioIACompativel(dadosUsados, filtroUnidadeIdAtual) {
  const salvo = dadosUsados?.filtroEmpresaUnidadeIdAplicado;
  const atual = filtroUnidadeIdAtual == null ? null : Number(filtroUnidadeIdAtual);
  if (salvo == null && atual == null) return true;
  return Number(salvo) === Number(atual);
}

export function relatorioUnidadeCacheCompativel(dadosSnap, { filtroNivelMax, filtroUnidadeId, projetoVersaoId }) {
  return (
    filtroNivelRelatorioIACompativel(dadosSnap, filtroNivelMax) &&
    filtroUnidadeRelatorioIACompativel(dadosSnap, filtroUnidadeId) &&
    Number(dadosSnap?.projetoVersao?.id || 0) === Number(projetoVersaoId || 0)
  );
}

/** @returns {Promise<{ ok: true, filtroUnidadeId, unidadeGeral, unidadeMeta } | { ok: false, status, error }>} */
export async function resolverContextoUnidadeRelatorioObrigatorio(req, empresaId) {
  const filtroUnidadeId = parseFiltroEmpresaUnidadeId(req);
  if (filtroUnidadeId == null) {
    return {
      ok: false,
      status: 400,
      error: 'empresaUnidadeId é obrigatório para relatórios por unidade organizacional'
    };
  }
  const eid = parseInt(empresaId, 10);
  const unidadeGeral = await garantirUnidadeGeralEmpresa(eid);
  const unidade = await prisma.unidadeEmpresa.findFirst({
    where: { id: filtroUnidadeId, empresaId: eid, ativo: true }
  });
  if (!unidade) {
    return {
      ok: false,
      status: 400,
      error: 'Unidade organizacional não encontrada ou inativa nesta empresa'
    };
  }
  return {
    ok: true,
    filtroUnidadeId,
    unidadeGeral,
    unidadeMeta: mapUnidadeEmpresaResponse(unidade)
  };
}

export function filtrarAvaliacoesRelatorioProjeto(
  avaliacoes,
  { idsVersao, filtroNivelMax, filtroUnidadeId, unidadeGeralId }
) {
  return (avaliacoes || []).filter(
    (av) =>
      idsVersao.has(Number(av.id)) &&
      usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(av.usuario, filtroNivelMax) &&
      usuarioIncluidoNoFiltroUnidadeEmpresa(av.usuario, filtroUnidadeId, unidadeGeralId)
  );
}

export function blocoUnidadeRelatorioMarkdown(unidadeMeta, { framework = 'satf' } = {}) {
  if (!unidadeMeta) return '';
  const isSatf = framework === 'satf';
  const focoSatf = parseDimensoesFocoSatfJson(unidadeMeta);
  const focoMit = parseDimensoesFocoMitJson(unidadeMeta);
  const focoSatfTxt = formatarDimensoesPapelDisplay(
    parseDimensoesPapelSatfJson(unidadeMeta),
    focoSatf
  ) || formatarDimensoesFocoSatfDisplay(focoSatf);
  const focoMitTxt = formatarDimensoesPapelDisplay(
    parseDimensoesPapelMitJson(unidadeMeta),
    focoMit
  ) || formatarDimensoesFocoMitDisplay(focoMit);
  const desc = String(unidadeMeta.descricao || '').trim() || '—';
  return `## Unidade organizacional — escopo deste relatório

- **Unidade:** ${unidadeMeta.nome}${unidadeMeta.ehPadrao ? ' (padrão Geral)' : ''}
- **Descrição:** ${desc}
- **Dimensões em foco (SATF):** ${focoSatfTxt || '— (não definido)'}
- **Dimensões em foco (MIT Blueprint):** ${focoMitTxt || '— (não definido)'}
- **Papéis:** Proprietário = dona do item; Consumidor = consome o item; Não se aplica = análise padrão (como hoje)

> Scores e recomendações refletem **somente** avaliadores vinculados a esta unidade (usuários sem unidade entram em Geral).
${isSatf && focoSatfTxt ? `\n> Neste book SATF, o papel cadastrado (quando Proprietário/Consumidor) orienta o diagnóstico da Seção 3.\n` : ''}
`;
}

export function prependCapaUnidadeAoRelatorio(conteudo, unidadeMeta) {
  const bloco = blocoUnidadeRelatorioMarkdown(unidadeMeta);
  if (!bloco) return conteudo;
  return `${bloco}\n${conteudo}`;
}

export function metadadosUnidadeDadosUsados(unidadeMeta, filtroUnidadeId) {
  return {
    filtroEmpresaUnidadeIdAplicado: filtroUnidadeId,
    filtroEmpresaUnidade: unidadeMeta,
    escopoRelatorio: 'unidade_organizacional'
  };
}

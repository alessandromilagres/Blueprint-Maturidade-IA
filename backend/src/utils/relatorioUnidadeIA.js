/**
 * Filtro e metadados de relatórios IA por unidade organizacional (Fase 3).
 */
import { prisma } from '../lib/prisma.js';
import {
  garantirUnidadeGeralEmpresa,
  mapUnidadeEmpresaResponse,
  parseFiltroEmpresaUnidadeId,
  usuarioIncluidoNoFiltroUnidadeEmpresa,
  anotarAvaliacoesInclusaoUnidade,
  formatarDimensoesFocoSatfDisplay,
  formatarDimensoesFocoMitDisplay,
  parseDimensoesFocoSatfJson,
  parseDimensoesFocoMitJson,
  parseDimensoesPapelSatfJson,
  parseDimensoesPapelMitJson,
  formatarDimensoesPapelDisplay,
  resolverModeloOperacionalUnidade,
  labelModeloOperacional
} from './empresaUnidade.js';
import {
  usuarioIncluidoNoFiltroNivelMapeamentoMaturidade,
  filtroNivelRelatorioIACompativel
} from './nivelPrioridadeMapeamentoMaturidade.js';

import { isTipoRelatorioIAUnidade } from '../constants/tiposRelatorioIA.js';

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
  const filtradas = (avaliacoes || []).filter(
    (av) =>
      idsVersao.has(Number(av.id)) &&
      usuarioIncluidoNoFiltroNivelMapeamentoMaturidade(av.usuario, filtroNivelMax) &&
      usuarioIncluidoNoFiltroUnidadeEmpresa(av.usuario, filtroUnidadeId, unidadeGeralId)
  );
  return anotarAvaliacoesInclusaoUnidade(filtradas, filtroUnidadeId, unidadeGeralId);
}

/**
 * Descrição da unidade como bloco Markdown (fora de list item).
 * Multilinha em `- **Descrição:** ${desc}` quebra o bullet: só a 1ª linha
 * fica sob o rótulo; missão/sistemas/dores viram parágrafos órfãos.
 */
export function blocoDescricaoUnidadeMarkdown(descricao) {
  const desc = String(descricao || '').trim() || '—';
  return `**Descrição**\n\n${desc}`;
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
  const modelo = resolverModeloOperacionalUnidade(unidadeMeta);
  const modeloLabel = modelo ? labelModeloOperacional(modelo) : '';

  return `## Unidade organizacional — escopo deste relatório

- **Unidade:** ${unidadeMeta.nome}${unidadeMeta.ehPadrao ? ' (padrão Geral)' : ''}
- **Modelo operacional:** ${modeloLabel || '— (não definido; tradução genérica SATF)'}
- **Dimensões em foco (SATF):** ${focoSatfTxt || '— (não definido)'}
- **Dimensões em foco (MIT Blueprint):** ${focoMitTxt || '— (não definido)'}
- **Papéis:** Proprietário = dona do item; Consumidor = consome o item; Não se aplica = análise padrão (como hoje)

${blocoDescricaoUnidadeMarkdown(unidadeMeta.descricao)}

> Scores e recomendações refletem **somente** avaliadores vinculados a esta unidade (usuários sem unidade entram em Geral).
${isSatf && focoSatfTxt ? `\n> Neste book SATF, o papel cadastrado (quando Proprietário/Consumidor) orienta o diagnóstico da Seção 3.\n` : ''}
${isSatf && modeloLabel ? `\n> Modelo operacional parametriza métricas/léxico da Seção 3 (ex.: DORA no Delivery vs ITIL na Sustentação).\n` : ''}
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

/**
 * Metadados leves para a Biblioteca IA (sem expor o snapshot completo).
 * @returns {{ escopo: 'geral'|'unidade', empresaUnidadeId: number|null, unidadeNome: string|null }}
 */
export function extrairEscopoBibliotecaRelatorio(tipo, dadosUsados = null) {
  const snap = dadosUsados && typeof dadosUsados === 'object' ? dadosUsados : null;
  const tipoUnidade =
    isTipoRelatorioIAUnidade(tipo) || snap?.escopoRelatorio === 'unidade_organizacional';
  const unidade = snap?.filtroEmpresaUnidade;
  const idSnap = snap?.filtroEmpresaUnidadeIdAplicado;
  const empresaUnidadeId =
    idSnap != null && Number(idSnap) > 0
      ? Number(idSnap)
      : unidade?.id != null && Number(unidade.id) > 0
        ? Number(unidade.id)
        : null;
  const unidadeNome = unidade?.nome ? String(unidade.nome).trim() : null;

  if (tipoUnidade || empresaUnidadeId != null) {
    return {
      escopo: 'unidade',
      empresaUnidadeId,
      unidadeNome: unidadeNome || (empresaUnidadeId != null ? `Unidade #${empresaUnidadeId}` : null)
    };
  }
  return { escopo: 'geral', empresaUnidadeId: null, unidadeNome: null };
}

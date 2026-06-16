import { relatorioBookSecao3Completo } from '../constants/ordemDimensoesFramework.js';

/** Lê o filtro de prioridade da URL (alinhado ao dashboard). Padrão: 3. */
export function filtroNivelMapeamentoFromSearchParams(searchParams) {
  const raw = searchParams.get('nivelPrioridadeMapeamentoMaturidade');
  if (raw === '0') return 0;
  const n = parseInt(raw ?? '3', 10);
  if (n >= 1 && n <= 3) return n;
  return 3;
}

export function queryNivelMapeamentoMaturidade(filtro) {
  const n = filtro === 0 ? 0 : filtro >= 1 && filtro <= 3 ? filtro : 3;
  return `nivelPrioridadeMapeamentoMaturidade=${n}`;
}

export function labelFiltroNivelMapeamento(filtro) {
  if (filtro === 0) return 'Todos os níveis de prioridade';
  if (filtro === 1) return 'Até nível 1 (somente prioridade 1)';
  if (filtro === 2) return 'Até nível 2 (prioridades 1 e 2)';
  return 'Até nível 3 (prioridades 1, 2 e 3)';
}

/** Filtro gravado no snapshot do relatório IA (biblioteca / cache). */
export function filtroNivelFromDadosUsados(dadosUsados) {
  const salvo = dadosUsados?.filtroNivelPrioridadeMapeamentoMaturidadeAplicado;
  if (salvo === null) return 0;
  if (salvo >= 1 && salvo <= 3) return salvo;
  return 3;
}

export function queryVersaoBibliotecaRelatorioIA(r) {
  const qs = new URLSearchParams();
  if (r.tipo === 'completo_rapido') qs.set('modo', 'rapido');
  const filtro =
    r.dadosUsados?.filtroNivelPrioridadeMapeamentoMaturidadeAplicado ??
    (typeof r.dadosSnapshot === 'string'
      ? (() => {
          try {
            return JSON.parse(r.dadosSnapshot)?.filtroNivelPrioridadeMapeamentoMaturidadeAplicado;
          } catch {
            return undefined;
          }
        })()
      : r.dadosSnapshot?.filtroNivelPrioridadeMapeamentoMaturidadeAplicado);
  if (filtro === null) qs.set('nivelPrioridadeMapeamentoMaturidade', '0');
  else if (filtro >= 1 && filtro <= 3) {
    qs.set('nivelPrioridadeMapeamentoMaturidade', String(filtro));
  } else {
    qs.set('nivelPrioridadeMapeamentoMaturidade', '3');
  }
  qs.set('relatorioSalvoId', String(r.id));
  return qs.toString();
}

/** ID do relatório salvo na biblioteca (não confundir com versão da pesquisa do projeto). */
export function relatorioSalvoIdFromSearchParams(searchParams) {
  const explicito = searchParams.get('relatorioSalvoId');
  if (explicito) return explicito;
  if (searchParams.get('projetoVersaoId')) return null;
  return searchParams.get('versaoId');
}

export function pathRelatorioMitIaCompleto(projetoId, { modoRapido = false, filtroNivel = 3 } = {}) {
  const p = new URLSearchParams();
  if (modoRapido) p.set('modo', 'rapido');
  const n = filtroNivel === 0 ? 0 : filtroNivel >= 1 && filtroNivel <= 3 ? filtroNivel : 3;
  p.set('nivelPrioridadeMapeamentoMaturidade', String(n));
  return `/relatorios/${projetoId}/mit-ia-completo?${p.toString()}`;
}

/** Carrega relatório salvo se o filtro e a versão da pesquisa forem compatíveis. */
export async function carregarRelatorioSalvoSeCompativel({
  relatoriosIAApi,
  projetoId,
  tipo,
  filtroNivel,
  projetoVersaoId = null
}) {
  try {
    const row = await relatoriosIAApi.ultimaVersao(projetoId, tipo, {
      nivelPrioridadeMapeamentoMaturidade: filtroNivel
    });
    const dados = row.dadosUsados;
    if (
      projetoVersaoId &&
      Number(dados?.projetoVersao?.id || 0) !== Number(projetoVersaoId)
    ) {
      return null;
    }
    if (tipo === 'completo' || tipo === 'completo_rapido') {
      if (
        Number(dados?.totalDimensoesFramework || 0) !== 16 ||
        (dados?.scoresPorArea?.length || 0) !== 16 ||
        !relatorioBookSecao3Completo(row.conteudoMd || '').ok
      ) {
        return null;
      }
    }
    return row;
  } catch {
    return null;
  }
}

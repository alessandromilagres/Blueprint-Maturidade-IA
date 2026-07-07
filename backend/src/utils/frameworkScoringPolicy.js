/**
 * Políticas de scoring por framework de maturidade (Etapa 3+).
 */
import {
  FRAMEWORK_BLUEPRINT_16,
  FRAMEWORK_SATF_TI_V3,
  normalizarFrameworkMaturidade
} from '../constants/frameworkMaturidadePolicy.js';

export function areaForaDaMediaGeral(area) {
  return area?.tipoDimensao === 'especializada_fora_media';
}

export function areaEntraNaMediaGeral(area) {
  return !areaForaDaMediaGeral(area);
}

export function frameworkDeAreas(areas) {
  return normalizarFrameworkMaturidade(areas?.[0]?.frameworkMaturidade);
}

/** Dimensões SATF com peso 2× quando o projeto é de setor regulado (instrumento v3). */
export const SATF_DIMENSOES_REFORCO_REGULADO = new Set(['D2', 'D7', 'D11']);
export const SATF_MULTIPLICADOR_PESO_REGULADO = 2;

export function codigoFrameworkArea(area) {
  return area?.codigoFramework || null;
}

export function areaReforcoPesoRegulatorioSatf(area, setorRegulado) {
  if (!setorRegulado) return false;
  return SATF_DIMENSOES_REFORCO_REGULADO.has(codigoFrameworkArea(area));
}

/** Peso bruto antes da normalização para % (SATF). */
export function pesoBrutoSatfArea(area, setorRegulado) {
  if (areaForaDaMediaGeral(area)) return 0;
  return areaReforcoPesoRegulatorioSatf(area, setorRegulado)
    ? SATF_MULTIPLICADOR_PESO_REGULADO
    : 1;
}

function normalizarPesosPercentuais(elegiveis, pesoDeArea) {
  const mapa = new Map();
  const round2 = (x) => Math.round((Number(x) || 0) * 100) / 100;
  const n = elegiveis.length;
  if (n === 0) return mapa;

  const brutos = elegiveis.map((a) => ({ id: a.id, bruto: Math.max(0, Number(pesoDeArea(a)) || 0) }));
  const totalBruto = brutos.reduce((acc, x) => acc + x.bruto, 0);

  if (totalBruto <= 0) {
    const igual = round2(100 / n);
    brutos.forEach((x, i) => mapa.set(x.id, i === 0 ? round2(igual + (100 - igual * n)) : igual));
    return mapa;
  }

  let acumulado = 0;
  brutos.forEach((x) => {
    const peso = round2((x.bruto / totalBruto) * 100);
    mapa.set(x.id, peso);
    acumulado = round2(acumulado + peso);
  });
  const resto = round2(100 - acumulado);
  if (resto !== 0) {
    mapa.set(brutos[0].id, round2((mapa.get(brutos[0].id) || 0) + resto));
  }
  return mapa;
}

/**
 * Pesos default (%) por areaId — exclui dimensões fora da média geral do denominador.
 * SATF: pesos iguais; com setorRegulado, D2/D7/D11 recebem 2× antes da normalização.
 */
export function pesosDefaultNormalizadosFramework(areas, frameworkMaturidade, options = {}) {
  const mapa = new Map();
  const fw = normalizarFrameworkMaturidade(frameworkMaturidade || frameworkDeAreas(areas));
  const setorRegulado = options.setorRegulado === true;
  const elegiveis = (areas || []).filter((a) => areaEntraNaMediaGeral(a));
  const n = elegiveis.length;
  if (n === 0) return mapa;

  if (fw === FRAMEWORK_SATF_TI_V3) {
    const satfMapa = normalizarPesosPercentuais(elegiveis, (a) => pesoBrutoSatfArea(a, setorRegulado));
    satfMapa.forEach((peso, id) => mapa.set(id, peso));
  } else {
    const totalPeso = elegiveis.reduce((acc, a) => acc + (Number(a.peso) || 0), 0);
    const round2 = (x) => Math.round((Number(x) || 0) * 100) / 100;

    if (totalPeso <= 0) {
      const igual = round2(100 / n);
      elegiveis.forEach((a, i) =>
        mapa.set(a.id, i === 0 ? round2(igual + (100 - igual * n)) : igual)
      );
    } else {
      let acumulado = 0;
      elegiveis.forEach((a) => {
        const peso = round2(((Number(a.peso) || 0) / totalPeso) * 100);
        mapa.set(a.id, peso);
        acumulado = round2(acumulado + peso);
      });
      const resto = round2(100 - acumulado);
      if (resto !== 0) {
        const primeiraId = elegiveis[0].id;
        mapa.set(primeiraId, round2((mapa.get(primeiraId) || 0) + resto));
      }
    }
  }

  for (const area of areas || []) {
    if (areaForaDaMediaGeral(area)) {
      mapa.set(area.id, 0);
    }
  }

  return mapa;
}

export function metodologiaScoreFramework(frameworkMaturidade, options = {}) {
  const fw = normalizarFrameworkMaturidade(frameworkMaturidade);
  const setorRegulado = options.setorRegulado === true;
  if (fw === FRAMEWORK_SATF_TI_V3) {
    return {
      frameworkMaturidade: fw,
      label: 'SATF TI v3',
      dimensoesNucleo: 10,
      dimensaoEspecializada: 'Fábrica Agêntica de Software (D10)',
      descricaoScore: setorRegulado
        ? 'Média ponderada de D1–D9 e D11 (D2, D7 e D11 com peso 2× por setor regulado). D10 tem score próprio e não entra na média geral.'
        : 'Média ponderada das dimensões D1–D9 e D11. D10 (Fábrica Agêntica) tem score próprio e não entra na média geral.',
      exibeMitCisr: false,
      setorRegulado,
      ponderacaoRegulatoria: setorRegulado
        ? {
            dimensoes: [...SATF_DIMENSOES_REFORCO_REGULADO],
            multiplicador: SATF_MULTIPLICADOR_PESO_REGULADO
          }
        : null
    };
  }
  return {
    frameworkMaturidade: FRAMEWORK_BLUEPRINT_16,
    label: 'Blueprint 16',
    dimensoesNucleo: 16,
    dimensaoEspecializada: null,
    descricaoScore: 'Média ponderada das dimensões ativas do projeto (configuração por projeto).',
    exibeMitCisr: true
  };
}

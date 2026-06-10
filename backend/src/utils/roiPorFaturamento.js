/**
 * Percentual-base de referência para projeções de valor/ROI sobre o faturamento anual do projeto.
 * Faixas: menor faturamento → maior % típico de impacto relativo; maior faturamento → menor % (base maior em R$).
 */
export function percentualReferenciaRoi(faturamentoAnual) {
  if (faturamentoAnual == null || Number(faturamentoAnual) <= 0) return null;
  const x = Number(faturamentoAnual);
  if (x < 500_000) return 4.0;
  if (x < 2_000_000) return 3.4;
  if (x < 10_000_000) return 2.8;
  if (x < 100_000_000) return 2.2;
  if (x < 500_000_000) return 1.8;
  return 1.4;
}

/** Multiplicador vs baseline 2,5% (usado quando não há faturamento informado). */
export function multiplicadorRoiPorFaturamento(faturamentoAnual) {
  const pct = percentualReferenciaRoi(faturamentoAnual);
  if (pct == null) return 1;
  return pct / 2.5;
}

export function fatorMaturidadeScore(scoreGeral) {
  const s = Number(scoreGeral) || 0;
  if (s < 1.5) return 0.75;
  if (s < 2.5) return 0.88;
  if (s < 3.5) return 1.0;
  if (s < 4.5) return 1.12;
  return 1.25;
}

/**
 * Projeção para relatório técnico (cartões conservador/base/agressivo).
 * Sem faturamento: mantém comportamento legado com investimento fixo estimado.
 */
export function projecaoFinanceiraRelatorio({ faturamentoAnualProjeto, scoreGeral }) {
  const fat =
    faturamentoAnualProjeto != null && Number(faturamentoAnualProjeto) > 0
      ? Number(faturamentoAnualProjeto)
      : null;
  const pctRef = percentualReferenciaRoi(fat);
  const mat = fatorMaturidadeScore(scoreGeral);

  if (!fat || pctRef == null) {
    const baseInvestimento = scoreGeral < 2 ? 500000 : scoreGeral < 3 ? 350000 : 200000;
    return {
      usaFaturamento: false,
      faturamentoAnualProjeto: null,
      percentualReferenciaRoi: null,
      baseInvestimento,
      cenarios: {
        conservador: { roi: 1.5, payback: 18, economia: baseInvestimento * 0.8 },
        base: { roi: 2.5, payback: 12, economia: baseInvestimento * 1.5 },
        agressivo: { roi: 4.0, payback: 8, economia: baseInvestimento * 2.5 }
      }
    };
  }

  const pctEfetivoFrac = (pctRef * mat) / 100;
  const investimentoAnual = Math.min(Math.max(fat * 0.015, 80_000), Math.min(fat * 0.08, 12_000_000));

  const economiaCons = fat * pctEfetivoFrac * 0.65;
  const economiaBase = fat * pctEfetivoFrac * 1.0;
  const economiaAgr = fat * pctEfetivoFrac * 1.45;

  const paybackMeses = (eco) =>
    eco > 0 && investimentoAnual > 0 ? Math.max(3, Math.ceil(investimentoAnual / (eco / 12))) : null;

  const roiX = (eco) => (investimentoAnual > 0 ? eco / investimentoAnual : 0);

  return {
    usaFaturamento: true,
    faturamentoAnualProjeto: fat,
    percentualReferenciaRoi: pctRef,
    investimentoAnualReferencia: investimentoAnual,
    cenarios: {
      conservador: {
        roi: parseFloat(roiX(economiaCons).toFixed(2)),
        payback: paybackMeses(economiaCons) ?? 18,
        economia: economiaCons
      },
      base: {
        roi: parseFloat(roiX(economiaBase).toFixed(2)),
        payback: paybackMeses(economiaBase) ?? 12,
        economia: economiaBase
      },
      agressivo: {
        roi: parseFloat(roiX(economiaAgr).toFixed(2)),
        payback: paybackMeses(economiaAgr) ?? 8,
        economia: economiaAgr
      }
    }
  };
}

/** Escala faixas de ROI % do modelo MIT por nível conforme multiplicador do faturamento. */
export function escalarRoiPercentModelo(min, max, media, faturamentoAnual) {
  const m = multiplicadorRoiPorFaturamento(faturamentoAnual);
  return {
    min: Math.round(min * m),
    max: Math.round(max * m),
    media: Math.round(media * m)
  };
}

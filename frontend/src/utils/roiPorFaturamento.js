/**
 * Percentual-base de referência para projeções de valor/ROI sobre o faturamento anual do projeto.
 */
import { enriquecerCenarioFinanceiro } from './metodologiaRoiFinanceiro.js';

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

export function projecaoFinanceiraRelatorio({ faturamentoAnualProjeto, scoreGeral }) {
  const fat =
    faturamentoAnualProjeto != null && Number(faturamentoAnualProjeto) > 0
      ? Number(faturamentoAnualProjeto)
      : null;
  const pctRef = percentualReferenciaRoi(fat);
  const mat = fatorMaturidadeScore(scoreGeral);

  if (!fat || pctRef == null) {
    const baseInvestimento = scoreGeral < 2 ? 500000 : scoreGeral < 3 ? 350000 : 200000;
    const mk = (multEco, payback) =>
      enriquecerCenarioFinanceiro(
        { payback, economia: baseInvestimento * multEco },
        baseInvestimento
      );
    return {
      usaFaturamento: false,
      faturamentoAnualProjeto: null,
      percentualReferenciaRoi: null,
      baseInvestimento,
      investimentoAnualReferencia: baseInvestimento,
      cenarios: {
        conservador: mk(0.8, 18),
        base: mk(1.5, 12),
        agressivo: mk(2.5, 8)
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

  const mkCenario = (beneficioBruto, paybackDefault) =>
    enriquecerCenarioFinanceiro(
      {
        payback: paybackMeses(beneficioBruto) ?? paybackDefault,
        economia: beneficioBruto
      },
      investimentoAnual
    );

  return {
    usaFaturamento: true,
    faturamentoAnualProjeto: fat,
    percentualReferenciaRoi: pctRef,
    investimentoAnualReferencia: investimentoAnual,
    cenarios: {
      conservador: mkCenario(economiaCons, 18),
      base: mkCenario(economiaBase, 12),
      agressivo: mkCenario(economiaAgr, 8)
    }
  };
}

export function escalarRoiPercentModelo(min, max, media, faturamentoAnual) {
  const m = multiplicadorRoiPorFaturamento(faturamentoAnual);
  return {
    min: Math.round(min * m),
    max: Math.round(max * m),
    media: Math.round(media * m)
  };
}

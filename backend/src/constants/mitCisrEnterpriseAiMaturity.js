/**
 * Referência metodológica: MIT CISR Enterprise AI Maturity Model
 * — Building Enterprise AI Maturity (Research Briefing, Dec 2024)
 * — Grow Enterprise AI Maturity for Bottom-Line Impact (Aug 2025)
 *
 * O Blueprint converte o score médio do assessment (escala 1–5) para uma escala 0–100%
 * alinhada ao conceito "Total AI Effectiveness" descrito nos briefings públicos,
 * e infere o estágio empresarial (1–4). Trata-se de uma adaptação SysMap Blueprint IA,
 * não de um instrumento oficial MIT.
 */

export const MIT_CISR_ATRIBUICAO_CURTA =
  'MIT CISR Enterprise AI Maturity Model (Peter Weill, Stephanie L. Woerner, Ina M. Sebastian; atualização Woerner et al., 2025)';

export const MIT_CISR_PUBLICACOES = [
  {
    chave: 'building_2024',
    titulo: 'Building Enterprise AI Maturity',
    tipo: 'MIT CISR Research Briefing Vol. XXIV, No. 12',
    data: '2024-12',
    url: 'https://cisr.mit.edu/publication/2024_1201_EnterpriseAIMaturityModel_WeillWoernerSebastian'
  },
  {
    chave: 'grow_2025',
    titulo: 'Grow Enterprise AI Maturity for Bottom-Line Impact',
    tipo: 'MIT CISR Research Briefing Vol. XXV, No. 8',
    data: '2025-08',
    url: 'https://cisr.mit.edu/publication/2025_0801_EnterpriseAIMaturityUpdate_WoernerSebastianWeillKaganer'
  },
  {
    chave: 'copyright',
    titulo: 'CISR Publication Copyright Policy',
    url: 'https://cisr.mit.edu/page/cisr-publication-copyright-policy'
  }
];

/** Distribuição de empresas por estágio — pesquisas citadas no briefing de ago/2025 (página pública MIT CISR). */
export const DISTRIBUICAO_ESTAGIOS_MIT = {
  fonte: 'MIT CISR 2022 Future Ready Survey (N=721) e MIT CISR 2025 Real-Time Business Survey (N=152)',
  estagio1: { pp2022: 28, pp2025: 13 },
  estagio2: { pp2022: 34, pp2025: 23 },
  estagio3: { pp2022: 31, pp2025: 46 },
  estagio4: { pp2022: 7, pp2025: 18 }
};

/**
 * Converte score médio do assessment (1.0–5.0) para escala 0–100% compatível com o recorte
 * Total AI Effectiveness usado no modelo MIT (estágios definidos por faixas de efetividade).
 */
export function scoreParaPercentualEfetividadeIA(score) {
  const s = Math.max(1, Math.min(5, Number(score) || 1));
  return ((s - 1) / 4) * 100;
}

const ESTAGIOS_DEF = [
  {
    estagio: 1,
    nomeEn: 'Experiment and Prepare',
    nomePt: 'Experimentar e preparar',
    descricaoCurta: 'Exploração, educação e bases para IA',
    foco: 'Exploração e educação; políticas; dados acessíveis',
    performanceFinanceira: 'Desempenho financeiro tipicamente abaixo da média setorial (estágios 1–2 no modelo MIT)',
    crescimento: '-26.5pp',
    lucro: '-15.1pp'
  },
  {
    estagio: 2,
    nomeEn: 'Build Pilots and Capabilities',
    nomePt: 'Construir pilotos e capacidades',
    descricaoCurta: 'Pilotos, casos de uso e capacidades iniciais',
    foco: 'Casos de uso, automação, valor mensurável em pilotos',
    performanceFinanceira: 'Tipicamente abaixo da média até consolidar escala',
    crescimento: '-6.8pp',
    lucro: '-1.4pp'
  },
  {
    estagio: 3,
    nomeEn: 'Develop AI Ways of Working',
    nomePt: 'Desenvolver formas de trabalhar com IA',
    descricaoCurta: 'Industrializar IA e mudar formas de trabalho',
    foco: 'Plataformas escaláveis, reuso, IA embedded nos processos',
    performanceFinanceira: 'Acima da média setorial ao escalar (transição 2→3 é crítica no estudo MIT)',
    crescimento: '+4.7pp',
    lucro: '+0.8pp'
  },
  {
    estagio: 4,
    nomeEn: 'Become AI Future Ready',
    nomePt: 'Pronto para o futuro com IA',
    descricaoCurta: 'IA embedded e inovação contínua',
    foco: 'Novos fluxos de receita, combinação de tipos de IA, excelência',
    performanceFinanceira: 'Bem acima da média setorial',
    crescimento: '+13.9pp',
    lucro: '+9.9pp'
  }
];

function faixaPercentualParaEstagio(pct) {
  if (pct < 50) return 1;
  if (pct < 75) return 2;
  if (pct < 100) return 3;
  return 4;
}

/**
 * Estágio MIT CISR (1–4) a partir do score médio Blueprint.
 * Usa faixas de Total AI Effectiveness: Stage 1: 0–49%, 2: 50–74%, 3: 75–99%, 4: 100%.
 */
export function getEstagioMitDeScore(score) {
  const pct = scoreParaPercentualEfetividadeIA(score);
  const num = faixaPercentualParaEstagio(pct);
  const def = ESTAGIOS_DEF[num - 1];
  const dist = DISTRIBUICAO_ESTAGIOS_MIT;
  const key = `estagio${num}`;
  const sub = dist[key] || { pp2022: null, pp2025: null };

  return {
    estagio: num,
    nome: def.nomeEn,
    nomePt: def.nomePt,
    nomeExibicao: `${def.nomeEn} / ${def.nomePt}`,
    descricao: def.descricaoCurta,
    foco: def.foco,
    performanceFinanceira: def.performanceFinanceira,
    crescimento: def.crescimento,
    lucro: def.lucro,
    percentualEmpresas: sub.pp2025 != null ? `${sub.pp2025}%` : '—',
    percentualEmpresas2022: sub.pp2022,
    percentualEmpresas2025: sub.pp2025,
    totalAIEffectivenessPercent: Math.round(pct * 10) / 10,
    referenciaBreve: MIT_CISR_ATRIBUICAO_CURTA
  };
}

export function mitCisrReferenciaDashboard() {
  return {
    fonte: 'MIT CISR Enterprise AI Maturity Model',
    autores: 'Peter Weill, Stephanie L. Woerner, Ina M. Sebastian; atualizações Woerner et al. (2025)',
    metodologia:
      'Estágio inferido alinhado ao Total AI Effectiveness (faixas públicas dos briefings MIT CISR): conversão do score médio (1–5) para 0–100% e mapeamento para os quatro estágios empresariais.',
    notaAdaptacao:
      'Adaptação SysMap Blueprint IA — não é avaliação oficial MIT. Veja publicações em cisr.mit.edu.',
    publicacoes: MIT_CISR_PUBLICACOES,
    distribuicaoEmpresas2025: DISTRIBUICAO_ESTAGIOS_MIT
  };
}

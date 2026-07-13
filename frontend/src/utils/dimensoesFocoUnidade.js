/**
 * Normalização de códigos de dimensão em foco (unidade organizacional).
 * Espelha backend/src/utils/empresaUnidade.js — manter alinhado.
 */

const REGEX_COD_DIMENSAO = /\b(D(?:10|11|[1-9])|BP(?:1[0-6]|[1-9]))\b/gi;
const REGEX_SEGMENTO_EXCLUI =
  /\b(?:N[AÃ]O|NAO)[\s,]+(?:APARECE|FAZ\s+PARTE|EST[AÁ]\s+NO\s+ESCOPO|INCLUI|APLICA|PERTENCE)\b|\bFORA[\s,]+(?:DO[\s,]+)?ESCOPO\b/i;

function ordenarCodigosDimensao(codigos) {
  return [...codigos].sort((a, b) => {
    const pa = a.startsWith('BP') ? 'BP' : 'D';
    const pb = b.startsWith('BP') ? 'BP' : 'D';
    if (pa !== pb) return pa.localeCompare(pb);
    return parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10);
  });
}

export function normalizarDimensoesFocoInput(valor) {
  if (valor == null || valor === '') return null;

  let texto = '';
  if (Array.isArray(valor)) {
    texto = valor.map((x) => String(x).trim()).filter(Boolean).join(', ');
  } else {
    texto = String(valor).trim();
    try {
      const parsed = JSON.parse(texto);
      if (Array.isArray(parsed)) {
        texto = parsed.map((x) => String(x).trim()).filter(Boolean).join(', ');
      }
    } catch {
      /* texto livre */
    }
  }
  if (!texto.trim()) return null;

  const excluir = new Set();
  const incluir = new Set();

  for (const m of texto.matchAll(/(?:^|[,\s])(?:-|!|NOT\s+)(D(?:10|11|[1-9])|BP(?:1[0-6]|[1-9]))\b/gi)) {
    excluir.add(m[1].toUpperCase());
  }

  for (const m of texto.matchAll(REGEX_COD_DIMENSAO)) {
    const cod = m[1].toUpperCase();
    const afterCod = texto.slice(m.index + m[0].length);
    const proxCod = afterCod.search(/\b(D(?:10|11|[1-9])|BP(?:1[0-6]|[1-9]))\b/i);
    const janela = proxCod >= 0 ? afterCod.slice(0, proxCod) : afterCod.slice(0, 200);
    if (/^\s*[-!]/.test(afterCod) || REGEX_SEGMENTO_EXCLUI.test(janela)) {
      excluir.add(cod);
    } else {
      incluir.add(cod);
    }
  }

  for (const e of excluir) incluir.delete(e);

  const arr = ordenarCodigosDimensao(incluir);
  return arr.length ? arr : null;
}

export function formatarDimensoesFocoDisplay(valor) {
  const arr = normalizarDimensoesFocoInput(valor);
  return arr?.length ? arr.join(', ') : '';
}

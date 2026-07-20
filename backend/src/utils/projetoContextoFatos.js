/**
 * Glossário de fatos canônicos e termos proibidos — prioridade sobre anexos antigos no contexto do projeto.
 */
import crypto from 'crypto';

export const CAMPOS_FATOS_CANONICOS = ['glossarioFatosCanonicos', 'termosProibidos'];

export const LABELS_FATOS_CANONICOS = {
  glossarioFatosCanonicos: 'Glossário de fatos canônicos',
  termosProibidos: 'Termos proibidos no book (um por linha)'
};

export const DICAS_FATOS_CANONICOS = {
  glossarioFatosCanonicos:
    'Fatos atuais que prevalecem sobre anexos antigos e desejos IA desatualizados: pilotos, aprovações, nomenclatura oficial e status de ferramentas.',
  termosProibidos:
    'Termos que a IA não deve escrever (nomes obsoletos, siglas incorretas). A validação pós-geração alerta se aparecerem no book.'
};

export function parseListaLinhas(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function normalizarCamposFatos(raw = {}) {
  return {
    glossarioFatosCanonicos: String(raw.glossarioFatosCanonicos || '').trim().slice(0, 12000),
    termosProibidos: String(raw.termosProibidos || '').trim().slice(0, 4000)
  };
}

export function mesclarCamposFatosEmCaracteristicas(caracteristicas, raw = {}) {
  const fatos = normalizarCamposFatos(raw);
  return {
    ...caracteristicas,
    glossarioFatosCanonicos: fatos.glossarioFatosCanonicos,
    termosProibidos: fatos.termosProibidos
  };
}

export function obterTermosProibidos(caracteristicas) {
  return parseListaLinhas(caracteristicas?.termosProibidos);
}

export function projetoTemGlossarioFatos(caracteristicas) {
  const fatos = normalizarCamposFatos(caracteristicas);
  return Boolean(fatos.glossarioFatosCanonicos) || obterTermosProibidos(fatos).length > 0;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function contarOcorrenciasTermo(texto, termo) {
  const t = String(termo || '').trim();
  if (!t) return { count: 0, exemplos: [] };
  const regex = new RegExp(escapeRegex(t).replace(/\s+/g, '\\s+'), 'gi');
  const matches = [...String(texto).matchAll(regex)];
  const exemplos = matches.slice(0, 3).map((m) => {
    const idx = m.index ?? 0;
    const start = Math.max(0, idx - 40);
    const end = Math.min(String(texto).length, idx + t.length + 40);
    return String(texto).slice(start, end).replace(/\s+/g, ' ').trim();
  });
  return { count: matches.length, exemplos };
}

export function validarFatosCanonicosBook(markdown, { termosProibidos = [], glossario = '' } = {}) {
  const ocorrencias = [];
  for (const termo of termosProibidos) {
    const { count, exemplos } = contarOcorrenciasTermo(markdown, termo);
    if (count > 0) {
      ocorrencias.push({ termo, count, exemplos });
    }
  }
  const total = ocorrencias.reduce((s, o) => s + o.count, 0);
  const ok = total === 0;
  return {
    ok,
    total,
    ocorrencias,
    temGlossario: Boolean(String(glossario || '').trim()),
    termosProibidosCount: termosProibidos.length,
    aviso: ok
      ? null
      : `Book contém ${total} ocorrência(s) de termos proibidos (${ocorrencias
          .map((o) => `"${o.termo}"×${o.count}`)
          .join(', ')}) — revise o glossário ou regenere uma nova versão.`
  };
}

export function blocoMarkdownGlossarioFatosCanonicos(caracteristicas) {
  const fatos = normalizarCamposFatos(caracteristicas);
  const termos = obterTermosProibidos(fatos);
  if (!fatos.glossarioFatosCanonicos && !termos.length) return '';

  const linhas = [];
  linhas.push('### Glossário de fatos canônicos (AUTORIDADE MÁXIMA)');
  linhas.push('');
  linhas.push(
    '> **REGRA ABSOLUTA:** Este glossário **vence** anexos antigos, desejos IA desatualizados e inferências genéricas de setor. Se um documento anexado contradizer o glossário, **use o glossário** e trate o anexo como desatualizado ou "não vigente".'
  );
  linhas.push('');
  if (fatos.glossarioFatosCanonicos) {
    linhas.push(fatos.glossarioFatosCanonicos);
    linhas.push('');
  }
  if (termos.length) {
    linhas.push('**Termos proibidos neste relatório** (não escrever, nem como sinônimo):');
    for (const t of termos) {
      linhas.push(`- ~~${t}~~ → use apenas nomenclatura do glossário acima`);
    }
    linhas.push('');
  }
  return linhas.join('\n');
}

export function blocoInstrucoesPrioridadeGlossario() {
  return `
16. **Glossário de fatos canônicos (PRIORIDADE MÁXIMA):** quando presente nos DADOS, é a fonte de verdade sobre pilotos, aprovações, nomenclatura e status de iniciativas **deste projeto**. **Anexos e desejos IA são secundários** se conflitarem com o glossário. Nunca use termos da lista "Termos proibidos". **Não invente lacunas de documentação** que o glossário ou os anexos do projeto contradizem (ex.: não afirmar "não documentado" / "só X formalizado" se o pacote do projeto registra o contrário).`;
}

export function hashContextoFatosBook(caracteristicas, updatedAt) {
  const fatos = normalizarCamposFatos(caracteristicas);
  const payload = JSON.stringify({
    fatos,
    updatedAt: updatedAt ? new Date(updatedAt).toISOString() : null
  });
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

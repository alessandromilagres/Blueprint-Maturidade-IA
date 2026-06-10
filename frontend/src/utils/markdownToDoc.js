// Utilitário para converter Markdown em arquivo .doc (Word)
// Gera um HTML com namespaces MSO compatível com Word

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Converte uma linha de markdown inline (negrito, itálico, código, links)
function inlineMd(text) {
  let html = escapeHtml(text);
  // Código inline (deve vir antes de outros)
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;font-family:Consolas,monospace;font-size:11pt;color:#7c3aed;">$1</code>');
  // Negrito
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  // Itálico
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  // Links [texto](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#2563eb;">$1</a>');
  return html;
}

// Converte uma tabela markdown em HTML
function parseTable(lines, startIndex) {
  const tableLines = [];
  let i = startIndex;
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    tableLines.push(lines[i]);
    i++;
  }
  
  if (tableLines.length < 2) return { html: '', endIndex: startIndex };
  
  const parseRow = (line) => {
    return line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(c => c.trim());
  };
  
  const header = parseRow(tableLines[0]);
  const dataRows = tableLines.slice(2).map(parseRow); // pula a linha de separadores
  
  let html = '<table style="border-collapse:collapse;width:100%;margin:12pt 0;font-size:10.5pt;">';
  // Header
  html += '<thead><tr>';
  header.forEach(cell => {
    html += `<th style="background:#f3e8ff;color:#6b21a8;border:1px solid #d8b4fe;padding:8pt 10pt;text-align:left;font-weight:bold;">${inlineMd(cell)}</th>`;
  });
  html += '</tr></thead>';
  // Body
  html += '<tbody>';
  dataRows.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? '#ffffff' : '#faf5ff';
    html += `<tr style="background:${bg};">`;
    row.forEach(cell => {
      html += `<td style="border:1px solid #e9d5ff;padding:7pt 10pt;vertical-align:top;">${inlineMd(cell)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  
  return { html, endIndex: i - 1 };
}

// Converte markdown em HTML estruturado
function markdownToHtml(md) {
  const lines = md.split('\n');
  const html = [];
  let inList = false;
  let inOrderedList = false;
  let inCodeBlock = false;
  let codeBlockContent = [];
  let inBlockquote = false;
  let paragraphBuffer = [];
  
  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const text = paragraphBuffer.join(' ').trim();
      if (text) {
        html.push(`<p style="margin:0 0 10pt 0;text-align:justify;line-height:1.5;">${inlineMd(text)}</p>`);
      }
      paragraphBuffer = [];
    }
  };
  
  const closeList = () => {
    if (inList) { html.push('</ul>'); inList = false; }
    if (inOrderedList) { html.push('</ol>'); inOrderedList = false; }
  };
  
  const closeBlockquote = () => {
    if (inBlockquote) { html.push('</blockquote>'); inBlockquote = false; }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Code block
    if (trimmed.startsWith('```')) {
      flushParagraph();
      closeList();
      closeBlockquote();
      if (inCodeBlock) {
        html.push(`<pre style="background:#1e293b;color:#e2e8f0;padding:12pt;border-radius:6px;font-family:Consolas,monospace;font-size:10pt;overflow-x:auto;margin:10pt 0;">${escapeHtml(codeBlockContent.join('\n'))}</pre>`);
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }
    
    // Headers
    if (trimmed.startsWith('#')) {
      flushParagraph();
      closeList();
      closeBlockquote();
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const content = inlineMd(match[2].replace(/[#]+$/, '').trim());
        const styles = {
          1: 'font-size:24pt;color:#6b21a8;font-weight:bold;border-bottom:2pt solid #d8b4fe;padding-bottom:6pt;margin:24pt 0 14pt 0;page-break-before:always;page-break-after:avoid;',
          2: 'font-size:18pt;color:#7c3aed;font-weight:bold;margin:18pt 0 10pt 0;page-break-after:avoid;',
          3: 'font-size:14pt;color:#9333ea;font-weight:bold;margin:14pt 0 8pt 0;page-break-after:avoid;',
          4: 'font-size:12pt;color:#581c87;font-weight:bold;margin:12pt 0 6pt 0;page-break-after:avoid;',
          5: 'font-size:11pt;color:#581c87;font-weight:bold;margin:10pt 0 4pt 0;page-break-after:avoid;',
          6: 'font-size:10.5pt;color:#475569;font-weight:bold;margin:8pt 0 4pt 0;page-break-after:avoid;'
        };
        // O primeiro H1 não deve ter page-break-before
        const isFirstH1 = level === 1 && html.filter(h => h.includes('<h1')).length === 0;
        const finalStyle = isFirstH1 ? styles[level].replace('page-break-before:always;', '') : styles[level];
        html.push(`<h${level} style="${finalStyle}">${content}</h${level}>`);
      }
      continue;
    }
    
    // Tabela
    if (trimmed.startsWith('|') && trimmed.includes('|')) {
      flushParagraph();
      closeList();
      closeBlockquote();
      const { html: tableHtml, endIndex } = parseTable(lines, i);
      if (tableHtml) {
        html.push(`<div style="page-break-inside:avoid;">${tableHtml}</div>`);
        i = endIndex;
        continue;
      }
    }
    
    // Blockquote
    if (trimmed.startsWith('>')) {
      flushParagraph();
      closeList();
      if (!inBlockquote) {
        html.push('<blockquote style="border-left:4pt solid #a855f7;background:#faf5ff;padding:10pt 14pt;margin:10pt 0;font-style:italic;color:#581c87;">');
        inBlockquote = true;
      }
      html.push(`<p style="margin:0 0 6pt 0;">${inlineMd(trimmed.replace(/^>\s?/, ''))}</p>`);
      continue;
    } else if (inBlockquote) {
      closeBlockquote();
    }
    
    // Lista não ordenada
    const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      if (inOrderedList) { html.push('</ol>'); inOrderedList = false; }
      if (!inList) {
        html.push('<ul style="margin:6pt 0 10pt 24pt;padding:0;">');
        inList = true;
      }
      html.push(`<li style="margin:0 0 4pt 0;line-height:1.5;">${inlineMd(ulMatch[1])}</li>`);
      continue;
    }
    
    // Lista ordenada
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      flushParagraph();
      if (inList) { html.push('</ul>'); inList = false; }
      if (!inOrderedList) {
        html.push('<ol style="margin:6pt 0 10pt 24pt;padding:0;">');
        inOrderedList = true;
      }
      html.push(`<li style="margin:0 0 4pt 0;line-height:1.5;">${inlineMd(olMatch[2])}</li>`);
      continue;
    }
    
    // Separador horizontal
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushParagraph();
      closeList();
      html.push('<hr style="border:none;border-top:1pt solid #d8b4fe;margin:16pt 0;">');
      continue;
    }
    
    // Linha vazia: quebra parágrafo
    if (trimmed === '') {
      flushParagraph();
      closeList();
      continue;
    }
    
    // Texto comum (parágrafo)
    paragraphBuffer.push(line.trim());
  }
  
  // Flush final
  flushParagraph();
  closeList();
  closeBlockquote();
  
  return html.join('\n');
}

/**
 * Gera arquivo .doc (Word) a partir de Markdown
 * @param {string} markdown - Conteúdo em Markdown
 * @param {object} options - { titulo, subtitulo, empresa, projeto, autor, headerColor }
 * @returns {string} HTML formatado para Word
 */
export function generateDocFromMarkdown(markdown, options = {}) {
  const {
    titulo = 'Relatório',
    subtitulo = '',
    empresa = '',
    projeto = '',
    autor = 'BluePrint IA',
    headerColor = '#6b21a8',
    accentColor = '#a855f7'
  } = options;
  
  const dataAtual = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', month: 'long', year: 'numeric' 
  });
  
  const bodyHtml = markdownToHtml(markdown);
  
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(titulo)}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page {
  size: A4;
  margin: 2cm 2.2cm 2cm 2.2cm;
  mso-header-margin: 1cm;
  mso-footer-margin: 1cm;
  mso-paper-source: 0;
}
body {
  font-family: 'Calibri', 'Segoe UI', sans-serif;
  font-size: 11pt;
  color: #1e293b;
  line-height: 1.5;
}
.cover {
  text-align: center;
  padding: 60pt 20pt;
  page-break-after: always;
}
.cover-banner {
  background: ${headerColor};
  color: white;
  padding: 40pt 30pt;
  border-radius: 8pt;
  margin-bottom: 24pt;
}
.cover-title {
  font-size: 32pt;
  font-weight: bold;
  margin: 0 0 12pt 0;
  letter-spacing: 0.5pt;
}
.cover-subtitle {
  font-size: 14pt;
  opacity: 0.95;
  margin: 0 0 20pt 0;
}
.cover-meta {
  font-size: 11pt;
  margin-top: 30pt;
  color: #475569;
}
.cover-meta div { margin: 6pt 0; }
.cover-meta strong { color: ${headerColor}; }
.footer-info {
  margin-top: 40pt;
  padding: 12pt;
  background: #f5f3ff;
  border-radius: 6pt;
  font-size: 9pt;
  color: #6b21a8;
}
table { border-collapse: collapse; }
br.page-break {
  page-break-before: always;
  mso-special-character: line-break;
}
</style>
</head>
<body>

<div class="cover">
  <div class="cover-banner">
    <div style="font-size:10pt;letter-spacing:3pt;opacity:0.9;text-transform:uppercase;margin-bottom:8pt;">${escapeHtml(autor)}</div>
    <div class="cover-title">${escapeHtml(titulo)}</div>
    ${subtitulo ? `<div class="cover-subtitle">${escapeHtml(subtitulo)}</div>` : ''}
  </div>
  
  <div class="cover-meta">
    ${empresa ? `<div><strong>Empresa:</strong> ${escapeHtml(empresa)}</div>` : ''}
    ${projeto ? `<div><strong>Projeto:</strong> ${escapeHtml(projeto)}</div>` : ''}
    <div><strong>Data:</strong> ${dataAtual}</div>
  </div>
  
  <div class="footer-info">
    Documento gerado com tecnologia de Inteligência Artificial<br>
    Validado pela metodologia <strong>MIT CISR Enterprise AI Maturity Model</strong>
  </div>
</div>

${bodyHtml}

<br><br>
<hr style="border:none;border-top:1pt solid ${accentColor};margin:20pt 0;">
<p style="text-align:center;font-size:9pt;color:#94a3b8;">
  ${escapeHtml(autor)} · Gerado em ${new Date().toLocaleString('pt-BR')}
</p>

</body>
</html>`;
  
  return html;
}

/**
 * Faz o download de um arquivo .doc gerado a partir de Markdown
 */
export function downloadMarkdownAsDoc(markdown, filename, options = {}) {
  const html = generateDocFromMarkdown(markdown, options);
  
  // Adiciona BOM para garantir encoding UTF-8 no Word
  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword;charset=utf-8'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/** Evita quebra de tabela Markdown em células */
function mdCell(s) {
  if (s == null || s === '') return '—';
  return String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

const MIT_NIVEL_COMPLETO_LABELS = [
  'Inicial / Experimentando',
  'Oportunista / Preparando',
  'Sistemático / Escalando',
  'Diferenciado / Industrializando',
  'Transformador / Liderando'
];

/** Nível no book completo pode vir como número 1–5 ou texto (cache antigo). */
function formatNivelBookCompleto(nivel) {
  if (nivel == null || nivel === '') return '—';
  const n = Math.round(Number(nivel));
  if (!Number.isNaN(n) && n >= 1 && n <= 5) {
    const nome = MIT_NIVEL_COMPLETO_LABELS[n - 1] || '';
    return nome ? `${n} — ${nome}` : String(n);
  }
  return String(nivel);
}

/**
 * Documento Markdown completo para o Book MIT IA Completo:
 * mesma informação que o Word (capa institucional + metadados + corpo IA),
 * apenas em outro formato. O .doc continua usando só o corpo IA na conversão
 * + capa gerada por generateDocFromMarkdown (equivalente visual).
 */
export function buildMITBookCompletoMarkdownDocument(apiResponse) {
  const data = apiResponse || {};
  const d = data.dadosUsados || {};
  const relatorio = data.relatorio != null ? String(data.relatorio) : '';
  const dataVersao = data.dataGeracao
    ? new Date(data.dataGeracao).toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR');
  const scoreStr =
    d.scoreGeral != null && !Number.isNaN(Number(d.scoreGeral))
      ? Number(d.scoreGeral).toFixed(2)
      : '—';

  const header = `# Book de Trabalho — Maturidade em IA

**Análise Aprofundada por Dimensão · Roadmap · KPIs · Governança**

_Este arquivo corresponde ao mesmo documento exportado em Word: capa e identificação abaixo + corpo gerado pela IA após o separador._

## Capa / Identificação

| Campo | Valor |
|-------|-------|
| Empresa | ${mdCell(d.empresa)} |
| Projeto | ${mdCell(d.projeto)} |
| Score geral | ${scoreStr} |
| Nível | ${mdCell(formatNivelBookCompleto(d.nivel))} |
| Setor | ${mdCell(d.setor)} |
| Porte | ${mdCell(d.porte)} |
| Dimensões (com score) | ${d.scoresPorArea?.length ?? '—'} |
| Avaliadores | ${d.totalAvaliadores ?? '—'} |

## Metadados da geração

| Campo | Valor |
|-------|-------|
| Versão | ${data.versao != null ? `v${data.versao}` : '—'} |
| Origem | ${data.fromCache ? 'Versão salva (biblioteca)' : 'Gerado nesta sessão'} |
| Data da versão | ${mdCell(dataVersao)} |
| Provedor IA | ${mdCell(data.provider)} |
| Modelo | ${mdCell(data.model)} |
| Tokens (entrada ↓ saída) | ${data.tokens?.entrada ?? '—'} / ${data.tokens?.saida ?? '—'} |
| Tempo | ${data.tempoResposta != null ? `${(data.tempoResposta / 1000).toFixed(1)} s` : '—'} |
| Chunks | ${data.chunksGerados != null && data.totalChunks != null ? `${data.chunksGerados} / ${data.totalChunks}` : '—'} |

---

## Conteúdo gerado (IA)

`;

  return `${header}${relatorio}`;
}

/** Nome de arquivo seguro (dadosUsados pode ser null em registros antigos). */
export function bookMITCompletoSafeBaseName(apiResponse) {
  const raw =
    apiResponse?.dadosUsados?.projeto ||
    apiResponse?.dadosUsados?.empresa ||
    'Book_Maturidade_IA';
  return String(raw).replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '');
}

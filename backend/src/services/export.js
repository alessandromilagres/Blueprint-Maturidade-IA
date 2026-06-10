/**
 * Serviço de Exportação de Documentos
 * Gera HTML, Markdown e DOCX a partir do conteúdo
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';

/**
 * Converte Markdown para HTML estilizado para PDF
 */
function markdownToHtml(markdown, titulo) {
  // Converte markdown básico para HTML
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 16px; font-weight: bold; margin-top: 20px; color: #1f2937;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 18px; font-weight: bold; margin-top: 24px; color: #111827;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 22px; font-weight: bold; margin-top: 28px; color: #111827;">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre style="background: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; overflow-x: auto; margin: 12px 0;">$2</pre>')
    // Inline code
    .replace(/`([^`]+)`/gim, '<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px;">$1</code>')
    // Lists
    .replace(/^\s*[-*]\s(.+)$/gim, '<li style="margin-left: 20px;">$1</li>')
    // Numbered lists
    .replace(/^\d+\.\s(.+)$/gim, '<li style="margin-left: 20px;">$1</li>')
    // Line breaks
    .replace(/\n\n/gim, '</p><p style="margin: 10px 0; line-height: 1.6;">')
    .replace(/\n/gim, '<br>');
  
  // Wrap tables
  html = html.replace(/\|(.+)\|/gim, (match) => {
    const cells = match.split('|').filter(c => c.trim());
    if (cells.every(c => c.trim().match(/^-+$/))) {
      return '';
    }
    const row = cells.map(c => `<td style="border: 1px solid #d1d5db; padding: 8px;">${c.trim()}</td>`).join('');
    return `<tr>${row}</tr>`;
  });
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${titulo}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #374151;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 8px;
      text-align: left;
    }
    th {
      background: #f9fafb;
      font-weight: bold;
    }
    ul, ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3b82f6;
    }
    .header h1 {
      color: #1e40af;
      margin: 0;
      font-size: 28px;
    }
    .header .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin-top: 8px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${titulo}</h1>
    <div class="subtitle">Blueprint IA - Especificação Automática</div>
    <div class="subtitle">Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
  </div>
  
  <div class="content">
    <p style="margin: 10px 0; line-height: 1.6;">${html}</p>
  </div>
  
  <div class="footer">
    Documento gerado automaticamente pelo Blueprint IA<br>
    © ${new Date().getFullYear()} SysMap Solutions
  </div>
</body>
</html>`;
}

/**
 * Gera HTML completo com todos os documentos da especificação
 */
function gerarHtmlCompleto(especificacao, produto) {
  const documentos = especificacao.documentos || [];
  
  let conteudo = documentos
    .sort((a, b) => a.ordem - b.ordem)
    .map(doc => `
      <div style="page-break-before: always;">
        <h1 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          ${doc.titulo}
        </h1>
        ${markdownToHtml(doc.conteudo, doc.titulo)}
      </div>
    `)
    .join('\n');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Especificação - ${produto.nome}</title>
  <style>
    @page {
      margin: 2cm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #374151;
    }
    h1 { font-size: 20px; color: #1e40af; }
    h2 { font-size: 16px; color: #1f2937; }
    h3 { font-size: 14px; color: #374151; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; font-size: 11px; }
    th { background: #f3f4f6; font-weight: bold; }
    pre { background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 10px; overflow-x: auto; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 2px; font-size: 11px; }
    ul, ol { margin: 8px 0; padding-left: 20px; }
    li { margin: 4px 0; }
    .cover {
      text-align: center;
      padding: 100px 40px;
      page-break-after: always;
    }
    .cover h1 {
      font-size: 32px;
      color: #1e40af;
      margin-bottom: 20px;
    }
    .cover .product-name {
      font-size: 24px;
      color: #374151;
      margin-bottom: 40px;
    }
    .cover .meta {
      color: #6b7280;
      font-size: 14px;
      margin-top: 60px;
    }
    .toc {
      page-break-after: always;
    }
    .toc h2 {
      color: #1e40af;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 10px;
    }
    .toc ul {
      list-style: none;
      padding: 0;
    }
    .toc li {
      padding: 8px 0;
      border-bottom: 1px dotted #d1d5db;
    }
  </style>
</head>
<body>
  <!-- Capa -->
  <div class="cover">
    <h1>ESPECIFICAÇÃO TÉCNICA</h1>
    <div class="product-name">${produto.nome}</div>
    <div class="meta">
      <p><strong>Versão:</strong> ${especificacao.versao}</p>
      <p><strong>Data:</strong> ${new Date(especificacao.createdAt).toLocaleDateString('pt-BR')}</p>
      <p><strong>Status:</strong> ${especificacao.status}</p>
      ${especificacao.horasEstimadas ? `<p><strong>Horas Estimadas:</strong> ${especificacao.horasEstimadas}h</p>` : ''}
      ${especificacao.custoDesenvolvimento ? `<p><strong>Custo Estimado:</strong> R$ ${especificacao.custoDesenvolvimento.toLocaleString('pt-BR')}</p>` : ''}
      ${especificacao.prazoSemanas ? `<p><strong>Prazo:</strong> ${especificacao.prazoSemanas} semanas</p>` : ''}
    </div>
    <div class="meta" style="margin-top: 100px;">
      <p>Blueprint IA - Sistema de Assessment de Maturidade em IA</p>
      <p>© ${new Date().getFullYear()} SysMap Solutions</p>
    </div>
  </div>
  
  <!-- Sumário -->
  <div class="toc">
    <h2>Sumário</h2>
    <ul>
      ${documentos.map((doc, i) => `<li>${i + 1}. ${doc.titulo}</li>`).join('\n')}
    </ul>
  </div>
  
  <!-- Conteúdo -->
  ${conteudo}
  
</body>
</html>`;
}

/**
 * Gera conteúdo Markdown consolidado
 */
function gerarMarkdownConsolidado(especificacao, produto) {
  const documentos = especificacao.documentos || [];
  
  let markdown = `# Especificação Técnica - ${produto.nome}

**Versão:** ${especificacao.versao}
**Data:** ${new Date(especificacao.createdAt).toLocaleDateString('pt-BR')}
**Status:** ${especificacao.status}

---

`;

  if (especificacao.horasEstimadas) {
    markdown += `**Horas Estimadas:** ${especificacao.horasEstimadas}h\n`;
  }
  if (especificacao.custoDesenvolvimento) {
    markdown += `**Custo Estimado:** R$ ${especificacao.custoDesenvolvimento.toLocaleString('pt-BR')}\n`;
  }
  if (especificacao.prazoSemanas) {
    markdown += `**Prazo:** ${especificacao.prazoSemanas} semanas\n`;
  }
  if (especificacao.tamanhoEquipe) {
    markdown += `**Equipe:** ${especificacao.tamanhoEquipe} pessoas\n`;
  }

  markdown += '\n---\n\n## Sumário\n\n';
  documentos.forEach((doc, i) => {
    markdown += `${i + 1}. [${doc.titulo}](#${doc.tipo})\n`;
  });
  
  markdown += '\n---\n\n';
  
  documentos.forEach(doc => {
    markdown += `<a name="${doc.tipo}"></a>\n\n`;
    markdown += `# ${doc.titulo}\n\n`;
    markdown += doc.conteudo;
    markdown += '\n\n---\n\n';
  });
  
  markdown += `\n\n---\n*Documento gerado automaticamente pelo Blueprint IA em ${new Date().toLocaleString('pt-BR')}*\n`;
  
  return markdown;
}

/**
 * Remove emojis e caracteres especiais que podem causar problemas no Word
 */
function limparTextoParaWord(text) {
  if (!text) return '';
  
  // Remove emojis e caracteres especiais Unicode
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis diversos
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Símbolos diversos
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transporte e símbolos
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Bandeiras
    .replace(/[🔹🔸◆◇●○▪▫★☆✓✔✗✘⚡💡🎯📋📊📌🔍💰⚠️📄📁🏗️🚀💻📈📉🔐🛡️⚙️🔧]/g, '') // Emojis comuns
    .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Zero-width characters
    .trim();
}

// Configuração de fonte para Word
const WORD_FONT = 'Courier New';
const WORD_FONT_SIZE = 20; // 10pt em half-points (era 12pt = 24, -2pt = 10pt = 20)
const WORD_FONT_SIZE_SMALL = 18; // 9pt para textos menores
const WORD_FONT_SIZE_LARGE = 22; // 11pt para destaques

/**
 * Converte texto markdown para elementos do docx
 * Usa fonte Courier New para melhor alinhamento de tabelas e código
 */
function parseMarkdownToDocx(text) {
  const elements = [];
  
  if (!text || typeof text !== 'string') {
    return elements;
  }
  
  // Limpa o texto de emojis e caracteres problemáticos
  const cleanedText = limparTextoParaWord(text);
  const lines = cleanedText.split('\n');
  
  let listCounter = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Headers
    if (line.startsWith('#### ')) {
      elements.push(new Paragraph({
        children: [new TextRun({ 
          text: limparTextoParaWord(line.replace('#### ', '')),
          font: WORD_FONT,
          size: 24, // 12pt para H4
          bold: true
        })],
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 150, after: 80 }
      }));
    } else if (line.startsWith('### ')) {
      elements.push(new Paragraph({
        children: [new TextRun({ 
          text: limparTextoParaWord(line.replace('### ', '')),
          font: WORD_FONT,
          size: 26, // 13pt para H3
          bold: true
        })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 }
      }));
    } else if (line.startsWith('## ')) {
      elements.push(new Paragraph({
        children: [new TextRun({ 
          text: limparTextoParaWord(line.replace('## ', '')),
          font: WORD_FONT,
          size: 28, // 14pt para H2
          bold: true
        })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 }
      }));
    } else if (line.startsWith('# ')) {
      elements.push(new Paragraph({
        children: [new TextRun({ 
          text: limparTextoParaWord(line.replace('# ', '')),
          font: WORD_FONT,
          size: 32, // 16pt para H1
          bold: true
        })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 150 }
      }));
    }
    // Lista com bullet
    else if (line.match(/^\s*[-*]\s/)) {
      const content = limparTextoParaWord(line.replace(/^\s*[-*]\s/, ''));
      elements.push(new Paragraph({
        children: [new TextRun({ text: content, font: WORD_FONT, size: WORD_FONT_SIZE })],
        bullet: { level: 0 },
        spacing: { before: 50, after: 50 }
      }));
    }
    // Lista numerada - converte para bullet com prefixo numérico
    else if (line.match(/^\d+\.\s/)) {
      listCounter++;
      const content = limparTextoParaWord(line.replace(/^\d+\.\s/, ''));
      elements.push(new Paragraph({
        children: [
          new TextRun({ text: `${listCounter}. `, bold: true, font: WORD_FONT, size: WORD_FONT_SIZE }),
          new TextRun({ text: content, font: WORD_FONT, size: WORD_FONT_SIZE })
        ],
        indent: { left: 720 },
        spacing: { before: 50, after: 50 }
      }));
    }
    // Linha horizontal
    else if (line.match(/^---+$/)) {
      listCounter = 0; // Reset counter
      elements.push(new Paragraph({
        children: [new TextRun({ 
          text: '────────────────────────────────────────────────────────────────',
          font: WORD_FONT,
          size: WORD_FONT_SIZE
        })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 }
      }));
    }
    // Tabela markdown (simplificada - converte para texto monoespacado)
    else if (line.startsWith('|')) {
      // Extrai células da tabela
      const cells = line.split('|').filter(c => c.trim() && !c.match(/^[-:]+$/));
      if (cells.length > 0) {
        const content = cells.map(c => limparTextoParaWord(c.trim())).join(' | ');
        elements.push(new Paragraph({
          children: [new TextRun({ text: content, font: WORD_FONT, size: WORD_FONT_SIZE_SMALL })],
          spacing: { before: 50, after: 50 }
        }));
      }
    }
    // Parágrafo normal (ignora linhas vazias extras)
    else if (line.trim()) {
      listCounter = 0; // Reset counter
      // Remove marcações de bold e italic para simplificar
      const cleanText = limparTextoParaWord(line)
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1');
      
      elements.push(new Paragraph({
        children: [new TextRun({ text: cleanText, font: WORD_FONT, size: WORD_FONT_SIZE })],
        spacing: { before: 100, after: 100 }
      }));
    }
  }
  
  return elements;
}

/**
 * Gera documento Word (.docx) completo
 * Usa fonte Courier New para melhor formatação de tabelas e código
 */
async function gerarDocx(especificacao, produto) {
  const documentos = especificacao?.documentos || [];
  const nomeProduto = limparTextoParaWord(produto?.nome || 'Produto sem nome');
  
  const sections = [];
  
  // Capa
  sections.push(
    new Paragraph({
      children: [new TextRun({ 
        text: 'ESPECIFICACAO TECNICA',
        font: WORD_FONT,
        size: 40, // 20pt
        bold: true
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000, after: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ 
        text: nomeProduto,
        font: WORD_FONT,
        size: 32, // 16pt
        bold: true
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 }
    }),
    new Paragraph({
      children: [new TextRun({ text: `Versao: ${especificacao?.versao || 1}`, bold: true, font: WORD_FONT, size: WORD_FONT_SIZE })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [new TextRun({ text: `Data: ${especificacao?.createdAt ? new Date(especificacao.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}`, font: WORD_FONT, size: WORD_FONT_SIZE })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [new TextRun({ text: `Status: ${especificacao?.status || 'N/A'}`, font: WORD_FONT, size: WORD_FONT_SIZE })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );
  
  // Métricas - Usa os novos campos duais se disponíveis
  const temMetricas = especificacao?.storyPointsTotais || 
                      especificacao?.horasTradicional || 
                      especificacao?.horasAgentica ||
                      especificacao?.horasEstimadas;
  
  if (temMetricas) {
    sections.push(
      new Paragraph({ text: '', spacing: { after: 400 } }),
      new Paragraph({
        children: [new TextRun({ text: 'Resumo Executivo', font: WORD_FONT, size: 28, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );
    
    // Story Points totais
    if (especificacao.storyPointsTotais) {
      sections.push(new Paragraph({
        children: [new TextRun({ text: `Total de Story Points: ${especificacao.storyPointsTotais} SP`, bold: true, font: WORD_FONT, size: WORD_FONT_SIZE_LARGE })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }));
    }
    
    // Cenário Tradicional
    if (especificacao.horasTradicional || especificacao.custoTradicional) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: 'Desenvolvimento Tradicional', font: WORD_FONT, size: 24, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 100 }
        })
      );
      
      if (especificacao.horasTradicional) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Horas: ${especificacao.horasTradicional.toLocaleString('pt-BR')}h`, font: WORD_FONT, size: WORD_FONT_SIZE })],
          alignment: AlignmentType.CENTER
        }));
      }
      if (especificacao.custoTradicional) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Custo: R$ ${especificacao.custoTradicional.toLocaleString('pt-BR')}`, font: WORD_FONT, size: WORD_FONT_SIZE })],
          alignment: AlignmentType.CENTER
        }));
      }
      if (especificacao.prazoTradicional) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Prazo: ${especificacao.prazoTradicional} semanas`, font: WORD_FONT, size: WORD_FONT_SIZE })],
          alignment: AlignmentType.CENTER
        }));
      }
      if (especificacao.equipeTradicional) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Equipe: ${especificacao.equipeTradicional} desenvolvedores`, font: WORD_FONT, size: WORD_FONT_SIZE })],
          alignment: AlignmentType.CENTER
        }));
      }
    }
    
    // Cenário Agêntico
    if (especificacao.horasAgentica || especificacao.custoAgentica) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: 'Fabrica Agentica (com IA)', font: WORD_FONT, size: 24, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 100 }
        })
      );
      
      if (especificacao.horasAgentica) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Horas: ${especificacao.horasAgentica.toLocaleString('pt-BR')}h`, font: WORD_FONT, size: WORD_FONT_SIZE })],
          alignment: AlignmentType.CENTER
        }));
      }
      if (especificacao.custoAgentica) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Custo: R$ ${especificacao.custoAgentica.toLocaleString('pt-BR')}`, font: WORD_FONT, size: WORD_FONT_SIZE })],
          alignment: AlignmentType.CENTER
        }));
      }
      if (especificacao.prazoAgentica) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Prazo: ${especificacao.prazoAgentica} semanas`, font: WORD_FONT, size: WORD_FONT_SIZE })],
          alignment: AlignmentType.CENTER
        }));
      }
      if (especificacao.equipeAgentica) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Equipe: ${especificacao.equipeAgentica} desenvolvedores`, font: WORD_FONT, size: WORD_FONT_SIZE })],
          alignment: AlignmentType.CENTER
        }));
      }
    }
    
    // Fallback para campos antigos
    if (!especificacao.horasTradicional && !especificacao.horasAgentica) {
      if (especificacao.horasEstimadas) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Horas Estimadas: ${especificacao.horasEstimadas}h`, bold: true, font: WORD_FONT, size: WORD_FONT_SIZE })],
          alignment: AlignmentType.CENTER
        }));
      }
      if (especificacao.custoDesenvolvimento) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Custo Estimado: R$ ${especificacao.custoDesenvolvimento.toLocaleString('pt-BR')}`, bold: true, font: WORD_FONT, size: WORD_FONT_SIZE })],
          alignment: AlignmentType.CENTER
        }));
      }
      if (especificacao.prazoSemanas) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Prazo: ${especificacao.prazoSemanas} semanas`, bold: true, font: WORD_FONT, size: WORD_FONT_SIZE })],
          alignment: AlignmentType.CENTER
        }));
      }
      if (especificacao.tamanhoEquipe) {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `Equipe: ${especificacao.tamanhoEquipe} pessoas`, bold: true, font: WORD_FONT, size: WORD_FONT_SIZE })],
          alignment: AlignmentType.CENTER
        }));
      }
    }
  }
  
  // Quebra de página antes do sumário
  sections.push(new Paragraph({ text: '', pageBreakBefore: true }));
  
  // Sumário
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'Sumario', font: WORD_FONT, size: 32, bold: true })],
      spacing: { after: 300 }
    })
  );
  
  documentos.forEach((doc, i) => {
    const titulo = limparTextoParaWord(doc?.titulo || `Documento ${i + 1}`);
    sections.push(new Paragraph({
      children: [new TextRun({ text: `${i + 1}. ${titulo}`, font: WORD_FONT, size: WORD_FONT_SIZE })],
      spacing: { before: 100, after: 100 }
    }));
  });
  
  // Conteúdo dos documentos
  documentos.forEach((doc, index) => {
    // Quebra de página antes de cada documento
    sections.push(new Paragraph({ text: '', pageBreakBefore: true }));
    
    // Título do documento
    const titulo = limparTextoParaWord(doc?.titulo || `Documento ${index + 1}`);
    sections.push(new Paragraph({
      children: [new TextRun({ text: titulo, font: WORD_FONT, size: 32, bold: true })],
      spacing: { after: 300 }
    }));
    
    // Conteúdo - verifica se existe
    if (doc?.conteudo) {
      const docElements = parseMarkdownToDocx(doc.conteudo);
      sections.push(...docElements);
    } else {
      sections.push(new Paragraph({
        children: [new TextRun({ text: 'Conteudo nao disponivel.', italics: true, font: WORD_FONT, size: WORD_FONT_SIZE })],
        spacing: { before: 100, after: 100 }
      }));
    }
  });
  
  // Rodapé
  sections.push(
    new Paragraph({ text: '', spacing: { before: 600 } }),
    new Paragraph({
      children: [new TextRun({ 
        text: `Documento gerado automaticamente pelo Blueprint IA em ${new Date().toLocaleString('pt-BR')}`,
        italics: true,
        font: WORD_FONT,
        size: WORD_FONT_SIZE_SMALL
      })],
      alignment: AlignmentType.CENTER
    })
  );
  
  const doc = new Document({
    creator: 'Blueprint IA',
    title: `Especificacao - ${nomeProduto}`,
    description: 'Documento de especificacao tecnica gerado por IA',
    sections: [{
      properties: {},
      children: sections
    }]
  });
  
  return await Packer.toBuffer(doc);
}

export {
  markdownToHtml,
  gerarHtmlCompleto,
  gerarMarkdownConsolidado,
  gerarDocx
};

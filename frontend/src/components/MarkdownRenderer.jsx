import { useEffect, useRef, useState, useDeferredValue } from 'react';
import mermaid from 'mermaid';
import { criarRegistroSlugs } from '../utils/markdownSlug.js';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  },
  sequence: {
    useMaxWidth: true,
    wrap: true
  },
  er: {
    useMaxWidth: true
  },
  gantt: {
    useMaxWidth: true
  }
});

/** Sem isto, falhas em parse/render chamam parseError padrão do Mermaid e podem injetar texto no body. */
if (typeof mermaid.setParseErrorHandler === 'function') {
  mermaid.setParseErrorHandler(() => {});
}

function extractMermaidBlocks(text) {
  const mermaidBlocks = [];
  let index = 0;
  
  const processedText = text.replace(/```mermaid\n([\s\S]*?)```/gim, (match, code) => {
    const placeholder = `__MERMAID_PLACEHOLDER_${index}__`;
    mermaidBlocks.push({
      id: `mermaid-${index}`,
      code: code.trim()
    });
    index++;
    return placeholder;
  });
  
  return { processedText, mermaidBlocks };
}

function escapeHtmlHeading(raw) {
  const strip = String(raw)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .trim();
  return strip
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const HEADING_ORDER = [
  [/^####\s+(.+)$/, 'h4', 'text-base font-semibold mt-4 mb-2 text-gray-800 scroll-mt-28'],
  [/^###\s+(.+)$/, 'h3', 'text-lg font-semibold mt-6 mb-2 text-gray-800 scroll-mt-28'],
  [/^##\s+(.+)$/, 'h2', 'text-xl font-semibold mt-8 mb-3 text-gray-900 border-b pb-2 scroll-mt-28'],
  [/^#\s+(.+)$/, 'h1', 'text-2xl font-bold mt-8 mb-4 text-gray-900 scroll-mt-28']
];

/** Converte # / ## / ### / #### com id=âncora (ordem do documento = mesmos slugs do índice do book). */
function convertMarkdownHeadingsComAncoras(text) {
  const slugNext = criarRegistroSlugs();
  const lines = text.split('\n');
  let inCodeFence = false;
  return lines
    .map((line) => {
      const t = line.trim();
      if (t.startsWith('```')) {
        inCodeFence = !inCodeFence;
        return line;
      }
      if (inCodeFence) return line;
      for (const [re, tag, cls] of HEADING_ORDER) {
        const m = line.match(re);
        if (m) {
          const title = m[1].trim();
          const id = slugNext(title);
          return `<${tag} id="${id}" class="${cls}">${escapeHtmlHeading(title)}</${tag}>`;
        }
      }
      return line;
    })
    .join('\n');
}

function convertMarkdownTables(text, { skipHeadingLines = false } = {}) {
  return text
    .split('\n')
    .map((line) => {
      if (skipHeadingLines && /^\s*<h[1-4]\b/i.test(line.trim())) {
        return line;
      }
      if (!line.includes('|')) return line;
      const cells = line.split('|').filter((c) => c.trim());
      if (cells.length < 2) return line;
      if (cells.every((c) => c.trim().match(/^[-:]+$/))) {
        return '';
      }
      const isHeader = cells.some((c) => c.includes('**'));
      const cellTag = isHeader ? 'th' : 'td';
      const cellClass = isHeader
        ? 'border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left'
        : 'border border-gray-300 px-4 py-2';
      const row = cells
        .map(
          (c) =>
            `<${cellTag} class="${cellClass}">${c.trim().replace(/\*\*/g, '')}</${cellTag}>`
        )
        .join('');
      return `<tr>${row}</tr>`;
    })
    .join('\n')
    .replace(/(<tr>.*<\/tr>\s*)+/gim, '<table class="w-full border-collapse my-4 text-sm">$&</table>');
}

function renderBasicMarkdown(text, { bookCompleto = false } = {}) {
  if (!text) return '';

  const comHeadings = convertMarkdownHeadingsComAncoras(text);
  const comTabelas = convertMarkdownTables(comHeadings, { skipHeadingLines: bookCompleto });

  return comTabelas
    .replace(/\*\*\*(.+?)\*\*\*/gim, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/gim, '<em>$1</em>')
    .replace(/~~(.+?)~~/gim, '<del>$1</del>')
    .replace(/```(\w+)?\n([\s\S]*?)```/gim, (match, lang, code) => {
      const langLabel = lang ? `<span class="absolute top-2 right-2 text-xs text-gray-500">${lang}</span>` : '';
      return `<div class="relative my-4">${langLabel}<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm"><code>${escapeHtml(code)}</code></pre></div>`;
    })
    .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600">$1</code>')
    .replace(/^\s*>\s*(.+)$/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic">$1</blockquote>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener">$1</a>')
    .replace(/^[-*]\s+(.+)$/gim, '<li class="ml-4 my-1">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\s*)+/gim, '<ul class="list-disc pl-4 my-3">$&</ul>')
    .replace(/^\d+\.\s+(.+)$/gim, '<li class="ml-4 my-1">$1</li>')
    .replace(/^---$/gim, '<hr class="my-6 border-gray-300">')
    .replace(/\n\n+/gim, '</p><p class="my-3">')
    .replace(/\n/gim, '<br>');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default function MarkdownRenderer({ content, className = '', bookCompleto = false }) {
  const containerRef = useRef(null);
  const deferredContent = useDeferredValue(content);
  const [renderedContent, setRenderedContent] = useState('');
  const [mermaidBlocks, setMermaidBlocks] = useState([]);
  const [mermaidRendered, setMermaidRendered] = useState({});

  useEffect(() => {
    if (!deferredContent) {
      setRenderedContent('');
      setMermaidBlocks([]);
      return;
    }

    const { processedText, mermaidBlocks: blocks } = extractMermaidBlocks(deferredContent);
    const html = renderBasicMarkdown(processedText, { bookCompleto });
    
    setMermaidBlocks(blocks);
    setRenderedContent(html);
    setMermaidRendered({});
  }, [deferredContent, bookCompleto]);

  useEffect(() => {
    if (mermaidBlocks.length === 0) return;

    const renderMermaidDiagrams = async () => {
      const rendered = {};

      for (let idx = 0; idx < mermaidBlocks.length; idx++) {
        const block = mermaidBlocks[idx];
        /** Obrigatório: sem container o Mermaid anexa SVG/erro ao body (aparece no rodapé). */
        const host = document.createElement('div');
        host.setAttribute('data-mermaid-host', block.id);
        host.style.cssText =
          'position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
        document.body.appendChild(host);

        const renderId = `${block.id}-r${idx}-${Date.now()}`;

        try {
          const parsed = await mermaid.parse(block.code, { suppressErrors: true });
          if (parsed === false) {
            rendered[block.id] = {
              svg: null,
              error: 'Diagrama com sintaxe Mermaid inválida ou não suportada.'
            };
            continue;
          }
          const { svg } = await mermaid.render(renderId, block.code, host);
          rendered[block.id] = { svg, error: null };
        } catch (error) {
          console.error(`Mermaid render error for ${block.id}:`, error);
          rendered[block.id] = {
            svg: null,
            error: error.message || 'Erro ao renderizar diagrama'
          };
        } finally {
          host.remove();
        }
      }

      setMermaidRendered(rendered);
    };

    renderMermaidDiagrams();
  }, [mermaidBlocks]);

  const getFinalHtml = () => {
    let html = renderedContent;
    
    mermaidBlocks.forEach((block, index) => {
      const placeholder = `__MERMAID_PLACEHOLDER_${index}__`;
      const result = mermaidRendered[block.id];
      
      if (result?.svg) {
        const diagramHtml = `
          <div class="my-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
            <div class="flex justify-center">${result.svg}</div>
          </div>
        `;
        html = html.replace(placeholder, diagramHtml);
      } else if (result?.error) {
        const errorHtml = `
          <div class="my-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-red-600 font-medium mb-2">Erro ao renderizar diagrama Mermaid:</p>
            <pre class="text-sm text-red-500 overflow-x-auto">${escapeHtml(result.error)}</pre>
            <details class="mt-2">
              <summary class="text-sm text-gray-500 cursor-pointer">Ver código do diagrama</summary>
              <pre class="mt-2 p-2 bg-gray-100 rounded text-sm overflow-x-auto">${escapeHtml(block.code)}</pre>
            </details>
          </div>
        `;
        html = html.replace(placeholder, errorHtml);
      } else {
        const loadingHtml = `
          <div class="my-6 p-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
            <div class="animate-pulse flex items-center gap-2 text-gray-500">
              <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Renderizando diagrama...</span>
            </div>
          </div>
        `;
        html = html.replace(placeholder, loadingHtml);
      }
    });
    
    return html;
  };

  return (
    <div 
      ref={containerRef}
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: getFinalHtml() }}
    />
  );
}

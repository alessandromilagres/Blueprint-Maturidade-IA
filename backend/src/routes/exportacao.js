/**
 * Rotas de Exportação de Dados
 * Exporta relatórios, projetos e especificações em Markdown
 */

import express from 'express';
import { prisma } from '../lib/prisma.js';
import archiver from 'archiver';
import {
  escalarRoiPercentModelo,
  multiplicadorRoiPorFaturamento,
  percentualReferenciaRoi
} from '../utils/roiPorFaturamento.js';
import {
  parseAreasRecusadas,
  parseAreasSelecionadas,
  respostasParaCalculo,
  areaContaParaAvaliacao
} from '../utils/avaliacaoAreasRecusadas.js';
import { desejosIaParaRespostasEmail, desejosIaTemRespostasGuardadas } from '../utils/desejosIaAvaliacaoMaturidade.js';
import { isMissingAvaliacaoDesejosIaTableError } from '../utils/avaliacaoDesejosIaMerge.js';

const router = express.Router();

function ajustarProjecaoExportacao(baseProjecao, faturamentoAnual) {
  const fat = faturamentoAnual != null && Number(faturamentoAnual) > 0 ? Number(faturamentoAnual) : null;
  if (!fat) return baseProjecao;
  const m = multiplicadorRoiPorFaturamento(fat);
  const pct = percentualReferenciaRoi(fat);
  const roi = escalarRoiPercentModelo(baseProjecao.roi.min, baseProjecao.roi.max, baseProjecao.roi.media, fat);
  return {
    ...baseProjecao,
    crescimento: {
      min: Math.round(baseProjecao.crescimento.min * m),
      max: Math.round(baseProjecao.crescimento.max * m),
      media: Math.round(baseProjecao.crescimento.media * m)
    },
    custos: {
      min: Math.round(baseProjecao.custos.min * m),
      max: Math.round(baseProjecao.custos.max * m),
      media: Math.round(baseProjecao.custos.media * m)
    },
    roi,
    investimento: `${baseProjecao.investimento} (ref. ${pct}% do faturamento anual do projeto)`
  };
}

/**
 * Função auxiliar para calcular nível de maturidade
 */
function calcularNivel(score) {
  if (score >= 4.5) return 'Otimizado';
  if (score >= 3.5) return 'Gerenciado';
  if (score >= 2.5) return 'Estruturado';
  if (score >= 1.5) return 'Oportunista';
  return 'Inicial';
}

function calcularScoreGeralAvaliacao(scoresPorArea) {
  const areasComScore = scoresPorArea.filter((area) => area.respondidas > 0);
  const totalPeso = areasComScore.reduce((acc, area) => acc + (area.peso || 1), 0);
  if (totalPeso <= 0) return 0;

  return areasComScore.reduce(
    (acc, area) => acc + area.score * (area.peso || 1),
    0
  ) / totalPeso;
}

/**
 * Gera Markdown do Relatório de Avaliação de Maturidade
 */
function gerarMarkdownRelatorio(avaliacao, projeto, empresa, scoresPorArea, resultadoAvaliacao = {}) {
  const dataAvaliacao = new Date(avaliacao.createdAt).toLocaleDateString('pt-BR');
  const dataGeracao = new Date().toLocaleDateString('pt-BR');
  const scoreGeral =
    typeof resultadoAvaliacao.scoreGeral === 'number'
      ? resultadoAvaliacao.scoreGeral
      : avaliacao.scoreGeral;
  const nivelGeral = resultadoAvaliacao.nivelGeral || avaliacao.nivelGeral;
  
  let md = `# Relatório de Maturidade em IA

## Blueprint Agêntico - Assessment de Maturidade

---

## Informações Gerais

| Campo | Valor |
|-------|-------|
| **Empresa** | ${empresa.nome} |
| **Projeto** | ${projeto.nome} |
| **Avaliador** | ${avaliacao.usuario?.nome || 'N/A'} |
| **Data da Avaliação** | ${dataAvaliacao} |
| **Status** | ${avaliacao.status} |

---

## Resultado Geral

| Métrica | Valor |
|---------|-------|
| **Score Geral** | ${scoreGeral != null ? scoreGeral.toFixed(2) : 'N/A'} / 5.00 |
| **Nível de Maturidade** | ${nivelGeral || 'N/A'} |

---

## Scores por Dimensão

| Dimensão | Score | Nível | Perguntas |
|----------|-------|-------|-----------|
`;

  scoresPorArea.forEach(area => {
    md += `| ${area.area} | ${area.score.toFixed(2)} | ${area.nivel} | ${area.respondidas}/${area.total} |\n`;
  });

  md += `
---

## Escala de Maturidade

| Nível | Score | Descrição |
|-------|-------|-----------|
| Inicial | 1.0 - 1.5 | Sem estratégia formal de IA, iniciativas isoladas e reativas |
| Oportunista | 1.5 - 2.5 | Experimentos iniciais, algumas iniciativas de IA em andamento |
| Estruturado | 2.5 - 3.5 | Processos definidos, projetos de IA estruturados e alinhados |
| Gerenciado | 3.5 - 4.5 | IA integrada ao negócio, governança estabelecida, escala |
| Otimizado | 4.5 - 5.0 | IA como diferencial competitivo, inovação contínua, referência |

---

## Recomendações

`;

  const areasParaMelhorar = scoresPorArea
    .filter(a => a.score < 3)
    .sort((a, b) => a.score - b.score);

  if (areasParaMelhorar.length > 0) {
    md += `As seguintes áreas precisam de atenção prioritária:\n\n`;
    areasParaMelhorar.forEach((area, index) => {
      md += `### ${index + 1}. ${area.area}\n`;
      md += `- **Score atual:** ${area.score.toFixed(2)} (${area.nivel})\n`;
      md += `- **Recomendação:** Desenvolver plano de ação para elevar a maturidade nesta dimensão.\n\n`;
    });
  } else {
    md += `Parabéns! Todas as áreas estão com score acima de 3.0 (Estruturado).\n`;
    md += `Continue investindo para alcançar a excelência em todas as dimensões.\n`;
  }

  md += `
---

## Próximos Passos

1. Revisar as áreas com menor pontuação
2. Desenvolver plano de ação para cada dimensão prioritária
3. Agendar reavaliação em 6-12 meses para medir evolução
4. Considerar avaliação de produtos IA-First para iniciativas específicas

---

*Documento gerado automaticamente pelo Blueprint Agêntico em ${dataGeracao}*

*© ${new Date().getFullYear()} SysMap Solutions*
`;

  return md;
}

// Mapeamento de IDs para nomes legíveis
const AUDIENCIAS_PRIMARIAS = {
  'time_executivo': 'Time Executivo',
  'board': 'Board',
  'lideres_operacao': 'Líderes de Operação',
  'lideres_produto': 'Líderes de Produto',
  'lideres_financeiros': 'Líderes Financeiros',
};

const LENTES_PRIORITARIAS = {
  'aumento_receita': 'Aumento da receita',
  'reducao_custos': 'Redução de custos',
  'operacoes': 'Operações',
  'suporte_cliente': 'Suporte ao cliente',
  'produtividade_vendas': 'Produtividade de vendas',
  'trabalho_intelectual': 'Trabalho intelectual',
  'risco_conformidade': 'Risco e conformidade',
  'entrega_produtos': 'Entrega de produtos',
};

const VERTICAIS = {
  'fintech': 'Tecnologia Financeira (FinTech)',
  'aifirst': 'Inteligência Artificial (AI First)',
  'edtech': 'Tecnologia Educacional (EdTech)',
  'legaltech': 'Legal Tech',
  'saude': 'Saúde e Bem-Estar',
  'ecommerce': 'E-commerce e Varejo',
  'manufatura': 'Manufatura e Indústria',
  'agrovert': 'Agricultura Vertical e Sustentabilidade',
  'tecnologia': 'Tecnologia (Software e Consultoria)',
};

/**
 * Gera Markdown com dados cadastrais da Empresa e Projeto
 */
function gerarMarkdownCadastroEmpresaProjeto(projeto) {
  const dataGeracao = new Date().toLocaleDateString('pt-BR');
  const empresa = projeto.empresa;
  
  // Parse dos campos JSON
  let audiencias = [];
  let lentes = [];
  
  try {
    if (projeto.audienciaPrimaria) {
      audiencias = JSON.parse(projeto.audienciaPrimaria);
    }
  } catch (e) {}
  
  try {
    if (projeto.lentesPrioritarias) {
      lentes = JSON.parse(projeto.lentesPrioritarias);
    }
  } catch (e) {}
  
  let md = `# Ficha Cadastral

## ${empresa.nome} - ${projeto.nome}

---

## Informações da Empresa

| Campo | Valor |
|-------|-------|
| **Razão Social** | ${empresa.nome} |
| **CNPJ** | ${empresa.cnpj || 'Não informado'} |
| **Setor de Atuação** | ${empresa.setor || 'Não informado'} |
| **Porte** | ${empresa.porte || 'Não informado'} |
| **E-mail** | ${empresa.email || 'Não informado'} |
| **Telefone** | ${empresa.telefone || 'Não informado'} |
| **Endereço** | ${empresa.endereco || 'Não informado'} |
| **Website** | ${empresa.website || 'Não informado'} |
| **Data de Cadastro** | ${new Date(empresa.createdAt).toLocaleDateString('pt-BR')} |

---

## Informações do Projeto

| Campo | Valor |
|-------|-------|
| **Nome do Projeto** | ${projeto.nome} |
| **Descrição** | ${projeto.descricao || 'Não informada'} |
| **Vertical / Setor** | ${projeto.vertical ? (VERTICAIS[projeto.vertical] || projeto.vertical) : 'Não definida'} |
| **Status** | ${projeto.status} |
| **Data de Criação** | ${new Date(projeto.createdAt).toLocaleDateString('pt-BR')} |
| **Última Atualização** | ${new Date(projeto.updatedAt).toLocaleDateString('pt-BR')} |

---

## Audiência Primária

`;

  if (audiencias.length > 0) {
    audiencias.forEach(a => {
      md += `- ${AUDIENCIAS_PRIMARIAS[a] || a}\n`;
    });
  } else {
    md += `*Não definida*\n`;
  }

  md += `
---

## Lentes Prioritárias

`;

  if (lentes.length > 0) {
    lentes.forEach(l => {
      md += `- ${LENTES_PRIORITARIAS[l] || l}\n`;
    });
  } else {
    md += `*Não definidas*\n`;
  }

  md += `
---

## Estatísticas

| Métrica | Valor |
|---------|-------|
| **Total de Avaliações** | ${projeto._count?.avaliacoes || projeto.avaliacoes?.length || 0} |
| **Total de Produtos** | ${projeto._count?.produtos || projeto.produtos?.length || 0} |
| **Total de Usuários na Empresa** | ${empresa._count?.usuarios || empresa.usuarios?.length || 0} |

---

*Documento gerado automaticamente pelo Blueprint Agêntico em ${dataGeracao}*

*© ${new Date().getFullYear()} SysMap Solutions*
`;

  return md;
}

/**
 * Gera Markdown completo do Projeto com todas as informações
 */
async function gerarMarkdownProjeto(projeto) {
  const dataGeracao = new Date().toLocaleDateString('pt-BR');
  
  let md = `# Projeto: ${projeto.nome}

## Blueprint Agêntico - Documentação Completa do Projeto

---

## 1. Informações do Projeto

| Campo | Valor |
|-------|-------|
| **Nome** | ${projeto.nome} |
| **Empresa** | ${projeto.empresa?.nome || 'N/A'} |
| **Descrição** | ${projeto.descricao || 'Não informada'} |
| **Vertical** | ${projeto.vertical || 'Não definida'} |
| **Status** | ${projeto.status} |
| **Data de Criação** | ${new Date(projeto.createdAt).toLocaleDateString('pt-BR')} |

---

## 2. Informações da Empresa

| Campo | Valor |
|-------|-------|
| **Nome** | ${projeto.empresa?.nome || 'N/A'} |
| **CNPJ** | ${projeto.empresa?.cnpj || 'Não informado'} |
| **Setor** | ${projeto.empresa?.setor || 'Não informado'} |
| **Porte** | ${projeto.empresa?.porte || 'Não informado'} |
| **E-mail** | ${projeto.empresa?.email || 'Não informado'} |
| **Telefone** | ${projeto.empresa?.telefone || 'Não informado'} |
| **Endereço** | ${projeto.empresa?.endereco || 'Não informado'} |

---

## 3. Avaliações de Maturidade

`;

  if (projeto.avaliacoes && projeto.avaliacoes.length > 0) {
    md += `Total de avaliações: **${projeto.avaliacoes.length}**\n\n`;
    md += `| Avaliador | Status | Score | Nível | Data |\n`;
    md += `|-----------|--------|-------|-------|------|\n`;
    
    projeto.avaliacoes.forEach(av => {
      md += `| ${av.usuario?.nome || 'N/A'} | ${av.status} | ${av.scoreGeral?.toFixed(2) || '-'} | ${av.nivelGeral || '-'} | ${new Date(av.createdAt).toLocaleDateString('pt-BR')} |\n`;
    });
  } else {
    md += `*Nenhuma avaliação de maturidade realizada.*\n`;
  }

  md += `\n---\n\n## 4. Produtos IA-First\n\n`;

  if (projeto.produtos && projeto.produtos.length > 0) {
    md += `Total de produtos: **${projeto.produtos.length}**\n\n`;
    
    for (const produto of projeto.produtos) {
      md += `### 4.${projeto.produtos.indexOf(produto) + 1}. ${produto.nome}\n\n`;
      md += `| Campo | Valor |\n`;
      md += `|-------|-------|\n`;
      md += `| **Descrição** | ${produto.descricao || 'Não informada'} |\n`;
      md += `| **Status** | ${produto.status} |\n`;
      md += `| **Fase Atual** | ${produto.faseAtual || 'ideia'} |\n`;
      md += `| **Complexidade** | ${produto.complexidade || 'media'} |\n`;
      md += `| **Vertical** | ${produto.vertical?.nome || 'Não definida'} |\n`;
      md += `| **Score de Relevância** | ${produto.scoreRelevancia?.toFixed(2) || 'N/A'} |\n`;
      
      if (produto.problemaResolve) {
        md += `| **Problema que Resolve** | ${produto.problemaResolve} |\n`;
      }
      if (produto.publicoAlvo) {
        md += `| **Público-Alvo** | ${produto.publicoAlvo} |\n`;
      }
      if (produto.diferencialCompetitivo) {
        md += `| **Diferencial Competitivo** | ${produto.diferencialCompetitivo} |\n`;
      }
      
      // Informações financeiras
      if (produto.custoEstimado || produto.retornoAnualEsperado) {
        md += `\n**Informações Financeiras:**\n`;
        if (produto.custoEstimado) {
          md += `- Custo Estimado: R$ ${produto.custoEstimado.toLocaleString('pt-BR')}\n`;
        }
        if (produto.retornoAnualEsperado) {
          md += `- Retorno Anual Esperado: R$ ${produto.retornoAnualEsperado.toLocaleString('pt-BR')}\n`;
        }
      }
      
      // Cronograma
      if (produto.dataInicioConstrucao || produto.dataFimConstrucao) {
        md += `\n**Cronograma:**\n`;
        if (produto.dataInicioConstrucao) {
          md += `- Início da Construção: ${new Date(produto.dataInicioConstrucao).toLocaleDateString('pt-BR')}\n`;
        }
        if (produto.dataFimConstrucao) {
          md += `- Fim Previsto: ${new Date(produto.dataFimConstrucao).toLocaleDateString('pt-BR')}\n`;
        }
        if (produto.dataAtivacaoProducao) {
          md += `- Ativação em Produção: ${new Date(produto.dataAtivacaoProducao).toLocaleDateString('pt-BR')}\n`;
        }
      }
      
      md += `\n`;
    }
  } else {
    md += `*Nenhum produto cadastrado.*\n`;
  }

  md += `\n---\n\n`;
  md += `*Documento gerado automaticamente pelo Blueprint Agêntico em ${dataGeracao}*\n\n`;
  md += `*© ${new Date().getFullYear()} SysMap Solutions*\n`;

  return md;
}

/**
 * Gera Markdown da Especificação de Produto
 */
function gerarMarkdownEspecificacao(especificacao, produto) {
  const dataGeracao = new Date().toLocaleDateString('pt-BR');
  const documentos = especificacao.documentos || [];
  
  let md = `# Especificação Técnica

## ${produto.nome}

---

## Informações da Especificação

| Campo | Valor |
|-------|-------|
| **Versão** | ${especificacao.versao} |
| **Status** | ${especificacao.status} |
| **Data de Geração** | ${new Date(especificacao.createdAt).toLocaleDateString('pt-BR')} |
| **Gerado por** | ${especificacao.geradoPor?.nome || 'N/A'} |
`;

  if (especificacao.horasEstimadas) {
    md += `| **Horas Estimadas** | ${especificacao.horasEstimadas}h |\n`;
  }
  if (especificacao.custoDesenvolvimento) {
    md += `| **Custo de Desenvolvimento** | R$ ${especificacao.custoDesenvolvimento.toLocaleString('pt-BR')} |\n`;
  }
  if (especificacao.prazoSemanas) {
    md += `| **Prazo Estimado** | ${especificacao.prazoSemanas} semanas |\n`;
  }
  if (especificacao.tamanhoEquipe) {
    md += `| **Tamanho da Equipe** | ${especificacao.tamanhoEquipe} pessoas |\n`;
  }

  md += `\n---\n\n## Sumário\n\n`;
  
  documentos.sort((a, b) => a.ordem - b.ordem).forEach((doc, i) => {
    md += `${i + 1}. ${doc.titulo}\n`;
  });

  md += `\n---\n\n`;

  // Adiciona cada documento
  documentos.sort((a, b) => a.ordem - b.ordem).forEach(doc => {
    md += `# ${doc.titulo}\n\n`;
    md += doc.conteudo;
    md += `\n\n---\n\n`;
  });

  md += `*Documento gerado automaticamente pelo Blueprint Agêntico em ${dataGeracao}*\n\n`;
  md += `*© ${new Date().getFullYear()} SysMap Solutions*\n`;

  return md;
}

// ==========================================
// ROTAS DE EXPORTAÇÃO
// ==========================================

/**
 * GET /api/exportar/relatorio/:avaliacaoId
 * Exporta relatório de avaliação em Markdown
 */
router.get('/relatorio/:avaliacaoId', async (req, res) => {
  try {
    const { avaliacaoId } = req.params;
    
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: parseInt(avaliacaoId) },
      include: {
        usuario: true,
        projeto: {
          include: {
            empresa: true
          }
        },
        respostas: {
          include: {
            pergunta: {
              include: {
                area: true
              }
            }
          }
        }
      }
    });

    if (!avaliacao) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    // Calcular scores por área
    const areas = await prisma.area.findMany({
      include: { perguntas: true },
      orderBy: { ordem: 'asc' }
    });
    const todasAreaIds = areas.map((area) => area.id);
    const areasSelecionadas = parseAreasSelecionadas(avaliacao, todasAreaIds);

    const recIds = parseAreasRecusadas(avaliacao);
    const scoresPorArea = areas
      .filter((area) => areasSelecionadas.includes(area.id) && !recIds.includes(area.id))
      .map(area => {
      const respostasArea = avaliacao.respostas.filter(r => r.pergunta.areaId === area.id);
      const respondidas = respostasArea.filter(r => r.pontuacao !== null).length;
      const totalPontos = respostasArea.reduce((acc, r) => acc + (r.pontuacao || 0), 0);
      const score = respondidas > 0 ? totalPontos / respondidas : 0;

      return {
        area: area.nome,
        score,
        peso: area.peso || 1,
        nivel: calcularNivel(score),
        respondidas,
        total: area.perguntas.length
      };
    }).filter(a => a.respondidas > 0);
    const scoreGeralAvaliacao = calcularScoreGeralAvaliacao(scoresPorArea);
    const nivelGeralAvaliacao = calcularNivel(scoreGeralAvaliacao);

    const markdown = gerarMarkdownRelatorio(
      avaliacao, 
      avaliacao.projeto, 
      avaliacao.projeto.empresa,
      scoresPorArea,
      {
        scoreGeral: scoreGeralAvaliacao,
        nivelGeral: nivelGeralAvaliacao
      }
    );

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${avaliacao.projeto.nome.replace(/\s+/g, '-')}-${avaliacaoId}.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({ error: 'Erro ao exportar relatório', details: error.message });
  }
});

/**
 * GET /api/exportar/projeto/:projetoId
 * Exporta projeto completo em Markdown (dados cadastrais, avaliações, produtos)
 */
router.get('/projeto/:projetoId', async (req, res) => {
  try {
    const { projetoId } = req.params;
    
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(projetoId) },
      include: {
        empresa: true,
        avaliacoes: {
          include: {
            usuario: true
          },
          orderBy: { createdAt: 'desc' }
        },
        produtos: {
          include: {
            vertical: true,
            especificacoes: {
              include: {
                documentos: true,
                geradoPor: true
              },
              orderBy: { versao: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const markdown = await gerarMarkdownProjeto(projeto);

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="projeto-${projeto.nome.replace(/\s+/g, '-')}.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('Erro ao exportar projeto:', error);
    res.status(500).json({ error: 'Erro ao exportar projeto', details: error.message });
  }
});

/**
 * GET /api/exportar/projeto/:projetoId/cadastro
 * Exporta ficha cadastral da empresa e projeto em Markdown
 */
router.get('/projeto/:projetoId/cadastro', async (req, res) => {
  try {
    const { projetoId } = req.params;
    
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(projetoId) },
      include: {
        empresa: {
          include: {
            _count: { select: { usuarios: true } }
          }
        },
        _count: { select: { avaliacoes: true, produtos: true } }
      }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const markdown = gerarMarkdownCadastroEmpresaProjeto(projeto);
    const nomeArquivo = `${projeto.empresa.nome.replace(/\s+/g, '-')}_${projeto.nome.replace(/\s+/g, '-')}`.toLowerCase();

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('Erro ao exportar cadastro:', error);
    res.status(500).json({ error: 'Erro ao exportar cadastro', details: error.message });
  }
});

/**
 * GET /api/exportar/projeto/:projetoId/cadastro-docx
 * Exporta ficha cadastral da empresa e projeto em Word
 */
router.get('/projeto/:projetoId/cadastro-docx', async (req, res) => {
  try {
    const { projetoId } = req.params;
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } = await import('docx');
    
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(projetoId) },
      include: {
        empresa: {
          include: {
            _count: { select: { usuarios: true } }
          }
        },
        _count: { select: { avaliacoes: true, produtos: true } }
      }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const empresa = projeto.empresa;
    const dataGeracao = new Date().toLocaleDateString('pt-BR');
    
    // Parse dos campos JSON
    let audiencias = [];
    let lentes = [];
    
    try {
      if (projeto.audienciaPrimaria) {
        audiencias = JSON.parse(projeto.audienciaPrimaria);
      }
    } catch (e) {}
    
    try {
      if (projeto.lentesPrioritarias) {
        lentes = JSON.parse(projeto.lentesPrioritarias);
      }
    } catch (e) {}

    const WORD_FONT = 'Courier New';
    
    // Função auxiliar para criar células de tabela
    const createCell = (text, bold = false) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: text || '-', font: WORD_FONT, size: 20, bold })]
      })],
      width: { size: 50, type: WidthType.PERCENTAGE }
    });

    // Função para criar tabela
    const createTable = (rows) => new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map(([label, value]) => new TableRow({
        children: [createCell(label, true), createCell(value)]
      }))
    });

    const sections = [];

    // Título
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'FICHA CADASTRAL', font: WORD_FONT, size: 36, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: `${empresa.nome} - ${projeto.nome}`, font: WORD_FONT, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Seção Empresa
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'INFORMACOES DA EMPRESA', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      }),
      createTable([
        ['Razao Social', empresa.nome],
        ['CNPJ', empresa.cnpj || 'Nao informado'],
        ['Setor de Atuacao', empresa.setor || 'Nao informado'],
        ['Porte', empresa.porte || 'Nao informado'],
        ['E-mail', empresa.email || 'Nao informado'],
        ['Telefone', empresa.telefone || 'Nao informado'],
        ['Endereco', empresa.endereco || 'Nao informado'],
        ['Website', empresa.website || 'Nao informado'],
        ['Data de Cadastro', new Date(empresa.createdAt).toLocaleDateString('pt-BR')]
      ])
    );

    // Seção Projeto
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'INFORMACOES DO PROJETO', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      }),
      createTable([
        ['Nome do Projeto', projeto.nome],
        ['Descricao', projeto.descricao || 'Nao informada'],
        ['Vertical / Setor', projeto.vertical ? (VERTICAIS[projeto.vertical] || projeto.vertical) : 'Nao definida'],
        ['Status', projeto.status],
        ['Data de Criacao', new Date(projeto.createdAt).toLocaleDateString('pt-BR')],
        ['Ultima Atualizacao', new Date(projeto.updatedAt).toLocaleDateString('pt-BR')]
      ])
    );

    // Audiência Primária
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'AUDIENCIA PRIMARIA', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      })
    );
    
    if (audiencias.length > 0) {
      audiencias.forEach(a => {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `• ${AUDIENCIAS_PRIMARIAS[a] || a}`, font: WORD_FONT, size: 20 })],
          spacing: { before: 100 }
        }));
      });
    } else {
      sections.push(new Paragraph({
        children: [new TextRun({ text: 'Nao definida', font: WORD_FONT, size: 20, italics: true })],
      }));
    }

    // Lentes Prioritárias
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'LENTES PRIORITARIAS', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      })
    );
    
    if (lentes.length > 0) {
      lentes.forEach(l => {
        sections.push(new Paragraph({
          children: [new TextRun({ text: `• ${LENTES_PRIORITARIAS[l] || l}`, font: WORD_FONT, size: 20 })],
          spacing: { before: 100 }
        }));
      });
    } else {
      sections.push(new Paragraph({
        children: [new TextRun({ text: 'Nao definidas', font: WORD_FONT, size: 20, italics: true })],
      }));
    }

    // Estatísticas
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'ESTATISTICAS', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      }),
      createTable([
        ['Total de Avaliacoes', String(projeto._count?.avaliacoes || 0)],
        ['Total de Produtos', String(projeto._count?.produtos || 0)],
        ['Total de Usuarios na Empresa', String(empresa._count?.usuarios || 0)]
      ])
    );

    // Rodapé
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `Documento gerado automaticamente pelo Blueprint Agentico em ${dataGeracao}`, font: WORD_FONT, size: 18, italics: true })],
        spacing: { before: 600 },
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        children: [new TextRun({ text: `© ${new Date().getFullYear()} SysMap Solutions`, font: WORD_FONT, size: 18 })],
        alignment: AlignmentType.CENTER
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children: sections
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const nomeArquivo = `${empresa.nome.replace(/\s+/g, '-')}_${projeto.nome.replace(/\s+/g, '-')}`.toLowerCase();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}.docx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Erro ao exportar cadastro DOCX:', error);
    res.status(500).json({ error: 'Erro ao exportar cadastro', details: error.message });
  }
});

/**
 * GET /api/exportar/projeto/:projetoId/zip-md
 * Exporta projeto em ZIP com dois arquivos MD (projeto + ficha cadastral)
 */
router.get('/projeto/:projetoId/zip-md', async (req, res) => {
  try {
    const { projetoId } = req.params;
    
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(projetoId) },
      include: {
        empresa: {
          include: {
            _count: { select: { usuarios: true } }
          }
        },
        avaliacoes: {
          include: { usuario: true },
          orderBy: { createdAt: 'desc' }
        },
        produtos: {
          include: {
            vertical: true,
            especificacoes: {
              include: { documentos: true, geradoPor: true },
              orderBy: { versao: 'desc' },
              take: 1
            }
          }
        },
        _count: { select: { avaliacoes: true, produtos: true } }
      }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const nomeEmpresa = projeto.empresa.nome.replace(/\s+/g, '-').toLowerCase();
    const nomeProjeto = projeto.nome.replace(/\s+/g, '-').toLowerCase();

    // Gerar os dois markdowns
    const markdownProjeto = await gerarMarkdownProjeto(projeto);
    const markdownCadastro = gerarMarkdownCadastroEmpresaProjeto(projeto);

    // Criar ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="projeto-${nomeProjeto}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // Adicionar arquivos ao ZIP
    archive.append(markdownProjeto, { name: `projeto-${nomeProjeto}.md` });
    archive.append(markdownCadastro, { name: `${nomeEmpresa}_${nomeProjeto}.md` });

    await archive.finalize();
  } catch (error) {
    console.error('Erro ao exportar ZIP MD:', error);
    res.status(500).json({ error: 'Erro ao exportar projeto', details: error.message });
  }
});

/**
 * GET /api/exportar/projeto/:projetoId/zip-md-completo
 * Exporta projeto completo em ZIP com dois arquivos MD (projeto+specs + ficha cadastral)
 */
router.get('/projeto/:projetoId/zip-md-completo', async (req, res) => {
  try {
    const { projetoId } = req.params;
    
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(projetoId) },
      include: {
        empresa: {
          include: {
            _count: { select: { usuarios: true } }
          }
        },
        avaliacoes: {
          include: {
            usuario: true,
            respostas: {
              include: {
                pergunta: {
                  include: { area: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        produtos: {
          include: {
            vertical: true,
            avaliacoes: {
              include: { usuario: true },
              orderBy: { createdAt: 'desc' }
            },
            especificacoes: {
              include: {
                documentos: { orderBy: { ordem: 'asc' } },
                geradoPor: true
              },
              orderBy: { versao: 'desc' }
            },
            arquivosReferencia: true
          }
        },
        _count: { select: { avaliacoes: true, produtos: true } }
      }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const nomeEmpresa = projeto.empresa.nome.replace(/\s+/g, '-').toLowerCase();
    const nomeProjeto = projeto.nome.replace(/\s+/g, '-').toLowerCase();

    // Gerar markdown base do projeto
    let markdownCompleto = await gerarMarkdownProjeto(projeto);

    // Adicionar especificações de cada produto
    markdownCompleto += `\n\n---\n\n# ANEXOS - Especificações de Produtos\n\n`;

    for (const produto of projeto.produtos) {
      if (produto.especificacoes && produto.especificacoes.length > 0) {
        const especificacao = produto.especificacoes[0];
        markdownCompleto += `\n\n---\n\n`;
        markdownCompleto += gerarMarkdownEspecificacao(especificacao, produto);
      }
    }

    const markdownCadastro = gerarMarkdownCadastroEmpresaProjeto(projeto);

    // Criar ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="projeto-completo-${nomeProjeto}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // Adicionar arquivos ao ZIP
    archive.append(markdownCompleto, { name: `projeto-completo-${nomeProjeto}.md` });
    archive.append(markdownCadastro, { name: `${nomeEmpresa}_${nomeProjeto}.md` });

    await archive.finalize();
  } catch (error) {
    console.error('Erro ao exportar ZIP MD completo:', error);
    res.status(500).json({ error: 'Erro ao exportar projeto', details: error.message });
  }
});

/**
 * GET /api/exportar/projeto/:projetoId/zip-relatorio-maturidade
 * Exporta ZIP com ficha cadastral + relatório COMPLETO de maturidade IA (mesmo do Dashboard)
 */
router.get('/projeto/:projetoId/zip-relatorio-maturidade', async (req, res) => {
  try {
    const { projetoId } = req.params;
    
    // Buscar dados completos do projeto (mesma query da rota /dashboard)
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(projetoId) },
      include: {
        empresa: {
          include: {
            _count: { select: { usuarios: true } }
          }
        },
        avaliacoes: {
          where: { status: 'finalizada' },
          include: {
            usuario: true,
            respostas: {
              include: {
                pergunta: {
                  include: { area: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        produtos: {
          include: {
            vertical: true,
            avaliacoes: {
              include: { usuario: true },
              orderBy: { createdAt: 'desc' }
            },
            especificacoes: {
              include: { 
                documentos: { orderBy: { ordem: 'asc' } },
                geradoPor: true
              },
              orderBy: { versao: 'desc' }
            },
            arquivosReferencia: true
          }
        },
        _count: { select: { avaliacoes: true, produtos: true } }
      }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const nomeEmpresa = projeto.empresa.nome.replace(/\s+/g, '-').toLowerCase();
    const nomeProjeto = projeto.nome.replace(/\s+/g, '-').toLowerCase();

    // Gerar ficha cadastral
    const markdownCadastro = gerarMarkdownCadastroEmpresaProjeto(projeto);

    // ========== GERAR RELATÓRIO COMPLETO (MESMO DO DASHBOARD) ==========
    const areas = await prisma.area.findMany({
      include: { perguntas: true },
      orderBy: { ordem: 'asc' }
    });
    const todasAreaIdsExportZip = areas.map((a) => a.id);

    const scoresPorArea = areas.map(area => {
      let totalScore = 0;
      let totalRespostas = 0;

      projeto.avaliacoes.forEach(av => {
        if (!areaContaParaAvaliacao(av, area.id, todasAreaIdsExportZip)) return;
        const respostasArea = av.respostas.filter(r => r.pergunta.areaId === area.id && r.pontuacao !== null);
        respostasArea.forEach(r => {
          totalScore += r.pontuacao;
          totalRespostas++;
        });
      });

      const esperadas = projeto.avaliacoes.reduce(
        (acc, av) =>
          acc + (areaContaParaAvaliacao(av, area.id, todasAreaIdsExportZip) ? area.perguntas.length : 0),
        0
      );

      const score = totalRespostas > 0 ? totalScore / totalRespostas : 0;
      return {
        areaId: area.id,
        area: area.nome,
        score,
        nivel: calcularNivel(score),
        respondidas: totalRespostas,
        total: esperadas
      };
    }).filter(a => a.respondidas > 0);

    const scoreGeral = scoresPorArea.length > 0
      ? scoresPorArea.reduce((acc, a) => acc + a.score, 0) / scoresPorArea.length
      : 0;

    const nivelGeral = calcularNivel(scoreGeral);
    const dataGeracao = new Date().toLocaleDateString('pt-BR');

    // MIT CISR Levels - Completo
    const MIT_CISR_LEVELS = {
      1: { 
        name: 'Nível 1: Inicial', 
        nameEn: 'Initial / Experimenting',
        focus: 'Exploração e Educação', 
        growth: '-15% a -10%', 
        description: 'Organização ainda está explorando o potencial da IA. Poucos ou nenhum projeto formal.',
        characteristics: [
          'Sem estratégia formal de IA',
          'Iniciativas isoladas e ad-hoc',
          'Falta de infraestrutura de dados',
          'Baixa conscientização sobre IA',
          'Orçamento não dedicado'
        ],
        percentage: '~25%'
      },
      2: { 
        name: 'Nível 2: Oportunista', 
        nameEn: 'Preparing / Experimenting',
        focus: 'Preparação e Experimentação', 
        growth: '-10% a -5%', 
        description: 'Empresa começa a investir em IA de forma mais estruturada, com pilotos iniciais.',
        characteristics: [
          'Educar a força de trabalho sobre IA',
          'Estabelecer políticas de uso aceitável',
          'Tornar dados mais acessíveis',
          'Primeiros experimentos formais',
          'Identificar onde humanos devem estar no loop'
        ],
        percentage: '~30%'
      },
      3: { 
        name: 'Nível 3: Estruturado', 
        nameEn: 'Building Pilots',
        focus: 'Casos de Negócio e Pilotos', 
        growth: '0% a +5%', 
        description: 'Pilotos em andamento com métricas definidas. Processos começam a ser automatizados.',
        characteristics: [
          'Simplificar e automatizar processos',
          'Criar casos de uso com métricas',
          'Compartilhar dados via APIs',
          'Usar LLMs para aumentar o trabalho',
          'Estilo de gestão coach e comunicação'
        ],
        percentage: '~25%'
      },
      4: { 
        name: 'Nível 4: Gerenciado', 
        nameEn: 'Developing AI Ways of Working',
        focus: 'Escalar Plataformas e Dashboards', 
        growth: '+5% a +15%', 
        description: 'IA integrada ao negócio com governança estabelecida e modelos em produção.',
        characteristics: [
          'Expandir automação de processos',
          'Cultura test-and-learn estabelecida',
          'Arquitetar para reuso',
          'Incorporar modelos pré-treinados',
          'Explorar agentes autônomos'
        ],
        percentage: '~15%'
      },
      5: { 
        name: 'Nível 5: Otimizado', 
        nameEn: 'AI Future Ready',
        focus: 'Inovação Contínua e Novas Receitas', 
        growth: '+15% ou mais', 
        description: 'IA como diferencial competitivo, com inovação contínua e monetização de capacidades.',
        characteristics: [
          'IA embarcada em decisões e processos',
          'Criar e vender serviços aumentados por IA',
          'Combinar IA tradicional, generativa e agêntica',
          'Proprietary AI como vantagem competitiva',
          'Liderança de inovação no setor'
        ],
        percentage: '~5%'
      }
    };

    const BENCHMARKING = {
      fintech: { mediaSetor: 3.2, top25: 4.1, bottom25: 2.1, nome: 'FinTech', fonte: 'MIT CISR Financial Services AI Study 2024', tendencia: 'crescente' },
      saude: { mediaSetor: 2.6, top25: 3.5, bottom25: 1.8, nome: 'Saúde', fonte: 'HIMSS Analytics Healthcare AI Adoption Report 2024', tendencia: 'crescente' },
      tecnologia: { mediaSetor: 3.5, top25: 4.4, bottom25: 2.5, nome: 'Tecnologia', fonte: 'Gartner Tech Industry AI Maturity Index 2024', tendencia: 'estável-alto' },
      ecommerce: { mediaSetor: 3.1, top25: 4.0, bottom25: 2.0, nome: 'E-Commerce', fonte: 'Forrester Retail AI Readiness Survey 2024', tendencia: 'crescente' },
      manufatura: { mediaSetor: 2.4, top25: 3.3, bottom25: 1.6, nome: 'Manufatura', fonte: 'McKinsey Industry 4.0 AI Adoption Study 2024', tendencia: 'crescente' },
      legaltech: { mediaSetor: 2.3, top25: 3.2, bottom25: 1.5, nome: 'LegalTech', fonte: 'Thomson Reuters Legal AI Adoption Report 2024', tendencia: 'crescente' },
      edtech: { mediaSetor: 2.8, top25: 3.7, bottom25: 1.9, nome: 'EdTech', fonte: 'HolonIQ EdTech AI Index 2024', tendencia: 'crescente' },
      aifirst: { mediaSetor: 3.8, top25: 4.6, bottom25: 2.8, nome: 'AI First', fonte: 'AI Engineering Maturity Benchmark 2024', tendencia: 'estável-alto' },
      agrovert: { mediaSetor: 2.2, top25: 3.1, bottom25: 1.4, nome: 'AgTech', fonte: 'AgFunder AgTech AI Adoption Report 2024', tendencia: 'crescente' }
    };

    const PROJECAO_FINANCEIRA = {
      1: { crescimento: { min: -5, max: 0, media: -2 }, custos: { min: 0, max: 5, media: 2 }, roi: { min: -50, max: 50, media: 0 }, tempo: '18-24 meses', investimento: '0.5% a 1% do faturamento', riscos: ['Investimentos sem retorno mensurável', 'Custos ocultos de experimentação', 'Perda de oportunidade de mercado'] },
      2: { crescimento: { min: 0, max: 5, media: 2 }, custos: { min: 3, max: 8, media: 5 }, roi: { min: 50, max: 150, media: 100 }, tempo: '12-18 meses', investimento: '1% a 2% do faturamento', riscos: ['Pilotos sem escala não geram valor', 'Custos de infraestrutura iniciais', 'Dificuldade de demonstrar valor'] },
      3: { crescimento: { min: 3, max: 10, media: 6 }, custos: { min: 5, max: 15, media: 10 }, roi: { min: 150, max: 300, media: 200 }, tempo: '9-12 meses', investimento: '2% a 4% do faturamento', riscos: ['Escalabilidade de modelos', 'Custos de MLOps crescentes', 'Dependência de talentos escassos'] },
      4: { crescimento: { min: 8, max: 18, media: 12 }, custos: { min: 10, max: 25, media: 18 }, roi: { min: 300, max: 500, media: 400 }, tempo: '6-9 meses', investimento: '4% a 7% do faturamento', riscos: ['Complexidade de governança', 'Custos de manutenção de modelos', 'Riscos regulatórios'] },
      5: { crescimento: { min: 15, max: 30, media: 22 }, custos: { min: 20, max: 35, media: 28 }, roi: { min: 500, max: 1000, media: 700 }, tempo: '3-6 meses', investimento: '7% a 12% do faturamento', riscos: ['Disrupção tecnológica', 'Dependência crítica de IA', 'Custos de inovação contínua'] }
    };

    const CENARIOS = {
      conservador: { nome: 'Conservador', descricao: 'Evolução gradual com foco em fundamentos e baixo risco', velocidade: '0.3 níveis/ano', investimento: '60% do recomendado', adequadoPara: 'Organizações com baixa tolerância a risco ou setores altamente regulados', riscos: 'Perda de competitividade para concorrentes mais ágeis' },
      base: { nome: 'Base (Recomendado)', descricao: 'Evolução balanceada com investimento proporcional ao retorno', velocidade: '0.5 níveis/ano', investimento: '100% do recomendado', adequadoPara: 'Maioria das organizações com ambição de transformação digital', riscos: 'Balanceado entre velocidade e sustentabilidade' },
      agressivo: { nome: 'Agressivo', descricao: 'Transformação acelerada com alto investimento e tolerância a risco', velocidade: '0.8 níveis/ano', investimento: '150% do recomendado', adequadoPara: 'Startups, scale-ups ou empresas em mercados altamente competitivos', riscos: 'Alto risco de execução, queima de caixa, exaustão de equipe' }
    };

    const SEQUENCIA_CRITICA = [
      { fase: 1, areas: ['Estratégia e Liderança'], descricao: 'Fundação - define direção e prioridades', duracao: '1-2 meses' },
      { fase: 2, areas: ['Dados e Tecnologia', 'Governança e Risco', 'Talentos e Capacidades', 'Conformidade Regulatória', 'Prontidão para Mudança'], descricao: 'Infraestrutura, Talentos e Compliance - habilita execução segura', duracao: '2-4 meses' },
      { fase: 3, areas: ['Pessoas e Cultura', 'Valor de Negócio e ROI', 'Valor por Unidade de Negócio'], descricao: 'Capacitação e Valor - desenvolve talentos e mapeia valor', duracao: '3-6 meses' },
      { fase: 4, areas: ['Operações e Processos'], descricao: 'Execução - coloca IA em produção', duracao: '4-8 meses' },
      { fase: 5, areas: ['Inovação e Experimentação', 'Ecossistema e Parcerias'], descricao: 'Escala - amplia impacto', duracao: '6-12 meses' }
    ];

    const nivelNumerico = scoreGeral >= 4.5 ? 5 : scoreGeral >= 3.5 ? 4 : scoreGeral >= 2.5 ? 3 : scoreGeral >= 1.5 ? 2 : 1;
    const levelInfo = MIT_CISR_LEVELS[nivelNumerico];
    const benchmark = projeto.vertical ? BENCHMARKING[projeto.vertical] : null;
    const projecao = ajustarProjecaoExportacao(PROJECAO_FINANCEIRA[nivelNumerico], projeto.faturamentoAnualProjeto);

    const areasParaMelhorar = scoresPorArea.filter(a => a.score < 3).sort((a, b) => a.score - b.score);
    const areasFortes = scoresPorArea.filter(a => a.score >= 3.5).sort((a, b) => b.score - a.score);

    // ========== RELATÓRIO COMPLETO (MESMO FORMATO DO DASHBOARD) ==========
    let md = `# RELATÓRIO DE MATURIDADE EM INTELIGÊNCIA ARTIFICIAL

## Blueprint Agêntico — Assessment Completo

---

<div align="center">

**${projeto.empresa.nome}**

${projeto.nome}

*${dataGeracao}*

</div>

---

# SUMÁRIO

1. [Sumário Executivo](#1-sumário-executivo)
2. [Benchmarking Competitivo](#2-benchmarking-competitivo)
3. [Projeção de Impacto Financeiro](#3-projeção-de-impacto-financeiro)
4. [Resultados por Dimensão](#4-resultados-por-dimensão)
5. [Avaliadores e Participantes](#5-avaliadores-e-participantes)
6. [Análise por Vertical](#6-análise-por-vertical)
7. [Principais Gaps e Problemas Identificados](#7-principais-gaps-e-problemas-identificados)
8. [Plano de Ação Recomendado](#8-plano-de-ação-recomendado)
9. [Roadmap Estratégico de Evolução](#9-roadmap-estratégico-de-evolução)
10. [Análise Detalhada do Nível Atual](#10-análise-detalhada-do-nível-atual)
11. [Matriz de Priorização de Ações](#11-matriz-de-priorização-de-ações)
12. [Matriz de Dependências](#12-matriz-de-dependências)
13. [Análise de Cenários](#13-análise-de-cenários)
14. [Próximos Passos Imediatos](#14-próximos-passos-imediatos)
15. [Conclusão](#15-conclusão)
16. [Produtos IA-First](#16-produtos-ia-first)

---

# 1. SUMÁRIO EXECUTIVO

Este relatório apresenta os resultados do **Assessment de Maturidade em Inteligência Artificial** realizado na **${projeto.empresa.nome}** para o projeto **${projeto.nome}**, utilizando a metodologia **SysMap Blueprint IA**, alinhada com o **MIT CISR Enterprise AI Maturity Model**.

A avaliação analisou **${scoresPorArea.length} dimensões** críticas de maturidade em IA, com base nas respostas de **${projeto.avaliacoes.length} avaliador(es)**, resultando em um score geral de **${scoreGeral.toFixed(2)} pontos**, classificando a organização no nível **"${nivelGeral}"**.

## Resultado Principal

| Métrica | Valor |
|---------|:-----:|
| **Score Geral** | **${scoreGeral.toFixed(2)} / 5.00** |
| **Nível de Maturidade** | **${nivelGeral}** |
| **Classificação MIT CISR** | **${levelInfo.name}** |
| **Referência MIT** | ${levelInfo.nameEn} |
| **Foco Principal** | ${levelInfo.focus} |
| **% de Empresas neste Nível** | ${levelInfo.percentage} |

## Principais Descobertas

### Pontos Fortes (Score ≥ 3.5)
${areasFortes.length > 0 ? areasFortes.map(a => `- **${a.area}**: ${a.score.toFixed(2)} (${a.nivel})`).join('\n') : '- Nenhuma área com score ≥ 3.5'}

### Áreas de Atenção (Score < 3.0)
${areasParaMelhorar.length > 0 ? areasParaMelhorar.map(a => `- **${a.area}**: ${a.score.toFixed(2)} (${a.nivel})`).join('\n') : '- ✅ Todas as áreas com score ≥ 3.0'}

---

# 2. BENCHMARKING COMPETITIVO

`;

    if (benchmark) {
      md += `## Setor: ${benchmark.nome}

### Posicionamento Competitivo

| Métrica | Valor | Status |
|---------|:-----:|--------|
| **Sua Empresa** | **${scoreGeral.toFixed(2)}** | ${scoreGeral >= benchmark.top25 ? '🏆 Top 25%' : scoreGeral >= benchmark.mediaSetor ? '✅ Acima da média' : '⚠️ Abaixo da média'} |
| **Top 25% do Setor** | ${benchmark.top25} | Benchmark de excelência |
| **Média do Setor** | ${benchmark.mediaSetor} | Referência de mercado |
| **Bottom 25%** | ${benchmark.bottom25} | Organizações em atraso |

### Análise de Posicionamento

${scoreGeral >= benchmark.top25 
  ? `🏆 **Excelente!** A ${projeto.empresa.nome} está entre os **Top 25%** do setor ${benchmark.nome} em maturidade de IA. Esta posição privilegiada permite:\n- Atração de melhores talentos em IA\n- Vantagem competitiva sustentável\n- Potencial para monetização de capacidades de IA` 
  : scoreGeral >= benchmark.mediaSetor 
    ? `✅ **Acima da média.** A ${projeto.empresa.nome} está ${(scoreGeral - benchmark.mediaSetor).toFixed(2)} pontos acima da média do setor.\n\n**Gap para Top 25%:** ${(benchmark.top25 - scoreGeral).toFixed(2)} pontos\n\n**Ações para alcançar o Top 25%:**\n- Investir nas áreas prioritárias identificadas\n- Acelerar iniciativas de IA em andamento\n- Desenvolver cultura data-driven`
    : `⚠️ **Atenção.** A ${projeto.empresa.nome} está ${(benchmark.mediaSetor - scoreGeral).toFixed(2)} pontos abaixo da média do setor.\n\n**Gap para a média:** ${(benchmark.mediaSetor - scoreGeral).toFixed(2)} pontos\n\n**Riscos de permanecer neste nível:**\n- Perda de competitividade\n- Dificuldade de atração de talentos\n- Ineficiência operacional crescente`
}

**Fonte:** ${benchmark.fonte}

**Tendência do Setor:** ${benchmark.tendencia}

`;
    } else {
      md += `*Vertical não definida. Configure a vertical do projeto para obter benchmarking específico do setor.*\n\n`;
    }

    md += `---

# 3. PROJEÇÃO DE IMPACTO FINANCEIRO

## Projeções para o Nível ${nivelNumerico} (${nivelGeral})

| Indicador | Mínimo | Esperado | Máximo |
|-----------|:------:|:--------:|:------:|
| **Crescimento de Receita** | ${projecao.crescimento.min}% | **${projecao.crescimento.media}%** | ${projecao.crescimento.max}% |
| **Redução de Custos** | ${projecao.custos.min}% | **${projecao.custos.media}%** | ${projecao.custos.max}% |
| **ROI Esperado** | ${projecao.roi.min}% | **${projecao.roi.media}%** | ${projecao.roi.max}% |

| Atributo | Valor |
|----------|-------|
| **Tempo para ROI** | ${projecao.tempo} |
| **Investimento Recomendado** | ${projecao.investimento} |

## Riscos Financeiros do Nível Atual

${projecao.riscos.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---

# 4. RESULTADOS POR DIMENSÃO

## Scores Detalhados

| # | Dimensão | Score | Nível | Status | Gap |
|:-:|----------|:-----:|-------|:------:|:---:|
`;

    scoresPorArea.forEach((area, idx) => {
      const status = area.score >= 4 ? '🟢' : area.score >= 3 ? '🔵' : area.score >= 2 ? '🟡' : '🔴';
      const gap = area.score < 3 ? (3 - area.score).toFixed(2) : '-';
      md += `| ${idx + 1} | ${area.area} | ${area.score.toFixed(2)} | ${area.nivel} | ${status} | ${gap} |\n`;
    });

    md += `
### Legenda de Status
- 🟢 **Excelente** (≥ 4.0): Área de referência
- 🔵 **Bom** (≥ 3.0): Área estruturada
- 🟡 **Atenção** (≥ 2.0): Necessita evolução
- 🔴 **Crítico** (< 2.0): Prioridade imediata

---

# 5. AVALIADORES E PARTICIPANTES

`;

    if (projeto.avaliacoes.length > 0) {
      md += `**Total de avaliações:** ${projeto.avaliacoes.length}\n\n`;
      md += `| # | Avaliador | Cargo | E-mail | Data | Score |\n`;
      md += `|:-:|-----------|-------|--------|------|:-----:|\n`;
      projeto.avaliacoes.forEach((av, idx) => {
        md += `| ${idx + 1} | ${av.usuario?.nome || 'N/A'} | ${av.usuario?.cargo || '-'} | ${av.usuario?.email || 'N/A'} | ${new Date(av.createdAt).toLocaleDateString('pt-BR')} | ${av.scoreGeral?.toFixed(2) || '-'} |\n`;
      });
    } else {
      md += `*Nenhuma avaliação finalizada.*\n`;
    }

    md += `

---

# 6. ANÁLISE POR VERTICAL

`;

    if (benchmark) {
      md += `## ${benchmark.nome}

A vertical **${benchmark.nome}** apresenta características específicas que influenciam a jornada de maturidade em IA:

### Características do Setor
- **Média de Maturidade:** ${benchmark.mediaSetor}
- **Líderes (Top 25%):** ${benchmark.top25}
- **Tendência:** ${benchmark.tendencia}
- **Fonte:** ${benchmark.fonte}

### Posição Relativa
A ${projeto.empresa.nome} está ${scoreGeral >= benchmark.mediaSetor ? 'acima' : 'abaixo'} da média do setor ${benchmark.nome}.

`;
    } else {
      md += `*Configure a vertical do projeto para análise setorial específica.*\n\n`;
    }

    md += `---

# 7. PRINCIPAIS GAPS E PROBLEMAS IDENTIFICADOS

`;

    if (areasParaMelhorar.length > 0) {
      md += `Foram identificadas **${areasParaMelhorar.length} áreas** com score abaixo de 3.0 (nível Estruturado):\n\n`;
      areasParaMelhorar.forEach((area, index) => {
        md += `## ${index + 1}. ${area.area}

| Atributo | Valor |
|----------|-------|
| **Score Atual** | ${area.score.toFixed(2)} / 5.00 |
| **Nível** | ${area.nivel} |
| **Gap para Estruturado (3.0)** | ${(3 - area.score).toFixed(2)} pontos |
| **Gap para Gerenciado (4.0)** | ${(4 - area.score).toFixed(2)} pontos |
| **Prioridade** | ${area.score < 2 ? '🔴 Alta' : '🟡 Média'} |

`;
      });
    } else {
      md += `✅ **Parabéns!** Nenhuma área crítica identificada.\n\nTodas as dimensões estão com score ≥ 3.0 (nível Estruturado).\n\n`;
    }

    md += `---

# 8. PLANO DE AÇÃO RECOMENDADO

## Ações por Prioridade

### 🔴 Prioridade Alta (Score < 2.0)
${areasParaMelhorar.filter(a => a.score < 2).length > 0 
  ? areasParaMelhorar.filter(a => a.score < 2).map(a => `- **${a.area}:** Desenvolver fundamentos básicos, criar capacidades mínimas`).join('\n')
  : '- Nenhuma área com prioridade alta'}

### 🟡 Prioridade Média (Score 2.0 - 2.9)
${areasParaMelhorar.filter(a => a.score >= 2 && a.score < 3).length > 0 
  ? areasParaMelhorar.filter(a => a.score >= 2 && a.score < 3).map(a => `- **${a.area}:** Estruturar processos, definir métricas, escalar pilotos`).join('\n')
  : '- Nenhuma área com prioridade média'}

### 🟢 Otimização (Score ≥ 3.0)
${scoresPorArea.filter(a => a.score >= 3 && a.score < 4).length > 0 
  ? scoresPorArea.filter(a => a.score >= 3 && a.score < 4).map(a => `- **${a.area}:** Industrializar, automatizar, medir ROI`).join('\n')
  : '- Nenhuma área neste estágio'}

### 🏆 Excelência (Score ≥ 4.0)
${areasFortes.filter(a => a.score >= 4).length > 0 
  ? areasFortes.filter(a => a.score >= 4).map(a => `- **${a.area}:** Manter liderança, inovar, compartilhar práticas`).join('\n')
  : '- Nenhuma área com excelência ainda'}

---

# 9. ROADMAP ESTRATÉGICO DE EVOLUÇÃO

## Sequência Crítica de Implementação

`;

    SEQUENCIA_CRITICA.forEach(fase => {
      md += `### Fase ${fase.fase}: ${fase.descricao}

- **Áreas:** ${fase.areas.join(', ')}
- **Duração Estimada:** ${fase.duracao}

`;
    });

    md += `---

# 10. ANÁLISE DETALHADA DO NÍVEL ATUAL

## ${levelInfo.name}

> ${levelInfo.description}

### Referência MIT CISR
- **Nome em Inglês:** ${levelInfo.nameEn}
- **Foco Principal:** ${levelInfo.focus}
- **Crescimento Típico:** ${levelInfo.growth}
- **% de Empresas neste Nível:** ${levelInfo.percentage}

### Características deste Nível
${levelInfo.characteristics.map((c, i) => `${i + 1}. ${c}`).join('\n')}

### Para Evoluir para o Próximo Nível
${nivelNumerico < 5 ? `
Para alcançar o **${MIT_CISR_LEVELS[nivelNumerico + 1].name}**, a organização deve:

1. Consolidar as práticas do nível atual
2. Desenvolver as capacidades do próximo nível
3. Investir em infraestrutura e talentos
4. Estabelecer métricas e governança
` : `
A organização está no nível máximo de maturidade. O foco deve ser:

1. Manter a liderança através de inovação contínua
2. Monetizar capacidades de IA
3. Desenvolver proprietary AI
4. Liderar o ecossistema do setor
`}

---

# 11. MATRIZ DE PRIORIZAÇÃO DE AÇÕES

## Quadrante de Priorização

| Impacto / Esforço | Baixo Esforço | Alto Esforço |
|-------------------|---------------|--------------|
| **Alto Impacto** | Quick Wins | Projetos Estratégicos |
| **Baixo Impacto** | Melhorias Incrementais | Avaliar ROI |

### Quick Wins (Alto Impacto, Baixo Esforço)
- Capacitação inicial em IA para liderança
- Definição de políticas de uso de IA generativa
- Identificação de casos de uso de alto valor

### Projetos Estratégicos (Alto Impacto, Alto Esforço)
- Infraestrutura de dados e MLOps
- Programa de talentos em IA
- Governança de IA enterprise

---

# 12. MATRIZ DE DEPENDÊNCIAS

## Sequência Crítica de Implementação

| Fase | Áreas | Descrição | Duração |
|:----:|-------|-----------|---------|
`;

    SEQUENCIA_CRITICA.forEach(fase => {
      md += `| ${fase.fase} | ${fase.areas.join(', ')} | ${fase.descricao} | ${fase.duracao} |\n`;
    });

    md += `

## Regras de Dependência

1. **Estratégia primeiro:** Todas as áreas dependem de uma estratégia clara
2. **Infraestrutura habilita execução:** Dados e tecnologia são pré-requisitos para operações
3. **Pessoas sustentam a mudança:** Cultura e talentos permitem escala
4. **Governança protege:** Compliance e risco são transversais

---

# 13. ANÁLISE DE CENÁRIOS

## Cenários de Evolução

`;

    Object.values(CENARIOS).forEach(cenario => {
      md += `### ${cenario.nome}

> ${cenario.descricao}

| Atributo | Valor |
|----------|-------|
| **Velocidade de Evolução** | ${cenario.velocidade} |
| **Investimento** | ${cenario.investimento} |
| **Adequado Para** | ${cenario.adequadoPara} |
| **Riscos** | ${cenario.riscos} |

`;
    });

    md += `---

# 14. PRÓXIMOS PASSOS IMEDIATOS

## Ações para os Próximos 30 Dias

1. **Semana 1-2:** Apresentar resultados para C-Level
2. **Semana 2-3:** Priorizar quick wins identificados
3. **Semana 3-4:** Iniciar plano de ação para áreas críticas
4. **Contínuo:** Estabelecer cadência de acompanhamento

## Ações para os Próximos 90 Dias

1. Definir/revisar estratégia de IA
2. Estabelecer governança de IA
3. Iniciar programa de capacitação
4. Lançar pilotos prioritários
5. Definir métricas de acompanhamento

---

# 15. CONCLUSÃO

A **${projeto.empresa.nome}** encontra-se no **${levelInfo.name}** de maturidade em IA, com um score geral de **${scoreGeral.toFixed(2)}/5.00**.

${scoreGeral >= 3.5 
  ? `A organização demonstra boa maturidade em IA, com áreas consolidadas e oportunidades de otimização.`
  : scoreGeral >= 2.5 
    ? `A organização está em processo de estruturação de suas iniciativas de IA, com fundamentos estabelecidos e espaço para evolução.`
    : `A organização está em estágio inicial de maturidade em IA, com oportunidades significativas de desenvolvimento.`
}

### Principais Recomendações

1. ${areasParaMelhorar.length > 0 ? `Priorizar as ${areasParaMelhorar.length} áreas identificadas como críticas` : 'Manter evolução contínua em todas as dimensões'}
2. Estabelecer governança de IA robusta
3. Investir em talentos e capacitação
4. Definir métricas claras de ROI
5. Agendar reavaliação em 6-12 meses

---

# 16. PRODUTOS IA-FIRST

`;

    if (projeto.produtos && projeto.produtos.length > 0) {
      md += `## Resumo dos Produtos

| # | Produto | Vertical | Status | Fase | Score |
|:-:|---------|----------|--------|------|:-----:|
`;
      projeto.produtos.forEach((p, idx) => {
        md += `| ${idx + 1} | ${p.nome} | ${p.vertical?.nome || '-'} | ${p.status} | ${p.faseAtual || 'ideia'} | ${p.scoreRelevancia?.toFixed(2) || '-'} |\n`;
      });

      projeto.produtos.forEach((produto, idx) => {
        md += `

---

## Produto ${idx + 1}: ${produto.nome}

| Campo | Valor |
|-------|-------|
| **Descrição** | ${produto.descricao || 'Não informada'} |
| **Vertical** | ${produto.vertical?.nome || 'Não definida'} |
| **Status** | ${produto.status} |
| **Fase Atual** | ${produto.faseAtual || 'ideia'} |
| **Complexidade** | ${produto.complexidade || 'media'} |
| **Score de Relevância** | ${produto.scoreRelevancia?.toFixed(2) || 'N/A'} / 5.00 |

`;
      });
    } else {
      md += `*Nenhum produto IA-First cadastrado.*\n`;
    }

    md += `

---

# REFERÊNCIAS

## Modelo MIT CISR de Maturidade em IA

O **MIT CISR Enterprise AI Maturity Model** (Weill, Woerner & Sebastian, 2024) é baseado em pesquisa com **721 empresas** e identifica 5 níveis de maturidade em IA empresarial.

### Referência Bibliográfica

> Weill, P., Woerner, S. L., & Sebastian, I. M. (2024). Enterprise AI Maturity Model. 
> MIT Center for Information Systems Research. 
> https://cisr.mit.edu/publication/2024_1201_EnterpriseAIMaturityModel_WeillWoernerSebastian

---

<div align="center">

**Documento gerado automaticamente pelo Blueprint Agêntico**

**${dataGeracao}**

© ${new Date().getFullYear()} SysMap Solutions - Todos os direitos reservados

</div>
`;

    // Criar ZIP com os dois arquivos
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-maturidade-${nomeProjeto}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    archive.append(markdownCadastro, { name: `${nomeEmpresa}_${nomeProjeto}.md` });
    archive.append(md, { name: `relatorio-maturidade-ia-completo-${nomeProjeto}.md` });

    await archive.finalize();
  } catch (error) {
    console.error('Erro ao exportar ZIP relatório maturidade:', error);
    res.status(500).json({ error: 'Erro ao exportar relatório', details: error.message });
  }
});

/**
 * GET /api/exportar/projeto/:projetoId/zip-docx
 * Exporta projeto em ZIP com dois arquivos DOCX (projeto + ficha cadastral)
 */
router.get('/projeto/:projetoId/zip-docx', async (req, res) => {
  try {
    const { projetoId } = req.params;
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = await import('docx');
    
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(projetoId) },
      include: {
        empresa: {
          include: {
            _count: { select: { usuarios: true } }
          }
        },
        avaliacoes: {
          include: { usuario: true },
          orderBy: { createdAt: 'desc' }
        },
        produtos: {
          include: {
            vertical: true,
            especificacoes: {
              include: { documentos: true, geradoPor: true },
              orderBy: { versao: 'desc' },
              take: 1
            }
          }
        },
        _count: { select: { avaliacoes: true, produtos: true } }
      }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const nomeEmpresa = projeto.empresa.nome.replace(/\s+/g, '-').toLowerCase();
    const nomeProjeto = projeto.nome.replace(/\s+/g, '-').toLowerCase();
    const empresa = projeto.empresa;
    const dataGeracao = new Date().toLocaleDateString('pt-BR');
    const WORD_FONT = 'Courier New';

    // Parse dos campos JSON para ficha cadastral
    let audiencias = [];
    let lentes = [];
    try { if (projeto.audienciaPrimaria) audiencias = JSON.parse(projeto.audienciaPrimaria); } catch (e) {}
    try { if (projeto.lentesPrioritarias) lentes = JSON.parse(projeto.lentesPrioritarias); } catch (e) {}

    const createCell = (text, bold = false) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: String(text || '-'), font: WORD_FONT, size: 20, bold })]
      })],
      width: { size: 50, type: WidthType.PERCENTAGE }
    });

    const createTable = (rows) => new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map(([label, value]) => new TableRow({
        children: [createCell(label, true), createCell(value)]
      }))
    });

    // ========== DOCUMENTO 1: PROJETO ==========
    const projetoSections = [];

    projetoSections.push(
      new Paragraph({
        children: [new TextRun({ text: `PROJETO: ${projeto.nome}`.toUpperCase(), font: WORD_FONT, size: 36, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Blueprint Agentico - Documentacao Completa do Projeto', font: WORD_FONT, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    projetoSections.push(
      new Paragraph({
        children: [new TextRun({ text: '1. INFORMACOES DO PROJETO', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      }),
      createTable([
        ['Nome', projeto.nome],
        ['Empresa', empresa?.nome || 'N/A'],
        ['Descricao', projeto.descricao || 'Nao informada'],
        ['Vertical', projeto.vertical ? (VERTICAIS[projeto.vertical] || projeto.vertical) : 'Nao definida'],
        ['Status', projeto.status],
        ['Data de Criacao', new Date(projeto.createdAt).toLocaleDateString('pt-BR')]
      ])
    );

    projetoSections.push(
      new Paragraph({
        children: [new TextRun({ text: '2. INFORMACOES DA EMPRESA', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      }),
      createTable([
        ['Nome', empresa?.nome || 'N/A'],
        ['CNPJ', empresa?.cnpj || 'Nao informado'],
        ['Setor', empresa?.setor || 'Nao informado'],
        ['Porte', empresa?.porte || 'Nao informado'],
        ['E-mail', empresa?.email || 'Nao informado'],
        ['Telefone', empresa?.telefone || 'Nao informado'],
        ['Website', empresa?.website || 'Nao informado']
      ])
    );

    projetoSections.push(
      new Paragraph({
        children: [new TextRun({ text: '3. AVALIACOES DE MATURIDADE', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      })
    );

    if (projeto.avaliacoes && projeto.avaliacoes.length > 0) {
      projetoSections.push(
        new Paragraph({
          children: [new TextRun({ text: `Total de avaliacoes: ${projeto.avaliacoes.length}`, font: WORD_FONT, size: 20 })],
          spacing: { after: 200 }
        })
      );
      projeto.avaliacoes.forEach((av, idx) => {
        projetoSections.push(
          new Paragraph({
            children: [new TextRun({ text: `Avaliacao ${idx + 1}: ${av.usuario?.nome || 'N/A'} - Status: ${av.status} | Score: ${av.scoreGeral?.toFixed(2) || '-'}`, font: WORD_FONT, size: 18 })],
            spacing: { before: 100 }
          })
        );
      });
    } else {
      projetoSections.push(new Paragraph({
        children: [new TextRun({ text: 'Nenhuma avaliacao realizada.', font: WORD_FONT, size: 20, italics: true })]
      }));
    }

    projetoSections.push(
      new Paragraph({
        children: [new TextRun({ text: '4. PRODUTOS IA-FIRST', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      })
    );

    if (projeto.produtos && projeto.produtos.length > 0) {
      projetoSections.push(new Paragraph({
        children: [new TextRun({ text: `Total de produtos: ${projeto.produtos.length}`, font: WORD_FONT, size: 20 })],
        spacing: { after: 200 }
      }));
      projeto.produtos.forEach((produto, idx) => {
        projetoSections.push(
          new Paragraph({
            children: [new TextRun({ text: `4.${idx + 1}. ${produto.nome}`, font: WORD_FONT, size: 22, bold: true })],
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            children: [new TextRun({ text: `Status: ${produto.status} | Fase: ${produto.faseAtual || 'ideia'} | Score: ${produto.scoreRelevancia?.toFixed(2) || 'N/A'}`, font: WORD_FONT, size: 18 })]
          })
        );
      });
    } else {
      projetoSections.push(new Paragraph({
        children: [new TextRun({ text: 'Nenhum produto cadastrado.', font: WORD_FONT, size: 20, italics: true })]
      }));
    }

    projetoSections.push(
      new Paragraph({
        children: [new TextRun({ text: `Documento gerado em ${dataGeracao}`, font: WORD_FONT, size: 18, italics: true })],
        spacing: { before: 600 },
        alignment: AlignmentType.CENTER
      })
    );

    const docProjeto = new Document({ sections: [{ properties: {}, children: projetoSections }] });
    const bufferProjeto = await Packer.toBuffer(docProjeto);

    // ========== DOCUMENTO 2: FICHA CADASTRAL ==========
    const cadastroSections = [];

    cadastroSections.push(
      new Paragraph({
        children: [new TextRun({ text: 'FICHA CADASTRAL', font: WORD_FONT, size: 36, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: `${empresa.nome} - ${projeto.nome}`, font: WORD_FONT, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    cadastroSections.push(
      new Paragraph({
        children: [new TextRun({ text: 'INFORMACOES DA EMPRESA', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      }),
      createTable([
        ['Razao Social', empresa.nome],
        ['CNPJ', empresa.cnpj || 'Nao informado'],
        ['Setor de Atuacao', empresa.setor || 'Nao informado'],
        ['Porte', empresa.porte || 'Nao informado'],
        ['E-mail', empresa.email || 'Nao informado'],
        ['Telefone', empresa.telefone || 'Nao informado'],
        ['Endereco', empresa.endereco || 'Nao informado'],
        ['Website', empresa.website || 'Nao informado']
      ])
    );

    cadastroSections.push(
      new Paragraph({
        children: [new TextRun({ text: 'INFORMACOES DO PROJETO', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      }),
      createTable([
        ['Nome do Projeto', projeto.nome],
        ['Descricao', projeto.descricao || 'Nao informada'],
        ['Vertical / Setor', projeto.vertical ? (VERTICAIS[projeto.vertical] || projeto.vertical) : 'Nao definida'],
        ['Status', projeto.status]
      ])
    );

    cadastroSections.push(
      new Paragraph({
        children: [new TextRun({ text: 'AUDIENCIA PRIMARIA', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      })
    );
    if (audiencias.length > 0) {
      audiencias.forEach(a => {
        cadastroSections.push(new Paragraph({
          children: [new TextRun({ text: `• ${AUDIENCIAS_PRIMARIAS[a] || a}`, font: WORD_FONT, size: 20 })]
        }));
      });
    } else {
      cadastroSections.push(new Paragraph({
        children: [new TextRun({ text: 'Nao definida', font: WORD_FONT, size: 20, italics: true })]
      }));
    }

    cadastroSections.push(
      new Paragraph({
        children: [new TextRun({ text: 'LENTES PRIORITARIAS', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      })
    );
    if (lentes.length > 0) {
      lentes.forEach(l => {
        cadastroSections.push(new Paragraph({
          children: [new TextRun({ text: `• ${LENTES_PRIORITARIAS[l] || l}`, font: WORD_FONT, size: 20 })]
        }));
      });
    } else {
      cadastroSections.push(new Paragraph({
        children: [new TextRun({ text: 'Nao definidas', font: WORD_FONT, size: 20, italics: true })]
      }));
    }

    cadastroSections.push(
      new Paragraph({
        children: [new TextRun({ text: 'ESTATISTICAS', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      }),
      createTable([
        ['Total de Avaliacoes', String(projeto._count?.avaliacoes || 0)],
        ['Total de Produtos', String(projeto._count?.produtos || 0)],
        ['Total de Usuarios', String(empresa._count?.usuarios || 0)]
      ])
    );

    cadastroSections.push(
      new Paragraph({
        children: [new TextRun({ text: `Documento gerado em ${dataGeracao}`, font: WORD_FONT, size: 18, italics: true })],
        spacing: { before: 600 },
        alignment: AlignmentType.CENTER
      })
    );

    const docCadastro = new Document({ sections: [{ properties: {}, children: cadastroSections }] });
    const bufferCadastro = await Packer.toBuffer(docCadastro);

    // Criar ZIP com os dois arquivos
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="projeto-${nomeProjeto}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    archive.append(bufferProjeto, { name: `projeto-${nomeProjeto}.docx` });
    archive.append(bufferCadastro, { name: `${nomeEmpresa}_${nomeProjeto}.docx` });

    await archive.finalize();
  } catch (error) {
    console.error('Erro ao exportar ZIP DOCX:', error);
    res.status(500).json({ error: 'Erro ao exportar projeto', details: error.message });
  }
});

/**
 * GET /api/exportar/projeto/:projetoId/docx
 * Exporta projeto completo em Word
 */
router.get('/projeto/:projetoId/docx', async (req, res) => {
  try {
    const { projetoId } = req.params;
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = await import('docx');
    
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(projetoId) },
      include: {
        empresa: true,
        avaliacoes: {
          include: { usuario: true },
          orderBy: { createdAt: 'desc' }
        },
        produtos: {
          include: {
            vertical: true,
            especificacoes: {
              include: { documentos: true, geradoPor: true },
              orderBy: { versao: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const WORD_FONT = 'Courier New';
    const dataGeracao = new Date().toLocaleDateString('pt-BR');
    
    const createCell = (text, bold = false) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: String(text || '-'), font: WORD_FONT, size: 20, bold })]
      })],
      width: { size: 50, type: WidthType.PERCENTAGE }
    });

    const createTable = (rows) => new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map(([label, value]) => new TableRow({
        children: [createCell(label, true), createCell(value)]
      }))
    });

    const sections = [];

    // Título
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `PROJETO: ${projeto.nome}`.toUpperCase(), font: WORD_FONT, size: 36, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Blueprint Agentico - Documentacao Completa do Projeto', font: WORD_FONT, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Informações do Projeto
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: '1. INFORMACOES DO PROJETO', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      }),
      createTable([
        ['Nome', projeto.nome],
        ['Empresa', projeto.empresa?.nome || 'N/A'],
        ['Descricao', projeto.descricao || 'Nao informada'],
        ['Vertical', projeto.vertical ? (VERTICAIS[projeto.vertical] || projeto.vertical) : 'Nao definida'],
        ['Status', projeto.status],
        ['Data de Criacao', new Date(projeto.createdAt).toLocaleDateString('pt-BR')]
      ])
    );

    // Informações da Empresa
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: '2. INFORMACOES DA EMPRESA', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      }),
      createTable([
        ['Nome', projeto.empresa?.nome || 'N/A'],
        ['CNPJ', projeto.empresa?.cnpj || 'Nao informado'],
        ['Setor', projeto.empresa?.setor || 'Nao informado'],
        ['Porte', projeto.empresa?.porte || 'Nao informado'],
        ['E-mail', projeto.empresa?.email || 'Nao informado'],
        ['Telefone', projeto.empresa?.telefone || 'Nao informado'],
        ['Endereco', projeto.empresa?.endereco || 'Nao informado'],
        ['Website', projeto.empresa?.website || 'Nao informado']
      ])
    );

    // Avaliações
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: '3. AVALIACOES DE MATURIDADE', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      })
    );

    if (projeto.avaliacoes && projeto.avaliacoes.length > 0) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: `Total de avaliacoes: ${projeto.avaliacoes.length}`, font: WORD_FONT, size: 20 })],
          spacing: { after: 200 }
        })
      );
      
      projeto.avaliacoes.forEach((av, idx) => {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: `Avaliacao ${idx + 1}: ${av.usuario?.nome || 'N/A'}`, font: WORD_FONT, size: 20, bold: true })],
            spacing: { before: 200 }
          }),
          new Paragraph({
            children: [new TextRun({ text: `Status: ${av.status} | Score: ${av.scoreGeral?.toFixed(2) || '-'} | Nivel: ${av.nivelGeral || '-'} | Data: ${new Date(av.createdAt).toLocaleDateString('pt-BR')}`, font: WORD_FONT, size: 18 })]
          })
        );
      });
    } else {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: 'Nenhuma avaliacao de maturidade realizada.', font: WORD_FONT, size: 20, italics: true })]
        })
      );
    }

    // Produtos
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: '4. PRODUTOS IA-FIRST', font: WORD_FONT, size: 24, bold: true })],
        spacing: { before: 400, after: 200 }
      })
    );

    if (projeto.produtos && projeto.produtos.length > 0) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: `Total de produtos: ${projeto.produtos.length}`, font: WORD_FONT, size: 20 })],
          spacing: { after: 200 }
        })
      );

      projeto.produtos.forEach((produto, idx) => {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: `4.${idx + 1}. ${produto.nome}`, font: WORD_FONT, size: 22, bold: true })],
            spacing: { before: 300, after: 100 }
          }),
          createTable([
            ['Descricao', produto.descricao || 'Nao informada'],
            ['Status', produto.status],
            ['Fase Atual', produto.faseAtual || 'ideia'],
            ['Complexidade', produto.complexidade || 'media'],
            ['Vertical', produto.vertical?.nome || 'Nao definida'],
            ['Score de Relevancia', produto.scoreRelevancia?.toFixed(2) || 'N/A']
          ])
        );

        if (produto.custoEstimado || produto.retornoAnualEsperado) {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: 'Informacoes Financeiras:', font: WORD_FONT, size: 20, bold: true })],
              spacing: { before: 100 }
            })
          );
          if (produto.custoEstimado) {
            sections.push(new Paragraph({
              children: [new TextRun({ text: `- Custo Estimado: R$ ${produto.custoEstimado.toLocaleString('pt-BR')}`, font: WORD_FONT, size: 18 })]
            }));
          }
          if (produto.retornoAnualEsperado) {
            sections.push(new Paragraph({
              children: [new TextRun({ text: `- Retorno Anual Esperado: R$ ${produto.retornoAnualEsperado.toLocaleString('pt-BR')}`, font: WORD_FONT, size: 18 })]
            }));
          }
        }
      });
    } else {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: 'Nenhum produto cadastrado.', font: WORD_FONT, size: 20, italics: true })]
        })
      );
    }

    // Rodapé
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `Documento gerado automaticamente pelo Blueprint Agentico em ${dataGeracao}`, font: WORD_FONT, size: 18, italics: true })],
        spacing: { before: 600 },
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        children: [new TextRun({ text: `© ${new Date().getFullYear()} SysMap Solutions`, font: WORD_FONT, size: 18 })],
        alignment: AlignmentType.CENTER
      })
    );

    const doc = new Document({
      sections: [{ properties: {}, children: sections }]
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="projeto-${projeto.nome.replace(/\s+/g, '-')}.docx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Erro ao exportar projeto DOCX:', error);
    res.status(500).json({ error: 'Erro ao exportar projeto', details: error.message });
  }
});

/**
 * GET /api/exportar/projeto-completo/:projetoId
 * Exporta projeto com TODAS as especificações de produtos anexadas
 */
router.get('/projeto-completo/:projetoId', async (req, res) => {
  try {
    const { projetoId } = req.params;
    
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(projetoId) },
      include: {
        empresa: true,
        avaliacoes: {
          include: {
            usuario: true,
            respostas: {
              include: {
                pergunta: {
                  include: { area: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        produtos: {
          include: {
            vertical: true,
            avaliacoes: {
              include: { usuario: true },
              orderBy: { createdAt: 'desc' }
            },
            especificacoes: {
              include: {
                documentos: {
                  orderBy: { ordem: 'asc' }
                },
                geradoPor: true
              },
              orderBy: { versao: 'desc' }
            },
            arquivosReferencia: true
          }
        }
      }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Gerar markdown base do projeto
    let markdown = await gerarMarkdownProjeto(projeto);

    // Adicionar especificações de cada produto
    markdown += `\n\n---\n\n# ANEXOS - Especificações de Produtos\n\n`;

    for (const produto of projeto.produtos) {
      if (produto.especificacoes && produto.especificacoes.length > 0) {
        const especificacao = produto.especificacoes[0]; // Última versão
        markdown += `\n\n---\n\n`;
        markdown += gerarMarkdownEspecificacao(especificacao, produto);
      }
    }

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="projeto-completo-${projeto.nome.replace(/\s+/g, '-')}.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('Erro ao exportar projeto completo:', error);
    res.status(500).json({ error: 'Erro ao exportar projeto completo', details: error.message });
  }
});

/**
 * GET /api/exportar/especificacao/:especificacaoId
 * Exporta especificação de produto em Markdown
 */
router.get('/especificacao/:especificacaoId', async (req, res) => {
  try {
    const { especificacaoId } = req.params;
    
    const especificacao = await prisma.especificacaoProduto.findUnique({
      where: { id: parseInt(especificacaoId) },
      include: {
        produto: {
          include: {
            vertical: true,
            projeto: {
              include: { empresa: true }
            }
          }
        },
        documentos: {
          orderBy: { ordem: 'asc' }
        },
        geradoPor: true
      }
    });

    if (!especificacao) {
      return res.status(404).json({ error: 'Especificação não encontrada' });
    }

    const markdown = gerarMarkdownEspecificacao(especificacao, especificacao.produto);

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="especificacao-${especificacao.produto.nome.replace(/\s+/g, '-')}-v${especificacao.versao}.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('Erro ao exportar especificação:', error);
    res.status(500).json({ error: 'Erro ao exportar especificação', details: error.message });
  }
});

/**
 * GET /api/exportar/produto/:produtoId
 * Exporta produto com avaliações e especificação
 */
router.get('/produto/:produtoId', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const produto = await prisma.produto.findUnique({
      where: { id: parseInt(produtoId) },
      include: {
        vertical: true,
        projeto: {
          include: { empresa: true }
        },
        avaliacoes: {
          include: {
            usuario: true,
            respostasObrigatorias: {
              include: { perguntaObrigatoria: true }
            },
            respostasVerticais: {
              include: { perguntaProduto: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        especificacoes: {
          include: {
            documentos: { orderBy: { ordem: 'asc' } },
            geradoPor: true
          },
          orderBy: { versao: 'desc' }
        },
        arquivosReferencia: true
      }
    });

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const dataGeracao = new Date().toLocaleDateString('pt-BR');
    
    let md = `# Produto: ${produto.nome}

## Blueprint Agêntico - Documentação Completa do Produto

---

## 1. Informações do Produto

| Campo | Valor |
|-------|-------|
| **Nome** | ${produto.nome} |
| **Projeto** | ${produto.projeto?.nome || 'N/A'} |
| **Empresa** | ${produto.projeto?.empresa?.nome || 'N/A'} |
| **Descrição** | ${produto.descricao || 'Não informada'} |
| **Status** | ${produto.status} |
| **Fase Atual** | ${produto.faseAtual || 'ideia'} |
| **Complexidade** | ${produto.complexidade || 'media'} |
| **Vertical** | ${produto.vertical?.nome || 'Não definida'} |
| **Score de Relevância** | ${produto.scoreRelevancia?.toFixed(2) || 'N/A'} / 5.00 |

### Detalhes do Produto

| Campo | Valor |
|-------|-------|
| **Problema que Resolve** | ${produto.problemaResolve || 'Não informado'} |
| **Público-Alvo** | ${produto.publicoAlvo || 'Não informado'} |
| **Diferencial Competitivo** | ${produto.diferencialCompetitivo || 'Não informado'} |
| **Principais Riscos** | ${produto.principaisRiscos || 'Não informados'} |
| **Dependências Externas** | ${produto.dependenciasExternas || 'Não informadas'} |

### Métricas de Sucesso

| Campo | Valor |
|-------|-------|
| **Métrica Principal** | ${produto.metricaPrincipal || 'Não definida'} |
| **Baseline Atual** | ${produto.baselineAtual || 'Não definido'} |
| **Meta Esperada** | ${produto.metaEsperada || 'Não definida'} |

### Informações Financeiras

| Campo | Valor |
|-------|-------|
| **Custo Estimado** | ${produto.custoEstimado ? `R$ ${produto.custoEstimado.toLocaleString('pt-BR')}` : 'Não informado'} |
| **Retorno Anual Esperado** | ${produto.retornoAnualEsperado ? `R$ ${produto.retornoAnualEsperado.toLocaleString('pt-BR')}` : 'Não informado'} |
| **Status de Construção** | ${produto.statusConstrucao || 'planejado'} |

### Cronograma

| Campo | Valor |
|-------|-------|
| **Início da Construção** | ${produto.dataInicioConstrucao ? new Date(produto.dataInicioConstrucao).toLocaleDateString('pt-BR') : 'Não definido'} |
| **Fim Previsto** | ${produto.dataFimConstrucao ? new Date(produto.dataFimConstrucao).toLocaleDateString('pt-BR') : 'Não definido'} |
| **Ativação em Produção** | ${produto.dataAtivacaoProducao ? new Date(produto.dataAtivacaoProducao).toLocaleDateString('pt-BR') : 'Não definido'} |

---

## 2. Avaliações de Transformação Agêntica

`;

    if (produto.avaliacoes && produto.avaliacoes.length > 0) {
      md += `Total de avaliações: **${produto.avaliacoes.length}**\n\n`;
      
      produto.avaliacoes.forEach((av, index) => {
        md += `### Avaliação ${index + 1}\n\n`;
        md += `| Campo | Valor |\n`;
        md += `|-------|-------|\n`;
        md += `| **Avaliador** | ${av.usuario?.nome || 'N/A'} |\n`;
        md += `| **Status** | ${av.status} |\n`;
        md += `| **Score Obrigatório** | ${av.scoreObrigatorio?.toFixed(2) || '-'} |\n`;
        md += `| **Score Verticais** | ${av.scoreVerticais?.toFixed(2) || '-'} |\n`;
        md += `| **Score de Relevância** | ${av.scoreRelevancia?.toFixed(2) || '-'} |\n`;
        md += `| **Data** | ${new Date(av.createdAt).toLocaleDateString('pt-BR')} |\n\n`;
      });
    } else {
      md += `*Nenhuma avaliação realizada.*\n\n`;
    }

    md += `---\n\n## 3. Arquivos de Referência\n\n`;

    if (produto.arquivosReferencia && produto.arquivosReferencia.length > 0) {
      md += `Total de arquivos: **${produto.arquivosReferencia.length}**\n\n`;
      md += `| Arquivo | Categoria | Tipo | Tamanho |\n`;
      md += `|---------|-----------|------|----------|\n`;
      
      produto.arquivosReferencia.forEach(arq => {
        const tamanhoKB = (arq.tamanho / 1024).toFixed(1);
        md += `| ${arq.nomeOriginal} | ${arq.categoria} | ${arq.mimeType} | ${tamanhoKB} KB |\n`;
      });
    } else {
      md += `*Nenhum arquivo anexado.*\n\n`;
    }

    // Adicionar especificação se existir
    if (produto.especificacoes && produto.especificacoes.length > 0) {
      md += `\n---\n\n## 4. Especificação Técnica\n\n`;
      const especificacao = produto.especificacoes[0];
      md += gerarMarkdownEspecificacao(especificacao, produto);
    }

    md += `\n---\n\n*Documento gerado automaticamente pelo Blueprint Agêntico em ${dataGeracao}*\n\n`;
    md += `*© ${new Date().getFullYear()} SysMap Solutions*\n`;

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="produto-${produto.nome.replace(/\s+/g, '-')}.md"`);
    res.send(md);
  } catch (error) {
    console.error('Erro ao exportar produto:', error);
    res.status(500).json({ error: 'Erro ao exportar produto', details: error.message });
  }
});

/**
 * GET /api/exportar/dashboard/:projetoId
 * Exporta Dashboard Blueprint + Relatório Completo do Projeto em Markdown
 * Inclui: Sumário Executivo, Benchmarking, Projeção Financeira, Plano de Ação, Roadmap, Cenários, etc.
 */
router.get('/dashboard/:projetoId', async (req, res) => {
  try {
    const { projetoId } = req.params;
    
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(projetoId) },
      include: {
        empresa: true,
        avaliacoes: {
          where: { status: 'finalizada' },
          include: {
            usuario: true,
            respostas: {
              include: {
                pergunta: {
                  include: { area: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        produtos: {
          include: {
            vertical: true,
            avaliacoes: {
              include: { usuario: true },
              orderBy: { createdAt: 'desc' }
            },
            especificacoes: {
              include: { 
                documentos: { orderBy: { ordem: 'asc' } },
                geradoPor: true
              },
              orderBy: { versao: 'desc' }
            },
            arquivosReferencia: true
          }
        }
      }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Buscar áreas
    const areas = await prisma.area.findMany({
      include: { perguntas: true },
      orderBy: { ordem: 'asc' }
    });
    const todasAreaIdsExportDash = areas.map((a) => a.id);

    // Calcular scores consolidados
    const scoresPorArea = areas.map(area => {
      let totalScore = 0;
      let totalRespostas = 0;

      projeto.avaliacoes.forEach(av => {
        if (!areaContaParaAvaliacao(av, area.id, todasAreaIdsExportDash)) return;
        const respostasArea = av.respostas.filter(r => r.pergunta.areaId === area.id && r.pontuacao !== null);
        respostasArea.forEach(r => {
          totalScore += r.pontuacao;
          totalRespostas++;
        });
      });

      const esperadas = projeto.avaliacoes.reduce(
        (acc, av) =>
          acc + (areaContaParaAvaliacao(av, area.id, todasAreaIdsExportDash) ? area.perguntas.length : 0),
        0
      );

      const score = totalRespostas > 0 ? totalScore / totalRespostas : 0;
      return {
        areaId: area.id,
        area: area.nome,
        score,
        nivel: calcularNivel(score),
        respondidas: totalRespostas,
        total: esperadas
      };
    }).filter(a => a.respondidas > 0);

    const scoreGeral = scoresPorArea.length > 0
      ? scoresPorArea.reduce((acc, a) => acc + a.score, 0) / scoresPorArea.length
      : 0;

    const nivelGeral = calcularNivel(scoreGeral);
    const dataGeracao = new Date().toLocaleDateString('pt-BR');

    // MIT CISR Levels - Completo
    const MIT_CISR_LEVELS = {
      1: { 
        name: 'Nível 1: Inicial', 
        nameEn: 'Initial / Experimenting',
        focus: 'Exploração e Educação', 
        growth: '-15% a -10%', 
        description: 'Organização ainda está explorando o potencial da IA. Poucos ou nenhum projeto formal.',
        characteristics: [
          'Sem estratégia formal de IA',
          'Iniciativas isoladas e ad-hoc',
          'Falta de infraestrutura de dados',
          'Baixa conscientização sobre IA',
          'Orçamento não dedicado'
        ],
        percentage: '~25%'
      },
      2: { 
        name: 'Nível 2: Oportunista', 
        nameEn: 'Preparing / Experimenting',
        focus: 'Preparação e Experimentação', 
        growth: '-10% a -5%', 
        description: 'Empresa começa a investir em IA de forma mais estruturada, com pilotos iniciais.',
        characteristics: [
          'Educar a força de trabalho sobre IA',
          'Estabelecer políticas de uso aceitável',
          'Tornar dados mais acessíveis',
          'Primeiros experimentos formais',
          'Identificar onde humanos devem estar no loop'
        ],
        percentage: '~30%'
      },
      3: { 
        name: 'Nível 3: Estruturado', 
        nameEn: 'Building Pilots',
        focus: 'Casos de Negócio e Pilotos', 
        growth: '0% a +5%', 
        description: 'Pilotos em andamento com métricas definidas. Processos começam a ser automatizados.',
        characteristics: [
          'Simplificar e automatizar processos',
          'Criar casos de uso com métricas',
          'Compartilhar dados via APIs',
          'Usar LLMs para aumentar o trabalho',
          'Estilo de gestão coach e comunicação'
        ],
        percentage: '~25%'
      },
      4: { 
        name: 'Nível 4: Gerenciado', 
        nameEn: 'Developing AI Ways of Working',
        focus: 'Escalar Plataformas e Dashboards', 
        growth: '+5% a +15%', 
        description: 'IA integrada ao negócio com governança estabelecida e modelos em produção.',
        characteristics: [
          'Expandir automação de processos',
          'Cultura test-and-learn estabelecida',
          'Arquitetar para reuso',
          'Incorporar modelos pré-treinados',
          'Explorar agentes autônomos'
        ],
        percentage: '~15%'
      },
      5: { 
        name: 'Nível 5: Otimizado', 
        nameEn: 'AI Future Ready',
        focus: 'Inovação Contínua e Novas Receitas', 
        growth: '+15% ou mais', 
        description: 'IA como diferencial competitivo, com inovação contínua e monetização de capacidades.',
        characteristics: [
          'IA embarcada em decisões e processos',
          'Criar e vender serviços aumentados por IA',
          'Combinar IA tradicional, generativa e agêntica',
          'Proprietary AI como vantagem competitiva',
          'Liderança de inovação no setor'
        ],
        percentage: '~5%'
      }
    };

    // Benchmarking completo com fontes
    const BENCHMARKING = {
      fintech: { mediaSetor: 3.2, top25: 4.1, bottom25: 2.1, nome: 'FinTech', fonte: 'MIT CISR Financial Services AI Study 2024', tendencia: 'crescente' },
      saude: { mediaSetor: 2.6, top25: 3.5, bottom25: 1.8, nome: 'Saúde', fonte: 'HIMSS Analytics Healthcare AI Adoption Report 2024', tendencia: 'crescente' },
      tecnologia: { mediaSetor: 3.5, top25: 4.4, bottom25: 2.5, nome: 'Tecnologia', fonte: 'Gartner Tech Industry AI Maturity Index 2024', tendencia: 'estável-alto' },
      ecommerce: { mediaSetor: 3.1, top25: 4.0, bottom25: 2.0, nome: 'E-Commerce', fonte: 'Forrester Retail AI Readiness Survey 2024', tendencia: 'crescente' },
      manufatura: { mediaSetor: 2.4, top25: 3.3, bottom25: 1.6, nome: 'Manufatura', fonte: 'McKinsey Industry 4.0 AI Adoption Study 2024', tendencia: 'crescente' },
      legaltech: { mediaSetor: 2.3, top25: 3.2, bottom25: 1.5, nome: 'LegalTech', fonte: 'Thomson Reuters Legal AI Adoption Report 2024', tendencia: 'crescente' },
      edtech: { mediaSetor: 2.8, top25: 3.7, bottom25: 1.9, nome: 'EdTech', fonte: 'HolonIQ EdTech AI Index 2024', tendencia: 'crescente' },
      aifirst: { mediaSetor: 3.8, top25: 4.6, bottom25: 2.8, nome: 'AI First', fonte: 'AI Engineering Maturity Benchmark 2024', tendencia: 'estável-alto' },
      agrovert: { mediaSetor: 2.2, top25: 3.1, bottom25: 1.4, nome: 'AgTech', fonte: 'AgFunder AgTech AI Adoption Report 2024', tendencia: 'crescente' }
    };

    // Projeção financeira detalhada
    const PROJECAO_FINANCEIRA = {
      1: { 
        crescimento: { min: -5, max: 0, media: -2 },
        custos: { min: 0, max: 5, media: 2 },
        roi: { min: -50, max: 50, media: 0 },
        tempo: '18-24 meses',
        investimento: '0.5% a 1% do faturamento',
        riscos: ['Investimentos sem retorno mensurável', 'Custos ocultos de experimentação', 'Perda de oportunidade de mercado']
      },
      2: { 
        crescimento: { min: 0, max: 5, media: 2 },
        custos: { min: 3, max: 8, media: 5 },
        roi: { min: 50, max: 150, media: 100 },
        tempo: '12-18 meses',
        investimento: '1% a 2% do faturamento',
        riscos: ['Pilotos sem escala não geram valor', 'Custos de infraestrutura iniciais', 'Dificuldade de demonstrar valor']
      },
      3: { 
        crescimento: { min: 3, max: 10, media: 6 },
        custos: { min: 5, max: 15, media: 10 },
        roi: { min: 150, max: 300, media: 200 },
        tempo: '9-12 meses',
        investimento: '2% a 4% do faturamento',
        riscos: ['Escalabilidade de modelos', 'Custos de MLOps crescentes', 'Dependência de talentos escassos']
      },
      4: { 
        crescimento: { min: 8, max: 18, media: 12 },
        custos: { min: 10, max: 25, media: 18 },
        roi: { min: 300, max: 500, media: 400 },
        tempo: '6-9 meses',
        investimento: '4% a 7% do faturamento',
        riscos: ['Complexidade de governança', 'Custos de manutenção de modelos', 'Riscos regulatórios']
      },
      5: { 
        crescimento: { min: 15, max: 30, media: 22 },
        custos: { min: 20, max: 35, media: 28 },
        roi: { min: 500, max: 1000, media: 700 },
        tempo: '3-6 meses',
        investimento: '7% a 12% do faturamento',
        riscos: ['Disrupção tecnológica', 'Dependência crítica de IA', 'Custos de inovação contínua']
      }
    };

    // Cenários de evolução
    const CENARIOS = {
      conservador: {
        nome: 'Conservador',
        descricao: 'Evolução gradual com foco em fundamentos e baixo risco',
        velocidade: '0.3 níveis/ano',
        investimento: '60% do recomendado',
        adequadoPara: 'Organizações com baixa tolerância a risco ou setores altamente regulados',
        riscos: 'Perda de competitividade para concorrentes mais ágeis'
      },
      base: {
        nome: 'Base (Recomendado)',
        descricao: 'Evolução balanceada com investimento proporcional ao retorno',
        velocidade: '0.5 níveis/ano',
        investimento: '100% do recomendado',
        adequadoPara: 'Maioria das organizações com ambição de transformação digital',
        riscos: 'Balanceado entre velocidade e sustentabilidade'
      },
      agressivo: {
        nome: 'Agressivo',
        descricao: 'Transformação acelerada com alto investimento e tolerância a risco',
        velocidade: '0.8 níveis/ano',
        investimento: '150% do recomendado',
        adequadoPara: 'Startups, scale-ups ou empresas em mercados altamente competitivos',
        riscos: 'Alto risco de execução, queima de caixa, exaustão de equipe'
      }
    };

    // Sequência crítica de implementação
    const SEQUENCIA_CRITICA = [
      { fase: 1, areas: ['Estratégia e Liderança'], descricao: 'Fundação - define direção e prioridades', duracao: '1-2 meses' },
      { fase: 2, areas: ['Dados e Tecnologia', 'Governança e Risco', 'Talentos e Capacidades', 'Conformidade Regulatória', 'Prontidão para Mudança'], descricao: 'Infraestrutura, Talentos e Compliance - habilita execução segura', duracao: '2-4 meses' },
      { fase: 3, areas: ['Pessoas e Cultura', 'Valor de Negócio e ROI', 'Valor por Unidade de Negócio'], descricao: 'Capacitação e Valor - desenvolve talentos e mapeia valor', duracao: '3-6 meses' },
      { fase: 4, areas: ['Operações e Processos'], descricao: 'Execução - coloca IA em produção', duracao: '4-8 meses' },
      { fase: 5, areas: ['Inovação e Experimentação', 'Ecossistema e Parcerias'], descricao: 'Escala - amplia impacto', duracao: '6-12 meses' }
    ];

    const nivelNumerico = scoreGeral >= 4.5 ? 5 : scoreGeral >= 3.5 ? 4 : scoreGeral >= 2.5 ? 3 : scoreGeral >= 1.5 ? 2 : 1;
    const levelInfo = MIT_CISR_LEVELS[nivelNumerico];
    const benchmark = projeto.vertical ? BENCHMARKING[projeto.vertical] : null;
    const projecao = ajustarProjecaoExportacao(PROJECAO_FINANCEIRA[nivelNumerico], projeto.faturamentoAnualProjeto);

    // Identificar gaps e problemas
    const areasParaMelhorar = scoresPorArea
      .filter(a => a.score < 3)
      .sort((a, b) => a.score - b.score);

    const areasFortes = scoresPorArea
      .filter(a => a.score >= 3.5)
      .sort((a, b) => b.score - a.score);

    // =============================================
    // RELATÓRIO COMPLETO EM MARKDOWN
    // =============================================
    let md = `# RELATÓRIO DE MATURIDADE EM INTELIGÊNCIA ARTIFICIAL

## Blueprint Agêntico — Assessment Completo

---

<div align="center">

**${projeto.empresa.nome}**

${projeto.nome}

*${dataGeracao}*

</div>

---

# SUMÁRIO

1. [Sumário Executivo](#1-sumário-executivo)
2. [Benchmarking Competitivo](#2-benchmarking-competitivo)
3. [Projeção de Impacto Financeiro](#3-projeção-de-impacto-financeiro)
4. [Resultados por Dimensão](#4-resultados-por-dimensão)
5. [Avaliadores e Participantes](#5-avaliadores-e-participantes)
6. [Análise por Vertical](#6-análise-por-vertical)
7. [Principais Gaps e Problemas Identificados](#7-principais-gaps-e-problemas-identificados)
8. [Plano de Ação Recomendado](#8-plano-de-ação-recomendado)
9. [Roadmap Estratégico de Evolução](#9-roadmap-estratégico-de-evolução)
10. [Análise Detalhada do Nível Atual](#10-análise-detalhada-do-nível-atual)
11. [Matriz de Priorização de Ações](#11-matriz-de-priorização-de-ações)
12. [Matriz de Dependências](#12-matriz-de-dependências)
13. [Análise de Cenários](#13-análise-de-cenários)
14. [Indicadores de Saúde](#14-indicadores-de-saúde)
15. [Próximos Passos Imediatos](#15-próximos-passos-imediatos)
16. [Conclusão](#16-conclusão)
17. [Dados do Projeto](#17-dados-do-projeto)
18. [Produtos IA-First](#18-produtos-ia-first)

---

# 1. SUMÁRIO EXECUTIVO

Este relatório apresenta os resultados do **Assessment de Maturidade em Inteligência Artificial** realizado na **${projeto.empresa.nome}** para o projeto **${projeto.nome}**, utilizando a metodologia **SysMap Blueprint IA**, alinhada com o **MIT CISR Enterprise AI Maturity Model**.

A avaliação analisou **${scoresPorArea.length} dimensões** críticas de maturidade em IA, com base nas respostas de **${projeto.avaliacoes.length} avaliador(es)**, resultando em um score geral de **${scoreGeral.toFixed(2)} pontos**, classificando a organização no nível **"${nivelGeral}"**.

## Resultado Principal

| Métrica | Valor |
|---------|:-----:|
| **Score Geral** | **${scoreGeral.toFixed(2)} / 5.00** |
| **Nível de Maturidade** | **${nivelGeral}** |
| **Classificação MIT CISR** | **${levelInfo.name}** |
| **Referência MIT** | ${levelInfo.nameEn} |
| **Foco Principal** | ${levelInfo.focus} |
| **% de Empresas neste Nível** | ${levelInfo.percentage} |

## Principais Descobertas

### Pontos Fortes (Score ≥ 3.5)
${areasFortes.length > 0 ? areasFortes.map(a => `- **${a.area}**: ${a.score.toFixed(2)} (${a.nivel})`).join('\n') : '- Nenhuma área com score ≥ 3.5'}

### Áreas de Atenção (Score < 3.0)
${areasParaMelhorar.length > 0 ? areasParaMelhorar.map(a => `- **${a.area}**: ${a.score.toFixed(2)} (${a.nivel})`).join('\n') : '- ✅ Todas as áreas com score ≥ 3.0'}

---

# 2. BENCHMARKING COMPETITIVO

`;

    if (benchmark) {
      md += `## Setor: ${benchmark.nome}

### Posicionamento Competitivo

| Métrica | Valor | Status |
|---------|:-----:|--------|
| **Sua Empresa** | **${scoreGeral.toFixed(2)}** | ${scoreGeral >= benchmark.top25 ? '🏆 Top 25%' : scoreGeral >= benchmark.mediaSetor ? '✅ Acima da média' : '⚠️ Abaixo da média'} |
| **Top 25% do Setor** | ${benchmark.top25} | Benchmark de excelência |
| **Média do Setor** | ${benchmark.mediaSetor} | Referência de mercado |
| **Bottom 25%** | ${benchmark.bottom25} | Organizações em atraso |

### Análise de Posicionamento

${scoreGeral >= benchmark.top25 
  ? `🏆 **Excelente!** A ${projeto.empresa.nome} está entre os **Top 25%** do setor ${benchmark.nome} em maturidade de IA. Esta posição privilegiada permite:\n- Atração de melhores talentos em IA\n- Vantagem competitiva sustentável\n- Potencial para monetização de capacidades de IA` 
  : scoreGeral >= benchmark.mediaSetor 
    ? `✅ **Acima da média.** A ${projeto.empresa.nome} está ${(scoreGeral - benchmark.mediaSetor).toFixed(2)} pontos acima da média do setor.\n\n**Gap para Top 25%:** ${(benchmark.top25 - scoreGeral).toFixed(2)} pontos\n\n**Ações para alcançar o Top 25%:**\n- Investir nas áreas prioritárias identificadas\n- Acelerar iniciativas de IA em andamento\n- Desenvolver cultura data-driven`
    : `⚠️ **Atenção.** A ${projeto.empresa.nome} está ${(benchmark.mediaSetor - scoreGeral).toFixed(2)} pontos abaixo da média do setor.\n\n**Gap para a média:** ${(benchmark.mediaSetor - scoreGeral).toFixed(2)} pontos\n\n**Riscos de permanecer neste nível:**\n- Perda de competitividade\n- Dificuldade de atração de talentos\n- Ineficiência operacional crescente`
}

**Fonte:** ${benchmark.fonte}

**Tendência do Setor:** ${benchmark.tendencia}

`;
    } else {
      md += `*Vertical não definida. Configure a vertical do projeto para obter benchmarking específico do setor.*\n\n`;
    }

    md += `---

# 3. PROJEÇÃO DE IMPACTO FINANCEIRO

## Projeções para o Nível ${nivelNumerico} (${nivelGeral})

| Indicador | Mínimo | Esperado | Máximo |
|-----------|:------:|:--------:|:------:|
| **Crescimento de Receita** | ${projecao.crescimento.min}% | **${projecao.crescimento.media}%** | ${projecao.crescimento.max}% |
| **Redução de Custos** | ${projecao.custos.min}% | **${projecao.custos.media}%** | ${projecao.custos.max}% |
| **ROI Esperado** | ${projecao.roi.min}% | **${projecao.roi.media}%** | ${projecao.roi.max}% |

| Atributo | Valor |
|----------|-------|
| **Tempo para ROI** | ${projecao.tempo} |
| **Investimento Recomendado** | ${projecao.investimento} |

## Riscos Financeiros do Nível Atual

${projecao.riscos.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---

# 4. RESULTADOS POR DIMENSÃO

## Scores Detalhados

| # | Dimensão | Score | Nível | Status | Gap |
|:-:|----------|:-----:|-------|:------:|:---:|
`;

    scoresPorArea.forEach((area, idx) => {
      const status = area.score >= 4 ? '🟢' : area.score >= 3 ? '🔵' : area.score >= 2 ? '🟡' : '🔴';
      const gap = area.score < 3 ? (3 - area.score).toFixed(2) : '-';
      md += `| ${idx + 1} | ${area.area} | ${area.score.toFixed(2)} | ${area.nivel} | ${status} | ${gap} |\n`;
    });

    md += `
### Legenda de Status
- 🟢 **Excelente** (≥ 4.0): Área de referência
- 🔵 **Bom** (≥ 3.0): Área estruturada
- 🟡 **Atenção** (≥ 2.0): Necessita evolução
- 🔴 **Crítico** (< 2.0): Prioridade imediata

---

# 5. AVALIADORES E PARTICIPANTES

`;

    if (projeto.avaliacoes.length > 0) {
      md += `**Total de avaliações:** ${projeto.avaliacoes.length}\n\n`;
      md += `| # | Avaliador | Cargo | E-mail | Data | Score |\n`;
      md += `|:-:|-----------|-------|--------|------|:-----:|\n`;
      projeto.avaliacoes.forEach((av, idx) => {
        md += `| ${idx + 1} | ${av.usuario?.nome || 'N/A'} | ${av.usuario?.cargo || '-'} | ${av.usuario?.email || 'N/A'} | ${new Date(av.createdAt).toLocaleDateString('pt-BR')} | ${av.scoreGeral?.toFixed(2) || '-'} |\n`;
      });
    } else {
      md += `*Nenhuma avaliação finalizada.*\n`;
    }

    md += `
---

# 6. ANÁLISE POR VERTICAL

`;

    if (benchmark) {
      md += `## ${benchmark.nome}

A vertical **${benchmark.nome}** apresenta características específicas que influenciam a jornada de maturidade em IA:

### Características do Setor
- **Média de Maturidade:** ${benchmark.mediaSetor}
- **Líderes (Top 25%):** ${benchmark.top25}
- **Tendência:** ${benchmark.tendencia}
- **Fonte:** ${benchmark.fonte}

### Posição Relativa
A ${projeto.empresa.nome} está ${scoreGeral >= benchmark.mediaSetor ? 'acima' : 'abaixo'} da média do setor ${benchmark.nome}.

`;
    } else {
      md += `*Configure a vertical do projeto para análise setorial específica.*\n\n`;
    }

    md += `---

# 7. PRINCIPAIS GAPS E PROBLEMAS IDENTIFICADOS

`;

    if (areasParaMelhorar.length > 0) {
      md += `Foram identificadas **${areasParaMelhorar.length} áreas** com score abaixo de 3.0 (nível Estruturado):\n\n`;
      areasParaMelhorar.forEach((area, index) => {
        md += `## ${index + 1}. ${area.area}

| Atributo | Valor |
|----------|-------|
| **Score Atual** | ${area.score.toFixed(2)} / 5.00 |
| **Nível** | ${area.nivel} |
| **Gap para Estruturado (3.0)** | ${(3 - area.score).toFixed(2)} pontos |
| **Gap para Gerenciado (4.0)** | ${(4 - area.score).toFixed(2)} pontos |
| **Prioridade** | ${area.score < 2 ? '🔴 Alta' : '🟡 Média'} |

`;
      });
    } else {
      md += `✅ **Parabéns!** Nenhuma área crítica identificada.\n\nTodas as dimensões estão com score ≥ 3.0 (nível Estruturado).\n\n`;
    }

    md += `---

# 8. PLANO DE AÇÃO RECOMENDADO

## Ações por Prioridade

### 🔴 Prioridade Alta (Score < 2.0)
${areasParaMelhorar.filter(a => a.score < 2).length > 0 
  ? areasParaMelhorar.filter(a => a.score < 2).map(a => `- **${a.area}:** Desenvolver fundamentos básicos, criar capacidades mínimas`).join('\n')
  : '- Nenhuma área com prioridade alta'}

### 🟡 Prioridade Média (Score 2.0 - 2.9)
${areasParaMelhorar.filter(a => a.score >= 2 && a.score < 3).length > 0 
  ? areasParaMelhorar.filter(a => a.score >= 2 && a.score < 3).map(a => `- **${a.area}:** Estruturar processos, definir métricas, escalar pilotos`).join('\n')
  : '- Nenhuma área com prioridade média'}

### 🟢 Otimização (Score ≥ 3.0)
${scoresPorArea.filter(a => a.score >= 3 && a.score < 4).length > 0 
  ? scoresPorArea.filter(a => a.score >= 3 && a.score < 4).map(a => `- **${a.area}:** Industrializar, automatizar, medir ROI`).join('\n')
  : '- Nenhuma área neste estágio'}

### 🏆 Excelência (Score ≥ 4.0)
${areasFortes.filter(a => a.score >= 4).length > 0 
  ? areasFortes.filter(a => a.score >= 4).map(a => `- **${a.area}:** Manter liderança, inovar, compartilhar práticas`).join('\n')
  : '- Nenhuma área com excelência ainda'}

---

# 9. ROADMAP ESTRATÉGICO DE EVOLUÇÃO

## Sequência Crítica de Implementação

`;

    SEQUENCIA_CRITICA.forEach(fase => {
      md += `### Fase ${fase.fase}: ${fase.descricao}

- **Áreas:** ${fase.areas.join(', ')}
- **Duração Estimada:** ${fase.duracao}

`;
    });

    md += `---

# 10. ANÁLISE DETALHADA DO NÍVEL ATUAL

## ${levelInfo.name}

> ${levelInfo.description}

### Referência MIT CISR
- **Nome em Inglês:** ${levelInfo.nameEn}
- **Foco Principal:** ${levelInfo.focus}
- **Crescimento Típico:** ${levelInfo.growth}
- **% de Empresas neste Nível:** ${levelInfo.percentage}

### Características deste Nível
${levelInfo.characteristics.map((c, i) => `${i + 1}. ${c}`).join('\n')}

### Para Evoluir para o Próximo Nível
${nivelNumerico < 5 ? `
Para alcançar o **${MIT_CISR_LEVELS[nivelNumerico + 1].name}**, a organização deve:

1. Consolidar as práticas do nível atual
2. Desenvolver as capacidades do próximo nível
3. Investir em infraestrutura e talentos
4. Estabelecer métricas e governança
` : `
A organização está no nível máximo de maturidade. O foco deve ser:

1. Manter a liderança através de inovação contínua
2. Monetizar capacidades de IA
3. Desenvolver proprietary AI
4. Liderar o ecossistema do setor
`}

---

# 11. MATRIZ DE PRIORIZAÇÃO DE AÇÕES

## Quadrante de Priorização

| Impacto / Esforço | Baixo Esforço | Alto Esforço |
|-------------------|---------------|--------------|
| **Alto Impacto** | Quick Wins | Projetos Estratégicos |
| **Baixo Impacto** | Melhorias Incrementais | Avaliar ROI |

### Quick Wins (Alto Impacto, Baixo Esforço)
- Capacitação inicial em IA para liderança
- Definição de políticas de uso de IA generativa
- Identificação de casos de uso de alto valor

### Projetos Estratégicos (Alto Impacto, Alto Esforço)
- Infraestrutura de dados e MLOps
- Programa de talentos em IA
- Governança de IA enterprise

---

# 12. MATRIZ DE DEPENDÊNCIAS

## Sequência Crítica de Implementação

A evolução das áreas segue dependências que determinam a ordem de implementação:

| Fase | Áreas | Descrição | Duração |
|:----:|-------|-----------|---------|
`;

    SEQUENCIA_CRITICA.forEach(fase => {
      md += `| ${fase.fase} | ${fase.areas.join(', ')} | ${fase.descricao} | ${fase.duracao} |\n`;
    });

    md += `
## Regras de Dependência

1. **Estratégia primeiro:** Todas as áreas dependem de uma estratégia clara
2. **Infraestrutura habilita execução:** Dados e tecnologia são pré-requisitos para operações
3. **Pessoas sustentam a mudança:** Cultura e talentos permitem escala
4. **Governança protege:** Compliance e risco são transversais

---

# 13. ANÁLISE DE CENÁRIOS

## Cenários de Evolução

`;

    Object.values(CENARIOS).forEach(cenario => {
      md += `### ${cenario.nome}

> ${cenario.descricao}

| Atributo | Valor |
|----------|-------|
| **Velocidade de Evolução** | ${cenario.velocidade} |
| **Investimento** | ${cenario.investimento} |
| **Adequado Para** | ${cenario.adequadoPara} |
| **Riscos** | ${cenario.riscos} |

`;
    });

    md += `---

# 14. INDICADORES DE SAÚDE

## Saúde da Iniciativa de IA

| Indicador | Score | Status |
|-----------|:-----:|:------:|
`;

    const indicadoresSaude = [
      { nome: 'Saúde Estratégica', areas: [1], thresholds: { critico: 2.0, atencao: 3.0, saudavel: 4.0 } },
      { nome: 'Saúde de Execução', areas: [2, 5], thresholds: { critico: 1.8, atencao: 2.8, saudavel: 3.8 } },
      { nome: 'Saúde de Pessoas', areas: [4], thresholds: { critico: 2.0, atencao: 3.0, saudavel: 4.0 } },
      { nome: 'Saúde de Governança', areas: [3], thresholds: { critico: 1.8, atencao: 2.8, saudavel: 3.8 } },
      { nome: 'Saúde de Valor', areas: [7], thresholds: { critico: 1.8, atencao: 2.8, saudavel: 3.8 } }
    ];

    indicadoresSaude.forEach(ind => {
      const areasRelacionadas = scoresPorArea.filter(a => ind.areas.includes(a.areaId));
      const scoreMedia = areasRelacionadas.length > 0 
        ? areasRelacionadas.reduce((acc, a) => acc + a.score, 0) / areasRelacionadas.length 
        : 0;
      const status = scoreMedia >= ind.thresholds.saudavel ? '🟢 Saudável' 
        : scoreMedia >= ind.thresholds.atencao ? '🟡 Atenção' 
        : '🔴 Crítico';
      md += `| ${ind.nome} | ${scoreMedia.toFixed(2)} | ${status} |\n`;
    });

    md += `
---

# 15. PRÓXIMOS PASSOS IMEDIATOS

## Ações para os Próximos 30 Dias

1. **Semana 1-2:** Apresentar resultados para C-Level
2. **Semana 2-3:** Priorizar quick wins identificados
3. **Semana 3-4:** Iniciar plano de ação para áreas críticas
4. **Contínuo:** Estabelecer cadência de acompanhamento

## Ações para os Próximos 90 Dias

1. Definir/revisar estratégia de IA
2. Estabelecer governança de IA
3. Iniciar programa de capacitação
4. Lançar pilotos prioritários
5. Definir métricas de acompanhamento

---

# 16. CONCLUSÃO

A **${projeto.empresa.nome}** encontra-se no **${levelInfo.name}** de maturidade em IA, com um score geral de **${scoreGeral.toFixed(2)}/5.00**.

${scoreGeral >= 3.5 
  ? `A organização demonstra boa maturidade em IA, com áreas consolidadas e oportunidades de otimização.`
  : scoreGeral >= 2.5 
    ? `A organização está em processo de estruturação de suas iniciativas de IA, com fundamentos estabelecidos e espaço para evolução.`
    : `A organização está em estágio inicial de maturidade em IA, com oportunidades significativas de desenvolvimento.`
}

### Principais Recomendações

1. ${areasParaMelhorar.length > 0 ? `Priorizar as ${areasParaMelhorar.length} áreas identificadas como críticas` : 'Manter evolução contínua em todas as dimensões'}
2. Estabelecer governança de IA robusta
3. Investir em talentos e capacitação
4. Definir métricas claras de ROI
5. Agendar reavaliação em 6-12 meses

---

# 17. DADOS DO PROJETO

## Informações da Empresa

| Campo | Valor |
|-------|-------|
| **Razão Social** | ${projeto.empresa.nome} |
| **CNPJ** | ${projeto.empresa.cnpj || 'Não informado'} |
| **Setor** | ${projeto.empresa.setor || 'Não informado'} |
| **Porte** | ${projeto.empresa.porte || 'Não informado'} |
| **E-mail** | ${projeto.empresa.email || 'Não informado'} |
| **Telefone** | ${projeto.empresa.telefone || 'Não informado'} |

## Informações do Projeto

| Campo | Valor |
|-------|-------|
| **Nome** | ${projeto.nome} |
| **Descrição** | ${projeto.descricao || 'Não informada'} |
| **Vertical** | ${benchmark?.nome || projeto.vertical || 'Não definida'} |
| **Status** | ${projeto.status} |
| **Data de Criação** | ${new Date(projeto.createdAt).toLocaleDateString('pt-BR')} |

`;

    // =============================================
    // PARTE 2: RELATÓRIO COMPLETO DO PROJETO
    // =============================================
    md += `

---

# PARTE II: RELATÓRIO COMPLETO DO PROJETO

---

## 9. Dados Cadastrais da Empresa

| Campo | Valor |
|-------|-------|
| **Razão Social** | ${projeto.empresa.nome} |
| **CNPJ** | ${projeto.empresa.cnpj || 'Não informado'} |
| **Setor de Atuação** | ${projeto.empresa.setor || 'Não informado'} |
| **Porte** | ${projeto.empresa.porte || 'Não informado'} |
| **E-mail Corporativo** | ${projeto.empresa.email || 'Não informado'} |
| **Telefone** | ${projeto.empresa.telefone || 'Não informado'} |
| **Endereço** | ${projeto.empresa.endereco || 'Não informado'} |
| **Website** | ${projeto.empresa.website || 'Não informado'} |

---

## 10. Dados do Projeto

| Campo | Valor |
|-------|-------|
| **Nome do Projeto** | ${projeto.nome} |
| **Descrição** | ${projeto.descricao || 'Não informada'} |
| **Vertical** | ${benchmark?.nome || projeto.vertical || 'Não definida'} |
| **Status** | ${projeto.status} |
| **Data de Criação** | ${new Date(projeto.createdAt).toLocaleDateString('pt-BR')} |
| **Última Atualização** | ${new Date(projeto.updatedAt).toLocaleDateString('pt-BR')} |

`;

    // =============================================
    // PARTE 3: PRODUTOS IA-FIRST
    // =============================================
    if (projeto.produtos && projeto.produtos.length > 0) {
      md += `
---

# PARTE III: PRODUTOS IA-FIRST

---

## 11. Resumo dos Produtos

| # | Produto | Vertical | Status | Fase | Score |
|:-:|---------|----------|--------|------|:-----:|
`;
      projeto.produtos.forEach((p, idx) => {
        md += `| ${idx + 1} | ${p.nome} | ${p.vertical?.nome || '-'} | ${p.status} | ${p.faseAtual || 'ideia'} | ${p.scoreRelevancia?.toFixed(2) || '-'} |\n`;
      });

      // Detalhamento de cada produto
      for (const produto of projeto.produtos) {
        md += `

---

## Produto: ${produto.nome}

### Informações Gerais

| Campo | Valor |
|-------|-------|
| **Nome** | ${produto.nome} |
| **Descrição** | ${produto.descricao || 'Não informada'} |
| **Vertical** | ${produto.vertical?.nome || 'Não definida'} |
| **Status** | ${produto.status} |
| **Fase Atual** | ${produto.faseAtual || 'ideia'} |
| **Complexidade** | ${produto.complexidade || 'media'} |
| **Score de Relevância** | ${produto.scoreRelevancia?.toFixed(2) || 'N/A'} / 5.00 |

### Detalhamento Estratégico

| Campo | Valor |
|-------|-------|
| **Problema que Resolve** | ${produto.problemaResolve || 'Não informado'} |
| **Público-Alvo** | ${produto.publicoAlvo || 'Não informado'} |
| **Diferencial Competitivo** | ${produto.diferencialCompetitivo || 'Não informado'} |
| **Principais Riscos** | ${produto.principaisRiscos || 'Não informados'} |
| **Dependências Externas** | ${produto.dependenciasExternas || 'Não informadas'} |

### Métricas de Sucesso

| Campo | Valor |
|-------|-------|
| **Métrica Principal** | ${produto.metricaPrincipal || 'Não definida'} |
| **Baseline Atual** | ${produto.baselineAtual || 'Não definido'} |
| **Meta Esperada** | ${produto.metaEsperada || 'Não definida'} |

### Informações Financeiras

| Campo | Valor |
|-------|-------|
| **Custo Estimado** | ${produto.custoEstimado ? `R$ ${produto.custoEstimado.toLocaleString('pt-BR')}` : 'Não informado'} |
| **Retorno Anual Esperado** | ${produto.retornoAnualEsperado ? `R$ ${produto.retornoAnualEsperado.toLocaleString('pt-BR')}` : 'Não informado'} |
| **Status de Construção** | ${produto.statusConstrucao || 'planejado'} |

### Cronograma

| Campo | Valor |
|-------|-------|
| **Início da Construção** | ${produto.dataInicioConstrucao ? new Date(produto.dataInicioConstrucao).toLocaleDateString('pt-BR') : 'Não definido'} |
| **Fim Previsto** | ${produto.dataFimConstrucao ? new Date(produto.dataFimConstrucao).toLocaleDateString('pt-BR') : 'Não definido'} |
| **Ativação em Produção** | ${produto.dataAtivacaoProducao ? new Date(produto.dataAtivacaoProducao).toLocaleDateString('pt-BR') : 'Não definido'} |

`;

        // Avaliações do produto
        if (produto.avaliacoes && produto.avaliacoes.length > 0) {
          md += `### Avaliações de Transformação Agêntica\n\n`;
          md += `| Avaliador | Status | Score Obrig. | Score Vert. | Score Total | Data |\n`;
          md += `|-----------|--------|:------------:|:-----------:|:-----------:|------|\n`;
          produto.avaliacoes.forEach(av => {
            md += `| ${av.usuario?.nome || 'N/A'} | ${av.status} | ${av.scoreObrigatorio?.toFixed(2) || '-'} | ${av.scoreVerticais?.toFixed(2) || '-'} | ${av.scoreRelevancia?.toFixed(2) || '-'} | ${new Date(av.createdAt).toLocaleDateString('pt-BR')} |\n`;
          });
          md += '\n';
        }

        // Arquivos de referência
        if (produto.arquivosReferencia && produto.arquivosReferencia.length > 0) {
          md += `### Arquivos de Referência\n\n`;
          md += `| Arquivo | Categoria | Tipo | Tamanho |\n`;
          md += `|---------|-----------|------|--------|\n`;
          produto.arquivosReferencia.forEach(arq => {
            const tamanhoKB = (arq.tamanho / 1024).toFixed(1);
            md += `| ${arq.nomeOriginal} | ${arq.categoria} | ${arq.mimeType} | ${tamanhoKB} KB |\n`;
          });
          md += '\n';
        }

        // Especificação técnica
        if (produto.especificacoes && produto.especificacoes.length > 0) {
          const especificacao = produto.especificacoes[0];
          md += `### Especificação Técnica (v${especificacao.versao})\n\n`;
          md += `| Campo | Valor |\n`;
          md += `|-------|-------|\n`;
          md += `| **Versão** | ${especificacao.versao} |\n`;
          md += `| **Status** | ${especificacao.status} |\n`;
          md += `| **Data de Geração** | ${new Date(especificacao.createdAt).toLocaleDateString('pt-BR')} |\n`;
          md += `| **Gerado por** | ${especificacao.geradoPor?.nome || 'N/A'} |\n`;
          if (especificacao.horasEstimadas) md += `| **Horas Estimadas** | ${especificacao.horasEstimadas}h |\n`;
          if (especificacao.custoDesenvolvimento) md += `| **Custo de Desenvolvimento** | R$ ${especificacao.custoDesenvolvimento.toLocaleString('pt-BR')} |\n`;
          if (especificacao.prazoSemanas) md += `| **Prazo Estimado** | ${especificacao.prazoSemanas} semanas |\n`;
          if (especificacao.tamanhoEquipe) md += `| **Tamanho da Equipe** | ${especificacao.tamanhoEquipe} pessoas |\n`;
          md += '\n';

          // Documentos da especificação
          if (especificacao.documentos && especificacao.documentos.length > 0) {
            md += `#### Documentos da Especificação\n\n`;
            especificacao.documentos.forEach(doc => {
              md += `##### ${doc.titulo}\n\n`;
              md += doc.conteudo;
              md += '\n\n';
            });
          }
        }
      }
    }

    // =============================================
    // REFERÊNCIAS E RODAPÉ
    // =============================================
    md += `
---

# REFERÊNCIAS E METODOLOGIA

## Modelo MIT CISR de Maturidade em IA

O **MIT CISR Enterprise AI Maturity Model** (Weill, Woerner & Sebastian, 2024) é baseado em pesquisa com **721 empresas** e identifica 5 níveis de maturidade em IA empresarial.

### Principais Descobertas do MIT CISR

| Nível | % Empresas | Crescimento | Lucro |
|-------|:----------:|:-----------:|:-----:|
| 1 - Inicial | ~25% | -15% a -10% | Abaixo da média |
| 2 - Oportunista | ~30% | -10% a -5% | Ligeiramente abaixo |
| 3 - Estruturado | ~25% | 0% a +5% | Na média |
| 4 - Gerenciado | ~15% | +5% a +15% | Acima da média |
| 5 - Otimizado | ~5% | +15% ou mais | Significativamente acima |

*Fonte: MIT CISR 2022 Future Ready Survey*

### Referência Bibliográfica

> Weill, P., Woerner, S. L., & Sebastian, I. M. (2024). Enterprise AI Maturity Model. 
> MIT Center for Information Systems Research. 
> https://cisr.mit.edu/publication/2024_1201_EnterpriseAIMaturityModel_WeillWoernerSebastian

## Blueprint Agêntico

O **Blueprint Agêntico** é uma metodologia proprietária da **SysMap Solutions** que combina:

1. **12 dimensões** de avaliação de maturidade em IA
2. **Transformação Agêntica** para produtos IA-First
3. **Especificação Automática** com IA Generativa (Claude/Anthropic)
4. **Benchmarking setorial** para posicionamento competitivo
5. **Projeção financeira** baseada em dados de mercado
6. **Roadmap de evolução** com cenários e dependências

## Fontes de Benchmarking por Vertical

| Vertical | Fonte |
|----------|-------|
| FinTech | MIT CISR Financial Services AI Study 2024 |
| Saúde | HIMSS Analytics Healthcare AI Adoption Report 2024 |
| Tecnologia | Gartner Tech Industry AI Maturity Index 2024 |
| E-Commerce | Forrester Retail AI Readiness Survey 2024 |
| Manufatura | McKinsey Industry 4.0 AI Adoption Study 2024 |
| LegalTech | Thomson Reuters Legal AI Adoption Report 2024 |
| EdTech | HolonIQ EdTech AI Index 2024 |
| AI First | AI Engineering Maturity Benchmark 2024 |
| AgTech | AgFunder AgTech AI Adoption Report 2024 |

---

# SOBRE A SYSMAP

A **SysMap Solutions** é uma consultoria de tecnologia especializada em transformação digital e inteligência artificial.

- **Website:** www.sysmap.com.br
- **E-mail:** contato@sysmap.com.br

---

<div align="center">

**Documento gerado automaticamente pelo Blueprint Agêntico**

**${dataGeracao}**

© ${new Date().getFullYear()} SysMap Solutions - Todos os direitos reservados

*Este documento contém informações confidenciais e proprietárias.*

</div>
`;

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="blueprint-completo-${projeto.nome.replace(/\s+/g, '-')}.md"`);
    res.send(md);
  } catch (error) {
    console.error('Erro ao exportar dashboard:', error);
    res.status(500).json({ error: 'Erro ao exportar dashboard', details: error.message });
  }
});

// ============================================================================
// RELATÓRIO EXECUTIVO (Versão resumida para C-Level)
// ============================================================================

router.get('/executive/:projetoId', async (req, res) => {
  try {
    const { projetoId } = req.params;
    
    const projeto = await prisma.projeto.findUnique({
      where: { id: parseInt(projetoId) },
      include: {
        empresa: true,
        avaliacoes: {
          include: {
            respostas: { include: { pergunta: { include: { area: true } } } },
            avaliador: { select: { nome: true, email: true, cargo: true } }
          }
        }
      }
    });

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const dataGeracao = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    });

    // Calcular scores (exclui áreas que o avaliador marcou como não aptas)
    const todasRespostas = projeto.avaliacoes.flatMap(a =>
      respostasParaCalculo(a).filter(r => r.pontuacao != null)
    );
    const scoreGeral = todasRespostas.length > 0
      ? todasRespostas.reduce((sum, r) => sum + r.pontuacao, 0) / todasRespostas.length
      : 0;

    const nivel = scoreGeral < 1.5 ? 1 : scoreGeral < 2.5 ? 2 : scoreGeral < 3.5 ? 3 : scoreGeral < 4.5 ? 4 : 5;
    const nomeNivel = ['Inicial', 'Oportunista', 'Sistemático', 'Diferenciado', 'Transformador'][nivel - 1];

    // Scores por área
    const scoresPorArea = {};
    todasRespostas.forEach(r => {
      const area = r.pergunta?.area?.nome || 'Outros';
      if (!scoresPorArea[area]) scoresPorArea[area] = { total: 0, count: 0 };
      scoresPorArea[area].total += r.pontuacao;
      scoresPorArea[area].count++;
    });

    const areasOrdenadas = Object.entries(scoresPorArea)
      .map(([area, { total, count }]) => ({ area, score: total / count }))
      .sort((a, b) => a.score - b.score);

    const top5Gaps = areasOrdenadas.filter(a => a.score < 3.5).slice(0, 5);

    // Projeções financeiras baseadas no nível
    const projecoes = {
      1: { roi: '15-35%', payback: '24+ meses', economia: '5-15%' },
      2: { roi: '35-70%', payback: '18-24 meses', economia: '15-25%' },
      3: { roi: '70-120%', payback: '12-18 meses', economia: '25-40%' },
      4: { roi: '120-200%', payback: '6-12 meses', economia: '40-55%' },
      5: { roi: '200%+', payback: '3-6 meses', economia: '55%+' }
    };
    const projecao = projecoes[nivel];
    const pctRefMd = percentualReferenciaRoi(projeto.faturamentoAnualProjeto);
    const fatLinha =
      projeto.faturamentoAnualProjeto != null && Number(projeto.faturamentoAnualProjeto) > 0
        ? `R$ ${Number(projeto.faturamentoAnualProjeto).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
        : 'Não informado';

    const md = `# RELATÓRIO EXECUTIVO
## Maturidade em Inteligência Artificial

---

**Empresa:** ${projeto.empresa.nome}  
**Projeto:** ${projeto.nome}  
**Data:** ${dataGeracao}

---

# 📊 RESUMO EXECUTIVO

## Score Geral: **${scoreGeral.toFixed(1)}** — ${nomeNivel} (Nível ${nivel})

A avaliação identificou que a empresa encontra-se no **Nível ${nivel} (${nomeNivel})** de maturidade em IA.
Este relatório apresenta os principais achados e recomendações estratégicas para a liderança.

### Indicadores-Chave

| Métrica | Valor |
|---------|-------|
| **Score Geral** | ${scoreGeral.toFixed(1)} / 5.0 |
| **Nível de Maturidade** | ${nomeNivel} |
| **Total de Avaliadores** | ${projeto.avaliacoes.length} |
| **Faturamento anual (projeto)** | ${fatLinha} |
| **% referência ROI** | ${pctRefMd != null ? `${pctRefMd}% (calibra projeções)` : '—'} |
| **ROI Típico do Nível** | ${projecao.roi} |
| **Payback Esperado** | ${projecao.payback} |

---

# 🎯 TOP 5 GAPS PRIORITÁRIOS

As áreas abaixo apresentam os maiores gaps e devem ser priorizadas:

${top5Gaps.length > 0 ? top5Gaps.map((gap, i) => {
  const prioridade = gap.score < 2 ? '🔴 Crítica' : gap.score < 2.5 ? '🟠 Alta' : '🟡 Média';
  return `### ${i + 1}. ${gap.area}
- **Score:** ${gap.score.toFixed(1)} / 5.0
- **Gap:** -${(3.5 - gap.score).toFixed(1)} pontos
- **Prioridade:** ${prioridade}
`;
}).join('\n') : '✅ Todas as áreas estão acima do nível ideal (3.5). Foco em otimização contínua.\n'}

---

# 📈 PROJEÇÃO DE IMPACTO FINANCEIRO

## Cenários de Retorno

| Cenário | ROI Esperado | Payback | Economia Anual |
|---------|--------------|---------|----------------|
| 🐢 **Conservador** | ${parseInt(projecao.roi) * 0.6 || '10-25'}% | +6 meses | ${parseInt(projecao.economia) * 0.6 || '5-10'}% |
| ⚖️ **Base (Recomendado)** | ${projecao.roi} | ${projecao.payback} | ${projecao.economia} |
| 🚀 **Agressivo** | ${parseInt(projecao.roi) * 1.3 || '25-50'}%+ | -6 meses | ${parseInt(projecao.economia) * 1.3 || '10-20'}%+ |

### Metodologia

Projeções baseadas em:
- **MIT CISR** Enterprise AI Maturity Model (Weill, Woerner & Sebastian, 2024)
- **McKinsey** "The State of AI in 2024"
- **Gartner** AI Maturity Model

> ⚠️ **Nota:** Valores são referenciais de mercado, não promessas contratuais. Resultados podem variar conforme execução e condições de mercado.

---

# 📅 PLANO DE AÇÃO — 90 DIAS

## Semana 1-4: Quick Wins
- [ ] Validar estratégia de IA com liderança
- [ ] Identificar patrocinador executivo (C-level)
- [ ] Mapear dados e sistemas críticos

## Semana 5-8: Fundação
- [ ] Formar comitê de governança de IA
- [ ] Priorizar 3-5 casos de uso com ROI mensurável
- [ ] Definir políticas de uso e privacidade

## Semana 9-10: Pilotos
- [ ] Iniciar POCs nas áreas priorizadas
- [ ] Capacitar equipe-chave
- [ ] Estabelecer baseline de métricas

## Semana 11-12: Validação
- [ ] Avaliar resultados dos pilotos
- [ ] Ajustar roadmap baseado em aprendizados
- [ ] Planejar próxima fase de escala

---

# ✅ PRÓXIMOS PASSOS PARA LIDERANÇA

| Ação | Descrição | Responsável Sugerido |
|------|-----------|---------------------|
| **1. Aprovar Roadmap** | Validar plano de 90 dias e alocar recursos | CEO / Comitê Executivo |
| **2. Nomear Sponsor** | Definir executivo C-level como sponsor de IA | CEO |
| **3. Definir Budget** | Aprovar investimento para Fase 1 | CFO |
| **4. Formar Comitê** | Criar comitê de governança multidisciplinar | Sponsor de IA |
| **5. Comunicar Estratégia** | Compartilhar visão de IA com a organização | CEO / RH |

---

<div align="center">

**Blueprint Agêntico — Relatório Executivo**

**${dataGeracao}**

© ${new Date().getFullYear()} SysMap Solutions

*Este documento é confidencial e destinado exclusivamente à liderança.*

</div>
`;

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-executivo-${projeto.nome.replace(/\s+/g, '-')}.md"`);
    res.send(md);
  } catch (error) {
    console.error('Erro ao exportar relatório executivo:', error);
    res.status(500).json({ error: 'Erro ao exportar relatório executivo', details: error.message });
  }
});

// ---------------------------------------------------------------------------
// Desejos IA (roadmap) — Word; não altera score de maturidade
// ---------------------------------------------------------------------------

function podeExportarDesejosAvaliacao(req, avaliacao) {
  if (!req.usuario) return false;
  const role = String(req.usuario.role || '').trim().toLowerCase();
  if (role === 'admin') return true;
  if (Number(req.usuario.id) === Number(avaliacao.usuarioId)) return true;
  if (req.usuario.empresaId == null) return false;
  return Number(req.usuario.empresaId) === Number(avaliacao.projeto.empresaId);
}

function podeExportarDesejosProjeto(req, empresaIdProjeto) {
  if (!req.usuario) return false;
  const role = String(req.usuario.role || '').trim().toLowerCase();
  if (role === 'admin') return true;
  if (req.usuario.empresaId == null) return false;
  return Number(req.usuario.empresaId) === Number(empresaIdProjeto);
}

async function montarDocxDesejosIaBuffer({ projeto, avaliacoes }) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
  const FONT = 'Arial';
  const children = [];

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Desejos IA — visão de futuro (apoio ao roadmap)',
          bold: true,
          size: 36,
          font: FONT
        })
      ],
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 }
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Projeto: ${projeto.nome || '—'}`, font: FONT, size: 24 })],
      spacing: { after: 80 }
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Empresa: ${projeto.empresa?.nome || '—'}`, font: FONT, size: 24 })],
      spacing: { after: 120 }
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Este documento consolida apenas o bloco opcional “Desejos IA”. Não substitui o relatório de maturidade nem altera pontuações.',
          italics: true,
          size: 20,
          font: FONT,
          color: '555555'
        })
      ],
      spacing: { after: 240 }
    })
  );

  let algumBloco = false;
  for (const av of avaliacoes) {
    const payload = av.desejosIADados?.payload ?? null;
    if (!desejosIaTemRespostasGuardadas(payload)) continue;
    algumBloco = true;
    const linhas = desejosIaParaRespostasEmail(payload);
    if (linhas.length === 0) continue;

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Avaliador: ${av.usuario?.nome || '—'}  ·  ${av.usuario?.email || ''}`,
            bold: true,
            size: 26,
            font: FONT
          })
        ],
        spacing: { before: 360, after: 120 }
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Avaliação #${av.id}  ·  Status: ${av.status || '—'}`,
            size: 20,
            font: FONT,
            italics: true,
            color: '666666'
          })
        ],
        spacing: { after: 200 }
      })
    );

    for (const row of linhas) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: row.pergunta, bold: true, size: 22, font: FONT })],
          spacing: { before: 160, after: 100 }
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: row.textoResposta || '—', size: 22, font: FONT })],
          spacing: { after: 80 }
        })
      );
      if (row.observacoes) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Comentários: ', italics: true, size: 20, font: FONT }),
              new TextRun({ text: row.observacoes, size: 22, font: FONT })
            ],
            spacing: { after: 160 }
          })
        );
      }
    }
  }

  if (!algumBloco) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Nenhuma resposta do bloco Desejos IA encontrada para exportação.',
            italics: true,
            size: 22,
            font: FONT
          })
        ]
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Documento gerado em ${new Date().toLocaleString('pt-BR')} — Blueprint IA · SysMap Solutions`,
          size: 18,
          font: FONT,
          italics: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 480 }
    })
  );

  const doc = new Document({
    sections: [{ properties: {}, children }]
  });
  return Packer.toBuffer(doc);
}

/**
 * GET /api/exportar/avaliacao/:avaliacaoId/desejos-ia-docx
 * Word com o bloco Desejos IA de uma avaliação (individual).
 */
router.get('/avaliacao/:avaliacaoId/desejos-ia-docx', async (req, res) => {
  try {
    const avaliacaoId = parseInt(req.params.avaliacaoId, 10);
    if (Number.isNaN(avaliacaoId) || avaliacaoId <= 0) {
      return res.status(400).json({ error: 'ID de avaliação inválido' });
    }

    let avaliacao;
    try {
      avaliacao = await prisma.avaliacao.findUnique({
        where: { id: avaliacaoId },
        include: {
          usuario: true,
          desejosIADados: true,
          projeto: { include: { empresa: true } }
        }
      });
    } catch (e) {
      if (!isMissingAvaliacaoDesejosIaTableError(e)) throw e;
      avaliacao = await prisma.avaliacao.findUnique({
        where: { id: avaliacaoId },
        include: {
          usuario: true,
          projeto: { include: { empresa: true } }
        }
      });
    }

    if (!avaliacao) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }
    if (!podeExportarDesejosAvaliacao(req, avaliacao)) {
      return res.status(403).json({ error: 'Sem permissão para exportar esta avaliação.' });
    }
    const desejosPayload = avaliacao.desejosIADados?.payload ?? null;
    if (!desejosIaTemRespostasGuardadas(desejosPayload)) {
      return res.status(400).json({ error: 'Esta avaliação não possui respostas do bloco Desejos IA para exportar.' });
    }

    const buffer = await montarDocxDesejosIaBuffer({
      projeto: avaliacao.projeto,
      avaliacoes: [avaliacao]
    });

    const nomeArquivo = `desejos-ia-avaliacao-${avaliacaoId}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Erro export Desejos IA (avaliacao):', error);
    res.status(500).json({ error: 'Erro ao gerar documento', details: error.message });
  }
});

/**
 * GET /api/exportar/projeto/:projetoId/desejos-ia-docx
 * Word consolidando Desejos IA de todas as avaliações do projeto que tenham respostas.
 */
router.get('/projeto/:projetoId/desejos-ia-docx', async (req, res) => {
  try {
    const projetoId = parseInt(req.params.projetoId, 10);
    if (Number.isNaN(projetoId) || projetoId <= 0) {
      return res.status(400).json({ error: 'ID de projeto inválido' });
    }

    let projeto;
    try {
      projeto = await prisma.projeto.findUnique({
        where: { id: projetoId },
        include: {
          empresa: true,
          avaliacoes: {
            include: { usuario: true, desejosIADados: true },
            orderBy: { id: 'asc' }
          }
        }
      });
    } catch (e) {
      if (!isMissingAvaliacaoDesejosIaTableError(e)) throw e;
      projeto = await prisma.projeto.findUnique({
        where: { id: projetoId },
        include: {
          empresa: true,
          avaliacoes: {
            include: { usuario: true },
            orderBy: { id: 'asc' }
          }
        }
      });
    }

    if (!projeto) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    if (!podeExportarDesejosProjeto(req, projeto.empresaId)) {
      return res.status(403).json({ error: 'Sem permissão para exportar este projeto.' });
    }

    const comDesejos = projeto.avaliacoes.filter((a) =>
      desejosIaTemRespostasGuardadas(a.desejosIADados?.payload ?? null)
    );
    if (comDesejos.length === 0) {
      return res.status(400).json({
        error: 'Nenhuma avaliação deste projeto possui respostas do bloco Desejos IA para exportar.'
      });
    }

    const buffer = await montarDocxDesejosIaBuffer({ projeto, avaliacoes: comDesejos });
    const slug = (projeto.nome || 'projeto').replace(/\s+/g, '-').replace(/[^\w\-]/gi, '').slice(0, 60);
    const nomeArquivo = `desejos-ia-projeto-${slug}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Erro export Desejos IA (projeto):', error);
    res.status(500).json({ error: 'Erro ao gerar documento', details: error.message });
  }
});

export default router;

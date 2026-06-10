import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Lightbulb,
  Loader2,
  CheckCircle2,
  Circle,
  FileText,
  Layers
} from 'lucide-react';
import { produtosApi } from '../services/api';
import { DEFAULT_IDEALIZACAO_PRODUTO, normalizarIdealizacaoProduto } from '../constants/idealizacaoProduto';

const CAMPOS = [
  {
    key: 'problemaContexto',
    titulo: 'Problema e contexto',
    hint: 'Qual dor ou oportunidade justifica este produto? Quem sofre hoje?'
  },
  {
    key: 'metricaSucesso',
    titulo: 'Métrica de sucesso',
    hint: 'Como saberemos que vale a pena? (indicador e meta qualitativa ou quantitativa)'
  },
  {
    key: 'restricoesPremissas',
    titulo: 'Restrições e premissas',
    hint: 'Prazo, compliance, legado, orçamento, integrações obrigatórias.'
  },
  {
    key: 'mapaJornada',
    titulo: 'Mapa ou jornada',
    hint: 'Fluxo atual vs desejado; principais atores e etapas.'
  },
  {
    key: 'comoPoderiamos',
    titulo: 'Como poderíamos…',
    hint: 'Perguntas HMW / ideação convergente.'
  },
  {
    key: 'ideiasPriorizadas',
    titulo: 'Ideias priorizadas',
    hint: 'O que ficou no escopo do sprint curto; o que ficou fora.'
  },
  {
    key: 'solucaoEscolhida',
    titulo: 'Solução escolhida',
    hint: 'Narrativa da solução acordada pelo time (misto).'
  },
  {
    key: 'prototipoLinks',
    titulo: 'Protótipo e links',
    hint: 'Figma, Miro, vídeo, repositório — um por linha ou bullets.'
  },
  {
    key: 'hipoteseExperimento',
    titulo: 'Hipótese do experimento',
    hint: 'Se fizermos X, esperamos Y porque…'
  },
  {
    key: 'planoValidacao',
    titulo: 'Plano de validação',
    hint: 'Com quem testar, como, critérios de sucesso/falha.'
  },
  {
    key: 'decisoesRegistradas',
    titulo: 'Decisões registradas',
    hint: 'Decision log: o que foi decidido e não deve ser reaberto sem novo ciclo.'
  },
  {
    key: 'observacoesGerais',
    titulo: 'Observações gerais',
    hint: 'Riscos abertos, dependências, próximos passos até a especificação.'
  }
];

export default function IdealizacaoProduto() {
  const { id: produtoId } = useParams();
  const [produto, setProduto] = useState(null);
  const [form, setForm] = useState(() => ({ ...DEFAULT_IDEALIZACAO_PRODUTO }));
  const [loading, setLoading] = useState(true);
  /** null | 'texto' | 'anexos' — bloqueia os dois botões durante a geração */
  const [operacaoIA, setOperacaoIA] = useState(null);
  const [passoGeracao, setPassoGeracao] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const data = await produtosApi.buscar(produtoId);
        if (cancelado) return;
        setProduto(data);
        setForm(normalizarIdealizacaoProduto(data.idealizacaoProduto));
      } catch (e) {
        if (!cancelado) setErro(e.message || 'Erro ao carregar produto');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [produtoId]);

  function atualizarCampo(key, valor) {
    setForm((prev) => ({ ...prev, [key]: valor }));
  }

  async function gerarSomenteApoioTextualIA() {
    setOperacaoIA('texto');
    setMensagem('');
    setErro('');
    setPassoGeracao('Salvando idealização no servidor…');
    try {
      await produtosApi.atualizar(produtoId, { idealizacaoProduto: form });
      setPassoGeracao('Gerando apoio textual com IA (requisitos, fluxos, integrações, campos do produto)…');
      const result = await produtosApi.gerarApoioEspecificacaoIA(produtoId, { modo: 'texto' });
      setProduto(result.produto);
      setForm(normalizarIdealizacaoProduto(result.produto.idealizacaoProduto));
      setMensagem(
        'Apoio textual gerado e salvo. Revise os campos na Fase B — Especificação antes de gerar documentos.'
      );
      setTimeout(() => setMensagem(''), 7000);
    } catch (e) {
      setErro(e.message || 'Erro ao gerar apoio textual');
    } finally {
      setPassoGeracao('');
      setOperacaoIA(null);
    }
  }

  async function gerarDiagramasEAnexosIA() {
    setOperacaoIA('anexos');
    setMensagem('');
    setErro('');
    setPassoGeracao('Salvando idealização no servidor…');
    try {
      await produtosApi.atualizar(produtoId, { idealizacaoProduto: form });

      setPassoGeracao('Gerando diagramas Mermaid com IA e gravando referências…');
      const rDiagramas = await produtosApi.gerarApoioEspecificacaoIA(produtoId, {
        modo: 'anexos_diagramas'
      });

      setPassoGeracao(
        'Gerando artefatos Design Thinking (mapa de empatia, personas, jornada, service blueprint)…'
      );
      const rArtefatos = await produtosApi.gerarApoioEspecificacaoIA(produtoId, {
        modo: 'anexos_artefatos'
      });

      setProduto(rArtefatos.produto);
      setForm(normalizarIdealizacaoProduto(rArtefatos.produto.idealizacaoProduto));

      const nDiag = rDiagramas.diagramas?.arquivos?.length ?? 0;
      const nDt = rArtefatos.artefatosDesignThinking?.arquivos?.length ?? 0;
      let texto = 'Diagramas e anexos gerados com IA.';
      if (nDiag > 0) {
        texto += ` ${nDiag} arquivo(s) com diagramas Mermaid.`;
      }
      if (nDt > 0) {
        texto += ` ${nDt} arquivo(s) de artefatos DT.`;
      }
      if (rDiagramas.diagramasErro) {
        texto += ` Aviso — diagramas: ${rDiagramas.diagramasErro}`;
      }
      if (rArtefatos.artefatosDesignThinkingErro) {
        texto += ` Aviso — artefatos: ${rArtefatos.artefatosDesignThinkingErro}`;
      }
      setMensagem(texto);
      setTimeout(
        () => setMensagem(''),
        nDiag > 0 || nDt > 0 || rDiagramas.diagramasErro || rArtefatos.artefatosDesignThinkingErro
          ? 11000
          : 7000
      );
    } catch (e) {
      setErro(e.message || 'Erro ao gerar diagramas ou anexos');
    } finally {
      setPassoGeracao('');
      setOperacaoIA(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">{erro || 'Produto não encontrado.'}</p>
        <Link to="/produtos" className="text-primary-600 hover:underline mt-2 inline-block">
          Voltar aos produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            to={`/produtos/${produtoId}`}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <Lightbulb className="w-6 h-6 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                  Fase A — Idealização do produto
                </p>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {produto.nome}
                </h1>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl">
              Registre o sprint de convergência (formato compacto, time misto, digital). Esta etapa{' '}
              <strong className="font-medium text-gray-800 dark:text-gray-200">cria e consolida o produto</strong>{' '}
              antes da fase de especificação técnica.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 p-0.5 bg-gray-50 dark:bg-gray-800/80">
            <button
              type="button"
              onClick={() => atualizarCampo('statusIdealizacao', 'em_andamento')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                form.statusIdealizacao === 'em_andamento'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Circle className="w-3.5 h-3.5" />
              Em andamento
            </button>
            <button
              type="button"
              onClick={() => atualizarCampo('statusIdealizacao', 'concluida')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                form.statusIdealizacao === 'concluida'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Idealização concluída
            </button>
          </div>
          <div className="flex flex-col gap-2 w-full sm:min-w-[280px]">
            <button
              type="button"
              onClick={gerarSomenteApoioTextualIA}
              disabled={operacaoIA !== null}
              title="Grava a idealização e preenche informacoesAdicionaisEspecificacao e campos opcionais do produto."
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg disabled:opacity-50 shadow-md text-sm"
            >
              {operacaoIA === 'texto' ? (
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              ) : (
                <FileText className="w-5 h-5 shrink-0" />
              )}
              Gerar apoio textual (IA)
            </button>
            <button
              type="button"
              onClick={gerarDiagramasEAnexosIA}
              disabled={operacaoIA !== null}
              title="Grava a idealização, gera diagramas Mermaid e os quatro artefatos DT nos arquivos de referência."
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg disabled:opacity-50 shadow-md text-sm"
            >
              {operacaoIA === 'anexos' ? (
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              ) : (
                <Layers className="w-5 h-5 shrink-0" />
              )}
              Gerar diagramas e anexos (IA)
            </button>
          </div>
          {passoGeracao ? (
            <div className="flex items-start gap-2 text-sm text-violet-900 dark:text-violet-100 mt-1 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 max-w-md text-left">
              <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
              <span>{passoGeracao}</span>
            </div>
          ) : null}
          <div className="flex flex-col gap-1 items-stretch sm:items-end text-sm">
            <Link
              to={`/produtos/${produtoId}/editar`}
              className="text-center sm:text-right text-gray-600 dark:text-gray-400 hover:underline"
            >
              Arquivos de referência do produto
            </Link>
            <Link
              to={`/produtos/${produtoId}/especificacao`}
              className="text-center sm:text-right text-violet-700 dark:text-violet-300 hover:underline"
            >
              Abrir Fase B — Especificação
            </Link>
          </div>
          {mensagem && (
            <p className="text-sm text-green-600 dark:text-green-400 text-right">{mensagem}</p>
          )}
          {erro && <p className="text-sm text-red-600 dark:text-red-400 text-right">{erro}</p>}
        </div>
      </div>

      <div className="card border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20">
        <p className="text-sm text-amber-900 dark:text-amber-200/90">
          A <strong className="font-semibold">Fase B — Especificação</strong> continua disponível no mesmo produto quando
          o time estiver pronto para documentação técnica. Use{' '}
          <strong className="font-semibold">Gerar apoio textual</strong> para preencher campos de apoio à especificação;
          use <strong className="font-semibold">Gerar diagramas e anexos</strong> para criar diagramas Mermaid e os
          artefatos <strong className="font-semibold">mapa de empatia</strong>, <strong className="font-semibold">personas</strong>,{' '}
          <strong className="font-semibold">jornada do cliente</strong> e <strong className="font-semibold">service blueprint</strong>{' '}
          em <strong className="font-semibold">Arquivos de referência</strong>.
        </p>
      </div>

      <div className="space-y-6">
        {CAMPOS.map(({ key, titulo, hint }) => (
          <div key={key} className="card">
            <label className="block">
              <span className="font-semibold text-gray-900 dark:text-white">{titulo}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">{hint}</span>
              <textarea
                value={form[key] ?? ''}
                onChange={(e) => atualizarCampo(key, e.target.value)}
                rows={key === 'observacoesGerais' ? 5 : 4}
                className="input w-full font-sans text-sm min-h-[96px]"
                placeholder="…"
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

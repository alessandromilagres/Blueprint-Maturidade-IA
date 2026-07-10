import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Link2,
  Plus,
  Save,
  Trash2,
  Upload,
  FileText,
  Image,
  Eye,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import { projetosApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { resolveMimeTypeForProdutoUpload } from '../utils/mimeUpload';

const TIPOS_ACEITOS = new Set([
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp'
]);

function isImagemMime(mimeType) {
  return String(mimeType || '').startsWith('image/');
}

const CAMPOS_NEGOCIO = ['contextoNegocio', 'publicoAlvoRelatorio', 'iniciativasEmAndamento'];
const CAMPOS_TECNOLOGIA = ['stackTecnologica', 'sistemasCore', 'cloudProvedor'];
const CAMPOS_REGULATORIO = ['reguladores', 'restricoes'];
const CAMPOS_GLOSSARIO = ['glossarioFatosCanonicos', 'termosProibidos'];

const PLACEHOLDERS_PADRAO = {
  contextoNegocio: 'Ex.: Varejo omnichannel, 200 lojas, foco em eficiência de supply chain…',
  stackTecnologica: 'Ex.: Python, Databricks, Azure OpenAI, LangChain…',
  sistemasCore: 'Ex.: SAP S/4, Salesforce, lakehouse Snowflake, APIs Mulesoft…',
  cloudProvedor: 'Ex.: Azure (principal), Kubernetes AKS, VPN site-to-site…',
  reguladores: 'Ex.: LGPD, Bacen (Open Finance), política interna de IA…',
  iniciativasEmAndamento: 'Ex.: Piloto de copilot no jurídico, chatbot SAC fase 2…',
  restricoes: 'Ex.: Budget 2025 fechado, ERP legado sem API, dados sensíveis on-prem…',
  publicoAlvoRelatorio: 'Ex.: CEO, CFO e diretoria de operações — tom executivo, pouco técnico.',
  glossarioFatosCanonicos:
    'Ex.:\n- Piloto Faturamento: nome canônico, escopo, status atual\n- Cursor Enterprise: APROVADA (data)\n- Usar "Faturamento", não siglas obsoletas de billing',
  termosProibidos:
    'Ex. (um por linha):\nNome obsoleto piloto A\nNome obsoleto piloto B\nSigla billing antiga'
};

function CampoTexto({ campo, labels, dicas, valor, editable, onChange, rows: rowsProp }) {
  const label = labels[campo] || campo;
  const dica = dicas[campo];
  const placeholder = PLACEHOLDERS_PADRAO[campo] || '';
  const rows =
    rowsProp ??
    (campo === 'contextoNegocio' || campo === 'glossarioFatosCanonicos'
      ? 6
      : campo === 'termosProibidos'
        ? 5
        : 2);
  return (
    <label className="block">
      <span className="mb-0.5 block text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
      {dica && (
        <span className="mb-1.5 block text-xs leading-snug text-gray-500 dark:text-gray-400">{dica}</span>
      )}
      <textarea
        rows={rows}
        value={valor || ''}
        onChange={(ev) => onChange(campo, ev.target.value)}
        disabled={!editable}
        className="input w-full resize-y text-sm"
        placeholder={editable ? placeholder : ''}
      />
    </label>
  );
}

function GrupoCampos({ titulo, campos, labels, dicas, caracteristicas, editable, onChange }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
        {titulo}
      </h4>
      <div className="grid gap-4 md:grid-cols-2">
        {campos.map((key) => (
          <CampoTexto
            key={key}
            campo={key}
            labels={labels}
            dicas={dicas}
            valor={caracteristicas[key]}
            editable={editable}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = String(dataUrl).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProjetoContextoConfig({ projetoId, editable = false }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [labels, setLabels] = useState({});
  const [dicas, setDicas] = useState({});
  const [caracteristicas, setCaracteristicas] = useState({});
  const [urls, setUrls] = useState([]);
  const [arquivos, setArquivos] = useState([]);
  const [limites, setLimites] = useState({ maxFileSizeMb: 10 });
  const [configurado, setConfigurado] = useState(false);
  const [previewImagemUrl, setPreviewImagemUrl] = useState(null);
  const [previewImagemNome, setPreviewImagemNome] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingImageQueue, setPendingImageQueue] = useState([]);
  const [imageBatchTotal, setImageBatchTotal] = useState(0);
  const [uploadDescricao, setUploadDescricao] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    projetosApi
      .contexto(projetoId)
      .then((data) => {
        if (cancelled) return;
        setLabels(data?.labels || {});
        setDicas(data?.dicas || {});
        setCaracteristicas(data?.caracteristicas || {});
        setUrls((data?.urls || []).map((u) => ({ ...u })));
        setArquivos(data?.arquivos || []);
        setLimites(data?.limites || { maxFileSizeMb: 10 });
        setConfigurado(Boolean(data?.configurado));
        setDirty(false);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err.message || 'Não foi possível carregar o contexto do projeto.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projetoId]);

  function setCampo(key, valor) {
    setDirty(true);
    setCaracteristicas((prev) => ({ ...prev, [key]: valor }));
  }

  function addUrl() {
    setDirty(true);
    setUrls((prev) => [...prev, { url: '', titulo: '', notas: '' }]);
  }

  function updateUrl(idx, field, valor) {
    setDirty(true);
    setUrls((prev) => prev.map((u, i) => (i === idx ? { ...u, [field]: valor } : u)));
  }

  function removeUrl(idx) {
    setDirty(true);
    setUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  async function salvar() {
    setSaving(true);
    try {
      const data = await projetosApi.salvarContexto(projetoId, {
        caracteristicas,
        urls: urls.filter((u) => u.url?.trim())
      });
      setCaracteristicas(data.caracteristicas || {});
      setUrls(data.urls || []);
      setArquivos(data.arquivos || []);
      setConfigurado(Boolean(data.configurado));
      setDirty(false);
      toast.success('Contexto do projeto salvo.');
    } catch (e) {
      toast.error(e.message || 'Erro ao salvar contexto.');
    } finally {
      setSaving(false);
    }
  }

  function validarArquivoUpload(file) {
    const maxBytes = (limites.maxFileSizeMb || 10) * 1024 * 1024;
    if (file.size > maxBytes) {
      return `Arquivo muito grande (máximo ${limites.maxFileSizeMb || 10}MB): ${file.name}`;
    }
    const mimeType = resolveMimeTypeForProdutoUpload(file);
    if (!TIPOS_ACEITOS.has(mimeType)) {
      return `Tipo não permitido: ${file.name}`;
    }
    return null;
  }

  async function enviarArquivoApi(file, mimeType, descricao) {
    const base64 = await fileToBase64(file);
    const data = await projetosApi.uploadContexto(projetoId, {
      arquivo: base64,
      nomeOriginal: file.name,
      mimeType,
      descricao: descricao || ''
    });
    const ctx = data.contexto || data;
    setArquivos(ctx.arquivos || []);
    setConfigurado(Boolean(ctx.configurado));
    return ctx;
  }

  async function enviarArquivo(file, mimeType, descricao, { silencioso = false } = {}) {
    if (!silencioso) setUploading(true);
    try {
      await enviarArquivoApi(file, mimeType, descricao);
      if (!silencioso) {
        const msg = isImagemMime(mimeType)
          ? 'Imagem anexada — a descrição será usada no book.'
          : 'Documento enviado e texto extraído para o book.';
        toast.success(msg);
      }
      return true;
    } catch (err) {
      if (!silencioso) {
        toast.error(err.message || 'Erro no upload.');
      }
      throw err;
    } finally {
      if (!silencioso) {
        setUploading(false);
        setPendingFile(null);
        setUploadDescricao('');
      }
    }
  }

  function iniciarFilaImagens(imagens, { resetTotal = true } = {}) {
    if (!imagens.length) return;
    if (resetTotal) setImageBatchTotal(imagens.length);
    setPendingImageQueue(imagens.slice(1));
    setPendingFile(imagens[0]);
    setUploadDescricao('');
  }

  async function handleFilesSelect(e) {
    const selecionados = Array.from(e.target.files || []);
    e.target.value = '';
    if (!selecionados.length) return;

    const invalidos = [];
    const documentos = [];
    const imagens = [];

    for (const file of selecionados) {
      const erro = validarArquivoUpload(file);
      if (erro) {
        invalidos.push(erro);
        continue;
      }
      const mimeType = resolveMimeTypeForProdutoUpload(file);
      if (isImagemMime(mimeType)) {
        imagens.push({ file, mimeType });
      } else {
        documentos.push({ file, mimeType });
      }
    }

    if (invalidos.length) {
      toast.error(invalidos.slice(0, 3).join(' · ') + (invalidos.length > 3 ? ` (+${invalidos.length - 3})` : ''));
    }

    const total = documentos.length + imagens.length;
    if (!total) return;

    setUploading(true);
    let enviados = 0;
    let falhas = 0;

    for (let i = 0; i < documentos.length; i++) {
      const { file, mimeType } = documentos[i];
      setUploadProgress({ atual: i + 1, total, nome: file.name });
      try {
        await enviarArquivo(file, mimeType, '', { silencioso: true });
        enviados += 1;
      } catch {
        falhas += 1;
      }
    }

    setUploadProgress(null);

    if (imagens.length) {
      if (documentos.length) {
        toast.success(
          `${enviados} documento(s) enviado(s)${falhas ? `, ${falhas} falha(s)` : ''}. Descreva ${imagens.length} imagem(ns).`
        );
      }
      iniciarFilaImagens(imagens);
      setUploading(false);
      return;
    }

    setUploading(false);
    if (enviados && !falhas) {
      toast.success(enviados === 1 ? 'Documento enviado.' : `${enviados} documentos enviados.`);
    } else if (enviados && falhas) {
      toast.error(`${enviados} enviado(s), ${falhas} falha(s).`);
    } else if (falhas) {
      toast.error('Nenhum arquivo foi enviado.');
    }
  }

  async function confirmarUploadImagem() {
    if (!pendingFile) return;
    if (!uploadDescricao.trim()) {
      toast.error('Descreva a imagem (arquitetura, fluxo, mockup…) para a IA usar no book.');
      return;
    }
    setUploading(true);
    try {
      await enviarArquivoApi(pendingFile.file, pendingFile.mimeType, uploadDescricao.trim());
      const restantes = pendingImageQueue.length;
      if (restantes > 0) {
        toast.success(`Imagem anexada. Falta descrever ${restantes} imagem(ns).`);
        iniciarFilaImagens(pendingImageQueue, { resetTotal: false });
      } else {
        toast.success('Imagem anexada — a descrição será usada no book.');
        setPendingFile(null);
        setPendingImageQueue([]);
        setImageBatchTotal(0);
        setUploadDescricao('');
      }
    } catch (err) {
      toast.error(err.message || 'Erro no upload.');
    } finally {
      setUploading(false);
    }
  }

  function cancelarUploadImagem() {
    const restantes = pendingImageQueue.length;
    setPendingFile(null);
    setPendingImageQueue([]);
    setImageBatchTotal(0);
    setUploadDescricao('');
    if (restantes) {
      toast.error(`${restantes} imagem(ns) não foram enviadas.`);
    }
  }

  async function abrirPreviewImagem(arq) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(projetosApi.urlContextoVisualizar(projetoId, arq.id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Não foi possível carregar a imagem');
      const blob = await res.blob();
      setPreviewImagemUrl(URL.createObjectURL(blob));
      setPreviewImagemNome(arq.nomeOriginal);
    } catch (err) {
      toast.error(err.message || 'Erro ao visualizar imagem.');
    }
  }

  function fecharPreview() {
    if (previewImagemUrl) URL.revokeObjectURL(previewImagemUrl);
    setPreviewImagemUrl(null);
    setPreviewImagemNome('');
  }

  async function removerArquivo(id) {
    if (!window.confirm('Remover este documento do contexto do projeto?')) return;
    try {
      const data = await projetosApi.removerArquivoContexto(projetoId, id);
      setArquivos(data.arquivos || []);
      setConfigurado(Boolean(data.configurado));
      toast.success('Documento removido.');
    } catch (err) {
      toast.error(err.message || 'Erro ao remover.');
    }
  }

  if (loading) {
    return (
      <div className="card flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando contexto do projeto…
      </div>
    );
  }

  return (
    <div className="card border border-violet-200 bg-violet-50/30 dark:border-violet-900/40 dark:bg-violet-950/20">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            Contexto do cliente (personalização do book)
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Informações e documentos usados pela IA para reduzir texto genérico nos relatórios e no book de
            maturidade.
            {configurado ? (
              <span className="ml-1 font-medium text-violet-700 dark:text-violet-300">Configurado.</span>
            ) : (
              <span className="ml-1 text-amber-700 dark:text-amber-400">Ainda vazio — o book usará só o assessment.</span>
            )}
          </p>
        </div>
        {editable && (
          <button
            type="button"
            onClick={salvar}
            disabled={saving || !dirty}
            className="btn-primary inline-flex items-center gap-2 self-start disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar contexto
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Informações para personalizar o book
          </h3>
          <div className="space-y-8">
          <div className="rounded-xl border border-violet-300 bg-white/80 p-4 dark:border-violet-800 dark:bg-violet-950/30">
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-800 dark:text-violet-200">
              Glossário e fatos canônicos
            </h4>
            <p className="mb-4 text-xs text-violet-700 dark:text-violet-300">
              Prevalem sobre anexos antigos e desejos IA desatualizados. Use para corrigir nomenclatura de pilotos,
              status de aprovações e termos obsoletos.
            </p>
            <div className="grid gap-4">
              {CAMPOS_GLOSSARIO.map((key) => (
                <CampoTexto
                  key={key}
                  campo={key}
                  labels={labels}
                  dicas={dicas}
                  valor={caracteristicas[key]}
                  editable={editable}
                  onChange={setCampo}
                />
              ))}
            </div>
          </div>
          <GrupoCampos
            titulo="Negócio e audiência"
            campos={CAMPOS_NEGOCIO}
            labels={labels}
            dicas={dicas}
            caracteristicas={caracteristicas}
            editable={editable}
            onChange={setCampo}
          />
          <GrupoCampos
            titulo="Tecnologia e dados"
            campos={CAMPOS_TECNOLOGIA}
            labels={labels}
            dicas={dicas}
            caracteristicas={caracteristicas}
            editable={editable}
            onChange={setCampo}
          />
          <GrupoCampos
            titulo="Compliance e restrições"
            campos={CAMPOS_REGULATORIO}
            labels={labels}
            dicas={dicas}
            caracteristicas={caracteristicas}
            editable={editable}
            onChange={setCampo}
          />
        </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <Link2 className="h-4 w-4" />
              URLs de referência
            </h3>
            {editable && (
              <button type="button" onClick={addUrl} className="text-sm text-violet-600 hover:underline dark:text-violet-400">
                <Plus className="mr-1 inline h-4 w-4" />
                Adicionar URL
              </button>
            )}
          </div>
          {urls.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma URL cadastrada.</p>
          ) : (
            <div className="space-y-3">
              {urls.map((u, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 md:grid-cols-12"
                >
                  <input
                    className="input md:col-span-4 text-sm"
                    placeholder="Título (opcional)"
                    value={u.titulo}
                    onChange={(ev) => updateUrl(idx, 'titulo', ev.target.value)}
                    disabled={!editable}
                  />
                  <input
                    className="input md:col-span-5 text-sm"
                    placeholder="https://…"
                    value={u.url}
                    onChange={(ev) => updateUrl(idx, 'url', ev.target.value)}
                    disabled={!editable}
                  />
                  <input
                    className="input md:col-span-2 text-sm"
                    placeholder="Notas"
                    value={u.notas}
                    onChange={(ev) => updateUrl(idx, 'notas', ev.target.value)}
                    disabled={!editable}
                  />
                  {editable && (
                    <button
                      type="button"
                      onClick={() => removeUrl(idx)}
                      className="text-red-600 hover:text-red-700 md:col-span-1"
                      title="Remover"
                    >
                      <Trash2 className="mx-auto h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <FileText className="h-4 w-4" />
              Documentos e imagens
            </h3>
            {editable && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".md,.txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,image/*"
                  className="hidden"
                  onChange={handleFilesSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploadProgress
                    ? `Enviando ${uploadProgress.atual}/${uploadProgress.total}…`
                    : 'Enviar arquivos'}
                </button>
              </>
            )}
          </div>
          <p className="mb-3 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Selecione um ou vários arquivos ({limites.maxFileSizeMb || 10}MB cada). Documentos: texto extraído
            automaticamente. Imagens: informe uma descrição por imagem (a IA usa o texto, não o pixel).
          </p>
          {arquivos.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum documento anexado.</p>
          ) : (
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
              {arquivos.map((arq) => (
                <li
                  key={arq.id}
                  className="flex items-center justify-between gap-3 bg-white px-3 py-2 dark:bg-gray-900"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 truncate text-sm font-medium text-gray-900 dark:text-white">
                      {arq.ehImagem ? (
                        <Image className="h-4 w-4 shrink-0 text-violet-500" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                      )}
                      <span className="truncate">{arq.nomeOriginal}</span>
                      {arq.ehImagem && (
                        <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                          Imagem
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatarTamanho(arq.tamanho)}
                      {arq.ehImagem
                        ? arq.descricao
                          ? ` · ${arq.descricao.slice(0, 80)}${arq.descricao.length > 80 ? '…' : ''}`
                          : ' · sem descrição'
                        : arq.charsExtraidos > 0
                          ? ` · ${arq.charsExtraidos.toLocaleString('pt-BR')} caracteres extraídos`
                          : ' · sem texto extraído'}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {arq.ehImagem && (
                      <button
                        type="button"
                        onClick={() => abrirPreviewImagem(arq)}
                        className="p-1 text-gray-500 hover:text-violet-600"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    {editable && (
                      <button
                        type="button"
                        onClick={() => removerArquivo(arq.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white">Descrever imagem</h3>
            {imageBatchTotal > 1 && (
              <p className="mt-1 text-xs font-medium text-violet-600 dark:text-violet-400">
                Imagem {imageBatchTotal - pendingImageQueue.length} de {imageBatchTotal}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {pendingFile.file.name} — explique o que a imagem mostra (arquitetura, fluxo, organograma, mockup…).
              Esse texto entra no prompt do book.
            </p>
            <textarea
              rows={4}
              className="input mt-3 w-full text-sm"
              value={uploadDescricao}
              onChange={(ev) => setUploadDescricao(ev.target.value)}
              placeholder="Ex.: Diagrama da plataforma de dados com Databricks, ingestão do SAP e camada semântica Power BI…"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={cancelarUploadImagem}
                disabled={uploading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmarUploadImagem}
                disabled={uploading}
              >
                {uploading ? 'Enviando…' : 'Anexar imagem'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewImagemUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={fecharPreview}
        >
          <div className="relative max-h-[90vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={fecharPreview}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewImagemUrl}
              alt={previewImagemNome}
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
            />
            <p className="mt-2 text-center text-sm text-white">{previewImagemNome}</p>
          </div>
        </div>
      )}
    </div>
  );
}

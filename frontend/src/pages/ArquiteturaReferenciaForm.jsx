import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Layers, Save, Trash2, Loader2, Paperclip } from 'lucide-react';
import { arquiteturasReferenciaApi } from '../services/api';
import { TIPOS_ARQUITETURA_REFERENCIA } from '../constants/tiposArquiteturaReferencia';
import {
  EXTENSOES_ARQUITETURA_REFERENCIA,
  TEXTO_FORMATOS_ARQUITETURA_REFERENCIA,
  mimeTypeParaUploadArquitetura
} from '../constants/arquiteturaReferenciaUpload';

const emptyForm = {
  nome: '',
  descricao: '',
  tipoArquitetura: 'layered',
  ciCd: '',
  tecnologia: '',
  topologia: '',
  padroesQualidade: '',
  segurancaCompliance: '',
  observabilidade: '',
  ambientesImplantacao: '',
  responsavelArquitetura: '',
  custoOperacionalNotas: '',
  ativo: true
};

export default function ArquiteturaReferenciaForm() {
  const { id: idParam } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(idParam && /\/editar\/?$/.test(location.pathname));
  const id = isEdit ? parseInt(idParam, 10) : null;
  const empresaIdFromQuery = searchParams.get('empresaId') || '';

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [empresaId, setEmpresaId] = useState(empresaIdFromQuery);
  const [form, setForm] = useState(emptyForm);
  const [arquivos, setArquivos] = useState([]);

  useEffect(() => {
    if (!isEdit) {
      if (!empresaIdFromQuery) {
        alert('Informe empresaId na URL. Ex.: /arquiteturas-referencia/nova?empresaId=1');
        navigate('/arquiteturas-referencia');
        return;
      }
      setEmpresaId(empresaIdFromQuery);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const row = await arquiteturasReferenciaApi.buscar(id);
        if (cancelled) return;
        setEmpresaId(String(row.empresaId));
        setForm({
          nome: row.nome || '',
          descricao: row.descricao || '',
          tipoArquitetura: row.tipoArquitetura || 'layered',
          ciCd: row.ciCd || '',
          tecnologia: row.tecnologia || '',
          topologia: row.topologia || '',
          padroesQualidade: row.padroesQualidade || '',
          segurancaCompliance: row.segurancaCompliance || '',
          observabilidade: row.observabilidade || '',
          ambientesImplantacao: row.ambientesImplantacao || '',
          responsavelArquitetura: row.responsavelArquitetura || '',
          custoOperacionalNotas: row.custoOperacionalNotas || '',
          ativo: row.ativo !== false
        });
        setArquivos(Array.isArray(row.arquivos) ? row.arquivos : []);
      } catch (e) {
        alert(e.message || 'Erro ao carregar');
        navigate('/arquiteturas-referencia');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id, empresaIdFromQuery, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) {
      alert('Informe o nome.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await arquiteturasReferenciaApi.atualizar(id, {
          ...form,
          ativo: form.ativo
        });
        navigate('/arquiteturas-referencia');
      } else {
        const created = await arquiteturasReferenciaApi.criar({
          empresaId: parseInt(empresaId, 10),
          ...form,
          ativo: form.ativo
        });
        navigate(`/arquiteturas-referencia/${created.id}/editar`);
      }
    } catch (err) {
      alert(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(file) {
    if (!isEdit || !id) {
      alert('Salve o cadastro primeiro. Em seguida você poderá anexar documentos, PDFs, Markdown, imagens etc.');
      return;
    }
    const mimeEnvio = mimeTypeParaUploadArquitetura(file);
    if (!mimeEnvio) {
      alert(
        'Formato não reconhecido. Use: PDF, Word (.doc, .docx), Markdown (.md), texto, CSV, JSON, PowerPoint, Excel, OpenDocument ou imagens (PNG, JPEG, GIF, WebP, SVG).'
      );
      return;
    }
    setUploadBusy(true);
    try {
      const b64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const s = reader.result;
          const i = String(s).indexOf(',');
          resolve(i >= 0 ? String(s).slice(i + 1) : s);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const created = await arquiteturasReferenciaApi.uploadAnexo(id, {
        arquivo: b64,
        nomeOriginal: file.name,
        mimeType: mimeEnvio,
        categoria: 'referencia_arquitetura'
      });
      setArquivos((prev) => [created, ...prev]);
    } catch (err) {
      alert(err.message || 'Erro no upload');
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleExcluirArquivo(arquivoId) {
    if (!window.confirm('Remover este arquivo?')) return;
    try {
      await arquiteturasReferenciaApi.excluirAnexo(arquivoId);
      setArquivos((prev) => prev.filter((a) => a.id !== arquivoId));
    } catch (e) {
      alert(e.message || 'Erro ao excluir');
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 flex justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/arquiteturas-referencia"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
          <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Editar arquitetura de referência' : 'Nova arquitetura de referência'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
          <input
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            maxLength={200}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            maxLength={10000}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de arquitetura</label>
          <select
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={form.tipoArquitetura}
            onChange={(e) => setForm({ ...form, tipoArquitetura: e.target.value })}
          >
            {TIPOS_ARQUITETURA_REFERENCIA.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CI / CD</label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
            placeholder="Ferramentas (GitHub Actions, Jenkins, Argo CD), ambientes de build, políticas de release…"
            value={form.ciCd}
            onChange={(e) => setForm({ ...form, ciCd: e.target.value })}
            maxLength={10000}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tecnologia (stack)</label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
            placeholder="Linguagens, frameworks, bancos, mensageria, cloud…"
            value={form.tecnologia}
            onChange={(e) => setForm({ ...form, tecnologia: e.target.value })}
            maxLength={10000}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topologia</label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={4}
            placeholder="Descrição ou notas da topologia de implantação (zonas, VPCs, clusters, edge…)"
            value={form.topologia}
            onChange={(e) => setForm({ ...form, topologia: e.target.value })}
            maxLength={10000}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Padrões de qualidade / engenharia</label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
            placeholder="Ex.: twelve-factor, DDD, code review, feature flags…"
            value={form.padroesQualidade}
            onChange={(e) => setForm({ ...form, padroesQualidade: e.target.value })}
            maxLength={10000}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Segurança e compliance</label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
            placeholder="IAM, criptografia, LGPD, auditoria, secrets…"
            value={form.segurancaCompliance}
            onChange={(e) => setForm({ ...form, segurancaCompliance: e.target.value })}
            maxLength={10000}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observabilidade</label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
            placeholder="Logs, métricas, tracing, APM, alertas…"
            value={form.observabilidade}
            onChange={(e) => setForm({ ...form, observabilidade: e.target.value })}
            maxLength={10000}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ambientes de implantação</label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
            placeholder="dev / homologação / produção, regiões, multi-cloud…"
            value={form.ambientesImplantacao}
            onChange={(e) => setForm({ ...form, ambientesImplantacao: e.target.value })}
            maxLength={10000}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsável pela arquitetura</label>
          <input
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={form.responsavelArquitetura}
            onChange={(e) => setForm({ ...form, responsavelArquitetura: e.target.value })}
            maxLength={500}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas de custo operacional</label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
            placeholder="Estimativas ou premissas de custo recorrente (opcional)"
            value={form.custoOperacionalNotas}
            onChange={(e) => setForm({ ...form, custoOperacionalNotas: e.target.value })}
            maxLength={10000}
          />
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-primary-600" />
            Arquivos de referência
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{TEXTO_FORMATOS_ARQUITETURA_REFERENCIA}</p>
          {!isEdit && (
            <div className="mb-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-100">
              Depois de clicar em <strong>Salvar</strong>, o registro será criado e esta mesma tela abrirá em modo edição para você enviar .doc, .docx, .pdf, .md, imagens e demais formatos listados acima.
            </div>
          )}
          {isEdit && (
            <>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer text-sm disabled:opacity-50">
                <input
                  type="file"
                  className="hidden"
                  accept={EXTENSOES_ARQUITETURA_REFERENCIA}
                  disabled={uploadBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) handleUpload(f);
                  }}
                />
                {uploadBusy ? 'Enviando…' : 'Adicionar arquivo'}
              </label>
              <ul className="mt-3 space-y-2 text-sm">
                {arquivos.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded"
                  >
                    <span className="truncate pr-2" title={a.nomeOriginal}>
                      {a.nomeOriginal}
                    </span>
                    <button type="button" onClick={() => handleExcluirArquivo(a.id)} className="text-red-600 p-1 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {arquivos.length === 0 && (
                  <li className="text-gray-500 dark:text-gray-400">Nenhum anexo ainda — use &quot;Adicionar arquivo&quot;.</li>
                )}
              </ul>
            </>
          )}
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={form.ativo}
            onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
          />
          Ativo
        </label>

        <div className="flex justify-end gap-3 pt-4">
          <Link
            to="/arquiteturas-referencia"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

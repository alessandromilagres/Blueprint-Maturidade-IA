import { useState, useEffect, useCallback } from 'react';
import { Mail, Save, Eye, RotateCcw, Loader2, AlertCircle, Check } from 'lucide-react';
import { adminEmailConviteApi } from '../services/api';

export default function AdminEmailConviteAvaliacao() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [erro, setErro] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [templateHtml, setTemplateHtml] = useState('');
  const [assunto, setAssunto] = useState('');
  const [placeholders, setPlaceholders] = useState([]);
  const [descricaoPh, setDescricaoPh] = useState('');
  const [defaultTemplateHtml, setDefaultTemplateHtml] = useState('');
  const [defaultAssunto, setDefaultAssunto] = useState('');
  const [usandoPadraoHtml, setUsandoPadraoHtml] = useState(true);
  const [usandoPadraoAssunto, setUsandoPadraoAssunto] = useState(true);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewAssunto, setPreviewAssunto] = useState('');
  const [incluirCredenciaisPreview, setIncluirCredenciaisPreview] = useState(true);
  const [incluirMencaoDesejosIaPreview, setIncluirMencaoDesejosIaPreview] = useState(true);

  const carregar = useCallback(async () => {
    setErro('');
    setOkMsg('');
    try {
      const d = await adminEmailConviteApi.obter();
      setTemplateHtml(d.templateHtml || '');
      setAssunto(d.assunto || '');
      setPlaceholders(d.placeholders || []);
      setDescricaoPh(d.descricaoPlaceholders || '');
      setDefaultTemplateHtml(d.defaultTemplateHtml || '');
      setDefaultAssunto(d.defaultAssunto || '');
      setUsandoPadraoHtml(!!d.usandoPadraoHtml);
      setUsandoPadraoAssunto(!!d.usandoPadraoAssunto);
    } catch (e) {
      setErro(e.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleSalvar() {
    setErro('');
    setOkMsg('');
    setSaving(true);
    try {
      await adminEmailConviteApi.salvar(templateHtml, assunto);
      setOkMsg('Configuração salva. Os próximos convites usarão este modelo.');
      setUsandoPadraoHtml(false);
      setUsandoPadraoAssunto(false);
    } catch (e) {
      setErro(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    setErro('');
    setOkMsg('');
    setPreviewing(true);
    try {
      const r = await adminEmailConviteApi.preview({
        templateHtml,
        assunto,
        sampleData: {
          incluirCredenciais: incluirCredenciaisPreview,
          incluirMencaoDesejosIaNoConvite: incluirMencaoDesejosIaPreview
        }
      });
      setPreviewHtml(r.html || '');
      setPreviewAssunto(r.assunto || '');
    } catch (e) {
      setErro(e.message || 'Erro no preview');
      setPreviewHtml('');
      setPreviewAssunto('');
    } finally {
      setPreviewing(false);
    }
  }

  function restaurarPadrao() {
    setTemplateHtml(defaultTemplateHtml);
    setAssunto(defaultAssunto);
    setOkMsg('Texto padrão carregado no editor (ainda não salvo).');
    setErro('');
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-sky-100 dark:bg-sky-900/40 p-3 rounded-xl">
            <Mail className="w-8 h-8 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">E-mail de convite à avaliação</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl">
              Edite o HTML e o assunto enviados aos convidados. Use os placeholders listados abaixo. Apenas
              administradores acessam esta tela.
            </p>
          </div>
        </div>
      </div>

      {(usandoPadraoHtml || usandoPadraoAssunto) && (
        <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
          Parte da configuração ainda usa o modelo padrão do sistema (nada personalizado guardado no banco).
        </p>
      )}

      {erro && (
        <div className="flex items-start gap-2 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {okMsg && (
        <div className="flex items-start gap-2 text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm">
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{okMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assunto</label>
            <input
              type="text"
              className="input w-full"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              spellCheck={false}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              No assunto você pode usar: <code className="text-xs">{'{{tipoAvaliacao}}'}</code>,{' '}
              <code className="text-xs">{'{{nomeEmpresa}}'}</code>, <code className="text-xs">{'{{nomeItem}}'}</code>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HTML do corpo</label>
            <textarea
              className="input w-full font-mono text-xs leading-relaxed min-h-[420px]"
              value={templateHtml}
              onChange={(e) => setTemplateHtml(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4 text-sm">
            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Placeholders no HTML</p>
            <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 break-all">{descricaoPh}</p>
            <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
              Convites de <strong>maturidade (projeto)</strong>: o gestor pode marcar se o e-mail inclui o texto sobre{' '}
              <strong>Desejos IA</strong>. Para isso aparecer, o HTML deve conter o placeholder{' '}
              <code className="text-xs">{'{{blocoOpcionalDesejosIa}}'}</code> (o modelo padrão já inclui).
            </p>
            <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
              {placeholders.map((p) => (
                <li key={p}>
                  <code>{`{{${p}}}`}</code>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={handleSalvar}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </button>
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Pré-visualizar
            </button>
            <button
              type="button"
              onClick={restaurarPadrao}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-sm text-amber-900 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-amber-900/30"
            >
              <RotateCcw className="w-4 h-4" />
              Carregar padrão no editor
            </button>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={incluirCredenciaisPreview}
                onChange={(e) => setIncluirCredenciaisPreview(e.target.checked)}
              />
              Preview com bloco de credenciais
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={incluirMencaoDesejosIaPreview}
                onChange={(e) => setIncluirMencaoDesejosIaPreview(e.target.checked)}
              />
              Preview com parágrafo Desejos IA
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pré-visualização</p>
          {previewAssunto && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Assunto: <strong className="text-gray-800 dark:text-gray-200">{previewAssunto}</strong>
            </p>
          )}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-950 min-h-[480px]">
            {previewHtml ? (
              <iframe title="Preview e-mail" className="w-full h-[720px] border-0" srcDoc={previewHtml} />
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                Clique em &quot;Pré-visualizar&quot; para ver o HTML com dados de exemplo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Trash2, 
  Download, 
  Eye,
  Plus,
  X,
  Loader2,
  FolderOpen,
  AlertCircle,
  FileSpreadsheet,
  Presentation
} from 'lucide-react';
import { arquivosApi } from '../services/api';

const CATEGORIAS = [
  { id: 'geral', nome: 'Geral', icone: File },
  { id: 'mockup', nome: 'Mockup/Wireframe', icone: Image },
  { id: 'fluxo', nome: 'Diagrama de Fluxo', icone: FileText },
  { id: 'requisito', nome: 'Documento de Requisito', icone: FileText },
  { id: 'referencia', nome: 'Referência', icone: FolderOpen },
  { id: 'dados', nome: 'Dados/Planilhas', icone: FileText }
];

const TIPOS_ACEITOS = {
  'image/png': 'Imagem PNG',
  'image/jpeg': 'Imagem JPEG',
  'image/gif': 'Imagem GIF',
  'image/webp': 'Imagem WebP',
  'application/pdf': 'PDF',
  'text/plain': 'Texto',
  'text/markdown': 'Markdown',
  'text/csv': 'CSV',
  'application/json': 'JSON',
  'application/msword': 'Word (.doc)',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word (.docx)',
  'application/vnd.ms-powerpoint': 'PowerPoint (.ppt)',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint (.pptx)',
  'application/vnd.ms-excel': 'Excel (.xls)',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel (.xlsx)',
  'application/vnd.oasis.opendocument.text': 'OpenDocument (.odt)',
  'application/vnd.oasis.opendocument.presentation': 'OpenDocument (.odp)',
  'application/vnd.oasis.opendocument.spreadsheet': 'OpenDocument (.ods)'
};

function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getIconeArquivo(mimeType) {
  if (mimeType?.startsWith('image/')) {
    return { icon: Image, color: 'purple' };
  }
  if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) {
    return { icon: Presentation, color: 'orange' };
  }
  if (mimeType?.includes('word') || mimeType?.includes('document')) {
    return { icon: FileText, color: 'blue' };
  }
  if (mimeType === 'application/pdf') {
    return { icon: FileText, color: 'red' };
  }
  if (mimeType === 'text/csv' || mimeType?.includes('spreadsheet')) {
    return { icon: FileSpreadsheet, color: 'green' };
  }
  return { icon: File, color: 'gray' };
}

export default function ArquivosReferencia({ produtoId, onArquivosChange }) {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [previewArquivo, setPreviewArquivo] = useState(null);
  const [previewTexto, setPreviewTexto] = useState(null);
  const [novoArquivo, setNovoArquivo] = useState({
    file: null,
    categoria: 'geral',
    descricao: ''
  });
  const [erro, setErro] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    carregarArquivos();
  }, [produtoId]);

  const carregarArquivos = async () => {
    try {
      setLoading(true);
      const data = await arquivosApi.listarPorProduto(produtoId);
      setArquivos(data || []);
      if (onArquivosChange) onArquivosChange(data || []);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErro('Arquivo muito grande (máximo 10MB)');
      return;
    }

    if (!TIPOS_ACEITOS[file.type]) {
      setErro(`Tipo de arquivo não suportado: ${file.type}`);
      return;
    }

    setErro(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setNovoArquivo(prev => ({
        ...prev,
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
          base64
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!novoArquivo.file) return;

    try {
      setUploading(true);
      setErro(null);
      
      await arquivosApi.upload(
        produtoId,
        novoArquivo.file,
        novoArquivo.categoria,
        novoArquivo.descricao
      );

      setNovoArquivo({ file: null, categoria: 'geral', descricao: '' });
      setModalAberto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      await carregarArquivos();
    } catch (error) {
      setErro(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExcluir = async (id) => {
    if (!confirm('Deseja remover este arquivo?')) return;

    try {
      await arquivosApi.excluir(id);
      await carregarArquivos();
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const getCategoriaInfo = (categoriaId) => {
    return CATEGORIAS.find(c => c.id === categoriaId) || CATEGORIAS[0];
  };

  const isImagem = (mimeType) => mimeType?.startsWith('image/');

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              Arquivos de Referência
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Adicione documentos, mockups e diagramas para enriquecer a especificação
            </p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      <div className="p-4">
        {arquivos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Upload className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>Nenhum arquivo de referência adicionado</p>
            <p className="text-sm mt-1">
              Adicione mockups, diagramas ou documentos para a IA usar como contexto
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {arquivos.map(arquivo => {
              const categoria = getCategoriaInfo(arquivo.categoria);
              const { icon: IconArquivo, color } = getIconeArquivo(arquivo.mimeType);
              
              return (
                <div 
                  key={arquivo.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className={`p-2 rounded-lg bg-${color}-100`}>
                    <IconArquivo className={`w-5 h-5 text-${color}-600`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {arquivo.nomeOriginal}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{categoria.nome}</span>
                      <span>•</span>
                      <span>{formatarTamanho(arquivo.tamanho)}</span>
                      {arquivo.conteudoExtraido && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">Texto extraído</span>
                        </>
                      )}
                    </div>
                    {arquivo.descricao && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {arquivo.descricao}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isImagem(arquivo.mimeType) && (
                      <button
                        onClick={() => setPreviewArquivo(arquivo)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Visualizar imagem"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {arquivo.conteudoExtraido && (
                      <button
                        onClick={() => setPreviewTexto(arquivo)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                        title="Ver texto extraído"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    <a
                      href={arquivosApi.urlDownload(arquivo.id)}
                      target="_blank"
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleExcluir(arquivo.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {arquivos.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertCircle className="w-4 h-4" />
              <span>
                {arquivos.length} arquivo(s) serão usados como contexto na próxima geração de especificação
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Upload */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Adicionar Arquivo de Referência</h3>
              <button 
                onClick={() => {
                  setModalAberto(false);
                  setNovoArquivo({ file: null, categoria: 'geral', descricao: '' });
                  setErro(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {erro}
                </div>
              )}

              {/* Área de upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo
                </label>
                {novoArquivo.file ? (
                  (() => {
                    const { icon: IconPreview, color } = getIconeArquivo(novoArquivo.file.type);
                    return (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                        <IconPreview className={`w-8 h-8 text-${color}-600`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {novoArquivo.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {TIPOS_ACEITOS[novoArquivo.file.type] || novoArquivo.file.type} • {formatarTamanho(novoArquivo.file.size)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setNovoArquivo(prev => ({ ...prev, file: null }));
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Clique para selecionar ou arraste um arquivo
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Word, Excel, PowerPoint, PDF, imagens, texto (máx. 10MB)
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.md,.csv,.json,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods"
                  className="hidden"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={novoArquivo.categoria}
                  onChange={(e) => setNovoArquivo(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={novoArquivo.descricao}
                  onChange={(e) => setNovoArquivo(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva o conteúdo do arquivo para ajudar a IA..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => {
                  setModalAberto(false);
                  setNovoArquivo({ file: null, categoria: 'geral', descricao: '' });
                  setErro(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={!novoArquivo.file || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preview de Imagem */}
      {previewArquivo && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewArquivo(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] mx-4">
            <button
              onClick={() => setPreviewArquivo(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={arquivosApi.urlVisualizar(previewArquivo.id)}
              alt={previewArquivo.nomeOriginal}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <p className="text-white text-center mt-2">
              {previewArquivo.nomeOriginal}
            </p>
          </div>
        </div>
      )}

      {/* Modal de Preview do Texto Extraído */}
      {previewTexto && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewTexto(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Texto Extraído do Documento
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {previewTexto.nomeOriginal}
                </p>
              </div>
              <button 
                onClick={() => setPreviewTexto(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-auto flex-1">
              <div className="mb-3 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="font-medium">Tamanho original:</span>
                  {formatarTamanho(previewTexto.tamanho)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Caracteres extraídos:</span>
                  {previewTexto.conteudoExtraido?.length?.toLocaleString() || 0}
                </span>
              </div>
              
              <div className="bg-gray-50 border rounded-lg p-4 font-mono text-sm whitespace-pre-wrap text-gray-700 max-h-[60vh] overflow-auto">
                {previewTexto.conteudoExtraido || 'Nenhum texto extraído disponível.'}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center shrink-0">
              <p className="text-xs text-gray-500">
                Este é o texto que será enviado para a IA como contexto na geração de especificações.
              </p>
              <button
                onClick={() => setPreviewTexto(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

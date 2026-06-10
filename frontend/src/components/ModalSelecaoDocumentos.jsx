import { useState, useEffect } from 'react';
import {
  X,
  FileText,
  FileCode,
  Shield,
  Server,
  Calendar,
  Briefcase,
  Database,
  Code,
  CheckSquare,
  Layout,
  Book,
  AlertTriangle,
  Cloud,
  Check,
  Clock,
  Sparkles,
  Info,
  TestTube,
  FileSearch
} from 'lucide-react';
import api from '../services/api';

const ICONES = {
  FileText,
  FileCode,
  Shield,
  Server,
  Calendar,
  Briefcase,
  Database,
  Code,
  CheckSquare,
  Layout,
  Book,
  AlertTriangle,
  Cloud,
  TestTube,
  FileSearch
};

export default function ModalSelecaoDocumentos({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading = false 
}) {
  const [tiposDocumentos, setTiposDocumentos] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [tempoEstimado, setTempoEstimado] = useState('');

  useEffect(() => {
    if (isOpen) {
      carregarTiposDocumentos();
    }
  }, [isOpen]);

  useEffect(() => {
    calcularTempoEstimado();
  }, [selecionados, tiposDocumentos]);

  const carregarTiposDocumentos = async () => {
    try {
      setCarregando(true);
      const response = await api.get('/especificacoes/tipos-documentos');
      setTiposDocumentos(response.tipos || []);
      
      // Pré-seleciona os essenciais
      const essenciais = (response.tipos || [])
        .filter(t => t.essencial)
        .map(t => t.id);
      setSelecionados(essenciais);
    } catch (error) {
      console.error('Erro ao carregar tipos de documentos:', error);
    } finally {
      setCarregando(false);
    }
  };

  const calcularTempoEstimado = () => {
    if (!tiposDocumentos.length || !selecionados.length) {
      setTempoEstimado('0 min');
      return;
    }

    const minutos = selecionados.reduce((acc, id) => {
      const tipo = tiposDocumentos.find(t => t.id === id);
      if (tipo?.tempoEstimado) {
        const min = parseInt(tipo.tempoEstimado.split('-')[0] || '2');
        return acc + min;
      }
      return acc + 2;
    }, 0);

    const max = minutos + selecionados.length;
    setTempoEstimado(`${minutos}-${max} min`);
  };

  const toggleSelecao = (id) => {
    setSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const selecionarTodos = () => {
    const todos = tiposDocumentos
      .filter(t => t.disponivel !== false)
      .map(t => t.id);
    setSelecionados(todos);
  };

  const selecionarApenasEssenciais = () => {
    const essenciais = tiposDocumentos
      .filter(t => t.essencial)
      .map(t => t.id);
    setSelecionados(essenciais);
  };

  const handleConfirm = () => {
    onConfirm(selecionados);
  };

  if (!isOpen) return null;

  const documentosEssenciais = tiposDocumentos.filter(t => t.essencial);
  const documentosOpcionais = tiposDocumentos.filter(t => !t.essencial && t.disponivel !== false);
  const documentosFuturos = tiposDocumentos.filter(t => t.disponivel === false);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Selecionar Documentos
                  </h2>
                  <p className="text-sm text-purple-100">
                    Escolha quais documentos deseja gerar
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {carregando ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Info box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Documentos recomendados pré-selecionados</p>
                    <p className="mt-1 text-blue-600">
                      Sugerimos estes documentos para uma especificação completa, 
                      mas você pode desmarcar ou adicionar outros conforme sua necessidade.
                    </p>
                  </div>
                </div>

                {/* Ações rápidas */}
                <div className="flex gap-2">
                  <button
                    onClick={selecionarApenasEssenciais}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Apenas recomendados
                  </button>
                  <button
                    onClick={selecionarTodos}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Selecionar todos disponíveis
                  </button>
                  <button
                    onClick={() => setSelecionados([])}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
                  >
                    Desmarcar todos
                  </button>
                </div>

                {/* Documentos Recomendados */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Documentos Recomendados
                  </h3>
                  <div className="space-y-2">
                    {documentosEssenciais.map(doc => {
                      const IconComponent = ICONES[doc.icone] || FileText;
                      const isSelected = selecionados.includes(doc.id);
                      
                      return (
                        <div 
                          key={doc.id}
                          onClick={() => toggleSelecao(doc.id)}
                          className={`
                            border-2 rounded-lg p-4 transition-all cursor-pointer
                            ${isSelected 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`
                              p-2 rounded-lg flex-shrink-0
                              ${isSelected ? 'bg-green-100' : 'bg-gray-100'}
                            `}>
                              <IconComponent className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900">{doc.nome}</h4>
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                  Recomendado
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{doc.descricao}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{doc.tempoEstimado}</span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <div className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center
                                ${isSelected 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'border-gray-300'
                                }
                              `}>
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Documentos Opcionais */}
                {documentosOpcionais.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Documentos Opcionais
                    </h3>
                    <div className="space-y-2">
                      {documentosOpcionais.map(doc => {
                        const IconComponent = ICONES[doc.icone] || FileText;
                        const isSelected = selecionados.includes(doc.id);
                        
                        return (
                          <div 
                            key={doc.id}
                            onClick={() => toggleSelecao(doc.id)}
                            className={`
                              border-2 rounded-lg p-4 transition-all cursor-pointer
                              ${isSelected 
                                ? 'border-purple-500 bg-purple-50' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`
                                p-2 rounded-lg flex-shrink-0
                                ${isSelected ? 'bg-purple-100' : 'bg-gray-100'}
                              `}>
                                <IconComponent className={`w-5 h-5 ${isSelected ? 'text-purple-600' : 'text-gray-500'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900">{doc.nome}</h4>
                                <p className="text-sm text-gray-600 mt-1">{doc.descricao}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{doc.tempoEstimado}</span>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <div className={`
                                  w-6 h-6 rounded-full border-2 flex items-center justify-center
                                  ${isSelected 
                                    ? 'bg-purple-500 border-purple-500' 
                                    : 'border-gray-300'
                                  }
                                `}>
                                  {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Documentos Futuros (Fase 2) */}
                {documentosFuturos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Em Breve (Fase 2)
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {documentosFuturos.map(doc => {
                        const IconComponent = ICONES[doc.icone] || FileText;
                        
                        return (
                          <div 
                            key={doc.id}
                            className="border border-dashed border-gray-200 rounded-lg p-3 opacity-60"
                          >
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">{doc.nome}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{selecionados.length}</span> documento(s) selecionado(s)
                <span className="mx-2">•</span>
                <span className="text-purple-600">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Tempo estimado: {tempoEstimado}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || selecionados.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Gerar Especificação
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

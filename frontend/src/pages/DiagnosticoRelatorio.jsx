import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Printer, 
  Building2, 
  User, 
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Target,
  BarChart3,
  Zap,
  Mail
} from 'lucide-react';
import api from '../services/api';

const CORES_NIVEL = {
  'Iniciante': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', barra: 'bg-red-500' },
  'Explorador': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', barra: 'bg-orange-500' },
  'Praticante': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', barra: 'bg-yellow-500' },
  'Avançado': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', barra: 'bg-blue-500' },
  'Líder': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', barra: 'bg-green-500' }
};

const CORES_PRIORIDADE = {
  'Crítica': 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
  'Alta': 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  'Média': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400'
};

export default function DiagnosticoRelatorio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef(null);
  
  const [relatorio, setRelatorio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRelatorio();
  }, [id]);

  async function loadRelatorio() {
    try {
      const data = await api.get(`/diagnostico/${id}/relatorio`);
      setRelatorio(data);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      if (error.message?.includes('400')) {
        navigate(`/diagnostico-rapido/${id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function formatarData(data) {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  function renderScoreGauge(score) {
    const percentual = (score / 5) * 100;
    const strokeDasharray = `${percentual * 2.51327} ${251.327 - percentual * 2.51327}`;
    
    return (
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900 dark:text-white">
            {score?.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">de 5.0</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (!relatorio) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Relatório não encontrado
          </h2>
          <Link 
            to="/diagnostico-rapido"
            className="text-blue-600 hover:text-blue-700"
          >
            Iniciar novo diagnóstico
          </Link>
        </div>
      </div>
    );
  }

  const nivelCores = CORES_NIVEL[relatorio.resultado.nivelMaturidade] || CORES_NIVEL['Praticante'];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Relatório de Diagnóstico
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {relatorio.respondente.empresa}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <Link
                to="/diagnostico-rapido"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Zap className="w-4 h-4" />
                Novo Diagnóstico
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="max-w-5xl mx-auto px-4 py-8 print:py-0 print:px-0">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white print:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{relatorio.titulo}</h1>
                <p className="text-blue-100">Resultado da Avaliação</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-200" />
                <span>{relatorio.respondente.empresa}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-200" />
                <span>{relatorio.respondente.nome}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-200" />
                <span>{formatarData(relatorio.dataRealizacao)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-200" />
                <span>{relatorio.duracaoMinutos || '~30'} minutos</span>
              </div>
            </div>
          </div>

          <div className="p-8 print:p-6">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Score Geral de Maturidade
                </h2>
                <div className="flex justify-center mb-4">
                  {renderScoreGauge(relatorio.resultado.scoreGeral)}
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${nivelCores.bg} ${nivelCores.text} font-semibold`}>
                  <Target className="w-5 h-5" />
                  Nível: {relatorio.resultado.nivelMaturidade}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Score por Dimensão
                </h2>
                <div className="space-y-3">
                  {relatorio.resultado.scoresPorDimensao.map((dim) => (
                    <div key={dim.id} className="flex items-center gap-3">
                      <span className="text-xl w-8">{dim.icone}</span>
                      <div className="flex-grow">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {dim.nome}
                          </span>
                          <span className="text-gray-900 dark:text-white font-semibold">
                            {dim.score.toFixed(1)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${(dim.score / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Principais Gaps Identificados
              </h2>
              
              <div className="grid md:grid-cols-3 gap-4">
                {relatorio.analise.principaisGaps.map((gap, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{gap.icone}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${CORES_PRIORIDADE[gap.prioridade] || CORES_PRIORIDADE['Média']}`}>
                        {gap.prioridade}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {gap.dimensao}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>Score: {gap.score}/5</span>
                      <span>•</span>
                      <span className="text-red-500">Gap: {gap.gap} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Recomendação de Próximo Passo
              </h2>
              <div 
                className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: relatorio.analise.recomendacaoProximoPasso
                    ?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                }}
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                {relatorio.proximosPassos.titulo}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-3">
                {relatorio.proximosPassos.acoes.map((acao, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {acao}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-t border-gray-200 dark:border-gray-700 print:bg-gray-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Este diagnóstico rápido oferece uma visão inicial da maturidade em IA.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  Para uma análise completa, realize o Assessment de Maturidade com 108 perguntas.
                </p>
                {relatorio.conduzidoPor && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Conduzido por: {relatorio.conduzidoPor}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3 print:hidden">
                <a
                  href="mailto:contato@sysmap.com.br?subject=Interesse%20em%20Assessment%20Completo%20de%20IA"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-lg"
                >
                  <Mail className="w-5 h-5" />
                  Solicitar Assessment Completo
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 print:hidden">
          <p>Blueprint IA - Plataforma de Diagnóstico de Maturidade em Inteligência Artificial</p>
        </div>
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:p-6 { padding: 1.5rem !important; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
          .print\\:bg-gray-100 { background-color: #f3f4f6 !important; }
        }
      `}</style>
    </div>
  );
}

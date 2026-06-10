import { useState, useEffect } from 'react';
import { Settings, Cpu, Key, Check, AlertCircle, Loader2, Eye, EyeOff, Zap, DollarSign, Image } from 'lucide-react';
import { aiProvidersApi } from '../services/api';

const PROVIDERS_INFO = {
  anthropic: {
    name: 'Anthropic (Claude)',
    model: 'Claude Sonnet 4',
    description: 'Melhor qualidade para especificações técnicas detalhadas',
    cost: '~$3-15/1M tokens',
    speed: 'Médio',
    supportsImages: true,
    color: 'orange',
    urlKey: 'https://console.anthropic.com/',
    placeholder: 'sk-ant-api03-...'
  },
  openai: {
    name: 'OpenAI (GPT-4)',
    model: 'GPT-4o',
    description: 'Excelente equilíbrio entre qualidade e velocidade',
    cost: '~$5-15/1M tokens',
    speed: 'Rápido',
    supportsImages: true,
    color: 'green',
    urlKey: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...'
  },
  groq: {
    name: 'Groq (Llama)',
    model: 'Llama 3.3 70B',
    description: 'Mais barato e extremamente rápido (sem suporte a imagens)',
    cost: '~$0.59/1M tokens',
    speed: 'Muito Rápido',
    supportsImages: false,
    color: 'purple',
    urlKey: 'https://console.groq.com/keys',
    placeholder: 'gsk_...'
  }
};

export default function ConfiguracoesIA() {
  const [providers, setProviders] = useState([]);
  const [currentProvider, setCurrentProvider] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [showKeys, setShowKeys] = useState({});
  const [apiKeys, setApiKeys] = useState({
    anthropic: '',
    openai: '',
    groq: ''
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const data = await aiProvidersApi.listar();
      setProviders(data.providers);
      setCurrentProvider(data.currentProvider);
      
      // Preenche as API keys com máscaras se configuradas
      const keys = {};
      data.providers.forEach(p => {
        keys[p.id] = p.configured ? '••••••••••••••••' : '';
      });
      setApiKeys(keys);
    } catch (error) {
      console.error('Erro ao carregar provedores:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectProvider(providerId) {
    const provider = providers.find(p => p.id === providerId);
    if (!provider?.configured) {
      setMessage({ type: 'error', text: 'Configure a API Key primeiro' });
      return;
    }

    setSaving(true);
    try {
      await aiProvidersApi.alterarProvedor(providerId);
      setCurrentProvider(providerId);
      setMessage({ type: 'success', text: `Provedor alterado para ${PROVIDERS_INFO[providerId].name}` });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveKey(providerId) {
    const key = apiKeys[providerId];
    if (!key || key === '••••••••••••••••') {
      setMessage({ type: 'error', text: 'Insira uma API Key válida' });
      return;
    }

    setSaving(true);
    try {
      await aiProvidersApi.salvarApiKey(providerId, key);
      setMessage({ type: 'success', text: `API Key do ${PROVIDERS_INFO[providerId].name} salva com sucesso!` });
      await loadProviders();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestProvider(providerId) {
    const provider = providers.find(p => p.id === providerId);
    if (!provider?.configured) {
      setMessage({ type: 'error', text: 'Configure a API Key primeiro' });
      return;
    }

    setTesting(providerId);
    setTestResult(null);
    try {
      const result = await aiProvidersApi.testar(providerId);
      setTestResult({ 
        providerId, 
        success: true, 
        message: `Conexão OK! Resposta em ${result.responseTime}ms`,
        details: result
      });
    } catch (error) {
      setTestResult({ 
        providerId, 
        success: false, 
        message: error.message 
      });
    } finally {
      setTesting(null);
    }
  }

  function toggleShowKey(providerId) {
    setShowKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  }

  function handleKeyChange(providerId, value) {
    setApiKeys(prev => ({ ...prev, [providerId]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-xl">
          <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações de IA</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure os provedores de IA para geração de especificações</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-sm underline">Fechar</button>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Provedor Ativo
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Selecione qual provedor de IA será usado para gerar especificações de produtos.
          O sistema faz fallback automático para outros provedores configurados em caso de falha.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(PROVIDERS_INFO).map(([id, info]) => {
            const provider = providers.find(p => p.id === id);
            const isActive = currentProvider === id;
            const isConfigured = provider?.configured;
            
            return (
              <div 
                key={id}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isActive 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : isConfigured
                      ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                      : 'border-gray-200 dark:border-gray-700 opacity-60'
                }`}
                onClick={() => isConfigured && handleSelectProvider(id)}
              >
                {isActive && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    info.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/50' :
                    info.color === 'green' ? 'bg-green-100 dark:bg-green-900/50' :
                    'bg-purple-100 dark:bg-purple-900/50'
                  }`}>
                    <Cpu className={`w-5 h-5 ${
                      info.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                      info.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      'text-purple-600 dark:text-purple-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{info.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{info.model}</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{info.description}</p>
                
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    <DollarSign className="w-3 h-3" />
                    {info.cost}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    <Zap className="w-3 h-3" />
                    {info.speed}
                  </span>
                  {info.supportsImages && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded">
                      <Image className="w-3 h-3" />
                      Imagens
                    </span>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className={`text-xs font-medium ${
                    isConfigured 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {isConfigured ? '✓ Configurado' : '○ Não configurado'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          API Keys
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Configure as chaves de API para cada provedor. As chaves são armazenadas de forma segura no servidor.
        </p>
        
        <div className="space-y-4">
          {Object.entries(PROVIDERS_INFO).map(([id, info]) => {
            const provider = providers.find(p => p.id === id);
            const isConfigured = provider?.configured;
            const isCurrentTest = testResult?.providerId === id;
            
            return (
              <div key={id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{info.name}</span>
                    {isConfigured && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                        Configurado
                      </span>
                    )}
                  </div>
                  <a 
                    href={info.urlKey} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Obter API Key →
                  </a>
                </div>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKeys[id] ? 'text' : 'password'}
                      value={apiKeys[id]}
                      onChange={(e) => handleKeyChange(id, e.target.value)}
                      placeholder={info.placeholder}
                      className="input w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKeys[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleSaveKey(id)}
                    disabled={saving || !apiKeys[id] || apiKeys[id] === '••••••••••••••••'}
                    className="btn btn-primary px-4"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                  </button>
                  
                  <button
                    onClick={() => handleTestProvider(id)}
                    disabled={testing || !isConfigured}
                    className="btn btn-secondary px-4"
                  >
                    {testing === id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Testar'}
                  </button>
                </div>
                
                {isCurrentTest && (
                  <div className={`mt-2 p-2 rounded text-sm ${
                    testResult.success 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {testResult.success ? '✓' : '✗'} {testResult.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Dica</h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          O <strong>Groq</strong> é a opção mais barata e rápida, ideal para testes e desenvolvimento.
          Para produção com documentos complexos, recomendamos <strong>Claude</strong> ou <strong>GPT-4</strong>.
        </p>
      </div>
    </div>
  );
}

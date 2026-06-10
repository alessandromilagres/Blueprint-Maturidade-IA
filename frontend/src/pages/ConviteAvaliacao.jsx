import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Package, 
  Building2, 
  FolderKanban,
  AlertCircle,
  CheckCircle,
  Loader2,
  User
} from 'lucide-react';
import { convitesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ConviteAvaliacao() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { usuario, login } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState(null);
  const [convite, setConvite] = useState(null);
  
  const [formLogin, setFormLogin] = useState({ email: '', senha: '' });
  const [erroLogin, setErroLogin] = useState('');
  const [logando, setLogando] = useState(false);
  const autoAceiteRef = useRef(false);

  useEffect(() => {
    validarConvite();
  }, [token]);

  useEffect(() => {
    if (!usuario?.id || !convite?.avaliador?.id || autoAceiteRef.current) return;
    if (Number(usuario.id) !== Number(convite.avaliador.id)) return;
    autoAceiteRef.current = true;
    handleAceitarConvite();
  }, [usuario?.id, convite?.avaliador?.id]);

  async function validarConvite() {
    try {
      setLoading(true);
      const resultado = await convitesApi.validar(token);
      
      if (!resultado.valido) {
        setErro(resultado.error || 'Convite inválido');
        return;
      }
      
      setConvite(resultado.convite);
    } catch (error) {
      setErro('Erro ao validar convite: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setErroLogin('');
    setLogando(true);
    
    try {
      const result = await login(formLogin.email, formLogin.senha);
      if (!result.success) {
        setErroLogin(result.error || 'Erro ao fazer login');
      }
    } catch (error) {
      setErroLogin(error.message);
    } finally {
      setLogando(false);
    }
  }

  async function handleAceitarConvite() {
    try {
      setProcessando(true);
      const resultado = await convitesApi.aceitar(token);
      
      if (resultado.success) {
        navigate(resultado.redirectUrl);
      } else {
        setErro(resultado.error || 'Erro ao aceitar convite');
      }
    } catch (error) {
      setErro('Erro ao aceitar convite: ' + error.message);
    } finally {
      setProcessando(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Validando convite...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Convite Inválido
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {erro}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Ir para o Login
          </button>
        </div>
      </div>
    );
  }

  const item = convite.tipo === 'projeto' ? convite.projeto : convite.produto;
  const empresa = convite.tipo === 'projeto' 
    ? convite.projeto?.empresa 
    : convite.produto?.projeto?.empresa;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Blueprint IA</h1>
              <p className="text-blue-200 text-sm">Assessment de Maturidade</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
              convite.tipo === 'projeto' 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : 'bg-purple-100 dark:bg-purple-900/30'
            }`}>
              {convite.tipo === 'projeto' 
                ? <ClipboardCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                : <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              }
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Convite para Avaliação
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {convite.tipo === 'projeto' 
                ? 'Avaliação de Maturidade em IA' 
                : 'Avaliação de Produto IA-First'}
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                {convite.tipo === 'projeto' 
                  ? <FolderKanban className="w-5 h-5 text-blue-500" />
                  : <Package className="w-5 h-5 text-purple-500" />
                }
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {convite.tipo === 'projeto' ? 'Projeto' : 'Produto'}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {item?.nome}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Empresa
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {empresa?.nome}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Avaliador
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {convite.avaliador?.nome}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {convite.avaliador?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!usuario ? (
            <div className="border-t dark:border-gray-700 pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                Faça login para iniciar a avaliação
              </p>
              
              <form onSubmit={handleLogin} className="space-y-4">
                {erroLogin && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    {erroLogin}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formLogin.email}
                    onChange={(e) => setFormLogin({ ...formLogin, email: e.target.value })}
                    required
                    className="input"
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={formLogin.senha}
                    onChange={(e) => setFormLogin({ ...formLogin, senha: e.target.value })}
                    required
                    className="input"
                    placeholder="Sua senha"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={logando}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {logando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="border-t dark:border-gray-700 pt-6">
              {usuario.id === convite.avaliador?.id ? (
                <>
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-4 justify-center">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Logado como {usuario.nome}</span>
                  </div>
                  
                  <button
                    onClick={handleAceitarConvite}
                    disabled={processando}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {processando ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Iniciando avaliação...
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="w-5 h-5" />
                        Ir para avaliação
                      </>
                    )}
                  </button>
                  <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
                    Você será direcionado automaticamente para o formulário.
                  </p>
                </>
              ) : (
                <div className="text-center">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      Você está logado como <strong>{usuario.nome}</strong>, mas este convite é para <strong>{convite.avaliador?.nome}</strong>.
                    </p>
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-2">
                      Por favor, faça logout e entre com a conta correta.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

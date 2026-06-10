import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { convitesApi } from '../services/api';

export default function AcessoMagicLink() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [erro, setErro] = useState('');
  const executouRef = useRef(false);

  useEffect(() => {
    if (!token || executouRef.current) return;
    executouRef.current = true;

    async function acessar() {
      try {
        const resultado = await convitesApi.acessarSemSenha(token);
        if (!resultado?.success || !resultado?.token || !resultado?.usuario) {
          throw new Error(resultado?.error || 'Não foi possível validar seu acesso.');
        }

        localStorage.setItem('token', resultado.token);
        localStorage.setItem('usuario', JSON.stringify(resultado.usuario));
        window.location.assign(resultado.redirectUrl || '/avaliacoes');
      } catch (error) {
        setErro(error.message || 'Convite inválido ou expirado.');
      }
    }

    acessar();
  }, [navigate, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-gray-800">
        {erro ? (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acesso inválido</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{erro}</p>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="btn-primary mt-6"
            >
              Ir para o login
            </button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verificando seu acesso</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Estamos abrindo sua avaliação de maturidade. Você não precisa digitar senha.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

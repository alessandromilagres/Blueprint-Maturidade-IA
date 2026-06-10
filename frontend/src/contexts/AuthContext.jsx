import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = '/api';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioSalvo = localStorage.getItem('usuario');
    
    if (token && usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo));
        verificarToken(token);
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, []);

  async function verificarToken(token) {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        logout();
        return;
      }
      
      const usuarioAtualizado = await response.json();
      setUsuario(usuarioAtualizado);
      localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
    } catch {
      logout();
    }
  }

  async function login(email, senha) {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
      });
      
      const raw = await response.text();
      let data = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(
            response.ok
              ? 'Resposta inválida do servidor.'
              : `Servidor retornou erro HTTP ${response.status}. Confira se a API está rodando e se o front usa o mesmo host/proxy (ex.: Vite em desenvolvimento).`
          );
        }
      }
      
      if (!response.ok) {
        const base =
          data.error ||
          data.message ||
          (typeof data === 'object' && data != null && Object.keys(data).length === 0
            ? `Falha na autenticação (HTTP ${response.status}). Verifique se o backend está em http://localhost:3001 e se você abre o app pela URL do Vite (ex.: http://localhost:5173) para o proxy /api funcionar.`
            : 'Erro ao fazer login');
        const extra =
          Array.isArray(data.detalhes) && data.detalhes.length
            ? ` — ${data.detalhes.map((d) => d.mensagem || d.message || '').filter(Boolean).join('; ')}`
            : '';
        const details = data.details ? ` (${data.details})` : '';
        throw new Error(`${base}${extra}${details}`);
      }
      
      if (!data.token || !data.usuario) {
        throw new Error('Resposta de login incompleta (sem token).');
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      setUsuario(data.usuario);
      
      return { success: true };
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === 'Failed to fetch'
          ? 'Não foi possível conectar à API. Verifique se o backend está rodando e se você acessa o app pela URL do Vite (proxy /api).'
          : err.message;
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }

  async function registro(dados) {
    setError(null);
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar');
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      setUsuario(data.usuario);
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  function getToken() {
    return localStorage.getItem('token');
  }

  function isAdmin() {
    return String(usuario?.role || '').trim().toLowerCase() === 'admin';
  }

  function isGestor() {
    const r = String(usuario?.role || '').trim().toLowerCase();
    if (r === 'admin') return true;
    // Gestor clássico + fase 2 (visão operacional na empresa), exceto avaliador-only
    return r === 'gestor' || r === 'negocios' || r === 'ti' || r === 'sysmap';
  }

  function isAvaliador() {
    return String(usuario?.role || '').trim().toLowerCase() === 'avaliador';
  }

  /** Perfis fase 2 vinculados à empresa: Negócios, TI, SysMap */
  function isPerfilEmpresaFase2() {
    const r = String(usuario?.role || '').trim().toLowerCase();
    return r === 'negocios' || r === 'ti' || r === 'sysmap';
  }

  const value = {
    usuario,
    loading,
    error,
    login,
    registro,
    logout,
    getToken,
    isAdmin,
    isGestor,
    isAvaliador,
    isPerfilEmpresaFase2,
    isAuthenticated: !!usuario
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

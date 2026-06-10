import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { rotuloParaRota } from '../utils/routeLabels';

const ActivityContext = createContext(null);

const HEARTBEAT_MS = 25000;

function getToken() {
  return localStorage.getItem('token');
}

async function postHeartbeat(path, rotuloPagina, ultimaAcao) {
  const token = getToken();
  if (!token) return;
  try {
    await fetch('/api/activity/heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        path,
        rotuloPagina,
        ultimaAcao: ultimaAcao || null
      })
    });
  } catch {
    /* silencioso — não bloquear UX */
  }
}

export function ActivityProvider({ children }) {
  const { usuario } = useAuth();
  const location = useLocation();
  const [ultimaAcaoExtra, setUltimaAcaoExtra] = useState(null);

  const setPresenceAction = useCallback((texto) => {
    setUltimaAcaoExtra(texto ? String(texto).slice(0, 500) : null);
  }, []);

  const enviar = useCallback(() => {
    if (!usuario) return;
    const path = `${location.pathname}${location.search || ''}`;
    const rotulo = rotuloParaRota(location.pathname);
    postHeartbeat(path, rotulo, ultimaAcaoExtra);
  }, [usuario, location.pathname, location.search, ultimaAcaoExtra]);

  useEffect(() => {
    if (!usuario) return;
    enviar();
  }, [usuario, location.pathname, location.search, enviar]);

  useEffect(() => {
    if (!usuario) return;
    const id = setInterval(enviar, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [usuario, enviar]);

  const value = useMemo(
    () => ({
      setPresenceAction
    }),
    [setPresenceAction]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  return ctx;
}

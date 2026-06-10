import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading, isAvaliador } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAvaliador()) {
    const path = location.pathname;
    const rotaPermitida =
      path === '/avaliacoes' ||
      path.startsWith('/avaliacoes/') ||
      path.startsWith('/avaliacao-concluida/');
    if (!rotaPermitida) {
      return <Navigate to="/avaliacoes" replace />;
    }
  }

  return children;
}

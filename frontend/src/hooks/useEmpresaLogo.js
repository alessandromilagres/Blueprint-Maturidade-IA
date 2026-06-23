import { useEffect, useState } from 'react';
import { empresasApi } from '../services/api';

/**
 * Carrega logo da empresa (autenticado). Retorna null se não houver logo cadastrado.
 */
export function useEmpresaLogoUrl(empresaId, { enabled = true } = {}) {
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    let ativo = true;
    let objectUrl = null;

    async function load() {
      if (!enabled || !empresaId) {
        setLogoUrl(null);
        return;
      }
      try {
        const blob = await empresasApi.buscarLogoBlob(empresaId);
        if (!ativo) return;
        if (!blob) {
          setLogoUrl(null);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setLogoUrl(objectUrl);
      } catch {
        if (ativo) setLogoUrl(null);
      }
    }

    load();

    return () => {
      ativo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [empresaId, enabled]);

  return logoUrl;
}

/** Busca logo como data URL (export Word). */
export async function fetchEmpresaLogoDataUrl(empresaId) {
  if (!empresaId) return null;
  try {
    const blob = await empresasApi.buscarLogoBlob(empresaId);
    if (!blob) return null;
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

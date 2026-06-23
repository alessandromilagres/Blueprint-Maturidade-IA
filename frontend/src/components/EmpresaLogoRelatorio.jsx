import { useEmpresaLogoUrl } from '../hooks/useEmpresaLogo';

/**
 * Exibe logo da empresa nos relatórios/books quando cadastrado.
 * Sem logo no cadastro → não renderiza nada.
 */
export default function EmpresaLogoRelatorio({
  empresaId,
  empresaLogoDisponivel = true,
  className = '',
  alt = 'Logo da empresa'
}) {
  const logoUrl = useEmpresaLogoUrl(empresaId, {
    enabled: Boolean(empresaId) && empresaLogoDisponivel !== false
  });

  if (!logoUrl) return null;

  return (
    <img
      src={logoUrl}
      alt={alt}
      className={`object-contain ${className}`}
    />
  );
}

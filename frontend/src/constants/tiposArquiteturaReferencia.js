/** Valores alinhados ao backend (Prisma / Zod). */
export const TIPOS_ARQUITETURA_REFERENCIA = [
  { value: 'layered', label: 'Em camadas (N-tier)' },
  { value: 'microservices', label: 'Microsserviços' },
  { value: 'serverless', label: 'Serverless / FaaS' },
  { value: 'monolith', label: 'Monólito modular' },
  { value: 'event_driven', label: 'Orientada a eventos' },
  { value: 'hybrid', label: 'Híbrida' },
  { value: 'data_mesh', label: 'Data mesh / plataforma de dados' },
  { value: 'other', label: 'Outra' }
];

export function labelTipoArquiteturaReferencia(value) {
  const v = String(value || '').trim();
  return TIPOS_ARQUITETURA_REFERENCIA.find((t) => t.value === v)?.label || v || '—';
}

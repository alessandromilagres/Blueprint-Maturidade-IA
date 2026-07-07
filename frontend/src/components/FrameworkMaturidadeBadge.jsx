import { frameworkBadgeClass, frameworkShortLabel } from '../constants/frameworkMaturidade';

export default function FrameworkMaturidadeBadge({ projeto, className = '' }) {
  const fw = projeto?.frameworkMaturidade || 'BLUEPRINT_16';
  const label = projeto?.frameworkShortLabel || frameworkShortLabel(fw);
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${frameworkBadgeClass(fw)} ${className}`}
      title={projeto?.frameworkLabel || label}
    >
      {label}
    </span>
  );
}

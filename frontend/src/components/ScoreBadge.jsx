export default function ScoreBadge({ score, nivel, size = 'md' }) {
  const getColorClass = (score) => {
    if (score >= 4) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
    if (score >= 3) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700';
    if (score >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
    return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${getColorClass(score)} ${sizeClasses[size]}`}>
      <span className="font-bold">{score?.toFixed(1) || '0.0'}</span>
      {nivel && <span className="opacity-75">· {nivel}</span>}
    </span>
  );
}

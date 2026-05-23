const STYLES = {
  LOW:          'bg-green-950 text-green-400 border-green-800',
  MODERATE:     'bg-yellow-950 text-yellow-400 border-yellow-800',
  HIGH:         'bg-orange-950 text-orange-400 border-orange-800',
  CRITICAL:     'bg-red-950 text-red-400 border-red-800',
  CATASTROPHIC: 'bg-red-950 text-red-300 border-red-600 animate-pulse',
}

export function SeverityBadge({ severity, className = '' }) {
  const cls = STYLES[severity] || STYLES.MODERATE
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${cls} ${className}`}>
      {severity}
    </span>
  )
}

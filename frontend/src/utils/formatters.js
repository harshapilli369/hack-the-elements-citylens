export function formatPopulation(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

export function formatCarbon(tonnes) {
  const abs = Math.abs(tonnes)
  const sign = tonnes < 0 ? '-' : '+'
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M t`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}K t`
  return `${sign}${Math.round(abs)} t`
}

export function formatHectares(ha) {
  if (ha >= 10_000) return `${(ha / 10_000).toFixed(1)}K ha`
  return `${Math.round(ha).toLocaleString()} ha`
}

export function getSeverityColor(severity) {
  const map = {
    SEVERE:   '#C0392B',
    HIGH:     '#FF4757',
    MODERATE: '#FFA502',
    LOW:      '#FFA502',
    MINIMAL:  '#2ED573',
  }
  return map[severity] || '#8B949E'
}

export function getScoreColor(score) {
  if (score >= 80) return '#C0392B'
  if (score >= 60) return '#FF4757'
  if (score >= 40) return '#FFA502'
  if (score >= 20) return '#00D4FF'
  return '#2ED573'
}

export function getCarbonColor(delta) {
  if (delta > 5_000_000) return '#C0392B'
  if (delta > 1_000_000) return '#FF4757'
  if (delta > 0)         return '#FFA502'
  return '#2ED573'
}

export function getCategoryIcon(cat) {
  const map = {
    carbon:      '🌿',
    forest:      '🌲',
    water:       '💧',
    heat:        '🌡️',
    biodiversity:'🦋',
    source:      '🌱',
  }
  return map[cat] || '⚠️'
}

export function getPriorityColor(priority) {
  return {
    critical: '#FF4757',
    high:     '#FFA502',
    moderate: '#00D4FF',
    positive: '#2ED573',
    low:      '#8B949E',
  }[priority] || '#8B949E'
}

import { motion } from 'framer-motion'

const PRIORITY = {
  critical: { color: '#FF375F', label: 'Critical' },
  high:     { color: '#FF9F0A', label: 'High'     },
  moderate: { color: '#0A84FF', label: 'Moderate' },
  positive: { color: '#30D158', label: 'Positive' },
  low:      { color: 'rgba(245,245,247,0.35)', label: 'Low' },
}

// Maps recommendation category → which simulator parameter it targets
const SIM_HINT = {
  forest:      'Restrict greenfield expansion — reduce land conversion rate',
  water:       'Boost water infrastructure — lower watershed stress growth',
  heat:        'Increase urban canopy — offset heat island effect',
  biodiversity:'Establish wildlife corridors — slow biodiversity index decline',
  carbon:      'Accelerate grid decarbonisation — reduce per-capita emissions delta',
  source:      'Fund rewilding at source — accelerate land succession',
}

export function RecommendationCards({ recommendations, onSimulate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {recommendations.map((rec, i) => {
        const p    = PRIORITY[rec.priority] || PRIORITY.low
        const hint = SIM_HINT[rec.category]
        return (
          <motion.div key={i}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.3 }}
            style={{
              display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderLeft: `3px solid ${p.color}`,
            }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{rec.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Priority + category */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: p.color }}>
                  {p.label.toUpperCase()}
                </span>
                <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.05em', color: 'rgba(245,245,247,0.28)', textTransform: 'uppercase' }}>
                  {rec.category}
                </span>
              </div>
              {/* Action */}
              <div style={{ fontSize: 13, fontWeight: 500, color: '#F5F5F7', lineHeight: 1.5, marginBottom: 5 }}>
                {rec.action}
              </div>
              {/* Impact */}
              <div style={{ fontSize: 11, color: 'rgba(245,245,247,0.35)', lineHeight: 1.55, display: 'flex', gap: 6, marginBottom: hint ? 10 : 0 }}>
                <span style={{ color: p.color, flexShrink: 0 }}>→</span>
                {rec.impact}
              </div>
              {/* Simulate action */}
              {hint && onSimulate && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 10, color: 'rgba(245,245,247,0.22)', fontStyle: 'italic' }}>
                    In simulator: {hint}
                  </span>
                  <button
                    onClick={() => onSimulate(rec.category)}
                    style={{
                      flexShrink: 0, padding: '4px 12px', borderRadius: 7, fontSize: 10, fontWeight: 600,
                      letterSpacing: '0.04em', cursor: 'pointer', transition: 'all 0.15s',
                      color: p.color, background: `${p.color}10`, border: `1px solid ${p.color}30`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${p.color}22`; e.currentTarget.style.borderColor = `${p.color}60` }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${p.color}10`; e.currentTarget.style.borderColor = `${p.color}30` }}>
                    → Apply in Simulator
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

import { motion } from 'framer-motion'
import { formatHectares } from '../../utils/formatters'

// Dynamic element-specific color shifting
const elementColors = {
  carbon: (v) => {
    if (v <= 25) return '#BF5AF2' // Air - Clear Deep Violet
    if (v <= 50) return '#9C81B5' // Light Haze
    if (v <= 75) return '#D69A2B' // Heavy Smog Yellow
    return '#FF375F'             // Toxic/Carbon Spiked
  },
  habitat: (v) => {
    if (v <= 25) return '#30D158' // Earth - Rich Forest Green
    if (v <= 50) return '#83A846' // Olive / Depleting Canopy
    if (v <= 75) return '#C2A44B' // Dry soil brown
    return '#FF453A'             // Deforested/Searing Red
  },
  water: (v) => {
    if (v <= 25) return '#0A84FF' // Water - Deep Clear Blue
    if (v <= 50) return '#40C8C4' // Strained Cyan
    if (v <= 75) return '#FFCC00' // Yellow Watershed Stress
    return '#FF375F'             // Severe drought red
  },
  heat: (v) => {
    if (v <= 25) return '#64D2FF' // Fire/Climate - Cool Temperate Ice/Teal
    if (v <= 50) return '#FFD60A' // Warm Amber
    if (v <= 75) return '#FF9F0A' // Searing Orange
    return '#FF375F'             // Scorching UHI Heat
  },
  biodiversity: (v) => {
    if (v <= 25) return '#00D8A5' // Earth/Bio - Emerald Balance
    if (v <= 50) return '#82C27F' // Shifting Moss Green
    if (v <= 75) return '#FFA502' // Endangered Orange
    return '#FF375F'             // Extinction Crimson
  }
}

export function EnvironmentGauges({ scorecard }) {
  const carbonDelta = scorecard.carbon_per_capita_delta
  const carbonScore = Math.min(Math.max((carbonDelta / 60) * 100, 0), 100)
  const forestScore = Math.min((scorecard.forest_loss_ha / 50000) * 100, 100)
  const watershedScore = scorecard.watershed_stress_final
  const uhiScore = Math.min((scorecard.uhi_delta_final_c / 6) * 100, 100)
  const bioScore = Math.max(0, 100 - scorecard.biodiversity_index_final)

  const metrics = [
    {
      label: 'Carbon Shift',
      element: 'Air',
      icon: '💨',
      type: 'carbon',
      value: carbonScore,
      reading: carbonDelta > 0
        ? `+${carbonDelta.toFixed(1)} t/cap/yr`
        : `${carbonDelta.toFixed(1)} t/cap/yr`,
      beneficial: carbonDelta <= 0,
    },
    {
      label: 'Habitat Loss',
      element: 'Earth',
      icon: '🪨',
      type: 'habitat',
      value: forestScore,
      reading: formatHectares(scorecard.forest_loss_ha) + ' lost',
    },
    {
      label: 'Watershed',
      element: 'Water',
      icon: '💧',
      type: 'water',
      value: watershedScore,
      reading: `${Math.round(watershedScore)}% stress`,
    },
    {
      label: 'Heat Island',
      element: 'Fire',
      icon: '🔥',
      type: 'heat',
      value: uhiScore,
      reading: `+${scorecard.uhi_delta_final_c.toFixed(2)}°C`,
    },
    {
      label: 'Biodiversity',
      element: 'Earth',
      icon: '🦋',
      type: 'biodiversity',
      value: bioScore,
      reading: `Index ${scorecard.biodiversity_index_final.toFixed(0)}/100`,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Metric rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {metrics.map((m, i) => {
          const col = m.beneficial ? '#30D158' : elementColors[m.type](m.value)
          return (
            <motion.div key={m.label}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06, duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Label row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13 }}>{m.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#F5F5F7' }}>{m.label}</span>
                  <span style={{
                    fontSize: 8,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 5px',
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: col,
                  }}>
                    {m.element}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(245,245,247,0.30)' }}>{m.reading}</span>
                  <span style={{ fontSize: 14, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: col, minWidth: 34, textAlign: 'right' }}>
                    {Math.round(m.value)}
                  </span>
                </div>
              </div>
              {/* Bar */}
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, m.value)}%` }}
                  transition={{ delay: i * 0.06 + 0.1, duration: 0.7, ease: 'easeOut' }}
                  style={{ height: '100%', background: col, borderRadius: 2, boxShadow: `0 0 8px ${col}44` }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Rewilding strip */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{ marginTop: 20, padding: '12px 14px', borderRadius: 10, background: 'rgba(48,209,88,0.06)', border: '1px solid rgba(48,209,88,0.18)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 14, marginTop: 1 }}>🌱</span>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          <span style={{ color: '#30D158', fontWeight: 600 }}>Source rewilding (🪨 Earth): </span>
          <span style={{ color: '#30D158', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{formatHectares(scorecard.source_rewilded_ha)}</span>
          <span style={{ color: 'rgba(245,245,247,0.40)' }}> entering natural succession · </span>
          <span style={{ color: '#30D158', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>+{Math.round(scorecard.source_carbon_recovered).toLocaleString()} t CO₂/yr</span>
          <span style={{ color: 'rgba(245,245,247,0.40)' }}> sequestered (💨 Air)</span>
        </div>
      </motion.div>
    </div>
  )
}

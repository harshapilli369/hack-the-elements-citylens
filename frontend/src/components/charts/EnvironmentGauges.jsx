import { motion } from 'framer-motion'
import { formatHectares } from '../../utils/formatters'

const barColor = (v) => v > 75 ? '#FF375F' : v > 55 ? '#FF9F0A' : v > 35 ? '#FFD60A' : '#30D158'

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
      icon: '🌿',
      value: carbonScore,
      reading: carbonDelta > 0
        ? `+${carbonDelta.toFixed(1)} t/cap/yr`
        : `${carbonDelta.toFixed(1)} t/cap/yr`,
      beneficial: carbonDelta <= 0,
    },
    {
      label: 'Habitat Loss',
      icon: '🌲',
      value: forestScore,
      reading: formatHectares(scorecard.forest_loss_ha) + ' lost',
    },
    {
      label: 'Watershed',
      icon: '💧',
      value: watershedScore,
      reading: `${Math.round(watershedScore)}% stress`,
    },
    {
      label: 'Heat Island',
      icon: '🌡️',
      value: uhiScore,
      reading: `+${scorecard.uhi_delta_final_c.toFixed(2)}°C`,
    },
    {
      label: 'Biodiversity',
      icon: '🦋',
      value: bioScore,
      reading: `Index ${scorecard.biodiversity_index_final.toFixed(0)}/100`,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Metric rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {metrics.map((m, i) => {
          const col = m.beneficial ? '#30D158' : barColor(m.value)
          return (
            <motion.div key={m.label}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06, duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Label row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 12 }}>{m.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(245,245,247,0.55)' }}>{m.label}</span>
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
                  style={{ height: '100%', background: col, borderRadius: 2, boxShadow: m.value > 60 ? `0 0 8px ${col}55` : 'none' }}
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
          <span style={{ color: '#30D158', fontWeight: 600 }}>Source rewilding: </span>
          <span style={{ color: '#30D158', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{formatHectares(scorecard.source_rewilded_ha)}</span>
          <span style={{ color: 'rgba(245,245,247,0.40)' }}> entering natural succession · </span>
          <span style={{ color: '#30D158', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>+{Math.round(scorecard.source_carbon_recovered).toLocaleString()} t CO₂/yr</span>
          <span style={{ color: 'rgba(245,245,247,0.40)' }}> sequestered</span>
        </div>
      </motion.div>
    </div>
  )
}

import { motion } from 'framer-motion'
import { RiskGauge } from '../ui/RiskGauge'
import { formatCarbon, formatHectares, getScoreColor, getCarbonColor } from '../../utils/formatters'

export function EnvironmentGauges({ scorecard }) {
  const carbonDelta = scorecard.carbon_per_capita_delta
  // Normalize carbon delta: Alberta = ~58 t/cap above Quebec = worst case → 100
  const carbonScore = Math.min(Math.max((carbonDelta / 60) * 100, 0), 100)
  // Forest loss score: normalize against 50,000 ha as severe
  const forestScore = Math.min((scorecard.forest_loss_ha / 50000) * 100, 100)
  // Watershed: already 0-100
  const watershedScore = scorecard.watershed_stress_final
  // UHI: normalize 6°C = 100
  const uhiScore = Math.min((scorecard.uhi_delta_final_c / 6) * 100, 100)
  // Biodiversity: inverted (lower index = more pressure)
  const bioScore = Math.max(0, 100 - scorecard.biodiversity_index_final)

  const gauges = [
    {
      label: 'Carbon Shift',
      icon: '🌿',
      value: carbonScore,
      sub: carbonDelta > 0
        ? `+${carbonDelta.toFixed(1)} t/cap/yr`
        : `${carbonDelta.toFixed(1)} t/cap/yr (beneficial)`,
      beneficial: carbonDelta <= 0,
    },
    {
      label: 'Habitat Loss',
      icon: '🌲',
      value: forestScore,
      sub: formatHectares(scorecard.forest_loss_ha) + ' lost',
    },
    {
      label: 'Watershed',
      icon: '💧',
      value: watershedScore,
      sub: `${Math.round(watershedScore)}% stress`,
    },
    {
      label: 'Heat Island',
      icon: '🌡️',
      value: uhiScore,
      sub: `+${scorecard.uhi_delta_final_c.toFixed(2)}°C delta`,
    },
    {
      label: 'Bio. Pressure',
      icon: '🦋',
      value: bioScore,
      sub: `Index: ${scorecard.biodiversity_index_final.toFixed(0)}/100`,
    },
  ]

  return (
    <motion.div
      className="glass p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h3 className="font-mono text-sm uppercase tracking-widest text-[#00D4FF] mb-1">
        Ecological Stress Indicators
      </h3>
      <p className="text-xs text-[#8B949E] mb-4">Destination province pressure at end of projection</p>

      <div className="grid grid-cols-5 gap-2">
        {gauges.map((g, i) => (
          <div key={g.label} className="flex flex-col items-center gap-1">
            <RiskGauge
              label={g.label}
              icon={g.icon}
              value={g.value}
              delay={i * 0.1}
              beneficial={g.beneficial}
            />
            <div className="text-center">
              <div className="text-[9px] font-mono text-[#8B949E] leading-tight">{g.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Source rewilding strip */}
      <div className="mt-4 p-3 rounded-xl flex items-center gap-3"
           style={{ background: '#0D1117', border: '1px solid #2ED57333' }}>
        <span className="text-xl">🌱</span>
        <div>
          <span className="text-xs font-semibold text-[#2ED573]">Source Province Rewilding: </span>
          <span className="text-xs font-mono text-[#2ED573]">
            {formatHectares(scorecard.source_rewilded_ha)}
          </span>
          <span className="text-xs text-[#8B949E]"> land entering natural succession · </span>
          <span className="text-xs font-mono text-[#2ED573]">
            +{Math.round(scorecard.source_carbon_recovered).toLocaleString()} t CO₂/yr
          </span>
          <span className="text-xs text-[#8B949E]"> being sequestered</span>
        </div>
      </div>
    </motion.div>
  )
}

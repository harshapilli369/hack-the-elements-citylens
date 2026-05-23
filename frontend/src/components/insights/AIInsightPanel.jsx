import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getSeverityColor, formatCarbon, formatHectares } from '../../utils/formatters'

function buildNarrative(result) {
  const { scorecard, source_province, destination_province, population_size, source_info, dest_info } = result
  const pop = population_size.toLocaleString()
  const carbonGood = scorecard.carbon_is_beneficial
  const carbonAbs = Math.abs(scorecard.total_carbon_delta_tonnes)
  const carbonStr = carbonGood
    ? `reducing Canada's annual carbon output by ${(carbonAbs / 1e6).toFixed(1)} million tonnes`
    : `adding ${(carbonAbs / 1e6).toFixed(1)} million tonnes of CO₂ to Canada's annual output`

  return [
    `Ecological modelling complete for the movement of ${pop} people from ${source_province} to ${destination_province}.`,
    `This shift crosses two distinct biomes: ${source_info.dominant_biome} gives way to ${dest_info.dominant_biome}.`,
    `The per-person carbon footprint ${carbonGood ? 'decreases' : 'increases'} by ${Math.abs(scorecard.carbon_per_capita_delta).toFixed(1)} tonnes/year — ${carbonStr}.`,
    `At the destination, an estimated ${formatHectares(scorecard.forest_loss_ha)} of ${dest_info.dominant_biome} habitat will be converted to urban land, fragmenting ${dest_info.species_at_risk} species-at-risk corridors.`,
    `Urban heat island effect is projected to intensify by ${scorecard.uhi_delta_final_c.toFixed(2)}°C, compounding climate stress in ${dest_info.capital}.`,
    `At the source, depopulation initiates ecological recovery — ${formatHectares(scorecard.source_rewilded_ha)} of land enters natural succession, sequestering an estimated ${Math.round(scorecard.source_carbon_recovered).toLocaleString()} tonnes CO₂/year by end of projection.`,
    `Net ecological verdict: ${scorecard.severity} impact. Recovery timeline at source: ~${scorecard.recovery_years_estimate} years.`,
  ]
}

function TypewriterText({ lines, speed = 15 }) {
  const [displayed, setDisplayed] = useState('')
  const fullText = lines.join(' ')

  useEffect(() => {
    setDisplayed('')
    let i = 0
    const iv = setInterval(() => {
      if (i < fullText.length) { setDisplayed(fullText.slice(0, ++i)) }
      else clearInterval(iv)
    }, speed)
    return () => clearInterval(iv)
  }, [fullText, speed])

  return (
    <p className="font-mono text-sm leading-relaxed text-[#00D4FF]">
      {displayed}
      <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>
        |
      </motion.span>
    </p>
  )
}

export function AIInsightPanel({ result }) {
  const lines = buildNarrative(result)
  const { scorecard, source_info, dest_info } = result
  const color = getSeverityColor(scorecard.severity)
  const carbonGood = scorecard.carbon_is_beneficial

  const metrics = [
    { label: 'Biome Crossed',    value: `${source_info.dominant_biome.split('/')[0].trim()} → ${dest_info.dominant_biome.split('/')[0].trim()}`, icon: '🌲', color: '#00D4FF' },
    { label: 'Net Carbon',       value: carbonGood ? 'Beneficial' : 'Harmful', icon: '🌿', color: carbonGood ? '#2ED573' : '#FF4757' },
    { label: 'Est. Recovery',    value: `~${scorecard.recovery_years_estimate} yr`, icon: '⏱️', color: '#FFA502' },
  ]

  return (
    <motion.div
      className="glass p-6 neon-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background: '#00D4FF15', border: '1px solid #00D4FF33' }}>
          🧠
        </div>
        <div>
          <h3 className="font-mono text-sm uppercase tracking-widest text-[#00D4FF]">
            Ecological Intelligence Briefing
          </h3>
          <p className="text-xs text-[#8B949E]">AI-generated ecosystem analysis</p>
        </div>
        <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-mono font-bold border"
              style={{ background: `${color}15`, borderColor: `${color}44`, color }}>
          {scorecard.severity}
        </span>
      </div>

      <div className="rounded-xl p-4 mb-4" style={{ background: '#0D1117', border: '1px solid #21262D' }}>
        <TypewriterText lines={lines} speed={14} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {metrics.map(m => (
          <div key={m.label} className="rounded-lg p-3 text-center"
               style={{ background: '#0D1117', border: '1px solid #21262D' }}>
            <div className="text-lg mb-1">{m.icon}</div>
            <div className="font-mono text-xs font-bold leading-tight" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[10px] text-[#8B949E] mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

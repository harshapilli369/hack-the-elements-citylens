import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const SEV_COLOR = {
  Low: '#30D158', Moderate: '#FF9F0A', High: '#FF375F',
  Critical: '#FF375F', Catastrophic: '#FF375F',
}

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
    `At the destination, an estimated ${scorecard.forest_loss_ha.toLocaleString()} ha of ${dest_info.dominant_biome} habitat will be converted to urban land, fragmenting ${dest_info.species_at_risk} species-at-risk corridors.`,
    `Urban heat island effect is projected to intensify by ${scorecard.uhi_delta_final_c.toFixed(2)}°C in ${dest_info.capital}.`,
    `At the source, depopulation initiates ecological recovery — ${scorecard.source_rewilded_ha.toLocaleString()} ha enters natural succession, sequestering an estimated ${Math.round(scorecard.source_carbon_recovered).toLocaleString()} tonnes CO₂/year.`,
    `Net ecological verdict: ${scorecard.severity} impact. Recovery timeline at source: ~${scorecard.recovery_years_estimate} years.`,
  ].join(' ')
}

function TypewriterText({ text, speed = 12 }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    setDisplayed('')
    let i = 0
    const iv = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, ++i)) }
      else clearInterval(iv)
    }, speed)
    return () => clearInterval(iv)
  }, [text, speed])

  return (
    <p style={{ fontSize: 12, lineHeight: 1.75, color: 'rgba(245,245,247,0.65)', fontFamily: 'JetBrains Mono, monospace' }}>
      {displayed}
      <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} style={{ color: '#30D158' }}>|</motion.span>
    </p>
  )
}

export function AIInsightPanel({ result }) {
  const { scorecard, source_info, dest_info } = result
  const text = buildNarrative(result)
  const sevColor = SEV_COLOR[scorecard.severity] || '#FF9F0A'
  const carbonGood = scorecard.carbon_is_beneficial

  const metrics = [
    { label: 'Biome Crossed', value: `${source_info.dominant_biome.split('/')[0].trim()} → ${dest_info.dominant_biome.split('/')[0].trim()}` },
    { label: 'Net Carbon',    value: carbonGood ? 'Beneficial' : 'Harmful', color: carbonGood ? '#30D158' : '#FF375F' },
    { label: 'Est. Recovery', value: `~${scorecard.recovery_years_estimate} yr`, color: '#FFD60A' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧠</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#F5F5F7' }}>Ecological Intelligence</div>
            <div style={{ fontSize: 10, color: 'rgba(245,245,247,0.30)' }}>AI-generated ecosystem analysis</div>
          </div>
        </div>
        <div style={{ padding: '4px 12px', borderRadius: 8, background: `${sevColor}12`, border: `1px solid ${sevColor}30`, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: sevColor }}>
          {scorecard.severity.toUpperCase()}
        </div>
      </div>

      {/* Typewriter narrative */}
      <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <TypewriterText text={text} speed={12} />
      </div>

      {/* 3 mini metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ padding: '12px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: m.color || '#F5F5F7', lineHeight: 1.3, marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)' }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

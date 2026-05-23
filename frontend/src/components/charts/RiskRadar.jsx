import { motion } from 'framer-motion'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from 'recharts'

export function RiskRadar({ scorecard, sourceInfo, destInfo }) {
  const carbonStress = Math.min(Math.max((scorecard.carbon_per_capita_delta / 60) * 100, 0), 100)
  const forestStress = Math.min((scorecard.forest_loss_ha / 50000) * 100, 100)
  const bioStress    = Math.max(0, 100 - scorecard.biodiversity_index_final)
  const uhiStress    = Math.min((scorecard.uhi_delta_final_c / 6) * 100, 100)
  const waterStress  = scorecard.watershed_stress_final

  const destData = [
    { subject: 'Carbon',      value: Math.round(carbonStress), fullMark: 100 },
    { subject: 'Habitat',     value: Math.round(forestStress), fullMark: 100 },
    { subject: 'Watershed',   value: Math.round(waterStress),  fullMark: 100 },
    { subject: 'Heat Island', value: Math.round(uhiStress),    fullMark: 100 },
    { subject: 'Biodiversity',value: Math.round(bioStress),    fullMark: 100 },
  ]

  const rewildScore        = Math.min((scorecard.source_rewilded_ha / 10000) * 100, 100)
  const carbonRecoveryScore = Math.min((scorecard.source_carbon_recovered / 10000) * 100, 100)

  const srcData = [
    { subject: 'Rewilding',    value: Math.round(rewildScore),         fullMark: 100 },
    { subject: 'C Recovery',   value: Math.round(carbonRecoveryScore), fullMark: 100 },
    { subject: 'Water Relief', value: Math.min(Math.round((sourceInfo.watershed_stress - scorecard.watershed_stress_final + 20) * 2), 100), fullMark: 100 },
    { subject: 'Land Freed',   value: Math.round(rewildScore * 0.9),   fullMark: 100 },
    { subject: 'Emissions Cut',value: Math.min(Math.round(carbonRecoveryScore * 1.2), 100), fullMark: 100 },
  ]

  const tooltipStyle = { background: 'rgba(7,8,15,0.92)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, fontSize: 11, color: '#F5F5F7', padding: '6px 10px' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Labels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF375F', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#FF375F', fontFamily: 'JetBrains Mono, monospace' }}>{destInfo?.name || 'Destination'}</div>
            <div style={{ fontSize: 9, color: 'rgba(245,245,247,0.28)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ecological pressure</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#30D158', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#30D158', fontFamily: 'JetBrains Mono, monospace' }}>{sourceInfo?.name || 'Source'}</div>
            <div style={{ fontSize: 9, color: 'rgba(245,245,247,0.28)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recovery signals</div>
          </div>
        </div>
      </div>

      {/* Charts side by side */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.4 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={destData} margin={{ top: 10, right: 14, bottom: 10, left: 14 }}>
            <PolarGrid stroke="rgba(255,255,255,0.07)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(245,245,247,0.35)', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="value" stroke="#FF375F" fill="#FF375F" fillOpacity={0.15} strokeWidth={1.5}
                   dot={{ fill: '#FF375F', r: 2.5 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}`, 'Stress']} />
          </RadarChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={srcData} margin={{ top: 10, right: 14, bottom: 10, left: 14 }}>
            <PolarGrid stroke="rgba(255,255,255,0.07)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(245,245,247,0.35)', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="value" stroke="#30D158" fill="#30D158" fillOpacity={0.15} strokeWidth={1.5}
                   dot={{ fill: '#30D158', r: 2.5 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}`, 'Recovery']} />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}

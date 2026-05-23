import { motion } from 'framer-motion'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip, Legend,
} from 'recharts'

export function RiskRadar({ scorecard, sourceInfo, destInfo }) {
  // Normalize all metrics to 0–100 scale for radar display
  const carbonStress = Math.min(Math.max((scorecard.carbon_per_capita_delta / 60) * 100, 0), 100)
  const forestStress = Math.min((scorecard.forest_loss_ha / 50000) * 100, 100)
  const bioStress    = Math.max(0, 100 - scorecard.biodiversity_index_final)
  const uhiStress    = Math.min((scorecard.uhi_delta_final_c / 6) * 100, 100)
  const waterStress  = scorecard.watershed_stress_final

  const destData = [
    { subject: 'Carbon',     value: Math.round(carbonStress), fullMark: 100 },
    { subject: 'Habitat',    value: Math.round(forestStress), fullMark: 100 },
    { subject: 'Watershed',  value: Math.round(waterStress),  fullMark: 100 },
    { subject: 'Heat Island',value: Math.round(uhiStress),    fullMark: 100 },
    { subject: 'Biodiversity pressure', value: Math.round(bioStress), fullMark: 100 },
  ]

  // Source recovery radar (positive effects)
  const rewildScore = Math.min((scorecard.source_rewilded_ha / 10000) * 100, 100)
  const carbonRecoveryScore = Math.min((scorecard.source_carbon_recovered / 10000) * 100, 100)

  const srcData = [
    { subject: 'Rewilding',     value: Math.round(rewildScore),        fullMark: 100 },
    { subject: 'C Recovery',    value: Math.round(carbonRecoveryScore), fullMark: 100 },
    { subject: 'Water Relief',  value: Math.min(Math.round((sourceInfo.watershed_stress - scorecard.watershed_stress_final + 20) * 2), 100), fullMark: 100 },
    { subject: 'Land Freed',    value: Math.round(rewildScore * 0.9),  fullMark: 100 },
    { subject: 'Emissions Cut', value: Math.min(Math.round(carbonRecoveryScore * 1.2), 100), fullMark: 100 },
  ]

  return (
    <motion.div
      className="glass p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="font-mono text-sm uppercase tracking-widest text-[#00D4FF] mb-1">
        Dual Ecological Balance
      </h3>
      <p className="text-xs text-[#8B949E] mb-4">
        Destination pressure vs. source recovery
      </p>

      <div className="grid grid-cols-2 gap-0">
        {/* Destination — red radar */}
        <div>
          <div className="text-center text-xs font-mono text-[#FF4757] mb-1 uppercase tracking-wider">
            📍 {destInfo.name} (Pressure)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={destData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#21262D" />
              <PolarAngleAxis dataKey="subject"
                              tick={{ fill: '#8B949E', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="#FF4757" fill="#FF4757" fillOpacity={0.22} strokeWidth={2}
                     dot={{ fill: '#FF4757', r: 3 }} />
              <Tooltip contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: '8px', fontSize: '11px' }}
                       formatter={v => [`${v}%`, 'Stress']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Source — green radar */}
        <div>
          <div className="text-center text-xs font-mono text-[#2ED573] mb-1 uppercase tracking-wider">
            🌱 {sourceInfo.name} (Recovery)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={srcData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#21262D" />
              <PolarAngleAxis dataKey="subject"
                              tick={{ fill: '#8B949E', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="#2ED573" fill="#2ED573" fillOpacity={0.22} strokeWidth={2}
                     dot={{ fill: '#2ED573', r: 3 }} />
              <Tooltip contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: '8px', fontSize: '11px' }}
                       formatter={v => [`${v}%`, 'Recovery']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}

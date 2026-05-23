import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  LineChart, Line,
} from 'recharts'

const DEST_SERIES = [
  { key: 'ecological_stress', name: 'Ecological Stress', color: '#FF4757' },
  { key: 'forest_loss_ha',    name: 'Habitat Lost (ha)',  color: '#FFA502', yAxis: 'right' },
  { key: 'watershed_stress',  name: 'Watershed Stress',  color: '#00D4FF' },
  { key: 'uhi_delta_c',       name: 'Heat Island (°C)',  color: '#FF6B35', yAxis: 'right' },
  { key: 'biodiversity_index',name: 'Biodiversity Index',color: '#2ED573' },
]

const SRC_SERIES = [
  { key: 'rewilded_ha',          name: 'Rewilded Land (ha)',    color: '#2ED573' },
  { key: 'carbon_recovered',     name: 'Carbon Recovered (t)', color: '#00D4FF' },
  { key: 'water_stress_relief',  name: 'Water Stress Relief',  color: '#A29BFE' },
]

function CustomTooltip({ active, payload, label, mode }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  return (
    <div className="glass p-3 border border-[#30363D] text-xs" style={{ minWidth: 200 }}>
      <div className="font-mono font-bold text-[#00D4FF] mb-2">Month {label}</div>
      {point?.event && (
        <div className="text-[#FFA502] mb-2 text-[11px]">⚡ {point.event}</div>
      )}
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4 mb-1">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-bold" style={{ color: p.color }}>
            {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CascadeTimeline({ destinationTimeline, sourceTimeline }) {
  const [activeTab, setActiveTab] = useState('destination')
  const data = activeTab === 'destination' ? destinationTimeline : sourceTimeline
  const series = activeTab === 'destination' ? DEST_SERIES : SRC_SERIES

  const crisisMonths = destinationTimeline
    .filter(t => t.ecological_stress > 60)
    .slice(0, 3)
    .map(t => t.month)

  return (
    <motion.div
      className="glass p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-mono text-sm uppercase tracking-widest text-[#00D4FF]">
            🌿 Ecological Cascade Timeline
          </h3>
          <p className="text-xs text-[#8B949E] mt-0.5">Month-by-month impact projection</p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#0D1117', border: '1px solid #21262D' }}>
          {[
            { key: 'destination', label: '📍 Destination' },
            { key: 'source',      label: '🌱 Source' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-[#00D4FF] text-[#0D1117] font-bold'
                  : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={290}>
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
          <defs>
            {series.map(s => (
              <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={s.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
          <XAxis dataKey="month" stroke="#8B949E"
                 tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}
                 label={{ value: 'Month', position: 'insideBottomRight', fill: '#8B949E', fontSize: 11, offset: -5 }} />
          <YAxis stroke="#8B949E" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
          <Tooltip content={<CustomTooltip mode={activeTab} />} />
          <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', paddingTop: '8px' }}
                  formatter={(v, e) => <span style={{ color: e.color }}>{v}</span>} />

          {activeTab === 'destination' && crisisMonths.map(m => (
            <ReferenceLine key={m} x={m} stroke="#FF475544" strokeDasharray="4 3"
                           label={{ value: '⚠', fill: '#FF4757', fontSize: 11, position: 'top' }} />
          ))}

          {series.map(s => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.name}
                  stroke={s.color} fill={`url(#g-${s.key})`}
                  strokeWidth={2} dot={false}
                  activeDot={{ r: 4, fill: s.color }} />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Event annotations */}
      <div className="mt-3 flex flex-wrap gap-2">
        {data
          .filter(t => t.event && !t.event.startsWith('Month'))
          .slice(0, 5)
          .map(t => {
            const color = activeTab === 'destination' ? '#FFA502' : '#2ED573'
            return (
              <div key={t.month}
                   className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                   style={{ background: `${color}11`, border: `1px solid ${color}33`, color }}>
                <span className="font-mono font-bold">M{t.month}</span>
                <span className="truncate max-w-[180px]">{t.event}</span>
              </div>
            )
          })}
      </div>
    </motion.div>
  )
}

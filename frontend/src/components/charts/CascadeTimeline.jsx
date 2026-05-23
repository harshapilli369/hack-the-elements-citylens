import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const DEST_SERIES = [
  { key: 'ecological_stress', name: 'Ecological Stress', color: '#FF375F' },
  { key: 'watershed_stress',  name: 'Watershed Stress',  color: '#0A84FF' },
  { key: 'biodiversity_index',name: 'Biodiversity Index',color: '#30D158' },
]

const SRC_SERIES = [
  { key: 'rewilded_ha',         name: 'Rewilded Land (ha)',   color: '#30D158' },
  { key: 'carbon_recovered',    name: 'Carbon Recovered (t)', color: '#0A84FF' },
  { key: 'water_stress_relief', name: 'Water Stress Relief',  color: '#BF5AF2' },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(7,8,15,0.95)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '10px 14px', minWidth: 180 }}>
      <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'rgba(245,245,247,0.45)', marginBottom: 8 }}>Month {label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: p.color }}>{p.name}</span>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: p.color }}>
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

  const tabColor = activeTab === 'destination' ? '#FF375F' : '#30D158'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Sub-header with tab toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: 'rgba(245,245,247,0.30)' }}>Month-by-month ecological impact projection</div>
        <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { key: 'destination', label: 'Destination' },
            { key: 'source',      label: 'Source'      },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: activeTab === tab.key ? (tab.key === 'destination' ? 'rgba(255,55,95,0.15)' : 'rgba(48,209,88,0.15)') : 'transparent',
                color: activeTab === tab.key ? (tab.key === 'destination' ? '#FF375F' : '#30D158') : 'rgba(245,245,247,0.35)',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 5, right: 8, bottom: 10, left: -8 }}>
            <defs>
              {series.map(s => (
                <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.01} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.12)"
                   tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'rgba(245,245,247,0.28)' }}
                   label={{ value: 'Month', position: 'insideBottomRight', fill: 'rgba(245,245,247,0.25)', fontSize: 10, offset: -5 }} />
            <YAxis stroke="rgba(255,255,255,0.12)"
                   tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'rgba(245,245,247,0.28)' }} />
            <Tooltip content={<CustomTooltip />} />
            {activeTab === 'destination' && crisisMonths.map(m => (
              <ReferenceLine key={m} x={m} stroke="rgba(255,55,95,0.30)" strokeDasharray="3 4"
                             label={{ value: '⚠', fill: '#FF375F', fontSize: 10, position: 'top' }} />
            ))}
            {series.map(s => (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.name}
                    stroke={s.color} fill={`url(#g-${s.key})`}
                    strokeWidth={1.5} dot={false}
                    activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Event annotations */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {data
          .filter(t => t.event && !t.event.startsWith('Month'))
          .slice(0, 5)
          .map(t => (
            <div key={t.month} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 7, background: `${tabColor}0A`, border: `1px solid ${tabColor}22` }}>
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: tabColor }}>M{t.month}</span>
              <span style={{ fontSize: 10, color: 'rgba(245,245,247,0.40)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.event}</span>
            </div>
          ))}
      </div>
    </div>
  )
}

import React from 'react'
import { motion } from 'framer-motion'

const meterColor = (v) => {
  if (v > 80) return '#FF375F'
  if (v > 60) return '#FF9F0A'
  if (v > 40) return '#FFD60A'
  return '#30D158'
}

export function ResourceMeter({ label, icon, value }) {
  const color = meterColor(value)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 11 }}>{icon}</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(245,245,247,0.45)', letterSpacing: '0.01em' }}>{label}</span>
        </div>
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color }}>{Math.round(value)}%</span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%`, backgroundColor: color }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 2, boxShadow: value > 70 ? `0 0 6px ${color}88` : 'none' }}
        />
      </div>
    </div>
  )
}

import React from 'react'
import { motion } from 'framer-motion'

export function ResourceMeter({ label, icon, value, colorClass }) {
  // Determine color based on value thresholds
  let statusColor = '#10b981' // green
  let statusText = 'text-emerald-400'
  
  if (value > 40) {
    statusColor = '#f59e0b' // yellow
    statusText = 'text-yellow-400'
  }
  if (value > 60) {
    statusColor = '#f97316' // orange
    statusText = 'text-orange-400'
  }
  if (value > 80) {
    statusColor = '#ef4444' // red
    statusText = 'text-red-400'
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium uppercase tracking-wider">
          <span>{icon}</span>
          <span>{label}</span>
        </div>
        <div className={`text-sm font-mono font-bold ${statusText}`}>
          {Math.round(value)}%
        </div>
      </div>
      <div className="cityflow-meter-track">
        <motion.div 
          className="cityflow-meter-fill"
          initial={{ width: 0 }}
          animate={{ width: `${value}%`, backgroundColor: statusColor }}
          transition={{ duration: 0.5 }}
          style={{ boxShadow: value > 80 ? `0 0 10px ${statusColor}` : 'none' }}
        />
      </div>
    </div>
  )
}

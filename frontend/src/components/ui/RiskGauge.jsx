import { motion } from 'framer-motion'
import { getScoreColor } from '../../utils/formatters'

export function RiskGauge({ label, value, icon, delay = 0, beneficial = false }) {
  // If beneficial (e.g. carbon-reducing migration), show green regardless of value
  const color = beneficial ? '#2ED573' : getScoreColor(value)
  const displayValue = beneficial ? Math.round(100 - value) : Math.round(value)
  const r = 38
  const circumference = 2 * Math.PI * r
  const strokeOffset = circumference - (value / 100) * circumference

  return (
    <motion.div
      className="glass flex flex-col items-center gap-1 p-3"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
      <svg width="88" height="88" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#21262D" strokeWidth="7" />
        <motion.circle
          cx="48" cy="48" r={r}
          fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeOffset }}
          transition={{ duration: 1.4, delay, ease: 'easeOut' }}
          transform="rotate(-90 48 48)"
          style={{ filter: `drop-shadow(0 0 5px ${color}77)` }}
        />
        <text x="48" y="53" textAnchor="middle" fill={color}
              fontSize="17" fontWeight="700" fontFamily="JetBrains Mono, monospace">
          {displayValue}
        </text>
      </svg>
      <div className="text-center">
        <div className="text-sm">{icon}</div>
        <div className="font-mono text-[9px] uppercase tracking-widest text-[#8B949E] leading-tight mt-0.5">
          {label}
        </div>
      </div>
    </motion.div>
  )
}

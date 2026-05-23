import { motion } from 'framer-motion'
import { getPriorityColor } from '../../utils/formatters'

const PRIORITY_BG = {
  critical: { bg: 'bg-red-950',   border: 'border-red-800',   badge: 'bg-red-900 text-red-300 border-red-700' },
  high:     { bg: 'bg-orange-950',border: 'border-orange-800',badge: 'bg-orange-900 text-orange-300 border-orange-700' },
  moderate: { bg: 'bg-blue-950',  border: 'border-blue-800',  badge: 'bg-blue-900 text-blue-300 border-blue-700' },
  positive: { bg: 'bg-green-950', border: 'border-green-800', badge: 'bg-green-900 text-green-300 border-green-700' },
  low:      { bg: 'bg-[#161B22]', border: 'border-[#21262D]', badge: 'bg-[#21262D] text-[#8B949E] border-[#30363D]' },
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item      = { hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0 } }

export function RecommendationCards({ recommendations }) {
  return (
    <motion.div className="glass p-6"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <h3 className="font-mono text-sm uppercase tracking-widest text-[#00D4FF] mb-1">
        🌿 Ecological Policy Recommendations
      </h3>
      <p className="text-xs text-[#8B949E] mb-4">Evidence-based interventions ranked by urgency</p>

      <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
        {recommendations.map((rec, i) => {
          const styles = PRIORITY_BG[rec.priority] || PRIORITY_BG.low
          const color  = getPriorityColor(rec.priority)
          return (
            <motion.div key={i} variants={item}
                        className={`rounded-xl p-4 border ${styles.bg} ${styles.border}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">{rec.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${styles.badge}`}>
                      {rec.priority === 'positive' ? 'BENEFICIAL' : rec.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#8B949E] uppercase font-mono tracking-wide">
                      {rec.category}
                    </span>
                  </div>
                  <p className="text-sm text-[#E6EDF3] font-medium leading-relaxed">{rec.action}</p>
                  <p className="text-xs text-[#8B949E] mt-2 flex items-start gap-1">
                    <span style={{ color }} className="shrink-0 mt-0.5">→</span>
                    {rec.impact}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}

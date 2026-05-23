import { motion } from 'framer-motion'
import { AnimatedCounter } from '../ui/AnimatedCounter'
import { getSeverityColor, formatCarbon, formatHectares, formatPopulation } from '../../utils/formatters'

export function RiskScorecard({ result }) {
  const { scorecard, source_province, destination_province, population_size, migration_reason } = result
  const color = getSeverityColor(scorecard.severity)
  const carbonBeneficial = scorecard.carbon_is_beneficial

  return (
    <motion.div
      className="glass p-6"
      style={{ border: `1px solid ${color}44`, boxShadow: `0 0 20px ${color}15` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
            <span className="font-mono text-xs uppercase tracking-widest text-[#8B949E]">
              Ecological Impact Model · Canada
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#E6EDF3]">
            {source_province} → {destination_province}
          </h2>
          <p className="text-sm text-[#8B949E] mt-1">
            {formatPopulation(population_size)} people · {migration_reason.replace('_', ' ')}
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-full text-xs font-mono font-bold border"
              style={{ background: `${color}15`, borderColor: `${color}55`, color }}>
          {scorecard.severity}
        </span>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Ecological Stress"
          value={<><AnimatedCounter to={scorecard.ecological_stress} /><span className="text-lg">%</span></>}
          color={color}
          sub="composite score"
          delay={0}
        />
        <MetricCard
          label="Carbon Shift / yr"
          value={formatCarbon(scorecard.total_carbon_delta_tonnes)}
          color={carbonBeneficial ? '#2ED573' : '#FF4757'}
          sub={carbonBeneficial ? 'beneficial reduction' : 'added to atmosphere'}
          delay={0.1}
        />
        <MetricCard
          label="Habitat Lost"
          value={formatHectares(scorecard.forest_loss_ha)}
          color="#FFA502"
          sub="forest & wetland converted"
          delay={0.2}
        />
        <MetricCard
          label="Source Rewilding"
          value={formatHectares(scorecard.source_rewilded_ha)}
          color="#2ED573"
          sub="land in natural succession"
          delay={0.3}
        />
      </div>

      {/* Carbon per capita callout */}
      <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl"
           style={{ background: '#0D1117', border: '1px solid #21262D' }}>
        <span className="text-2xl">{carbonBeneficial ? '✅' : '⚠️'}</span>
        <div className="text-sm">
          <span className="text-[#8B949E]">Per-person carbon change: </span>
          <span className="font-mono font-bold" style={{ color: carbonBeneficial ? '#2ED573' : '#FF4757' }}>
            {scorecard.carbon_per_capita_delta > 0 ? '+' : ''}{scorecard.carbon_per_capita_delta} tonnes CO₂/year
          </span>
          <span className="text-[#8B949E]"> · each resident ·</span>
          <span className="text-[#8B949E]"> ~{scorecard.trees_equivalent_lost.toLocaleString()} trees worth of carbon sink lost/yr</span>
        </div>
      </div>
    </motion.div>
  )
}

function MetricCard({ label, value, color, sub, delay }) {
  return (
    <motion.div
      className="rounded-xl p-4 text-center"
      style={{ background: '#0D1117', border: '1px solid #21262D' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="font-mono text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-[#8B949E] mt-1 font-mono uppercase tracking-wide">{label}</div>
      <div className="text-[10px] mt-0.5" style={{ color: `${color}99` }}>{sub}</div>
    </motion.div>
  )
}

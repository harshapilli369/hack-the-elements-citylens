import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useSimulationStore } from '../../store/simulationStore'
import { fetchInterventions, runSimulation } from '../../utils/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'

export function InterventionPanel({ result }) {
  const store = useSimulationStore()
  const [comparing, setComparing] = useState(false)
  const [compareResult, setCompareResult] = useState(null)

  const { data: interventions = [] } = useQuery({
    queryKey: ['interventions'],
    queryFn: fetchInterventions,
  })

  async function handleCompare() {
    if (!store.selectedInterventions.length) return
    setComparing(true)
    try {
      const res = await runSimulation({
        source_id: store.source_id,
        destination_city: store.destination_city,
        population_size: store.population_size,
        disaster_cause: store.disaster_cause,
        duration_months: store.duration_months,
        interventions: store.selectedInterventions,
      })
      setCompareResult(res)
    } finally {
      setComparing(false)
    }
  }

  // Build comparison bar data
  const compareData = compareResult
    ? [
        {
          name: 'Water',
          Without: Math.round(result.risk_scores.water_stress),
          With: Math.round(compareResult.risk_scores.water_stress),
        },
        {
          name: 'Air',
          Without: Math.round(result.risk_scores.aqi_index),
          With: Math.round(compareResult.risk_scores.aqi_index),
        },
        {
          name: 'Land',
          Without: Math.round(result.risk_scores.land_pressure),
          With: Math.round(compareResult.risk_scores.land_pressure),
        },
        {
          name: 'Waste',
          Without: Math.round(result.risk_scores.waste_overflow),
          With: Math.round(compareResult.risk_scores.waste_overflow),
        },
        {
          name: 'Infra',
          Without: Math.round(result.risk_scores.infrastructure_load),
          With: Math.round(compareResult.risk_scores.infrastructure_load),
        },
      ]
    : null

  const improvement = compareResult
    ? Math.round(result.scorecard.collapse_probability * 100) -
      Math.round(compareResult.scorecard.collapse_probability * 100)
    : null

  return (
    <motion.div
      className="glass p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
    >
      <h3 className="font-mono text-sm uppercase tracking-widest text-[#00D4FF] mb-1">
        ⚖️ Intervention Simulator
      </h3>
      <p className="text-xs text-[#8B949E] mb-4">
        Select interventions to compare against no-action baseline
      </p>

      {/* Intervention toggles */}
      <div className="grid grid-cols-1 gap-2 mb-4">
        {interventions.map(iv => {
          const selected = store.selectedInterventions.includes(iv.id)
          return (
            <button
              key={iv.id}
              onClick={() => store.toggleIntervention(iv.id)}
              className={`
                flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer
                ${selected
                  ? 'border-[#2ED573] bg-[#2ED57311]'
                  : 'border-[#30363D] hover:border-[#8B949E]'}
              `}
            >
              <div>
                <div className={`text-sm font-medium ${selected ? 'text-[#2ED573]' : 'text-[#E6EDF3]'}`}>
                  {iv.label}
                </div>
                <div className="text-xs text-[#8B949E] mt-0.5">{iv.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8B949E] font-mono">${iv.cost_usd_millions}M</span>
                <div className={`
                  w-5 h-5 rounded-md border flex items-center justify-center text-xs transition-all
                  ${selected
                    ? 'bg-[#2ED573] border-[#2ED573] text-[#0D1117]'
                    : 'border-[#30363D] text-transparent'}
                `}>
                  ✓
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Compare button */}
      <button
        onClick={handleCompare}
        disabled={!store.selectedInterventions.length || comparing}
        className={`
          w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer
          ${!store.selectedInterventions.length || comparing
            ? 'bg-[#21262D] text-[#8B949E] cursor-not-allowed'
            : 'bg-[#2ED573] text-[#0D1117] hover:bg-[#26C264]'}
        `}
      >
        {comparing ? 'Running Comparison...' : '⚖️ Compare Impact'}
      </button>

      {/* Comparison results */}
      {compareResult && compareData && (
        <motion.div
          className="mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Headline improvement */}
          <div className="mb-4 p-4 rounded-xl text-center"
               style={{ background: '#0D1117', border: '1px solid #2ED57344' }}>
            <div className="text-3xl font-mono font-bold text-[#2ED573]">
              -{improvement}%
            </div>
            <div className="text-xs text-[#8B949E] mt-1">
              Collapse probability reduction
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-sm">
              <span className="text-[#FF4757] font-mono">
                {Math.round(result.scorecard.collapse_probability * 100)}%
              </span>
              <span className="text-[#8B949E]">→</span>
              <span className="text-[#2ED573] font-mono">
                {Math.round(compareResult.scorecard.collapse_probability * 100)}%
              </span>
            </div>
          </div>

          {/* Bar chart comparison */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={compareData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
              <XAxis dataKey="name" tick={{ fill: '#8B949E', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8B949E', fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: '#161B22', border: '1px solid #21262D',
                  borderRadius: '8px', fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Without" fill="#FF4757" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
              <Bar dataKey="With" fill="#2ED573" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </motion.div>
  )
}

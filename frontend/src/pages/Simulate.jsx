import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '../store/simulationStore'
import { SimulationForm } from '../components/simulation/SimulationForm'
import { RiskScorecard } from '../components/simulation/RiskScorecard'
import { CrisisMap } from '../components/map/CrisisMap'
import { CascadeTimeline } from '../components/charts/CascadeTimeline'
import { EnvironmentGauges } from '../components/charts/EnvironmentGauges'
import { RiskRadar } from '../components/charts/RiskRadar'
import { RecommendationCards } from '../components/insights/RecommendationCards'
import { AIInsightPanel } from '../components/insights/AIInsightPanel'

export default function Simulate() {
  const navigate = useNavigate()
  const { result, isLoading } = useSimulationStore()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1117' }}>
      {/* Navbar */}
      <nav className="border-b border-[#21262D] px-6 py-3 flex items-center justify-between sticky top-0 z-50"
           style={{ background: 'rgba(13,17,23,0.96)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate('/')}
                className="flex items-center gap-2 text-[#8B949E] hover:text-[#E6EDF3] transition-colors cursor-pointer">
          <span className="text-lg">🌿</span>
          <span className="font-bold text-[#E6EDF3]">Chain Reaction</span>
          <span className="text-xs font-mono text-[#8B949E] hidden sm:block ml-1">Ecological Model</span>
        </button>

        <div className="flex items-center gap-3">
          {result && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ED573] animate-pulse" />
              <span className="text-xs font-mono text-[#8B949E] hidden sm:block">
                {result.source_province} → {result.destination_province} · {result.scorecard.severity}
              </span>
            </div>
          )}
          <button
            onClick={() => navigate('/cityflow')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8B949E] hover:text-[#E6EDF3] border border-[#21262D] hover:border-[#30363D] transition-all cursor-pointer"
          >
            🏙️ CityFlow
          </button>
        </div>
      </nav>

      {/* Layout */}
      <div className="flex-1 flex">
        {/* Left sidebar — form */}
        <div className="w-80 shrink-0 p-4 border-r border-[#21262D] overflow-y-auto"
             style={{ minHeight: 'calc(100vh - 53px)' }}>
          <SimulationForm />
        </div>

        {/* Right — results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && !result && <LoadingState />}
          {!isLoading && !result && <EmptyState />}

          <AnimatePresence>
            {result && (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <RiskScorecard result={result} />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <CrisisMap result={result} />
                  <EnvironmentGauges scorecard={result.scorecard} />
                </div>

                <CascadeTimeline
                  destinationTimeline={result.destination_timeline}
                  sourceTimeline={result.source_timeline}
                />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <RiskRadar scorecard={result.scorecard} sourceInfo={result.source_info} destInfo={result.dest_info} />
                  <AIInsightPanel result={result} />
                </div>

                <RecommendationCards recommendations={result.recommendations} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-[#2ED57322] animate-ping" style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-2 rounded-full border-2 border-[#2ED573] animate-spin border-t-transparent" />
        <div className="absolute inset-6 rounded-full bg-[#2ED57322] flex items-center justify-center text-lg">🌿</div>
      </div>
      <p className="text-sm font-mono text-[#8B949E]">Modelling ecological cascade...</p>
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[70vh] gap-6 text-center">
      <div className="relative w-24 h-24">
        {[0, 3, 6, 9].map(d => (
          <div key={d} className="absolute inset-0 rounded-full border border-[#2ED57322] animate-ping"
               style={{ animationDuration: '3s', animationDelay: `${d * 0.2}s` }} />
        ))}
        <div className="absolute inset-8 rounded-full bg-[#2ED57222] flex items-center justify-center text-2xl">🌿</div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#E6EDF3] mb-2">Ecological Impact Simulator</h2>
        <p className="text-sm text-[#8B949E] max-w-sm">
          Select two Canadian provinces and a migration scenario to model how population redistribution
          reshapes the ecology of both regions over time.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-sm">
        {['Select provinces', 'Set population & reason', 'Explore the cascade'].map((s, i) => (
          <div key={i} className="glass p-3 text-center rounded-xl">
            <div className="font-mono text-lg font-bold text-[#2ED573]">{i + 1}</div>
            <div className="text-xs text-[#8B949E] mt-1">{s}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

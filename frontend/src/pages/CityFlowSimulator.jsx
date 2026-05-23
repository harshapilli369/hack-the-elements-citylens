import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCityFlowStore } from '../store/cityflowStore'
import { SimulationMap } from '../components/cityflow/SimulationMap'
import { ControlPanel } from '../components/cityflow/ControlPanel'
import '../components/cityflow/cityflow.css'

export default function CityFlowSimulator() {
  const navigate = useNavigate()
  const tick = useCityFlowStore(state => state.tick)
  const isRunning = useCityFlowStore(state => state.sim.isRunning)
  const citiesCount = useCityFlowStore(state => state.cities.length)
  const totalInTransit = useCityFlowStore(state => state.sim.totalInTransit)
  const activeDisasters = useCityFlowStore(state => state.sim.activeDisasters)

  // Main Simulation Loop
  useEffect(() => {
    let animationId
    let lastTime = 0
    const FPS = 60
    const frameTime = 1000 / FPS

    const loop = (time) => {
      if (time - lastTime >= frameTime) {
        tick()
        lastTime = time
      }
      animationId = requestAnimationFrame(loop)
    }

    if (isRunning) {
      animationId = requestAnimationFrame(loop)
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [isRunning, tick])

  return (
    <div className="cityflow-container w-full h-screen overflow-hidden flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 flex-none flex items-center justify-between px-6 border-b border-slate-800 bg-[#0D1117]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          {/* Home link */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <span>🌿</span>
            <span className="font-semibold hidden sm:block">Chain Reaction</span>
          </button>

          <div className="w-px h-6 bg-slate-700" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(56,189,248,0.4)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">CityFlow <span className="text-sky-400">Simulator</span></h1>
              <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400">Disaster Cascade · Live</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live stats */}
          <div className="cityflow-glass px-4 py-1.5 rounded-full flex gap-3 border-slate-700">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Cities</span>
              <span className="font-mono font-bold text-sm leading-none">{citiesCount}</span>
            </div>
            <div className="w-px bg-slate-700" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-400">In Transit</span>
              <span className="font-mono font-bold text-sm leading-none">{(totalInTransit / 1000).toFixed(1)}k</span>
            </div>
            <div className="w-px bg-slate-700" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Disasters</span>
              <span className={`font-mono font-bold text-sm leading-none ${activeDisasters > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                {activeDisasters}
              </span>
            </div>
          </div>

          {/* Link to ecological simulator */}
          <button
            onClick={() => navigate('/simulate')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-all"
          >
            🌿 Migration Model
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden p-6 relative">
        <div className="cityflow-glass flex-1 rounded-2xl overflow-hidden relative border-slate-700/50 shadow-2xl flex flex-col">

          <div className="absolute top-4 right-4 z-20">
            <div className="cityflow-glass px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 border-slate-700/50 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <path d="M2 12h20"/>
              </svg>
              REGION OVERVIEW
            </div>
          </div>

          <SimulationMap />

          <div className="absolute bottom-4 left-4 z-20 cityflow-glass px-4 py-2 rounded-lg border-slate-700/50 flex gap-4 text-[10px] font-bold tracking-wider uppercase">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> Healthy</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308]" /> Warning</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" /> Stressed</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" /> Critical</div>
          </div>
        </div>

        <ControlPanel />
      </main>
    </div>
  )
}

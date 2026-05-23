import React from 'react'
import { useCityFlowStore } from '../../store/cityflowStore'

export function SimControls() {
  const { isRunning, speed } = useCityFlowStore(state => state.sim)
  const togglePlay = useCityFlowStore(state => state.togglePlay)
  const setSpeed = useCityFlowStore(state => state.setSpeed)
  const reset = useCityFlowStore(state => state.reset)

  return (
    <div className="cityflow-glass-panel rounded-xl p-4 flex flex-col">
      <div className="flex gap-4 mb-8">
        <button 
          onClick={togglePlay}
          className="cityflow-btn flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg border border-slate-600 flex items-center justify-center gap-2"
        >
          {isRunning ? (
            <><span className="text-xs">⏸</span> Pause</>
          ) : (
            <><span className="text-xs text-emerald-400">▶</span> Resume</>
          )}
        </button>
        <button 
          onClick={reset}
          className="cityflow-btn flex-none bg-slate-800/50 hover:bg-slate-700/50 text-white font-medium py-2 px-4 rounded-lg border border-slate-700/50 flex items-center justify-center gap-2"
        >
          <span className="text-xs">↺</span> Reset
        </button>
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <div className="flex justify-between text-xs font-mono text-slate-400 uppercase tracking-widest">
          <span>◷ SIM SPEED</span>
          <span className="text-sky-400 font-bold">{speed.toFixed(1)}X</span>
        </div>
        <input 
          type="range" 
          min="0.5" max="3.0" step="0.5" 
          value={speed} 
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
        />
      </div>
    </div>
  )
}

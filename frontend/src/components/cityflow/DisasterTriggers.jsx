import React from 'react'
import { useCityFlowStore } from '../../store/cityflowStore'

const DISASTERS = [
  { id: 'wildfire', name: 'Wildfire', icon: '🔥', color: 'text-orange-500' },
  { id: 'flood', name: 'Flood', icon: '🌊', color: 'text-blue-500' },
  { id: 'conflict', name: 'Conflict', icon: '⚔️', color: 'text-red-500' },
  { id: 'heatwave', name: 'Heatwave', icon: '☀️', color: 'text-yellow-500' },
  { id: 'drought', name: 'Drought', icon: '🏜️', color: 'text-amber-600' }
]

export function DisasterTriggers() {
  const selectedCityId = useCityFlowStore(state => state.sim.selectedCity)
  const cities = useCityFlowStore(state => state.cities)
  const triggerDisaster = useCityFlowStore(state => state.triggerDisaster)

  const selectedCity = cities.find(c => c.id === selectedCityId)

  return (
    <div className="cityflow-glass-panel rounded-xl p-4">
      <div className="text-sm font-mono tracking-widest text-slate-400 uppercase mb-3 flex items-center gap-2">
        <span>⚠️</span> DISASTER TRIGGERS
      </div>
      
      <div className="text-sm mb-4 text-slate-300">
        Targeting <span className="font-bold text-white">{selectedCity ? selectedCity.name : 'None'}</span>
      </div>

      <div className="flex justify-between gap-2">
        {DISASTERS.map(d => (
          <button
            key={d.id}
            className="cityflow-disaster-btn flex-1"
            onClick={() => {
              if (selectedCityId) triggerDisaster(selectedCityId, d.id)
            }}
            disabled={!selectedCityId}
          >
            <div className={`cityflow-disaster-icon ${d.color}`}>{d.icon}</div>
            <div className="cityflow-disaster-name">{d.name}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

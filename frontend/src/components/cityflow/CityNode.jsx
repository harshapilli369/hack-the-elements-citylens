import React from 'react'
import { useCityFlowStore } from '../../store/cityflowStore'

export function CityNode({ city }) {
  const { id, name, pop, stress, status, x, y, isDisasterActive } = city
  const selectedCity = useCityFlowStore(state => state.sim.selectedCity)
  const selectCity = useCityFlowStore(state => state.selectCity)

  const isSelected = selectedCity === id

  const formatPop = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    return (num / 1000).toFixed(1) + 'k'
  }

  return (
    <div 
      className={`cityflow-node ${status} ${isDisasterActive ? 'active-disaster' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={(e) => {
        e.stopPropagation()
        selectCity(id)
      }}
    >
      <div className="cityflow-node-bg" />
      <div className="cityflow-node-core" />
      
      {/* Selection Ring */}
      {isSelected && (
        <div className="absolute inset-[-12px] border border-white/30 rounded-full animate-[spin_4s_linear_infinite]" style={{ borderTopColor: 'transparent' }} />
      )}
      
      {/* Label */}
      <div className="cityflow-label">
        <div className="cityflow-label-name">{name}</div>
        <div className="cityflow-label-stats">
          pop {formatPop(pop)} <span className="text-slate-600 mx-1">•</span> stress {Math.round(stress)}%
        </div>
      </div>
    </div>
  )
}

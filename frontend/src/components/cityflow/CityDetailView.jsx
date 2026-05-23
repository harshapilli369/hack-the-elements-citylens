import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCityFlowStore } from '../../store/cityflowStore'
import { ResourceMeter } from './ResourceMeter'
import { CitySkyline } from './CitySkyline'
import { CityChart } from './CityChart'

export function CityDetailView() {
  const selectedCityId = useCityFlowStore(state => state.sim.selectedCity)
  const selectCity = useCityFlowStore(state => state.selectCity)
  const cities = useCityFlowStore(state => state.cities)

  const city = cities.find(c => c.id === selectedCityId)

  return (
    <AnimatePresence>
      {city && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="cityflow-glass-panel rounded-xl p-5 relative"
        >
          <button
            onClick={() => selectCity(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold tracking-tight">{city.name}</h2>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${
              city.status === 'critical' ? 'bg-red-950 border-red-700 text-red-300' :
              city.status === 'stressed' ? 'bg-orange-950 border-orange-700 text-orange-300' :
              city.status === 'warning'  ? 'bg-yellow-950 border-yellow-700 text-yellow-300' :
              'bg-emerald-950 border-emerald-700 text-emerald-300'
            }`}>
              {city.status.toUpperCase()}
            </span>
          </div>

          <div className="text-sm font-mono text-slate-400 mb-2">
            pop <span className="text-white">{(city.pop / 1000).toFixed(1)}k</span>
            <span className="mx-2">•</span>
            stress <span className={`font-bold ${
              city.stress > 80 ? 'text-red-400' :
              city.stress > 60 ? 'text-orange-400' :
              city.stress > 40 ? 'text-yellow-400' : 'text-emerald-400'
            }`}>{Math.round(city.stress)}%</span>
          </div>

          <CitySkyline city={city} />

          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-4">
            <ResourceMeter label="Housing" icon="🏠" value={city.resources.housing} />
            <ResourceMeter label="Water"   icon="💧" value={city.resources.water}   />
            <ResourceMeter label="Waste"   icon="🗑️" value={city.resources.waste}   />
            <ResourceMeter label="Air"     icon="💨" value={city.resources.air}     />
            <ResourceMeter label="Health"  icon="🏥" value={city.resources.health}  />
            <ResourceMeter label="Energy"  icon="⚡" value={city.resources.energy}  />
          </div>

          {/* Historical trend chart — activates after ~1 second of data */}
          <CityChart city={city} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import React from 'react'
import { motion } from 'framer-motion'

export function CitySkyline({ city }) {
  if (!city) return null

  // Calculate stress factors
  const smogOpacity = (city.resources.air / 100) * 0.8
  const waterLevel = city.resources.water / 100
  const wasteLevel = city.resources.waste / 100
  const isCritical = city.stress > 80

  return (
    <div className="relative h-32 w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800 my-4">
      {/* Background Smog / Sky */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ 
          background: `linear-gradient(to bottom, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)`,
        }}
      />
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ 
          background: `linear-gradient(to bottom, rgba(239,68,68,${isCritical ? 0.2 : 0}), rgba(249,115,22,${smogOpacity}))`,
          mixBlendMode: 'screen'
        }}
      />

      {/* Grid Lines */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(transparent_19px,rgba(255,255,255,0.5)_20px)] bg-[length:100%_20px]" />

      {/* Buildings layer */}
      <div className="absolute bottom-6 left-0 right-0 flex items-end justify-around px-4">
        {[40, 70, 50, 90, 60, 80, 45].map((height, i) => {
          // Turn off lights if highly stressed
          const lightsOn = Math.random() > (city.stress / 120)
          return (
            <motion.div 
              key={i}
              className="w-4 rounded-t-sm relative overflow-hidden"
              style={{ 
                height: `${height}px`, 
                backgroundColor: isCritical ? '#1e293b' : '#334155',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}
              animate={{ 
                height: `${height + (city.resources.housing / 100) * 20}px`,
                backgroundColor: isCritical ? '#1e293b' : '#334155'
              }}
              transition={{ duration: 1 }}
            >
              {lightsOn && !isCritical && (
                <div className="absolute top-2 left-1 w-1 h-2 bg-yellow-100/40 rounded-sm" />
              )}
              {lightsOn && !isCritical && Math.random() > 0.5 && (
                <div className="absolute top-6 right-1 w-1 h-2 bg-yellow-100/40 rounded-sm" />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Ground Infrastructure */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-slate-800 border-t border-slate-700 flex">
        {/* Water Zone */}
        <div className="flex-1 relative border-r border-slate-700/50 flex items-end overflow-hidden">
          <div className="w-full text-[10px] text-center text-blue-400/50 absolute top-0">WATER</div>
          <motion.div 
            className="w-full bg-blue-500/30"
            animate={{ height: `${waterLevel * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {/* Waste Zone */}
        <div className="flex-1 relative flex items-end overflow-hidden">
          <div className="w-full text-[10px] text-center text-orange-400/50 absolute top-0">WASTE</div>
          <motion.div 
            className="w-full bg-orange-900/40"
            animate={{ height: `${wasteLevel * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Disaster Overlay */}
      {city.isDisasterActive && (
        <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none mix-blend-screen" />
      )}
    </div>
  )
}

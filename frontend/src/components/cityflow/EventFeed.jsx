import React, { useEffect, useRef } from 'react'
import { useCityFlowStore } from '../../store/cityflowStore'
import { motion, AnimatePresence } from 'framer-motion'

export function EventFeed() {
  const events = useCityFlowStore(state => state.events)
  const feedRef = useRef(null)

  return (
    <div className="cityflow-glass-panel rounded-xl p-4 flex flex-col h-48 border-slate-700/50 mt-4">
      <div className="text-xs text-slate-400 font-mono tracking-widest uppercase mb-3 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
        </span>
        Event Feed
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2" ref={feedRef}>
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {events.map((ev) => (
              <motion.div 
                key={ev.id}
                initial={{ opacity: 0, height: 0, x: -10 }}
                animate={{ opacity: 1, height: 'auto', x: 0 }}
                className="text-sm font-mono flex items-start gap-2"
              >
                <div className="mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    ev.severity === 'critical' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 
                    ev.severity === 'warning' ? 'bg-orange-400' : 
                    'bg-slate-300'
                  }`} />
                </div>
                <div className={
                  ev.severity === 'critical' ? 'text-red-400 font-medium' : 
                  ev.severity === 'warning' ? 'text-orange-300' : 
                  'text-slate-300'
                }>
                  {ev.msg}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

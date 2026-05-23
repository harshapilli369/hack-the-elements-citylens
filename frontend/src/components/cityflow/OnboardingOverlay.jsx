import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  {
    icon:  '🟢',
    color: '#30D158',
    title: 'Atlantic Canada is always in motion',
    body:  'Green figures moving along the routes are economic migrants — rural NB workers heading to Halifax, PEI residents crossing the Confederation Bridge to Moncton. This slow, invisible chain reaction is happening right now.',
    hint:  'Watch the green dots moving between Moncton, Halifax, Charlottetown, and St. John\'s.',
  },
  {
    icon:  '🏙️',
    color: '#0A84FF',
    title: 'Click any city to see its ecological health',
    body:  'Each Atlantic city tracks 6 infrastructure systems and an eco-score that degrades as population grows. Halifax absorbs most regional migrants — click it to see the pressure building on its land, water, and air systems.',
    hint:  'Click any glowing node on the map.',
  },
  {
    icon:  '⚡',
    color: '#FF375F',
    title: 'Trigger a disaster — watch the chain reaction',
    body:  'Hurricane Fiona 2022 devastated NL and NS. Select a city, open the Disasters tab, trigger a flood or wildfire. Watch refugees flood Halifax. When Halifax overloads, the cascade spreads further — that IS the chain reaction.',
    hint:  'Select a city → Disasters tab → trigger a flood or wildfire.',
  },
]

export function OnboardingOverlay({ onDismiss, onAutoPlay }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(13,17,23,0.82)', backdropFilter: 'blur(6px)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 28 }}
          className="w-full max-w-sm mx-4 rounded-2xl border overflow-hidden"
          style={{ background: '#0D1117', borderColor: '#21262D', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}
        >
          {/* Progress bar */}
          <div className="h-0.5 w-full" style={{ background: '#1a1f2e' }}>
            <motion.div
              className="h-full"
              style={{ background: current.color }}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>

          <div className="p-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-5">
              {STEPS.map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                     style={{ background: i <= step ? current.color : 'rgba(255,255,255,0.08)' }} />
              ))}
            </div>

            {/* Icon */}
            <div className="text-3xl mb-4">{current.icon}</div>

            {/* Content */}
            <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22 }}>
              <div className="text-[10px] font-mono uppercase tracking-widest mb-2"
                   style={{ color: current.color }}>
                Step {step + 1} of {STEPS.length}
              </div>
              <h3 className="text-base font-bold text-[#E6EDF3] mb-3 leading-snug">
                {current.title}
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed mb-4">
                {current.body}
              </p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono text-[#4B5563]"
                   style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: current.color }}>→</span>
                {current.hint}
              </div>
            </motion.div>

            {/* Actions */}
            <div className="flex gap-2 mt-5">
              {!isLast ? (
                <>
                  <button
                    onClick={() => setStep(s => s + 1)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background: current.color, color: '#0D1117' }}
                  >
                    Next →
                  </button>
                  <button
                    onClick={onDismiss}
                    className="px-4 py-2.5 rounded-xl text-xs text-[#4B5563] hover:text-[#8B949E] border border-[#21262D] transition-all"
                  >
                    Skip
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onAutoPlay}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff', boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                    Show me — auto-play demo
                  </button>
                  <button
                    onClick={onDismiss}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold border transition-all"
                    style={{ borderColor: `${current.color}40`, color: current.color }}
                  >
                    Got it
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

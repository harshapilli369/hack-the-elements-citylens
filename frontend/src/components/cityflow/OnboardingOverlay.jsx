import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  {
    icon:  '🟢',
    color: '#30D158',
    title: 'Atlantic Canada is in motion',
    body:  'Green figures moving along routes are economic migrants — NB workers heading to Halifax, PEI residents crossing to Moncton. This slow chain reaction is happening right now.',
    hint:  'Watch the dots moving between cities',
  },
  {
    icon:  '🏙️',
    color: '#0A84FF',
    title: 'Click a city to see its health',
    body:  'Every city tracks 6 infrastructure systems and an eco-score that degrades under population pressure. Halifax absorbs the most migrants.',
    hint:  'Click any glowing node on the map',
  },
  {
    icon:  '⚡',
    color: '#FF375F',
    title: 'Trigger a disaster',
    body:  'Select a city, open Disasters, and trigger a flood or wildfire. Watch refugees overwhelm Halifax — then the cascade spreads further.',
    hint:  'City → Disasters tab → trigger flood',
  },
]

export function OnboardingOverlay({ onDismiss, onAutoPlay }) {
  const [step, setStep] = useState(0)
  const cur   = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'absolute', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(7,8,15,0.78)', backdropFilter: 'blur(10px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.06, type: 'spring', stiffness: 280, damping: 28 }}
          style={{
            width: 360, margin: '0 16px',
            borderRadius: 24,
            background: '#0D1117',
            border: `1px solid rgba(255,255,255,0.08)`,
            boxShadow: `0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03)`,
            overflow: 'hidden',
          }}
        >
          {/* Thin top accent bar */}
          <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
            <motion.div
              style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: cur.color, borderRadius: 2 }}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Body */}
          <div style={{ padding: '32px 28px 28px', textAlign: 'center' }}>

            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 18, margin: '0 auto 20px',
              background: `${cur.color}12`,
              border: `1px solid ${cur.color}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
              boxShadow: `0 0 32px ${cur.color}18`,
            }}>
              {cur.icon}
            </div>

            {/* Step label */}
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: cur.color, marginBottom: 10 }}>
              Step {step + 1} of {STEPS.length}
            </div>

            {/* Title */}
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#E6EDF3', lineHeight: 1.3, marginBottom: 14, letterSpacing: '-0.4px' }}>
              {cur.title}
            </h3>

            {/* Body text */}
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: 13, color: 'rgba(245,245,247,0.45)', lineHeight: 1.7, marginBottom: 20 }}
              >
                {cur.body}
              </motion.p>
            </AnimatePresence>

            {/* Hint pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 30,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              marginBottom: 28,
            }}>
              <span style={{ color: cur.color, fontSize: 11, fontWeight: 700 }}>→</span>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(245,245,247,0.35)' }}>{cur.hint}</span>
            </div>

            {/* Step dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 22 }}>
              {STEPS.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width:      i === step ? 20 : 6,
                    background: i <= step ? cur.color : 'rgba(255,255,255,0.12)',
                    opacity:    i <= step ? 1 : 0.5,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ height: 6, borderRadius: 3 }}
                />
              ))}
            </div>

            {/* Buttons */}
            {!isLast ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setStep(s => s + 1)}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700,
                    background: cur.color, color: '#07080F',
                    boxShadow: `0 4px 18px ${cur.color}38`,
                    transition: 'filter 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                >
                  Next →
                </button>
                <button
                  onClick={onDismiss}
                  style={{
                    padding: '12px 18px', borderRadius: 12, cursor: 'pointer',
                    fontSize: 12, fontWeight: 500, color: 'rgba(245,245,247,0.30)',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.07)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(245,245,247,0.60)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,245,247,0.30)' }}
                >
                  Skip
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={onAutoPlay}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, color: '#fff',
                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                    boxShadow: '0 4px 24px rgba(239,68,68,0.30)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'filter 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.65)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  Auto-play demo
                </button>
                <button
                  onClick={onDismiss}
                  style={{
                    padding: '12px 18px', borderRadius: 12, cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    color: cur.color, background: `${cur.color}10`,
                    border: `1px solid ${cur.color}28`,
                    transition: 'filter 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

import React from 'react'
import { useCityFlowStore } from '../../store/cityflowStore'

const DRIVERS = [
  {
    key:   'economic',
    label: 'Economic',
    color: '#0A84FF',
    icon:  '💼',
    proxy: 'Stress differential between cities',
    why:   'Based on Stats Can LFS: ~55% of Atlantic interprovincial moves are job-driven. High stress = poor jobs + cost of living.',
  },
  {
    key:   'housing',
    label: 'Housing',
    color: '#BF5AF2',
    icon:  '🏠',
    proxy: 'Population density vs baseline',
    why:   'Halifax vacancy rate <1% since 2022. Overcrowding pushes residents toward less-dense cities.',
  },
  {
    key:   'climate',
    label: 'Climate & Lifestyle',
    color: '#30D158',
    icon:  '🌿',
    proxy: 'Eco-score differential',
    why:   'Long-term driver: people move toward better environmental quality. NL→mainland tied to resource-economy decline.',
  },
]

export function SimControls() {
  const { isRunning, speed, migrationWeights } = useCityFlowStore(state => state.sim)
  const cities           = useCityFlowStore(state => state.cities)
  const togglePlay       = useCityFlowStore(state => state.togglePlay)
  const setSpeed         = useCityFlowStore(state => state.setSpeed)
  const reset            = useCityFlowStore(state => state.reset)
  const setMigrationWeights = useCityFlowStore(state => state.setMigrationWeights)

  // Live per-driver pressure across all cities (average of all city-pair differentials)
  const livePressure = React.useMemo(() => {
    if (cities.length < 2) return { economic: 0, housing: 0, climate: 0 }
    let eSum = 0, hSum = 0, cSum = 0, n = 0
    for (let i = 0; i < cities.length; i++) {
      for (let j = 0; j < cities.length; j++) {
        if (i === j) continue
        const src = cities[i], dst = cities[j]
        eSum += Math.max(0, (src.stress - dst.stress) / 100)
        hSum += Math.max(0, (src.pop / src.basePop) - (dst.pop / dst.basePop))
        cSum += Math.max(0, ((dst.ecoScore ?? 100) - (src.ecoScore ?? 100)) / 100)
        n++
      }
    }
    return { economic: eSum / n, housing: hSum / n, climate: cSum / n }
  }, [cities])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Playback */}
      <Section label="Playback">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={togglePlay}
            style={{ flex: 1, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: isRunning ? 'rgba(255,55,95,0.10)' : 'rgba(48,209,88,0.10)', border: `1px solid ${isRunning ? 'rgba(255,55,95,0.25)' : 'rgba(48,209,88,0.25)'}`, color: isRunning ? '#FF375F' : '#30D158' }}>
            <span style={{ fontSize: 11 }}>{isRunning ? '⏸' : '▶'}</span>
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button onClick={reset}
            style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(245,245,247,0.50)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#F5F5F7' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(245,245,247,0.50)' }}>
            ↺ Reset
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(245,245,247,0.45)' }}>Simulation Speed</span>
          <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#0A84FF' }}>{speed.toFixed(1)}×</span>
        </div>
        <input type="range" min="0.5" max="3.0" step="0.5" value={speed}
          onChange={e => setSpeed(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#0A84FF', height: 3 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {['0.5×', '1×', '1.5×', '2×', '2.5×', '3×'].map(v => (
            <span key={v} style={{ fontSize: 9, color: 'rgba(245,245,247,0.20)', fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
          ))}
        </div>
      </Section>

      {/* Migration drivers */}
      <Section
        label="Migration Drivers"
        sub="In reality people move for compound reasons — all three factors act simultaneously. Adjust each weight to reflect current conditions."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DRIVERS.map(d => {
            const w     = migrationWeights[d.key] ?? 0
            const live  = livePressure[d.key] ?? 0
            const contribution = w * live   // how much this driver is currently adding
            return (
              <div key={d.key}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13 }}>{d.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: w > 0.1 ? d.color : 'rgba(245,245,247,0.35)', transition: 'color 0.2s' }}>{d.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {/* Live pressure indicator */}
                    <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: live > 0.15 ? d.color : 'rgba(245,245,247,0.20)', background: live > 0.15 ? `${d.color}12` : 'transparent', padding: '1px 5px', borderRadius: 4, border: `1px solid ${live > 0.15 ? `${d.color}30` : 'transparent'}`, transition: 'all 0.3s' }}>
                      {live > 0.01 ? `${(live * 100).toFixed(0)}% active` : 'idle'}
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: d.color, minWidth: 32, textAlign: 'right' }}>
                      {Math.round(w * 100)}%
                    </span>
                  </div>
                </div>

                {/* Weight slider */}
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={w}
                  onChange={e => setMigrationWeights({ [d.key]: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: d.color, height: 3, marginBottom: 5 }}
                />

                {/* Proxy label + contribution bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 9, color: 'rgba(245,245,247,0.22)', flex: 1 }}>{d.proxy}</span>
                  {/* Mini bar showing weighted live contribution */}
                  <div style={{ width: 48, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, contribution * 300)}%`, background: d.color, borderRadius: 2, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Combined modifier readout */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: 'rgba(245,245,247,0.30)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Combined flow modifier</span>
          <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#F5F5F7' }}>
            {(1 + DRIVERS.reduce((s, d) => s + (migrationWeights[d.key] ?? 0) * (livePressure[d.key] ?? 0) * (d.key === 'housing' ? 3 : 2.5), 0)).toFixed(2)}×
          </span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, paddingTop: 12, marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <LegendDot color="#30D158" label="Economic flow" />
          <LegendDot color="#0A84FF" label="Disaster / cascade" />
        </div>
      </Section>

    </div>
  )
}

function Section({ label, sub, children }) {
  return (
    <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.30)', marginBottom: sub ? 4 : 12 }}>{label}</div>
      {sub && <p style={{ fontSize: 11, color: 'rgba(245,245,247,0.30)', lineHeight: 1.55, marginBottom: 14 }}>{sub}</p>}
      {children}
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, opacity: 0.8 }} />
      <span style={{ fontSize: 10, color: 'rgba(245,245,247,0.30)', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

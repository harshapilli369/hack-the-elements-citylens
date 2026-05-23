import React from 'react'
import { useCityFlowStore } from '../../store/cityflowStore'

const PRESSURES = [
  { id: 'economic_opportunity',  label: 'Economic Opportunity',  sub: 'Fast · high volume',    color: '#0A84FF' },
  { id: 'housing_affordability', label: 'Housing Affordability', sub: 'Moderate · market-driven', color: '#BF5AF2' },
  { id: 'climate_amenity',       label: 'Climate & Lifestyle',   sub: 'Slow · deliberate',     color: '#30D158' },
]

export function SimControls() {
  const { isRunning, speed, migrationPressure } = useCityFlowStore(state => state.sim)
  const togglePlay           = useCityFlowStore(state => state.togglePlay)
  const setSpeed             = useCityFlowStore(state => state.setSpeed)
  const reset                = useCityFlowStore(state => state.reset)
  const setMigrationPressure = useCityFlowStore(state => state.setMigrationPressure)

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

        {/* Speed slider */}
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

      {/* Background migration */}
      <Section label="Background Migration"
        sub="Even without disasters, people migrate constantly. This slow drift creates cumulative ecological pressure — the invisible chain reaction.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {PRESSURES.map(p => {
            const active = migrationPressure === p.id
            return (
              <button key={p.id} onClick={() => setMigrationPressure(p.id)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${active ? `${p.color}35` : 'rgba(255,255,255,0.07)'}`, background: active ? `${p.color}08` : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.16s', display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Radio dot */}
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${active ? p.color : 'rgba(255,255,255,0.20)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.16s' }}>
                  {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? p.color : 'rgba(245,245,247,0.55)', letterSpacing: '-0.2px', transition: 'color 0.16s' }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(245,245,247,0.25)', marginTop: 1 }}>{p.sub}</div>
                </div>
              </button>
            )
          })}
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

import React, { useState } from 'react'
import { useCityFlowStore } from '../../store/cityflowStore'

const DISASTERS = [
  { id: 'wildfire',  name: 'Wildfire',  icon: '🔥', color: '#FF9F0A', hits: ['Air Quality', 'Health', 'Waste'],     description: 'Destroys air quality, forces mass evacuation. Smoke causes cascading health collapse.' },
  { id: 'flood',     name: 'Flood',     icon: '🌊', color: '#0A84FF', hits: ['Water', 'Housing', 'Waste'],           description: 'Contaminates water supply, destroys housing. Infrastructure submerged within hours.' },
  { id: 'conflict',  name: 'Conflict',  icon: '⚔️', color: '#FF375F', hits: ['Housing', 'Health', 'Energy'],        description: 'Immediate collapse across all systems. Mass displacement begins instantly.' },
  { id: 'heatwave',  name: 'Heatwave',  icon: '☀️', color: '#FFD60A', hits: ['Health', 'Energy', 'Water'],          description: 'Spikes energy demand, causes health emergencies. Water evaporation accelerates.' },
  { id: 'drought',   name: 'Drought',   icon: '🏜️', color: '#FF9F0A', hits: ['Water', 'Health', 'Waste'],           description: 'Slow water depletion — long-term food and health crisis without dramatic onset.' },
]

const SEVERITY_LABELS = {
  1: { label: 'Minor',        sublabel: 'Localised incident, low displacement' },
  2: { label: 'Moderate',     sublabel: 'District-level impact, partial evacuation' },
  3: { label: 'Regional',     sublabel: 'City-wide emergency, mass displacement' },
  4: { label: 'Major',        sublabel: 'Infrastructure failure, forced evacuation' },
  5: { label: 'Catastrophic', sublabel: 'Total collapse, entire city displaced' },
}

const AFFECTED_OPTIONS = [
  { value: 25,  label: '25%',  sublabel: 'Partial district' },
  { value: 50,  label: '50%',  sublabel: 'Half the city' },
  { value: 75,  label: '75%',  sublabel: 'Most of city' },
  { value: 100, label: '100%', sublabel: 'Entire city' },
]

const DURATION_OPTIONS = [
  { value: 400,  label: 'Short',  sublabel: '3–5 days' },
  { value: 1000, label: 'Medium', sublabel: '1–2 weeks' },
  { value: 2000, label: 'Long',   sublabel: '1+ month' },
]

const stressColor = (s) => s > 75 ? '#FF375F' : s > 55 ? '#FF9F0A' : s > 35 ? '#FFD60A' : '#30D158'

// Estimate total displaced given current city pop + inputs
function estimateDisplaced(pop, disasterType, severity, affectedPct) {
  const RATES = { wildfire: 0.30, flood: 0.20, conflict: 0.45, heatwave: 0.05, drought: 0.08 }
  const rate  = RATES[disasterType] || 0.15
  return Math.round(pop * (affectedPct / 100) * rate * (severity / 3))
}

export function DisasterTriggers() {
  const selectedCityId  = useCityFlowStore(state => state.sim.selectedCity)
  const cities          = useCityFlowStore(state => state.cities)
  const triggerDisaster = useCityFlowStore(state => state.triggerDisaster)

  const [pendingType, setPendingType] = useState(null)
  const [severity,    setSeverity]    = useState(3)
  const [affectedPct, setAffectedPct] = useState(75)
  const [duration,    setDuration]    = useState(1000)

  const selectedCity = cities.find(c => c.id === selectedCityId)
  const hasActive    = selectedCity?.isDisasterActive
  const disaster     = DISASTERS.find(d => d.id === pendingType)

  function selectType(id) {
    if (pendingType === id) { setPendingType(null); return }
    setPendingType(id)
    setSeverity(3)
    setAffectedPct(75)
    setDuration(1000)
  }

  function confirmTrigger() {
    if (!selectedCityId || !pendingType) return
    triggerDisaster(selectedCityId, pendingType, { severity, affectedPct, duration })
    setPendingType(null)
  }

  const estimated = selectedCity && pendingType
    ? estimateDisplaced(selectedCity.pop, pendingType, severity, affectedPct)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Target city */}
      <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)', marginBottom: 8 }}>Target City</div>
        {selectedCity ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: stressColor(selectedCity.stress), boxShadow: `0 0 8px ${stressColor(selectedCity.stress)}` }} />
              <span style={{ fontWeight: 600, fontSize: 14, color: '#F5F5F7', letterSpacing: '-0.2px' }}>{selectedCity.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: stressColor(selectedCity.stress), fontWeight: 600 }}>{Math.round(selectedCity.stress)}%</span>
              {hasActive && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: '#FF375F', background: 'rgba(255,55,95,0.10)', border: '1px solid rgba(255,55,95,0.25)', padding: '2px 7px', borderRadius: 5, animation: 'dangerPulse 1.5s infinite' }}>ACTIVE</span>}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(245,245,247,0.15)' }} />
            <span style={{ fontSize: 13, color: 'rgba(245,245,247,0.28)' }}>Click a city on the map</span>
          </div>
        )}
      </div>

      {/* Disaster type list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {DISASTERS.map(d => {
          const selected = pendingType === d.id
          const disabled = !selectedCityId || hasActive
          return (
            <button
              key={d.id}
              disabled={disabled}
              onClick={() => { if (!disabled) selectType(d.id) }}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 12,
                border: `1px solid ${selected ? `${d.color}60` : 'rgba(255,255,255,0.07)'}`,
                background: selected ? `${d.color}12` : 'rgba(255,255,255,0.02)',
                opacity: disabled ? 0.35 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.16s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, filter: selected ? `drop-shadow(0 0 6px ${d.color})` : 'none', transition: 'filter 0.16s' }}>{d.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: selected ? d.color : '#F5F5F7', letterSpacing: '-0.2px', transition: 'color 0.16s' }}>{d.name}</span>
                    <span style={{ fontSize: 12, color: selected ? d.color : 'rgba(245,245,247,0.20)', transition: 'all 0.16s' }}>{selected ? '▲' : '→'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {d.hits.map(h => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 500, color: d.color, background: `${d.color}10`, border: `1px solid ${d.color}20`, padding: '1px 6px', borderRadius: 5 }}>{h}</span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Config panel — shown when a disaster type is selected */}
      {pendingType && disaster && selectedCity && (
        <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${disaster.color}25`, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Severity */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.35)' }}>Severity</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: disaster.color }}>{SEVERITY_LABELS[severity].label}</span>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setSeverity(n)}
                  style={{
                    flex: 1, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: n <= severity ? disaster.color : 'rgba(255,255,255,0.07)',
                    opacity: n <= severity ? (0.4 + n * 0.12) : 0.4,
                    transition: 'all 0.12s',
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(245,245,247,0.28)', marginTop: 5 }}>{SEVERITY_LABELS[severity].sublabel}</div>
          </div>

          {/* Affected population */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.35)', marginBottom: 8 }}>Affected Population</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {AFFECTED_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAffectedPct(opt.value)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 7,
                    border: `1px solid ${affectedPct === opt.value ? disaster.color : 'rgba(255,255,255,0.07)'}`,
                    background: affectedPct === opt.value ? `${disaster.color}15` : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: affectedPct === opt.value ? disaster.color : '#F5F5F7' }}>{opt.label}</div>
                  <div style={{ fontSize: 9, color: 'rgba(245,245,247,0.30)', marginTop: 1 }}>{opt.sublabel}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.35)', marginBottom: 8 }}>Duration</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 7,
                    border: `1px solid ${duration === opt.value ? disaster.color : 'rgba(255,255,255,0.07)'}`,
                    background: duration === opt.value ? `${disaster.color}15` : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: duration === opt.value ? disaster.color : '#F5F5F7' }}>{opt.label}</div>
                  <div style={{ fontSize: 9, color: 'rgba(245,245,247,0.30)', marginTop: 1 }}>{opt.sublabel}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Estimated displacement + confirm */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(245,245,247,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Est. displaced</span>
              <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: disaster.color }}>
                ~{estimated >= 1000 ? `${(estimated / 1000).toFixed(1)}k` : estimated}
              </span>
            </div>
            <button
              onClick={confirmTrigger}
              style={{
                width: '100%', padding: '10px', borderRadius: 9,
                border: `1px solid ${disaster.color}50`,
                background: `${disaster.color}20`,
                color: disaster.color, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', letterSpacing: '-0.2px',
                transition: 'all 0.16s',
              }}
            >
              Trigger {disaster.name} {disaster.icon}
            </button>
          </div>
        </div>
      )}

      {hasActive && (
        <p style={{ fontSize: 11, color: 'rgba(245,245,247,0.25)', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', paddingTop: 4 }}>
          Waiting for disaster to subside…
        </p>
      )}
    </div>
  )
}

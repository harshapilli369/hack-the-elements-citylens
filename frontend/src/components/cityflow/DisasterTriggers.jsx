import { useState } from 'react'
import { useCityFlowStore } from '../../store/cityflowStore'

/* ── Categorized triggers ─────────────────────────────────────────────────── */
const TRIGGER_CATEGORIES = [
  {
    id: 'water',
    label: 'Water-Based Triggers',
    icon: '💧',
    color: '#0A84FF',
    triggers: [
      { id: 'flood',               name: 'Flood',               icon: '🌊', color: '#0A84FF', hits: ['Water', 'Housing', 'Waste'],   description: 'Contaminates water supply, destroys housing. Infrastructure submerged within hours.' },
      { id: 'water_scarcity',      name: 'Water Scarcity',      icon: '🏜️', color: '#64D2FF', hits: ['Water', 'Health', 'Energy'],   description: 'Chronic depletion of freshwater reserves. Agriculture collapses, rationing begins.' },
      { id: 'water_contamination', name: 'Water Contamination', icon: '☠️', color: '#5E5CE6', hits: ['Water', 'Health', 'Waste'],    description: 'Toxic runoff or chemical spill poisons the water table. Mass illness follows.' },
    ],
  },
  {
    id: 'air',
    label: 'Air-Based Triggers',
    icon: '🌬️',
    color: '#FF9F0A',
    triggers: [
      { id: 'wildfire',              name: 'Wildfire',              icon: '🔥', color: '#FF9F0A', hits: ['Air Quality', 'Health', 'Waste'],   description: 'Destroys air quality, forces mass evacuation. Smoke causes cascading health collapse.' },
      { id: 'heatwave',             name: 'Heatwave',             icon: '☀️', color: '#FFD60A', hits: ['Health', 'Energy', 'Water'],        description: 'Spikes energy demand, causes health emergencies. Water evaporation accelerates.' },
      { id: 'air_pollution_crisis', name: 'Air Pollution Crisis', icon: '🏭', color: '#AC8E68', hits: ['Air Quality', 'Health', 'Energy'],  description: 'Industrial emissions or inversion layer traps smog. Respiratory emergencies surge.' },
    ],
  },
  {
    id: 'land',
    label: 'Land-Based Triggers',
    icon: '🌍',
    color: '#30D158',
    triggers: [
      { id: 'earthquake',        name: 'Earthquake',        icon: '🌋', color: '#FF375F', hits: ['Housing', 'Health', 'Energy'],   description: 'Seismic shock collapses buildings and ruptures utilities. Instant mass displacement.' },
      { id: 'landslide',         name: 'Landslides',        icon: '⛰️', color: '#A1845E', hits: ['Housing', 'Waste', 'Health'],    description: 'Rain-saturated slopes collapse onto roads and settlements. Communities are cut off.' },
      { id: 'soil_degradation',  name: 'Soil Degradation',  icon: '🌾', color: '#8E8E93', hits: ['Health', 'Water', 'Waste'],      description: 'Long-term erosion and nutrient loss. Food systems fail, famine pressure builds.' },
    ],
  },
]

const DISASTERS = TRIGGER_CATEGORIES.flatMap(cat => cat.triggers)

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

  const [hoveredId, setHoveredId]     = useState(null)
  const [openCats, setOpenCats]       = useState({ water: true, air: false, land: false })

  const selectedCity = cities.find(c => c.id === selectedCityId)
  // Block all triggers while ANY city has an active disaster — one event at a time
  const anyActive    = cities.some(c => c.isDisasterActive)
  const activeCity   = cities.find(c => c.isDisasterActive)
  const disaster     = DISASTERS.find(d => d.id === pendingType)

  const toggleCat = (catId) =>
    setOpenCats(prev => ({ ...prev, [catId]: !prev[catId] }))

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

      {/* ── Section heading ─────────────────────────────────────────────── */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(245,245,247,0.35)',
        padding: '4px 2px 2px',
      }}>
        Triggers
      </div>

      {/* ── Target city ─────────────────────────────────────────────────── */}
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
              {selectedCity?.isDisasterActive && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: '#FF375F', background: 'rgba(255,55,95,0.10)', border: '1px solid rgba(255,55,95,0.25)', padding: '2px 7px', borderRadius: 5, animation: 'dangerPulse 1.5s infinite' }}>ACTIVE</span>}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(245,245,247,0.15)' }} />
            <span style={{ fontSize: 13, color: 'rgba(245,245,247,0.28)' }}>Click a city on the map</span>
          </div>
        )}
      </div>

      {/* ── Categorized trigger list ────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {TRIGGER_CATEGORIES.map(cat => {
          const isOpen = !!openCats[cat.id]
          return (
            <div key={cat.id} style={{
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.02)',
              overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}>
              {/* Category header — clickable toggle */}
              <button
                onClick={() => toggleCat(cat.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{cat.icon}</span>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: cat.color,
                    letterSpacing: '-0.1px',
                  }}>
                    {cat.label}
                  </span>
                </div>
                {/* Dropdown chevron */}
                <span style={{
                  fontSize: 10,
                  color: 'rgba(245,245,247,0.30)',
                  transition: 'transform 0.25s ease',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                }}>
                  ▼
                </span>
              </button>

              {/* Collapsible trigger items */}
              <div style={{
                maxHeight: isOpen ? 600 : 0,
                opacity: isOpen ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.3s ease, opacity 0.25s ease',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0 6px 8px' }}>
                  {cat.triggers.map(d => {
                    const selected = pendingType === d.id
                    const hovered  = hoveredId === d.id
                    const disabled = !selectedCityId || anyActive
                    return (
                      <button
                        key={d.id}
                        disabled={disabled}
                        onClick={() => { if (!disabled) selectType(d.id) }}
                        onMouseEnter={() => setHoveredId(d.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 10,
                          border: `1px solid ${selected ? `${d.color}60` : (hovered && !disabled ? `${d.color}35` : 'rgba(255,255,255,0.05)')}`,
                          background: selected ? `${d.color}12` : (hovered && !disabled ? `${d.color}08` : 'rgba(255,255,255,0.01)'),
                          opacity: disabled ? 0.35 : 1,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.16s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                          {/* Icon */}
                          <span style={{
                            fontSize: 16,
                            lineHeight: 1,
                            flexShrink: 0,
                            marginTop: 1,
                            filter: selected || (hovered && !disabled) ? `drop-shadow(0 0 6px ${d.color})` : 'none',
                            transition: 'filter 0.16s',
                          }}>{d.icon}</span>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: (selected || (hovered && !disabled)) ? 5 : 3 }}>
                              <span style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: selected || (hovered && !disabled) ? d.color : '#F5F5F7',
                                letterSpacing: '-0.2px',
                                transition: 'color 0.16s',
                              }}>{d.name}</span>
                              <span style={{
                                fontSize: 12,
                                color: selected || (hovered && !disabled) ? d.color : 'rgba(245,245,247,0.20)',
                                transition: 'all 0.16s',
                                transform: selected || (hovered && !disabled) ? 'translateX(2px)' : 'none',
                              }}>{selected ? '▲' : '→'}</span>
                            </div>
                            {(selected || (hovered && !disabled)) ? (
                              <p style={{ fontSize: 10, color: 'rgba(245,245,247,0.40)', lineHeight: 1.5, margin: 0 }}>{d.description}</p>
                            ) : (
                              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                {d.hits.map(h => (
                                  <span key={h} style={{ fontSize: 9, fontWeight: 500, color: d.color, background: `${d.color}10`, border: `1px solid ${d.color}20`, padding: '1px 5px', borderRadius: 4 }}>{h}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Config panel — shown when a disaster type is selected and no event is running */}
      {pendingType && disaster && selectedCity && !anyActive && (
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

      {anyActive && (
        <p style={{ fontSize: 11, color: 'rgba(245,245,247,0.25)', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', paddingTop: 4 }}>
          {activeCity ? `${activeCity.name} event in progress — wait for it to subside` : 'Event in progress — wait for it to subside'}
        </p>
      )}
    </div>
  )
}

import React, { useState } from 'react'
import { useCityFlowStore } from '../../store/cityflowStore'

const DISASTERS = [
  { id: 'wildfire',  name: 'Wildfire',  icon: '🔥', color: '#FF9F0A', hits: ['Air Quality', 'Health', 'Waste'],     description: 'Destroys air quality, forces mass evacuation. Smoke causes cascading health collapse.' },
  { id: 'flood',     name: 'Flood',     icon: '🌊', color: '#0A84FF', hits: ['Water', 'Housing', 'Waste'],           description: 'Contaminates water supply, destroys housing. Infrastructure submerged within hours.' },
  { id: 'conflict',  name: 'Conflict',  icon: '⚔️', color: '#FF375F', hits: ['Housing', 'Health', 'Energy'],        description: 'Immediate collapse across all systems. Mass displacement begins instantly.' },
  { id: 'heatwave',  name: 'Heatwave',  icon: '☀️', color: '#FFD60A', hits: ['Health', 'Energy', 'Water'],          description: 'Spikes energy demand, causes health emergencies. Water evaporation accelerates.' },
  { id: 'drought',   name: 'Drought',   icon: '🏜️', color: '#FF9F0A', hits: ['Water', 'Health', 'Waste'],           description: 'Slow water depletion — long-term food and health crisis without dramatic onset.' },
]

const stressColor = (s) => s > 75 ? '#FF375F' : s > 55 ? '#FF9F0A' : s > 35 ? '#FFD60A' : '#30D158'

export function DisasterTriggers() {
  const selectedCityId  = useCityFlowStore(state => state.sim.selectedCity)
  const cities          = useCityFlowStore(state => state.cities)
  const triggerDisaster = useCityFlowStore(state => state.triggerDisaster)
  const [hoveredId, setHoveredId] = useState(null)

  const selectedCity    = cities.find(c => c.id === selectedCityId)
  const hasActive       = selectedCity?.isDisasterActive

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

      {/* Disaster list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {DISASTERS.map(d => {
          const hovered  = hoveredId === d.id
          const disabled = !selectedCityId || hasActive
          return (
            <button
              key={d.id}
              disabled={disabled}
              onClick={() => { if (!disabled) triggerDisaster(selectedCityId, d.id) }}
              onMouseEnter={() => setHoveredId(d.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 12,
                border: `1px solid ${hovered && !disabled ? `${d.color}35` : 'rgba(255,255,255,0.07)'}`,
                background: hovered && !disabled ? `${d.color}08` : 'rgba(255,255,255,0.02)',
                opacity: disabled ? 0.35 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.16s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Icon */}
                <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1, filter: hovered && !disabled ? `drop-shadow(0 0 6px ${d.color})` : 'none', transition: 'filter 0.16s' }}>{d.icon}</span>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hovered && !disabled ? 6 : 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: hovered && !disabled ? d.color : '#F5F5F7', letterSpacing: '-0.2px', transition: 'color 0.16s' }}>{d.name}</span>
                    <span style={{ fontSize: 13, color: hovered && !disabled ? d.color : 'rgba(245,245,247,0.20)', transition: 'all 0.16s', transform: hovered && !disabled ? 'translateX(2px)' : 'none' }}>→</span>
                  </div>
                  {hovered && !disabled ? (
                    <p style={{ fontSize: 11, color: 'rgba(245,245,247,0.40)', lineHeight: 1.5 }}>{d.description}</p>
                  ) : (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {d.hits.map(h => (
                        <span key={h} style={{ fontSize: 10, fontWeight: 500, color: d.color, background: `${d.color}10`, border: `1px solid ${d.color}20`, padding: '1px 6px', borderRadius: 5 }}>{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {hasActive && (
        <p style={{ fontSize: 11, color: 'rgba(245,245,247,0.25)', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', paddingTop: 4 }}>
          Waiting for disaster to subside…
        </p>
      )}
    </div>
  )
}

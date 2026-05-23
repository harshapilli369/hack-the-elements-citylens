import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCityFlowStore } from '../../store/cityflowStore'
import { ResourceMeter } from './ResourceMeter'
import { CityChart } from './CityChart'

const ecoColor = (s) => s > 80 ? '#30D158' : s > 60 ? '#FFD60A' : s > 40 ? '#FF9F0A' : '#FF375F'
const ecoLabel = (s) => s > 80 ? 'Thriving' : s > 60 ? 'Degraded' : s > 40 ? 'At Risk' : 'Collapsing'

function ecoStory(city) {
  const eco       = city.ecoScore ?? 100
  const popExcess = (city.pop - city.basePop) / city.basePop
  const lost      = 100 - eco
  if (city.isDisasterActive)  return `Active ${city.disasterType} is destroying habitat and generating toxic waste. Eco-health dropping rapidly.`
  if (popExcess > 0.3)        return `${Math.round(popExcess * 100)}% population surge converting surrounding land for housing. Urban sprawl compressing the carbon footprint.`
  if (popExcess > 0.05)       return `Incoming migration adding gradual pressure on land use and water systems. Every new resident adds ~0.08 ha of urban footprint.`
  if (popExcess < -0.1)       return `Population below baseline. Abandoned land beginning to rewild — eco-health recovering slowly.`
  if (lost > 20)              return `Eco-health has dropped ${Math.round(lost)} points from sustained in-migration. Carbon footprint and habitat loss accumulating.`
  return `City in ecological equilibrium. Economic migration creating slow, steady land-use pressure.`
}

const stressColor = (s) => s > 75 ? '#FF375F' : s > 55 ? '#FF9F0A' : s > 35 ? '#FFD60A' : '#30D158'

const RESOURCES = [
  { key: 'housing', label: 'Housing', icon: '🏠' },
  { key: 'water',   label: 'Water',   icon: '💧' },
  { key: 'waste',   label: 'Waste',   icon: '🗑️' },
  { key: 'air',     label: 'Air',     icon: '💨' },
  { key: 'health',  label: 'Health',  icon: '🏥' },
  { key: 'energy',  label: 'Energy',  icon: '⚡' },
]

export function CityDetailView() {
  const selectedCityId = useCityFlowStore(state => state.sim.selectedCity)
  const selectCity     = useCityFlowStore(state => state.selectCity)
  const cities         = useCityFlowStore(state => state.cities)
  const city           = cities.find(c => c.id === selectedCityId)

  return (
    <AnimatePresence>
      {city && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
        >
          {/* Header */}
          <div style={{ padding: '14px 14px 12px', borderRadius: '14px 14px 0 0', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none', position: 'relative' }}>
            <button onClick={() => selectCity(null)}
              style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: 'rgba(245,245,247,0.40)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#F5F5F7' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(245,245,247,0.40)' }}>
              ✕
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F5F5F7', letterSpacing: '-0.5px' }}>{city.name}</h2>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 6,
                color:       city.status === 'critical' ? '#FF375F' : city.status === 'stressed' ? '#FF9F0A' : city.status === 'warning' ? '#FFD60A' : '#30D158',
                background:  city.status === 'critical' ? 'rgba(255,55,95,0.10)' : city.status === 'stressed' ? 'rgba(255,159,10,0.10)' : city.status === 'warning' ? 'rgba(255,214,10,0.10)' : 'rgba(48,209,88,0.10)',
                border:      city.status === 'critical' ? '1px solid rgba(255,55,95,0.25)' : city.status === 'stressed' ? '1px solid rgba(255,159,10,0.25)' : city.status === 'warning' ? '1px solid rgba(255,214,10,0.25)' : '1px solid rgba(48,209,88,0.25)',
              }}>{city.status.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(245,245,247,0.35)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ color: 'rgba(245,245,247,0.65)' }}>{(city.pop / 1000).toFixed(1)}k</span>
              <span>·</span>
              <span>base {(city.basePop / 1000).toFixed(0)}k</span>
              <span>·</span>
              {city.pop > city.basePop
                ? <span style={{ color: '#FF9F0A' }}>+{((city.pop - city.basePop) / 1000).toFixed(1)}k in-migrants</span>
                : city.pop < city.basePop
                  ? <span style={{ color: '#0A84FF' }}>{((city.basePop - city.pop) / 1000).toFixed(1)}k departed</span>
                  : <span>at baseline</span>}
            </div>
          </div>

          {/* Infrastructure */}
          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderTop: 'none', borderBottom: 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)', marginBottom: 12 }}>Infrastructure Stress</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
              {RESOURCES.map(r => (
                <ResourceMeter key={r.key} label={r.label} icon={r.icon} value={city.resources[r.key]} />
              ))}
            </div>
          </div>

          {/* Eco health */}
          <div style={{ padding: '14px', background: `${ecoColor(city.ecoScore ?? 100)}05`, border: '1px solid rgba(255,255,255,0.07)', borderTop: `1px solid ${ecoColor(city.ecoScore ?? 100)}18`, borderBottom: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12 }}>🌿</span>
                <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)' }}>Ecological Health</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: ecoColor(city.ecoScore ?? 100), letterSpacing: '-0.5px' }}>{Math.round(city.ecoScore ?? 100)}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: ecoColor(city.ecoScore ?? 100), background: `${ecoColor(city.ecoScore ?? 100)}14`, padding: '2px 7px', borderRadius: 5 }}>{ecoLabel(city.ecoScore ?? 100)}</span>
              </div>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${city.ecoScore ?? 100}%`, background: ecoColor(city.ecoScore ?? 100), borderRadius: 2, transition: 'width 0.8s ease', boxShadow: `0 0 8px ${ecoColor(city.ecoScore ?? 100)}55` }} />
            </div>
            <p style={{ fontSize: 11, color: 'rgba(245,245,247,0.38)', lineHeight: 1.6, marginBottom: 10 }}>{ecoStory(city)}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
              <MicroStat label="Land Pressure" value={`${Math.max(0, ((city.pop - city.basePop) * 0.08)).toFixed(0)} ha`} />
              <MicroStat label="Eco Lost" value={`${Math.round(100 - (city.ecoScore ?? 100))} pts`} color={ecoColor(city.ecoScore ?? 100)} center />
              <MicroStat label="Recovery" value={city.pop < city.basePop ? 'Active' : 'Paused'} right />
            </div>
          </div>

          {/* Chart */}
          <div style={{ borderRadius: '0 0 14px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderTop: 'none', overflow: 'hidden' }}>
            <CityChart city={city} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MicroStat({ label, value, color, center, right }) {
  return (
    <div style={{ textAlign: center ? 'center' : right ? 'right' : 'left', borderLeft: center ? '1px solid rgba(255,255,255,0.06)' : 'none', borderRight: center ? '1px solid rgba(255,255,255,0.06)' : 'none', padding: '0 8px' }}>
      <div style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(245,245,247,0.25)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: color || 'rgba(245,245,247,0.55)' }}>{value}</div>
    </div>
  )
}

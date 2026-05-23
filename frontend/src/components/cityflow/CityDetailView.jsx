import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCityFlowStore } from '../../store/cityflowStore'
import { CityChart } from './CityChart'
import { useRealtimeData, aqiBand, weatherDesc } from '../../store/realtimeStore'

const ecoColor = (s) => s > 80 ? '#30D158' : s > 60 ? '#FFD60A' : s > 40 ? '#FF9F0A' : '#FF375F'
const ecoLabel = (s) => s > 80 ? 'Thriving' : s > 60 ? 'Degraded' : s > 40 ? 'At Risk' : 'Collapsing'

function ecoStory(city) {
  const eco       = city.ecoScore ?? 100
  const popExcess = (city.pop - city.basePop) / city.basePop
  const lost      = 100 - eco
  if (city.isDisasterActive)  return `Active ${city.disasterType} is destroying habitat and generating toxic waste.`
  if (popExcess > 0.3)        return `${Math.round(popExcess * 100)}% population surge converting surrounding land for housing.`
  if (popExcess > 0.05)       return `Incoming migration adding gradual pressure on land use and water systems.`
  if (popExcess < -0.1)       return `Population below baseline — abandoned land beginning to rewild.`
  if (lost > 20)              return `${Math.round(lost)} pts lost from sustained in-migration. Habitat loss accumulating.`
  return `City in ecological equilibrium. Migration creating slow, steady land-use pressure.`
}

const RESOURCES = [
  { key: 'housing', label: 'Housing', icon: '🏠' },
  { key: 'water',   label: 'Water',   icon: '💧' },
  { key: 'waste',   label: 'Waste',   icon: '🗑️' },
  { key: 'air',     label: 'Air',     icon: '💨' },
  { key: 'health',  label: 'Health',  icon: '🏥' },
  { key: 'energy',  label: 'Energy',  icon: '⚡' },
]

const statusColors = {
  critical: { text: '#FF375F', bg: 'rgba(255,55,95,0.10)',  border: 'rgba(255,55,95,0.25)' },
  stressed: { text: '#FF9F0A', bg: 'rgba(255,159,10,0.10)', border: 'rgba(255,159,10,0.25)' },
  warning:  { text: '#FFD60A', bg: 'rgba(255,214,10,0.10)', border: 'rgba(255,214,10,0.25)' },
  healthy:  { text: '#30D158', bg: 'rgba(48,209,88,0.10)',  border: 'rgba(48,209,88,0.25)' },
}

export function CityDetailView() {
  const selectedCityId = useCityFlowStore(state => state.sim.selectedCity)
  const selectCity     = useCityFlowStore(state => state.selectCity)
  const cities         = useCityFlowStore(state => state.cities)
  const city           = cities.find(c => c.id === selectedCityId)
  const { data: realtime } = useRealtimeData()
  const liveCity = realtime?.cities?.[selectedCityId]
  const [showChart, setShowChart] = useState(true)

  if (!city) return null

  const sc = statusColors[city.status] || statusColors.healthy
  const eco = city.ecoScore ?? 100
  const popDiff = city.pop - city.basePop
  const aqi = liveCity ? aqiBand(liveCity.aqi) : null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >

        {/* ── Header card ─────────────────────────────────────────── */}
        <div style={{ padding: '14px 14px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
          <button
            onClick={() => selectCity(null)}
            style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: 'rgba(245,245,247,0.40)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#F5F5F7' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(245,245,247,0.40)' }}>
            ✕
          </button>

          {/* City name + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingRight: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F5F5F7', letterSpacing: '-0.5px', margin: 0 }}>{city.name}</h2>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 6, color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}>
              {city.status.toUpperCase()}
            </span>
          </div>

          {/* Population strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'rgba(255,255,255,0.03)', borderRadius: 9, overflow: 'hidden' }}>
            <PopStat label="Population" value={`${(city.pop / 1000).toFixed(1)}k`} />
            <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.07)' }} />
            <PopStat label="Baseline" value={`${(city.basePop / 1000).toFixed(0)}k`} />
            <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.07)' }} />
            <PopStat
              label={popDiff > 0 ? 'In-migrants' : popDiff < 0 ? 'Departed' : 'Change'}
              value={popDiff === 0 ? '—' : `${popDiff > 0 ? '+' : ''}${(popDiff / 1000).toFixed(1)}k`}
              color={popDiff > 0 ? '#FF9F0A' : popDiff < 0 ? '#0A84FF' : undefined}
            />
          </div>
        </div>

        {/* ── Live weather card ────────────────────────────────────── */}
        {liveCity && (
          <div style={{ borderRadius: 12, background: 'rgba(10,132,255,0.05)', border: '1px solid rgba(10,132,255,0.12)', overflow: 'hidden' }}>
            {/* Live badge row */}
            <div style={{ padding: '8px 12px 6px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 20, background: 'rgba(48,209,88,0.12)', border: '1px solid rgba(48,209,88,0.30)' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#30D158', display: 'inline-block', animation: 'dangerPulse 1.5s infinite' }} />
                <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.08em', color: '#30D158' }}>LIVE</span>
              </div>
              <span style={{ fontSize: 10, color: 'rgba(245,245,247,0.35)', fontWeight: 500 }}>Current conditions</span>
            </div>

            {/* Weather stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: liveCity.sea_surface_temp_c != null ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 0 }}>
              {liveCity.temperature_c != null && (
                <WeatherCell icon="🌡" main={`${liveCity.temperature_c}°C`} sub={weatherDesc(liveCity.weather_code)} />
              )}
              {liveCity.wind_kmh != null && (
                <WeatherCell icon="💨" main={`${liveCity.wind_kmh}`} sub="km/h wind" />
              )}
              {liveCity.pm25 != null && (
                <WeatherCell icon="🌫" main={`PM₂.₅ ${liveCity.pm25}`} sub={aqi?.label || 'AQI'} color={aqi?.color} />
              )}
              {liveCity.sea_surface_temp_c != null && (
                <WeatherCell icon="🌊" main={`${liveCity.sea_surface_temp_c}°C`} sub="sea surface" />
              )}
            </div>
          </div>
        )}

        {/* ── Infrastructure Stress card ───────────────────────────── */}
        <div style={{ borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <SectionHeader icon="⚙️" label="Infrastructure Stress" />
          <div style={{ padding: '10px 12px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
            {RESOURCES.map(r => (
              <StressMeter key={r.key} label={r.label} icon={r.icon} value={city.resources[r.key]} />
            ))}
          </div>
        </div>

        {/* ── Ecological Health card ───────────────────────────────── */}
        <div style={{ borderRadius: 12, background: `${ecoColor(eco)}05`, border: `1px solid ${ecoColor(eco)}18`, overflow: 'hidden' }}>
          <SectionHeader icon="🌿" label="Ecological Health" />
          <div style={{ padding: '0 12px 12px' }}>
            {/* Score row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: ecoColor(eco), letterSpacing: '-2px', lineHeight: 1 }}>
                {Math.round(eco)}
              </span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: ecoColor(eco) }}>{ecoLabel(eco)}</div>
                <div style={{ fontSize: 10, color: 'rgba(245,245,247,0.30)', marginTop: 1 }}>out of 100</div>
              </div>
              {/* Bar fills remaining space */}
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', alignSelf: 'center' }}>
                <div style={{ height: '100%', width: `${eco}%`, background: ecoColor(eco), borderRadius: 3, transition: 'width 0.8s ease', boxShadow: `0 0 8px ${ecoColor(eco)}55` }} />
              </div>
            </div>

            {/* Narrative */}
            <p style={{ fontSize: 11, color: 'rgba(245,245,247,0.42)', lineHeight: 1.65, margin: '0 0 10px' }}>{ecoStory(city)}</p>

            {/* 3-stat row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              <EcoStat label="Land Pressure" value={`${Math.max(0, ((city.pop - city.basePop) * 0.08)).toFixed(0)} ha`} />
              <EcoStat label="Eco Lost" value={`${Math.round(100 - eco)} pts`} color={ecoColor(eco)} center />
              <EcoStat label="Recovery" value={city.pop < city.basePop ? 'Active' : 'Paused'} color={city.pop < city.basePop ? '#30D158' : undefined} right />
            </div>
          </div>
        </div>

        {/* ── History chart card ───────────────────────────────────── */}
        <div style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <button
            onClick={() => setShowChart(v => !v)}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <SectionHeader icon="📈" label="History" trailing={showChart ? '▲' : '▼'} />
          </button>
          {showChart && (
            <div style={{ padding: '0 8px 8px' }}>
              <CityChart city={city} />
            </div>
          )}
        </div>

      </motion.div>
    </AnimatePresence>
  )
}

/* ── Sub-components ──────────────────────────────────────────────── */

function SectionHeader({ icon, label, trailing }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.35)' }}>{label}</span>
      </div>
      {trailing && <span style={{ fontSize: 9, color: 'rgba(245,245,247,0.25)' }}>{trailing}</span>}
    </div>
  )
}

function PopStat({ label, value, color }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px' }}>
      <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)', marginBottom: 3 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: color || 'rgba(245,245,247,0.75)', letterSpacing: '-0.3px' }}>{value}</span>
    </div>
  )
}

function WeatherCell({ icon, main, sub, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 6px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 14, marginBottom: 4 }}>{icon}</span>
      <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: color || 'rgba(245,245,247,0.80)', letterSpacing: '-0.3px', textAlign: 'center' }}>{main}</span>
      {sub && <span style={{ fontSize: 9, color: 'rgba(245,245,247,0.28)', marginTop: 2, textAlign: 'center' }}>{sub}</span>}
    </div>
  )
}

function StressMeter({ label, icon, value }) {
  const color = value > 75 ? '#FF375F' : value > 55 ? '#FF9F0A' : value > 35 ? '#FFD60A' : '#30D158'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10 }}>{icon}</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(245,245,247,0.50)' }}>{label}</span>
        </div>
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color }}>{Math.round(value)}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease', boxShadow: value > 70 ? `0 0 6px ${color}88` : 'none' }} />
      </div>
    </div>
  )
}

function EcoStat({ label, value, color, center, right }) {
  return (
    <div style={{ textAlign: center ? 'center' : right ? 'right' : 'left', padding: '8px 6px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(245,245,247,0.25)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: color || 'rgba(245,245,247,0.60)' }}>{value}</div>
    </div>
  )
}

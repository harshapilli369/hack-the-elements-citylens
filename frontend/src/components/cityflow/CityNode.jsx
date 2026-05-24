import { useCityFlowStore } from '../../store/cityflowStore'

const DISASTER_ICONS = {
  wildfire: '🔥', flood: '🌊', conflict: '⚔️', heatwave: '☀️', drought: '🏜️',
}

// Element colors for each disaster type — these override the stress-based color
// on the SOURCE city so it reads as "this city has an active event"
const DISASTER_COLORS = {
  wildfire: '#FF5A14',
  flood:    '#38BDF8',
  conflict: '#EF4444',
  heatwave: '#FCD34D',
  drought:  '#D97706',
}

const ecoColorHex  = (s) => s > 80 ? '#30D158' : s > 60 ? '#FFD60A' : s > 40 ? '#FF9F0A' : '#FF375F'
const stressColorHex = (s) => s > 75 ? '#FF375F' : s > 55 ? '#FF9F0A' : s > 35 ? '#FFD60A' : '#30D158'

export function CityNode({ city }) {
  const { id, name, subtitle, pop, stress, status, x, y, isDisasterActive, disasterType, ecoScore } = city
  const selectedCity = useCityFlowStore(state => state.sim.selectedCity)
  const selectCity   = useCityFlowStore(state => state.selectCity)
  const isSelected   = selectedCity === id

  const formatPop = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : `${(n / 1000).toFixed(1)}k`
  const eco    = ecoScore ?? 100
  const ecoCol = ecoColorHex(eco)
  const strCol = stressColorHex(stress)

  // Disaster source city: use element color (flood=blue, wildfire=orange, …)
  // Receiving city: use stress-based color (green→yellow→orange→red)
  const disasterColor = isDisasterActive && disasterType ? DISASTER_COLORS[disasterType] : null

  return (
    <div
      className={`cityflow-node ${isDisasterActive ? 'disaster-active' : status} ${isDisasterActive ? 'active-disaster' : ''}`}
      style={{ left: `${x}%`, top: `${y}%`, ...(disasterColor ? { color: disasterColor } : {}) }}
      onClick={e => { e.stopPropagation(); selectCity(id) }}
    >
      <div className="cityflow-node-bg" />
      <div className="cityflow-node-core" />

      {/* Selection ring */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          inset: -10,
          borderRadius: '50%',
          border: '1.5px solid rgba(10,132,255,0.9)',
          boxShadow: '0 0 16px rgba(10,132,255,0.5), 0 0 32px rgba(10,132,255,0.15)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Label card
          — disaster source: border/bg tint uses the disaster element color (blue for flood, etc.)
          — receiving city: tint responds to rising stress level (yellow → orange → red) */}
      <div className="cityflow-label" style={{
        borderColor: disasterColor
          ? `${disasterColor}66`
          : stress > 75 ? 'rgba(255,55,95,0.45)'
          : stress > 55 ? 'rgba(255,159,10,0.38)'
          : stress > 35 ? 'rgba(255,214,10,0.30)'
          : 'rgba(255,255,255,0.07)',
        background: disasterColor
          ? `${disasterColor}18`
          : stress > 75 ? 'rgba(255,55,95,0.10)'
          : stress > 55 ? 'rgba(255,159,10,0.08)'
          : stress > 35 ? 'rgba(255,214,10,0.06)'
          : 'rgba(7,8,15,0.88)',
        boxShadow: disasterColor
          ? `0 0 20px ${disasterColor}44`
          : stress > 55 ? `0 0 16px ${strCol}33`
          : 'none',
        transition: 'border-color 0.5s ease, background 0.5s ease, box-shadow 0.5s ease',
      }}>

        {/* City name row */}
        <div className="cityflow-label-name">
          {isDisasterActive && disasterType && <span style={{ fontSize: 10, marginRight: 3 }}>{DISASTER_ICONS[disasterType]}</span>}
          {name}
          {isSelected && <span style={{ display: 'inline-block', marginLeft: 5, fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', color: '#0A84FF', background: 'rgba(10,132,255,0.12)', border: '1px solid rgba(10,132,255,0.3)', borderRadius: 4, padding: '0 4px', verticalAlign: 'middle' }}>●</span>}
        </div>

        {subtitle && (
          <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.04em', color: 'rgba(245,245,247,0.30)', marginBottom: 2 }}>{subtitle}</div>
        )}

        {/* Pop + stress */}
        <div className="cityflow-label-stats">
          {formatPop(pop)}
          <span style={{ margin: '0 4px', opacity: 0.35 }}>·</span>
          <span style={{ color: disasterColor || strCol, fontWeight: 700 }}>{Math.round(stress)}%</span>
        </div>

        {/* Stress bar */}
        <div style={{ marginTop: 4, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, stress)}%`, background: disasterColor || strCol, borderRadius: 1, transition: 'width 0.4s ease', boxShadow: stress > 60 || disasterColor ? `0 0 4px ${disasterColor || strCol}` : 'none' }} />
        </div>

        {/* Eco row */}
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 8, opacity: 0.5 }}>🌿</span>
          <div style={{ flex: 1, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${eco}%`, background: ecoCol, borderRadius: 1, transition: 'width 0.8s ease' }} />
          </div>
          <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: ecoCol, fontWeight: 700 }}>{Math.round(eco)}</span>
        </div>
      </div>
    </div>
  )
}

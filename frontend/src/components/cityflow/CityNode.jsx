import React from 'react'
import { useCityFlowStore } from '../../store/cityflowStore'

const DISASTER_ICONS = {
  wildfire: '🔥', flood: '🌊', conflict: '⚔️', heatwave: '☀️', drought: '🏜️',
}

const ecoColorHex = (s) => s > 80 ? '#30D158' : s > 60 ? '#FFD60A' : s > 40 ? '#FF9F0A' : '#FF375F'
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

  return (
    <div
      className={`cityflow-node ${status} ${isDisasterActive ? 'active-disaster' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={e => { e.stopPropagation(); selectCity(id) }}
    >
      <div className="cityflow-node-bg" />
      <div className="cityflow-node-core" />

      {/* Selection ring — solid cyan glow */}
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

      {/* Label card */}
      <div className="cityflow-label">
        {/* Name */}
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
          <span style={{ color: strCol, fontWeight: 700 }}>{Math.round(stress)}%</span>
        </div>

        {/* Stress bar */}
        <div style={{ marginTop: 4, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, stress)}%`, background: strCol, borderRadius: 1, transition: 'width 0.4s ease', boxShadow: stress > 60 ? `0 0 4px ${strCol}` : 'none' }} />
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

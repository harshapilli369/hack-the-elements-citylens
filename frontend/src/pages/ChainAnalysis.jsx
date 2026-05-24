import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import '../components/cityflow/cityflow.css'
import { useChainStore } from '../store/chainStore'
import { useCityFlowStore } from '../store/cityflowStore'
import { CITY_PROVINCE_MAP } from '../store/cityflowStore'
import { RecommendationCards } from '../components/insights/RecommendationCards'
import { formatCarbon, formatHectares, formatPopulation } from '../utils/formatters'
import { AnimatedCounter } from '../components/ui/AnimatedCounter'

const ALL_CITIES = [
  { id: 'moncton',       name: 'City A',        province: 'New Brunswick'        },
  { id: 'halifax',       name: 'City B',         province: 'Nova Scotia'          },
]

// Real geographic coordinates — used with Leaflet latLngToContainerPoint
const CITY_LATLNG = {
  moncton:       [46.0878, -64.7782],
  halifax:       [44.6488, -63.5752],
  charlottetown: [46.2382, -63.1311],
  'st-johns':    [47.5615, -52.7126],
}
const CHAIN_MAP_PROVINCE_TO_CITY = {
  'New Brunswick':        'moncton',
  'Nova Scotia':          'halifax',
  'Prince Edward Island': 'charlottetown',
  'Newfoundland':         'st-johns',
}
const CHAIN_EVENT_COLORS = {
  flood:    '#38BDF8',
  wildfire: '#FF6B35',
  conflict: '#EF4444',
  heatwave: '#FCD34D',
  drought:  '#D97706',
}

const SEV = {
  MINIMAL:  { color: '#30D158', bg: 'rgba(48,209,88,0.10)',   border: 'rgba(48,209,88,0.22)'   },
  LOW:      { color: '#30D158', bg: 'rgba(48,209,88,0.10)',   border: 'rgba(48,209,88,0.22)'   },
  MODERATE: { color: '#FF9F0A', bg: 'rgba(255,159,10,0.10)', border: 'rgba(255,159,10,0.22)'  },
  HIGH:     { color: '#FF375F', bg: 'rgba(255,55,95,0.10)',  border: 'rgba(255,55,95,0.22)'   },
  CRITICAL: { color: '#FF375F', bg: 'rgba(255,55,95,0.12)',  border: 'rgba(255,55,95,0.30)'   },
}
const sevStyle    = (s) => SEV[s] || SEV.MODERATE
const elementColors = {
  carbon: (v) => {
    if (v <= 25) return '#BF5AF2' // Air - Clear Deep Violet
    if (v <= 50) return '#9C81B5' // Light Haze
    if (v <= 75) return '#D69A2B' // Heavy Smog Yellow
    return '#FF375F'             // Toxic/Carbon Spiked
  },
  habitat: (v) => {
    if (v <= 25) return '#30D158' // Earth - Rich Forest Green
    if (v <= 50) return '#83A846' // Olive / Depleting Canopy
    if (v <= 75) return '#C2A44B' // Dry soil brown
    return '#FF453A'             // Deforested/Searing Red
  },
  water: (v) => {
    if (v <= 25) return '#0A84FF' // Water - Deep Clear Blue
    if (v <= 50) return '#40C8C4' // Strained Cyan
    if (v <= 75) return '#FFCC00' // Yellow Watershed Stress
    return '#FF375F'             // Severe drought red
  },
  heat: (v) => {
    if (v <= 25) return '#64D2FF' // Fire/Climate - Cool Temperate Ice/Teal
    if (v <= 50) return '#FFD60A' // Warm Amber
    if (v <= 75) return '#FF9F0A' // Searing Orange
    return '#FF375F'             // Scorching UHI Heat
  },
  biodiversity: (v) => {
    if (v <= 25) return '#00D8A5' // Earth/Bio - Emerald Balance
    if (v <= 50) return '#82C27F' // Shifting Moss Green
    if (v <= 75) return '#FFA502' // Endangered Orange
    return '#FF375F'             // Extinction Crimson
  },
  default: (v) => v > 75 ? '#FF375F' : v > 55 ? '#FF9F0A' : v > 35 ? '#FFD60A' : '#30D158'
}
const SEV_ORDER   = ['MINIMAL', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL']
const DISASTER_ICON = { wildfire: '🔥', flood: '🌊', heatwave: '☀️', drought: '🏜️', conflict: '⚡', cascade: '🔗' }

const PROV_SHORT = {
  'New Brunswick': 'City A', 'Nova Scotia': 'City B',
  'Prince Edward Island': 'City C', 'Newfoundland': 'City D',
}

const PROVINCE_DISPLAY = {
  'New Brunswick': 'Region A',
  'Nova Scotia': 'Region B',
  'Prince Edward Island': 'Region C',
  'Newfoundland': 'Region D',
}

// ── Merge destination timelines for a province (max stress per month) ─────────
function getDestTimeline(groups, provinceName) {
  const matching = groups.filter(g => g.destination_province === provinceName)
  if (!matching.length) return null
  const len = Math.max(...matching.map(g => g.destination_timeline.length))
  return Array.from({ length: len }, (_, i) => ({
    month:              i + 1,
    ecological_stress:  Math.max(...matching.map(g => g.destination_timeline[i]?.ecological_stress  ?? 0)),
    watershed_stress:   Math.max(...matching.map(g => g.destination_timeline[i]?.watershed_stress   ?? 0)),
    biodiversity_index: Math.min(...matching.map(g => g.destination_timeline[i]?.biodiversity_index ?? 100)),
  }))
}

// ── Small sparkline (ecological stress only) ──────────────────────────────────
function Sparkline({ timeline }) {
  if (!timeline?.length) return null
  const W = 110, H = 28, n = timeline.length
  const pts = timeline.map((d, i) => {
    const x = (i / Math.max(n - 1, 1)) * W
    const y = H - (Math.min(d.ecological_stress, 100) / 100) * H
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const finalStress = timeline[timeline.length - 1]?.ecological_stress ?? 0
  const color = finalStress > 60 ? '#FF375F' : finalStress > 40 ? '#FF9F0A' : '#30D158'
  const fillPts = `0,${H} ${pts} ${W},${H}`

  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)', marginBottom: 4 }}>
        Stress trend
      </div>
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
        <polygon points={fillPts} fill={color} opacity={0.10} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
        {/* Final value dot */}
        <circle
          cx={(((n - 1) / Math.max(n - 1, 1)) * W).toFixed(1)}
          cy={(H - (Math.min(finalStress, 100) / 100) * H).toFixed(1)}
          r={2.5} fill={color}
        />
      </svg>
    </div>
  )
}

// ── Full multi-metric timeline chart ─────────────────────────────────────────
function TimelineChart({ timeline }) {
  if (!timeline?.length) return null
  const VW = 560, VH = 90
  const pad = { t: 8, r: 8, b: 24, l: 34 }
  const cw = VW - pad.l - pad.r
  const ch = VH - pad.t - pad.b
  const n  = timeline.length

  const xOf = (i) => pad.l + (i / Math.max(n - 1, 1)) * cw
  const yOf = (v) => pad.t + (1 - Math.min(Math.max(v, 0), 100) / 100) * ch

  const stressPts      = timeline.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.ecological_stress).toFixed(1)}`).join(' ')
  const watershedPts   = timeline.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.watershed_stress).toFixed(1)}`).join(' ')
  const biodivPts      = timeline.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.biodiversity_index).toFixed(1)}`).join(' ')

  // X-axis month labels — show ~5 evenly spaced
  const labelIdxs = n <= 6
    ? timeline.map((_, i) => i)
    : [0, Math.round(n * 0.25), Math.round(n * 0.5), Math.round(n * 0.75), n - 1]

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={pad.l} x2={pad.l + cw} y1={yOf(v)} y2={yOf(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
            <text x={pad.l - 4} y={yOf(v) + 3} fontSize={7} fill="rgba(245,245,247,0.22)" textAnchor="end">{v}</text>
          </g>
        ))}
        {/* Lines */}
        <polyline points={stressPts}    fill="none" stroke="#FF375F" strokeWidth={1.5} strokeLinejoin="round" />
        <polyline points={watershedPts} fill="none" stroke="#0A84FF" strokeWidth={1.5} strokeLinejoin="round" />
        <polyline points={biodivPts}    fill="none" stroke="#30D158" strokeWidth={1.5} strokeLinejoin="round" />
        {/* X-axis labels */}
        {labelIdxs.map(i => (
          <text key={i} x={xOf(i)} y={VH - 4} fontSize={7} fill="rgba(245,245,247,0.25)" textAnchor="middle">
            mo {timeline[i].month}
          </text>
        ))}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
        {[['#FF375F', 'Ecological Stress'], ['#0A84FF', 'Watershed Stress'], ['#30D158', 'Biodiversity Index']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 18, height: 2, background: c, borderRadius: 1 }} />
            <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(245,245,247,0.35)', letterSpacing: '0.04em' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Cascade / displacement chain explainer ────────────────────────────────────
function CascadeExplainer({ chainEvents }) {
  if (!chainEvents?.length) return null

  const eventsWithDisplay = chainEvents.map(ev => {
    const isCascade = ev.event_type === 'cascade'
    const icon      = DISASTER_ICON[ev.disaster_type] || (isCascade ? '🔗' : '⚠️')
    const typeLabel = isCascade ? 'CASCADE' : (ev.disaster_type?.toUpperCase() ?? 'EVENT')
    const typeColor = isCascade ? '#FF375F'
      : ev.disaster_type === 'wildfire' ? '#FF9F0A'
      : ev.disaster_type === 'flood'    ? '#38BDF8'
      : ev.disaster_type === 'heatwave' ? '#FFD60A'
      : ev.disaster_type === 'drought'  ? '#C88C32'
      : '#F5F5F7'
    return { ...ev, icon, typeLabel, typeColor, isCascade }
  })

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      style={{ borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', padding: '14px 18px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)', marginBottom: 14 }}>
        Displacement chain — {chainEvents.length} event{chainEvents.length !== 1 ? 's' : ''} across the network
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {eventsWithDisplay.map((ev, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            {/* Vertical connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
              <div style={{ width: 1, height: i === 0 ? 12 : 0, background: 'transparent' }} />
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: ev.isCascade ? 'rgba(255,55,95,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${ev.isCascade ? 'rgba(255,55,95,0.30)' : 'rgba(255,255,255,0.10)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
              }}>
                {ev.icon}
              </div>
              {i < eventsWithDisplay.length - 1 && (
                <div style={{ width: 1, flex: 1, minHeight: 14, background: 'rgba(255,255,255,0.07)', margin: '2px 0' }} />
              )}
            </div>
            {/* Event content */}
            <div style={{ flex: 1, paddingLeft: 10, paddingBottom: i < eventsWithDisplay.length - 1 ? 12 : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: ev.typeColor,
                  padding: '2px 7px', borderRadius: 5,
                  background: `${ev.typeColor}18`, border: `1px solid ${ev.typeColor}30` }}>
                  {ev.typeLabel}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F7' }}>
                  {PROV_SHORT[ev.source_province] || ev.source_province}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(245,245,247,0.30)' }}>→</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F7' }}>
                  {PROV_SHORT[ev.destination_province] || ev.destination_province}
                </span>
                {ev.isCascade && (
                  <span style={{ fontSize: 10, color: '#FF375F', fontStyle: 'italic' }}>stress overload</span>
                )}
              </div>
              <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'rgba(245,245,247,0.45)', flexShrink: 0, marginLeft: 12 }}>
                {ev.population_size?.toLocaleString()} displaced
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Displacement corridor map — same dark Leaflet map as CityFlow simulator ───
const CHAIN_DARK_TILE  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const CHAIN_MAP_CENTER = [47.0, -62.0]
const CHAIN_MAP_ZOOM   = 5

// Reads Leaflet pixel positions for two lat/lon points, lifts them to parent
function MapPositionBridge({ sourceLatLng, destLatLng, onReady }) {
  const map = useMap()
  useEffect(() => {
    const src = map.latLngToContainerPoint(sourceLatLng)
    const dst = map.latLngToContainerPoint(destLatLng)
    onReady({ source: { x: src.x, y: src.y }, dest: { x: dst.x, y: dst.y } })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])
  return null
}

function ChainMap({ cityStates, chainEvents, animatedState, progress }) {
  const [pixelPos, setPixelPos] = useState(null)

  const primaryEvent = chainEvents?.find(e => e.event_type !== 'cascade') ?? chainEvents?.[0]
  if (!primaryEvent || !cityStates?.length) return null

  const disasterType = primaryEvent.disaster_type || 'flood'
  const sourceCityId = CHAIN_MAP_PROVINCE_TO_CITY[primaryEvent.source_province]
  const destCityId   = CHAIN_MAP_PROVINCE_TO_CITY[primaryEvent.destination_province]
  if (!sourceCityId || !destCityId) return null

  const sourceLatLng = CITY_LATLNG[sourceCityId]
  const destLatLng   = CITY_LATLNG[destCityId]
  const sourceState  = cityStates.find(c => c.id === sourceCityId)
  const destState    = cityStates.find(c => c.id === destCityId)

  const eventColor = animatedState ? animatedState.cityA.color : (CHAIN_EVENT_COLORS[disasterType] || '#38BDF8')
  const stressColor = animatedState ? animatedState.cityB.color : '#30D158'
  const lineOpacity = animatedState ? (progress >= 30 ? 0.65 : 0) : 0.65

  // Bezier arc arching upward between the two dots
  const cpX   = pixelPos ? (pixelPos.source.x + pixelPos.dest.x) / 2 : 0
  const cpY   = pixelPos ? Math.min(pixelPos.source.y, pixelPos.dest.y) - 50 : 0
  const pathD = pixelPos
    ? `M ${pixelPos.source.x} ${pixelPos.source.y} Q ${cpX} ${cpY} ${pixelPos.dest.x} ${pixelPos.dest.y}`
    : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ position: 'relative', height: 320, borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}
    >
      <style>{`@keyframes chain-dash { to { stroke-dashoffset: -20; } }`}</style>

      {/* Layer 0: real Leaflet dark map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapContainer
          center={CHAIN_MAP_CENTER} zoom={CHAIN_MAP_ZOOM}
          zoomControl={false} dragging={false} touchZoom={false}
          doubleClickZoom={false} scrollWheelZoom={false}
          boxZoom={false} keyboard={false} attributionControl={false}
          style={{ width: '100%', height: '100%', background: '#07080F' }}
        >
          <TileLayer url={CHAIN_DARK_TILE} maxZoom={19} subdomains="abcd" />
          <MapPositionBridge
            sourceLatLng={sourceLatLng}
            destLatLng={destLatLng}
            onReady={setPixelPos}
          />
        </MapContainer>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 500,
          background: 'linear-gradient(to bottom, rgba(7,8,15,0.55) 0%, rgba(7,8,15,0.38) 50%, rgba(7,8,15,0.55) 100%)',
        }} />
      </div>

      {/* Layer 1: corridor line at real geographic pixel positions */}
      {pixelPos && (
        <svg width="100%" height="100%"
          style={{ position: 'absolute', inset: 0, zIndex: 600, pointerEvents: 'none' }}>
          <path d={pathD} fill="none" stroke={eventColor} strokeWidth={1.5}
            strokeDasharray="8 5" opacity={lineOpacity}
            style={{ animation: 'chain-dash 1.2s linear infinite', transition: 'opacity 0.4s ease' }} />
        </svg>
      )}

      {/* Layer 2: city nodes — City A card on LEFT, City B card on RIGHT */}
      {pixelPos && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 700 }}>
          <ChainCityNode
            px={pixelPos.source.x} py={pixelPos.source.y}
            displayName="City A" isSource cardSide="left"
            eventColor={eventColor} disasterType={disasterType}
            initialPop={sourceState?.basePop}
            currentPop={sourceState?.pop}
            stress={animatedState ? animatedState.cityA.stress : (sourceState?.stress ?? 0)}
          />
          <ChainCityNode
            px={pixelPos.dest.x} py={pixelPos.dest.y}
            displayName="City B" cardSide="right"
            stressColor={stressColor}
            initialPop={destState?.basePop}
            currentPop={destState?.pop}
            stress={animatedState ? animatedState.cityB.stress : (destState?.stress ?? 0)}
          />
        </div>
      )}

      {/* HUD */}
      <div style={{ position: 'absolute', top: 10, left: 14, zIndex: 800,
        fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'rgba(245,245,247,0.28)' }}>
        Displacement Corridor · Atlantic Canada
      </div>
      <div style={{
        position: 'absolute', top: 8, right: 14, zIndex: 800,
        padding: '3px 10px', borderRadius: 7,
        background: `${eventColor}18`, border: `1px solid ${eventColor}40`,
        color: eventColor, fontSize: 10, fontWeight: 700,
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        {DISASTER_ICON[disasterType] || '⚠️'} {disasterType}
      </div>

      {/* Status legend */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 800,
        display: 'flex', alignItems: 'center', gap: 10, padding: '5px 10px', borderRadius: 8,
        background: 'rgba(7,8,15,0.75)', border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)' }}>
        {[['#30D158','<35%'],['#FFD60A','35–55%'],['#FF9F0A','55–75%'],['#FF375F','>75%']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
            <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(245,245,247,0.30)', letterSpacing: '0.04em' }}>{l}</span>
          </div>
        ))}
        <span style={{ fontSize: 9, color: 'rgba(245,245,247,0.18)' }}>stress</span>
      </div>
    </motion.div>
  )
}

// ── Static city node — City A / City B with card on opposite sides ────────────
function ChainCityNode({ px, py, displayName, isSource, cardSide, eventColor, stressColor, disasterType, initialPop, currentPop, stress }) {
  const color      = isSource ? eventColor : stressColor
  const stressStr  = stress > 75 ? '#FF375F' : stress > 55 ? '#FF9F0A' : stress > 35 ? '#FFD60A' : '#30D158'
  const stressClass = stress > 75 ? 'critical' : stress > 55 ? 'stressed' : stress > 35 ? 'warning' : 'healthy'
  const popChange  = currentPop != null && initialPop != null ? currentPop - initialPop : null
  const popSign    = popChange > 0 ? '+' : ''
  const popDeltaColor = popChange > 0 ? '#FF9F0A' : popChange < 0 ? '#30D158' : 'rgba(245,245,247,0.35)'

  const cardPos = cardSide === 'left'
    ? { right: 'calc(100% + 16px)', top: '50%', transform: 'translateY(-50%)' }
    : { left:  'calc(100% + 16px)', top: '50%', transform: 'translateY(-50%)' }

  return (
    <div
      className={`cityflow-node ${isSource ? 'disaster-active active-disaster' : stressClass}`}
      style={{ left: px, top: py, color: color }}
    >
      <div className="cityflow-node-bg" style={{ backgroundColor: `${color}22`, border: `2px solid ${color}` }} />
      <div className="cityflow-node-core" style={{ backgroundColor: color }} />

      <div style={{
        position: 'absolute', ...cardPos,
        background: 'rgba(7,8,15,0.93)',
        border: `1px solid ${color}55`,
        borderRadius: 10,
        padding: '10px 14px',
        minWidth: 162,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 0 24px ${color}28, 0 4px 24px rgba(0,0,0,0.6)`,
        whiteSpace: 'nowrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
          <div style={{
            fontSize: 7, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
            padding: '2px 6px', borderRadius: 4,
            background: `${color}18`, border: `1px solid ${color}35`, color,
          }}>
            {isSource ? 'SOURCE' : 'DESTINATION'}
          </div>
          {isSource && disasterType && <span style={{ fontSize: 11 }}>{DISASTER_ICON[disasterType] || '⚠️'}</span>}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#F5F5F7', letterSpacing: '-0.3px', marginBottom: 9 }}>
          {displayName}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <ChainNodeStat label="Initial pop"
            value={initialPop != null ? formatPopulation(initialPop) : '—'} />
          <ChainNodeStat label="Current pop"
            value={currentPop != null ? formatPopulation(currentPop) : '—'}
            delta={popChange != null ? `${popSign}${formatPopulation(Math.abs(popChange))}` : null}
            deltaColor={popDeltaColor} />
          <ChainNodeStat label="Stress"
            value={stress != null ? `${stress}%` : '—'}
            valueColor={stressStr} />
        </div>
      </div>
    </div>
  )
}

function ChainNodeStat({ label, value, valueColor, delta, deltaColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 9, color: 'rgba(245,245,247,0.32)', fontWeight: 500, letterSpacing: '0.03em' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
          color: valueColor || 'rgba(245,245,247,0.65)' }}>
          {value}
        </span>
        {delta && (
          <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
            color: deltaColor || 'rgba(245,245,247,0.35)' }}>
            ({delta})
          </span>
        )}
      </div>
    </div>
  )
}

function EcoSubsystems({ result, chainEvents, animatedState }) {
  const { destMap, srcMap } = buildProvinceData(result.groups)

  // Get live city state from useCityFlowStore
  const liveCities = useCityFlowStore(state => state.cities)
  const liveByProvince = {}
  liveCities.forEach(c => {
    const province = CITY_PROVINCE_MAP[c.id]?.province
    if (province) liveByProvince[province] = c
  })

  // Get active stress metrics for each city
  const cityMetrics = ALL_CITIES.map((city, index) => {
    const isCityA = city.id === 'moncton'
    
    // Dynamically read stress and color from the animation state if available
    let totalStress = isCityA 
      ? (animatedState ? animatedState.cityA.stress : 80)
      : (animatedState ? animatedState.cityB.stress : 64)
      
    let airStress = isCityA ? 25 : Math.round(20 + (totalStress - 20) * 0.5)
    let waterStress = isCityA ? Math.max(95, totalStress) : Math.round(20 + (totalStress - 20) * 1.0)
    let landStress = isCityA ? 42 : Math.round(20 + (totalStress - 20) * 0.6)

    // Status Badge: Stable, Moderate, Critical
    let status = isCityA
      ? (animatedState ? animatedState.cityA.status : 'Critical')
      : (animatedState ? animatedState.cityB.status : 'Critical')
      
    let statusColor = isCityA
      ? (animatedState ? animatedState.cityA.color : '#FF375F')
      : (animatedState ? animatedState.cityB.color : '#FF375F')
      
    let statusBg = `${statusColor}18`

    // Trend label
    let trendText = isCityA ? 'stress recovering' : 'stress increasing'
    let trendPercent = isCityA ? '-15%' : '+18%'
    let trendColor = isCityA ? '#30D158' : '#FF375F'

    // Graph points representing the flood/displacement trajectory
    let graphPoints = isCityA 
      ? [95, 92, 88, 83, 79, 74, 70, 66, 62, 58, 54, 50] // Flood spike & recovery
      : [20, 24, 29, 35, 41, 46, 51, 55, 58, 61, 63, 64] // Influx growth

    // Subsystem status mapping
    const getSubsystemStatus = (val) => {
      if (val > 60) return { label: 'Critical', color: '#FF375F' }
      if (val > 30) return { label: 'Moderate', color: '#FF9F0A' }
      return { label: 'Stable', color: '#30D158' }
    }

    const airStatus = getSubsystemStatus(airStress)
    const waterStatus = getSubsystemStatus(waterStress)
    const landStatus = getSubsystemStatus(landStress)

    // Determine dominant subsystem under stress
    let dominantSubsystem = 'Water'
    let tintColor = '#0A84FF' // Water
    let intervention = isCityA ? 'improve drainage systems' : 'expand water infrastructure'

    // City custom descriptions based on name and dominant subsystem
    let explanation = isCityA
      ? "Catastrophic flooding event has overwhelmed City A's drainage networks. Over 95% watershed strain and 42% land erosion require immediate system rehabilitation."
      : "Arrival of 6,000 displaced residents has placed severe stress on City B's watershed infrastructure (75% strain) and increased urban sprawl (54% land stress)."

    return {
      ...city,
      totalStress,
      airStress,
      waterStress,
      landStress,
      status,
      statusColor,
      statusBg,
      trendText,
      trendPercent,
      trendColor,
      graphPoints,
      airStatus,
      waterStatus,
      landStatus,
      dominantSubsystem,
      tintColor,
      intervention,
      explanation
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.3; transform: scale(0.9); }
        }
      `}</style>
      
      <SectionLabel>Ecological Stress Analysis — Affected regions</SectionLabel>

      {/* Top Section: Horizontal City Stress Cards */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, width: '100%' }}>
        {cityMetrics.map((city, idx) => (
          <div key={city.id} style={{
            flex: 1,
            background: 'rgba(20,24,35,0.4)',
            borderRadius: 14,
            border: `1px solid ${city.statusColor}22`,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            backgroundColor: city.status === 'Critical' ? 'rgba(255,55,95,0.02)' : city.status === 'Moderate' ? 'rgba(255,159,10,0.01)' : 'rgba(48,209,88,0.01)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F5F5F7' }}>{city.name}</h4>
                <span style={{ fontSize: 9.5, color: 'rgba(245,245,247,0.35)', fontWeight: 500 }}>Environmental subsystem analysis</span>
              </div>
              <div style={{
                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                color: city.statusColor, backgroundColor: city.statusBg, border: `1px solid ${city.statusColor}25`
              }}>
                {city.status}
              </div>
            </div>

            {/* Trend label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <span style={{ fontSize: 9.5, fontWeight: 600, color: city.trendColor }}>{city.trendPercent} / 30d</span>
              <span style={{ fontSize: 9.5, color: 'rgba(245,245,247,0.3)', fontWeight: 500 }}>{city.trendText}</span>
            </div>

            {/* SVG Sparkline */}
            <StressSparklineSVG points={city.graphPoints} color={city.statusColor} />

            {/* 3 Interconnected Indicators */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '8px 0 16px' }}>
              <IndicatorRow label="Atmospheric Stress" status={city.airStatus} />
              <IndicatorRow label="Watershed Stress" status={city.waterStatus} />
              <IndicatorRow label="Ecological Land Stress" status={city.landStatus} />
            </div>

            {/* Bottom Card Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10, marginTop: 'auto' }}>
              <span style={{ fontSize: 9.5, color: 'rgba(245,245,247,0.3)', fontWeight: 500 }}>
                {city.totalStress > 40 ? 'approaching environmental threshold' : 'within environmental threshold'}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: city.statusColor }}>cascade →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Warning Center Text */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 8px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 20,
          background: 'rgba(255,55,95,0.06)', border: '1px solid rgba(255,55,95,0.18)',
          color: '#FF375F', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.04em',
          textTransform: 'uppercase', boxShadow: '0 0 12px rgba(255,55,95,0.1)'
        }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#FF375F', animation: 'pulse 1.5s infinite' }} />
          Chain reaction detected — environmental stress propagating across regions
        </div>
      </div>

      {/* Second Section: Projected Intervention Requirements */}
      <div style={{ marginTop: 8 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.5)', marginBottom: 12 }}>
          Projected Intervention Requirements
        </h3>
        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          {cityMetrics.map(city => {
            const tint = city.tintColor
            const bgSubsystem = city.dominantSubsystem === 'Air' 
              ? 'rgba(191,90,242,0.03)' 
              : city.dominantSubsystem === 'Water' 
              ? 'rgba(10,132,255,0.03)' 
              : 'rgba(48,209,88,0.03)'
            const borderSubsystem = city.dominantSubsystem === 'Air'
              ? 'rgba(191,90,242,0.12)'
              : city.dominantSubsystem === 'Water'
              ? 'rgba(10,132,255,0.12)'
              : 'rgba(48,209,88,0.12)'

            const badgeLabel = city.dominantSubsystem === 'Air'
              ? 'Atmospheric Strain'
              : city.dominantSubsystem === 'Water'
              ? 'Watershed Stress'
              : 'Ecological Land Stress'

            return (
              <div key={city.id} style={{
                flex: 1,
                background: bgSubsystem,
                border: `1px solid ${borderSubsystem}`,
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F7' }}>{city.name}</span>
                  <span style={{
                    fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                    padding: '2px 6px', borderRadius: 4, color: tint, border: `1px solid ${tint}30`,
                    backgroundColor: `${tint}10`
                  }}>
                    {badgeLabel}
                  </span>
                </div>
                <div style={{ fontSize: 9.5, color: 'rgba(245,245,247,0.3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  Dominant stress: {city.dominantSubsystem}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, lineHeight: 1.5, color: 'rgba(245,245,247,0.6)' }}>
                  {city.explanation}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10 }}>🔧</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: tint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {city.intervention}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 18, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(245,245,247,0.25)' }}>
            System Severity Legend:
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <LegendPill label="0–30% Stable" color="#30D158" />
            <LegendPill label="31–60% Moderate" color="#FF9F0A" />
            <LegendPill label="61–100% Critical" color="#FF375F" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StressSparklineSVG({ points, color }) {
  const width = 240
  const height = 48
  if (!points || points.length === 0) return null

  const minVal = 0
  const maxVal = 100
  const range = maxVal - minVal

  const pathPoints = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width
    const y = height - ((p - minVal) / range) * (height - 8) - 4
    return { x, y }
  })

  // generate smooth bezier path
  let pathD = `M ${pathPoints[0].x} ${pathPoints[0].y}`
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const curr = pathPoints[i]
    const next = pathPoints[i + 1]
    const cp1x = curr.x + (next.x - curr.x) / 3
    const cp1y = curr.y
    const cp2x = curr.x + 2 * (next.x - curr.x) / 3
    const cp2y = next.y
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`
  }

  // glowing gradient ID
  const gradId = `grad-${Math.random().toString(36).substr(2, 9)}`
  const fillGradId = `fill-${Math.random().toString(36).substr(2, 9)}`

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible', margin: '8px 0 12px' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={`${color}11`} />
          <stop offset="50%" stopColor={`${color}88`} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
        <linearGradient id={fillGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.12} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      {/* Glow path */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={3} opacity={0.15} style={{ filter: 'blur(3px)' }} />
      {/* Filled Area */}
      <path d={`${pathD} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${fillGradId})`} />
      {/* Main Path */}
      <path d={pathD} fill="none" stroke={`url(#${gradId})`} strokeWidth={1.75} />
      {/* Final Dot */}
      {pathPoints.length > 0 && (
        <circle cx={pathPoints[pathPoints.length - 1].x} cy={pathPoints[pathPoints.length - 1].y} r={3} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      )}
    </svg>
  )
}

function IndicatorRow({ label, status }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 10.5, color: 'rgba(245,245,247,0.45)', fontWeight: 500 }}>{label}</span>
      <span style={{
        fontSize: 8.5, fontWeight: 700, padding: '1.5px 6px', borderRadius: 4,
        color: status.color, border: `1px solid ${status.color}25`, backgroundColor: `${status.color}08`,
        textTransform: 'uppercase', letterSpacing: '0.02em'
      }}>
        {status.label}
      </span>
    </div>
  )
}

function LegendPill({ label, color }) {
  return (
    <div style={{
      fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em',
      padding: '3px 8px', borderRadius: 6, color, border: `1px solid ${color}20`,
      backgroundColor: 'rgba(20,24,35,0.5)'
    }}>
      {label}
    </div>
  )
}

// ── Build per-province summary from backend groups ────────────────────────────
function buildProvinceData(groups) {
  const destMap = {}
  const srcMap  = {}

  for (const g of groups) {
    const dest = g.destination_province
    if (!destMap[dest]) {
      destMap[dest] = {
        population: 0, ecological_stress: 0, forest_loss_ha: 0,
        carbon_per_capita_delta: 0, watershed_stress: 0, uhi_delta_c: 0,
        biodiversity_index: 100, recovery_years: 0, severity: 'MINIMAL',
        event_count: 0, event_types: new Set(),
      }
    }
    const d = destMap[dest]
    d.population        += g.total_population
    d.ecological_stress  = Math.max(d.ecological_stress, g.scorecard.ecological_stress)
    d.forest_loss_ha    += g.scorecard.forest_loss_ha
    d.carbon_per_capita_delta = Math.max(d.carbon_per_capita_delta, g.scorecard.carbon_per_capita_delta)
    d.watershed_stress   = Math.max(d.watershed_stress,  g.scorecard.watershed_stress_final)
    d.uhi_delta_c        = Math.max(d.uhi_delta_c,       g.scorecard.uhi_delta_final_c)
    d.biodiversity_index = Math.min(d.biodiversity_index, g.scorecard.biodiversity_index_final)
    d.recovery_years     = Math.max(d.recovery_years,    g.scorecard.recovery_years_estimate)
    d.event_count       += g.event_count
    g.event_types.forEach(t => d.event_types.add(t))
    if (SEV_ORDER.indexOf(g.scorecard.severity) > SEV_ORDER.indexOf(d.severity)) d.severity = g.scorecard.severity

    const src = g.source_province
    if (!srcMap[src]) srcMap[src] = { displaced: 0, rewilded_ha: 0, carbon_recovered: 0, event_count: 0 }
    srcMap[src].displaced        += g.total_population
    srcMap[src].rewilded_ha      += g.scorecard.source_rewilded_ha
    srcMap[src].carbon_recovered += g.scorecard.source_carbon_recovered
    srcMap[src].event_count      += g.event_count
  }

  Object.values(destMap).forEach(d => { d.event_types = [...d.event_types] })

  const all = [...new Set([
    ...Object.keys(destMap).sort(),
    ...Object.keys(srcMap).sort(),
  ])]

  return { destMap, srcMap, provinces: all }
}

// Helper to recursively cleanse raw city and province names from all text fields
function sanitizeData(obj) {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    return obj
      .replace(/Moncton/g, 'City A')
      .replace(/Halifax/g, 'City B')
      .replace(/Charlottetown/g, 'City C')
      .replace(/St\. John's/g, 'City D')
      .replace(/St\. John’s/g, 'City D')
      .replace(/New Brunswick/g, 'Region A')
      .replace(/Nova Scotia/g, 'Region B')
      .replace(/Prince Edward Island/g, 'Region C')
      .replace(/Newfoundland/g, 'Region D');
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeData);
  }
  if (typeof obj === 'object') {
    const res = {};
    for (const key of Object.keys(obj)) {
      res[key] = sanitizeData(obj[key]);
    }
    return res;
  }
  return obj;
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ChainAnalysis() {
  const navigate    = useNavigate()
  const chainStore  = useChainStore()
  const { result, isLoading, error, cityStates, chainEvents, lastRequest } = chainStore
  const liveCities  = useCityFlowStore(state => state.cities)

  async function handleRefresh() {
    if (!lastRequest) return
    chainStore.setLoading(true)
    chainStore.setResult(null)
    // Snapshot current live city states
    chainStore.setCityStates(liveCities.map(c => ({
      id: c.id, name: c.name,
      province: CITY_PROVINCE_MAP[c.id]?.province,
      pop: c.pop, basePop: c.basePop,
      stress: Math.round(c.stress),
      ecoScore: Math.round(c.ecoScore ?? 100),
      status: c.status,
    })))
    try {
      const res = await fetch('/api/simulate/chain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastRequest),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      chainStore.setResult(await res.json())
    } catch (err) {
      chainStore.setError(err.message)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#07080F', overflow: 'hidden' }}>

      {/* Nav */}
      <nav style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(7,8,15,0.92)', backdropFilter: 'blur(20px)', zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,245,247,0.50)', fontSize: 13, fontWeight: 500, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#F5F5F7'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,245,247,0.50)'}>
            <span>🌿</span>
            <span style={{ fontWeight: 600, color: '#F5F5F7' }}>Chain Reaction</span>
          </button>
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.10)' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F7', letterSpacing: '-0.2px' }}>
              Chain Reaction <span style={{ color: '#FF375F' }}>Ecological Analysis</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)' }}>
              All cities · Full cascade
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastRequest && (
            <button onClick={handleRefresh} disabled={isLoading}
               style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                color: isLoading ? 'rgba(245,245,247,0.25)' : '#F5F5F7',
                background: 'transparent',
                border: `1px solid ${isLoading ? 'rgba(255,255,255,0.05)' : 'rgba(255,55,95,0.30)'}` }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.borderColor = 'rgba(255,55,95,0.60)' }}
              onMouseLeave={e => { if (!isLoading) e.currentTarget.style.borderColor = 'rgba(255,55,95,0.30)' }}>
              {isLoading ? '⏳ Analysing…' : '↻ Re-analyse'}
            </button>
          )}
          <button onClick={() => navigate('/cityflow')}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'rgba(245,245,247,0.40)', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F5F5F7'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,245,247,0.40)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
            🏙️ Back to Simulator
          </button>
        </div>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {isLoading && !result && <LoadingState />}
        {error && !result && <ErrorState error={error} onBack={() => navigate('/cityflow')} />}
        <AnimatePresence>
          {result && (
            <Dashboard
              result={sanitizeData(result)}
              cityStates={cityStates.map(c => ({
                ...c,
                name: c.id === 'moncton' ? 'City A' : c.id === 'halifax' ? 'City B' : c.id === 'charlottetown' ? 'City C' : 'City D',
                province: PROVINCE_DISPLAY[c.province] || c.province
              }))}
              chainEvents={chainEvents}
              onSimulate={(cityId, category) => navigate(`/cityflow?focus=${cityId}${category ? `&policy=${category}` : ''}`)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
function Dashboard({ result, cityStates, chainEvents, onSimulate }) {
  const { destMap, srcMap } = buildProvinceData(result.groups)

  // Interactive timeline progression loop (0 to 100)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => (p >= 100 ? 0 : p + 1.2))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Calculate animated stress and color states for City A and City B
  let cityAStress = 15
  let cityAColor = '#30D158'
  let cityAStatus = 'Stable'
  let isAActive = false

  if (progress >= 10) {
    isAActive = true
    cityAColor = '#0A84FF' // Change City A to Blue when flood triggers
    if (progress < 40) {
      const t = (progress - 10) / 30
      cityAStress = Math.round(15 + (95 - 15) * t)
      cityAStatus = 'Critical'
    } else {
      const t = (progress - 40) / 60
      cityAStress = Math.round(95 - (95 - 50) * t)
      cityAStatus = cityAStress > 60 ? 'Critical' : 'Moderate'
    }
  }

  let cityBStress = 20
  let cityBColor = '#30D158'
  let cityBStatus = 'Stable'
  let isBActive = false

  if (progress >= 40) {
    isBActive = true
    const t = (progress - 40) / 60
    cityBStress = Math.round(20 + (75 - 20) * t)
    // Change City B color from green to yellow to red depending on stress
    cityBColor = cityBStress > 60 ? '#FF375F' : cityBStress > 30 ? '#FF9F0A' : '#30D158'
    cityBStatus = cityBStress > 60 ? 'Critical' : cityBStress > 30 ? 'Moderate' : 'Stable'
  }

  const animatedState = {
    cityA: { stress: cityAStress, color: cityAColor, status: cityAStatus, isFlood: isAActive },
    cityB: { stress: cityBStress, color: cityBColor, status: cityBStatus, isMigrating: isBActive }
  }

  const liveByProvince = {}
  cityStates.forEach(c => { if (c.province) liveByProvince[c.province] = c })

  // Highest-stress destination city — used to target recommendation actions
  const highStressCity = ALL_CITIES.reduce((best, city) => {
    const d = destMap[city.province]
    if (!d) return best
    if (!best) return city
    const bestD = destMap[best.province]
    return d.ecological_stress > (bestD?.ecological_stress ?? 0) ? city : best
  }, null)

  return (
    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      style={{ padding: '16px 20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      <ChainMap cityStates={cityStates} chainEvents={chainEvents} animatedState={animatedState} progress={progress} />
      <ChainHeader result={result} />
      <AggregatedKPIs agg={result.aggregated} />

      {/* Displacement chain */}
      <CascadeExplainer chainEvents={chainEvents} />

      {/* Ecological subsystem breakdown */}
      <EcoSubsystems result={result} chainEvents={chainEvents} animatedState={animatedState} />

      {/* City cards */}
      <SectionLabel>Ecological impact by city — all {ALL_CITIES.length} cities in the network</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 12 }}>
        {ALL_CITIES.map((city, i) => (
          <ProvinceCard
            key={city.id}
            index={i}
            city={city}
            asDestination={destMap[city.province] || null}
            asSource={srcMap[city.province]       || null}
            liveCity={liveByProvince[city.province] || null}
            timeline={getDestTimeline(result.groups, city.province)}
          />
        ))}
      </div>

      {/* Recommendations */}
      <SectionLabel>Policy recommendations — ranked by urgency across entire chain</SectionLabel>
      <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', padding: 18 }}>
        <RecommendationCards
          recommendations={result.recommendations}
          onSimulate={(category) => onSimulate(highStressCity?.id || 'halifax', category)}
        />
      </div>

    </motion.div>
  )
}

// ── Chain summary header ──────────────────────────────────────────────────────
function ChainHeader({ result }) {
  const { aggregated } = result
  const sev = sevStyle(aggregated.max_severity)
  const recoveryDisplay = aggregated.recovery_years_estimate < 1 ? '< 1' : String(aggregated.recovery_years_estimate)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)', marginBottom: 5 }}>
          Full Chain Reaction · Atlantic Canada
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F7', letterSpacing: '-0.5px', marginBottom: 4 }}>
          {aggregated.event_count} event{aggregated.event_count !== 1 ? 's' : ''} across {aggregated.provinces_affected.length} provinces
        </div>
        <div style={{ fontSize: 12, color: 'rgba(245,245,247,0.35)' }}>
          {formatPopulation(aggregated.total_population_displaced)} total displaced
          {aggregated.cascade_count > 0 && (
            <> · <span style={{ color: '#FF375F' }}>{aggregated.cascade_count} cascade{aggregated.cascade_count !== 1 ? 's' : ''} triggered</span></>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)', marginBottom: 3 }}>
            Worst recovery estimate
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#FFD60A' }}>
            {recoveryDisplay} yrs
          </div>
        </div>
        <div style={{ padding: '6px 16px', borderRadius: 10, background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>
          {aggregated.max_severity}
        </div>
      </div>
    </motion.div>
  )
}

// ── Aggregated KPIs ───────────────────────────────────────────────────────────
function AggregatedKPIs({ agg }) {
  const carbonGood = agg.total_carbon_delta_tonnes < 0
  const cards = [
    { label: 'Total Displaced',       display: formatPopulation(agg.total_population_displaced),     color: '#0A84FF',  sub: `across ${agg.event_count} events` },
    { label: 'Max Ecological Stress', display: <><AnimatedCounter to={Math.round(agg.max_ecological_stress)} /><span style={{ fontSize: 20 }}>%</span></>, color: agg.max_ecological_stress > 70 ? '#FF375F' : agg.max_ecological_stress > 50 ? '#FF9F0A' : '#30D158', sub: 'worst province affected' },
    { label: 'Total Carbon Shift / yr', display: formatCarbon(agg.total_carbon_delta_tonnes),        color: carbonGood ? '#30D158' : '#FF375F', sub: carbonGood ? 'net beneficial across all corridors' : 'added across all corridors' },
    { label: 'Total Habitat Lost',    display: formatHectares(agg.total_forest_loss_ha),             color: '#FF9F0A',  sub: 'cumulative forest & wetland converted' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
      {cards.map((c, i) => (
        <motion.div key={c.label}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.35 }}
          style={{ padding: '16px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)', marginBottom: 8 }}>{c.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: c.color, letterSpacing: '-1px', lineHeight: 1, marginBottom: 5 }}>{c.display}</div>
          <div style={{ fontSize: 11, color: 'rgba(245,245,247,0.30)' }}>{c.sub}</div>
        </motion.div>
      ))}
    </div>
  )
}

// ── Per-city card (expandable) ────────────────────────────────────────────────
function ProvinceCard({ city, asDestination, asSource, liveCity, index, timeline }) {
  const [expanded, setExpanded] = useState(false)

  const isReceiving  = !!asDestination
  const isDeparting  = !!asSource
  const isBoth       = isReceiving && isDeparting
  const isUnaffected = !isReceiving && !isDeparting

  const rolePill = isBoth
    ? { label: 'Source & Destination', color: '#BF5AF2', bg: 'rgba(191,90,242,0.10)', border: 'rgba(191,90,242,0.25)' }
    : isReceiving
      ? { label: 'Receiving',  color: '#FF375F', bg: 'rgba(255,55,95,0.10)',   border: 'rgba(255,55,95,0.25)'   }
      : isDeparting
        ? { label: 'Displaced', color: '#FF9F0A', bg: 'rgba(255,159,10,0.10)', border: 'rgba(255,159,10,0.25)' }
        : { label: 'Unaffected', color: '#30D158', bg: 'rgba(48,209,88,0.08)',  border: 'rgba(48,209,88,0.20)'  }

  const sev      = asDestination ? sevStyle(asDestination.severity) : null
  const ecoColor = liveCity
    ? (liveCity.ecoScore > 80 ? '#30D158' : liveCity.ecoScore > 60 ? '#FFD60A' : '#FF9F0A')
    : '#30D158'

  const canExpand = !!timeline

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.3 }}
      style={{ borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `1px solid ${isUnaffected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.09)'}`, overflow: 'hidden' }}>

      {/* Card header */}
      <div
        style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: canExpand ? 'pointer' : 'default' }}
        onClick={() => { if (canExpand) setExpanded(e => !e) }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: isUnaffected ? 'rgba(245,245,247,0.55)' : '#F5F5F7', letterSpacing: '-0.3px' }}>
            {city.name}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(245,245,247,0.28)', marginTop: 1 }}>
            {PROVINCE_DISPLAY[city.province] || city.province}
            {asDestination && asDestination.event_types.length > 0 && (
              <> · {asDestination.event_types.map(t => DISASTER_ICON[t] || '⚠️').join(' ')} {asDestination.event_types.join(', ')} · {asDestination.event_count} event{asDestination.event_count !== 1 ? 's' : ''}</>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {sev && (
            <div style={{ padding: '3px 10px', borderRadius: 7, background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>
              {asDestination.severity}
            </div>
          )}
          <div style={{ padding: '3px 10px', borderRadius: 7, background: rolePill.bg, border: `1px solid ${rolePill.border}`, color: rolePill.color, fontSize: 10, fontWeight: 700 }}>
            {rolePill.label}
          </div>
          {canExpand && (
            <div style={{ color: 'rgba(245,245,247,0.30)', fontSize: 12, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              ▾
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {isUnaffected && liveCity && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)' }}>
              Current status — not directly affected by this chain
            </div>
            <MetricBar label="City Stress" value={liveCity.stress}         display={`${liveCity.stress}%`} />
            <MetricBar label="Eco Health"  value={100 - liveCity.ecoScore} display={`${liveCity.ecoScore}%`} invert element="Earth" type="biodiversity" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <StatChip label="Population" value={formatPopulation(liveCity.pop)}    color="rgba(245,245,247,0.55)" />
              <StatChip label="Status"     value={liveCity.status.toUpperCase()}     color={ecoColor} />
            </div>
          </div>
        )}

        {asDestination && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)' }}>
                Ecological impact · {formatPopulation(asDestination.population)} people arrived
              </div>
              {timeline && <Sparkline timeline={timeline} />}
            </div>
            <MetricBar label="Ecological Stress"  value={asDestination.ecological_stress}        display={`${Math.round(asDestination.ecological_stress)}%`} />
            <MetricBar label="Watershed Stress"   value={asDestination.watershed_stress}         display={`${Math.round(asDestination.watershed_stress)}%`} element="Water" type="water" />
            <MetricBar label="Biodiversity Loss"  value={100 - asDestination.biodiversity_index} display={`Index ${Math.round(asDestination.biodiversity_index)}/100`} invert element="Earth" type="biodiversity" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 4 }}>
              <StatChip label="Habitat Lost"  value={formatHectares(asDestination.forest_loss_ha)}   color="#FF9F0A" />
              <StatChip label="Heat Island"   value={`+${asDestination.uhi_delta_c.toFixed(2)}°C`}   color="#FF375F" />
              <StatChip label="Recovery"      value={`~${asDestination.recovery_years} yrs`}          color="#FFD60A" />
            </div>
          </div>
        )}

        {isBoth && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />}

        {asSource && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)' }}>
              Departure recovery · {formatPopulation(asSource.displaced)} people left
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <RecoveryChip icon="🌱" label="Land Rewilding"   value={formatHectares(asSource.rewilded_ha)} />
              <RecoveryChip icon="🌿" label="Carbon Recovered" value={`+${Math.round(asSource.carbon_recovered).toLocaleString()} t/yr`} />
            </div>
          </div>
        )}

        {/* Expanded timeline chart */}
        <AnimatePresence>
          {expanded && timeline && (
            <motion.div
              key="chart"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}>
              <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)', marginBottom: 10 }}>
                  Month-by-month trajectory — {timeline.length} months
                </div>
                <TimelineChart timeline={timeline} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  )
}

// ── Small reusable pieces ─────────────────────────────────────────────────────
function MetricBar({ label, value, display, invert = false, type = 'default', element }) {
  const pct = Math.min(100, Math.max(0, value))
  const colorFn = elementColors[type] || elementColors.default
  const col = invert ? colorFn(100 - value) : colorFn(value)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(245,245,247,0.50)' }}>{label}</span>
          {element && (
            <span style={{
              fontSize: 7.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '1px 4px',
              borderRadius: 3,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              color: col,
            }}>
              {element}
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: col }}>{display}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 2, background: col, boxShadow: `0 0 6px ${col}44` }}
        />
      </div>
    </div>
  )
}

function StatChip({ label, value, color }) {
  return (
    <div style={{ padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)' }}>{label}</div>
    </div>
  )
}

function RecoveryChip({ icon, label, value }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(48,209,88,0.05)', border: '1px solid rgba(48,209,88,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#30D158' }}>{value}</div>
        <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)', marginBottom: -4 }}>
      {children}
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 20 }}>
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(255,55,95,0.15)' }} />
        <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', border: '1.5px solid rgba(255,55,95,0.5)', borderTopColor: 'transparent', animation: 'spin 0.9s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(245,245,247,0.55)', marginBottom: 4 }}>Modelling full chain reaction</div>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(245,245,247,0.22)' }}>
          Aggregating all disaster + cascade events across every province
        </div>
      </div>
    </div>
  )
}

function ErrorState({ error, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 16 }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#FF375F' }}>Analysis failed</div>
      <div style={{ fontSize: 12, color: 'rgba(245,245,247,0.35)', maxWidth: 360, textAlign: 'center' }}>{error}</div>
      <button onClick={onBack} style={{ marginTop: 8, padding: '8px 20px', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#F5F5F7', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
        ← Back to simulator
      </button>
    </div>
  )
}

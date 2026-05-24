import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useChainStore } from '../store/chainStore'
import { useCityFlowStore } from '../store/cityflowStore'
import { CITY_PROVINCE_MAP } from '../store/cityflowStore'
import { RecommendationCards } from '../components/insights/RecommendationCards'
import { formatCarbon, formatHectares, formatPopulation } from '../utils/formatters'
import { AnimatedCounter } from '../components/ui/AnimatedCounter'

const ALL_CITIES = [
  { id: 'moncton',       name: 'Moncton',        province: 'New Brunswick'        },
  { id: 'halifax',       name: 'Halifax',         province: 'Nova Scotia'          },
  { id: 'charlottetown', name: 'Charlottetown',   province: 'Prince Edward Island' },
  { id: 'st-johns',      name: "St. John's",      province: 'Newfoundland'         },
]

const SEV = {
  MINIMAL:  { color: '#30D158', bg: 'rgba(48,209,88,0.10)',   border: 'rgba(48,209,88,0.22)'   },
  LOW:      { color: '#30D158', bg: 'rgba(48,209,88,0.10)',   border: 'rgba(48,209,88,0.22)'   },
  MODERATE: { color: '#FF9F0A', bg: 'rgba(255,159,10,0.10)', border: 'rgba(255,159,10,0.22)'  },
  HIGH:     { color: '#FF375F', bg: 'rgba(255,55,95,0.10)',  border: 'rgba(255,55,95,0.22)'   },
  CRITICAL: { color: '#FF375F', bg: 'rgba(255,55,95,0.12)',  border: 'rgba(255,55,95,0.30)'   },
}
const sevStyle    = (s) => SEV[s] || SEV.MODERATE
const BAR_COLOR   = (v) => v > 75 ? '#FF375F' : v > 55 ? '#FF9F0A' : v > 35 ? '#FFD60A' : '#30D158'
const SEV_ORDER   = ['MINIMAL', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL']
const DISASTER_ICON = { wildfire: '🔥', flood: '🌊', heatwave: '☀️', drought: '🏜️', conflict: '⚡', cascade: '🔗' }

const PROV_SHORT = {
  'New Brunswick': 'NB', 'Nova Scotia': 'NS',
  'Prince Edward Island': 'PEI', 'Newfoundland': 'NL',
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
              result={result}
              cityStates={cityStates}
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

      <ChainHeader result={result} />
      <AggregatedKPIs agg={result.aggregated} />

      {/* Displacement chain */}
      <CascadeExplainer chainEvents={chainEvents} />

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
            {city.province}
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
            <MetricBar label="Eco Health"  value={100 - liveCity.ecoScore} display={`${liveCity.ecoScore}%`} invert />
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
            <MetricBar label="Watershed Stress"   value={asDestination.watershed_stress}         display={`${Math.round(asDestination.watershed_stress)}%`} />
            <MetricBar label="Biodiversity Loss"  value={100 - asDestination.biodiversity_index} display={`Index ${Math.round(asDestination.biodiversity_index)}/100`} invert />
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
function MetricBar({ label, value, display, invert = false }) {
  const pct = Math.min(100, Math.max(0, value))
  const col = invert ? BAR_COLOR(100 - value) : BAR_COLOR(value)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'rgba(245,245,247,0.50)' }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: col }}>{display}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 2, background: col, boxShadow: pct > 60 ? `0 0 6px ${col}55` : 'none' }}
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

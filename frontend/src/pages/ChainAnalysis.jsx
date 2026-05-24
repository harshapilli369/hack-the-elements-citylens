import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useChainStore } from '../store/chainStore'
import { RecommendationCards } from '../components/insights/RecommendationCards'
import { formatCarbon, formatHectares, formatPopulation } from '../utils/formatters'
import { AnimatedCounter } from '../components/ui/AnimatedCounter'

// All Atlantic Canada cities — always shown regardless of event involvement
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
const sevStyle = (s) => SEV[s] || SEV.MODERATE

const BAR_COLOR = (v) => v > 75 ? '#FF375F' : v > 55 ? '#FF9F0A' : v > 35 ? '#FFD60A' : '#30D158'
const SEV_ORDER = ['MINIMAL', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL']

const DISASTER_ICON = { wildfire: '🔥', flood: '🌊', heatwave: '☀️', drought: '🏜️', conflict: '⚡', cascade: '🔗' }


// ── Build per-province summary from backend groups ────────────────────────────
function buildProvinceData(groups) {
  const destMap = {}
  const srcMap  = {}

  for (const g of groups) {
    // --- destination ---
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

    // --- source ---
    const src = g.source_province
    if (!srcMap[src]) srcMap[src] = { displaced: 0, rewilded_ha: 0, carbon_recovered: 0, event_count: 0 }
    const s = srcMap[src]
    s.displaced        += g.total_population
    s.rewilded_ha      += g.scorecard.source_rewilded_ha
    s.carbon_recovered += g.scorecard.source_carbon_recovered
    s.event_count      += g.event_count
  }

  // convert Set → array
  Object.values(destMap).forEach(d => { d.event_types = [...d.event_types] })

  // build ordered province list — destinations first, then source-only
  const all = [...new Set([
    ...Object.keys(destMap).sort(),
    ...Object.keys(srcMap).sort(),
  ])]

  return { destMap, srcMap, provinces: all }
}

export default function ChainAnalysis() {
  const navigate = useNavigate()
  const { result, isLoading, error, cityStates } = useChainStore()

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
        <button onClick={() => navigate('/cityflow')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'rgba(245,245,247,0.40)', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F5F5F7'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,245,247,0.40)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
          🏙️ Back to Simulator
        </button>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {isLoading && !result && <LoadingState />}
        {error && !result && <ErrorState error={error} onBack={() => navigate('/cityflow')} />}

        <AnimatePresence>
          {result && <Dashboard result={result} cityStates={cityStates} />}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
function Dashboard({ result, cityStates }) {
  const { destMap, srcMap } = buildProvinceData(result.groups)

  // Build a live city lookup by province name
  const liveByProvince = {}
  cityStates.forEach(c => { if (c.province) liveByProvince[c.province] = c })

  return (
    <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      style={{ padding: '16px 20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      <ChainHeader result={result} />
      <AggregatedKPIs agg={result.aggregated} />

      {/* All 4 city cards — always rendered */}
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
          />
        ))}
      </div>

      {/* Recommendations */}
      <SectionLabel>Policy recommendations — ranked by urgency across entire chain</SectionLabel>
      <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', padding: 18 }}>
        <RecommendationCards recommendations={result.recommendations} />
      </div>

    </motion.div>
  )
}

// ── Chain summary header ──────────────────────────────────────────────────────
function ChainHeader({ result }) {
  const { aggregated } = result
  const sev = sevStyle(aggregated.max_severity)
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
            {aggregated.recovery_years_estimate} yrs
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
    {
      label: 'Total Displaced',
      display: formatPopulation(agg.total_population_displaced),
      color: '#0A84FF',
      sub: `across ${agg.event_count} events`,
    },
    {
      label: 'Max Ecological Stress',
      display: <><AnimatedCounter to={Math.round(agg.max_ecological_stress)} /><span style={{ fontSize: 20 }}>%</span></>,
      color: agg.max_ecological_stress > 70 ? '#FF375F' : agg.max_ecological_stress > 50 ? '#FF9F0A' : '#30D158',
      sub: 'worst province affected',
    },
    {
      label: 'Total Carbon Shift / yr',
      display: formatCarbon(agg.total_carbon_delta_tonnes),
      color: carbonGood ? '#30D158' : '#FF375F',
      sub: carbonGood ? 'net beneficial across all corridors' : 'added across all corridors',
    },
    {
      label: 'Total Habitat Lost',
      display: formatHectares(agg.total_forest_loss_ha),
      color: '#FF9F0A',
      sub: 'cumulative forest & wetland converted',
    },
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

// ── Per-city card ─────────────────────────────────────────────────────────────
function ProvinceCard({ city, asDestination, asSource, liveCity, index }) {
  const isReceiving = !!asDestination
  const isDeparting = !!asSource
  const isBoth      = isReceiving && isDeparting
  const isUnaffected = !isReceiving && !isDeparting

  const rolePill = isBoth
    ? { label: 'Source & Destination', color: '#BF5AF2', bg: 'rgba(191,90,242,0.10)', border: 'rgba(191,90,242,0.25)' }
    : isReceiving
      ? { label: 'Receiving',   color: '#FF375F', bg: 'rgba(255,55,95,0.10)',   border: 'rgba(255,55,95,0.25)'   }
      : isDeparting
        ? { label: 'Displaced',   color: '#FF9F0A', bg: 'rgba(255,159,10,0.10)', border: 'rgba(255,159,10,0.25)' }
        : { label: 'Unaffected',  color: '#30D158', bg: 'rgba(48,209,88,0.08)',  border: 'rgba(48,209,88,0.20)'  }

  const sev = asDestination ? sevStyle(asDestination.severity) : null
  const ecoColor = liveCity
    ? (liveCity.ecoScore > 80 ? '#30D158' : liveCity.ecoScore > 60 ? '#FFD60A' : '#FF9F0A')
    : '#30D158'

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.3 }}
      style={{ borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `1px solid ${isUnaffected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.09)'}`, overflow: 'hidden' }}>

      {/* Card header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Unaffected — show live city state from CityFlow */}
        {isUnaffected && liveCity && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)' }}>
              Current status — not directly affected by this chain
            </div>
            <MetricBar label="City Stress"    value={liveCity.stress}            display={`${liveCity.stress}%`} />
            <MetricBar label="Eco Health"     value={100 - liveCity.ecoScore}    display={`${liveCity.ecoScore}%`} invert />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <StatChip label="Population"   value={formatPopulation(liveCity.pop)}    color="rgba(245,245,247,0.55)" />
              <StatChip label="Status"       value={liveCity.status.toUpperCase()}     color={ecoColor} />
            </div>
          </div>
        )}

        {/* Destination: ecological stress section */}
        {asDestination && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)' }}>
              Ecological impact · {formatPopulation(asDestination.population)} people arrived
            </div>
            <MetricBar label="Ecological Stress"  value={asDestination.ecological_stress}        display={`${Math.round(asDestination.ecological_stress)}%`} />
            <MetricBar label="Watershed Stress"   value={asDestination.watershed_stress}         display={`${Math.round(asDestination.watershed_stress)}%`} />
            <MetricBar label="Biodiversity Loss"  value={100 - asDestination.biodiversity_index} display={`Index ${Math.round(asDestination.biodiversity_index)}/100`} invert />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 4 }}>
              <StatChip label="Habitat Lost"  value={formatHectares(asDestination.forest_loss_ha)}   color="#FF9F0A" />
              <StatChip label="Heat Island"   value={`+${asDestination.uhi_delta_c.toFixed(2)}°C`}   color="#FF375F" />
              <StatChip label="Recovery"      value={`~${asDestination.recovery_years} yrs`}         color="#FFD60A" />
            </div>
          </div>
        )}

        {isBoth && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />}

        {/* Source: recovery section */}
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
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(255,55,95,0.15)', animation: 'dangerPulse 1.5s infinite' }} />
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

import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useSimulationStore } from '../store/simulationStore'
import { fetchProvinces, fetchMigrationReasons, runSimulation } from '../utils/api'
import { CascadeTimeline } from '../components/charts/CascadeTimeline'
import { EnvironmentGauges } from '../components/charts/EnvironmentGauges'
import { RecommendationCards } from '../components/insights/RecommendationCards'
import { AtlanticIndicatorsPanel } from '../components/charts/AtlanticIndicatorsPanel'
import { AnimatedCounter } from '../components/ui/AnimatedCounter'
import { CrisisMap } from '../components/map/CrisisMap'
import { formatCarbon, formatHectares, formatPopulation } from '../utils/formatters'

const SEV = {
  Low:          { color: '#30D158', bg: 'rgba(48,209,88,0.10)',   border: 'rgba(48,209,88,0.22)'   },
  Moderate:     { color: '#FF9F0A', bg: 'rgba(255,159,10,0.10)', border: 'rgba(255,159,10,0.22)'  },
  High:         { color: '#FF375F', bg: 'rgba(255,55,95,0.10)',  border: 'rgba(255,55,95,0.22)'   },
  Critical:     { color: '#FF375F', bg: 'rgba(255,55,95,0.12)',  border: 'rgba(255,55,95,0.30)'   },
  Catastrophic: { color: '#FF375F', bg: 'rgba(255,55,95,0.15)',  border: 'rgba(255,55,95,0.40)'   },
}
function sevStyle(sev) { return SEV[sev] || SEV.Moderate }

export default function Simulate() {
  const navigate   = useNavigate()
  const store      = useSimulationStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const { result, isLoading } = store

  const { data: provinces = [] } = useQuery({ queryKey: ['provinces'],         queryFn: fetchProvinces })
  const { data: reasons   = [] } = useQuery({ queryKey: ['migration-reasons'], queryFn: fetchMigrationReasons })

  const autoRunFired = useRef(false)
  const bridgeFired  = useRef(false)

  async function handleRun() {
    store.setLoading(true)
    try {
      const res = await runSimulation({
        source_province:      store.source_province,
        destination_province: store.destination_province,
        population_size:      store.population_size,
        migration_reason:     store.migration_reason,
        duration_months:      store.duration_months,
      })
      store.setResult(res)
    } catch (e) {
      store.setError(e?.response?.data?.detail || e.message || 'Simulation failed')
    }
  }

  // Bridge: read URL params from CityFlow and auto-run
  useEffect(() => {
    if (provinces.length === 0 || bridgeFired.current) return
    const src     = searchParams.get('source')
    const dst     = searchParams.get('dest')
    const pop     = searchParams.get('pop')
    const reason  = searchParams.get('reason')
    const autorun = searchParams.get('autorun')
    if (!src || !dst || !autorun) return
    const srcValid = provinces.find(p => p.name === src)
    const dstValid = provinces.find(p => p.name === dst)
    if (!srcValid || !dstValid) return
    bridgeFired.current = true
    setSearchParams({}, { replace: true })
    store.loadCustom({
      source_province:      src,
      destination_province: dst,
      population_size:      Math.min(1000000, Math.max(5000, Number(pop) || 200000)),
      migration_reason:     reason || 'climate_displacement',
      duration_months:      24,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces.length])

  // Fire run once pendingAutoRun is set
  useEffect(() => {
    if (store.pendingAutoRun && provinces.length > 0 && !autoRunFired.current) {
      autoRunFired.current = true
      store.clearPendingAutoRun()
      handleRun()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.pendingAutoRun, provinces.length])

  const activeReason = reasons.find(r => r.id === store.migration_reason)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#07080F', overflow: 'hidden' }}>

      {/* Nav */}
      <nav style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(7,8,15,0.92)', backdropFilter: 'blur(20px)', zIndex: 40 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,245,247,0.50)', fontSize: 13, fontWeight: 500, transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#F5F5F7'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,245,247,0.50)'}>
          <span>🌿</span>
          <span style={{ fontWeight: 600, color: '#F5F5F7' }}>Chain Reaction</span>
          <span style={{ color: 'rgba(245,245,247,0.28)', fontSize: 12 }}>Ecological Model</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {result && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#30D158', animation: 'dangerPulse 2s infinite' }} />
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(245,245,247,0.50)' }}>
                {result.source_province} → {result.destination_province}
              </span>
            </div>
          )}
          <button onClick={() => navigate('/cityflow')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'rgba(245,245,247,0.40)', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F5F5F7'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,245,247,0.40)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
            🏙️ CityFlow
          </button>
        </div>
      </nav>

      {/* Simulation context bar — shown once params are loaded */}
      {(store.source_province && store.destination_province) && (
        <div style={{ flexShrink: 0, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap', rowGap: 6 }}>
            <ContextPill label="From" value={store.source_province} color="#FF9F0A" />
            <span style={{ color: 'rgba(245,245,247,0.20)', fontSize: 14 }}>→</span>
            <ContextPill label="To"   value={store.destination_province} color="#0A84FF" />
            <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
            <ContextPill label="Population" value={formatPopulation(store.population_size)} color="#30D158" />
            <ContextPill label="Reason" value={activeReason?.label || store.migration_reason.replace(/_/g, ' ')} color="#BF5AF2" />
            <ContextPill label="Projection" value={`${store.duration_months} months`} color="rgba(245,245,247,0.45)" />
          </div>
        </div>
      )}

      {/* Body — full width */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {isLoading && !result && <LoadingState />}
        {!isLoading && !result && <EmptyState onBack={() => navigate('/cityflow')} />}

        <AnimatePresence>
          {result && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
              style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: '100%' }}>

              <RouteHeader result={result} />

              {/* Interactive Crisis Map — element-themed heatmap */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
                style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.025)' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)' }}>
                    Interactive Crisis Map — Migration Flow &amp; Ecological Stress
                  </div>
                </div>
                <CrisisMap result={result} />
              </motion.div>

              <KPIStrip result={result} />

              <Panel label="Ecological Stress Indicators">
                <EnvironmentGauges scorecard={result.scorecard} />
              </Panel>

              <Panel label="Cascade Timeline — Destination vs Source">
                <CascadeTimeline
                  destinationTimeline={result.destination_timeline}
                  sourceTimeline={result.source_timeline}
                />
              </Panel>

              <Panel label="Policy Recommendations — Ranked by Urgency">
                <RecommendationCards recommendations={result.recommendations} />
              </Panel>

              <Panel label="Atlantic Canada Ecological Monitoring — 26 Real-World Indicators">
                <AtlanticIndicatorsPanel
                  scorecard={result.scorecard}
                  sourceInfo={result.source_info}
                  destInfo={result.dest_info}
                />
              </Panel>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Context pill ──────────────────────────────────────────────────────────────
function ContextPill({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
    </div>
  )
}

// ── Route header ──────────────────────────────────────────────────────────────
function RouteHeader({ result }) {
  const { scorecard, source_province, destination_province, population_size, migration_reason } = result
  const sev = sevStyle(scorecard.severity)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)', marginBottom: 4 }}>Ecological Impact Model · Canada</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F7', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {source_province}
          <span style={{ color: 'rgba(245,245,247,0.25)', fontSize: 14 }}>→</span>
          {destination_province}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(245,245,247,0.35)', marginTop: 3 }}>
          {formatPopulation(population_size)} people · {migration_reason.replace(/_/g, ' ')}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)', marginBottom: 3 }}>Recovery estimate</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#FFD60A' }}>{scorecard.recovery_years_estimate} yrs</div>
        </div>
        <div style={{ padding: '6px 16px', borderRadius: 10, background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>
          {scorecard.severity.toUpperCase()}
        </div>
      </div>
    </div>
  )
}

// ── KPI strip ─────────────────────────────────────────────────────────────────
function KPIStrip({ result }) {
  const { scorecard } = result
  const carbonGood = scorecard.carbon_is_beneficial
  const cards = [
    {
      label:   'Ecological Stress',
      display: <><AnimatedCounter to={scorecard.ecological_stress} /><span style={{ fontSize: 20 }}>%</span></>,
      color:   scorecard.ecological_stress > 70 ? '#FF375F' : scorecard.ecological_stress > 50 ? '#FF9F0A' : '#30D158',
      sub:     'composite score at destination',
    },
    {
      label:   'Carbon Shift / yr',
      display: formatCarbon(scorecard.total_carbon_delta_tonnes),
      color:   carbonGood ? '#30D158' : '#FF375F',
      sub:     carbonGood ? 'beneficial reduction' : 'added to atmosphere',
    },
    {
      label:   'Habitat Lost',
      display: formatHectares(scorecard.forest_loss_ha),
      color:   '#FF9F0A',
      sub:     'forest & wetland converted',
    },
    {
      label:   'Source Rewilding',
      display: formatHectares(scorecard.source_rewilded_ha),
      color:   '#30D158',
      sub:     'land in natural succession',
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

// ── Generic panel ─────────────────────────────────────────────────────────────
function Panel({ label, children, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      style={{ borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ padding: '14px 18px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)' }}>{label}</div>
      </div>
      <div style={{ flex: 1, padding: '18px' }}>{children}</div>
    </motion.div>
  )
}

// ── Loading state ─────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '80vh', gap: 20 }}>
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(48,209,88,0.15)', animation: 'dangerPulse 1.5s infinite' }} />
        <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', border: '1.5px solid rgba(48,209,88,0.4)', borderTopColor: 'transparent', animation: 'spin 0.9s linear infinite' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(245,245,247,0.55)', marginBottom: 4 }}>Modelling ecological cascade</div>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(245,245,247,0.22)' }}>Running Oke 1982 · SLOSS · NIR carbon data</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onBack }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 40, gap: 32 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🌿</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#F5F5F7', letterSpacing: '-0.4px', marginBottom: 8 }}>No simulation in progress</div>
        <div style={{ fontSize: 13, color: 'rgba(245,245,247,0.35)', maxWidth: 360, lineHeight: 1.65 }}>
          Trigger a disaster in the CityFlow simulator, then click <strong style={{ color: 'rgba(245,245,247,0.65)' }}>Analyse</strong> or <strong style={{ color: 'rgba(245,245,247,0.65)' }}>Model this displacement ecologically</strong> to run the ecological model here.
        </div>
      </div>
      <button onClick={onBack} style={{ padding: '10px 24px', borderRadius: 10, background: 'rgba(48,209,88,0.10)', border: '1px solid rgba(48,209,88,0.25)', color: '#30D158', fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.2px', transition: 'all 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(48,209,88,0.18)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(48,209,88,0.10)'}>
        🏙️ Go to CityFlow Simulator
      </button>
    </motion.div>
  )
}

import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '../store/simulationStore'
import { SimulationForm } from '../components/simulation/SimulationForm'
import { CrisisMap } from '../components/map/CrisisMap'
import { CascadeTimeline } from '../components/charts/CascadeTimeline'
import { EnvironmentGauges } from '../components/charts/EnvironmentGauges'
import { RiskRadar } from '../components/charts/RiskRadar'
import { RecommendationCards } from '../components/insights/RecommendationCards'
import { AIInsightPanel } from '../components/insights/AIInsightPanel'
import { AtlanticIndicatorsPanel } from '../components/charts/AtlanticIndicatorsPanel'
import { AnimatedCounter } from '../components/ui/AnimatedCounter'
import { getSeverityColor, formatCarbon, formatHectares, formatPopulation } from '../utils/formatters'

// ── Severity palette (Apple system) ──────────────────────────────────────────
const SEV = {
  Low:          { color: '#30D158', bg: 'rgba(48,209,88,0.10)',   border: 'rgba(48,209,88,0.22)'   },
  Moderate:     { color: '#FF9F0A', bg: 'rgba(255,159,10,0.10)', border: 'rgba(255,159,10,0.22)'  },
  High:         { color: '#FF375F', bg: 'rgba(255,55,95,0.10)',  border: 'rgba(255,55,95,0.22)'   },
  Critical:     { color: '#FF375F', bg: 'rgba(255,55,95,0.12)',  border: 'rgba(255,55,95,0.30)'   },
  Catastrophic: { color: '#FF375F', bg: 'rgba(255,55,95,0.15)',  border: 'rgba(255,55,95,0.40)'   },
}
function sevStyle(sev) { return SEV[sev] || SEV.Moderate }

export default function Simulate() {
  const navigate = useNavigate()
  const { result, isLoading } = useSimulationStore()

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#07080F', overflow: 'hidden' }}>

      {/* ── Top nav ─────────────────────────────────────────────────────── */}
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

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left sidebar */}
        <aside style={{ width: 300, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', background: 'rgba(255,255,255,0.015)', padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
          <SimulationForm />
        </aside>

        {/* Main dashboard */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {isLoading && !result && <LoadingState />}
          {!isLoading && !result && <EmptyState />}

          <AnimatePresence>
            {result && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: '100%' }}>

                {/* ── Route header ──────────────────────────────────────── */}
                <RouteHeader result={result} />

                {/* ── 4 KPI cards ───────────────────────────────────────── */}
                <KPIStrip result={result} />

                {/* ── Map + Gauges ──────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>
                  <Panel label="Migration Corridor" style={{ minHeight: 340 }}>
                    <div style={{ flex: 1, minHeight: 290 }}>
                      <CrisisMap result={result} />
                    </div>
                  </Panel>
                  <Panel label="Ecological Stress Indicators">
                    <EnvironmentGauges scorecard={result.scorecard} />
                  </Panel>
                </div>

                {/* ── Cascade timeline ──────────────────────────────────── */}
                <Panel label="Cascade Timeline — Destination vs Source">
                  <CascadeTimeline
                    destinationTimeline={result.destination_timeline}
                    sourceTimeline={result.source_timeline}
                  />
                </Panel>

                {/* ── Radar + AI ────────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Panel label="Dual Ecological Balance">
                    <RiskRadar scorecard={result.scorecard} sourceInfo={result.source_info} destInfo={result.dest_info} />
                  </Panel>
                  <Panel label="AI Ecological Analysis">
                    <AIInsightPanel result={result} />
                  </Panel>
                </div>

                {/* ── Recommendations ───────────────────────────────────── */}
                <Panel label="Policy Recommendations — Ranked by Urgency">
                  <RecommendationCards recommendations={result.recommendations} />
                </Panel>

                {/* ── Atlantic Canada Ecological Indicators ─────────────── */}
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
        </main>
      </div>
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
      <div style={{ display: 'flex', flex: 'center', alignItems: 'center', gap: 12 }}>
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

// ── 4 KPI cards ───────────────────────────────────────────────────────────────
function KPIStrip({ result }) {
  const { scorecard } = result
  const carbonGood = scorecard.carbon_is_beneficial
  const cards = [
    {
      label: 'Ecological Stress',
      value: scorecard.ecological_stress,
      display: <><AnimatedCounter to={scorecard.ecological_stress} /><span style={{ fontSize: 20 }}>%</span></>,
      color: scorecard.ecological_stress > 70 ? '#FF375F' : scorecard.ecological_stress > 50 ? '#FF9F0A' : '#30D158',
      sub: 'composite score at destination',
    },
    {
      label: 'Carbon Shift / yr',
      value: null,
      display: formatCarbon(scorecard.total_carbon_delta_tonnes),
      color: carbonGood ? '#30D158' : '#FF375F',
      sub: carbonGood ? 'beneficial reduction' : 'added to atmosphere',
    },
    {
      label: 'Habitat Lost',
      value: null,
      display: formatHectares(scorecard.forest_loss_ha),
      color: '#FF9F0A',
      sub: 'forest & wetland converted',
    },
    {
      label: 'Source Rewilding',
      value: null,
      display: formatHectares(scorecard.source_rewilded_ha),
      color: '#30D158',
      sub: 'land in natural succession',
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

// ── Generic section panel ─────────────────────────────────────────────────────
function Panel({ label, children, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      style={{ borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ padding: '14px 18px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)' }}>{label}</div>
      </div>
      <div style={{ flex: 1, padding: '18px 18px 18px' }}>{children}</div>
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
function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: 40, gap: 40 }}>

      {/* Central message */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🌿</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#F5F5F7', letterSpacing: '-0.4px', marginBottom: 8 }}>Configure a scenario, run the model</div>
        <div style={{ fontSize: 13, color: 'rgba(245,245,247,0.35)', maxWidth: 360, lineHeight: 1.65 }}>
          Set your province pair, migration reason, and population size in the sidebar. The dashboard will fill with data instantly.
        </div>
      </div>

      {/* Preview skeleton of what you'll see */}
      <div style={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.35 }}>
        {/* KPI skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {['Ecological Stress','Carbon Shift','Habitat Lost','Rewilding'].map(l => (
            <div key={l} style={{ height: 90, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 8, width: '60%', borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ height: 20, width: '40%', borderRadius: 4, background: 'rgba(255,255,255,0.10)' }} />
              <div style={{ height: 6, width: '80%', borderRadius: 3, background: 'rgba(255,255,255,0.06)' }} />
            </div>
          ))}
        </div>
        {/* Map + gauge skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 10 }}>
          <div style={{ height: 180, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
          <div style={{ height: 180, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
        </div>
        {/* Timeline skeleton */}
        <div style={{ height: 100, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {['Select provinces', 'Set parameters', 'Run model'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(48,209,88,0.12)', border: '1px solid rgba(48,209,88,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#30D158' }}>{i + 1}</div>
              <span style={{ fontSize: 12, color: 'rgba(245,245,247,0.35)', fontWeight: 500 }}>{s}</span>
            </div>
            {i < 2 && <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.08)' }} />}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

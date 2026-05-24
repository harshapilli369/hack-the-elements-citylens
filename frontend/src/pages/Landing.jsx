import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSimulationStore } from '../store/simulationStore'

const fade    = (delay = 0) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.5, ease: [0.25,0.1,0.25,1] } })
const fadeIn  = (delay = 0) => ({ initial: { opacity: 0         }, animate: { opacity: 1      }, transition: { delay, duration: 0.5 } })

const STATS = [
  { figure: '90,000', label: 'people displaced in 48 hours', note: 'Fort McMurray wildfire, 2016' },
  { figure: '30 yrs', label: 'average ecological recovery',  note: 'at a receiving city post-displacement' },
  { figure: '2.4 t',  label: 'CO₂ added per person per year', note: 'Quebec → Ontario economic migration' },
]

const STEPS = [
  { n: '1', color: '#FF375F', title: 'Disaster strikes', body: 'Wildfire, flood, conflict — people flee in hours.' },
  { n: '2', color: '#FF9F0A', title: 'Receiving cities absorb the shock', body: 'Infrastructure saturates. If stress tips past a threshold, those cities start pushing people out too.' },
  { n: '3', color: '#30D158', title: 'Ecology pays for decades', body: "Habitat converted. Carbon footprint shifted. Water demand exceeds watershed capacity. Virtually irreversible." },
]

const SCENARIOS = [
  { from: 'New Brunswick', to: 'Alberta',  reason: 'Oil & gas jobs',       key: 'nb_alberta',     impact: '+50 t CO₂/yr', sign: '+', color: '#FF375F', icon: '⛏️' },
  { from: 'Alberta',       to: 'Quebec',   reason: 'Climate displacement',  key: 'alberta_quebec', impact: '−50 t CO₂/yr', sign: '−', color: '#30D158', icon: '🌿' },
  { from: 'Quebec',        to: 'Ontario',  reason: 'Economic opportunity',  key: 'quebec_ontario', impact: '+2.4 t CO₂/yr', sign: '+', color: '#FF9F0A', icon: '💼' },
]

export default function Landing() {
  const navigate = useNavigate()
  const store    = useSimulationStore()

  function handlePreset(key) {
    store.loadPreset(key)
    navigate('/simulate')
  }

  return (
    <div style={{ background: '#07080F', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav style={{ padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(7,8,15,0.92)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🌿</span>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#F5F5F7', letterSpacing: '-0.3px' }}>Chain Reaction</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <NavBtn onClick={() => navigate('/cityflow')} label="CityFlow" />
          <NavBtnPrimary onClick={() => navigate('/simulate')} label="Simulate" />
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '96px 24px 80px', textAlign: 'center' }}>

        <motion.div {...fadeIn(0)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 40, background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.2)', color: '#30D158' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#30D158', animation: 'dangerPulse 2s infinite' }} />
          Environmental Intelligence · Canada
        </motion.div>

        <motion.h1 {...fade(0.06)}
          style={{ fontSize: 'clamp(40px,6vw,76px)', fontWeight: 700, letterSpacing: '-3px', lineHeight: 1.05, color: '#F5F5F7', maxWidth: 820, marginBottom: 16 }}>
          The ecological cost<br />
          <span style={{ background: 'linear-gradient(135deg,#FF375F,#FF9F0A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            doesn't stay at the fire.
          </span>
        </motion.h1>

        <motion.p {...fade(0.12)}
          style={{ fontSize: 20, fontWeight: 500, color: 'rgba(245,245,247,0.45)', marginBottom: 12, letterSpacing: '-0.2px' }}>
          It travels with the people.
        </motion.p>

        <motion.p {...fadeIn(0.18)}
          style={{ fontSize: 15, color: 'rgba(245,245,247,0.35)', maxWidth: 520, lineHeight: 1.7, marginBottom: 48 }}>
          Every disaster tool focuses on the origin. Nobody models what happens to the cities that absorb the displaced.
          Chain Reaction makes that invisible chain reaction visible.
        </motion.p>

        {/* CTAs */}
        <motion.div {...fadeIn(0.24)} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 96 }}>
          <button
            onClick={() => navigate('/cityflow')}
            style={{ padding: '14px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg,#FF375F,#FF9F0A)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 40px rgba(255,55,95,0.25)', letterSpacing: '-0.2px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', animation: 'dangerPulse 1.5s infinite' }} />
            Watch the Chain Reaction
          </button>
          <button
            onClick={() => navigate('/simulate')}
            style={{ padding: '14px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#30D158', background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.2)', cursor: 'pointer', letterSpacing: '-0.2px' }}>
            Run Ecological Model
          </button>
        </motion.div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <motion.div {...fadeIn(0.32)}
          style={{ width: '100%', maxWidth: 780, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 96 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: '32px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#F5F5F7', letterSpacing: '-1.5px', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace' }}>{s.figure}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(245,245,247,0.65)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(245,245,247,0.25)', lineHeight: 1.5 }}>{s.note}</div>
            </div>
          ))}
        </motion.div>

        {/* ── How it works ───────────────────────────────────────────────── */}
        <motion.div {...fadeIn(0.38)} style={{ width: '100%', maxWidth: 780, marginBottom: 96 }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)', marginBottom: 32, textAlign: 'left' }}>
            How the chain reaction works
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ padding: '20px', borderRadius: 16, background: `${s.color}06`, border: `1px solid ${s.color}18`, textAlign: 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: s.color, letterSpacing: '0.06em', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>0{s.n}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F5F5F7', marginBottom: 8, lineHeight: 1.3, letterSpacing: '-0.2px' }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(245,245,247,0.40)', lineHeight: 1.6 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Two tools ──────────────────────────────────────────────────── */}
        <motion.div {...fadeIn(0.44)} style={{ width: '100%', maxWidth: 780, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 96 }}>
          <ToolCard
            onClick={() => navigate('/cityflow')}
            badge="LIVE" badgeColor="#FF375F"
            icon="🏙️" iconBg="rgba(255,55,95,0.08)" iconBorder="rgba(255,55,95,0.2)"
            title="CityFlow Simulator"
            sub="The visceral demo"
            body="Watch disasters cascade through a city network in real time. Economic migration always running. Trigger a wildfire, see the chain reaction unfold."
            cta="Watch it happen"
            ctaColor="#FF9F0A"
            tags={['60fps Live', 'Disaster Cascade', 'Eco Degradation']}
          />
          <ToolCard
            onClick={() => navigate('/simulate')}
            badge="EVIDENCE" badgeColor="#30D158"
            icon="🌿" iconBg="rgba(48,209,88,0.08)" iconBorder="rgba(48,209,88,0.2)"
            title="Ecological Model"
            sub="The scientific layer"
            body="Province-to-province impact. Real data: Stats Canada, NIR carbon data, SLOSS biodiversity theory. CO₂ shift, forest loss, watershed stress."
            cta="Run the model"
            ctaColor="#30D158"
            tags={['CO₂ Shift', 'Forest Loss', 'Risk Score']}
          />
        </motion.div>

        {/* ── Scenarios ──────────────────────────────────────────────────── */}
        <motion.div {...fadeIn(0.5)} style={{ width: '100%', maxWidth: 780 }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)', marginBottom: 6, textAlign: 'left' }}>
            Real displacement scenarios
          </div>
          <div style={{ fontSize: 12, color: 'rgba(245,245,247,0.22)', marginBottom: 20, textAlign: 'left' }}>
            Each is a real Canadian migration pattern — click to load and model.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {SCENARIOS.map(s => (
              <button key={s.key} onClick={() => handlePreset(s.key)}
                style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.055)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)';  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}25`, padding: '2px 8px', borderRadius: 6 }}>{s.impact}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F7', marginBottom: 3, letterSpacing: '-0.2px' }}>{s.from} → {s.to}</div>
                <div style={{ fontSize: 11, color: 'rgba(245,245,247,0.35)' }}>{s.reason}</div>
              </button>
            ))}
          </div>
        </motion.div>

      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'rgba(245,245,247,0.2)' }}>Chain Reaction · Hack The Elements 2026</span>
        <span style={{ fontSize: 11, color: 'rgba(245,245,247,0.15)' }}>Stats Canada · National Inventory Report · CESI · Oke 1982</span>
      </footer>

    </div>
  )
}

function NavBtn({ onClick, label }) {
  return (
    <button onClick={onClick}
      style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: 'rgba(245,245,247,0.55)', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'all 0.15s ease' }}
      onMouseEnter={e => { e.currentTarget.style.color = '#F5F5F7'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(245,245,247,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
      {label}
    </button>
  )
}

function NavBtnPrimary({ onClick, label }) {
  return (
    <button onClick={onClick}
      style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#07080F', background: '#30D158', border: 'none', cursor: 'pointer' }}>
      {label}
    </button>
  )
}

function ToolCard({ onClick, badge, badgeColor, icon, iconBg, iconBorder, title, sub, body, cta, ctaColor, tags }) {
  return (
    <motion.button whileHover={{ y: -3 }} onClick={onClick}
      style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: iconBg, border: `1px solid ${iconBorder}` }}>{icon}</div>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: badgeColor, background: `${badgeColor}12`, border: `1px solid ${badgeColor}28`, padding: '3px 8px', borderRadius: 6 }}>{badge}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#F5F5F7', marginBottom: 3, letterSpacing: '-0.3px' }}>{title}</div>
      <div style={{ fontSize: 11, color: 'rgba(245,245,247,0.30)', marginBottom: 12 }}>{sub}</div>
      <p style={{ fontSize: 12, color: 'rgba(245,245,247,0.45)', lineHeight: 1.65, marginBottom: 16 }}>{body}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {tags.map(t => (
          <span key={t} style={{ fontSize: 10, fontWeight: 500, color: ctaColor, background: `${ctaColor}10`, border: `1px solid ${ctaColor}22`, padding: '2px 8px', borderRadius: 6 }}>{t}</span>
        ))}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: ctaColor, display: 'flex', alignItems: 'center', gap: 4 }}>
        {cta} <span>→</span>
      </div>
    </motion.button>
  )
}

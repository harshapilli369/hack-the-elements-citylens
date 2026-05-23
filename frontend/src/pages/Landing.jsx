import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSimulationStore } from '../store/simulationStore'

const CHAIN = [
  { icon: '👥', label: 'People move\nprovince to province', month: 'Start', color: '#00D4FF' },
  { icon: '🌲', label: 'Forests cleared\nfor new housing',    month: 'M2',   color: '#FFA502' },
  { icon: '🌿', label: 'Carbon footprint\nshifts by province',month: 'M3',   color: '#FF6B35' },
  { icon: '🌡️', label: 'Urban heat island\nintensifies',      month: 'M6',   color: '#FF4757' },
  { icon: '🦋', label: 'Biodiversity\ncorridors fragment',    month: 'M9',   color: '#C0392B' },
  { icon: '🌱', label: 'Source land begins\nto rewild',       month: 'M12+', color: '#2ED573' },
]

const METRICS = [
  { icon: '🌿', label: 'Carbon Shift',       color: '#2ED573', desc: 'Net CO₂ added or removed from the atmosphere when people relocate between provinces with different energy grids' },
  { icon: '🌲', label: 'Habitat Conversion', color: '#FFA502', desc: 'Hectares of boreal forest, wetland, and temperate rainforest cleared for urban expansion at the destination' },
  { icon: '💧', label: 'Watershed Stress',   color: '#00D4FF', desc: 'Increased draw on river systems and aquifers as population density rises in the destination watershed' },
  { icon: '🌡️', label: 'Urban Heat Island',  color: '#FF6B35', desc: 'Temperature rise in degrees Celsius from expanding impervious surfaces replacing vegetation cover' },
  { icon: '🦋', label: 'Biodiversity',       color: '#A29BFE', desc: 'Fragmentation of wildlife corridors and reduction in effective habitat for species at risk' },
  { icon: '🌱', label: 'Rewilding Potential',color: '#2ED573', desc: 'Abandoned farmland and depopulated rural areas entering natural succession at the source province' },
]

const EXAMPLES = [
  {
    from: 'New Brunswick',  to: 'Alberta',
    reason: 'Oil & gas jobs',
    key: 'nb_alberta',
    impact: '+50t CO₂/person/yr',
    color: '#FF4757',
    icon: '⛏️',
  },
  {
    from: 'Alberta',  to: 'Quebec',
    reason: 'Climate displacement',
    key: 'alberta_quebec',
    impact: '−50t CO₂/person/yr',
    color: '#2ED573',
    icon: '✅',
  },
  {
    from: 'Quebec',  to: 'Ontario',
    reason: 'Economic opportunity',
    key: 'quebec_ontario',
    impact: '+2.4t CO₂/person/yr',
    color: '#FFA502',
    icon: '💼',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const store = useSimulationStore()

  function handlePreset(key) {
    store.loadPreset(key)
    navigate('/simulate')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1117' }}>
      {/* Navbar */}
      <nav className="border-b border-[#21262D] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🌿</span>
          <span className="font-bold text-[#E6EDF3]">Chain Reaction</span>
          <span className="text-xs font-mono text-[#8B949E] hidden sm:block">Canada Ecological Migration Model</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/simulate')}
          className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
          style={{ background: '#2ED573', color: '#0D1117' }}>
          Open Simulator
        </motion.button>
      </nav>

      <div className="flex-1 flex flex-col items-center px-6 py-16">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono mb-8"
                    style={{ background: '#2ED57311', border: '1px solid #2ED57333', color: '#2ED573' }}>
          <span className="animate-pulse w-2 h-2 rounded-full bg-current" />
          Province-to-Province · Ecological Impact · Canada
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 }}
                   className="text-5xl md:text-7xl font-bold text-center mb-6"
                   style={{ letterSpacing: '-2px', lineHeight: 1.1 }}>
          <span style={{ color: '#E6EDF3' }}>Chain</span>{' '}
          <span style={{
            background: 'linear-gradient(135deg, #2ED573, #00D4FF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Reaction</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="text-lg md:text-xl text-center max-w-2xl mb-4"
                  style={{ color: '#8B949E', lineHeight: 1.7 }}>
          How does moving from one Canadian province to another permanently reshape the ecology of both regions?
        </motion.p>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="text-sm text-center max-w-xl mb-12"
                  style={{ color: '#8B949E' }}>
          When people move, they carry their carbon footprint with them — and they leave an ecological vacuum behind.
          Chain Reaction models the <strong style={{ color: '#E6EDF3' }}>full ecological cascade</strong>:
          forest loss, carbon shifts, watershed stress, urban heat, biodiversity fragmentation,
          and rewilding at the source.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="flex flex-wrap justify-center gap-4 mb-16">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                         onClick={() => navigate('/simulate')}
                         className="px-8 py-4 rounded-xl font-bold text-lg cursor-pointer"
                         style={{ background: 'linear-gradient(135deg, #2ED573, #00C484)', color: '#0D1117',
                                  boxShadow: '0 0 30px #2ED57333' }}>
            🌿 Model a Migration
          </motion.button>
        </motion.div>

        {/* Example scenarios with carbon numbers */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="w-full max-w-3xl mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-[#8B949E] text-center mb-4">
            Example Scenarios — Carbon Impact Per Person Per Year
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EXAMPLES.map(ex => (
              <motion.button
                key={ex.key}
                whileHover={{ y: -3, borderColor: ex.color }}
                onClick={() => handlePreset(ex.key)}
                className="glass p-4 rounded-xl text-left cursor-pointer transition-all"
                style={{ borderColor: '#21262D' }}
              >
                <div className="text-2xl mb-2">{ex.icon}</div>
                <div className="text-sm font-semibold text-[#E6EDF3] mb-1">
                  {ex.from} → {ex.to}
                </div>
                <div className="text-xs text-[#8B949E] mb-3">{ex.reason}</div>
                <div className="font-mono text-lg font-bold" style={{ color: ex.color }}>
                  {ex.impact}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 6 metrics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="w-full max-w-4xl mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-[#8B949E] text-center mb-4">
            What We Model
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {METRICS.map((m, i) => (
              <motion.div key={m.label} className="glass p-4 rounded-xl"
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.65 + i * 0.06 }}>
                <div className="text-xl mb-2">{m.icon}</div>
                <div className="text-sm font-semibold mb-1" style={{ color: m.color }}>{m.label}</div>
                <div className="text-xs text-[#8B949E] leading-relaxed">{m.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Chain reaction flow */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
                    className="w-full max-w-4xl glass p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-[#8B949E] mb-5 text-center">
            The Ecological Chain Reaction
          </p>
          <div className="flex items-start justify-between gap-2 overflow-x-auto pb-2">
            {CHAIN.map((step, i) => (
              <div key={i} className="flex items-start gap-1 shrink-0">
                <div className="text-center">
                  <div className="text-xs font-mono mb-1" style={{ color: '#8B949E' }}>{step.month}</div>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl"
                       style={{ background: `${step.color}12`, border: `1px solid ${step.color}33` }}>
                    {step.icon}
                  </div>
                  <div className="text-center mt-1 whitespace-pre leading-tight"
                       style={{ fontSize: '10px', color: step.color }}>
                    {step.label}
                  </div>
                </div>
                {i < CHAIN.length - 1 && (
                  <div className="text-[#30363D] text-lg mt-6 shrink-0">→</div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="border-t border-[#21262D] px-6 py-4 text-center text-xs text-[#8B949E]">
        Chain Reaction · Canada Ecological Migration Model · Data: Stats Canada, National Inventory Report, CESI
      </div>
    </div>
  )
}

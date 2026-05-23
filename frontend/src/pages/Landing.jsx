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
      <nav className="border-b border-[#21262D] px-6 py-4 flex items-center justify-between sticky top-0 z-50"
           style={{ background: 'rgba(13,17,23,0.96)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">🌿</span>
          <span className="font-bold text-[#E6EDF3]">Chain Reaction</span>
          <span className="text-xs font-mono text-[#8B949E] hidden sm:block">Environmental Intelligence Platform</span>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/cityflow')}
            className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer border border-[#21262D] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#30363D] transition-all">
            🏙️ CityFlow
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/simulate')}
            className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
            style={{ background: '#2ED573', color: '#0D1117' }}>
            🌿 Simulate
          </motion.button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center px-6 py-16">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono mb-8"
                    style={{ background: '#2ED57311', border: '1px solid #2ED57333', color: '#2ED573' }}>
          <span className="animate-pulse w-2 h-2 rounded-full bg-current" />
          Canada · Environmental Intelligence · Two Simulation Modes
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
          When people are displaced, ecosystems cascade. Model both sides of the crisis.
        </motion.p>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="text-sm text-center max-w-xl mb-12"
                  style={{ color: '#8B949E' }}>
          Two simulation engines. One platform. Understand how population displacement
          reshapes <strong style={{ color: '#E6EDF3' }}>provincial ecologies</strong> and
          triggers <strong style={{ color: '#E6EDF3' }}>urban infrastructure collapse</strong>.
        </motion.p>

        {/* Two primary simulator cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          {/* Ecological Migration Simulator */}
          <motion.button
            whileHover={{ y: -4, borderColor: '#2ED573' }}
            onClick={() => navigate('/simulate')}
            className="glass p-6 rounded-2xl text-left cursor-pointer transition-all group"
            style={{ borderColor: '#21262D' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                   style={{ background: '#2ED57315', border: '1px solid #2ED57333' }}>
                🌿
              </div>
              <div>
                <div className="font-bold text-[#E6EDF3]">Ecological Migration</div>
                <div className="text-xs font-mono text-[#8B949E]">Province-to-Province Model</div>
              </div>
            </div>
            <p className="text-sm text-[#8B949E] mb-5 leading-relaxed">
              Select two Canadian provinces and a migration scenario. Model how population redistribution
              reshapes forest cover, carbon emissions, watershed stress, and biodiversity over 24 months.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {['Forest Loss', 'Carbon Shift', 'Watershed', 'Heat Island', 'Rewilding'].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                      style={{ background: '#2ED57311', border: '1px solid #2ED57333', color: '#2ED573' }}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold"
                 style={{ color: '#2ED573' }}>
              Run Simulation
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </motion.button>

          {/* CityFlow Simulator */}
          <motion.button
            whileHover={{ y: -4, borderColor: '#38bdf8' }}
            onClick={() => navigate('/cityflow')}
            className="glass p-6 rounded-2xl text-left cursor-pointer transition-all group"
            style={{ borderColor: '#21262D' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                   style={{ background: '#38bdf815', border: '1px solid #38bdf833' }}>
                🏙️
              </div>
              <div>
                <div className="font-bold text-[#E6EDF3]">CityFlow Simulator</div>
                <div className="text-xs font-mono text-[#8B949E]">Live Disaster Cascade</div>
              </div>
            </div>
            <p className="text-sm text-[#8B949E] mb-5 leading-relaxed">
              Watch in real-time as disasters propagate through an interconnected city network.
              Trigger wildfires, floods, and heatwaves — observe how infrastructure saturation
              cascades into mass displacement.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {['Live Simulation', 'Disaster Triggers', 'Resource Stress', 'Cascade Events', '60 FPS'].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                      style={{ background: '#38bdf811', border: '1px solid #38bdf833', color: '#38bdf8' }}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold"
                 style={{ color: '#38bdf8' }}>
              Launch Live Demo
              <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
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
        Chain Reaction · Environmental Intelligence Platform · Data: Stats Canada, National Inventory Report, CESI
      </div>
    </div>
  )
}

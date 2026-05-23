import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useSimulationStore, PRESETS_LIST } from '../../store/simulationStore'
import { fetchProvinces, fetchMigrationReasons, runSimulation } from '../../utils/api'
import { formatPopulation } from '../../utils/formatters'

export function SimulationForm() {
  const store = useSimulationStore()
  const [runError, setRunError] = useState(null)

  const { data: provinces = [] } = useQuery({ queryKey: ['provinces'], queryFn: fetchProvinces })
  const { data: reasons = [] } = useQuery({ queryKey: ['migration-reasons'], queryFn: fetchMigrationReasons })

  const sourceProvince = provinces.find(p => p.name === store.source_province)
  const destProvince   = provinces.find(p => p.name === store.destination_province)

  async function handleRun() {
    store.setLoading(true)
    setRunError(null)
    try {
      const result = await runSimulation({
        source_province:      store.source_province,
        destination_province: store.destination_province,
        population_size:      store.population_size,
        migration_reason:     store.migration_reason,
        duration_months:      store.duration_months,
      })
      store.setResult(result)
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || 'Simulation failed'
      setRunError(msg)
      store.setError(msg)
    }
  }

  const selectClass = `
    w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-3 py-2.5 text-sm
    text-[#E6EDF3] focus:border-[#00D4FF] focus:outline-none transition-colors cursor-pointer
  `

  const carbonDelta = destProvince && sourceProvince
    ? destProvince.co2_per_capita - sourceProvince.co2_per_capita
    : null

  return (
    <div className="glass p-5 space-y-5">
      <div>
        <h2 className="text-base font-bold text-[#E6EDF3]">Migration Scenario</h2>
        <p className="text-xs text-[#8B949E] mt-0.5">Province-to-province ecological impact</p>
      </div>

      {/* Presets */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-widest text-[#8B949E] mb-2">
          Presets
        </label>
        <div className="space-y-1.5">
          {PRESETS_LIST.map(p => (
            <button
              key={p.key}
              onClick={() => store.loadPreset(p.key)}
              className={`
                w-full text-left px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer
                ${store.source_province === p.source_province && store.destination_province === p.destination_province
                  ? 'border-[#00D4FF] bg-[#00D4FF11] text-[#00D4FF]'
                  : 'border-[#21262D] text-[#8B949E] hover:border-[#30363D] hover:text-[#E6EDF3]'}
              `}
            >
              <span className="font-semibold">{p.label}</span>
              <span className="block text-[10px] mt-0.5 opacity-70">{p.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Province selectors */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-[#8B949E] mb-1.5">
            Source Province
          </label>
          <select value={store.source_province}
                  onChange={e => store.setInput('source_province', e.target.value)}
                  className={selectClass} style={{ backgroundImage: 'none' }}>
            {provinces.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
          {sourceProvince && (
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <ProvinceTag label="CO₂/capita" value={`${sourceProvince.co2_per_capita}t`} color="#00D4FF" />
              <ProvinceTag label="Forest" value={`${sourceProvince.forest_cover_pct}%`} color="#2ED573" />
            </div>
          )}
        </div>

        {/* Carbon delta preview */}
        {carbonDelta !== null && (
          <div className={`
            flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-bold border
            ${carbonDelta > 0
              ? 'bg-red-950 border-red-800 text-red-400'
              : 'bg-green-950 border-green-800 text-green-400'}
          `}>
            {carbonDelta > 0 ? '⬆' : '⬇'}
            {Math.abs(carbonDelta).toFixed(1)} t CO₂/person/year
            <span className="font-normal opacity-70">
              {carbonDelta > 0 ? 'increase' : 'decrease'}
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-[#8B949E] mb-1.5">
            Destination Province
          </label>
          <select value={store.destination_province}
                  onChange={e => store.setInput('destination_province', e.target.value)}
                  className={selectClass} style={{ backgroundImage: 'none' }}>
            {provinces.filter(p => p.name !== store.source_province).map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
          {destProvince && (
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <ProvinceTag label="CO₂/capita" value={`${destProvince.co2_per_capita}t`} color="#FF4757" />
              <ProvinceTag label="Biodiversity" value={`${destProvince.biodiversity_index}/100`} color="#A29BFE" />
            </div>
          )}
        </div>
      </div>

      {/* Migration reason */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-widest text-[#8B949E] mb-2">
          Migration Reason
        </label>
        <div className="space-y-1.5">
          {reasons.map(r => (
            <button
              key={r.id}
              onClick={() => store.setInput('migration_reason', r.id)}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all cursor-pointer text-left
                ${store.migration_reason === r.id
                  ? 'border-[#00D4FF] bg-[#00D4FF0D] text-[#00D4FF]'
                  : 'border-[#21262D] text-[#8B949E] hover:border-[#30363D]'}
              `}
            >
              <span className="text-base">{r.icon}</span>
              <div>
                <span className="font-semibold block">{r.label}</span>
                <span className="opacity-60 text-[10px]">{r.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Population slider */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-mono uppercase tracking-widest text-[#8B949E]">Population Moving</label>
          <span className="text-sm font-mono font-bold text-[#00D4FF]">{formatPopulation(store.population_size)}</span>
        </div>
        <input type="range" min={5000} max={1000000} step={5000}
               value={store.population_size}
               onChange={e => store.setInput('population_size', Number(e.target.value))}
               className="w-full" style={{ accentColor: '#00D4FF' }} />
        <div className="flex justify-between text-[10px] text-[#8B949E] mt-0.5">
          <span>5K</span><span>1M</span>
        </div>
      </div>

      {/* Duration slider */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-mono uppercase tracking-widest text-[#8B949E]">Projection Period</label>
          <span className="text-sm font-mono font-bold text-[#00D4FF]">{store.duration_months} months</span>
        </div>
        <input type="range" min={6} max={48} step={6}
               value={store.duration_months}
               onChange={e => store.setInput('duration_months', Number(e.target.value))}
               className="w-full" style={{ accentColor: '#00D4FF' }} />
        <div className="flex justify-between text-[10px] text-[#8B949E] mt-0.5">
          <span>6 mo</span><span>48 mo</span>
        </div>
      </div>

      {runError && (
        <div className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
          {runError}
        </div>
      )}

      <motion.button
        onClick={handleRun}
        disabled={store.isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          w-full py-3 rounded-xl font-bold text-sm cursor-pointer transition-all
          ${store.isLoading
            ? 'bg-[#21262D] text-[#8B949E] cursor-not-allowed'
            : 'bg-[#00D4FF] text-[#0D1117] hover:bg-[#00BFEF]'}
        `}
      >
        {store.isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-[#8B949E] border-t-transparent rounded-full" />
            Modelling ecology...
          </span>
        ) : '🌿 Model Ecological Impact'}
      </motion.button>
    </div>
  )
}

function ProvinceTag({ label, value, color }) {
  return (
    <div className="flex justify-between items-center px-2 py-1 rounded text-[10px]"
         style={{ background: `${color}11`, border: `1px solid ${color}33` }}>
      <span style={{ color: '#8B949E' }}>{label}</span>
      <span className="font-mono font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useSimulationStore, PRESETS_LIST, ATLANTIC_PROVINCES } from '../../store/simulationStore'
import { fetchProvinces, fetchMigrationReasons, runSimulation } from '../../utils/api'
import { formatPopulation } from '../../utils/formatters'

const G = '#30D158'
const R = '#FF375F'

export function SimulationForm() {
  const store = useSimulationStore()
  const navigate = useNavigate()
  const [runError, setRunError] = useState(null)
  const [showAllProvinces, setShowAllProvinces] = useState(false)
  const bridgeFired = useRef(false)
  const [searchParams, setSearchParams] = useSearchParams()

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

  // ── Preset or Custom Auto-run effect ───────────────────────────────────────
  useEffect(() => {
    if (store.pendingAutoRun && provinces.length > 0) {
      store.clearPendingAutoRun()
      handleRun()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.pendingAutoRun, provinces.length])

  // ── Bridge: read URL params from CityFlow and auto-run ────────────────────
  useEffect(() => {
    if (provinces.length === 0 || bridgeFired.current) return
    const src     = searchParams.get('source')
    const dst     = searchParams.get('dest')
    const pop     = searchParams.get('pop')
    const reason  = searchParams.get('reason')
    const autorun = searchParams.get('autorun')
    if (!src || !dst || !autorun) return

    // Validate provinces exist in API data
    const srcValid = provinces.find(p => p.name === src)
    const dstValid = provinces.find(p => p.name === dst)
    if (!srcValid || !dstValid) return

    bridgeFired.current = true
    setSearchParams({}, { replace: true }) // clear params from URL

    store.loadCustom({
      source_province:      src,
      destination_province: dst,
      population_size:      Math.min(1000000, Math.max(5000, Number(pop) || 200000)),
      migration_reason:     reason || 'climate_displacement',
      duration_months:      24,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces.length])

  const carbonDelta = destProvince && sourceProvince
    ? destProvince.co2_per_capita - sourceProvince.co2_per_capita
    : null

  const atlanticProvinces = provinces.filter(p => ATLANTIC_PROVINCES.includes(p.name))
  const visibleProvinces  = showAllProvinces ? provinces : atlanticProvinces

  // Filter preset list depending on Atlantic only vs All Provinces toggle
  const filteredPresets = PRESETS_LIST.filter(p => 
    showAllProvinces || (ATLANTIC_PROVINCES.includes(p.source_province) && ATLANTIC_PROVINCES.includes(p.destination_province))
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header section matching user sketch */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 16 }}>🌿</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F5F5F7', letterSpacing: '-0.3px' }}>Chain Reaction</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(245,245,247,0.30)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ecological Model</div>
        </div>

        {/* Current Flow Tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#30D158', animation: 'dangerPulse 2s infinite' }} />
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(245,245,247,0.65)', fontWeight: 600 }}>
            {store.source_province} → {store.destination_province}
          </span>
        </div>

        {/* Back to CityFlow Navigation Button */}
        <button
          onClick={() => navigate('/cityflow')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', padding: '8px 12px', borderRadius: 8,
            fontSize: 12, fontWeight: 600,
            color: 'rgba(245,245,247,0.70)',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            marginTop: 4
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#F5F5F7';
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(245,245,247,0.70)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
          }}
        >
          🏙️ CityFlow Simulator
        </button>
      </div>

      {/* Migration Scenario Subtitle */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(245,245,247,0.70)', letterSpacing: '-0.1px' }}>Migration Scenario</div>
          <div style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(48,209,88,0.10)', border: '1px solid rgba(48,209,88,0.20)', fontSize: 8, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: G }}>
            {showAllProvinces ? 'Canada' : 'Atlantic Canada'}
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(245,245,247,0.30)' }}>Province-to-province ecological chain reaction</div>
      </div>

      {/* Presets Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Label>Presets</Label>
          <button onClick={() => setShowAllProvinces(v => !v)}
            style={{ fontSize: 10, fontWeight: 500, color: '#0A84FF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {showAllProvinces ? '← Atlantic only' : 'All provinces'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
          {filteredPresets.map(p => {
            const active = store.source_province === p.source_province && store.destination_province === p.destination_province
            return (
              <button
                key={p.key}
                onClick={() => store.loadPreset(p.key)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 11.5,
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  background: active ? 'rgba(48,209,88,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${active ? '#30D158' : 'rgba(255,255,255,0.07)'}`,
                  color: active ? '#30D158' : 'rgba(245,245,247,0.60)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontWeight: 600 }}>{p.label}</span>
                </div>
                {p.description && (
                  <span style={{ fontSize: 9.5, color: 'rgba(245,245,247,0.30)', fontWeight: 400, lineHeight: 1.3 }}>
                    {p.description}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* From Province */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Label>From</Label>
        <ProvinceSelect
          value={store.source_province}
          onChange={v => store.setInput('source_province', v)}
          provinces={visibleProvinces}
        />
        {sourceProvince && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '6px 10px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <span style={{ fontSize: 9, color: 'rgba(245,245,247,0.30)', textTransform: 'uppercase', fontWeight: 600 }}>CO₂</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F7', fontFamily: 'JetBrains Mono, monospace' }}>{sourceProvince.co2_per_capita}t</span>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '6px 10px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <span style={{ fontSize: 9, color: 'rgba(245,245,247,0.30)', textTransform: 'uppercase', fontWeight: 600 }}>Forest</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#30D158', fontFamily: 'JetBrains Mono, monospace' }}>{sourceProvince.forest_cover_pct}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Carbon Delta Footprint Indicator in Between */}
      {carbonDelta !== null && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 12px',
          borderRadius: 12,
          background: carbonDelta > 0 ? 'rgba(255,55,95,0.04)' : 'rgba(48,209,88,0.04)',
          border: `1px solid ${carbonDelta > 0 ? 'rgba(255,55,95,0.15)' : 'rgba(48,209,88,0.15)'}`,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 800,
            color: carbonDelta > 0 ? '#FF375F' : '#30D158',
            lineHeight: 1,
            marginBottom: 2
          }}>
            {carbonDelta > 0 ? '↑' : '↓'}
          </div>
          <div style={{
            fontSize: 11.5,
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700,
            color: carbonDelta > 0 ? '#FF375F' : '#30D158',
          }}>
            {Math.abs(carbonDelta).toFixed(1)} t CO₂/person/yr
          </div>
          <div style={{
            fontSize: 9.5,
            color: 'rgba(245,245,247,0.40)',
            fontWeight: 500,
            marginTop: 2
          }}>
            {carbonDelta > 0 ? 'footprint rises' : 'footprint drops'}
          </div>
        </div>
      )}

      {/* To Province */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Label>To</Label>
        <ProvinceSelect
          value={store.destination_province}
          onChange={v => store.setInput('destination_province', v)}
          provinces={visibleProvinces.filter(p => p.name !== store.source_province)}
        />
        {destProvince && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '6px 10px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <span style={{ fontSize: 9, color: 'rgba(245,245,247,0.30)', textTransform: 'uppercase', fontWeight: 600 }}>CO₂</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F7', fontFamily: 'JetBrains Mono, monospace' }}>{destProvince.co2_per_capita}t</span>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '6px 10px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <span style={{ fontSize: 9, color: 'rgba(245,245,247,0.30)', textTransform: 'uppercase', fontWeight: 600 }}>Bio.</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#BF5AF2', fontFamily: 'JetBrains Mono, monospace' }}>{destProvince.biodiversity_index}/100</span>
            </div>
          </div>
        )}
      </div>

      {/* Migration Reason */}
      <div>
        <Label>Migration Reason</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {reasons.map(r => {
            const active = store.migration_reason === r.id
            return (
              <button
                key={r.id}
                onClick={() => store.setInput('migration_reason', r.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s',
                  background: active ? 'rgba(48,209,88,0.08)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${active ? 'rgba(48,209,88,0.40)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                {/* Radio dot */}
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${active ? G : 'rgba(255,255,255,0.20)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: G }} />}
                </div>
                <span style={{ fontSize: 14 }}>{r.icon}</span>
                <span style={{
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  color: active ? '#F5F5F7' : 'rgba(245,245,247,0.50)',
                  transition: 'all 0.15s',
                }}>{r.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <SliderField
          label="Population"
          value={formatPopulation(store.population_size)}
          min={5000} max={1000000} step={5000}
          current={store.population_size}
          onChange={v => store.setInput('population_size', v)}
          minLabel="5K" maxLabel="1M"
        />
        <SliderField
          label="Projection"
          value={`${store.duration_months} mo`}
          min={6} max={48} step={6}
          current={store.duration_months}
          onChange={v => store.setInput('duration_months', v)}
          minLabel="6 mo" maxLabel="48 mo"
        />
      </div>

      {/* Error */}
      {runError && (
        <div style={{
          fontSize: 11, color: R, padding: '10px 12px', borderRadius: 10,
          background: `${R}0A`, border: `1px solid ${R}30`,
        }}>
          {runError}
        </div>
      )}

      {/* Run button */}
      <motion.button
        onClick={handleRun}
        disabled={store.isLoading}
        whileHover={{ scale: store.isLoading ? 1 : 1.015 }}
        whileTap={{ scale: store.isLoading ? 1 : 0.985 }}
        style={{
          width: '100%', padding: '13px 0', borderRadius: 12,
          fontSize: 13, fontWeight: 700, cursor: store.isLoading ? 'not-allowed' : 'pointer',
          border: 'none', transition: 'all 0.2s', letterSpacing: '-0.2px',
          background: store.isLoading ? 'rgba(255,255,255,0.06)' : G,
          color: store.isLoading ? 'rgba(245,245,247,0.30)' : '#07080F',
          boxShadow: store.isLoading ? 'none' : `0 0 20px ${G}40`,
        }}>
        {store.isLoading
          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span className="animate-spin" style={{
                display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
                border: '2px solid rgba(245,245,247,0.20)', borderTopColor: 'rgba(245,245,247,0.50)',
              }} />
              Modelling…
            </span>
          : '🌿 Model Ecological Impact'}
      </motion.button>
    </div>
  )
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
      color: 'rgba(245,245,247,0.28)', marginBottom: 8,
    }}>
      {children}
    </div>
  )
}

function ProvinceSelect({ value, onChange, provinces }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 32px 9px 12px', borderRadius: 10,
          fontSize: 13, fontWeight: 500, cursor: 'pointer', appearance: 'none',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
          color: '#F5F5F7', outline: 'none', transition: 'border-color 0.15s',
        }}
        onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.20)' }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)' }}
      >
        {provinces.map(p => <option key={p.name} value={p.name} style={{ background: '#1a1a2e' }}>{p.name}</option>)}
      </select>
      <div style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        pointerEvents: 'none', color: 'rgba(245,245,247,0.30)', fontSize: 10,
      }}>▼</div>
    </div>
  )
}

function SliderField({ label, value, min, max, step, current, onChange, minLabel, maxLabel }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)' }}>
          {label}
        </div>
        <div style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: G }}>
          {value}
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={current}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: G, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: 'rgba(245,245,247,0.25)' }}>{minLabel}</span>
        <span style={{ fontSize: 10, color: 'rgba(245,245,247,0.25)' }}>{maxLabel}</span>
      </div>
    </div>
  )
}

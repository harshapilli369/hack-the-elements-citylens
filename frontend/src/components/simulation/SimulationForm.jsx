import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useSimulationStore, PRESETS_LIST, ATLANTIC_PROVINCES } from '../../store/simulationStore'
import { fetchProvinces, fetchMigrationReasons, runSimulation } from '../../utils/api'
import { formatPopulation } from '../../utils/formatters'

const G = '#30D158'
const R = '#FF375F'

export function SimulationForm() {
  const store = useSimulationStore()
  const [runError, setRunError] = useState(null)
  const [showAllProvinces, setShowAllProvinces] = useState(false)
  const autoRunFired = useRef(false)
  const bridgeFired  = useRef(false)
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

  useEffect(() => {
    if (store.pendingAutoRun && provinces.length > 0 && !autoRunFired.current) {
      autoRunFired.current = true
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
    // loadCustom sets pendingAutoRun which triggers handleRun via the effect above
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces.length])

  const carbonDelta = destProvince && sourceProvince
    ? destProvince.co2_per_capita - sourceProvince.co2_per_capita
    : null

  const atlanticProvinces = provinces.filter(p => ATLANTIC_PROVINCES.includes(p.name))
  const visibleProvinces  = showAllProvinces ? provinces : atlanticProvinces

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F5F5F7', letterSpacing: '-0.3px' }}>Migration Scenario</div>
          <div style={{ padding: '2px 7px', borderRadius: 5, background: 'rgba(10,132,255,0.12)', border: '1px solid rgba(10,132,255,0.25)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0A84FF' }}>Atlantic Canada</div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(245,245,247,0.35)' }}>Province-to-province ecological chain reaction</div>
      </div>

      {/* Presets */}
      <div>
        <Label>Presets</Label>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {PRESETS_LIST.map(p => {
            const active = store.source_province === p.source_province && store.destination_province === p.destination_province
            return (
              <button
                key={p.key}
                onClick={() => store.loadPreset(p.key)}
                style={{
                  flexShrink: 0,
                  padding: '5px 12px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  background: active ? `${G}14` : 'transparent',
                  border: `1px solid ${active ? G : 'rgba(255,255,255,0.09)'}`,
                  color: active ? G : 'rgba(245,245,247,0.40)',
                }}>
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Province selectors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Source */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)' }}>From</div>
            <button onClick={() => setShowAllProvinces(v => !v)}
              style={{ fontSize: 10, fontWeight: 500, color: '#0A84FF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {showAllProvinces ? '← Atlantic only' : 'All provinces'}
            </button>
          </div>
          <ProvinceSelect
            value={store.source_province}
            onChange={v => store.setInput('source_province', v)}
            provinces={visibleProvinces}
          />
          {sourceProvince && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <StatTag label="CO₂" value={`${sourceProvince.co2_per_capita}t`} color="#0A84FF" />
              <StatTag label="Forest" value={`${sourceProvince.forest_cover_pct}%`} color={G} />
            </div>
          )}
        </div>

        {/* Carbon delta */}
        {carbonDelta !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 10,
            background: carbonDelta > 0 ? `${R}0A` : `${G}0A`,
            border: `1px solid ${carbonDelta > 0 ? `${R}30` : `${G}30`}`,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: carbonDelta > 0 ? R : G }}>
              {carbonDelta > 0 ? '↑' : '↓'}
            </span>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: carbonDelta > 0 ? R : G }}>
              {Math.abs(carbonDelta).toFixed(1)} t CO₂/person/yr
            </span>
            <span style={{ fontSize: 10, color: 'rgba(245,245,247,0.30)' }}>
              {carbonDelta > 0 ? 'footprint rises' : 'footprint drops'}
            </span>
          </div>
        )}

        {/* Destination */}
        <div>
          <Label>To</Label>
          <ProvinceSelect
            value={store.destination_province}
            onChange={v => store.setInput('destination_province', v)}
            provinces={visibleProvinces.filter(p => p.name !== store.source_province)}
          />
          {destProvince && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <StatTag label="CO₂" value={`${destProvince.co2_per_capita}t`} color="#FF9F0A" />
              <StatTag label="Bio." value={`${destProvince.biodiversity_index}/100`} color="#BF5AF2" />
            </div>
          )}
        </div>
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
                  background: active ? `${G}0D` : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${active ? `${G}55` : 'rgba(255,255,255,0.07)'}`,
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

function StatTag({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 7,
      background: `${color}0D`, border: `1px solid ${color}22`,
    }}>
      <span style={{ fontSize: 10, color: 'rgba(245,245,247,0.35)' }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color }}>{value}</span>
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

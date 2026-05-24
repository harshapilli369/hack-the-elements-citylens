import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCityFlowStore } from '../store/cityflowStore'
import { useSimulationStore } from '../store/simulationStore'
import { useChainStore } from '../store/chainStore'
import { SimulationMap } from '../components/cityflow/SimulationMap'
import { ControlPanel } from '../components/cityflow/ControlPanel'
import { OnboardingOverlay } from '../components/cityflow/OnboardingOverlay'
import { EcoBridge } from '../components/cityflow/EcoBridge'
import { CITY_PROVINCE_MAP, DISASTER_RECEIVER_MAP } from '../store/cityflowStore'
import { useWeatherAutoTrigger } from '../hooks/useWeatherAutoTrigger'
import '../components/cityflow/cityflow.css'

function useSituationReport(cities, migrants, activeDisasters, cascadeCount, migrationWeights, totalDisplaced) {
  return useMemo(() => {
    const disasterCities = cities.filter(c => c.isDisasterActive)
    const criticalCities = cities.filter(c => c.status === 'critical')
    const ecoWarning     = cities.find(c => (c.ecoScore ?? 100) < 65)
    const economicFlow   = migrants.filter(m => m.type === 'economic').reduce((s, m) => s + m.count, 0)

    // Derive dominant driver label from weights
    const w = migrationWeights || {}
    const dominantKey = Object.entries(w).sort((a, b) => b[1] - a[1])[0]?.[0] || 'economic'
    const driverLabels = { economic: 'economic opportunity', housing: 'housing affordability', climate: 'climate & lifestyle' }
    const dominantLabel = driverLabels[dominantKey] || 'economic opportunity'

    if (disasterCities.length >= 2) return { text: `Multi-city crisis — ${disasterCities.length} simultaneous disasters destabilising the entire regional network`, severity: 'critical', dot: '#FF375F' }
    if (cascadeCount > 0 && disasterCities.length > 0) {
      const c = disasterCities[0]
      return { text: `Chain reaction active — ${c.disasterType} in ${c.name} has pushed neighbouring cities past capacity, triggering forced evacuation`, severity: 'critical', dot: '#FF375F' }
    }
    if (disasterCities.length > 0) {
      const c = disasterCities[0]
      return { text: `${c.disasterType?.charAt(0).toUpperCase()}${c.disasterType?.slice(1)} striking ${c.name} — disaster refugees flooding connected cities`, severity: 'warning', dot: '#FF9F0A' }
    }
    if (criticalCities.length > 0) {
      const c = criticalCities[0]
      return { text: `${c.name} at breaking point — ${Math.round(c.stress)}% stress; forced evacuation imminent`, severity: 'warning', dot: '#FFD60A' }
    }
    if (totalDisplaced > 5000) return { text: `Displacement continuing — ${(totalDisplaced / 1000).toFixed(1)}k people forced from their homes; receiving cities absorbing the ecological cost`, severity: 'warning', dot: '#FFD60A' }
    if (ecoWarning) {
      const lost = Math.round(100 - (ecoWarning.ecoScore ?? 100))
      return { text: `Ecological warning — ${ecoWarning.name} eco-health at ${Math.round(ecoWarning.ecoScore ?? 0)} (${lost} pts lost); in-migration converting habitat`, severity: 'info', dot: '#30D158' }
    }
    if (economicFlow > 200) return { text: `${(economicFlow / 1000).toFixed(1)}k people in voluntary migration driven by ${dominantLabel} — land use quietly shifting`, severity: 'stable', dot: '#0A84FF' }
    return { text: `Network in equilibrium. Background migration driven by ${dominantLabel} is the only force at work — slow, invisible, cumulative.`, severity: 'stable', dot: 'rgba(245,245,247,0.25)' }
  }, [cities, migrants, activeDisasters, cascadeCount, migrationWeights, totalDisplaced])
}

export default function CityFlowSimulator() {
  const navigate      = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [panelWidth, setPanelWidth] = useState(320)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(320)

  const tick              = useCityFlowStore(state => state.tick)
  const isRunning         = useCityFlowStore(state => state.sim.isRunning)
  const totalInTransit    = useCityFlowStore(state => state.sim.totalInTransit)
  const activeDisasters   = useCityFlowStore(state => state.sim.activeDisasters)
  const totalDisplaced    = useCityFlowStore(state => state.sim.totalDisplaced)
  const cascadeCount      = useCityFlowStore(state => state.sim.cascadeCount)
  const cascadeAlert      = useCityFlowStore(state => state.sim.cascadeAlert)
  const migrationWeights  = useCityFlowStore(state => state.sim.migrationWeights)
  const clearCascadeAlert = useCityFlowStore(state => state.clearCascadeAlert)
  const cities            = useCityFlowStore(state => state.cities)
  const migrants          = useCityFlowStore(state => state.migrants)
  const events            = useCityFlowStore(state => state.events)
  const chainLog          = useCityFlowStore(state => state.chainLog)
  const triggerDisaster   = useCityFlowStore(state => state.triggerDisaster)
  const selectCity        = useCityFlowStore(state => state.selectCity)
  const simStore          = useSimulationStore()
  const chainStore        = useChainStore()

  const [disasterSummary, setDisasterSummary] = useState(null)
  const [cascadeBanner,   setCascadeBanner]   = useState(null)
  const [showOnboarding,  setShowOnboarding]  = useState(false)

  const prevEventCount     = useRef(0)
  const summaryTimer       = useRef(null)
  const cascadeBannerTimer = useRef(null)
  const lastCascadeId      = useRef(null)
  const autoPlayTimers     = useRef([])

  useWeatherAutoTrigger()

  const situation = useSituationReport(cities, migrants, activeDisasters, cascadeCount, migrationWeights, totalDisplaced)
  const avgEco    = Math.round(cities.reduce((s, c) => s + (c.ecoScore ?? 100), 0) / cities.length)

  useEffect(() => {
    const isDemo = searchParams.get('demo') === 'true'
    if (isDemo) { setSearchParams({}); runAutoPlay() }
    else setShowOnboarding(true)
    return () => autoPlayTimers.current.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function runAutoPlay() {
    setShowOnboarding(false)
    const push = (fn, ms) => autoPlayTimers.current.push(setTimeout(fn, ms))
    push(() => selectCity('moncton'), 900)
    push(() => triggerDisaster('moncton', 'wildfire'), 2400)   // NB wildfire → people flee to Halifax
    push(() => selectCity('st-johns'), 11000)
    push(() => triggerDisaster('st-johns', 'flood'), 12500)    // NL flood → people flee to Halifax
  }

  useEffect(() => {
    let id, last = 0
    const loop = (t) => { if (t - last >= 1000 / 60) { tick(); last = t }; id = requestAnimationFrame(loop) }
    if (isRunning) id = requestAnimationFrame(loop)
    return () => { if (id) cancelAnimationFrame(id) }
  }, [isRunning, tick])

  useEffect(() => {
    if (!cascadeAlert || cascadeAlert.id === lastCascadeId.current) return
    lastCascadeId.current = cascadeAlert.id
    setCascadeBanner(cascadeAlert.cityName)
    clearTimeout(cascadeBannerTimer.current)
    cascadeBannerTimer.current = setTimeout(() => { setCascadeBanner(null); clearCascadeAlert() }, 4500)
  }, [cascadeAlert, clearCascadeAlert])

  useEffect(() => {
    if (events.length <= prevEventCount.current) { prevEventCount.current = events.length; return }
    prevEventCount.current = events.length
    const newest = events[0]
    if (!newest || newest.severity !== 'info' || !newest.msg.includes('subsided')) return
    const cityName = newest.msg.replace(' disaster has subsided', '')
    const city     = cities.find(c => c.name === cityName)
    if (!city) return
    const displaced    = Math.max(0, city.basePop - city.pop)
    const ecoLost      = Math.round(100 - (city.ecoScore ?? 100))
    const landPressure = Math.round(Math.max(0, (city.pop - city.basePop) * 0.08))
    const carbonAdded  = Math.round(displaced * 1.2 / 1000)
    setDisasterSummary({ cityName: city.name, cityId: city.id, stress: Math.round(city.stress), displaced, ecoLost, landPressure, carbonAdded, status: city.status })
    clearTimeout(summaryTimer.current)
    summaryTimer.current = setTimeout(() => setDisasterSummary(null), 12000)
  }, [events, cities])

  function handlePanelDragStart(e) {
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = panelWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (me) => {
      if (!isDragging.current) return
      const delta = dragStartX.current - me.clientX
      const next = Math.min(580, Math.max(260, dragStartWidth.current + delta))
      setPanelWidth(next)
    }
    const onUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  async function handleBridgeToEcological() {
    // If chainLog has entries, run full chain analysis
    const validEntries = chainLog.filter(
      e => e.destId && CITY_PROVINCE_MAP[e.sourceId] && CITY_PROVINCE_MAP[e.destId]
    )

    if (validEntries.length === 0) {
      // Fallback: disaster still active, no resolved events yet — single-event to /simulate
      const sorted     = [...cities].sort((a, b) => (b.basePop - b.pop) - (a.basePop - a.pop))
      const sourceCity = sorted[0]
      const destCity   = sorted.find(c => c.pop > c.basePop) || cities.find(c => c.id !== sourceCity.id)
      const displaced  = Math.max(50000, Math.min(800000, Math.round(Math.abs(sourceCity.basePop - sourceCity.pop))))
      const sourceProvince = CITY_PROVINCE_MAP[sourceCity?.id]?.province || 'New Brunswick'
      const destProvince   = CITY_PROVINCE_MAP[destCity?.id]?.province   || 'Nova Scotia'
      const params = new URLSearchParams({
        source: sourceProvince, dest: destProvince,
        pop: String(displaced || 200000), reason: 'climate_displacement', autorun: '1',
      })
      navigate(`/simulate?${params.toString()}`)
      return
    }

    // Build events array for chain endpoint
    const events = validEntries.map(e => ({
      source_province:      CITY_PROVINCE_MAP[e.sourceId].province,
      destination_province: CITY_PROVINCE_MAP[e.destId].province,
      population_size:      Math.max(1000, e.displaced),
      disaster_type:        e.disasterType,
      event_type:           e.eventType,
    }))

    chainStore.reset()
    chainStore.setCityStates(cities.map(c => ({
      id: c.id, name: c.name,
      province: CITY_PROVINCE_MAP[c.id]?.province,
      pop: c.pop, basePop: c.basePop,
      stress: Math.round(c.stress),
      ecoScore: Math.round(c.ecoScore ?? 100),
      status: c.status,
    })))
    chainStore.setLoading(true)
    navigate('/chain-analysis')

    try {
      const res = await fetch('/api/simulate/chain', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ events, duration_months: 24 }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      chainStore.setResult(await res.json())
    } catch (err) {
      chainStore.setError(err.message)
    }
  }

  const fmtK = n => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`

  return (
    <div className="cityflow-container" style={{ width: '100%', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', background: '#07080F' }}>

      {/* Onboarding */}
      {showOnboarding && <OnboardingOverlay onDismiss={() => setShowOnboarding(false)} onAutoPlay={() => { setShowOnboarding(false); runAutoPlay() }} />}

      {/* Cascade banner */}
      {cascadeBanner && (
        <div style={{ position: 'absolute', top: 64, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', pointerEvents: 'none', animation: 'slideDown 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderRadius: 12, background: 'rgba(7,8,15,0.92)', border: '1px solid rgba(255,55,95,0.35)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(255,55,95,0.15)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF375F', animation: 'dangerPulse 1s infinite' }} />
            <span style={{ color: '#FF375F', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em' }}>CHAIN REACTION</span>
            <span style={{ color: 'rgba(245,245,247,0.40)', fontSize: 12 }}>—</span>
            <span style={{ color: '#F5F5F7', fontWeight: 600, fontSize: 13 }}>{cascadeBanner}</span>
            <span style={{ color: 'rgba(245,245,247,0.40)', fontSize: 12 }}>overloaded, forcing evacuation into the network</span>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{ height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(7,8,15,0.92)', backdropFilter: 'blur(20px)', zIndex: 30 }}>

        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,245,247,0.45)', transition: 'color 0.15s', fontSize: 13, fontWeight: 500 }}
            onMouseEnter={e => e.currentTarget.style.color = '#F5F5F7'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,245,247,0.45)'}>
            <span>🌿</span>Chain Reaction
          </button>
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.10)' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F5F5F7', letterSpacing: '-0.3px' }}>
              CityFlow <span style={{ color: '#0A84FF' }}>Simulator</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.25)' }}>Live Cascade · {isRunning ? 'Running' : 'Paused'}</div>
          </div>
        </div>

        {/* Right: Stats + bridge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Stats pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
            <HeaderStat label="Transit"   value={fmtK(totalInTransit)} />
            <StatDiv />
            <HeaderStat label="Displaced" value={fmtK(totalDisplaced)} color={totalDisplaced > 0 ? '#FF9F0A' : undefined} />
            <StatDiv />
            <HeaderStat label="Cascades"  value={cascadeCount}         color={cascadeCount > 0 ? '#FF375F' : undefined} pulse={cascadeCount > 0} />
            <StatDiv />
            <HeaderStat label="Disasters" value={activeDisasters}      color={activeDisasters > 0 ? '#FF375F' : undefined} pulse={activeDisasters > 0} />
            <StatDiv />
            <HeaderStat label="Eco"       value={`${avgEco}%`}        color={avgEco > 80 ? '#30D158' : avgEco > 60 ? '#FFD60A' : '#FF9F0A'} />
          </div>

          {/* Bridge button */}
          <button onClick={handleBridgeToEcological}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
              color:       activeDisasters > 0 || totalDisplaced > 0 ? '#30D158' : 'rgba(245,245,247,0.30)',
              background:  activeDisasters > 0 || totalDisplaced > 0 ? 'rgba(48,209,88,0.10)' : 'transparent',
              border:      activeDisasters > 0 || totalDisplaced > 0 ? '1px solid rgba(48,209,88,0.25)' : '1px solid rgba(255,255,255,0.07)',
            }}>
            🌿
            <span>Analyse</span>
            {(activeDisasters > 0 || totalDisplaced > 0) && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#30D158', animation: 'dangerPulse 1.5s infinite' }} />}
          </button>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 12, gap: 12, position: 'relative' }}>

        {/* Map area */}
        <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.07)', background: '#07080F' }}>
          {/* Region label */}
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, padding: '5px 10px', borderRadius: 8, background: 'rgba(7,8,15,0.75)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.30)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M2 12h20"/></svg>
            Atlantic Canada
          </div>

          <SimulationMap />

          {/* Eco Bridge — floats over map after disaster resolves */}
          <EcoBridge />

          {/* Situation report */}
          <div style={{ position: 'absolute', bottom: 44, left: 12, right: 12, zIndex: 20 }}>
            <div style={{ padding: '9px 14px', borderRadius: 10, background: 'rgba(7,8,15,0.82)', border: `1px solid ${situation.dot}28`, backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: situation.dot, boxShadow: `0 0 8px ${situation.dot}`, marginTop: 3, flexShrink: 0, animation: situation.severity !== 'stable' ? 'dangerPulse 1.5s infinite' : 'none' }} />
              <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(245,245,247,0.55)', lineHeight: 1.6, flex: 1 }}>{situation.text}</p>
            </div>
          </div>

          {/* Status legend */}
          <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '5px 10px', borderRadius: 8, background: 'rgba(7,8,15,0.75)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
            {[['#30D158','<35%'],['#FFD60A','35–55%'],['#FF9F0A','55–75%'],['#FF375F','>75%']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
                <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(245,245,247,0.30)', letterSpacing: '0.04em' }}>{l}</span>
              </div>
            ))}
            <span style={{ fontSize: 9, color: 'rgba(245,245,247,0.18)' }}>stress</span>
          </div>

          {/* Migrant legend */}
          <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '5px 10px', borderRadius: 8, background: 'rgba(7,8,15,0.75)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
            {[['#30D158','Economic'],['#0A84FF','Disaster'],['#FF375F','Cascade']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, opacity: 0.8 }} />
                <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(245,245,247,0.30)', letterSpacing: '0.04em' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={handlePanelDragStart}
          style={{
            width: 6, flexShrink: 0, cursor: 'col-resize', borderRadius: 3,
            background: 'transparent', transition: 'background 0.15s', position: 'relative', zIndex: 10,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        />

        <ControlPanel width={panelWidth} />
      </main>

      {/* ── Disaster resolution card ────────────────────────────────────── */}
      {disasterSummary && (
        <div style={{ position: 'absolute', top: 68, left: '50%', transform: 'translateX(-50%)', zIndex: 50, width: 440, borderRadius: 18, overflow: 'hidden', background: 'rgba(7,8,15,0.97)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', backdropFilter: 'blur(24px)', animation: 'slideDown 0.3s ease' }}>
          <div style={{ height: 2, background: 'linear-gradient(90deg,#FF375F,#FF9F0A,#FFD60A)' }} />
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)', marginBottom: 4 }}>Disaster Resolved</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#F5F5F7', letterSpacing: '-0.4px' }}>{disasterSummary.cityName}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', padding: '3px 9px', borderRadius: 7, color: disasterSummary.status === 'critical' ? '#FF375F' : '#FF9F0A', background: disasterSummary.status === 'critical' ? 'rgba(255,55,95,0.10)' : 'rgba(255,159,10,0.10)', border: `1px solid ${disasterSummary.status === 'critical' ? 'rgba(255,55,95,0.25)' : 'rgba(255,159,10,0.25)'}` }}>{disasterSummary.status.toUpperCase()}</span>
                <button onClick={() => setDisasterSummary(null)} style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: 'rgba(245,245,247,0.40)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[
                { label: 'Stress',    value: `${disasterSummary.stress}%`,    color: disasterSummary.stress > 80 ? '#FF375F' : '#FF9F0A' },
                { label: 'Displaced', value: disasterSummary.displaced > 0 ? fmtK(disasterSummary.displaced) : '—', color: '#0A84FF' },
                { label: 'Land Lost', value: disasterSummary.landPressure > 0 ? `${disasterSummary.landPressure}ha` : '—', color: '#BF5AF2' },
                { label: 'CO₂',       value: disasterSummary.carbonAdded > 0 ? `${disasterSummary.carbonAdded}kt` : '—', color: '#FFD60A' },
              ].map(m => (
                <div key={m.label} style={{ padding: '10px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)', marginBottom: 5 }}>{m.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: m.color, letterSpacing: '-0.5px' }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Eco asymmetry */}
            {disasterSummary.ecoLost > 0 && (
              <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,55,95,0.05)', border: '1px solid rgba(255,55,95,0.12)', display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>🌿</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#FF375F', marginBottom: 3 }}>{disasterSummary.ecoLost} ecological health points lost</div>
                  <div style={{ fontSize: 11, color: 'rgba(245,245,247,0.38)', lineHeight: 1.55 }}>
                    Displaced in days. Recovery takes <span style={{ color: 'rgba(245,245,247,0.65)', fontWeight: 500 }}>{disasterSummary.ecoLost > 15 ? '15–30 years' : '5–15 years'}</span> of natural rewilding.{' '}
                    <span style={{ color: 'rgba(255,55,95,0.65)' }}>That asymmetry is the chain reaction.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bridge CTA */}
            <button onClick={handleBridgeToEcological}
              style={{ width: '100%', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#07080F', background: '#30D158', border: 'none', cursor: 'pointer', letterSpacing: '-0.2px' }}>
              🌿 Model this displacement ecologically →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function HeaderStat({ label, value, color, pulse }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 12px' }}>
      <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)', marginBottom: 2 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: color || '#F5F5F7', letterSpacing: '-0.3px', animation: pulse ? 'dangerPulse 1.5s infinite' : 'none' }}>{value}</span>
    </div>
  )
}

function StatDiv() {
  return <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)', alignSelf: 'center' }} />
}

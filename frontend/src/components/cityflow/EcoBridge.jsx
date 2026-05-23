import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCityFlowStore } from '../../store/cityflowStore'
import { CITY_PROVINCE_MAP, DISASTER_RECEIVER_MAP } from '../../store/cityflowStore'

const DISASTER_REASON = {
  wildfire: 'climate_displacement',
  flood:    'climate_displacement',
  conflict: 'climate_displacement',
  heatwave: 'climate_displacement',
  drought:  'climate_displacement',
}

const DISASTER_LABEL = {
  wildfire: 'Wildfire',
  flood:    'Flood',
  conflict: 'Conflict',
  heatwave: 'Heatwave',
  drought:  'Drought',
}

export function EcoBridge() {
  const navigate      = useNavigate()
  const ecoBridge     = useCityFlowStore(s => s.sim.ecoBridge)
  const dismissBridge = useCityFlowStore(s => s.dismissEcoBridge)

  function handleModel() {
    if (!ecoBridge) return
    const sourceProvince = CITY_PROVINCE_MAP[ecoBridge.sourceCityId]?.province
    const destProvince   = CITY_PROVINCE_MAP[ecoBridge.destCityId]?.province
    const reason         = DISASTER_REASON[ecoBridge.disasterType] || 'climate_disaster'
    const params = new URLSearchParams({
      source:      sourceProvince || '',
      dest:        destProvince   || '',
      pop:         String(ecoBridge.displaced),
      reason,
      autorun:     '1',
    })
    dismissBridge()
    navigate(`/simulate?${params.toString()}`)
  }

  return (
    <AnimatePresence>
      {ecoBridge && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            width: 'min(460px, calc(100vw - 340px))',
            borderRadius: 16,
            background: 'rgba(7,8,15,0.95)',
            border: '1px solid rgba(48,209,88,0.30)',
            boxShadow: '0 0 40px rgba(48,209,88,0.12), 0 8px 32px rgba(0,0,0,0.6)',
            padding: '18px 20px',
            zIndex: 100,
            backdropFilter: 'blur(20px)',
          }}>

          {/* Dismiss */}
          <button
            onClick={dismissBridge}
            style={{ position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: 'rgba(245,245,247,0.35)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(48,209,88,0.12)', border: '1px solid rgba(48,209,88,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🌿</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F5F5F7', letterSpacing: '-0.2px' }}>Chain Reaction Detected</div>
              <div style={{ fontSize: 10, color: 'rgba(245,245,247,0.35)', marginTop: 1 }}>Disaster resolved · displacement logged · ecological impact unknown</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            <StatCell label="Displaced" value={ecoBridge.displaced.toLocaleString()} color="#FF9F0A" />
            <StatCell label="From" value={CITY_PROVINCE_MAP[ecoBridge.sourceCityId]?.province || ecoBridge.sourceName} color="#FF375F" />
            <StatCell label="To" value={CITY_PROVINCE_MAP[ecoBridge.destCityId]?.province || ecoBridge.destName} color="#0A84FF" />
          </div>

          {/* Prompt */}
          <div style={{ fontSize: 12, color: 'rgba(245,245,247,0.45)', lineHeight: 1.6, marginBottom: 16 }}>
            {ecoBridge.displaced.toLocaleString()} people displaced by a <span style={{ color: '#FF9F0A', fontWeight: 600 }}>{DISASTER_LABEL[ecoBridge.disasterType] || ecoBridge.disasterType}</span> are heading to <span style={{ color: '#0A84FF', fontWeight: 600 }}>{CITY_PROVINCE_MAP[ecoBridge.destCityId]?.province || ecoBridge.destName}</span>. What does this do to the land, water, and air systems there?
          </div>

          {/* CTA */}
          <motion.button
            onClick={handleModel}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#30D158', color: '#07080F', fontSize: 13, fontWeight: 700, letterSpacing: '-0.2px',
              boxShadow: '0 0 20px rgba(48,209,88,0.35)',
            }}>
            🔬 Model the Ecological Chain Reaction →
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function StatCell({ label, value, color }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(245,245,247,0.28)' }}>{label}</div>
    </div>
  )
}

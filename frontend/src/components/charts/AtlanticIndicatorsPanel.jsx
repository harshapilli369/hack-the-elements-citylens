import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BAR_COLOR = (v) => v > 75 ? '#FF375F' : v > 55 ? '#FF9F0A' : v > 35 ? '#FFD60A' : '#30D158'
const clamp = (n) => Math.round(Math.min(Math.max(n, 0), 100))

// Atlantic Canada province-specific ecological baselines (Environment and Climate Change Canada)
const PROV_PROFILE = {
  'Nova Scotia':          { sst: 9.2, eelgrass_km2: 42, saltmarsh_km2: 180, anadromous: 72, ocean_ph: 8.05, debris_per_km: 28, protected_pct: 8.4 },
  'New Brunswick':        { sst: 8.4, eelgrass_km2: 28, saltmarsh_km2: 140, anadromous: 65, ocean_ph: 8.08, debris_per_km: 22, protected_pct: 6.8 },
  'Newfoundland':         { sst: 4.1, eelgrass_km2: 15, saltmarsh_km2: 85,  anadromous: 78, ocean_ph: 8.02, debris_per_km: 18, protected_pct: 5.2 },
  'Prince Edward Island': { sst: 8.8, eelgrass_km2: 21, saltmarsh_km2: 95,  anadromous: 58, ocean_ph: 8.06, debris_per_km: 25, protected_pct: 4.1 },
}

function getProfile(name) { return PROV_PROFILE[name] || PROV_PROFILE['Nova Scotia'] }

function buildIndicators(scorecard, srcInfo, dstInfo) {
  const sc   = scorecard
  const prof = getProfile(dstInfo?.name)

  const carbonStress  = clamp((sc.carbon_per_capita_delta / 60) * 100)
  const forestStress  = clamp((sc.forest_loss_ha / 50000) * 100)
  const bioStress     = clamp(100 - sc.biodiversity_index_final)
  const uhiStress     = clamp((sc.uhi_delta_final_c / 6) * 100)
  const waterStress   = sc.watershed_stress_final
  const ecoStress     = sc.ecological_stress
  const popPressure   = clamp(ecoStress * 0.9)
  const pollutionStr  = clamp(carbonStress * 0.65 + uhiStress * 0.35)
  const rewild        = clamp((sc.source_rewilded_ha / 8000) * 100)

  return {
    marine: [
      {
        name: 'Sea Surface Temperature',
        stress: clamp(uhiStress * 0.55 + 10),
        reading: `+${(sc.uhi_delta_final_c * 0.38).toFixed(2)}°C vs baseline`,
        trend: sc.uhi_delta_final_c > 0.5 ? 'bad-up' : 'stable',
      },
      {
        name: 'Ocean Acidification (pH)',
        stress: clamp(carbonStress * 0.45 + 15),
        reading: `pH ${(prof.ocean_ph - sc.carbon_per_capita_delta * 0.0008).toFixed(3)}`,
        trend: sc.carbon_per_capita_delta > 0 ? 'bad-down' : 'stable',
      },
      {
        name: 'Phytoplankton Biomass',
        stress: clamp(bioStress * 0.55 + waterStress * 0.18),
        reading: `${clamp(100 - bioStress * 0.38)}% of baseline`,
        trend: bioStress > 25 ? 'bad-down' : 'stable',
      },
      {
        name: 'Invasive Species Pressure',
        stress: clamp(popPressure * 0.45 + 18),
        reading: `+${clamp(popPressure * 0.28)} new pathways`,
        trend: popPressure > 30 ? 'bad-up' : 'stable',
      },
      {
        name: 'Commercial Fish Biomass',
        stress: clamp(waterStress * 0.65 + bioStress * 0.18),
        reading: `${clamp(100 - waterStress * 0.48)}% of quota`,
        trend: waterStress > 35 ? 'bad-down' : 'stable',
      },
      {
        name: 'Marine Mammal Health',
        stress: clamp(bioStress * 0.55 + pollutionStr * 0.28),
        reading: `Index ${clamp(sc.biodiversity_index_final * 0.88)}/100`,
        trend: bioStress > 22 ? 'bad-down' : 'stable',
      },
    ],
    coastal: [
      {
        name: 'Eelgrass Bed Extent',
        stress: clamp(forestStress * 0.45 + waterStress * 0.28),
        reading: `${Math.round(prof.eelgrass_km2 * (1 - forestStress * 0.005))} km²`,
        trend: forestStress > 18 ? 'bad-down' : 'stable',
      },
      {
        name: 'Salt Marsh Vegetation',
        stress: clamp(waterStress * 0.55 + uhiStress * 0.22),
        reading: `${Math.round(prof.saltmarsh_km2 * (1 - waterStress * 0.004))} km²`,
        trend: waterStress > 28 ? 'bad-down' : 'stable',
      },
      {
        name: 'Sea Level Rise Rate',
        stress: clamp(uhiStress * 0.75 + carbonStress * 0.12 + 12),
        reading: `+${(sc.uhi_delta_final_c * 1.75).toFixed(1)} mm/yr above trend`,
        trend: 'bad-up',
      },
      {
        name: 'Dissolved Oxygen',
        stress: clamp(waterStress * 0.58 + uhiStress * 0.28),
        reading: `${Math.max(5.8, 8.4 - waterStress * 0.022).toFixed(1)} mg/L`,
        trend: waterStress > 38 ? 'bad-down' : 'stable',
      },
    ],
    terrestrial: [
      {
        name: 'Boreal Forest Cover',
        stress: clamp(forestStress),
        reading: `${sc.forest_loss_ha.toFixed(0)} ha converted`,
        trend: sc.forest_loss_ha > 100 ? 'bad-down' : 'stable',
      },
      {
        name: 'Indicator Bird Species',
        stress: clamp(bioStress * 0.72 + forestStress * 0.14),
        reading: `${clamp(100 - bioStress * 0.42)}% breeding range intact`,
        trend: bioStress > 18 ? 'bad-down' : 'stable',
      },
      {
        name: 'Moose & Deer Populations',
        stress: clamp(forestStress * 0.65 + popPressure * 0.18),
        reading: `${clamp(100 - forestStress * 0.48)}% of reference`,
        trend: forestStress > 25 ? 'bad-down' : 'stable',
      },
      {
        name: 'Freshwater Quality Index',
        stress: clamp(waterStress * 0.88),
        reading: `${clamp(100 - waterStress * 0.82)}% within safe limits`,
        trend: waterStress > 25 ? 'bad-down' : 'stable',
      },
    ],
    atmospheric: [
      {
        name: 'Particulate Matter PM₂.₅',
        stress: clamp(pollutionStr * 0.65 + 12),
        reading: `${(7.8 + pollutionStr * 0.08).toFixed(1)} μg/m³`,
        trend: pollutionStr > 28 ? 'bad-up' : 'stable',
      },
      {
        name: 'SO₂ & NOₓ Pollutants',
        stress: clamp(carbonStress * 0.58 + 14),
        reading: `+${(Math.abs(sc.carbon_per_capita_delta) * 0.07).toFixed(1)} ppb above baseline`,
        trend: sc.carbon_per_capita_delta > 0 ? 'bad-up' : 'good-down',
      },
      {
        name: 'Ground-Level Ozone O₃',
        stress: clamp(uhiStress * 0.72 + carbonStress * 0.12 + 8),
        reading: `${(36 + uhiStress * 0.14).toFixed(0)} ppb`,
        trend: uhiStress > 28 ? 'bad-up' : 'stable',
      },
      {
        name: 'Precipitation pH',
        stress: clamp(carbonStress * 0.38 + 14),
        reading: `pH ${(5.65 - carbonStress * 0.004).toFixed(2)}`,
        trend: sc.carbon_per_capita_delta > 0 ? 'bad-down' : 'stable',
      },
    ],
    freshwater: [
      {
        name: 'Anadromous Fish Counts',
        stress: clamp(waterStress * 0.75 + forestStress * 0.12),
        reading: `${clamp(prof.anadromous * (1 - waterStress * 0.005))}/100 index`,
        trend: waterStress > 28 ? 'bad-down' : 'stable',
      },
      {
        name: 'Benthic Macroinvertebrates',
        stress: clamp(waterStress * 0.65 + bioStress * 0.18),
        reading: `EPT score ${clamp(100 - waterStress * 0.58)}`,
        trend: waterStress > 35 ? 'bad-down' : 'stable',
      },
      {
        name: 'River Discharge Dynamics',
        stress: clamp(waterStress * 0.58 + uhiStress * 0.18 + 10),
        reading: `${waterStress > 45 ? '−' : '+'}${(Math.abs(waterStress - 22) * 0.25).toFixed(1)}% from norm`,
        trend: waterStress > 40 ? 'bad-up' : 'stable',
      },
      {
        name: 'Lake Thermal Stratification',
        stress: clamp(uhiStress * 0.68 + 14),
        reading: `+${(sc.uhi_delta_final_c * 0.58).toFixed(2)}°C deeper thermocline`,
        trend: uhiStress > 18 ? 'bad-up' : 'stable',
      },
    ],
    socioEcological: [
      {
        name: 'Landscape Connectivity',
        stress: clamp(forestStress * 0.65 + popPressure * 0.18),
        reading: `${clamp(100 - forestStress * 0.55)}% corridor intact`,
        trend: forestStress > 22 ? 'bad-down' : 'stable',
      },
      {
        name: 'Indigenous Harvest Trends',
        stress: clamp(bioStress * 0.48 + waterStress * 0.28),
        reading: `${clamp(100 - bioStress * 0.38)}% of traditional yield`,
        trend: bioStress > 28 ? 'bad-down' : 'stable',
      },
      {
        name: 'Protected & Conserved Area',
        stress: clamp(Math.max(0, 42 - rewild * 0.45)),
        reading: `+${(rewild * 0.09).toFixed(1)}% in recovery`,
        trend: rewild > 20 ? 'good-up' : 'stable',
        beneficial: true,
      },
      {
        name: 'Marine Debris Density',
        stress: clamp(popPressure * 0.48 + 18),
        reading: `${(prof.debris_per_km + popPressure * 0.09).toFixed(0)} items/km²`,
        trend: popPressure > 28 ? 'bad-up' : 'stable',
      },
    ],
  }
}

const TABS = [
  { id: 'marine',          label: 'Marine',      icon: '🌊', count: 6 },
  { id: 'coastal',         label: 'Coastal',     icon: '🏖️', count: 4 },
  { id: 'terrestrial',     label: 'Terrestrial', icon: '🌲', count: 4 },
  { id: 'atmospheric',     label: 'Atmospheric', icon: '🌦️', count: 4 },
  { id: 'freshwater',      label: 'Freshwater',  icon: '💧', count: 4 },
  { id: 'socioEcological', label: 'Socio-Eco',   icon: '👥', count: 4 },
]

function trendDisplay(trend) {
  switch (trend) {
    case 'bad-up':   return { symbol: '↑', color: '#FF375F' }
    case 'bad-down': return { symbol: '↓', color: '#FF9F0A' }
    case 'good-up':  return { symbol: '↑', color: '#30D158' }
    case 'good-down':return { symbol: '↓', color: '#30D158' }
    default:         return { symbol: '→', color: 'rgba(245,245,247,0.25)' }
  }
}

export function AtlanticIndicatorsPanel({ scorecard, sourceInfo, destInfo }) {
  const [activeTab, setActiveTab] = useState('marine')
  const indicators = buildIndicators(scorecard, sourceInfo, destInfo)
  const rows = indicators[activeTab] || []

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
        {TABS.map(t => {
          const active = t.id === activeTab
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'}`,
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: active ? '#F5F5F7' : 'rgba(245,245,247,0.40)',
                fontSize: 12, fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 13 }}>{t.icon}</span>
              <span>{t.label}</span>
              <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', opacity: 0.55 }}>{t.count}</span>
            </button>
          )
        })}
      </div>

      {/* Indicator grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px' }}
        >
          {rows.map((ind, i) => {
            const col = ind.beneficial ? '#30D158' : BAR_COLOR(ind.stress)
            const { symbol, color: trendColor } = trendDisplay(ind.trend)
            return (
              <motion.div
                key={ind.name}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.22 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 5 }}
              >
                {/* Label + reading row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: trendColor, flexShrink: 0 }}>{symbol}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(245,245,247,0.60)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ind.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(245,245,247,0.26)', whiteSpace: 'nowrap' }}>{ind.reading}</span>
                    <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: col, minWidth: 26, textAlign: 'right' }}>{ind.stress}</span>
                  </div>
                </div>
                {/* Bar */}
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ind.stress}%` }}
                    transition={{ delay: i * 0.04 + 0.12, duration: 0.6, ease: 'easeOut' }}
                    style={{
                      height: '100%', borderRadius: 2, background: col,
                      boxShadow: ind.stress > 60 ? `0 0 6px ${col}44` : 'none',
                    }}
                  />
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div style={{ marginTop: 20, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', flex: 1 }}>
          {[{ sym: '↑', col: '#FF375F', lbl: 'Worsening' }, { sym: '↓', col: '#FF9F0A', lbl: 'Declining' }, { sym: '↑', col: '#30D158', lbl: 'Recovering' }, { sym: '→', col: 'rgba(245,245,247,0.25)', lbl: 'Stable' }].map(l => (
            <div key={l.lbl} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: l.col }}>{l.sym}</span>
              <span style={{ fontSize: 10, color: 'rgba(245,245,247,0.28)' }}>{l.lbl}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(245,245,247,0.22)', textAlign: 'right', flexShrink: 0 }}>
          Stress score 0–100 · {destInfo?.name || 'Destination'}
        </div>
      </div>
    </div>
  )
}

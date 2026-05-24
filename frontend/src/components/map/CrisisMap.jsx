import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

// Element themes keyed by migration_reason OR disaster type from CityFlow
const ELEMENT_THEMES = {
  // 🔥 FIRE — wildfire, heatwave, climate displacement
  wildfire:              { elem: 'fire',  emoji: '🔥', label: 'Fire',     name: 'Wildfire',             primary: '#FF4500', r2: '#FF6B35', r3: '#FF8C00', r4: '#FFA07A', anim: 'fire-pulse',  speed: '1.2s' },
  heatwave:              { elem: 'fire',  emoji: '🔥', label: 'Fire',     name: 'Heatwave',             primary: '#FF4500', r2: '#FF6B35', r3: '#FF8C00', r4: '#FFA07A', anim: 'fire-pulse',  speed: '1.4s' },
  climate_displacement:  { elem: 'fire',  emoji: '🔥', label: 'Fire',     name: 'Climate Displacement', primary: '#FF4500', r2: '#FF6B35', r3: '#FF8C00', r4: '#FFA07A', anim: 'fire-pulse',  speed: '1.6s' },

  // 💧 WATER — flood, contamination, water scarcity
  flood:                 { elem: 'water', emoji: '💧', label: 'Water',    name: 'Flood',                primary: '#00CED1', r2: '#0099CC', r3: '#006994', r4: '#4FC3F7', anim: 'water-pulse', speed: '3.0s' },
  water_scarcity:        { elem: 'water', emoji: '💧', label: 'Water',    name: 'Water Scarcity',       primary: '#00CED1', r2: '#0099CC', r3: '#006994', r4: '#4FC3F7', anim: 'water-pulse', speed: '2.8s' },
  contamination:         { elem: 'water', emoji: '💧', label: 'Water',    name: 'Contamination',        primary: '#00CED1', r2: '#0099CC', r3: '#006994', r4: '#4FC3F7', anim: 'water-pulse', speed: '3.0s' },

  // 🪨 EARTH — economic, housing, resource industry, drought, earthquake, landslide
  economic_opportunity:  { elem: 'earth', emoji: '🪨', label: 'Earth',    name: 'Economic Opportunity', primary: '#D4921A', r2: '#A0845C', r3: '#8B6914', r4: '#C4A15A', anim: 'earth-pulse', speed: '2.5s' },
  housing_affordability: { elem: 'earth', emoji: '🪨', label: 'Earth',    name: 'Housing Affordability',primary: '#D4921A', r2: '#A0845C', r3: '#8B6914', r4: '#C4A15A', anim: 'earth-pulse', speed: '2.5s' },
  resource_industry:     { elem: 'earth', emoji: '🪨', label: 'Earth',    name: 'Resource Industry',    primary: '#D4921A', r2: '#A0845C', r3: '#8B6914', r4: '#C4A15A', anim: 'earth-pulse', speed: '2.5s' },
  drought:               { elem: 'earth', emoji: '🪨', label: 'Earth',    name: 'Drought',              primary: '#C4722A', r2: '#8B5513', r3: '#7A4010', r4: '#D2691E', anim: 'earth-pulse', speed: '2.8s' },
  earthquake:            { elem: 'earth', emoji: '🪨', label: 'Earth',    name: 'Earthquake',           primary: '#A09060', r2: '#807050', r3: '#605040', r4: '#C0A080', anim: 'earth-pulse', speed: '0.7s' },
  landslide:             { elem: 'earth', emoji: '🪨', label: 'Earth',    name: 'Landslide',            primary: '#C4922A', r2: '#8B6913', r3: '#7A5010', r4: '#D4A22A', anim: 'earth-pulse', speed: '2.5s' },
  soil_degradation:      { elem: 'earth', emoji: '🪨', label: 'Earth',    name: 'Soil Degradation',     primary: '#C4822A', r2: '#8B5913', r3: '#7A4A10', r4: '#D4922A', anim: 'earth-pulse', speed: '2.5s' },

  // 💨 AIR — conflict, air pollution, climate lifestyle
  conflict:              { elem: 'air',   emoji: '⚡',  label: 'Conflict', name: 'Conflict / War',       primary: '#BF5AF2', r2: '#9B59B6', r3: '#7D3C98', r4: '#D7BDE2', anim: 'air-pulse',   speed: '1.5s' },
  air_pollution:         { elem: 'air',   emoji: '💨', label: 'Air',      name: 'Air Pollution',         primary: '#AAB7B8', r2: '#7F8C8D', r3: '#626567', r4: '#CDD3D4', anim: 'air-pulse',   speed: '2.0s' },
  climate_lifestyle:     { elem: 'air',   emoji: '💨', label: 'Air',      name: 'Climate & Lifestyle',   primary: '#64B5F6', r2: '#2196F3', r3: '#1565C0', r4: '#90CAF9', anim: 'air-pulse',   speed: '2.0s' },
}

const DEFAULT_THEME = {
  elem: 'crisis', emoji: '⚡', label: 'Impact', name: 'Migration',
  primary: '#FF375F', r2: '#FF6B6B', r3: '#C0392B', r4: '#FFAAAA',
  anim: 'water-pulse', speed: '2.0s',
}

function getTheme(reason) {
  return ELEMENT_THEMES[reason] || DEFAULT_THEME
}

const MAP_STYLES = `
  @keyframes fire-pulse {
    0%   { transform: scale(1);    opacity: 1;    }
    25%  { transform: scale(1.15); opacity: 0.75; }
    50%  { transform: scale(1.38); opacity: 0.42; }
    75%  { transform: scale(1.2);  opacity: 0.65; }
    100% { transform: scale(1);    opacity: 1;    }
  }
  @keyframes water-pulse {
    0%,100% { transform: scale(1);    opacity: 1;    }
    50%     { transform: scale(1.48); opacity: 0.32; }
  }
  @keyframes earth-pulse {
    0%,100% { transform: scale(1);    opacity: 0.9; }
    50%     { transform: scale(1.28); opacity: 0.42; }
  }
  @keyframes air-pulse {
    0%,100% { transform: scale(1);    opacity: 0.85; }
    50%     { transform: scale(1.65); opacity: 0.18; }
  }
  @keyframes dashMove { to { stroke-dashoffset: -600; } }
  .migration-line {
    stroke-dasharray: 12 8 !important;
    animation: dashMove 25s linear infinite;
  }
  .crisis-popup .leaflet-popup-content-wrapper {
    background: #161B22; color: #E6EDF3;
    border: 1px solid #30363D; border-radius: 10px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.7);
  }
  .crisis-popup .leaflet-popup-tip { background: #161B22; }
  .leaflet-popup-close-button { color: #8B949E !important; }
`

function MapLayers({ result }) {
  const map = useMap()

  useEffect(() => {
    if (!result) return
    const layers = []

    const srcCoords  = result.source_info.coords
    const dstCoords  = result.dest_info.coords
    const severity   = result.scorecard.severity
    const stress     = result.scorecard.ecological_stress
    const carbonGood = result.scorecard.carbon_is_beneficial
    const theme      = getTheme(result.migration_reason)

    map.fitBounds(L.latLngBounds([srcCoords, dstCoords]), { padding: [80, 80], maxZoom: 6 })

    // Migration flow line — element colored
    layers.push(L.polyline([srcCoords, dstCoords], {
      color:     theme.primary,
      weight:    2.5,
      opacity:   0.85,
      dashArray: '12 8',
      className: 'migration-line',
    }).addTo(map))

    // Midpoint arrowhead
    const midLat = (srcCoords[0] + dstCoords[0]) / 2
    const midLng = (srcCoords[1] + dstCoords[1]) / 2
    const angle  = Math.atan2(dstCoords[0] - srcCoords[0], dstCoords[1] - srcCoords[1]) * 180 / Math.PI
    layers.push(L.marker([midLat, midLng], {
      icon: L.divIcon({
        html: `<div style="font-size:18px;color:${theme.primary};text-shadow:0 0 10px ${theme.primary};transform:rotate(${angle}deg)">➤</div>`,
        className: '',
        iconAnchor: [12, 12],
      }),
    }).addTo(map))

    // Source marker
    layers.push(L.marker(srcCoords, {
      icon: L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#2ED573;border:2px solid #fff;box-shadow:0 0 12px #2ED57388;"></div>`,
        className: '',
        iconAnchor: [7, 7],
      }),
    }).addTo(map).bindPopup(`
      <div style="font-family:'Space Grotesk',sans-serif;min-width:200px">
        <div style="color:#2ED573;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">
          Source — ${result.source_info.dominant_biome}
        </div>
        <div style="color:#E6EDF3;font-size:16px;font-weight:700">${result.source_province}</div>
        <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <div style="color:#8B949E;font-size:11px">CO₂/capita</div>
          <div style="color:#2ED573;font-family:monospace;font-weight:700">${result.source_info.co2_per_capita}t/yr</div>
          <div style="color:#8B949E;font-size:11px">Forest cover</div>
          <div style="color:#2ED573;font-family:monospace;font-weight:700">${result.source_info.forest_cover_pct}%</div>
          <div style="color:#8B949E;font-size:11px">Rewilding</div>
          <div style="color:#2ED573;font-family:monospace;font-weight:700">${Math.round(result.scorecard.source_rewilded_ha).toLocaleString()} ha</div>
        </div>
        <div style="margin-top:8px;padding:6px;background:#0D1117;border-radius:6px;font-size:11px;color:#2ED573">
          🌱 Land entering natural succession as population departs
        </div>
      </div>`, { className: 'crisis-popup' }))

    // Destination: 5-ring element-colored heatmap
    const radii    = [200000, 110000, 60000, 28000, 9000]
    const opacities = [0.035,  0.07,   0.14,  0.26,  0.46]
    const ringColors = [theme.r4, theme.r3, theme.r2, theme.primary, theme.primary]
    radii.forEach((radius, i) => {
      layers.push(L.circle(dstCoords, {
        radius,
        color:       ringColors[i],
        fillColor:   ringColors[i],
        fillOpacity: opacities[i],
        weight:      i === radii.length - 1 ? 2 : 0,
        opacity:     0.6,
      }).addTo(map))
    })

    // Destination marker — element pulsing glow
    const dstIcon = L.divIcon({
      html: `<div style="
        width:20px;height:20px;border-radius:50%;
        background:${theme.primary};border:2px solid #fff;
        box-shadow:0 0 20px ${theme.primary}CC,0 0 44px ${theme.primary}55;
        animation:${theme.anim} ${theme.speed} ease-in-out infinite;
      "></div>`,
      className: '',
      iconAnchor: [10, 10],
    })

    const carbonLine = carbonGood
      ? `<div style="color:#2ED573">✅ Carbon-reducing migration — net benefit</div>`
      : `<div style="color:#FF4757">⚠️ +${result.scorecard.total_carbon_delta_tonnes.toLocaleString()} t CO₂/yr added</div>`

    const dstMarker = L.marker(dstCoords, { icon: dstIcon }).addTo(map).bindPopup(`
      <div style="font-family:'Space Grotesk',sans-serif;min-width:210px">
        <div style="color:${theme.primary};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">
          ${theme.emoji} ${theme.label} Element · ${severity} Impact
        </div>
        <div style="color:#E6EDF3;font-size:16px;font-weight:700">${result.destination_province}</div>
        <div style="color:#8B949E;font-size:11px;margin-top:2px">${result.dest_info.dominant_biome}</div>
        <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <div style="color:#8B949E;font-size:11px">Eco. Stress</div>
          <div style="color:${theme.primary};font-family:monospace;font-weight:700">${stress}%</div>
          <div style="color:#8B949E;font-size:11px">Habitat lost</div>
          <div style="color:#FFA502;font-family:monospace;font-weight:700">${Math.round(result.scorecard.forest_loss_ha).toLocaleString()} ha</div>
          <div style="color:#8B949E;font-size:11px">UHI delta</div>
          <div style="color:#FF6B35;font-family:monospace;font-weight:700">+${result.scorecard.uhi_delta_final_c.toFixed(2)}°C</div>
        </div>
        <div style="margin-top:8px;padding:6px;background:#0D1117;border-radius:6px;font-size:11px">${carbonLine}</div>
      </div>`, { className: 'crisis-popup' })
    layers.push(dstMarker)
    setTimeout(() => dstMarker.openPopup(), 700)

    return () => layers.forEach(l => map.removeLayer(l))
  }, [result, map])

  return null
}

function DefaultView() {
  const map = useMap()
  useEffect(() => { map.setView([58, -96], 4) }, [map])
  return null
}

export function CrisisMap({ result }) {
  const theme = result ? getTheme(result.migration_reason) : DEFAULT_THEME

  return (
    <div style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
      <style>{MAP_STYLES}</style>

      <MapContainer
        center={[58, -96]} zoom={4}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} attributionControl={false}
      >
        <TileLayer url={DARK_TILE} />
        {result ? <MapLayers result={result} /> : <DefaultView />}
      </MapContainer>

      {/* Element badge — bottom right */}
      {result && (
        <div style={{
          position: 'absolute', bottom: 12, right: 12, zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 20,
          background: 'rgba(10,12,20,0.88)',
          border: `1px solid ${theme.primary}55`,
          backdropFilter: 'blur(12px)',
          boxShadow: `0 0 18px ${theme.primary}33`,
        }}>
          <span style={{ fontSize: 16 }}>{theme.emoji}</span>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.primary, lineHeight: 1 }}>
              {theme.label} Element
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(245,245,247,0.60)', marginTop: 2 }}>
              {theme.name}
            </div>
          </div>
        </div>
      )}

      {/* Status label — bottom left */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000 }}>
        <div style={{
          padding: '5px 12px', borderRadius: 8,
          background: 'rgba(10,12,20,0.82)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
          color: 'rgba(245,245,247,0.42)',
        }}>
          {result
            ? `${result.source_province} → ${result.destination_province} · ${result.scorecard.severity} impact`
            : 'Canada · Select provinces to visualize migration flow'}
        </div>
      </div>
    </div>
  )
}

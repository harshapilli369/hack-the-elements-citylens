import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { getSeverityColor } from '../../utils/formatters'

const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

// Approximate province label positions (for popup anchoring)
const PROVINCE_LABEL_OFFSETS = {
  'Ontario':              [51.2538, -85.3232],
  'Quebec':               [53.0,    -71.0],
  'British Columbia':     [53.7267, -127.6476],
  'Alberta':              [53.9333, -116.5765],
  'Saskatchewan':         [52.9399, -106.4509],
  'Manitoba':             [53.7609, -98.8139],
  'Nova Scotia':          [44.6820, -63.7443],
  'New Brunswick':        [46.5653, -66.4619],
  'Newfoundland':         [53.1355, -57.6604],
  'Prince Edward Island': [46.5107, -63.4168],
  'Yukon':                [64.2823, -135.0000],
  'Northwest Territories':[64.8255, -124.8457],
}

function MapLayers({ result }) {
  const map = useMap()

  useEffect(() => {
    if (!result) return
    const layers = []

    const srcCoords  = result.source_info.coords
    const dstCoords  = result.dest_info.coords
    const severity   = result.scorecard.severity
    const stress     = result.scorecard.ecological_stress
    const riskColor  = getSeverityColor(severity)
    const carbonGood = result.scorecard.carbon_is_beneficial

    // Fit map to show both provinces
    const bounds = L.latLngBounds([srcCoords, dstCoords])
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 6 })

    // --- Migration flow line (animated) ---
    const route = L.polyline([srcCoords, dstCoords], {
      color: '#00D4FF',
      weight: 2.5,
      opacity: 0.8,
      dashArray: '12 8',
      className: 'migration-line',
    }).addTo(map)
    layers.push(route)

    // Midpoint arrowhead indicator
    const midLat = (srcCoords[0] + dstCoords[0]) / 2
    const midLng = (srcCoords[1] + dstCoords[1]) / 2
    const midIcon = L.divIcon({
      html: `<div style="
        font-size:18px;color:#00D4FF;text-shadow:0 0 8px #00D4FF;
        transform:rotate(${Math.atan2(dstCoords[0]-srcCoords[0], dstCoords[1]-srcCoords[1]) * 180/Math.PI}deg)
      ">➤</div>`,
      className: '',
      iconAnchor: [12, 12],
    })
    layers.push(L.marker([midLat, midLng], { icon: midIcon }).addTo(map))

    // --- SOURCE province marker ---
    const srcIcon = L.divIcon({
      html: `<div style="
        width:14px;height:14px;border-radius:50%;
        background:#2ED573;border:2px solid #fff;
        box-shadow:0 0 12px #2ED57388;
      "></div>`,
      className: '',
      iconAnchor: [7, 7],
    })
    const srcPopup = `
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
      </div>`
    layers.push(L.marker(srcCoords, { icon: srcIcon }).addTo(map).bindPopup(srcPopup, { className: 'crisis-popup' }))

    // --- DESTINATION province marker + heatmap circles ---
    const radii = [120000, 60000, 25000, 8000]
    const opacities = [0.05, 0.1, 0.18, 0.38]
    radii.forEach((radius, i) => {
      layers.push(L.circle(dstCoords, {
        radius,
        color: riskColor,
        fillColor: riskColor,
        fillOpacity: opacities[i],
        weight: i === radii.length - 1 ? 2 : 0,
        opacity: 0.5,
      }).addTo(map))
    })

    const dstIcon = L.divIcon({
      html: `<div style="
        width:18px;height:18px;border-radius:50%;
        background:${riskColor};border:2px solid #fff;
        box-shadow:0 0 16px ${riskColor}AA;
        animation:dstPulse 2s ease-in-out infinite;
      "></div>`,
      className: '',
      iconAnchor: [9, 9],
    })

    const carbonLine = carbonGood
      ? `<div style="color:#2ED573">✅ Carbon-reducing migration — net benefit</div>`
      : `<div style="color:#FF4757">⚠️ +${result.scorecard.total_carbon_delta_tonnes.toLocaleString()} t CO₂/yr added</div>`

    const dstPopup = `
      <div style="font-family:'Space Grotesk',sans-serif;min-width:210px">
        <div style="color:${riskColor};font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">
          Destination · ${severity} Impact
        </div>
        <div style="color:#E6EDF3;font-size:16px;font-weight:700">${result.destination_province}</div>
        <div style="color:#8B949E;font-size:11px;margin-top:2px">${result.dest_info.dominant_biome}</div>
        <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <div style="color:#8B949E;font-size:11px">Eco. Stress</div>
          <div style="color:${riskColor};font-family:monospace;font-weight:700">${stress}%</div>
          <div style="color:#8B949E;font-size:11px">Habitat lost</div>
          <div style="color:#FFA502;font-family:monospace;font-weight:700">${Math.round(result.scorecard.forest_loss_ha).toLocaleString()} ha</div>
          <div style="color:#8B949E;font-size:11px">UHI delta</div>
          <div style="color:#FF6B35;font-family:monospace;font-weight:700">+${result.scorecard.uhi_delta_final_c.toFixed(2)}°C</div>
        </div>
        <div style="margin-top:8px;padding:6px;background:#0D1117;border-radius:6px;font-size:11px">
          ${carbonLine}
        </div>
      </div>`

    const dstMarker = L.marker(dstCoords, { icon: dstIcon }).addTo(map)
      .bindPopup(dstPopup, { className: 'crisis-popup' })
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
  return (
    <div className="glass overflow-hidden relative" style={{ height: '430px' }}>
      <style>{`
        @keyframes dstPulse {
          0%,100% { transform:scale(1); opacity:1; }
          50% { transform:scale(1.35); opacity:0.6; }
        }
        .migration-line {
          stroke-dasharray: 12 8 !important;
          animation: dashMove 25s linear infinite;
        }
        @keyframes dashMove { to { stroke-dashoffset: -600; } }
        .crisis-popup .leaflet-popup-content-wrapper {
          background:#161B22; color:#E6EDF3;
          border:1px solid #30363D; border-radius:10px;
          box-shadow:0 8px 30px rgba(0,0,0,0.7);
        }
        .crisis-popup .leaflet-popup-tip { background:#161B22; }
        .leaflet-popup-close-button { color:#8B949E !important; }
      `}</style>
      <MapContainer center={[58, -96]} zoom={4}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false} attributionControl={false}>
        <TileLayer url={DARK_TILE} />
        {result ? <MapLayers result={result} /> : <DefaultView />}
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[1000]">
        <div className="glass px-3 py-1.5 text-xs font-mono text-[#8B949E]">
          {result
            ? `${result.source_province} → ${result.destination_province} · ${result.scorecard.severity} ecological impact`
            : 'Canada · Select provinces to visualize migration flow'}
        </div>
      </div>
    </div>
  )
}

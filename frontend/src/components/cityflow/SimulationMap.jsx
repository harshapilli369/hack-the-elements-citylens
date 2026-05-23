import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useCityFlowStore } from '../../store/cityflowStore'
import { CityNode } from './CityNode'
import { MigrantRenderer } from './MigrantWalkers'

// CartoDB Dark Matter — matches the simulator's dark aesthetic
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

// Atlantic Canada bounding box used to anchor city x/y percentages
// SW: [43.0, -72.0]  NE: [52.5, -50.0]
const MAP_CENTER = [47.0, -62.0]
const MAP_ZOOM   = 5

export function SimulationMap() {
  const canvasRef    = useRef(null)
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const cities = useCityFlowStore(state => state.cities)
  const routes = useCityFlowStore(state => state.routes)

  // Handle resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }
    window.addEventListener('resize', updateSize)
    updateSize()
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Canvas render loop — draws routes, migrant walkers, stress arcs, eco rings
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.width === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width  = dimensions.width  * dpr
    canvas.height = dimensions.height * dpr

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const renderer = new MigrantRenderer(canvas)
    let animationId

    const renderLoop = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Subtle floating ambient particles
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      for (let i = 0; i < 25; i++) {
        const t = (Date.now() * 0.00008) + i
        const x = ((Math.sin(t) + 1) / 2) * dimensions.width
        const y = ((Math.cos(t * 1.5) + 1) / 2) * dimensions.height
        ctx.beginPath()
        ctx.arc(x, y, 1, 0, Math.PI * 2)
        ctx.fill()
      }

      renderer.render(
        useCityFlowStore.getState().migrants,
        useCityFlowStore.getState().routes,
        useCityFlowStore.getState().cities,
        dimensions.width,
        dimensions.height,
      )

      animationId = requestAnimationFrame(renderLoop)
    }

    renderLoop()
    return () => cancelAnimationFrame(animationId)
  }, [dimensions])

  return (
    <div className="relative flex-1 h-full w-full overflow-hidden" ref={containerRef}>

      {/* ── Layer 0: Real Leaflet map of Atlantic Canada ─────────────────── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          zoomControl={false}
          dragging={false}
          touchZoom={false}
          doubleClickZoom={false}
          scrollWheelZoom={false}
          boxZoom={false}
          keyboard={false}
          attributionControl={false}
          style={{ width: '100%', height: '100%', background: '#07080F' }}
        >
          <TileLayer
            url={DARK_TILE}
            maxZoom={19}
            subdomains="abcd"
          />
        </MapContainer>
        {/* Dark overlay so the map reads as an atmospheric background, not the foreground */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, rgba(7,8,15,0.55) 0%, rgba(7,8,15,0.38) 50%, rgba(7,8,15,0.55) 100%)',
          zIndex: 500,
        }} />
      </div>

      {/* ── Layer 1: Canvas — routes, migrant walkers, glows ─────────────── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* ── Layer 2: HTML city node cards ─────────────────────────────────── */}
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {cities.map(city => (
          <CityNode key={city.id} city={city} />
        ))}
      </div>
    </div>
  )
}

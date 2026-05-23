import React, { useEffect, useRef, useState } from 'react'
import { useCityFlowStore } from '../../store/cityflowStore'
import { CityNode } from './CityNode'
import { MigrantRenderer } from './MigrantWalkers'

export function SimulationMap() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  const cities = useCityFlowStore(state => state.cities)
  const routes = useCityFlowStore(state => state.routes)
  const migrants = useCityFlowStore(state => state.migrants)
  const isRunning = useCityFlowStore(state => state.sim.isRunning)

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

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.width === 0) return

    // Setup canvas resolution for retina displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const renderer = new MigrantRenderer(canvas)
    let animationId

    const renderLoop = () => {
      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Draw background particles (simple ambient effect)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      for(let i=0; i<30; i++) {
        const t = (Date.now() * 0.0001) + i
        const x = ((Math.sin(t) + 1) / 2) * dimensions.width
        const y = ((Math.cos(t * 1.5) + 1) / 2) * dimensions.height
        ctx.beginPath()
        ctx.arc(x, y, 1, 0, Math.PI * 2)
        ctx.fill()
      }

      // Render migrants and route paths
      renderer.render(
        useCityFlowStore.getState().migrants,
        useCityFlowStore.getState().routes,
        useCityFlowStore.getState().cities,
        dimensions.width,
        dimensions.height
      )

      animationId = requestAnimationFrame(renderLoop)
    }

    renderLoop()

    return () => cancelAnimationFrame(animationId)
  }, [dimensions])

  return (
    <div className="relative flex-1 h-full w-full overflow-hidden" ref={containerRef}>
      {/* Background Map Graphic (optional grid/texture) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/20 via-slate-900/40 to-[#0b1120] pointer-events-none" />
      
      {/* Canvas Layer for routes and animations */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />
      
      {/* HTML Overlay Layer for Cities */}
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {cities.map(city => (
          <CityNode key={city.id} city={city} />
        ))}
      </div>
    </div>
  )
}

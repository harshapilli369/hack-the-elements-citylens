// Canvas renderer — routes, migrants (economic vs disaster), disaster glows, stress arcs, eco rings

const DISASTER_COLORS = {
  wildfire:  { r: 255, g: 90,  b: 20  },
  flood:     { r: 30,  g: 130, b: 255 },
  conflict:  { r: 220, g: 30,  b: 30  },
  heatwave:  { r: 255, g: 200, b: 0   },
  drought:   { r: 200, g: 140, b: 50  },
}

const DISASTER_LABELS = {
  wildfire: '🔥 WILDFIRE',
  flood:    '🌊 FLOOD',
  conflict: '⚔️ CONFLICT',
  heatwave: '☀️ HEATWAVE',
  drought:  '🏜️ DROUGHT',
}

// Eco-score → color
function ecoColor(score) {
  if (score > 80) return { r: 46,  g: 213, b: 115 } // green
  if (score > 60) return { r: 255, g: 214, b: 0   } // yellow
  if (score > 40) return { r: 255, g: 165, b: 0   } // orange
  return               { r: 239, g: 68,  b: 68  }   // red
}

export class MigrantRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx    = canvas.getContext('2d')
    this.frameCount = 0
  }

  getBezierXY(t, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey) {
    return {
      x: Math.pow(1-t,3)*sx + 3*t*Math.pow(1-t,2)*cp1x + 3*Math.pow(t,2)*(1-t)*cp2x + Math.pow(t,3)*ex,
      y: Math.pow(1-t,3)*sy + 3*t*Math.pow(1-t,2)*cp1y + 3*Math.pow(t,2)*(1-t)*cp2y + Math.pow(t,3)*ey,
    }
  }

  drawPerson(x, y, scale = 1, walkCycle = 0, color = 'rgba(255,255,255,0.9)') {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)

    ctx.strokeStyle = color
    ctx.fillStyle   = color
    ctx.lineWidth   = 1.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.shadowBlur  = 4
    ctx.shadowColor = color

    // Head
    ctx.beginPath()
    ctx.arc(0, -8, 2, 0, Math.PI * 2)
    ctx.fill()

    // Body
    ctx.beginPath()
    ctx.moveTo(0, -6)
    ctx.lineTo(0, 2)
    ctx.stroke()

    // Arms
    const arm = Math.sin(walkCycle) * 4
    ctx.beginPath()
    ctx.moveTo(0, -4); ctx.lineTo(-3 - arm, 1)
    ctx.moveTo(0, -4); ctx.lineTo( 3 + arm, 1)
    ctx.stroke()

    // Legs
    const leg = Math.sin(walkCycle) * 5
    ctx.beginPath()
    ctx.moveTo(0, 2); ctx.lineTo(-leg, 8)
    ctx.moveTo(0, 2); ctx.lineTo( leg, 8)
    ctx.stroke()

    ctx.restore()
  }

  render(migrants, routes, cities, width, height) {
    this.frameCount++
    const ctx = this.ctx

    // Lookup maps
    const cityMap = {}
    cities.forEach(c => { cityMap[c.id] = { x: (c.x / 100) * width, y: (c.y / 100) * height } })

    // Migrants per route (split by type)
    const routeDisaster  = {}  // disaster + cascade
    const routeEconomic  = {}  // economic
    migrants.forEach(m => {
      if (m.type === 'economic') {
        routeEconomic[m.routeId]  = (routeEconomic[m.routeId]  || 0) + m.count
      } else {
        routeDisaster[m.routeId] = (routeDisaster[m.routeId] || 0) + m.count
      }
    })

    // ─── 1. DISASTER GLOW HALOS ───────────────────────────────────────────
    cities.forEach(c => {
      if (!c.isDisasterActive || !c.disasterType) return
      const pos = cityMap[c.id]
      if (!pos) return

      const col   = DISASTER_COLORS[c.disasterType] || DISASTER_COLORS.wildfire
      const pulse = 0.55 + Math.sin(this.frameCount * 0.06) * 0.35

      const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 110)
      grad.addColorStop(0,   `rgba(${col.r},${col.g},${col.b},${0.45 * pulse})`)
      grad.addColorStop(0.4, `rgba(${col.r},${col.g},${col.b},${0.18 * pulse})`)
      grad.addColorStop(1,   `rgba(${col.r},${col.g},${col.b},0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 110, 0, Math.PI * 2)
      ctx.fill()

      // Orbiting sparks
      const t = this.frameCount * 0.03
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + t
        const dist  = 30 + Math.sin(t * 2 + i) * 15
        const alpha = 0.4 + Math.sin(t * 3 + i) * 0.3
        ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${alpha})`
        ctx.beginPath()
        ctx.arc(pos.x + Math.cos(angle) * dist, pos.y + Math.sin(angle) * dist, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Disaster label
      const label = DISASTER_LABELS[c.disasterType] || c.disasterType.toUpperCase()
      ctx.save()
      ctx.font      = 'bold 10px "Space Grotesk", system-ui'
      ctx.textAlign = 'center'
      ctx.fillStyle = `rgba(${col.r},${col.g},${col.b},${0.8 + Math.sin(this.frameCount * 0.08) * 0.2})`
      ctx.shadowBlur  = 8
      ctx.shadowColor = `rgba(${col.r},${col.g},${col.b},0.9)`
      ctx.fillText(label, pos.x, pos.y - 46)
      ctx.restore()
    })

    // ─── 2. ROUTE LINES (always visible, dual-layer: economic + disaster) ─
    routes.forEach(r => {
      const fromPos = cityMap[r.from]
      const toPos   = cityMap[r.to]
      if (!fromPos || !toPos) return

      const cpX = (r.cpX / 100) * width
      const cpY = (r.cpY / 100) * height
      const disLoad = routeDisaster[r.id] || 0
      const ecoLoad = routeEconomic[r.id] || 0
      const anyLoad = disLoad + ecoLoad > 200

      // Base dashed line — always visible
      ctx.beginPath()
      ctx.moveTo(fromPos.x, fromPos.y)
      ctx.bezierCurveTo(cpX, cpY, cpX, cpY, toPos.x, toPos.y)
      ctx.setLineDash([4, 10])
      ctx.strokeStyle = anyLoad
        ? `rgba(56,189,248,${Math.min(0.65, 0.1 + ((disLoad + ecoLoad) / 8000) * 0.55)})`
        : 'rgba(56,189,248,0.07)'
      ctx.lineWidth = anyLoad ? 1.5 + Math.min(2.5, (disLoad + ecoLoad) / 3000) : 1
      ctx.stroke()
      ctx.setLineDash([])

      // Economic flow: slow green dots
      if (ecoLoad > 0) {
        for (let i = 0; i < 3; i++) {
          const t  = ((this.frameCount * 0.003 + i / 3) % 1)
          const pt = this.getBezierXY(t, fromPos.x, fromPos.y, cpX, cpY, cpX, cpY, toPos.x, toPos.y)
          ctx.fillStyle = `rgba(46,213,115,${0.35 + Math.sin(this.frameCount * 0.08 + i) * 0.15})`
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Disaster flow: fast cyan/blue dots
      if (disLoad > 0) {
        for (let i = 0; i < 5; i++) {
          const t  = ((this.frameCount * 0.008 + i / 5) % 1)
          const pt = this.getBezierXY(t, fromPos.x, fromPos.y, cpX, cpY, cpX, cpY, toPos.x, toPos.y)
          ctx.fillStyle = `rgba(56,189,248,${0.45 + Math.sin(this.frameCount * 0.12 + i) * 0.2})`
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Count badges
      if (anyLoad) {
        const mid = this.getBezierXY(0.5, fromPos.x, fromPos.y, cpX, cpY, cpX, cpY, toPos.x, toPos.y)
        const total = disLoad + ecoLoad
        if (total > 400) {
          const label = total >= 1000 ? `${(total / 1000).toFixed(1)}k` : `${total}`
          ctx.save()
          ctx.fillStyle   = 'rgba(13,17,23,0.85)'
          ctx.strokeStyle = disLoad > 0 ? 'rgba(56,189,248,0.5)' : 'rgba(46,213,115,0.5)'
          ctx.lineWidth   = 1
          ctx.beginPath()
          ctx.roundRect(mid.x - 18, mid.y - 20, 36, 14, 4)
          ctx.fill()
          ctx.stroke()
          ctx.font         = 'bold 9px "JetBrains Mono", monospace'
          ctx.textAlign    = 'center'
          ctx.fillStyle    = disLoad > 0 ? '#38bdf8' : '#2ed573'
          ctx.fillText(label, mid.x, mid.y - 10)
          ctx.restore()
        }
      }
    })

    // ─── 3. STRESS ARCS + ECO RINGS around each city ─────────────────────
    cities.forEach(c => {
      const pos = cityMap[c.id]
      if (!pos) return

      // Outer eco ring (r = 30)
      const eco = c.ecoScore ?? 100
      const ec  = ecoColor(eco)
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth   = 2
      ctx.stroke()
      if (eco < 99) {
        // Show how much eco has been LOST (fill the lost portion in red)
        const lostFraction = (100 - eco) / 100
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lostFraction)
        ctx.strokeStyle = `rgba(${ec.r},${ec.g},${ec.b},0.45)`
        ctx.lineWidth   = 2
        ctx.stroke()
      }

      // Inner stress arc (r = 22)
      const stressColor = c.stress > 75 ? '#ef4444' :
                          c.stress > 55 ? '#f97316' :
                          c.stress > 35 ? '#f59e0b' : '#10b981'
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth   = 3
      ctx.stroke()
      if (c.stress > 1) {
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (c.stress / 100))
        ctx.strokeStyle = stressColor
        ctx.lineWidth   = 3
        ctx.shadowBlur  = c.stress > 60 ? 8 : 0
        ctx.shadowColor = stressColor
        ctx.stroke()
        ctx.shadowBlur  = 0
      }
    })

    // ─── 4. DRAW MIGRANTS ─────────────────────────────────────────────────
    const routeMap = {}
    routes.forEach(r => { routeMap[r.id] = r })

    migrants.forEach(m => {
      const route = routeMap[m.routeId]
      if (!route) return

      const fromNode = cityMap[m.from]
      const toNode   = cityMap[m.to]
      if (!fromNode || !toNode) return

      const cpX = (route.cpX / 100) * width
      const cpY = (route.cpY / 100) * height
      const sx  = route.from === m.from ? fromNode.x : toNode.x
      const sy  = route.from === m.from ? fromNode.y : toNode.y
      const ex  = route.to   === m.to   ? toNode.x   : fromNode.x
      const ey  = route.to   === m.to   ? toNode.y   : fromNode.y

      const progress = m.reverse ? 1 - m.progress : m.progress
      const pos      = this.getBezierXY(progress, sx, sy, cpX, cpY, cpX, cpY, ex, ey)

      const isEconomic = m.type === 'economic'
      const isCascade  = m.type === 'cascade'

      // Color & scale by migration type
      let figureColor, scale, numFigures, walkSpeed

      if (isEconomic) {
        // Orderly, slow — green/teal, smaller figures
        figureColor = 'rgba(46,213,115,0.75)'
        scale       = 0.65
        numFigures  = Math.min(4, Math.max(1, Math.floor(m.count / 120)))
        walkSpeed   = 0.08
      } else if (isCascade) {
        // Panicked cascade — bright white with red tint
        figureColor = 'rgba(255,100,80,0.92)'
        scale       = 0.85
        numFigures  = Math.min(8, Math.max(3, Math.floor(m.count / 280)))
        walkSpeed   = 0.22
      } else {
        // Disaster refugees — origin city's disaster color
        const originCity = cities.find(c => c.id === m.from)
        if (originCity?.isDisasterActive && originCity.disasterType) {
          const col = DISASTER_COLORS[originCity.disasterType]
          figureColor = col
            ? `rgba(${col.r},${col.g},${col.b},0.78)`
            : 'rgba(255,255,255,0.88)'
        } else {
          figureColor = 'rgba(255,255,255,0.88)'
        }
        scale      = 0.8
        numFigures = Math.min(8, Math.max(2, Math.floor(m.count / 250)))
        walkSpeed  = 0.15
      }

      for (let i = 0; i < numFigures; i++) {
        const ox        = Math.sin(parseFloat(m.id) * 10 + i) * 14
        const oy        = Math.cos(parseFloat(m.id) * 10 + i) * 14
        const walkCycle = (this.frameCount * walkSpeed) + (i * 1.5)
        this.drawPerson(pos.x + ox, pos.y + oy, scale, walkCycle, figureColor)
      }
    })
  }
}

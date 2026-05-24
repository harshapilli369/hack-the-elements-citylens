// Canvas renderer — routes, migrants, disaster glows, stress arcs, eco rings, queue indicators

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

function ecoColor(score) {
  if (score > 80) return { r: 46,  g: 213, b: 115 }
  if (score > 60) return { r: 255, g: 214, b: 0   }
  if (score > 40) return { r: 255, g: 165, b: 0   }
  return               { r: 239, g: 68,  b: 68  }
}


export class MigrantRenderer {
  constructor(canvas) {
    this.canvas     = canvas
    this.ctx        = canvas.getContext('2d')
    this.frameCount = 0
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

  getBezierXY(t, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey) {
    return {
      x: Math.pow(1-t,3)*sx + 3*t*Math.pow(1-t,2)*cp1x + 3*Math.pow(t,2)*(1-t)*cp2x + Math.pow(t,3)*ex,
      y: Math.pow(1-t,3)*sy + 3*t*Math.pow(1-t,2)*cp1y + 3*Math.pow(t,2)*(1-t)*cp2y + Math.pow(t,3)*ey,
    }
  }

  resetCtx() {
    const ctx = this.ctx
    ctx.shadowBlur   = 0
    ctx.shadowColor  = 'transparent'
    ctx.globalAlpha  = 1
    ctx.lineWidth    = 1
    ctx.setLineDash([])
    ctx.lineCap      = 'butt'
    ctx.lineJoin     = 'miter'
  }

  render(migrants, routes, cities, width, height) {
    this.frameCount++
    const ctx = this.ctx

    // Lookup maps
    const cityMap = {}
    cities.forEach(c => { cityMap[c.id] = { x: (c.x / 100) * width, y: (c.y / 100) * height } })
    this.resetCtx()


    // ─── 1. DISASTER GLOW HALOS ──────────────────────────────────────────────
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

    this.resetCtx()
    // ─── 2. ROUTE LINES — simple static dotted paths ────────────────────────
    routes.forEach(r => {
      const fromPos = cityMap[r.from]
      const toPos   = cityMap[r.to]
      if (!fromPos || !toPos) return

      const cpX = (r.cpX / 100) * width
      const cpY = (r.cpY / 100) * height

      ctx.beginPath()
      ctx.moveTo(fromPos.x, fromPos.y)
      ctx.bezierCurveTo(cpX, cpY, cpX, cpY, toPos.x, toPos.y)
      ctx.setLineDash([4, 10])
      ctx.strokeStyle = 'rgba(56,189,248,0.12)'
      ctx.lineWidth   = 1
      ctx.stroke()
      ctx.setLineDash([])
    })

    this.resetCtx()
    // ─── 3. STRESS ARCS + ECO RINGS + QUEUE INDICATORS ──────────────────────
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

      // Queue indicator — pulsing orange ring outside eco ring when people are waiting
      // Size reflects queue relative to city population (bigger queue = bigger ring)
      const queue = c.displacementQueue || 0
      if (queue > 50) {
        const queueFraction = Math.min(1, queue / (c.basePop * 0.3))
        const ringRadius    = 36 + queueFraction * 10
        const pulse         = 0.5 + Math.sin(this.frameCount * 0.12) * 0.3
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, ringRadius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255,159,10,${0.3 + pulse * 0.4})`
        ctx.lineWidth   = 2
        ctx.shadowBlur  = 6
        ctx.shadowColor = 'rgba(255,159,10,0.6)'
        ctx.stroke()
        ctx.shadowBlur  = 0

        // Queue count label
        ctx.save()
        ctx.font      = 'bold 8px "JetBrains Mono", monospace'
        ctx.textAlign = 'center'
        ctx.fillStyle = `rgba(255,159,10,${0.7 + pulse * 0.3})`
        const qLabel  = queue >= 1000 ? `${(queue / 1000).toFixed(1)}k` : `${queue}`
        ctx.fillText(`⏳${qLabel}`, pos.x, pos.y + ringRadius + 10)
        ctx.restore()
      }
    })

    this.resetCtx()
    // ─── 4. MIGRANT WAVES — walking figures clustered around each wave position ─
    // Each wave object = one group of people moving along the route.
    // Figure count, color, walk speed and scale reflect migration type and count.
    const routeMap = {}
    routes.forEach(r => { routeMap[r.id] = r })

    const anyDisasterActive = cities.some(c => c.isDisasterActive)

    migrants.forEach(m => {
      const route    = routeMap[m.routeId]
      if (!route) return
      const fromNode = cityMap[m.from]
      const toNode   = cityMap[m.to]
      if (!fromNode || !toNode) return

      // Fade out economic/return migrants during active disasters — they look wrong
      if (anyDisasterActive && (m.type === 'economic' || m.type === 'return')) {
        ctx.save()
        ctx.globalAlpha = 0.08
      }

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
      const isReturn   = m.type === 'return'

      let figureColor, scale, numFigures, walkSpeed, colWidth, rowGap

      if (isReturn) {
        // Returning residents — soft blue-white, calm pace, single file
        figureColor = 'rgba(180,210,255,0.75)'
        scale       = 0.85
        numFigures  = Math.min(8, Math.max(3, Math.floor(m.count / 55)))
        walkSpeed   = 0.08
        colWidth    = 1
        rowGap      = 12
      } else if (isEconomic) {
        // Economic migrants — green, calm pace, 2-abreast
        figureColor = 'rgba(46,213,115,0.88)'
        scale       = 0.88
        numFigures  = Math.min(8, Math.max(3, Math.floor(m.count / 55)))
        walkSpeed   = 0.09
        colWidth    = 2
        rowGap      = 12
      } else if (isCascade) {
        // Cascade panic — vivid red, fast, 2-abreast fleeing column
        figureColor = 'rgba(255,70,50,1.0)'
        scale       = 1.0
        numFigures  = Math.min(20, Math.max(10, Math.floor(m.count / 38)))
        walkSpeed   = 0.32
        colWidth    = 2
        rowGap      = 13
      } else {
        // Disaster refugees — strict one color per disaster type, 2-abreast column
        const col = DISASTER_COLORS[m.disasterType] || { r: 255, g: 255, b: 255 }
        figureColor = `rgba(${col.r},${col.g},${col.b},1.0)`
        scale       = 1.0
        numFigures  = Math.min(20, Math.max(10, Math.floor(m.count / 38)))
        walkSpeed   = 0.22
        colWidth    = 2
        rowGap      = 14
      }

      // Compute route tangent — figures march along the route direction
      const tA  = Math.max(0, progress - 0.02)
      const tB  = Math.min(1, progress + 0.02)
      const ptA = this.getBezierXY(tA, sx, sy, cpX, cpY, cpX, cpY, ex, ey)
      const ptB = this.getBezierXY(tB, sx, sy, cpX, cpY, cpX, cpY, ex, ey)
      const tdx = ptB.x - ptA.x
      const tdy = ptB.y - ptA.y
      const tlen = Math.sqrt(tdx * tdx + tdy * tdy) || 1
      const ax  =  tdx / tlen   // along-route unit vector
      const ay  =  tdy / tlen
      const px  = -tdy / tlen   // perpendicular unit vector
      const py  =  tdx / tlen

      // March in a column: colWidth abreast, rows staggered back along the route
      const sideStep = colWidth === 1 ? 0 : 5
      for (let i = 0; i < numFigures; i++) {
        const col2      = i % colWidth
        const row       = Math.floor(i / colWidth)
        const side      = colWidth === 1 ? 0 : col2 - (colWidth - 1) / 2
        const ox        = px * side * sideStep - ax * row * rowGap
        const oy        = py * side * sideStep - ay * row * rowGap
        const walkCycle = (this.frameCount * walkSpeed) + (i * 1.1)
        this.drawPerson(pos.x + ox, pos.y + oy, scale, walkCycle, figureColor)
      }

      if (anyDisasterActive && (m.type === 'economic' || m.type === 'return')) {
        ctx.restore()
      }
    })
  }
}

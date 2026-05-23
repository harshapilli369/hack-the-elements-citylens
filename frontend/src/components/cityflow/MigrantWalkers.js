// Helper to render walking people on canvas

export class MigrantRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.frameCount = 0
  }

  // Cubic bezier calculation
  getBezierXY(t, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey) {
    return {
      x: Math.pow(1-t,3)*sx + 3*t*Math.pow(1-t,2)*cp1x + 3*Math.pow(t,2)*(1-t)*cp2x + Math.pow(t,3)*ex,
      y: Math.pow(1-t,3)*sy + 3*t*Math.pow(1-t,2)*cp1y + 3*Math.pow(t,2)*(1-t)*cp2y + Math.pow(t,3)*ey
    }
  }

  drawPerson(x, y, scale = 1, walkCycle = 0) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.shadowBlur = 4
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'

    // Head
    ctx.beginPath()
    ctx.arc(0, -8, 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fill()

    // Body
    ctx.beginPath()
    ctx.moveTo(0, -6)
    ctx.lineTo(0, 2)
    ctx.stroke()

    // Arms (swinging)
    const armSwing = Math.sin(walkCycle) * 4
    ctx.beginPath()
    ctx.moveTo(0, -4)
    ctx.lineTo(-3 - armSwing, 1)
    ctx.moveTo(0, -4)
    ctx.lineTo(3 + armSwing, 1)
    ctx.stroke()

    // Legs (walking)
    const legSwing = Math.sin(walkCycle) * 5
    ctx.beginPath()
    ctx.moveTo(0, 2)
    ctx.lineTo(-legSwing, 8)
    ctx.moveTo(0, 2)
    ctx.lineTo(legSwing, 8)
    ctx.stroke()

    ctx.restore()
  }

  render(migrants, routes, cities, width, height) {
    this.frameCount++
    
    // Create lookup maps
    const cityMap = {}
    cities.forEach(c => {
      cityMap[c.id] = { x: (c.x / 100) * width, y: (c.y / 100) * height }
    })

    const routeMap = {}
    routes.forEach(r => {
      routeMap[r.id] = r
    })

    migrants.forEach(m => {
      const route = routeMap[m.routeId]
      if (!route) return

      const fromNode = cityMap[m.from]
      const toNode = cityMap[m.to]

      if (!fromNode || !toNode) return

      // Use control points, converting percentage to actual pixels
      let cp1x = (route.cpX / 100) * width
      let cp1y = (route.cpY / 100) * height
      let cp2x = cp1x
      let cp2y = cp1y

      // If reversing the route logic, swap start/end
      let sx = route.from === m.from ? cityMap[m.from].x : cityMap[m.to].x
      let sy = route.from === m.from ? cityMap[m.from].y : cityMap[m.to].y
      let ex = route.to === m.to ? cityMap[m.to].x : cityMap[m.from].x
      let ey = route.to === m.to ? cityMap[m.to].y : cityMap[m.from].y

      let actualProgress = m.reverse ? 1 - m.progress : m.progress

      // Draw route path faintly
      this.ctx.beginPath()
      this.ctx.moveTo(sx, sy)
      this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey)
      this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)'
      this.ctx.lineWidth = 2
      this.ctx.stroke()

      // Calculate position
      const pos = this.getBezierXY(actualProgress, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey)
      
      // Determine how many figures to draw based on count
      const numFigures = Math.min(6, Math.max(2, Math.floor(m.count / 300)))
      
      // Draw group of people
      for (let i = 0; i < numFigures; i++) {
        // pseudo-random offsets based on m.id and i
        const offsetX = Math.sin(parseFloat(m.id) * 10 + i) * 15
        const offsetY = Math.cos(parseFloat(m.id) * 10 + i) * 15
        
        // Vary walk cycle slightly per person
        const walkCycle = (this.frameCount * 0.15) + (i * 1.5)
        
        this.drawPerson(pos.x + offsetX, pos.y + offsetY, 0.8, walkCycle)
      }
    })
  }
}

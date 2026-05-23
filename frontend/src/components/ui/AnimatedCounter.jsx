import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'

export function AnimatedCounter({ to, decimals = 0, duration = 1.8, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ref.current) {
          ref.current.textContent = decimals > 0 ? v.toFixed(decimals) : Math.round(v)
        }
      },
    })
    return controls.stop
  }, [to, duration, decimals])

  return <span ref={ref} className={className}>0</span>
}

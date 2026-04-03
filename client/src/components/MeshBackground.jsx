import { useEffect, useRef } from 'react'
import './MeshBackground.css'

export default function MeshBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationFrameId
    
    // Set canvas sizes
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    // Configuration
    const dotSpacing = 30
    const dotRadius = 1
    const baseColor = 'rgba(138, 143, 168, 0.15)' // Muted tertiary text color

    // Pulses
    const pulses = []
    
    const createPulse = () => {
      pulses.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 0,
        maxRadius: Math.max(canvas.width, canvas.height) * (0.3 + Math.random() * 0.4),
        speed: 1.5 + Math.random(),
        // Mix between our cyan and green
        color: Math.random() > 0.5 ? 'rgba(0, 255, 135, 0.12)' : 'rgba(0, 212, 255, 0.12)'
      })
    }

    // Occasionally spawn a new pulse
    const pulseInterval = setInterval(createPulse, 4000)
    createPulse() // start with one

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].radius += pulses[i].speed
        if (pulses[i].radius > pulses[i].maxRadius) {
          pulses.splice(i, 1)
        }
      }

      // Draw grid
      for (let x = 0; x < canvas.width; x += dotSpacing) {
        for (let y = 0; y < canvas.height; y += dotSpacing) {
          // Determine dot color based on pulses
          let dotColor = baseColor
          let extraRadius = 0

          for (const pulse of pulses) {
            const dist = Math.hypot(x - pulse.x, y - pulse.y)
            // If dot is near the expanding edge of the pulse
            if (dist < pulse.radius && dist > pulse.radius - 150) {
              const intensity = (dist - (pulse.radius - 150)) / 150 // 0 to 1
              // The closer to the outer edge, the stronger the effect
              if (intensity > 0.8) {
                 dotColor = pulse.color
                 extraRadius = 0.5
              }
            }
          }

          ctx.beginPath()
          ctx.arc(x, y, dotRadius + extraRadius, 0, Math.PI * 2)
          ctx.fillStyle = dotColor
          ctx.fill()
        }
      }

      animationFrameId = window.requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      clearInterval(pulseInterval)
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="background-container">
      <div className="background-gradient-base" />
      <canvas ref={canvasRef} className="matrix-canvas" />
      <div className="background-vignette" />
    </div>
  )
}

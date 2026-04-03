import { useState, useEffect } from 'react'

export default function AnimatedNumber({ value, duration = 1200, prefix = '' }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) {
      setDisplay(0)
      return
    }

    let start = 0
    const end = Number(value)
    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)

      setDisplay(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <span>{prefix}{display}</span>
}

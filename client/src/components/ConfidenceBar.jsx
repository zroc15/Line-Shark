import { useState, useEffect } from 'react'
import './ConfidenceBar.css'

export default function ConfidenceBar({ value, type }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth((value / 10) * 100)
    }, 100)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="confidence-bar-container">
      <div
        className={`confidence-bar-fill ${type === 'BUY' ? 'buy' : 'bye'}`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

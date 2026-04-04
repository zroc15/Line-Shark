import { useEffect, useRef } from 'react'
import './OddsTicker.css'

export default function OddsTicker({ items }) {
  const trackRef = useRef(null)

  // Duplicate items so marquee loops seamlessly
  const marqueeItems = [...items, ...items]

  return (
    <div className="odds-ticker" id="odds-ticker">
      <div className="ticker-label">
        <span className="ticker-dot" />
        LIVE
      </div>
      <div className="ticker-track-wrapper">
        <div className="ticker-track" ref={trackRef}>
          {marqueeItems.map((t, i) => (
            <div className="ticker-item" key={i}>
              <span className="ticker-sport">{t.sport}</span>
              <span className="ticker-line">{t.label}</span>
              <span className={`ticker-arrow ${t.movement}`}>
                {t.movement === 'down' ? '▼' : '▲'}
              </span>
              <span className="ticker-prev">{t.prev}</span>
              <span className="ticker-sep">→</span>
              <span className={`ticker-curr ${t.movement}`}>{t.curr}</span>
              <span className="ticker-book">{t.book}</span>
              <span className="ticker-divider">│</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

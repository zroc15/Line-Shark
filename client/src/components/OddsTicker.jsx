import { useEffect, useRef } from 'react'
import { TICKER_DATA } from '../utils/dashboardData'
import './OddsTicker.css'

export default function OddsTicker() {
  const trackRef = useRef(null)

  // Duplicate items so marquee loops seamlessly
  const items = [...TICKER_DATA, ...TICKER_DATA]

  return (
    <div className="odds-ticker" id="odds-ticker">
      <div className="ticker-label">
        <span className="ticker-dot" />
        LIVE
      </div>
      <div className="ticker-track-wrapper">
        <div className="ticker-track" ref={trackRef}>
          {items.map((t, i) => (
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

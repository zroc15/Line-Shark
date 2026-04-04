import { useState } from 'react'
import './SportSelector.css'

export default function SportSelector({ selectedSport, onSelectSport, disabled, sportMeta = {} }) {
  const [animating, setAnimating] = useState(null)

  const SPORTS = Object.entries(sportMeta).map(([key, meta]) => ({
    key,
    name: meta.label,
    icon: meta.icon,
    games: meta.games,
    edges: meta.edges,
  }))

  const handleSelect = (sport) => {
    if (disabled) return
    setAnimating(sport.key)
    setTimeout(() => setAnimating(null), 500)
    onSelectSport(sport.key)
  }

  return (
    <section className="sport-selector" id="sport-selector">
      <div className="sport-selector-title">Select Sport to Analyze</div>
      <div className="sport-grid">
        {SPORTS.map((sport) => (
          <button
            key={sport.key}
            className={`sport-tile interactive ${selectedSport === sport.key ? 'selected' : ''} ${animating === sport.key ? 'selecting' : ''}`}
            onClick={() => handleSelect(sport)}
            disabled={disabled}
            id={`sport-${sport.key}`}
          >
            <span className="sport-tile-icon">{sport.icon}</span>
            <span className="sport-tile-name">{sport.name}</span>
            <span className="sport-tile-games">{sport.games} Games Today</span>
            {sport.edges > 0 && (
              <span className="sport-tile-edges">
                <span className="edge-dot" />
                {sport.edges} Edge Play{sport.edges !== 1 ? 's' : ''} Found
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}

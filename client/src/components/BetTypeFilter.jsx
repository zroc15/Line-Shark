import { MARKET_TYPES } from '../utils/mockData'
import './BetTypeFilter.css'

const FILTER_OPTIONS = [
  { key: 'all', label: 'All Markets', icon: '🔥' },
  ...Object.values(MARKET_TYPES),
]

export default function BetTypeFilter({ activeFilter, onFilterChange, results }) {
  const getCounts = (filterKey) => {
    if (!results) return 0
    if (filterKey === 'all') return results.filter(r => r.rating === 'BUY').length
    return results.filter(r => r.marketType === filterKey && r.rating === 'BUY').length
  }

  return (
    <div className="bet-filter-container" id="bet-type-filter">
      <div className="bet-filter-label">Filter by Market</div>
      <div className="bet-filter-row">
        {FILTER_OPTIONS.map((option) => {
          const count = getCounts(option.key)
          const isActive = activeFilter === option.key
          const isEmpty = count === 0 && option.key !== 'all'
          return (
            <button
              key={option.key}
              className={`bet-filter-btn interactive ${isActive ? 'active' : ''} ${isEmpty ? 'empty' : ''}`}
              onClick={() => onFilterChange(option.key)}
              id={`filter-${option.key}`}
            >
              <span className="bet-filter-icon">{option.icon}</span>
              <span className="bet-filter-name">{option.label}</span>
              {count > 0 && (
                <span className="bet-filter-count">{count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

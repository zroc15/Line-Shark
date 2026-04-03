import AnimatedNumber from './AnimatedNumber'
import { MARKET_TYPES } from '../utils/mockData'
import './ResultsSummary.css'

export default function ResultsSummary({ results, unitSize }) {
  const buyResults = results.filter(r => r.rating === 'BUY')
  const byeCount = results.filter(r => r.rating === 'BYE').length
  const totalAction = buyResults.reduce((sum, r) => sum + (r.units * unitSize), 0)

  // Get unique market types that have BUY signals
  const marketBreakdown = Object.values(MARKET_TYPES)
    .map(market => ({
      ...market,
      count: buyResults.filter(r => r.marketType === market.key).length,
    }))
    .filter(m => m.count > 0)

  const avgEdge = buyResults.length > 0
    ? (buyResults.reduce((sum, r) => sum + (r.edgePercent || 0), 0) / buyResults.length).toFixed(1)
    : 0

  return (
    <div className="results-summary" id="results-summary">
      <div className="summary-stat buy">
        <div className="summary-label">BUY Signals</div>
        <div className="summary-value">
          <AnimatedNumber value={buyResults.length} />
        </div>
        <div className="summary-subtitle">actionable plays</div>
      </div>
      <div className="summary-stat bye">
        <div className="summary-label">BYE Signals</div>
        <div className="summary-value">
          <AnimatedNumber value={byeCount} />
        </div>
        <div className="summary-subtitle">stay away</div>
      </div>
      <div className="summary-stat edge">
        <div className="summary-label">Avg Edge</div>
        <div className="summary-value">{avgEdge}%</div>
        <div className="summary-subtitle">estimated advantage</div>
      </div>
      <div className="summary-stat total">
        <div className="summary-label">Total Action</div>
        <div className="summary-value">
          $<AnimatedNumber value={totalAction} />
        </div>
        <div className="summary-subtitle">recommended wagers</div>
      </div>

      {/* Market breakdown row */}
      {marketBreakdown.length > 0 && (
        <div className="summary-market-breakdown">
          {marketBreakdown.map(market => (
            <div key={market.key} className="market-breakdown-chip">
              <span className="market-breakdown-icon">{market.icon}</span>
              <span className="market-breakdown-label">{market.label}</span>
              <span className="market-breakdown-count">{market.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

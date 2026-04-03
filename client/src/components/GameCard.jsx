import { useState } from 'react'
import ConfidenceBar from './ConfidenceBar'
import AnimatedNumber from './AnimatedNumber'
import { MARKET_TYPES } from '../utils/mockData'
import './GameCard.css'

const UNIT_TIERS = {
  0: { label: 'No Play', emoji: '🔇', class: '' },
  0.5: { label: '½ Unit · Lean', emoji: '🫣', class: '' },
  1: { label: '1 Unit · Standard', emoji: '✅', class: '' },
  2: { label: '2 Units · Strong', emoji: '🔥', class: 'strong' },
  3: { label: '3 Units · Premium', emoji: '💰', class: 'premium' },
  5: { label: '5 Units · Mortgage Play', emoji: '🏠', class: 'mortgage' },
}

function getUnitTier(confidence) {
  if (confidence <= 3) return { units: 0, ...UNIT_TIERS[0] }
  if (confidence <= 5) return { units: 0.5, ...UNIT_TIERS[0.5] }
  if (confidence <= 7) return { units: 1, ...UNIT_TIERS[1] }
  if (confidence === 8) return { units: 2, ...UNIT_TIERS[2] }
  if (confidence === 9) return { units: 3, ...UNIT_TIERS[3] }
  return { units: 5, ...UNIT_TIERS[5] }
}

function getMarketLabel(marketType) {
  const market = Object.values(MARKET_TYPES).find(m => m.key === marketType)
  return market || { label: marketType, icon: '📊' }
}

export default function GameCard({ game, unitSize, index }) {
  const [expanded, setExpanded] = useState(false)
  const isBuy = game.rating === 'BUY'
  const isHotPick = isBuy && game.confidence >= 8
  const isMortgage = isBuy && game.confidence >= 10
  const tier = getUnitTier(game.confidence)
  const betAmount = tier.units * unitSize
  const delay = index * 80
  const market = getMarketLabel(game.marketType)

  return (
    <div
      className={`game-card interactive ${isBuy ? 'buy' : 'bye'} ${isHotPick ? 'hot-pick' : ''} ${isMortgage ? 'mortgage-pick' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
      id={`game-card-${index}`}
    >
      {/* Market Type Badge */}
      <div className="game-card-top-row">
        <div className={`market-type-badge ${game.marketType}`}>
          <span>{market.icon}</span>
          <span>{market.label}</span>
        </div>
        {game.edgePercent > 0 && (
          <div className="edge-badge">
            <span className="edge-label">EDGE</span>
            <span className="edge-value">+{game.edgePercent}%</span>
          </div>
        )}
      </div>

      {/* Specific Bet Headline */}
      <div className="game-card-header">
        <div className="game-bet-headline">
          <div className="specific-bet">
            <span className={`rating-inline ${isBuy ? 'buy' : 'bye'}`}>
              {game.rating}
            </span>
            {game.specificBet}
          </div>
          <div className="specific-odds">
            <span className="odds-value">{game.odds}</span>
            {game.bestBook && (
              <span className="best-book">Best: {game.bestBook}</span>
            )}
          </div>
        </div>
        <div className={`rating-badge ${isBuy ? 'buy' : 'bye'}`}>
          {game.rating}
        </div>
      </div>

      {/* Matchup Context */}
      <div className="game-matchup-row">
        <div className="game-teams-small">
          {game.matchup}
        </div>
        <div className="game-time">{game.time}</div>
      </div>

      {/* Book Comparison */}
      {game.bookComparison && game.bookComparison.length > 0 && (
        <div className="book-comparison">
          <div className="book-comparison-label">Odds Comparison</div>
          <div className="book-comparison-row">
            {game.bookComparison.map((book, i) => {
              const isBest = book.book === game.bestBook
              return (
                <div key={i} className={`book-chip ${isBest ? 'best' : ''}`}>
                  <span className="book-name">{book.book}</span>
                  <span className="book-odds">{book.odds}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Confidence */}
      <div className="game-confidence">
        <div className="game-confidence-header">
          <span className="game-confidence-label">Confidence</span>
          <span className={`game-confidence-value ${game.confidence >= 6 ? 'high' : 'low'}`}>
            {game.confidence}/10
          </span>
        </div>
        <ConfidenceBar value={game.confidence} type={game.rating} />
      </div>

      {/* Wager Info (BUY only) */}
      {isBuy && (
        <div className="game-bet-info">
          <div className="bet-detail">
            <span className="bet-label">Wager</span>
            <span className="bet-value buy">
              $<AnimatedNumber value={betAmount} />
            </span>
            <span className={`bet-tier ${tier.class}`}>
              {tier.emoji} {tier.label}
            </span>
          </div>
          <div className="bet-detail" style={{ textAlign: 'right' }}>
            <span className="bet-label">Est. Payout</span>
            <span className="bet-value buy">
              $<AnimatedNumber value={game.estimatedPayout || Math.round(betAmount * 1.9)} />
            </span>
          </div>
        </div>
      )}

      {/* Expand button */}
      <button
        className="game-expand-btn interactive"
        onClick={() => setExpanded(!expanded)}
        id={`expand-btn-${index}`}
      >
        <span>{expanded ? 'Hide' : 'Show'} Analysis</span>
        <span className={`expand-arrow ${expanded ? 'open' : ''}`}>▾</span>
      </button>

      {/* Expanded Detail */}
      <div className={`game-detail ${expanded ? 'open' : ''}`}>
        <div className="game-detail-content">
          {game.keyFactors && game.keyFactors.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">Key Factors</div>
              <div className="detail-factors">
                {game.keyFactors.map((f, i) => (
                  <div key={i} className="detail-factor">
                    <span className="factor-icon positive">▲</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {game.riskFactors && game.riskFactors.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">Risk Factors</div>
              <div className="detail-factors">
                {game.riskFactors.map((f, i) => (
                  <div key={i} className="detail-factor">
                    <span className="factor-icon negative">▼</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {game.reasoning && (
            <div className="detail-section">
              <div className="detail-section-title">AI Reasoning</div>
              <div className="game-reasoning">{game.reasoning}</div>
            </div>
          )}

          {game.recentForm && (
            <div className="detail-section">
              <div className="sparkline-container">
                <div className="sparkline-label">Last 10 Games — {game.homeTeam}</div>
                <div className="sparkline">
                  {game.recentForm.map((result, i) => (
                    <div
                      key={i}
                      className={`sparkline-bar ${result === 'W' ? 'win' : result === 'D' ? 'draw' : 'loss'}`}
                      style={{
                        height: `${result === 'W' ? 80 + Math.random() * 20 : result === 'D' ? 50 + Math.random() * 10 : 30 + Math.random() * 30}%`,
                        transitionDelay: `${i * 60}ms`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

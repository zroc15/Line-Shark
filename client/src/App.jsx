import { useState } from 'react'
import MeshBackground from './components/MeshBackground'
import Header from './components/Header'
import SportSelector from './components/SportSelector'
import AnalysisPipeline from './components/AnalysisPipeline'
import TerminalLog from './components/TerminalLog'
import ResultsSummary from './components/ResultsSummary'
import BetTypeFilter from './components/BetTypeFilter'
import GameCard from './components/GameCard'
import useAnalysis from './hooks/useAnalysis'

import OddsTicker from './components/OddsTicker'
import BigBoard from './components/BigBoard'
import ValueProp from './components/ValueProp'
import AuthModal from './components/AuthModal'
import { useAuth } from './contexts/AuthContext'

export default function App() {
  const [unitSize, setUnitSize] = useState(50)
  const [betFilter, setBetFilter] = useState('all')
  const [showAuth, setShowAuth] = useState(false)
  const { user } = useAuth()
  const {
    phase,
    selectedSport,
    currentStage,
    completedStages,
    logs,
    results,
    startAnalysis,
    reset,
    reanalyze,
  } = useAnalysis()

  const handleSelectSport = (sport) => {
    if (!user) {
      setShowAuth(true)
      return
    }
    setBetFilter('all')
    startAnalysis(sport)
  }

  const handleUnitSizeChange = (value) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num > 0) {
      setUnitSize(num)
    } else if (value === '') {
      setUnitSize('')
    }
  }

  const handleReset = () => {
    setBetFilter('all')
    reset()
  }

  const effectiveUnitSize = Number(unitSize) || 50

  // Sort results: BUY first (highest confidence first), then BYE
  const sortedResults = results
    ? [...results].sort((a, b) => {
        if (a.rating === 'BUY' && b.rating !== 'BUY') return -1
        if (a.rating !== 'BUY' && b.rating === 'BUY') return 1
        return b.confidence - a.confidence
      })
    : []

  // Apply bet type filter
  const filteredResults = betFilter === 'all'
    ? sortedResults
    : sortedResults.filter(r => r.marketType === betFilter)

  return (
    <>
      <MeshBackground />
      <div className="grain-overlay" />

      {/* Live Odds Ticker — always visible on homepage */}
      {phase === 'select' && <OddsTicker />}

      <div className="app">
        <Header
          unitSize={unitSize}
          onUnitSizeChange={handleUnitSizeChange}
          isAnalyzing={phase === 'analyzing'}
          onLoginClick={() => setShowAuth(true)}
        />

        <main className="app-content">
          {/* Sport Selection Phase */}
          {phase === 'select' && (
            <>
              <div style={{
                textAlign: 'center',
                marginBottom: 'var(--space-2xl)',
                marginTop: 'var(--space-xl)',
              }}>
                <h1 style={{
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  marginBottom: '16px',
                  lineHeight: 1.1,
                }}>
                  <span>Sharper Lines.</span>
                  <br />
                  <span className="gradient-text">Smarter Bets.</span>
                </h1>
                <p style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  maxWidth: '500px',
                  margin: '0 auto',
                  lineHeight: 1.6,
                }}>
                  AI-powered analysis across spreads, moneylines, totals, and player props.
                  Select a sport to begin.
                </p>
              </div>

              {/* Big Board — Marquee Games */}
              <BigBoard />

              {/* Value Proposition */}
              <ValueProp />

              <SportSelector
                selectedSport={selectedSport}
                onSelectSport={handleSelectSport}
                disabled={false}
              />
            </>
          )}

          {/* Analysis Phase */}
          {phase === 'analyzing' && (
            <>
              <AnalysisPipeline
                currentStage={currentStage}
                completedStages={completedStages}
              />
              <TerminalLog logs={logs} isActive={true} />
            </>
          )}

          {/* Results Phase */}
          {phase === 'results' && sortedResults.length > 0 && (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-lg)',
                flexWrap: 'wrap',
                gap: 'var(--space-sm)',
              }}>
                <div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                  }}>
                    {selectedSport?.toUpperCase()} Analysis
                  </h2>
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--text-tertiary)',
                    marginTop: '4px',
                  }}>
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })} · {sortedResults.length} markets analyzed · <span style={{color: 'var(--success-color)'}}>LIVE DATA</span>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button
                    className="btn btn-secondary interactive"
                    onClick={handleReset}
                    id="back-btn"
                  >
                    ← Back
                  </button>
                  <button
                    className="btn btn-primary interactive"
                    onClick={reanalyze}
                    id="reanalyze-btn"
                  >
                    <span style={{
                      display: 'inline-block',
                      marginRight: '6px',
                    }}>↻</span>
                    Re-Analyze
                  </button>
                </div>
              </div>

              <ResultsSummary results={sortedResults} unitSize={effectiveUnitSize} />

              <BetTypeFilter
                activeFilter={betFilter}
                onFilterChange={setBetFilter}
                results={sortedResults}
              />

              <div className="game-cards-grid">
                {filteredResults.map((game, index) => (
                  <GameCard
                    key={game.id || `${game.homeTeam}-${game.awayTeam}-${index}`}
                    game={game}
                    unitSize={effectiveUnitSize}
                    index={index}
                  />
                ))}
                {filteredResults.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: 'var(--space-2xl)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    color: 'var(--text-tertiary)',
                  }}>
                    No BUY signals found for this market type. Try "All Markets".
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
      {showAuth && <AuthModal onDismiss={() => setShowAuth(false)} />}
    </>
  )
}

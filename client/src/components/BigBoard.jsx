import { BIG_BOARD_GAMES } from '../utils/dashboardData'
import './BigBoard.css'

export default function BigBoard() {
  return (
    <section className="big-board" id="big-board">
      <div className="big-board-header">
        <h2 className="big-board-title">
          <span className="big-board-icon">📡</span>
          The Big Board
        </h2>
        <span className="big-board-subtitle">Today's Marquee Matchups</span>
      </div>

      <div className="big-board-grid">
        {BIG_BOARD_GAMES.map((game, i) => (
          <div className="board-card interactive" key={i} id={`board-card-${i}`} style={{ animationDelay: `${i * 100}ms` }}>
            {/* Tag */}
            <div className={`board-tag board-tag--${game.tagColor}`}>
              {game.tag}
            </div>

            {/* Sport badge */}
            <div className="board-sport">
              <span className="board-sport-icon">{game.sportIcon}</span>
              <span className="board-sport-label">{game.sport}</span>
            </div>

            {/* Matchup */}
            <div className="board-matchup">
              <span className="board-team">{game.away}</span>
              <span className="board-at">@</span>
              <span className="board-team">{game.home}</span>
            </div>
            <div className="board-time">{game.time}</div>

            {/* Odds row */}
            <div className="board-odds">
              <div className="board-odds-item">
                <span className="board-odds-label">SPREAD</span>
                <span className="board-odds-value">{game.spread}</span>
              </div>
              <div className="board-odds-item">
                <span className="board-odds-label">ML</span>
                <span className="board-odds-value">{game.ml}</span>
              </div>
              <div className="board-odds-item">
                <span className="board-odds-label">O/U</span>
                <span className="board-odds-value">{game.ou}</span>
              </div>
            </div>

            {/* AI locked state */}
            <div className="board-ai-locked">
              <div className="board-lock-icon">🔒</div>
              <span>AI Signal Pending</span>
              <div className="board-lock-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

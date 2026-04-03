import './Header.css'

export default function Header({ unitSize, onUnitSizeChange, isAnalyzing }) {
  return (
    <header className="header" id="main-header">
      <div className="header-logo">
        <span>LINE </span>
        <span className="logo-shark">SHARK</span>
        <span className="shimmer" aria-hidden="true" />
      </div>
      <div className="header-right">
        <div className="header-unit-size">
          <span>UNIT $</span>
          <input
            type="number"
            className="header-unit-input interactive"
            id="unit-size-input"
            value={unitSize}
            onChange={(e) => onUnitSizeChange(e.target.value)}
            placeholder="50"
            min="1"
            step="5"
          />
        </div>
        <div className="header-status">
          <div className={`status-dot ${isAnalyzing ? '' : 'offline'}`} />
          <span>{isAnalyzing ? 'ANALYZING' : 'MOCK MODE'}</span>
        </div>
      </div>
    </header>
  )
}

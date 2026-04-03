import './ValueProp.css'

const FEATURES = [
  {
    icon: '📡',
    title: 'Real-Time Odds Scraping',
    desc: 'We scrape injury reports, sharp money movement, and historical trends across 12+ sportsbooks in real-time.',
  },
  {
    icon: '🧠',
    title: 'Claude AI Analysis',
    desc: 'Claude processes thousands of data points — odds, sentiment, weather, matchup history — to generate actionable signals.',
  },
  {
    icon: '💰',
    title: 'Unit-Sized Signals',
    desc: 'Every BUY signal comes with Kelly Criterion-based unit sizing so you know exactly how much to wager.',
  },
]

export default function ValueProp() {
  return (
    <section className="value-prop" id="value-prop">
      <div className="value-prop-grid">
        {FEATURES.map((f, i) => (
          <div className="value-card" key={i} style={{ animationDelay: `${i * 120}ms` }}>
            <div className="value-icon">{f.icon}</div>
            <div className="value-title">{f.title}</div>
            <div className="value-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

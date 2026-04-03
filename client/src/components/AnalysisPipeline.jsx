import './AnalysisPipeline.css'

const STAGES = [
  { key: 'scrape', icon: '📡', label: 'Scrape Odds' },
  { key: 'intel', icon: '🔍', label: 'Gather Intel' },
  { key: 'analyze', icon: '🧠', label: 'AI Analysis' },
]

export default function AnalysisPipeline({ currentStage, completedStages }) {
  const getNodeState = (stageKey) => {
    if (completedStages.includes(stageKey)) return 'complete'
    if (currentStage === stageKey) return 'active'
    return 'pending'
  }

  const getLineState = (index) => {
    const stageKey = STAGES[index].key
    const nextKey = STAGES[index + 1]?.key
    if (completedStages.includes(stageKey) && (completedStages.includes(nextKey) || currentStage === nextKey)) {
      return 'complete'
    }
    if (completedStages.includes(stageKey) || currentStage === stageKey) {
      return 'active'
    }
    return 'pending'
  }

  return (
    <div className="pipeline-container" id="analysis-pipeline">
      <div className="pipeline-visual">
        {STAGES.map((stage, i) => (
          <div key={stage.key} style={{ display: 'contents' }}>
            <div className={`pipeline-node ${getNodeState(stage.key)}`}>
              <div className="pipeline-node-circle">
                {getNodeState(stage.key) === 'complete' ? '✓' : stage.icon}
              </div>
              <span className="pipeline-node-label">{stage.label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`pipeline-line ${getLineState(i)}`}>
                <div className="pipeline-line-fill" />
                <div className="pipeline-particle" />
                <div className="pipeline-particle" />
                <div className="pipeline-particle" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

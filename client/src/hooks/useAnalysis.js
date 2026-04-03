import { useState, useCallback } from 'react'
import { createAnalysisStream } from '../utils/api'

export default function useAnalysis() {
  const [state, setState] = useState({
    phase: 'select', // 'select' | 'analyzing' | 'results'
    selectedSport: null,
    currentStage: null,
    completedStages: [],
    logs: [],
    results: null,
    error: null,
  })

  const timeoutRefs = useRef([])

  const clearTimeouts = () => {
    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current = []
  }

  const addLog = useCallback((log) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, log],
    }))
  }, [])

  const runLivePipeline = useCallback((sport) => {
    setState({
      phase: 'analyzing',
      selectedSport: sport,
      currentStage: null,
      completedStages: [],
      logs: [],
      results: null,
      error: null,
    })

    // This returns the unsubscribe/close function
    const cancelStream = createAnalysisStream(sport, 50, {
      onStage: (data) => {
        if (data.status === 'started') {
           setState(prev => ({ ...prev, currentStage: data.stage }))
        } else if (data.status === 'complete') {
           setState(prev => ({ 
             ...prev, 
             completedStages: [...prev.completedStages, data.stage]
           }))
        }
      },
      onLog: (data) => addLog(data.message),
      onResult: (results) => {
        setState(prev => ({
          ...prev,
          phase: 'results',
          currentStage: null,
          results: results,
        }))
      },
      onError: (errMessage) => {
         addLog(`ERROR: ${errMessage}`)
         setState(prev => ({ ...prev, error: errMessage }))
      }
    })
    
    // Cleanup reference if needed here.
  }, [addLog])

  const startAnalysis = useCallback((sport) => {
    runLivePipeline(sport)
  }, [runLivePipeline])

  const reset = useCallback(() => {
    setState({
      phase: 'select',
      selectedSport: null,
      currentStage: null,
      completedStages: [],
      logs: [],
      results: null,
      error: null,
    })
  }, [])

  const reanalyze = useCallback(() => {
    if (state.selectedSport) {
      runLivePipeline(state.selectedSport)
    }
  }, [state.selectedSport, runLivePipeline])

  return {
    ...state,
    startAnalysis,
    reset,
    reanalyze,
  }
}

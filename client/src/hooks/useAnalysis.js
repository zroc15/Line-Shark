import { useState, useCallback, useRef, useEffect } from 'react'
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

  const cancelRef = useRef(null)

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => { cancelRef.current?.() }
  }, [])

  const addLog = useCallback((message) => {
    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, { time, message, type: '' }],
    }))
  }, [])

  const runLivePipeline = useCallback((sport, unitSize = 50) => {
    // Close any existing stream
    cancelRef.current?.()

    setState({
      phase: 'analyzing',
      selectedSport: sport,
      currentStage: null,
      completedStages: [],
      logs: [],
      results: null,
      error: null,
    })

    cancelRef.current = createAnalysisStream(sport, unitSize, {
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
        cancelRef.current = null
        setState(prev => ({
          ...prev,
          phase: 'results',
          currentStage: null,
          results: results,
        }))
      },
      onError: (errMessage) => {
         cancelRef.current = null
         addLog(`ERROR: ${errMessage}`)
         setState(prev => ({ ...prev, error: errMessage }))
      }
    })
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

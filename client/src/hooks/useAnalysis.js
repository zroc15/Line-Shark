import { useState, useCallback, useRef } from 'react'
import { getMockGames, getMockLogs } from '../utils/mockData'

const STAGES = ['scrape', 'intel', 'analyze']

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

  const runMockPipeline = useCallback((sport) => {
    clearTimeouts()

    setState({
      phase: 'analyzing',
      selectedSport: sport,
      currentStage: null,
      completedStages: [],
      logs: [],
      results: null,
      error: null,
    })

    let totalDelay = 300

    // Run each stage with simulated delays
    STAGES.forEach((stage, stageIndex) => {
      // Start stage
      const startId = setTimeout(() => {
        setState(prev => ({
          ...prev,
          currentStage: stage,
        }))
      }, totalDelay)
      timeoutRefs.current.push(startId)
      totalDelay += 400

      // Add logs for this stage
      const logs = getMockLogs(stage, sport)
      logs.forEach((log, logIndex) => {
        const logId = setTimeout(() => {
          addLog(log)
        }, totalDelay)
        timeoutRefs.current.push(logId)
        totalDelay += 250 + Math.random() * 300
      })

      // Complete stage
      const completeId = setTimeout(() => {
        setState(prev => ({
          ...prev,
          completedStages: [...prev.completedStages, stage],
        }))
      }, totalDelay)
      timeoutRefs.current.push(completeId)
      totalDelay += 500
    })

    // Show results
    const resultsId = setTimeout(() => {
      const games = getMockGames(sport)
      setState(prev => ({
        ...prev,
        phase: 'results',
        currentStage: null,
        results: games,
      }))
    }, totalDelay + 500)
    timeoutRefs.current.push(resultsId)
  }, [addLog])

  const startAnalysis = useCallback((sport) => {
    runMockPipeline(sport)
  }, [runMockPipeline])

  const reset = useCallback(() => {
    clearTimeouts()
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
      runMockPipeline(state.selectedSport)
    }
  }, [state.selectedSport, runMockPipeline])

  return {
    ...state,
    startAnalysis,
    reset,
    reanalyze,
  }
}

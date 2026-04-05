import { useState, useCallback } from 'react'
import { fetchAnalysis } from '../utils/api'

const STAGES = ['scrape', 'intel', 'analyze']
const STAGE_MESSAGES = {
  scrape: ['Connecting to The Odds API...', 'Pulling live spreads, moneylines, totals...', 'Scanning 12+ sportsbooks...'],
  intel: ['Scraping injury reports...', 'Gathering latest headlines...', 'Cross-referencing intel...'],
  analyze: ['Claude AI analyzing edges...', 'Calculating implied probabilities...', 'Generating BUY/BYE signals...'],
}

export default function useAnalysis() {
  const [state, setState] = useState({
    phase: 'select', // 'select' | 'analyzing' | 'results'
    selectedSport: null,
    currentStage: null,
    completedStages: [],
    logs: [],
    results: null,
    lastUpdated: null,
    error: null,
  })

  const addLog = useCallback((message) => {
    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, { time, message, type: '' }],
    }))
  }, [])

  const startAnalysis = useCallback(async (sport) => {
    setState({
      phase: 'analyzing',
      selectedSport: sport,
      currentStage: null,
      completedStages: [],
      logs: [],
      results: null,
      lastUpdated: null,
      error: null,
    })

    // Run a UX animation while fetching cached results
    // This gives the premium "analyzing" feel even though results are instant
    const animationPromise = new Promise(async (resolve) => {
      for (const stage of STAGES) {
        setState(prev => ({ ...prev, currentStage: stage }))
        
        // Add logs for this stage
        for (const msg of STAGE_MESSAGES[stage]) {
          addLog(msg)
          await new Promise(r => setTimeout(r, 300 + Math.random() * 200))
        }
        
        setState(prev => ({
          ...prev,
          completedStages: [...prev.completedStages, stage],
        }))
        await new Promise(r => setTimeout(r, 200))
      }
      resolve()
    })

    // Fetch cached results from Supabase (runs in parallel with animation)
    const fetchPromise = fetchAnalysis(sport)

    try {
      // Wait for BOTH the animation and the fetch to complete
      const [_, data] = await Promise.all([animationPromise, fetchPromise])

      if (data.results && data.results.length > 0) {
        addLog(`Analysis complete — ${data.results.filter(r => r.rating === 'BUY').length} BUY signals found`)
        setState(prev => ({
          ...prev,
          phase: 'results',
          currentStage: null,
          results: data.results,
          lastUpdated: data.lastUpdated,
        }))
      } else {
        addLog('No analysis available yet — check back soon')
        setState(prev => ({
          ...prev,
          error: data.message || 'No analysis available yet. The system runs every 3 hours — check back soon!',
        }))
      }
    } catch (err) {
      addLog(`ERROR: ${err.message}`)
      setState(prev => ({ ...prev, error: err.message }))
    }
  }, [addLog])

  const reset = useCallback(() => {
    setState({
      phase: 'select',
      selectedSport: null,
      currentStage: null,
      completedStages: [],
      logs: [],
      results: null,
      lastUpdated: null,
      error: null,
    })
  }, [])

  const reanalyze = useCallback(() => {
    if (state.selectedSport) {
      startAnalysis(state.selectedSport)
    }
  }, [state.selectedSport, startAnalysis])

  return {
    ...state,
    startAnalysis,
    reset,
    reanalyze,
  }
}

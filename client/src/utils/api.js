const API_BASE = '/api'

export async function analyzeGames(sport, unitSize) {
  // In mock mode, we don't hit the backend
  // When API keys are configured, this will use SSE
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sport, unitSize }),
  })

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`)
  }

  return response.json()
}

export function createAnalysisStream(sport, unitSize, callbacks) {
  // SSE connection for real-time pipeline progress
  // Will be used when backend is connected
  const params = new URLSearchParams({ sport, unitSize: String(unitSize) })
  const eventSource = new EventSource(`${API_BASE}/analyze/stream?${params}`)

  eventSource.addEventListener('stage', (e) => {
    const data = JSON.parse(e.data)
    callbacks.onStage?.(data)
  })

  eventSource.addEventListener('log', (e) => {
    const data = JSON.parse(e.data)
    callbacks.onLog?.(data)
  })

  eventSource.addEventListener('result', (e) => {
    const data = JSON.parse(e.data)
    callbacks.onResult?.(data)
    eventSource.close()
  })

  eventSource.addEventListener('error', () => {
    callbacks.onError?.('Connection lost')
    eventSource.close()
  })

  return () => eventSource.close()
}

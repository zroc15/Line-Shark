const API_BASE = '/api'

export async function fetchDashboardData() {
  const response = await fetch(`${API_BASE}/dashboard`)
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }
  return response.json()
}

export function createAnalysisStream(sport, unitSize, callbacks) {
  const params = new URLSearchParams({ sport, unitSize: String(unitSize) })
  const eventSource = new EventSource(`${API_BASE}/analyze/stream?${params}`)

  // Timeout after 90s if no result received
  const timeout = setTimeout(() => {
    callbacks.onError?.('Analysis timed out — please try again')
    eventSource.close()
  }, 90000)

  eventSource.addEventListener('stage', (e) => {
    const data = JSON.parse(e.data)
    callbacks.onStage?.(data)
  })

  eventSource.addEventListener('log', (e) => {
    const data = JSON.parse(e.data)
    callbacks.onLog?.(data)
  })

  eventSource.addEventListener('result', (e) => {
    clearTimeout(timeout)
    const data = JSON.parse(e.data)
    callbacks.onResult?.(data)
    eventSource.close()
  })

  eventSource.addEventListener('error', () => {
    clearTimeout(timeout)
    callbacks.onError?.('Connection lost')
    eventSource.close()
  })

  return () => {
    clearTimeout(timeout)
    eventSource.close()
  }
}

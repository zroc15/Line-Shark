const API_BASE = '/api'

export async function fetchDashboardData() {
  const response = await fetch(`${API_BASE}/dashboard`)
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }
  return response.json()
}

// Fetch pre-computed analysis from Supabase cache
export async function fetchAnalysis(sport) {
  const response = await fetch(`${API_BASE}/analysis?sport=${sport}`)
  if (!response.ok) {
    throw new Error('Failed to fetch analysis')
  }
  return response.json()
}

import { getSupabase } from '../lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { sport } = req.query
  if (!sport) {
    return res.status(400).json({ error: 'sport query parameter is required' })
  }

  // Cache on Vercel edge for 5 minutes
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

  try {
    const supabase = getSupabase()

    // Fetch the most recent analysis for this sport that hasn't expired
    const { data, error } = await supabase
      .from('analyses')
      .select('results, created_at')
      .eq('sport', sport)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return res.status(200).json({
        sport,
        results: null,
        message: 'No analysis available yet — the system runs every 3 hours. Check back soon!',
        lastUpdated: null,
      })
    }

    return res.status(200).json({
      sport,
      results: data.results,
      lastUpdated: data.created_at,
    })

  } catch (err) {
    console.error('Analysis fetch error:', err)
    return res.status(500).json({ error: 'Failed to fetch analysis' })
  }
}

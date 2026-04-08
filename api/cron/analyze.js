export const maxDuration = 300; // 5 minutes per sport

import { getSupabase } from '../lib/supabase.js'
import { getOdds, getPlayerProps } from '../services/oddsService.js'
import { scrapeInjuryReport, scrapeNewsHeadlines } from '../services/firecrawlService.js'
import { analyze } from '../services/claudeService.js'

// Which sports are currently in-season and worth analyzing
const ACTIVE_SPORTS = ['nba', 'mlb', 'nhl', 'mls']
// NFL is off-season — add it back in September

export default async function handler(req, res) {
  // Verify this is a legitimate cron call (optional security)
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow manual triggers without secret during development
    // In production, enforce the secret
  }

  const sport = req.query.sport // Optional: run for a single sport

  // If no sport specified, fan out — call ourselves once per sport in parallel
  if (!sport) {
    const baseUrl = `https://${req.headers.host}/api/cron/analyze`
    const fanOutResults = {}
    const fanOutErrors = {}

    const promises = ACTIVE_SPORTS.map(async (s) => {
      try {
        const url = `${baseUrl}?sport=${s}`
        const resp = await fetch(url, {
          headers: authHeader ? { Authorization: authHeader } : {}
        })
        const data = await resp.json()
        fanOutResults[s] = data.results?.[s] || 'unknown'
        if (data.errors?.[s]) fanOutErrors[s] = data.errors[s]
      } catch (err) {
        fanOutErrors[s] = err.message
      }
    })

    await Promise.all(promises)

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      mode: 'fan-out',
      results: fanOutResults,
      errors: Object.keys(fanOutErrors).length > 0 ? fanOutErrors : undefined,
    })
  }

  // Single sport pipeline
  const debugLogs = []
  const log = (msg) => {
    console.log(msg)
    debugLogs.push(msg)
  }

  const results = {}
  const errors = {}

  log(`\n=== Running pipeline for ${sport.toUpperCase()} ===`)
  try {
    const analysis = await runSportPipeline(sport, log)

    if (analysis && analysis.length > 0) {
      const supabase = getSupabase()
      const { error: dbError } = await supabase
        .from('analyses')
        .insert({
          sport,
          results: analysis,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        })

      if (dbError) {
        console.error(`Supabase insert error for ${sport}:`, dbError)
        errors[sport] = `DB error: ${dbError.message}`
      } else {
        results[sport] = `${analysis.length} analyses saved`
        log(`✅ ${sport}: ${analysis.length} analyses saved to Supabase`)
      }
    } else {
      results[sport] = 'No analyses generated'
      log(`⚠ ${sport}: No analyses generated`)
    }
  } catch (err) {
    log(`Pipeline error for ${sport}: ${err.message}`)
    errors[sport] = err.message
  }

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    results,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    debug: debugLogs
  })
}

async function runSportPipeline(sport, log) {
  // Step 1: Fetch odds
  log(`  [${sport}] Fetching odds...`)
  const odds = await getOdds(sport)
  
  if (!odds || !Array.isArray(odds) || odds.length === 0) {
    log(`  [${sport}] No active events found — skipping`)
    return []
  }
  log(`  [${sport}] Found ${odds.length} events`)

  // Step 2: Fetch player props for top 3 events (with delays)
  log(`  [${sport}] Fetching player props...`)
  const propsData = []
  const eventsForProps = odds.slice(0, 3)
  for (const event of eventsForProps) {
    await new Promise(resolve => setTimeout(resolve, 1200))
    try {
      const props = await getPlayerProps(sport, event.id)
      if (props && props.bookmakers && props.bookmakers.length > 0) {
        propsData.push(props)
      }
    } catch (e) {
      log(`  [${sport}] Props fetch failed for ${event.id}: ${e.message}`)
    }
  }
  log(`  [${sport}] Got props for ${propsData.length} events`)

  // Step 3: Scrape intel (graceful degradation)
  let intel = null
  try {
    log(`  [${sport}] Scraping intel...`)
    const [injuries, news] = await Promise.all([
      scrapeInjuryReport(sport).catch(() => null),
      scrapeNewsHeadlines(sport).catch(() => null),
    ])
    intel = { injuries, news }
    log(`  [${sport}] Intel gathered`)
  } catch (err) {
    log(`  [${sport}] Intel failed: ${err.message}`)
  }

  // Step 4: Normalize → Summarize → Per-game Claude analysis
  log(`  [${sport}] Running pipeline: normalize → summarize intel → parallel analysis...`)
  const analysis = await analyze(sport, odds, propsData, intel, 50)
  log(`  [${sport}] Pipeline returned ${Array.isArray(analysis) ? analysis.length : 0} analyses`)
  
  return analysis
}

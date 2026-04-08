import { getOdds, getPlayerProps, getRemainingRequests } from '../services/oddsService.js'
import { scrapeInjuryReport, scrapeNewsHeadlines } from '../services/firecrawlService.js'
import { analyze } from '../services/claudeService.js'

export async function runPipeline(sport, unitSize, sseWriter) {
  try {
    // Stage 1: SCRAPE — Fetch odds from The Odds API
    sseWriter.stage('scrape', 'started')
    sseWriter.log('Connecting to The Odds API...')
    
    const odds = await getOdds(sport)
    
    // Determine the number of unique bookmakers mathematically safely
    let bookCount = new Set()
    const activeEvents = []
    
    if (odds && Array.isArray(odds)) {
       odds.forEach(event => {
          activeEvents.push({ id: event.id, home_team: event.home_team, away_team: event.away_team })
          if (event.bookmakers) {
            event.bookmakers.forEach(b => bookCount.add(b.key))
          }
       })
    }
    
    sseWriter.log(`Found ${activeEvents.length} events across ${bookCount.size} books`)
    sseWriter.log(`Odds API requests remaining: ${getRemainingRequests()}`)
    
    // Fetch props for up to 3 events SEQUENTIALLY to avoid rate limiting
    const eventsToFetch = activeEvents.slice(0, 3)
    sseWriter.log(`Fetching player props for top ${eventsToFetch.length} of ${activeEvents.length} events...`)
    const propsData = []
    for (const event of eventsToFetch) {
      // Delay between requests to avoid 429
      await new Promise(resolve => setTimeout(resolve, 1200))
      try {
        const props = await getPlayerProps(sport, event.id)
        if (props && props.bookmakers && props.bookmakers.length > 0) {
          propsData.push(props)
        }
      } catch (e) {
        sseWriter.log(`⚠ Props fetch failed for ${event.home_team} vs ${event.away_team}: ${e.message}`)
      }
    }
    
    sseWriter.log(`Fetched player props for ${propsData.length} events. Requests remaining: ${getRemainingRequests()}`)
    sseWriter.stage('scrape', 'complete')

    // Stage 2: INTEL — Scrape injury reports & news via Firecrawl
    sseWriter.stage('intel', 'started')
    let intel = null
    try {
      sseWriter.log('Scraping injury reports via Firecrawl...')
      const injuries = await scrapeInjuryReport(sport)
      
      sseWriter.log('Scraping latest headlines via Firecrawl...')
      const news = await scrapeNewsHeadlines(sport)
      
      intel = { injuries, news }
      sseWriter.log('Intel gathered successfully.')
    } catch (err) {
      // Degrade gracefully if Firecrawl fails or runs out of credits
      sseWriter.log(`⚠ Intel scraping failed (${err.message}) — proceeding with odds-only analysis`)
      intel = null
    }
    sseWriter.stage('intel', 'complete')

    // Stage 3: ANALYZE — Normalize data, summarize intel, send to Claude per-game
    sseWriter.stage('analyze', 'started')
    sseWriter.log('Normalizing odds data (consensus lines, implied probabilities)...')
    sseWriter.log('Summarizing intel via Haiku into structured JSON...')
    const analyzeCount = Math.min(activeEvents.length, 6)
    sseWriter.log(`Analyzing ${analyzeCount} games in parallel...`)
    
    let results
    try {
      results = await analyze(sport, odds, propsData, intel, unitSize)
    } catch (claudeErr) {
      sseWriter.log(`⚠ Claude failed: ${claudeErr.message}`)
      sseWriter.error(`Claude analysis failed: ${claudeErr.message}`)
      return
    }
    
    if (!results || results.length === 0) {
      sseWriter.log('⚠ Claude returned no analyses')
      sseWriter.error('Analysis returned empty results. Try again.')
      return
    }

    sseWriter.log(`Analysis complete — ${results.filter(r => r.rating === 'BUY').length} BUY signals found`)
    sseWriter.stage('analyze', 'complete')

    // Final: Send results to the frontend
    sseWriter.result(results)

  } catch (error) {
    console.error('Pipeline error:', error)
    sseWriter.error(error.message || 'Pipeline failed')
  }
}

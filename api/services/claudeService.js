import Anthropic from '@anthropic-ai/sdk'

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 2000

const SYSTEM_PROMPT = `You are LINE SHARK — an elite sports betting analyst AI. You are NOT a gambling advisor. You are a quantitative edge-finder that evaluates betting markets for mathematical value.

## Your Mission
Analyze the normalized odds data and structured intelligence for a SINGLE game to identify MISPRICED LINES. Return structured BUY/BYE signals with precise reasoning.

## Analysis Framework (In Order of Importance)

### 1. LINE VALUE DETECTION
- Compare odds across books to find the BEST available number
- Identify lines that have moved significantly (sharp money indicators)
- Calculate implied probability vs. your estimated true probability
- A "BUY" requires at minimum a 1.5% estimated edge

### 2. SITUATIONAL FACTORS (Weight: High)
- Injuries: WHO is out matters more than how many are out
- Rest/travel: Back-to-backs, cross-country flights, timezone changes
- Motivation: Playoff positioning, rivalry games
- Weather: For outdoor sports — wind, temperature, precipitation

### 3. STATISTICAL CONTEXT
- Recent form (last 5-10 games), not season-long averages
- Head-to-head history in the CURRENT venue
- Splits: home/away, day/night, vs division, as favorite/underdog
- Pace/tempo matchup implications for totals

### 4. MARKET SIGNALS
- Line movement direction and velocity
- Reverse line movement

## Rating System

**BUY** — Place a bet. You've identified real edge (≥1.5% estimated).
- Confidence 6: 1 unit (lean play, narrow edge)
- Confidence 7: 1 unit (standard play, solid reasoning)
- Confidence 8: 2 units (strong play, multiple factors align)
- Confidence 9: 3 units (premium play, significant mispricing)
- Confidence 10: 5 units (mortgage play — historically rare)

**BYE** — Do NOT bet. No edge found, or edge is too thin.
- Confidence 1-3: Strong bye — line is accurate or you're on the WRONG side
- Confidence 4-5: Lean bye — edge is marginal (<1.5%)

## CRITICAL RULES
1. You MUST find BYE plays. Not everything is a bet. A 40-60% BYE rate is HEALTHY.
2. Confidence 10 should appear at most ONCE per slate.
3. Always state WHICH BOOK has the best number. Line shopping is free edge.
4. Edge percentage = (your estimated true probability) - (implied probability from odds). Round to 1 decimal place.
5. For player props: recent usage/volume matters more than season averages.
6. For totals: pace, defensive efficiency, and weather are the three pillars.
7. Always explain your reasoning as if talking to a sharp bettor, not a casual fan.
8. Be CONCISE in reasoning — 2-3 sentences max per analysis.

## Output Format
Analyze the provided normalized game data and use the submit_analysis tool to output your structured betting signals. You may output multiple analyses per game (spread, total, moneyline, player props).
`

const ANALYSIS_TOOL = {
  name: 'submit_analysis',
  description: 'Submit the final structured bet analysis for this game.',
  input_schema: {
    type: 'object',
    properties: {
      analyses: {
        type: 'array',
        description: 'Bet analyses for this game (can be multiple: spread, total, player prop, etc.)',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique identifier e.g. nba-lal-bos-spread' },
            matchup: { type: 'string', description: 'e.g. Lakers vs Celtics' },
            homeTeam: { type: 'string' },
            awayTeam: { type: 'string' },
            time: { type: 'string', description: 'Start time of the event' },
            marketType: { type: 'string', enum: ['spread', 'moneyline', 'total', 'player_prop', 'first_half', 'team_total', 'alt_line'] },
            specificBet: { type: 'string', description: 'e.g. Lakers -3.5 or LeBron Over 28.5 Points' },
            odds: { type: 'string', description: 'e.g. -110' },
            bestBook: { type: 'string', description: 'Name of the book with these odds' },
            bookComparison: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  book: { type: 'string' },
                  line: { type: 'string' },
                  odds: { type: 'string' }
                },
                required: ['book', 'line', 'odds']
              }
            },
            rating: { type: 'string', enum: ['BUY', 'BYE'] },
            confidence: { type: 'number', description: '1-10 integer' },
            units: { type: 'number', description: 'Calculated units based on confidence' },
            edgePercent: { type: 'number' },
            keyFactors: { type: 'array', items: { type: 'string' } },
            riskFactors: { type: 'array', items: { type: 'string' } },
            reasoning: { type: 'string' },
            recentForm: { type: 'array', items: { type: 'string', enum: ['W', 'L', 'D'] } }
          },
          required: ['id', 'matchup', 'homeTeam', 'awayTeam', 'time', 'marketType', 'specificBet', 'odds', 'bestBook', 'rating', 'confidence', 'units', 'edgePercent', 'reasoning']
        }
      }
    },
    required: ['analyses']
  }
}

// ─── DATA NORMALIZATION ──────────────────────────────────────────────

/**
 * Convert American odds to implied probability percentage.
 * e.g. -110 → 52.4%, +150 → 40.0%
 */
function americanToImpliedProbability(odds) {
  const n = Number(odds)
  if (isNaN(n)) return null
  if (n < 0) return Math.round((-n / (-n + 100)) * 1000) / 10
  return Math.round((100 / (n + 100)) * 1000) / 10
}

/**
 * Normalize raw odds API data for a single event.
 * Extracts consensus line, best available odds, and implied probability per market.
 */
function normalizeEvent(event) {
  const bookmakers = event.bookmakers || []
  const normalized = {
    id: event.id,
    home_team: event.home_team,
    away_team: event.away_team,
    commence_time: event.commence_time,
    markets: {}
  }

  const marketData = {} // { h2h: [{book, home_odds, away_odds}], spreads: [...], totals: [...] }

  for (const bk of bookmakers) {
    for (const market of (bk.markets || [])) {
      if (!marketData[market.key]) marketData[market.key] = []
      const entry = { book: bk.title }
      for (const outcome of (market.outcomes || [])) {
        if (market.key === 'h2h') {
          if (outcome.name === event.home_team) {
            entry.home_odds = outcome.price
          } else if (outcome.name === event.away_team) {
            entry.away_odds = outcome.price
          } else {
            entry.draw_odds = outcome.price
          }
        } else if (market.key === 'spreads') {
          if (outcome.name === event.home_team) {
            entry.home_spread = outcome.point
            entry.home_odds = outcome.price
          } else {
            entry.away_spread = outcome.point
            entry.away_odds = outcome.price
          }
        } else if (market.key === 'totals') {
          if (outcome.name === 'Over') {
            entry.total = outcome.point
            entry.over_odds = outcome.price
          } else {
            entry.under_odds = outcome.price
          }
        }
      }
      marketData[market.key].push(entry)
    }
  }

  // Compute consensus and best available for each market
  if (marketData.h2h && marketData.h2h.length > 0) {
    const entries = marketData.h2h.filter(e => e.home_odds != null)
    const bestHome = entries.reduce((best, e) => (e.home_odds > (best?.home_odds ?? -Infinity)) ? e : best, null)
    const bestAway = entries.reduce((best, e) => (e.away_odds > (best?.away_odds ?? -Infinity)) ? e : best, null)
    const avgHomeOdds = Math.round(entries.reduce((s, e) => s + e.home_odds, 0) / entries.length)
    const avgAwayOdds = Math.round(entries.reduce((s, e) => s + e.away_odds, 0) / entries.length)
    normalized.markets.moneyline = {
      consensus: { home: avgHomeOdds, away: avgAwayOdds },
      bestHome: bestHome ? { odds: bestHome.home_odds, book: bestHome.book } : null,
      bestAway: bestAway ? { odds: bestAway.away_odds, book: bestAway.book } : null,
      impliedProb: { home: americanToImpliedProbability(avgHomeOdds), away: americanToImpliedProbability(avgAwayOdds) },
      books: entries.slice(0, 4).map(e => ({ book: e.book, home: e.home_odds, away: e.away_odds }))
    }
  }

  if (marketData.spreads && marketData.spreads.length > 0) {
    const entries = marketData.spreads.filter(e => e.home_spread != null)
    const consensusSpread = Math.round(entries.reduce((s, e) => s + e.home_spread, 0) / entries.length * 10) / 10
    const bestHome = entries.reduce((best, e) => (e.home_odds > (best?.home_odds ?? -Infinity)) ? e : best, null)
    const bestAway = entries.reduce((best, e) => (e.away_odds > (best?.away_odds ?? -Infinity)) ? e : best, null)
    normalized.markets.spread = {
      consensus: consensusSpread,
      bestHome: bestHome ? { spread: bestHome.home_spread, odds: bestHome.home_odds, book: bestHome.book } : null,
      bestAway: bestAway ? { spread: bestAway.away_spread, odds: bestAway.away_odds, book: bestAway.book } : null,
      impliedProb: { home: americanToImpliedProbability(bestHome?.home_odds), away: americanToImpliedProbability(bestAway?.away_odds) },
      books: entries.slice(0, 4).map(e => ({ book: e.book, homeSpread: e.home_spread, homeOdds: e.home_odds, awaySpread: e.away_spread, awayOdds: e.away_odds }))
    }
  }

  if (marketData.totals && marketData.totals.length > 0) {
    const entries = marketData.totals.filter(e => e.total != null)
    const consensusTotal = Math.round(entries.reduce((s, e) => s + e.total, 0) / entries.length * 10) / 10
    const bestOver = entries.reduce((best, e) => (e.over_odds > (best?.over_odds ?? -Infinity)) ? e : best, null)
    const bestUnder = entries.reduce((best, e) => (e.under_odds > (best?.under_odds ?? -Infinity)) ? e : best, null)
    normalized.markets.total = {
      consensus: consensusTotal,
      bestOver: bestOver ? { odds: bestOver.over_odds, book: bestOver.book } : null,
      bestUnder: bestUnder ? { odds: bestUnder.under_odds, book: bestUnder.book } : null,
      impliedProb: { over: americanToImpliedProbability(bestOver?.over_odds), under: americanToImpliedProbability(bestUnder?.under_odds) },
      books: entries.slice(0, 4).map(e => ({ book: e.book, total: e.total, over: e.over_odds, under: e.under_odds }))
    }
  }

  return normalized
}

/**
 * Normalize player props for an event — keep only essential data.
 */
function normalizeProps(propsEvent) {
  if (!propsEvent || !propsEvent.bookmakers) return null
  const markets = []
  for (const bk of propsEvent.bookmakers.slice(0, 1)) {
    for (const market of (bk.markets || []).slice(0, 5)) {
      markets.push({
        market: market.key,
        book: bk.title,
        lines: (market.outcomes || []).slice(0, 4).map(o => ({
          player: o.description || o.name,
          type: o.name, // Over/Under
          line: o.point,
          odds: o.price
        }))
      })
    }
  }
  return markets.length > 0 ? markets : null
}

// ─── INTEL SUMMARIZATION ────────────────────────────────────────────

/**
 * Use Haiku to summarize raw Firecrawl markdown into structured JSON.
 * This dramatically reduces token count and improves analysis quality.
 */
async function summarizeIntel(sport, intelData, anthropic) {
  if (!intelData || (!intelData.injuries && !intelData.news)) return null

  const rawText = [
    intelData.injuries ? `INJURY REPORT:\n${intelData.injuries.slice(0, 3000)}` : '',
    intelData.news ? `NEWS HEADLINES:\n${intelData.news.slice(0, 2000)}` : ''
  ].filter(Boolean).join('\n\n')

  if (!rawText) return null

  try {
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      system: `You are a sports data preprocessor. Extract ONLY betting-relevant information from the raw text. Output strict JSON matching the schema. Be concise — only include info that would affect betting lines.`,
      messages: [{
        role: 'user',
        content: `Extract structured intelligence for ${sport.toUpperCase()} betting from this raw data:\n\n${rawText}\n\nReturn JSON with this exact schema:\n{\n  "key_injuries": [{"player": "Name", "team": "Team", "status": "Out/Doubtful/Questionable", "impact": "star/starter/rotation"}],\n  "news_factors": ["One-line summary of each betting-relevant headline"],\n  "weather_impact": "none" or brief description\n}`
      }]
    })

    const text = response.content.find(b => b.type === 'text')?.text || ''
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return null
  } catch (err) {
    console.warn('Intel summarization failed, using raw truncation:', err.message)
    // Fallback: return truncated raw text
    return {
      key_injuries: [],
      news_factors: [],
      raw_injuries: intelData.injuries ? intelData.injuries.slice(0, 1000) : null,
      raw_news: intelData.news ? intelData.news.slice(0, 800) : null,
      weather_impact: 'unknown'
    }
  }
}

// ─── RETRY WRAPPER ──────────────────────────────────────────────────

async function withRetry(fn, retries = MAX_RETRIES) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt)
        console.warn(`Attempt ${attempt + 1} failed: ${err.message}. Retrying in ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastError
}

// ─── PER-GAME ANALYSIS ──────────────────────────────────────────────

/**
 * Analyze a single game with normalized data.
 */
async function analyzeGame(sport, normalizedEvent, props, intel, anthropic) {
  const payload = {
    sport: sport.toUpperCase(),
    game: normalizedEvent,
    playerProps: props,
    intel: intel
  }

  const payloadText = JSON.stringify(payload)
  const matchup = `${normalizedEvent.away_team} @ ${normalizedEvent.home_team}`
  console.log(`  Analyzing ${matchup} (~${Math.round(payloadText.length / 4)} tokens)`)

  return withRetry(async () => {
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Analyze this ${sport.toUpperCase()} game:\n\n${payloadText}\n\nUse the submit_analysis tool. Output at least one analysis (spread, moneyline, or total). Include player props if data is available.`
      }],
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: 'tool', name: 'submit_analysis' }
    })

    const toolBlock = response.content.find(b => b.type === 'tool_use' && b.name === 'submit_analysis')
    if (toolBlock?.input?.analyses) {
      return toolBlock.input.analyses
    }
    console.warn(`No analyses returned for ${matchup}`)
    return []
  })
}

// ─── MAIN EXPORT ────────────────────────────────────────────────────

export async function analyze(sport, oddsData, propsData, intelData, unitSize) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not defined')

  const anthropic = new Anthropic({ apiKey })

  // Step 1: Normalize odds data
  const events = (oddsData || []).slice(0, 6)
  const normalizedEvents = events.map(normalizeEvent)
  console.log(`Normalized ${normalizedEvents.length} events for ${sport}`)

  // Step 2: Normalize props and index by event ID
  const propsMap = {}
  for (const p of (propsData || [])) {
    propsMap[p.id] = normalizeProps(p)
  }

  // Step 3: Summarize intel via Haiku (structured JSON instead of raw markdown)
  console.log(`Summarizing intel for ${sport}...`)
  const structuredIntel = await summarizeIntel(sport, intelData, anthropic)
  if (structuredIntel) {
    const injuryCount = structuredIntel.key_injuries?.length || 0
    const newsCount = structuredIntel.news_factors?.length || 0
    console.log(`Intel summarized: ${injuryCount} injuries, ${newsCount} news factors`)
  }

  // Step 4: Analyze each game in parallel
  console.log(`Running parallel analysis for ${normalizedEvents.length} games...`)
  const analysisPromises = normalizedEvents.map(event =>
    analyzeGame(sport, event, propsMap[event.id] || null, structuredIntel, anthropic)
      .catch(err => {
        console.error(`Analysis failed for ${event.away_team} @ ${event.home_team}: ${err.message}`)
        return [] // Graceful degradation per game
      })
  )

  const results = await Promise.all(analysisPromises)
  return results.flat()
}

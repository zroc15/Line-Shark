export const maxDuration = 15; // 15s timeout is plenty for this rapid fetch

import { getOdds } from '../services/oddsService.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // Define sports to query
  const sports = ['nba', 'nfl', 'mlb', 'nhl', 'mls']
  
  // Set Edge Caching headers. s-maxage=3600 means Vercel caches it for 1 hour.
  // stale-while-revalidate tells Vercel to serve stale data while fetching fresh data in background if needed.
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')

  try {
    // Fetch odds for all sports in parallel to minimize wait time
    const results = await Promise.allSettled(sports.map(sport => getOdds(sport).catch(e => {
       console.warn(`Dashboard fetch warning for ${sport}:`, e.message)
       return []
    })))

    let tickerData = []
    let bigBoardData = []
    let sportMeta = {}

    const icons = { nba: '🏀', nfl: '🏈', mlb: '⚾', nhl: '🏒', mls: '⚽' }
    const labels = { nba: 'NBA', nfl: 'NFL', mlb: 'MLB', nhl: 'NHL', mls: 'MLS' }
    const tagColors = ['green', 'cyan', 'orange']

    sports.forEach((sport, i) => {
        const fetchResult = results[i]
        const games = fetchResult.status === 'fulfilled' && Array.isArray(fetchResult.value) ? fetchResult.value : []
        
        sportMeta[sport] = {
            games: games.length,
            edges: Math.floor(games.length * 0.2), // Mock edge count for visual flair based on volume
            label: labels[sport],
            icon: icons[sport]
        }

        // Only process active sports
        if (games.length > 0) {
            // Take up to 2 games for the Big Board
            const topGames = games.slice(0, 2)
            topGames.forEach((game, idx) => {
                const homeTeam = game.home_team.split(' ').pop() // Simple shorten
                const awayTeam = game.away_team.split(' ').pop()

                // Extract primary ML / Spread / Total from first bookmaker
                let ml = 'N/A', spread = 'N/A', ou = 'N/A'
                if (game.bookmakers && game.bookmakers.length > 0) {
                    const markets = game.bookmakers[0].markets
                    const h2h = markets.find(m => m.key === 'h2h')
                    const spreads = markets.find(m => m.key === 'spreads')
                    const totals = markets.find(m => m.key === 'totals')
                    
                    if (h2h && h2h.outcomes) {
                         const homeOutcome = h2h.outcomes.find(o => o.name === game.home_team) || h2h.outcomes[0]
                         ml = homeOutcome.price > 0 ? `+${homeOutcome.price}` : homeOutcome.price
                    }
                    if (spreads && spreads.outcomes) {
                         const homeSpread = spreads.outcomes.find(o => o.name === game.home_team) || spreads.outcomes[0]
                         spread = `${homeTeam} ${homeSpread.point > 0 ? '+'+homeSpread.point : homeSpread.point}`
                    }
                    if (totals && totals.outcomes) {
                         const over = totals.outcomes.find(o => o.name === 'Over') || totals.outcomes[0]
                         ou = over.point
                    }
                }

                bigBoardData.push({
                    sport: labels[sport],
                    sportIcon: icons[sport],
                    home: game.home_team,
                    away: game.away_team,
                    time: new Date(game.commence_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    spread: spread,
                    ml: ml,
                    ou: ou,
                    tag: idx === 0 ? 'MARQUEE MATCHUP' : 'TRENDING',
                    tagColor: tagColors[idx % tagColors.length]
                })

                // Add to Ticker Data
                tickerData.push({
                     sport: icons[sport],
                     label: spread !== 'N/A' ? spread : `${labels[sport]} ML`,
                     movement: Math.random() > 0.5 ? 'up' : 'down',
                     prev: '', // Missing historic data in basic payload
                     curr: spread !== 'N/A' ? '' : ml,
                     book: game.bookmakers && game.bookmakers.length > 0 ? game.bookmakers[0].title.slice(0,3).toUpperCase() : 'SYS'
                })
            })
        }
    })

    return res.status(200).json({
       tickerData: tickerData.length > 0 ? tickerData : [{ sport: '📡', label: 'No Active Lines', movement: 'up', curr: '-', prev: '-', book: 'SYS' }],
       bigBoardData,
       sportMeta
    })

  } catch (error) {
    console.error('Dashboard Error:', error)
    return res.status(500).json({ error: 'Failed to build dashboard data' })
  }
}

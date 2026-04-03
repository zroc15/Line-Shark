const ODDS_API_KEY = process.env.ODDS_API_KEY
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'

const SPORT_MAP = {
  nba: 'basketball_nba',
  nfl: 'americanfootball_nfl',
  mlb: 'baseball_mlb',
  nhl: 'icehockey_nhl',
  mls: 'soccer_usa_mls',
}

let remainingRequests = 'Unknown'

export async function getOdds(sport) {
  const sportKey = SPORT_MAP[sport]
  if (!sportKey) throw new Error(`Unsupported sport: ${sport}`)
  if (!ODDS_API_KEY) throw new Error('ODDS_API_KEY is not defined')

  const url = new URL(`${ODDS_API_BASE}/sports/${sportKey}/odds`)
  url.searchParams.append('apiKey', ODDS_API_KEY)
  url.searchParams.append('regions', 'us')
  url.searchParams.append('markets', 'h2h,spreads,totals')
  url.searchParams.append('oddsFormat', 'american')

  try {
    const response = await fetch(url.toString())
    
    // Track remaining requests from headers
    remainingRequests = response.headers.get('x-requests-remaining') || remainingRequests

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(`Odds API error: ${response.status} - ${JSON.stringify(errData)}`)
    }

    return await response.json()
  } catch (error) {
    console.error('getOdds Error:', error)
    throw error
  }
}

export async function getPlayerProps(sport, eventId) {
    const sportKey = SPORT_MAP[sport]
    if (!sportKey) throw new Error(`Unsupported sport: ${sport}`)
    if (!ODDS_API_KEY) throw new Error('ODDS_API_KEY is not defined')
  
    // Fetch a few key player props. This is a generic list, might need refinement per sport
    const markets = sport === 'nba' ? 'player_points,player_rebounds,player_assists' : 
                    sport === 'nfl' ? 'player_pass_yds,player_rush_yds,player_receive_yds' :
                    sport === 'mlb' ? 'player_strikeouts,player_home_runs' :
                    sport === 'nhl' ? 'player_points,player_shots_on_goal' : ''

    if (!markets) return [] // No props supported for this sport yet

    const url = new URL(`${ODDS_API_BASE}/sports/${sportKey}/events/${eventId}/odds`)
    url.searchParams.append('apiKey', ODDS_API_KEY)
    url.searchParams.append('regions', 'us')
    url.searchParams.append('markets', markets)
    url.searchParams.append('oddsFormat', 'american')
  
    try {
      const response = await fetch(url.toString())
      remainingRequests = response.headers.get('x-requests-remaining') || remainingRequests
  
      if (!response.ok) {
          console.warn(`Props fetch failed for event ${eventId}: ${response.status}`)
          return []
      }
      return await response.json()
    } catch (error) {
      console.error(`getPlayerProps Error for ${eventId}:`, error)
      return [] // Graceful degradation
    }
}

export function getRemainingRequests() {
  return remainingRequests
}

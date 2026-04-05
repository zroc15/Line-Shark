import { config } from 'dotenv'
config({ path: './server/.env' }) // Load env vars

// Monkeypatch next/vercel context so we can run file directly
import { getOdds } from './api/services/oddsService.js'
import { analyze } from './api/services/claudeService.js'

async function test() {
  console.log('Testing odds fetch...')
  const odds = await getOdds('nba')
  console.log(`Events found: ${odds ? odds.length : 0}`)
  
  if (odds && odds.length > 0) {
    console.log('Sample event:', odds[0].home_team, 'vs', odds[0].away_team)
    console.log('Testing Claude analysis on 2 events...')
    try {
      const results = await analyze('nba', odds.slice(0, 2), [], null, 50)
      console.log(`Analyzed ${results.length} results`)
      if (results.length === 0) {
        console.warn('Claude returned empty array. This happens if it did not use the tool.')
      }
    } catch (err) {
      console.error('Claude error:', err)
    }
  }
}

test()

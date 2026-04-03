import fetch from 'node-fetch'

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
const FIRECRAWL_API_BASE = 'https://api.firecrawl.dev/v1'

const URL_MAP = {
  nba: {
      injuries: 'https://www.espn.com/nba/injuries',
      news: 'https://www.espn.com/nba/news'
  },
  nfl: {
      injuries: 'https://www.espn.com/nfl/injuries',
      news: 'https://www.espn.com/nfl/news'
  },
  mlb: {
      injuries: 'https://www.espn.com/mlb/injuries',
      news: 'https://www.espn.com/mlb/news'
  },
  nhl: {
      injuries: 'https://www.espn.com/nhl/injuries',
      news: 'https://www.espn.com/nhl/news'
  },
  mls: {
      injuries: 'https://www.espn.com/soccer/injuries',
      news: 'https://www.espn.com/soccer/news'
  }
}

async function scrapeUrl(url) {
    if (!FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY is not defined')

    try {
        const response = await fetch(`${FIRECRAWL_API_BASE}/scrape`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                formats: ['markdown'],
                onlyMainContent: true
            })
        })

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            throw new Error(`Firecrawl error: ${response.status} - ${JSON.stringify(errData)}`)
        }

        const data = await response.json()
        if (data.success && data.data && data.data.markdown) {
            return data.data.markdown
        } else {
            console.warn('Firecrawl scrape returned unexpected format', data)
            return null
        }
    } catch (err) {
        console.error(`scrapeUrl error for ${url}:`, err)
        throw err
    }
}

export async function scrapeInjuryReport(sport) {
    const urls = URL_MAP[sport]
    if (!urls) return null
    return scrapeUrl(urls.injuries)
}

export async function scrapeNewsHeadlines(sport) {
    const urls = URL_MAP[sport]
    if (!urls) return null
    return scrapeUrl(urls.news)
}

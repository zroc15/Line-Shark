Line Shark is an AI-powered sports betting intelligence tool. You feed it a sport, it goes out and scrapes live odds from sportsbooks, pulls in news/injuries/social sentiment, layers on historical trends, and spits back a BUY or BYE rating on each game with a recommended bet size and reasoning.

The core data pipeline has four stages:
Stage 1 — Scrape live odds. Use the Firecrawl API (POST https://api.firecrawl.dev/v1/scrape) to crawl sportsbook odds pages like ESPN, Fanduel or Draftkings. You pass it a URL, it returns clean markdown of the page content. That gives you spreads, moneylines, over/unders across multiple books. You could also hit the Odds API (the-odds-api.com) for structured JSON odds data across 40+ sportsbooks — that's cleaner than scraping if you want reliable structured data.
Stage 2 — Gather intel. Use the X api to scrape X/Twitter for team mentions, player news, and public sentiment. You could also scrape beat reporter accounts, injury report pages, or team subreddits. 
Stage 3 — Historical context. This is where it gets interesting. You want data like "this team is 14-2 at home in April" or "this pitcher has a 1.8 ERA against left-heavy lineups." For this, you'd pull from sports stats APIs — sportsdata.io, balldontlie.io (free for NBA), mysportsfeeds.com, or ESPN's unofficial endpoints. Store historical game results in your own database so you can query trends without hitting APIs every time.
Stage 4 — AI synthesis. Send all the gathered data (odds, news, sentiment, historical stats) into the Anthropic API (POST https://api.anthropic.com/v1/messages using claude-sonnet-4-20250514). Your prompt tells Claude to act as a sharp sports analyst — evaluate edge, assess value relative to the line, and return structured JSON with: BUY/BYE rating, confidence score (1-10), recommended bet type (spread/moneyline/over-under), which side to take, bet size based on Kelly Criterion scaled to the user's bankroll, estimated payout, key factors driving the pick, and risk factors.
The tech stack I'd go with: React frontend, Node or Python backend (you need a backend because Firecrawl API keys shouldn't live in the browser). Postgres or SQLite for caching historical data and storing past analyses. Redis or a simple queue if you want to run analyses on a schedule.
APIs you need:

Firecrawl (api.firecrawl.dev) — web scraping for odds pages, Twitter, news sites
Anthropic (api.anthropic.com) — the AI brain, plus its web search tool for real-time intel gathering
The Odds API (the-odds-api.com) — structured odds data from 40+ books, has a free tier
Sports data — pick based on sport: balldontlie.io (NBA, free), sportsdata.io (multi-sport, paid), or api-football.com for soccer
Twitter/X API — if you want direct access instead of scraping through Firecrawl

Monetization angle: charge $29/month for daily analysis across all sports. Free tier gets one sport with delayed analysis. Premium gets real-time alerts, custom bankroll management, and bet tracking with ROI dashboards.
The key insight that makes this more than just "ChatGPT with odds" is the Firecrawl layer. You're pulling live, real-time data from actual sportsbook pages — not just asking an AI to guess. The AI is synthesizing real numbers with real news, not hallucinating lines.
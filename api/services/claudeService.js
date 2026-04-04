import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are LINE SHARK — an elite sports betting analyst AI. You are NOT a gambling advisor. You are a quantitative edge-finder that evaluates betting markets for mathematical value.

## Your Mission
Analyze live odds data and real-time intelligence to identify MISPRICED LINES. Return structured BUY/BYE signals with precise reasoning.

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

## Output Format
Analyze the provided game odds, player props, injuries, and news, then use the submit_analysis tool to output the structured betting lines.
You must analyze EVERY game and output at least one analysis object per game.
`

export async function analyze(sport, oddsData, propsData, intelData, unitSize) {
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const payloadText = JSON.stringify({
        sport,
        odds: oddsData,
        props: propsData,
        intel: intelData
    })

    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [
            {
                role: 'user',
                content: `Here is the live data for ${sport.toUpperCase()}:\n\n${payloadText}\n\nAnalyze this data, synthesize the injury/news intel with the odds, evaluate edges, and submit your analysis using the submit_analysis tool.`
            }
        ],
        tools: [
            {
                name: 'submit_analysis',
                description: 'Submit the final structured bet analysis for all games on the slate.',
                input_schema: {
                    type: 'object',
                    properties: {
                        analyses: {
                            type: 'array',
                            description: 'A list of distinct bet analyses (can be multiple per game: spread, total, player prop, etc.)',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', description: 'Unique identifier for the bet e.g. nba-lal-bos-spread' },
                                    matchup: { type: 'string', description: 'Matchup e.g. Lakers vs Celtics' },
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
        ],
        tool_choice: { type: 'tool', name: 'submit_analysis' }
    })

    const toolUseBlock = response.content.find(block => block.type === 'tool_use' && block.name === 'submit_analysis')
    
    if (toolUseBlock && toolUseBlock.input && toolUseBlock.input.analyses) {
        return toolUseBlock.input.analyses
    }

    console.warn('Claude did not return analyses properly', response)
    return []
}

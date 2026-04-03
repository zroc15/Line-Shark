import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import analysisRoutes from './routes/analysis.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Routes
app.use('/api', analysisRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.ODDS_API_KEY ? 'live' : 'mock',
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`\n  🦈 Line Shark server running on http://localhost:${PORT}`)
  console.log(`  Mode: ${process.env.ODDS_API_KEY ? '🟢 LIVE' : '🟡 MOCK'}`)
  console.log('')
})

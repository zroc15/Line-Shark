import { Router } from 'express'

const router = Router()

// POST /api/analyze — run analysis (mock mode for now)
router.post('/analyze', async (req, res) => {
  const { sport, unitSize } = req.body

  if (!sport) {
    return res.status(400).json({ error: 'Sport is required' })
  }

  // For now, return a simple acknowledgment
  // Real pipeline will be implemented when API keys are provided
  res.json({
    status: 'ok',
    sport,
    unitSize,
    mode: 'mock',
    message: 'Mock mode — analysis handled client-side',
  })
})

// GET /api/analyze/stream — SSE endpoint for real-time pipeline progress
router.get('/analyze/stream', (req, res) => {
  const { sport, unitSize } = req.query

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  // Placeholder for SSE streaming
  // Will implement full pipeline when API keys are ready
  res.write(`event: log\ndata: ${JSON.stringify({ message: 'Pipeline ready — waiting for API keys' })}\n\n`)

  req.on('close', () => {
    res.end()
  })
})

export default router

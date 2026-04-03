export const maxDuration = 60; // Extend Vercel timeout to 60 seconds

import { runPipeline } from '../../pipeline/pipeline.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sport, unitSize } = req.query;

  // Set standard Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  });

  // Helper object to send SSE events cleanly
  const sseWriter = {
      stage: (stageName, status) => res.write(`event: stage\ndata: ${JSON.stringify({ stage: stageName, status })}\n\n`),
      log: (message) => res.write(`event: log\ndata: ${JSON.stringify({ message })}\n\n`),
      result: (results) => {
          res.write(`event: result\ndata: ${JSON.stringify(results)}\n\n`);
          res.end();
      },
      error: (message) => {
          res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
          res.end();
      }
  };

  // Handle client disconnect gracefully
  req.on('close', () => {
    res.end();
  });

  // Start the pipeline and wait for it to finish streaming
  await runPipeline(sport, Number(unitSize) || 50, sseWriter);
}

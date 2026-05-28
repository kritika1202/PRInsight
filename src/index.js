require('dotenv').config();
const path = require('path');
const express = require('express');
const { handleWebhook } = require('./webhook');
const analyzeRouter = require('./routes/analyze');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow requests from the frontend origin (Vercel in prod, Vite dev server locally)
app.use((req, res, next) => {
  const allowed = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'PRInsight', version: '1.0.0' });
});

app.post('/webhook', handleWebhook);
app.use('/api', analyzeRouter);

// Serve built React client only when client/dist exists (self-hosted / local prod)
// On Render, the frontend is served by Vercel so this is skipped
const fs = require('fs');
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[PRInsight] Server running on port ${PORT}`);
});

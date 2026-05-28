require('dotenv').config();
const path = require('path');
const express = require('express');
const { handleWebhook } = require('./webhook');
const analyzeRouter = require('./routes/analyze');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

// Serve built React client in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'PRInsight', version: '1.0.0' });
});

app.post('/webhook', handleWebhook);
app.use('/api', analyzeRouter);

// Fallback: serve React app for any non-API route
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[PRInsight] Server running on port ${PORT}`);
});

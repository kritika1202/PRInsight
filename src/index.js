require('dotenv').config();
const express = require('express');
const { handleWebhook } = require('./webhook');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`[PRInsight] Server running on port ${PORT}`);
});

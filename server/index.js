// server/index.js — Express API server

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

import { runTagging, getCached, clearCache } from './groq.js';
import { appendLog, readAllLogs, computeAggregates } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Rate limit tagging endpoint: 10 requests per IP per hour
const tagLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limit', message: 'Too many tagging requests. Try again in a few seconds.', retryAfter: 60 },
});

// ── Tagging ───────────────────────────────────────────────────────────────────
app.post('/api/tag', tagLimiter, async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'config', message: 'GROQ_API_KEY is not set on the server.' });
  }
  try {
    const result = await runTagging();
    appendLog({
      mode: 'tagging',
      sessionId: req.body?.sessionId || null,
      accuracy: result.accuracy,
    });
    res.json(result);
  } catch (err) {
    if (err.message === 'rate_limit') {
      return res.status(429).json({
        error: 'rate_limit',
        message: `Groq rate limit hit. Try again in ${err.retryAfter} seconds.`,
        retryAfter: err.retryAfter,
      });
    }
    console.error('[/api/tag]', err);
    res.status(500).json({ error: 'tagging_failed', message: err.message });
  }
});

app.get('/api/tags', (req, res) => {
  const cached = getCached();
  if (!cached) return res.json({ cached: false, tags: null });
  res.json(cached);
});

app.post('/api/tag/clear', (req, res) => {
  clearCache();
  res.json({ ok: true });
});

// ── Logging ───────────────────────────────────────────────────────────────────
app.post('/api/log', (req, res) => {
  try {
    appendLog(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error('[/api/log]', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/feedback', (req, res) => {
  try {
    appendLog({ ...req.body, mode: 'feedback' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin ─────────────────────────────────────────────────────────────────────
function basicAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  if (!authHeader.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const b64 = authHeader.slice(6);
  const decoded = Buffer.from(b64, 'base64').toString('utf8');
  const [, pass] = decoded.split(':');
  const expected = process.env.ADMIN_PASSWORD || 'admin';
  if (pass !== expected) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/admin/logs', basicAuth, (req, res) => {
  const logs = readAllLogs();
  const aggregates = computeAggregates(logs);
  res.json({ logs, aggregates, total: logs.length });
});

// ── Serve React build in production ─────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '..', 'dist');
  app.use(express.static(dist));
  // /admin route handled by React Router; all other non-api routes → index.html
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[server] Listening on port ${PORT}`);
});

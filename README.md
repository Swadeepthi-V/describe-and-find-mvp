# Describe & Find · AI Workflow

A prototype demonstrating how AI auto-tagging can solve a real failure mode in Google Photos — the **clue interpretation gap**: users remember photos as a combination of cues (how it looked, who was there, roughly when) but search engines match only one literal keyword at a time.

## What It Does

The app runs a 3-stage workflow on a synthetic 43-photo library:

| Stage | Description |
|---|---|
| **1 — Raw Library** | Shows 43 photos with only caption and ID — as Google Photos sees them today |
| **2 — AI Auto-Tagging** | Sends all 43 captions to Groq in a single call; the model assigns `look` and `person` tags from controlled vocabulary. Time context (`when`) comes from capture-date metadata (EXIF). Accuracy of AI tags is scored against ground truth. |
| **3 — Guided Search** | Side-by-side comparison of keyword search (today) vs. 3-dropdown guided search (Describe & Find). Three preset scenarios show whether the target photo was found. |

## Real vs. Simulated

| What | Real or Simulated |
|---|---|
| Groq LLM tagging of `look` and `person` from captions | **REAL** |
| Validation against controlled vocab | **REAL** |
| Accuracy scoring vs. ground truth | **REAL** |
| Combined multi-cue search (look + person + when) | **REAL** |
| Search + feedback logging | **REAL** |
| 43-photo library and captions | **SIMULATED** (synthetic data; captions stand in for what a vision model + face-grouping would produce in production) |
| Photo thumbnails | **SIMULATED** (gradient + SVG icon tiles keyed to look value; no real photos) |
| Capture-date metadata | **SIMULATED** (simulated from the dataset to represent EXIF capture dates in Google Photos) |

## How to Run Locally

### Prerequisites
- Node.js 18+
- A Groq API key from [console.groq.com](https://console.groq.com)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env from template
cp .env.example .env
# Edit .env and set GROQ_API_KEY and ADMIN_PASSWORD

# 3. Start the Express server (port 3001)
npm run server

# 4. In a second terminal, start the Vite dev server
npm run dev
# → Open http://localhost:5173
```

In production, the Express server serves the built React app:

```bash
npm run build  # builds dist/
npm start      # starts Express on PORT (default 3001)
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | **Yes** | — | Groq API key — never exposed to browser |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model to use for tagging |
| `ADMIN_PASSWORD` | **Yes** | `admin` | Password for the `/admin` dashboard |
| `PORT` | No | `3001` | Express server port |
| `NODE_ENV` | No | — | Set to `production` to serve React build |

## Admin Dashboard

Visit `/admin` in the browser. Login with password = `ADMIN_PASSWORD`.

Shows:
- Total log rows and sessions
- % of scenario searches where the target photo was found (Today vs. Describe & Find)
- Per-session breakdown
- Full log with all search events and feedback

## Smoke Test (5 commands)

```bash
BASE=https://your-app-url.onrender.com

# 1. Tag endpoint runs and returns accuracy
curl -s -X POST $BASE/api/tag | python -m json.tool | grep -A5 '"accuracy"'

# 2. Cache works — second GET returns cached result
curl -s $BASE/api/tags | python -m json.tool | grep '"cached"'

# 3. Log endpoint accepts a row
curl -s -X POST $BASE/api/log \
  -H 'Content-Type: application/json' \
  -d '{"mode":"guided","query":{},"resultCount":2}' | python -m json.tool

# 4. Admin returns logs (set your password)
curl -s -u admin:YOUR_ADMIN_PASSWORD $BASE/api/admin/logs | python -m json.tool | grep '"total"'

# 5. Scenario target check: pink dress guided search should return photo #6
curl -s $BASE/api/tags | python -c "
import sys, json
data = json.load(sys.stdin)
if data.get('tags'):
    matches = [t for t in data['tags'] if t.get('look')=='pink dress' and t.get('person')=='Granddaughter \u2014 Priya' and t.get('when')=='Last Diwali']
    print(f'Target photo #6 correctly tagged: {len(matches) > 0}')
else:
    print('No tags cached yet — run POST /api/tag first')
"
```

## Deployment (Render.com)

1. Push this repo to GitHub (private)
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** `Node`
5. Add environment variables in Render dashboard:
   - `GROQ_API_KEY` = your key
   - `ADMIN_PASSWORD` = a strong password
   - `NODE_ENV` = `production`
6. Deploy — Render provides a public HTTPS URL

## Architecture

```
Browser (React SPA)
  ↕ HTTP (proxied in dev, direct in prod)
Express Server (server/index.js)
  ├── POST /api/tag       → groq.js → Groq API → validate → cache
  ├── GET  /api/tags       → return cache
  ├── POST /api/log        → logger.js → logs/search_log.jsonl
  ├── POST /api/feedback   → logger.js
  └── GET  /api/admin/logs → basic auth → logs + aggregates
```

## Rate Limits & Security

- `/api/tag` is rate-limited to **10 requests per IP per hour**
- `GROQ_API_KEY` is server-side only — never sent to the browser
- Groq 429 responses are surfaced with the `retry-after` header value
- Admin route protected by HTTP Basic Auth

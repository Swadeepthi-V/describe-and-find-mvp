import 'dotenv/config';
const BASE = process.env.BASE || 'http://localhost:3001';

async function test(name, fn) {
  try {
    const result = await fn();
    console.log(`✅ ${name}:`, result);
  } catch (err) {
    console.log(`❌ ${name}:`, err.message);
  }
}

async function run() {
  console.log(`\nSmoke testing ${BASE}\n`);

  // 1. /api/tags returns cached:false when cold
  await test('/api/tags (cold cache)', async () => {
    const r = await fetch(`${BASE}/api/tags`);
    const d = await r.json();
    if (!r.ok) throw new Error(`Status ${r.status}`);
    return `cached=${d.cached}, tags=${d.tags ? 'present' : 'null'}`;
  });

  // 2. /api/log accepts a row
  await test('/api/log', async () => {
    const r = await fetch(`${BASE}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'smoke-test', resultCount: 0, sessionId: 'test-session' }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(`Status ${r.status}`);
    return `ok=${d.ok}`;
  });

  // 3. /api/feedback accepts a row
  await test('/api/feedback', async () => {
    const r = await fetch(`${BASE}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foundPhoto: 'Yes', easeRating: 5, sessionId: 'test-session' }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(`Status ${r.status}`);
    return `ok=${d.ok}`;
  });

  // 4. /api/feedback with comment & read back
  await test('/api/feedback with comment & read back', async () => {
    const pw = process.env.ADMIN_PASSWORD || 'admin';
    const testSession = `smoke-comment-${Date.now()}`;
    const testComment = 'Great search experience, found my photo quickly!';
    const postRes = await fetch(`${BASE}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: testSession,
        foundPhoto: 'Yes',
        easeRating: 4,
        comment: testComment,
      }),
    });
    if (!postRes.ok) throw new Error(`POST /api/feedback failed: ${postRes.status}`);

    const creds = Buffer.from(`admin:${pw}`).toString('base64');
    const logsRes = await fetch(`${BASE}/api/admin/logs`, {
      headers: { Authorization: `Basic ${creds}` },
    });
    if (!logsRes.ok) throw new Error(`GET /api/admin/logs failed: ${logsRes.status}`);
    const data = await logsRes.json();
    const row = data.logs.find((l) => l.sessionId === testSession);
    if (!row) throw new Error('Feedback row not found in logs');
    if (row.comment !== testComment) throw new Error(`Comment mismatch: expected "${testComment}", got "${row.comment}"`);
    if (row.foundPhoto !== 'Yes') throw new Error(`foundPhoto mismatch: expected "Yes", got "${row.foundPhoto}"`);
    if (row.easeRating !== 4) throw new Error(`easeRating mismatch: expected 4, got "${row.easeRating}"`);
    return `comment="${row.comment}", foundPhoto=${row.foundPhoto}, easeRating=${row.easeRating}`;
  });

  // 4. /api/admin/logs requires auth
  await test('/api/admin/logs (no auth → 401)', async () => {
    const r = await fetch(`${BASE}/api/admin/logs`);
    return `status=${r.status} (expected 401)`;
  });

  // 5. /api/admin/logs with correct password
  const pw = process.env.ADMIN_PASSWORD || 'admin';
  await test('/api/admin/logs (with auth)', async () => {
    const creds = Buffer.from(`admin:${pw}`).toString('base64');
    const r = await fetch(`${BASE}/api/admin/logs`, {
      headers: { Authorization: `Basic ${creds}` },
    });
    if (!r.ok) throw new Error(`Status ${r.status} — check ADMIN_PASSWORD env var`);
    const d = await r.json();
    return `total=${d.total} logs`;
  });

  // 6. /api/tag without API key returns 503
  await test('/api/tag (no key → 503 or tags)', async () => {
    const r = await fetch(`${BASE}/api/tag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test' }),
    });
    const d = await r.json();
    if (r.status === 503) return 'correctly returned 503 (no GROQ_API_KEY set)';
    if (r.status === 429) return 'rate limited (already tested today)';
    if (r.ok && d.tags) return `tagged ${d.tags.length} photos, accuracy.all=${d.accuracy?.all?.pct}%`;
    return `status=${r.status}: ${JSON.stringify(d).slice(0, 100)}`;
  });

  console.log('\nDone.\n');
}

run();

// src/components/AdminPage.jsx

import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || '';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const creds = btoa(`admin:${password}`);
      const res = await fetch(`${API}/api/admin/logs`, {
        headers: { Authorization: `Basic ${creds}` },
      });
      if (res.status === 401) { setError('Wrong password'); return; }
      if (!res.ok) { setError(`Error ${res.status}`); return; }
      const d = await res.json();
      setData(d);
      setAuthed(true);
      sessionStorage.setItem('df_admin_creds', creds);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    const creds = sessionStorage.getItem('df_admin_creds');
    if (!creds) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/logs`, {
        headers: { Authorization: `Basic ${creds}` },
      });
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }

  // Try auto-login from session
  useEffect(() => {
    const creds = sessionStorage.getItem('df_admin_creds');
    if (!creds) return;
    fetch(`${API}/api/admin/logs`, { headers: { Authorization: `Basic ${creds}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) { setData(d); setAuthed(true); } })
      .catch(() => {});
  }, []);

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center' }}>
        <div className="admin-login" style={{ margin: '0 auto', width: '100%' }}>
          <h2>🔒 Admin Login</h2>
          <form onSubmit={login}>
            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                className="search-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter ADMIN_PASSWORD"
                autoFocus
              />
            </div>
            {error && <div className="error-box" style={{ marginBottom: 12 }}><span>⚠️</span>{error}</div>}
            <button id="admin-login-btn" type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const { logs, aggregates } = data;
  const { totalLogs, totalSessions, sessions, scenarioTargetFoundRate, feedbackStats } = aggregates;

  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeCSV(val) {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function exportCSV() {
    const rows = logs || [];
    const headers = ['sessionId', 'timestamp', 'mode', 'query/fields', 'resultCount', 'targetFound', 'feedback answers', 'comment'];
    const csvRows = [headers.map(escapeCSV).join(',')];

    for (const row of rows) {
      let queryFields = '';
      if (row.guidedFields) {
        queryFields = row.keyword ? `keyword: "${row.keyword}", fields: ${JSON.stringify(row.guidedFields)}` : JSON.stringify(row.guidedFields);
      } else if (row.keyword) {
        queryFields = row.keyword;
      } else if (row.context) {
        queryFields = typeof row.context === 'object' ? JSON.stringify(row.context) : String(row.context);
      } else if (row.query) {
        queryFields = typeof row.query === 'object' ? JSON.stringify(row.query) : String(row.query);
      } else if (row.mode === 'tagging' && row.accuracy) {
        queryFields = `accuracy: ${JSON.stringify(row.accuracy)}`;
      }

      let resultCount = '';
      if (row.resultCount !== undefined) {
        resultCount = row.resultCount;
      } else if (row.todayCount !== undefined || row.guidedCount !== undefined) {
        resultCount = `today: ${row.todayCount ?? '—'}, guided: ${row.guidedCount ?? '—'}`;
      }

      let targetFound = '';
      if (row.targetFound !== undefined) {
        targetFound = typeof row.targetFound === 'object'
          ? `today: ${row.targetFound.today ?? '—'}, guided: ${row.targetFound.guided ?? '—'}`
          : String(row.targetFound);
      }

      let feedbackAnswers = '';
      const foundAns = row.foundPhoto || (row.found === true ? 'Yes' : row.found === false ? 'No' : '');
      const easeAns = row.easeRating ?? row.ease ?? '';
      if (foundAns || easeAns) {
        feedbackAnswers = `foundPhoto: ${foundAns || '—'}, easeRating: ${easeAns || '—'}`;
      } else if (row.feedback !== undefined) {
        feedbackAnswers = typeof row.feedback === 'object' ? JSON.stringify(row.feedback) : String(row.feedback);
      }

      const commentVal = row.comment ? String(row.comment) : '';

      const values = [
        row.sessionId ?? '',
        row.timestamp ?? '',
        row.mode ?? '',
        queryFields,
        resultCount,
        targetFound,
        feedbackAnswers,
        commentVal,
      ];

      csvRows.push(values.map(escapeCSV).join(','));
    }

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    downloadBlob(csvContent, `describe_and_find_logs_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  }

  function downloadJSON() {
    const rows = logs || [];
    const normalized = rows.map((r) => ({ ...r, comment: r.comment || '' }));
    const jsonContent = JSON.stringify(normalized, null, 2);
    downloadBlob(jsonContent, `describe_and_find_logs_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  }

  const feedbackLogs = (logs || []).filter(
    (l) => l.mode === 'feedback' || l.foundPhoto !== undefined || l.easeRating !== undefined || l.found !== undefined || l.ease !== undefined
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '32px 16px' }}>
      <div className="admin-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h2>📊 Admin Dashboard</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button id="export-csv-btn" className="btn btn-secondary btn-sm" onClick={exportCSV}>
              Export CSV
            </button>
            <button id="download-json-btn" className="btn btn-secondary btn-sm" onClick={downloadJSON}>
              Download JSON
            </button>
            <button className="btn btn-ghost btn-sm" onClick={refresh} disabled={loading}>
              {loading ? 'Loading…' : '↻ Refresh'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setAuthed(false); sessionStorage.removeItem('df_admin_creds'); }}>
              Logout
            </button>
          </div>
        </div>

        {/* Aggregates */}
        <div className="agg-grid">
          <div className="agg-card">
            <div className="big">{totalLogs}</div>
            <div className="lbl">Total log rows</div>
          </div>
          <div className="agg-card">
            <div className="big">{totalSessions}</div>
            <div className="lbl">Sessions</div>
          </div>
          <div className="agg-card">
            <div className="big">{scenarioTargetFoundRate.today != null ? scenarioTargetFoundRate.today + '%' : '—'}</div>
            <div className="lbl">Scenarios: target found (Today)</div>
          </div>
          <div className="agg-card">
            <div className="big" style={{ color: 'var(--accent2)' }}>{scenarioTargetFoundRate.guided != null ? scenarioTargetFoundRate.guided + '%' : '—'}</div>
            <div className="lbl">Scenarios: target found (Guided)</div>
          </div>
          <div className="agg-card">
            <div className="big" style={{ color: '#fbbf24' }}>{feedbackStats?.avgEase != null ? `${feedbackStats.avgEase} ★` : '—'}</div>
            <div className="lbl">Average ease rating</div>
          </div>
          <div className="agg-card">
            <div className="big" style={{ color: 'var(--success)' }}>{feedbackStats?.foundPhotoYesPct != null ? `${feedbackStats.foundPhotoYesPct}%` : '—'}</div>
            <div className="lbl">% Yes for foundPhoto</div>
          </div>
        </div>

        {/* Feedback Responses table */}
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)' }}>
          Feedback Responses ({feedbackLogs.length})
        </h3>
        <div style={{ overflowX: 'auto', marginBottom: 28 }}>
          <table className="log-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Session</th>
                <th>Found Photo</th>
                <th>Ease Rating</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {[...feedbackLogs].reverse().map((row, i) => {
                const foundText = row.foundPhoto || (row.found === true ? 'Yes' : row.found === false ? 'No' : '—');
                const easeVal = row.easeRating ?? row.ease;
                const commentText = row.comment ? String(row.comment) : '';
                return (
                  <tr key={i}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(row.timestamp).toLocaleString()}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{(row.sessionId || '—').slice(0, 12)}</td>
                    <td>
                      <span className={`pill ${foundText === 'Yes' ? 'pill-success' : foundText === 'No' ? 'pill-danger' : ''}`} style={{ fontSize: 11 }}>
                        {foundText}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{easeVal ? `${easeVal} ★` : '—'}</td>
                    <td style={{ fontSize: 12, maxWidth: 350, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {commentText || <span style={{ color: 'var(--text-dim)' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
              {feedbackLogs.length === 0 && (
                <tr><td colSpan={5} style={{ color: 'var(--text-dim)', textAlign: 'center' }}>No feedback submitted yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sessions table */}
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)' }}>Sessions</h3>
        <div style={{ overflowX: 'auto', marginBottom: 28 }}>
          <table className="log-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Searches</th>
                <th>Scenarios</th>
                <th>Target found (Today)</th>
                <th>Target found (Guided)</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.sessionId}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.sessionId.slice(0, 12)}…</td>
                  <td>{s.searches}</td>
                  <td>{s.scenarios}</td>
                  <td>{s.targetsFoundToday}</td>
                  <td>{s.targetsFoundGuided}</td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={5} style={{ color: 'var(--text-dim)', textAlign: 'center' }}>No sessions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Full log */}
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)' }}>
          All Log Rows ({totalLogs})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="log-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Session</th>
                <th>Mode</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {[...logs].reverse().slice(0, 200).map((row, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(row.timestamp).toLocaleString()}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{(row.sessionId || '—').slice(0, 10)}</td>
                  <td><span className="pill pill-success" style={{ fontSize: 11 }}>{row.mode}</span></td>
                  <td style={{ fontSize: 12, maxWidth: 400 }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 11 }}>
                      {JSON.stringify(
                        Object.fromEntries(
                          Object.entries(row).filter(([k]) => !['timestamp', 'sessionId', 'mode'].includes(k))
                        ),
                        null, 2
                      )}
                    </pre>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} style={{ color: 'var(--text-dim)', textAlign: 'center' }}>No logs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// src/components/AccuracyPanel.jsx

function pctClass(pct) {
  const n = parseFloat(pct);
  if (n >= 80) return 'high';
  if (n >= 50) return 'mid';
  return 'low';
}

function PillPct({ pct }) {
  const cls = pctClass(pct);
  const pillCls = cls === 'high' ? 'pill-success' : cls === 'mid' ? 'pill-warning' : 'pill-error';
  const icon = cls === 'high' ? '✓' : cls === 'mid' ? '~' : '✗';
  return <span className={`pill ${pillCls}`}>{icon} {pct}%</span>;
}

export default function AccuracyPanel({ accuracy }) {
  if (!accuracy) return null;
  const { look, person, when, all } = accuracy;

  return (
    <div className="accuracy-panel">
      <h3>
        <span style={{ fontSize: 20 }}>📊</span>
        AI Tagging Accuracy vs. Ground Truth
      </h3>

      <div className="accuracy-grid">
        <div className="accuracy-card">
          <div className="big-num" style={{ fontSize: 22, marginBottom: 2 }}>🎯</div>
          <div className={`big-num ${pctClass(all?.pct)}`}>{all?.pct}%</div>
          <div className="acc-label">All Correct (Look + Person)</div>
          <div className="acc-sub">{all?.correct}/{all?.total} photos</div>
        </div>

        <div className="accuracy-card">
          <div className="big-num" style={{ fontSize: 22, marginBottom: 2 }}>👀</div>
          <div className={`big-num ${pctClass(look?.pct)}`}>{look?.pct}%</div>
          <div className="acc-label">Look (AI)</div>
          <div className="acc-sub">{look?.correct}/{look?.total} photos</div>
        </div>

        <div className="accuracy-card">
          <div className="big-num" style={{ fontSize: 22, marginBottom: 2 }}>👤</div>
          <div className={`big-num ${pctClass(person?.pct)}`}>{person?.pct}%</div>
          <div className="acc-label">Person (AI)</div>
          <div className="acc-sub">{person?.correct}/{person?.total} photos</div>
        </div>

        <div className="accuracy-card" style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.06)' }}>
          <div className="big-num" style={{ fontSize: 22, marginBottom: 2 }}>📅</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-hover)', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Metadata (EXIF)
          </div>
          <div className="acc-label" style={{ fontSize: 12, lineHeight: 1.35, color: 'var(--text-muted)' }}>
            Read from capture-date metadata — not AI-inferred
          </div>
          <div className="acc-sub" style={{ marginTop: 4 }}>43/43 timestamped</div>
        </div>
      </div>

      <table className="accuracy-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Correct</th>
            <th>Total</th>
            <th>Accuracy</th>
            <th>Interpretation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ fontWeight: 600 }}>Look (AI)</td>
            <td>{look?.correct}</td>
            <td>{look?.total}</td>
            <td><PillPct pct={look?.pct} /></td>
            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>Visual appearance / setting (AI-inferred from caption)</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600 }}>Person (AI)</td>
            <td>{person?.correct}</td>
            <td>{person?.total}</td>
            <td><PillPct pct={person?.pct} /></td>
            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>Who is in the photo (AI-inferred from caption)</td>
          </tr>
          <tr style={{ background: 'rgba(99,102,241,0.04)' }}>
            <td style={{ fontWeight: 600 }}>When</td>
            <td>—</td>
            <td>—</td>
            <td><span className="pill" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>EXIF</span></td>
            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>Read from capture-date metadata — not AI-inferred</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600 }}>All Correct (Look + Person)</td>
            <td>{all?.correct}</td>
            <td>{all?.total}</td>
            <td><PillPct pct={all?.pct} /></td>
            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>Both AI-inferred cues match ground truth exactly</td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 12 }}>
        ⚠️ Photos with an orange dashed border were mistagged on Look or Person — hover/tap to see what the AI got wrong and why the target might be missed.
        This honesty is a feature: it demonstrates where the AI workflow performs well and where ambiguous clues pose challenges.
      </p>
    </div>
  );
}

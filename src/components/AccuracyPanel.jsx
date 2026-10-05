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
        {[
          { label: 'All 3 Correct', stat: all, icon: '🎯' },
          { label: 'Look', stat: look, icon: '👀' },
          { label: 'Person', stat: person, icon: '👤' },
          { label: 'When', stat: when, icon: '🕐' },
        ].map(({ label, stat, icon }) => (
          <div key={label} className="accuracy-card">
            <div className="big-num" style={{ fontSize: 22, marginBottom: 2 }}>{icon}</div>
            <div className={`big-num ${pctClass(stat.pct)}`}>{stat.pct}%</div>
            <div className="acc-label">{label}</div>
            <div className="acc-sub">{stat.correct}/{stat.total} photos</div>
          </div>
        ))}
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
          {[
            { field: 'Look', stat: look, note: 'Visual appearance / setting' },
            { field: 'Person', stat: person, note: 'Who is in the photo' },
            { field: 'When', stat: when, note: 'Time context' },
            { field: 'All three', stat: all, note: 'Exact match — search will succeed' },
          ].map(({ field, stat, note }) => (
            <tr key={field}>
              <td style={{ fontWeight: 600 }}>{field}</td>
              <td>{stat.correct}</td>
              <td>{stat.total}</td>
              <td><PillPct pct={stat.pct} /></td>
              <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 12 }}>
        ⚠️ Photos with an orange dashed border were mistagged — hover/tap to see what the AI got wrong and why the target might be missed.
        This honesty is a feature: it shows where the AI workflow could improve.
      </p>
    </div>
  );
}

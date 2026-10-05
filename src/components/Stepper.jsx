// src/components/Stepper.jsx

export default function Stepper({ stage, setStage, taggingDone }) {
  const steps = [
    { num: 1, label: 'Raw Library' },
    { num: 2, label: 'AI Auto-Tagging' },
    { num: 3, label: 'Guided Search' },
  ];

  return (
    <nav className="stepper" aria-label="Workflow stages">
      {steps.map((s) => {
        const isActive = stage === s.num;
        const isDone = s.num < stage || (s.num === 2 && taggingDone && stage !== 2);
        return (
          <button
            key={s.num}
            className={`step-btn ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
            onClick={() => setStage(s.num)}
            aria-current={isActive ? 'step' : undefined}
          >
            <span className="step-num">{isDone ? '✓' : s.num}</span>
            <span className="step-label">Stage {s.num}<br />{s.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

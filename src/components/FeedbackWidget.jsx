// src/components/FeedbackWidget.jsx

import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';

function getSessionId() {
  let id = sessionStorage.getItem('df_session');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('df_session', id);
  }
  return id;
}

export default function FeedbackWidget({ context }) {
  const [found, setFound] = useState(null); // true | false | null
  const [ease, setEase] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (found === null && ease === 0) return;
    await fetch(`${API}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: getSessionId(),
        found,
        ease,
        context,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="feedback-widget">
        <div className="feedback-thanks">
          <span>✅</span> Thank you for your feedback!
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-widget">
      <h4>Quick feedback (optional)</h4>
      <div className="feedback-row">
        <div className="feedback-field">
          <label>Did you find the photo?</label>
          <div className="yes-no-btns">
            <button
              id="feedback-yes-btn"
              className={`yn-btn ${found === true ? 'selected-yes' : ''}`}
              onClick={() => setFound(true)}
            >
              <span>✓</span> Yes
            </button>
            <button
              id="feedback-no-btn"
              className={`yn-btn ${found === false ? 'selected-no' : ''}`}
              onClick={() => setFound(false)}
            >
              <span>✗</span> No
            </button>
          </div>
        </div>

        <div className="feedback-field">
          <label>How easy was it? (1–5)</label>
          <div className="star-row" role="group" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                id={`star-${n}-btn`}
                className={`star-btn ${n <= (hoverStar || ease) ? 'lit' : ''}`}
                onMouseEnter={() => setHoverStar(n)}
                onMouseLeave={() => setHoverStar(0)}
                onClick={() => setEase(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="feedback-submit">
          <button
            id="feedback-submit-btn"
            className="btn btn-secondary btn-sm"
            onClick={submit}
            disabled={found === null && ease === 0}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

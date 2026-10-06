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
  const [foundPhoto, setFoundPhoto] = useState(null); // 'Yes' | 'No' | null
  const [easeRating, setEaseRating] = useState(0); // 1..5
  const [hoverStar, setHoverStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const MAX_COMMENT_LENGTH = 500;

  async function submit(e) {
    if (e) e.preventDefault();
    if (!foundPhoto || easeRating === 0 || submitting) return;

    setSubmitting(true);
    setError(null);

    const payload = {
      sessionId: getSessionId(),
      foundPhoto,
      easeRating,
      comment: comment.trim().slice(0, MAX_COMMENT_LENGTH),
      context: context || null,
      timestamp: new Date().toISOString(),
      // Legacy compatibility aliases
      found: foundPhoto === 'Yes',
      ease: easeRating,
    };

    try {
      const res = await fetch(`${API}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `Error ${res.status}`);
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
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

  const isValid = foundPhoto !== null && easeRating >= 1 && easeRating <= 5;

  return (
    <div className="feedback-widget">
      <h4>Quick feedback (optional)</h4>
      <form onSubmit={submit} className="feedback-col">
        <div className="feedback-row">
          <div className="feedback-field">
            <label id="found-photo-label">Did you find the photo?</label>
            <div className="yes-no-btns" role="radiogroup" aria-labelledby="found-photo-label">
              <button
                type="button"
                id="feedback-yes-btn"
                className={`yn-btn ${foundPhoto === 'Yes' ? 'selected-yes' : ''}`}
                onClick={() => setFoundPhoto('Yes')}
                aria-pressed={foundPhoto === 'Yes'}
              >
                <span>✓</span> Yes
              </button>
              <button
                type="button"
                id="feedback-no-btn"
                className={`yn-btn ${foundPhoto === 'No' ? 'selected-no' : ''}`}
                onClick={() => setFoundPhoto('No')}
                aria-pressed={foundPhoto === 'No'}
              >
                <span>✗</span> No
              </button>
            </div>
          </div>

          <div className="feedback-field">
            <label id="ease-rating-label">How easy was it? (1–5)</label>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <div className="star-row" role="radiogroup" aria-labelledby="ease-rating-label">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    id={`star-${n}-btn`}
                    className={`star-btn ${n <= (hoverStar || easeRating) ? 'lit' : ''}`}
                    onMouseEnter={() => setHoverStar(n)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setEaseRating(n)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setEaseRating(n);
                      }
                    }}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    aria-pressed={easeRating === n}
                  >
                    ★
                  </button>
                ))}
              </div>
              <span className="rating-text">
                {easeRating > 0 ? `${easeRating} of 5 stars` : 'Select rating'}
              </span>
            </div>
          </div>
        </div>

        <div className="feedback-field" style={{ width: '100%' }}>
          <label htmlFor="feedback-comment">Anything else you'd like to tell us? (optional)</label>
          <textarea
            id="feedback-comment"
            className="feedback-textarea"
            placeholder="What was confusing, missing, or surprising?"
            value={comment}
            maxLength={MAX_COMMENT_LENGTH}
            onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
            rows={3}
          />
          <div className="char-counter">
            {comment.length}/{MAX_COMMENT_LENGTH} characters
          </div>
        </div>

        {error && <div className="error-box" style={{ margin: 0 }}><span>⚠️</span>{error}</div>}

        <div className="feedback-submit" style={{ alignSelf: 'flex-start' }}>
          <button
            type="submit"
            id="feedback-submit-btn"
            className="btn btn-secondary btn-sm"
            disabled={!isValid || submitting}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}

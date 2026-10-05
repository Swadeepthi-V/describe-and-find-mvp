// src/components/Stage2Tagging.jsx

import { useState, useEffect } from 'react';
import PhotoCard from './PhotoCard.jsx';
import AccuracyPanel from './AccuracyPanel.jsx';
import photos from '../data/photos.json';

const API = import.meta.env.VITE_API_URL || '';

function getSessionId() {
  let id = sessionStorage.getItem('df_session');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('df_session', id);
  }
  return id;
}

export default function Stage2Tagging({ tagsResult, setTagsResult }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // On mount, try to load cached tags
  useEffect(() => {
    if (tagsResult) return;
    fetch(`${API}/api/tags`)
      .then((r) => r.json())
      .then((data) => {
        if (data.tags) setTagsResult(data);
      })
      .catch(() => {});
  }, []);

  async function runTagging(force = false) {
    if (force) {
      // Clear server cache first
      await fetch(`${API}/api/tag/clear`, { method: 'POST' }).catch(() => {});
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: getSessionId() }),
      });
      if (res.status === 429) {
        const data = await res.json();
        const secs = data.retryAfter || 60;
        setError(`Rate limit reached. Try again in ${secs} seconds.`);
        return;
      }
      if (res.status === 503) {
        setError('The server has no Groq API key configured. Please set GROQ_API_KEY on the server.');
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || `Error ${res.status}`);
        return;
      }
      const data = await res.json();
      setTagsResult(data);
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Build a map from id → aiTag for quick lookup
  const aiTagMap = {};
  if (tagsResult?.tags) {
    for (const t of tagsResult.tags) aiTagMap[t.id] = t;
  }

  return (
    <div>
      <div className="section-header">
        <div className="section-title">AI Auto-Tagging</div>
        <div className="section-subtitle">
          The backend sends all 43 captions to Groq in a single call.
          The model classifies each photo using controlled vocabulary. Results are cached until you re-run.
        </div>
      </div>

      <div className="insight-box">
        <strong>How it works:</strong> The tagger receives <em>only the caption</em> — never the ground-truth labels.
        It must pick values from controlled vocab lists for look, person, and when.
        We then compare its output to the ground truth to compute accuracy.
      </div>

      {/* Controls */}
      <div className="tag-controls">
        {!tagsResult ? (
          <button
            id="run-ai-tagging-btn"
            className="btn btn-primary"
            onClick={() => runTagging(false)}
            disabled={loading}
          >
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /></> : '✨'}
            Run AI Tagging
          </button>
        ) : (
          <>
            <span className="pill pill-success" style={{ fontSize: 13, padding: '5px 12px' }}>
              ✓ Tagged — {tagsResult.cached ? 'from cache' : 'just computed'}
            </span>
            <button
              id="rerun-tagging-btn"
              className="btn btn-ghost btn-sm"
              onClick={() => runTagging(true)}
              disabled={loading}
            >
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /></> : '↻'}
              Re-run
            </button>
          </>
        )}
        {tagsResult && (
          <span className="text-muted text-sm">
            Last run: {new Date(tagsResult.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <div className="loading-text">
            Calling Groq with 43 captions… this usually takes 5–15 seconds.
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-box">
          <span>⚠️</span>
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Accuracy panel */}
      {tagsResult && <AccuracyPanel accuracy={tagsResult.accuracy} />}

      {/* Photo grid with tags */}
      {tagsResult && (
        <>
          <div style={{ marginBottom: 14, fontSize: 14, color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text)' }}>Photo cards with AI tags overlaid.</strong>{' '}
            Orange dashed border = mistag. Hover/tap for details. ✓ = correct · ✗ = wrong.
          </div>
          <div className="photo-grid">
            {photos.photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                aiTag={aiTagMap[photo.id] || null}
                showTags={true}
                isTarget={false}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

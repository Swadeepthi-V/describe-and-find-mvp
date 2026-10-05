// src/components/Stage3Search.jsx

import { useState, useMemo } from 'react';
import PhotoCard from './PhotoCard.jsx';
import FeedbackWidget from './FeedbackWidget.jsx';
import photos from '../data/photos.json';

const API = import.meta.env.VITE_API_URL || '';
const { vocab, scenarios } = photos;
const allPhotos = photos.photos;

function getSessionId() {
  let id = sessionStorage.getItem('df_session');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('df_session', id);
  }
  return id;
}

async function logSearch(payload) {
  fetch(`${API}/api/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, sessionId: getSessionId() }),
  }).catch(() => {});
}

// Token-based keyword search over captions
function keywordSearch(query) {
  if (!query.trim()) return [];
  const tokens = query.toLowerCase().trim().split(/\s+/);
  return allPhotos.filter((p) =>
    tokens.every((tok) => p.caption.toLowerCase().includes(tok))
  );
}

// Guided search over AI tags
function guidedSearch(aiTagMap, look, person, when) {
  if (!look && !person && !when) return [];
  return allPhotos.filter((p) => {
    const t = aiTagMap[p.id];
    if (!t) return false;
    if (look && t.look !== look) return false;
    if (person && t.person !== person) return false;
    if (when && t.when !== when) return false;
    return true;
  });
}

function MiniCard({ photo, targetIds }) {
  const isTarget = targetIds && targetIds.includes(photo.id);
  return (
    <div className={`mini-card ${isTarget ? 'target' : ''}`} title={photo.caption}>
      #{photo.id}
      {isTarget && ' ★'}
    </div>
  );
}

export default function Stage3Search({ tagsResult }) {
  const [keyword, setKeyword] = useState('');
  const [look, setLook] = useState('');
  const [person, setPerson] = useState('');
  const [when, setWhen] = useState('');
  const [activeScenario, setActiveScenario] = useState(null);
  const [searched, setSearched] = useState(false);

  const aiTagMap = useMemo(() => {
    const m = {};
    if (tagsResult?.tags) for (const t of tagsResult.tags) m[t.id] = t;
    return m;
  }, [tagsResult]);

  const noTags = !tagsResult?.tags;

  // Compute results
  const todayResults = useMemo(() => keywordSearch(keyword), [keyword]);
  const guidedResults = useMemo(
    () => guidedSearch(aiTagMap, look, person, when),
    [aiTagMap, look, person, when]
  );

  const scenarioTargetIds = activeScenario?.target_ids || null;

  // Check if target found
  const targetFoundToday = scenarioTargetIds
    ? scenarioTargetIds.every((id) => todayResults.some((p) => p.id === id))
    : null;
  const targetFoundGuided = scenarioTargetIds
    ? scenarioTargetIds.every((id) => guidedResults.some((p) => p.id === id))
    : null;

  // Check for mistag on scenario target
  function targetMistagged(targetId) {
    if (!tagsResult?.tags) return null;
    const t = aiTagMap[targetId];
    const truth = allPhotos.find((p) => p.id === targetId);
    if (!t || !truth) return null;
    const bad = [];
    if (t.look !== truth.look) bad.push(`look: AI="${t.look}", truth="${truth.look}"`);
    if (t.person !== truth.person) bad.push(`person: AI="${t.person}", truth="${truth.person}"`);
    if (t.when !== truth.when) bad.push(`when: AI="${t.when}", truth="${truth.when}"`);
    return bad.length ? bad : null;
  }

  function loadScenario(scenario) {
    setActiveScenario(scenario);
    setKeyword(scenario.literal_query);
    if (!noTags) {
      // Find guided fields from target photo's ground truth
      const target = allPhotos.find((p) => p.id === scenario.target_ids[0]);
      if (target) {
        setLook(target.look);
        setPerson(target.person);
        setWhen(target.when);
      }
    }
    setSearched(true);

    // Log scenario search
    setTimeout(() => {
      const todayR = keywordSearch(scenario.literal_query);
      const target = allPhotos.find((p) => p.id === scenario.target_ids[0]);
      const guidedR = target ? guidedSearch(aiTagMap, target.look, target.person, target.when) : [];
      logSearch({
        mode: 'scenario',
        scenarioName: scenario.name,
        keyword: scenario.literal_query,
        guidedFields: { look: target?.look, person: target?.person, when: target?.when },
        todayCount: todayR.length,
        guidedCount: guidedR.length,
        targetFound: {
          today: scenario.target_ids.every((id) => todayR.some((p) => p.id === id)),
          guided: scenario.target_ids.every((id) => guidedR.some((p) => p.id === id)),
        },
      });
    }, 0);
  }

  function handleKeywordSearch(q) {
    setKeyword(q);
    setActiveScenario(null);
    if (q.trim()) {
      logSearch({ mode: 'today', keyword: q, resultCount: keywordSearch(q).length });
    }
  }

  function handleGuidedChange(field, val) {
    if (field === 'look') setLook(val);
    if (field === 'person') setPerson(val);
    if (field === 'when') setWhen(val);
    setActiveScenario(null);
    setSearched(true);
  }

  const showHeadline = (keyword.trim() || look || person || when) && searched;

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Guided Search over AI Tags</div>
        <div className="section-subtitle">
          Search by combining look, person, and time — or use the classic keyword search. See both results side by side.
        </div>
      </div>

      {noTags && (
        <div className="error-box">
          <span>⚠️</span>
          <div>AI tagging hasn't run yet. Go to Stage 2 and click "Run AI Tagging" first.</div>
        </div>
      )}

      {/* Scenario Buttons */}
      <div className="scenario-section">
        <h3>🎯 Preset Scenarios (try these)</h3>
        <div className="scenario-buttons">
          {scenarios.map((sc) => (
            <button
              key={sc.name}
              id={`scenario-${sc.name.replace(/\s+/g, '-')}-btn`}
              className={`scenario-btn ${activeScenario?.name === sc.name ? 'active' : ''}`}
              onClick={() => loadScenario(sc)}
            >
              <span className="s-name">{sc.name}</span>
              <span className="s-query">"{sc.natural_query}"</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scenario target result */}
      {activeScenario && searched && (
        <div style={{ marginBottom: 20 }}>
          {/* Today result */}
          <div className={`target-result ${targetFoundToday ? 'found' : 'not-found'}`}>
            <div className="icon">{targetFoundToday ? '✅' : '❌'}</div>
            <div className="detail">
              <strong>
                Today's Google Photos search: target photo{activeScenario.target_ids.length > 1 ? 's' : ''}{' '}
                {targetFoundToday ? 'FOUND' : 'NOT FOUND'} in {todayResults.length} results
              </strong>
              <small>
                Keyword: "{activeScenario.literal_query}" · {todayResults.length} photos matched.
                Target ID{activeScenario.target_ids.length > 1 ? 's' : ''}: #{activeScenario.target_ids.join(', #')}.
              </small>
            </div>
          </div>

          {/* Guided result */}
          <div className={`target-result ${targetFoundGuided ? 'found' : 'not-found'}`}>
            <div className="icon">{targetFoundGuided ? '✅' : '❌'}</div>
            <div className="detail">
              <strong>
                Describe &amp; Find: target photo{activeScenario.target_ids.length > 1 ? 's' : ''}{' '}
                {targetFoundGuided ? 'FOUND' : 'NOT FOUND'} in {guidedResults.length} results
              </strong>
              <small>
                Guided filters applied · {guidedResults.length} photos matched.
              </small>
              {!targetFoundGuided && tagsResult && (
                <div>
                  {activeScenario.target_ids.map((id) => {
                    const bad = targetMistagged(id);
                    return bad ? (
                      <div key={id} className="mistag-note">
                        ⚠️ Photo #{id} was mistagged by the AI: {bad.join(' · ')}. That's why it was missed — AI error, not a design flaw.
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              {!targetFoundGuided && !tagsResult && (
                <div className="mistag-note">⚠️ AI tagging hasn't run yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Headline comparison */}
      {showHeadline && (keyword.trim() || (look || person || when)) && (
        <div className="comparison-headline">
          <div className="headline-text">
            <span className="today-count">Today: <strong>{keyword.trim() ? todayResults.length : '—'}</strong> results</span>
            <span className="arrow">→</span>
            <span className="guided-count">Describe &amp; Find: <strong>{look || person || when ? guidedResults.length : '—'}</strong> results</span>
          </div>
        </div>
      )}

      {/* Search panels */}
      <div className="search-layout">
        {/* Today's search */}
        <div className="search-panel panel-today">
          <h3>
            <span>🔍</span> Today's Google Photos
          </h3>
          <input
            id="keyword-search-input"
            type="text"
            className="search-input"
            placeholder='e.g. "pink dress"'
            value={keyword}
            onChange={(e) => handleKeywordSearch(e.target.value)}
          />
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
            Token match over captions only
          </p>
          <div className="result-count-bar">
            <span>Results:</span>
            <strong>{keyword.trim() ? todayResults.length : '—'}</strong>
            {keyword.trim() && (
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>photos</span>
            )}
          </div>
          {keyword.trim() && todayResults.length > 0 && (
            <div className="result-mini-grid">
              {todayResults.map((p) => (
                <MiniCard key={p.id} photo={p} targetIds={scenarioTargetIds} />
              ))}
            </div>
          )}
          {keyword.trim() && todayResults.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>No results for this keyword.</p>
          )}
        </div>

        {/* Guided search */}
        <div className="search-panel panel-guided">
          <h3>
            <span style={{ color: 'var(--accent2)' }}>✨</span> Describe &amp; Find
          </h3>
          {noTags ? (
            <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Run AI tagging first (Stage 2) to enable guided search.
            </p>
          ) : (
            <>
              <div className="dropdown-group">
                {[
                  { id: 'look', label: 'Looks like', options: vocab.look, val: look, setter: (v) => handleGuidedChange('look', v) },
                  { id: 'person', label: "Who's in it", options: vocab.person, val: person, setter: (v) => handleGuidedChange('person', v) },
                  { id: 'when', label: 'When', options: vocab.when, val: when, setter: (v) => handleGuidedChange('when', v) },
                ].map(({ id, label, options, val, setter }) => (
                  <div key={id} className="dropdown-row">
                    <label htmlFor={`guided-${id}`}>{label}</label>
                    <select
                      id={`guided-${id}`}
                      className="dropdown-select"
                      value={val}
                      onChange={(e) => setter(e.target.value)}
                    >
                      <option value="">— any —</option>
                      {options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {(look || person || when) && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 4, fontSize: 12 }}
                  onClick={() => { setLook(''); setPerson(''); setWhen(''); setActiveScenario(null); }}
                >
                  ✕ Clear filters
                </button>
              )}
            </>
          )}
          <div className="result-count-bar">
            <span>Results:</span>
            <strong>{(look || person || when) ? guidedResults.length : '—'}</strong>
            {(look || person || when) && (
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>photos</span>
            )}
          </div>
          {(look || person || when) && guidedResults.length > 0 && (
            <div className="result-mini-grid">
              {guidedResults.map((p) => (
                <MiniCard key={p.id} photo={p} targetIds={scenarioTargetIds} />
              ))}
            </div>
          )}
          {(look || person || when) && guidedResults.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>No photos match all selected filters.</p>
          )}
        </div>
      </div>

      {/* Full photo grid for guided results */}
      {(look || person || when) && guidedResults.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>
            <strong>Guided search results — full view</strong>
          </div>
          <div className="photo-grid">
            {guidedResults.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                aiTag={aiTagMap[photo.id] || null}
                showTags={true}
                isTarget={scenarioTargetIds ? scenarioTargetIds.includes(photo.id) : false}
              />
            ))}
          </div>
        </div>
      )}

      <FeedbackWidget context={{ keyword, look, person, when, scenario: activeScenario?.name }} />
    </div>
  );
}

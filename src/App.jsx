// src/App.jsx — Main app shell with stepper

import { useState } from 'react';
import Stepper from './components/Stepper.jsx';
import Stage1Library from './components/Stage1Library.jsx';
import Stage2Tagging from './components/Stage2Tagging.jsx';
import Stage3Search from './components/Stage3Search.jsx';
import AdminPage from './components/AdminPage.jsx';

export default function App() {
  const [stage, setStage] = useState(1);
  const [tagsResult, setTagsResult] = useState(null);

  // Admin page at /admin route
  if (window.location.pathname === '/admin') {
    return <AdminPage />;
  }

  const taggingDone = !!tagsResult;

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="case-badge">
          <span>🔬</span> Google Photos · <span>Product Case Study MVP</span>
        </div>
        <h1>Describe &amp; Find · AI Workflow</h1>
        <p>
          A prototype showing how AI auto-tagging enables multi-cue photo search — solving a real failure mode in Google Photos.
        </p>
      </header>

      {/* Stepper navigation */}
      <Stepper stage={stage} setStage={setStage} taggingDone={taggingDone} />

      {/* Stage content */}
      <main>
        {stage === 1 && <Stage1Library />}
        {stage === 2 && (
          <Stage2Tagging
            tagsResult={tagsResult}
            setTagsResult={setTagsResult}
          />
        )}
        {stage === 3 && <Stage3Search tagsResult={tagsResult} />}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>
        Describe &amp; Find MVP · Built for Google Photos case study · AI tagging by Groq ·{' '}
        <a href="/admin" style={{ color: 'var(--text-dim)' }}>Admin</a>
      </footer>
    </div>
  );
}

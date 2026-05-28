import { useState } from 'react';
import PRInput from './components/PRInput';
import Summary from './components/Summary';
import ReviewComments from './components/ReviewComments';
import Loader from './components/Loader';
import './App.css';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleAnalyze(prUrl) {
    setLoading(true);
    setError(null);
    setResult(null);

    // In production VITE_API_URL points to the Render backend.
    // In local dev it's empty and Vite's proxy handles /api → localhost:3000.
    const base = import.meta.env.VITE_API_URL || '';

    try {
      const res = await fetch(`${base}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed. Please try again.');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo-row">
            <span className="logo-icon">🔍</span>
            <h1 className="logo-title">PRInsight</h1>
          </div>
          <p className="header-sub">
            Paste a GitHub PR link and get a code review back — what changed, what looks off,
            and which lines need a second look.
          </p>
        </div>
      </header>

      <main className="main">
        <PRInput onAnalyze={handleAnalyze} loading={loading} />

        {loading && <Loader />}

        {error && (
          <div className="error-card">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="results">
            <Summary summary={result.summary} pr={result.pr} />
            <ReviewComments comments={result.comments} />
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Express.js · Gemini 2.5 Flash · GitHub API · Works on public repos only</p>
      </footer>
    </div>
  );
}

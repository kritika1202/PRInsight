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

    try {
      const res = await fetch('/api/analyze', {
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
            Paste any public GitHub Pull Request URL and get an instant AI-powered
            code review — bugs, time complexity, security issues, and a full PR summary.
          </p>
          <div className="badges">
            <span className="badge">⚡ Powered by Gemini</span>
            <span className="badge">🐙 GitHub API</span>
            <span className="badge">🔒 No data stored</span>
          </div>
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
        <p>
          Built with <strong>Express.js</strong> · <strong>Gemini 1.5 Flash</strong> · <strong>GitHub API</strong>
        </p>
        <p className="footer-sub">Only analyzes public repositories</p>
      </footer>
    </div>
  );
}

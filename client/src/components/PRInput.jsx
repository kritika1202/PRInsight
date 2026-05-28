import { useState } from 'react';
import './PRInput.css';

export default function PRInput({ onAnalyze, loading }) {
  const [url, setUrl] = useState('');
  const [touched, setTouched] = useState(false);

  const isValid = /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(url.trim());
  const showError = touched && url.length > 0 && !isValid;

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || loading) return;
    onAnalyze(url.trim());
  }

  return (
    <div className="pr-input-wrapper">
      <form className="pr-input-form" onSubmit={handleSubmit}>
        <div className={`input-group ${showError ? 'input-group--error' : ''}`}>
          <span className="input-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878zm3.75 7.378a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm3-8.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z"/>
            </svg>
          </span>
          <input
            type="text"
            className="pr-input"
            placeholder="https://github.com/owner/repo/pull/123"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            disabled={loading}
            autoFocus
          />
        </div>

        {showError && (
          <p className="input-hint input-hint--error">
            Please enter a valid GitHub PR URL — e.g. <code>https://github.com/facebook/react/pull/1234</code>
          </p>
        )}

        <button
          type="submit"
          className="analyze-btn"
          disabled={!isValid || loading}
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              Analyzing…
            </>
          ) : (
            <>
              <span>🔍</span>
              Analyze PR
            </>
          )}
        </button>
      </form>

      <p className="input-hint">
        Works with any <strong>public</strong> GitHub pull request. Paste the full URL above.
      </p>
    </div>
  );
}

import { useState } from 'react';
import './ReviewComments.css';

function severityClass(severity) {
  return severity === '[critical]' ? 'critical' : 'suggestion';
}

function FileGroup({ path, comments }) {
  const [open, setOpen] = useState(true);
  const criticalCount = comments.filter((c) => c.severity === '[critical]').length;

  return (
    <div className="file-group">
      <button className="file-header" onClick={() => setOpen((v) => !v)}>
        <span className="chevron">{open ? '▾' : '▸'}</span>
        <span className="file-icon">📄</span>
        <span className="file-path">{path}</span>
        <span className="file-badges">
          {criticalCount > 0 && (
            <span className="badge badge--critical">{criticalCount} critical</span>
          )}
          <span className="badge badge--total">{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
        </span>
      </button>

      {open && (
        <div className="comment-list">
          {comments.map((c, i) => (
            <div key={i} className={`comment-item comment-item--${severityClass(c.severity)}`}>
              <div className="comment-meta">
                <span className={`severity-badge severity-badge--${severityClass(c.severity)}`}>
                  {c.severity === '[critical]' ? '🔴 Critical' : '🟡 Suggestion'}
                </span>
                <span className="comment-line">Line {c.line}</span>
              </div>
              <p className="comment-text">{c.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReviewComments({ comments }) {
  if (!comments || comments.length === 0) {
    return (
      <div className="review-card">
        <div className="review-header">
          <h2 className="review-title">Review</h2>
        </div>
        <div className="no-issues">
          <p>Nothing flagged — the diff looks fine.</p>
        </div>
      </div>
    );
  }

  const grouped = comments.reduce((acc, c) => {
    if (!acc[c.path]) acc[c.path] = [];
    acc[c.path].push(c);
    return acc;
  }, {});

  const criticalTotal = comments.filter((c) => c.severity === '[critical]').length;
  const suggestionTotal = comments.length - criticalTotal;

  return (
    <div className="review-card">
      <div className="review-header">
        <h2 className="review-title">Review</h2>
        <div className="review-totals">
          {criticalTotal > 0 && (
            <span className="badge badge--critical">{criticalTotal} critical</span>
          )}
          {suggestionTotal > 0 && (
            <span className="badge badge--suggestion">{suggestionTotal} suggestion{suggestionTotal !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      <div className="file-groups">
        {Object.entries(grouped).map(([path, fileComments]) => (
          <FileGroup key={path} path={path} comments={fileComments} />
        ))}
      </div>
    </div>
  );
}

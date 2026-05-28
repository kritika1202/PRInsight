import ReactMarkdown from 'react-markdown';
import './Summary.css';

export default function Summary({ summary, pr }) {
  return (
    <div className="summary-card">
      <div className="summary-header">
        <h2 className="summary-title">Summary</h2>
      </div>

      <div className="pr-meta">
        <img src={pr.authorAvatar} alt={pr.author} className="avatar" />
        <div className="pr-meta-info">
          <a href={pr.url} target="_blank" rel="noopener noreferrer" className="pr-link">
            {pr.title}
          </a>
          <span className="pr-author">by @{pr.author}</span>
        </div>
        <div className="pr-stats">
          <span className="stat stat--files">📁 {pr.filesChanged} file{pr.filesChanged !== 1 ? 's' : ''}</span>
          <span className="stat stat--add">+{pr.additions}</span>
          <span className="stat stat--del">−{pr.deletions}</span>
        </div>
      </div>

      <div className="summary-body">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </div>
  );
}

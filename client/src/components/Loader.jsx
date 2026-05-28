import './Loader.css';

const STEPS = [
  { icon: '↓', label: 'Fetching diff from GitHub' },
  { icon: '⋯', label: 'Parsing changed files' },
  { icon: '◎', label: 'Sending to Gemini' },
  { icon: '✓', label: 'Building review comments' },
];

export default function Loader() {
  return (
    <div className="loader-card">
      <div className="loader-spinner" />
      <p className="loader-title">Reviewing your PR, this takes ~10 seconds…</p>
      <ul className="loader-steps">
        {STEPS.map((step, i) => (
          <li key={i} className="loader-step" style={{ animationDelay: `${i * 0.4}s` }}>
            <span>{step.icon}</span>
            <span>{step.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

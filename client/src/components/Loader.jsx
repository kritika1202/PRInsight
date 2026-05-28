import './Loader.css';

const STEPS = [
  { icon: '🔗', label: 'Fetching PR diff from GitHub' },
  { icon: '🧩', label: 'Parsing changed files' },
  { icon: '🤖', label: 'Analyzing with Gemini AI' },
  { icon: '✍️', label: 'Generating review comments' },
];

export default function Loader() {
  return (
    <div className="loader-card">
      <div className="loader-spinner" />
      <p className="loader-title">Analyzing your Pull Request…</p>
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

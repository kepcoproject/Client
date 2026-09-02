import "./Badge.css";

export default function Badge({ tone = "neutral", dot, children }) {
  return (
    <span className={`badge tone-${tone}`}>
      {dot && <span className="badge-dot-indicator" />}
      {children}
    </span>
  );
}

import "./StatCard.css";

export default function StatCard({ label, value, unit, tone, icon: Icon }) {
  return (
    <div className={"stat-card" + (tone ? ` tone-${tone}` : "")}>
      <div className="stat-head">
        <div className="stat-label">{label}</div>
        {Icon && (
          <div className="stat-icon">
            <Icon size={15} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="stat-value">
        {value}
        {unit && <small>{unit}</small>}
      </div>
    </div>
  );
}

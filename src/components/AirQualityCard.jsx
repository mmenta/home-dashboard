// Read-only environment sensor tile.
export default function AirQualityCard({ entity, name, unitFallback }) {
  const value = entity?.state;
  const unit = entity?.attributes?.unit_of_measurement || unitFallback || "";
  const unavailable = !entity || value === "unavailable" || value === "unknown";

  return (
    <div className="card stat">
      <div className="title">{name}</div>
      <div className="value">
        {unavailable ? "—" : value}
        {!unavailable && <span className="unit">{unit}</span>}
      </div>
    </div>
  );
}

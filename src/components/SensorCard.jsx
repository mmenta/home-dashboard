// Aqara contact sensor: binary_sensor state "on" = open, "off" = closed.
export default function SensorCard({ entity, name }) {
  const open = entity?.state === "on";
  const unavailable = !entity || entity.state === "unavailable" || entity.state === "unknown";

  return (
    <div className={`card contact ${open ? "open" : "closed"}`}>
      <span className="dot">{open ? "🔓" : "🔒"}</span>
      <div className="card-titles">
        <div className="title">{name}</div>
        <div className="meta">{unavailable ? "Unavailable" : open ? "Open" : "Closed"}</div>
      </div>
    </div>
  );
}

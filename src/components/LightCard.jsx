import { useState } from "react";
import { turnOnLight, turnOffLight, setBrightness } from "../api/haClient.js";

export default function LightCard({ entity, name, onChanged }) {
  const [busy, setBusy] = useState(false);
  const on = entity?.state === "on";
  const brightness = entity?.attributes?.brightness; // 0-255
  const pct = brightness != null ? Math.round((brightness / 255) * 100) : on ? 100 : 0;

  async function toggle() {
    if (!entity) return;
    setBusy(true);
    try {
      on ? await turnOffLight(entity.entity_id) : await turnOnLight(entity.entity_id);
      await onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function onSlide(e) {
    if (!entity) return;
    const value = Number(e.target.value);
    setBusy(true);
    try {
      await setBrightness(entity.entity_id, value);
      await onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`card light ${on ? "on" : ""}`}>
      <div className="card-top">
        <span className="dot">{on ? "💡" : "○"}</span>
        <div className="card-titles">
          <div className="title">{name}</div>
          <div className="meta">{entity ? (on ? `${pct}%` : "Off") : "Unavailable"}</div>
        </div>
        <button className="toggle" disabled={!entity || busy} onClick={toggle}>
          {on ? "On" : "Off"}
        </button>
      </div>
      <input
        type="range"
        min="1"
        max="100"
        value={pct || 1}
        disabled={!entity || !on || busy}
        onChange={onSlide}
      />
    </div>
  );
}

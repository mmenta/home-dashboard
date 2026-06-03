// All calls go to our own BFF (relative URLs), which injects the HA token
// server-side. The browser never sees the Home Assistant token.

async function req(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${detail}`);
  }
  return res.status === 204 ? null : res.json();
}

export function getStates() {
  return req("/api/states");
}

export function getMe() {
  return req("/api/me");
}

// Generic service call.
export function callService(domain, service, payload) {
  return req(`/api/services/${domain}/${service}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Light helpers
export const turnOnLight = (entityId, extra = {}) =>
  callService("light", "turn_on", { entity_id: entityId, ...extra });
export const turnOffLight = (entityId) =>
  callService("light", "turn_off", { entity_id: entityId });
export const setBrightness = (entityId, brightnessPct) =>
  callService("light", "turn_on", { entity_id: entityId, brightness_pct: brightnessPct });

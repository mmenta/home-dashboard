import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HA_BASE_URL = (process.env.HA_BASE_URL || "http://homeassistant.local:8123").replace(/\/$/, "");
const HA_TOKEN = process.env.HA_TOKEN || "";
const PORT = process.env.PORT || 8080;
const TRUST_AUTH_HEADER = process.env.TRUST_AUTH_HEADER === "true";

if (!HA_TOKEN) {
  console.warn("[warn] HA_TOKEN is not set — Home Assistant calls will fail. Copy .env.example to .env.");
}

const app = express();
app.use(express.json());

// --- Helper: call the Home Assistant REST API with the server-side token ---
async function haFetch(haPath, options = {}) {
  const res = await fetch(`${HA_BASE_URL}${haPath}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${HA_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  return { ok: res.ok, status: res.status, body };
}

// Who am I — surfaced from Authelia's forwarded header (set by the auth proxy).
app.get("/api/me", (req, res) => {
  const user =
    (TRUST_AUTH_HEADER && (req.headers["remote-user"] || req.headers["x-forwarded-user"])) || "guest";
  res.json({ user: String(user) });
});

// All entity states (the dashboard filters down to the ones it cares about).
app.get("/api/states", async (_req, res) => {
  try {
    const { ok, status, body } = await haFetch("/api/states");
    res.status(ok ? 200 : status).json(body);
  } catch (e) {
    res.status(502).json({ error: "Cannot reach Home Assistant", detail: String(e) });
  }
});

// A single entity's state.
app.get("/api/states/:entityId", async (req, res) => {
  try {
    const { ok, status, body } = await haFetch(`/api/states/${encodeURIComponent(req.params.entityId)}`);
    res.status(ok ? 200 : status).json(body);
  } catch (e) {
    res.status(502).json({ error: "Cannot reach Home Assistant", detail: String(e) });
  }
});

// Call a service, e.g. POST /api/services/light/turn_on { entity_id, brightness_pct }
app.post("/api/services/:domain/:service", async (req, res) => {
  const { domain, service } = req.params;
  // Allow-list the domains the dashboard is permitted to control.
  const ALLOWED = new Set(["light", "switch", "fan", "cover"]);
  if (!ALLOWED.has(domain)) {
    return res.status(403).json({ error: `Domain '${domain}' is not permitted` });
  }
  try {
    const { ok, status, body } = await haFetch(`/api/services/${domain}/${service}`, {
      method: "POST",
      body: JSON.stringify(req.body || {}),
    });
    res.status(ok ? 200 : status).json(body);
  } catch (e) {
    res.status(502).json({ error: "Cannot reach Home Assistant", detail: String(e) });
  }
});

// --- Serve the built React app (production) ---
const distDir = path.join(__dirname, "..", "dist");
app.use(express.static(distDir));
app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));

app.listen(PORT, () => {
  console.log(`Home dashboard BFF listening on :${PORT} -> ${HA_BASE_URL}`);
});

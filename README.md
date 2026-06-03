# Home Dashboard

A public, auth-gated React dashboard for your home — Philips Hue lights, air-quality
monitors, and Aqara door/window sensors — all driven through Home Assistant.

## Architecture

Everything talks to **one backend: Home Assistant**. Hue, Aqara (via Zigbee), and your
air-quality sensors are all integrated into HA, so the dashboard only needs the HA API.

```
Internet
  │   https://yourname.duckdns.org
  ▼
[ Reverse proxy: Caddy or Nginx Proxy Manager ]  ── Let's Encrypt TLS (DuckDNS DNS-01)
  │
  ▼
[ Authelia ]  ── login + 2FA. Nothing passes until you authenticate.
  │   (sets Remote-User header)
  ▼
[ home-dashboard BFF (Node/Express, this repo) ]  ── holds the HA long-lived token
  │   /api/states, /api/services/*  ──►  Home Assistant REST API
  ▼
[ Home Assistant on Unraid ]  ──►  Hue Bridge · Aqara Zigbee · air-quality sensors
```

**Why the BFF (backend-for-frontend)?** A browser SPA cannot safely hold a Home
Assistant token — anyone could read it from the page. The tiny Express server in
`server/` keeps the token server-side and exposes only the narrow, allow-listed
endpoints the dashboard needs.

## Repo layout

```
home-dashboard/
├── index.html
├── package.json
├── vite.config.js
├── .env.example          → copy to .env, fill in HA_BASE_URL + HA_TOKEN
├── server/index.js       → BFF: serves the app + proxies to Home Assistant
└── src/
    ├── App.jsx
    ├── config/entities.js → EDIT THIS to match your entity IDs
    ├── api/haClient.js
    ├── hooks/useEntities.js
    └── components/        → LightCard, AirQualityCard, SensorCard, Header
```

---

## Part 1 — Get the devices into Home Assistant

You said HA already runs on your Unraid box. Make sure each device type is integrated:

- **Philips Hue** — Settings → Devices & Services → Add Integration → *Philips Hue*,
  then press the button on the bridge. Lights appear as `light.*` entities.
- **Aqara door/window sensors** — these are Zigbee. Pair them via *Zigbee2MQTT* or *ZHA*
  with a Zigbee coordinator (USB stick). They appear as `binary_sensor.*` (`on` = open).
- **Air-quality monitors** — integration depends on the device (e.g. *Airthings*,
  *AirGradient*, *ESPHome*, *Xiaomi*). Each metric becomes a `sensor.*` entity.

Find the exact entity IDs in **Developer Tools → States**, then list them in
`src/config/entities.js`. That file is the only place you map your home to the UI.

### Create a Home Assistant token for the BFF

HA → click your user (bottom left) → **Security** tab → **Long-lived access tokens**
→ *Create token*. Copy it into `.env` as `HA_TOKEN`. This is the credential the BFF
uses; it is never exposed to the browser.

---

## Part 2 — Run the app on your Ubuntu VM

On the Ubuntu VM (one of your Unraid VMs):

```bash
git clone <your repo> /opt/home-dashboard   # or copy this folder there
cd /opt/home-dashboard
cp .env.example .env        # then edit HA_BASE_URL + HA_TOKEN
npm install
npm run build               # produces dist/
npm start                   # BFF serves dist/ + proxies to HA on :8080
```

Use the **internal LAN** address for `HA_BASE_URL` (e.g. `http://192.168.1.x:8123`)
so dashboard↔HA traffic never leaves your network.

### Keep it running with systemd

`/etc/systemd/system/home-dashboard.service`:

```ini
[Unit]
Description=Home Dashboard BFF
After=network.target

[Service]
WorkingDirectory=/opt/home-dashboard
EnvironmentFile=/opt/home-dashboard/.env
ExecStart=/usr/bin/node server/index.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now home-dashboard
```

For local development instead: `npm run dev` (Vite on :5173, proxies `/api` to the BFF
on :8080 — run `npm run server` in another terminal).

---

## Part 3 — Expose it publicly with DuckDNS + reverse proxy + Authelia

### 3a. DuckDNS (free dynamic DNS)

1. Sign in at https://www.duckdns.org, create a subdomain, e.g. `yourname.duckdns.org`.
2. On Unraid, install the **DuckDNS** Docker container (Community Apps) and paste your
   token + subdomain. It keeps the DNS record pointed at your home IP.
3. Forward ports **80** and **443** on your router to the machine running the reverse
   proxy. (Forward *only* these — never expose 8123 or 8080 directly.)

### 3b. Reverse proxy + HTTPS

Easiest on Unraid is **Nginx Proxy Manager** (NPM) or **Caddy**. A minimal **Caddy**
config (`Caddyfile`) that terminates TLS and forwards to the BFF + Authelia:

```caddyfile
yourname.duckdns.org {
    # Send every request to Authelia first for an auth check
    forward_auth authelia:9091 {
        uri /api/verify?rd=https://yourname.duckdns.org
        copy_headers Remote-User Remote-Groups Remote-Email
    }
    reverse_proxy home-dashboard:8080
}
```

Use the **DNS-01 challenge** with the DuckDNS provider for the Let's Encrypt cert (works
even if port 80 is awkward, and supports wildcard). NPM has a DuckDNS DNS plugin in its
SSL tab; Caddy needs the `caddy-dns/duckdns` module.

### 3c. Authelia (the auth gate)

Authelia runs as a Docker container and is the login wall in front of everything.
Minimal `configuration.yml` essentials:

- One user in `users_database.yml` (argon2 password hash).
- An access-control rule requiring `two_factor` for `yourname.duckdns.org`.
- A `session` domain of `duckdns.org` and a strong `jwt_secret` / `session.secret`.

After a successful login Authelia sets the `Remote-User` header, which the BFF reads at
`/api/me` to greet you in the UI. Turn on TOTP (Google Authenticator) for real 2FA.

---

## Security checklist (do not skip)

- ✅ Forward **only 80/443** at the router; HA (8123) and the BFF (8080) stay LAN-only.
- ✅ All traffic over **HTTPS** — no plain HTTP from the internet.
- ✅ **Authelia 2FA** in front of the whole domain. Home controls are a high-value target.
- ✅ Long-lived HA token lives in `.env` on the server, **never** in the browser bundle.
- ✅ The BFF **allow-lists** controllable domains (`light`, `switch`, `fan`, `cover`).
- ✅ Consider **fail2ban** or Authelia's built-in rate limiting / regulation.
- ✅ Keep Unraid, HA, and Docker images **updated**.

> **Worth considering:** the most secure option is to skip public exposure entirely and
> reach the dashboard over a VPN like **Tailscale** or **WireGuard**. You get the same
> remote access with a far smaller attack surface — no open ports, no public login page.
> If you only need access from your own phone/laptop, this is strictly safer than DuckDNS.
> The public + Authelia setup above is the right choice if you need to share access or
> reach it from devices you can't install a VPN client on.

---

## Customising

- **Devices shown:** edit `src/config/entities.js`.
- **Refresh rate:** `POLL_INTERVAL` in the same file (default 5s).
- **More controls:** add service calls in `src/api/haClient.js` and a card component.
- **Live updates (optional upgrade):** swap REST polling for the HA WebSocket API,
  proxied through the BFF, for instant state changes instead of polling.

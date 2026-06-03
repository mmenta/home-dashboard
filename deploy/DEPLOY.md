# Deployment runbook — public dashboard on Unraid (tower.local)

Tailored to your server. Legend: 🧑 = you must do it · 🤖 = I can drive it in your browser · ⚙️ = a command on the server.

## What you already have (no action needed)
- DuckDNS container — keeps your home IP mapped to your DuckDNS subdomain ✓
- WireGuard — already a VPN into your LAN ✓ (kept as a private back door)
- Home Assistant — running as a VM ✓

## What we're adding
`home-dashboard` (this app) + `authelia` (login wall) + `swag` (TLS reverse proxy), all as containers on a shared `proxy` Docker network. Public flow:

```
Internet → YOURNAME.duckdns.org → router :443 → SWAG (TLS) → Authelia (login+2FA) → home-dashboard → Home Assistant VM
```

---

### Step 1 — Get the code onto the server  🧑 ⚙️
The project lives on your Mac. Put it on the server, e.g. into the appdata share:
```bash
# from a terminal on the server (Unraid web terminal works)
mkdir -p /mnt/user/appdata/home-dashboard
# then copy the project there — easiest is to push it to a git repo and:
git clone <your-repo> /mnt/user/appdata/home-dashboard
# (or use an SMB copy / rsync from your Mac)
```

### Step 2 — Fill in the config  🧑
In `deploy/`:
- `cp .env.example .env` → set `HA_TOKEN` and `DUCKDNS_TOKEN`.
- In `docker-compose.yml`: set `HA_BASE_URL` to your **Home Assistant VM's IP**, and `URL` to your DuckDNS subdomain.
- In `authelia/configuration.yml`: replace `YOURNAME` (3 places) and the three secrets:
  ```bash
  docker run --rm authelia/authelia:latest authelia crypto rand --length 64   # run 3x
  ```
- Create your login: `cp authelia/users_database.yml.example authelia/users_database.yml`, then
  ```bash
  docker run --rm authelia/authelia:latest authelia crypto hash generate argon2 --password 'YOUR_PASSWORD'
  ```
  and paste the hash in.
- In `swag/home-dashboard.conf`: replace `YOURNAME`. After SWAG's first run creates `/config`, copy this file into `swag/nginx/site-confs/`.

> I won't enter tokens, passwords, or secrets for you — that's a hard line for me. Everything above with a secret is yours to fill.

### Step 3 — Bring up the stack  ⚙️ (🤖 I can trigger via the Unraid terminal/Compose Manager)
```bash
cd /mnt/user/appdata/home-dashboard/deploy
docker compose up -d --build
```
On Unraid, install the **Compose Manager** plugin (Community Apps) to manage this from the UI — 🤖 I can do that install and add the stack. First SWAG boot generates certs (watch `docker logs swag`).

### Step 4 — Open the ports on your router  🧑
Forward **TCP 80 and 443** to the server (192.168.68.55). Forward *only* these. HA (8123) and the dashboard (8080) must never be exposed directly. This is on your router admin page — I can't reach that device.

### Step 5 — Verify  🤖 ⚙️
- `docker logs swag` shows a successful cert (`Server ready`).
- Visit `https://YOURNAME.duckdns.org` → you should hit the Authelia login → after login + TOTP enrollment, the dashboard loads. 🤖 I can drive this check in your browser.
- Edit `src/config/entities.js` with your real entity IDs and rebuild (`docker compose up -d --build`).

---

## Division of labor
- 🤖 I can do, in your browser: install **Compose Manager** + **SWAG**/**Authelia** via Community Apps, add/start the compose stack, and verify the live site.
- 🧑 Only you: router port-forwarding, and entering the HA token / DuckDNS token / Authelia password + secrets.

## Security notes
- 2FA (TOTP) is required by the Authelia rule — keep it on.
- Your WireGuard VPN stays as a private fallback; if you ever want to *reduce* exposure, you can close 80/443 and reach the dashboard over WireGuard instead with zero other changes.
- Keep SWAG/Authelia images updated; Authelia's regulation rule throttles brute-force attempts.

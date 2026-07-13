# CoreShield

A Node.js (Express) backend API for a security dashboard. CoreShield lets you manage protected domains (via Nginx reverse-proxy configs), block/unblock IP addresses (via CrowdSec or iptables), and pull basic traffic/attack statistics — all through a small, authenticated REST API.

## Features

- **Domain management** — register a domain, auto-generate an Nginx reverse-proxy vhost, test the config, and reload Nginx.
- **IP blocking** — block or unblock an IP address via the CrowdSec Local API or directly via `iptables`.
- **Statistics** — basic traffic and blocked-attack counts.
- **JWT authentication** with role-based authorization (`admin`, `operator`).
- **Security-first design**:
  - All system commands run via `execFile` (no shell interpolation) — command injection is not possible through user input.
  - Strict allow-list validation for domains and IPs.
  - Refuses to block private/loopback IP ranges.
  - `nginx -t` runs before every reload, so a bad config never goes live.
  - Helmet, CORS allow-list, and rate limiting on all routes.
  - Audit logging via Winston (`logs/audit.log`).

## Project structure
## Requirements

- Node.js 18+
- Nginx (for domain management features)
- CrowdSec with a Local API bouncer, **or** `iptables` with root privileges (for IP blocking)

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and fill in your own values — at minimum set a strong `JWT_SECRET` (32+ characters).

```bash
npm start        # production
npm run dev       # with nodemon, auto-restart
```

The API listens on `PORT` (default `4000`) under the `/api/v1` prefix.

## Environment variables

See `.env.example` for the full list. Key ones:

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret used to sign/verify auth tokens. Required, 32+ chars in production. |
| `NGINX_SITES_AVAILABLE` / `NGINX_SITES_ENABLED` | Paths to your Nginx config directories. |
| `NGINX_RELOAD_CMD` | Command used to reload Nginx (e.g. `systemctl reload nginx`). |
| `BLOCK_METHOD` | `crowdsec` or `iptables`. |
| `CROWDSEC_BOUNCER_API` / `CROWDSEC_BOUNCER_API_KEY` | CrowdSec Local API connection details. |
| `CORS_ORIGIN` | Comma-separated list of allowed dashboard origins. |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | API rate limiting. |

**Never commit `.env`.** It's already excluded via `.gitignore`.

## API

All endpoints below are under `/api/v1` and (except `/health`) require `Authorization: Bearer <JWT>`.

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/health` | — | Liveness check |
| GET | `/domains` | any authenticated | List protected domains |
| POST | `/domains` | admin, operator | Add a domain (writes Nginx vhost, tests config, reloads) |
| DELETE | `/domains/:domain` | admin | Remove a domain |
| POST | `/security/block-ip` | admin, operator | Block an IP address |
| DELETE | `/security/block-ip/:ip` | admin, operator | Unblock an IP address |
| GET | `/stats` | any authenticated | Traffic and blocked-attack statistics |

### Example: add a domain

```bash
curl -X POST http://localhost:4000/api/v1/domains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domain": "app.example.com", "upstream": "127.0.0.1:8080"}'
```

### Example: block an IP

```bash
curl -X POST http://localhost:4000/api/v1/security/block-ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.42", "duration": "4h", "reason": "brute force"}'
```

## Production notes

- Replace `domainStore.js` (in-memory) with a real database.
- Run the Node process under a **least-privilege user**, with sudoers rules scoped only to the exact `nginx`/`iptables` commands it needs — do not run as root.
- Wire `statsService.js`'s traffic field to a real metrics source (Prometheus, GoAccess, etc.).
- This project does not include a login/token-issuance endpoint — it assumes JWTs are issued by an existing auth service.

## License

Add your preferred license here (e.g. MIT).

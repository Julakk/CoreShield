# CoreShield

A security dashboard for managing server-side protections: Nginx-backed domain protection, IP blocking (CrowdSec or iptables), and traffic/attack statistics — with a Node.js/Express API and a Next.js dashboard.

This is a monorepo with two projects:

## Backend (`/`)

Express API for managing protected domains, blocking IPs, and reporting stats.

### Features

- **Domain management** — register a domain, auto-generate an Nginx reverse-proxy vhost, test the config, and reload Nginx. Existing domains can also be protected in a safe snippet mode (`NGINX_SNIPPETS_DIR`) without CoreShield owning the whole vhost.
- **IP blocking** — block/unblock via CrowdSec Local API or `iptables` (routed through a sudo-scoped shell script, see `scripts/`), with GeoIP country lookup for blocked IPs.
- **Statistics** — traffic and blocked-attack counts.
- **Authentication** — login with a single admin account, password change endpoint, and JWT sessions (HS256). Changing the password revokes all previously issued tokens.
- **Audit log and alerts** — login attempts, password changes and other actions are recorded in an audit log; failed logins and password changes can notify a Discord webhook.
- **Security-first design** — commands run via `execFile` (no shell interpolation), strict allow-list validation for domains/IPs, refuses to block private/loopback ranges, `nginx -t` runs before every reload, Helmet + CORS allow-list + rate limiting (stricter on login), audit logging via Winston.

### Requirements

- Node.js 22.13 or newer (the SQLite store uses the built-in `node:sqlite` module, so no native dependencies to compile; Node may print an experimental warning).

### Setup

```bash
npm install
cp .env.example .env
# edit .env — see the notes below
npm start        # production
npm run dev       # local dev, auto-restart
```

API listens on `PORT` (default `4000`) under `/api/v1`. See inline comments in `.env.example` for all variables.

Key variables:

- `JWT_SECRET` — required, at least 32 characters in production.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — used **once**, to create `data/admin.json` on first start. `ADMIN_PASSWORD` must be set in production. Changing it in `.env` afterwards has no effect; use the change-password endpoint, or delete `data/admin.json` and restart to re-create the account.
- `DB_PATH` — SQLite database file (default `data/coreshield.db`). The folder must exist or be creatable by the user running the service.
- `NGINX_SNIPPETS_DIR` — where snippet-mode protection files are written.
- `NODE_ENV=production` — required on real servers; in development, error responses include stack traces.

### Data

- `data/coreshield.db` — registered domains (SQLite). An existing `domains.json` from older versions is imported automatically on first start if the table is empty, and older database schemas are migrated in place.
- `data/admin.json` — admin username and password hash (PBKDF2-SHA256, file mode `0600`). Hashes created with fewer iterations are upgraded on the next successful login.
- The `data/` folder is gitignored. Back it up.

### Firewall script

`scripts/manage_firewall.sh` is a standalone, strictly-validated script for blocking/unblocking a single IP via `iptables`/`ip6tables`. It's meant to be run via a narrowly-scoped `sudo` rule (see `scripts/coreshield-sudoers.example`) so the Node process itself never needs root. See that file for install steps.

## Dashboard (`/dashboard`)

Next.js + Tailwind + TypeScript dark-mode dashboard UI.

### Features

- Sidebar navigation: Account Home, Domains, Security, Analytics.
- Account Home: Web Traffic chart (Recharts), Attack Threats Blocked, Cache Rate, and supporting stat cards.
- Typed fetch client (`lib/api.ts`) wired to the backend's `/api/v1` routes, with a polling hook (`lib/use-stats.ts`) that gracefully falls back to demo data if the backend is unreachable.

### Setup

```bash
cd dashboard
npm install
cp .env.example .env.local
# edit .env.local — point NEXT_PUBLIC_API_URL at your running backend
npm run dev
```

See `dashboard/CHANGELOG.md` for version history and `dashboard/README.md` for more detail.

## Production notes

- Set `NODE_ENV=production`, a strong `JWT_SECRET`, and a strong `ADMIN_PASSWORD`.
- Run the backend under a **least-privilege system user**, granted access only to the specific firewall script via sudoers — never run as root.
- Never commit `.env` or `.env.local` — both are gitignored. Keep real secrets only on the server that runs the service, not on a development machine.
- Back up the `data/` folder (domains database and admin credentials).
- Some dashboard stat cards (for example Cache Rate and Avg. Response Time) may still show placeholder values; check them against real backend fields before going live.

## License

MIT — see [LICENSE](LICENSE).

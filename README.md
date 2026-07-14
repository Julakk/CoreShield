# CoreShield

A security dashboard for managing server-side protections: Nginx-backed domain protection, IP blocking (CrowdSec or iptables), and traffic/attack statistics — with a Node.js/Express API and a Next.js dashboard.

This is a monorepo with two projects:
## Backend (`/`)

Express API for managing protected domains, blocking IPs, and reporting stats.

### Features
- **Domain management** — register a domain, auto-generate an Nginx reverse-proxy vhost, test the config, and reload Nginx.
- **IP blocking** — block/unblock via CrowdSec Local API or `iptables` (routed through a sudo-scoped shell script, see `scripts/`).
- **Statistics** — traffic and blocked-attack counts.
- **JWT authentication** with role-based authorization (`admin`, `operator`).
- **Security-first design** — commands run via `execFile` (no shell interpolation), strict allow-list validation for domains/IPs, refuses to block private/loopback ranges, `nginx -t` runs before every reload, Helmet + CORS allow-list + rate limiting, audit logging via Winston.

### Setup
```bash
npm install
cp .env.example .env
# edit .env — set a strong JWT_SECRET (32+ chars) and your Nginx/CrowdSec config
npm start        # production
npm run dev       # local dev, auto-restart
```

API listens on `PORT` (default `4000`) under `/api/v1`. See inline comments in `.env.example` for all variables.

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

- Replace the in-memory domain store (`src/services/domainStore.js`) with a real database.
- Run the backend under a **least-privilege system user**, granted access only to the specific firewall script via sudoers — never run as root.
- Never commit `.env` or `.env.local` — both are gitignored. Keep real secrets only on the server that runs the service, not on a development machine.
- Wire the dashboard's placeholder stats (Cache Rate, Protected Domains count, Avg. Response Time) to real backend fields before going live.
- This project doesn't include a login/token-issuance endpoint — it assumes JWTs are issued by an existing auth service.

## License

Add your preferred license here (e.g. MIT).

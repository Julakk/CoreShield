# Changelog

All notable changes to the CoreShield Dashboard are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

## [Unreleased]

### Planned
- Site-wide traffic and threat analytics (currently only tracks requests hitting the CoreShield API itself, not Nginx-wide traffic across protected domains).
- Wire `Cache Rate` and `Total Requests` to a real data source (Nginx cache zone stats, access-log aggregation) — both currently return `null`/"N/A" honestly rather than a fake number, pending that integration.
- True geo/ASN-based blocking (requires a GeoIP database and Nginx module on the actual VPS — not something that can be built at the application-code level alone). CIDR-range blocking (v1.5.0) is the practical stand-in until then.
- Multi-user auth (currently single-admin login via `ADMIN_USERNAME`/`ADMIN_PASSWORD`, with in-place password changes via `data/admin.json`).
- Production deployment to a real VPS + domain (`ahmadhosting.my.id`).

## [1.5.0] - 2026-07-18

### Added
- **Per-domain rate limiting** — the "Add a domain" form now accepts an optional requests/second limit. Backend generates a proper Nginx `limit_req_zone`/`limit_req` pair scoped to that domain's vhost file.
- **Automatic SSL via Let's Encrypt** — an "Auto SSL" checkbox on Add Domain triggers `certbot --nginx` after the vhost is written and Nginx reloaded. Requires `certbot` installed on the host and `CERTBOT_EMAIL` configured; SSL failure (e.g. DNS not propagated yet) doesn't block the domain from being added — it stays live over HTTP and SSL can be retried later.
- **CIDR-range IP blocking** — Security page and backend now accept CIDR notation (e.g. `203.0.113.0/24`) alongside single IPs, for blocking an entire subnet at once. `manage_firewall.sh` validates and passes ranges through to `iptables`/`ip6tables` natively; CrowdSec mode uses the `Range` decision scope instead of `Ip` when a CIDR is detected.
- Domains list now shows `SSL` and rate-limit badges per domain.

### Changed
- `isValidIp`/`isBlockableIp` validators generalized to `isValidIpOrCidr` throughout the security/blocking code path.

## [1.4.0] - 2026-07-17

### Added
- **Public status page** (`/status`) — a landing-page-style, unauthenticated page anyone can view, showing live aggregate protection stats: domains protected, threats blocked (24h), active IP blocks, and average response time.
- Backend: `GET /api/v1/public/status` — a new, intentionally unauthenticated endpoint that returns only a curated, safe subset of stats. It never exposes domain names, blocked IP addresses, or any admin/account info.

### Security
- The public endpoint was deliberately built as a separate route (`src/routes/public.js`) rather than relaxing auth on the existing `/stats` endpoint, so the set of publicly-exposed fields is explicit and reviewable in one place.

## [1.3.0] - 2026-07-17

### Added
- **Full UI/UX polish pass** on the login page and Account Home dashboard:
  - Login page: ambient background (faint grid + soft radial glow), animated shield icon, show/hide password toggle, smooth fade-in transitions.
  - Account Home: time-of-day greeting, "last updated" timestamp, and a new **Quick Actions** row (Add a domain / Block an IP / View analytics).
  - All stat cards gained hover micro-interactions and a proper loading skeleton.
- Backend: `PATCH /api/v1/auth/password` (change admin password, PBKDF2-hashed storage in `data/admin.json`) and `GET /api/v1/auth/system-info`.
- Backend: `GET /api/v1/security/block-ip` to list currently blocked IPs.
- Frontend: functional **Settings** page (password change + system info), **Security** page (block/unblock with confirmation), **Domains** page (add/remove with confirmation).
- New reusable UI primitives: `ToastProvider`/`useToast`, `ConfirmDialog`.
- Analytics page gained a second chart: average response time per hour.

### Fixed
- `tailwindcss-animate` was installed but never registered with Tailwind v4 — fixed by adding `@plugin "tailwindcss-animate";` to `globals.css`.

### Security
- Admin password stored as a salted PBKDF2 hash (100,000 iterations), never plaintext. `data/` is gitignored.

## [1.2.0] - 2026-07-15

### Added
- **Login flow**: `/login` page, `POST /api/v1/auth/login`, token stored in `localStorage`, "Sign out" button.
- **Functional Domains page**: add/list/remove domains via the backend's Nginx vhost management endpoints.
- **Functional Security page**: block/unblock IPs via the backend's CrowdSec/iptables endpoints.
- **Functional Analytics page**: real hourly request-count chart backed by `GET /api/v1/stats/history`.
- **Real stats wiring**: `Protected Domains`, `Avg. Response Time`, and `Cache Rate` now read from the backend. `Cache Rate` and `Total Requests` honestly show "N/A" rather than a fabricated number.

### Fixed
- Hydration mismatch from locale-dependent `toLocaleString()` — pinned to `en-US` via `lib/format.ts`.
- `TypeError: react.createContext is not a function` on `/domains` and `/settings` — caused by stale `.next` cache after Termux was killed mid-session.
- Next.js dev server EACCES errors on Android/Termux — fixed via `WATCHPACK_POLLING=true`.
- `next.config.ts` failing to load (`__dirname is not defined`) — fixed via `process.cwd()`.

## [1.0.0] - 2026-07-14

### Added
- Initial Next.js 14 + Tailwind + shadcn-style dashboard scaffold.
- Dark-mode-first design system with CoreShield's own signal-cyan accent (`#22e5c9`) and JetBrains Mono for all numeric/tabular data.
- Sidebar navigation: Account Home, Domains, Security, Analytics, Settings.
- Dashboard home page with Web Traffic chart, Attack Threats Blocked, Cache Rate, and other stat cards.
- `lib/api.ts` — typed fetch client with Bearer token support.
- `lib/use-stats.ts` — polling hook with graceful demo-data fallback.

### Changed
- Accent color changed from initial scaffold default (`#f6821f`, Cloudflare's brand orange) to CoreShield's own signal-cyan (`#22e5c9`).

---

## Related repositories

This project lives in the same monorepo as the [CoreShield API](https://github.com/Julakk/CoreShield) — Express backend (domains, IP blocking, stats, auth, public status).

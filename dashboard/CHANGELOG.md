# Changelog

All notable changes to the CoreShield Dashboard are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

## [Unreleased]

### Planned
- Site-wide traffic and threat analytics (currently only tracks requests hitting the CoreShield API itself, not Nginx-wide traffic across protected domains).
- Wire `Cache Rate` and `Total Requests` to a real data source (Nginx cache zone stats, access-log aggregation).
- True geo/ASN-based blocking (requires a GeoIP database and Nginx module on the actual VPS). CIDR-range blocking (v1.5.0) is the practical stand-in until then.
- Multi-user auth (currently single-admin login).
- Persistent audit log (currently in-memory, resets on restart — replace with a database or file-backed store for production).
- Production deployment to a real VPS + domain (`ahmadhosting.my.id`).

## [1.6.0] - 2026-07-18

### Added
- **Discord webhook notifications** — real-time alerts posted to a configured Discord channel for: domain added/removed, IP blocked/unblocked, admin password changed, and failed login attempts. Configured via `DISCORD_WEBHOOK_URL`; if unset, notifications are silently skipped (never blocks or fails the underlying request).
- **Audit Log page** — new `/audit-log` page and sidebar entry showing a timestamped history of every security-relevant action (who did what, when, and to what target), backed by a new `GET /api/v1/audit-log` endpoint.
- **CSV export** — "Export CSV" buttons added to the Domains, Security, and Audit Log pages, generating a downloadable CSV client-side from the currently-loaded data (`lib/csv-export.ts`).

### Security
- Failed login attempts are now both audit-logged and pushed to Discord in real time, so repeated failed attempts are visible immediately rather than only in server logs.

## [1.5.0] - 2026-07-18

### Added
- **Per-domain rate limiting** — optional requests/second limit on Add Domain, implemented as a proper Nginx `limit_req_zone`/`limit_req` pair scoped to that domain's vhost.
- **Automatic SSL via Let's Encrypt** — "Auto SSL" checkbox triggers `certbot --nginx` after the vhost is written; SSL failure doesn't block the domain from being added.
- **CIDR-range IP blocking** — Security page and backend now accept CIDR notation (e.g. `203.0.113.0/24`) for blocking an entire subnet at once, across both iptables and CrowdSec modes.
- Domains list now shows `SSL` and rate-limit badges per domain.

## [1.4.0] - 2026-07-17

### Added
- **Public status page** (`/status`) — unauthenticated page showing live aggregate protection stats.
- Backend: `GET /api/v1/public/status` — curated, safe subset of stats only, no sensitive infrastructure details.

## [1.3.0] - 2026-07-17

### Added
- Full UI/UX polish pass on login page and Account Home (ambient background, quick actions, greeting, hover animations).
- Backend: change password (`PATCH /api/v1/auth/password`), system info (`GET /api/v1/auth/system-info`), list blocked IPs (`GET /api/v1/security/block-ip`).
- Functional Settings, Security, and Domains pages with confirmation dialogs and toast notifications.
- Analytics page gained a second chart: average response time per hour.

### Fixed
- `tailwindcss-animate` plugin registration missing from `globals.css`.

### Security
- Admin password stored as a salted PBKDF2 hash, never plaintext.

## [1.2.0] - 2026-07-15

### Added
- Login flow, functional Domains/Security/Analytics pages wired to the real backend, real stats wiring on Account Home.

### Fixed
- Hydration mismatch from locale-dependent number formatting.
- Stale `.next` cache and Android/Termux dev-server EACCES/ESM config issues.

## [1.0.0] - 2026-07-14

### Added
- Initial Next.js + Tailwind dashboard scaffold with CoreShield's dark, signal-cyan design system.
- Sidebar navigation, dashboard home page, typed API client with demo-data fallback.

### Changed
- Accent color changed from scaffold default (Cloudflare's brand orange) to CoreShield's own signal-cyan.

---

## Related repositories

This project lives in the same monorepo as the [CoreShield API](https://github.com/Julakk/CoreShield) — Express backend (domains, IP blocking, stats, auth, audit log, public status, Discord notifications).

# Changelog

All notable changes to the CoreShield Dashboard are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

## [Unreleased]

### Planned
- Site-wide traffic and threat analytics (currently only tracks requests hitting the CoreShield API itself, not Nginx-wide traffic across protected domains).
- Wire `Cache Rate` and `Total Requests` to a real data source (Nginx cache zone stats, access-log aggregation).
- True geo/ASN-based blocking (requires a GeoIP database and Nginx module on the actual VPS). CIDR-range blocking (v1.5.0) is the practical stand-in until then.
- Multi-user auth with role-based accounts (currently single-admin login).
- Persistent audit log (currently in-memory, resets on restart).
- Production deployment to a real VPS + domain (`ahmadhosting.my.id`).

## [1.7.0] - 2026-07-18

### Added
- **Search & filter** on Domains, Security, and Audit Log pages — a search box on each (matching domain/upstream, IP/reason, or actor/action/target respectively), plus an action-type dropdown filter on Audit Log. All client-side, no backend changes required.
- New reusable `SearchInput` component (`components/ui/search-input.tsx`) used across all three pages.
- Result counts now show "X of Y" so it's clear when a filter is active, and CSV export respects the current filter (exports what's visible, not the full unfiltered list).

## [1.6.0] - 2026-07-18

### Added
- **Discord webhook notifications** — real-time alerts for domain added/removed, IP blocked/unblocked, admin password changed, and failed login attempts. Configured via `DISCORD_WEBHOOK_URL`; silently skipped if unset.
- **Audit Log page** — new `/audit-log` page and sidebar entry, backed by `GET /api/v1/audit-log`.
- **CSV export** — "Export CSV" buttons on Domains, Security, and Audit Log pages.

### Security
- Failed login attempts are audit-logged and pushed to Discord in real time.

## [1.5.0] - 2026-07-18

### Added
- **Per-domain rate limiting** via Nginx `limit_req_zone`/`limit_req`.
- **Automatic SSL via Let's Encrypt** — "Auto SSL" checkbox triggers `certbot --nginx` on domain add.
- **CIDR-range IP blocking** — Security page and backend accept CIDR notation for blocking entire subnets.

## [1.4.0] - 2026-07-17

### Added
- **Public status page** (`/status`) — unauthenticated page showing live aggregate protection stats via `GET /api/v1/public/status`, exposing only safe curated fields.

## [1.3.0] - 2026-07-17

### Added
- Full UI/UX polish pass on login page and Account Home (ambient background, quick actions, greeting, hover animations).
- Change password, system info, list blocked IPs endpoints.
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

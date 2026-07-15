# Changelog

All notable changes to the CoreShield Dashboard are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

## [Unreleased]

### Planned
- Site-wide traffic and threat analytics (currently only tracks requests hitting the CoreShield API itself, not Nginx-wide traffic across protected domains).
- Wire `Cache Rate` and `Total Requests` to a real data source (Nginx cache zone stats, access-log aggregation) — both currently return `null`/"N/A" honestly rather than a fake number, pending that integration.
- Settings page (currently a placeholder).
- Multi-user auth (currently single-admin login via `ADMIN_USERNAME`/`ADMIN_PASSWORD`).
- Production deployment to a real VPS + domain (`ahmadfivem.my.id`).

## [1.2.0] - 2026-07-15

### Added
- **Login flow**: `/login` page, `POST /api/v1/auth/login` on the backend (single-admin, timing-safe password comparison, dedicated stricter rate limit), token stored in `localStorage`, "Sign out" button in the topbar.
- **Functional Domains page**: add/list/remove domains through a real form, wired to the backend's Nginx vhost management endpoints.
- **Functional Security page**: block/unblock IPs through a real form, wired to the backend's CrowdSec/iptables endpoints. Backend gained `GET /api/v1/security/block-ip` (list currently blocked IPs) and an in-memory `ipBlockStore` to support it.
- **Functional Analytics page**: real hourly request-count chart backed by a new `GET /api/v1/stats/history` endpoint and an in-memory `trafficHistoryStore` on the backend — genuine data, not a demo dataset.
- **Real stats wiring**: `Protected Domains`, `Avg. Response Time`, and `Cache Rate` on Account Home now read from the backend instead of hardcoded values. `Avg. Response Time` is measured by a new `responseTimeTracker` middleware. `Cache Rate` and `Total Requests` honestly show "N/A" rather than a fabricated number, since no real data source is wired up yet.

### Fixed
- Hydration mismatch caused by locale-dependent `toLocaleString()` calls — pinned to `en-US` via a new `lib/format.ts` helper used everywhere numbers are displayed.
- `TypeError: react.createContext is not a function` on `/domains` and `/settings` — caused by stale/corrupted `.next` build cache after the Termux process was killed mid-session; resolved by clearing `.next`.
- Next.js dev server EACCES errors on Android/Termux (`Watchpack Error: permission denied, watch '/data'`) that made every page load take 10–45 seconds — fixed by enabling `WATCHPACK_POLLING=true` in `.env.local`, which switches the file watcher to polling mode instead of native filesystem events.
- `next.config.ts` failing to load (`__dirname is not defined in ES module scope`) — fixed by using `process.cwd()` instead of `path.join(__dirname)`, since the config is loaded as an ES module here.
- Multi-lockfile workspace-root warning — fixed via `outputFileTracingRoot` in `next.config.ts`.

## [1.0.0] - 2026-07-14

### Added
- Initial Next.js 14 + Tailwind + shadcn-style dashboard scaffold.
- Dark-mode-first design system (`globals.css`) with CoreShield's own signal-cyan accent (`#22e5c9`), navy-black background, and JetBrains Mono for all numeric/tabular data.
- Sidebar navigation: Account Home, Domains, Security, Analytics, Settings.
- Dashboard home page with:
  - Web Traffic card (Recharts area chart, requests vs. blocked)
  - Attack Threats Blocked stat card
  - Cache Rate stat card
  - Total Requests, Active IP Blocks, Protected Domains, Avg. Response Time stat cards
- `lib/api.ts` — typed fetch client for the CoreShield Express backend, with Bearer token support.
- `lib/use-stats.ts` — polling hook (30s interval) with graceful fallback to demo data if the backend is unreachable.
- Placeholder pages for Domains, Security, Analytics, Settings routes.

### Changed
- Accent color changed from initial scaffold default (`#f6821f`, Cloudflare's brand orange) to CoreShield's own signal-cyan (`#22e5c9`) to establish a distinct visual identity.

---

## Related repositories

This project lives in the same monorepo as the [CoreShield API](https://github.com/Julakk/CoreShield) — Express backend (domains, IP blocking, stats, auth).

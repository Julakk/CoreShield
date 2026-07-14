# Changelog

All notable changes to the CoreShield Dashboard are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

## [Unreleased]

### Planned
- Wire `Cache Rate`, `Protected Domains`, and `Avg. Response Time` cards to real backend fields (currently hardcoded demo values in `dashboard-grid.tsx`).
- Add authentication flow (login page) so `coreshield_token` is set via a real session instead of manually via `localStorage`.
- Add a real time-series traffic endpoint (`GET /stats/traffic?range=24h`) on the backend to replace the demo dataset in `traffic-chart-card.tsx`.

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

- [CoreShield API](https://github.com/Julakk/CoreShield) — Express backend (domains, IP blocking, stats)

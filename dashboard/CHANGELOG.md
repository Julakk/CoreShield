# Changelog

All notable changes to the CoreShield Dashboard are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

## [Unreleased]

### Planned
- Real traffic parsing per-domain from Nginx access logs (currently Analytics only tracks requests hitting the CoreShield API itself).
- True geo/ASN-based blocking (requires a GeoIP database and Nginx module on the actual VPS). CIDR-range blocking remains the practical stand-in.
- Multi-user auth with role-based accounts (currently single-admin login).
- Production deployment to a VPS (previous deployment on a Linode instance was rolled back — see v2.0.0 notes).

## [2.0.0] - 2026-08-06

### Added
- **"Protect an existing domain" mode** — a new toggle on the Domains page for domains that already have their own Nginx vhost managed by another application (e.g. a control panel like Pterodactyl). Instead of creating a competing `server{}` block, CoreShield generates a standalone protection snippet (WAF-lite rules, rate limiting, connection limiting) and shows step-by-step manual wiring instructions — it **never** auto-edits a config file it didn't create, and never auto-reloads Nginx for this mode. Backend: `POST /api/v1/domains/protect-existing`, `src/services/nginxService.js#protectExistingDomain`.
- **GeoIP country lookup for blocked IPs** — the Security page now shows the country (name + code) for each blocked IP, via a new `src/services/geoLookup.js` using the free ip-api.com API with in-memory caching. Read-only and informational only — does not block or allow traffic by country.
- `DomainRecord` now tracks a `mode` field (`"managed"` vs `"existing"`) and, for existing-domain protection, a `snippetPath`.

### Fixed
- `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` in production — Express wasn't configured to trust the Nginx reverse proxy in front of it, causing `express-rate-limit` to reject requests carrying an `X-Forwarded-For` header. Fixed with `app.set('trust proxy', 1)`.

### Notes
- This release was built and validated during a real VPS deployment (Linode, alongside an existing Pterodactyl panel). The "protect existing domain" feature was specifically driven by that deployment: the correct approach for `panel.<domain>` turned out to be snippet + manual wiring rather than CoreShield's normal automated vhost creation, since the domain already had its own certbot-managed config.
- The `protectExistingDomain` Nginx config generation was verified with a real `nginx -t` against a reconstructed copy of the actual `pterodactyl.conf` structure before being shipped.
- That specific VPS deployment was later torn down (the app was removed cleanly — Pterodactyl was never affected) with plans to redeploy on a new VPS; this release captures the code produced during that deployment.

## [1.9.0] - 2026-07-20

### Added
- **Advanced Protection** (WAF-lite) — pattern-based blocking of common attack signatures, known scanner User-Agent blocking, and per-IP connection limiting, enabled via a checkbox on Add Domain.

## [1.8.0] - 2026-07-18

### Added
- **Persistent storage** — domains, blocked IPs, and the audit log are saved to JSON files under `data/` and survive backend restarts, via `src/utils/jsonStore.js` with atomic writes.

## [1.7.0] - 2026-07-18

### Added
- **Search & filter** on Domains, Security, and Audit Log pages, plus an action-type dropdown filter on Audit Log.

## [1.6.0] - 2026-07-18

### Added
- **Discord webhook notifications**, **Audit Log page**, **CSV export** on Domains, Security, and Audit Log pages.

## [1.5.0] - 2026-07-18

### Added
- **Per-domain rate limiting**, **Automatic SSL via Let's Encrypt**, **CIDR-range IP blocking**.

## [1.4.0] - 2026-07-17

### Added
- **Public status page** (`/status`) — unauthenticated page showing live aggregate protection stats.

## [1.3.0] - 2026-07-17

### Added
- Full UI/UX polish pass, change password/system info endpoints, functional Settings/Security/Domains pages, second Analytics chart.

### Security
- Admin password stored as a salted PBKDF2 hash, never plaintext.

## [1.2.0] - 2026-07-15

### Added
- Login flow, functional Domains/Security/Analytics pages wired to the real backend.

## [1.0.0] - 2026-07-14

### Added
- Initial Next.js + Tailwind dashboard scaffold with CoreShield's dark, signal-cyan design system.

### Changed
- Accent color changed from scaffold default (Cloudflare's brand orange) to CoreShield's own signal-cyan.

---

## Related repositories

This project lives in the same monorepo as the [CoreShield API](https://github.com/Julakk/CoreShield) — Express backend (domains, IP blocking, stats, auth, audit log, public status, Discord notifications, persistent storage, WAF-lite protection, GeoIP lookup, existing-domain protection).

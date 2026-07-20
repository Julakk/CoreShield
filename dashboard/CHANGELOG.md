# Changelog

All notable changes to the CoreShield Dashboard are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

## [Unreleased]

### Planned
- Site-wide traffic and threat analytics (currently only tracks requests hitting the CoreShield API itself, not Nginx-wide traffic across protected domains).
- Wire `Cache Rate` and `Total Requests` to a real data source (Nginx cache zone stats, access-log aggregation).
- True geo/ASN-based blocking and real DDoS scrubbing (requires infrastructure a single VPS can't provide — GeoIP database, anycast network). CIDR-range blocking and connection limiting are the practical stand-ins.
- Multi-user auth with role-based accounts (currently single-admin login).
- Production deployment to a real VPS + domain (`ahmadhosting.my.id`).

## [1.9.0] - 2026-07-20

### Added
- **Advanced Protection** (WAF-lite) — a new "Advanced Protection" checkbox on Add Domain that enables, per domain:
  - Pattern-based blocking of common attack signatures (SQL injection, XSS, path traversal, sensitive-file probing like `.env`/`.git`/`wp-config.php`) at the Nginx level.
  - Known scanner/exploit-tool User-Agent blocking (sqlmap, nikto, nmap, masscan, nessus, acunetix, w3af, havij, dirbuster, wpscan).
  - Per-IP connection limiting (`limit_conn`), configurable via `maxConnections`, defaulting to 20 concurrent connections when Advanced Protection is on.
- Domains list now shows a "Protected" badge for domains with Advanced Protection enabled.
- Discord domain-added notifications now include WAF protection status.

### Notes
- This is inspired by Gcore/Cloudflare-style protection, but is honestly scoped: it's Nginx-level pattern matching and connection limiting, not a full WAF engine (ModSecurity) or real network-level DDoS scrubbing — those require infrastructure beyond a single application/VPS. It catches the large majority of unsophisticated/automated scanning traffic, which is most of what hits a typical server.
- The generated Nginx config (rate limiting, connection limiting, and WAF rules together) was validated with a real `nginx -t` during development, not just manual review.

## [1.8.0] - 2026-07-18

### Added
- **Persistent storage** — domains, blocked IPs, and the audit log are now saved to JSON files under `data/` and survive backend restarts or crashes, via a new `src/utils/jsonStore.js` utility with atomic writes.

## [1.7.0] - 2026-07-18

### Added
- **Search & filter** on Domains, Security, and Audit Log pages, plus an action-type dropdown filter on Audit Log.

## [1.6.0] - 2026-07-18

### Added
- **Discord webhook notifications** for domain/IP/password events and failed logins.
- **Audit Log page** backed by `GET /api/v1/audit-log`.
- **CSV export** on Domains, Security, and Audit Log pages.

## [1.5.0] - 2026-07-18

### Added
- **Per-domain rate limiting** via Nginx `limit_req_zone`/`limit_req`.
- **Automatic SSL via Let's Encrypt** — "Auto SSL" checkbox triggers `certbot --nginx` on domain add.
- **CIDR-range IP blocking** across both iptables and CrowdSec modes.

## [1.4.0] - 2026-07-17

### Added
- **Public status page** (`/status`) — unauthenticated page showing live aggregate protection stats.

## [1.3.0] - 2026-07-17

### Added
- Full UI/UX polish pass on login page and Account Home.
- Change password, system info, list blocked IPs endpoints.
- Functional Settings, Security, and Domains pages with confirmation dialogs and toast notifications.
- Analytics page gained a second chart: average response time per hour.

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

This project lives in the same monorepo as the [CoreShield API](https://github.com/Julakk/CoreShield) — Express backend (domains, IP blocking, stats, auth, audit log, public status, Discord notifications, persistent storage, WAF-lite protection).

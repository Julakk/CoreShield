const fs = require('fs/promises');
const path = require('path');
const dns = require('dns').promises;
const config = require('../config');
const logger = require('../utils/logger');
const { safeExec } = require('../utils/safeExec');
const { isValidDomain } = require('../utils/validators');
const { AppError } = require('../middleware/errorHandler');

function zoneNameFor(domain) {
  return `z_${domain.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

const WAF_RULES = [
  `if ($query_string ~* "(union.*select|select.*from|insert.*into|drop.*table|update.*set|delete.*from)") { return 403; }`,
  `if ($query_string ~* "(<script|javascript:|onerror=|onload=)") { return 403; }`,
  `if ($request_uri ~* "\\.\\./") { return 403; }`,
  `if ($request_uri ~* "/(\\.env|\\.git/|wp-config\\.php|\\.htpasswd)") { return 403; }`,
];

const BAD_BOT_UA_PATTERN =
  'sqlmap|nikto|nmap|masscan|nessus|acunetix|w3af|havij|dirbuster|wpscan';

function buildVhostConfig(
  domain,
  { upstream = '127.0.0.1:8080', rateLimit, enableProtection, maxConnections, accessLogPath, ssl } = {}
) {
  const zone = zoneNameFor(domain);

  const rateLimitZone = rateLimit
    ? `limit_req_zone $binary_remote_addr zone=${zone}:10m rate=${rateLimit}r/s;\n`
    : '';
  const rateLimitDirective = rateLimit
    ? `        limit_req zone=${zone} burst=20 nodelay;\n`
    : '';

  const connLimit = maxConnections || (enableProtection ? 20 : null);
  const connLimitZone = connLimit
    ? `limit_conn_zone $binary_remote_addr zone=conn_${zone}:10m;\n`
    : '';
  const connLimitDirective = connLimit
    ? `        limit_conn conn_${zone} ${connLimit};\n`
    : '';

  const zonesBlock = rateLimitZone || connLimitZone
    ? `${rateLimitZone}${connLimitZone}\n`
    : '';

  const wafBlock = enableProtection
    ? `\n    # CoreShield WAF-lite: block common attack signatures\n    ${WAF_RULES.join('\n    ')}\n    if ($http_user_agent ~* "(${BAD_BOT_UA_PATTERN})") { return 403; }\n`
    : '';

  const acmeLocation = `    location ^~ /.well-known/acme-challenge/ {
        root ${ACME_ROOT};
        default_type text/plain;
    }
`;
  const proxyLocation = `    location / {
${rateLimitDirective}${connLimitDirective}        proxy_pass http://${upstream};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
`;
  const logLine = accessLogPath ? `    access_log ${accessLogPath} combined;\n` : '';

  if (!ssl) {
    return `# Managed by CoreShield — do not edit manually
${zonesBlock}server {
    listen 80;
    server_name ${domain};
${logLine}${wafBlock}
${acmeLocation}
${proxyLocation}}
`;
  }

  return `# Managed by CoreShield — do not edit manually
${zonesBlock}server {
    listen 80;
    server_name ${domain};

${acmeLocation}
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${domain};
    ssl_certificate ${ssl.certPath};
    ssl_certificate_key ${ssl.keyPath};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:CoreShieldSSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
${logLine}${wafBlock}
${proxyLocation}}
`;
}

function buildProtectionSnippet(domain, { rateLimit, enableProtection, maxConnections } = {}) {
  const zone = zoneNameFor(domain);

  const rateLimitZone = rateLimit
    ? `limit_req_zone $binary_remote_addr zone=${zone}:10m rate=${rateLimit}r/s;\n`
    : '';
  const connLimit = maxConnections || (enableProtection ? 20 : null);
  const connLimitZone = connLimit
    ? `limit_conn_zone $binary_remote_addr zone=conn_${zone}:10m;\n`
    : '';

  const zoneDeclarations = `${rateLimitZone}${connLimitZone}`;

  const wafLines = enableProtection
    ? `    # CoreShield WAF-lite: block common attack signatures\n    ${WAF_RULES.join('\n    ')}\n    if ($http_user_agent ~* "(${BAD_BOT_UA_PATTERN})") { return 403; }\n`
    : '';
  const rateLimitDirective = rateLimit ? `    limit_req zone=${zone} burst=20 nodelay;\n` : '';
  const connLimitDirective = connLimit ? `    limit_conn conn_${zone} ${connLimit};\n` : '';

  const serverBlockLines = `${wafLines}${rateLimitDirective}${connLimitDirective}`;

  return {
    zoneDeclarations: zoneDeclarations
      ? `# CoreShield zone declarations for ${domain} — must live in http{} context.\n# Add this block near the top of /etc/nginx/nginx.conf, inside the http {} block.\n${zoneDeclarations}`
      : null,
    serverBlockSnippet: serverBlockLines
      ? `# CoreShield protection rules for ${domain}.\n# Add this as a single line inside the existing server {} block:\n#   include /etc/nginx/coreshield-snippets/${domain}.conf;\n${serverBlockLines}`
      : '# Advanced Protection was not enabled — nothing to include.',
  };
}

// Per-domain access log hanya diaktifkan kalau foldernya sudah ada:
// nginx menolak config yang menunjuk ke folder yang tidak ada.
async function resolveAccessLogPath(domain) {
  const dir = config.nginx.logDir;
  if (!dir || !/^[A-Za-z0-9_\/.\-]+$/.test(dir)) return null;
  try {
    const st = await fs.stat(dir);
    if (!st.isDirectory()) return null;
  } catch {
    logger.warn('Nginx log directory not found; per-domain access log disabled', { dir });
    return null;
  }
  return path.join(dir, `${domain}.access.log`);
}

const ACME_ROOT = '/var/www/coreshield-acme';

function reloadNginx() {
  const [bin, ...args] = config.nginx.reloadCmd.split(' ');
  return safeExec(bin, args);
}

// Pastikan SSL memungkinkan SEBELUM ada file yang dibuat (lebih murah daripada rollback).
async function assertSslReady(domain) {
  if (!config.ssl.email) {
    throw new AppError('CERTBOT_EMAIL is not configured on this server', 400);
  }
  let addresses;
  try {
    addresses = await dns.resolve4(domain);
  } catch {
    throw new AppError(
      `DNS for ${domain} does not resolve yet. Point its A record to this server first.`,
      400
    );
  }
  if (config.ssl.serverIp && !addresses.includes(config.ssl.serverIp)) {
    throw new AppError(
      `DNS for ${domain} points to ${addresses.join(', ')}, not to this server (${config.ssl.serverIp}).`,
      400
    );
  }
}

// vhost HTTP (dengan lokasi ACME) -> terbitkan sertifikat -> vhost HTTPS. Rollback kalau gagal.
async function applySsl(domain, opts) {
  const availablePath = path.join(config.nginx.sitesAvailable, `${domain}.conf`);
  const previous = await fs.readFile(availablePath, 'utf8');
  const accessLogPath = await resolveAccessLogPath(domain);
  const base = { ...opts, accessLogPath };
  const name = domain.toLowerCase();

  try {
    await fs.writeFile(availablePath, buildVhostConfig(domain, base));
    await testNginxConfig();
    await reloadNginx();

    await safeExec(config.ssl.sudoBin, [config.ssl.scriptPath, 'issue', domain], { timeout: 180000 });

    await fs.writeFile(
      availablePath,
      buildVhostConfig(domain, {
        ...base,
        ssl: {
          certPath: `/etc/letsencrypt/live/${name}/fullchain.pem`,
          keyPath: `/etc/letsencrypt/live/${name}/privkey.pem`,
        },
      })
    );
    await testNginxConfig();
    await reloadNginx();

    logger.info('SSL enabled', { domain });
    return true;
  } catch (err) {
    await fs.writeFile(availablePath, previous);
    try {
      await testNginxConfig();
      await reloadNginx();
    } catch (restoreErr) {
      logger.warn('Nginx reload after SSL rollback failed', { domain, error: restoreErr.message });
    }
    throw err;
  }
}

// Aktifkan SSL untuk domain managed yang sudah ada.
async function enableSsl(domain, record = {}) {
  if (!isValidDomain(domain)) {
    throw new AppError(`Invalid domain format: ${domain}`, 400);
  }
  await assertSslReady(domain);
  try {
    await applySsl(domain, {
      upstream: record.upstream || undefined,
      rateLimit: record.rateLimit || undefined,
      enableProtection: !!record.protectionEnabled,
      maxConnections: record.maxConnections || undefined,
    });
  } catch (err) {
    if (err.isOperational) throw err;
    const detail = String(err.message).split('\n').slice(0, 3).join(' ');
    throw new AppError(`SSL setup failed: ${detail}`, 502);
  }
  return { domain, sslIssued: true };
}

// Dipanggil setelah vhost dihapus. Gagal = tidak masalah (mis. domain tidak pernah punya SSL).
async function deleteCertificate(domain) {
  try {
    await safeExec(config.ssl.sudoBin, [config.ssl.scriptPath, 'delete', domain], { timeout: 60000 });
    logger.info('SSL certificate deleted', { domain });
  } catch (err) {
    logger.info('No CoreShield certificate deleted', { domain, reason: String(err.message).split('\n')[0] });
  }
}

// Pengaman: jangan menimpa vhost yang sudah ada, dan bersihkan file kalau langkah apa pun gagal.
async function addDomain(domain, opts = {}) {
  if (!isValidDomain(domain)) {
    throw new AppError(`Invalid domain format: ${domain}`, 400);
  }
  const fileName = `${domain}.conf`;
  const availablePath = path.join(config.nginx.sitesAvailable, fileName);
  const enabledPath = path.join(config.nginx.sitesEnabled, fileName);

  if (opts.enableSsl) await assertSslReady(domain);

  const exists = (p) => fs.lstat(p).then(() => true, () => false);
  if ((await exists(availablePath)) || (await exists(enabledPath))) {
    throw new AppError(
      `An Nginx config for ${domain} already exists; use "protect existing domain" instead`,
      409
    );
  }

  try {
    return await addDomainInner(domain, opts);
  } catch (err) {
    await fs.rm(enabledPath, { force: true });
    await fs.rm(availablePath, { force: true });
    try {
      await safeExec('nginx', ['-t']);
      const [bin, ...args] = config.nginx.reloadCmd.split(' ');
      await safeExec(bin, args);
    } catch (reloadErr) {
      logger.warn('Nginx reload after rollback failed', { domain, error: reloadErr.message });
    }
    logger.warn('addDomain rolled back', { domain, error: err.message });
    throw err;
  }
}

async function addDomainInner(domain, { upstream, rateLimit, enableSsl, enableProtection, maxConnections } = {}) {
  if (!isValidDomain(domain)) {
    throw new AppError(`Invalid domain format: ${domain}`, 400);
  }
  if (rateLimit !== undefined) {
    const n = Number(rateLimit);
    if (!Number.isFinite(n) || n <= 0 || n > 10000) {
      throw new AppError('rateLimit must be a positive number (requests/sec)', 400);
    }
  }
  if (maxConnections !== undefined) {
    const n = Number(maxConnections);
    if (!Number.isInteger(n) || n <= 0 || n > 100000) {
      throw new AppError('maxConnections must be a positive integer', 400);
    }
  }

  const fileName = `${domain}.conf`;
  const availablePath = path.join(config.nginx.sitesAvailable, fileName);
  const enabledPath = path.join(config.nginx.sitesEnabled, fileName);

  if (!availablePath.startsWith(path.resolve(config.nginx.sitesAvailable))) {
    throw new AppError('Resolved path escapes sites-available directory', 400);
  }

  const accessLogPath = await resolveAccessLogPath(domain);
  const vhostContent = buildVhostConfig(domain, { upstream, rateLimit, enableProtection, maxConnections, accessLogPath });

  await fs.writeFile(availablePath, vhostContent, { mode: 0o644 });
  logger.info('Nginx vhost written', {
    domain,
    path: availablePath,
    rateLimit: rateLimit || null,
    enableProtection: !!enableProtection,
  });

  try {
    await fs.symlink(availablePath, enabledPath);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  await safeExec('nginx', ['-t']);

  const [reloadBin, ...reloadArgs] = config.nginx.reloadCmd.split(' ');
  await safeExec(reloadBin, reloadArgs);

  logger.info('Nginx reloaded after domain add', { domain });

  let sslIssued = false;
  let sslError = null;
  if (enableSsl) {
    try {
      sslIssued = await applySsl(domain, { upstream, rateLimit, enableProtection, maxConnections });
    } catch (err) {
      sslError = err.message.split('\n').slice(0, 3).join(' ');
      logger.warn('SSL setup failed; domain stays on HTTP', { domain, error: sslError });
    }
  }

  return {
    domain,
    configPath: availablePath,
    enabled: true,
    rateLimit: rateLimit || null,
    sslIssued,
    sslError,
    protectionEnabled: !!enableProtection,
  };
}

async function protectExistingDomain(domain, { rateLimit, enableProtection, maxConnections } = {}) {
  if (!isValidDomain(domain)) {
    throw new AppError(`Invalid domain format: ${domain}`, 400);
  }
  if (!enableProtection && !rateLimit && !maxConnections) {
    throw new AppError('At least one protection option must be enabled', 400);
  }

  const snippetDir = config.nginx.snippetsDir;
  await fs.mkdir(snippetDir, { recursive: true, mode: 0o755 });

  const { zoneDeclarations, serverBlockSnippet } = buildProtectionSnippet(domain, {
    rateLimit,
    enableProtection,
    maxConnections,
  });

  const snippetPath = path.join(snippetDir, `${domain}.conf`);
  await fs.writeFile(snippetPath, serverBlockSnippet, { mode: 0o644 });

  let zoneSnippetPath = null;
  if (zoneDeclarations) {
    zoneSnippetPath = path.join(snippetDir, `${domain}.zones.conf`);
    await fs.writeFile(zoneSnippetPath, zoneDeclarations, { mode: 0o644 });
  }

  logger.info('Protection snippet generated for existing domain', { domain, snippetPath });

  return {
    domain,
    snippetPath,
    zoneSnippetPath,
    rateLimit: rateLimit || null,
    protectionEnabled: !!enableProtection,
    maxConnections: maxConnections || null,
    instructions: [
      zoneSnippetPath
        ? `1. Add the contents of ${zoneSnippetPath} inside your http{} block in nginx.conf (once).`
        : null,
      `${zoneSnippetPath ? '2' : '1'}. Add this line inside the existing server{} block for ${domain}: include ${snippetPath};`,
      `${zoneSnippetPath ? '3' : '2'}. Run: nginx -t`,
      `${zoneSnippetPath ? '4' : '3'}. Only if that succeeds, run: systemctl reload nginx`,
    ].filter(Boolean),
  };
}

async function issueSslCertificate(domain) {
  if (!config.ssl.email) {
    throw new AppError('CERTBOT_EMAIL is not configured on this server', 400);
  }

  try {
    await safeExec(config.ssl.certbotBin, [
      '--nginx',
      '-d', domain,
      '--non-interactive',
      '--agree-tos',
      '-m', config.ssl.email,
      '--redirect',
    ], { timeout: 60000 });

    logger.info('SSL certificate issued', { domain });
    return true;
  } catch (err) {
    logger.warn('SSL certificate issuance failed', { domain, error: err.message });
    return false;
  }
}

async function removeDomain(domain) {
  if (!isValidDomain(domain)) {
    throw new AppError(`Invalid domain format: ${domain}`, 400);
  }
  const fileName = `${domain}.conf`;
  const enabledPath = path.join(config.nginx.sitesEnabled, fileName);
  const availablePath = path.join(config.nginx.sitesAvailable, fileName);

  await fs.rm(enabledPath, { force: true });
  await fs.rm(availablePath, { force: true });

  await safeExec('nginx', ['-t']);
  const [reloadBin, ...reloadArgs] = config.nginx.reloadCmd.split(' ');
  await safeExec(reloadBin, reloadArgs);

  await deleteCertificate(domain);
  logger.info('Domain removed and nginx reloaded', { domain });
  return { domain, removed: true };
}

async function removeProtectionSnippet(domain) {
  if (!isValidDomain(domain)) {
    throw new AppError(`Invalid domain format: ${domain}`, 400);
  }
  const snippetDir = config.nginx.snippetsDir;
  await fs.rm(path.join(snippetDir, `${domain}.conf`), { force: true });
  await fs.rm(path.join(snippetDir, `${domain}.zones.conf`), { force: true });

  logger.info('Protection snippet files removed (Nginx NOT reloaded — remove the include line manually first)', { domain });
  return {
    domain,
    removed: true,
    warning: `Snippet files deleted, but you must manually remove the "include" line from the existing vhost for ${domain}, then run nginx -t and reload.`,
  };
}

module.exports = {
  enableSsl,
  addDomain,
  removeDomain,
  buildVhostConfig,
  protectExistingDomain,
  removeProtectionSnippet,
  buildProtectionSnippet,
};

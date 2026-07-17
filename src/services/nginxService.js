const fs = require('fs/promises');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { safeExec } = require('../utils/safeExec');
const { isValidDomain } = require('../utils/validators');
const { AppError } = require('../middleware/errorHandler');

function zoneNameFor(domain) {
  return `z_${domain.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

function buildVhostConfig(domain, { upstream = '127.0.0.1:8080', rateLimit } = {}) {
  const rateLimitBlock = rateLimit
    ? `limit_req_zone $binary_remote_addr zone=${zoneNameFor(domain)}:10m rate=${rateLimit}r/s;\n\n`
    : '';

  const rateLimitDirective = rateLimit
    ? `        limit_req zone=${zoneNameFor(domain)} burst=20 nodelay;\n`
    : '';

  return `# Managed by CoreShield — do not edit manually
${rateLimitBlock}server {
    listen 80;
    server_name ${domain};

    location / {
${rateLimitDirective}        proxy_pass http://${upstream};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
}

async function addDomain(domain, { upstream, rateLimit, enableSsl } = {}) {
  if (!isValidDomain(domain)) {
    throw new AppError(`Invalid domain format: ${domain}`, 400);
  }
  if (rateLimit !== undefined) {
    const n = Number(rateLimit);
    if (!Number.isFinite(n) || n <= 0 || n > 10000) {
      throw new AppError('rateLimit must be a positive number (requests/sec)', 400);
    }
  }

  const fileName = `${domain}.conf`;
  const availablePath = path.join(config.nginx.sitesAvailable, fileName);
  const enabledPath = path.join(config.nginx.sitesEnabled, fileName);

  if (!availablePath.startsWith(path.resolve(config.nginx.sitesAvailable))) {
    throw new AppError('Resolved path escapes sites-available directory', 400);
  }

  const vhostContent = buildVhostConfig(domain, { upstream, rateLimit });

  await fs.writeFile(availablePath, vhostContent, { mode: 0o644 });
  logger.info('Nginx vhost written', { domain, path: availablePath, rateLimit: rateLimit || null });

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
  if (enableSsl) {
    sslIssued = await issueSslCertificate(domain);
  }

  return {
    domain,
    configPath: availablePath,
    enabled: true,
    rateLimit: rateLimit || null,
    sslIssued,
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

  logger.info('Domain removed and nginx reloaded', { domain });
  return { domain, removed: true };
}

module.exports = { addDomain, removeDomain, buildVhostConfig };

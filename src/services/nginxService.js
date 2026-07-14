const fs = require('fs/promises');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { safeExec } = require('../utils/safeExec');
const { isValidDomain } = require('../utils/validators');
const { AppError } = require('../middleware/errorHandler');

/**
 * Builds a minimal reverse-proxy vhost config.
 * In production you'd likely template this from a file; kept inline for clarity.
 */
function buildVhostConfig(domain, upstream = '127.0.0.1:8080') {
  return `# Managed by CoreShield — do not edit manually
server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://${upstream};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;
}

async function addDomain(domain, { upstream } = {}) {
  if (!isValidDomain(domain)) {
    throw new AppError(`Invalid domain format: ${domain}`, 400);
  }

  const fileName = `${domain}.conf`;
  const availablePath = path.join(config.nginx.sitesAvailable, fileName);
  const enabledPath = path.join(config.nginx.sitesEnabled, fileName);

  // Guard against path traversal even though domain is already regex-validated
  if (!availablePath.startsWith(path.resolve(config.nginx.sitesAvailable))) {
    throw new AppError('Resolved path escapes sites-available directory', 400);
  }

  const vhostContent = buildVhostConfig(domain, upstream);

  await fs.writeFile(availablePath, vhostContent, { mode: 0o644 });
  logger.info('Nginx vhost written', { domain, path: availablePath });

  // Symlink into sites-enabled (idempotent)
  try {
    await fs.symlink(availablePath, enabledPath);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  // Test config before reloading — never reload a broken config
  await safeExec('nginx', ['-t']);

  // Reload — split configured command into binary + args, never shell-interpolated
  const [reloadBin, ...reloadArgs] = config.nginx.reloadCmd.split(' ');
  await safeExec(reloadBin, reloadArgs);

  logger.info('Nginx reloaded after domain add', { domain });
  return { domain, configPath: availablePath, enabled: true };
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

module.exports = { addDomain, removeDomain };

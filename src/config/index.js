require('dotenv').config();

/**
 * Central, validated configuration.
 * Never hardcode secrets or paths here — everything sensitive comes from env vars.
 */
function required(name, fallback) {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  // Single-admin auth for small/solo deployments. For multi-user setups,
  // replace src/services/authService.js with a real user store.
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || '',
  },

  nginx: {
    sitesAvailable: required('NGINX_SITES_AVAILABLE', '/etc/nginx/sites-available'),
    sitesEnabled: required('NGINX_SITES_ENABLED', '/etc/nginx/sites-enabled'),
    reloadCmd: process.env.NGINX_RELOAD_CMD || 'systemctl reload nginx',
  },

  ssl: {
    certbotBin: process.env.CERTBOT_BIN || 'certbot',
    email: process.env.CERTBOT_EMAIL || '',
  },

  crowdsec: {
    apiUrl: process.env.CROWDSEC_BOUNCER_API || 'http://127.0.0.1:8080',
    apiKey: process.env.CROWDSEC_BOUNCER_API_KEY || '',
  },

  blockMethod: process.env.BLOCK_METHOD || 'crowdsec', // 'crowdsec' | 'iptables'

  firewall: {
    // Absolute path to manage_firewall.sh. Must match the path in your
    // sudoers rule exactly (see scripts/coreshield-sudoers.example).
    scriptPath: process.env.FIREWALL_SCRIPT_PATH || '/opt/coreshield/scripts/manage_firewall.sh',
    // 'sudo' in production (script runs as root via scoped sudoers rule);
    // can be overridden for local dev where the script is run directly.
    sudoBin: process.env.FIREWALL_SUDO_BIN || 'sudo',
  },

  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim()),

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
};

if (config.env === 'production' && config.jwt.secret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

if (config.env === 'production' && !config.admin.password) {
  throw new Error('ADMIN_PASSWORD must be set in production');
}

module.exports = config;

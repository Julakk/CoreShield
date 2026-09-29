require('dotenv').config();

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

  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || '',
  },

  nginx: {
    sitesAvailable: required('NGINX_SITES_AVAILABLE', '/etc/nginx/sites-available'),
    sitesEnabled: required('NGINX_SITES_ENABLED', '/etc/nginx/sites-enabled'),
    reloadCmd: process.env.NGINX_RELOAD_CMD || 'systemctl reload nginx',
    snippetsDir: process.env.NGINX_SNIPPETS_DIR || '/etc/nginx/coreshield-snippets',
    logDir: process.env.NGINX_LOG_DIR || '/var/log/nginx/coreshield',
  },

  ssl: {
    certbotBin: process.env.CERTBOT_BIN || 'certbot',
    email: process.env.CERTBOT_EMAIL || '',
  },

  crowdsec: {
    apiUrl: process.env.CROWDSEC_BOUNCER_API || 'http://127.0.0.1:8080',
    apiKey: process.env.CROWDSEC_BOUNCER_API_KEY || '',
  },

  blockMethod: process.env.BLOCK_METHOD || 'crowdsec',

  firewall: {
    scriptPath: process.env.FIREWALL_SCRIPT_PATH || '/opt/coreshield/scripts/manage_firewall.sh',
    sudoBin: process.env.FIREWALL_SUDO_BIN || 'sudo',
  },

  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim()),

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  discord: {
    webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  },
};

if (config.env === 'production' && config.jwt.secret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

if (config.env === 'production' && !config.admin.password) {
  throw new Error('ADMIN_PASSWORD must be set in production');
}

module.exports = config;

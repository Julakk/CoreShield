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

  nginx: {
    sitesAvailable: required('NGINX_SITES_AVAILABLE', '/etc/nginx/sites-available'),
    sitesEnabled: required('NGINX_SITES_ENABLED', '/etc/nginx/sites-enabled'),
    reloadCmd: process.env.NGINX_RELOAD_CMD || 'systemctl reload nginx',
  },

  crowdsec: {
    apiUrl: process.env.CROWDSEC_BOUNCER_API || 'http://127.0.0.1:8080',
    apiKey: process.env.CROWDSEC_BOUNCER_API_KEY || '',
  },

  blockMethod: process.env.BLOCK_METHOD || 'crowdsec', // 'crowdsec' | 'iptables'

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

module.exports = config;

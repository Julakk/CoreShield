const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'admin.json');

const LEGACY_ITERATIONS = 100_000;
const ITERATIONS = 600_000;

function hashPassword(password, salt, iterations) {
  return crypto
    .pbkdf2Sync(String(password), salt, iterations, 32, 'sha256')
    .toString('hex');
}

function ensureStore() {
  if (fs.existsSync(STORE_PATH)) return;

  fs.mkdirSync(DATA_DIR, { recursive: true });

  const salt = crypto.randomBytes(16).toString('hex');
  const initial = {
    username: config.admin.username,
    salt,
    iterations: ITERATIONS,
    passwordChangedAt: 0,
    passwordHash: config.admin.password
      ? hashPassword(config.admin.password, salt, ITERATIONS)
      : null,
  };

  fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), {
    mode: 0o600,
  });
}

function read() {
  ensureStore();
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
}

function write(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), { mode: 0o600 });
}

function getUsername() {
  return read().username;
}

// Token dengan iat lebih lama dari waktu ini dianggap tidak berlaku
function getPasswordChangedAt() {
  return read().passwordChangedAt || 0;
}

function verifyPassword(password) {
  const store = read();
  if (!store.passwordHash) return false;

  const iterations = store.iterations || LEGACY_ITERATIONS;
  const candidateHash = hashPassword(password, store.salt, iterations);
  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(store.passwordHash, 'hex');
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

  // Upgrade hash lama ke jumlah iterasi baru secara transparan
  if (ok && iterations < ITERATIONS) {
    const salt = crypto.randomBytes(16).toString('hex');
    write({
      ...store,
      salt,
      iterations: ITERATIONS,
      passwordHash: hashPassword(password, salt, ITERATIONS),
    });
  }
  return ok;
}

function setPassword(newPassword) {
  const store = read();
  const salt = crypto.randomBytes(16).toString('hex');
  write({
    ...store,
    salt,
    iterations: ITERATIONS,
    passwordChangedAt: Math.floor(Date.now() / 1000),
    passwordHash: hashPassword(newPassword, salt, ITERATIONS),
  });
}

module.exports = { getUsername, getPasswordChangedAt, verifyPassword, setPassword };

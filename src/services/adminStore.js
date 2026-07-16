const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const STORE_PATH = path.join(DATA_DIR, 'admin.json');

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha256').toString('hex');
}

function ensureStore() {
  if (fs.existsSync(STORE_PATH)) return;

  fs.mkdirSync(DATA_DIR, { recursive: true });

  const salt = crypto.randomBytes(16).toString('hex');
  const initial = {
    username: config.admin.username,
    salt,
    passwordHash: config.admin.password
      ? hashPassword(config.admin.password, salt)
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

function verifyPassword(password) {
  const store = read();
  if (!store.passwordHash) return false;
  const candidateHash = hashPassword(password, store.salt);
  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(store.passwordHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function setPassword(newPassword) {
  const store = read();
  const salt = crypto.randomBytes(16).toString('hex');
  write({
    ...store,
    salt,
    passwordHash: hashPassword(newPassword, salt),
  });
}

module.exports = { getUsername, verifyPassword, setPassword };

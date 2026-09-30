const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { v4: uuidv4 } = require('uuid');
const { readJson } = require('../utils/jsonStore');

const LEGACY_FILE = 'domains.json';
const DB_PATH = path.resolve(process.env.DB_PATH || 'data/coreshield.db');
const UPDATABLE = [
  'mode', 'upstream', 'rateLimit', 'sslIssued', 'protectionEnabled',
  'maxConnections', 'snippetPath', 'status',
];

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');

const tableSql = (name) => `
  CREATE TABLE ${name} (
    id                 TEXT PRIMARY KEY,
    domain             TEXT NOT NULL UNIQUE,
    mode               TEXT NOT NULL DEFAULT 'managed',
    upstream           TEXT,
    rateLimit          TEXT,
    sslIssued          INTEGER NOT NULL DEFAULT 0,
    protectionEnabled  INTEGER NOT NULL DEFAULT 0,
    maxConnections     INTEGER,
    snippetPath        TEXT,
    createdAt          TEXT NOT NULL,
    status             TEXT NOT NULL DEFAULT 'active'
  );
`;

const columns = () => db.prepare('PRAGMA table_info(domains)').all().map((c) => c.name);

if (columns().length === 0) {
  db.exec(tableSql('domains'));
} else if (!columns().includes('mode')) {
  // Skema lama (sebelum kolom mode/snippetPath): bangun ulang tabel
  db.exec(`
    BEGIN;
    ALTER TABLE domains RENAME TO domains_old;
    ${tableSql('domains')}
    INSERT INTO domains
      (id, domain, upstream, rateLimit, sslIssued, protectionEnabled, createdAt, status)
      SELECT id, domain, upstream, rateLimit, sslIssued, protectionEnabled, createdAt, status
      FROM domains_old;
    DROP TABLE domains_old;
    COMMIT;
  `);
}
if (!columns().includes('maxConnections')) {
  db.exec('ALTER TABLE domains ADD COLUMN maxConnections INTEGER');
}

const stmt = {
  list: db.prepare('SELECT * FROM domains ORDER BY createdAt'),
  get: db.prepare('SELECT * FROM domains WHERE domain = ?'),
  exists: db.prepare('SELECT 1 FROM domains WHERE domain = ?'),
  remove: db.prepare('DELETE FROM domains WHERE domain = ?'),
  count: db.prepare('SELECT COUNT(*) AS n FROM domains'),
  insert: db.prepare(`
    INSERT OR REPLACE INTO domains
      (id, domain, mode, upstream, rateLimit, sslIssued, protectionEnabled,
       maxConnections, snippetPath, createdAt, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
};

function fromRow(row) {
  return {
    id: row.id,
    domain: row.domain,
    mode: row.mode,
    upstream: row.upstream,
    rateLimit: row.rateLimit ? JSON.parse(row.rateLimit) : null,
    sslIssued: !!row.sslIssued,
    protectionEnabled: !!row.protectionEnabled,
    maxConnections: row.maxConnections ?? null,
    snippetPath: row.snippetPath,
    createdAt: row.createdAt,
    status: row.status,
  };
}

function insertRecord(r) {
  stmt.insert.run(
    r.id,
    r.domain,
    r.mode,
    r.upstream ?? null,
    r.rateLimit == null ? null : JSON.stringify(r.rateLimit),
    r.sslIssued ? 1 : 0,
    r.protectionEnabled ? 1 : 0,
    r.maxConnections ?? null,
    r.snippetPath ?? null,
    r.createdAt,
    r.status,
  );
}

// Impor sekali dari domains.json kalau tabel masih kosong
if (stmt.count.get().n === 0) {
  const legacy = Object.values(readJson(LEGACY_FILE, {}));
  for (const r of legacy) {
    insertRecord({
      id: r.id || uuidv4(),
      domain: r.domain,
      mode: r.mode || 'managed',
      upstream: r.upstream ?? null,
      rateLimit: r.rateLimit || null,
      sslIssued: !!r.sslIssued,
      protectionEnabled: !!r.protectionEnabled,
      maxConnections: r.maxConnections ?? null,
      snippetPath: r.snippetPath || null,
      createdAt: r.createdAt || new Date().toISOString(),
      status: r.status || 'active',
    });
  }
}

function list() {
  return stmt.list.all().map(fromRow);
}

function get(domain) {
  const row = stmt.get.get(domain);
  return row ? fromRow(row) : null;
}

function add(domain, meta = {}) {
  const record = {
    id: uuidv4(),
    domain,
    mode: meta.mode || 'managed',
    upstream: meta.upstream || null,
    rateLimit: meta.rateLimit || null,
    sslIssued: meta.sslIssued || false,
    protectionEnabled: meta.protectionEnabled || false,
    maxConnections: meta.maxConnections || null,
    snippetPath: meta.snippetPath || null,
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  insertRecord(record);
  return record;
}

function update(domain, patch = {}) {
  const current = get(domain);
  if (!current) return null;
  const next = { ...current };
  for (const key of UPDATABLE) {
    if (key in patch) next[key] = patch[key];
  }
  insertRecord(next);
  return next;
}

function remove(domain) {
  return stmt.remove.run(domain).changes > 0;
}

function exists(domain) {
  return !!stmt.exists.get(domain);
}

module.exports = { list, get, add, update, remove, exists };

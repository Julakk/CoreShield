const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { v4: uuidv4 } = require('uuid');
const { readJson } = require('../utils/jsonStore');

const LEGACY_FILE = 'domains.json';
const DB_PATH = path.resolve(process.env.DB_PATH || 'data/coreshield.db');

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
    snippetPath        TEXT,
    createdAt          TEXT NOT NULL,
    status             TEXT NOT NULL DEFAULT 'active'
  );
`;

// Migrasi dari skema lama (tanpa kolom mode/snippetPath, upstream NOT NULL)
const cols = db.prepare('PRAGMA table_info(domains)').all().map((c) => c.name);
if (cols.length && !cols.includes('mode')) {
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
if (!cols.length) db.exec(tableSql('domains'));

const stmt = {
  list: db.prepare('SELECT * FROM domains ORDER BY createdAt'),
  exists: db.prepare('SELECT 1 FROM domains WHERE domain = ?'),
  remove: db.prepare('DELETE FROM domains WHERE domain = ?'),
  count: db.prepare('SELECT COUNT(*) AS n FROM domains'),
  insert: db.prepare(`
    INSERT OR REPLACE INTO domains
      (id, domain, mode, upstream, rateLimit, sslIssued, protectionEnabled,
       snippetPath, createdAt, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    r.upstream,
    r.rateLimit == null ? null : JSON.stringify(r.rateLimit),
    r.sslIssued ? 1 : 0,
    r.protectionEnabled ? 1 : 0,
    r.snippetPath,
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
      snippetPath: r.snippetPath || null,
      createdAt: r.createdAt || new Date().toISOString(),
      status: r.status || 'active',
    });
  }
}

function list() {
  return stmt.list.all().map(fromRow);
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
    snippetPath: meta.snippetPath || null,
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  insertRecord(record);
  return record;
}

function remove(domain) {
  return stmt.remove.run(domain).changes > 0;
}

function exists(domain) {
  return !!stmt.exists.get(domain);
}

module.exports = { list, add, remove, exists };

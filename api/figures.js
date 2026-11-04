// Shared figures for the one-pager, stored in Turso (hosted SQLite).
// GET  /api/figures            -> { figures: { key: { value, by, at } }, edits: [...] }
// POST /api/figures {key, value, by} -> { ok: true, at }

const { dbConfig, run } = require('./_db');

const SHEET = 'fleet-bike';

// Fields the page may write, with the range each accepts. Options are the allowed strings.
const FIELDS = {
  bike: [0, 10000], box: [0, 2000], kit: [0, 1000], tracker: [0, 1000], phone: [0, 1000], regist: [0, 1000],
  perDay: [0, 60], fare: [0, 50], days: [1, 7], riderPct: [0, 100], riderWeek: [0, 1000],
  fetchrPct: [0, 100], procPct: [0, 20], fuelPrice: [0.1, 10], kmDay: [0, 400], kmPerL: [5, 100],
  maint: [0, 200], insure: [0, 3000], licence: [0, 1000], data: [0, 50], trackFee: [0, 100],
  pDays: [1, 31], pDone: [0, 2000], pFailed: [0, 2000], pKm: [0, 20000], pFuel: [0, 5000],
  pHire: [0, 500], pRider: [0, 500], bikes: [1, 500],
  riderMode: ['pct', 'fixed'], fuelBy: ['fleet', 'rider'],
};
const NULLABLE = new Set(['pDays', 'pDone', 'pFailed', 'pKm', 'pFuel', 'pHire', 'pRider']);

const SCHEMA = [
  ['CREATE TABLE IF NOT EXISTS figures (sheet TEXT NOT NULL, key TEXT NOT NULL, value TEXT, edited_by TEXT NOT NULL, edited_at TEXT NOT NULL, PRIMARY KEY (sheet, key))'],
  ['CREATE TABLE IF NOT EXISTS edits (id INTEGER PRIMARY KEY AUTOINCREMENT, sheet TEXT NOT NULL, key TEXT NOT NULL, old_value TEXT, new_value TEXT, edited_by TEXT NOT NULL, edited_at TEXT NOT NULL)'],
];

// null when fine, else the reason the write is refused
function check(key, value, by) {
  const rule = FIELDS[key];
  if (!rule) return 'Unknown field';
  if (typeof by !== 'string' || !by.trim() || by.length > 60) return 'Name is required, up to 60 characters';
  if (value === null) return NULLABLE.has(key) ? null : 'This field cannot be blank';
  if (typeof rule[0] === 'string') return rule.includes(value) ? null : 'Not an allowed option';
  if (typeof value !== 'number' || !isFinite(value)) return 'Value must be a number';
  if (value < rule[0] || value > rule[1]) return `Value must be ${rule[0]} to ${rule[1]}`;
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const db = dbConfig();
  if (!db) return res.status(503).json({ error: 'Database not connected' });

  try {
    if (req.method === 'GET') {
      const [, , figures, edits] = await run(db, [
        ...SCHEMA,
        ['SELECT key, value, edited_by, edited_at FROM figures WHERE sheet = ?', [SHEET]],
        ['SELECT key, old_value, new_value, edited_by, edited_at FROM edits WHERE sheet = ? ORDER BY id DESC LIMIT 30', [SHEET]],
      ]);
      const out = {};
      for (const f of figures) out[f.key] = { value: f.value === null ? null : JSON.parse(f.value), by: f.edited_by, at: f.edited_at };
      return res.status(200).json({ figures: out, edits });
    }

    if (req.method === 'POST') {
      const { key, value, by } = req.body || {};
      const problem = check(key, value, by);
      if (problem) return res.status(400).json({ error: problem });
      const at = new Date().toISOString();
      const name = by.trim();
      const json = value === null ? null : JSON.stringify(value);
      await run(db, [
        ...SCHEMA,
        ['INSERT INTO edits (sheet, key, old_value, new_value, edited_by, edited_at) SELECT ?, ?, (SELECT value FROM figures WHERE sheet = ? AND key = ?), ?, ?, ?',
          [SHEET, key, SHEET, key, json, name, at]],
        ['INSERT INTO figures (sheet, key, value, edited_by, edited_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (sheet, key) DO UPDATE SET value = excluded.value, edited_by = excluded.edited_by, edited_at = excluded.edited_at',
          [SHEET, key, json, name, at]],
      ]);
      return res.status(200).json({ ok: true, at });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('figures api', e);
    return res.status(502).json({ error: 'Could not reach the database' });
  }
};

module.exports.check = check;

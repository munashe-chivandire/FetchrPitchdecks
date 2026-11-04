// Comments and suggestions pinned to deck slides, stored in Turso.
// GET    /api/annotations?deck=Deck1          -> [annotation, ...] oldest first
// POST   /api/annotations {deck_id, slide_number, x_percent, y_percent, content, author, type}
// PATCH  /api/annotations?id=...  {resolved}
// DELETE /api/annotations?id=...

const { randomUUID } = require('crypto');
const { dbConfig, run } = require('./_db');

const SCHEMA = [
  ['CREATE TABLE IF NOT EXISTS annotations (id TEXT PRIMARY KEY, deck_id TEXT NOT NULL, slide_number INTEGER NOT NULL, x_percent REAL NOT NULL, y_percent REAL NOT NULL, content TEXT NOT NULL, author TEXT NOT NULL, type TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)'],
  ['CREATE INDEX IF NOT EXISTS idx_annotations_deck ON annotations (deck_id, created_at)'],
];

const DECK = /^[A-Za-z0-9_-]{1,40}$/;
const ID = /^[0-9a-f-]{36}$/;

// Turso returns every value as text; give the page the shapes it had from Supabase.
const shape = a => ({
  ...a,
  slide_number: Number(a.slide_number),
  x_percent: Number(a.x_percent),
  y_percent: Number(a.y_percent),
  resolved: a.resolved === '1' || a.resolved === 1,
});

// null when fine, else why the comment is refused
function check(b) {
  if (!b || typeof b !== 'object') return 'Missing body';
  if (!DECK.test(b.deck_id || '')) return 'Unknown deck';
  if (!Number.isInteger(b.slide_number) || b.slide_number < 0 || b.slide_number > 200) return 'Bad slide number';
  for (const k of ['x_percent', 'y_percent']) if (typeof b[k] !== 'number' || !(b[k] >= 0 && b[k] <= 100)) return `Bad ${k}`;
  if (typeof b.content !== 'string' || !b.content.trim() || b.content.length > 2000) return 'Comment must be 1 to 2000 characters';
  if (typeof b.author !== 'string' || !b.author.trim() || b.author.length > 50) return 'Name must be 1 to 50 characters';
  if (!['comment', 'suggestion'].includes(b.type)) return 'Type must be comment or suggestion';
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const db = dbConfig();
  if (!db) return res.status(503).json({ error: 'Database not connected' });
  const id = req.query && req.query.id;

  try {
    if (req.method === 'GET') {
      const deck = req.query && req.query.deck;
      if (!DECK.test(deck || '')) return res.status(400).json({ error: 'Unknown deck' });
      const [, , rows] = await run(db, [...SCHEMA, ['SELECT * FROM annotations WHERE deck_id = ? ORDER BY created_at', [deck]]]);
      return res.status(200).json(rows.map(shape));
    }

    if (req.method === 'POST') {
      const b = req.body;
      const problem = check(b);
      if (problem) return res.status(400).json({ error: problem });
      const row = {
        id: randomUUID(), deck_id: b.deck_id, slide_number: b.slide_number, x_percent: b.x_percent, y_percent: b.y_percent,
        content: b.content.trim(), author: b.author.trim(), type: b.type, resolved: 0, created_at: new Date().toISOString(),
      };
      await run(db, [...SCHEMA, ['INSERT INTO annotations (id, deck_id, slide_number, x_percent, y_percent, content, author, type, resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [row.id, row.deck_id, row.slide_number, row.x_percent, row.y_percent, row.content, row.author, row.type, row.resolved, row.created_at]]]);
      return res.status(201).json(shape(row));
    }

    if (req.method === 'PATCH' || req.method === 'DELETE') {
      if (!ID.test(id || '')) return res.status(400).json({ error: 'Bad id' });
      if (req.method === 'PATCH') {
        if (typeof (req.body && req.body.resolved) !== 'boolean') return res.status(400).json({ error: 'resolved must be true or false' });
        await run(db, [...SCHEMA, ['UPDATE annotations SET resolved = ? WHERE id = ?', [req.body.resolved ? 1 : 0, id]]]);
      } else {
        await run(db, [...SCHEMA, ['DELETE FROM annotations WHERE id = ?', [id]]]);
      }
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('annotations api', e);
    return res.status(502).json({ error: 'Could not reach the database' });
  }
};

module.exports.check = check;

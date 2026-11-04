// Turso (hosted SQLite) over its HTTP API. Files starting with _ are not routes on Vercel.

function dbConfig() {
  const url = process.env.TURSO_DATABASE_URL || process.env.TURSO_URL;
  const token = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/^libsql:\/\//, 'https://').replace(/\/$/, ''), token };
}

const arg = v => (v === null || v === undefined ? { type: 'null' } : { type: 'text', value: String(v) });

// Runs statements in one pipeline; returns each result's rows as objects.
async function run(db, stmts) {
  const res = await fetch(`${db.url}/v2/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${db.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [...stmts.map(([sql, args = []]) => ({ type: 'execute', stmt: { sql, args: args.map(arg) } })), { type: 'close' }],
    }),
  });
  if (!res.ok) throw new Error(`Turso HTTP ${res.status}`);
  const body = await res.json();
  return body.results.slice(0, stmts.length).map(r => {
    if (r.type !== 'ok') throw new Error(r.error?.message || 'Turso error');
    const { cols, rows } = r.response.result;
    return rows.map(row => Object.fromEntries(row.map((c, i) => [cols[i].name, c.type === 'null' ? null : c.value])));
  });
}

module.exports = { dbConfig, run };

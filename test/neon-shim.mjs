// Stands in for @neondatabase/serverless during local tests.
// Mirrors the HTTP driver's behaviour: tagged template → rows array.
import pg from 'pg';

let pool = null;

export function neon(connectionString) {
  if (!pool) pool = new pg.Pool({ connectionString });
  return async function sql(strings, ...values) {
    let text = '';
    strings.forEach((s, i) => {
      text += s;
      if (i < values.length) text += '$' + (i + 1);
    });
    const res = await pool.query(text, values);
    return res.rows;
  };
}

export async function closePool() { if (pool) await pool.end(); }

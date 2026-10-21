import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import pg from 'pg';

interface Snapshot { users: unknown[]; books: unknown[] }

export async function importSnapshot(pool: pg.Pool, snapshot: Snapshot) {
  if (!Array.isArray(snapshot.users) || !Array.isArray(snapshot.books)) throw new Error('Invalid snapshot.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE users,books,sessions,email_confirmations IN ACCESS EXCLUSIVE MODE');
    const existing = await client.query('SELECT (SELECT count(*) FROM users)+(SELECT count(*) FROM books) AS count');
    if (Number(existing.rows[0].count) !== 0) throw new Error('Import requires an empty target; existing data will not be overwritten.');
    await client.query('INSERT INTO users SELECT * FROM jsonb_populate_recordset(null::users,$1::jsonb)', [JSON.stringify(snapshot.users)]);
    await client.query('INSERT INTO books SELECT * FROM jsonb_populate_recordset(null::books,$1::jsonb)', [JSON.stringify(snapshot.books)]);
    // PostgreSQL compares typed records, including full timestamp precision and numeric values.
    // Do not round-trip timestamptz through JavaScript Date (which loses microseconds).
    for (const [table, records] of [['users', snapshot.users], ['books', snapshot.books]] as const) {
      const verified = await client.query(`
        SELECT (SELECT count(*) FROM ${table})=$2::int AND NOT EXISTS (
          SELECT 1 FROM jsonb_populate_recordset(null::${table},$1::jsonb) source
          LEFT JOIN ${table} target USING(id)
          WHERE to_jsonb(source) IS DISTINCT FROM to_jsonb(target)
        ) AS matches
      `, [JSON.stringify(records), records.length]);
      if (!verified.rows[0].matches) throw new Error(`${table} verification failed; import rolled back.`);
    }
    const checksums = await client.query(`SELECT
      (SELECT md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY id)::text,'[]')) FROM users u) AS users_checksum,
      (SELECT md5(coalesce(jsonb_agg(to_jsonb(b) ORDER BY id)::text,'[]')) FROM books b) AS books_checksum`);
    await client.query('COMMIT');
    return { users: snapshot.users.length, books: snapshot.books.length, ...checksums.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.DATABASE_URL || !process.argv[2]) throw new Error('Set DATABASE_URL and pass a snapshot filename.');
  const snapshot = JSON.parse(await readFile(process.argv[2], 'utf8')) as Snapshot;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log(await importSnapshot(pool, snapshot));
  } finally {
    await pool.end();
  }
}

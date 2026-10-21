import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import pg from 'pg';

export async function migrate(pool: pg.Pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(708231049)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY)');
    const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version=1');
    if (!applied.rowCount) {
      await client.query(await readFile(new URL('../schema.sql', import.meta.url), 'utf8'));
      await client.query('INSERT INTO schema_migrations VALUES (1)');
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await migrate(pool);
    console.log('Database migrations applied.');
  } finally {
    await pool.end();
  }
}

import pg from 'pg';
import { createApp } from './app.js';

const { DATABASE_URL, APP_ORIGIN } = process.env;
if (!DATABASE_URL || !APP_ORIGIN) throw new Error('DATABASE_URL and APP_ORIGIN are required');
if (new URL(APP_ORIGIN).origin !== APP_ORIGIN) throw new Error('APP_ORIGIN must be an origin without a path');
const port = Number(process.env.PORT ?? 3100);
const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 10 });
const app = await createApp({
  pool,
  origin: APP_ORIGIN,
  logger: true,
});
pool.on('error', () => app.log.error('Unexpected idle database connection error'));
await pool.query('SELECT 1');
await app.listen({ host: '127.0.0.1', port });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await app.close();
    await pool.end();
  });
}

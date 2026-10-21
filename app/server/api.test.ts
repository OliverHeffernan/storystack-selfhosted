import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import test, { type TestContext } from 'node:test';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import type { FastifyInstance, InjectOptions } from 'fastify';
import { createApp } from './app.js';
import { migrate } from './migrate.js';
import { importSnapshot } from './import-supabase.js';

const origin = 'https://storystack.example';
async function database(t: TestContext) {
  if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL must point to a disposable PostgreSQL database with CREATE SCHEMA permission.');
  const admin = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const schema = `test_${randomBytes(8).toString('hex')}`;
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema}` });
  t.after(async () => {
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });
  await migrate(pool);
  return pool;
}
async function call(app: FastifyInstance, method: InjectOptions['method'], url: string, payload?: object, session?: string, requestOrigin = origin) {
  return app.inject({ method, url, payload, headers: { origin: requestOrigin, ...(session ? { cookie: session } : {}) } });
}
async function signin(app: FastifyInstance, email: string, password = 'legacy-password') {
  const response = await call(app, 'POST', '/api/auth/signin', { email, password });
  assert.equal(response.statusCode, 200, response.body);
  const header = response.headers['set-cookie'];
  assert.equal(typeof header, 'string');
  assert.match(header as string, /HttpOnly/);
  assert.match(header as string, /Secure/);
  assert.match(header as string, /SameSite=Lax/);
  return (header as string).split(';')[0]!;
}
async function seed(pool: pg.Pool, email: string) {
  const id = randomUUID();
  const hash = (await bcrypt.hash('legacy-password', 10)).replace('$2b$', '$2a$');
  await pool.query('INSERT INTO users(id,email,password_hash,email_confirmed_at) VALUES($1,$2,$3,now())', [id, email, hash]);
  return id;
}

test('migrated passwords, book ownership, validation and persistent/revocable sessions', async (t) => {
  const pool = await database(t);
  const owner = await seed(pool, 'owner@example.com');
  await seed(pool, 'other@example.com');
  const app = await createApp({ pool, origin });
  t.after(() => app.close());
  assert.equal((await call(app, 'GET', '/api/books')).statusCode, 401);
  assert.equal((await call(app, 'POST', '/api/auth/signin', { email: 'owner@example.com', password: 'wrong' })).statusCode, 401);
  assert.equal((await call(app, 'POST', '/api/auth/signin', { email: 'owner@example.com', password: 'legacy-password' }, undefined, 'https://attacker.example')).statusCode, 403);
  const session = await signin(app, 'OWNER@example.com');
  const otherSession = await signin(app, 'other@example.com');
  const me = (await call(app, 'GET', '/api/auth/me', undefined, session)).json();
  assert.equal(me.id, owner);
  assert.equal('password_hash' in me, false);
  const book = { title: "A Book'); DROP TABLE books; --", author: 'A. Writer', status: 'reading', pages: 317, start_date: '2026-02-03T10:11:12.123Z', end_date: null, image_url: null, colour: '#12ab34' };
  const created = await call(app, 'POST', '/api/books', book, session);
  assert.equal(created.statusCode, 201, created.body);
  const id = created.json().id;
  assert.equal(created.json().user_id, owner);
  assert.ok(created.json().created_at);
  assert.deepEqual((await call(app, 'GET', '/api/books', undefined, otherSession)).json(), []);
  assert.equal((await call(app, 'PATCH', `/api/books/${id}`, { title: 'stolen' }, otherSession)).statusCode, 404);
  assert.equal((await call(app, 'DELETE', `/api/books/${id}`, undefined, otherSession)).statusCode, 404);
  assert.equal((await call(app, 'POST', '/api/books', { ...book, user_id: randomUUID() }, session)).statusCode, 400);
  assert.equal((await call(app, 'PATCH', `/api/books/${id}`, { pages: -1 }, session)).statusCode, 400);
  assert.equal((await call(app, 'PATCH', `/api/books/${id}`, { pages: 1.5 }, session)).statusCode, 400);
  assert.equal((await call(app, 'PATCH', `/api/books/${id}`, { image_url: 'javascript:alert(1)' }, session)).statusCode, 400);
  assert.equal((await call(app, 'PATCH', '/api/books/not-a-uuid', { title: 'bad' }, session)).statusCode, 400);
  assert.equal((await call(app, 'PATCH', `/api/books/${id}`, {}, session)).statusCode, 400);
  const updated = await call(app, 'PATCH', `/api/books/${id}`, { start_date: null, colour: 'default', pages: 0, status: 'read' }, session);
  assert.equal(updated.statusCode, 200, updated.body);
  assert.equal(updated.json().title, book.title);
  assert.equal(updated.json().start_date, null);
  assert.equal(Number(updated.json().pages), 0);
  assert.equal(updated.json().colour, 'default');
  const reopened = await createApp({ pool, origin });
  assert.equal((await call(reopened, 'GET', '/api/auth/me', undefined, session)).statusCode, 200);
  await reopened.close();
  assert.equal((await call(app, 'POST', '/api/auth/signout', undefined, session)).statusCode, 204);
  assert.equal((await call(app, 'GET', '/api/books', undefined, session)).statusCode, 401);
  const nextSession = await signin(app, 'owner@example.com');
  assert.equal((await call(app, 'DELETE', `/api/books/${id}`, undefined, nextSession)).statusCode, 204);
  assert.deepEqual((await call(app, 'GET', '/api/books', undefined, nextSession)).json(), []);
  await pool.query(`UPDATE sessions SET expires_at=now()-interval '1 second'`);
  assert.equal((await call(app, 'GET', '/api/auth/me', undefined, nextSession)).statusCode, 401);
  for (const state of ['banned_until', 'deleted_at'] as const) {
    const activeSession = await signin(app, 'owner@example.com');
    await pool.query(`UPDATE users SET ${state}=now()+interval '1 day' WHERE id=$1`, [owner]);
    assert.equal((await call(app, 'GET', '/api/auth/me', undefined, activeSession)).statusCode, 401);
    assert.equal((await call(app, 'POST', '/api/auth/signin', { email: 'owner@example.com', password: 'legacy-password' })).statusCode, 401);
    assert.equal((await call(app, 'POST', '/api/auth/signup', { email: 'OWNER@example.com', password: 'replacement-password', display_name: 'Replacement' })).statusCode, 409);
    await pool.query(`UPDATE users SET ${state}=NULL WHERE id=$1`, [owner]);
    await signin(app, 'owner@example.com');
  }
});

test('Goodreads CSV imports quoted/multiline fields, dates and shelves atomically for the signed-in user', async (t) => {
  const pool = await database(t);
  await seed(pool, 'reader@example.com');
  const app = await createApp({ pool, origin });
  t.after(() => app.close());
  const session = await signin(app, 'reader@example.com');
  const csv = 'Title,Author,ISBN13,Number of Pages,Date Read,Date Added,Exclusive Shelf\r\n"A, ""Quoted""\nBook",Writer,"=""9781234567890""",321,2026/03/12,2026/02/01,read\r\nSecond,Other,,17,2026/02/30,,currently-reading\r\nThird,Third Author,,0,,,to-read\r\n';
  assert.equal((await call(app, 'POST', '/api/books/import', { data: csv })).statusCode, 401);
  const imported = await call(app, 'POST', '/api/books/import', { data: csv }, session);
  assert.equal(imported.statusCode, 200, imported.body);
  assert.deepEqual(imported.json(), { success: true, inserted: 3, total: 3 });
  const books = (await call(app, 'GET', '/api/books', undefined, session)).json() as Record<string, unknown>[];
  const first = books.find((book) => book.author === 'Writer')!;
  assert.equal(first.title, 'A, "Quoted"\nBook');
  assert.equal(first.image_url, 'https://covers.openlibrary.org/b/isbn/9781234567890-L.jpg');
  assert.equal(Number(first.pages), 321);
  assert.equal(first.start_date, '2026-02-01T00:00:00.000Z');
  assert.equal(first.end_date, '2026-03-12T00:00:00.000Z');
  assert.equal(books.find((book) => book.title === 'Second')!.status, 'reading');
  assert.equal(books.find((book) => book.title === 'Second')!.end_date, null);
  assert.equal(books.find((book) => book.title === 'Third')!.status, 'want-to-read');
  assert.equal((await call(app, 'POST', '/api/books/import', { data: 'Title,Author,Exclusive Shelf\n"unterminated' }, session)).statusCode, 400);
  assert.equal((await call(app, 'POST', '/api/books/import', { data: 'wrong,headers\na,b' }, session)).statusCode, 400);
  assert.equal((await call(app, 'GET', '/api/books', undefined, session)).json().length, 3);
});

test('signup signs in immediately without mail and never overwrites duplicate accounts', async (t) => {
  const pool = await database(t);
  const app = await createApp({ pool, origin });
  t.after(() => app.close());
  const account = { email: 'New@example.com', password: 'é'.repeat(36), display_name: 'Reader' };
  assert.equal((await call(app, 'POST', '/api/auth/signup', { ...account, password: 'é'.repeat(37) })).statusCode, 400);
  const created = await call(app, 'POST', '/api/auth/signup', account);
  assert.equal(created.statusCode, 201, created.body);
  assert.equal(created.json().email, 'new@example.com');
  assert.equal(created.json().user_metadata.display_name, 'Reader');
  assert.equal('password_hash' in created.json(), false);
  const cookie = created.headers['set-cookie'] as string;
  assert.match(cookie, /^__Host-storystack_session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  const session = cookie.split(';')[0]!;
  assert.equal((await call(app, 'GET', '/api/auth/me', undefined, session)).json().id, created.json().id);
  assert.deepEqual((await call(app, 'GET', '/api/books', undefined, session)).json(), []);
  // Creating an account does not claim that its email ownership was verified.
  assert.equal((await pool.query('SELECT email_confirmed_at FROM users WHERE id=$1', [created.json().id])).rows[0].email_confirmed_at, null);
  assert.equal((await call(app, 'POST', '/api/auth/signin', account)).statusCode, 400); // Extra fields cannot reach auth SQL.
  const duplicate = await call(app, 'POST', '/api/auth/signup', { ...account, email: 'NEW@example.com', password: 'replacement-password', display_name: 'Replacement' });
  assert.equal(duplicate.statusCode, 409);
  assert.equal(duplicate.headers['set-cookie'], undefined);
  assert.equal((await call(app, 'POST', '/api/auth/signin', { email: account.email, password: 'replacement-password' })).statusCode, 401);
  await signin(app, account.email, account.password);
  assert.equal((await call(app, 'GET', '/api/auth/me', undefined, session)).json().user_metadata.display_name, 'Reader');
  assert.equal((await call(app, 'POST', '/api/auth/signout', undefined, session)).statusCode, 204);
  assert.equal((await call(app, 'GET', '/api/auth/me', undefined, session)).statusCode, 401);

  const contenders = [
    { email: 'race@example.com', password: 'first-password', display_name: 'First' },
    { email: 'RACE@example.com', password: 'second-password', display_name: 'Second' },
  ];
  const raced = await Promise.all(contenders.map((candidate) => call(app, 'POST', '/api/auth/signup', candidate)));
  assert.deepEqual(raced.map((response) => response.statusCode).sort(), [201, 409]);
  const winner = contenders[raced.findIndex((response) => response.statusCode === 201)]!;
  const winningSession = await signin(app, winner.email, winner.password);
  assert.equal((await call(app, 'GET', '/api/auth/me', undefined, winningSession)).json().user_metadata.display_name, winner.display_name);
  const loser = contenders.find((candidate) => candidate !== winner)!;
  assert.equal((await call(app, 'POST', '/api/auth/signin', { email: loser.email, password: loser.password })).statusCode, 401);
  assert.equal((await call(app, 'POST', '/api/auth/signup', { ...account, email: 'limited@example.com' })).statusCode, 429);
});

test('snapshot import preserves IDs, password hashes, metadata and microseconds and refuses to overwrite', async (t) => {
  const pool = await database(t);
  const id = randomUUID();
  const bookId = randomUUID();
  const snapshot = {
    users: [{ id, email: 'migrated@example.com', password_hash: (await bcrypt.hash('legacy-password', 10)).replace('$2b$', '$2a$'), email_confirmed_at: '2026-01-01T00:00:00.123456Z', created_at: '2026-01-01T00:00:00.123456Z', user_metadata: { display_name: 'Migrated Reader' }, banned_until: null, deleted_at: null }],
    books: [{ id: bookId, user_id: id, created_at: '2026-01-02T03:04:05.123456Z', title: 'Migrated Book', author: 'Writer', start_date: null, end_date: '2026-02-03T04:05:06.654321Z', image_url: null, status: 'read', pages: 417, colour: '#123456' }],
  };
  const broken = { ...snapshot, books: [{ ...snapshot.books[0], user_id: randomUUID() }] };
  await assert.rejects(importSnapshot(pool, broken));
  assert.equal((await pool.query('SELECT count(*) FROM users')).rows[0].count, '0');
  const result = await importSnapshot(pool, snapshot);
  assert.equal(result.users, 1);
  assert.equal(result.books, 1);
  await assert.rejects(importSnapshot(pool, snapshot), /empty target/);
  const precision = await pool.query("SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS.US') AS value FROM books");
  assert.equal(precision.rows[0].value, '2026-01-02 03:04:05.123456');
  const app = await createApp({ pool, origin });
  t.after(() => app.close());
  const session = await signin(app, 'migrated@example.com');
  assert.equal((await call(app, 'GET', '/api/auth/me', undefined, session)).json().id, id);
  const books = (await call(app, 'GET', '/api/books', undefined, session)).json();
  assert.equal(books.length, 1);
  assert.equal(books[0].id, bookId);
  assert.equal(books[0].title, 'Migrated Book');
  assert.equal(Number(books[0].pages), 417);
});

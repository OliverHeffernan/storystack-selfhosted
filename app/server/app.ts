import { createHash, randomBytes } from 'node:crypto';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import bcrypt from 'bcryptjs';
import { parse } from 'csv-parse/sync';
import type pg from 'pg';

interface Options {
  pool: pg.Pool;
  origin: string;
  logger?: boolean;
}
interface User {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
}
interface BookInput {
  title: string;
  author: string;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  status: string;
  pages: number;
  colour: string | null;
}
const bookProperties = {
  title: { type: 'string', minLength: 1, maxLength: 2000 },
  author: { type: 'string', minLength: 1, maxLength: 2000 },
  start_date: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
  end_date: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
  image_url: { anyOf: [{ type: 'string', maxLength: 4096, pattern: '^(https?://|$)' }, { type: 'null' }] },
  status: { type: 'string', enum: ['want-to-read', 'reading', 'read'] },
  pages: { type: 'integer', minimum: 0, maximum: 10000000 },
  colour: { anyOf: [{ type: 'string', pattern: '^(#[a-fA-F0-9]{6}|default)$' }, { type: 'null' }] },
};
const credentials = {
  email: { type: 'string', format: 'email', maxLength: 320 },
  password: { type: 'string', minLength: 1, maxLength: 1024 },
};
const idParams = { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } };
const bookFields = Object.keys(bookProperties) as (keyof BookInput)[];
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const publicUser = (user: User): User => ({ id: user.id, email: user.email, user_metadata: user.user_metadata });
// Run a real bcrypt comparison even when an email is unknown.
const dummyHash = bcrypt.hashSync('not-a-user-password', 10);

export async function createApp({ pool, origin, logger = false }: Options) {
  const app = Fastify({
    logger: logger ? { redact: ['req.headers.cookie', 'req.headers.authorization'] } : false,
    bodyLimit: 5 * 1024 * 1024,
    trustProxy: '127.0.0.1',
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false } },
    disableRequestLogging: true,
  });
  const cookieName = origin.startsWith('https:') ? '__Host-storystack_session' : 'storystack_session';
  const cookieOptions = { path: '/', httpOnly: true, secure: origin.startsWith('https:'), sameSite: 'lax' as const };
  await app.register(cookie);
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
  app.decorateRequest('user', null);
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Cache-Control', 'no-store');
    reply.header('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.origin !== origin) {
      return reply.code(403).send({ message: 'Request origin not allowed.' });
    }
    if (request.routeOptions.config.authenticated) {
      const token = request.cookies[cookieName];
      if (!token || !/^[a-f0-9]{64}$/.test(token)) return reply.code(401).send({ message: 'Please sign in.' });
      const result = await pool.query<User>(`
        SELECT u.id,u.email,u.user_metadata FROM sessions s JOIN users u ON u.id=s.user_id
        WHERE s.token_hash=$1 AND s.expires_at>now() AND u.deleted_at IS NULL
        AND (u.banned_until IS NULL OR u.banned_until<=now())
      `, [hashToken(token)]);
      const user = result.rows[0];
      if (!user) return reply.code(401).send({ message: 'Your session has expired. Please sign in.' });
      request.user = user;
    }
  });
  app.setErrorHandler((error, request, reply) => {
    const err = error as { statusCode?: number; validation?: unknown; code?: string };
    if (err.validation) return reply.code(400).send({ message: 'Invalid request data.' });
    if (err.statusCode && err.statusCode < 500) {
      return reply.code(err.statusCode).send({ message: err.statusCode === 429 ? 'Too many requests. Please try again later.' : 'Invalid request.' });
    }
    // Never log SQL parameters, request bodies, or passwords.
    request.log.error({ code: err.code }, 'API request failed');
    return reply.code(500).send({ message: 'The request could not be completed.' });
  });

  app.get('/api/health', async () => {
    await pool.query('SELECT 1');
    return { status: 'ok' };
  });
  app.get('/api/auth/me', { config: { authenticated: true } }, async (request) => publicUser(request.user!));

  app.post<{ Body: { email: string; password: string } }>('/api/auth/signin', {
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
    schema: { body: { type: 'object', additionalProperties: false, required: ['email', 'password'], properties: credentials } },
  }, async (request, reply) => {
    const result = await pool.query<User & { password_hash: string; banned: boolean }>(`
      SELECT id,email,user_metadata,password_hash,
        (deleted_at IS NOT NULL OR banned_until>now()) IS TRUE AS banned
      FROM users WHERE lower(email)=lower($1)
    `, [request.body.email.trim()]);
    const user = result.rows[0];
    const matches = await bcrypt.compare(request.body.password, user?.password_hash || dummyHash);
    if (!user || !matches || user.banned) return reply.code(401).send({ message: 'Invalid email or password.' });
    const token = randomBytes(32).toString('hex');
    await pool.query('DELETE FROM sessions WHERE expires_at<=now()');
    await pool.query(`INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 days')`, [hashToken(token), user.id]);
    reply.setCookie(cookieName, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 });
    return publicUser(user);
  });

  app.post('/api/auth/signout', async (request, reply) => {
    const token = request.cookies[cookieName];
    if (token) await pool.query('DELETE FROM sessions WHERE token_hash=$1', [hashToken(token)]);
    reply.clearCookie(cookieName, cookieOptions);
    return reply.code(204).send();
  });

  app.post<{ Body: { email: string; password: string; display_name: string } }>('/api/auth/signup', {
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    schema: { body: {
      type: 'object', additionalProperties: false, required: ['email', 'password', 'display_name'],
      properties: { ...credentials, password: { type: 'string', minLength: 6, maxLength: 72 }, display_name: { type: 'string', minLength: 1, maxLength: 200 } },
    } },
  }, async (request, reply) => {
    // bcrypt hashes only the first 72 bytes, not 72 Unicode characters.
    if (Buffer.byteLength(request.body.password, 'utf8') > 72) return reply.code(400).send({ message: 'Password must be at most 72 UTF-8 bytes.' });
    const email = request.body.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(request.body.password, 12);
    const token = randomBytes(32).toString('hex');
    const client = await pool.connect();
    let user: User;
    try {
      await client.query('BEGIN');
      const result = await client.query<User>(`
        INSERT INTO users(email,password_hash,user_metadata) VALUES($1,$2,$3)
        ON CONFLICT (lower(email)) DO NOTHING
        RETURNING id,email,user_metadata
      `, [email, passwordHash, JSON.stringify({ display_name: request.body.display_name })]);
      if (!result.rows[0]) {
        await client.query('ROLLBACK');
        return reply.code(409).send({ message: 'This email is already registered. Please sign in.' });
      }
      user = result.rows[0];
      await client.query(`INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 days')`, [hashToken(token), user.id]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    reply.setCookie(cookieName, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 });
    return reply.code(201).send(publicUser(user));
  });

  app.get('/api/books', { config: { authenticated: true } }, async (request) => {
    const result = await pool.query('SELECT * FROM books WHERE user_id=$1 ORDER BY created_at,id', [request.user!.id]);
    return result.rows;
  });
  app.post<{ Body: BookInput }>('/api/books', {
    config: { authenticated: true },
    schema: { body: { type: 'object', additionalProperties: false, required: ['title', 'author', 'status', 'pages'], properties: bookProperties } },
  }, async (request, reply) => {
    const values = bookFields.map((field) => request.body[field] ?? null);
    const result = await pool.query(`INSERT INTO books(${bookFields.join(',')},user_id) VALUES(${values.map((_, i) => `$${i + 1}`).join(',')},$${values.length + 1}) RETURNING *`, [...values, request.user!.id]);
    return reply.code(201).send(result.rows[0]);
  });
  app.patch<{ Params: { id: string }; Body: Partial<BookInput> }>('/api/books/:id', {
    config: { authenticated: true },
    schema: { params: idParams, body: { type: 'object', additionalProperties: false, minProperties: 1, properties: bookProperties } },
  }, async (request, reply) => {
    const fields = bookFields.filter((field) => field in request.body);
    const values = fields.map((field) => request.body[field]);
    const result = await pool.query(`UPDATE books SET ${fields.map((field, i) => `${field}=$${i + 1}`).join(',')}
      WHERE id=$${values.length + 1} AND user_id=$${values.length + 2} RETURNING *`, [...values, request.params.id, request.user!.id]);
    if (!result.rowCount) return reply.code(404).send({ message: 'Book not found.' });
    return result.rows[0];
  });
  app.delete<{ Params: { id: string } }>('/api/books/:id', {
    config: { authenticated: true }, schema: { params: idParams },
  }, async (request, reply) => {
    const result = await pool.query('DELETE FROM books WHERE id=$1 AND user_id=$2', [request.params.id, request.user!.id]);
    if (!result.rowCount) return reply.code(404).send({ message: 'Book not found.' });
    return reply.code(204).send();
  });

  app.post<{ Body: { data: string } }>('/api/books/import', {
    config: { authenticated: true, rateLimit: { max: 10, timeWindow: '1 hour' } },
    schema: { body: { type: 'object', additionalProperties: false, required: ['data'], properties: { data: { type: 'string', minLength: 1 } } } },
  }, async (request, reply) => {
    let rows: Record<string, string>[];
    try {
      rows = parse(request.body.data, { columns: true, bom: true, skip_empty_lines: true, trim: true, max_record_size: 100000 });
    } catch {
      return reply.code(400).send({ message: 'The CSV file is malformed.' });
    }
    if (!rows.length || rows.length > 10000 || rows.some((row) => !('Title' in row) || !('Author' in row) || !('Exclusive Shelf' in row))) {
      return reply.code(400).send({ message: 'Choose a Goodreads CSV export containing between 1 and 10,000 books.' });
    }
    const date = (value: string | undefined) => {
      if (!value || !/^\d{4}[/-]\d{2}[/-]\d{2}$/.test(value)) return null;
      const day = value.replaceAll('/', '-');
      const parsed = new Date(`${day}T00:00:00.000Z`);
      return !isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day ? parsed.toISOString() : null;
    };
    const books = rows.map((row) => {
      const isbn = (row.ISBN13 || row.ISBN || '').replace(/[^0-9Xx]/g, '');
      const pages = Number.parseInt(row['Number of Pages'] || '0', 10);
      return {
        title: row.Title || 'Unknown Title', author: row.Author || 'Unknown Author',
        start_date: date(row['Date Added']), end_date: date(row['Date Read']),
        image_url: isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null,
        status: ['reading', 'currently-reading'].includes(row['Exclusive Shelf'] || '') ? 'reading' : row['Exclusive Shelf'] === 'read' ? 'read' : 'want-to-read',
        pages: Number.isInteger(pages) && pages >= 0 && pages <= 10000000 ? pages : 0,
      };
    });
    await pool.query(`INSERT INTO books(title,author,start_date,end_date,image_url,status,pages,user_id)
      SELECT title,author,start_date,end_date,image_url,status,pages,$1 FROM jsonb_to_recordset($2::jsonb)
      AS b(title text,author text,start_date timestamptz,end_date timestamptz,image_url text,status text,pages numeric)`, [request.user!.id, JSON.stringify(books)]);
    return { success: true, inserted: books.length, total: books.length };
  });
  return app;
}

declare module 'fastify' {
  interface FastifyRequest { user: User | null }
  interface FastifyContextConfig { authenticated?: boolean }
}

# StoryStack

Vue reading tracker with a self-hosted Node.js/TypeScript API and PostgreSQL.
The frontend calls same-origin `/api` endpoints; it needs no Supabase keys or
other backend SDK. Goodreads CSV import also runs in the Node API.

## Development

Use Node.js 22.12+ and PostgreSQL 17. Install dependencies separately:

```sh
npm ci
npm ci --prefix server
cp server/.env.example server/.env
npm run build --prefix server
```

Set `DATABASE_URL` in `server/.env` to a local database owned by your migration
role, then run:

```sh
node --env-file=server/.env server/build/migrate.js
npm run dev --prefix server
```

In another terminal, run `npm run dev` for Vue. Vite proxies `/api` to
`127.0.0.1:3100`; `APP_ORIGIN` must match the browser's exact origin (normally
`http://localhost:5173`). The API always listens on loopback.

Build the frontend with `npm run build` and the API with
`npm run build --prefix server`. Frontend output is `dist/`; API output is
`server/build/`.

## Accounts and permissions

Login uses bcrypt hashes and revocable PostgreSQL sessions. The browser receives
an HttpOnly, SameSite=Lax cookie, marked Secure on HTTPS. Mutating requests require
an `Origin` matching `APP_ORIGIN`. Every book query is scoped to the authenticated
user's ID; clients cannot choose an owner. Login/signup/import have rate limits.

Signup creates an account and signs the user in immediately. No SMTP or email
confirmation is used: an email address is an unverified login identifier, not
proof of ownership. Duplicate addresses are rejected case-insensitively and
cannot overwrite an existing account's password or profile. Password-reset
functionality is not provided; without email delivery there is no email-based
account recovery.

Supabase password hashes and confirmed-email status are preserved by the
migration. Supabase browser sessions are not accepted; users sign in again.

## Raspberry Pi deployment

Production on `alexs-pi` uses:

- App/source/build: `/home/ollieh/Documents/storystack-selfhosted/app`.
- Frontend: `app/dist`, served by existing user nginx on port `8144`.
- API: `storystack.service`, listening only on `127.0.0.1:3055`.
- Database: `storystack_production` at `127.0.0.1:55432`.
- Protected environment files: `config/runtime.env` and `config/migration.env`
  under the production root, mode `0600` in a `0700` directory.
- User nginx config: `/home/ollieh/.config/nginx/nginx.conf`.
- Existing Cloudflare Tunnel route: `storystack.olihef.com` → `localhost:8144`.

`deploy/pi/deploy/storystack.service` is the production unit template;
`deploy/pi/deploy/nginx-api.conf` contains the production proxy locations.
Only StoryStack's server block changes. Its root points at the production
`app/dist`; `/index.html` uses `Cache-Control: no-store` so SPA fallbacks receive
the current release. The original dirty checkout/dist at
`/home/ollieh/Documents/storystack` is preserved. Pre-cutover nginx/static files
are also retained under `storystack-selfhosted/rollback/pre-cutover/`.

```sh
systemctl --user status storystack.service
journalctl --user -u storystack.service
```

**The database volume is not disposable despite its staging name.** PostgreSQL
is managed by Compose project `storystack-staging`, with its Compose file at
`/home/ollieh/Documents/storystack-staging/compose.yaml`, container
`storystack-staging-postgres-1`, and volume `storystack_staging_pgdata`.
That cluster holds both production `storystack_production` and rehearsal
`storystack`. Do not delete the staging directory, prune this volume, or run
`docker compose down --volumes`. Backups are intentionally deferred.

New registrations need no mail service or additional environment variables.
Supabase remains intact with application book writes and new signups disabled;
it is no longer the live backend. Do not re-enable it without reconciling writes
made in the new database. Cloudflare now exempts StoryStack's `/api` paths from
the browser challenge; public health and unauthenticated API checks pass.
Frontend pages can still challenge automated clients. SSH/origin verification
alone does not test that edge layer.

### Recreating the isolated staging environment

Copy the contents of `deploy/pi/` into
`/home/ollieh/Documents/storystack-staging`, and put this repository's source
under its `app/` directory. These defaults match `alexs-pi`; adjust paths/ports
in the service, Compose file and config generator together for another host.

From that staging directory:

```sh
sh deploy/prepare-config.sh
docker compose up -d postgres
npm ci --prefix app
npm ci --prefix app/server
npm run build --prefix app
npm run build --prefix app/server
node --env-file=config/migration.env app/server/build/migrate.js
```

The generator refuses to overwrite existing credentials. `config/` and
`secrets/` are private and must not be committed. PostgreSQL runs in Docker with
a dedicated named volume, `restart: unless-stopped`, and only
`127.0.0.1:55432` published. The owner role applies migrations; the restricted
runtime role cannot create/alter/drop tables or roles. After migrating, revoke
the runtime role's default table privileges on `schema_migrations`.

Install the Node service after migrations and validation:

```sh
mkdir -p "$HOME/.config/systemd/user"
cp deploy/storystack-staging.service "$HOME/.config/systemd/user/"
systemctl --user daemon-reload
systemctl --user enable --now storystack-staging.service
```

The service reads `config/runtime.env`, listens on `127.0.0.1:3054`, and retries
failed starts without exhausting its retry budget. User lingering must be
enabled for boot-time startup; it is already enabled for `ollieh` on `alexs-pi`.
Inspect it with `systemctl --user status storystack-staging.service` and
`journalctl --user -u storystack-staging.service`.

The existing Cloudflare Tunnel reaches user nginx on port 8144 for
`storystack.olihef.com`. Its actual configuration is
`/home/ollieh/.config/nginx/nginx.conf`. At approved cutover, add the locations
in `deploy/pi/deploy/nginx-api.conf` inside **only** the StoryStack server block
(the snippet uses production port 3055),
and point that block's frontend root at the validated release's `app/dist`.
Preserve the previous root and files for rollback. Validate the entire nginx
configuration before reloading the existing user nginx process. Do not replace
the shared nginx config, root nginx instance, or Cloudflare Tunnel.

Staging deployment does not switch the live frontend. Live cutover and source
write-freezing require separate approval. Backups are intentionally deferred;
do not run `docker compose down -v` on a database containing wanted data.

## Supabase data migration

`server/export-supabase.ts` uses the Management API and a single read-only SQL
statement to export a consistent snapshot of books and the necessary account
fields, including bcrypt hashes and metadata. It requires an authorized
`SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` in its environment. Keep them
out of shell history, logs and Git. The output file is created exclusively with
0600 permissions and must be transferred privately.

```sh
node server/build/export-supabase.js /private/path/snapshot.json
node --env-file=/private/path/migration.env server/build/import-supabase.js /private/path/snapshot.json
```

Apply migrations before importing. The importer accepts **only an empty target**,
locks the relevant tables, imports in one transaction, and verifies every typed
record before committing. It preserves IDs, ownership, password hashes,
metadata, numeric values and PostgreSQL timestamp microseconds. It prints only
counts and checksums; failed imports roll back rather than overwriting data.

Rehearse on staging first. For final cutover, pause source book writes and new
signups, take a fresh export, and import into a fresh target database. Then switch
the API database and nginx/frontend routing and verify login, listing,
create/edit/delete and CSV import. Keep Supabase intact. Once writes reach the
new backend, a rollback must reconcile those writes before restoring the old
frontend/backend; pointing back blindly loses changes.

## Tests

The API tests use real PostgreSQL, not mocked SQL. Set `TEST_DATABASE_URL` to a
disposable database where the role can create schemas:

```sh
npm test --prefix server
```

Each test creates a random isolated schema and drops only that schema afterward.
Coverage includes imported bcrypt login, cross-account book isolation, input
validation, cookie session expiry/revocation/persistence, Goodreads CSV parsing,
immediate signup, duplicate-account protection, banned/deleted-account denial,
and transactional snapshot preservation/overwrite refusal.

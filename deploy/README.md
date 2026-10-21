# StoryStack Pi production deployment

- Production root: `/home/ollieh/Documents/storystack-selfhosted`.
- Independent validated app/source/build: `app/`; frontend: `app/dist`.
- User service: `storystack.service`; Node listens on `127.0.0.1:3055`.
- Service template: `deploy/storystack.service`.
- Runtime and migration settings: `config/runtime.env` and `config/migration.env`,
  mode `0600` in a `0700` directory. Never commit or print these files.
- Production database: `storystack_production`, owner `storystack_owner`,
  restricted application role `storystack_runtime`.
- Postgres host endpoint: `127.0.0.1:55432`.
- Signup is available without SMTP or email confirmation: successful signup
  creates the account and session together and signs the user in immediately.
  Email ownership is not verified; `email_confirmed_at` remains null for signup.

## Current signup release

Deployed release: [`f197c82`](https://github.com/OliverHeffernan/storystack/commit/f197c8202a1e5917e44d81dc01f109e06266a559).
The independent production `app/` contains the exact staged source, build and
dependencies that passed all four backend tests and desktop/mobile staging
browser checks. Only `storystack.service` was restarted; no database migration,
credential, nginx, tunnel or Compose change was needed. Production browser
verification of this release passed; the procedure and its limitation are below.

Live bundle: `assets/index-CfHmrZxx.js`, SHA256
`a864237418110ee52bd5bcac9e2e743e22468fd69cbbb15c1c37cc89b199f41c`.
The previous hashed assets remain available at their original URLs for open tabs.
Local live nginx is on `8144`; public API health returns `200` and anonymous
auth/books requests return `401` JSON. Automated public frontend requests still
encounter Cloudflare's `403` challenge; browser verification must distinguish
live static assets forwarded through SSH from direct public HTTPS API requests.

The complete prior runnable `app/`, including source, build, dependency manifests,
installed dependencies and dist, is protected at
`rollback/signup-no-email-20261021T110220Z/app`. Retain it for release rollback.
Restoring that app and restarting only `storystack.service` restores the previous
code, not the database. Accounts registered by this release remain unverified
and cannot sign in through the prior confirmation-required backend; coordinate
that consequence before rollback rather than editing users or verification dates.

Sanitized deployment evidence:
`/home/ollieh/.amp/in/artifacts/storystack-signup-production-deploy.json`.

## The existing database volume now holds production

The Postgres cluster is still managed by Compose project `storystack-staging`
at `/home/ollieh/Documents/storystack-staging/compose.yaml`. Its container is
`storystack-staging-postgres-1`, and its persistent named volume is
`storystack_staging_pgdata`. The cluster contains BOTH the rehearsal database
`storystack` and the production database `storystack_production`.

**Do not remove this volume. Do not run `docker compose down --volumes`,
`docker volume rm storystack_staging_pgdata`, or volume-pruning commands.**
The staging name does not mean that this cluster or volume is disposable.
The production app and configuration do not live under the staging directory,
but the database cluster intentionally remains shared.

## Live routing and source freeze

The frozen-source final snapshot was imported on 2026-10-21, and the production
service is enabled. The StoryStack nginx block now serves this release.
Initial migration browser verification passed from Mac Chrome through canonical HTTPS
request interception and SSH forwarding to LIVE nginx `8144`, Node `3055`, and
the production database: 32 API requests and zero page errors. Supabase remains
frozen under the Mac thread's control; do not re-enable source writes here.
Runtime access to `schema_migrations` remains revoked. Those initial cutover
checks used SSH because of Cloudflare's browser challenge. Public API probes
now succeed as described above; no Cloudflare settings were changed for this
signup release.

`deploy/nginx.production.conf` matches the applied shared user nginx
configuration. It changes only the StoryStack server on port `8144`:
serve the production `app/dist`, send `/api/` to `127.0.0.1:3055`, set exact
`/index.html` responses to `Cache-Control: no-store`, and overwrite
`X-Forwarded-For` with `$remote_addr`. Other site blocks remain unchanged.

The live configuration is `/home/ollieh/.config/nginx/nginx.conf`. Its existing
Cloudflare Tunnel route remains `storystack.olihef.com` to `localhost:8144`.
No Cloudflare settings changes are part of this deployment.

Rollback configuration and previously served files are preserved under
`rollback/pre-cutover/nginx.conf` and `rollback/pre-cutover/live-dist`.
The original checkout `/home/ollieh/Documents/storystack` and its dirty `dist`
remain untouched. These rollback copies are not database backups.
Restoring the old frontend does not reconcile any new Postgres writes back to
Supabase. Coordinate rollback and data reconciliation before thawing the source.

## Final verification and private-transfer cleanup

The full post-rebase backend integration suite passed all four tests in isolated
rehearsal schemas, with unchanged public tables and no leftover test schemas.
Mac Chrome then verified the current production release with **40 direct public
HTTPS/Cloudflare API requests and zero JavaScript errors**. Desktop/mobile checks
covered signup `201` and immediate Dashboard access, secure HttpOnly/SameSite
cookies, persistence after reload, book CRUD and cross-account `404`, UI signout
and relogin, uppercase duplicate signup `409` without replacing the original
password/profile, and legacy confirmation redirects that remove the token hash
without calling the confirmation API.

Only HTML/static assets were intercepted through SSH to live nginx `8144`;
every API request used public HTTPS through Cloudflare without interception.
Automated public frontend pages still return `403`, so direct public delivery
of the frontend document/assets remains unverified. This is not an all-public
frontend browser pass. An initial partial run stopped on the harness's overly
strict Sign Out selector; its exact two test accounts and dependents were removed
before the corrected full run passed.

After the full run, only its two exact synthetic accounts were removed; the
harness had already removed their books/sessions. Every production public-table
checksum equals the predeployment baseline, including 3 real users and 120 books.
The private `config/signup-deployment-cleanup.json` was set to `0600` before
reading and deleted after scoped cleanup. Earlier disposable migration files
`config/browser-fixture.json` and `config/final-snapshot.json` also remain deleted;
protected runtime/migration configuration remains unchanged.

The browser runs consumed the in-memory signup quota. One final authorized
`storystack.service` restart cleared that test-induced quota after verification;
no rate-limit or security setting changed, and no signup/write probes followed.
The production service remains enabled and healthy. Public health returns `200`
and anonymous auth/books return `401` JSON. Other services, app files, database
schema and protected rollback release remain unchanged.

Sanitized Pi evidence is stored at:

- `/home/ollieh/.amp/in/artifacts/storystack-signup-production-final-verification.json`
- `/home/ollieh/.amp/in/artifacts/storystack-signup-production-deploy.json`
- `/home/ollieh/.amp/in/artifacts/storystack-signup-ship-backend-tests.tap`
- `/home/ollieh/.amp/in/artifacts/storystack-backend-v2-tests.tap`
- `/home/ollieh/.amp/in/artifacts/storystack-live-cutover.log`
- `/home/ollieh/.amp/in/artifacts/storystack-final-production-verification.log`

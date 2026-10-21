#!/bin/sh
set -eu

: "${STORYSTACK_OWNER_PASSWORD:?Owner password must be provided by the entrypoint}"
: "${STORYSTACK_RUNTIME_PASSWORD:?Runtime password must be provided by the entrypoint}"

psql --set ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<'SQL'
\getenv owner_password STORYSTACK_OWNER_PASSWORD
\getenv runtime_password STORYSTACK_RUNTIME_PASSWORD

CREATE ROLE storystack_owner LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
  NOREPLICATION NOBYPASSRLS PASSWORD :'owner_password';
CREATE ROLE storystack_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
  NOREPLICATION NOBYPASSRLS PASSWORD :'runtime_password';
CREATE DATABASE storystack OWNER storystack_owner;

REVOKE ALL ON DATABASE storystack FROM PUBLIC;
GRANT CONNECT ON DATABASE storystack TO storystack_runtime;

\connect storystack
ALTER SCHEMA public OWNER TO storystack_owner;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO storystack_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE storystack_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO storystack_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE storystack_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO storystack_runtime;
SQL

unset STORYSTACK_OWNER_PASSWORD STORYSTACK_RUNTIME_PASSWORD

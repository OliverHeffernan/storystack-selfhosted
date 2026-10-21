#!/bin/sh
set -eu

# Compose file-backed secrets retain host ownership. Read them before the
# official entrypoint drops privileges, keeping host credential files 0600.
STORYSTACK_OWNER_PASSWORD="$(cat /run/secrets/owner_password)"
STORYSTACK_RUNTIME_PASSWORD="$(cat /run/secrets/runtime_password)"
export STORYSTACK_OWNER_PASSWORD STORYSTACK_RUNTIME_PASSWORD

exec /usr/local/bin/docker-entrypoint.sh "$@"

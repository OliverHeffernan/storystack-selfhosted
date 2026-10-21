#!/bin/sh
set -eu
umask 077

root="$(dirname "$(dirname "$(readlink -f "$0")")")"

for file in secrets/postgres_password secrets/owner_password secrets/runtime_password config/runtime.env config/migration.env; do
  if [ -e "$root/$file" ]; then
    printf 'Refusing to replace existing configuration: %s\n' "$file" >&2
    exit 1
  fi
done

mkdir -p "$root/secrets" "$root/config"
chmod 700 "$root/secrets" "$root/config"

for role in postgres owner runtime; do
  openssl rand -hex 32 > "$root/secrets/${role}_password"
done

runtime_password="$(cat "$root/secrets/runtime_password")"
owner_password="$(cat "$root/secrets/owner_password")"

{
  printf 'NODE_ENV=production\nHOST=127.0.0.1\nPORT=3054\nAPP_ORIGIN=https://storystack.olihef.com\n'
  printf 'DATABASE_URL=postgresql://storystack_runtime:%s@127.0.0.1:55432/storystack\n' "$runtime_password"
} > "$root/config/runtime.env"
printf 'DATABASE_URL=postgresql://storystack_owner:%s@127.0.0.1:55432/storystack\n' "$owner_password" > "$root/config/migration.env"

unset runtime_password owner_password
printf 'Generated staging credentials and protected environment files; values omitted.\n'

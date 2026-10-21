import { writeFile } from 'node:fs/promises';

// Uses the Supabase Management API, not an application/service-role key.
// One read-only SQL statement gives a consistent snapshot of books and accounts.
const { SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF } = process.env;
const destination = process.argv[2];
if (!SUPABASE_ACCESS_TOKEN || !SUPABASE_PROJECT_REF || !destination) {
  throw new Error('Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF; pass a private output filename.');
}
const response = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ read_only: true, query: `SELECT json_build_object(
    'exported_at',now(),
    'users',(SELECT coalesce(json_agg(json_build_object(
      'id',id,'email',email,'password_hash',encrypted_password,'email_confirmed_at',email_confirmed_at,
      'created_at',created_at,'user_metadata',raw_user_meta_data,'banned_until',banned_until,
      'deleted_at',deleted_at)), '[]'::json) FROM auth.users),
    'books',(SELECT coalesce(json_agg(b), '[]'::json) FROM public.books b)
  ) AS snapshot` }),
});
if (!response.ok) throw new Error(`Supabase export failed (HTTP ${response.status}); no response data logged.`);
const result = await response.json() as { snapshot: { users: unknown[]; books: unknown[] } }[];
const snapshot = result[0]?.snapshot;
if (!snapshot || !Array.isArray(snapshot.users) || !Array.isArray(snapshot.books)) throw new Error('Unexpected Supabase export format.');
// Refuse to overwrite an earlier snapshot, and never write account hashes world-readable.
await writeFile(destination, JSON.stringify(snapshot), { mode: 0o600, flag: 'wx' });
console.log(`Exported ${snapshot.users.length} users and ${snapshot.books.length} books.`);

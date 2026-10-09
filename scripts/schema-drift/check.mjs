// WHY-100: does the schema the repo builds match production?
//
// Builds supabase/schema.sql + supabase/migrations/*.sql (sorted) in PGlite,
// an in-process Postgres, and compares every public column, constraint,
// index, RLS policy, RLS flag, trigger and function against production.
//
//   SUPABASE_DB_URL=postgres://… npm run db:drift
//     Compare against production. Use a read-only connection: the script
//     runs only the SELECT in catalog.sql. Exit 1 on drift.
//   npm run db:drift -- --repo-only
//     Just build the repo schema and print its catalog (no credentials).
//
// Not compared: storage buckets/policies, extensions, grants.
//
// Known noise, ignored: PGlite's newer Postgres records NOT NULL as
// pg_constraint rows (`<table>_<col>_not_null`) and production's Postgres 17
// doesn't. Column nullability is still compared via the `col|` lines.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const catalogSql = fs.readFileSync(path.join(here, 'catalog.sql'), 'utf8')

// Stand-ins for what Supabase provisions before any repo SQL runs.
const SUPABASE_STUBS = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE SCHEMA IF NOT EXISTS storage;
  CREATE TABLE IF NOT EXISTS storage.buckets (id text primary key, name text, public boolean);
  CREATE TABLE IF NOT EXISTS storage.objects (id uuid primary key default uuid_generate_v4(), bucket_id text, name text);
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
`

export async function repoLines() {
  const db = new PGlite({ extensions: { uuid_ossp } })
  await db.exec(SUPABASE_STUBS)
  const migrations = fs.readdirSync(path.join(root, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort()
  for (const f of ['schema.sql', ...migrations.map((m) => `migrations/${m}`)]) {
    try {
      await db.exec(fs.readFileSync(path.join(root, 'supabase', f), 'utf8'))
    } catch (err) {
      throw new Error(`supabase/${f} failed to apply on a fresh database: ${err.message}`)
    }
  }
  const r = await db.query(catalogSql)
  await db.close()
  return r.rows.map((x) => x.line)
}

async function prodLines(url) {
  const pg = (await import('pg')).default
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query('SET TRANSACTION READ ONLY')
    const r = await client.query(catalogSql)
    return r.rows.map((x) => x.line)
  } finally {
    await client.end()
  }
}

const isNotNullNoise = (line) => /^con\|[^|]+\|[^|]+_not_null\|NOT NULL /.test(line)

const repo = await repoLines()
if (process.argv.includes('--repo-only')) {
  console.log(repo.join('\n'))
  console.error(`\n${repo.length} objects built from supabase/schema.sql + migrations`)
  process.exit(0)
}

const url = process.env.SUPABASE_DB_URL
if (!url) {
  console.error('SUPABASE_DB_URL is not set. Use a read-only Postgres connection string for production,\nor pass --repo-only to only build the repo schema.')
  process.exit(2)
}

const prod = await prodLines(url)
const prodSet = new Set(prod)
const repoSet = new Set(repo)
const onlyProd = prod.filter((l) => !repoSet.has(l))
const onlyRepo = repo.filter((l) => !prodSet.has(l) && !isNotNullNoise(l))

console.log(`repo: ${repo.length} objects · production: ${prod.length} objects`)
if (onlyProd.length === 0 && onlyRepo.length === 0) {
  console.log('No schema drift: the repo builds what production has.')
  process.exit(0)
}
if (onlyProd.length) console.log(`\nIn production, not in the repo (${onlyProd.length}):\n` + onlyProd.map((l) => '  + ' + l).join('\n'))
if (onlyRepo.length) console.log(`\nIn the repo, not in production (${onlyRepo.length}):\n` + onlyRepo.map((l) => '  - ' + l).join('\n'))
console.log('\nRecord production-only objects in a new supabase/migrations file (guarded, so it is a no-op on production),\nor apply repo-only objects to production through a reviewed migration.')
process.exit(1)

-- WHY-100: one normalized text line per schema object in `public`, run
-- identically against the repo-built schema (PGlite) and production, then
-- diffed by scripts/schema-drift/check.mjs. `extensions.` prefixes are
-- stripped because Supabase installs extensions in their own schema.
select line from (
  select 'col|'||table_name||'|'||column_name||'|'||data_type||'|null='||is_nullable||'|def='||coalesce(replace(column_default,'extensions.',''),'-') as line
    from information_schema.columns where table_schema='public'
  union all
  select 'con|'||conrelid::regclass::text||'|'||conname||'|'||replace(pg_get_constraintdef(oid),'extensions.','')
    from pg_constraint where connamespace='public'::regnamespace
  union all
  select 'idx|'||tablename||'|'||indexname||'|'||replace(indexdef,'extensions.','')
    from pg_indexes where schemaname='public'
  union all
  select 'pol|'||tablename||'|'||policyname||'|'||cmd||'|'||roles::text||'|q='||coalesce(qual,'-')||'|c='||coalesce(with_check,'-')
    from pg_policies where schemaname='public'
  union all
  select 'rls|'||relname||'|'||relrowsecurity::text
    from pg_class where relnamespace='public'::regnamespace and relkind='r'
  union all
  select 'trg|'||tgrelid::regclass::text||'|'||tgname||'|'||pg_get_triggerdef(oid)
    from pg_trigger where not tgisinternal and tgrelid in (select oid from pg_class where relnamespace='public'::regnamespace)
  union all
  select 'fn|'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')'
    from pg_proc p where p.pronamespace='public'::regnamespace
      and not exists (select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')
) x order by line

-- WHY-114: retire the whisky tour lead capture and lock down its table.
--
-- whisky_tour_leads was created by hand in production and never recorded in
-- the repo (found by the WHY-100 schema drift audit, 2026-10-09). This
-- records it as it exists, so the repo schema matches production. On
-- production, CREATE TABLE IF NOT EXISTS and ENABLE RLS are no-ops; only the
-- two DROP POLICY statements change anything.
--
-- The table is kept, not dropped (decision 2026-10-09): its 3 enquiries
-- (May 2026) are safer in a locked-down table than only in an exported file,
-- and keeping it is reversible. Review them when the next whisky tour is
-- planned; delete them if there isn't one.
--
-- After this: RLS on, no policies, so anon and authenticated can neither
-- read nor write. Only the service role (admin/server code) can. Nothing in
-- the app reads or writes it any more (/api/whisky-tour-lead removed in
-- WHY-114).
--
-- Committed before being applied to production; applied as migration
-- why114_whisky_tour_leads_lockdown; verified via pg_policies and an anon
-- insert test that must fail.

CREATE TABLE IF NOT EXISTS public.whisky_tour_leads (
  id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text        NOT NULL,
  last_name  text        NOT NULL,
  email      text        NOT NULL,
  phone      text        NOT NULL,
  travelers  text,
  period     text,
  message    text,
  tour       text,
  source     text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.whisky_tour_leads ENABLE ROW LEVEL SECURITY;

-- Both were INSERT TO public WITH CHECK (true): anyone holding the public
-- anon key could insert rows, with or without the API route.
DROP POLICY IF EXISTS "allow inserts" ON public.whisky_tour_leads;
DROP POLICY IF EXISTS "Anon insert whisky_tour_leads" ON public.whisky_tour_leads;

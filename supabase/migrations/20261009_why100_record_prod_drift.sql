-- WHY-100 PR A: record objects that exist in production but were never in
-- the repo (schema drift audit, 2026-10-09). Every statement is guarded, so
-- on production this changes nothing; on a fresh database (a CI database,
-- WHY-98 PR B) it builds what production actually has.
--
-- Definitions copied from production's catalog (pg_get_functiondef,
-- pg_get_triggerdef, pg_get_constraintdef, information_schema.columns).
-- Verified with scripts/schema-drift: after this, the repo-built schema and
-- production differ only by known noise.

-- tours: SEO title columns added by hand.
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS meta_title_en TEXT;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS meta_title_ka TEXT;

-- contact_submissions: client IP, and the tour_slug foreign key.
ALTER TABLE public.contact_submissions ADD COLUMN IF NOT EXISTS ip_address TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_submissions_tour_slug_fkey') THEN
    ALTER TABLE public.contact_submissions
      ADD CONSTRAINT contact_submissions_tour_slug_fkey FOREIGN KEY (tour_slug) REFERENCES public.tours(slug);
  END IF;
END $$;

-- updated_at trigger function, and the two tables that use it. Only tours
-- and news bump updated_at automatically; services, transfer_routes and
-- destinations rely on the admin PUT handlers setting it (WHY-103 note).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at' AND pronamespace = 'public'::regnamespace
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION public.update_updated_at()
       RETURNS trigger
       LANGUAGE plpgsql
      AS $body$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $body$
    $fn$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_tours_updated_at' AND tgrelid = 'public.tours'::regclass) THEN
    CREATE TRIGGER set_tours_updated_at BEFORE UPDATE ON public.tours
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_news_updated_at' AND tgrelid = 'public.news'::regclass) THEN
    CREATE TRIGGER set_news_updated_at BEFORE UPDATE ON public.news
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

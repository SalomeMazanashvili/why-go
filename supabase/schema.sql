CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL, subtitle_en TEXT, description_en TEXT, tag_en TEXT,
  title_ka TEXT, subtitle_ka TEXT, description_ka TEXT, tag_ka TEXT,
  destination TEXT NOT NULL,
  price_from NUMERIC(10,2), currency TEXT DEFAULT 'USD', duration_days INT,
  cover_image TEXT, gallery TEXT[],
  sort_order INT DEFAULT 0, is_featured BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL, excerpt_en TEXT, content_en TEXT, tag_en TEXT,
  title_ka TEXT, excerpt_ka TEXT, content_ka TEXT, tag_ka TEXT,
  cover_image TEXT, author TEXT DEFAULT 'Whygo Team', reading_time_min INT DEFAULT 5,
  is_featured BOOLEAN DEFAULT false, is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL, email TEXT NOT NULL,
  tour_slug TEXT, message TEXT, language TEXT DEFAULT 'en', status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tours" ON tours FOR SELECT USING (is_active = true);
CREATE POLICY "Public read news" ON news FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone insert contact" ON contact_submissions FOR INSERT WITH CHECK (true);

-- Admin-managed content (editable text keyed by slug)
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value_en TEXT,
  value_ka TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin-managed branding / theme settings (colors, font sizes, etc.)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);

-- Admin users. Passwords are scrypt-hashed by the app before insert.
-- Accessed only via the service-role key from admin API routes.
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
-- No public policies; service role bypasses RLS.

-- Storage bucket for admin-uploaded images (tour + news covers).
-- Public read; writes only via service role (used by /api/admin/upload).
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read uploads" ON storage.objects;
CREATE POLICY "Public read uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

-- WHY-63: tour needs a public-facing credential string for the guide/expert
-- (never a real name — one expert cannot be publicly associated with the
-- company). Georgian only, per CLAUDE.md.
ALTER TABLE tours ADD COLUMN IF NOT EXISTS expert_credential_ka TEXT;

-- WHY-63: destinations collection. Standalone (no FKs into it yet — services,
-- transfer_routes, guides will reference this in PR C). SEO fields added
-- up-front because WHY-69 requires unique per-page metadata and destination
-- hubs are the main organic-ranking target; adding these later means a
-- migration plus manual backfill of any live rows.
CREATE TABLE IF NOT EXISTS destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ka TEXT,
  country TEXT,
  description_en TEXT,
  description_ka TEXT,
  seo_title_ka TEXT,
  seo_description_ka TEXT,
  cover_image TEXT,
  is_published BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read destinations" ON destinations;
CREATE POLICY "Public read destinations" ON destinations
  FOR SELECT USING (is_published = true);

-- WHY-63 PR B: service_categories — taxonomy for the experience layer
-- (transfers, day trips, cooking classes, water activities, etc.). Standalone;
-- services in PR C reference this via category_id.
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ka TEXT,
  description_en TEXT,
  description_ka TEXT,
  icon TEXT,
  is_published BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read service_categories" ON service_categories;
CREATE POLICY "Public read service_categories" ON service_categories
  FOR SELECT USING (is_published = true);

-- WHY-63 PR B: guides — real named Georgian-speaking guides for the experience
-- layer. NOTE: The Oktoberfest tour expert must NEVER be added here — that
-- credential lives in tours.expert_credential_ka and stays anonymous per
-- CLAUDE.md. Only add guides who have consented to public identity.
CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ka TEXT,
  bio_en TEXT,
  bio_ka TEXT,
  photo TEXT,
  languages TEXT,
  destinations_covered TEXT,
  specialties_en TEXT,
  specialties_ka TEXT,
  is_published BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read guides" ON guides;
CREATE POLICY "Public read guides" ON guides
  FOR SELECT USING (is_published = true);

-- WHY-63 PR C: services — the experience-layer products (transfers, day
-- trips, cooking classes, food tours, water activities). Sold to Georgians
-- who booked their own trip; this is the growth product. Each service
-- belongs to a destination hub and a category. FKs use ON DELETE RESTRICT
-- so a destination or category cannot be silently deleted while services
-- still reference it — the admin has to unlink first.
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  destination_id UUID REFERENCES destinations(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES service_categories(id) ON DELETE RESTRICT,
  name_en TEXT NOT NULL,
  name_ka TEXT,
  short_description_en TEXT,
  short_description_ka TEXT,
  description_en TEXT,
  description_ka TEXT,
  seo_title_ka TEXT,
  seo_description_ka TEXT,
  price_from NUMERIC(10,2),
  currency TEXT DEFAULT 'GEL',
  duration_hours NUMERIC(4,1),
  min_group_size INT,
  max_group_size INT,
  cover_image TEXT,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read services" ON services;
CREATE POLICY "Public read services" ON services
  FOR SELECT USING (is_published = true);

-- WHY-63 PR C: transfer_routes — point-to-point transfer products.
-- Both endpoints FK to destinations (RESTRICT). Programmatic pages built
-- on top of this table need 300+ words of unique Georgian content per
-- CLAUDE.md — do not publish empty routes.
CREATE TABLE IF NOT EXISTS transfer_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  from_destination_id UUID REFERENCES destinations(id) ON DELETE RESTRICT,
  to_destination_id UUID REFERENCES destinations(id) ON DELETE RESTRICT,
  from_name_en TEXT NOT NULL,
  from_name_ka TEXT,
  to_name_en TEXT NOT NULL,
  to_name_ka TEXT,
  description_en TEXT,
  description_ka TEXT,
  seo_title_ka TEXT,
  seo_description_ka TEXT,
  price_from NUMERIC(10,2),
  currency TEXT DEFAULT 'GEL',
  duration_minutes INT,
  vehicle_type TEXT,
  max_passengers INT,
  is_published BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transfer_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read transfer_routes" ON transfer_routes;
CREATE POLICY "Public read transfer_routes" ON transfer_routes
  FOR SELECT USING (is_published = true);

-- WHY-66 PR A: inquiries — service booking requests from the public forms
-- (transfers, day trips, guides, experiences). Anon can INSERT only; no
-- SELECT/UPDATE/DELETE policy so default-deny applies to reads. Admin
-- routes use the service role and bypass RLS. Service and destination FKs
-- are ON DELETE SET NULL because inquiries are historical records — if a
-- service or destination is discontinued and deleted, past inquiries must
-- survive with a null reference rather than block the delete (opposite of
-- the RESTRICT policy used for editorial content in WHY-63 PR C).
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_type TEXT NOT NULL CHECK (service_type IN ('transfer', 'day_trip', 'guide', 'experience')),
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  travel_date DATE,
  travel_time TIME,
  passengers INT,
  luggage_pieces INT,
  pickup_from TEXT,
  pickup_to TEXT,
  interests TEXT[],
  payment_method TEXT CHECK (payment_method IN ('cash', 'iban')),
  payment_status TEXT NOT NULL DEFAULT 'not_applicable' CHECK (payment_status IN ('awaiting', 'received', 'not_applicable')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'declined')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  language TEXT DEFAULT 'ka',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon insert inquiries" ON inquiries;
CREATE POLICY "Anon insert inquiries" ON inquiries FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS inquiries_status_idx ON inquiries(status);
CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_destination_id_idx ON inquiries(destination_id);

-- WHY-66 PR A: destination_contacts — admin-only routing data mapping each
-- destination to its contracted driver and/or guide. Powers the WhatsApp
-- copy block in the inquiry admin surface (PR C). Internal operational
-- data — no public read policy. ON DELETE CASCADE from destinations
-- because contact rows are worthless without the destination they route
-- to; the destinations DELETE preflight in WHY-63 PR C already blocks
-- deletion when services or transfer_routes reference the destination.
CREATE TABLE IF NOT EXISTS destination_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('driver', 'guide')),
  name TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  whatsapp_e164 TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE destination_contacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS destination_contacts_destination_id_idx ON destination_contacts(destination_id);

-- WHY-66 PR B: rate_limits — per-IP throttle for /api/inquiries. Keys are
-- namespaced like "inquiries:<ip>". Anon has no policy so RLS default-deny
-- applies; the throttle runs exclusively via the service role from the
-- inquiry submission handler. Small race is acceptable for a spam limiter.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- WHY-66 hotfix: consultative inquiries need a proper date range, not
-- a start-date + start-time pair. travel_date holds the departure date;
-- travel_date_end holds the return date. Transactional inquiries keep
-- using travel_date + travel_time as before.
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS travel_date_end DATE;

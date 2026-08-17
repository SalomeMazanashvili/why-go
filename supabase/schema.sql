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

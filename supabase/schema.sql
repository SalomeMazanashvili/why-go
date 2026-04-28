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

-- WHY-121: the /contact form takes a phone number (required: it's how the
-- founders confirm) and email becomes optional. The "მაინტერესებს" tour
-- dropdown is gone; tour_slug stays as a column for old rows but is no
-- longer written.
--
-- contact_submissions has 0 rows (checked 2026-10-11), so the new
-- constraints validate immediately.

ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE contact_submissions ALTER COLUMN email DROP NOT NULL;

-- E.164 as the API stores it (normalizePhone: +995… for local numbers).
ALTER TABLE contact_submissions
  ADD CONSTRAINT contact_submissions_phone_e164 CHECK (phone ~ '^\+[0-9]{7,15}$');
ALTER TABLE contact_submissions ALTER COLUMN phone SET NOT NULL;

-- CLAUDE.md rule 4: anon may only INSERT on inquiries. This policy let
-- anyone with the public anon key write rows straight through the REST API,
-- skipping the route's validation and rate limit. The route writes with the
-- service role, so nothing on the site depends on it.
DROP POLICY IF EXISTS "Anyone can insert contact" ON contact_submissions;

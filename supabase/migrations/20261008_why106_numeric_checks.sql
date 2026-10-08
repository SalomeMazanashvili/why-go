-- WHY-106: numeric sanity at the database, mirroring src/lib/numericFields.ts
-- (admin) and src/lib/inquiryValidation.ts (public inquiries). The API checks
-- first; these refuse a bad value that bypasses it, e.g. a Supabase
-- dashboard edit. Every live row was checked against these on 2026-10-08.
--
-- Committed before being applied to production (WHY-83 lesson: repo and DB
-- must not drift). Applied as migration why106_numeric_checks; verified via
-- pg_constraint. Not covered: rate_limits.count (internal counter, never
-- edited by hand).

ALTER TABLE tours
  ADD CONSTRAINT tours_price_from_nonneg      CHECK (price_from IS NULL OR price_from >= 0),
  ADD CONSTRAINT tours_duration_days_pos      CHECK (duration_days IS NULL OR duration_days >= 1),
  ADD CONSTRAINT tours_sort_order_nonneg      CHECK (sort_order IS NULL OR sort_order >= 0);

ALTER TABLE services
  ADD CONSTRAINT services_price_from_nonneg   CHECK (price_from IS NULL OR price_from >= 0),
  ADD CONSTRAINT services_duration_hours_half CHECK (duration_hours IS NULL OR (duration_hours >= 0.5 AND duration_hours * 2 = floor(duration_hours * 2))),
  ADD CONSTRAINT services_min_group_pos       CHECK (min_group_size IS NULL OR min_group_size >= 1),
  ADD CONSTRAINT services_max_group_pos       CHECK (max_group_size IS NULL OR max_group_size >= 1),
  ADD CONSTRAINT services_group_order         CHECK (min_group_size IS NULL OR max_group_size IS NULL OR min_group_size <= max_group_size),
  ADD CONSTRAINT services_sort_order_nonneg   CHECK (sort_order IS NULL OR sort_order >= 0);

ALTER TABLE transfer_routes
  ADD CONSTRAINT transfer_routes_price_from_nonneg    CHECK (price_from IS NULL OR price_from >= 0),
  ADD CONSTRAINT transfer_routes_duration_minutes_pos CHECK (duration_minutes IS NULL OR duration_minutes >= 1),
  ADD CONSTRAINT transfer_routes_max_passengers_pos   CHECK (max_passengers IS NULL OR max_passengers >= 1),
  ADD CONSTRAINT transfer_routes_sort_order_nonneg    CHECK (sort_order IS NULL OR sort_order >= 0);

ALTER TABLE pickup_points
  ADD CONSTRAINT pickup_points_price_from_nonneg CHECK (price_from IS NULL OR price_from >= 0),
  ADD CONSTRAINT pickup_points_sort_order_nonneg CHECK (sort_order IS NULL OR sort_order >= 0);

ALTER TABLE destinations       ADD CONSTRAINT destinations_sort_order_nonneg       CHECK (sort_order IS NULL OR sort_order >= 0);
ALTER TABLE service_categories ADD CONSTRAINT service_categories_sort_order_nonneg CHECK (sort_order IS NULL OR sort_order >= 0);
ALTER TABLE guides             ADD CONSTRAINT guides_sort_order_nonneg             CHECK (sort_order IS NULL OR sort_order >= 0);
ALTER TABLE news               ADD CONSTRAINT news_reading_time_pos                CHECK (reading_time_min IS NULL OR reading_time_min >= 1);

-- Public inquiries: same bounds as the zod schemas in inquiryValidation.ts.
ALTER TABLE inquiries
  ADD CONSTRAINT inquiries_passengers_range     CHECK (passengers IS NULL OR passengers BETWEEN 1 AND 50),
  ADD CONSTRAINT inquiries_luggage_pieces_range CHECK (luggage_pieces IS NULL OR luggage_pieces BETWEEN 0 AND 50);

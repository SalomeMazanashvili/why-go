-- WHY-118: the services an article is about, picked by the editor.
--
-- CLAUDE.md: every blog post links to at least 2 services. That's only
-- enforceable if the editor picks them, so this is an explicit list per
-- article, not a "published services in the article's destination" rule
-- (decision 2026-10-11). The generic "also in this destination" block on
-- the article page is separate and follows docs/whygo-services-spec.md §9.
--
-- A row points at exactly one service: a day trip / guide / experience
-- (services) or a transfer route (transfer_routes), the four services of
-- the spec. Deleting a service removes its rows (CASCADE); unpublishing
-- one keeps the row, and the article page skips it rather than linking to
-- a 404. The admin API refuses to publish an article with fewer than 2
-- picked services that are themselves published.

CREATE TABLE IF NOT EXISTS news_related_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  transfer_route_id UUID REFERENCES transfer_routes(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT news_related_services_one_target
    CHECK (num_nonnulls(service_id, transfer_route_id) = 1),
  CONSTRAINT news_related_services_service_unique UNIQUE (news_id, service_id),
  CONSTRAINT news_related_services_route_unique UNIQUE (news_id, transfer_route_id),
  CONSTRAINT news_related_services_sort_order_range CHECK (sort_order BETWEEN 0 AND 99)
);

-- news_id lookups use the two UNIQUE indexes; these serve the FK cascades.
CREATE INDEX IF NOT EXISTS news_related_services_service_id_idx
  ON news_related_services (service_id);
CREATE INDEX IF NOT EXISTS news_related_services_transfer_route_id_idx
  ON news_related_services (transfer_route_id);

-- Read and written only server-side with the service role (public pages
-- resolve the links against published services in code). No policies, so
-- anon and authenticated can neither read nor write.
ALTER TABLE news_related_services ENABLE ROW LEVEL SECURITY;

-- Replace an article's list in one transaction, so a failed save can't
-- leave it half-written. p_items is a JSON array, in display order, of
-- {"service_id": uuid} or {"transfer_route_id": uuid}.
CREATE OR REPLACE FUNCTION set_news_related_services(p_news_id UUID, p_items JSONB)
RETURNS VOID
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  DELETE FROM news_related_services WHERE news_id = p_news_id;
  INSERT INTO news_related_services (news_id, service_id, transfer_route_id, sort_order)
  SELECT p_news_id,
         (item->>'service_id')::uuid,
         (item->>'transfer_route_id')::uuid,
         (ord - 1)::int
  FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(item, ord);
$$;

-- Functions in public are executable by anon through the REST API unless
-- revoked. Only the service role (admin API) calls this.
REVOKE ALL ON FUNCTION set_news_related_services(UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION set_news_related_services(UUID, JSONB) TO service_role;

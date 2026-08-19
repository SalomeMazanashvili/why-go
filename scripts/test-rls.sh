#!/usr/bin/env bash
# WHY-63: exercise Supabase RLS as an anonymous client.
# Verifies:
#   - Anon cannot SELECT unpublished tours / news / destinations
#   - Anon cannot SELECT contact_submissions / admins at all
#   - Anon CAN INSERT into contact_submissions (the one intentional hole)
#
# Reads env from .env.local if present. Exits 0 with a warning when the
# anon key isn't set — keeps CI green pre-secrets, developers can run it
# locally after adding NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.

set -u
FAIL=0

# Load .env.local if present (repo root)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$ROOT/.env.local" ]; then
  # shellcheck disable=SC1091
  set -a; . "$ROOT/.env.local"; set +a
fi

URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
ANON="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"

if [ -z "$URL" ] || [ -z "$ANON" ]; then
  echo "SKIP: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY not both set."
  echo "     Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local from Supabase → Project Settings → API."
  exit 0
fi

# Trim trailing slash
URL="${URL%/}"

expect_empty_array () {
  local label="$1" path="$2"
  local body
  body=$(curl -s -H "apikey: $ANON" -H "Authorization: Bearer $ANON" "$URL/rest/v1/$path")
  # Empty array = RLS correctly filtering. Non-empty = leak.
  if [ "$body" = "[]" ]; then
    echo "  PASS  $label"
  else
    echo "  FAIL  $label — expected [], got: ${body:0:120}"
    FAIL=$((FAIL + 1))
  fi
}

expect_forbidden_or_empty () {
  # Tables with no anon SELECT policy return [] under Supabase's default
  # (RLS enabled + no matching policy → empty result set), not 401. So
  # empty array is the correct pass signal here.
  expect_empty_array "$@"
}

expect_created () {
  local label="$1" path="$2" json="$3"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
    -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    -H "Content-Type: application/json" -H "Prefer: return=minimal" \
    -d "$json" "$URL/rest/v1/$path")
  if [ "$code" = "201" ]; then
    echo "  PASS  $label (HTTP $code)"
  else
    echo "  FAIL  $label — expected 201, got HTTP $code"
    FAIL=$((FAIL + 1))
  fi
}

echo "RLS acceptance tests against $URL"
echo ""
echo "1. Unpublished rows must not be visible to anon:"
expect_empty_array "tours where is_active=false"      "tours?is_active=eq.false&select=id"
expect_empty_array "news where is_published=false"    "news?is_published=eq.false&select=id"
expect_empty_array "destinations where is_published=false" "destinations?is_published=eq.false&select=id"
expect_empty_array "service_categories where is_published=false" "service_categories?is_published=eq.false&select=id"
expect_empty_array "guides where is_published=false" "guides?is_published=eq.false&select=id"
expect_empty_array "services where is_published=false" "services?is_published=eq.false&select=id"
expect_empty_array "transfer_routes where is_published=false" "transfer_routes?is_published=eq.false&select=id"
echo ""
echo "2. Private tables must not be readable by anon:"
expect_forbidden_or_empty "contact_submissions SELECT" "contact_submissions?select=id"
expect_forbidden_or_empty "admins SELECT"              "admins?select=id"
expect_forbidden_or_empty "inquiries SELECT"           "inquiries?select=id"
expect_forbidden_or_empty "destination_contacts SELECT" "destination_contacts?select=id"
expect_forbidden_or_empty "rate_limits SELECT"         "rate_limits?select=key"
echo ""
echo "3. Public inserts must work for anon:"
# Marker email so this row can be identified + deleted later by an admin
MARKER_EMAIL="rls-test-$(date +%s)@whygo.test"
expect_created "contact_submissions INSERT" "contact_submissions" \
  "{\"full_name\":\"RLS Test\",\"email\":\"$MARKER_EMAIL\",\"message\":\"Automated RLS test — safe to delete\"}"
expect_created "inquiries INSERT" "inquiries" \
  "{\"service_type\":\"transfer\",\"name\":\"RLS Test\",\"phone\":\"+995555000000\"}"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo "All RLS checks passed."
  exit 0
else
  echo "$FAIL RLS check(s) failed."
  exit 1
fi

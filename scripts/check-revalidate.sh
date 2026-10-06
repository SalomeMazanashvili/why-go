#!/usr/bin/env bash
# WHY-103: every admin API route that writes must refresh the public site
# through revalidateContent() (src/lib/revalidate.ts). Forgetting it leaves
# the page, its index and /sitemap.xml stale until the next deploy, with no
# error anywhere. ESLint already blocks calling revalidatePath directly;
# this catches a route that refreshes nothing at all.
#
# A route whose tables the public site never reads goes in EXEMPT, with
# the reason. New collections (WHY-84 guides, WHY-85 experiences) are
# public, so they should call the helper, not join this list.
set -euo pipefail
cd "$(dirname "$0")/.."

EXEMPT=(
  src/app/api/admin/login/route.ts                       # session only
  src/app/api/admin/logout/route.ts                      # session only
  src/app/api/admin/admins/route.ts                      # admin accounts
  src/app/api/admin/admins/[id]/route.ts                 # admin accounts
  src/app/api/admin/inquiries/[id]/route.ts              # customer inquiries, admin-only
  src/app/api/admin/contacts/[id]/route.ts               # contact-form messages, admin-only
  src/app/api/admin/destination-contacts/route.ts        # supplier contacts, admin-only
  src/app/api/admin/destination-contacts/[id]/route.ts   # supplier contacts, admin-only
  src/app/api/admin/upload/route.ts                      # storage upload; the row write that uses it revalidates
)

fail=0
while IFS= read -r f; do
  grep -qE 'export (async )?function (POST|PUT|PATCH|DELETE)' "$f" || continue
  for e in "${EXEMPT[@]}"; do [[ "$f" == "$e" ]] && continue 2; done
  if ! grep -q 'revalidateContent()' "$f"; then
    echo "::error file=$f::writes but never calls revalidateContent() (see scripts/check-revalidate.sh)"
    fail=1
  fi
done < <(find src/app/api/admin -name 'route.ts' | sort)

if [[ $fail -eq 0 ]]; then echo "check-revalidate: every admin write route refreshes the public site"; fi
exit $fail

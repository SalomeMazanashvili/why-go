#!/usr/bin/env bash
# Subset FiraGO for the public site → src/app/fonts/firago-{400,700,900}.woff2
#
# Why: Fontsource's "latin" FiraGO files are not actually subset — each
# carries ~2.5k codepoints / ~4.6k glyphs (Cyrillic, Greek, …), ~240KB per
# weight. We only need Latin + Georgian: ~706KB → ~50KB for the three weights.
#
# Source: node_modules/@fontsource/firago (version pinned in package.json).
# After bumping @fontsource/firago, run `npm install` then this script, and
# commit the regenerated files in src/app/fonts/.
#
# Requires fontTools with brotli:  pip3 install fonttools brotli
#
# Usage:  npm run fonts:subset   (or scripts/subset-fonts.sh)

set -euo pipefail

cd "$(dirname "$0")/.."

SRC=node_modules/@fontsource/firago/files
OUT=src/app/fonts

# Weights loaded in src/app/[locale]/layout.tsx — keep in sync.
WEIGHTS=(400 700 900)

# U+0000-00FF   Basic Latin + Latin-1 Supplement
# U+0131        ı (dotless i)          U+0152-0153  Œ œ
# U+02BB-02BC   ʻ ʼ (modifier apostrophes)
# U+2000-206F   General Punctuation (dashes, quotes, …, nbsp variants)
# U+20AC        €                      U+20BE       ₾ (lari — formatPrice in
#                                                    src/types/index.ts)
# U+2122        ™                      U+2212       − (minus)
# U+2190-2193   ← ↑ → ↓ ("ყველა ნახვა →", back links)
# U+10A0-10FF   Georgian (Mkhedruli + Asomtavruli)
# U+1C90-1CBF   Georgian Extended (Mtavruli). FiraGO has no glyphs here
#               today; kept so a future FiraGO release picks them up.
#
# Any character outside this list falls back to a system font silently.
# If you add a new symbol to the UI, add its codepoint here and re-run.
UNICODES="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+2000-206F,U+20AC,U+20BE,U+2122,U+2190-2193,U+2212,U+10A0-10FF,U+1C90-1CBF"

if ! command -v pyftsubset >/dev/null 2>&1; then
  echo "pyftsubset not found. Install with: pip3 install fonttools brotli" >&2
  exit 1
fi

mkdir -p "$OUT"

for w in "${WEIGHTS[@]}"; do
  in="$SRC/firago-latin-$w-normal.woff2"
  out="$OUT/firago-$w.woff2"
  [ -f "$in" ] || { echo "Missing $in — run npm install" >&2; exit 1; }
  pyftsubset "$in" \
    --output-file="$out" --flavor=woff2 \
    --unicodes="$UNICODES" \
    --layout-features="kern,liga" --no-hinting --desubroutinize
  printf '%s  %6d → %6d bytes\n' "firago-$w" "$(wc -c <"$in")" "$(wc -c <"$out")"
done

# FiraGO is SIL OFL 1.1 — the licence must travel with the font files.
cp node_modules/@fontsource/firago/LICENSE "$OUT/OFL.txt"

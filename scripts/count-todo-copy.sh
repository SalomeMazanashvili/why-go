#!/usr/bin/env bash
# WHY-98 PR A: report Georgian strings still waiting for founder copy.
# Informational only: `TODO: Georgian copy needed` values are intentional
# placeholders (CLAUDE.md rule 2), so this never fails CI. Missing keys are
# a different thing and do fail CI, via tsc (src/global.d.ts and
# src/i18n/messageParity.ts).
set -euo pipefail
cd "$(dirname "$0")/.."
node -e '
const ka = require("./messages/ka.json")
const todo = []
const walk = (o, p) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k
    if (v && typeof v === "object") walk(v, key)
    else if (typeof v === "string" && v.startsWith("TODO: Georgian copy needed")) todo.push(key)
  }
}
walk(ka, "")
const lines = [`Georgian copy still TODO in messages/ka.json: ${todo.length}`, ...todo.map((k) => `  - ${k}`)]
console.log(lines.join("\n"))
if (process.env.GITHUB_STEP_SUMMARY) {
  require("fs").appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `### Georgian copy still TODO: ${todo.length}\n\n` + todo.map((k) => `- \`${k}\``).join("\n") + "\n")
}
'

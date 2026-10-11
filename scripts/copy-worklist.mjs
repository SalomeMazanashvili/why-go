#!/usr/bin/env node
// WHY-119: the Georgian copy worklist. Every string on the public site that
// still needs Georgian, one row each, written to
// docs/georgian-copy-worklist.md for Sali to fill in.
//
//   npm run copy:todo              regenerate the file and print the count
//   npm run copy:todo -- --report  print the count only (CI, report-only)
//
// Three sources:
//   1. messages/ka.json values that start with "TODO"
//   2. pages with no meta description (WHY-116 removed the TODO ones)
//   3. hardcoded English in public components: not marked TODO, just English
//
// Re-running keeps whatever is already written in the Georgian column (rows
// are matched by their ID) and drops rows that are done. The output has no
// timestamps, so running it twice gives the same file.

import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(root, 'docs/georgian-copy-worklist.md')
const rel = (f) => path.relative(root, f).split(path.sep).join('/')
const read = (f) => fs.readFileSync(f, 'utf8')

const ka = JSON.parse(read(path.join(root, 'messages/ka.json')))
const en = JSON.parse(read(path.join(root, 'messages/en.json')))
const get = (o, key) => key.split('.').reduce((x, k) => x?.[k], o)

// ---- Public source files and where they show up -----------------------------

function listFiles(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) listFiles(p, out)
    else if (/\.(tsx|ts)$/.test(f.name) && !f.name.endsWith('.d.ts')) out.push(p)
  }
  return out
}
const PUBLIC = [...listFiles(path.join(root, 'src/app/[locale]')), ...listFiles(path.join(root, 'src/components'))]
  .filter((f) => !rel(f).includes('/admin/'))
  .sort()
const ALL_SRC = listFiles(path.join(root, 'src'))
const parsed = new Map()
const parse = (f) => {
  if (!parsed.has(f)) parsed.set(f, ts.createSourceFile(f, read(f), ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS))
  return parsed.get(f)
}

// Route for an app file: src/app/[locale]/day-trips/[slug]/page.tsx → /day-trips/[slug]
function routeOf(file) {
  const r = rel(file)
  const m = r.match(/^src\/app\/\[locale\]\/(.*?)\/?(page|layout|opengraph-image)\.tsx$/)
  if (!m) return null
  if (m[2] === 'layout') return 'every page'
  if (m[2] === 'opengraph-image') return 'social share image (every page)'
  const p = '/' + m[1].replace(/\[destination\]/, '[city]')
  return p === '/' ? '/ (home)' : p.replace(/\/$/, '')
}

// Who imports whom, so a component maps to the pages that render it.
const importers = new Map()
for (const f of ALL_SRC) {
  for (const m of read(f).matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    let spec = m[1]
    if (spec.startsWith('@/')) spec = path.join(root, 'src', spec.slice(2))
    else if (spec.startsWith('.')) spec = path.resolve(path.dirname(f), spec)
    else continue
    for (const cand of [spec, spec + '.tsx', spec + '.ts', path.join(spec, 'index.tsx')]) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        if (!importers.has(cand)) importers.set(cand, new Set())
        importers.get(cand).add(f)
        break
      }
    }
  }
}
const REGION = {
  'src/components/layout/Navbar.tsx': 'header / mobile menu',
  'src/components/layout/Footer.tsx': 'footer',
}
function pagesOf(file, seen = new Set()) {
  if (seen.has(file)) return []
  seen.add(file)
  const route = routeOf(file)
  if (route) return [route]
  const out = new Set()
  for (const imp of importers.get(file) ?? []) {
    if (rel(imp).includes('/admin/')) continue
    for (const p of pagesOf(imp, seen)) out.add(p)
  }
  return [...out].sort()
}
function pageLabel(file) {
  const pages = pagesOf(file)
  const label = pages.includes('every page') ? 'every page' : pages.join(', ') || '—'
  return REGION[rel(file)] ? `${label} (${REGION[rel(file)]})` : label
}

// ---- Where on the page: read it off the JSX around the string ---------------

const TAG_ROLE = {
  h1: 'page heading (h1)', h2: 'section heading (h2)', h3: 'heading (h3)', p: 'paragraph', span: 'inline text',
  button: 'button text', a: 'link text', Link: 'link text', label: 'form label', legend: 'form group label',
  option: 'dropdown option', li: 'list item', dt: 'list term', dd: 'list text', figcaption: 'caption',
  FormField: 'form field label', time: 'date',
}
function tagName(el) {
  const open = ts.isJsxElement(el) ? el.openingElement : el
  return open.tagName.getText()
}
function describe(node) {
  let attr = null
  let sr = false
  for (let n = node.parent; n; n = n.parent) {
    if (ts.isJsxAttribute(n)) attr = n.name.getText()
    if (ts.isPropertyAssignment(n) && !attr) {
      const k = n.name.getText()
      if (k === 'description') return { where: 'meta description (search results)', kind: 'meta' }
      if (k === 'title') return { where: 'browser tab / search result title', kind: 'title' }
    }
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = tagName(n)
      const open = ts.isJsxElement(n) ? n.openingElement : n
      if (/\bsr-only\b/.test(open.getText())) sr = true
      if (attr) {
        if (attr.startsWith('aria-')) return { where: `${attr} on <${tag}> (screen readers only)`, kind: 'aria' }
        if (attr === 'placeholder') return { where: `placeholder in <${tag}>`, kind: 'placeholder' }
        if (attr === 'alt') return { where: `image description (alt) on <${tag}>`, kind: 'alt' }
        if (attr === 'label' && tag === 'FormField') return { where: 'form field label', kind: 'label' }
        return { where: `${attr} of <${tag}>`, kind: attr }
      }
      if (sr) return { where: `screen-reader-only text in <${tag}>`, kind: 'aria' }
      const role = TAG_ROLE[tag]
      if (role) return { where: role, kind: tag }
    }
  }
  return { where: attr ? `${attr} (in code)` : 'set in code', kind: 'code' }
}

const LIMITS = {
  meta: '140–160 characters',
  title: '≤ 60 characters',
  aria: 'short, read aloud (≤ 30 characters)',
  placeholder: '≤ 40 characters',
  button: '≤ 24 characters (one line on a phone)',
  a: '≤ 24 characters (one line on a phone)',
  Link: '≤ 24 characters (one line on a phone)',
  option: '≤ 30 characters',
  label: '≤ 40 characters',
  legend: '≤ 40 characters',
  h1: '≤ 40 characters (≤ 3 lines at 380px)',
  h2: '≤ 40 characters',
}
function limitFor(kind, english) {
  const base = LIMITS[kind] ?? ''
  const params = [...new Set([...(english ?? '').matchAll(/\{(\w+)\}/g)].map((m) => `{${m[1]}}`))]
  return [base, params.length ? `keep ${params.join(', ')}` : ''].filter(Boolean).join('; ') || '—'
}

// ---- 1. TODO keys in ka.json ------------------------------------------------

function todoKeys(o, p = '', out = []) {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k
    if (v && typeof v === 'object') todoKeys(v, key, out)
    else if (typeof v === 'string' && v.startsWith('TODO')) out.push(key)
  }
  return out
}

// Where a key is used: a t('leaf') / t.rich('leaf') call in a file that
// names the namespace. Falls back to "set in code" when it can't tell.
function usagesOf(key) {
  const parts = key.split('.')
  const leaf = parts.at(-1)
  const ns = parts.slice(0, -1)
  const hits = []
  for (const f of PUBLIC) {
    const src = read(f)
    if (!ns.some((n) => src.includes(`'${n}'`) || src.includes(`"${n}"`))) continue
    const visit = (n) => {
      if (ts.isCallExpression(n) && n.arguments[0] && ts.isStringLiteral(n.arguments[0])) {
        const arg = n.arguments[0].text
        const callee = n.expression.getText()
        if ((arg === leaf || arg === parts.slice(1).join('.') || arg === key) && /^t\w*(\.(rich|markup|raw))?$/.test(callee)) {
          hits.push({ file: f, ...describe(n) })
        }
      }
      ts.forEachChild(n, visit)
    }
    visit(parse(f))
  }
  return hits
}

// ---- 2. Missing meta descriptions -------------------------------------------

// What each description should say, in English, for the writer.
const META_MEANING = {
  'every page': 'What WHYGO is, for any page without its own description: trips abroad for Georgian travellers, arranged in Georgian',
  '/ (home)': 'What WHYGO does: signature tours, plus transfers, day trips and guides in the cities Georgians travel to, arranged in Georgian',
  '/tours': 'The signature group tours: expert-led departures from Tbilisi',
  '/tips': 'The blog: practical tips and stories for Georgians travelling abroad',
  '/about': 'Who WHYGO is: the two founders in Tbilisi and why they started it',
  '/contact': 'How to reach WHYGO (phone, WhatsApp, email); replies within 24 hours',
  '/experiences': 'Day trips and activities in the cities you are travelling to, arranged in Georgian',
}
const META_KEYS = {
  'every page': 'meta.site_default',
  '/ (home)': 'meta.home',
}
function missingMeta() {
  const rows = []
  for (const f of PUBLIC) {
    const r = rel(f)
    // Static pages only: dynamic ones take their description from the row.
    if (!/(page|layout)\.tsx$/.test(r) || r.replace('[locale]', '').includes('[')) continue
    const src = read(f)
    if (!/generateMetadata|export const metadata/.test(src)) continue
    if (/\bdescription\s*[:,]/.test(src)) continue
    const route = routeOf(f)
    const name = META_KEYS[route] ?? `meta.${route.replace(/^\//, '').replace(/\W+/g, '_')}`
    rows.push({
      id: `meta:${route}`,
      key: `${name} (new key)`,
      file: r,
      page: route === 'every page' ? 'every page without its own (site default)' : route,
      where: 'meta description (search results, link previews)',
      english: META_MEANING[route] ?? `What ${route} offers, for search results`,
      limit: LIMITS.meta,
    })
  }
  return rows
}

// ---- 3. Hardcoded English in components -------------------------------------

// Plain-language locations where the JSX alone can't say.
const WHERE_OVERRIDES = {
  'src/components/forms/TransferInquiryForm.tsx|Other': 'pickup dropdown: group heading for pickup points with no city',
}
const KEY_WHERE = {
  'experiences_page.index_other_group': 'group heading for experiences with no city',
}

const ALLOW = new Set(['WHY', 'GO', 'WHYGO', 'ENG', 'WHYGO · whygo.ge', 'e.g. LH1234', 'you@email.com'])
const isEnglish = (s) => /[A-Za-z]{2,}/.test(s) && !/[Ⴀ-ჿ]/.test(s) && !ALLOW.has(s.trim())
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
const VISIBLE_ATTRS = new Set(['alt', 'aria-label', 'placeholder', 'title', 'label'])
const mentionsLocale = (n) => /\b(loc|locale)\b|'ka'|'en'/.test(n.getText())

function hardcoded() {
  const rows = []
  for (const f of PUBLIC) {
    const sf = parse(f)
    const groups = new Map() // nearest element start → texts
    const add = (n, text) => {
      let el = n.parent
      while (el && !ts.isJsxElement(el) && !ts.isJsxSelfClosingElement(el) && !ts.isPropertyAssignment(el)) el = el.parent
      // Group text split across <br/> / <span> inside one heading or paragraph.
      let block = el
      for (let up = el; up; up = up.parent) {
        if ((ts.isJsxElement(up)) && ['h1', 'h2', 'h3', 'p', 'button', 'a', 'Link', 'label'].includes(tagName(up))) { block = up; break }
        if (!ts.isJsxElement(up) && !ts.isJsxExpression(up) && !ts.isJsxFragment(up) && !ts.isConditionalExpression(up) && !ts.isJsxSelfClosingElement(up)) break
      }
      const k = block ? block.getStart() : n.getStart()
      if (!groups.has(k)) groups.set(k, { node: n, texts: [], line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1 })
      groups.get(k).texts.push(text)
    }
    const visit = (n) => {
      if (ts.isJsxText(n)) {
        const t = decode(n.text).replace(/\s+/g, ' ').trim()
        if (t && isEnglish(t)) add(n, t)
      } else if (ts.isJsxAttribute(n) && VISIBLE_ATTRS.has(n.name.getText()) && n.initializer && ts.isStringLiteral(n.initializer)) {
        if (isEnglish(n.initializer.text)) add(n.initializer, n.initializer.text)
      } else if (ts.isStringLiteral(n) && isEnglish(n.text)) {
        const p = n.parent
        const inMetadata = ts.isPropertyAssignment(p) && ['title', 'description'].includes(p.name.getText())
        const fallback = ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken && p.right === n
        const jsxChild = ts.isJsxExpression(p) && !ts.isJsxAttribute(p.parent)
        const branch = ts.isConditionalExpression(p) && !mentionsLocale(p.condition) && ts.isJsxExpression(p.parent) && !ts.isJsxAttribute(p.parent.parent)
        if (inMetadata || fallback || jsxChild || branch) add(n, n.text)
      }
      ts.forEachChild(n, visit)
    }
    visit(sf)
    const byId = new Map()
    for (const g of groups.values()) {
      const text = g.texts.join(' ').replace(/\s+/g, ' ').trim()
      const d = describe(g.node)
      const hash = createHash('sha1').update(text).digest('hex').slice(0, 6)
      const id = `hc:${rel(f)}#${hash}`
      if (byId.has(id)) {
        byId.get(id).lines.push(g.line)
        continue
      }
      byId.set(id, {
        id,
        lines: [g.line],
        file: rel(f),
        page: pageLabel(f),
        where: WHERE_OVERRIDES[`${rel(f)}|${text}`] ??
          (rel(f).endsWith('opengraph-image.tsx') ? 'text drawn in the share image (WhatsApp / Facebook link preview)' : d.where),
        english: text,
        limit: limitFor(d.kind, text),
      })
    }
    for (const r of byId.values()) {
      const { lines, ...row } = r
      rows.push({ ...row, key: `— (hardcoded, line${lines.length > 1 ? 's' : ''} ${lines.join(', ')})` })
    }
  }
  return rows
}

// ---- Assemble -----------------------------------------------------------------

const todoRows = todoKeys(ka).map((key) => {
  const uses = usagesOf(key)
  const english = get(en, key) ?? ''
  const pages = [...new Set(uses.map((u) => pageLabel(u.file)))]
  const where = [...new Set(uses.map((u) => u.where))]
  const kind = uses[0]?.kind ?? 'code'
  const note = get(ka, key).replace(/^TODO:? *(Georgian copy needed)? *\(?|\)?$/g, '').trim()
  return {
    id: `ka:${key}`,
    key: `\`${key}\``,
    file: [...new Set(uses.map((u) => rel(u.file)))].join(', ') || 'messages/ka.json (not used in code yet)',
    page: pages.join('; ') || '—',
    where: (KEY_WHERE[key] ?? (where.join('; ') || 'set in code')) + (note ? ` — note: ${note}` : ''),
    english,
    limit: limitFor(key.endsWith('meta_description') ? 'meta' : kind, english),
  }
})
const metaRows = missingMeta()
const hcRows = hardcoded()

// Keep Sali's Georgian from the previous file, matched by row ID.
const kept = new Map()
if (fs.existsSync(OUT)) {
  for (const line of read(OUT).split('\n')) {
    const cells = line.split(/(?<!\\)\|/).map((c) => c.trim())
    const id = cells[1]?.match(/^<!--(.+)-->/)?.[1]
    const georgian = cells.at(-2)
    if (id && georgian) kept.set(id, georgian)
  }
}

const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n+/g, ' ')
function table(rows, start) {
  const head = '| # | Key | File | Page | Where on the page | English (what it means) | Limit | Georgian (Sali) |\n|---|---|---|---|---|---|---|---|'
  return [head, ...rows.map((r, i) =>
    `| <!--${r.id}-->${start + i} | ${esc(r.key)} | ${esc(r.file)} | ${esc(r.page)} | ${esc(r.where)} | ${esc(r.english)} | ${esc(r.limit)} | ${esc(kept.get(r.id) ?? '')} |`,
  )].join('\n')
}

const total = todoRows.length + metaRows.length + hcRows.length
if (process.argv.includes('--report')) {
  const line = `Georgian copy still needed: ${total} (ka.json TODO ${todoRows.length}, missing meta descriptions ${metaRows.length}, hardcoded English ${hcRows.length})`
  console.log(line)
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ${line}\n\nFull list: \`docs/georgian-copy-worklist.md\` (\`npm run copy:todo\`).\n`)
  process.exit(0)
}

const doc = `# Georgian copy worklist

**${total} strings still need Georgian:**
- ${todoRows.length} marked TODO in \`messages/ka.json\`
- ${metaRows.length} missing meta descriptions
- ${hcRows.length} pieces of hardcoded English in components

Generated by \`npm run copy:todo\` (\`scripts/copy-worklist.mjs\`). Don't edit the other columns by hand: re-run the script as strings are done, and the count comes down.

**How to use it:**
- Write the Georgian in the last column. Re-running keeps what you wrote, matched by the hidden row ID, and drops rows that are finished in the code.
- Use \`თქვენ\` (formal) throughout, as everywhere on the site.
- Keep anything in \`{braces}\` exactly as it is: the site fills it in.
- **Limit** is a target, not a hard cap, except for meta descriptions (140–160).
- "screen readers only" text is never shown, only read aloud.

## 1. Marked TODO in messages/ka.json (${todoRows.length})

${table(todoRows, 1)}

## 2. Missing meta descriptions (${metaRows.length})

WHY-116 removed the placeholder descriptions, so these pages currently have none and Google writes its own snippet. The keys are new; the code will read them once the Georgian exists (WHY-117).

${table(metaRows, todoRows.length + 1)}

## 3. Hardcoded English in components (${hcRows.length})

Not marked TODO anywhere: English typed straight into the page code. Each needs a message key as well as the Georgian. The code change comes with the copy.

${table(hcRows, todoRows.length + metaRows.length + 1)}
`
fs.writeFileSync(OUT, doc)
console.log(`Wrote ${rel(OUT)}: ${total} strings (ka.json TODO ${todoRows.length}, meta ${metaRows.length}, hardcoded ${hcRows.length})`)

// Cut a release: bump package.json, date the [Unreleased] changelog section,
// commit and create an annotated tag. Pushing is left to the user.
// Usage: pnpm release <major|minor|patch> [extra git commit args...]
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const [bump, ...commitArgs] = process.argv.slice(2)
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const fail = (msg) => { console.error(`release: ${msg}`); process.exit(1) }

if (!['major', 'minor', 'patch'].includes(bump)) fail('usage: pnpm release <major|minor|patch>')
if (git('status', '--porcelain')) fail('working tree is not clean')

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const [maj, min, pat] = pkg.version.split('.').map(Number)
const next = { major: `${maj + 1}.0.0`, minor: `${maj}.${min + 1}.0`, patch: `${maj}.${min}.${pat + 1}` }[bump]
const tag = `v${next}`
if (git('tag', '-l', tag)) fail(`tag ${tag} already exists`)

let log = readFileSync('CHANGELOG.md', 'utf8')
const section = log.match(/## \[Unreleased\]\n([\s\S]*?)\n## \[/)
if (!section || !section[1].trim()) fail('the [Unreleased] section of CHANGELOG.md is empty')

const repo = pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '')
const date = new Date().toISOString().slice(0, 10)
const unreleasedLink = new RegExp(`^\\[Unreleased\\]: ${repo}/compare/(v[^.]+\\.[^.]+\\.[^.]+)\\.\\.\\.HEAD$`, 'm')
const prev = log.match(unreleasedLink)?.[1]
if (!prev) fail('could not find the [Unreleased] compare link in CHANGELOG.md')

log = log
  .replace('## [Unreleased]\n', `## [Unreleased]\n\n## [${next}] - ${date}\n`)
  .replace(unreleasedLink, `[Unreleased]: ${repo}/compare/${tag}...HEAD\n[${next}]: ${repo}/compare/${prev}...${tag}`)
writeFileSync('CHANGELOG.md', log)

pkg.version = next
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')

git('add', 'package.json', 'CHANGELOG.md')
git('commit', '-q', '-m', `Release ${tag}`, ...commitArgs)
git('tag', '-a', tag, '-m', `Release ${tag}`)
console.log(`Released ${tag}. Push with: git push --follow-tags`)

// Publish the production build: build into build/ (a git worktree of the
// orphan `prod` branch), commit the result and push `prod` to origin.
// Usage: pnpm prod
// Uses only Node built-ins and host git, so it can run outside the container.
import { existsSync, realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const BRANCH = 'prod'
const buildDir = resolve('build')

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', ...opts })
const git = (...args) => run('git', args).trim()
const gitIn = (dir, ...args) => run('git', ['-C', dir, ...args]).trim()
const gitOk = (...args) => {
  try { execFileSync('git', args, { stdio: 'ignore' }); return true } catch { return false }
}
const fail = (msg) => { console.error(`prod: ${msg}`); process.exit(1) }

// 1. Only publish what is committed.
if (git('status', '--porcelain')) fail('working tree is not clean; commit or stash your changes first')

// 2. Make sure build/ is a worktree of the prod branch.
if (existsSync(buildDir)) {
  let top = ''
  try { top = gitIn(buildDir, 'rev-parse', '--show-toplevel') } catch {}
  if (!top || realpathSync(top) !== realpathSync(buildDir)) {
    fail('build/ exists but is not a git worktree; delete it and run again')
  }
  const branch = gitIn(buildDir, 'branch', '--show-current')
  if (branch !== BRANCH) fail(`build/ is a worktree of "${branch || 'a detached HEAD'}", expected "${BRANCH}"`)
} else {
  git('worktree', 'prune')
  if (gitOk('show-ref', '--verify', '--quiet', `refs/heads/${BRANCH}`)) {
    git('worktree', 'add', buildDir, BRANCH)
  } else if (gitOk('ls-remote', '--exit-code', '--heads', 'origin', BRANCH)) {
    git('fetch', 'origin', BRANCH)
    git('worktree', 'add', '--track', '-b', BRANCH, buildDir, `origin/${BRANCH}`)
  } else {
    git('worktree', 'add', '--orphan', '-b', BRANCH, buildDir)
    console.log(`Created orphan branch "${BRANCH}" in build/`)
  }
}

// 3. Build. Vite's emptyOutDir keeps build/.git, so the worktree survives.
run('pnpm', ['build'], { stdio: 'inherit' })

// 4. Commit the build if anything changed.
gitIn(buildDir, 'add', '-A')
if (!gitIn(buildDir, 'status', '--porcelain')) {
  console.log('prod: build unchanged, nothing to publish')
  process.exit(0)
}
const label = git('describe', '--tags', '--always')
gitIn(buildDir, 'commit', '-q', '-m', `Build ${label}`)

// 5. Push prod only; main and tags are left alone.
run('git', ['-C', buildDir, 'push', '-u', 'origin', BRANCH], { stdio: 'inherit' })
console.log(`Published "Build ${label}" to origin/${BRANCH}`)

// 6. Warn when the published source isn't on the remote yet.
if (!gitOk('rev-parse', '--verify', '--quiet', '@{u}')) {
  console.warn('prod: warning: the current branch has no upstream; the published source is not on origin')
} else if (git('rev-parse', 'HEAD') !== git('rev-parse', '@{u}')) {
  console.warn('prod: warning: HEAD differs from its upstream; push your source too')
}

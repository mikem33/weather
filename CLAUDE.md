# weather

Plan and handoff: `~/Projects/Dev Projects/weather/` (`PRD.md`, `HANDOFF.md`), never in this repo.

## Commits

- Commits Claude writes or helps write end with the trailer
  `Co-Authored-By: Claude <noreply@anthropic.com>` (decided by the owner, 2026-11-02).

## Environment

- Runs in the `create-docker` environment at `~/Dev/weather` (this repo is its `src/`);
  site at `https://weather.test`. Never run `pnpm install` on the host: the `vite`
  container does it (`docker compose exec vite pnpm …` from `~/Dev/weather`).

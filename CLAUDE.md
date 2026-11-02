# weather

Plan and handoff: `~/Projects/Dev Projects/weather/` (`PRD.md`, `HANDOFF.md`), never in this repo.

## Commits

- Commits Claude writes or helps write end with the trailer
  `Co-Authored-By: Claude <noreply@anthropic.com>` (decided by the owner, 2026-11-02).

## Environment

- Runs in the `create-docker` environment at `~/Dev/weather` (this repo is its `src/`);
  site at `https://weather.test`. pnpm always runs in the `vite` container: create-docker's
  `pnpm` wrapper forwards to it from `src/`; without it,
  `docker compose -f ~/Dev/weather/docker-compose.yml exec vite pnpm …`.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-11

### Added
- The page's style, after the miguelmorera.com design: its palette, self-hosted fonts
  (Tanker, Rubik, Roboto Mono, Doto, Cherry Bomb One; woff2 only), the miguelmorera logo,
  a page title and subtitle, and decorative katakana under each section.
- The next 24 hours run edge to edge of the window, with a scrollbar of their own
  (`scrollbar.js`): always visible, as wide as the content, draggable, and moved by the
  mouse wheel; the hours can be dragged with the mouse, and fade into the background at
  the window's edges.
- `pnpm release` and `pnpm prod` from pandora-boilerplate (build published on the
  `prod` branch).

### Changed
- Relative asset URLs (`base: './'`), so the build works from any folder.
- The web app manifest points at its icons and uses the page's background colour.

## [0.1.0] - 2026-11-11

### Added
- Weather page, the expanded view of the desktop bar's weather dropdown, with data from
  [Open-Meteo](https://open-meteo.com/) called from the browser (no backend):
  - now: icon, temperature, condition, "feels like" and place;
  - wind, humidity, sunrise and sunset;
  - the next 24 hours;
  - the next 6 days, with the chance of rain and a min–max bar on one scale for all days.
- Place from the URL (`lat`, `lon`, optional `place` and `tz`).
- Without `lat` and `lon`, the browser's geolocation, named with Nominatim
  (OpenStreetMap); Dénia when it is refused, fails or gets no answer within 10 seconds.
- Project structure from pandora-boilerplate 2.0.0 (Vite + Stylus): entry points at
  `source/assets/css/style.styl` and `source/assets/javascript/main.js`.

[Unreleased]: https://github.com/mikem33/weather/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/mikem33/weather/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mikem33/weather/releases/tag/v0.1.0

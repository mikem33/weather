# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/mikem33/weather/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mikem33/weather/releases/tag/v0.1.0

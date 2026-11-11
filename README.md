# weather

A small weather page: the expanded view of the weather dropdown in my desktop bar
(Quickshell). It shows the same information as the dropdown, from the same source
([Open-Meteo](https://open-meteo.com/)):

- now: icon, temperature, condition, "feels like", place;
- wind, humidity, sunrise and sunset;
- the next 24 hours;
- the next 6 days, with the chance of rain and a min–max bar on one scale for all days.

The browser calls the Open-Meteo API directly; there is no backend.

Based on [pandora-boilerplate](https://github.com/mikem33/pandora-boilerplate) 2.0.0
(Vite + Stylus).

## Usage

The desktop bar's dropdown links here with its place in the URL:

```
https://weather.test/?lat=38.84078&lon=0.10574&place=Dénia&tz=Europe/Madrid
```

| Parameter | Required | Meaning |
|-----------|----------|---------|
| `lat`     | no¹      | Latitude |
| `lon`     | no¹      | Longitude |
| `place`   | no       | Name shown on the page (defaults to the coordinates) |
| `tz`      | no       | IANA time zone (defaults to `auto`) |

¹ Without `lat` and `lon` the page asks the browser for your location and names it with
[Nominatim](https://nominatim.org/) (OpenStreetMap). If you refuse, it fails, or there is
no answer within 10 seconds, it shows Dénia; a location that arrives later replaces it.

## Development

The project runs in a `create-docker` Vite environment: this repo is the `src/` folder of
`~/Dev/weather`, and pnpm runs inside the `vite` container (its `node_modules` are built
for Alpine). create-docker's `pnpm` wrapper forwards the commands there, so from this
folder:

```bash
start-docker weather   # start the containers
pnpm install           # dependencies
pnpm dev               # dev server, served at https://weather.test (Ctrl+C stops it)
pnpm build             # production build in build/
stop-docker weather    # stop the containers
```

Without the wrapper: `docker compose -f ~/Dev/weather/docker-compose.yml exec vite pnpm …`.

## Project structure

```
source/
├── index.html                      # Markup, with empty containers filled by the script
└── assets/
    ├── css/style.styl              # Stylus entry point (partials in css/styl/)
    ├── images/favicons/
    └── javascript/main.js          # Reads the URL, fetches the forecast, renders it
build/                              # Production build (generated, not versioned)
vite.config.js
```

## Data

Weather data by [Open-Meteo](https://open-meteo.com/), under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The page footer credits it.

## License

ISC.

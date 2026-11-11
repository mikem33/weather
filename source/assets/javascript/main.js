// Weather page: the expanded view of the desktop bar's weather dropdown
// (~/Dev/dotfiles/home/.config/quickshell/WeatherMenu.qml). It reads the place from the
// URL (?lat=38.8&lon=0.1118&place=Dénia, optional tz), asks Open-Meteo for the same data
// as the dropdown (~/Dev/dotfiles/home/.config/waybar/weather.py) and fills the empty
// containers in index.html. No styling here: only markup, classes and data attributes.
// Without lat and lon it asks the browser for the visitor's location, names it with
// Nominatim (OpenStreetMap) and falls back to Dénia if that is refused or takes too long.

const API = 'https://api.open-meteo.com/v1/forecast';
const REVERSE_API = 'https://nominatim.openstreetmap.org/reverse';

// Shown when there is no place in the URL and geolocation is refused, fails or gets no
// answer within GEOLOCATION_WAIT.
const DEFAULT_PLACE = { lat: 38.84078, lon: 0.10574, name: 'Dénia', tz: 'Europe/Madrid' };
const GEOLOCATION_WAIT = 10_000;

// WMO weather codes -> name (as in weather.py) and day/night emoji.
// Emoji are a stand-in until the icons become SVGs; every icon carries data-code,
// data-kind and data-period so it can be swapped without touching this table.
const CODES = {
    0: ['Clear', '☀️', '🌙'],
    1: ['Mainly clear', '🌤️', '🌙'],
    2: ['Partly cloudy', '⛅', '☁️'],
    3: ['Overcast', '☁️', '☁️'],
    45: ['Fog', '🌫️', '🌫️'],
    48: ['Fog', '🌫️', '🌫️'],
    51: ['Drizzle', '🌦️', '🌧️'],
    53: ['Drizzle', '🌦️', '🌧️'],
    55: ['Drizzle', '🌦️', '🌧️'],
    61: ['Rain', '🌧️', '🌧️'],
    63: ['Rain', '🌧️', '🌧️'],
    65: ['Heavy rain', '🌧️', '🌧️'],
    71: ['Snow', '🌨️', '🌨️'],
    73: ['Snow', '🌨️', '🌨️'],
    75: ['Heavy snow', '❄️', '❄️'],
    80: ['Rain showers', '🌦️', '🌧️'],
    81: ['Rain showers', '🌦️', '🌧️'],
    82: ['Heavy showers', '🌧️', '🌧️'],
    95: ['Thunderstorm', '⛈️', '⛈️'],
    96: ['Thunderstorm', '⛈️', '⛈️'],
    99: ['Thunderstorm', '⛈️', '⛈️'],
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Same groups as weather.py's kind(): sun, cloud, rain, snow, storm.
function kind(code) {
    if (code === 0 || code === 1) return 'sun';
    if (code >= 95) return 'storm';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 51) return 'rain';
    return 'cloud';
}

function info(code) {
    const [name, day, night] = CODES[code] ?? ['', '☁️', '☁️'];
    return { name, day, night, kind: kind(code) };
}

// Small DOM helper: el('span', { class: 'x', dataset: { a: 1 } }, 'text', otherNode)
function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'dataset') Object.assign(node.dataset, value);
        else if (key === 'style') {
            // setProperty, so custom properties (--name) work too
            for (const [prop, v] of Object.entries(value)) node.style.setProperty(prop, v);
        }
        else node.setAttribute(key, value);
    }
    node.append(...children);
    return node;
}

function icon(code, isDay, className = '') {
    const c = info(code);
    return el('span', {
        class: ['icon', className].filter(Boolean).join(' '),
        role: 'img',
        'aria-label': c.name || 'Weather',
        dataset: { code, kind: c.kind, period: isDay ? 'day' : 'night' },
    }, isDay ? c.day : c.night);
}

const degrees = (t) => `${Math.round(t)}°`;
const hhmm = (iso) => iso.slice(11, 16);

// ── location from the URL ──

function readPlace() {
    const params = new URLSearchParams(location.search);
    const lat = Number.parseFloat(params.get('lat'));
    const lon = Number.parseFloat(params.get('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)
        || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        return null;
    }
    return {
        lat,
        lon,
        name: params.get('place')?.trim() || `${lat}, ${lon}`,
        tz: params.get('tz')?.trim() || 'auto',
    };
}

// ── location from the browser ──

// Resolves with the position, or null if geolocation is unavailable, refused or fails.
function locate() {
    return new Promise((resolve) => {
        if (!('geolocation' in navigator)) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position.coords),
            (error) => {
                console.warn('Geolocation:', error.message);
                resolve(null);
            },
            { maximumAge: 10 * 60_000, timeout: GEOLOCATION_WAIT },
        );
    });
}

// The town or city at these coordinates, from Nominatim; the coordinates if it fails.
async function placeName(lat, lon) {
    const fallback = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    try {
        const query = new URLSearchParams({ format: 'jsonv2', lat, lon, zoom: 10 });
        const response = await fetch(`${REVERSE_API}?${query}`, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error(`Nominatim answered ${response.status}`);
        const { address = {}, name } = await response.json();
        return address.city || address.town || address.village || address.municipality
            || name || fallback;
    } catch (error) {
        console.warn(error);
        return fallback;
    }
}

async function geolocatedPlace() {
    const coords = await locate();
    if (!coords) return null;
    const lat = coords.latitude;
    const lon = coords.longitude;
    return { lat, lon, name: await placeName(lat, lon), tz: 'auto' };
}

// ── forecast ──

async function fetchForecast(place) {
    const query = new URLSearchParams({
        latitude: place.lat,
        longitude: place.lon,
        timezone: place.tz,
        current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
        hourly: 'temperature_2m,weather_code,precipitation_probability,is_day',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
        forecast_days: 6,
    });
    const response = await fetch(`${API}?${query}`);
    if (!response.ok) throw new Error(`Open-Meteo answered ${response.status}`);
    return response.json();
}

// ── rendering ──

const $ = (selector) => document.querySelector(selector);

function showStatus(state, text) {
    const status = $('.weather-status');
    status.dataset.state = state;
    status.textContent = text;
    status.hidden = false;
}

function renderNow(d, place) {
    const c = info(d.current.weather_code);
    $('.now-icon').replaceWith(icon(d.current.weather_code, d.current.is_day, 'now-icon'));
    $('.now-temp').textContent = degrees(d.current.temperature_2m);
    $('.now-condition').textContent = c.name;
    $('.now-feels').textContent = `Feels like ${degrees(d.current.apparent_temperature)}`;
    $('.now-place').textContent = place.name;
}

function renderDetails(d) {
    const sunrise = d.daily.sunrise[0];
    const sunset = d.daily.sunset[0];
    $('.detail-wind .detail-value').textContent = `${Math.round(d.current.wind_speed_10m)} km/h`;
    $('.detail-humidity .detail-value').textContent = `${d.current.relative_humidity_2m}%`;
    $('.detail-sunrise .detail-value').replaceChildren(el('time', { datetime: sunrise }, hhmm(sunrise)));
    $('.detail-sunset .detail-value').replaceChildren(el('time', { datetime: sunset }, hhmm(sunset)));
}

// The current hour's index: the hourly time matching current.time truncated to the hour.
function currentHourIndex(d) {
    const i = d.hourly.time.indexOf(`${d.current.time.slice(0, 13)}:00`);
    return Math.max(0, i);
}

function renderHours(d) {
    const h = d.hourly;
    const start = currentHourIndex(d);
    const count = Math.min(24, h.time.length - start);
    const items = [];
    for (let n = 0; n < count; n++) {
        const k = start + n;
        items.push(el('li', { class: n === 0 ? 'hour hour-now' : 'hour' },
            el('time', { class: 'hour-time', datetime: h.time[k] }, n === 0 ? 'Now' : h.time[k].slice(11, 13)),
            icon(h.weather_code[k], h.is_day[k], 'hour-icon'),
            el('span', { class: 'hour-temp' }, degrees(h.temperature_2m[k])),
        ));
    }
    $('.hours-list').replaceChildren(...items);
}

function renderDays(d) {
    const day = d.daily;
    // One scale for all six days: the lowest min to the highest max.
    const lo = Math.min(...day.temperature_2m_min);
    const hi = Math.max(...day.temperature_2m_max);
    const span = hi - lo || 1;
    const pct = (v) => `${(v * 100).toFixed(2)}%`;

    const items = day.time.map((date, i) => {
        const min = day.temperature_2m_min[i];
        const max = day.temperature_2m_max[i];
        const rain = day.precipitation_probability_max[i];
        const name = i === 0 ? 'Today' : DAY_NAMES[new Date(`${date}T12:00`).getDay()];
        const start = (min - lo) / span;
        const width = (max - min) / span;

        return el('li', { class: i === 0 ? 'day day-today' : 'day' },
            el('time', { class: 'day-name', datetime: date }, name),
            icon(day.weather_code[i], true, 'day-icon'),
            el('span', { class: 'day-rain', dataset: { rain: rain ?? '' } },
                rain >= 20 ? `${rain}%` : ''),
            el('span', { class: 'day-min' }, degrees(min)),
            // The bar: the track is the whole scale, the inner span is this day's range.
            // Start and width are given as data attributes and as custom properties.
            el('span', {
                class: 'day-range',
                'aria-hidden': 'true',
                dataset: { min, max, lo, hi },
                style: { '--range-start': pct(start), '--range-width': pct(width) },
            }, el('span', { class: 'day-range-bar' })),
            el('span', { class: 'day-max' }, degrees(max)),
        );
    });
    $('.days-list').replaceChildren(...items);
}

function renderCredit() {
    const now = new Date();
    const time = $('.credit-time');
    time.dateTime = now.toISOString();
    time.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function render(d, place) {
    renderNow(d, place);
    renderDetails(d);
    renderHours(d);
    renderDays(d);
    renderCredit();
    document.title = `Weather · ${place.name}`;
    $('.weather-status').hidden = true;
    for (const node of document.querySelectorAll('.now, .details, .hours, .days, .credit')) {
        node.hidden = false;
    }
}

// Each load gets a number; only the latest one may render, so a slow earlier request
// (e.g. Dénia's) never overwrites a later one (the geolocated place).
let latestLoad = 0;

async function load(place) {
    const id = ++latestLoad;
    try {
        const data = await fetchForecast(place);
        if (id === latestLoad) render(data, place);
    } catch (error) {
        console.error(error);
        if (id === latestLoad) showStatus('error', 'Couldn’t load the forecast. Try again later.');
    }
}

async function main() {
    document.documentElement.classList.replace('no-js', 'js');
    const place = readPlace();
    if (place) return load(place);

    // No place in the URL: ask for the visitor's location. Dénia is shown if that is
    // refused or fails, or if there is no answer in time (a permission prompt that is
    // left open never reports back); a position that arrives later still replaces it.
    showStatus('locating', 'Finding your location…');
    let fallbackShown = false;
    const showDefault = () => {
        if (fallbackShown) return;
        fallbackShown = true;
        load(DEFAULT_PLACE);
    };
    const timer = setTimeout(showDefault, GEOLOCATION_WAIT);
    const here = await geolocatedPlace();
    clearTimeout(timer);
    if (here) load(here);
    else showDefault();
}

main();

/*
  Weather App using Open‑Meteo (https://open-meteo.com/)
  - Geocoding API for place search
  - Forecast API for current weather + 5-day outlook
  - Dark/Light mode with red theme and accessible contrast
*/

const els = {
  html: document.documentElement,
  body: document.body,
  toggle: document.getElementById('themeToggle'),
  toggleIcon: document.querySelector('#themeToggle .toggle-icon'),
  toggleText: document.querySelector('#themeToggle .toggle-text'),
  refreshBtn: document.getElementById('refreshBtn'),
  form: document.getElementById('searchForm'),
  input: document.getElementById('cityInput'),
  results: document.getElementById('results'),
  status: document.getElementById('status'),
  section: document.getElementById('weather'),
  location: document.getElementById('location'),
  condition: document.getElementById('condition'),
  updated: document.getElementById('updated'),
  temp: document.getElementById('temp'),
  humidity: document.getElementById('humidity'),
  icon: document.getElementById('currentIcon'),
  forecastGrid: document.getElementById('forecastGrid'),
  loading: document.getElementById('loading'),
  errorBox: document.getElementById('errorBox'),
  unitC: document.getElementById('unitC'),
  unitF: document.getElementById('unitF'),
};

let currentPlace = null;
let currentData = null;

// Theme handling
const THEME_KEY = 'wx-theme';
function setTheme(mode) {
  els.html.setAttribute('data-theme', mode);
  const isDark = mode === 'dark';
  els.toggleIcon.textContent = isDark ? '🌙' : '☀️';
  els.toggleText.textContent = isDark ? 'Dark' : 'Light';
}
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved || (prefersDark ? 'dark' : 'light'));
}
function toggleTheme() {
  const current = els.html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  localStorage.setItem(THEME_KEY, next);
}

// Simple debounce to limit API calls while typing
function debounce(fn, delay = 250) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// Open‑Meteo helpers
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

async function searchPlaces(q, { count = 5 } = {}) {
  const url = new URL(GEO_URL);
  url.searchParams.set('name', q);
  url.searchParams.set('count', String(count));
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  // Cache-bust to avoid CDN/browser caching stale results
  url.searchParams.set('_', Date.now().toString());
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  return data?.results || [];
}

// Weather codes mapping to icon + label (Open‑Meteo weathercode)
const WX = {
  0: { i: '☀️', t: 'Clear sky', bg: 'wx-clear' },
  1: { i: '🌤️', t: 'Mainly clear', bg: 'wx-clear' },
  2: { i: '⛅️', t: 'Partly cloudy', bg: 'wx-cloud' },
  3: { i: '☁️', t: 'Overcast', bg: 'wx-cloud' },
  45: { i: '🌫️', t: 'Fog', bg: 'wx-cloud' },
  48: { i: '🌫️', t: 'Depositing rime fog', bg: 'wx-cloud' },
  51: { i: '🌦️', t: 'Light drizzle', bg: 'wx-rain' },
  53: { i: '🌦️', t: 'Drizzle', bg: 'wx-rain' },
  55: { i: '🌧️', t: 'Dense drizzle', bg: 'wx-rain' },
  56: { i: '🌧️', t: 'Freezing drizzle', bg: 'wx-rain' },
  57: { i: '🌧️', t: 'Freezing drizzle', bg: 'wx-rain' },
  61: { i: '🌧️', t: 'Slight rain', bg: 'wx-rain' },
  63: { i: '🌧️', t: 'Rain', bg: 'wx-rain' },
  65: { i: '🌧️', t: 'Heavy rain', bg: 'wx-rain' },
  66: { i: '🌧️', t: 'Freezing rain', bg: 'wx-rain' },
  67: { i: '🌧️', t: 'Freezing rain', bg: 'wx-rain' },
  71: { i: '🌨️', t: 'Slight snow', bg: 'wx-snow' },
  73: { i: '🌨️', t: 'Snow', bg: 'wx-snow' },
  75: { i: '❄️', t: 'Heavy snow', bg: 'wx-snow' },
  77: { i: '❄️', t: 'Snow grains', bg: 'wx-snow' },
  80: { i: '🌧️', t: 'Rain showers', bg: 'wx-rain' },
  81: { i: '🌧️', t: 'Rain showers', bg: 'wx-rain' },
  82: { i: '🌧️', t: 'Violent rain showers', bg: 'wx-rain' },
  85: { i: '🌨️', t: 'Snow showers', bg: 'wx-snow' },
  86: { i: '🌨️', t: 'Snow showers', bg: 'wx-snow' },
  95: { i: '⛈️', t: 'Thunderstorm', bg: 'wx-rain' },
  96: { i: '⛈️', t: 'Thunderstorm with hail', bg: 'wx-rain' },
  99: { i: '⛈️', t: 'Thunderstorm with hail', bg: 'wx-rain' },
};

function wxInfo(code) {
  return WX[code] || { i: '❔', t: 'Unknown', bg: 'wx-cloud' };
}

async function fetchWeather(lat, lon, timezone) {
  // Fetch current weather + daily forecast for next 5 days
  const url = new URL(FORECAST_URL);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current_weather', 'true');
  url.searchParams.set('hourly', 'relative_humidity_2m');
  url.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('timezone', timezone || 'auto');
  // Ensure fresh data by cache-busting
  url.searchParams.set('_', Date.now().toString());
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Forecast failed');
  return res.json();
}

// Units
const UNIT_KEY = 'wx-unit';
let unit = localStorage.getItem(UNIT_KEY) || 'C';
function toF(c) { return (c * 9) / 5 + 32; }
function formatTemp(vC) {
  const isC = unit === 'C';
  const v = isC ? vC : toF(vC);
  const u = isC ? '°C' : '°F';
  return `${Math.round(v)}${u}`;
}
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function updateBackground(code) {
  const { bg } = wxInfo(code);
  els.body.classList.remove('wx-clear', 'wx-cloud', 'wx-rain', 'wx-snow');
  els.body.classList.add(bg);
}

function renderCurrent(place, data) {
  const { current_weather, hourly } = data;
  const code = current_weather.weathercode;
  const { i, t } = wxInfo(code);

  // Humidity: take nearest hour to current_weather.time
  const timeIdx = hourly.time.indexOf(current_weather.time);
  let hum = null;
  if (timeIdx !== -1 && hourly.relative_humidity_2m && hourly.relative_humidity_2m[timeIdx] != null) {
    hum = hourly.relative_humidity_2m[timeIdx];
  } else if (hourly.relative_humidity_2m?.length) {
    hum = hourly.relative_humidity_2m[0]; // fallback
  }

  els.icon.textContent = i;
  els.location.textContent = `${place.name}${place.admin1 ? ', ' + place.admin1 : ''}${place.country ? ', ' + place.country : ''}`;
  els.condition.textContent = t;
  els.updated.textContent = `Updated ${new Date(current_weather.time).toLocaleString()}`;
  els.temp.textContent = formatTemp(current_weather.temperature);
  els.humidity.textContent = hum != null ? `${Math.round(hum)}%` : '—';
  updateBackground(code);
}

function renderForecast(data) {
  const d = data.daily;
  const days = d.time.map((date, idx) => ({
    date,
    code: d.weathercode[idx],
    tmin: d.temperature_2m_min[idx],
    tmax: d.temperature_2m_max[idx],
  })).slice(0, 5);

  els.forecastGrid.innerHTML = days.map(day => {
    const { i, t } = wxInfo(day.code);
    return `
      <div class="day" aria-label="${t} on ${formatDate(day.date)}">
        <div class="d-date">${formatDate(day.date)}</div>
        <div class="d-icon">${i}</div>
  <div class="d-temp">${formatTemp(day.tmin)} · ${formatTemp(day.tmax)}</div>
      </div>
    `;
  }).join('');
}

function clearResults() { els.results.innerHTML = ''; }

function showResults(list) {
  if (!list.length) { clearResults(); return; }
  els.results.innerHTML = list.map((p, idx) => {
    const sub = [p.admin1, p.country].filter(Boolean).join(', ');
    return `<li role="option" data-index="${idx}">
      <span>${p.name}</span>
      <small>${sub}</small>
    </li>`;
  }).join('');
}

async function handleSelect(place) {
  clearResults();
  els.status.textContent = 'Loading weather…';
  els.loading.classList.remove('hidden');
  els.errorBox.classList.add('hidden');
  try {
    const data = await fetchWeather(place.latitude, place.longitude, place.timezone);
  currentPlace = place;
  currentData = data;
  renderCurrent(currentPlace, currentData);
  renderForecast(currentData);
    els.section.classList.remove('hidden');
    els.status.textContent = '';
    els.errorBox.textContent = '';
  } catch (err) {
    console.error(err);
    els.status.textContent = 'Failed to load weather data. Please try again later.';
    els.errorBox.textContent = 'Unable to load weather right now. Check your connection or try a different city.';
    els.errorBox.classList.remove('hidden');
  }
  finally { els.loading.classList.add('hidden'); }
}

// Real-time refresh helpers
async function refreshNow() {
  if (!currentPlace) {
    // If nothing selected yet, load default (geo/Manila)
    await loadDefault();
    return;
  }
  els.status.textContent = 'Refreshing…';
  try {
    const data = await fetchWeather(currentPlace.latitude, currentPlace.longitude, currentPlace.timezone);
    currentData = data;
    renderCurrent(currentPlace, currentData);
    renderForecast(currentData);
    els.status.textContent = '';
  } catch (e) {
    els.status.textContent = 'Refresh failed. Will try again later.';
  }
}

// Wire up search
const onType = debounce(async () => {
  const q = els.input.value.trim();
  if (!q) { clearResults(); return; }
  els.status.textContent = 'Searching…';
  try {
    const list = await searchPlaces(q, { count: 8 });
    showResults(list);
    els.status.textContent = list.length ? '' : 'No results.';
  } catch (e) {
    els.status.textContent = 'Could not search right now.';
  }
}, 300);

els.input.addEventListener('input', onType);

els.results.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const idx = Number(li.dataset.index);
  const q = els.input.value.trim();
  // Re-run the last query to get the same list, then pick the item by index
  if (!q) return;
  searchPlaces(q, { count: 8 }).then(list => {
    const place = list[idx];
    if (place) handleSelect(place);
  });
});

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = els.input.value.trim();
  if (!q) return;
  els.status.textContent = 'Searching…';
  try {
    const list = await searchPlaces(q, { count: 1 });
    if (list[0]) handleSelect(list[0]);
    else els.status.textContent = 'No results.';
  } catch (e) {
    els.status.textContent = 'Could not search right now.';
  }
});

// Theme toggle
els.toggle.addEventListener('click', toggleTheme);

// Manual refresh button
if (els.refreshBtn) {
  els.refreshBtn.addEventListener('click', () => {
    refreshNow();
  });
}

// Unit toggle
function applyUnitUI() {
  const isC = unit === 'C';
  els.unitC.classList.toggle('active', isC);
  els.unitC.setAttribute('aria-pressed', String(isC));
  els.unitF.classList.toggle('active', !isC);
  els.unitF.setAttribute('aria-pressed', String(!isC));
}
function setUnit(next) {
  unit = next;
  localStorage.setItem(UNIT_KEY, unit);
  applyUnitUI();
  // Re-render with current data if available
  if (currentPlace && currentData) {
    renderCurrent(currentPlace, currentData);
    renderForecast(currentData);
  }
}
els.unitC.addEventListener('click', () => setUnit('C'));
els.unitF.addEventListener('click', () => setUnit('F'));

// Geolocation with fallback to Manila
function geolocate() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 7000, maximumAge: 300000 });
  });
}

async function loadDefault() {
  els.loading.classList.remove('hidden');
  try {
    const pos = await geolocate();
    const { latitude, longitude } = pos.coords;
    // Reverse geocoding via Open‑Meteo: use nearest place
    const url = new URL('https://geocoding-api.open-meteo.com/v1/reverse');
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');
    url.searchParams.set('_', Date.now().toString());
  const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Reverse geocoding failed');
    const data = await res.json();
    const place = data?.results?.[0] || { name: 'Your Location', latitude, longitude, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    await handleSelect(place);
  } catch (_) {
    // Fallback to Manila
    const defaultPlaces = await searchPlaces('Manila', { count: 1 }).catch(() => []);
    if (defaultPlaces[0]) await handleSelect(defaultPlaces[0]);
  } finally {
    els.loading.classList.add('hidden');
  }
}

// Init
initTheme();
applyUnitUI();
loadDefault();

// Auto-refresh when user returns to the tab (fresh at the moment of view)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    refreshNow();
  }
});

// Optional: periodic refresh every 5 minutes to keep data fresh if tab stays open
const AUTO_REFRESH_MS = 5 * 60 * 1000;
setInterval(() => {
  refreshNow();
}, AUTO_REFRESH_MS);

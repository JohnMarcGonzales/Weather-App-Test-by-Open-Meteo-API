# Weather App • Open‑Meteo

Hi! I’m John Marc Gonzales, a fresh grad in IT. This is a tiny weather app I built to practice real-world web dev stuff: API calls, async/await, DOM updates, clean UI, and dark/light themes. No frameworks, no build tools—just HTML/CSS/JS and the excellent Open‑Meteo API (no API key needed).

LinkedIn - https://www.linkedin.com/in/jmgonzales2203/

## What it does
- Search any city and get its weather
- Auto-detect your location via the browser (with fallback)
- Current conditions: temperature, humidity, and an emoji icon
- 5‑day forecast with min/max temps
- Dark/light mode with a red theme
  - Light mode = soft red accent
  - Dark mode = deep red accent
  - Text stays readable: white in dark, black in light
- °C/°F toggle that persists
- Loading clouds and friendly error states

## Quick start
Option 1: Download the files and open `index.html` directly in a browser.

Option 2: Open 'https://johnmarcgonzales.github.io/Weather-App-Test-by-Open-Meteo-API/' directly in a browser.

Option 3: run a local server (helps geolocation work reliably):

```powershell
# from the folder above Weather-App-Test-by-Open-Meteo-API
python -m http.server 5500
```
Open:
```
http://localhost:5500/Weather-App-Test-by-Open-Meteo-API/index.html
```

## How to use
- Allow location if prompted (or search for a city like “Manila” or “New York”).
- Switch dark/light with the moon/sun button.
- Flip units with the °C/°F pill buttons.

## Tech + APIs
- Stack: HTML + CSS + Vanilla JS (Fetch API + async/await)
- APIs (Open‑Meteo):
  - Geocoding search: https://geocoding-api.open-meteo.com/v1/search
  - Reverse geocoding: https://geocoding-api.open-meteo.com/v1/reverse
  - Forecast: https://api.open-meteo.com/v1/forecast
- Data pulled:
  - current_weather (temp, weathercode)
  - hourly: relative_humidity_2m (for humidity)
  - daily: weathercode, temperature_2m_min, temperature_2m_max
- Weather icons: mapped from Open‑Meteo weather codes to emojis

## Project structure
```
Weather-App-Test-by-Open-Meteo-API/
├─ index.html     # markup + app layout
├─ styles.css     # red theme, dark/light mode, responsive UI
└─ script.js      # search, geolocation, Open‑Meteo fetch, render logic
```

## Notes & customization
- Geolocation usually requires HTTPS or localhost. If it doesn’t prompt, use the local server above.
- Default fallback city is Manila—change it in `script.js` if you want another.
- Colors/theme live in `styles.css` as CSS variables. Tweak the reds to taste.
- Units/theme are saved to localStorage so your choices stick.

## Known limits (for now)
- Emojis for icons (simple and fun, not a full icon set).
- Humidity uses the hourly value closest to the current time from the API.
- Minimal i18n; uses your browser locale for formatting dates.

## Credits
- Weather data by Open‑Meteo — huge thanks! https://open-meteo.com/
- Made by John Marc Gonzales ™
- Testing api Project! :)

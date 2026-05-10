# India AQI Dashboard

Pan-India air-quality dashboard. Pick any of 30 cities from a dropdown or click a marker on the
India map to drill into a per-city page with daily, weekly, monthly and seasonal AQI trends.
Data is free and verifiable: Open-Meteo (Copernicus CAMS-modeled) is the primary feed,
CPCB National AQI is cited as the authoritative reference.

## Project layout

```
AQI_Dashboard/
  dashboard/             Next.js 16 + Tailwind v4 + Recharts + Leaflet (static export)
    src/lib/cities.ts    City registry — single source of truth
    src/app/             Routes: /, /city/[slug], /sources, /methodology
    public/data/         Generated JSON consumed by the frontend (committed)
  scripts/               Python ETL pipeline
    download/            Open-Meteo downloader
    transform/           AQI breakpoints + per-city dataset + index builders
    run_pipeline.py      Orchestrator
  data/raw/              Raw API payloads (gitignored, regenerable)
```

## Running locally

### One-time setup

```sh
# Frontend deps
cd dashboard
npm install

# Python deps (Windows: use D:/Python/python.exe; the system `python3` is a Store stub)
cd ..
D:/Python/python.exe -m pip install -r scripts/requirements.txt
```

### Refresh the data (smoke test)

```sh
# One city, full pipeline
D:/Python/python.exe scripts/run_pipeline.py --city delhi

# All 30 cities (~5–10 minutes)
D:/Python/python.exe scripts/run_pipeline.py
```

### Serve the dashboard

```sh
cd dashboard
npm run dev          # http://localhost:3000

# or build the static export
npm run build && npx next start
```

## Sources

| Source | Role | Auth | License |
|---|---|---|---|
| [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) | Primary historical + current | None | CC-BY 4.0 |
| [CPCB National AQI](https://app.cpcbccr.com/AQI_India) | Authoritative reference | n/a | Public bulletins |
| [OpenAQ v3](https://docs.openaq.org/) | Planned station overlay (v1.1) | Free API key | Open data |
| OSM map tiles | Base map | None | ODbL |

WAQI/aqicn and IQAir are deliberately excluded — see `dashboard/src/app/sources/page.tsx`.

## Data integrity

The dashboard's pollutant numbers (PM2.5, PM10, CO, NO₂, SO₂, O₃, EU AQI) come
straight from Open-Meteo's Air Quality API and are easy to reproduce — call
the same endpoint with the same lat/lon and start date and you get the same
hourly arrays. The headline India AQI is **computed** from PM2.5, PM10, NO₂
and O₃ (8-hour max) using CPCB's official breakpoint tables and its
≥16-valid-hours-per-day rule, with two important simplifications:

- **4 of CPCB's 8 pollutants.** NH₃ and Pb are not served by Open-Meteo;
  CO and SO₂ are deliberately excluded because CAMS Global accuracy for
  boundary-layer gaseous species is poor (modeled CO comes back at
  ~0.5 mg/m³ for Delhi, whereas station CO in winter is 4–8 mg/m³).
  Read our number as a *4-of-8 CPCB-style AQI*, not the official
  daily bulletin. A "4-of-8" badge on every per-city page links to the
  methodology section that explains this.
- **Modeled, not observed.** Open-Meteo serves Copernicus CAMS — for most
  Indian cities the served product is CAMS Global (~0.4°, ~40 km), not a
  station observation. Trends are reliable; absolute values can diverge
  from a single CPCB station inside the same cell.

For the full audit (what's real, what's simplified, what was asserted
without evidence and was fixed), see `DESIGN.md` §"What this AQI is and isn't"
and the `/methodology` page.

## Adding a city

1. Append a `City` entry to `dashboard/src/lib/cities.ts`.
2. Run the pipeline: `D:/Python/python.exe scripts/run_pipeline.py --city <slug>`.
3. The static export will pick up the new `/city/<slug>` route on next `npm run build`.

## Daily refresh

`.github/workflows/refresh.yml` runs the pipeline at 02:00 IST and commits the JSON diff
back to the repo. No browser-side API calls — everything is static.

## License

Apache-2.0. See `LICENSE`.

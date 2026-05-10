# Changelog

All notable changes to the India AQI Dashboard are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
**Every commit pushed to GitHub gets an entry under `[Unreleased]` with the
date and a one- or two-line summary.** When a version is cut, move the
accumulated `[Unreleased]` notes under a new `[x.y.z] — YYYY-MM-DD` heading.

## Conventions

- Entries are grouped under: **Added**, **Changed**, **Fixed**, **Removed**,
  **Deprecated**, **Security**, **Data**.
- Reference files with backticks, e.g. `scripts/run_pipeline.py`.
- Reference commits / PRs after the entry: `(commit abc1234)` or `(#42)`.
- Keep entries factual and terse. Save rationale for `DESIGN.md`.

## [Unreleased]

_Nothing yet. Add entries here as commits land._

---

## [0.1.0] — 2026-05-10

Initial release.

### Added
- Next.js 16.2.1 (App Router, Turbopack, `output: 'export'`) scaffold under `dashboard/` with React 19.2.4, Tailwind v4, Recharts 3.8, Leaflet 1.9 + react-leaflet 5, TypeScript strict, Geist fonts.
- City registry of 30 Indian cities at `dashboard/src/lib/cities.ts` (mega metros + million-plus + state capitals). Slugs frozen at v1.
- `scripts/export_cities.mjs` to mirror `cities.ts` → `scripts/cities.json` so Python and TypeScript share one registry.
- Python ETL pipeline:
  - `scripts/download/aqi_openmeteo.py` — loops cities, calls Open-Meteo Air Quality API, 6-s throttle, 4× exponential-backoff retry on HTTP 429, `--missing-only` flag for partial recovery.
  - `scripts/transform/aqi_breakpoints.py` — `compute_india_aqi(pm25, pm10)` + monthly / seasonal / box-plot aggregations (lifted from Kolkata's `environment_transform.py`).
  - `scripts/transform/build_city_dataset.py` — raw → `dashboard/public/data/cities/{slug}.json`.
  - `scripts/transform/build_index.py` — emits `index.json` (drives the map) and `meta.json` (refresh timestamps).
  - `scripts/run_pipeline.py` — orchestrator with `--city` / `--skip-download` / `--skip-export` flags.
- Per-city dashboard at `/city/[slug]`: weekly AQI time-series, monthly distribution, seasonal AQI bars, PM2.5+PM10 stacked area, CO/NO₂/SO₂/O₃ line chart, seasonal pollution fingerprint, India AQI vs EU AQI. Stat cards: average, peak, good-air days, days observed. CityHeader with latest AQI + category + advice.
- Landing page `/` with Leaflet India map (markers colored & sized by current AQI), national summary (avg, good-air count, worst-3, best-3), and a searchable city dropdown in the navbar.
- `/sources` and `/methodology` pages documenting attribution, licensing, CPCB breakpoint tables, season definitions, and known caveats.
- `sitemap.ts` and `robots.ts` (both `force-static`); `not-found.tsx`.
- Layout primitives in `dashboard/src/components/layout/`: `Shell`, `Navbar`, `Footer`, `ThemeProvider`, `PageHeader`, `StatCard`, `ChartCard`, `DateRangeFilter`, `CitySelector`. Map components in `components/map/`. National summary in `components/home/`.
- Daily refresh: `.github/workflows/refresh.yml` runs the pipeline at 02:00 IST and commits any data diff.
- Project docs: `README.md`, `LICENSE` (Apache-2.0), `NOTICE`, `CLAUDE.md`, `DESIGN.md`, this `CHANGELOG.md`.

### Data
- 30 / 30 cities populated. Each payload covers 2022-01-01 → previous day (≈1,590 daily records, 18 seasonal records, 12 monthly box-plot rows). Total committed JSON ≈ 6.5 MB.
- Source: Open-Meteo Air Quality API (Copernicus CAMS, ~11 km grid), CC-BY 4.0.
- CPCB National AQI cited as authoritative reference (not ingested).
- WAQI/aqicn (license restrictions on redistribution) and IQAir (paid) deliberately excluded.

### Notes
- `next start` does **not** work with `output: 'export'` in Next 16; use `npx serve@latest dashboard/out` to run the production build locally.
- On Windows, the pipeline expects `D:/Python/python.exe` (the system `python3` is a Windows-Store stub).

[Unreleased]: https://github.com/canindya/India-AQI-Dashboard/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/canindya/India-AQI-Dashboard/releases/tag/v0.1.0

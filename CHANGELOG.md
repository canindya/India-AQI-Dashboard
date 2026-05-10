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

### Changed
- **AQI computation upgraded from 2 to 4 pollutants** (`scripts/transform/aqi_breakpoints.py`). The composite India AQI now uses PM2.5 (24-h mean), PM10 (24-h mean), NO₂ (24-h mean) and O₃ (max of 8-hour rolling means) with CPCB's official breakpoint tables. CPCB's "≥16 valid hours per day" rule is now enforced — days with insufficient data produce a null AQI rather than a misleading short-window value. CPCB's "≥3 sub-indices including ≥1 PM" composite rule is enforced too. Pipeline regenerated all 30 city JSONs; AQI values change meaningfully (e.g., Delhi 2026-05-09: 195 Moderate → 302 Very Poor, driven by 8-h max O₃ ≈ 214 µg/m³).
- **CO and SO₂ deliberately excluded from AQI computation** even though Open-Meteo serves them. Reason: CAMS Global accuracy for boundary-layer gaseous species is poor (modeled Delhi CO ≈ 0.5 mg/m³ vs station CO 4–8 mg/m³ in winter); including them would push AQI in the wrong direction. NH₃ and Pb are unavailable from Open-Meteo. So the new AQI is a "4-of-8 CPCB-style AQI" — closer to the official bulletin than the v0.1 PM-only AQI, but still not identical.
- **Per-city JSON now carries an `aqi_method` block** documenting the pollutants used, the 16-hour minimum, the composite rule, the breakpoint source, and which pollutants were excluded and why.
- **Per-city header badge** changed from `PM-only` to `4-of-8`; tooltip updated to list the four included pollutants.
- **Methodology page**: "What this AQI is — and isn't" section rewritten to describe the 4-pollutant composite (no longer "PM-only"); "How the AQI is computed" section now explains the 8-hour rolling max for O₃ and the ≥16-hour rule. Caveats expanded with a concrete CO modeled-vs-station numeric example.
- **DESIGN.md, README "Data integrity", CLAUDE.md "AQI math reference"**: all updated to reflect the 4-pollutant computation and the deliberate CO/SO₂ exclusion. CLAUDE.md notes that this diverges from Kolkata's still-PM-only pipeline.

### Earlier in this Unreleased range (audit pass)
- **Sources page**: removed the unsupported "±30 AQI points" claim. Replaced with an honest hedge that we have not yet back-tested the divergence systematically.
- **Resolution claim**: corrected "~11 km global grid" to "CAMS Europe (~0.1°, ~11 km) where available; CAMS Global (~0.4°, ~40 km) for most of India" across `sources/page.tsx`, `methodology/page.tsx`, and `DESIGN.md`.
- **`getAQIAdvice` (`dashboard/src/lib/colors.ts`)**: rewrote the six health-effect strings to use CPCB's published "Likely Health Impacts" wording, with `(CPCB)` attribution on each line.
- **City registry**: removed the arbitrary `populationBand` field from `cities.ts`, `City` interface, `export_cities.mjs` regex, `CityHeader` props, and `CityClient`. Selection criterion is now documented as a comment at the top of `cities.ts`.
- **Per-city header (`CityHeader.tsx`)**: added a centroid-snap caption and the methodology-linked AQI-method badge.
- **`colors.ts` header comment**: clarified that the hex palette is our choice, not CPCB's actual swatches.
- **README**: added a "Data integrity" section.
- **`CLAUDE.md`**: dropped the stale `populationBand` reference from the "Adding a city" recipe.

### Documentation
- **Audit findings + 4-pollutant remediation plan** recorded in `C:\Users\Anindya\.claude\plans\i-want-to-build-cozy-hickey.md` (kept locally, not committed).

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

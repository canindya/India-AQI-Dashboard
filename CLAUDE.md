# India AQI Dashboard — Claude context

Pan-India AQI dashboard. 30 Indian cities. Pick a city via dropdown or by clicking
a marker on a Leaflet India map; per-city page mirrors the data depth of the
original Kolkata dashboard at `C:\Users\Anindya\dev\City_Kolkata`.

For the *why* behind every choice below, read `DESIGN.md`. This file is the
**operational** context — what to do, what not to do, where things live.

## Stack

- **Frontend** (in `dashboard/`): Next.js 16.2.1 (App Router, Turbopack, **`output: 'export'`** static export), React 19.2.4, Tailwind v4, Recharts 3.8, Leaflet 1.9 + react-leaflet 5, TypeScript strict, Geist fonts.
- **Pipeline** (in `scripts/`): Python (requests, pandas, numpy). On Windows the project Python is `D:/Python/python.exe` — the system `python3` is a Windows-Store stub without packages.
- **Data sources:** Open-Meteo Air Quality API (free, no auth, CC-BY 4.0) is the *only* programmatic feed used. CPCB National AQI is the *authoritative reference* for citation, not ingested. See `dashboard/src/app/sources/page.tsx`.

## Project layout

```
AQI_Dashboard/
  dashboard/                              Next.js app
    src/app/                              Routes (App Router)
      page.tsx                            Landing: India map + national summary
      city/[slug]/{page,CityClient}.tsx   Per-city dashboard
      sources/page.tsx                    Attribution & licensing
      methodology/page.tsx                AQI breakpoints + caveats
      sitemap.ts, robots.ts               Both must use `force-static`
    src/components/
      layout/                             Navbar, Footer, Shell, ThemeProvider,
                                          PageHeader, StatCard, ChartCard,
                                          DateRangeFilter, CitySelector
      map/                                IndiaMap (dynamic-imported), MapLegend
      city/                               CityHeader (charts inlined in CityClient)
      home/                               NationalSummary
    src/lib/
      cities.ts                           **Single source of truth** for cities
      types.ts                            AQIDaily / AQIData / CityIndex
      data.ts                             loadCity / loadCityIndex
      colors.ts                           CPCB AQI colors + helpers
      png.ts                              Chart-to-PNG export
    public/data/                          Generated JSON (committed)
      cities/{slug}.json                  Full per-city payload
      index.json                          Map markers + current AQI
      meta.json                           Refresh timestamps

  scripts/                                Python ETL
    requirements.txt
    export_cities.mjs                     Mirrors cities.ts → cities.json
    download/aqi_openmeteo.py             Loops cities.json, writes data/raw/
    transform/aqi_breakpoints.py          compute_india_aqi + aggregations
    transform/build_city_dataset.py       Raw → public/data/cities/{slug}.json
    transform/build_index.py              Builds index.json + meta.json
    run_pipeline.py                       Orchestrator

  data/raw/                               Open-Meteo payloads (gitignored)
  .github/workflows/refresh.yml           Daily 02:00 IST cron
```

## Critical conventions (read before coding)

- **`src/lib/cities.ts` is the single source of truth** for the city list. `scripts/export_cities.mjs` mirrors it to `scripts/cities.json` so the Python pipeline reads the same registry. Run `node scripts/export_cities.mjs` (or `run_pipeline.py` without `--skip-export`) after editing the TS file.
- **Slugs are URLs forever.** Once a slug ships in production it never changes. Pick canonical names up-front (`bengaluru`, not `bangalore`; full `thiruvananthapuram`).
- **Open-Meteo free-tier rate limits hit hard** for full-history 4-year fetches. The downloader uses a 6-second throttle and 4× exponential-backoff retry on HTTP 429. If a refresh skips a city, run `python scripts/download/aqi_openmeteo.py --missing-only` then rebuild — cached raw payloads are kept in `data/raw/`.
- **JSON schema must stay byte-compatible** with the Kolkata dashboard's `aqi_daily.json` shape (keys: `daily`, `monthly`, `seasonal`, `box_plot_by_month`, `date_range`). We add `city` and `source` keys but never modify the originals.
- **Tailwind is v4** — `@import "tailwindcss"` + `@theme inline`, NOT v3. `tailwind.config.*` does not exist.
- **Leaflet must be dynamic-imported** with `{ ssr: false }`. See `src/components/map/IndiaMap.tsx`. Importing `leaflet` at module top will break SSG.
- **`force-static`** must be set on `sitemap.ts` and `robots.ts` for static export; route handlers default to dynamic and will fail the build.
- **`next start` does NOT work with `output: 'export'`** — use `npx serve@latest out` to test the production build locally.
- **Pandas NaT/NaN:** the transform's `_round_or_none` uses `pd.isna(val)` because monthly aggregations can return NaT for empty groups; plain `np.isnan` is not enough.

## Common operations

```sh
# Refresh data
D:/Python/python.exe scripts/run_pipeline.py --city delhi   # one city smoke test
D:/Python/python.exe scripts/run_pipeline.py                # all 30
D:/Python/python.exe scripts/run_pipeline.py --skip-download # rebuild from cached raw

# Recover from rate limits
D:/Python/python.exe scripts/download/aqi_openmeteo.py --missing-only
D:/Python/python.exe scripts/transform/build_city_dataset.py
D:/Python/python.exe scripts/transform/build_index.py

# Frontend
cd dashboard && npm install
npm run dev                             # http://localhost:3000 (charts render via fetch)
npm run build                           # static export to dashboard/out
npx serve@latest dashboard/out -l 3535  # serve the production build
```

## Adding a city

1. Append a `City` entry to `dashboard/src/lib/cities.ts` (slug, name, state, lat, lon).
2. Run `D:/Python/python.exe scripts/run_pipeline.py --city <slug>` to fetch + transform that one city.
3. `npm run build` will pick up the new `/city/<slug>` route via `generateStaticParams`.

## Reference for AQI math

`compute_india_aqi(pm25, pm10, no2, o3_8h_max)` in
`scripts/transform/aqi_breakpoints.py` implements CPCB's composite AQI from 4 of
the 8 official pollutants (PM2.5, PM10, NO₂, 8-h max O₃). Rules enforced:
sub-index linear interpolation between CPCB breakpoints; daily aggregates require
≥16 valid hourly readings; composite requires ≥3 sub-indices including ≥1 PM.

**Diverged from Kolkata.** Kolkata's `environment_transform.py` still uses the
PM-only computation. If breakpoint tables change at CPCB, update both — but the
shapes are no longer identical, so the JSON files differ in the `aqi` column for
days when O₃ or NO₂ dominates.

CO and SO₂ are intentionally NOT used in the AQI (CAMS Global accuracy is poor for
boundary-layer gaseous species). NH₃ and Pb aren't served by Open-Meteo. The
methodology page and the per-city "4-of-8" badge surface this.

## What lives where for cross-references

- Architecture rationale & trade-offs → `DESIGN.md`
- Per-commit history → `CHANGELOG.md`
- User-facing license & data attribution → `NOTICE`, `dashboard/src/app/sources/page.tsx`, `dashboard/src/components/layout/Footer.tsx`

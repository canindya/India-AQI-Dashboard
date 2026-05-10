# Design

This document captures the *why* behind the India AQI Dashboard. For *what to do*
and *where things live*, see `CLAUDE.md`. For per-commit history, see `CHANGELOG.md`.

## Goal

Let any visitor pick an Indian city — by clicking a marker on a national map or
typing into a dropdown — and see four years of air-quality trends with the same
depth as the standalone Kolkata dashboard. Every number must trace to a free,
authentic source. No paid feeds, no scraped redistributed data.

## Foundational principles

1. **Free and verifiable end-to-end.** A visitor must be able to click "Sources",
   open the upstream provider, and replicate the number we display. If a source
   forbids redistribution of its cached values (WAQI/aqicn) or charges money
   (IQAir), it is out — even if the data is better.
2. **Static at the edge, no surprises in the browser.** The deployed site is a
   bundle of HTML + JSON. No browser-side third-party API calls. No leaked keys.
   No rate-limit failures during a traffic spike. Refreshes happen in a
   server-side cron, never on page load.
3. **Reuse before re-invention.** The Kolkata project has a working pipeline,
   working chart vocabulary, working theme system. Lift first, customize only
   where the pan-India scope demands it.
4. **One registry, two consumers.** A single typed list of cities drives both
   the Python ETL and the Next.js routes. Drift between "what the pipeline
   downloaded" and "what the frontend renders" is impossible by construction.
5. **Slugs are forever.** URLs that ship are public commitments. Renaming
   `bangalore` to `bengaluru` after launch breaks bookmarks, embeds, and search.

## Architecture decisions

### Why a static export, not SSR / a backend

Trade-off: static export means we can't do live "current AQI" lookups in the
browser; the freshness floor is "yesterday's data". In return we get:

- **Zero browser-side API calls** — no key leakage, no CORS, no rate-limit
  failures, no third-party uptime risk on our hot path.
- **Deployable to any static host** — GitHub Pages, Cloudflare Pages, Vercel
  free tier, S3 + CloudFront. Nothing to run, nothing to scale.
- **Reproducible builds** — given a `data/` directory, anyone can `npm run
  build` and produce byte-identical output. Useful for audits.

The freshness floor is acceptable because daily AQI is the dominant analytical
unit; intra-day swings need 1-hour averaging to be meaningful and aren't worth
the complexity. If sub-daily becomes a real requirement we add an optional
"current snapshot" component that fetches a small `/data/current.json` updated
hourly by cron — still static, still no keys in the browser.

### Why Open-Meteo (CAMS-modeled) is the *only* programmatic source in v1

We considered four free providers:

| Provider | Pros | Cons | Decision |
|---|---|---|---|
| **Open-Meteo Air Quality** | Free, no auth, hourly 2022→present for any lat/lon, CC-BY 4.0, already proven in Kolkata pipeline | Modeled (Copernicus CAMS), ~11 km grid — accuracy degrades over hill/coastal terrain | **Primary** |
| OpenAQ v3 | Real station observations, CPCB CAAQMS network | Free API key required, sparse for smaller capitals (0–1 stations), per-measurement attribution | **Deferred to v1.1** as overlay |
| WAQI / aqicn | Free token, 582 CPCB station feeds | License explicitly forbids redistribution of cached/archived data — incompatible with our static-JSON model | **Excluded** |
| IQAir | High-quality global feed | Paid for commercial / programmatic use | **Excluded** |

Open-Meteo's killer feature is *uniform coverage*: every city gets four years of
hourly data on the same schema, regardless of station availability. That is
what makes a 30-city dashboard feasible without per-city special cases. We
flag the modeled-vs-station caveat on the Sources and Methodology pages and
will surface terrain warnings on hill cities (Shimla, Srinagar, Dehradun,
Guwahati) when we add OpenAQ overlays.

CPCB is cited as the **authoritative reference** but not ingested. CPCB's
public API requires registration with no clear redistribution terms, and the
daily bulletins are PDFs. Citing CPCB while computing from CAMS is the
honest position: "modeled to give you uniform coverage, official numbers
are at app.cpcbccr.com if you want station-level truth".

### Why daily refresh, not hourly

The Open-Meteo free tier shares a per-IP quota. A 4-year hourly fetch for one
city is a heavy single request; 30 of them in a tight loop trips 429 even with
careful throttling (we observed it on the first run). Daily is plenty for
trend analysis, and 02:00 IST is a quiet window globally. If we ever want
hourly current AQI we'd add a separate, much smaller "today only" fetch that
runs every hour — different code path, different file.

### Why `cities.ts` is the source of truth (and `scripts/cities.json` is generated)

The frontend is TypeScript-strict; it wants a typed `City[]` for routing,
dropdown rendering, and `generateStaticParams`. The pipeline is Python; it
wants a JSON list to iterate. Maintaining two files by hand drifts within a
week. The build path is:

```
src/lib/cities.ts ── node scripts/export_cities.mjs ──▶ scripts/cities.json
        │                                                        │
        └───── frontend reads (typed) ──┐         ┌── Python reads (loose)
                                        ▼         ▼
                                       single registry
```

`export_cities.mjs` parses the literal `City[]` array out of `cities.ts` with
a regex (the file is hand-curated and stable). This avoids pulling a TS
loader into the build, and makes the export step trivially debuggable.

### Why JSON schema parity with Kolkata is non-negotiable

The per-city payload mirrors `City_Kolkata/dashboard/public/data/aqi_daily.json`
exactly: `{daily, monthly, seasonal, box_plot_by_month, date_range}`. We
*add* `city` and `source` keys (additive, never breaking) but never rename,
remove, or restructure the originals.

Why: it lets the per-city page be a near-verbatim clone of Kolkata's
`/environment/page.tsx`, which means seven battle-tested chart components
come along for free. Future Kolkata fixes can be lifted with a `git diff`
rather than re-engineered. If the schemas drift, that bridge collapses.

### Why CPCB AQI breakpoints, not WHO or EU

CPCB is what Indians read in news bulletins ("Delhi AQI is 412, Severe").
WHO guidelines are health-based concentration thresholds, not an index.
EU AQI uses different breakpoints with a `Very Good` band that doesn't exist
in CPCB. Mismatching the scale would confuse exactly the audience we want
to serve.

We expose the EU AQI value too (Open-Meteo provides it for free), as a
secondary chart that visualises how strict the Indian scale is for PM
versus the European scale.

### Why Leaflet (not Mapbox / D3 / topo)

- **Already in the Kolkata stack** — `react-leaflet` 5 is a known quantity, the
  SSR-safe dynamic-import pattern is already documented.
- **No API key, no quota.** Mapbox needs a token; OpenStreetMap tiles via Leaflet
  are free and ODbL-licensed.
- **Markers > choropleth for v1.** A choropleth needs aggregating to states,
  which loses individual-city information. We prefer the visceral "30 dots
  on a map, color = current AQI" because it preserves the metaphor of "pick a
  city".

If the city count grows past ~100 we may add a state-level choropleth as a
zoomed-out layer, but at 30 cities markers are clearer.

### Why no internationalization in v1

The Kolkata dashboard ships with EN + BN. We deliberately stripped i18n from
v1 to keep the surface area small and focused. Indian AQI nomenclature
(Severe / Very Poor / Poor / Moderate / Satisfactory / Good) is already a
hybrid English-Indian vocabulary that translates poorly. We will add language
support when the page count justifies the complexity, not before.

## Visual & interaction design

### CPCB-aligned color scale

Six AQI buckets, six colors, used everywhere:

| Bucket | Range | Color | Token |
|---|---|---|---|
| Good | 0–50 | `#4CAF50` (green) | `COLORS.aqi.good` |
| Satisfactory | 51–100 | `#9ACD32` (yellow-green) | `COLORS.aqi.satisfactory` |
| Moderate | 101–200 | `#FFC107` (amber) | `COLORS.aqi.moderate` |
| Poor | 201–300 | `#FF9800` (orange) | `COLORS.aqi.poor` |
| Very Poor | 301–400 | `#F44336` (red) | `COLORS.aqi.veryPoor` |
| Severe | 401+ | `#7B1FA2` (deep purple) | `COLORS.aqi.severe` |

`getAQIColor(aqi)` and `getAQILabel(aqi)` in `dashboard/src/lib/colors.ts` are
the canonical resolvers — every chart cell, marker, stat card, and category
chip routes through them so a future palette change is one edit.

### Theme system (dark default + light toggle)

CSS custom properties in `globals.css` swap on `.light` class on `<html>`.
Tailwind v4 `@theme inline` exposes them as `bg-background`, `text-foreground`,
`bg-card`, `border-border`, `text-muted`. Recharts axes/grids/tooltips use
`!important` overrides so theme changes propagate without per-chart code.

`localStorage['india-aqi-theme']` persists choice. SSR returns the dark
default; the `light` class is toggled in a `useEffect` after hydration to
avoid flash-of-unstyled-content. We accept the brief dark→light flicker on
first paint as the cost of static export — adding a no-flicker boot script
would mean injecting raw HTML into `<head>` and we judged it not worth the
maintenance cost for a niche preference.

### Component vocabulary

Five primitives, used everywhere:

- **`PageHeader`** — left-bordered title block. Three accent colors
  (`warm`, `cool`, `leaf`) mark page categories.
- **`StatCard`** — KPI tile with optional colored value (used heavily for
  AQI numbers, where color = severity).
- **`ChartCard`** — wraps every chart with title/subtitle/badge and PNG/CSV
  export buttons. The export buttons are hidden in the rendered PNG via
  `data-export-hide="true"`.
- **`DateRangeFilter`** — year-pair dropdowns; emits `[startYear, endYear]`.
- **`CityHeader`** — large city title + latest AQI + category + advice on
  the per-city page.

The map (`IndiaMap`) and dropdown (`CitySelector`) are deliberately the only
two ways to choose a city. We resisted the urge to add a "popular cities"
ribbon — choice paralysis is real, and the map already shows where
attention should go.

### Charts (per-city page)

Seven charts, in a fixed order designed to walk a reader from a coarse
trend to detailed pollutant breakdowns. Each is a Recharts component with a
shared color/theme system, mirrored verbatim from Kolkata:

1. **AQI weekly time-series** — primary trend chart, PM2.5/PM10 overlaid
2. **Monthly AQI distribution** — median (colored by category) + mean by
   calendar month
3. **Seasonal AQI** — bar chart, 4 IMD seasons
4. **PM2.5 + PM10 stacked area** — particulate breakdown, weekly
5. **CO / NO₂ / SO₂ / O₃ line chart** — non-PM pollutants
6. **Pollution fingerprint by season** — multi-pollutant grouped bars
7. **India AQI vs EU AQI** — only when EU AQI present in data

Each chart accepts a `filename` prop so PNG/CSV exports are namespaced by
city slug (`delhi-aqi-weekly.png`, `delhi-monthly-distribution.csv`).

## What we deliberately did *not* build (and why)

- **Live "current AQI" via WAQI/aqicn fetch** — license forbids redistributing
  cached data, and we don't want a per-page-load third-party fetch.
- **Source apportionment / health advisories beyond a one-liner** — domain
  modelling we don't have authority for; CPCB doesn't publish per-city
  apportionment uniformly.
- **Cross-city comparison page** — out of scope for v1; the map already
  enables visual comparison, and a side-by-side chart needs careful UX
  thinking we'll do in v0.2.
- **CSV bulk download (all cities)** — adds attack surface (huge file, bot
  bait) for marginal value; per-city CSV via ChartCard covers 95% of needs.
- **User accounts / saved views** — the static-export model would have to
  collapse, and we don't have a feature that requires identity.

## Pipeline-side decisions

### Throttle & retry budget

6 seconds between Open-Meteo requests, 4 retries with exponential backoff
starting at 30 s. Empirically this gets us to 30 cities without 429s on
fresh quota; if quota is partially used the `--missing-only` flag lets the
next run pick up where the last one stopped. The pipeline is intentionally
*idempotent on raw data*: cached `data/raw/{slug}_openmeteo.json` is reused
unless explicitly re-downloaded, so a re-run after partial failure costs
zero API budget.

### Rounding & nullity

All numeric fields are rounded to 1 decimal, with `None` (Python) →
`null` (JSON) for missing values. The transform's `_round_or_none` helper
uses `pd.isna(val)` to catch the pandas-specific `NaT` and `<NA>` types
that bare `math.isnan` misses; an early bug at this exact line cost an hour
on the first run.

### Index payload size

`index.json` is 30 entries × ~10 fields = ~9 KB. Per-city payload is ~220 KB
(1,590 daily rows × ~80 bytes). Total committed JSON is ~6.5 MB, which is
fine for Git and well under any reasonable static-host limit. If we add
hourly granularity (~24× the rows), we'll move to per-city `*.gz` or split
the payload into "trend" + "detail" slices loaded on demand.

## Open questions / future work

- **OpenAQ overlay (v1.1)** — display station observations alongside the
  modeled values where station coverage is good, with a clear visual
  distinction between modeled (line) and observed (dots).
- **Per-city methodology disclaimers** — flag hill/coastal cities on the
  per-city page with a tooltip explaining CAMS terrain limits.
- **Cross-city compare** — a `/compare?cities=delhi,kolkata,bengaluru` route
  with a single time-series chart and synced legends.
- **Embed widget** — Kolkata has `?embed=1`; the same pattern can wrap any
  per-city page for journalism/blog embeds, with attribution baked in.
- **Service worker for offline** — once the JSON footprint stabilizes, an
  offline cache for the last-viewed city is cheap and useful.

## Cross-references

- Operational guide → `CLAUDE.md`
- Per-commit log → `CHANGELOG.md`
- License & attribution → `LICENSE`, `NOTICE`, `dashboard/src/app/sources/page.tsx`
- Original plan → `C:\Users\Anindya\.claude\plans\i-want-to-build-cozy-hickey.md`

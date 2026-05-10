import PageHeader from '@/components/layout/PageHeader';
import Link from 'next/link';

export const metadata = {
  title: 'Sources & licensing',
  description: 'Authoritative, free air-quality sources used by the India AQI Dashboard, with attribution and licensing terms.',
};

export default function SourcesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Where the numbers come from"
        title="Sources & licensing"
        description="Every chart on this site traces to a free, citable source. No paid feeds, no scraped/redistributed restricted data."
        accent="cool"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Source
          name="Open-Meteo Air Quality API"
          role="Primary data — historical & current"
          url="https://open-meteo.com/en/docs/air-quality-api"
          license="CC-BY 4.0"
          notes={[
            'Hourly PM2.5, PM10, CO, NO₂, SO₂, O₃ and the European AQI for any latitude/longitude from 2022-01-01 onward.',
            'Modeled values from the Copernicus Atmosphere Monitoring Service (CAMS). Open-Meteo serves CAMS Europe (~0.1°, ~11 km) where available and CAMS Global (~0.4°, ~40 km) elsewhere; for most Indian cities expect resolution closer to the global grid.',
            'Free, no auth, no rate-limit headers — but the free tier shares per-IP quota, so the daily refresh runs server-side, not from the browser.',
          ]}
        />
        <Source
          name="CPCB National Air Quality Index"
          role="Authoritative reference"
          url="https://app.cpcbccr.com/AQI_India"
          license="Public bulletins"
          notes={[
            'Central Pollution Control Board operates the official Continuous Ambient Air Quality Monitoring Stations (CAAQMS) across India.',
            'CPCB&apos;s daily AQI bulletin is the authoritative number for any Indian city; we cite it whenever a value is in dispute.',
            'Not programmatically ingested in v1 — we use the published breakpoint tables to compute India AQI from PM concentrations consistently.',
          ]}
        />
        <Source
          name="OpenAQ v3"
          role="Planned overlay (v1.1)"
          url="https://docs.openaq.org/"
          license="Open data, station-attributed"
          notes={[
            'Aggregates real CPCB CAAQMS station observations as well as global networks. Free with an API key.',
            'Coverage varies — some smaller capitals have 0–1 stations. We will add this as an optional overlay alongside the modeled data, not a replacement.',
          ]}
        />
        <Source
          name="OpenStreetMap tiles"
          role="Map background"
          url="https://www.openstreetmap.org/copyright"
          license="ODbL — © OSM contributors"
          notes={[
            'Base map raster tiles for the India view. We do not redistribute or cache tiles; they are loaded on demand by the visitor&apos;s browser.',
          ]}
        />
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-5 text-sm text-muted">
        <h3 className="text-foreground font-semibold mb-2">What this dashboard does <em>not</em> use</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>WAQI / aqicn — the free token forbids redistribution of cached or archived data, which conflicts with our static-JSON model.</li>
          <li>IQAir, BreezoMeter and other paid feeds — out of scope for a free, open dashboard.</li>
        </ul>
        <p className="mt-3">
          Want to verify a number? Open the same date on{' '}
          <a href="https://app.cpcbccr.com/AQI_India" className="underline">CPCB AQI India</a>{' '}
          and compare. Expect divergence from station observations because the Open-Meteo feed is a
          global atmospheric model, not a local station — magnitude varies by terrain, station
          density and local emission events. We have not yet back-tested the divergence
          systematically; see <Link href="/methodology" className="underline">methodology</Link> for
          the full list of caveats.
        </p>
      </div>
    </div>
  );
}

function Source({ name, role, url, license, notes }: { name: string; role: string; url: string; license: string; notes: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted mb-1">{role}</p>
      <h3 className="font-semibold text-lg">
        <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">{name}</a>
      </h3>
      <p className="text-xs text-muted mt-1">License: {license}</p>
      <ul className="mt-3 space-y-2 text-sm text-foreground/90">
        {notes.map((n, i) => (<li key={i} dangerouslySetInnerHTML={{ __html: n }} />))}
      </ul>
    </div>
  );
}

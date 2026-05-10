import Link from 'next/link';
import PageHeader from '@/components/layout/PageHeader';
import IndiaMap from '@/components/map/IndiaMap';
import MapLegend from '@/components/map/MapLegend';
import NationalSummary from '@/components/home/NationalSummary';

export default function HomePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Free, verifiable air quality"
        title="India AQI Dashboard"
        description="Daily AQI for 30+ Indian cities. Click a marker on the map or pick a city from the dropdown to see four years of trends."
        accent="warm"
      />

      <div className="mb-3"><MapLegend /></div>
      <IndiaMap height={520} />

      <p className="text-xs text-muted mt-3">
        Tap a city marker for the full dashboard. Marker color and size reflect the most recent daily AQI.
        Map data &copy; OpenStreetMap contributors.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-4">National snapshot</h2>
        <NationalSummary />
      </section>

      <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          title="Sources & licensing"
          body="Daily AQI is computed from Copernicus CAMS-modeled fields served by Open-Meteo (free, no auth). CPCB National AQI is cited as the authoritative reference for India."
          href="/sources"
          cta="View sources →"
        />
        <Card
          title="How AQI is computed"
          body="India AQI is the worst sub-index across PM2.5 and PM10, using CPCB breakpoint tables. Seasons follow the IMD definition (Winter, Pre-Monsoon, Monsoon, Post-Monsoon)."
          href="/methodology"
          cta="Read methodology →"
        />
        <Card
          title="What you can do"
          body="Cross-compare cities, scrub through 2022-onwards trends, download charts as PNG and the underlying weekly data as CSV. No tracking, no sign-ups."
        />
      </section>
    </div>
  );
}

function Card({ title, body, href, cta }: { title: string; body: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{body}</p>
      {href && cta && (
        <Link href={href} className="text-sm mt-3 inline-block underline hover:text-foreground">
          {cta}
        </Link>
      )}
    </div>
  );
}

import PageHeader from '@/components/layout/PageHeader';
import Link from 'next/link';

export const metadata = {
  title: 'Methodology',
  description: 'How India AQI is computed from PM concentrations, season definitions, and known caveats.',
};

const PM25_BREAKPOINTS: [string, string, string][] = [
  ['0 – 30',    '0 – 50',     'Good'],
  ['31 – 60',   '51 – 100',   'Satisfactory'],
  ['61 – 90',   '101 – 200',  'Moderate'],
  ['91 – 120',  '201 – 300',  'Poor'],
  ['121 – 250', '301 – 400',  'Very Poor'],
  ['251 – 500', '401 – 500',  'Severe'],
];

const PM10_BREAKPOINTS: [string, string, string][] = [
  ['0 – 50',    '0 – 50',     'Good'],
  ['51 – 100',  '51 – 100',   'Satisfactory'],
  ['101 – 250', '101 – 200',  'Moderate'],
  ['251 – 350', '201 – 300',  'Poor'],
  ['351 – 430', '301 – 400',  'Very Poor'],
  ['431 – 600', '401 – 500',  'Severe'],
];

export default function MethodologyPage() {
  return (
    <div>
      <PageHeader
        eyebrow="The math behind the dashboard"
        title="Methodology"
        description="How AQI is computed, how seasons are defined, and what to keep in mind when interpreting the numbers."
        accent="leaf"
      />

      <Section title="India AQI">
        <p>
          The India AQI follows the Central Pollution Control Board&apos;s breakpoint tables. For each pollutant
          a sub-index is computed by linear interpolation between the breakpoint thresholds; the headline AQI
          for the day is the <strong>worst</strong> sub-index across pollutants. We currently compute the AQI from PM2.5
          and PM10 concentrations (the same approach as the original Kolkata dashboard), since these two are the
          most reliably reported by Open-Meteo&apos;s CAMS-modeled feed.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Table title="PM2.5 (24-h avg, µg/m³)" rows={PM25_BREAKPOINTS} />
          <Table title="PM10 (24-h avg, µg/m³)" rows={PM10_BREAKPOINTS} />
        </div>
        <p className="mt-4 text-sm text-muted">
          Source: CPCB National Air Quality Index — see <a className="underline" href="https://cpcb.nic.in/National-Air-Quality-Index/" target="_blank" rel="noopener noreferrer">cpcb.nic.in</a>.
          The dashboard rounds AQI to the nearest integer; the per-day modeled value is a 24-hour average over hourly inputs.
        </p>
      </Section>

      <Section title="Seasons">
        <p>The dashboard uses IMD&apos;s standard four-season classification:</p>
        <ul className="list-disc pl-6 mt-3 space-y-1 text-sm">
          <li><strong>Winter</strong> — December, January, February</li>
          <li><strong>Pre-Monsoon</strong> — March, April, May</li>
          <li><strong>Monsoon</strong> — June, July, August, September</li>
          <li><strong>Post-Monsoon</strong> — October, November</li>
        </ul>
        <p className="mt-3 text-sm">
          For Indian cities the monsoon is usually the cleanest period (rain washes out particulates) and
          post-monsoon to mid-winter the worst (low boundary layer + crop-residue burning + festival emissions).
        </p>
      </Section>

      <Section title="Refresh cadence">
        <p>
          A daily GitHub Actions cron job at 02:00 IST re-runs the pipeline for every city in the registry,
          downloads fresh hourly data from Open-Meteo, recomputes the dashboard JSON and commits the diff.
          The frontend is a fully static export — your browser only ever fetches JSON from the same origin,
          never a third-party API.
        </p>
      </Section>

      <Section title="Caveats">
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>
            <strong>Modeled, not observed.</strong> Open-Meteo serves Copernicus CAMS — a global model on a
            ~11 km grid. Hill cities (Shimla, Srinagar, Dehradun, Guwahati) and coastal cities can diverge
            from station readings; treat the trend as more reliable than the absolute value for those.
          </li>
          <li>
            <strong>Single-source today.</strong> v1 reports Open-Meteo only. A future v1.1 will overlay CPCB
            CAAQMS station observations from OpenAQ where station coverage is good.
          </li>
          <li>
            <strong>Free-tier rate limits.</strong> The download script throttles requests and retries on 429s;
            occasionally a daily refresh may skip a city, in which case yesterday&apos;s payload is reused.
          </li>
        </ul>
      </Section>

      <p className="text-xs text-muted mt-10">
        See <Link href="/sources" className="underline">sources</Link> for licensing and citations.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="text-sm text-foreground/90 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function Table({ title, rows }: { title: string; rows: [string, string, string][] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-2 text-sm font-medium border-b border-border">{title}</div>
      <table className="w-full text-sm">
        <thead className="text-xs text-muted">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Concentration</th>
            <th className="text-left px-4 py-2 font-medium">AQI sub-index</th>
            <th className="text-left px-4 py-2 font-medium">Category</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([conc, idx, cat], i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-4 py-2 tabular-nums">{conc}</td>
              <td className="px-4 py-2 tabular-nums">{idx}</td>
              <td className="px-4 py-2">{cat}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

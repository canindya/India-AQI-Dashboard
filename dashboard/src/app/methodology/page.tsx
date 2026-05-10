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

      <Section title="What this AQI is — and isn't">
        <p className="rounded-lg border border-[var(--color-accent-warm)]/40 bg-card p-4 text-foreground/90">
          The number we display is a <strong>4-of-8 composite AQI</strong>: the worst sub-index across
          PM2.5, PM10, NO₂ and O₃ (8-hour max), computed with CPCB&apos;s official breakpoint tables and
          its <strong>≥ 16 valid hours per day</strong> rule. It is close to — but not identical to —
          the number CPCB would publish for the same day, because:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-1 text-sm">
          <li>
            The <strong>official India AQI uses 8 pollutants</strong> (PM2.5, PM10, NO₂, O₃, CO, SO₂, NH₃, Pb).
            We use 4. <strong>NH₃ and Pb</strong> are not served by Open-Meteo; <strong>CO and SO₂</strong> we deliberately exclude
            because CAMS Global&apos;s accuracy for boundary-layer gaseous species is questionable and
            including them risks pushing AQI in the wrong direction.
          </li>
          <li>
            Open-Meteo provides <strong>modeled</strong> CAMS values, not station observations. The point
            estimate at a city centroid is not what a CAAQMS station measures.
          </li>
        </ul>
        <p className="mt-3 text-sm">
          Read it as a <em>4-of-8 CPCB-style AQI</em> — close enough for trends and comparisons across
          cities and seasons, not a substitute for the official daily bulletin at{' '}
          <a className="underline" href="https://app.cpcbccr.com/AQI_India" target="_blank" rel="noopener noreferrer">app.cpcbccr.com</a>.
        </p>
      </Section>

      <Section title="How the AQI is computed">
        <p>
          For each pollutant a sub-index is computed by linear interpolation between CPCB&apos;s breakpoint
          thresholds; the composite AQI for the day is the <strong>worst</strong> sub-index across pollutants,
          provided at least 3 sub-indices are available <em>and</em> at least one is PM2.5 or PM10 (CPCB&apos;s
          minimum-pollutant rule). Daily aggregates of PM2.5, PM10 and NO₂ are 24-hour means; for O₃ we
          compute the maximum of all 8-hour rolling means ending in the day, as CPCB specifies. Each
          daily aggregate requires at least 16 valid hourly values; otherwise the sub-index for that
          pollutant is null.
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
            <strong>Modeled, not observed.</strong> Open-Meteo serves Copernicus CAMS. Resolution is
            CAMS Europe (~0.1°, ~11 km) where available; <strong>for most Indian cities the served
            product is CAMS Global (~0.4°, ~40 km)</strong>. Hill cities (Shimla, Srinagar, Dehradun,
            Guwahati) and coastal cities can diverge meaningfully from station readings; treat the
            trend as more reliable than the absolute value for those.
          </li>
          <li>
            <strong>4 of CPCB&apos;s 8 pollutants.</strong> NH₃ and Pb are unavailable from Open-Meteo;
            CO and SO₂ are excluded because CAMS Global accuracy for those species is poor (e.g.,
            modeled CO is typically &lt; 1 mg/m³ in our payloads, whereas Indian winter CO from
            stations is often 4–8 mg/m³). On days when one of these would dominate the official
            AQI, our number under-reports.
          </li>
          <li>
            <strong>Single-source today.</strong> v1 reports Open-Meteo only. A future overlay will
            blend CPCB CAAQMS station observations from OpenAQ where station coverage is good.
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

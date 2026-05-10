import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-12">
      <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted flex flex-col md:flex-row gap-2 md:gap-4 md:items-center md:justify-between">
        <p>
          Air-quality data{' '}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Open-Meteo
          </a>{' '}
          (CC-BY 4.0, modeled from Copernicus CAMS). Authoritative reference:{' '}
          <a
            href="https://app.cpcbccr.com/AQI_India"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            CPCB National AQI
          </a>
          .
        </p>
        <p className="flex gap-3">
          <Link href="/sources" className="hover:text-foreground">Sources</Link>
          <Link href="/methodology" className="hover:text-foreground">Methodology</Link>
        </p>
      </div>
    </footer>
  );
}

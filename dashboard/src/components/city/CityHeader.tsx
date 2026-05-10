import { getAQIColor, getAQILabel, getAQIAdvice } from '@/lib/colors';

interface CityHeaderProps {
  name: string;
  state: string;
  lat: number;
  lon: number;
  latestAqi: number | null;
  latestDate: string | null;
  populationBand?: string;
}

export default function CityHeader({
  name, state, lat, lon, latestAqi, latestDate, populationBand,
}: CityHeaderProps) {
  const color = getAQIColor(latestAqi);
  const label = getAQILabel(latestAqi);
  const advice = getAQIAdvice(latestAqi);

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted">Air quality dashboard</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1">{name}</h1>
          <p className="text-sm text-muted mt-1">
            {state} · {lat.toFixed(3)}°N, {lon.toFixed(3)}°E
            {populationBand ? ` · ${populationBand.replace('-', ' ')}` : ''}
          </p>
        </div>
        <div className="flex items-end gap-4">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted">Latest AQI</p>
            <p className="text-3xl sm:text-4xl font-bold" style={{ color }}>
              {latestAqi ?? '—'}
            </p>
            <p className="text-xs text-muted">{latestDate ?? 'no data'}</p>
          </div>
          <div className="hidden sm:block w-1 h-14 rounded" style={{ backgroundColor: color }} aria-hidden />
          <div className="max-w-xs">
            <p className="text-sm font-semibold" style={{ color }}>{label}</p>
            <p className="text-xs text-muted mt-1 leading-snug">{advice}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

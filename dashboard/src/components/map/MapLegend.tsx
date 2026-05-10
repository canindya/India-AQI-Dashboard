import { COLORS } from '@/lib/colors';

const BUCKETS = [
  { label: 'Good', range: '0–50', color: COLORS.aqi.good },
  { label: 'Satisfactory', range: '51–100', color: COLORS.aqi.satisfactory },
  { label: 'Moderate', range: '101–200', color: COLORS.aqi.moderate },
  { label: 'Poor', range: '201–300', color: COLORS.aqi.poor },
  { label: 'Very Poor', range: '301–400', color: COLORS.aqi.veryPoor },
  { label: 'Severe', range: '401+', color: COLORS.aqi.severe },
];

export default function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
      <span className="font-medium">India AQI:</span>
      {BUCKETS.map(b => (
        <span key={b.label} className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
          <span className="text-foreground/90">{b.label}</span>
          <span className="text-muted/70">{b.range}</span>
        </span>
      ))}
    </div>
  );
}

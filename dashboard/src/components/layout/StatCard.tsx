interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string; // CSS color or AQI bucket color
  tooltip?: string;
}

export default function StatCard({ label, value, subtitle, color, tooltip }: StatCardProps) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-3 sm:p-4 hover:bg-card-hover transition-colors"
      title={tooltip}
    >
      <p className="text-xs sm:text-sm text-muted">{label}</p>
      <p
        className="text-lg sm:text-xl md:text-2xl font-bold break-words"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
    </div>
  );
}

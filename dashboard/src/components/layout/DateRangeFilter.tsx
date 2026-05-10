'use client';
import { useState } from 'react';

interface DateRangeFilterProps {
  minYear: number;
  maxYear: number;
  onChange: (range: [number, number]) => void;
  className?: string;
}

export default function DateRangeFilter({ minYear, maxYear, onChange, className = '' }: DateRangeFilterProps) {
  const [startYear, setStartYear] = useState(minYear);
  const [endYear, setEndYear] = useState(maxYear);

  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);

  const setStart = (v: number) => {
    const c = Math.min(v, endYear);
    setStartYear(c);
    onChange([c, endYear]);
  };
  const setEnd = (v: number) => {
    const c = Math.max(v, startYear);
    setEndYear(c);
    onChange([startYear, c]);
  };
  const reset = () => {
    setStartYear(minYear);
    setEndYear(maxYear);
    onChange([minYear, maxYear]);
  };
  const isFiltered = startYear !== minYear || endYear !== maxYear;

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-wrap rounded-lg border border-border bg-card px-4 py-2 text-sm mb-6 ${className}`}>
      <span className="text-muted font-medium">Filter by year:</span>
      <select
        value={startYear}
        onChange={(e) => setStart(Number(e.target.value))}
        className="w-full sm:w-auto rounded border border-border bg-card py-2 px-3 sm:py-1 sm:px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-warm)]"
      >
        {years.map((y) => (
          <option key={y} value={y} disabled={y > endYear}>{y}</option>
        ))}
      </select>
      <span className="text-muted">to</span>
      <select
        value={endYear}
        onChange={(e) => setEnd(Number(e.target.value))}
        className="w-full sm:w-auto rounded border border-border bg-card py-2 px-3 sm:py-1 sm:px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-warm)]"
      >
        {years.map((y) => (
          <option key={y} value={y} disabled={y < startYear}>{y}</option>
        ))}
      </select>
      {isFiltered && (
        <button onClick={reset} className="text-xs text-muted hover:text-foreground underline underline-offset-2 ml-1">
          Reset
        </button>
      )}
    </div>
  );
}

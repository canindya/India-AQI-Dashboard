'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadCityIndex } from '@/lib/data';
import type { CityIndexEntry } from '@/lib/types';
import { getAQIColor, getAQILabel } from '@/lib/colors';
import StatCard from '@/components/layout/StatCard';

export default function NationalSummary() {
  const [cities, setCities] = useState<CityIndexEntry[] | null>(null);

  useEffect(() => {
    loadCityIndex().then(idx => setCities(idx.cities)).catch(() => setCities([]));
  }, []);

  if (!cities) return null;
  const ranked = cities.filter(c => c.current_aqi != null);
  if (!ranked.length) {
    return <p className="text-sm text-muted">No current AQI data available yet.</p>;
  }

  const avg = Math.round(ranked.reduce((s, c) => s + (c.current_aqi ?? 0), 0) / ranked.length);
  const goodCount = ranked.filter(c => (c.current_aqi ?? 999) <= 50).length;
  const sorted = [...ranked].sort((a, b) => (b.current_aqi ?? 0) - (a.current_aqi ?? 0));
  const worst = sorted.slice(0, 3);
  const best = sorted.slice(-3).reverse();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="grid grid-cols-2 gap-3 md:col-span-1">
        <StatCard label="Cities tracked" value={ranked.length} />
        <StatCard label="National avg AQI" value={avg} subtitle={getAQILabel(avg)} color={getAQIColor(avg)} />
        <StatCard label="Good-air cities" value={goodCount} subtitle="AQI ≤ 50 today" color="#4CAF50" />
        <StatCard label="Updated" value={ranked[0]?.updated.slice(5) ?? '—'} subtitle={ranked[0]?.updated.slice(0, 4) ?? ''} />
      </div>

      <RankList title="Worst AQI today" rows={worst} accent="warm" />
      <RankList title="Best AQI today" rows={best} accent="cool" />
    </div>
  );
}

function RankList({ title, rows, accent }: { title: string; rows: CityIndexEntry[]; accent: 'warm' | 'cool' }) {
  const borderClass = accent === 'warm'
    ? 'border-l-[var(--color-accent-warm)]'
    : 'border-l-[var(--color-accent-leaf)]';
  return (
    <div className={`rounded-xl border border-border bg-card p-4 border-l-4 ${borderClass}`}>
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <ul className="space-y-2">
        {rows.map(c => (
          <li key={c.slug}>
            <Link href={`/city/${c.slug}`} className="flex items-center justify-between gap-2 text-sm hover:bg-card-hover rounded px-2 py-1 -mx-2 transition-colors">
              <span className="flex items-center gap-2 min-w-0">
                <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getAQIColor(c.current_aqi) }} />
                <span className="truncate">{c.name}</span>
                <span className="text-muted text-xs truncate">{c.state}</span>
              </span>
              <span className="font-semibold tabular-nums" style={{ color: getAQIColor(c.current_aqi) }}>
                {c.current_aqi ?? '—'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

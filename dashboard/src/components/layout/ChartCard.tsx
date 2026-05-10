'use client';

import { useRef, useState } from 'react';
import { downloadChartPng } from '@/lib/png';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  data?: Record<string, unknown>[];
  filename?: string;
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(','),
    ...data.map(r =>
      headers
        .map(h => {
          const v = r[h];
          if (v === null || v === undefined) return '';
          const s = String(v);
          return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(',')
    ),
  ];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function ChartCard({
  title,
  subtitle,
  badge,
  children,
  className = '',
  data,
  filename,
}: ChartCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busyPng, setBusyPng] = useState(false);
  const safeName = filename || `aqi-${slugify(title)}`;

  const handlePng = async () => {
    if (!cardRef.current || busyPng) return;
    setBusyPng(true);
    try {
      await downloadChartPng(cardRef.current, safeName);
    } finally {
      setBusyPng(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`rounded-xl border border-border bg-card p-4 sm:p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-semibold mb-1">{title}</h3>
          {badge && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border text-muted whitespace-nowrap">
              {badge}
            </span>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1" data-export-hide="true">
          <button
            onClick={handlePng}
            disabled={busyPng}
            className="text-xs text-muted hover:text-foreground border border-border rounded px-2 py-0.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            title="Download chart as PNG"
          >
            PNG
          </button>
          {data && data.length > 0 && (
            <button
              onClick={() => downloadCSV(data, safeName)}
              className="text-xs text-muted hover:text-foreground border border-border rounded px-2 py-0.5 transition-colors cursor-pointer"
              title="Download data as CSV"
            >
              CSV
            </button>
          )}
        </div>
      </div>
      {subtitle ? (
        <p className="text-sm text-muted mb-4">{subtitle}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </div>
  );
}

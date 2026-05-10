'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { loadCity } from '@/lib/data';
import type { AQIData, AQIDaily } from '@/lib/types';
import type { City } from '@/lib/cities';
import StatCard from '@/components/layout/StatCard';
import ChartCard from '@/components/layout/ChartCard';
import DateRangeFilter from '@/components/layout/DateRangeFilter';
import CityHeader from '@/components/city/CityHeader';
import { COLORS, getAQIColor, getAQILabel } from '@/lib/colors';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, ComposedChart,
} from 'recharts';

interface Props {
  slug: string;
  city: City;
}

export default function CityClient({ slug, city }: Props) {
  const [aqi, setAqi] = useState<AQIData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const [yearRange, setYearRange] = useState<[number, number]>([2022, currentYear]);

  useEffect(() => {
    loadCity(slug)
      .then(setAqi)
      .catch(e => setError(e.message ?? 'Failed to load data'));
  }, [slug]);

  const filteredDaily = useMemo<AQIDaily[]>(() => {
    if (!aqi) return [];
    return aqi.daily.filter(d => {
      const y = parseInt(d.date.slice(0, 4), 10);
      return y >= yearRange[0] && y <= yearRange[1];
    });
  }, [aqi, yearRange]);

  if (error) {
    return (
      <div className="text-center py-20 text-muted">
        Failed to load data for {city.name}: {error}
        <div className="mt-4 text-xs">
          <Link href="/" className="underline">Back to map</Link>
        </div>
      </div>
    );
  }

  if (!aqi) return <div className="text-center py-20 text-muted">Loading {city.name}…</div>;

  const validDaily = filteredDaily.filter(d => d.aqi != null);
  const lastDaily = aqi.daily.slice().reverse().find(d => d.aqi != null) ?? null;

  const avgAqi = validDaily.length
    ? Math.round(validDaily.reduce((s, d) => s + (d.aqi ?? 0), 0) / validDaily.length)
    : 0;
  const maxAqi = validDaily.length ? Math.max(...validDaily.map(d => d.aqi ?? 0)) : 0;
  const goodDays = validDaily.filter(d => (d.aqi ?? 999) <= 50).length;
  const goodPct = validDaily.length ? Math.round((goodDays / validDaily.length) * 100) : 0;

  // Weekly downsample for the time-series chart
  const weeklyData: {
    date: string; aqi: number; pm25: number; pm10: number;
    co: number | null; no2: number | null; so2: number | null; o3: number | null;
    eu_aqi: number | null;
  }[] = [];
  for (let i = 0; i < validDaily.length; i += 7) {
    const week = validDaily.slice(i, i + 7);
    const mean = (vals: (number | null | undefined)[], r = 0) => {
      const ok = vals.filter((v): v is number => v != null);
      if (!ok.length) return null;
      return Math.round((ok.reduce((s, v) => s + v, 0) / ok.length) * 10 ** r) / 10 ** r;
    };
    weeklyData.push({
      date: week[0].date.slice(0, 7),
      aqi: Math.round(week.reduce((s, d) => s + (d.aqi ?? 0), 0) / week.length),
      pm25: Math.round(week.reduce((s, d) => s + (d.pm25 ?? 0), 0) / week.length),
      pm10: Math.round(week.reduce((s, d) => s + (d.pm10 ?? 0), 0) / week.length),
      co: mean(week.map(d => d.co), 1),
      no2: mean(week.map(d => d.no2), 1),
      so2: mean(week.map(d => d.so2), 1),
      o3: mean(week.map(d => d.o3), 1),
      eu_aqi: mean(week.map(d => d.eu_aqi), 0),
    });
  }

  // Seasonal AQI bar chart
  const seasonOrder = ['Winter', 'Pre-Monsoon', 'Monsoon', 'Post-Monsoon'];
  const seasonalData = aqi.seasonal.filter(s => s.year >= yearRange[0] && s.year <= yearRange[1]);
  const seasonAvg: Record<string, number> = {};
  for (const season of seasonOrder) {
    const entries = seasonalData.filter(s => s.season === season && s.aqi_mean != null);
    if (entries.length > 0) {
      seasonAvg[season] = Math.round(entries.reduce((s, e) => s + (e.aqi_mean ?? 0), 0) / entries.length);
    }
  }
  const seasonalAqiData = seasonOrder.map(s => ({ season: s, aqi: seasonAvg[s] ?? 0 }));

  // Pollutant fingerprint by season
  const seasonMonths: Record<string, number[]> = {
    Winter: [12, 1, 2],
    'Pre-Monsoon': [3, 4, 5],
    Monsoon: [6, 7, 8, 9],
    'Post-Monsoon': [10, 11],
  };
  const pollutantSeasonData = Object.entries(seasonMonths).map(([season, months]) => {
    const records = validDaily.filter(d => months.includes(new Date(d.date).getMonth() + 1));
    const avg = (key: keyof AQIDaily) => {
      const vals = records.filter(r => r[key] != null).map(r => r[key] as number);
      return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
    };
    return { season, pm25: avg('pm25'), pm10: avg('pm10'), no2: avg('no2'), so2: avg('so2') };
  });

  const hasEuAqi = weeklyData.some(d => d.eu_aqi != null);
  const euAqiWeekly = weeklyData.filter(d => d.aqi != null && d.eu_aqi != null);

  const boxPlotData = aqi.box_plot_by_month;

  return (
    <div>
      <CityHeader
        name={city.name}
        state={city.state}
        lat={city.lat}
        lon={city.lon}
        latestAqi={lastDaily?.aqi ?? null}
        latestDate={lastDaily?.date ?? null}
        populationBand={city.populationBand}
      />

      <DateRangeFilter minYear={2022} maxYear={currentYear} onChange={setYearRange} />

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Average AQI" value={avgAqi} subtitle={getAQILabel(avgAqi)} color={getAQIColor(avgAqi)} />
        <StatCard label="Peak AQI" value={maxAqi} subtitle="Worst single day" color={getAQIColor(maxAqi)} />
        <StatCard label="Good-air days" value={`${goodPct}%`} subtitle={`${goodDays} of ${validDaily.length} days`} color={COLORS.aqi.good} />
        <StatCard label="Days observed" value={validDaily.length} subtitle="Filtered range" />
      </div>
      <p className="text-xs text-muted mb-6">
        India AQI scale (CPCB): 0–50 Good, 51–100 Satisfactory, 101–200 Moderate, 201–300 Poor, 301–400 Very Poor, 401–500 Severe.
      </p>

      {/* AQI weekly time series */}
      <ChartCard
        data={weeklyData as unknown as Record<string, unknown>[]}
        filename={`${slug}-aqi-weekly`}
        title="AQI over time (weekly average)"
        subtitle={`PM2.5 and PM10 alongside India AQI · ${aqi.date_range.start} to ${aqi.date_range.end}`}
      >
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} interval={Math.max(1, Math.floor(weeklyData.length / 12))} />
            <YAxis domain={[0, 'auto']} label={{ value: 'AQI', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey={() => 50} stroke="none" fill={COLORS.aqi.good} fillOpacity={0.08} name="Good (≤50)" />
            <Line type="monotone" dataKey="aqi" stroke={COLORS.accentWarm} strokeWidth={2} dot={false} name="AQI" />
            <Line type="monotone" dataKey="pm25" stroke={COLORS.accent} strokeWidth={1} dot={false} name="PM2.5" />
            <Line type="monotone" dataKey="pm10" stroke={COLORS.accentSun} strokeWidth={1} dot={false} name="PM10" />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Monthly AQI distribution (median + mean by month) */}
        <ChartCard
          data={boxPlotData as unknown as Record<string, unknown>[]}
          filename={`${slug}-monthly-distribution`}
          title="Monthly AQI distribution"
          subtitle={`Median (colored by category) and mean by calendar month, ${aqi.date_range.start.slice(0, 4)}–${aqi.date_range.end.slice(0, 4)}`}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={boxPlotData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month_name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} interval={0} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="median" name="Median AQI" fill={COLORS.accentWarm}>
                {boxPlotData.map((entry, i) => (
                  <Cell key={i} fill={getAQIColor(entry.median)} />
                ))}
              </Bar>
              <Bar dataKey="mean" name="Mean AQI" fill={COLORS.accent} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Seasonal AQI */}
        <ChartCard
          data={seasonalAqiData as unknown as Record<string, unknown>[]}
          filename={`${slug}-seasonal`}
          title="Seasonal AQI"
          subtitle="Average across years in the selected range — monsoon usually scrubs the air"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={seasonalAqiData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="season" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={45} interval={0} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="aqi" name="Avg AQI">
                {seasonOrder.map((s, i) => (
                  <Cell key={i} fill={getAQIColor(seasonAvg[s] ?? 0)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* PM stacked area */}
      <div className="mt-6">
        <ChartCard
          data={weeklyData as unknown as Record<string, unknown>[]}
          filename={`${slug}-pm-breakdown`}
          title="PM2.5 vs PM10 (weekly)"
          subtitle="Stacked particulate concentrations in µg/m³"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} interval={Math.max(1, Math.floor(weeklyData.length / 12))} />
              <YAxis label={{ value: 'µg/m³', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="pm25" stackId="1" stroke={COLORS.chart[0]} fill={COLORS.chart[0]} fillOpacity={0.4} name="PM2.5" />
              <Area type="monotone" dataKey="pm10" stackId="1" stroke={COLORS.chart[1]} fill={COLORS.chart[1]} fillOpacity={0.4} name="PM10" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Beyond PM */}
      <div className="mt-6">
        <ChartCard
          data={weeklyData as unknown as Record<string, unknown>[]}
          filename={`${slug}-beyond-pm`}
          title="Beyond PM: CO, NO₂, SO₂, O₃"
          subtitle="Other pollutants weekly (µg/m³)"
        >
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} interval={Math.max(1, Math.floor(weeklyData.length / 12))} />
              <YAxis label={{ value: 'µg/m³', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="co" stroke={COLORS.chart[2]} strokeWidth={2} dot={false} name="CO" connectNulls />
              <Line type="monotone" dataKey="no2" stroke={COLORS.chart[3]} strokeWidth={2} dot={false} name="NO₂" connectNulls />
              <Line type="monotone" dataKey="so2" stroke={COLORS.chart[4]} strokeWidth={2} dot={false} name="SO₂" connectNulls />
              <Line type="monotone" dataKey="o3" stroke={COLORS.chart[5]} strokeWidth={2} dot={false} name="O₃" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className={`grid grid-cols-1 ${hasEuAqi ? 'lg:grid-cols-2' : ''} gap-6 mt-6`}>
        <ChartCard
          data={pollutantSeasonData as unknown as Record<string, unknown>[]}
          filename={`${slug}-fingerprint`}
          title="Pollution fingerprint by season"
          subtitle="Average concentration of each pollutant per season"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pollutantSeasonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="season" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={45} interval={0} />
              <YAxis label={{ value: 'µg/m³', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="pm25" name="PM2.5" fill={COLORS.chart[0]} />
              <Bar dataKey="pm10" name="PM10" fill={COLORS.chart[1]} />
              <Bar dataKey="no2" name="NO₂" fill={COLORS.chart[3]} />
              <Bar dataKey="so2" name="SO₂" fill={COLORS.chart[4]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {hasEuAqi && (
          <ChartCard
            data={euAqiWeekly as unknown as Record<string, unknown>[]}
            filename={`${slug}-india-vs-eu`}
            title="India AQI vs EU AQI"
            subtitle="Two scales side-by-side — India AQI is more strict for PM"
          >
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={euAqiWeekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} interval={Math.max(1, Math.floor(euAqiWeekly.length / 10))} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="aqi" stroke={COLORS.chart[0]} strokeWidth={2} dot={false} name="India AQI" />
                <Line type="monotone" dataKey="eu_aqi" stroke={COLORS.chart[2]} strokeWidth={2} dot={false} name="EU AQI" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      <p className="text-xs text-muted mt-8">
        Data: <a href={aqi.source.url} className="underline" target="_blank" rel="noopener noreferrer">{aqi.source.name}</a>
        {' '}({aqi.source.license}). Pipeline last refreshed {aqi.source.updated.slice(0, 10)}.{' '}
        <Link href="/methodology" className="underline">How AQI is computed</Link>.
      </p>
    </div>
  );
}

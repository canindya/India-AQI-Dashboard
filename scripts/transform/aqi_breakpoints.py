"""India AQI computation + monthly/seasonal/box-plot aggregation.

The compute_india_aqi function and the aggregation shape match
City_Kolkata/scripts/transform/environment_transform.py exactly so the
JSON consumed by the dashboard is byte-compatible.

Reference for India AQI: CPCB National Air Quality Index (cpcb.nic.in).
"""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


def compute_india_aqi(pm25: float | None, pm10: float | None) -> int | None:
    """India AQI from PM2.5 and PM10 (CPCB simplified breakpoints)."""

    def aqi_pm25(c):
        if c is None or (isinstance(c, float) and np.isnan(c)):
            return None
        breakpoints = [(0, 30, 0, 50), (31, 60, 51, 100), (61, 90, 101, 200),
                       (91, 120, 201, 300), (121, 250, 301, 400), (251, 500, 401, 500)]
        for bl, bh, il, ih in breakpoints:
            if c <= bh:
                return round(((ih - il) / (bh - bl)) * (c - bl) + il)
        return 500

    def aqi_pm10(c):
        if c is None or (isinstance(c, float) and np.isnan(c)):
            return None
        breakpoints = [(0, 50, 0, 50), (51, 100, 51, 100), (101, 250, 101, 200),
                       (251, 350, 201, 300), (351, 430, 301, 400), (431, 600, 401, 500)]
        for bl, bh, il, ih in breakpoints:
            if c <= bh:
                return round(((ih - il) / (bh - bl)) * (c - bl) + il)
        return 500

    a1, a2 = aqi_pm25(pm25), aqi_pm10(pm10)
    if a1 is not None and a2 is not None:
        return max(a1, a2)
    return a1 or a2


def get_season(month: int) -> str:
    if month in (12, 1, 2): return 'Winter'
    if month in (3, 4, 5): return 'Pre-Monsoon'
    if month in (6, 7, 8, 9): return 'Monsoon'
    return 'Post-Monsoon'


def _round_or_none(val: Any, ndigits: int = 1) -> float | None:
    if val is None:
        return None
    try:
        if pd.isna(val):
            return None
    except (TypeError, ValueError):
        pass
    try:
        return round(float(val), ndigits)
    except (TypeError, ValueError):
        return None


def build_city_payload(raw: dict, city: dict) -> dict:
    """Transform an Open-Meteo raw response into the dashboard JSON shape."""
    hourly = raw['hourly']
    df = pd.DataFrame({
        'time': pd.to_datetime(hourly['time']),
        'pm25': hourly['pm2_5'],
        'pm10': hourly['pm10'],
        'co': hourly['carbon_monoxide'],
        'no2': hourly['nitrogen_dioxide'],
        'so2': hourly['sulphur_dioxide'],
        'o3': hourly['ozone'],
        'eu_aqi': hourly['european_aqi'],
    })
    df['date'] = df['time'].dt.date

    daily = df.groupby('date').agg(
        pm25=('pm25', 'mean'),
        pm10=('pm10', 'mean'),
        co=('co', 'mean'),
        no2=('no2', 'mean'),
        so2=('so2', 'mean'),
        o3=('o3', 'mean'),
        eu_aqi=('eu_aqi', 'mean'),
    ).reset_index()
    daily['aqi'] = daily.apply(lambda r: compute_india_aqi(r['pm25'], r['pm10']), axis=1)

    daily_records = []
    for _, row in daily.iterrows():
        rec = {'date': str(row['date'])}
        for col in ['pm25', 'pm10', 'co', 'no2', 'so2', 'o3', 'eu_aqi', 'aqi']:
            rec[col] = _round_or_none(row[col], 1)
        daily_records.append(rec)

    daily['month'] = pd.to_datetime(daily['date']).dt.to_period('M')
    monthly = daily.groupby('month').agg(
        aqi_mean=('aqi', 'mean'),
        aqi_median=('aqi', 'median'),
        aqi_max=('aqi', 'max'),
        aqi_min=('aqi', 'min'),
        pm25_mean=('pm25', 'mean'),
        pm10_mean=('pm10', 'mean'),
    ).reset_index()
    monthly_records = [
        {
            'month': str(row['month']),
            **{col: _round_or_none(row[col], 1)
               for col in ['aqi_mean', 'aqi_median', 'aqi_max', 'aqi_min', 'pm25_mean', 'pm10_mean']},
        }
        for _, row in monthly.iterrows()
    ]

    daily_df = pd.DataFrame(daily_records)
    daily_df['date_dt'] = pd.to_datetime(daily_df['date'])
    daily_df['month_num'] = daily_df['date_dt'].dt.month
    daily_df['year'] = daily_df['date_dt'].dt.year
    daily_df['season'] = daily_df['month_num'].apply(get_season)

    seasonal = daily_df.groupby(['year', 'season']).agg(
        aqi_mean=('aqi', 'mean'),
        pm25_mean=('pm25', 'mean'),
    ).reset_index()
    seasonal_records = [
        {
            'year': int(row['year']),
            'season': row['season'],
            'aqi_mean': _round_or_none(row['aqi_mean'], 1),
            'pm25_mean': _round_or_none(row['pm25_mean'], 1),
        }
        for _, row in seasonal.iterrows()
    ]

    box_plot_data = []
    for month_num in range(1, 13):
        s = daily_df[daily_df['month_num'] == month_num]['aqi'].dropna()
        if len(s) > 0:
            box_plot_data.append({
                'month': month_num,
                'month_name': MONTH_NAMES[month_num - 1],
                'min': round(float(s.min()), 1),
                'q1': round(float(s.quantile(0.25)), 1),
                'median': round(float(s.median()), 1),
                'q3': round(float(s.quantile(0.75)), 1),
                'max': round(float(s.max()), 1),
                'mean': round(float(s.mean()), 1),
            })

    from datetime import datetime, timezone
    return {
        'city': {
            'slug': city['slug'],
            'name': city['name'],
            'state': city['state'],
            'lat': city['lat'],
            'lon': city['lon'],
        },
        'daily': daily_records,
        'monthly': monthly_records,
        'seasonal': seasonal_records,
        'box_plot_by_month': box_plot_data,
        'date_range': {
            'start': daily_records[0]['date'] if daily_records else None,
            'end': daily_records[-1]['date'] if daily_records else None,
        },
        'source': {
            'name': 'Open-Meteo Air Quality API (Copernicus CAMS)',
            'url': 'https://open-meteo.com/en/docs/air-quality-api',
            'license': 'CC-BY 4.0',
            'updated': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        },
    }

"""India AQI computation + monthly/seasonal/box-plot aggregation.

Implements CPCB's composite AQI from four of the eight official pollutants:
PM2.5, PM10, NO₂, O₃. CO and SO₂ are intentionally excluded — CAMS Global's
boundary-layer accuracy for those species is questionable, and including them
risks pushing the AQI in the wrong direction. NH₃ and Pb are not served by
Open-Meteo.

CPCB rules implemented:
  * Sub-index per pollutant via linear interpolation between the official
    breakpoint thresholds.
  * Composite AQI = MAX(sub-indices), with the constraint that at least 3
    sub-indices are available *and* one of them is PM2.5 or PM10. Otherwise
    the daily AQI is `null`.
  * Daily aggregation: PM2.5, PM10, NO₂ as 24-hour means; O₃ as the maximum
    of the 8-hour rolling means ending in the day. Each daily aggregate
    requires ≥ 16 valid hourly values; otherwise it's `null`.

Reference: CPCB *About National Air Quality Index* (cpcb.nic.in, 2014).
The sub-index breakpoints below are reproduced from that document.
"""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

MIN_VALID_HOURS = 16  # CPCB's daily-data sufficiency threshold

# CPCB breakpoint tables — (concentration_low, concentration_high, sub_index_low, sub_index_high).
# Concentrations are in µg/m³ unless noted. Source: CPCB "About AQI" (2014).
PM25_BP = [(0,30,0,50),(31,60,51,100),(61,90,101,200),(91,120,201,300),(121,250,301,400),(251,500,401,500)]   # 24-h
PM10_BP = [(0,50,0,50),(51,100,51,100),(101,250,101,200),(251,350,201,300),(351,430,301,400),(431,600,401,500)]  # 24-h
NO2_BP  = [(0,40,0,50),(41,80,51,100),(81,180,101,200),(181,280,201,300),(281,400,301,400),(401,800,401,500)]   # 24-h
O3_BP   = [(0,50,0,50),(51,100,51,100),(101,168,101,200),(169,208,201,300),(209,748,301,400),(749,1000,401,500)]  # 8-h max


def _aqi_subindex(c: float | None, breakpoints: list[tuple[int, int, int, int]]) -> int | None:
    """Linear interpolation between CPCB breakpoints."""
    if c is None or (isinstance(c, float) and np.isnan(c)):
        return None
    if c < 0:
        return None
    for bl, bh, il, ih in breakpoints:
        if c <= bh:
            return round(((ih - il) / (bh - bl)) * (c - bl) + il)
    return 500


def aqi_pm25(c): return _aqi_subindex(c, PM25_BP)
def aqi_pm10(c): return _aqi_subindex(c, PM10_BP)
def aqi_no2(c):  return _aqi_subindex(c, NO2_BP)
def aqi_o3(c):   return _aqi_subindex(c, O3_BP)


def compute_india_aqi(pm25, pm10, no2=None, o3_8h_max=None) -> int | None:
    """Composite India AQI from the four sub-indices we compute.

    Per CPCB: ≥ 3 sub-indices required, and at least one must be PM. Otherwise None.
    """
    subs: list[tuple[int, bool]] = []  # (sub_index_value, is_pm)
    if pm25 is not None:
        s = aqi_pm25(pm25)
        if s is not None: subs.append((s, True))
    if pm10 is not None:
        s = aqi_pm10(pm10)
        if s is not None: subs.append((s, True))
    if no2 is not None:
        s = aqi_no2(no2)
        if s is not None: subs.append((s, False))
    if o3_8h_max is not None:
        s = aqi_o3(o3_8h_max)
        if s is not None: subs.append((s, False))

    has_pm = any(is_pm for _, is_pm in subs)
    if not has_pm or len(subs) < 3:
        return None
    return max(s for s, _ in subs)


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


def _daily_mean_with_min(series: pd.Series, dates: pd.Series, min_count: int = MIN_VALID_HOURS) -> pd.Series:
    """24-hour mean per date, but only when ≥ min_count valid hours are present."""
    grp = series.groupby(dates)
    means = grp.mean()
    counts = grp.count()
    return means.where(counts >= min_count)


def _o3_8h_max_per_day(o3_series: pd.Series, time_index: pd.DatetimeIndex,
                       dates: pd.Series, min_count: int = MIN_VALID_HOURS) -> pd.Series:
    """Daily maximum of 8-hour rolling means, gated by the day's valid-hour count."""
    s = o3_series.copy()
    s.index = time_index
    rolling8 = s.rolling('8h', min_periods=6).mean()
    rolling8_dates = pd.Series(rolling8.index.date, index=rolling8.index)
    daily_max = rolling8.groupby(rolling8_dates).max()
    raw_counts = o3_series.groupby(dates).count()
    daily_max.index = pd.to_datetime(daily_max.index).date
    return daily_max.where(raw_counts >= min_count)


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

    # ---- Daily aggregates with CPCB's 16-hour minimum -------------------------------------------
    daily_pm25  = _daily_mean_with_min(df['pm25'],  df['date'])
    daily_pm10  = _daily_mean_with_min(df['pm10'],  df['date'])
    daily_no2   = _daily_mean_with_min(df['no2'],   df['date'])
    daily_o3_24 = _daily_mean_with_min(df['o3'],    df['date'])     # for the chart
    daily_co    = _daily_mean_with_min(df['co'],    df['date'])     # for the chart
    daily_so2   = _daily_mean_with_min(df['so2'],   df['date'])     # for the chart
    daily_eu_aqi = _daily_mean_with_min(df['eu_aqi'], df['date'])
    daily_o3_8h = _o3_8h_max_per_day(df['o3'], pd.DatetimeIndex(df['time']), df['date'])  # for AQI

    daily_index = sorted(set(df['date']))
    daily_records: list[dict] = []
    for d in daily_index:
        pm25 = _round_or_none(daily_pm25.get(d), 1)
        pm10 = _round_or_none(daily_pm10.get(d), 1)
        no2  = _round_or_none(daily_no2.get(d),  1)
        o3   = _round_or_none(daily_o3_24.get(d), 1)
        co   = _round_or_none(daily_co.get(d),   1)
        so2  = _round_or_none(daily_so2.get(d),  1)
        eu   = _round_or_none(daily_eu_aqi.get(d), 1)
        o3_8h = daily_o3_8h.get(d)
        if pd.isna(o3_8h): o3_8h = None
        aqi = compute_india_aqi(pm25, pm10, no2=no2, o3_8h_max=o3_8h)
        daily_records.append({
            'date': str(d),
            'pm25': pm25, 'pm10': pm10, 'co': co, 'no2': no2,
            'so2': so2, 'o3': o3, 'eu_aqi': eu, 'aqi': aqi,
        })

    # ---- Monthly aggregates --------------------------------------------------------------------
    daily_df = pd.DataFrame(daily_records)
    daily_df['date_dt'] = pd.to_datetime(daily_df['date'])
    daily_df['year'] = daily_df['date_dt'].dt.year
    daily_df['month_num'] = daily_df['date_dt'].dt.month
    daily_df['period'] = daily_df['date_dt'].dt.to_period('M')
    daily_df['season'] = daily_df['month_num'].apply(get_season)

    monthly = daily_df.groupby('period').agg(
        aqi_mean=('aqi', 'mean'),
        aqi_median=('aqi', 'median'),
        aqi_max=('aqi', 'max'),
        aqi_min=('aqi', 'min'),
        pm25_mean=('pm25', 'mean'),
        pm10_mean=('pm10', 'mean'),
    ).reset_index()
    monthly_records = [
        {
            'month': str(row['period']),
            **{col: _round_or_none(row[col], 1)
               for col in ['aqi_mean', 'aqi_median', 'aqi_max', 'aqi_min', 'pm25_mean', 'pm10_mean']},
        }
        for _, row in monthly.iterrows()
    ]

    # ---- Seasonal aggregates -------------------------------------------------------------------
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

    # ---- Monthly box plot ----------------------------------------------------------------------
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
        'aqi_method': {
            'pollutants': ['pm25', 'pm10', 'no2', 'o3_8h_max'],
            'min_valid_hours_per_day': MIN_VALID_HOURS,
            'composite_rule': 'max(sub_indices); requires >=3 sub_indices including >=1 PM',
            'breakpoint_source': 'CPCB India AQI (cpcb.nic.in, 2014)',
            'excluded_pollutants': {
                'co_so2': 'Open-Meteo serves them, but CAMS Global accuracy for boundary-layer gaseous species is questionable; excluded to avoid pushing AQI in the wrong direction.',
                'nh3_pb': 'Not served by Open-Meteo.',
            },
        },
        'source': {
            'name': 'Open-Meteo Air Quality API (Copernicus CAMS)',
            'url': 'https://open-meteo.com/en/docs/air-quality-api',
            'license': 'CC-BY 4.0',
            'updated': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        },
    }

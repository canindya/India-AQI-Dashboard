"""Download hourly air-quality data from Open-Meteo for every city in cities.json.

Open-Meteo Air Quality API (https://open-meteo.com/en/docs/air-quality-api) is
free, requires no auth, and serves Copernicus CAMS-modeled hourly fields for
PM2.5, PM10, CO, NO2, SO2, O3 and the European AQI back to 2022-01-01.

Output: data/raw/{slug}_openmeteo.json — one file per city, full API payload.
"""
from __future__ import annotations

import json
import os
import time
from datetime import date, timedelta

import requests

HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CITIES_JSON = os.path.join(ROOT, 'scripts', 'cities.json')
OUT_DIR = os.path.join(ROOT, 'data', 'raw')

API_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'
HOURLY_FIELDS = [
    'pm10', 'pm2_5', 'carbon_monoxide', 'nitrogen_dioxide',
    'sulphur_dioxide', 'ozone', 'european_aqi',
]
START_DATE = '2022-01-01'
THROTTLE_SECONDS = 6.0          # polite default — free tier shares quota by IP
MAX_RETRIES = 4
BACKOFF_BASE = 30                # seconds


def fetch_city(slug: str, lat: float, lon: float, end_date: str) -> dict:
    params = {
        'latitude': lat,
        'longitude': lon,
        'start_date': START_DATE,
        'end_date': end_date,
        'hourly': ','.join(HOURLY_FIELDS),
        'timezone': 'Asia/Kolkata',
    }
    last_exc: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(API_URL, params=params, timeout=120)
            if resp.status_code == 429:
                wait = BACKOFF_BASE * (2 ** (attempt - 1))
                print(f"    {slug}: 429 rate-limited; sleeping {wait}s before retry {attempt}/{MAX_RETRIES}")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            last_exc = exc
            wait = BACKOFF_BASE * (2 ** (attempt - 1))
            print(f"    {slug}: error '{exc}'; sleeping {wait}s before retry {attempt}/{MAX_RETRIES}")
            time.sleep(wait)
    raise last_exc if last_exc else RuntimeError(f"{slug}: exhausted retries without exception")


def main(only_slug: str | None = None, only_missing: bool = False) -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(CITIES_JSON) as f:
        cities = json.load(f)

    end_date = (date.today() - timedelta(days=1)).isoformat()
    todo = [c for c in cities if (only_slug is None or c['slug'] == only_slug)]
    if only_missing:
        todo = [c for c in todo if not os.path.exists(os.path.join(OUT_DIR, f"{c['slug']}_openmeteo.json"))]
    print(f"Fetching Open-Meteo air-quality data for {len(todo)} cities ({START_DATE} to {end_date})")

    for i, city in enumerate(todo, 1):
        slug = city['slug']
        out_path = os.path.join(OUT_DIR, f'{slug}_openmeteo.json')
        try:
            payload = fetch_city(slug, city['lat'], city['lon'], end_date)
        except Exception as exc:  # network / HTTP errors
            print(f"  [{i}/{len(todo)}] {slug}: FAILED ({exc})")
            continue

        with open(out_path, 'w') as f:
            json.dump(payload, f)

        n_hours = len(payload.get('hourly', {}).get('time', []))
        print(f"  [{i}/{len(todo)}] {slug}: {n_hours} hourly rows -> {out_path}")
        if i < len(todo):
            time.sleep(THROTTLE_SECONDS)


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--city', help='download a single city by slug')
    p.add_argument('--missing-only', action='store_true', help='skip cities whose raw file already exists')
    args = p.parse_args()
    main(only_slug=args.city, only_missing=args.missing_only)

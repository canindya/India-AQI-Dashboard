"""Build dashboard/public/data/index.json (drives the map) and meta.json."""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone

HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CITIES_JSON = os.path.join(ROOT, 'scripts', 'cities.json')
DATA_DIR = os.path.join(ROOT, 'dashboard', 'public', 'data')
CITIES_DIR = os.path.join(DATA_DIR, 'cities')


def category_for(aqi: float | int | None) -> str:
    if aqi is None:
        return 'No data'
    if aqi <= 50: return 'Good'
    if aqi <= 100: return 'Satisfactory'
    if aqi <= 200: return 'Moderate'
    if aqi <= 300: return 'Poor'
    if aqi <= 400: return 'Very Poor'
    return 'Severe'


def main() -> None:
    with open(CITIES_JSON) as f:
        cities = json.load(f)

    entries = []
    for c in cities:
        path = os.path.join(CITIES_DIR, f"{c['slug']}.json")
        if not os.path.exists(path):
            continue
        with open(path) as f:
            payload = json.load(f)
        daily = payload.get('daily', [])
        # last day with non-null AQI
        last = next((d for d in reversed(daily) if d.get('aqi') is not None), None)
        if last is None:
            continue
        entries.append({
            'slug': c['slug'],
            'name': c['name'],
            'state': c['state'],
            'lat': c['lat'],
            'lon': c['lon'],
            'current_aqi': last['aqi'],
            'current_pm25': last.get('pm25'),
            'current_pm10': last.get('pm10'),
            'category': category_for(last['aqi']),
            'updated': last['date'],
        })

    now = datetime.now(timezone.utc).isoformat(timespec='seconds')
    index = {
        'generated_at': now,
        'source': 'Open-Meteo Air Quality API (Copernicus CAMS)',
        'cities': entries,
    }
    with open(os.path.join(DATA_DIR, 'index.json'), 'w') as f:
        json.dump(index, f, indent=2)

    meta = {
        'generated_at': now,
        'source_versions': {
            'open_meteo_air_quality': 'v1',
        },
        'city_count': len(entries),
    }
    with open(os.path.join(DATA_DIR, 'meta.json'), 'w') as f:
        json.dump(meta, f, indent=2)

    print(f"Wrote index.json with {len(entries)} cities and meta.json")


if __name__ == '__main__':
    main()

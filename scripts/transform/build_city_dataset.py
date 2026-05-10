"""Transform raw Open-Meteo payloads into dashboard-shaped JSON, one file per city."""
from __future__ import annotations

import json
import os
import sys

HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
from transform.aqi_breakpoints import build_city_payload  # noqa: E402

CITIES_JSON = os.path.join(ROOT, 'scripts', 'cities.json')
RAW_DIR = os.path.join(ROOT, 'data', 'raw')
OUT_DIR = os.path.join(ROOT, 'dashboard', 'public', 'data', 'cities')


def process_city(city: dict) -> bool:
    slug = city['slug']
    raw_path = os.path.join(RAW_DIR, f'{slug}_openmeteo.json')
    if not os.path.exists(raw_path):
        print(f"  [{slug}] missing {raw_path} — run aqi_openmeteo.py first")
        return False
    with open(raw_path) as f:
        raw = json.load(f)
    payload = build_city_payload(raw, city)
    out_path = os.path.join(OUT_DIR, f'{slug}.json')
    with open(out_path, 'w') as f:
        json.dump(payload, f)
    n = len(payload['daily'])
    print(f"  [{slug}] {n} daily, {len(payload['seasonal'])} seasonal -> {out_path}")
    return True


def main(only_slug: str | None = None) -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(CITIES_JSON) as f:
        cities = json.load(f)
    todo = [c for c in cities if (only_slug is None or c['slug'] == only_slug)]
    ok = 0
    for c in todo:
        if process_city(c):
            ok += 1
    print(f"Built {ok}/{len(todo)} city datasets")


if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--city', help='build a single city by slug')
    args = p.parse_args()
    main(only_slug=args.city)

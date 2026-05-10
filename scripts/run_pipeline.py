"""Orchestrate: export cities -> download Open-Meteo -> build per-city JSON -> build index.

Usage:
    python run_pipeline.py                  # all cities
    python run_pipeline.py --city delhi     # one city (smoke test)
    python run_pipeline.py --skip-download  # rebuild from cached raw payloads

On Windows the project's Python interpreter is `D:/Python/python.exe`
(the system `python3` is a Windows Store stub). Node must be on PATH for
the cities export step.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))


def export_cities() -> None:
    print("[1/4] Exporting cities.ts -> scripts/cities.json")
    subprocess.run(['node', os.path.join(HERE, 'export_cities.mjs')], check=True)


def download(only_slug: str | None) -> None:
    print("[2/4] Downloading Open-Meteo air-quality data")
    args = [sys.executable, os.path.join(HERE, 'download', 'aqi_openmeteo.py')]
    if only_slug:
        args += ['--city', only_slug]
    subprocess.run(args, check=True)


def build_city(only_slug: str | None) -> None:
    print("[3/4] Building per-city JSON")
    args = [sys.executable, os.path.join(HERE, 'transform', 'build_city_dataset.py')]
    if only_slug:
        args += ['--city', only_slug]
    subprocess.run(args, check=True)


def build_idx() -> None:
    print("[4/4] Building index.json + meta.json")
    subprocess.run([sys.executable, os.path.join(HERE, 'transform', 'build_index.py')], check=True)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument('--city', help='restrict to a single city slug')
    p.add_argument('--skip-download', action='store_true', help='reuse cached data/raw payloads')
    p.add_argument('--skip-export', action='store_true', help='skip cities.ts -> cities.json export')
    args = p.parse_args()

    if not args.skip_export:
        export_cities()
    if not args.skip_download:
        download(args.city)
    build_city(args.city)
    build_idx()
    print("Pipeline complete.")


if __name__ == '__main__':
    main()

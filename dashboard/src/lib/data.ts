import type { AQIData, CityIndex, MetaInfo } from './types';

const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '/data';

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

export const loadCity = (slug: string) => fetchJSON<AQIData>(`cities/${slug}.json`);
export const loadCityIndex = () => fetchJSON<CityIndex>('index.json');
export const loadMeta = () => fetchJSON<MetaInfo>('meta.json');

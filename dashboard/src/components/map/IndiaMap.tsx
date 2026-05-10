'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { loadCityIndex } from '@/lib/data';
import type { CityIndexEntry } from '@/lib/types';
import { getAQIColor, getAQILabel } from '@/lib/colors';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

const INDIA_CENTER: [number, number] = [22.5, 80.0];
const INDIA_BOUNDS: [[number, number], [number, number]] = [[6, 67], [37, 98]];

function radiusFor(aqi: number | null | undefined): number {
  if (aqi == null) return 6;
  if (aqi <= 50) return 7;
  if (aqi <= 100) return 9;
  if (aqi <= 200) return 11;
  if (aqi <= 300) return 13;
  if (aqi <= 400) return 15;
  return 17;
}

interface Props {
  height?: number | string;
  cities?: CityIndexEntry[];
}

export default function IndiaMap({ height = 520, cities: prefetched }: Props) {
  const router = useRouter();
  const [cities, setCities] = useState<CityIndexEntry[] | null>(prefetched ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefetched) return;
    loadCityIndex().then(idx => setCities(idx.cities)).catch(e => setError(e.message));
  }, [prefetched]);

  if (error) return <div className="text-sm text-muted">Could not load city index: {error}</div>;
  if (!cities) return <div className="text-sm text-muted">Loading map…</div>;

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        minZoom={4}
        maxZoom={9}
        maxBounds={INDIA_BOUNDS}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {cities.map(c => (
          <CircleMarker
            key={c.slug}
            center={[c.lat, c.lon]}
            radius={radiusFor(c.current_aqi)}
            pathOptions={{
              color: '#0F1419',
              weight: 1,
              fillColor: getAQIColor(c.current_aqi),
              fillOpacity: 0.85,
            }}
            eventHandlers={{
              click: () => router.push(`/city/${c.slug}`),
            }}
          >
            <Popup>
              <strong>{c.name}</strong> · {c.state}
              <br />
              AQI <strong>{c.current_aqi ?? '—'}</strong>
              {' '}({getAQILabel(c.current_aqi)})
              <br />
              <span style={{ color: 'var(--mute)' }}>{c.updated}</span>
              <br />
              <a href={`/city/${c.slug}`} style={{ color: 'var(--color-accent)' }}>
                Open dashboard →
              </a>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

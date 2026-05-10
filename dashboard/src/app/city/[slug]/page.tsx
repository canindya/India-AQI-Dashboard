import { notFound } from 'next/navigation';
import { CITIES, CITY_BY_SLUG } from '@/lib/cities';
import CityClient from './CityClient';

export const dynamicParams = false;

export function generateStaticParams() {
  return CITIES.map(c => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = CITY_BY_SLUG[slug];
  if (!city) return {};
  return {
    title: `${city.name} AQI — Air Quality Trends`,
    description: `Daily, monthly and seasonal air-quality index for ${city.name}, ${city.state}. PM2.5, PM10, CO, NO₂, SO₂, O₃ from Open-Meteo (Copernicus CAMS).`,
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = CITY_BY_SLUG[slug];
  if (!city) notFound();
  return <CityClient slug={slug} city={city} />;
}

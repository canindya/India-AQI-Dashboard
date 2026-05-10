import type { MetadataRoute } from 'next';
import { CITIES } from '@/lib/cities';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqi.datacarta.in';
  const now = new Date();
  const staticRoutes = ['', '/sources', '/methodology'].map(path => ({
    url: `${base}${path}`,
    lastModified: now,
  }));
  const cityRoutes = CITIES.map(c => ({
    url: `${base}/city/${c.slug}`,
    lastModified: now,
  }));
  return [...staticRoutes, ...cityRoutes];
}

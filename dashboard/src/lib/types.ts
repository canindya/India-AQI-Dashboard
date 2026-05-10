// AQI payload types (mirror Kolkata pipeline output exactly).

export interface AQIDaily {
  date: string;
  pm25: number | null;
  pm10: number | null;
  co: number | null;
  no2: number | null;
  so2: number | null;
  o3: number | null;
  eu_aqi: number | null;
  aqi: number | null;
}

export interface AQIMonthly {
  month: string;
  aqi_mean: number | null;
  aqi_median: number | null;
  aqi_max: number | null;
  aqi_min: number | null;
  pm25_mean: number | null;
  pm10_mean: number | null;
}

export interface AQISeasonal {
  year: number;
  season: string;
  aqi_mean: number | null;
  pm25_mean: number | null;
}

export interface AQIBoxPlot {
  month: number;
  month_name: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
}

export interface AQIData {
  city: {
    slug: string;
    name: string;
    state: string;
    lat: number;
    lon: number;
  };
  daily: AQIDaily[];
  monthly: AQIMonthly[];
  seasonal: AQISeasonal[];
  box_plot_by_month: AQIBoxPlot[];
  date_range: { start: string; end: string };
  source: { name: string; url: string; license: string; updated: string };
}

export interface CityIndexEntry {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  current_aqi: number | null;
  current_pm25: number | null;
  current_pm10: number | null;
  category: string;
  updated: string;
}

export interface CityIndex {
  generated_at: string;
  source: string;
  cities: CityIndexEntry[];
}

export interface MetaInfo {
  generated_at: string;
  source_versions: Record<string, string>;
  city_count: number;
}

// India AQI dashboard color tokens.
// Categories follow CPCB India AQI buckets (cpcb.nic.in/National-Air-Quality-Index):
//   0-50 Good, 51-100 Satisfactory, 101-200 Moderate,
//   201-300 Poor, 301-400 Very Poor, 401-500 Severe.
export const COLORS = {
  accent: '#2E6B8A',
  accentWarm: '#C75B39',
  accentLeaf: '#4A7C59',
  accentSun: '#E8A838',
  accentRed: '#D4534A',

  chart: [
    '#2E6B8A', // blue
    '#C75B39', // terracotta
    '#4A7C59', // leaf
    '#E8A838', // sun
    '#D4534A', // red
    '#7B68AE', // purple
    '#3BA99C', // teal
    '#E07B53', // coral
  ],

  aqi: {
    good: '#4CAF50',           // 0-50
    satisfactory: '#9ACD32',   // 51-100
    moderate: '#FFC107',       // 101-200
    poor: '#FF9800',           // 201-300
    veryPoor: '#F44336',       // 301-400
    severe: '#7B1FA2',         // 401-500
  },
};

export function getTooltipStyle(): React.CSSProperties {
  if (typeof window === 'undefined') {
    return { backgroundColor: '#1E2A3A', border: '1px solid #2D3748', borderRadius: 8, color: '#E8EAED' };
  }
  const s = getComputedStyle(document.documentElement);
  return {
    backgroundColor: s.getPropertyValue('--tooltip-bg').trim() || '#1E2A3A',
    border: `1px solid ${s.getPropertyValue('--tooltip-border').trim() || '#2D3748'}`,
    borderRadius: 8,
    color: s.getPropertyValue('--tooltip-text').trim() || '#E8EAED',
  };
}

export function getGridColor(): string {
  if (typeof window === 'undefined') return '#2D3748';
  return getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim() || '#2D3748';
}

export function getAxisColor(): string {
  if (typeof window === 'undefined') return '#9AA0A6';
  return getComputedStyle(document.documentElement).getPropertyValue('--chart-axis').trim() || '#9AA0A6';
}

// CPCB India AQI bucket colors.
export function getAQIColor(aqi: number | null | undefined): string {
  if (aqi == null) return '#5C6B73';
  if (aqi <= 50) return COLORS.aqi.good;
  if (aqi <= 100) return COLORS.aqi.satisfactory;
  if (aqi <= 200) return COLORS.aqi.moderate;
  if (aqi <= 300) return COLORS.aqi.poor;
  if (aqi <= 400) return COLORS.aqi.veryPoor;
  return COLORS.aqi.severe;
}

export function getAQILabel(aqi: number | null | undefined): string {
  if (aqi == null) return 'No data';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

export function getAQIAdvice(aqi: number | null | undefined): string {
  if (aqi == null) return 'Data unavailable for this period.';
  if (aqi <= 50) return 'Minimal impact. Air quality is satisfactory for outdoor activity.';
  if (aqi <= 100) return 'Acceptable for most. Sensitive individuals may notice minor irritation.';
  if (aqi <= 200) return 'May cause breathing discomfort to people with lung disease, children and older adults.';
  if (aqi <= 300) return 'May cause breathing discomfort to most people on prolonged exposure. Limit prolonged outdoor exertion.';
  if (aqi <= 400) return 'May cause respiratory illness on prolonged exposure. Avoid outdoor activity.';
  return 'Hazardous. Affects healthy people and seriously affects those with existing diseases. Stay indoors.';
}

// India AQI dashboard color tokens.
// Category names and AQI ranges follow CPCB's six-bucket India AQI scale
// (cpcb.nic.in/National-Air-Quality-Index):
//   0-50 Good, 51-100 Satisfactory, 101-200 Moderate,
//   201-300 Poor, 301-400 Very Poor, 401-500 Severe.
// The hex values below are our own choice (CPCB-aligned semantics, not CPCB's
// exact swatches) — see DESIGN.md for the palette rationale.
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

// Maps an AQI value to a hex color from our six-bucket palette.
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

// Health-effect descriptions per CPCB AQI category, paraphrased from CPCB's
// "About AQI" document (cpcb.nic.in, "Likely Health Impacts" column).
// These are the descriptions CPCB itself publishes for each band.
export function getAQIAdvice(aqi: number | null | undefined): string {
  if (aqi == null) return 'No data available for this period.';
  if (aqi <= 50) return 'Minimal impact. (CPCB)';
  if (aqi <= 100) return 'Minor breathing discomfort to sensitive people. (CPCB)';
  if (aqi <= 200) return 'Breathing discomfort to people with lung disease such as asthma, and discomfort to people with heart disease, children and older adults. (CPCB)';
  if (aqi <= 300) return 'Breathing discomfort to most people on prolonged exposure, and discomfort to people with heart disease. (CPCB)';
  if (aqi <= 400) return 'Respiratory illness on prolonged exposure. Effect may be more pronounced in people with lung and heart diseases. (CPCB)';
  return 'Affects healthy people and seriously impacts those with existing diseases. (CPCB)';
}

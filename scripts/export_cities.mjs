// Mirror dashboard/src/lib/cities.ts to scripts/cities.json so the Python
// pipeline reads the same registry as the frontend. Run as the first step
// of run_pipeline.py.
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const citiesTsPath = resolve(__dirname, '..', 'dashboard', 'src', 'lib', 'cities.ts');

// We can't import the .ts file directly from Node without a loader. Parse the
// CITIES array out with a regex — the file is structured and stable.
import { readFileSync } from 'node:fs';
const src = readFileSync(citiesTsPath, 'utf8');

const arrMatch = src.match(/export const CITIES:\s*City\[\]\s*=\s*\[([\s\S]*?)\n\];/);
if (!arrMatch) {
  console.error('Could not locate CITIES array in cities.ts');
  process.exit(1);
}

const body = arrMatch[1];
const objRegex = /\{\s*slug:\s*'([^']+)',\s*name:\s*'([^']+)',\s*state:\s*'([^']+)',\s*lat:\s*(-?[\d.]+),\s*lon:\s*(-?[\d.]+)/g;

const cities = [];
let m;
while ((m = objRegex.exec(body)) !== null) {
  cities.push({
    slug: m[1],
    name: m[2],
    state: m[3],
    lat: Number(m[4]),
    lon: Number(m[5]),
  });
}

if (cities.length === 0) {
  console.error('Parsed zero cities from cities.ts — regex out of sync.');
  process.exit(1);
}

const outPath = resolve(__dirname, 'cities.json');
writeFileSync(outPath, JSON.stringify(cities, null, 2));
console.log(`Exported ${cities.length} cities to ${outPath}`);
// Quiet the unused-imports warning for tooling
void pathToFileURL;

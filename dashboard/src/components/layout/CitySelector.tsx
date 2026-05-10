'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CITIES } from '@/lib/cities';

export default function CitySelector() {
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState('');

  const handleSelect = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const match = CITIES.find(
      c => c.name.toLowerCase() === trimmed.toLowerCase() || c.slug === trimmed.toLowerCase()
    );
    if (match) {
      router.push(`/city/${match.slug}`);
      setValue('');
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          // datalist click in most browsers fires a change with the full match.
          handleSelect(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSelect((e.target as HTMLInputElement).value);
        }}
        placeholder="Pick a city…"
        aria-label="Pick an Indian city"
        className="w-32 sm:w-44 rounded border border-border bg-card px-3 py-1 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
      />
      <datalist id={listId}>
        {CITIES.map(c => (
          <option key={c.slug} value={c.name}>{c.state}</option>
        ))}
      </datalist>
    </div>
  );
}

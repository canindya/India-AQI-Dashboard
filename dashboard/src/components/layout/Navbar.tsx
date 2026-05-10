'use client';

import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import CitySelector from './CitySelector';

export default function Navbar() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-4">
        <Link href="/" className="font-semibold text-foreground whitespace-nowrap">
          India <span className="text-[var(--color-accent-warm)]">AQI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm text-muted">
          <Link href="/" className="hover:text-foreground transition-colors">Map</Link>
          <Link href="/sources" className="hover:text-foreground transition-colors">Sources</Link>
          <Link href="/methodology" className="hover:text-foreground transition-colors">Methodology</Link>
        </nav>

        <div className="flex-1" />

        <CitySelector />

        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="text-sm text-muted hover:text-foreground border border-border rounded px-2 py-1 transition-colors"
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>
    </header>
  );
}

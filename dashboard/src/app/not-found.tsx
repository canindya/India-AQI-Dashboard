import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <h1 className="text-3xl font-bold mb-2">City not found</h1>
      <p className="text-muted mb-6">We don&apos;t have AQI data for that page yet.</p>
      <Link href="/" className="underline">Back to map</Link>
    </div>
  );
}

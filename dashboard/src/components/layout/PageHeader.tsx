interface PageHeaderProps {
  title: string;
  description?: string;
  accent?: 'warm' | 'cool' | 'leaf';
  eyebrow?: string;
}

export default function PageHeader({ title, description, accent = 'warm', eyebrow }: PageHeaderProps) {
  const borderColor = {
    warm: 'border-[var(--color-accent-warm)]',
    cool: 'border-[var(--color-accent)]',
    leaf: 'border-[var(--color-accent-leaf)]',
  }[accent];

  return (
    <div className={`mb-8 border-l-4 ${borderColor} pl-4`}>
      {eyebrow && (
        <p className="text-xs uppercase tracking-wider text-muted mb-1">{eyebrow}</p>
      )}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{title}</h1>
      {description && <p className="mt-1 text-muted">{description}</p>}
    </div>
  );
}

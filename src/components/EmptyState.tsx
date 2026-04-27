import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="card text-center py-16">
      <div className="w-12 h-12 mx-auto rounded-full bg-soft text-muted grid place-items-center mb-3">
        <Icon size={20} />
      </div>
      <div className="font-medium">{title}</div>
      {description && <p className="text-sm text-muted mt-1">{description}</p>}
    </div>
  );
}

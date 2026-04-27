import type { Brochure } from '../lib/types';
import { PhoneHeader } from './PhoneHeader';

export function BrochuresPreview({ brochures }: { brochures: Brochure[] }) {
  const popular = brochures.filter((b) => b.is_popular);
  const byCategory = brochures.reduce<Record<string, Brochure[]>>((acc, b) => {
    const k = b.category || 'Other';
    (acc[k] ||= []).push(b);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col bg-bg">
      <PhoneHeader title="Brochures" />
      <div className="flex-1 overflow-y-auto pb-6">
        {popular.length > 0 && (
          <Section title="Most Popular">
            <Row brochures={popular} />
          </Section>
        )}
        {Object.entries(byCategory).map(([cat, items]) => (
          <Section key={cat} title={cat}>
            <Row brochures={items} />
          </Section>
        ))}
        {brochures.length === 0 && (
          <div className="p-6 text-center text-muted text-xs">No brochures yet</div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-4">
      <div className="px-4 mb-2 text-xs font-bold text-ink uppercase tracking-wide">{title}</div>
      {children}
    </div>
  );
}

function Row({ brochures }: { brochures: Brochure[] }) {
  return (
    <div className="flex gap-3 px-4 overflow-x-auto pb-2 no-scrollbar">
      {brochures.map((b) => (
        <div key={b.id} className="shrink-0 w-28">
          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white shadow-sm border border-line">
            {b.image ? (
              <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-soft" />
            )}
          </div>
          <div className="text-[10px] mt-1 text-ink line-clamp-2 leading-tight">{b.title}</div>
        </div>
      ))}
    </div>
  );
}

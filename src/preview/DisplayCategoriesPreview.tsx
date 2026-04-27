import type { DisplayCategory, DisplayProduct } from '../lib/types';
import { PhoneHeader } from './PhoneHeader';

export function DisplayCategoriesPreview({
  categories,
  products,
  selectedCategoryId,
}: {
  categories: DisplayCategory[];
  products: DisplayProduct[];
  selectedCategoryId?: string | null;
}) {
  if (selectedCategoryId) {
    const items = products.filter((p) => p.category_id === selectedCategoryId);
    return (
      <div className="h-full flex flex-col bg-bg">
        <PhoneHeader title={selectedCategoryId} />
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {items.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-3 shadow-sm border border-line">
              {p.url && (
                <div className="aspect-video rounded-xl overflow-hidden bg-soft mb-2">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="text-sm font-semibold text-ink">{p.name}</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-brand font-bold text-sm">{p.price}</span>
                {p.old_price && <span className="text-muted text-xs line-through">{p.old_price}</span>}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center text-muted text-xs py-6">No products in this category</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg">
      <PhoneHeader title="Ex-Display" />
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3">
        {categories.map((c) => {
          const count = products.filter((p) => p.category_id === c.id).length;
          return (
            <div key={c.id} className="bg-white rounded-2xl p-3 shadow-sm border border-line aspect-square flex flex-col justify-end">
              <div className="text-sm font-bold text-ink leading-tight">{c.id}</div>
              <div className="text-[10px] text-muted">{count} products</div>
            </div>
          );
        })}
        {categories.length === 0 && (
          <div className="col-span-2 text-center text-muted text-xs py-6">No categories yet</div>
        )}
      </div>
    </div>
  );
}

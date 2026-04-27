import type {
  ProductCategory,
  ProductSection,
  ProductSectionItem,
  ProductSubcategory,
  TabType,
} from '../lib/types';
import { TAB_TYPES } from '../lib/types';
import { PhoneHeader } from './PhoneHeader';

export function CatalogPreview({
  categories,
  subcategories,
  sections,
  items,
  selectedCategoryId,
  selectedSubcategoryId,
}: {
  categories: ProductCategory[];
  subcategories: ProductSubcategory[];
  sections: ProductSection[];
  items: ProductSectionItem[];
  selectedCategoryId?: string | null;
  selectedSubcategoryId?: string | null;
}) {
  if (selectedSubcategoryId) {
    const sub = subcategories.find((s) => s.id === selectedSubcategoryId);
    if (sub) return <SubcategoryDetail sub={sub} sections={sections.filter((s) => s.subcategory_id === sub.id)} items={items} />;
  }
  if (selectedCategoryId) {
    const cat = categories.find((c) => c.id === selectedCategoryId);
    if (cat) {
      const subs = subcategories.filter((s) => s.category_id === cat.id && !s.parent_subcategory_id);
      return <CategoryDetail cat={cat} subs={subs} />;
    }
  }
  return <CategoriesGrid categories={categories} />;
}

function CategoriesGrid({ categories }: { categories: ProductCategory[] }) {
  return (
    <div className="h-full flex flex-col bg-bg">
      <PhoneHeader title="Products" />
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {categories
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((c) => (
            <div key={c.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-line">
              <div className="aspect-[16/9] bg-soft">
                {c.image_url && <img src={c.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="p-3">
                <div className="font-bold text-sm text-ink">{c.title}</div>
                {c.tagline && <div className="text-[11px] text-muted mt-0.5">{c.tagline}</div>}
              </div>
            </div>
          ))}
        {categories.length === 0 && (
          <div className="text-center text-muted text-xs py-6">No categories yet</div>
        )}
      </div>
    </div>
  );
}

function CategoryDetail({ cat, subs }: { cat: ProductCategory; subs: ProductSubcategory[] }) {
  return (
    <div className="h-full flex flex-col bg-bg">
      <PhoneHeader title={cat.title} />
      <div className="flex-1 overflow-y-auto">
        {cat.hero_image_url && (
          <div className="aspect-[16/9] bg-soft">
            <img src={cat.hero_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {cat.tagline && <div className="px-4 pt-3 text-sm font-bold text-ink">{cat.tagline}</div>}
        {cat.about && <div className="px-4 py-2 text-[11px] text-muted whitespace-pre-line">{cat.about}</div>}
        <div className="p-3 space-y-3">
          {subs
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((s) => (
              <div key={s.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-line flex">
                <div className="w-20 h-20 bg-soft shrink-0">
                  {s.card_image_url && <img src={s.card_image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="p-2 flex flex-col justify-center">
                  <div className="font-semibold text-xs text-ink">{s.title}</div>
                  {s.tagline && <div className="text-[10px] text-muted">{s.tagline}</div>}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function SubcategoryDetail({
  sub,
  sections,
  items,
}: {
  sub: ProductSubcategory;
  sections: ProductSection[];
  items: ProductSectionItem[];
}) {
  const tabsWithContent = TAB_TYPES.filter((t) => sections.some((s) => s.tab_type === t));
  return (
    <div className="h-full flex flex-col bg-bg">
      <PhoneHeader title={sub.title} />
      <div className="flex-1 overflow-y-auto">
        {sub.hero_image_url && (
          <div className="aspect-[16/9] bg-soft">
            <img src={sub.hero_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {sub.tagline && <div className="px-4 pt-3 text-sm font-bold text-ink">{sub.tagline}</div>}
        <div className="px-4 py-2 flex gap-3 overflow-x-auto border-b border-line text-[11px] font-medium">
          {tabsWithContent.map((t, i) => (
            <span key={t} className={i === 0 ? 'text-brand border-b-2 border-brand pb-1' : 'text-muted pb-1'}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          ))}
        </div>
        {tabsWithContent[0] && (
          <TabContent
            tab={tabsWithContent[0]}
            sections={sections.filter((s) => s.tab_type === tabsWithContent[0])}
            items={items}
          />
        )}
      </div>
    </div>
  );
}

function TabContent({
  sections,
  items,
}: {
  tab: TabType;
  sections: ProductSection[];
  items: ProductSectionItem[];
}) {
  return (
    <div className="p-3 space-y-3">
      {sections
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((s) => {
          const sec = items.filter((it) => it.section_id === s.id);
          return (
            <div key={s.id} className="bg-white rounded-2xl p-3 shadow-sm border border-line">
              {s.section_title && <div className="text-xs font-bold text-ink mb-1">{s.section_title}</div>}
              {s.section_content && <div className="text-[10px] text-muted whitespace-pre-line">{s.section_content}</div>}
              {sec.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {sec
                    .slice()
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .slice(0, 6)
                    .map((it) => (
                      <div key={it.id} className="aspect-square rounded-lg overflow-hidden bg-soft">
                        {it.image_url && <img src={it.image_url} alt={it.label || ''} className="w-full h-full object-cover" />}
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

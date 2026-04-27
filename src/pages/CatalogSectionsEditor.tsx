import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ItemType, ProductSection, ProductSectionItem, TabType } from '../lib/types';
import { ITEM_TYPES, TAB_TYPES } from '../lib/types';
import { ImageUpload } from '../components/ImageUpload';

type Target =
  | { kind: 'category'; id: string; label: string }
  | { kind: 'subcategory'; id: string; label: string };

export function CatalogSectionsEditor({
  target,
  sections,
  items,
}: {
  target: Target;
  sections: ProductSection[];
  items: ProductSectionItem[];
}) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabType>('details');
  const [addTabType, setAddTabType] = useState<TabType>('details');

  const sectionsByTab = useMemo(
    () => sections.filter((s) => s.tab_type === tab).slice().sort((a, b) => a.sort_order - b.sort_order),
    [sections, tab],
  );

  const counts = useMemo(() => {
    const c: Record<TabType, number> = {
      details: 0, styles: 0, hardware: 0, colours: 0, glass: 0, extras: 0,
    };
    for (const s of sections) c[s.tab_type] = (c[s.tab_type] || 0) + 1;
    return c;
  }, [sections]);

  const visibleTabs = useMemo(
    () => TAB_TYPES.filter((t) => counts[t] > 0),
    [counts],
  );

  // If current tab becomes hidden, switch to first visible tab
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(tab)) {
      setTab(visibleTabs[0]);
    }
  }, [visibleTabs, tab]);

  const addSection = useMutation({
    mutationFn: async (targetTab: TabType) => {
      const existingInTab = sections.filter((s) => s.tab_type === targetTab);
      const payload = {
        category_id: target.kind === 'category' ? target.id : null,
        subcategory_id: target.kind === 'subcategory' ? target.id : null,
        tab_type: targetTab,
        section_title: 'Untitled',
        section_content: null,
        overview_image_url: null,
        overview_image_mode: 'contain',
        sort_order: existingInTab.length,
      };
      const { error } = await supabase.from('product_sections').insert(payload);
      if (error) throw error;
    },
    onSuccess: (_data, targetTab) => {
      qc.invalidateQueries({ queryKey: ['product_sections'] });
      setTab(targetTab);
    },
    onError: (e) => alert((e as Error).message),
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-muted uppercase tracking-wide">{target.kind}</div>
          <div className="font-semibold">{target.label}</div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input py-1.5 text-xs w-28"
            value={addTabType}
            onChange={(e) => setAddTabType(e.target.value as TabType)}
          >
            {TAB_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <button onClick={() => addSection.mutate(addTabType)} className="btn-primary">
            <Plus size={14} /> Add section
          </button>
        </div>
      </div>

      {visibleTabs.length > 0 && (
        <div className="flex gap-1 border-b border-line mb-4 overflow-x-auto">
          {visibleTabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === t ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className="ml-1.5 text-xs opacity-60">({counts[t]})</span>
            </button>
          ))}
        </div>
      )}

      {sectionsByTab.length === 0 ? (
        <div className="text-sm text-muted text-center py-8">
          No sections yet. Select a tab type above and click "Add section" to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {sectionsByTab.map((s, idx) => (
            <SectionCard
              key={s.id}
              section={s}
              items={items.filter((it) => it.section_id === s.id)}
              isFirst={idx === 0}
              isLast={idx === sectionsByTab.length - 1}
              folder={`${target.kind}/${target.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SectionCard({
  section,
  items,
  isFirst,
  isLast,
  folder,
}: {
  section: ProductSection;
  items: ProductSectionItem[];
  isFirst: boolean;
  isLast: boolean;
  folder: string;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(section.section_title || '');
  const [content, setContent] = useState(section.section_content || '');

  useEffect(() => {
    setTitle(section.section_title || '');
    setContent(section.section_content || '');
  }, [section.id, section.section_title, section.section_content]);

  const dirty =
    title !== (section.section_title || '') ||
    content !== (section.section_content || '');

  async function save() {
    const { error } = await supabase
      .from('product_sections')
      .update({
        section_title: title || null,
        section_content: content || null,
      })
      .eq('id', section.id);
    if (error) alert(error.message);
    else qc.invalidateQueries({ queryKey: ['product_sections'] });
  }

  async function saveOverview(url: string | null) {
    const { error } = await supabase
      .from('product_sections')
      .update({ overview_image_url: url })
      .eq('id', section.id);
    if (error) alert(error.message);
    else qc.invalidateQueries({ queryKey: ['product_sections'] });
  }

  async function move(dir: -1 | 1) {
    const { error } = await supabase
      .from('product_sections')
      .update({ sort_order: section.sort_order + dir })
      .eq('id', section.id);
    if (error) alert(error.message);
    else qc.invalidateQueries({ queryKey: ['product_sections'] });
  }

  async function remove() {
    if (!confirm(`Delete section "${section.section_title || 'Untitled'}" and all its items?`)) return;
    const { error: e1 } = await supabase.from('product_section_items').delete().eq('section_id', section.id);
    if (e1) {
      alert(e1.message);
      return;
    }
    const { error: e2 } = await supabase.from('product_sections').delete().eq('id', section.id);
    if (e2) alert(e2.message);
    else {
      qc.invalidateQueries({ queryKey: ['product_sections'] });
      qc.invalidateQueries({ queryKey: ['product_section_items'] });
    }
  }

  return (
    <div className="border border-line rounded-2xl p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-muted">Section #{section.id}</div>
        <div className="flex gap-1">
          <button onClick={() => move(-1)} disabled={isFirst} className="btn-ghost px-2 disabled:opacity-30"><ArrowUp size={14} /></button>
          <button onClick={() => move(1)} disabled={isLast} className="btn-ghost px-2 disabled:opacity-30"><ArrowDown size={14} /></button>
          <button onClick={remove} className="btn-ghost px-2 text-brand"><Trash2 size={14} /></button>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Content</label>
          <textarea
            className="input min-h-[80px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <ImageUpload
          label="Overview image (optional)"
          folder={folder}
          baseName={title || 'overview'}
          value={section.overview_image_url}
          onChange={saveOverview}
        />
        {dirty && (
          <div className="flex justify-end">
            <button onClick={save} className="btn-primary">Save section</button>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-line">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Items ({items.length})</div>
          <AddItemButton sectionId={section.id} folder={folder} nextSort={items.length} />
        </div>
        {items.length > 0 && (
          <ItemsGrid items={items} folder={folder} />
        )}
      </div>
    </div>
  );
}

function AddItemButton({ sectionId, folder, nextSort }: { sectionId: number; folder: string; nextSort: number }) {
  const qc = useQueryClient();
  const [type, setType] = useState<ItemType>('image');
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('product_section_items')
        .insert({
          section_id: sectionId,
          item_type: type,
          label: null,
          image_url: null,
          resize_mode: null,
          full_height: false,
          sort_order: nextSort,
        });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product_section_items'] }),
    onError: (e) => alert((e as Error).message),
  });
  return (
    <div className="flex gap-2 items-center">
      <select className="input py-1 text-xs w-28" value={type} onChange={(e) => setType(e.target.value as ItemType)}>
        {ITEM_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <button onClick={() => add.mutate()} className="btn-secondary text-xs py-1.5"><Plus size={12} /> Add item</button>
      <span className="text-xs text-muted hidden">{folder}</span>
    </div>
  );
}

function ItemsGrid({ items, folder }: { items: ProductSectionItem[]; folder: string }) {
  const sorted = items.slice().sort((a, b) => a.sort_order - b.sort_order);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {sorted.map((it, idx) => (
        <ItemCard
          key={it.id}
          item={it}
          folder={folder}
          isFirst={idx === 0}
          isLast={idx === sorted.length - 1}
        />
      ))}
    </div>
  );
}

function ItemCard({
  item,
  folder,
  isFirst,
  isLast,
}: {
  item: ProductSectionItem;
  folder: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const qc = useQueryClient();
  const [label, setLabel] = useState(item.label || '');

  useEffect(() => {
    setLabel(item.label || '');
  }, [item.id, item.label]);

  async function update(patch: Partial<ProductSectionItem>) {
    const { error } = await supabase.from('product_section_items').update(patch).eq('id', item.id);
    if (error) alert(error.message);
    else qc.invalidateQueries({ queryKey: ['product_section_items'] });
  }
  async function move(dir: -1 | 1) {
    update({ sort_order: item.sort_order + dir });
  }
  async function remove() {
    if (!confirm('Delete item?')) return;
    const { error } = await supabase.from('product_section_items').delete().eq('id', item.id);
    if (error) alert(error.message);
    else qc.invalidateQueries({ queryKey: ['product_section_items'] });
  }

  return (
    <div className="border border-line rounded-xl p-2 bg-white">
      <ImageUpload
        folder={folder}
        baseName={label || 'item'}
        value={item.image_url}
        onChange={(url) => update({ image_url: url })}
        aspect="aspect-square"
      />
      <input
        className="input mt-2 text-xs py-1.5"
        placeholder="Label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => label !== (item.label || '') && update({ label: label || null })}
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] uppercase text-muted">{item.item_type}</span>
        <div className="flex gap-1">
          <button onClick={() => move(-1)} disabled={isFirst} className="text-muted hover:text-ink disabled:opacity-30 px-1"><ArrowUp size={12} /></button>
          <button onClick={() => move(1)} disabled={isLast} className="text-muted hover:text-ink disabled:opacity-30 px-1"><ArrowDown size={12} /></button>
          <button onClick={remove} className="text-brand hover:text-brand-700 px-1"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  );
}

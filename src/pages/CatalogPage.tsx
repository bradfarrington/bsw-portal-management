import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type {
  ProductCategory,
  ProductSection,
  ProductSectionItem,
  ProductSubcategory,
  TabType,
} from '../lib/types';
import { TAB_TYPES } from '../lib/types';
import { AppShell } from '../components/AppShell';
import { PageHeader } from '../components/PageHeader';
import { PhonePreview } from '../components/PhonePreview';
import { CatalogPreview } from '../preview/CatalogPreview';
import { Modal } from '../components/Modal';
import { ImageUpload } from '../components/ImageUpload';
import { EmptyState } from '../components/EmptyState';
import { CatalogSectionsEditor } from './CatalogSectionsEditor';

type Selected =
  | { kind: 'none' }
  | { kind: 'category'; id: string }
  | { kind: 'subcategory'; id: string };

export function CatalogPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Selected>({ kind: 'none' });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: categories = [] } = useQuery({
    queryKey: ['product_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as ProductCategory[];
    },
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['product_subcategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_subcategories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as ProductSubcategory[];
    },
  });

  const { data: sections = [] } = useQuery({
    queryKey: ['product_sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_sections')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as ProductSection[];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ['product_section_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_section_items')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as ProductSectionItem[];
    },
  });

  const childMap = useMemo(() => {
    const m = new Map<string | null, ProductSubcategory[]>();
    for (const s of subcategories) {
      const k = s.parent_subcategory_id;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(s);
    }
    return m;
  }, [subcategories]);

  const subsByCategory = useMemo(() => {
    const m = new Map<string, ProductSubcategory[]>();
    for (const s of subcategories) {
      if (s.parent_subcategory_id == null) {
        if (!m.has(s.category_id)) m.set(s.category_id, []);
        m.get(s.category_id)!.push(s);
      }
    }
    return m;
  }, [subcategories]);

  const [editingCategory, setEditingCategory] = useState<ProductCategory | 'new' | null>(null);
  const [editingSub, setEditingSub] = useState<
    | ProductSubcategory
    | { __new: true; category_id: string; parent_subcategory_id: string | null }
    | null
  >(null);

  function toggle(id: string) {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const previewCategoryId = selected.kind === 'category' ? selected.id : null;
  const previewSubId =
    selected.kind === 'subcategory' ? selected.id : null;
  const subParentCategoryId = previewSubId
    ? findRootCategoryId(subcategories, previewSubId)
    : null;

  return (
    <AppShell
      preview={
        <PhonePreview label="Mobile · Products">
          <CatalogPreview
            categories={categories}
            subcategories={subcategories}
            sections={sections}
            items={items}
            selectedCategoryId={previewCategoryId || subParentCategoryId}
            selectedSubcategoryId={previewSubId}
          />
        </PhonePreview>
      }
    >
      <PageHeader
        title="Product Catalog"
        description="Manage categories, subcategories, sections (Details / Styles / Hardware / Colours / Glass / Extras) and items."
        actions={
          <button onClick={() => setEditingCategory('new')} className="btn-primary">
            <Plus size={16} /> New category
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <div className="card p-2 max-h-[75vh] overflow-y-auto">
          {categories.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={FolderTree} title="No categories" />
            </div>
          ) : (
            <ul className="text-sm">
              {categories.map((c) => (
                <CategoryNode
                  key={c.id}
                  cat={c}
                  subs={subsByCategory.get(c.id) || []}
                  childMap={childMap}
                  expanded={expanded}
                  selected={selected}
                  onToggle={toggle}
                  onSelect={setSelected}
                  onEditCategory={(cc) => setEditingCategory(cc)}
                  onEditSub={(s) => setEditingSub(s)}
                  onAddSub={(parent) =>
                    setEditingSub({ __new: true, category_id: c.id, parent_subcategory_id: parent })
                  }
                />
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          {selected.kind === 'none' && (
            <EmptyState
              icon={FolderTree}
              title="Select a category or subcategory"
              description="Pick something from the tree to edit its sections and items."
            />
          )}
          {selected.kind === 'category' && (() => {
            const cat = categories.find((c) => c.id === selected.id);
            if (!cat) return null;
            return (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs text-muted uppercase tracking-wide">Category</div>
                    <div className="text-lg font-semibold">{cat.title}</div>
                    {cat.tagline && <div className="text-sm text-muted mt-0.5">{cat.tagline}</div>}
                  </div>
                  <button
                    onClick={() => setEditingCategory(cat)}
                    className="btn-secondary"
                  >
                    <Pencil size={14} /> Edit category
                  </button>
                </div>

                <div className="space-y-4">
                  <ImageUpload
                    label="Category image"
                    folder={`${cat.id}/category`}
                    baseName={cat.title}
                    value={cat.image_url}
                    onChange={async (url) => {
                      const { error } = await supabase
                        .from('product_categories')
                        .update({ image_url: url })
                        .eq('id', cat.id);
                      if (error) alert(error.message);
                      else qc.invalidateQueries({ queryKey: ['product_categories'] });
                    }}
                  />
                </div>
              </div>
            );
          })()}
          {selected.kind === 'subcategory' && (() => {
            const sub = subcategories.find((s) => s.id === selected.id);
            if (!sub) return null;
            return (
              <CatalogSectionsEditor
                target={{ kind: 'subcategory', id: sub.id, label: sub.title }}
                sections={sections.filter((s) => s.subcategory_id === sub.id)}
                items={items}
              />
            );
          })()}
        </div>
      </div>

      <CategoryEditor
        editing={editingCategory}
        onClose={() => setEditingCategory(null)}
        onSaved={() => qc.invalidateQueries({ queryKey: ['product_categories'] })}
      />

      <SubcategoryEditor
        editing={editingSub}
        categories={categories}
        subcategories={subcategories}
        onClose={() => setEditingSub(null)}
        onSaved={() => qc.invalidateQueries({ queryKey: ['product_subcategories'] })}
      />
    </AppShell>
  );
}

function findRootCategoryId(subs: ProductSubcategory[], subId: string): string | null {
  let cur = subs.find((s) => s.id === subId);
  while (cur && cur.parent_subcategory_id) {
    cur = subs.find((s) => s.id === cur!.parent_subcategory_id);
  }
  return cur?.category_id ?? null;
}

function CategoryNode({
  cat,
  subs,
  childMap,
  expanded,
  selected,
  onToggle,
  onSelect,
  onEditCategory,
  onEditSub,
  onAddSub,
}: {
  cat: ProductCategory;
  subs: ProductSubcategory[];
  childMap: Map<string | null, ProductSubcategory[]>;
  expanded: Set<string>;
  selected: Selected;
  onToggle: (id: string) => void;
  onSelect: (s: Selected) => void;
  onEditCategory: (c: ProductCategory) => void;
  onEditSub: (s: ProductSubcategory) => void;
  onAddSub: (parent: string | null) => void;
}) {
  const isOpen = expanded.has(cat.id);
  const isSel = selected.kind === 'category' && selected.id === cat.id;
  return (
    <li>
      <div
        className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer ${isSel ? 'bg-brand text-white' : 'hover:bg-soft'}`}
        onClick={() => onSelect({ kind: 'category', id: cat.id })}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(cat.id);
          }}
          className="w-5 h-5 grid place-items-center"
        >
          {subs.length > 0 ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3" />}
        </button>
        <span className="font-medium flex-1 truncate">{cat.title}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditCategory(cat);
          }}
          className="opacity-0 group-hover:opacity-100"
          title="Edit"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSub(null);
          }}
          className="opacity-0 group-hover:opacity-100"
          title="Add subcategory"
        >
          <Plus size={12} />
        </button>
      </div>
      {isOpen && subs.length > 0 && (
        <ul className="ml-4 border-l border-line">
          {subs.map((s) => (
            <SubNode
              key={s.id}
              sub={s}
              childMap={childMap}
              expanded={expanded}
              selected={selected}
              onToggle={onToggle}
              onSelect={onSelect}
              onEditSub={onEditSub}
              onAddSub={onAddSub}
              depth={1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function SubNode({
  sub,
  childMap,
  expanded,
  selected,
  onToggle,
  onSelect,
  onEditSub,
  onAddSub,
  depth,
}: {
  sub: ProductSubcategory;
  childMap: Map<string | null, ProductSubcategory[]>;
  expanded: Set<string>;
  selected: Selected;
  onToggle: (id: string) => void;
  onSelect: (s: Selected) => void;
  onEditSub: (s: ProductSubcategory) => void;
  onAddSub: (parent: string) => void;
  depth: number;
}) {
  const children = childMap.get(sub.id) || [];
  const isOpen = expanded.has(sub.id);
  const isSel = selected.kind === 'subcategory' && selected.id === sub.id;
  return (
    <li>
      <div
        className={`group flex items-center gap-1 pl-2 pr-2 py-1.5 rounded-lg cursor-pointer ${isSel ? 'bg-brand text-white' : 'hover:bg-soft'}`}
        style={{ paddingLeft: 8 + depth * 4 }}
        onClick={() => onSelect({ kind: 'subcategory', id: sub.id })}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(sub.id);
          }}
          className="w-5 h-5 grid place-items-center"
        >
          {children.length > 0 ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3" />}
        </button>
        <span className="flex-1 truncate text-[13px]">{sub.title}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditSub(sub);
          }}
          className="opacity-0 group-hover:opacity-100"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSub(sub.id);
          }}
          className="opacity-0 group-hover:opacity-100"
          title="Add nested subcategory"
        >
          <Plus size={12} />
        </button>
      </div>
      {isOpen && children.length > 0 && (
        <ul className="ml-4 border-l border-line">
          {children.map((c) => (
            <SubNode
              key={c.id}
              sub={c}
              childMap={childMap}
              expanded={expanded}
              selected={selected}
              onToggle={onToggle}
              onSelect={onSelect}
              onEditSub={onEditSub}
              onAddSub={onAddSub}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ── Category editor ───────────────────────────────────────
function CategoryEditor({
  editing,
  onClose,
  onSaved,
}: {
  editing: ProductCategory | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  type F = Omit<ProductCategory, 'sort_order'> & { sort_order: number };
  const empty: F = {
    id: '',
    title: '',
    image_url: null,
    tagline: null,
    hero_image_url: null,
    about: null,
    rating: null,
    reviews: null,
    completed: null,
    price_label: 'Price on Request',
    gallery_album_name: null,
    sort_order: 0,
  };
  const [form, setForm] = useState<F>(empty);

  useEffect(() => {
    if (editing && editing !== 'new') setForm({ ...editing });
    else if (editing === 'new') setForm(empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const isNew = editing === 'new';
  const open = editing !== null;

  async function save() {
    try {
      if (isNew) {
        const { error } = await supabase.from('product_categories').insert(form);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_categories').update(form).eq('id', form.id);
        if (error) throw error;
      }
      onSaved();
      onClose();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function remove() {
    if (!confirm(`Delete category "${form.title}"? This will fail if it has subcategories.`)) return;
    try {
      const { error } = await supabase.from('product_categories').delete().eq('id', form.id);
      if (error) throw error;
      onSaved();
      onClose();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'New category' : `Edit · ${form.title}`} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">ID (slug)</label>
            <input
              className="input"
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
              required
              disabled={!isNew}
              placeholder="windows"
            />
          </div>
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Tagline</label>
            <input className="input" value={form.tagline || ''} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value || null }))} />
          </div>
          <div>
            <label className="label">Price label</label>
            <input className="input" value={form.price_label || ''} onChange={(e) => setForm((f) => ({ ...f, price_label: e.target.value || null }))} />
          </div>
          <div>
            <label className="label">Rating</label>
            <input className="input" value={form.rating || ''} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value || null }))} placeholder="4.9" />
          </div>
          <div>
            <label className="label">Reviews</label>
            <input className="input" value={form.reviews || ''} onChange={(e) => setForm((f) => ({ ...f, reviews: e.target.value || null }))} placeholder="699" />
          </div>
          <div>
            <label className="label">Completed</label>
            <input className="input" value={form.completed || ''} onChange={(e) => setForm((f) => ({ ...f, completed: e.target.value || null }))} placeholder="1,200+" />
          </div>
          <div>
            <label className="label">Gallery album name</label>
            <input className="input" value={form.gallery_album_name || ''} onChange={(e) => setForm((f) => ({ ...f, gallery_album_name: e.target.value || null }))} />
          </div>
          <div>
            <label className="label">Sort order</label>
            <input
              type="number"
              className="input"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>
        <div>
          <label className="label">About</label>
          <textarea
            className="input min-h-[100px]"
            value={form.about || ''}
            onChange={(e) => setForm((f) => ({ ...f, about: e.target.value || null }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ImageUpload
            label="Card image"
            folder={`${form.id || 'misc'}/category`}
            baseName={form.title}
            value={form.image_url}
            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
          />
          <ImageUpload
            label="Hero image"
            folder={`${form.id || 'misc'}/category`}
            baseName={`${form.title}-hero`}
            value={form.hero_image_url}
            onChange={(url) => setForm((f) => ({ ...f, hero_image_url: url }))}
          />
        </div>
        <div className="flex justify-between pt-2">
          <div>
            {!isNew && (
              <button type="button" onClick={remove} className="btn-danger">
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ── Subcategory editor ─────────────────────────────────────
function SubcategoryEditor({
  editing,
  categories,
  subcategories,
  onClose,
  onSaved,
}: {
  editing:
    | ProductSubcategory
    | { __new: true; category_id: string; parent_subcategory_id: string | null }
    | null;
  categories: ProductCategory[];
  subcategories: ProductSubcategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  type F = Omit<ProductSubcategory, 'sort_order'> & { sort_order: number };
  const empty: F = {
    id: '',
    category_id: '',
    parent_subcategory_id: null,
    title: '',
    card_image_url: null,
    hero_image_url: null,
    tagline: null,
    about: null,
    rating: null,
    reviews: null,
    completed: null,
    price_label: 'Price on Request',
    gallery_album_name: null,
    brochure_titles: [],
    sort_order: 0,
  };
  const [form, setForm] = useState<F>(empty);
  const isNew = !!(editing && '__new' in editing);

  useEffect(() => {
    if (!editing) return;
    if ('__new' in editing) {
      setForm({ ...empty, category_id: editing.category_id, parent_subcategory_id: editing.parent_subcategory_id });
    } else {
      setForm({ ...editing, brochure_titles: editing.brochure_titles || [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const open = editing !== null;

  async function save() {
    try {
      if (isNew) {
        const { error } = await supabase.from('product_subcategories').insert(form);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_subcategories').update(form).eq('id', form.id);
        if (error) throw error;
      }
      onSaved();
      onClose();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function remove() {
    if (!confirm(`Delete subcategory "${form.title}"?`)) return;
    try {
      const { error } = await supabase.from('product_subcategories').delete().eq('id', form.id);
      if (error) throw error;
      onSaved();
      onClose();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  const possibleParents = subcategories.filter((s) => s.category_id === form.category_id && s.id !== form.id);

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'New subcategory' : `Edit · ${form.title}`} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">ID (slug)</label>
            <input
              className="input"
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
              required
              disabled={!isNew}
            />
          </div>
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              required
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Parent subcategory (optional)</label>
            <select
              className="input"
              value={form.parent_subcategory_id || ''}
              onChange={(e) => setForm((f) => ({ ...f, parent_subcategory_id: e.target.value || null }))}
            >
              <option value="">— none (top level) —</option>
              {possibleParents.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tagline</label>
            <input className="input" value={form.tagline || ''} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value || null }))} />
          </div>
          <div>
            <label className="label">Price label</label>
            <input className="input" value={form.price_label || ''} onChange={(e) => setForm((f) => ({ ...f, price_label: e.target.value || null }))} />
          </div>
          <div>
            <label className="label">Rating</label>
            <input className="input" value={form.rating || ''} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value || null }))} />
          </div>
          <div>
            <label className="label">Reviews</label>
            <input className="input" value={form.reviews || ''} onChange={(e) => setForm((f) => ({ ...f, reviews: e.target.value || null }))} />
          </div>
          <div>
            <label className="label">Completed</label>
            <input className="input" value={form.completed || ''} onChange={(e) => setForm((f) => ({ ...f, completed: e.target.value || null }))} />
          </div>
          <div>
            <label className="label">Gallery album</label>
            <input className="input" value={form.gallery_album_name || ''} onChange={(e) => setForm((f) => ({ ...f, gallery_album_name: e.target.value || null }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Brochure titles (one per line, must match brochure titles exactly)</label>
            <textarea
              className="input min-h-[60px]"
              value={(form.brochure_titles || []).join('\n')}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  brochure_titles: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                }))
              }
            />
          </div>
          <div>
            <label className="label">Sort order</label>
            <input
              type="number"
              className="input"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>
        <div>
          <label className="label">About</label>
          <textarea
            className="input min-h-[100px]"
            value={form.about || ''}
            onChange={(e) => setForm((f) => ({ ...f, about: e.target.value || null }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ImageUpload
            label="Card image"
            folder={`${form.category_id || 'misc'}/${form.id || 'sub'}`}
            baseName={form.title}
            value={form.card_image_url}
            onChange={(url) => setForm((f) => ({ ...f, card_image_url: url }))}
          />
          <ImageUpload
            label="Hero image"
            folder={`${form.category_id || 'misc'}/${form.id || 'sub'}`}
            baseName={`${form.title}-hero`}
            value={form.hero_image_url}
            onChange={(url) => setForm((f) => ({ ...f, hero_image_url: url }))}
          />
        </div>
        <div className="flex justify-between pt-2">
          <div>
            {!isNew && (
              <button type="button" onClick={remove} className="btn-danger">
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export { TAB_TYPES };
export type { TabType };

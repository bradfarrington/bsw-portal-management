import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PackageSearch, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { DisplayCategory, DisplayProduct } from '../lib/types';
import { AppShell } from '../components/AppShell';
import { PageHeader } from '../components/PageHeader';
import { PhonePreview } from '../components/PhonePreview';
import { DisplayCategoriesPreview } from '../preview/DisplayCategoriesPreview';
import { Modal } from '../components/Modal';
import { ImageUpload, MultiImageUpload } from '../components/ImageUpload';
import { EmptyState } from '../components/EmptyState';

type ProductForm = {
  category_id: string;
  name: string;
  price: string;
  old_price: string;
  description: string;
  url: string | null;
  images: string[];
  width: string;
  height: string;
  colour_internal: string;
  colour_external: string;
  glazed: boolean;
  additional_info: string[];
};

const emptyProduct: ProductForm = {
  category_id: '',
  name: '',
  price: '',
  old_price: '',
  description: '',
  url: null,
  images: [],
  width: '',
  height: '',
  colour_internal: '',
  colour_external: '',
  glazed: false,
  additional_info: [],
};

export function DisplayPage() {
  const qc = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<DisplayProduct | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['display_categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('display_categories').select('*').order('id');
      if (error) throw error;
      return data as DisplayCategory[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ['display_products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('display_products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DisplayProduct[];
    },
  });

  const addCategory = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('display_categories').insert({ id: name });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['display_categories'] });
      setNewCategoryName('');
    },
    onError: (e) => alert((e as Error).message),
  });

  const removeCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('display_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['display_categories'] }),
    onError: (e) => alert((e as Error).message),
  });

  const saveProduct = useMutation({
    mutationFn: async () => {
      const payload = {
        category_id: productForm.category_id,
        name: productForm.name,
        price: productForm.price || null,
        old_price: productForm.old_price || null,
        description: productForm.description || null,
        url: productForm.url,
        images: productForm.images,
        width: productForm.width || null,
        height: productForm.height || null,
        colour_internal: productForm.colour_internal || null,
        colour_external: productForm.colour_external || null,
        glazed: productForm.glazed,
        additional_info: productForm.additional_info,
      };
      if (editingProduct) {
        const { error } = await supabase.from('display_products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('display_products').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['display_products'] });
      setEditingProduct(null);
      setCreatingProduct(false);
      setProductForm(emptyProduct);
    },
    onError: (e) => alert((e as Error).message),
  });

  const removeProduct = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('display_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['display_products'] }),
  });

  function startEditProduct(p: DisplayProduct) {
    setEditingProduct(p);
    setProductForm({
      category_id: p.category_id,
      name: p.name,
      price: p.price || '',
      old_price: p.old_price || '',
      description: p.description || '',
      url: p.url,
      images: p.images || [],
      width: p.width || '',
      height: p.height || '',
      colour_internal: p.colour_internal || '',
      colour_external: p.colour_external || '',
      glazed: p.glazed,
      additional_info: p.additional_info || [],
    });
  }

  function startCreateProduct() {
    setEditingProduct(null);
    setProductForm({ ...emptyProduct, category_id: selectedCategory || '' });
    setCreatingProduct(true);
  }

  return (
    <AppShell
      preview={
        <PhonePreview label={selectedCategory ? `Mobile · ${selectedCategory}` : 'Mobile · Ex-Display'}>
          <DisplayCategoriesPreview
            categories={categories}
            products={products}
            selectedCategoryId={selectedCategory}
          />
        </PhonePreview>
      }
    >
      <PageHeader
        title="Ex-Display"
        description="Manage on-floor sale categories and products."
        actions={
          <button onClick={startCreateProduct} className="btn-primary" disabled={categories.length === 0}>
            <Plus size={16} /> New product
          </button>
        }
      />

      <div className="card mb-6">
        <h2 className="font-semibold mb-3">Categories</h2>
        <div className="flex gap-2 mb-4">
          <input
            className="input"
            placeholder="New category name (e.g. Bi-Fold Doors)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newCategoryName.trim()) addCategory.mutate(newCategoryName.trim());
            }}
          />
          <button
            onClick={() => newCategoryName.trim() && addCategory.mutate(newCategoryName.trim())}
            className="btn-primary"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${selectedCategory === null ? 'bg-brand text-white border-brand' : 'bg-white border-line'}`}
          >
            All ({products.length})
          </button>
          {categories.map((c) => {
            const count = products.filter((p) => p.category_id === c.id).length;
            return (
              <span
                key={c.id}
                className={`inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full text-xs font-medium border ${selectedCategory === c.id ? 'bg-brand text-white border-brand' : 'bg-white border-line'}`}
              >
                <button onClick={() => setSelectedCategory(c.id)}>
                  {c.id} ({count})
                </button>
                <button
                  onClick={() => {
                    if (count > 0) {
                      alert('Move or delete products in this category first.');
                      return;
                    }
                    if (confirm(`Delete category "${c.id}"?`)) removeCategory.mutate(c.id);
                  }}
                  className="ml-1 w-5 h-5 grid place-items-center rounded-full hover:bg-black/10"
                >
                  <Trash2 size={11} />
                </button>
              </span>
            );
          })}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {(() => {
          const list = selectedCategory ? products.filter((p) => p.category_id === selectedCategory) : products;
          if (list.length === 0) {
            return (
              <div className="p-6">
                <EmptyState icon={PackageSearch} title="No products" description="Click 'New product' to add one." />
              </div>
            );
          }
          return (
            <table className="w-full text-sm">
              <thead className="bg-soft text-xs text-muted uppercase">
                <tr>
                  <th className="text-left px-4 py-3 w-20">Image</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3 w-32">Price</th>
                  <th className="text-right px-4 py-3 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="table-row border-t border-line">
                    <td className="px-4 py-2">
                      <div className="w-14 h-14 rounded-md bg-soft overflow-hidden">
                        {p.url && <img src={p.url} alt="" className="w-full h-full object-cover" />}
                      </div>
                    </td>
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2 text-muted">{p.category_id}</td>
                    <td className="px-4 py-2">
                      <span className="text-brand font-semibold">{p.price}</span>
                      {p.old_price && <span className="text-muted line-through ml-2">{p.old_price}</span>}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => startEditProduct(p)} className="btn-ghost px-2"><Pencil size={14} /></button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${p.name}"?`)) removeProduct.mutate(p.id);
                        }}
                        className="btn-ghost px-2 text-brand"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>

      <Modal
        wide
        open={creatingProduct || !!editingProduct}
        onClose={() => {
          setCreatingProduct(false);
          setEditingProduct(null);
          setProductForm(emptyProduct);
        }}
        title={editingProduct ? `Edit · ${editingProduct.name}` : 'New product'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveProduct.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={productForm.category_id}
                onChange={(e) => setProductForm((f) => ({ ...f, category_id: e.target.value }))}
                required
              >
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={productForm.name}
                onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Price</label>
              <input
                className="input"
                value={productForm.price}
                onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="£750"
              />
            </div>
            <div>
              <label className="label">Old price (strikethrough)</label>
              <input
                className="input"
                value={productForm.old_price}
                onChange={(e) => setProductForm((f) => ({ ...f, old_price: e.target.value }))}
                placeholder="£3350"
              />
            </div>
            <div>
              <label className="label">Width</label>
              <input
                className="input"
                value={productForm.width}
                onChange={(e) => setProductForm((f) => ({ ...f, width: e.target.value }))}
                placeholder="3570mm"
              />
            </div>
            <div>
              <label className="label">Height</label>
              <input
                className="input"
                value={productForm.height}
                onChange={(e) => setProductForm((f) => ({ ...f, height: e.target.value }))}
                placeholder="2443mm"
              />
            </div>
            <div>
              <label className="label">Internal colour</label>
              <input
                className="input"
                value={productForm.colour_internal}
                onChange={(e) => setProductForm((f) => ({ ...f, colour_internal: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">External colour</label>
              <input
                className="input"
                value={productForm.colour_external}
                onChange={(e) => setProductForm((f) => ({ ...f, colour_external: e.target.value }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={productForm.glazed}
              onChange={(e) => setProductForm((f) => ({ ...f, glazed: e.target.checked }))}
              className="rounded text-brand focus:ring-brand"
            />
            Glazed
          </label>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px]"
              value={productForm.description}
              onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Additional info (one per line)</label>
            <textarea
              className="input min-h-[80px]"
              value={productForm.additional_info.join('\n')}
              onChange={(e) =>
                setProductForm((f) => ({
                  ...f,
                  additional_info: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                }))
              }
              placeholder="Toughened Glass Included&#10;Frame come in two parts and needs building"
            />
          </div>
          <ImageUpload
            label="Main image"
            folder={`display/${productForm.category_id || 'misc'}`}
            baseName={productForm.name}
            value={productForm.url}
            onChange={(url) => setProductForm((f) => ({ ...f, url: url, images: f.images.length === 0 && url ? [url] : f.images }))}
          />
          <MultiImageUpload
            label="Gallery"
            folder={`display/${productForm.category_id || 'misc'}`}
            baseName={productForm.name}
            value={productForm.images}
            onChange={(images) => setProductForm((f) => ({ ...f, images }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setCreatingProduct(false);
                setEditingProduct(null);
                setProductForm(emptyProduct);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={saveProduct.isPending} className="btn-primary">
              {saveProduct.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

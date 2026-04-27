import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Brochure } from '../lib/types';
import { AppShell } from '../components/AppShell';
import { PageHeader } from '../components/PageHeader';
import { PhonePreview } from '../components/PhonePreview';
import { BrochuresPreview } from '../preview/BrochuresPreview';
import { Modal } from '../components/Modal';
import { ImageUpload } from '../components/ImageUpload';
import { PdfUpload } from '../components/PdfUpload';
import { EmptyState } from '../components/EmptyState';

type Form = {
  title: string;
  category: string;
  is_popular: boolean;
  image: string | null;
  link: string | null;
  filename: string | null;
};

const empty: Form = { title: '', category: '', is_popular: false, image: null, link: null, filename: null };

export function BrochuresPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Brochure | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const { data: brochures = [], isLoading } = useQuery({
    queryKey: ['brochures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brochures')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Brochure[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from('brochures').update(form).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('brochures').insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brochures'] });
      setEditing(null);
      setCreating(false);
      setForm(empty);
    },
    onError: (e) => alert((e as Error).message),
  });

  const togglePopular = useMutation({
    mutationFn: async (b: Brochure) => {
      const { error } = await supabase.from('brochures').update({ is_popular: !b.is_popular }).eq('id', b.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brochures'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('brochures').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brochures'] }),
  });

  function startEdit(b: Brochure) {
    setEditing(b);
    setForm({
      title: b.title,
      category: b.category || '',
      is_popular: b.is_popular,
      image: b.image,
      link: b.link,
      filename: b.filename,
    });
  }

  function startCreate() {
    setEditing(null);
    setForm(empty);
    setCreating(true);
  }

  // Build preview data — show edits live as you type
  const previewBrochures: Brochure[] = brochures.map((b) =>
    editing && b.id === editing.id
      ? { ...b, title: form.title, category: form.category, is_popular: form.is_popular, image: form.image, link: form.link }
      : b,
  );
  if (creating && form.title) {
    previewBrochures.unshift({
      id: '__preview__',
      title: form.title,
      category: form.category || null,
      is_popular: form.is_popular,
      image: form.image,
      link: form.link,
      filename: form.filename,
      created_at: new Date().toISOString(),
    });
  }

  return (
    <AppShell preview={<PhonePreview label="Mobile · Brochures"><BrochuresPreview brochures={previewBrochures} /></PhonePreview>}>
      <PageHeader
        title="Brochures"
        description="Upload PDFs and cover images. Changes appear instantly in the mobile app."
        actions={
          <button onClick={startCreate} className="btn-primary">
            <Plus size={16} /> New brochure
          </button>
        }
      />

      {isLoading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : brochures.length === 0 ? (
        <EmptyState icon={BookOpen} title="No brochures yet" description="Add your first brochure to get started." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-soft text-xs text-muted uppercase">
              <tr>
                <th className="text-left px-4 py-3 w-20">Cover</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3 w-24">Popular</th>
                <th className="text-right px-4 py-3 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brochures.map((b) => (
                <tr key={b.id} className="table-row border-t border-line">
                  <td className="px-4 py-2">
                    <div className="w-12 h-16 rounded-md bg-soft overflow-hidden">
                      {b.image && <img src={b.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                  </td>
                  <td className="px-4 py-2 font-medium">{b.title}</td>
                  <td className="px-4 py-2 text-muted">{b.category || '—'}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => togglePopular.mutate(b)}
                      className={b.is_popular ? 'text-brand' : 'text-muted hover:text-brand'}
                      title={b.is_popular ? 'Popular' : 'Mark popular'}
                    >
                      <Star size={16} fill={b.is_popular ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => startEdit(b)} className="btn-ghost px-2"><Pencil size={14} /></button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${b.title}"?`)) remove.mutate(b.id);
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
        </div>
      )}

      <Modal
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
          setForm(empty);
        }}
        title={editing ? `Edit · ${editing.title}` : 'New brochure'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-4"
        >
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
            <input
              className="input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="e.g. Doors, Windows, Glass"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_popular}
              onChange={(e) => setForm((f) => ({ ...f, is_popular: e.target.checked }))}
              className="rounded text-brand focus:ring-brand"
            />
            Show in "Most Popular" row
          </label>
          <ImageUpload
            label="Cover image"
            bucket="brochures"
            folder="covers"
            baseName={form.title}
            value={form.image}
            onChange={(url) => setForm((f) => ({ ...f, image: url }))}
            aspect="aspect-[3/4]"
          />
          <PdfUpload
            label="PDF file"
            folder="files"
            baseName={form.title}
            value={form.link}
            onChange={(url) => setForm((f) => ({ ...f, link: url }))}
            onFilenameChange={(fn) => setForm((f) => ({ ...f, filename: fn }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setEditing(null);
                setForm(empty);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={save.isPending} className="btn-primary">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadFile, type Bucket } from '../lib/storage';

export function ImageUpload({
  value,
  onChange,
  bucket = 'product-assets',
  folder,
  label,
  baseName,
  aspect = 'aspect-video',
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  bucket?: Bucket;
  folder: string;
  label?: string;
  baseName?: string;
  aspect?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await uploadFile(bucket, folder, file, baseName);
      onChange(url);
    } catch (err) {
      alert(`Upload failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className={`relative ${aspect} w-full rounded-xl overflow-hidden bg-white border border-dashed border-line group`}>
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 hover:bg-white shadow"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={busy}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-sm text-muted hover:text-brand transition"
          >
            <Upload size={18} />
            {busy ? 'Uploading…' : 'Click to upload image'}
          </button>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handle}
        />
      </div>
    </div>
  );
}

export function MultiImageUpload({
  value,
  onChange,
  bucket = 'product-assets',
  folder,
  label,
  baseName,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket?: Bucket;
  folder: string;
  label?: string;
  baseName?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const uploaded = await Promise.all(
        files.map((f) => uploadFile(bucket, folder, f, baseName)),
      );
      onChange([...value, ...uploaded.map((u) => u.url)]);
    } catch (err) {
      alert(`Upload failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {value.map((url, i) => (
          <div key={url + i} className="relative aspect-square rounded-xl overflow-hidden bg-soft border border-line group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 text-white text-xs">
              <button type="button" onClick={() => remove(i)} className="px-2 py-1 bg-white/20 rounded">Remove</button>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, i - 1)} className="px-2 py-1 bg-white/20 rounded">←</button>
                <button type="button" onClick={() => move(i, i + 1)} className="px-2 py-1 bg-white/20 rounded">→</button>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="aspect-square rounded-xl border border-dashed border-line bg-soft text-muted hover:text-brand flex flex-col items-center justify-center gap-1 text-xs"
        >
          <Upload size={18} />
          {busy ? 'Uploading…' : 'Add image(s)'}
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={handle} />
    </div>
  );
}

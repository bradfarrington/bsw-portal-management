import { useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { uploadFile } from '../lib/storage';

export function PdfUpload({
  value,
  onChange,
  folder,
  label,
  baseName,
  onFilenameChange,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
  baseName?: string;
  onFilenameChange?: (filename: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { url } = await uploadFile('brochures', folder, file, baseName);
      onChange(url);
      if (onFilenameChange) onFilenameChange(file.name);
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
      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-line bg-soft">
          <FileText size={18} className="text-brand shrink-0" />
          <a href={value} target="_blank" rel="noreferrer" className="text-sm text-ink truncate flex-1 hover:underline">
            {value.split('/').pop()}
          </a>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-muted hover:text-brand"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-line bg-soft text-sm text-muted hover:text-brand"
        >
          <Upload size={16} />
          {busy ? 'Uploading…' : 'Upload PDF'}
        </button>
      )}
      <input ref={ref} type="file" accept="application/pdf" className="hidden" onChange={handle} />
    </div>
  );
}

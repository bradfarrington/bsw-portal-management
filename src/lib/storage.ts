import { supabase } from './supabase';

export type Bucket = 'brochures' | 'product-assets';

export function publicUrl(bucket: Bucket, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 7);
}

export async function uploadFile(
  bucket: Bucket,
  folder: string,
  file: File,
  baseName?: string,
): Promise<{ path: string; url: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const base = slugify(baseName || file.name.replace(/\.[^.]+$/, '') || 'file');
  const path = `${folder}/${base}-${shortId()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return { path, url: publicUrl(bucket, path) };
}

export async function removeByPublicUrl(bucket: Bucket, url: string): Promise<void> {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  await supabase.storage.from(bucket).remove([path]);
}

import type { ReactNode } from 'react';

export function PhonePreview({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 sticky top-6">
      {label && <div className="text-xs uppercase tracking-wide text-muted">{label}</div>}
      <div className="phone-frame">
        <div className="phone-screen">{children}</div>
      </div>
      <div className="text-xs text-muted">Live preview · pulls from Supabase</div>
    </div>
  );
}

export function PhoneStatusBar() {
  return (
    <div className="absolute top-0 left-0 right-0 h-10 z-10 pointer-events-none flex items-end justify-between px-6 pb-1 text-[11px] font-semibold text-ink">
      <span>9:41</span>
      <span className="opacity-0">notch</span>
      <span>100%</span>
    </div>
  );
}

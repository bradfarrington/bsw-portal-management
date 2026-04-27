import { Bell } from 'lucide-react';

export function PushPreview({ title, body }: { title: string; body: string }) {
  return (
    <div className="h-full bg-gradient-to-b from-slate-700 to-slate-900 p-3 pt-16">
      <div className="text-white text-center text-sm font-light mb-1">9:41</div>
      <div className="text-white/80 text-center text-xs mb-6">Wednesday, 16 April</div>
      <div className="bg-white/95 backdrop-blur rounded-2xl p-3 shadow-xl">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand text-white grid place-items-center shrink-0">
            <Bell size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-[11px] font-semibold text-ink truncate">BSW Portal</div>
              <div className="text-[10px] text-muted">now</div>
            </div>
            <div className="text-xs font-semibold text-ink mt-0.5 leading-tight">{title || 'Notification title'}</div>
            <div className="text-[11px] text-ink/80 leading-snug mt-0.5 whitespace-pre-line">
              {body || 'Notification body shown here'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

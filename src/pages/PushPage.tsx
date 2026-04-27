import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AppShell } from '../components/AppShell';
import { PageHeader } from '../components/PageHeader';
import { PhonePreview } from '../components/PhonePreview';
import { PushPreview } from '../preview/PushPreview';

export function PushPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const { data: tokenCount } = useQuery({
    queryKey: ['push_tokens_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('push_tokens')
        .select('expo_push_token', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  async function send() {
    if (!title.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: { title, body },
      });
      if (error) throw error;
      setResult(`Sent to ${data?.recipients ?? '?'} devices.`);
      setTitle('');
      setBody('');
    } catch (e) {
      setResult(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell preview={<PhonePreview label="Mobile · Notification"><PushPreview title={title} body={body} /></PhonePreview>}>
      <PageHeader
        title="Push Notifications"
        description={`Send a push to all devices using the BSW Portal app. Currently ${tokenCount ?? '…'} registered devices.`}
      />
      <div className="card max-w-xl space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New collection arrived"
            maxLength={80}
          />
        </div>
        <div>
          <label className="label">Body</label>
          <textarea
            className="input min-h-[100px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Check out our latest ex-display deals."
            maxLength={200}
          />
        </div>
        {result && (
          <div className={`text-sm ${result.startsWith('Error') ? 'text-brand' : 'text-green-600'}`}>{result}</div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => {
              if (!confirm(`Send notification to ${tokenCount} device(s)?`)) return;
              send();
            }}
            disabled={busy || !title.trim() || !tokenCount}
            className="btn-primary"
          >
            {busy ? <>Sending…</> : (<><Send size={14} /> Send to {tokenCount ?? 0} devices</>)}
          </button>
        </div>
        {!tokenCount && (
          <div className="flex items-start gap-2 text-xs text-muted">
            <Bell size={14} />
            <span>No push tokens registered yet. Tokens are added automatically when the mobile app is opened.</span>
          </div>
        )}
      </div>
    </AppShell>
  );
}

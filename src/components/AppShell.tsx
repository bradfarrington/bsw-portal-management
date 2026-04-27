import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function AppShell({
  children,
  preview,
}: {
  children: ReactNode;
  preview?: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-6 p-6 max-w-[1600px] mx-auto">
          <div className="min-w-0">{children}</div>
          {preview && (
            <div className="hidden xl:flex justify-center pt-2">{preview}</div>
          )}
        </div>
      </main>
    </div>
  );
}

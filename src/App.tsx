import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { queryClient } from './lib/queryClient';
import { LoginPage } from './components/LoginPage';
import { BrochuresPage } from './pages/BrochuresPage';
import { DisplayPage } from './pages/DisplayPage';
import { CatalogPage } from './pages/CatalogPage';
import { PushPage } from './pages/PushPage';

function Gate() {
  const { session, loading, isAdmin, adminCheckError, signOut, user } = useAuth();
  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted text-sm">Loading…</div>;
  }
  if (!session) return <LoginPage />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center bg-bg p-6">
        <div className="card max-w-lg text-center">
          <div className="text-lg font-semibold mb-2">Access denied</div>
          {adminCheckError ? (
            <>
              <p className="text-sm text-muted mb-2">
                Couldn't verify your admin status. The <code className="mx-1 px-1.5 py-0.5 bg-soft rounded">admin_users</code> lookup returned an error:
              </p>
              <pre className="text-xs text-brand bg-soft p-3 rounded text-left whitespace-pre-wrap mb-4">{adminCheckError}</pre>
            </>
          ) : (
            <p className="text-sm text-muted mb-4">
              Signed in as <span className="text-ink font-medium">{user?.email}</span> but this account isn't in the
              <code className="mx-1 px-1.5 py-0.5 bg-soft rounded">admin_users</code> table.
            </p>
          )}
          <button onClick={signOut} className="btn-secondary">Sign out</button>
        </div>
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/brochures" replace />} />
      <Route path="/brochures" element={<BrochuresPage />} />
      <Route path="/display" element={<DisplayPage />} />
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/push" element={<PushPage />} />
      <Route path="*" element={<Navigate to="/brochures" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Gate />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

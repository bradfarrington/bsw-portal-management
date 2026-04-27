import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  PackageSearch,
  LayoutGrid,
  Bell,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';

const links = [
  { to: '/brochures', label: 'Brochures', icon: BookOpen },
  { to: '/display', label: 'Ex-Display', icon: PackageSearch },
  { to: '/catalog', label: 'Product Catalog', icon: LayoutGrid },
  { to: '/push', label: 'Push Notifications', icon: Bell },
];

export function Sidebar() {
  const { user, signOut } = useAuth();

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-line flex flex-col">
      <div className="p-5 border-b border-line">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand text-white grid place-items-center font-bold">
            B
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-sm">BSW Portal</div>
            <div className="text-xs text-muted">Management</div>
          </div>
        </div>
      </div>
      <nav className="p-3 flex-1 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition',
                isActive
                  ? 'bg-brand text-white'
                  : 'text-ink hover:bg-soft',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-line">
        <div className="px-2 py-2 text-xs text-muted truncate" title={user?.email ?? ''}>
          {user?.email}
        </div>
        <button onClick={signOut} className="btn-ghost w-full justify-start">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}

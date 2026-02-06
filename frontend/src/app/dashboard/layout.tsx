'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Analýza útoků', path: '/dashboard/attacks', icon: '🎯' },
  { name: 'Firewall', path: '/dashboard/firewall', icon: '🛡️' },
  { name: 'Geoblokace', path: '/dashboard/geoblocks', icon: '🌍' },
  { name: 'Porty', path: '/dashboard/ports', icon: '🔌' },
  { name: 'Uživatelé', path: '/dashboard/users', icon: '👥', ownerOnly: true },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    api.clearToken();
    clearAuth();
    router.push('/');
  };

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card-bg border-r border-border-color">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary-blue">Anti-DDoS</h1>
          <p className="text-sm text-text-secondary mt-1">{user.email}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-primary-blue bg-opacity-20 text-primary-blue text-xs rounded-full">
            {user.role === 'owner' ? 'Owner' : 'Subuser'}
          </span>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => {
            if (item.ownerOnly && user.role !== 'owner') return null;

            const isActive = pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive
                    ? 'bg-primary-blue bg-opacity-10 text-primary-blue border-r-2 border-primary-blue'
                    : 'text-text-secondary hover:bg-card-hover hover:text-text-primary'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={handleLogout}
            className="w-full bg-danger bg-opacity-10 hover:bg-opacity-20 text-danger py-2 rounded-lg transition-colors"
          >
            Odhlásit se
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}

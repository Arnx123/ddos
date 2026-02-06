'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { IPAddress } from '@/types';
import { useAuthStore } from '@/lib/store';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [ips, setIps] = useState<IPAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIp, setNewIp] = useState({ ip_address: '', label: '' });

  useEffect(() => {
    loadIps();
  }, []);

  const loadIps = async () => {
    try {
      const data = await api.getIps();
      setIps(data);
    } catch (error) {
      console.error('Failed to load IPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIp = async () => {
    try {
      await api.createIp(newIp);
      setNewIp({ ip_address: '', label: '' });
      setShowAddModal(false);
      loadIps();
    } catch (error: any) {
      alert(error.message || 'Nepodařilo se přidat IP adresu');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'inactive':
        return 'bg-warning';
      case 'blocked':
        return 'bg-danger';
      default:
        return 'bg-text-secondary';
    }
  };

  const getFirewallModeColor = (mode: string) => {
    switch (mode) {
      case 'accept':
        return 'text-success';
      case 'filter':
        return 'text-warning';
      case 'drop':
        return 'text-danger';
      default:
        return 'text-text-secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-text-secondary">Načítání...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-2">Přehled vašich IP adres</p>
        </div>
        {user?.role === 'owner' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-blue hover:bg-primary-blue-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            + Přidat IP
          </button>
        )}
      </div>

      {ips.length === 0 ? (
        <div className="bg-card-bg rounded-lg p-12 text-center">
          <p className="text-text-secondary text-lg">
            Zatím nemáte žádné IP adresy
          </p>
          {user?.role === 'owner' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 bg-primary-blue hover:bg-primary-blue-hover text-white px-6 py-2 rounded-lg transition-colors"
            >
              Přidat první IP
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ips.map((ip) => (
            <div
              key={ip.id}
              onClick={() => router.push(`/dashboard/ip/${ip.id}`)}
              className="bg-card-bg hover:bg-card-hover rounded-lg p-6 cursor-pointer transition-all border border-border-color hover:border-primary-blue"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text-primary mb-1">
                    {ip.ip_address}
                  </h3>
                  {ip.label && (
                    <p className="text-text-secondary text-sm">{ip.label}</p>
                  )}
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(ip.status)}`} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Status:</span>
                  <span className="text-text-primary text-sm capitalize">
                    {ip.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Firewall:</span>
                  <span
                    className={`text-sm font-semibold uppercase ${getFirewallModeColor(
                      ip.firewall_mode
                    )}`}
                  >
                    {ip.firewall_mode}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border-color">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/attacks?ip=${ip.id}`);
                  }}
                  className="w-full text-primary-blue hover:text-primary-blue-hover text-sm font-medium transition-colors"
                >
                  Zobrazit útoky →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add IP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              Přidat IP adresu
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  IP adresa *
                </label>
                <input
                  type="text"
                  value={newIp.ip_address}
                  onChange={(e) =>
                    setNewIp({ ...newIp, ip_address: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                  placeholder="192.168.1.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Označení
                </label>
                <input
                  type="text"
                  value={newIp.label}
                  onChange={(e) => setNewIp({ ...newIp, label: e.target.value })}
                  className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                  placeholder="Web server"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-card-hover hover:bg-border-color text-text-primary py-3 rounded-lg font-semibold transition-colors"
              >
                Zrušit
              </button>
              <button
                onClick={handleAddIp}
                className="flex-1 bg-primary-blue hover:bg-primary-blue-hover text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Přidat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

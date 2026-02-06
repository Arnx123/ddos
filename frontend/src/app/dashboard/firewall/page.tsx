'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { IPAddress } from '@/types';
import { useAuthStore } from '@/lib/store';

const FIREWALL_MODES = [
  {
    mode: 'accept',
    title: 'Accept',
    description: 'Povolit veškerý provoz, kromě explicitně zakázaných pravidel',
    icon: '✅',
    color: 'success',
  },
  {
    mode: 'filter',
    title: 'Filter',
    description: 'Filtrovat provoz podle definovaných pravidel',
    icon: '⚠️',
    color: 'warning',
  },
  {
    mode: 'drop',
    title: 'Drop',
    description: 'Blokovat veškerý provoz, kromě explicitně povolených pravidel',
    icon: '🛑',
    color: 'danger',
  },
];

export default function FirewallPage() {
  const user = useAuthStore((state) => state.user);
  const [ips, setIps] = useState<IPAddress[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIps();
  }, []);

  useEffect(() => {
    if (ips.length > 0 && !selectedIp) {
      setSelectedIp(ips[0].id);
    }
  }, [ips]);

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

  const handleModeChange = async (mode: string) => {
    if (!selectedIp || user?.role !== 'owner') return;

    try {
      await api.updateIp(selectedIp, { firewall_mode: mode });
      loadIps();
    } catch (error: any) {
      alert(error.message || 'Nepodařilo se změnit režim firewallu');
    }
  };

  const selectedIpData = ips.find(ip => ip.id === selectedIp);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-text-secondary">Načítání...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Firewall</h1>
        <p className="text-text-secondary mt-2">Konfigurace režimu firewallu</p>
      </div>

      {/* IP Selector */}
      <div className="bg-card-bg rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium mb-2">IP adresa</label>
        <select
          value={selectedIp}
          onChange={(e) => setSelectedIp(e.target.value)}
          className="w-full max-w-md px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
        >
          <option value="">Vyberte IP</option>
          {ips.map(ip => (
            <option key={ip.id} value={ip.id}>
              {ip.ip_address} {ip.label ? `(${ip.label})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedIpData ? (
        <>
          {/* Current Mode Display */}
          <div className="bg-card-bg rounded-lg p-6 mb-6">
            <div className="text-sm text-text-secondary mb-2">Aktuální režim</div>
            <div className="text-2xl font-bold text-primary-blue uppercase">
              {selectedIpData.firewall_mode}
            </div>
          </div>

          {/* Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FIREWALL_MODES.map((modeConfig) => {
              const isActive = selectedIpData.firewall_mode === modeConfig.mode;
              const colorClass = 
                modeConfig.color === 'success' ? 'border-success text-success' :
                modeConfig.color === 'warning' ? 'border-warning text-warning' :
                'border-danger text-danger';

              return (
                <div
                  key={modeConfig.mode}
                  className={`bg-card-bg rounded-lg p-6 border-2 transition-all ${
                    isActive 
                      ? `${colorClass} shadow-lg` 
                      : 'border-border-color hover:border-text-secondary'
                  }`}
                >
                  <div className="text-center mb-4">
                    <div className="text-6xl mb-4">{modeConfig.icon}</div>
                    <h3 className="text-2xl font-bold text-text-primary mb-2">
                      {modeConfig.title}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      {modeConfig.description}
                    </p>
                  </div>

                  {user?.role === 'owner' && (
                    <button
                      onClick={() => handleModeChange(modeConfig.mode)}
                      disabled={isActive}
                      className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                        isActive
                          ? 'bg-opacity-20 cursor-not-allowed'
                          : 'hover:bg-opacity-20'
                      } ${
                        modeConfig.color === 'success' ? 'bg-success text-success' :
                        modeConfig.color === 'warning' ? 'bg-warning text-warning' :
                        'bg-danger text-danger'
                      }`}
                    >
                      {isActive ? 'Aktivní režim' : 'Aktivovat'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-primary-blue bg-opacity-10 border border-primary-blue rounded-lg p-6">
            <h4 className="text-lg font-semibold text-primary-blue mb-2">ℹ️ Informace</h4>
            <ul className="space-y-2 text-text-secondary text-sm">
              <li>• <strong>Accept:</strong> Vhodné pro servery s běžným provozem, kde není potřeba přísná kontrola</li>
              <li>• <strong>Filter:</strong> Doporučený režim pro většinu případů použití s vyvážeností mezi bezpečností a dostupností</li>
              <li>• <strong>Drop:</strong> Maximální bezpečnost, vhodné při aktivním útoku nebo pro kritickou infrastrukturu</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="bg-card-bg rounded-lg p-12 text-center">
          <p className="text-text-secondary text-lg">Vyberte IP adresu</p>
        </div>
      )}
    </div>
  );
}

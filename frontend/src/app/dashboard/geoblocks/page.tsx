'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { IPAddress, GeoBlock } from '@/types';
import { useAuthStore } from '@/lib/store';

// Common countries with Czech names
const COUNTRIES = [
  { code: 'CN', name: 'Čína' },
  { code: 'RU', name: 'Rusko' },
  { code: 'US', name: 'USA' },
  { code: 'IN', name: 'Indie' },
  { code: 'BR', name: 'Brazílie' },
  { code: 'DE', name: 'Německo' },
  { code: 'FR', name: 'Francie' },
  { code: 'GB', name: 'Velká Británie' },
  { code: 'JP', name: 'Japonsko' },
  { code: 'KR', name: 'Jižní Korea' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'UA', name: 'Ukrajina' },
  { code: 'PL', name: 'Polsko' },
  { code: 'NL', name: 'Nizozemsko' },
  { code: 'CZ', name: 'Česká republika' },
];

export default function GeoblocksPage() {
  const user = useAuthStore((state) => state.user);
  const [ips, setIps] = useState<IPAddress[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [blocks, setBlocks] = useState<GeoBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBlock, setNewBlock] = useState({ country_code: '', action: 'block' });

  useEffect(() => {
    loadIps();
  }, []);

  useEffect(() => {
    if (ips.length > 0 && !selectedIp) {
      setSelectedIp(ips[0].id);
    }
  }, [ips]);

  useEffect(() => {
    if (selectedIp) {
      loadBlocks();
    }
  }, [selectedIp]);

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

  const loadBlocks = async () => {
    if (!selectedIp) return;
    
    try {
      const data = await api.getGeoBlocks(selectedIp);
      setBlocks(data);
    } catch (error) {
      console.error('Failed to load geo-blocks:', error);
    }
  };

  const handleAddBlock = async () => {
    if (!selectedIp || !newBlock.country_code) return;

    try {
      await api.createGeoBlock({
        ip_id: selectedIp,
        ...newBlock,
      });
      setNewBlock({ country_code: '', action: 'block' });
      setShowAddModal(false);
      loadBlocks();
    } catch (error: any) {
      alert(error.message || 'Nepodařilo se přidat geoblokaci');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('Opravdu chcete odstranit tuto geoblokaci?')) return;

    try {
      await api.deleteGeoBlock(id);
      loadBlocks();
    } catch (error: any) {
      alert(error.message || 'Nepodařilo se odstranit geoblokaci');
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Geoblokace</h1>
          <p className="text-text-secondary mt-2">Blokování zemí podle kódu</p>
        </div>
        {user?.role === 'owner' && selectedIp && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-blue hover:bg-primary-blue-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            + Přidat blokaci
          </button>
        )}
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
          {blocks.length === 0 ? (
            <div className="bg-card-bg rounded-lg p-12 text-center">
              <p className="text-text-secondary text-lg mb-4">
                Žádné geoblokace pro tuto IP
              </p>
              {user?.role === 'owner' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary-blue hover:bg-primary-blue-hover text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Přidat první blokaci
                </button>
              )}
            </div>
          ) : (
            <div className="bg-card-bg rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-primary-bg">
                  <tr>
                    <th className="text-left px-6 py-4 text-text-secondary font-medium">
                      Kód země
                    </th>
                    <th className="text-left px-6 py-4 text-text-secondary font-medium">
                      Název
                    </th>
                    <th className="text-left px-6 py-4 text-text-secondary font-medium">
                      Akce
                    </th>
                    {user?.role === 'owner' && (
                      <th className="text-right px-6 py-4 text-text-secondary font-medium">
                        Operace
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block) => {
                    const country = COUNTRIES.find(c => c.code === block.country_code);
                    
                    return (
                      <tr key={block.id} className="border-t border-border-color">
                        <td className="px-6 py-4">
                          <span className="text-2xl">{block.country_code}</span>
                        </td>
                        <td className="px-6 py-4 text-text-primary">
                          {country?.name || block.country_code}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              block.action === 'block'
                                ? 'bg-danger bg-opacity-20 text-danger'
                                : 'bg-success bg-opacity-20 text-success'
                            }`}
                          >
                            {block.action === 'block' ? 'Blokovat' : 'Povolit'}
                          </span>
                        </td>
                        {user?.role === 'owner' && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteBlock(block.id)}
                              className="text-danger hover:text-red-400 font-medium transition-colors"
                            >
                              Odstranit
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="bg-card-bg rounded-lg p-12 text-center">
          <p className="text-text-secondary text-lg">Vyberte IP adresu</p>
        </div>
      )}

      {/* Add Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              Přidat geoblokaci
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Země *</label>
                <select
                  value={newBlock.country_code}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, country_code: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                >
                  <option value="">Vyberte zemi</option>
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.code} - {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Akce</label>
                <select
                  value={newBlock.action}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, action: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                >
                  <option value="block">Blokovat</option>
                  <option value="allow">Povolit</option>
                </select>
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
                onClick={handleAddBlock}
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

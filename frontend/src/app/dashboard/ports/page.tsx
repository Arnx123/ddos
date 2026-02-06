'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { IPAddress, FirewallRule } from '@/types';
import { useAuthStore } from '@/lib/store';

export default function PortsPage() {
  const user = useAuthStore((state) => state.user);
  const [ips, setIps] = useState<IPAddress[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState({
    port: '',
    protocol: 'tcp',
    action: 'allow',
    description: '',
  });

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
      loadRules();
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

  const loadRules = async () => {
    if (!selectedIp) return;
    
    try {
      const data = await api.getFirewallRules(selectedIp);
      setRules(data);
    } catch (error) {
      console.error('Failed to load firewall rules:', error);
    }
  };

  const handleAddRule = async () => {
    if (!selectedIp || !newRule.port) return;

    const port = parseInt(newRule.port);
    if (port < 1 || port > 65535) {
      alert('Port musí být v rozmezí 1-65535');
      return;
    }

    try {
      await api.createFirewallRule({
        ip_id: selectedIp,
        port,
        protocol: newRule.protocol,
        action: newRule.action,
        description: newRule.description,
      });
      setNewRule({ port: '', protocol: 'tcp', action: 'allow', description: '' });
      setShowAddModal(false);
      loadRules();
    } catch (error: any) {
      alert(error.message || 'Nepodařilo se přidat pravidlo');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Opravdu chcete odstranit toto pravidlo?')) return;

    try {
      await api.deleteFirewallRule(id);
      loadRules();
    } catch (error: any) {
      alert(error.message || 'Nepodařilo se odstranit pravidlo');
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
          <h1 className="text-3xl font-bold text-text-primary">Správa portů</h1>
          <p className="text-text-secondary mt-2">Konfigurace TCP/UDP portů</p>
        </div>
        {user?.role === 'owner' && selectedIp && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-blue hover:bg-primary-blue-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            + Přidat pravidlo
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
          {rules.length === 0 ? (
            <div className="bg-card-bg rounded-lg p-12 text-center">
              <p className="text-text-secondary text-lg mb-4">
                Žádná pravidla pro tuto IP
              </p>
              {user?.role === 'owner' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary-blue hover:bg-primary-blue-hover text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Přidat první pravidlo
                </button>
              )}
            </div>
          ) : (
            <div className="bg-card-bg rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-primary-bg">
                  <tr>
                    <th className="text-left px-6 py-4 text-text-secondary font-medium">
                      Port
                    </th>
                    <th className="text-left px-6 py-4 text-text-secondary font-medium">
                      Protokol
                    </th>
                    <th className="text-left px-6 py-4 text-text-secondary font-medium">
                      Akce
                    </th>
                    <th className="text-left px-6 py-4 text-text-secondary font-medium">
                      Popis
                    </th>
                    {user?.role === 'owner' && (
                      <th className="text-right px-6 py-4 text-text-secondary font-medium">
                        Operace
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className="border-t border-border-color">
                      <td className="px-6 py-4">
                        <span className="text-text-primary font-mono font-bold">
                          {rule.port}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-text-primary uppercase font-medium">
                          {rule.protocol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            rule.action === 'allow'
                              ? 'bg-success bg-opacity-20 text-success'
                              : 'bg-danger bg-opacity-20 text-danger'
                          }`}
                        >
                          {rule.action === 'allow' ? 'Povolit' : 'Blokovat'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {rule.description || '-'}
                      </td>
                      {user?.role === 'owner' && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-danger hover:text-red-400 font-medium transition-colors"
                          >
                            Odstranit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
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

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              Přidat pravidlo
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Port *</label>
                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={newRule.port}
                  onChange={(e) =>
                    setNewRule({ ...newRule, port: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                  placeholder="80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Protokol</label>
                <select
                  value={newRule.protocol}
                  onChange={(e) =>
                    setNewRule({ ...newRule, protocol: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                >
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                  <option value="both">TCP/UDP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Akce</label>
                <select
                  value={newRule.action}
                  onChange={(e) =>
                    setNewRule({ ...newRule, action: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                >
                  <option value="allow">Povolit</option>
                  <option value="deny">Blokovat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Popis</label>
                <input
                  type="text"
                  value={newRule.description}
                  onChange={(e) =>
                    setNewRule({ ...newRule, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                  placeholder="HTTP server"
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
                onClick={handleAddRule}
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

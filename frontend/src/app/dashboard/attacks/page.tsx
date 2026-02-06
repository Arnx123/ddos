'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { IPAddress, AttackStats } from '@/types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function AttacksPage() {
  const searchParams = useSearchParams();
  const ipParam = searchParams.get('ip');
  
  const [ips, setIps] = useState<IPAddress[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>('');
  const [stats, setStats] = useState<AttackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadIps();
  }, []);

  useEffect(() => {
    if (ipParam && ips.length > 0) {
      setSelectedIp(ipParam);
    } else if (ips.length > 0 && !selectedIp) {
      setSelectedIp(ips[0].id);
    }
  }, [ipParam, ips]);

  useEffect(() => {
    if (selectedIp) {
      loadStats();
    }
  }, [selectedIp, days]);

  const loadIps = async () => {
    try {
      const data = await api.getIps();
      setIps(data);
    } catch (error) {
      console.error('Failed to load IPs:', error);
    }
  };

  const loadStats = async () => {
    if (!selectedIp) return;
    
    setLoading(true);
    try {
      const data = await api.getAttackStats(selectedIp, days);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedIpData = ips.find(ip => ip.id === selectedIp);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Analýza útoků</h1>
        <p className="text-text-secondary mt-2">Podrobné statistiky a grafy útoků</p>
      </div>

      {/* Filters */}
      <div className="bg-card-bg rounded-lg p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">IP adresa</label>
            <select
              value={selectedIp}
              onChange={(e) => setSelectedIp(e.target.value)}
              className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
            >
              <option value="">Vyberte IP</option>
              {ips.map(ip => (
                <option key={ip.id} value={ip.id}>
                  {ip.ip_address} {ip.label ? `(${ip.label})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Období</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
            >
              <option value="1">Poslední den</option>
              <option value="7">Posledních 7 dní</option>
              <option value="30">Posledních 30 dní</option>
              <option value="90">Posledních 90 dní</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-text-secondary">Načítání statistik...</div>
        </div>
      ) : !stats ? (
        <div className="bg-card-bg rounded-lg p-12 text-center">
          <p className="text-text-secondary text-lg">Vyberte IP adresu pro zobrazení statistik</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-card-bg rounded-lg p-6">
              <div className="text-text-secondary text-sm mb-2">Celkem útoků</div>
              <div className="text-3xl font-bold text-text-primary">{stats.total_attacks.toLocaleString()}</div>
            </div>
            <div className="bg-card-bg rounded-lg p-6">
              <div className="text-text-secondary text-sm mb-2">Zablokováno</div>
              <div className="text-3xl font-bold text-success">{stats.blocked_attacks.toLocaleString()}</div>
            </div>
            <div className="bg-card-bg rounded-lg p-6">
              <div className="text-text-secondary text-sm mb-2">Úspěšnost</div>
              <div className="text-3xl font-bold text-primary-blue">
                {stats.total_attacks > 0 
                  ? ((stats.blocked_attacks / stats.total_attacks) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
            <div className="bg-card-bg rounded-lg p-6">
              <div className="text-text-secondary text-sm mb-2">IP adresa</div>
              <div className="text-lg font-bold text-text-primary truncate">{selectedIpData?.ip_address}</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Countries */}
            <div className="bg-card-bg rounded-lg p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">Top země (původ útoků)</h2>
              {stats.top_countries.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.top_countries}
                      dataKey="count"
                      nameKey="country_code"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.country_code}: ${entry.count}`}
                    >
                      {stats.top_countries.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-text-secondary">
                  Žádná data
                </div>
              )}
            </div>

            {/* Top ASNs */}
            <div className="bg-card-bg rounded-lg p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">Top ASN</h2>
              {stats.top_asns.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.top_asns.slice(0, 8)}
                      dataKey="count"
                      nameKey="asn"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.asn}: ${entry.count}`}
                    >
                      {stats.top_asns.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-text-secondary">
                  Žádná data
                </div>
              )}
            </div>

            {/* Top Ports */}
            <div className="bg-card-bg rounded-lg p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">Top cílové porty</h2>
              {stats.top_ports.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.top_ports.slice(0, 10)}>
                    <XAxis dataKey="port" stroke="#a0aec0" />
                    <YAxis stroke="#a0aec0" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e2535', border: '1px solid #2d3748' }}
                      labelStyle={{ color: '#f7fafc' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-text-secondary">
                  Žádná data
                </div>
              )}
            </div>

            {/* Top Protocols */}
            <div className="bg-card-bg rounded-lg p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">Protokoly</h2>
              {stats.top_protocols.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.top_protocols}>
                    <XAxis dataKey="protocol" stroke="#a0aec0" />
                    <YAxis stroke="#a0aec0" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e2535', border: '1px solid #2d3748' }}
                      labelStyle={{ color: '#f7fafc' }}
                    />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-text-secondary">
                  Žádná data
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

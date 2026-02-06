'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);
      setAuth(data.user, data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Přihlášení se nezdařilo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-bg">
      <div className="w-full max-w-md">
        <div className="bg-card-bg rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-blue mb-2">
              Anti-DDoS Protection
            </h1>
            <p className="text-text-secondary">Přihlaste se do administrace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                placeholder="admin@ddos-protection.cz"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Heslo
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-danger bg-opacity-10 border border-danger text-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-blue hover:bg-primary-blue-hover text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Přihlašování...' : 'Přihlásit se'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            <p>Výchozí přihlášení:</p>
            <p className="mt-1">admin@ddos-protection.cz / Admin123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

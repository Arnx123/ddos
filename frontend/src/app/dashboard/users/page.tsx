'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'subuser',
    full_name: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password) {
      alert('Email a heslo jsou povinné');
      return;
    }

    try {
      await api.createUser(newUser);
      setNewUser({ email: '', password: '', role: 'subuser', full_name: '' });
      setShowAddModal(false);
      loadUsers();
    } catch (error: any) {
      alert(error.message || 'Nepodařilo se vytvořit uživatele');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Opravdu chcete odstranit tohoto uživatele?')) return;

    try {
      await api.deleteUser(id);
      loadUsers();
    } catch (error: any) {
      alert(error.message || 'Nepodařilo se odstranit uživatele');
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
          <h1 className="text-3xl font-bold text-text-primary">Uživatelé</h1>
          <p className="text-text-secondary mt-2">Správa uživatelů systému</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-blue hover:bg-primary-blue-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          + Přidat uživatele
        </button>
      </div>

      {users.length === 0 ? (
        <div className="bg-card-bg rounded-lg p-12 text-center">
          <p className="text-text-secondary text-lg mb-4">
            Žádní uživatelé
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-blue hover:bg-primary-blue-hover text-white px-6 py-2 rounded-lg transition-colors"
          >
            Přidat prvního uživatele
          </button>
        </div>
      ) : (
        <div className="bg-card-bg rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-primary-bg">
              <tr>
                <th className="text-left px-6 py-4 text-text-secondary font-medium">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-text-secondary font-medium">
                  Jméno
                </th>
                <th className="text-left px-6 py-4 text-text-secondary font-medium">
                  Role
                </th>
                <th className="text-left px-6 py-4 text-text-secondary font-medium">
                  Vytvořeno
                </th>
                <th className="text-left px-6 py-4 text-text-secondary font-medium">
                  Poslední přihlášení
                </th>
                <th className="text-right px-6 py-4 text-text-secondary font-medium">
                  Operace
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border-color">
                  <td className="px-6 py-4 text-text-primary font-medium">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-text-primary">
                    {user.full_name || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        user.role === 'owner'
                          ? 'bg-primary-blue bg-opacity-20 text-primary-blue'
                          : 'bg-text-secondary bg-opacity-20 text-text-secondary'
                      }`}
                    >
                      {user.role === 'owner' ? 'Owner' : 'Subuser'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {new Date(user.created_at).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString('cs-CZ')
                      : 'Nikdy'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-danger hover:text-red-400 font-medium transition-colors"
                    >
                      Odstranit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card-bg rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              Přidat uživatele
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Heslo *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Jméno</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, full_name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                  placeholder="Jan Novák"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-primary-bg border border-border-color rounded-lg focus:outline-none focus:border-primary-blue text-text-primary"
                >
                  <option value="subuser">Subuser</option>
                  <option value="owner">Owner</option>
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
                onClick={handleAddUser}
                className="flex-1 bg-primary-blue hover:bg-primary-blue-hover text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Vytvořit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

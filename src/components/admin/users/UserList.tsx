'use client';

import React, { useEffect, useState } from 'react';

type UserRow = {
  id: string;
  display_name: string | null;
  role: 'admin' | 'editor' | 'user';
  created_at: string;
};

export function UserList() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error('Failed to load users');
        setUsers(await res.json());
      } catch (e: any) {
        setError(e?.message || 'Error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-gray-300">
        Cargando usuarios...
      </div>
    );
  if (error)
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-red-300">
        {error}
      </div>
    );

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">Usuarios</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-gray-300">
          <thead>
            <tr className="text-left">
              <th className="py-2">Nombre</th>
              <th className="py-2">Rol</th>
              <th className="py-2">Creado</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-gray-700">
                <td className="py-2">{u.display_name || u.id}</td>
                <td className="py-2">{u.role}</td>
                <td className="py-2">
                  {new Date(u.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

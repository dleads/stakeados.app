'use client';

import React, { useState } from 'react';

export function RoleEditor({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: 'admin' | 'editor' | 'user';
}) {
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <select
        className="bg-gray-700 text-white rounded px-2 py-1"
        value={role}
        onChange={e => setRole(e.target.value as any)}
      >
        <option value="user">user</option>
        <option value="editor">editor</option>
        <option value="admin">admin</option>
      </select>
      <button
        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          setError(null);
          try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
              method: 'POST',
              body: JSON.stringify({ role }),
              headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('No se pudo guardar');
          } catch (e: any) {
            setError(e?.message || 'Error');
          } finally {
            setSaving(false);
          }
        }}
      >
        Guardar
      </button>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}

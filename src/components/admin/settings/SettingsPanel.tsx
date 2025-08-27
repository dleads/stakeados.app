'use client';

import React, { useEffect, useState } from 'react';

export function SettingsPanel() {
  const [settings, setSettings] = useState<any>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    (async () => {
      const r = await fetch('/api/admin/settings');
      setSettings(await r.json());
    })();
  }, []);
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">Configuración</h3>
      <div className="space-y-3">
        <label className="block">
          <span className="text-gray-300 text-sm">
            Noticias: fuentes activas
          </span>
          <input
            className="w-full bg-gray-700 text-white rounded px-2 py-1"
            value={settings.newsSources ?? ''}
            onChange={e =>
              setSettings({ ...settings, newsSources: e.target.value })
            }
            placeholder="coindesk, cointelegraph..."
          />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">AI Model</span>
          <input
            className="w-full bg-gray-700 text-white rounded px-2 py-1"
            value={settings.aiModel ?? ''}
            onChange={e =>
              setSettings({ ...settings, aiModel: e.target.value })
            }
            placeholder="gpt-4o-mini"
          />
        </label>
      </div>
      <button
        className="mt-4 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          await fetch('/api/admin/settings', {
            method: 'POST',
            body: JSON.stringify(settings),
            headers: { 'Content-Type': 'application/json' },
          });
          setSaving(false);
        }}
      >
        Guardar cambios
      </button>
    </div>
  );
}

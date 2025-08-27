'use client';

import React, { useState } from 'react';

export function ExportPanel() {
  const [type, setType] = useState<'articles' | 'news'>('articles');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">Exportar datos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-sm text-gray-300">
          Tipo
          <select
            className="w-full bg-gray-700 text-white rounded px-2 py-1"
            value={type}
            onChange={e => setType(e.target.value as any)}
          >
            <option value="articles">Artículos</option>
            <option value="news">Noticias</option>
          </select>
        </label>
        <label className="text-sm text-gray-300">
          Formato
          <select
            className="w-full bg-gray-700 text-white rounded px-2 py-1"
            value={format}
            onChange={e => setFormat(e.target.value as any)}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </label>
        <label className="text-sm text-gray-300">
          Desde
          <input
            type="datetime-local"
            className="w-full bg-gray-700 text-white rounded px-2 py-1"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm text-gray-300">
          Hasta
          <input
            type="datetime-local"
            className="w-full bg-gray-700 text-white rounded px-2 py-1"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </label>
      </div>
      <button
        className="mt-4 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
        onClick={async () => {
          const res = await fetch('/api/admin/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type,
              format,
              from: from || undefined,
              to: to || undefined,
            }),
          });
          if (format === 'json') {
            const blob = new Blob([JSON.stringify(await res.json(), null, 2)], {
              type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}.json`;
            a.click();
            URL.revokeObjectURL(url);
          } else {
            const text = await res.text();
            const blob = new Blob([text], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }}
      >
        Generar
      </button>
    </div>
  );
}

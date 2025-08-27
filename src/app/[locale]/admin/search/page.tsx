'use client';

import { AdvancedSearchInterface } from '@/components/admin/search/AdvancedSearchInterface';

export default function AdminSearchPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Búsqueda Avanzada</h1>
        <p className="text-gray-600 mt-2">
          Busca y filtra contenido a través de toda la plataforma con
          herramientas avanzadas.
        </p>
      </div>

      <AdvancedSearchInterface
        showAnalytics={true}
        onResultSelect={result => {
          // Handle result selection - could navigate to edit page
          console.log('Selected result:', result);
        }}
      />
    </div>
  );
}

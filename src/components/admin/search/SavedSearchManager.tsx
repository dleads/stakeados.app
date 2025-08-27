'use client';

import React, { useState } from 'react';
import { Bookmark, Search, Trash2, Star, Calendar, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SavedSearch } from '@/hooks/useAdvancedSearch';

interface SavedSearchManagerProps {
  savedSearches: SavedSearch[];
  onApplySearch: (savedSearch: SavedSearch) => void;
  onDeleteSearch: (id: string) => void;
}

export function SavedSearchManager({
  savedSearches,
  onApplySearch,
  onDeleteSearch,
}: SavedSearchManagerProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDeleteSearch(id);
    setDeletingId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSearchTypeLabel = (type: string) => {
    switch (type) {
      case 'articles':
        return 'Artículos';
      case 'news':
        return 'Noticias';
      case 'categories':
        return 'Categorías';
      case 'tags':
        return 'Etiquetas';
      case 'global':
        return 'Global';
      default:
        return 'Desconocido';
    }
  };

  const getActiveFiltersCount = (filters: any) => {
    return Object.values(filters || {}).filter(
      value =>
        value !== undefined &&
        value !== null &&
        value !== '' &&
        (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  };

  if (savedSearches.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-400 mb-4">
            <Bookmark className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes búsquedas guardadas
          </h3>
          <p className="text-gray-600">
            Guarda tus búsquedas frecuentes para acceder a ellas rápidamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Búsquedas Guardadas</h3>
        <p className="text-sm text-gray-600">
          {savedSearches.length} búsqueda{savedSearches.length !== 1 ? 's' : ''}{' '}
          guardada{savedSearches.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-4">
        {savedSearches.map(savedSearch => (
          <Card
            key={savedSearch.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      {savedSearch.is_default && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                      {savedSearch.name}
                    </h4>
                    <Badge variant="outline">
                      {getSearchTypeLabel(savedSearch.search_type)}
                    </Badge>
                  </div>

                  {/* Search Query */}
                  {savedSearch.search_query && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Search className="h-3 w-3" />"
                        {savedSearch.search_query}"
                      </p>
                    </div>
                  )}

                  {/* Filters Summary */}
                  {getActiveFiltersCount(savedSearch.filters) > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Filter className="h-3 w-3" />
                        {getActiveFiltersCount(savedSearch.filters)} filtro
                        {getActiveFiltersCount(savedSearch.filters) !== 1
                          ? 's'
                          : ''}{' '}
                        aplicado
                        {getActiveFiltersCount(savedSearch.filters) !== 1
                          ? 's'
                          : ''}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Creada: {formatDate(savedSearch.created_at)}
                    </div>
                    {savedSearch.updated_at !== savedSearch.created_at && (
                      <div className="flex items-center gap-1">
                        Actualizada: {formatDate(savedSearch.updated_at)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-4 flex-shrink-0 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApplySearch(savedSearch)}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Aplicar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingId === savedSearch.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          ¿Eliminar búsqueda guardada?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. La búsqueda guardada
                          "{savedSearch.name}" será eliminada permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(savedSearch.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

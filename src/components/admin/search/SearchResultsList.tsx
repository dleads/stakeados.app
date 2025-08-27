'use client';

import React from 'react';
import {
  FileText,
  Newspaper,
  Calendar,
  User,
  Eye,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchResult } from '@/hooks/useAdvancedSearch';

interface SearchResultsListProps {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  onResultClick: (result: SearchResult) => void;
  onLoadMore: () => void;
}

export function SearchResultsList({
  results,
  isLoading,
  error,
  pagination,
  onResultClick,
  onLoadMore,
}: SearchResultsListProps) {
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'news':
        return <Newspaper className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'article':
        return 'Artículo';
      case 'news':
        return 'Noticia';
      default:
        return 'Contenido';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-2">Error en la búsqueda</div>
          <p className="text-gray-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && results.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Buscando contenido...</p>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0 && !isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-gray-400 mb-2">
            <FileText className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron resultados
          </h3>
          <p className="text-gray-600">
            Intenta ajustar tu búsqueda o filtros para encontrar contenido.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Mostrando {results.length} de {pagination.total} resultados
        </p>
        <div className="text-sm text-gray-500">
          Página {Math.floor(pagination.offset / pagination.limit) + 1}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.map(result => (
          <Card
            key={result.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onResultClick(result)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {getContentTypeIcon(result.content_type)}
                      {getContentTypeLabel(result.content_type)}
                    </Badge>
                    {result.category_name && (
                      <Badge variant="secondary">{result.category_name}</Badge>
                    )}
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>Relevancia: {Math.round(result.rank * 100)}%</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {result.title}
                  </h3>

                  {/* Highlight/Summary */}
                  {result.highlight && (
                    <div
                      className="text-sm text-gray-600 mb-3 line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: result.highlight }}
                    />
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    {result.author_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {result.author_name}
                      </div>
                    )}
                    {result.published_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(result.published_at)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-4 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      onResultClick(result);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {pagination.has_more && (
        <div className="text-center pt-4">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cargando...
              </>
            ) : (
              'Cargar más resultados'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

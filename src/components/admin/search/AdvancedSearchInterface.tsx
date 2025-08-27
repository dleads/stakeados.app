'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Save,
  Bookmark,
  BarChart3,
  X,
  Calendar,
  User,
  Tag,
  Folder,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAdvancedSearch,
  SearchResult,
  SavedSearch,
} from '@/hooks/useAdvancedSearch';
import { SearchResultsList } from './SearchResultsList';
import { SavedSearchManager } from './SavedSearchManager';
import { SearchAnalyticsDashboard } from './SearchAnalyticsDashboard';

interface AdvancedSearchInterfaceProps {
  className?: string;
  onResultSelect?: (result: SearchResult) => void;
  showAnalytics?: boolean;
}

export function AdvancedSearchInterface({
  className = '',
  onResultSelect,
  showAnalytics = true,
}: AdvancedSearchInterfaceProps) {
  const {
    query,
    setQuery,
    contentTypes,
    setContentTypes,
    filters,
    updateFilters,
    clearFilters,
    results,
    isLoading,
    error,
    pagination,
    performSearch,
    loadMore,
    clearSearch,
    savedSearches,
    saveSearch,
    deleteSavedSearch,
    applySavedSearch,
    analytics,
    loadAnalytics,
    trackResultClick,
  } = useAdvancedSearch();

  const [showFilters, setShowFilters] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSearch = () => {
    performSearch();
  };

  const handleResultClick = (result: SearchResult) => {
    trackResultClick(result.id);
    onResultSelect?.(result);
  };

  const handleSaveSearch = async () => {
    if (saveSearchName.trim()) {
      const success = await saveSearch(saveSearchName.trim());
      if (success) {
        setSaveSearchName('');
        setShowSaveDialog(false);
      }
    }
  };

  const handleApplySavedSearch = (savedSearch: SavedSearch) => {
    applySavedSearch(savedSearch);
  };

  const activeFiltersCount = Object.values(filters).filter(
    value =>
      value !== undefined &&
      value !== null &&
      value !== '' &&
      (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Búsqueda Avanzada de Contenido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar artículos, noticias, categorías..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-10"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Buscando...' : 'Buscar'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Content Type Selection */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">
              Tipo de contenido:
            </span>
            {[
              { value: 'articles', label: 'Artículos' },
              { value: 'news', label: 'Noticias' },
              { value: 'categories', label: 'Categorías' },
              { value: 'tags', label: 'Etiquetas' },
            ].map(type => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={type.value}
                  checked={contentTypes.includes(type.value as any)}
                  onCheckedChange={checked => {
                    if (checked) {
                      setContentTypes([...contentTypes, type.value as any]);
                    } else {
                      setContentTypes(
                        contentTypes.filter(t => t !== type.value)
                      );
                    }
                  }}
                />
                <label htmlFor={type.value} className="text-sm">
                  {type.label}
                </label>
              </div>
            ))}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Categoría
                    </label>
                    <Select
                      value={filters.category_id || ''}
                      onValueChange={value =>
                        updateFilters({ category_id: value || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las categorías" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas las categorías</SelectItem>
                        {/* TODO: Load categories dynamically */}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Author Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Autor
                    </label>
                    <Select
                      value={filters.author_id || ''}
                      onValueChange={value =>
                        updateFilters({ author_id: value || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los autores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los autores</SelectItem>
                        {/* TODO: Load authors dynamically */}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado</label>
                    <Select
                      value={filters.status || ''}
                      onValueChange={value =>
                        updateFilters({ status: (value as any) || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos los estados</SelectItem>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="review">En revisión</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                        <SelectItem value="archived">Archivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha desde
                    </label>
                    <Input
                      type="date"
                      value={filters.date_from?.split('T')[0] || ''}
                      onChange={e =>
                        updateFilters({
                          date_from: e.target.value
                            ? `${e.target.value}T00:00:00Z`
                            : undefined,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpiar filtros
                  </Button>
                  <Dialog
                    open={showSaveDialog}
                    onOpenChange={setShowSaveDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Save className="h-4 w-4 mr-2" />
                        Guardar búsqueda
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Guardar búsqueda</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Nombre de la búsqueda"
                          value={saveSearchName}
                          onChange={e => setSaveSearchName(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowSaveDialog(false)}
                          >
                            Cancelar
                          </Button>
                          <Button onClick={handleSaveSearch}>Guardar</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={clearSearch}>
              <X className="h-4 w-4 mr-2" />
              Limpiar búsqueda
            </Button>
            {savedSearches
              .filter(s => s.is_default)
              .map(savedSearch => (
                <Button
                  key={savedSearch.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplySavedSearch(savedSearch)}
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  {savedSearch.name}
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Results and Management Tabs */}
      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="results">
            Resultados ({pagination.total})
          </TabsTrigger>
          <TabsTrigger value="saved">
            Búsquedas guardadas ({savedSearches.length})
          </TabsTrigger>
          {showAnalytics && (
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <SearchResultsList
            results={results}
            isLoading={isLoading}
            error={error}
            pagination={pagination}
            onResultClick={handleResultClick}
            onLoadMore={loadMore}
          />
        </TabsContent>

        <TabsContent value="saved">
          <SavedSearchManager
            savedSearches={savedSearches}
            onApplySearch={handleApplySavedSearch}
            onDeleteSearch={deleteSavedSearch}
          />
        </TabsContent>

        {showAnalytics && (
          <TabsContent value="analytics">
            <SearchAnalyticsDashboard
              analytics={analytics}
              onLoadAnalytics={loadAnalytics}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

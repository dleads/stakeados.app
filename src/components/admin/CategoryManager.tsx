'use client';

import { useState } from 'react';
import { Plus, Search, Eye, EyeOff, Grid, List } from 'lucide-react';
import { useCategoryManager } from '@/hooks/useCategoryManager';
import type {
  CreateCategoryData,
  UpdateCategoryData,
} from '@/lib/services/categoryService';
import type { Database } from '@/types/supabase';
import { CategoryForm } from './CategoryForm';
import { CategoryCard } from './CategoryCard';
import { CategoryStats } from './CategoryStats';
import { CategoryTreeView } from './CategoryTreeView';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
// import { useTranslation } from '@/lib/i18n' // TODO: Add translations
import type { Locale } from '@/types/content';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryManagerProps {
  locale: Locale;
}

export function CategoryManager({ locale }: CategoryManagerProps) {
  // const { t } = useTranslation(locale) // TODO: Add translations
  const {
    categories,
    loading,
    error,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  } = useCategoryManager();

  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');

  const handleCreateCategory = async (data: CreateCategoryData) => {
    try {
      await createCategory(data);
      setShowForm(false);
    } catch (err) {
      console.error('Error creating category:', err);
      throw err; // Let the form handle the error
    }
  };

  const handleUpdateCategory = async (data: UpdateCategoryData) => {
    try {
      await updateCategory(data);
      setEditingCategory(null);
    } catch (err) {
      console.error('Error updating category:', err);
      throw err; // Let the form handle the error
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?'))
      return;

    try {
      await deleteCategory(id);
    } catch (err) {
      console.error('Error deleting category:', err);
      // Error is handled by the hook
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    try {
      await reorderCategories(items.map(item => item.id));
    } catch (err) {
      console.error('Error reordering categories:', err);
      // Error is handled by the hook
    }
  };

  const filteredCategories = categories.filter(category => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      category.name.toLowerCase().includes(query) ||
      category.slug.toLowerCase().includes(query) ||
      (category.description &&
        category.description.toLowerCase().includes(query))
    );
  });

  // Build hierarchical structure for tree view
  const buildHierarchy = (cats: Category[]) => {
    const categoryMap = new Map<
      string,
      Category & { children: (Category & { children: any[] })[] }
    >();
    const rootCategories: (Category & { children: any[] })[] = [];

    // First pass: create map and add children array
    cats.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build hierarchy
    cats.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(categoryWithChildren);
        } else {
          rootCategories.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  };

  const hierarchicalCategories = buildHierarchy(filteredCategories);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Gestión de Categorías
          </h1>
          <p className="text-gray-300">Organiza el contenido con categorías</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Añadir Categoría
        </button>
      </div>

      {/* Stats */}
      <CategoryStats />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
              viewMode === 'grid'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4" />
            Cuadrícula
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
              viewMode === 'tree'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            Árbol
          </button>
        </div>

        <label className="flex items-center gap-2 text-gray-300">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="rounded border-gray-600 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="flex items-center gap-1">
            {showInactive ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            Mostrar inactivas
          </span>
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Categories Display */}
      {viewMode === 'grid' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories">
            {provided => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredCategories.map((category, index) => (
                  <Draggable
                    key={category.id}
                    draggableId={category.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? 'opacity-50' : ''}`}
                      >
                        <CategoryCard
                          category={category}
                          locale={locale}
                          dragHandleProps={provided.dragHandleProps}
                          onEdit={() => setEditingCategory(category)}
                          onDelete={() => handleDeleteCategory(category.id)}
                          onToggleStatus={() => {
                            // TODO: Show category statistics modal
                            // TODO: Implement category statistics
                            console.log(
                              'Show category statistics for:',
                              category.id
                            );
                          }}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="bg-gray-700 rounded-lg p-4">
          <CategoryTreeView
            categories={hierarchicalCategories}
            onEdit={category => setEditingCategory(category)}
            onDelete={id => handleDeleteCategory(id)}
            onAddChild={parentId => {
              // TODO: Open form with parent_id pre-filled
              // TODO: Implement add child category
              console.log('Add child to:', parentId);
              setShowForm(true);
            }}
          />
        </div>
      )}

      {filteredCategories.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No hay categorías</div>
          <p className="text-gray-500">
            Crea tu primera categoría para organizar el contenido
          </p>
        </div>
      )}

      {/* Category Form Modal */}
      {(showForm || editingCategory) && (
        <CategoryForm
          category={editingCategory}
          onSubmit={
            editingCategory
              ? (data: any) => handleUpdateCategory(data as UpdateCategoryData)
              : (data: any) => handleCreateCategory(data as CreateCategoryData)
          }
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
          locale={locale}
        />
      )}
    </div>
  );
}

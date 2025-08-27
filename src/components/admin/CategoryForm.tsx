'use client';

import { useState, useEffect } from 'react';
import { X, Palette, Hash } from 'lucide-react';
import { getAvailableIcons } from '@/lib/utils/iconUtils';

import type {
  CreateCategoryData,
  UpdateCategoryData,
} from '@/lib/services/categoryService';

interface CategoryFormProps {
  category?: any; // Existing category for editing
  onSubmit: (data: CreateCategoryData | UpdateCategoryData) => Promise<void>;
  onCancel: () => void;
}

const PRESET_COLORS = [
  '#00D4AA',
  '#FF6B6B',
  '#0052FF',
  '#FFD93D',
  '#6BCF7F',
  '#A8E6CF',
  '#FF9F43',
  '#5F27CD',
  '#00D2D3',
  '#FF3838',
  '#2ED573',
  '#FFA502',
  '#3742FA',
  '#F8B500',
  '#7F8C8D',
  '#E74C3C',
  '#9B59B6',
  '#3498DB',
];

export function CategoryForm({
  category,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    color: category?.color || PRESET_COLORS[0],
    icon: category?.icon || '',
    parent_id: category?.parent_id || '',
    sort_order: category?.sort_order || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const availableIcons = getAvailableIcons();

  // Auto-generate slug from name
  useEffect(() => {
    if (!category && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (category) {
        await onSubmit({ id: category.id, ...formData } as UpdateCategoryData);
      } else {
        await onSubmit(formData as CreateCategoryData);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al guardar la categoría'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Nombre de la categoría"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={e =>
                setFormData(prev => ({ ...prev, slug: e.target.value }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="url-slug"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Descripción de la categoría"
              rows={3}
            />
          </div>

          {/* Color and Icon Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Color
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors"
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: formData.color }}
                  />
                  <Palette className="w-4 h-4" />
                  Seleccionar Color
                </button>

                {showColorPicker && (
                  <div className="grid grid-cols-6 gap-2 p-3 bg-gray-700 rounded-lg">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, color }));
                          setShowColorPicker(false);
                        }}
                        className={`w-8 h-8 rounded border-2 transition-all ${
                          formData.color === color
                            ? 'border-white scale-110'
                            : 'border-gray-500 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Icono
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600 transition-colors"
                >
                  {formData.icon ? (
                    <>
                      {(() => {
                        const IconComponent = availableIcons.find(
                          i => i.name === formData.icon
                        )?.component;
                        return IconComponent ? (
                          <IconComponent className="w-4 h-4" />
                        ) : (
                          <Hash className="w-4 h-4" />
                        );
                      })()}
                      {formData.icon}
                    </>
                  ) : (
                    <>
                      <Hash className="w-4 h-4" />
                      Seleccionar Icono
                    </>
                  )}
                </button>

                {showIconPicker && (
                  <div className="grid grid-cols-6 gap-2 p-3 bg-gray-700 rounded-lg max-h-40 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, icon: '' }));
                        setShowIconPicker(false);
                      }}
                      className={`p-2 rounded border-2 transition-all ${
                        !formData.icon
                          ? 'border-white bg-gray-600'
                          : 'border-gray-500 hover:border-gray-400'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {availableIcons.map(
                      ({ name, component: IconComponent }) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, icon: name }));
                            setShowIconPicker(false);
                          }}
                          className={`p-2 rounded border-2 transition-all ${
                            formData.icon === name
                              ? 'border-white bg-gray-600'
                              : 'border-gray-500 hover:border-gray-400'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Orden
            </label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  sort_order: parseInt(e.target.value) || 0,
                }))
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="0"
              min="0"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Guardando...' : category ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

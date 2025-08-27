'use client';

import { useState } from 'react';
import { MoreVertical, Edit, Trash2, Eye, GripVertical } from 'lucide-react';
// import { useTranslation } from '@/lib/i18n' // TODO: Add translations

import type { Database } from '@/types/supabase';
import { getIconComponent } from '@/lib/utils/iconUtils';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryCardProps {
  category: Category;
  dragHandleProps?: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

export function CategoryCard({
  category,
  dragHandleProps,
  onEdit,
  onDelete,
  onToggleStatus,
}: CategoryCardProps) {
  // const { t } = useTranslation(locale) // TODO: Add translations
  const [showMenu, setShowMenu] = useState(false);

  const IconComponent = category.icon ? getIconComponent(category.icon) : null;

  return (
    <div className="relative bg-gray-700 rounded-lg border-2 border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/50">
      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className="absolute top-2 left-2 p-1 text-gray-400 hover:text-gray-200 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Menu Button */}
      <div className="absolute top-2 right-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]">
            <button
              onClick={() => {
                onEdit();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={() => {
                onToggleStatus();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Ver Estadísticas
            </button>
            <button
              onClick={() => {
                onDelete();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: (category.color || '#6B7280') + '20' }}
          >
            {IconComponent ? (
              <IconComponent
                className="w-5 h-5"
                style={{ color: category.color || '#6B7280' }}
              />
            ) : (
              <div
                className="w-5 h-5 rounded"
                style={{ backgroundColor: category.color || '#6B7280' }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">
              {category.name}
            </h3>
            <p className="text-sm text-gray-400 truncate">/{category.slug}</p>
          </div>
        </div>

        {/* Description */}
        {category.description && (
          <p className="text-sm text-gray-300 mb-3 line-clamp-2">
            {category.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color || '#6B7280' }}
            />
            Activa
          </span>
          <span>Orden: {category.sort_order}</span>
        </div>
      </div>
    </div>
  );
}

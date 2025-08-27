'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import type { Database } from '@/types/supabase';
import { getIconComponent } from '@/lib/utils/iconUtils';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

interface CategoryTreeViewProps {
  categories: CategoryWithChildren[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  dragHandleProps?: any;
}

interface CategoryTreeNodeProps {
  category: CategoryWithChildren;
  level: number;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  dragHandleProps?: any;
}

function CategoryTreeNode({
  category,
  level,
  onEdit,
  onDelete,
  onAddChild,
  dragHandleProps,
}: CategoryTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const hasChildren = category.children && category.children.length > 0;
  const IconComponent = category.icon ? getIconComponent(category.icon) : null;

  return (
    <div className="select-none">
      {/* Category Node */}
      <div
        className={`
          flex items-center gap-2 p-2 rounded-lg hover:bg-gray-600 transition-colors group
          ${level > 0 ? 'ml-6' : ''}
        `}
        style={{ paddingLeft: `${level * 24 + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white transition-colors
            ${hasChildren ? 'visible' : 'invisible'}
          `}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>

        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="p-1 text-gray-400 hover:text-gray-200 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </div>

        {/* Category Icon */}
        <div
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: (category.color || '#6B7280') + '20' }}
        >
          {IconComponent ? (
            <IconComponent
              className="w-3 h-3"
              style={{ color: category.color || '#6B7280' }}
            />
          ) : (
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: category.color || '#6B7280' }}
            />
          )}
        </div>

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">
              {category.name}
            </span>
            <span className="text-xs text-gray-400">/{category.slug}</span>
          </div>
          {category.description && (
            <p className="text-xs text-gray-400 truncate">
              {category.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddChild(category.id)}
            className="p-1 text-gray-400 hover:text-emerald-400 transition-colors"
            title="Añadir subcategoría"
          >
            <Plus className="w-3 h-3" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <MoreVertical className="w-3 h-3" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-6 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[100px]">
                <button
                  onClick={() => {
                    onEdit(category);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    onDelete(category.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {category.children.map(child => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              dragHandleProps={dragHandleProps}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTreeView({
  categories,
  onEdit,
  onDelete,
  onAddChild,
  dragHandleProps,
}: CategoryTreeViewProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No hay categorías para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {categories.map(category => (
        <CategoryTreeNode
          key={category.id}
          category={category}
          level={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          dragHandleProps={dragHandleProps}
        />
      ))}
    </div>
  );
}

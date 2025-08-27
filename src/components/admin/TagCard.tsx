'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MoreVertical,
  Edit,
  Trash2,
  Hash,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import type { ContentTag } from '@/types/content';

interface TagCardProps {
  tag: ContentTag;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TagCard({
  tag,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
}: TagCardProps) {
  const t = useTranslations('admin.tags');
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUsageColor = (count: number) => {
    if (count === 0) return 'text-gray-400';
    if (count < 5) return 'text-yellow-600';
    if (count < 20) return 'text-blue-600';
    return 'text-green-600';
  };

  const getUsageBackground = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count < 5) return 'bg-yellow-100';
    if (count < 20) return 'bg-blue-100';
    return 'bg-green-100';
  };

  return (
    <div
      className={`
      relative bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-md cursor-pointer
      ${selected ? 'border-primary bg-primary/5' : 'border-gray-200'}
    `}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute top-2 left-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={e => onSelect(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
        </div>
      )}

      {/* Menu Button */}
      <div className="absolute top-2 right-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
            <button
              onClick={() => {
                onEdit();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit className="w-3 h-3" />
              {t('edit')}
            </button>
            <hr className="my-1" />
            <button
              onClick={() => {
                onDelete();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" />
              {t('delete')}
            </button>
          </div>
        )}
      </div>

      {/* Tag Content */}
      <div className="p-4 pt-8">
        {/* Tag Name */}
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 truncate">{tag.name}</h3>
        </div>

        {/* Usage Stats */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{t('usage')}</span>
          </div>
          <span
            className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${getUsageBackground(tag.usage_count)} ${getUsageColor(tag.usage_count)}
          `}
          >
            {tag.usage_count} {t('times')}
          </span>
        </div>

        {/* Slug */}
        <div className="mb-3">
          <span className="text-xs text-gray-500">/{tag.slug}</span>
        </div>

        {/* Created Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>
            {t('created')}: {formatDate(tag.created_at)}
          </span>
        </div>

        {/* Usage Indicator */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                tag.usage_count === 0
                  ? 'bg-gray-300'
                  : tag.usage_count < 5
                    ? 'bg-yellow-400'
                    : tag.usage_count < 20
                      ? 'bg-blue-400'
                      : 'bg-green-400'
              }`}
              style={{
                width: `${Math.min(100, (tag.usage_count / 50) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
}

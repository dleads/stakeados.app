'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { getIconComponent, AVAILABLE_ICONS } from '@/lib/utils/iconUtils';

interface IconPickerProps {
  selectedIcon: string;
  onChange: (icon: string) => void;
  onClose: () => void;
}

export function IconPicker({
  selectedIcon,
  onChange,
  onClose,
}: IconPickerProps) {
  const t = useTranslations('admin.categories.iconPicker');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIcons = AVAILABLE_ICONS.filter(icon =>
    icon.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">{t('title')}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Icons Grid */}
      <div className="p-3 max-h-64 overflow-y-auto">
        <div className="grid grid-cols-6 gap-2">
          {/* No Icon Option */}
          <button
            onClick={() => onChange('')}
            className={`
              p-2 rounded-lg border-2 transition-colors
              ${
                selectedIcon === ''
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-gray-300'
              }
            `}
            title={t('noIcon')}
          >
            <div className="w-5 h-5 flex items-center justify-center text-gray-400">
              <X className="w-4 h-4" />
            </div>
          </button>

          {/* Available Icons */}
          {filteredIcons.map(iconName => {
            const IconComponent = getIconComponent(iconName);
            if (!IconComponent) return null;

            return (
              <button
                key={iconName}
                onClick={() => onChange(iconName)}
                className={`
                  p-2 rounded-lg border-2 transition-colors
                  ${
                    selectedIcon === iconName
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                title={iconName}
              >
                <IconComponent className="w-5 h-5 text-gray-600" />
              </button>
            );
          })}
        </div>

        {filteredIcons.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            {t('noIconsFound')}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
        {t('iconCount', { count: filteredIcons.length })}
      </div>
    </div>
  );
}

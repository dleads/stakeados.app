'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Palette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#00FF88', // Primary green
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Light green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light yellow
  '#BB8FCE', // Light purple
  '#85C1E9', // Light blue
  '#F8C471', // Orange
  '#82E0AA', // Light green
  '#F1948A', // Light red
  '#85929E', // Gray
  '#2C3E50', // Dark blue
  '#8E44AD', // Purple
  '#E67E22', // Orange
  '#E74C3C', // Red
  '#F39C12', // Yellow
  '#27AE60', // Green
  '#3498DB', // Blue
  '#9B59B6', // Purple
  '#1ABC9C', // Turquoise
];

export function ColorPicker({ color, onChange, onClose }: ColorPickerProps) {
  const t = useTranslations('admin.categories.colorPicker');
  const [customColor, setCustomColor] = useState(color);

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">{t('title')}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Preset Colors */}
      <div className="p-3">
        <h4 className="text-xs font-medium text-gray-700 mb-2">
          {t('presetColors')}
        </h4>
        <div className="grid grid-cols-8 gap-2">
          {PRESET_COLORS.map(presetColor => (
            <button
              key={presetColor}
              onClick={() => onChange(presetColor)}
              className={`
                w-8 h-8 rounded-lg border-2 transition-all
                ${
                  color === presetColor
                    ? 'border-gray-800 scale-110'
                    : 'border-gray-200 hover:border-gray-400'
                }
              `}
              style={{ backgroundColor: presetColor }}
              title={presetColor}
            />
          ))}
        </div>
      </div>

      {/* Custom Color */}
      <div className="p-3 border-t border-gray-200">
        <h4 className="text-xs font-medium text-gray-700 mb-2">
          {t('customColor')}
        </h4>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
            />
            <Palette className="absolute inset-0 w-4 h-4 m-auto pointer-events-none text-white mix-blend-difference" />
          </div>
          <input
            type="text"
            value={customColor}
            onChange={e => {
              const value = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                setCustomColor(value);
                if (value.length === 7) {
                  onChange(value);
                }
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-mono"
            placeholder="#00FF88"
            maxLength={7}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{t('customColorHelp')}</p>
      </div>

      {/* Preview */}
      <div className="p-3 border-t border-gray-200">
        <h4 className="text-xs font-medium text-gray-700 mb-2">
          {t('preview')}
        </h4>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: color }}
          >
            A
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {t('sampleCategory')}
            </div>
            <div className="text-gray-500 font-mono">{color}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

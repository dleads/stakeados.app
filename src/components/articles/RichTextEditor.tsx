'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Link,
  Image,
  List,
  ListOrdered,
  Quote,
  Code,
  Eye,
  EyeOff,
  Save,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/types/content';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
  placeholder?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  onAutoSave?: (content: string) => void;
  className?: string;
  disabled?: boolean;
}

interface EditorState {
  content: string;
  history: string[];
  historyIndex: number;
  lastSaved: string;
  isDirty: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  locale,
  placeholder,
  autoSave = true,
  autoSaveInterval = 30000, // 30 seconds
  onAutoSave,
  className = '',
  disabled = false,
}) => {
  const t = useTranslations('editor');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const [showPreview, setShowPreview] = useState(false);
  const [editorState, setEditorState] = useState<EditorState>({
    content: value,
    history: [value],
    historyIndex: 0,
    lastSaved: value,
    isDirty: false,
  });

  // Update editor state when value prop changes
  useEffect(() => {
    if (value !== editorState.content) {
      setEditorState(prev => ({
        ...prev,
        content: value,
        history: [value],
        historyIndex: 0,
        lastSaved: value,
        isDirty: false,
      }));
    }
  }, [value]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !onAutoSave || !editorState.isDirty) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      onAutoSave(editorState.content);
      setEditorState(prev => ({
        ...prev,
        lastSaved: prev.content,
        isDirty: false,
      }));
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    editorState.content,
    editorState.isDirty,
    autoSave,
    onAutoSave,
    autoSaveInterval,
  ]);

  const updateContent = useCallback(
    (newContent: string, addToHistory = true) => {
      setEditorState(prev => {
        const newHistory = addToHistory
          ? [...prev.history.slice(0, prev.historyIndex + 1), newContent]
          : prev.history;

        return {
          ...prev,
          content: newContent,
          history: newHistory,
          historyIndex: addToHistory
            ? newHistory.length - 1
            : prev.historyIndex,
          isDirty: newContent !== prev.lastSaved,
        };
      });
      onChange(newContent);
    },
    [onChange]
  );

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateContent(e.target.value);
  };

  const insertText = useCallback(
    (before: string, after: string = '', placeholder: string = '') => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = editorState.content.substring(start, end);
      const textToInsert = selectedText || placeholder;

      const newContent =
        editorState.content.substring(0, start) +
        before +
        textToInsert +
        after +
        editorState.content.substring(end);

      updateContent(newContent);

      // Set cursor position
      setTimeout(() => {
        const newCursorPos = start + before.length + textToInsert.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    },
    [editorState.content, updateContent]
  );

  const insertAtLineStart = useCallback(
    (prefix: string) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const lines = editorState.content.split('\n');
      let currentLine = 0;
      let charCount = 0;

      // Find current line
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= start) {
          currentLine = i;
          break;
        }
        charCount += lines[i].length + 1; // +1 for newline
      }

      lines[currentLine] = prefix + lines[currentLine];
      const newContent = lines.join('\n');
      updateContent(newContent);

      // Set cursor position
      setTimeout(() => {
        const newCursorPos = start + prefix.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    },
    [editorState.content, updateContent]
  );

  const undo = useCallback(() => {
    if (editorState.historyIndex > 0) {
      const newIndex = editorState.historyIndex - 1;
      const newContent = editorState.history[newIndex];
      setEditorState(prev => ({
        ...prev,
        content: newContent,
        historyIndex: newIndex,
        isDirty: newContent !== prev.lastSaved,
      }));
      onChange(newContent);
    }
  }, [editorState.historyIndex, editorState.history, onChange]);

  const redo = useCallback(() => {
    if (editorState.historyIndex < editorState.history.length - 1) {
      const newIndex = editorState.historyIndex + 1;
      const newContent = editorState.history[newIndex];
      setEditorState(prev => ({
        ...prev,
        content: newContent,
        historyIndex: newIndex,
        isDirty: newContent !== prev.lastSaved,
      }));
      onChange(newContent);
    }
  }, [editorState.historyIndex, editorState.history, onChange]);

  const manualSave = useCallback(() => {
    if (onAutoSave && editorState.isDirty) {
      onAutoSave(editorState.content);
      setEditorState(prev => ({
        ...prev,
        lastSaved: prev.content,
        isDirty: false,
      }));
    }
  }, [onAutoSave, editorState.content, editorState.isDirty]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            insertText('**', '**', t('bold_text'));
            break;
          case 'i':
            e.preventDefault();
            insertText('*', '*', t('italic_text'));
            break;
          case 'k':
            e.preventDefault();
            insertText('[', '](url)', t('link_text'));
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 's':
            e.preventDefault();
            manualSave();
            break;
        }
      }
    },
    [insertText, undo, redo, manualSave, t]
  );

  // Convert markdown to HTML for preview (basic implementation)
  const markdownToHtml = useCallback((markdown: string): string => {
    return (
      markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        // Links
        .replace(
          /\[([^\]]*)\]\(([^\)]*)\)/gim,
          '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        )
        // Images
        .replace(
          /!\[([^\]]*)\]\(([^\)]*)\)/gim,
          '<img alt="$1" src="$2" class="max-w-full h-auto" />'
        )
        // Code blocks
        .replace(
          /```([^`]*)```/gim,
          '<pre class="bg-gray-100 p-4 rounded overflow-x-auto"><code>$1</code></pre>'
        )
        // Inline code
        .replace(
          /`([^`]*)`/gim,
          '<code class="bg-gray-100 px-1 rounded">$1</code>'
        )
        // Blockquotes
        .replace(
          /^> (.*$)/gim,
          '<blockquote class="border-l-4 border-gray-300 pl-4 italic">$1</blockquote>'
        )
        // Unordered lists
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul class="list-disc pl-6">$1</ul>')
        // Ordered lists
        .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
        // Line breaks
        .replace(/\n/gim, '<br>')
    );
  }, []);

  const toolbarButtons = [
    {
      icon: Bold,
      title: t('bold'),
      action: () => insertText('**', '**', t('bold_text')),
      shortcut: 'Ctrl+B',
    },
    {
      icon: Italic,
      title: t('italic'),
      action: () => insertText('*', '*', t('italic_text')),
      shortcut: 'Ctrl+I',
    },
    {
      icon: Underline,
      title: t('underline'),
      action: () => insertText('<u>', '</u>', t('underlined_text')),
    },
    { divider: true },
    {
      icon: Heading1,
      title: t('heading_1'),
      action: () => insertAtLineStart('# '),
    },
    {
      icon: Heading2,
      title: t('heading_2'),
      action: () => insertAtLineStart('## '),
    },
    {
      icon: Heading3,
      title: t('heading_3'),
      action: () => insertAtLineStart('### '),
    },
    { divider: true },
    {
      icon: Link,
      title: t('link'),
      action: () => insertText('[', '](url)', t('link_text')),
      shortcut: 'Ctrl+K',
    },
    {
      icon: Image,
      title: t('image'),
      action: () => insertText('![', '](image-url)', t('alt_text')),
    },
    { divider: true },
    {
      icon: List,
      title: t('bullet_list'),
      action: () => insertAtLineStart('* '),
    },
    {
      icon: ListOrdered,
      title: t('numbered_list'),
      action: () => insertAtLineStart('1. '),
    },
    {
      icon: Quote,
      title: t('quote'),
      action: () => insertAtLineStart('> '),
    },
    {
      icon: Code,
      title: t('code'),
      action: () => insertText('`', '`', t('code_text')),
    },
    { divider: true },
    {
      icon: Undo,
      title: t('undo'),
      action: undo,
      disabled: editorState.historyIndex <= 0,
      shortcut: 'Ctrl+Z',
    },
    {
      icon: Redo,
      title: t('redo'),
      action: redo,
      disabled: editorState.historyIndex >= editorState.history.length - 1,
      shortcut: 'Ctrl+Shift+Z',
    },
  ];

  return (
    <div
      className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}
    >
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex items-center gap-1 flex-wrap">
        {toolbarButtons.map((button, index) => {
          if ('divider' in button) {
            return <div key={index} className="w-px h-6 bg-gray-300 mx-1" />;
          }

          const Icon = button.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={button.action}
              disabled={disabled || button.disabled}
              title={`${button.title}${button.shortcut ? ` (${button.shortcut})` : ''}`}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Icon size={16} />
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Preview toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          disabled={disabled}
          title={showPreview ? t('hide_preview') : t('show_preview')}
          className={`p-2 rounded transition-colors ${
            showPreview
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              : 'hover:bg-gray-200'
          }`}
        >
          {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>

        {/* Manual save */}
        {onAutoSave && (
          <button
            type="button"
            onClick={manualSave}
            disabled={disabled || !editorState.isDirty}
            title={`${t('save')} (Ctrl+S)`}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={16} />
          </button>
        )}

        {/* Auto-save status */}
        {autoSave && (
          <div className="text-xs text-gray-500 ml-2">
            {editorState.isDirty ? t('unsaved_changes') : t('saved')}
          </div>
        )}
      </div>

      {/* Editor area */}
      <div className="flex">
        {/* Editor */}
        <div
          className={`${showPreview ? 'w-1/2 border-r border-gray-300' : 'w-full'}`}
        >
          <textarea
            ref={textareaRef}
            value={editorState.content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t('start_writing')}
            disabled={disabled}
            className="w-full h-96 p-4 resize-none border-none outline-none font-mono text-sm leading-relaxed disabled:bg-gray-50 disabled:cursor-not-allowed"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 bg-white">
            <div className="p-4 h-96 overflow-y-auto">
              <div className="text-xs text-gray-500 mb-4 border-b pb-2">
                {t('preview')}
              </div>
              <div
                ref={previewRef}
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html:
                    markdownToHtml(editorState.content) ||
                    `<p class="text-gray-400">${t('preview_empty')}</p>`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer with word count and reading time */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 flex justify-between items-center text-xs text-gray-600">
        <div className="flex gap-4">
          <span>
            {t('words')}:{' '}
            {
              editorState.content.split(/\s+/).filter(word => word.length > 0)
                .length
            }
          </span>
          <span>
            {t('characters')}: {editorState.content.length}
          </span>
          <span>
            {t('reading_time')}:{' '}
            {Math.max(
              1,
              Math.ceil(
                editorState.content.split(/\s+/).filter(word => word.length > 0)
                  .length / 200
              )
            )}{' '}
            {t('minutes')}
          </span>
        </div>

        {locale && <div className="text-gray-500">{locale.toUpperCase()}</div>}
      </div>
    </div>
  );
};

export default RichTextEditor;

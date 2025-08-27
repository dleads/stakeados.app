'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Users, MessageCircle, Eye, Clock, User } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import DraftManager from './DraftManager';
import { useDraftManager } from '@/hooks/useDraftManager';
import type { Article, Locale } from '@/types/content';

interface CollaboratorCursor {
  userId: string;
  userName: string;
  userColor: string;
  position: number;
  section: string;
  timestamp: Date;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  section: string;
  position: number;
  timestamp: Date;
  resolved: boolean;
  replies: Comment[];
}

interface CollaborativeEditorProps {
  article?: Article;
  locale: Locale;
  onSave?: (article: Article) => void;
  onPublish?: (article: Article) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  article,
  locale,
  onSave,

  onError,
  className = '',
}) => {
  const t = useTranslations('collaborative');

  const {
    draft,
    isDirty,

    lastSaved,
    updateLocalizedField,
    saveDraft,
    getWordCount,
    getReadingTime,
    validateDraft,
  } = useDraftManager({
    articleId: article?.id,
    enableAutoSave: true,
    onSave,
    onError,
  });

  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);
  const [collaborators, setCollaborators] = useState<CollaboratorCursor[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Simulate WebSocket connection for real-time collaboration
  useEffect(() => {
    // In a real implementation, this would connect to a WebSocket server
    // For demo purposes, we'll simulate the connection
    setIsConnected(true);

    // Simulate some collaborators
    const mockCollaborators: CollaboratorCursor[] = [
      {
        userId: 'user-1',
        userName: 'Editor Alice',
        userColor: '#3B82F6',
        position: 150,
        section: 'Introduction',
        timestamp: new Date(),
      },
      {
        userId: 'user-2',
        userName: 'Reviewer Bob',
        userColor: '#10B981',
        position: 300,
        section: 'Main Content',
        timestamp: new Date(Date.now() - 120000),
      },
    ];

    const mockComments: Comment[] = [
      {
        id: '1',
        userId: 'user-2',
        userName: 'Reviewer Bob',
        content:
          'This section could use more examples to illustrate the concept.',
        section: 'Introduction',
        position: 150,
        timestamp: new Date(Date.now() - 300000),
        resolved: false,
        replies: [],
      },
      {
        id: '2',
        userId: 'user-3',
        userName: 'Expert Carol',
        content:
          'Great explanation! Maybe add a link to the official documentation?',
        section: 'Main Content',
        position: 450,
        timestamp: new Date(Date.now() - 180000),
        resolved: false,
        replies: [
          {
            id: '2-1',
            userId: 'user-1',
            userName: 'Editor Alice',
            content: "Good idea! I'll add that link.",
            section: 'Main Content',
            position: 450,
            timestamp: new Date(Date.now() - 120000),
            resolved: false,
            replies: [],
          },
        ],
      },
    ];

    setCollaborators(mockCollaborators);
    setComments(mockComments);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Handle content changes
  const handleContentChange = useCallback(
    (value: string) => {
      updateLocalizedField('content', currentLocale, value);

      // In a real implementation, this would broadcast changes to other collaborators
      // broadcastChange('content', currentLocale, value)
    },
    [updateLocalizedField, currentLocale]
  );

  // Handle auto-save
  const handleAutoSave = useCallback(async () => {
    try {
      await saveDraft();
    } catch (error) {
      console.error('Auto-save failed:', error);
      if (onError) onError('Auto-save failed');
    }
  }, [saveDraft, onError]);

  // Add comment
  const handleAddComment = useCallback(() => {
    if (!newComment.trim() || !selectedSection) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'Current User',
      content: newComment.trim(),
      section: selectedSection,
      position: 0, // In a real implementation, this would be the cursor position
      timestamp: new Date(),
      resolved: false,
      replies: [],
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
    setSelectedSection('');
  }, [newComment, selectedSection]);

  // Resolve comment
  const handleResolveComment = useCallback((commentId: string) => {
    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId ? { ...comment, resolved: true } : comment
      )
    );
  }, []);

  // Format time ago
  const formatTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - timestamp.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return t('just_now');
    if (diffInMinutes < 60) return t('minutes_ago', { count: diffInMinutes });
    if (diffInMinutes < 1440)
      return t('hours_ago', { count: Math.floor(diffInMinutes / 60) });
    return t('days_ago', { count: Math.floor(diffInMinutes / 1440) });
  };

  const wordCount = getWordCount(currentLocale);
  const readingTime = getReadingTime(currentLocale);
  const validation = validateDraft();

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {draft.title[currentLocale] || t('untitled_article')}
            </h1>

            {/* Connection status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
              />
              <span className="text-sm text-gray-600">
                {isConnected ? t('connected') : t('disconnected')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Active collaborators */}
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-400" />
              <div className="flex -space-x-2">
                {collaborators.slice(0, 3).map(collaborator => (
                  <div
                    key={collaborator.userId}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: collaborator.userColor }}
                    title={`${collaborator.userName} - ${t('editing')} ${collaborator.section}`}
                  >
                    {collaborator.userName.charAt(0)}
                  </div>
                ))}
                {collaborators.length > 3 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white text-xs font-medium">
                    +{collaborators.length - 3}
                  </div>
                )}
              </div>
            </div>

            {/* Comments toggle */}
            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                showComments
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MessageCircle size={16} />
              {t('comments')} ({comments.filter(c => !c.resolved).length})
            </button>

            {/* Language toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setCurrentLocale('en')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentLocale === 'en'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setCurrentLocale('es')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  currentLocale === 'es'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ES
              </button>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-6">
            <span>
              {wordCount} {t('words')}
            </span>
            <span>
              {readingTime} {t('min_read')}
            </span>
            <span
              className={`flex items-center gap-1 ${isDirty ? 'text-orange-600' : 'text-green-600'}`}
            >
              <Clock size={14} />
              {isDirty ? t('unsaved_changes') : t('saved')}
              {lastSaved && ` • ${formatTimeAgo(lastSaved)}`}
            </span>
          </div>

          {!validation.isValid && (
            <span className="text-red-600 flex items-center gap-1">
              <Eye size={14} />
              {Object.keys(validation.errors).length} {t('validation_errors')}
            </span>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Main editor area */}
        <div className="flex-1 bg-white">
          <div className="p-6">
            {/* Title editor */}
            <div className="mb-6">
              <input
                type="text"
                value={draft.title[currentLocale]}
                onChange={e =>
                  updateLocalizedField('title', currentLocale, e.target.value)
                }
                placeholder={t('enter_title')}
                className="w-full text-3xl font-bold border-none outline-none placeholder-gray-400 resize-none"
                style={{ minHeight: '3rem' }}
              />
            </div>

            {/* Content editor */}
            <div ref={editorRef} className="relative">
              <RichTextEditor
                value={draft.content[currentLocale]}
                onChange={handleContentChange}
                locale={currentLocale}
                placeholder={t('start_writing')}
                autoSave={true}
                onAutoSave={handleAutoSave}
                className="border-none shadow-none"
              />

              {/* Collaborator cursors */}
              {collaborators.map(collaborator => (
                <div
                  key={collaborator.userId}
                  className="absolute pointer-events-none"
                  style={{
                    top: `${Math.min(collaborator.position, 400)}px`,
                    left: '20px',
                  }}
                >
                  <div
                    className="w-0.5 h-6"
                    style={{ backgroundColor: collaborator.userColor }}
                  />
                  <div
                    className="absolute -top-8 left-0 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
                    style={{ backgroundColor: collaborator.userColor }}
                  >
                    {collaborator.userName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comments sidebar */}
        {showComments && (
          <div className="w-80 bg-gray-50 border-l border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">
                {t('comments')}
              </h3>

              {/* Add comment */}
              <div className="space-y-3">
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('select_section')}</option>
                  <option value="title">{t('title')}</option>
                  <option value="introduction">{t('introduction')}</option>
                  <option value="main_content">{t('main_content')}</option>
                  <option value="conclusion">{t('conclusion')}</option>
                </select>

                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder={t('add_comment_placeholder')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || !selectedSection}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('add_comment')}
                </button>
              </div>
            </div>

            {/* Comments list */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {comments
                .filter(c => !c.resolved)
                .map(comment => (
                  <div
                    key={comment.id}
                    className="bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {comment.userAvatar ? (
                          <img
                            src={comment.userAvatar}
                            alt={comment.userName}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                            <User size={12} className="text-gray-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {comment.userName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {comment.section}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 mb-2">
                          {comment.content}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatTimeAgo(comment.timestamp)}</span>
                          <button
                            type="button"
                            onClick={() => handleResolveComment(comment.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {t('resolve')}
                          </button>
                        </div>

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900">
                                    {reply.userName}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatTimeAgo(reply.timestamp)}
                                  </span>
                                </div>
                                <p className="text-gray-700">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {comments.filter(c => !c.resolved).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle
                    size={24}
                    className="mx-auto mb-2 opacity-50"
                  />
                  <p className="text-sm">{t('no_comments_yet')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Draft manager */}
      {article && (
        <div className="bg-gray-50 border-t border-gray-200">
          <DraftManager
            article={article}
            locale={currentLocale}
            onVersionRestore={version => {
              // Handle version restore
              console.log('Restoring version:', version);
            }}
            onCollaboratorInvite={email => {
              // Handle collaborator invite
              console.log('Inviting collaborator:', email);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditor;

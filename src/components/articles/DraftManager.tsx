'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Clock,
  Users,
  History,
  Eye,
  Trash2,
  Copy,
  CheckCircle,
  User,
} from 'lucide-react';

import type { Article, Locale } from '@/types/content';

interface DraftVersion {
  id: string;
  article_id: string;
  version_number: number;
  title: { en: string; es: string };
  content: { en: string; es: string };
  meta_description: { en: string; es: string };
  author_id: string;
  author_name: string;
  created_at: string;
  change_summary?: string;
  word_count: number;
  is_auto_save: boolean;
}

interface CollaboratorActivity {
  id: string;
  article_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  activity_type: 'edit' | 'comment' | 'save' | 'view';
  section?: string;
  timestamp: string;
  is_active: boolean;
}

interface DraftManagerProps {
  article: Article;
  locale: Locale;
  onVersionRestore?: (version: DraftVersion) => void;
  onCollaboratorInvite?: (email: string) => void;
  className?: string;
}

export const DraftManager: React.FC<DraftManagerProps> = ({
  article,
  locale,
  onVersionRestore,
  onCollaboratorInvite,
  className = '',
}) => {
  const t = useTranslations('draft');
  const tCommon = useTranslations('common');

  const [versions, setVersions] = useState<DraftVersion[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorActivity[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<DraftVersion | null>(
    null
  );
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Load draft versions and collaborator activity
  useEffect(() => {
    const loadDraftData = async () => {
      try {
        setLoading(true);

        // In a real implementation, these would be separate API calls
        // For now, we'll simulate the data structure
        const mockVersions: DraftVersion[] = [
          {
            id: '1',
            article_id: article.id,
            version_number: 3,
            title: article.title,
            content: article.content,
            meta_description: article.meta_description,
            author_id: article.author_id,
            author_name: 'Current Author',
            created_at: new Date().toISOString(),
            change_summary: 'Updated conclusion section',
            word_count: article.content[locale].split(/\s+/).length,
            is_auto_save: false,
          },
          {
            id: '2',
            article_id: article.id,
            version_number: 2,
            title: article.title,
            content: {
              en:
                article.content.en.substring(
                  0,
                  article.content.en.length - 100
                ) + '...',
              es:
                article.content.es.substring(
                  0,
                  article.content.es.length - 100
                ) + '...',
            },
            meta_description: article.meta_description,
            author_id: article.author_id,
            author_name: 'Current Author',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            change_summary: 'Added examples and improved formatting',
            word_count: Math.floor(
              article.content[locale].split(/\s+/).length * 0.8
            ),
            is_auto_save: false,
          },
        ];

        const mockCollaborators: CollaboratorActivity[] = [
          {
            id: '1',
            article_id: article.id,
            user_id: article.author_id,
            user_name: 'Current Author',
            activity_type: 'edit',
            section: 'Introduction',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            is_active: true,
          },
          {
            id: '2',
            article_id: article.id,
            user_id: 'editor-1',
            user_name: 'Editor Name',
            activity_type: 'comment',
            section: 'Conclusion',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            is_active: false,
          },
        ];

        setVersions(mockVersions);
        setCollaborators(mockCollaborators);
      } catch (error) {
        console.error('Failed to load draft data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDraftData();
  }, [
    article.id,
    article.content,
    article.title,
    article.meta_description,
    article.author_id,
    locale,
  ]);

  // Restore version
  const handleVersionRestore = useCallback(
    (version: DraftVersion) => {
      if (onVersionRestore) {
        onVersionRestore(version);
      }
      setSelectedVersion(null);
      setShowVersionHistory(false);
    },
    [onVersionRestore]
  );

  // Delete version
  const handleVersionDelete = useCallback(async (versionId: string) => {
    try {
      // In a real implementation, this would be an API call
      setVersions(prev => prev.filter(v => v.id !== versionId));
    } catch (error) {
      console.error('Failed to delete version:', error);
    }
  }, []);

  // Invite collaborator
  const handleInviteCollaborator = useCallback(async () => {
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);

      // In a real implementation, this would send an invitation
      if (onCollaboratorInvite) {
        onCollaboratorInvite(inviteEmail);
      }

      setInviteEmail('');
    } catch (error) {
      console.error('Failed to invite collaborator:', error);
    } finally {
      setInviting(false);
    }
  }, [inviteEmail, onCollaboratorInvite]);

  // Format time ago
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return t('just_now');
    if (diffInMinutes < 60) return t('minutes_ago', { count: diffInMinutes });
    if (diffInMinutes < 1440)
      return t('hours_ago', { count: Math.floor(diffInMinutes / 60) });
    return t('days_ago', { count: Math.floor(diffInMinutes / 1440) });
  };

  // Calculate reading time
  const calculateReadingTime = (wordCount: number): number => {
    return Math.max(1, Math.ceil(wordCount / 200));
  };

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('draft_management')}
          </h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <History size={16} />
              {t('version_history')} ({versions.length})
            </button>

            <button
              type="button"
              onClick={() => setShowCollaborators(!showCollaborators)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Users size={16} />
              {t('collaborators')} (
              {collaborators.filter(c => c.is_active).length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Current draft info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                {t('current_draft')}
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div className="flex items-center gap-4">
                  <span>
                    {t('words')}: {article.content[locale].split(/\s+/).length}
                  </span>
                  <span>
                    {t('reading_time')}:{' '}
                    {calculateReadingTime(
                      article.content[locale].split(/\s+/).length
                    )}{' '}
                    {t('minutes')}
                  </span>
                </div>
                <div>
                  {t('last_modified')}: {formatTimeAgo(article.updated_at)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {article.status === 'draft' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  <Clock size={12} />
                  {t('draft')}
                </span>
              )}
              {article.status === 'review' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  <Eye size={12} />
                  {t('in_review')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Version History */}
        {showVersionHistory && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              {t('version_history')}
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {versions.map(version => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {t('version')} {version.version_number}
                      </span>
                      {version.is_auto_save && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                          {t('auto_save')}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      {version.change_summary || t('no_summary')}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>{formatTimeAgo(version.created_at)}</span>
                      <span>
                        {version.word_count} {t('words')}
                      </span>
                      <span>
                        {t('by')} {version.author_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVersion(version)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={t('preview_version')}
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVersionRestore(version)}
                      className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                      title={t('restore_version')}
                    >
                      <Copy size={16} />
                    </button>

                    {version.version_number > 1 && (
                      <button
                        type="button"
                        onClick={() => handleVersionDelete(version.id)}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        title={t('delete_version')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collaborators */}
        {showCollaborators && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              {t('collaborators')}
            </h4>

            {/* Invite collaborator */}
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder={t('enter_email_to_invite')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleInviteCollaborator}
                disabled={inviting || !inviteEmail.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {inviting ? t('inviting') : t('invite')}
              </button>
            </div>

            {/* Collaborator activity */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {collaborators.map(activity => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {activity.user_avatar ? (
                      <img
                        src={activity.user_avatar}
                        alt={activity.user_name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">
                        {activity.user_name}
                      </span>
                      {activity.is_active && (
                        <span
                          className="w-2 h-2 bg-green-400 rounded-full"
                          title={t('currently_active')}
                        />
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      {activity.activity_type === 'edit' &&
                        t('editing_section', {
                          section: activity.section || 'unknown',
                        })}
                      {activity.activity_type === 'comment' &&
                        t('commented_on', {
                          section: activity.section || 'unknown',
                        })}
                      {activity.activity_type === 'save' && t('saved_changes')}
                      {activity.activity_type === 'view' &&
                        t('viewing_article')}
                    </div>

                    <div className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}

              {collaborators.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Users size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('no_collaborators_yet')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto-save status */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" />
            {t('auto_save_enabled')}
          </div>

          <div>
            {t('last_auto_save')}: {formatTimeAgo(article.updated_at)}
          </div>
        </div>
      </div>

      {/* Version Preview Modal */}
      {selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {t('version_preview')} {selectedVersion.version_number}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedVersion(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="mb-4">
                <h4 className="font-medium text-lg mb-2">
                  {selectedVersion.title[locale]}
                </h4>
                <div className="text-sm text-gray-600 mb-4">
                  {selectedVersion.meta_description[locale]}
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <div
                  dangerouslySetInnerHTML={{
                    __html: selectedVersion.content[locale].replace(
                      /\n/g,
                      '<br>'
                    ),
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {selectedVersion.word_count} {t('words')} •{' '}
                {calculateReadingTime(selectedVersion.word_count)}{' '}
                {t('min_read')}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVersion(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => handleVersionRestore(selectedVersion)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('restore_this_version')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftManager;

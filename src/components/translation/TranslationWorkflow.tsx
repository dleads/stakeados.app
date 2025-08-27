'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Progress from '@/components/ui/Progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Languages,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Save,
  Send,
  RefreshCw,
  Edit,
} from 'lucide-react';
import { Locale, Article } from '@/types/content';
import { useToast } from '@/components/ui/Toast';

interface TranslationTask {
  id: string;
  content_id: string;
  content_type: 'article' | 'news';
  source_locale: Locale;
  target_locale: Locale;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_review';
  translator_id?: string;
  translator_name?: string;
  original_content: {
    title: string;
    content: string;
    meta_description?: string;
  };
  translated_content?: {
    title: string;
    content: string;
    meta_description?: string;
  };
  ai_suggestion?: {
    title: string;
    content: string;
    meta_description?: string;
  };
  assigned_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface TranslationWorkflowProps {
  contentId: string;
  contentType: 'article' | 'news';
  currentContent: Article;
  onTranslationComplete?: () => void;
}

export default function TranslationWorkflow({
  contentId,
  contentType,
  currentContent,
  onTranslationComplete,
}: TranslationWorkflowProps) {
  const t = useTranslations('translation');
  const { addToast } = useToast();

  const [tasks, setTasks] = useState<TranslationTask[]>([]);
  const [activeTask, setActiveTask] = useState<TranslationTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  const [translatedMetaDescription, setTranslatedMetaDescription] =
    useState('');

  useEffect(() => {
    fetchTranslationTasks();
  }, [contentId]);

  const fetchTranslationTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/translation/tasks?content_id=${contentId}&content_type=${contentType}`
      );
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching translation tasks:', error);
      addToast({
        title: t('error.fetch_tasks'),
        message: t('error.try_again'),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const createTranslationTask = async (targetLocale: Locale) => {
    try {
      const sourceLocale = targetLocale === 'en' ? 'es' : 'en';

      const response = await fetch('/api/translation/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_id: contentId,
          content_type: contentType,
          source_locale: sourceLocale,
          target_locale: targetLocale,
          original_content: {
            title: currentContent.title[sourceLocale],
            content: currentContent.content[sourceLocale],
            meta_description: currentContent.meta_description[sourceLocale],
          },
        }),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [...prev, newTask]);
        addToast({
          title: t('success.task_created'),
          message: t('success.task_created_desc'),
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Error creating translation task:', error);
      addToast({
        title: t('error.create_task'),
        message: t('error.try_again'),
        type: 'error',
      });
    }
  };

  const generateAITranslation = async (task: TranslationTask) => {
    setGeneratingAI(true);
    try {
      const response = await fetch('/api/translation/ai-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          source_locale: task.source_locale,
          target_locale: task.target_locale,
          content: task.original_content,
        }),
      });

      if (response.ok) {
        const aiTranslation = await response.json();
        setTasks(prev =>
          prev.map(t =>
            t.id === task.id ? { ...t, ai_suggestion: aiTranslation } : t
          )
        );

        // Auto-fill the form with AI suggestions
        setTranslatedTitle(aiTranslation.title);
        setTranslatedContent(aiTranslation.content);
        setTranslatedMetaDescription(aiTranslation.meta_description);

        addToast({
          title: t('success.ai_generated'),
          message: t('success.ai_generated_desc'),
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Error generating AI translation:', error);
      addToast({
        title: t('error.ai_translation'),
        message: t('error.try_again'),
        type: 'error',
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const saveTranslation = async (
    task: TranslationTask,
    status: 'in_progress' | 'completed'
  ) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/translation/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          translated_content: {
            title: translatedTitle,
            content: translatedContent,
            meta_description: translatedMetaDescription,
          },
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(t => (t.id === task.id ? updatedTask : t)));

        if (status === 'completed') {
          // Update the original content with the translation
          await updateContentTranslation(task);
          onTranslationComplete?.();
        }

        addToast({
          title:
            status === 'completed'
              ? t('success.translation_completed')
              : t('success.translation_saved'),
          message:
            status === 'completed'
              ? t('success.translation_completed_desc')
              : t('success.translation_saved_desc'),
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Error saving translation:', error);
      addToast({
        title: t('error.save_translation'),
        message: t('error.try_again'),
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateContentTranslation = async (task: TranslationTask) => {
    try {
      const response = await fetch(
        `/api/${contentType}s/${contentId}/translation`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locale: task.target_locale,
            title: translatedTitle,
            content: translatedContent,
            meta_description: translatedMetaDescription,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update content translation');
      }
    } catch (error) {
      console.error('Error updating content translation:', error);
      throw error;
    }
  };

  const getStatusColor = (status: TranslationTask['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'needs_review':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: TranslationTask['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <Edit className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'needs_review':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return (completed / tasks.length) * 100;
  };

  const missingTranslations = ['en', 'es'].filter(
    locale =>
      !currentContent.title[locale as Locale] ||
      !currentContent.content[locale as Locale]
  ) as Locale[];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            {t('loading.tasks')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Translation Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{t('progress.label')}</span>
                <span>{Math.round(calculateProgress())}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>

            {missingTranslations.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('missing_translations', {
                    locales: missingTranslations.join(', '),
                  })}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              {missingTranslations.map(locale => (
                <Button
                  key={locale}
                  variant="outline"
                  size="sm"
                  onClick={() => createTranslationTask(locale)}
                >
                  {t('create_task', { locale: locale.toUpperCase() })}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Translation Tasks */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('tasks.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                        <span className="ml-1">
                          {t(`status.${task.status}`)}
                        </span>
                      </Badge>
                      <span className="font-medium">
                        {task.source_locale.toUpperCase()} →{' '}
                        {task.target_locale.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {task.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateAITranslation(task)}
                          disabled={generatingAI}
                        >
                          {generatingAI ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Languages className="h-4 w-4 mr-1" />
                          )}
                          {t('ai_translate')}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveTask(task);
                          if (task.translated_content) {
                            setTranslatedTitle(task.translated_content.title);
                            setTranslatedContent(
                              task.translated_content.content
                            );
                            setTranslatedMetaDescription(
                              task.translated_content.meta_description || ''
                            );
                          } else if (task.ai_suggestion) {
                            setTranslatedTitle(task.ai_suggestion.title);
                            setTranslatedContent(task.ai_suggestion.content);
                            setTranslatedMetaDescription(
                              task.ai_suggestion.meta_description || ''
                            );
                          }
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t('edit')}
                      </Button>
                    </div>
                  </div>

                  {task.translator_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {t('assigned_to', { name: task.translator_name })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Translation Editor */}
      {activeTask && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t('editor.title', {
                from: activeTask.source_locale.toUpperCase(),
                to: activeTask.target_locale.toUpperCase(),
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">{t('editor.tab')}</TabsTrigger>
                <TabsTrigger value="preview">{t('preview.tab')}</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Original Content */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">{t('original.title')}</h3>

                    <div>
                      <Label>{t('fields.title')}</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {activeTask.original_content.title}
                      </div>
                    </div>

                    <div>
                      <Label>{t('fields.content')}</Label>
                      <div className="p-3 bg-muted rounded-md max-h-60 overflow-y-auto">
                        <div className="whitespace-pre-wrap">
                          {activeTask.original_content.content}
                        </div>
                      </div>
                    </div>

                    {activeTask.original_content.meta_description && (
                      <div>
                        <Label>{t('fields.meta_description')}</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {activeTask.original_content.meta_description}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Translation Form */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">{t('translation.title')}</h3>

                    <div>
                      <Label htmlFor="translated-title">
                        {t('fields.title')}
                      </Label>
                      <Input
                        id="translated-title"
                        value={translatedTitle}
                        onChange={e => setTranslatedTitle(e.target.value)}
                        placeholder={t('placeholders.title')}
                      />
                    </div>

                    <div>
                      <Label htmlFor="translated-content">
                        {t('fields.content')}
                      </Label>
                      <Textarea
                        id="translated-content"
                        value={translatedContent}
                        onChange={e => setTranslatedContent(e.target.value)}
                        placeholder={t('placeholders.content')}
                        rows={12}
                      />
                    </div>

                    <div>
                      <Label htmlFor="translated-meta">
                        {t('fields.meta_description')}
                      </Label>
                      <Textarea
                        id="translated-meta"
                        value={translatedMetaDescription}
                        onChange={e =>
                          setTranslatedMetaDescription(e.target.value)
                        }
                        placeholder={t('placeholders.meta_description')}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => saveTranslation(activeTask, 'in_progress')}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {t('actions.save_draft')}
                  </Button>

                  <Button
                    onClick={() => saveTranslation(activeTask, 'completed')}
                    disabled={saving || !translatedTitle || !translatedContent}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {t('actions.complete')}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-lg p-6">
                  <h1 className="text-2xl font-bold mb-4">{translatedTitle}</h1>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap">
                      {translatedContent}
                    </div>
                  </div>
                  {translatedMetaDescription && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <Label className="text-sm font-medium">
                        {t('fields.meta_description')}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {translatedMetaDescription}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// React hooks for content management

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useCallback } from 'react';
import { ContentService } from '@/lib/services/contentService';
import { aiContentService } from '@/lib/services/aiContentService';
import type {
  ArticleFilters,
  NewsFilters,
  SearchParams,
  CreateArticleProposal,
  CreateArticle,
  UpdateArticle,
  Locale,
} from '@/types/content';

// Article Hooks
export function useArticles(filters: ArticleFilters = {}, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['articles', filters],
    queryFn: ({ pageParam = 0 }) =>
      ContentService.getArticles(filters, pageParam as number, 20),
    getNextPageParam: (lastPage: any) =>
      lastPage?.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 0,
    enabled,
  });
}

export function useArticle(id: string, enabled = true) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => ContentService.getArticleById(id),
    enabled: enabled && !!id,
  });
}

export function useSearchArticles(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ['searchArticles', params],
    queryFn: () => ContentService.searchArticles(params),
    enabled: enabled && !!params.query,
  });
}

export function useRelatedArticles(
  articleId: string,
  limit = 5,
  enabled = true
) {
  return useQuery({
    queryKey: ['relatedArticles', articleId, limit],
    queryFn: () => ContentService.getRelatedArticles(articleId, limit),
    enabled: enabled && !!articleId,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (article: CreateArticle) =>
      ContentService.createArticle(article),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (article: UpdateArticle) =>
      ContentService.updateArticle(article),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', data.id] });
    },
  });
}

export function usePublishArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      articleId,
      publishAt,
    }: {
      articleId: string;
      publishAt?: Date;
    }) => ContentService.publishArticle(articleId, publishAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

// Article Proposal Hooks
export function useArticleProposals(filters = {}, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['articleProposals', filters],
    queryFn: ({ pageParam = 0 }) =>
      ContentService.getArticleProposals(filters, pageParam as number, 20),
    getNextPageParam: (lastPage: any) =>
      lastPage?.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 0,
    enabled,
  });
}

export function useCreateArticleProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (proposal: CreateArticleProposal) =>
      ContentService.createArticleProposal(proposal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articleProposals'] });
    },
  });
}

export function useUpdateProposalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      proposalId,
      status,
      feedback,
    }: {
      proposalId: string;
      status: 'approved' | 'rejected' | 'changes_requested';
      feedback?: string;
    }) => ContentService.updateProposalStatus(proposalId, status, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articleProposals'] });
    },
  });
}

// News Hooks
export function useNews(filters: NewsFilters = {}, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['news', filters],
    queryFn: ({ pageParam = 0 }) =>
      ContentService.getNews(filters, pageParam as number, 20),
    getNextPageParam: (lastPage: any) =>
      lastPage?.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 0,
    enabled,
  });
}

export function useTrendingNews(hoursBack = 24, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['trendingNews', hoursBack, limit],
    queryFn: () => ContentService.getTrendingNews(hoursBack, limit),
    enabled,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useNewsArticle(id: string, enabled = true) {
  return useQuery({
    queryKey: ['newsArticle', id],
    queryFn: () => ContentService.getNewsById(id),
    enabled: enabled && !!id,
  });
}

// Category and Tag Hooks
export function useCategories(enabled = true) {
  return useQuery({
    queryKey: ['categories'],
    queryFn: ContentService.getCategories,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTags(limit = 100, enabled = true) {
  return useQuery({
    queryKey: ['tags', limit],
    queryFn: () => ContentService.getTags(limit),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => ContentService.createTag(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

// Interaction Hooks
export function useRecordInteraction() {
  return useMutation({
    mutationFn: ({
      contentId,
      contentType,
      interactionType,
      metadata = {},
    }: {
      contentId: string;
      contentType: 'article' | 'news';
      interactionType: 'view' | 'like' | 'share' | 'bookmark';
      metadata?: Record<string, any>;
    }) =>
      ContentService.recordInteraction(
        contentId,
        contentType,
        interactionType,
        metadata
      ),
  });
}

export function useUserInteractions(
  userId: string,
  contentType?: 'article' | 'news',
  interactionType?: 'view' | 'like' | 'share' | 'bookmark',
  enabled = true
) {
  return useQuery({
    queryKey: ['userInteractions', userId, contentType, interactionType],
    queryFn: () =>
      ContentService.getUserInteractions(userId, contentType, interactionType),
    enabled: enabled && !!userId,
  });
}

export function useContentEngagement(
  contentId: string,
  contentType: 'article' | 'news',
  enabled = true
) {
  return useQuery({
    queryKey: ['contentEngagement', contentId, contentType],
    queryFn: () => ContentService.getContentEngagement(contentId, contentType),
    enabled: enabled && !!contentId,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time engagement
  });
}

// Subscription Hooks
export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subscriptionType,
      target,
    }: {
      subscriptionType: 'category' | 'tag' | 'author';
      target: string;
    }) => ContentService.createSubscription(subscriptionType, target),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['personalizedFeed'] });
    },
  });
}

export function useRemoveSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subscriptionType,
      target,
    }: {
      subscriptionType: 'category' | 'tag' | 'author';
      target: string;
    }) => ContentService.removeSubscription(subscriptionType, target),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['personalizedFeed'] });
    },
  });
}

export function useUserSubscriptions(userId: string, enabled = true) {
  return useQuery({
    queryKey: ['userSubscriptions', userId],
    queryFn: () => ContentService.getUserSubscriptions(userId),
    enabled: enabled && !!userId,
  });
}

// Personalized Feed Hook
export function usePersonalizedFeed(
  userId: string,
  contentType: 'articles' | 'news' | 'both' = 'both',
  limit = 20,
  enabled = true
) {
  return useQuery({
    queryKey: ['personalizedFeed', userId, contentType, limit],
    queryFn: () =>
      ContentService.getPersonalizedFeed(userId, contentType, limit),
    enabled: enabled && !!userId,
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
}

// AI Processing Hooks
export function useAISummarize() {
  return useMutation({
    mutationFn: ({
      content,
      targetLength = 150,
      locale = 'en',
    }: {
      content: string;
      targetLength?: number;
      locale?: Locale;
    }) => aiContentService.summarizeArticle(content, targetLength, locale),
  });
}

export function useAITranslate() {
  return useMutation({
    mutationFn: ({
      content,
      fromLocale,
      toLocale,
    }: {
      content: string;
      fromLocale: Locale;
      toLocale: Locale;
    }) => aiContentService.translateContent(content, fromLocale, toLocale),
  });
}

export function useAIExtractKeywords() {
  return useMutation({
    mutationFn: (content: string) => aiContentService.extractKeywords(content),
  });
}

export function useAISuggestTags() {
  return useMutation({
    mutationFn: (content: string) => aiContentService.suggestTags(content),
  });
}

export function useAIModerateContent() {
  return useMutation({
    mutationFn: (content: string) => aiContentService.moderateContent(content),
  });
}

export function useAIGenerateMetaDescription() {
  return useMutation({
    mutationFn: ({
      title,
      content,
      locale = 'en',
    }: {
      title: string;
      content: string;
      locale?: Locale;
    }) => aiContentService.generateMetaDescription(title, content, locale),
  });
}

// Utility Hooks
export function useIncrementViewCount() {
  return useMutation({
    mutationFn: (articleId: string) =>
      ContentService.incrementViewCount(articleId),
  });
}

// Custom hook for content interaction tracking
export function useContentInteractionTracker() {
  const recordInteraction = useRecordInteraction();

  const trackView = useCallback(
    (contentId: string, contentType: 'article' | 'news') => {
      recordInteraction.mutate({
        contentId,
        contentType,
        interactionType: 'view',
        metadata: { timestamp: new Date().toISOString() },
      });
    },
    [recordInteraction]
  );

  const trackLike = useCallback(
    (contentId: string, contentType: 'article' | 'news') => {
      recordInteraction.mutate({
        contentId,
        contentType,
        interactionType: 'like',
        metadata: { timestamp: new Date().toISOString() },
      });
    },
    [recordInteraction]
  );

  const trackShare = useCallback(
    (contentId: string, contentType: 'article' | 'news', platform?: string) => {
      recordInteraction.mutate({
        contentId,
        contentType,
        interactionType: 'share',
        metadata: {
          timestamp: new Date().toISOString(),
          platform: platform || 'unknown',
        },
      });
    },
    [recordInteraction]
  );

  const trackBookmark = useCallback(
    (contentId: string, contentType: 'article' | 'news') => {
      recordInteraction.mutate({
        contentId,
        contentType,
        interactionType: 'bookmark',
        metadata: { timestamp: new Date().toISOString() },
      });
    },
    [recordInteraction]
  );

  return {
    trackView,
    trackLike,
    trackShare,
    trackBookmark,
    isLoading: recordInteraction.isPending,
  };
}

// Custom hook for content filtering
export function useContentFilters<T>(initialFilters: T) {
  const queryClient = useQueryClient();

  const updateFilters = useCallback(
    (newFilters: Partial<T>) => {
      const updatedFilters = { ...initialFilters, ...newFilters };

      // Invalidate relevant queries when filters change
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['news'] });

      return updatedFilters;
    },
    [initialFilters, queryClient]
  );

  const resetFilters = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['articles'] });
    queryClient.invalidateQueries({ queryKey: ['news'] });
    return initialFilters;
  }, [initialFilters, queryClient]);

  return {
    updateFilters,
    resetFilters,
  };
}

'use client';

// import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UserSubscription,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  SubscriptionFilters,
  SubscriptionStats,
} from '@/types/notifications';

export function useSubscriptions(filters?: SubscriptionFilters) {
  const queryClient = useQueryClient();

  const {
    data: subscriptions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['subscriptions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.isActive !== undefined)
        params.append('isActive', filters.isActive.toString());
      if (filters?.frequency) params.append('frequency', filters.frequency);

      const response = await fetch(`/api/subscriptions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      const data = await response.json();
      return data.subscriptions as UserSubscription[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (request: CreateSubscriptionRequest) => {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }
      const data = await response.json();
      return data.subscription as UserSubscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: UpdateSubscriptionRequest;
    }) => {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }
      const data = await response.json();
      return data.subscription as UserSubscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete subscription');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-stats'] });
    },
  });

  return {
    subscriptions,
    isLoading,
    error,
    refetch,
    createSubscription: createMutation.mutate,
    updateSubscription: updateMutation.mutate,
    deleteSubscription: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useSubscriptionStats() {
  return useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const response = await fetch('/api/subscriptions/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription stats');
      }
      const data = await response.json();
      return data.stats as SubscriptionStats;
    },
  });
}

export function useSubscriptionTargets() {
  return useQuery({
    queryKey: ['subscription-targets'],
    queryFn: async () => {
      const response = await fetch('/api/subscriptions/targets');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription targets');
      }
      const data = await response.json();
      return data.targets as {
        categories: any[];
        tags: any[];
        authors: any[];
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

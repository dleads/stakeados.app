'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Search, Bell, BellOff } from 'lucide-react';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type {
  UserSubscription,
  SubscriptionFilters,
} from '@/types/notifications';

interface SubscriptionManagerProps {
  className?: string;
}

export function SubscriptionManager({ className }: SubscriptionManagerProps) {
  const t = useTranslations('notifications');
  const { user } = useAuth();
  const supabase = createClient();
  const subscriptionService = new SubscriptionService(supabase);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [availableTargets, setAvailableTargets] = useState<{
    categories: any[];
    tags: any[];
    authors: any[];
  }>({ categories: [], tags: [], authors: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SubscriptionFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'category' | 'tag' | 'author'>(
    'category'
  );

  useEffect(() => {
    if (user?.id) {
      loadSubscriptions();
      loadAvailableTargets();
    }
  }, [user?.id, filters]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getUserSubscriptions(
        user!.id,
        filters
      );
      setSubscriptions(data);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTargets = async () => {
    try {
      const targets = await subscriptionService.getAvailableSubscriptionTargets();
      setAvailableTargets(targets);
    } catch (error) {
      console.error('Error loading available targets:', error);
    }
  };

  const handleCreateSubscription = async (
    type: 'category' | 'tag' | 'author',
    target: string,
    frequency: 'immediate' | 'daily' | 'weekly' = 'immediate'
  ) => {
    try {
      await subscriptionService.createSubscription(user!.id, {
        subscriptionType: type,
        subscriptionTarget: target,
        frequency,
      });
      await loadSubscriptions();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
  };

  const handleUpdateSubscription = async (
    subscriptionId: string,
    updates: {
      frequency?: 'daily' | 'weekly' | 'immediate';
      isActive?: boolean;
    }
  ) => {
    try {
      await subscriptionService.updateSubscription(
        user!.id,
        subscriptionId,
        updates
      );
      await loadSubscriptions();
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    try {
      await subscriptionService.deleteSubscription(user!.id, subscriptionId);
      await loadSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        sub.targetName?.toLowerCase().includes(query) ||
        sub.subscriptionTarget.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const getTargetIcon = (subscription: UserSubscription) => {
    if (
      subscription.subscriptionType === 'category' &&
      subscription.targetMetadata?.icon
    ) {
      return subscription.targetMetadata.icon;
    }
    return subscription.subscriptionType === 'author' ? '👤' : '🏷️';
  };

  const getTargetColor = (subscription: UserSubscription) => {
    if (
      subscription.subscriptionType === 'category' &&
      subscription.targetMetadata?.color
    ) {
      return subscription.targetMetadata.color;
    }
    return '#00FF88';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{t('subscriptions.title')}</h2>
          <p className="text-gray-600">{t('subscriptions.description')}</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('subscriptions.add')}
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t('subscriptions.search')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.type || 'all'}
          onValueChange={(value: string) =>
            setFilters({
              ...filters,
              type:
                value === 'all'
                  ? undefined
                  : (value as 'category' | 'tag' | 'author'),
            })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('subscriptions.filters.all')}</SelectItem>
            <SelectItem value="category">
              {t('subscriptions.filters.categories')}
            </SelectItem>
            <SelectItem value="tag">{t('subscriptions.filters.tags')}</SelectItem>
            <SelectItem value="author">{t('subscriptions.filters.authors')}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={
            filters.isActive === undefined ? 'all' : filters.isActive.toString()
          }
          onValueChange={(value: string) =>
            setFilters({
              ...filters,
              isActive: value === 'all' ? undefined : value === 'true',
            })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('subscriptions.filters.allStatus')}
            </SelectItem>
            <SelectItem value="true">{t('subscriptions.filters.active')}</SelectItem>
            <SelectItem value="false">
              {t('subscriptions.filters.inactive')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {filteredSubscriptions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('subscriptions.empty.title')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t('subscriptions.empty.description')}
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                {t('subscriptions.empty.action')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredSubscriptions.map(subscription => (
            <Card key={subscription.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: getTargetColor(subscription) }}
                    >
                      {getTargetIcon(subscription)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">
                          {subscription.targetName ||
                            subscription.subscriptionTarget}
                        </h3>
                        <Badge
                          variant={
                            subscription.subscriptionType === 'category'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {t(
                            `subscriptions.types.${subscription.subscriptionType}`
                          )}
                        </Badge>
                        {!subscription.isActive && (
                          <Badge variant="outline">
                            <BellOff className="w-3 h-3 mr-1" />
                            {t('subscriptions.inactive')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {t(`subscriptions.frequency.${subscription.frequency}`)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label
                        htmlFor={`active-${subscription.id}`}
                        className="text-sm"
                      >
                        {t('subscriptions.active')}
                      </Label>
                      <Switch
                        id={`active-${subscription.id}`}
                        checked={subscription.isActive}
                        onCheckedChange={checked =>
                          handleUpdateSubscription(subscription.id, {
                            isActive: checked,
                          })
                        }
                      />
                    </div>

                    <Select
                      value={subscription.frequency}
                      onValueChange={async (value: string) =>
                        handleUpdateSubscription(subscription.id, {
                          frequency: value as 'daily' | 'weekly' | 'immediate',
                        })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">
                          {t('subscriptions.frequency.immediate')}
                        </SelectItem>
                        <SelectItem value="daily">
                          {t('subscriptions.frequency.daily')}
                        </SelectItem>
                        <SelectItem value="weekly">
                          {t('subscriptions.frequency.weekly')}
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubscription(subscription.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Subscription Form */}
      {showAddForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('subscriptions.add')}</CardTitle>
            <CardDescription>
              {t('subscriptions.addDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={selectedTab}
              onValueChange={value => setSelectedTab(value as any)}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="category">
                  {t('subscriptions.types.category')}
                </TabsTrigger>
                <TabsTrigger value="tag">
                  {t('subscriptions.types.tag')}
                </TabsTrigger>
                <TabsTrigger value="author">
                  {t('subscriptions.types.author')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="category" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableTargets.categories.map(category => (
                    <Card
                      key={category.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() =>
                        handleCreateSubscription('category', category.id)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.icon || '📁'}
                          </div>
                          <div>
                            <h4 className="font-medium">{category.name.en}</h4>
                            <p className="text-sm text-gray-600">
                              {category.slug}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tag" className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availableTargets.tags.map(tag => (
                    <Button
                      key={tag.name}
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateSubscription('tag', tag.name)}
                      className="justify-start"
                    >
                      #{tag.name}
                      <Badge variant="secondary" className="ml-2">
                        {tag.usage_count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="author" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableTargets.authors.map(author => (
                    <Card
                      key={author.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() =>
                        handleCreateSubscription('author', author.id)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {author.avatar_url ? (
                              <img
                                src={author.avatar_url}
                                alt={author.full_name || author.email}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {(author.full_name || author.email)
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">
                              {author.full_name || author.email}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {t('subscriptions.author')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

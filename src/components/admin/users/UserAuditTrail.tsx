'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  History,
  User,
  Shield,
  Clock,
  ArrowRight,
  RefreshCw,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AuditEntry {
  id: string;
  user_id: string;
  old_role?: string;
  new_role?: string;
  changed_by: string;
  reason?: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  changed_by_user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface UserAuditTrailProps {
  userId?: string;
  showAllUsers?: boolean;
}

export default function UserAuditTrail({
  userId,
  showAllUsers = false,
}: UserAuditTrailProps) {
  const t = useTranslations('admin.users.audit');
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAuditTrail();
  }, [userId, page]);

  const loadAuditTrail = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (userId && !showAllUsers) {
        params.set('user_id', userId);
      }

      const response = await fetch(`/api/admin/users/audit?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAuditEntries(data.entries);
        setTotalPages(data.totalPages);
      } else {
        throw new Error('Failed to load audit trail');
      }
    } catch (error) {
      console.error('Error loading audit trail:', error);
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'genesis':
        return 'default';
      case 'citizen':
        return 'secondary';
      case 'student':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getChangeType = (oldRole?: string, newRole?: string) => {
    if (!oldRole && newRole) return 'created';
    if (oldRole && !newRole) return 'deleted';
    if (oldRole !== newRole) return 'modified';
    return 'unknown';
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return <User className="h-4 w-4 text-green-500" />;
      case 'deleted':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'modified':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          {showAllUsers ? t('titleAll') : t('title')}
        </CardTitle>
        <CardDescription>
          {showAllUsers ? t('descriptionAll') : t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" onClick={loadAuditTrail} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('actions.refresh')}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        ) : auditEntries.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>{t('noEntries')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditEntries.map(entry => {
              const changeType = getChangeType(entry.old_role, entry.new_role);

              return (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {getChangeIcon(changeType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={entry.user?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {entry.user?.full_name
                                ?.split(' ')
                                .map(n => n[0])
                                .join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">
                            {entry.user?.full_name || entry.user?.email}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          {entry.old_role && (
                            <Badge
                              variant={getRoleColor(entry.old_role) as any}
                              className="text-xs"
                            >
                              {entry.old_role}
                            </Badge>
                          )}

                          {entry.old_role && entry.new_role && (
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                          )}

                          {entry.new_role && (
                            <Badge
                              variant={getRoleColor(entry.new_role) as any}
                              className="text-xs"
                            >
                              {entry.new_role}
                            </Badge>
                          )}
                        </div>

                        {entry.reason && (
                          <div className="flex items-start gap-2 mb-2">
                            <FileText className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-gray-600">
                              {entry.reason}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(entry.created_at), {
                                addSuffix: true,
                              })}
                            </div>

                            {entry.changed_by_user && (
                              <div className="flex items-center gap-1">
                                <span>{t('changedBy')}:</span>
                                <Avatar className="h-4 w-4">
                                  <AvatarImage
                                    src={entry.changed_by_user.avatar_url}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {entry.changed_by_user.full_name
                                      ?.split(' ')
                                      .map(n => n[0])
                                      .join('') || 'A'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {entry.changed_by_user.full_name ||
                                    entry.changed_by_user.email}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {t('pagination.page')} {page} {t('pagination.of')} {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('pagination.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {t('pagination.next')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

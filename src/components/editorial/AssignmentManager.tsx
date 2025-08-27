'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  Filter,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import { EditorialService } from '@/lib/services/editorialService';
import type { EditorialAssignment, AssignmentFilters } from '@/types/editorial';

interface AssignmentManagerProps {
  className?: string;
  userId?: string; // If provided, shows only assignments for this user
}

export function AssignmentManager({
  className = '',
  userId,
}: AssignmentManagerProps) {
  const t = useTranslations('editorial');
  const [assignments, setAssignments] = useState<EditorialAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AssignmentFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [filters, userId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = userId
        ? await EditorialService.getMyAssignments(userId)
        : await EditorialService.getAssignments(filters);
      setAssignments(data);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load assignments'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (assignmentId: string, status: string) => {
    try {
      await EditorialService.updateAssignment(assignmentId, {
        status: status as any,
      });
      await loadAssignments();
    } catch (err) {
      console.error('Error updating assignment:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const isOverdue = (dueDate: string | undefined, status: string) => {
    if (!dueDate || status === 'completed' || status === 'cancelled')
      return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {userId
              ? t('assignments.my_assignments')
              : t('assignments.all_assignments')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('assignments.subtitle', { count: assignments.length })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('assignments.filters')}
          </button>
          {!userId && (
            <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              {t('assignments.create_assignment')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.status || ''}
              onChange={e =>
                setFilters({ ...filters, status: e.target.value || undefined })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('assignments.all_statuses')}</option>
              <option value="assigned">
                {t('assignments.status.assigned')}
              </option>
              <option value="in_progress">
                {t('assignments.status.in_progress')}
              </option>
              <option value="completed">
                {t('assignments.status.completed')}
              </option>
              <option value="cancelled">
                {t('assignments.status.cancelled')}
              </option>
            </select>

            <select
              value={filters.assignment_type || ''}
              onChange={e =>
                setFilters({
                  ...filters,
                  assignment_type: e.target.value || undefined,
                })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('assignments.all_types')}</option>
              <option value="review">{t('assignments.type.review')}</option>
              <option value="edit">{t('assignments.type.edit')}</option>
              <option value="moderate">{t('assignments.type.moderate')}</option>
              <option value="approve">{t('assignments.type.approve')}</option>
            </select>

            <select
              value={filters.priority || ''}
              onChange={e =>
                setFilters({
                  ...filters,
                  priority: e.target.value || undefined,
                })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t('assignments.all_priorities')}</option>
              <option value="urgent">{t('assignments.priority.urgent')}</option>
              <option value="high">{t('assignments.priority.high')}</option>
              <option value="medium">{t('assignments.priority.medium')}</option>
              <option value="low">{t('assignments.priority.low')}</option>
            </select>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.overdue_only || false}
                onChange={e =>
                  setFilters({ ...filters, overdue_only: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('assignments.overdue_only')}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('assignments.no_assignments')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('assignments.no_assignments_description')}
            </p>
          </div>
        ) : (
          assignments.map(assignment => (
            <div
              key={assignment.id}
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 border transition-all hover:shadow-md ${
                isOverdue(assignment.due_date, assignment.status)
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {assignment.content?.title ||
                        `${assignment.content_type} #${assignment.content_id.slice(0, 8)}`}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}
                    >
                      {t(`assignments.status.${assignment.status}`)}
                    </span>
                    <span
                      className={`text-sm font-medium ${getPriorityColor(assignment.priority)}`}
                    >
                      {t(`assignments.priority.${assignment.priority}`)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span>{assignment.assignee?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="capitalize">
                        {t(`assignments.type.${assignment.assignment_type}`)}
                      </span>
                    </div>
                    {assignment.due_date && (
                      <div
                        className={`flex items-center ${isOverdue(assignment.due_date, assignment.status) ? 'text-red-600 dark:text-red-400' : ''}`}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>
                          {t('assignments.due')}:{' '}
                          {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                        {isOverdue(assignment.due_date, assignment.status) && (
                          <AlertTriangle className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    )}
                  </div>

                  {assignment.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {assignment.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {assignment.status === 'assigned' && (
                    <button
                      onClick={() =>
                        handleStatusUpdate(assignment.id, 'in_progress')
                      }
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      {t('assignments.start')}
                    </button>
                  )}
                  {assignment.status === 'in_progress' && (
                    <button
                      onClick={() =>
                        handleStatusUpdate(assignment.id, 'completed')
                      }
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      {t('assignments.complete')}
                    </button>
                  )}
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {assignment.status === 'completed' && assignment.completed_at && (
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>
                    {t('assignments.completed_at')}:{' '}
                    {new Date(assignment.completed_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

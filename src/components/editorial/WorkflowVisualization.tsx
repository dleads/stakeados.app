'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Play,
  Pause,
} from 'lucide-react';
import { PublicationWorkflowService } from '@/lib/services/publicationWorkflowService';
import type {
  PublicationWorkflow,
  WorkflowStep,
} from '@/lib/services/publicationWorkflowService';

interface WorkflowVisualizationProps {
  contentId?: string;
  contentType?: 'article' | 'news';
  workflowId?: string;
  className?: string;
}

export function WorkflowVisualization({
  contentId,
  workflowId,
  className = '',
}: WorkflowVisualizationProps) {
  const t = useTranslations('editorial');
  const [workflow, setWorkflow] = useState<PublicationWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflow();
  }, [contentId, workflowId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);

      if (workflowId) {
        // Load specific workflow by ID
        // const data = await PublicationWorkflowService.getWorkflow(workflowId)
        // setWorkflow(data)
      } else if (contentId) {
        // Load workflow for content
        const data =
          await PublicationWorkflowService.getWorkflowStatus(contentId);
        setWorkflow(data);
      }
    } catch (err) {
      console.error('Error loading workflow:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step: WorkflowStep, currentStep: string) => {
    if (step.completed) return 'completed';
    if (step.id === currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (step: WorkflowStep, currentStep: string) => {
    const status = getStepStatus(step, currentStep);

    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'current':
        return <Play className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepColor = (step: WorkflowStep, currentStep: string) => {
    const status = getStepStatus(step, currentStep);

    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'current':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
  };

  const isStepOverdue = (step: WorkflowStep) => {
    return (
      step.due_date && new Date(step.due_date) < new Date() && !step.completed
    );
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
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

  if (!workflow) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Pause className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('workflow.no_workflow')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {t('workflow.no_workflow_description')}
        </p>
      </div>
    );
  }

  const completedSteps = workflow.steps.filter(step => step.completed).length;
  const totalSteps = workflow.steps.length;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('workflow.publication_workflow')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('workflow.status')}:{' '}
            <span className="capitalize">{workflow.status}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {progressPercentage}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {completedSteps} of {totalSteps} steps
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {workflow.steps.map((step, index) => (
          <div key={step.id} className="relative">
            {/* Connector Line */}
            {index < workflow.steps.length - 1 && (
              <div className="absolute left-6 top-16 w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />
            )}

            <div
              className={`border rounded-lg p-4 transition-all ${getStepColor(step, workflow.current_step)}`}
            >
              <div className="flex items-start space-x-4">
                {/* Step Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStepIcon(step, workflow.current_step)}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {step.name}
                      {step.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {isStepOverdue(step) && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      {step.id === workflow.current_step && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full">
                          {t('workflow.current_step')}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {step.description}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    {step.assignee && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>{step.assignee}</span>
                      </div>
                    )}
                    {step.due_date && (
                      <div
                        className={`flex items-center ${isStepOverdue(step) ? 'text-red-600 dark:text-red-400' : ''}`}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>
                          {t('workflow.due')}:{' '}
                          {new Date(step.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step Actions */}
                {step.id === workflow.current_step && !step.completed && (
                  <div className="flex-shrink-0">
                    <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors">
                      {t('workflow.complete_step')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('workflow.created')}:{' '}
          {new Date(workflow.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            {t('workflow.view_history')}
          </button>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            {t('workflow.manage_workflow')}
          </button>
        </div>
      </div>
    </div>
  );
}

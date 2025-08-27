import { createClient } from '@/lib/supabase/client';
import { EditorialService } from './editorialService';

const supabase = createClient();

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  assignee?: string;
  due_date?: string;
}

export interface PublicationWorkflow {
  id: string;
  content_id: string;
  content_type: 'article' | 'news';
  current_step: string;
  status:
    | 'draft'
    | 'in_review'
    | 'approved'
    | 'scheduled'
    | 'published'
    | 'rejected';
  steps: WorkflowStep[];
  created_at: string;
  updated_at: string;
}

export class PublicationWorkflowService {
  /**
   * Initialize a publication workflow for content
   */
  static async initializeWorkflow(
    contentId: string,
    contentType: 'article' | 'news',
    workflowType: 'standard' | 'expedited' | 'sensitive' = 'standard'
  ): Promise<PublicationWorkflow> {
    const steps = this.getWorkflowSteps(workflowType);

    const workflow: Omit<
      PublicationWorkflow,
      'id' | 'created_at' | 'updated_at'
    > = {
      content_id: contentId,
      content_type: contentType,
      current_step: steps[0].id,
      status: 'draft',
      steps,
    };

    // In a real implementation, this would be stored in the database
    // For now, we'll simulate it
    return {
      ...workflow,
      id: `workflow_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Get workflow steps based on type
   */
  private static getWorkflowSteps(workflowType: string): WorkflowStep[] {
    const baseSteps: WorkflowStep[] = [
      {
        id: 'content_creation',
        name: 'Content Creation',
        description: 'Author creates the initial content',
        required: true,
        completed: false,
      },
      {
        id: 'self_review',
        name: 'Self Review',
        description: 'Author reviews their own content',
        required: true,
        completed: false,
      },
      {
        id: 'editorial_review',
        name: 'Editorial Review',
        description: 'Editor reviews content for quality and style',
        required: true,
        completed: false,
      },
      {
        id: 'technical_review',
        name: 'Technical Review',
        description: 'Technical expert reviews accuracy',
        required: false,
        completed: false,
      },
      {
        id: 'seo_optimization',
        name: 'SEO Optimization',
        description: 'Optimize content for search engines',
        required: true,
        completed: false,
      },
      {
        id: 'final_approval',
        name: 'Final Approval',
        description: 'Final approval from senior editor',
        required: true,
        completed: false,
      },
      {
        id: 'scheduling',
        name: 'Publication Scheduling',
        description: 'Schedule content for publication',
        required: true,
        completed: false,
      },
      {
        id: 'publication',
        name: 'Publication',
        description: 'Content is published',
        required: true,
        completed: false,
      },
    ];

    switch (workflowType) {
      case 'expedited':
        // Remove technical review for expedited workflow
        return baseSteps.filter(step => step.id !== 'technical_review');

      case 'sensitive':
        // Add additional review steps for sensitive content
        return [
          ...baseSteps.slice(0, 5), // Up to SEO optimization
          {
            id: 'legal_review',
            name: 'Legal Review',
            description: 'Legal team reviews for compliance',
            required: true,
            completed: false,
          },
          {
            id: 'management_approval',
            name: 'Management Approval',
            description: 'Senior management approval required',
            required: true,
            completed: false,
          },
          ...baseSteps.slice(5), // Final approval onwards
        ];

      default:
        return baseSteps;
    }
  }

  /**
   * Advance workflow to next step
   */
  static async advanceWorkflow(
    workflowId: string,
    completedBy?: string,
    notes?: string
  ): Promise<PublicationWorkflow> {
    // In a real implementation, this would:
    // 1. Load workflow from database using workflowId
    // 2. Mark current step as completed
    // 3. Move to next step
    // 4. Create assignments if needed
    // 5. Send notifications
    // 6. Update database

    // For now, we'll simulate the process
    // These parameters will be used in the real implementation
    console.log('Advancing workflow:', { workflowId, completedBy, notes });
    throw new Error('Not implemented - would advance workflow to next step');
  }

  /**
   * Reject workflow and send back to previous step
   */
  static async rejectWorkflow(
    workflowId: string,
    rejectedBy: string,
    reason: string,
    targetStep?: string
  ): Promise<PublicationWorkflow> {
    // In a real implementation, this would:
    // 1. Load workflow from database
    // 2. Set status to rejected
    // 3. Move back to target step (or previous step)
    // 4. Create assignment for rework
    // 5. Send notifications
    // 6. Update database

    // These parameters will be used in the real implementation
    console.log('Rejecting workflow:', {
      workflowId,
      rejectedBy,
      reason,
      targetStep,
    });
    throw new Error('Not implemented - would reject workflow');
  }

  /**
   * Get workflow status for content
   */
  static async getWorkflowStatus(
    contentId: string
  ): Promise<PublicationWorkflow | null> {
    // In a real implementation, this would query the database using contentId
    // For now, return null
    console.log('Getting workflow status for content:', contentId);
    return null;
  }

  /**
   * Auto-assign workflow steps based on content type and availability
   */
  static async autoAssignWorkflowSteps(
    workflow: PublicationWorkflow
  ): Promise<void> {
    for (const step of workflow.steps) {
      if (step.completed || step.assignee) continue;

      let assigneeRole: string | null = null;

      switch (step.id) {
        case 'editorial_review':
          assigneeRole = 'editor';
          break;
        case 'technical_review':
          assigneeRole = 'technical_reviewer';
          break;
        case 'legal_review':
          assigneeRole = 'legal';
          break;
        case 'final_approval':
        case 'management_approval':
          assigneeRole = 'admin';
          break;
        default:
          continue;
      }

      if (assigneeRole) {
        const assignee = await this.findAvailableAssignee(assigneeRole);
        if (assignee) {
          // Create editorial assignment
          const assigneeData = assignee as any;
          await EditorialService.createAssignment({
            content_id: workflow.content_id,
            content_type: workflow.content_type,
            assignee_id: assigneeData.id,
            assigner_id: 'system', // System assignment
            assignment_type: this.getAssignmentType(step.id),
            due_date: this.calculateDueDate(step.id),
            notes: `Workflow step: ${step.name}`,
            status: 'assigned',
            priority: 'medium',
          });
        }
      }
    }
  }

  /**
   * Find available assignee for a role
   */
  private static async findAvailableAssignee(role: string) {
    const { data, error } = await supabase
      .from('profiles' as any)
      .select('id, name, email')
      .eq('role', role)
      .limit(1);

    if (error || !data || data.length === 0) return null;

    // In a real implementation, we'd check workload and availability
    return data[0];
  }

  /**
   * Get assignment type for workflow step
   */
  private static getAssignmentType(
    stepId: string
  ): 'review' | 'edit' | 'moderate' | 'approve' {
    switch (stepId) {
      case 'editorial_review':
      case 'technical_review':
      case 'legal_review':
        return 'review';
      case 'final_approval':
      case 'management_approval':
        return 'approve';
      case 'seo_optimization':
        return 'edit';
      default:
        return 'review';
    }
  }

  /**
   * Calculate due date for workflow step
   */
  private static calculateDueDate(stepId: string): string {
    const now = new Date();
    let daysToAdd = 3; // Default 3 days

    switch (stepId) {
      case 'editorial_review':
        daysToAdd = 2;
        break;
      case 'technical_review':
        daysToAdd = 3;
        break;
      case 'legal_review':
        daysToAdd = 5;
        break;
      case 'final_approval':
        daysToAdd = 1;
        break;
      case 'management_approval':
        daysToAdd = 2;
        break;
      case 'seo_optimization':
        daysToAdd = 1;
        break;
    }

    now.setDate(now.getDate() + daysToAdd);
    return now.toISOString();
  }

  /**
   * Get workflow templates
   */
  static getWorkflowTemplates() {
    return [
      {
        id: 'standard',
        name: 'Standard Publication',
        description: 'Standard workflow for regular content',
        estimated_duration: '7-10 days',
        steps: 8,
      },
      {
        id: 'expedited',
        name: 'Expedited Publication',
        description: 'Fast-track workflow for urgent content',
        estimated_duration: '3-5 days',
        steps: 7,
      },
      {
        id: 'sensitive',
        name: 'Sensitive Content',
        description: 'Enhanced workflow for sensitive or legal content',
        estimated_duration: '10-14 days',
        steps: 10,
      },
    ];
  }

  /**
   * Get workflow analytics
   */
  static async getWorkflowAnalytics(
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ) {
    // In a real implementation, this would query workflow data using timeframe
    // For now, return mock data
    console.log('Getting workflow analytics for timeframe:', timeframe);
    return {
      total_workflows: 45,
      completed_workflows: 38,
      average_duration: 8.5,
      bottlenecks: [
        { step: 'editorial_review', avg_duration: 3.2, count: 12 },
        { step: 'technical_review', avg_duration: 4.1, count: 8 },
        { step: 'legal_review', avg_duration: 6.8, count: 3 },
      ],
      completion_rate: 84.4,
      on_time_rate: 76.3,
    };
  }

  /**
   * Process scheduled publications
   */
  static async processScheduledPublications() {
    try {
      // Get all scheduled publications that are due
      const schedules = await EditorialService.getPublicationSchedule({
        status: 'scheduled',
      });
      const dueSchedules = schedules.filter(
        schedule => new Date(schedule.scheduled_for) <= new Date()
      );

      const results = [];

      for (const schedule of dueSchedules) {
        try {
          // Update content status to published
          if (schedule.content_type === 'article') {
            const { error } = await supabase
              .from('articles' as any)
              .update({
                status: 'published',
                published_at: new Date().toISOString(),
              })
              .eq('id', schedule.content_id);

            if (error) throw error;
          }

          // Update schedule status
          await EditorialService.updateSchedule(schedule.id, {
            status: 'published',
            published_at: new Date().toISOString(),
          });

          results.push({
            id: schedule.id,
            status: 'success',
            published_at: new Date().toISOString(),
          });
        } catch (error) {
          console.error(
            `Failed to publish scheduled content ${schedule.id}:`,
            error
          );

          // Mark schedule as failed
          await EditorialService.updateSchedule(schedule.id, {
            status: 'failed',
            metadata: {
              ...schedule.metadata,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          });

          results.push({
            id: schedule.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        processed: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length,
        results,
      };
    } catch (error) {
      console.error('Error processing scheduled publications:', error);
      throw error;
    }
  }
}

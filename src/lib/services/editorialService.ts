// import { createClient } from '@/lib/supabase/client' // TODO: Re-enable when editorial tables are available
import type {
  EditorialAssignment,
  ContentReview,
  ModerationQueueItem,
  PublicationSchedule,
  EditorialWorkflowState,
  EditorialWorkload,
  EditorialDashboardStats,
  ReviewFilters,
  AssignmentFilters,
  ModerationFilters,
} from '@/types/editorial';

// const supabase = createClient() // TODO: Re-enable when editorial tables are available

export class EditorialService {
  // TODO: Re-enable when editorial tables are available in database
  // All methods temporarily disabled due to missing database tables
  // Editorial Assignments - Temporarily disabled
  static async getAssignments(_filters: AssignmentFilters = {}) {
    // TODO: Re-enable when editorial_assignments table is available
    console.warn('getAssignments method temporarily disabled');
    return [] as EditorialAssignment[];
  }

  static async createAssignment(
    _assignment: Omit<EditorialAssignment, 'id' | 'created_at' | 'updated_at'>
  ) {
    // TODO: Re-enable when editorial_assignments table is available
    console.warn('createAssignment method temporarily disabled');
    return {} as EditorialAssignment;
  }

  static async updateAssignment(
    _id: string,
    _updates: Partial<EditorialAssignment>
  ) {
    // TODO: Re-enable when editorial_assignments table is available
    console.warn('updateAssignment method temporarily disabled');
    return {} as EditorialAssignment;
  }

  static async getMyAssignments(_userId: string) {
    // TODO: Re-enable when editorial_assignments table is available
    console.warn('getMyAssignments method temporarily disabled');
    return [] as EditorialAssignment[];
  }

  static async getWorkload(_editorId: string): Promise<EditorialWorkload> {
    // TODO: Re-enable when editorial_assignments table is available
    console.warn('getWorkload method temporarily disabled');
    return {
      assigned_count: 0,
      in_progress_count: 0,
      overdue_count: 0,
      completed_this_week: 0,
    };
  }

  // Content Reviews - Temporarily disabled
  static async getReviews(_filters: ReviewFilters = {}) {
    // TODO: Re-enable when content_reviews table is available
    console.warn('getReviews method temporarily disabled');
    return [] as ContentReview[];
  }

  static async createReview(
    _review: Omit<ContentReview, 'id' | 'created_at' | 'updated_at'>
  ) {
    // TODO: Re-enable when content_reviews table is available
    console.warn('createReview method temporarily disabled');
    return {} as ContentReview;
  }

  static async updateReview(_id: string, _updates: Partial<ContentReview>) {
    // TODO: Re-enable when content_reviews table is available
    console.warn('updateReview method temporarily disabled');
    return {} as ContentReview;
  }

  static async getContentReviews(_contentId: string, _contentType: string) {
    // TODO: Re-enable when content_reviews table is available
    console.warn('getContentReviews method temporarily disabled');
    return [] as ContentReview[];
  }

  // Moderation Queue - Temporarily disabled
  static async getModerationQueue(_filters: ModerationFilters = {}) {
    // TODO: Re-enable when moderation_queue table is available
    console.warn('getModerationQueue method temporarily disabled');
    return [] as ModerationQueueItem[];
  }

  static async addToModerationQueue(
    _item: Omit<
      ModerationQueueItem,
      'id' | 'created_at' | 'user_reports' | 'moderation_result'
    >
  ) {
    // TODO: Re-enable when moderation_queue table is available
    console.warn('addToModerationQueue method temporarily disabled');
    return {} as ModerationQueueItem;
  }

  static async updateModerationItem(
    _id: string,
    _updates: Partial<ModerationQueueItem>
  ) {
    // TODO: Re-enable when moderation_queue table is available
    console.warn('updateModerationItem method temporarily disabled');
    return {} as ModerationQueueItem;
  }

  static async claimModerationItem(_id: string, _moderatorId: string) {
    // TODO: Re-enable when moderation_queue table is available
    console.warn('claimModerationItem method temporarily disabled');
    return {} as ModerationQueueItem;
  }

  // Publication Scheduling - Temporarily disabled
  static async getPublicationSchedule(_filters: { status?: string } = {}) {
    // TODO: Re-enable when publication_schedule table is available
    console.warn('getPublicationSchedule method temporarily disabled');
    return [] as PublicationSchedule[];
  }

  static async schedulePublication(
    _schedule: Omit<PublicationSchedule, 'id' | 'created_at' | 'updated_at'>
  ) {
    // TODO: Re-enable when publication_schedule table is available
    console.warn('schedulePublication method temporarily disabled');
    return {} as PublicationSchedule;
  }

  static async updateSchedule(
    _id: string,
    _updates: Partial<PublicationSchedule>
  ) {
    // TODO: Re-enable when publication_schedule table is available
    console.warn('updateSchedule method temporarily disabled');
    return {} as PublicationSchedule;
  }

  static async cancelScheduledPublication(_id: string) {
    // TODO: Re-enable when publication_schedule table is available
    console.warn('cancelScheduledPublication method temporarily disabled');
    return {} as PublicationSchedule;
  }

  // Workflow States - Temporarily disabled
  static async getWorkflowHistory(_contentId: string, _contentType: string) {
    // TODO: Re-enable when editorial_workflow_states table is available
    console.warn('getWorkflowHistory method temporarily disabled');
    return [] as EditorialWorkflowState[];
  }

  // Dashboard Stats - Temporarily disabled
  static async getDashboardStats(): Promise<EditorialDashboardStats> {
    // TODO: Re-enable when editorial tables are available
    console.warn('getDashboardStats method temporarily disabled');
    return {
      pending_reviews: 0,
      overdue_assignments: 0,
      moderation_queue_size: 0,
      scheduled_publications: 0,
      articles_this_week: 0,
      reviews_this_week: 0,
    };
  }

  // Bulk Operations - Temporarily disabled
  static async bulkAssignReviews(
    _contentIds: string[],
    _assigneeId: string,
    _dueDate?: string
  ) {
    // TODO: Re-enable when editorial_assignments table is available
    console.warn('bulkAssignReviews method temporarily disabled');
    return [] as EditorialAssignment[];
  }

  static async bulkUpdateAssignments(
    _ids: string[],
    _updates: Partial<EditorialAssignment>
  ) {
    // TODO: Re-enable when editorial_assignments table is available
    console.warn('bulkUpdateAssignments method temporarily disabled');
    return [] as EditorialAssignment[];
  }
}

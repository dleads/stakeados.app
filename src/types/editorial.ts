export interface EditorialAssignment {
  id: string;
  content_id: string;
  content_type: 'article' | 'news' | 'proposal';
  assignee_id: string;
  assigner_id: string;
  assignment_type: 'review' | 'edit' | 'moderate' | 'approve';
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  notes?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  assigner?: {
    id: string;
    name: string;
    email: string;
  };
  content?: {
    title: string;
    status: string;
    author_name?: string;
  };
}

export interface ContentReview {
  id: string;
  content_id: string;
  content_type: 'article' | 'news' | 'proposal';
  reviewer_id: string;
  review_type: 'editorial' | 'technical' | 'moderation' | 'final';
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  overall_score?: number;
  feedback: {
    general?: string;
    sections?: Array<{
      section: string;
      comment: string;
      suggestion?: string;
    }>;
  };
  checklist: {
    grammar?: boolean;
    factual?: boolean;
    seo?: boolean;
    readability?: boolean;
    accuracy?: boolean;
    style?: boolean;
  };
  changes_requested?: string[];
  internal_notes?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  reviewer?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface ModerationQueueItem {
  id: string;
  content_id: string;
  content_type: 'article' | 'news' | 'proposal' | 'comment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: 'ai_flagged' | 'user_reported' | 'manual_review' | 'policy_violation';
  ai_confidence?: number;
  ai_flags?: string[];
  user_reports: number;
  moderator_id?: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'escalated';
  moderation_result: {
    action?: 'approve' | 'reject' | 'escalate';
    reason?: string;
    automated?: boolean;
  };
  reviewed_at?: string;
  created_at: string;

  // Joined data
  moderator?: {
    id: string;
    name: string;
    email: string;
  };
  content?: {
    title: string;
    author_name?: string;
    excerpt?: string;
  };
}

export interface PublicationSchedule {
  id: string;
  content_id: string;
  content_type: 'article' | 'news';
  scheduled_for: string;
  timezone: string;
  status: 'scheduled' | 'published' | 'cancelled' | 'failed';
  publisher_id?: string;
  auto_publish: boolean;
  publish_channels: string[];
  metadata: Record<string, any>;
  published_at?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  publisher?: {
    id: string;
    name: string;
    email: string;
  };
  content?: {
    title: string;
    author_name?: string;
  };
}

export interface EditorialWorkflowState {
  id: string;
  content_id: string;
  content_type: 'article' | 'news' | 'proposal';
  previous_state?: string;
  current_state: string;
  actor_id?: string;
  action: string;
  metadata: Record<string, any>;
  created_at: string;

  // Joined data
  actor?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface EditorialWorkload {
  assigned_count: number;
  in_progress_count: number;
  overdue_count: number;
  completed_this_week: number;
  avg_completion_time?: number;
}

export interface EditorialDashboardStats {
  pending_reviews: number;
  overdue_assignments: number;
  moderation_queue_size: number;
  scheduled_publications: number;
  articles_this_week: number;
  reviews_this_week: number;
}

export interface ReviewFilters {
  status?: string;
  review_type?: string;
  reviewer_id?: string;
  content_type?: string;
  date_range?: {
    from: Date;
    to: Date;
  };
}

export interface AssignmentFilters {
  status?: string;
  assignment_type?: string;
  assignee_id?: string;
  content_type?: string;
  priority?: string;
  overdue_only?: boolean;
}

export interface ModerationFilters {
  status?: string;
  priority?: string;
  reason?: string;
  moderator_id?: string;
  content_type?: string;
}

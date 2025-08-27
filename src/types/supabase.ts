export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_reports: {
        Row: {
          config: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_favorite: boolean | null
          last_run: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          last_run?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_favorite?: boolean | null
          last_run?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_categories: {
        Row: {
          article_id: string
          category_id: string
        }
        Insert: {
          article_id: string
          category_id: string
        }
        Update: {
          article_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_categories_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      article_collaboration_sessions: {
        Row: {
          article_id: string | null
          created_at: string | null
          cursor_position: Json | null
          id: string
          is_active: boolean | null
          last_activity: string | null
          session_end: string | null
          session_start: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          cursor_position?: Json | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          session_end?: string | null
          session_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          cursor_position?: Json | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          session_end?: string | null
          session_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_collaboration_sessions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_collaboration_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_history: {
        Row: {
          article_id: string | null
          change_type: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_values: Json | null
          notes: string | null
          old_values: Json | null
        }
        Insert: {
          article_id?: string | null
          change_type: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Update: {
          article_id?: string | null
          change_type?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "article_history_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_proposals: {
        Row: {
          author_experience: string
          created_at: string | null
          estimated_read_time: number | null
          feedback: string | null
          id: string
          outline: string
          previous_work: string[] | null
          proposer_id: string
          reviewer_id: string | null
          status: string | null
          suggested_category: string | null
          suggested_level: string | null
          summary: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_experience: string
          created_at?: string | null
          estimated_read_time?: number | null
          feedback?: string | null
          id?: string
          outline: string
          previous_work?: string[] | null
          proposer_id: string
          reviewer_id?: string | null
          status?: string | null
          suggested_category?: string | null
          suggested_level?: string | null
          summary: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_experience?: string
          created_at?: string | null
          estimated_read_time?: number | null
          feedback?: string | null
          id?: string
          outline?: string
          previous_work?: string[] | null
          proposer_id?: string
          reviewer_id?: string | null
          status?: string | null
          suggested_category?: string | null
          suggested_level?: string | null
          summary?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_proposals_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_proposals_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_tags: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: {
          article_id: string
          tag_id: string
        }
        Update: {
          article_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "content_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          ai_summary: Json | null
          author_id: string
          category: string
          content: Json
          created_at: string | null
          difficulty_level: string | null
          featured_image_url: string | null
          id: string
          like_count: number | null
          likes: number | null
          meta_description: Json | null
          published_at: string | null
          reading_time: number | null
          related_courses: string[] | null
          status: string
          tags: string[] | null
          title: Json
          updated_at: string | null
          view_count: number | null
          views: number | null
        }
        Insert: {
          ai_summary?: Json | null
          author_id: string
          category?: string
          content?: Json
          created_at?: string | null
          difficulty_level?: string | null
          featured_image_url?: string | null
          id?: string
          like_count?: number | null
          likes?: number | null
          meta_description?: Json | null
          published_at?: string | null
          reading_time?: number | null
          related_courses?: string[] | null
          status?: string
          tags?: string[] | null
          title?: Json
          updated_at?: string | null
          view_count?: number | null
          views?: number | null
        }
        Update: {
          ai_summary?: Json | null
          author_id?: string
          category?: string
          content?: Json
          created_at?: string | null
          difficulty_level?: string | null
          featured_image_url?: string | null
          id?: string
          like_count?: number | null
          likes?: number | null
          meta_description?: Json | null
          published_at?: string | null
          reading_time?: number | null
          related_courses?: string[] | null
          status?: string
          tags?: string[] | null
          title?: Json
          updated_at?: string | null
          view_count?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_analytics: {
        Row: {
          average_reading_time: number | null
          bookmarks: number | null
          bounce_rate: number | null
          comments: number | null
          completion_rate: number | null
          content_id: string
          content_type: string
          created_at: string | null
          date: string
          device_data: Json | null
          engagement_score: number | null
          id: string
          likes: number | null
          location_data: Json | null
          referrer_data: Json | null
          shares: number | null
          trending_score: number | null
          unique_views: number | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          average_reading_time?: number | null
          bookmarks?: number | null
          bounce_rate?: number | null
          comments?: number | null
          completion_rate?: number | null
          content_id: string
          content_type: string
          created_at?: string | null
          date?: string
          device_data?: Json | null
          engagement_score?: number | null
          id?: string
          likes?: number | null
          location_data?: Json | null
          referrer_data?: Json | null
          shares?: number | null
          trending_score?: number | null
          unique_views?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          average_reading_time?: number | null
          bookmarks?: number | null
          bounce_rate?: number | null
          comments?: number | null
          completion_rate?: number | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          date?: string
          device_data?: Json | null
          engagement_score?: number | null
          id?: string
          likes?: number | null
          location_data?: Json | null
          referrer_data?: Json | null
          shares?: number | null
          trending_score?: number | null
          unique_views?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      content_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: Json | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: Json
          order_index: number | null
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: Json
          order_index?: number | null
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: Json
          order_index?: number | null
          slug?: string
        }
        Relationships: []
      }
      content_interactions: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          interaction_type: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_metrics: {
        Row: {
          content_id: string
          content_type: string
          date: string | null
          id: string
          metadata: Json | null
          metric_type: string
          recorded_at: string | null
          value: number | null
        }
        Insert: {
          content_id: string
          content_type: string
          date?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          recorded_at?: string | null
          value?: number | null
        }
        Update: {
          content_id?: string
          content_type?: string
          date?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          recorded_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
      content_reviews: {
        Row: {
          changes_requested: string[] | null
          checklist: Json | null
          content_id: string
          content_type: string
          created_at: string | null
          feedback: Json | null
          id: string
          internal_notes: string | null
          overall_score: number | null
          review_type: string
          reviewer_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          changes_requested?: string[] | null
          checklist?: Json | null
          content_id: string
          content_type: string
          created_at?: string | null
          feedback?: Json | null
          id?: string
          internal_notes?: string | null
          overall_score?: number | null
          review_type: string
          reviewer_id: string
          status: string
          updated_at?: string | null
        }
        Update: {
          changes_requested?: string[] | null
          checklist?: Json | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          feedback?: Json | null
          id?: string
          internal_notes?: string | null
          overall_score?: number | null
          review_type?: string
          reviewer_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      editorial_assignments: {
        Row: {
          assignee_id: string
          assigner_id: string
          assignment_type: string
          completed_at: string | null
          content_id: string
          content_type: string
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assignee_id: string
          assigner_id: string
          assignment_type: string
          completed_at?: string | null
          content_id: string
          content_type: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string
          assigner_id?: string
          assignment_type?: string
          completed_at?: string | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "editorial_assignments_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editorial_assignments_assigner_id_fkey"
            columns: ["assigner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_workflow_states: {
        Row: {
          action: string
          actor_id: string | null
          content_id: string
          content_type: string
          created_at: string | null
          current_state: string
          id: string
          metadata: Json | null
          previous_state: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          content_id: string
          content_type: string
          created_at?: string | null
          current_state: string
          id?: string
          metadata?: Json | null
          previous_state?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          current_state?: string
          id?: string
          metadata?: Json | null
          previous_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "editorial_workflow_states_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_queue: {
        Row: {
          ai_confidence: number | null
          ai_flags: string[] | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          moderation_result: Json | null
          moderator_id: string | null
          priority: string | null
          reason: string
          reviewed_at: string | null
          status: string | null
          user_reports: number | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_flags?: string[] | null
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          moderation_result?: Json | null
          moderator_id?: string | null
          priority?: string | null
          reason: string
          reviewed_at?: string | null
          status?: string | null
          user_reports?: number | null
        }
        Update: {
          ai_confidence?: number | null
          ai_flags?: string[] | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          moderation_result?: Json | null
          moderator_id?: string | null
          priority?: string | null
          reason?: string
          reviewed_at?: string | null
          status?: string | null
          user_reports?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_queue_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_aggregation_jobs: {
        Row: {
          articles_fetched: number | null
          articles_processed: number | null
          articles_published: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          job_type: string
          metadata: Json | null
          source_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          articles_fetched?: number | null
          articles_processed?: number | null
          articles_published?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          metadata?: Json | null
          source_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          articles_fetched?: number | null
          articles_processed?: number | null
          articles_published?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          metadata?: Json | null
          source_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_aggregation_jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          ai_processed_at: string | null
          author_name: string | null
          categories: string[] | null
          content: Json
          created_at: string | null
          engagement_score: number | null
          id: string
          image_url: string | null
          keywords: string[] | null
          published_at: string
          read_time: number | null
          related_articles: string[] | null
          relevance_score: number | null
          source_name: string
          source_url: string
          summary: Json
          title: Json
          trending_score: number | null
          user_interactions: Json | null
        }
        Insert: {
          ai_processed_at?: string | null
          author_name?: string | null
          categories?: string[] | null
          content?: Json
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          published_at: string
          read_time?: number | null
          related_articles?: string[] | null
          relevance_score?: number | null
          source_name: string
          source_url: string
          summary?: Json
          title?: Json
          trending_score?: number | null
          user_interactions?: Json | null
        }
        Update: {
          ai_processed_at?: string | null
          author_name?: string | null
          categories?: string[] | null
          content?: Json
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          published_at?: string
          read_time?: number | null
          related_articles?: string[] | null
          relevance_score?: number | null
          source_name?: string
          source_url?: string
          summary?: Json
          title?: Json
          trending_score?: number | null
          user_interactions?: Json | null
        }
        Relationships: []
      }
      news_categories: {
        Row: {
          category_id: string
          news_id: string
        }
        Insert: {
          category_id: string
          news_id: string
        }
        Update: {
          category_id?: string
          news_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_categories_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_source_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      news_source_category_mapping: {
        Row: {
          category_id: string
          source_id: string
        }
        Insert: {
          category_id: string
          source_id: string
        }
        Update: {
          category_id?: string
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_source_category_mapping_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "news_source_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_source_category_mapping_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      news_source_health: {
        Row: {
          articles_fetched: number | null
          check_timestamp: string | null
          error_message: string | null
          http_status_code: number | null
          id: string
          metadata: Json | null
          response_time: number | null
          source_id: string | null
          status: string
        }
        Insert: {
          articles_fetched?: number | null
          check_timestamp?: string | null
          error_message?: string | null
          http_status_code?: number | null
          id?: string
          metadata?: Json | null
          response_time?: number | null
          source_id?: string | null
          status: string
        }
        Update: {
          articles_fetched?: number | null
          check_timestamp?: string | null
          error_message?: string | null
          http_status_code?: number | null
          id?: string
          metadata?: Json | null
          response_time?: number | null
          source_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_source_health_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sources: {
        Row: {
          api_endpoint: string | null
          api_key: string | null
          categories: string[] | null
          consecutive_failures: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          fetch_interval: number | null
          headers: Json | null
          id: string
          is_active: boolean | null
          language: string | null
          last_fetched_at: string | null
          last_successful_fetch_at: string | null
          max_failures: number | null
          name: string
          priority: number | null
          quality_score: number | null
          source_type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: string | null
          categories?: string[] | null
          consecutive_failures?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fetch_interval?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_fetched_at?: string | null
          last_successful_fetch_at?: string | null
          max_failures?: number | null
          name: string
          priority?: number | null
          quality_score?: number | null
          source_type?: string
          updated_at?: string | null
          url: string
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string | null
          categories?: string[] | null
          consecutive_failures?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fetch_interval?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          last_fetched_at?: string | null
          last_successful_fetch_at?: string | null
          max_failures?: number | null
          name?: string
          priority?: number | null
          quality_score?: number | null
          source_type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_sources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      publication_schedule: {
        Row: {
          auto_publish: boolean | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          publish_channels: Json | null
          scheduled_for: string
          status: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          auto_publish?: boolean | null
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          publish_channels?: Json | null
          scheduled_for: string
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_publish?: boolean | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          publish_channels?: Json | null
          scheduled_for?: string
          status?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      raw_news_articles: {
        Row: {
          author: string | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_processed: boolean | null
          metadata: Json | null
          processed_at: string | null
          published_at: string
          quality_issues: string[] | null
          quality_score: number | null
          source_id: string | null
          summary: string | null
          title: string
          url: string
        }
        Insert: {
          author?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_processed?: boolean | null
          metadata?: Json | null
          processed_at?: string | null
          published_at: string
          quality_issues?: string[] | null
          quality_score?: number | null
          source_id?: string | null
          summary?: string | null
          title: string
          url: string
        }
        Update: {
          author?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_processed?: boolean | null
          metadata?: Json | null
          processed_at?: string | null
          published_at?: string
          quality_issues?: string[] | null
          quality_score?: number | null
          source_id?: string | null
          summary?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_news_articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          last_used: string | null
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters?: Json
          id?: string
          last_used?: string | null
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          last_used?: string | null
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string | null
          id: string
          query: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          query: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          query?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_activity: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "translation_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "translation_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_tasks: {
        Row: {
          ai_suggestion: Json | null
          assigned_at: string | null
          completed_at: string | null
          content_id: string
          content_type: string
          created_at: string | null
          created_by: string | null
          feedback: string | null
          id: string
          notes: string | null
          original_content: Json
          source_locale: string
          status: string | null
          target_locale: string
          translated_content: Json | null
          translator_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_suggestion?: Json | null
          assigned_at?: string | null
          completed_at?: string | null
          content_id: string
          content_type: string
          created_at?: string | null
          created_by?: string | null
          feedback?: string | null
          id?: string
          notes?: string | null
          original_content: Json
          source_locale: string
          status?: string | null
          target_locale: string
          translated_content?: Json | null
          translator_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_suggestion?: Json | null
          assigned_at?: string | null
          completed_at?: string | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          feedback?: string | null
          id?: string
          notes?: string | null
          original_content?: Json
          source_locale?: string
          status?: string | null
          target_locale?: string
          translated_content?: Json | null
          translator_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "translation_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_tasks_translator_id_fkey"
            columns: ["translator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          subscription_target: string
          subscription_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subscription_target: string
          subscription_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subscription_target?: string
          subscription_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_raw_articles: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_unused_tags: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      count_search_results: {
        Args: {
          search_author?: string
          search_categories?: string[]
          search_content_type?: string
          search_date_from?: string
          search_date_to?: string
          search_difficulty?: string
          search_locale?: string
          search_query?: string
          search_tags?: string[]
        }
        Returns: {
          article_count: number
          news_count: number
          total_count: number
        }[]
      }
      get_aggregation_stats: {
        Args: { days_back?: number }
        Returns: {
          avg_processing_time: unknown
          completed_jobs: number
          failed_jobs: number
          total_articles_fetched: number
          total_articles_processed: number
          total_jobs: number
        }[]
      }
      get_category_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          article_count: number
          id: string
          name: Json
          news_count: number
          total_interactions: number
          total_views: number
        }[]
      }
      get_editorial_workload: {
        Args: { editor_id: string }
        Returns: Json
      }
      get_global_translation_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          average_completion_time: number
          completed_tasks: number
          completion_rate: number
          in_progress_tasks: number
          needs_review_tasks: number
          pending_tasks: number
          total_tasks: number
        }[]
      }
      get_popular_categories: {
        Args: { limit_count?: number }
        Returns: {
          color: string
          icon: string
          id: string
          name: Json
          popularity_score: number
          slug: string
        }[]
      }
      get_popular_tags: {
        Args: { limit_count?: number }
        Returns: {
          created_at: string
          id: string
          name: string
          recent_usage: number
          slug: string
          trending_score: number
          usage_count: number
        }[]
      }
      get_related_tags: {
        Args: { limit_count?: number; tag_id: string }
        Returns: {
          co_occurrence_count: number
          created_at: string
          id: string
          name: string
          relatedness_score: number
          slug: string
          usage_count: number
        }[]
      }
      get_search_facets: {
        Args: {
          search_author?: string
          search_categories?: string[]
          search_content_type?: string
          search_date_from?: string
          search_date_to?: string
          search_difficulty?: string
          search_locale?: string
          search_query?: string
          search_tags?: string[]
        }
        Returns: {
          facet_count: number
          facet_type: string
          facet_value: string
        }[]
      }
      get_sources_ready_for_fetch: {
        Args: Record<PropertyKey, never>
        Returns: {
          api_endpoint: string
          api_key: string
          fetch_interval: number
          headers: Json
          id: string
          name: string
          source_type: string
          url: string
        }[]
      }
      get_translation_completeness: {
        Args: { p_content_id: string; p_content_type: string }
        Returns: {
          completeness_percentage: number
          content_id: string
          content_type: string
          missing_locales: string[]
          total_locales: number
          translated_locales: number
        }[]
      }
      get_trending_tags: {
        Args: { limit_count?: number }
        Returns: {
          created_at: string
          id: string
          name: string
          recent_usage: number
          slug: string
          trending_score: number
          usage_count: number
        }[]
      }
      get_unprocessed_articles: {
        Args: { limit_count?: number }
        Returns: {
          author: string
          content: string
          id: string
          image_url: string
          metadata: Json
          published_at: string
          quality_score: number
          source_categories: string[]
          source_id: string
          source_name: string
          summary: string
          title: string
          url: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      mark_articles_processed: {
        Args: { article_ids: string[] }
        Returns: undefined
      }
      merge_duplicate_tags: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      process_scheduled_publications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_content: {
        Args: {
          result_limit?: number
          result_offset?: number
          search_author?: string
          search_categories?: string[]
          search_content_type?: string
          search_date_from?: string
          search_date_to?: string
          search_difficulty?: string
          search_locale?: string
          search_query?: string
          search_tags?: string[]
          sort_by?: string
          sort_order?: string
        }
        Returns: {
          author_id: string
          author_name: string
          categories: string[]
          content: Json
          content_type: string
          created_at: string
          difficulty_level: string
          featured_image_url: string
          id: string
          like_count: number
          published_at: string
          relevance_score: number
          summary: Json
          tags: string[]
          title: Json
          view_count: number
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      suggest_tags_from_content: {
        Args: {
          content_text: string
          limit_count?: number
          title_text?: string
        }
        Returns: {
          id: string
          name: string
          similarity_score: number
          slug: string
          usage_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          format: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          format?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_level: {
        Args: { name: string }
        Returns: number
      }
      get_prefix: {
        Args: { name: string }
        Returns: string
      }
      get_prefixes: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS"],
    },
  },
} as const


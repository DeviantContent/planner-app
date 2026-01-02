export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      planner_users: {
        Row: {
          id: string
          phone_number: string
          name: string | null
          timezone: string
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone_number: string
          name?: string | null
          timezone?: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone_number?: string
          name?: string | null
          timezone?: string
          is_approved?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      planner_messages: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          surge_message_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          surge_message_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'user' | 'assistant'
          content?: string
          surge_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planner_messages_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "planner_users"
            referencedColumns: ["id"]
          }
        ]
      }
      planner_goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: 'active' | 'completed' | 'archived'
          due_date: string | null
          priority: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          status?: 'active' | 'completed' | 'archived'
          due_date?: string | null
          priority?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          status?: 'active' | 'completed' | 'archived'
          due_date?: string | null
          priority?: number
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planner_goals_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "planner_users"
            referencedColumns: ["id"]
          }
        ]
      }
      planner_tasks: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          title: string
          completed: boolean
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          title: string
          completed?: boolean
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          goal_id?: string | null
          title?: string
          completed?: boolean
          due_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planner_tasks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "planner_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planner_tasks_goal_id_fkey"
            columns: ["goal_id"]
            referencedRelation: "planner_goals"
            referencedColumns: ["id"]
          }
        ]
      }
      planner_daily_plans: {
        Row: {
          id: string
          user_id: string
          plan_date: string
          goals: Json
          schedule: Json
          reflection: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_date: string
          goals?: Json
          schedule?: Json
          reflection?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          plan_date?: string
          goals?: Json
          schedule?: Json
          reflection?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planner_daily_plans_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "planner_users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type PlannerUser = Database['public']['Tables']['planner_users']['Row']
export type PlannerMessage = Database['public']['Tables']['planner_messages']['Row']
export type PlannerGoal = Database['public']['Tables']['planner_goals']['Row']
export type PlannerTask = Database['public']['Tables']['planner_tasks']['Row']
export type PlannerDailyPlan = Database['public']['Tables']['planner_daily_plans']['Row']

// Helper types for daily plan JSON fields
export interface DailyGoal {
  title: string
  description?: string
  project_id?: string
  completed: boolean
}

export interface ScheduleBlock {
  time: string        // e.g., "09:00"
  duration: number    // in minutes
  activity: string
  goal_index?: number // which goal this relates to
}

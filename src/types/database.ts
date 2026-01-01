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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone_number: string
          name?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone_number?: string
          name?: string | null
          timezone?: string
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
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          status?: 'active' | 'completed' | 'archived'
          due_date?: string | null
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

export interface Database {
  public: {
    Tables: {
      planner_users: {
        Row: {
          id: string;
          phone_number: string;
          name: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone_number: string;
          name?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone_number?: string;
          name?: string | null;
          timezone?: string;
          updated_at?: string;
        };
      };
      planner_messages: {
        Row: {
          id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          surge_message_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          surge_message_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          surge_message_id?: string | null;
        };
      };
      planner_goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: 'active' | 'completed' | 'archived';
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: 'active' | 'completed' | 'archived';
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          status?: 'active' | 'completed' | 'archived';
          due_date?: string | null;
          updated_at?: string;
        };
      };
      planner_tasks: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string | null;
          title: string;
          completed: boolean;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_id?: string | null;
          title: string;
          completed?: boolean;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          goal_id?: string | null;
          title?: string;
          completed?: boolean;
          due_date?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}

export type PlannerUser = Database['public']['Tables']['planner_users']['Row'];
export type PlannerMessage = Database['public']['Tables']['planner_messages']['Row'];
export type PlannerGoal = Database['public']['Tables']['planner_goals']['Row'];
export type PlannerTask = Database['public']['Tables']['planner_tasks']['Row'];

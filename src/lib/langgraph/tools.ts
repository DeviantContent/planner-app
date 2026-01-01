import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

// Get user's active goals
export const getUserGoals = tool(
  async ({ userId }: { userId: string }) => {
    const { data, error } = await supabaseAdmin
      .from('planner_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { goals: data || [] };
  },
  {
    name: 'get_user_goals',
    description: 'Fetch the user\'s active goals from the database',
    schema: z.object({
      userId: z.string().describe('The user ID'),
    }),
  }
);

// Create a new goal
export const createGoal = tool(
  async ({
    userId,
    title,
    description,
    dueDate,
  }: {
    userId: string;
    title: string;
    description?: string;
    dueDate?: string;
  }) => {
    const { data, error } = await supabaseAdmin
      .from('planner_goals')
      .insert({
        user_id: userId,
        title,
        description: description || null,
        due_date: dueDate || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { goal: data };
  },
  {
    name: 'create_goal',
    description: 'Create a new goal for the user',
    schema: z.object({
      userId: z.string().describe('The user ID'),
      title: z.string().describe('The goal title'),
      description: z.string().optional().describe('Optional description'),
      dueDate: z.string().optional().describe('Optional due date (YYYY-MM-DD)'),
    }),
  }
);

// Get user's tasks
export const getUserTasks = tool(
  async ({ userId, includeCompleted = false }: { userId: string; includeCompleted?: boolean }) => {
    let query = supabaseAdmin
      .from('planner_tasks')
      .select('*, goal:planner_goals(title)')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (!includeCompleted) {
      query = query.eq('completed', false);
    }

    const { data, error } = await query;

    if (error) {
      return { error: error.message };
    }

    return { tasks: data || [] };
  },
  {
    name: 'get_user_tasks',
    description: 'Fetch the user\'s tasks, optionally including completed ones',
    schema: z.object({
      userId: z.string().describe('The user ID'),
      includeCompleted: z.boolean().optional().describe('Include completed tasks'),
    }),
  }
);

// Create a new task
export const createTask = tool(
  async ({
    userId,
    title,
    goalId,
    dueDate,
  }: {
    userId: string;
    title: string;
    goalId?: string;
    dueDate?: string;
  }) => {
    const { data, error } = await supabaseAdmin
      .from('planner_tasks')
      .insert({
        user_id: userId,
        title,
        goal_id: goalId || null,
        due_date: dueDate || null,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { task: data };
  },
  {
    name: 'create_task',
    description: 'Create a new task, optionally linked to a goal',
    schema: z.object({
      userId: z.string().describe('The user ID'),
      title: z.string().describe('The task title'),
      goalId: z.string().optional().describe('Optional goal ID to link to'),
      dueDate: z.string().optional().describe('Optional due date (YYYY-MM-DD)'),
    }),
  }
);

// Mark task as complete
export const completeTask = tool(
  async ({ taskId }: { taskId: string }) => {
    const { data, error } = await supabaseAdmin
      .from('planner_tasks')
      .update({ completed: true })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { task: data };
  },
  {
    name: 'complete_task',
    description: 'Mark a task as completed',
    schema: z.object({
      taskId: z.string().describe('The task ID to complete'),
    }),
  }
);

// Complete a goal
export const completeGoal = tool(
  async ({ goalId }: { goalId: string }) => {
    const { data, error } = await supabaseAdmin
      .from('planner_goals')
      .update({ status: 'completed' })
      .eq('id', goalId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { goal: data };
  },
  {
    name: 'complete_goal',
    description: 'Mark a goal as completed',
    schema: z.object({
      goalId: z.string().describe('The goal ID to complete'),
    }),
  }
);

// All tools for the agent
export const coachingTools = [
  getUserGoals,
  createGoal,
  getUserTasks,
  createTask,
  completeTask,
  completeGoal,
];

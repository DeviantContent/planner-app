import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import type { DailyGoal, ScheduleBlock } from '@/types/database';

// Type-safe wrapper for tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any;

// ============ PROJECT TOOLS ============

// Get all active projects with their next steps (tasks)
export const getProjects = tool(
  async ({ userId }: { userId: string }) => {
    // Get projects (goals) with their tasks
    const { data: projects, error } = await supabaseAdmin
      .from('planner_goals')
      .select(`
        *,
        tasks:planner_tasks(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('priority', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return {
      projects: projects?.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        priority: p.priority,
        notes: p.notes,
        due_date: p.due_date,
        next_steps: p.tasks?.filter((t: { completed: boolean }) => !t.completed) || []
      })) || []
    };
  },
  {
    name: 'get_projects',
    description: 'Get all active projects with their incomplete next steps/tasks',
    schema: z.object({
      userId: z.string().describe('The user ID'),
    }),
  }
);

// Create a new project
export const createProject = tool(
  async ({
    userId,
    title,
    description,
    priority,
  }: {
    userId: string;
    title: string;
    description?: string;
    priority?: number;
  }) => {
    const { data, error } = await supabaseAdmin
      .from('planner_goals')
      .insert({
        user_id: userId,
        title,
        description: description || null,
        priority: priority || 0,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { project: data };
  },
  {
    name: 'create_project',
    description: 'Create a new project/goal',
    schema: z.object({
      userId: z.string().describe('The user ID'),
      title: z.string().describe('The project title'),
      description: z.string().optional().describe('Project description'),
      priority: z.number().optional().describe('Priority (higher = more important)'),
    }),
  }
);

// Add a next step to a project
export const addNextStep = tool(
  async ({
    userId,
    projectId,
    title,
    dueDate,
  }: {
    userId: string;
    projectId: string;
    title: string;
    dueDate?: string;
  }) => {
    const { data, error } = await supabaseAdmin
      .from('planner_tasks')
      .insert({
        user_id: userId,
        goal_id: projectId,
        title,
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
    name: 'add_next_step',
    description: 'Add a next step/task to a project',
    schema: z.object({
      userId: z.string().describe('The user ID'),
      projectId: z.string().describe('The project ID to add the step to'),
      title: z.string().describe('The task/step title'),
      dueDate: z.string().optional().describe('Optional due date (YYYY-MM-DD)'),
    }),
  }
);

// Complete a next step
export const completeNextStep = tool(
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
    name: 'complete_next_step',
    description: 'Mark a next step/task as completed',
    schema: z.object({
      taskId: z.string().describe('The task ID to complete'),
    }),
  }
);

// Update project notes
export const updateProjectNotes = tool(
  async ({
    projectId,
    notes,
  }: {
    projectId: string;
    notes: string;
  }) => {
    const { data, error } = await supabaseAdmin
      .from('planner_goals')
      .update({ notes })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { project: data };
  },
  {
    name: 'update_project_notes',
    description: 'Update notes/context for a project',
    schema: z.object({
      projectId: z.string().describe('The project ID'),
      notes: z.string().describe('The notes to save'),
    }),
  }
);

// ============ DAILY PLAN TOOLS ============

// Get today's plan
export const getTodaysPlan = tool(
  async ({ userId, timezone }: { userId: string; timezone: string }) => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });

    const { data, error } = await db
      .from('planner_daily_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      return { error: error.message };
    }

    return {
      plan: data,
      date: today,
      has_plan: !!data
    };
  },
  {
    name: 'get_todays_plan',
    description: "Get today's daily plan with goals and schedule",
    schema: z.object({
      userId: z.string().describe('The user ID'),
      timezone: z.string().describe('User timezone (e.g., America/Chicago)'),
    }),
  }
);

// Get tomorrow's plan
export const getTomorrowsPlan = tool(
  async ({ userId, timezone }: { userId: string; timezone: string }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('en-CA', { timeZone: timezone });

    const { data, error } = await db
      .from('planner_daily_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', tomorrowStr)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { error: error.message };
    }

    return {
      plan: data,
      date: tomorrowStr,
      has_plan: !!data
    };
  },
  {
    name: 'get_tomorrows_plan',
    description: "Get tomorrow's daily plan - check if tomorrow is already planned",
    schema: z.object({
      userId: z.string().describe('The user ID'),
      timezone: z.string().describe('User timezone'),
    }),
  }
);

// Save/update a daily plan
export const saveDailyPlan = tool(
  async ({
    userId,
    date,
    goals,
    schedule,
  }: {
    userId: string;
    date: string;
    goals: DailyGoal[];
    schedule?: ScheduleBlock[];
  }) => {
    const { data, error } = await db
      .from('planner_daily_plans')
      .upsert({
        user_id: userId,
        plan_date: date,
        goals,
        schedule: schedule || [],
      }, {
        onConflict: 'user_id,plan_date'
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { plan: data };
  },
  {
    name: 'save_daily_plan',
    description: 'Save or update a daily plan with goals and schedule',
    schema: z.object({
      userId: z.string().describe('The user ID'),
      date: z.string().describe('The date (YYYY-MM-DD)'),
      goals: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        project_id: z.string().optional(),
        completed: z.boolean(),
      })).describe('Array of 3 goals for the day'),
      schedule: z.array(z.object({
        time: z.string(),
        duration: z.number(),
        activity: z.string(),
        goal_index: z.number().optional(),
      })).optional().describe('Optional 30-min block schedule'),
    }),
  }
);

// Get current time info
export const getCurrentTime = tool(
  async ({ timezone }: { timezone: string }) => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };
    const timeStr = now.toLocaleTimeString('en-US', options);
    const hour = parseInt(now.toLocaleTimeString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }));

    return {
      time: timeStr,
      hour,
      is_evening: hour >= 17, // 5 PM or later
      is_after_6pm: hour >= 18,
      should_plan_tomorrow: hour >= 17, // Start prompting for tomorrow's plan at 5 PM
    };
  },
  {
    name: 'get_current_time',
    description: 'Get current time and whether it\'s time to plan tomorrow',
    schema: z.object({
      timezone: z.string().describe('User timezone'),
    }),
  }
);

// All tools for the agent
export const coachingTools = [
  // Project tools
  getProjects,
  createProject,
  addNextStep,
  completeNextStep,
  updateProjectNotes,
  // Daily plan tools
  getTodaysPlan,
  getTomorrowsPlan,
  saveDailyPlan,
  getCurrentTime,
];

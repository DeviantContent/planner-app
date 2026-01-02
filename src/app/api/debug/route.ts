import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data: messages } = await supabaseAdmin
    .from('planner_messages')
    .select('role, content, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: projects } = await supabaseAdmin
    .from('planner_goals')
    .select('id, title, priority, notes, status')
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: tasks } = await supabaseAdmin
    .from('planner_tasks')
    .select('id, title, goal_id, completed')
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ messages, projects, tasks });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSms } from '@/lib/surge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any;

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow in development
  if (!cronSecret) {
    console.warn('CRON_SECRET not set - allowing request');
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Array<{ userId: string; action: string; success: boolean; error?: string }> = [];

  try {
    // Get all approved users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('planner_users')
      .select('id, phone_number, timezone, name')
      .eq('is_approved', true);

    if (usersError || !users) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    for (const user of users) {
      const timezone = user.timezone || 'America/Chicago';
      const now = new Date();

      // Get current hour in user's timezone
      const userHour = parseInt(
        now.toLocaleTimeString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false })
      );

      // Get today and tomorrow dates in user's timezone
      const today = now.toLocaleDateString('en-CA', { timeZone: timezone });
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toLocaleDateString('en-CA', { timeZone: timezone });

      // Check if tomorrow is planned
      const { data: tomorrowPlan } = await db
        .from('planner_daily_plans')
        .select('id, goals, schedule')
        .eq('user_id', user.id)
        .eq('plan_date', tomorrowStr)
        .single();

      const hasPlan = !!tomorrowPlan;
      const hasSchedule = tomorrowPlan?.schedule && Array.isArray(tomorrowPlan.schedule) && tomorrowPlan.schedule.length > 0;

      let message: string | null = null;
      let action = 'none';

      // 5 PM - First reminder to plan tomorrow
      if (userHour === 17 && !hasPlan) {
        message = "Hey! It's 5 PM - perfect time to plan tomorrow. What's on your plate? 📋";
        action = 'evening_reminder';
      }
      // 8 PM - Urgent reminder if still no plan
      else if (userHour === 20 && !hasPlan) {
        message = "No plan for tomorrow yet! Let's lock in 3 goals and a schedule before bed. What's most important? 🎯";
        action = 'urgent_reminder';
      }
      // 9 PM - Final warning
      else if (userHour === 21 && !hasPlan) {
        message = "Last call! Tomorrow needs a plan. Quick - what are your top 3 priorities? I'll build the schedule.";
        action = 'final_reminder';
      }
      // 7 AM - Morning schedule delivery (if plan exists)
      else if (userHour === 7 && hasPlan && hasSchedule) {
        const goals = tomorrowPlan.goals as Array<{ title: string }>;
        const goalList = goals.slice(0, 3).map((g, i) => `${i + 1}. ${g.title}`).join('\n');
        message = `Good morning! Here's your plan:\n\n${goalList}\n\nLet's make it happen 💪`;
        action = 'morning_briefing';
      }

      // Send message if we have one
      if (message) {
        const smsResult = await sendSms({
          to: user.phone_number,
          body: message,
        });

        // Save the outbound message to history
        if (smsResult.success) {
          await supabaseAdmin.from('planner_messages').insert({
            user_id: user.id,
            role: 'assistant',
            content: message,
          });
        }

        results.push({
          userId: user.id,
          action,
          success: smsResult.success,
          error: smsResult.error,
        });
      } else {
        results.push({
          userId: user.id,
          action: 'no_action_needed',
          success: true,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      processed: users.length,
      results,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

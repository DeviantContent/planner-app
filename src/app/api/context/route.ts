import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { invokeCoachingAgent } from '@/lib/langgraph';
import { sendSms } from '@/lib/surge';

// POST long context that gets processed by the agent
export async function POST(request: NextRequest) {
  try {
    const { phone_number, message } = await request.json();

    if (!phone_number || !message) {
      return NextResponse.json(
        { error: 'phone_number and message are required' },
        { status: 400 }
      );
    }

    // Find user by phone number
    const { data: user, error: userError } = await supabaseAdmin
      .from('planner_users')
      .select('*')
      .eq('phone_number', phone_number)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.is_approved) {
      return NextResponse.json(
        { error: 'User not approved' },
        { status: 403 }
      );
    }

    // Save incoming message
    await supabaseAdmin.from('planner_messages').insert({
      user_id: user.id,
      role: 'user',
      content: message,
    });

    // Get conversation history
    const { data: history } = await supabaseAdmin
      .from('planner_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const conversationHistory = (history || [])
      .reverse()
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // Generate AI response
    const aiResponse = await invokeCoachingAgent(
      user.id,
      message,
      conversationHistory.slice(0, -1),
      user.timezone
    );

    // Save AI response
    await supabaseAdmin.from('planner_messages').insert({
      user_id: user.id,
      role: 'assistant',
      content: aiResponse,
    });

    // Send SMS response
    await sendSms({
      to: phone_number,
      body: aiResponse,
    });

    return NextResponse.json({
      ok: true,
      response: aiResponse,
      message_length: message.length,
    });
  } catch (error) {
    console.error('Context API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

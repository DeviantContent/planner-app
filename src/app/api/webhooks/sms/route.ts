import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { invokeCoachingAgent } from '@/lib/langgraph';
import { sendSms, validateWebhook } from '@/lib/surge';

interface SurgeWebhookPayload {
  id: string;
  type: string;
  data: {
    id: string;
    body: string;
    direction: 'inbound' | 'outbound';
    conversation: {
      id: string;
      contact: {
        id: string;
        phone_number: string;
        first_name?: string;
        last_name?: string;
      };
    };
    created_at: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('surge-signature') || '';

    // Validate webhook signature
    if (!validateWebhook(payload, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhook: SurgeWebhookPayload = JSON.parse(payload);

    // Log full payload for debugging
    console.log('Surge webhook payload:', JSON.stringify(webhook, null, 2));

    // Only process inbound messages (skip if direction is explicitly 'outbound')
    if (webhook.data?.direction === 'outbound') {
      console.log('Skipping outbound message');
      return NextResponse.json({ ok: true });
    }

    const phoneNumber = webhook.data.conversation.contact.phone_number;
    const messageBody = webhook.data.body;
    const contactName = [
      webhook.data.conversation.contact.first_name,
      webhook.data.conversation.contact.last_name,
    ]
      .filter(Boolean)
      .join(' ') || null;

    console.log(`Received SMS from ${phoneNumber}: ${messageBody}`);

    // Get or create user
    let { data: user } = await supabaseAdmin
      .from('planner_users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (!user) {
      // Create user record but don't approve them
      const { data: newUser, error } = await supabaseAdmin
        .from('planner_users')
        .insert({
          phone_number: phoneNumber,
          name: contactName,
          timezone: 'America/Chicago',
          is_approved: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
      user = newUser;
    }

    // Check if user is approved - silently ignore non-approved users
    if (!user.is_approved) {
      console.log(`Unauthorized user attempted access: ${phoneNumber}`);
      return NextResponse.json({ ok: true, unauthorized: true });
    }

    // Save incoming message
    await supabaseAdmin.from('planner_messages').insert({
      user_id: user.id,
      role: 'user',
      content: messageBody,
      surge_message_id: webhook.data.id,
    });

    // Get conversation history (last 20 messages)
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

    // Generate AI response using LangGraph agent
    const aiResponse = await invokeCoachingAgent(
      user.id,
      messageBody,
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
    const smsResult = await sendSms({
      to: phoneNumber,
      body: aiResponse,
    });

    if (!smsResult.success) {
      console.error('Failed to send SMS:', smsResult.error);
    }

    return NextResponse.json({ ok: true, messageId: smsResult.messageId });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
